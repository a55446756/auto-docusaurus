// Wrap the Anthropic SDK so the rest of the code talks to a single function:
// `proposeWikiChanges({ contextText, description, images, issue })` →
// returns the parsed `propose_wiki_changes` tool call payload.
//
// We force structured output via tool_use with `tool_choice: tool` — strict
// schema beats prompt-only "please return JSON" by a large margin.

import Anthropic from '@anthropic-ai/sdk';

// Pinned at the latest Sonnet for cost/speed/vision balance. Override via env
// for experimentation. Verified against docs.claude.com 2026-05.
export const DEFAULT_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

const TOOL_NAME = 'propose_wiki_changes';

const TOOL_DEFINITION = {
  name: TOOL_NAME,
  description:
    'Propose the markdown file creations and updates required to reflect the user-described product change in the wiki. Always return the full final content of each affected file (no diffs). Reference uploaded screenshots by the exact pre-saved paths listed in the user message — do not invent new image paths.',
  input_schema: {
    type: 'object',
    required: ['summary', 'changes', 'pr_title', 'pr_body'],
    properties: {
      summary: {
        type: 'string',
        description: 'One-sentence summary of the change, in English (Australian English spelling).',
      },
      changes: {
        type: 'array',
        description: 'List of file operations. Empty list is valid only if the request truly requires no wiki change.',
        items: {
          type: 'object',
          required: ['action', 'file_path', 'frontmatter', 'content'],
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'update'],
              description: '`create` for a new file, `update` for an existing file.',
            },
            file_path: {
              type: 'string',
              description: 'Repo-relative path under `docs/`, e.g. `docs/opportunity-tracker.md`. Must start with `docs/`.',
            },
            frontmatter: {
              type: 'object',
              description: 'Frontmatter fields. At minimum include `title`. Include `sidebar_position` only when meaningfully ordering.',
              properties: {
                title: { type: 'string' },
                sidebar_position: { type: 'number' },
                slug: { type: 'string' },
              },
              additionalProperties: true,
            },
            content: {
              type: 'string',
              description: 'Complete final markdown file content INCLUDING the frontmatter block (`---` ... `---`). Must be ready to write to disk as-is. Any image references must use the exact pre-saved screenshot paths supplied in the user message — see the AVAILABLE SCREENSHOTS list. Do NOT reference image paths that were not supplied.',
            },
          },
        },
      },
      pr_title: {
        type: 'string',
        description: 'Concise PR title in English. No emojis. No issue body content.',
      },
      pr_body: {
        type: 'string',
        description: 'Markdown PR body. Brief — explain *why* this change matters. Do NOT repeat the file list; the calling code injects it. Use real newlines, not the literal characters `\\n`.',
      },
    },
  },
};

function buildSystemPrompt(contextText) {
  return [
    "You are the editorial assistant for FiOS's product wiki (a Docusaurus knowledge base for FiOS customers and the Eolas internal team).",
    '',
    'Your job: take a PM-supplied description plus screenshots of a product change, and decide which markdown files to create or update so the wiki reflects the change.',
    '',
    'Operating rules:',
    '- Write everything in English. Use Australian English spelling (organised, customisable, behaviour). This applies to wiki content, the PR title, the PR body, and the summary.',
    "- Look at the screenshots carefully. Describe what the user actually sees, not what the PM's prose says — when they conflict, the screenshots win. If the PM wrote in another language, translate the intent into English; do not echo non-English prose into the wiki.",
    '- Match the voice, terminology, and structure defined in the Product context section and demonstrated by the existing wiki pages below. Preserve unrelated sections verbatim when updating an existing page.',
    '- Prefer updating an existing page over creating a new one when the topic already has a home.',
    '- IMAGES: every uploaded screenshot has already been saved to a known path (see the AVAILABLE SCREENSHOTS list in the user message). When you reference an image in markdown, use ONLY one of those exact paths. Do NOT invent paths like `/img/screenshots/feature-x/login.png`. If a screenshot is not relevant, simply do not reference it — do not write a markdown image tag for it.',
    '- If the PM uploaded screenshots that show something not worth documenting (a wrong screenshot, a duplicate, a placeholder), ignore them — do not invent any image references for them.',
    '- Always return the COMPLETE final file content in `content`, including the frontmatter block delimited by `---`. Do not return diffs or partial files.',
    '- Be conservative: minimal, focused changes. Do not refactor unrelated parts of the wiki.',
    '',
    contextText,
  ].join('\n');
}

function buildUserContent({ description, images, issue }) {
  const blocks = [];

  const screenshotList = images.length > 0
    ? images
        .map((img) => `  - Screenshot ${img.index}: \`${img.urlPath}\``)
        .join('\n')
    : '  (none)';

  blocks.push({
    type: 'text',
    text: [
      `Issue #${issue.number}: ${issue.title}`,
      `Submitted by: @${issue.author}`,
      '',
      "PM's description (may be in any language — translate the intent into English when writing wiki content):",
      description || '(empty — rely on the screenshots)',
      '',
      `AVAILABLE SCREENSHOTS (${images.length} uploaded, already saved on disk):`,
      screenshotList,
      '',
      images.length > 0
        ? 'When referencing any of these in markdown, use the exact `/img/...` path shown above. Do not invent other paths. The screenshot images themselves follow in upload order.'
        : 'No screenshots were attached.',
    ].join('\n'),
  });

  for (const img of images) {
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.base64,
      },
    });
  }

  return blocks;
}

export async function proposeWikiChanges({ contextText, description, images, issue, apiKey }) {
  const client = new Anthropic({ apiKey });

  const system = buildSystemPrompt(contextText);
  const userContent = buildUserContent({ description, images, issue });

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 16000,
    system,
    tools: [TOOL_DEFINITION],
    tool_choice: { type: 'tool', name: TOOL_NAME },
    messages: [{ role: 'user', content: userContent }],
  });

  const toolBlock = (response.content || []).find(
    (b) => b.type === 'tool_use' && b.name === TOOL_NAME,
  );
  if (!toolBlock) {
    const raw = JSON.stringify(response.content).slice(0, 2000);
    throw new ClaudeOutputError('Claude did not return a propose_wiki_changes tool call', raw);
  }

  return { result: toolBlock.input, usage: response.usage, stop_reason: response.stop_reason };
}

export class ClaudeOutputError extends Error {
  constructor(message, rawResponse) {
    super(message);
    this.name = 'ClaudeOutputError';
    this.rawResponse = rawResponse;
  }
}
