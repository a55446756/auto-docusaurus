# AI Wiki Updater

Turns "a PM filed a GitHub issue with screenshots" into "a PR that updates the wiki." The wiki output is in English (Australian spelling); see `_meta/product-context.md` for voice/terminology rules.

## End-to-end flow

1. PM opens a GitHub issue using the [Wiki update issue template](../../.github/ISSUE_TEMPLATE/wiki-update.yml):
   - Pastes/drags screenshots into the textarea (GitHub uploads them to user-attachments).
   - Writes a few sentences describing the change.
   - Picks which wiki area(s) it affects.
2. The form auto-applies the `wiki-update` label, which fires the workflow.
3. `scripts/wiki-update/index.mjs` runs:
   1. Pulls the issue body, parses out description, area list, image URLs.
   2. Downloads each screenshot using `GITHUB_TOKEN` (user-attachments require auth).
   3. Reads `docs/` tree + full text of affected pages + `_meta/product-context.md`.
   4. Calls Claude (vision + `tool_use` for strict structured output).
   5. Writes the proposed changes to a `wiki-update/issue-{n}` branch in three semantic commits (creates / updates / images).
   6. Pushes the branch and opens a PR (with `Closes #n`).
   7. Posts a comment on the original issue linking the PR.
4. PM reviews the rendered output in the Vercel preview attached to the PR. If happy → merge. If not → edit the issue (or remove and re-add the `wiki-update` label) and the workflow re-runs, updating the same PR in place.

## File layout

```
.github/
  ISSUE_TEMPLATE/wiki-update.yml   # Issue form for PMs
  workflows/wiki-ai-update.yml     # Trigger + execution container
scripts/wiki-update/
  index.mjs                        # Main entry — orchestrates everything
  issue-parser.mjs                 # Pulls fields out of the issue body
  wiki-context.mjs                 # Reads existing wiki to feed the prompt
  claude-client.mjs                # Anthropic SDK wrapper + tool schema
  pr-creator.mjs                   # git ops + Octokit PR creation
_meta/
  product-context.md               # Product voice/terminology guide (hand-edited)
```

## Secrets

Repo Settings → Secrets and variables → Actions:

| Name | Source | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ | Yes |
| `GITHUB_TOKEN` | Provided by Actions automatically | Auto |

You also need to enable two repo-level switches under **Settings → Actions → General**:

- **Workflow permissions:** "Read and write permissions"
- **Allow GitHub Actions to create and approve pull requests:** ticked

## Model / SDK versions

- Model: `claude-sonnet-4-6` (vision + tool_use, fast, good cost/quality balance).
- SDK: `@anthropic-ai/sdk@^0.92.0`.
- GitHub: `@octokit/rest@^22.0.1`.
- Model ID verified against [docs.claude.com/en/about-claude/models/overview](https://docs.claude.com/en/docs/about-claude/models/overview) (May 2026). To swap models, edit `DEFAULT_MODEL` at the top of `claude-client.mjs` or set the `CLAUDE_MODEL` env var on the workflow.

## How to tweak the prompts

All prompt templates live in `claude-client.mjs`:

- **System prompt** — `buildSystemPrompt(contextText)`. Role + operating rules + the wiki context that gets injected on every run. Edit here to change voice rules, add hard constraints, change required output format, etc.
- **User content** — `buildUserContent({...})`. Issue metadata + PM description + image blocks. Rarely needs changing.
- **Tool schema** — `TOOL_DEFINITION`. The structure the model is forced to fill in. Add a field (e.g. sidebar reorder, file deletion) here, then handle it in `index.mjs`.

`_meta/product-context.md` is a separate injection point: the file's contents are dropped into the system prompt verbatim every run. Editing it changes the model's voice and terminology without touching code.

## Manual rerun (debugging locally)

```bash
npm ci
ANTHROPIC_API_KEY=sk-ant-... \
GITHUB_TOKEN=ghp_... \
ISSUE_NUMBER=42 \
REPO_OWNER=a55446756 \
REPO_NAME=auto-docusaurus \
DEFAULT_BRANCH=main \
node scripts/wiki-update/index.mjs
```

Note: a local run will actually download images, write files, `git checkout` a new branch, `git push`, and open a PR. To test only the Claude call, comment out the `pushBranch` / `openPullRequest` calls near the bottom of `index.mjs`.

## How to manually rerun the Action

Three options:
1. Remove the `wiki-update` label from the issue and add it back (simplest — fires `labeled`).
2. Edit the issue body (fires `edited`).
3. In the Actions tab find the workflow run and click "Re-run all jobs."

Each rerun force-pushes the same `wiki-update/issue-{n}` branch and updates the existing PR — it doesn't create new ones.

## Safety guards

- Issue body capped at 50 KB.
- At most 10 screenshots per issue.
- Each image capped at 5 MB (Anthropic API limit).
- File-write whitelist: only `docs/` and `static/img/` paths are written. Anything else returned by the model is rejected.
- PR title and body have newlines flattened and length capped to prevent markdown injection into commit history.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No comment on the issue, no Action run | Issue lacks the `wiki-update` label, or the label doesn't exist on the repo yet | Create the label under Issues → Labels; the form silently skips labels that don't exist |
| Action ran but failed | Bad API key / quota / network | Check the Action logs; the issue should also have an error comment pointing at the cause |
| `did not return tool call` error | Model declined the input (rare — usually safety-related) | Check the screenshot content; tighten the system prompt |
| Image 401 on download | `GITHUB_TOKEN` missing or under-permissioned | Confirm `permissions: contents: write, pull-requests: write, issues: write` are set in the workflow |
| `GitHub Actions is not permitted to create or approve pull requests` | Repo setting is off | Settings → Actions → General → tick "Allow GitHub Actions to create and approve pull requests" |
| PR opened but no files changed | Model decided no edit was needed (rare) | Add more detail or different screenshots to the issue |
| PR opened but image links 404 | `image_placements.save_to` doesn't match the path used in `content` | Check the model's `content` references `/img/...` paths (Docusaurus serves `static/` at root) |

For full raw API responses, search Action logs for `[wiki-update]` — every key step is logged (`Calling Claude API…`, `Claude proposed N change(s)`, `Pushed branch`, etc.).

## Known limits & possible follow-ups

- **Areas dropdown is hardcoded.** If the `docs/` top-level structure changes, update `wiki-update.yml` to match. GitHub Issue Forms don't support dynamic options. Could be improved by a separate scheduled workflow that regenerates the form from `docs/`.
- **No comment-based rerun.** Currently only `[labeled, edited]` triggers. To support "comment `/redo` on the issue to rerun," add an `issue_comment` trigger and parse the comment body for the command.
- **No human review before opening a PR.** Generated markdown lands directly on a PR branch. If trust is still low, a step could post the proposal as an issue comment first and wait for an approval before committing.
- **Single-language output.** The model is locked to English. If multi-language wikis are needed later, expose a target-language field on the issue form and pass it into the system prompt.
