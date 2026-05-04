// Read existing wiki content so the model can keep voice/structure consistent.
//
// We pass two things to the model:
//   1. A tree of all .md files with their frontmatter title — gives a map of
//      what exists, so the model doesn't invent duplicate pages.
//   2. The full text of pages in the areas the PM said the update affects —
//      the model needs to know what to preserve when rewriting.

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DOCS_DIR = 'docs';

async function walkMarkdown(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMarkdown(full)));
    } else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// Cheap frontmatter reader — enough to grab title/sidebar_position.
// Avoids pulling in gray-matter for one field.
function readFrontmatter(content) {
  if (!content.startsWith('---')) return {};
  const end = content.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = content.slice(3, end);
  const fm = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.*?)\s*$/);
    if (!m) continue;
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    fm[m[1]] = value;
  }
  return fm;
}

// Docusaurus uses the first H1 as the page title when frontmatter has no
// `title` field, so do the same here for the tree summary.
function firstH1(content) {
  const m = content.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

export async function buildWikiContext(areas, repoRoot = process.cwd()) {
  const docsDir = path.join(repoRoot, DOCS_DIR);
  const files = await walkMarkdown(docsDir);

  const tree = [];
  const fullPagesByPath = new Map();

  for (const file of files) {
    const rel = path.relative(repoRoot, file);
    const content = await readFile(file, 'utf8');
    const fm = readFrontmatter(content);
    const slug = path.basename(file).replace(/\.mdx?$/, '');
    const title = fm.title || firstH1(content) || slug;
    tree.push({ path: rel, slug, title, sidebar_position: fm.sidebar_position });

    // If the slug matches an affected area, include the full page.
    if (areas.includes(slug)) {
      fullPagesByPath.set(rel, content);
    }
  }

  // Stable sort: by sidebar_position when present, else by path.
  tree.sort((a, b) => {
    const ap = a.sidebar_position ? Number(a.sidebar_position) : Infinity;
    const bp = b.sidebar_position ? Number(b.sidebar_position) : Infinity;
    if (ap !== bp) return ap - bp;
    return a.path.localeCompare(b.path);
  });

  return { tree, fullPages: fullPagesByPath };
}

export async function readProductContext(repoRoot = process.cwd()) {
  const file = path.join(repoRoot, '_meta', 'product-context.md');
  try {
    const content = await readFile(file, 'utf8');
    return content.trim() || null;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

// Format the context as a single string that goes into the system prompt.
export function formatContextForPrompt({ tree, fullPages, productContext }) {
  const lines = [];

  if (productContext) {
    lines.push('## Product context');
    lines.push(productContext);
    lines.push('');
  }

  lines.push('## Existing wiki structure');
  lines.push('Each entry is `path — title`. Treat this as the source of truth for what exists.');
  lines.push('');
  for (const node of tree) {
    lines.push(`- ${node.path} — ${node.title}`);
  }
  lines.push('');

  if (fullPages.size > 0) {
    lines.push('## Full content of affected pages');
    lines.push('When updating these pages, preserve unrelated sections verbatim. Only change what the screenshots and description require.');
    lines.push('');
    for (const [rel, content] of fullPages) {
      lines.push(`### \`${rel}\``);
      lines.push('```markdown');
      lines.push(content);
      lines.push('```');
      lines.push('');
    }
  }

  return lines.join('\n');
}
