# Agent 协作约定

本仓库采用“脚本生成结构事实 + agent 维护语义信息”的索引维护模式，适用于 Codex / Claude Code 等智能体。

## 首读顺序

1. 开始任务先阅读 `docs/index.md`。
2. 根据索引定位目标文件，再进行实现或分析。

## 维护原则

1. 修改完成后，必须同步更新与本次任务相关的索引内容。
2. `docs/index.md` 分为手动区和自动区：
   - 手动区：允许 agent 增量维护职责、调用链、注意事项。
   - 自动区：仅允许脚本覆盖，不应手改。

## 触发条件

1. 出现以下结构变更时，必须执行全量生成：
   - 新增文件
   - 删除文件
   - 重命名文件
   - 目录迁移
   - 工作流或关键配置入口变更
2. 仅修改文件内部逻辑时，可只更新手动区的必要语义信息。

## 命令规范

1. 全量生成索引：`pnpm run docs:index:generate`
2. 过期检查：`pnpm run docs:index:check`
3. 单元测试：`pnpm run test:unit`
4. 类型检查：`pnpm run type-check`

提交前应至少执行一次 `pnpm run docs:index:check`，若失败先修复再结束任务。

## 测试约定

1. 默认要求：**只要改代码，就要补测试或更新现有测试**。
   - 不接受“先改完再靠手动点一遍”的交付方式。
   - 如果当前改动确实无法补自动测试，必须在最终说明里明确写出原因、风险和未覆盖范围。
2. 当前仓库已有可执行单元测试入口：`pnpm run test:unit`。
3. 修改 `src/api/hoyo/*`、`tests/api/hoyo/*`、鉴权契约、Cookie/Header 生成逻辑时：
   - 至少运行 `pnpm run test:unit`
   - 至少运行 `pnpm run type-check`
4. 若本次改动包含新增/删除/重命名文件，再顺序执行：
   - `pnpm run docs:index:generate`
   - `pnpm run docs:index:check`
5. 不要并行执行 `docs:index:generate` 和 `docs:index:check`。
   - 这个仓库里会出现先 `generate`、后 `check` 才稳定通过的情况。

## 语言与边界

1. 本仓库默认中文输出（代码、命令、日志除外）。
2. 索引体系仅使用 `docs/index.md`。
3. 不依赖 `.kiro` 文档体系，不写入 `.kiro` 索引。
