#!/usr/bin/env node
// Entry point invoked by `.github/workflows/wiki-ai-update.yml`.
//
// Flow:
//   1. Read issue from GitHub
//   2. Validate (size & screenshot caps — see SAFETY section in README)
//   3. Parse issue body → description, areas, image URLs
//   4. Download screenshots (auth'd against user-attachments)
//   5. Build wiki context (tree + full text of affected pages + product context)
//   6. Call Claude with vision + tool_use → structured changes
//   7. Apply changes: write markdown, save images to static/img/
//   8. Branch + commit (one per group) + push
//   9. Open PR, comment on issue
//
// Any uncaught error gets reported back to the issue as a comment so the PM
// always sees something happen (success or a clear failure note).

import process from 'node:process';
import { Octokit } from '@octokit/rest';
import { parseIssueBody } from './issue-parser.mjs';
import {
  buildWikiContext,
  formatContextForPrompt,
  readProductContext,
} from './wiki-context.mjs';
import { proposeWikiChanges, ClaudeOutputError } from './claude-client.mjs';
import {
  createBranch,
  writeFileTracked,
  writeBinaryTracked,
  commitFiles,
  pushBranch,
  openPullRequest,
} from './pr-creator.mjs';

const MAX_BODY_BYTES = 50 * 1024;
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // Anthropic per-image limit

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function log(...args) {
  console.log('[wiki-update]', ...args);
}

function warn(...args) {
  console.warn('[wiki-update][WARN]', ...args);
}

async function downloadScreenshot(url, githubToken) {
  // user-attachments URLs require auth; the public-looking 302 redirects to a
  // signed URL only when the Authorization header is present.
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${githubToken}` },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes (got ${buffer.length})`);
  }
  let mediaType = (res.headers.get('content-type') || 'image/png').split(';')[0].trim();
  // Anthropic accepts image/png, image/jpeg, image/gif, image/webp.
  if (!/^image\/(png|jpe?g|gif|webp)$/i.test(mediaType)) {
    // Fall back to PNG; many user-uploaded screenshots come back as octet-stream.
    mediaType = 'image/png';
  }
  return { buffer, mediaType, base64: buffer.toString('base64') };
}

async function postIssueComment(octokit, { owner, repo, issueNumber, body }) {
  await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body });
}

