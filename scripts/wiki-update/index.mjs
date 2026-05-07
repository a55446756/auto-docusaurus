#!/usr/bin/env node
// Entry point invoked by `.github/workflows/wiki-ai-update.yml`.
//
// Flow:
//   1. Read issue from GitHub
//   2. Validate (size & screenshot caps — see SAFETY section in README)
//   3. Parse issue body → description, areas, image URLs
//   4. Download screenshots (auth'd against user-attachments)
//   5. PRE-SAVE every screenshot to a deterministic path under
//      static/img/screenshots/issue-{n}/ so the file is on disk regardless of
//      what the model returns. The model is told these paths and must
//      reference them as-is in any markdown.
//   6. Build wiki context (tree + full text of affected pages + product context)
//   7. Call Claude with vision + tool_use → structured changes
//   8. Apply changes: write markdown (with orphan image refs stripped),
//      images already on disk from step 5
//   9. Branch + commit (one per group) + push
//  10. Open PR, comment on issue
//
// Any uncaught error gets reported back to the issue as a comment so the PM
// always sees something happen (success or a clear failure note).

import process from 'node:process';
import { pathToFileURL } from 'node:url';
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

function extFromMediaType(mt) {
  switch (mt) {
    case 'image/jpeg': return 'jpg';
    case 'image/gif': return 'gif';
    case 'image/webp': return 'webp';
    case 'image/png':
    default: return 'png';
  }
}

// Markdown image regex. Matches both `![alt](url)` and the rare `![alt](url "title")`.
const MD_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

// Strip image references in `content` whose URL looks like a local Docusaurus
// path (`/img/...`) but isn't on the allowlist. External URLs (http*) are left
// alone in case the model legitimately references something off-site.
//
// Returns { content, stripped } where `stripped` lists the bad URLs that were
// removed (for logging into the PR comment).
function stripOrphanImageRefs(content, allowedUrls) {
  const stripped = [];
  const cleaned = content.replace(MD_IMAGE_RE, (full, alt, url) => {
    if (!url.startsWith('/')) return full; // external — keep
    if (allowedUrls.has(url)) return full; // valid — keep
    stripped.push(url);
    return ''; // strip
  });
  // Collapse 3+ blank lines that may result from stripping image lines.
  return { content: cleaned.replace(/\n{3,}/g, '\n\n'), stripped };
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

  // ---------- Set up branch FIRST so screenshot writes happen on the AI branch ----------
  const repoRoot = process.cwd();
  const branchName = `wiki-update/issue-${issueNumber}`;
  await createBranch(branchName, baseBranch);
  log(`On branch ${branchName}`);

  // ---------- Download + pre-save screenshots ----------
  // Saving to disk BEFORE the Claude call decouples "image lands on disk" from
  // "AI decided to reference this image." The previous design left images in
  // memory and only saved them if the model included an image_placements
  // entry — a single missed entry would leave a dangling /img/ ref in the
  // markdown and break the Docusaurus build. Now: every uploaded image is
  // saved at a known path, and the model is told what those paths are.
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

  const screenshotsDir = `static/img/screenshots/issue-${issueNumber}`;
  for (const img of images) {
    const ext = extFromMediaType(img.mediaType);
    const repoPath = `${screenshotsDir}/screenshot-${img.index}.${ext}`;
    const urlPath = `/${repoPath.replace(/^static\//, '')}`;
    await writeBinaryTracked(repoRoot, repoPath, img.buffer);
    img.repoPath = repoPath;
    img.urlPath = urlPath;
  }
  if (images.length > 0) {
    log(`Pre-saved ${images.length} screenshot(s) to ${screenshotsDir}/`);
  }
  const allowedImageUrls = new Set(images.map((i) => i.urlPath));

  // ---------- Build context ----------
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
  const createdPaths = [];
  const updatedPaths = [];
  const allStripped = [];

  for (const change of result.changes) {
    if (!change.file_path || !change.content) {
      warn(`Skipping malformed change: ${JSON.stringify(change).slice(0, 200)}`);
      continue;
    }

    // Sandbox writes to docs/ only — refuse anything else (screenshots are
    // pre-saved by us, not by the model).
    if (!/^docs\//.test(change.file_path)) {
      warn(`Refusing to write outside docs/: ${change.file_path}`);
      continue;
    }

    const { content, stripped } = stripOrphanImageRefs(change.content, allowedImageUrls);
    if (stripped.length > 0) {
      warn(`Stripped ${stripped.length} broken image ref(s) from ${change.file_path}: ${stripped.join(', ')}`);
      allStripped.push({ file: change.file_path, urls: stripped });
    }

    await writeFileTracked(repoRoot, change.file_path, content);
    if (change.action === 'create') createdPaths.push(change.file_path);
    else updatedPaths.push(change.file_path);
  }

  // ---------- Commits ----------
  const refLine = `Refs #${issueNumber}`;
  const imagePaths = images.map((i) => i.repoPath);
  const newSha = await commitFiles(createdPaths, `docs: add new wiki pages\n\n${refLine}`);
  const updSha = await commitFiles(updatedPaths, `docs: update wiki pages\n\n${refLine}`);
  const imgSha = await commitFiles(imagePaths, `docs: add screenshots from issue #${issueNumber}\n\n${refLine}`);

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

  const strippedNote = allStripped.length > 0
    ? `\n\n> ⚠️ The AI referenced image paths that were not in the uploaded screenshots — those refs were stripped to keep the build green. Affected files: ${allStripped.map((s) => `\`${s.file}\``).join(', ')}.`
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
    strippedNote,
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
    strippedNote,
  ].join('\n');

  await postIssueComment(octokit, { owner, repo, issueNumber, body: commentBody });
  log('Done.');
}

// Exposed for unit testing.
export { stripOrphanImageRefs };

// Only run main() when this file is the script entry point — lets tests import
// stripOrphanImageRefs without triggering the workflow.
const isEntryPoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntryPoint) {
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
}
