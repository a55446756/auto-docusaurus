// Parse a GitHub Issue Form submission into structured fields.
//
// The issue body produced by `.github/ISSUE_TEMPLATE/wiki-update.yml` looks like:
//
//   ### What's changing in this update?
//
//   <description text, possibly with markdown image references>
//
//   ### Which wiki areas does this affect?
//
//   opportunity-tracker, talent-wall
//
// We extract: description text (with image refs preserved for the LLM but
// the URLs separately collected for download), and the list of areas.

const SECTION_HEADERS = {
  description: "What's changing in this update?",
  areas: 'Which wiki areas does this affect?',
};

// Pull a labelled section out of the issue body. Returns trimmed text or null.
function extractSection(body, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`###\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n###\\s|$)`, 'i');
  const match = body.match(re);
  return match ? match[1].trim() : null;
}

// GitHub user-attachments URLs look like:
//   https://github.com/user-attachments/assets/<uuid>
// They can also appear as:
//   https://user-images.githubusercontent.com/<id>/<file>
// Either inside markdown image syntax `![alt](url)` or as raw URLs.
const ATTACHMENT_RE = /https:\/\/(?:github\.com\/user-attachments\/assets\/[\w-]+|user-images\.githubusercontent\.com\/[\w./-]+)/g;

function extractImageUrls(text) {
  if (!text) return [];
  const urls = text.match(ATTACHMENT_RE) || [];
  // Dedupe while preserving order — the LLM cares about ordering since
  // `source_index` in tool_use refers to position in the image list.
  const seen = new Set();
  const out = [];
  for (const url of urls) {
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

// Strip markdown image references but keep the surrounding prose intact, so
// the LLM gets a clean description without redundant URL noise.
function stripImageMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/^\s*<img\b[^>]*>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parse the area dropdown value. GitHub Issue Forms render multi-select
// dropdowns as a comma-separated list, but some clients render bullets.
// Handle both, plus the literal "_No response_" sentinel.
function parseAreas(text) {
  if (!text || /^_no response_$/i.test(text.trim())) return [];
  return text
    .split(/[\n,]+/)
    .map((s) => s.replace(/^[-*\s]+/, '').trim())
    .filter(Boolean);
}

export function parseIssueBody(body) {
  const safeBody = body || '';
  const descriptionRaw = extractSection(safeBody, SECTION_HEADERS.description) || '';
  const areasRaw = extractSection(safeBody, SECTION_HEADERS.areas) || '';

  const imageUrls = extractImageUrls(descriptionRaw);
  const description = stripImageMarkdown(descriptionRaw);
  const areas = parseAreas(areasRaw);

  return { description, areas, imageUrls };
}
