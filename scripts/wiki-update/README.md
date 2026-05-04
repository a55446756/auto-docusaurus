# AI Wiki Updater

把"PM 在 GitHub 上提一个带截图的 issue"变成"自动开一个改 wiki 的 PR"。

## 端到端工作流

1. PM 在 GitHub 用 [Wiki update issue 模板](../../.github/ISSUE_TEMPLATE/wiki-update.yml) 提交 issue：
   - 在 textarea 里粘贴/拖拽截图（GitHub 会上传到 user-attachments）。
   - 用大白话写一段说明。
   - 选影响哪些 wiki 区域。
2. Issue 被自动打上 `wiki-update` 标签 → workflow 触发。
3. `scripts/wiki-update/index.mjs` 跑：
   1. 拉 issue body，解析出描述、图片 URL、areas
   2. 用 `GITHUB_TOKEN` 鉴权下载所有截图
   3. 读 `docs/` 目录树 + 受影响页面全文 + `_meta/product-context.md`
   4. 调 Claude API（vision + tool_use 强制结构化输出）
   5. 把返回的改动落到 `wiki-update/issue-{n}` 分支，按 create/update/images 分三个 commit
   6. 推分支、开 PR（含 `Closes #n`）
   7. 在原 issue 下评论 PR 链接
4. PM 在 PR 的 Vercel preview 上看效果，满意 → merge；不满意 → 编辑 issue body（或移除并重新加 `wiki-update` 标签），workflow 会再跑一遍并更新同一 PR。

## 文件结构

```
.github/
  ISSUE_TEMPLATE/wiki-update.yml   # PM 用的 issue form
  workflows/wiki-ai-update.yml     # 触发器 + 执行容器
scripts/wiki-update/
  index.mjs                        # 主入口（编排所有步骤）
  issue-parser.mjs                 # 解析 issue body
  wiki-context.mjs                 # 读现有 wiki 喂给 prompt
  claude-client.mjs                # 调 Claude API（含 tool schema）
  pr-creator.mjs                   # git 操作 + Octokit 开 PR
_meta/
  product-context.md               # 产品背景（PM 填）
```

## Secrets

仓库 Settings → Secrets and variables → Actions：

| 名称 | 来源 | 必需 |
|---|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ | ✅ |
| `GITHUB_TOKEN` | Action 自动提供 | 自动，无需配置 |

## 模型 / SDK 版本

- 模型：`claude-sonnet-4-6`（vision + tool_use，速度/成本平衡）。
- SDK：`@anthropic-ai/sdk@^0.92.0`。
- GitHub：`@octokit/rest@^22.0.1`。
- 模型 ID 来自 [docs.claude.com/en/about-claude/models/overview](https://docs.claude.com/en/docs/about-claude/models/overview)（2026-05 验证）。要换模型，改 `claude-client.mjs` 顶部的 `DEFAULT_MODEL` 或设置环境变量 `CLAUDE_MODEL`。

## 怎么改 prompt

所有 prompt 模板都在 `claude-client.mjs`：

- **System prompt**：在 `buildSystemPrompt(contextText)` 里。"角色 + 操作规则 + 注入进来的 wiki 上下文"。改写作风格、加约束、改语言要求都在这里。
- **User content**：在 `buildUserContent({...})` 里。issue 元信息 + PM 描述 + 一张张图片 block。一般不需要改。
- **Tool schema**：`TOOL_DEFINITION`。这是模型必须遵循的输出结构。要加字段（比如 sidebar 重排、删除文件）就改这里——同时要在 `index.mjs` 处理新字段。

`_meta/product-context.md` 是 prompt 之外的旁路注入：每次跑都会把这个文件原样塞进 system prompt。改这里的好处是不用改代码就能改风格。

## 本地手动重跑（调试用）

```bash
npm ci
ANTHROPIC_API_KEY=sk-ant-... \
GITHUB_TOKEN=ghp_... \
ISSUE_NUMBER=42 \
REPO_OWNER=eolas-solutions \
REPO_NAME=auto-docusaurus \
DEFAULT_BRANCH=main \
node scripts/wiki-update/index.mjs
```

注意本地跑会真的：下载图片、写文件、`git checkout` 切到新分支、`git push`、开 PR。要纯试 Claude 调用先把 `pushBranch`/`openPullRequest` 调用注释掉。

## 怎么手动重跑 Action

三种方式：
1. 在 issue 上把 `wiki-update` 标签摘掉再加回去（最简单，触发 `labeled`）。
2. 编辑 issue body（触发 `edited`）。
3. 在 Actions tab 找到这个 workflow，点 "Re-run all jobs"。

每次重跑会更新同一个 `wiki-update/issue-{n}` 分支（force-push），并更新原 PR——不会创建新 PR。

## 安全保护

- Issue body 上限 50KB
- 截图上限 10 张/issue
- 单张图上限 5MB（Anthropic API 限制）
- 文件路径白名单：只允许写 `docs/` 和 `static/img/`，模型返回的其它路径会被拒绝
- PR 标题/描述里的换行会被压平、长度截断，避免 markdown 注入历史

## 常见错误排查

| 现象 | 可能原因 | 怎么办 |
|---|---|---|
| Issue 下没有任何评论，Action 也没跑 | issue 没带 `wiki-update` 标签 | 加标签；workflow 的 `if:` 守门会跳过其它 issue |
| Action 跑了但失败 | API key 错 / quota 满 / 网络问题 | 看 Action 日志；issue 下应该有错误评论指向具体原因 |
| Claude 返回 "did not return tool call" | 模型拒绝了输入（比如内容触发安全规则） | 检查截图内容；可改 system prompt 让说明更清楚 |
| 截图 401 下载失败 | `GITHUB_TOKEN` 没传 / 权限不够 | 确认 workflow 里 `permissions: contents: write` 等都在 |
| PR 开了但是没改任何文件 | 模型判断不需要改（少见） | 在 issue 里追加更具体的描述+截图 |
| PR 开了但截图链接 404 | `image_placements.save_to` 路径和 `content` 里的引用对不上 | 检查模型返回的 `content` 里的图片路径是否以 `/img/...` 开头（Docusaurus 把 `static/` 当根） |

要看完整原始 API 响应，去 Action 日志里搜 `[wiki-update]`——所有关键节点都打了 log（`Calling Claude API…`, `Claude proposed N change(s)`, `Pushed branch`, etc）。

## 已知限制 & 后续可改

- **Areas dropdown 是写死的**：`docs/` 一级结构变了要同步改 `wiki-update.yml`。GitHub Issue Forms 不支持动态选项，所以暂时只能这样。可改进：在 workflow 里加一个独立的 job，定期根据 `docs/` 重新生成 issue 模板提交。
- **没有 comment-based 重跑**：当前只听 `[labeled, edited]`。要支持"在 issue 评论里发 `/redo` 让 AI 重跑"，加一个 `issue_comment` 触发分支、解析 comment body 里的命令。
- **没有人审先于自动开 PR**：模型生成的 markdown 直接落到 PR。如果信任度还不够，可以加一步把改动作为 issue 评论而不是 PR，让人确认后再下手。
- **没有 i18n 切换**：模型自动跟着 PM 的语言走（中/英）。如果想锁定中文，在 system prompt 里加一句硬要求。
