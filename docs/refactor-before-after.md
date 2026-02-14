# zzz-seelie-sync 重构前后改动说明（Before / After）

> 统计基线：`ed9c93f`（`chore: bump version to 1.2.3`）  
> 截止范围：包含 `R0 ~ R5` 任务与 2026-02-14 的冗余/死代码清理

## 1. 目标与判定标准

- 目标：在不改变对外功能的前提下，降低复杂度、重复度和维护成本。
- 判定标准：
- `YAGNI`：删除不可达路径与“先为未来而写”的无效抽象。
- `KISS`：缩短主流程链路，减少嵌套和心智负担。
- `SOLID`：按职责拆分模块，收窄耦合边界。
- `DRY`：收敛重复模板逻辑，避免多点维护。

## 2. 变更总览（量化）

- `src` 目录改动统计：`25 files changed, 1556 insertions(+), 1430 deletions(-)`
- 文件类型变化（`src`）：
- 新增：`15`
- 修改：`9`
- 删除：`1`
- 全量（含文档）统计：`27 files changed, 2173 insertions(+), 1649 deletions(-)`

## 3. 核心模块前后对比

| 维度 | 重构前 | 重构后 | 对应原则 |
|---|---|---|---|
| `SeeliePanel` | 单文件承载视图拼装、状态、动作与错误映射，体量大 | 拆为 `SeeliePanel + 6` 个细分模块（错误视图、同步视图、选项配置、用户信息映射等） | SOLID/KISS/DRY |
| `SyncService` | 同步流程 + 映射细节 + 多段重复模板 | mapper 下沉到 `services/mappers/*`，流程层聚焦编排，失败处理模板统一 | SOLID/DRY/KISS |
| `api/hoyo/client.ts` | auth/request/device/payload 混杂在同文件 | 拆分为 `authService/config/deviceService/devicePayload/deviceUtils/errors`，`client` 聚焦请求编排 | SOLID/KISS |
| DEV 调试挂载 | 多文件重复 `if DEV + window cast` 样板 | 统一到 `utils/devGlobals.ts` | DRY/KISS |
| 死代码处理 | 存在不可达工具模块 | 删除 `src/utils/vnodeTraverser.ts`，并同步文档结构 | YAGNI |

## 4. 关键文件体量变化（示例）

- `src/components/SeeliePanel.ts`: `540 -> 376` 行
- `src/services/SyncService.ts`: `390 -> 297` 行
- `src/api/hoyo/client.ts`: `411 -> 112` 行

说明：体量下降本身不是目标，重点是职责边界清晰后，后续改动的影响范围更小、回归面更可控。

## 5. 本轮（R5）“冗余/死代码”清理明细

### 5.1 删除不可达模块

- 删除文件：`src/utils/vnodeTraverser.ts`
- 判定依据：从 `src/main.ts` 出发的依赖图可达性扫描中，该文件无任何入边（未被导入）。
- 风险评估：低。该模块不在运行主路径，不影响功能入口。

### 5.2 删除 `SyncService` 冗余转发导出

- 变更前：`SyncService.ts` 同时存在实例与一组“仅调用实例方法”的便捷导出。
- 变更后：
- 面板改为直接调用 `syncService` 实例方法；
- 冗余便捷导出从模块公共 API 中移除；
- DEV 调试全局仍保留同名方法（通过本地函数挂载），避免调试体验回退。
- 收益：减少重复维护点，避免“新增/调整方法时忘记同步转发函数”的风险。

## 6. 架构收益映射到四原则

### YAGNI

- 删除不可达模块 `src/utils/vnodeTraverser.ts`。
- 单组件场景的过度注册抽象已收敛（R1-3）。

### KISS

- `app -> componentRegistry -> domInjector` 主链路清晰化。
- `client.ts` 从超大文件回归请求入口角色。

### SOLID

- 面板视图/状态/动作分层，错误分类策略外置。
- 同步编排层与数据映射层拆分，单一职责更明确。

### DRY

- DEV 全局挂载模板统一。
- `SyncService` 重复错误处理与执行模板统一。
- 本轮继续移除重复转发函数。

## 7. 兼容性与验证

- 静态验证：
- `pnpm run type-check` 通过
- `pnpm run lint` 通过
- 行为兼容性说明：
- 面板交互动作仍通过同一 `syncService` 实例执行；
- 对外核心功能（同步电量/角色/材料、完整同步）未改变。

## 8. 后续建议（可选）

- 增加一份最小“冒烟脚本”清单（手工验证步骤），沉淀在 `docs/`，用于每轮重构后回归。
- 为 `SyncService` 增加轻量单测（可先从 mapper 层纯函数开始）。
