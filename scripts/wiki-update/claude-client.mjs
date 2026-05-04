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
    'Propose the markdown file creations and updates required to reflect the user-described product change in the wiki. Always return the full final content of each affected file (no diffs). For new screenshots, specify which uploaded image (by source_index) should be saved where in static/img/.',
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
              description: 'Repo-relative path, e.g. `docs/opportunity-tracker.md`.',
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
              description: 'Complete final markdown file content INCLUDING the frontmatter block (`---` ... `---`). Must be ready to write to disk as-is.',
            },
            image_placements: {
              type: 'array',
              description: 'Optional. Maps uploaded screenshots to image paths referenced in `content`. Each placement saves the source image to the given path; the `content` field must reference that same path.',
              items: {
                type: 'object',
                required: ['source_index', 'save_to', 'alt'],
                properties: {
                  source_index: {
                    type: 'integer',
                    minimum: 0,
                    description: 'Index into the uploaded images list (0-based, in upload order).',
                  },
                  save_to: {
                    type: 'string',
                    description: 'Repo-relative path under `static/img/`, e.g. `static/img/screenshots/feature-x/login.png`. Use kebab-case names.',
                  },
                  alt: {
                    type: 'string',
                    description: 'Alt text for accessibility, in English.',
                  },
                },
              },
            },
          },
        },
      },
      pr_title: {
        type: 'string',
        description: 'Concise PR title. No emojis. No issue body content.',
      },
      pr_body: {
        type: 'string',
        description: 'Markdown PR body. Brief — what changed and why. Reviewers will check the rendered Vercel preview.',
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
    '- For screenshots, pick descriptive kebab-case filenames under `static/img/screenshots/<feature-or-page>/<name>.png`. The `content` field must reference the saved path with a relative URL like `/img/screenshots/...` (Docusaurus serves `static/` at root).',
    '- Always return the COMPLETE final file content in `content`, including the frontmatter block delimited by `---`. Do not return diffs or partial files.',
    "- For `pr_body`, write a short markdown summary of *why* this change matters. Do NOT repeat the file list — the calling code injects that. Use real newlines, not the literal characters `\\n`.",
    '- Be conservative: minimal, focused changes. Do not refactor unrelated parts of the wiki.',
    '',
    contextText,
  ].join('\n');
}

function buildUserContent({ description, images, issue }) {
  const blocks = [];

  blocks.push({
    type: 'text',
    text: [
      `Issue #${issue.number}: ${issue.title}`,
      `Submitted by: @${issue.author}`,
      '',
      "PM's description (may be in any language — translate the intent into English when writing wiki content):",
      description || '(empty — rely on the screenshots)',
      '',
      images.length > 0
        ? `${images.length} screenshot(s) follow, in upload order. Use 0-based indices when referencing them in image_placements.`
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