function truncate(s, max) {
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max)}\n…(truncated)` : s;
}

async function main() {
  const anthropicKey = requireEnv('ANTHROPIC_API_KEY');
  const githubToken = requireEnv('GITHUB_TOKEN');
  const issueNumber = Number(requireEnv('ISSUE_NUMBER'));
  const owner = requireEnv('REPO_OWNER');
  const repo = requireEnv('REPO_NAME');
  const baseBranch = process.env.DEFAULT_BRANCH || 'main';

  const octokit = new Octokit({ auth: githubToken });

  log(`Starting issue #${issueNumber} in ${owner}/${repo} (base=${baseBranch})`);

  let issue;
  try {
    const res = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
    issue = res.data;
  } catch (err) {
    console.error('Failed to fetch issue', err);
    throw err;
  }

  const issueMeta = {
    number: issueNumber,
    title: issue.title || '(no title)',
    author: issue.user?.login || 'unknown',
  };

  // ---------- Safety gates ----------
  const bodyBytes = Buffer.byteLength(issue.body || '', 'utf8');
  if (bodyBytes > MAX_BODY_BYTES) {
    const msg = `Issue body too large (${bodyBytes} bytes > ${MAX_BODY_BYTES}). Please trim the description and try again.`;
    warn(msg);
    await postIssueComment(octokit, { owner, repo, issueNumber, body: `⚠️ Wiki AI update skipped: ${msg}` });
    return;
  }

  // ---------- Parse ----------
  const { description, areas, imageUrls } = parseIssueBody(issue.body || '');
  log(`Parsed: areas=[${areas.join(', ')}], images=${imageUrls.length}, descLen=${description.length}`);

  if (imageUrls.length > MAX_IMAGES) {
    const msg = `Too many screenshots (${imageUrls.length} > ${MAX_IMAGES}). Trim to the most important ones.`;
    warn(msg);
    await postIssueComment(octokit, { owner, repo, issueNumber, body: `⚠️ Wiki AI update skipped: ${msg}` });
    return;
  }

  // ---------- Download screenshots ----------
  const images = [];
  const downloadFailures = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      log(`Downloading image ${i + 1}/${imageUrls.length}: ${url}`);
      const img = await downloadScreenshot(url, githubToken);
      images.push({ ...img, sourceUrl: url, index: images.length });
    } catch (err) {
      warn(`Image download failed (skipping): ${url} — ${err.message}`);
      downloadFailures.push({ url, error: err.message });
    }
  }

  // ---------- Build context ----------
  const repoRoot = process.cwd();
  const productContext = await readProductContext(repoRoot);
  const { tree, fullPages } = await buildWikiContext(areas, repoRoot);
  const contextText = formatContextForPrompt({ tree, fullPages, productContext });
  log(`Context: ${tree.length} files in tree, ${fullPages.size} full pages, productContext=${productContext ? 'yes' : 'no'}`);

  // ---------- Call Claude ----------
  log('Calling Claude API…');
  let proposal;
  try {
    proposal = await proposeWikiChanges({
      contextText,
      description,
      images,
      issue: issueMeta,
      apiKey: anthropicKey,
    });
  } catch (err) {
    const detail = err instanceof ClaudeOutputError && err.rawResponse
      ? `\n\n<details><summary>Raw response (truncated)</summary>\n\n\`\`\`\n${truncate(err.rawResponse, 2000)}\n\`\`\`\n\n</details>`
      : '';
    const body = `❌ Wiki AI update failed during the Claude API call.\n\n**Error:** \`${err.message}\`${detail}\n\nCheck the [workflow run](https://github.com/${owner}/${repo}/actions) for full logs.`;
    await postIssueComment(octokit, { owner, repo, issueNumber, body });
    throw err;
  }

  const { result } = proposal;
  log(`Claude proposed ${result.changes?.length ?? 0} change(s). Usage: ${JSON.stringify(proposal.usage)}`);

  if (!Array.isArray(result.changes) || result.changes.length === 0) {
    const body = `🤔 The AI didn't propose any wiki changes for this update.\n\n**Summary:** ${result.summary || '(none)'}\n\nIf this is wrong, edit the issue with more detail or different screenshots and the workflow will re-run.`;
    await postIssueComment(octokit, { owner, repo, issueNumber, body });
    return;
  }

  // ---------- Apply changes ----------
  const branchName = `wiki-update/issue-${issueNumber}`;
  await createBranch(branchName, baseBranch);
  log(`On branch ${branchName}`);

  const createdPaths = [];
  const updatedPaths = [];
  const imagePaths = [];

  for (const change of result.changes) {
    if (!change.file_path || !change.content) {
      warn(`Skipping malformed change: ${JSON.stringify(change).slice(0, 200)}`);
      continue;
    }

    // Sandbox writes to docs/ and static/img/ only — refuse anything else.
    if (!/^(docs\/|static\/img\/)/.test(change.file_path)) {
      warn(`Refusing to write outside docs/ or static/img/: ${change.file_path}`);
      continue;
    }

    await writeFileTracked(repoRoot, change.file_path, change.content);
    if (change.action === 'create') createdPaths.push(change.file_path);
    else updatedPaths.push(change.file_path);

    for (const placement of change.image_placements || []) {
      const img = images[placement.source_index];
      if (!img) {
        warn(`Image placement references missing source_index=${placement.source_index}`);
        continue;
      }
      if (!placement.save_to?.startsWith('static/img/')) {
        warn(`Refusing to save image outside static/img/: ${placement.save_to}`);
        continue;
      }
      await writeBinaryTracked(repoRoot, placement.save_to, img.buffer);
      imagePaths.push(placement.save_to);
    }
  }

  // ---------- Commits ----------
  const refLine = `Refs #${issueNumber}`;
  const newSha = await commitFiles(createdPaths, `docs: add new wiki pages\n\n${refLine}`);
  const updSha = await commitFiles(updatedPaths, `docs: update wiki pages\n\n${refLine}`);
  const imgSha = await commitFiles(imagePaths, `docs: add screenshots\n\n${refLine}`);

  if (!newSha && !updSha && !imgSha) {
    const body = `🤔 AI proposed changes but none were committable (all paths were rejected by the sandbox or duplicates of existing content). Check the workflow logs.`;
    await postIssueComment(octokit, { owner, repo, issueNumber, body });
    return;
  }

  // ---------- Push & PR ----------
  await pushBranch(branchName);
  log(`Pushed ${branchName}`);

  // Sanitize Claude's pr_title/body — never trust generated text in an immutable
  // history field. Strip leading prefix injection and pass through length cap.
  const safeTitle = (result.pr_title || `Wiki update for issue #${issueNumber}`)
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 120);

  const fileList = [
    ...createdPaths.map((p) => `- 🆕 \`${p}\``),
    ...updatedPaths.map((p) => `- ✏️ \`${p}\``),
    ...imagePaths.map((p) => `- 🖼️ \`${p}\``),
  ].join('\n');

  const failureNote = downloadFailures.length > 0
    ? `\n\n> ⚠️ ${downloadFailures.length} screenshot(s) could not be downloaded and were skipped.`
    : '';

  const prBody = [
    `## Summary`,
    result.summary || '(no summary)',
    '',
    `## Changes`,
    fileList || '_(none)_',
    '',
    result.pr_body || '',
    '',
    `Please review the rendered output in the **Vercel preview** linked below before merging.`,
    failureNote,
    '',
    `Closes #${issueNumber}`,
  ].join('\n');

  const pr = await openPullRequest(octokit, {
    owner,
    repo,
    head: branchName,
    base: baseBranch,
    title: safeTitle,
    body: prBody,
  });
  log(`${pr.reused ? 'Updated existing' : 'Opened new'} PR #${pr.number}: ${pr.url}`);

  const commentBody = [
    pr.reused
      ? `🔄 Updated [PR #${pr.number}](${pr.url}) with the latest AI proposal.`
      : `✅ Opened [PR #${pr.number}](${pr.url}) with the proposed wiki changes.`,
    '',
    `**Summary:** ${result.summary || '(none)'}`,
    '',
    `Check the Vercel preview on the PR to see how the wiki will render. Merge if it looks good. If not, edit this issue (or remove and re-add the \`wiki-update\` label) and the AI will re-run.`,
    failureNote,
  ].join('\n');

  await postIssueComment(octokit, { owner, repo, issueNumber, body: commentBody });
  log('Done.');
}

main().catch(async (err) => {
  console.error(err);
  // Best-effort: post a failure comment if we have enough env to do so.
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.REPO_OWNER;
    const repo = process.env.REPO_NAME;
    const issueNumber = Number(process.env.ISSUE_NUMBER);
    if (token && owner && repo && issueNumber) {
      const octokit = new Octokit({ auth: token });
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: `❌ Wiki AI update failed.\n\n**Error:** \`${(err.message || String(err)).slice(0, 500)}\`\n\nSee the [workflow run](https://github.com/${owner}/${repo}/actions) for full logs.`,
      });
    }
  } catch (commentErr) {
    console.error('Also failed to post failure comment:', commentErr);
  }
  process.exit(1);
});
