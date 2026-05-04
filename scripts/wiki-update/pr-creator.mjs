// Branch + commit + push + open PR.
//
// We shell out to `git` because the workflow already has the repo checked out
// with a working tree — using libgit2/octokit's contents API would just be a
// roundabout reimplementation.
//
// Commit strategy: one commit per logical group (creates / updates / images),
// so reviewers can read the diff in chunks instead of one giant blob.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const exec = promisify(execFile);

async function git(args, opts = {}) {
  const { stdout } = await exec('git', args, { maxBuffer: 32 * 1024 * 1024, ...opts });
  return stdout.trim();
}

export async function createBranch(branchName, baseBranch) {
  // Create from the current HEAD (which checkout@v4 set to the PR/issue trigger SHA).
  // Fall back to baseBranch if needed.
  try {
    await git(['checkout', '-b', branchName]);
  } catch {
    // Branch may already exist locally from a previous run within this job.
    await git(['checkout', branchName]);
  }
  return branchName;
}

export async function writeFileTracked(repoRoot, relPath, content) {
  const abs = path.join(repoRoot, relPath);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, content);
  return relPath;
}

export async function writeBinaryTracked(repoRoot, relPath, buffer) {
  const abs = path.join(repoRoot, relPath);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return relPath;
}

export async function commitFiles(paths, message) {
  if (paths.length === 0) return null;
  await git(['add', '--', ...paths]);

  // Skip empty commits — `git diff --cached --quiet` exits 1 if there are
  // staged changes, 0 if clean.
  try {
    await git(['diff', '--cached', '--quiet']);
    return null; // nothing staged
  } catch {
    // staged changes present, continue
  }

  await git(['commit', '-m', message]);
  return git(['rev-parse', 'HEAD']);
}

export async function pushBranch(branchName) {
  // Force-with-lease so a re-run on the same issue overwrites the previous AI
  // attempt without clobbering anything else.
  const delays = [0, 2000, 4000, 8000, 16000];
  let lastError;
  for (const delay of delays) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      await git(['push', '--force-with-lease', '-u', 'origin', branchName]);
      return;
    } catch (err) {
      lastError = err;
      const msg = String(err.stderr || err.message || '');
      if (!/network|connection|timed out|could not resolve/i.test(msg)) {
        throw err;
      }
    }
  }
  throw lastError;
}

export async function openPullRequest(octokit, { owner, repo, head, base, title, body }) {
  // If a PR already exists for this branch (re-run case), update it instead.
  const existing = await octokit.pulls.list({
    owner,
    repo,
    head: `${owner}:${head}`,
    state: 'open',
    per_page: 1,
  });

  if (existing.data.length > 0) {
    const pr = existing.data[0];
    await octokit.pulls.update({
      owner,
      repo,
      pull_number: pr.number,
      title,
      body,
    });
    return { url: pr.html_url, number: pr.number, reused: true };
  }

  const created = await octokit.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body,
  });
  return { url: created.data.html_url, number: created.data.number, reused: false };
}
