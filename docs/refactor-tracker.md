# zzz-seelie-sync 重构任务看板

> 目标：在不改变对外功能的前提下，基于 `YAGNI / KISS / SOLID / DRY` 逐步降低复杂度、重复率与维护成本。  
> 策略：小步提交、可回退、每步有静态验证。

## 0. 规则与范围

- 重构范围：`src` 目录（业务代码与工具层）
- 不在本轮处理：
- UI 视觉重设计
- 新功能开发（例如 README 中提到的“设置”功能）
- 验证方式（静态）：
- TypeScript 类型检查
- 代码结构审查
- 关键路径人工审阅

## 1. 进度总览

| ID | 任务 | 原则 | 风险 | 状态 | 验收标准 |
|---|---|---|---|---|---|
| R0-1 | 建立重构看板与任务分解 | - | 低 | ✅ 已完成 | 看板落库，可追踪 |
| R1-1 | 统一 DEV 全局挂载逻辑，去除重复样板 | DRY/KISS | 低 | ✅ 已完成 | 6 处重复逻辑收敛为 1 个工具 |
| R1-2 | 清理未使用或死路径代码（`vnodeTraverser` 相关入口） | YAGNI | 低 | ✅ 已完成 | 主路径不再保留无效初始化注释/入口 |
| R1-3 | 简化 `componentRegistry` 的过度抽象入口 | YAGNI/KISS | 低 | ✅ 已完成 | 单组件场景注册入口直接化 |
| R2-1 | 拆分 `SeeliePanel`：视图构建/状态管理/业务动作 | SOLID/KISS | 中 | ✅ 已完成 | 视图构建已模块化，主类聚焦状态与动作 |
| R2-2 | 提取同步按钮与状态反馈通用逻辑 | DRY/KISS | 中 | ✅ 已完成 | 同步相关 handler 重复显著减少 |
| R2-3 | 提取用户信息错误映射策略 | SOLID/DRY | 中 | ✅ 已完成 | 错误分类策略已独立模块化 |
| R3-1 | 拆分 `SyncService`：编排层与数据映射层 | SOLID/KISS | 中 | ✅ 已完成 | mapper 已独立，服务层以编排为主 |
| R3-2 | 抽象统一的 `executeWithToast` 模板 | DRY | 中 | ✅ 已完成 | 统一执行模板覆盖布尔/单体/批量任务 |
| R3-3 | 清理 `as unknown as` 类型强转 | SOLID | 中 | ✅ 已完成 | 核心代码中 `as unknown as` 已清零 |
| R4-1 | 拆分 `api/hoyo/client.ts`（auth/request/device） | SOLID/KISS | 中-高 | ✅ 已完成 | `client` 仅保留 request 编排，auth/device 已模块化 |
| R4-2 | 设备指纹 payload 结构化与注释化 | KISS/DRY | 中 | ✅ 已完成 | payload 已结构化构建并序列化 |
| R4-3 | 错误模型统一（HTTP/API/业务） | SOLID/DRY | 中 | ✅ 已完成 | request/auth/device 均使用统一错误类型 |
| R5-1 | 删除孤立模块与重复转发 API | YAGNI/DRY | 低 | ✅ 已完成 | 删除未引用文件并收敛服务层冗余转发 |

## 2. 分阶段任务明细

## Phase R1 - 低风险收益任务（先做）

### R1-1 统一 DEV 全局挂载逻辑（已完成）

- 动机：
- 当前多文件重复 `if (import.meta.env.DEV && typeof window !== 'undefined')` + `window as unknown as Record<string, unknown>`
- 增加认知负担，且不利于统一维护
- 计划动作：
- 新增 `src/utils/devGlobals.ts`
- 提供 `exposeDevGlobals(globals)` 工具
- 替换以下模块重复代码：
- `src/services/SyncService.ts`
- `src/utils/vnodeTraverser.ts`
- `src/utils/useRouterWatcher.ts`
- `src/utils/useDOMInjector.ts`
- `src/utils/seelie/index.ts`
- `src/api/hoyo/index.ts`
- 完成标准：
- 上述文件不再手写重复 cast 与赋值模板
- 逻辑行为保持一致（仅 DEV 暴露）

### R1-2 清理 `vnodeTraverser` 死路径（已完成）

- 动机：
- `app.ts` 中相关调用已注释，属于疑似历史路径
- 已执行：
- 移除 `src/app.ts` 中已注释的 `vnodeTraverser` 入口引用
- 主初始化路径仅保留有效逻辑
- 完成标准：
- 主路径不包含无效初始化逻辑

### R1-3 简化 `componentRegistry` 抽象层（已完成）

- 动机：
- 当前仅 1 个组件，存在为“未来扩展”准备的抽象
- 已执行：
- 删除单组件场景下的 `componentRegisters` 映射层
- 删除无意义 `condition: () => true` 样板
- 移除当前未使用的 `registerComponents` API
- 完成标准：
- 注册逻辑更直接，新增组件仍可扩展

## Phase R2 - UI 组件职责拆分（中风险）

### R2-1 拆 `SeeliePanel` 为 3 层

- `panelView`: 纯 DOM 构建
- `panelState`: loading/expanded/userInfo 状态
- `panelActions`: 同步操作与按钮行为

### R2-2 统一同步动作模板

- 提炼按钮状态切换、图标旋转、结果回滚模板
- 避免每个 handler 重复“取按钮 + try/catch + toast + 文案回滚”

### R2-3 用户错误策略外置

- 把 `login_required / no_character / network_error / unknown` 的判定与文案映射移到策略层

#### 执行结果（已完成）

- 新增 `src/components/seeliePanelUserInfo.ts`
- `SeeliePanel` 使用 `mapUserInfoError`，不再内嵌错误分类分支
- 行为保持一致，职责更清晰

## Phase R3 - 同步服务层重构（中风险）

### R3-1 编排层与映射层分离

- `SyncService` 只做流程编排
- `items` 映射逻辑提取为独立模块（例如 `services/mappers/itemsMapper.ts`）

### R3-2 统一执行模板

- 提取 `executeWithToast` / `executeSyncStep`，统一返回结果与错误收敛

### R3-3 类型边界治理

- 消除 `as unknown as CharacterDataInput` 等强转
- 明确 API 返回类型与 Seelie 输入类型转换器

## Phase R4 - API 客户端拆分（中-高风险）

### R4-1 拆分 `client.ts`

- `auth.ts`: nap token 与用户初始化
- `request.ts`: 请求执行、重试、错误处理
- `device.ts`: device id/fp、缓存、刷新

### R4-2 payload 结构化

- `ext_fields` 构建从内联模板字符串改为结构对象 + 序列化

### R4-3 错误模型统一

- 区分网络错误、HTTP 错误、API 业务错误
- 提供统一错误码/消息给上层

## Phase R5 - 冗余/死代码清理（低风险）

### R5-1 删除孤立模块与重复转发 API（已完成）

- 动机：
- `src/utils/vnodeTraverser.ts` 已不在入口图中，属于不可达模块
- `SyncService` 存在仅转发到实例方法的重复导出函数
- 已执行：
- 删除 `src/utils/vnodeTraverser.ts`
- `SeeliePanel` 改为直接调用 `syncService` 实例方法
- `SyncService` 删除外部便捷转发导出，仅保留实例导出与 DEV 调试挂载
- 同步更新 README 结构树中已删除文件项
- 完成标准：
- 依赖图不存在孤立源码文件
- 同步流程行为不变，类型检查与 lint 通过

## 3. 每步执行记录

### 2026-02-13 - Step 1

- 输出并落库重构任务看板
- 开始执行 `R1-1`（统一 DEV 全局挂载逻辑）

### 2026-02-13 - Step 2

- 完成 `R1-1`：新增 `src/utils/devGlobals.ts`
- 替换 6 处 DEV 全局挂载重复逻辑：
- `src/services/SyncService.ts`
- `src/utils/vnodeTraverser.ts`
- `src/utils/useRouterWatcher.ts`
- `src/utils/useDOMInjector.ts`
- `src/utils/seelie/index.ts`
- `src/api/hoyo/index.ts`
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 3

- 完成 `R1-2`：清理 `src/app.ts` 中 `vnodeTraverser` 死路径注释入口
- 完成 `R1-3`：简化 `src/utils/componentRegistry.ts` 的单组件冗余抽象
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 4

- 完成 `R2-3`：提取用户信息错误映射策略
- 新增 `src/components/seeliePanelUserInfo.ts`
- 调整 `src/components/SeeliePanel.ts`：错误处理逻辑改为调用策略函数
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 5

- 启动 `R2-2`（进行中）：提取 `SeeliePanel` 同步按钮重复模板的第一批
- 为主同步按钮增加 `data-sync-main`，替代不稳定的文案类选择器
- 新增 `getButtonFromEvent`，收敛 4 个 handler 的重复取按钮逻辑
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 6

- 推进 `R2-2`：新增 `handleSyncActionFromEvent` 通用方法
- 收敛 4 个详细同步 handler 的重复模板（取按钮 + loading 文案 + 日志包装）
- `重置设备` 失败时改为显式抛错，确保按钮结果态与真实结果一致
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 7

- 启动 `R2-1`（进行中）：抽离错误态视图构建逻辑
- 新增 `src/components/seeliePanelErrorView.ts`，集中处理错误 icon/hint/button DOM 构建
- `src/components/SeeliePanel.ts` 改为依赖 `createUserInfoErrorView`，减少 UI 细节耦合
- 拆分后规模：
- `SeeliePanel.ts`：`504` 行
- `seeliePanelUserInfo.ts`：`36` 行
- `seeliePanelErrorView.ts`：`84` 行
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 8

- 继续推进 `R2-1`：抽离详细同步按钮配置常量
- 新增 `src/components/seeliePanelSyncOptions.ts`（文案/图标/动作标识）
- `SeeliePanel` 仅保留动作处理与事件绑定，移除内联大段配置
- 拆分后规模：
- `SeeliePanel.ts`：`482` 行
- `seeliePanelSyncOptions.ts`：`36` 行
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 9

- `R2-2` 标记完成：同步动作模板化已覆盖主流程
- 完成依据：
- `handleSyncActionFromEvent` 统一了详细动作执行模板
- 详细按钮配置拆分至 `seeliePanelSyncOptions.ts`
- 事件绑定与业务执行边界更清晰

### 2026-02-13 - Step 10

- 启动 `R3-2`（进行中）：收敛 `SyncService` 重复失败模板
- 在 `SyncService` 新增统一失败处理方法：
- `failBooleanTask`
- `failSyncResult`
- `failBatchSyncResult`
- 用统一方法替换 `syncResinData / syncSingleCharacter / syncAllCharacters / syncItemsData` 中重复的日志+toast+返回模板
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 11

- 启动 `R3-1 / R3-3`（进行中）：提取 Hoyo -> Seelie 映射层并消除关键强转
- 新增 `src/services/mappers/hoyoToSeelieMapper.ts`
- 从 `SyncService` 中移除两处 `as unknown as CharacterDataInput` 强转，改为显式 mapper 调用
- 为 `weapon` 属性补充结构化映射，避免不安全断言
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 12

- 完成 `R3-3`：继续清理剩余强转路径
- `src/utils/useRouterWatcher.ts`：新增 `isVueRouter` 类型守卫，移除 `as unknown as VueRouter`
- `src/utils/vnodeTraverser.ts`：为 `mixin.mounted` 声明 `this` 类型，移除 `as unknown as`
- `src/utils/devGlobals.ts`：改为 `Reflect.set` 挂载全局变量，移除类型强转
- 结果：`rg \"as unknown as\" src` 无匹配
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 13

- 推进 `R3-1`：抽离 `SyncService` 的物品映射逻辑到独立 mapper
- 新增 `src/services/mappers/itemsSyncMapper.ts`
- `SyncService` 不再内置以下纯映射方法：
- `collectAllItemsInfo`
- `buildItemsInventory`
- `buildCnToSeelieNameMapping`
- `syncItemsToSeelie`
- 体量变化：
- `SyncService.ts`：`292` 行（由此前 `390` 行进一步下降）
- 新增映射层文件：`hoyoToSeelieMapper.ts`（`79` 行）、`itemsSyncMapper.ts`（`107` 行）
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 14

- 启动 `R4-1`（进行中）：拆分 `api/hoyo/client.ts` 的纯工具函数
- 新增 `src/api/hoyo/deviceUtils.ts`，迁移以下函数：
- `generateProductName`
- `generateUUID`
- `generateSeedId`
- `generateHexString`
- `client.ts` 通过 re-export 保持现有对外 API 兼容
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 15

- 启动 `R4-2`（进行中）：提取设备指纹请求体构建逻辑
- 新增 `src/api/hoyo/devicePayload.ts`，集中构建 `DeviceFpRequest`
- `client.ts` 内联超长 payload 构建替换为 `buildDeviceFpRequest(...)`
- 规模变化：
- `client.ts`：`349` 行（继续下降）
- `deviceUtils.ts`：`51` 行
- `devicePayload.ts`：`22` 行
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 16

- 推进 `R4-1`：抽离 `client.ts` 的配置常量
- 新增 `src/api/hoyo/config.ts`（URL、版本、默认请求头）
- `client.ts` 改为依赖并 re-export 配置常量，保持对外 API 兼容
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 17

- 完成 `R4-1`：抽离 `auth` 与 `device` 逻辑
- 新增：
- `src/api/hoyo/authService.ts`（用户初始化与缓存）
- `src/api/hoyo/deviceService.ts`（设备指纹、设备缓存、设备请求头）
- `src/api/hoyo/client.ts` 仅保留 request 编排与统一导出
- 规模变化：
- `client.ts`：`102` 行
- `authService.ts`：`105` 行
- `deviceService.ts`：`154` 行
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 18

- 完成 `R4-2`：`DeviceFpRequest.ext_fields` 结构化
- `src/api/hoyo/devicePayload.ts`：
- 新增 `buildDeviceExtFields`，使用对象构建并 `JSON.stringify`
- 替换内联超长 JSON 字符串拼接
- 结果：payload 逻辑可读性提升，后续字段调整可维护
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 19

- 启动 `R4-3`（进行中）：统一请求层错误模型
- 新增 `src/api/hoyo/errors.ts`：
- `HttpRequestError`
- `ApiResponseError`
- `DeviceFingerprintRefreshError`
- `client.ts` 中请求错误从字符串判断改为类型判断（`instanceof`）
- 保持原有错误语义与关键信息（HTTP/API retcode）不变
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 20

- 推进 `R4-3`：将 `authService` 接入统一错误类型
- `authService` 初始化流程改为抛出：
- `HttpRequestError`（HTTP 失败）
- `ApiResponseError`（retcode 非 0）
- `errors.ts` 增加可选 `context` 字段，保留中文业务上下文（如“获取用户角色失败”）
- 兼容性：错误消息仍包含 HTTP/API 关键信息，原有 UI 错误识别规则可继续工作
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 21

- 完成 `R3-2`：`SyncService` 引入统一执行模板
- 新增执行器：
- `executeBooleanTask`
- `executeSyncResultTask`
- `executeBatchSyncTask`
- `syncResinData / syncSingleCharacter / syncAllCharacters / syncItemsData` 统一改为模板执行，去除重复 `try/catch`
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 22

- 完成 `R4-3`：错误模型统一覆盖 `request/auth/device`
- 新增错误类型：
- `InvalidDeviceFingerprintError`
- `deviceService` 改为抛出统一错误类型：
- `HttpRequestError`
- `ApiResponseError`
- `client.ts` 新增对 `InvalidDeviceFingerprintError` 的类型分支处理
- 结果：请求层异常从字符串匹配转为显式类型建模
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 23

- 继续推进 `R2-1`：抽离完整同步结果判定逻辑
- 新增 `src/components/seeliePanelSyncResult.ts`
- `SeeliePanel.performSync` 改为调用 `assertFullSyncSuccess`
- 结果：UI 组件内的业务错误拼装逻辑进一步下沉
- 拆分后规模：
- `SeeliePanel.ts`：`469` 行
- `seeliePanelSyncResult.ts`：`27` 行
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 24

- 完成 `R2-1`：同步区与用户信息区视图继续模块化
- 新增：
- `src/components/seeliePanelUserInfoView.ts`
- `src/components/seeliePanelSyncView.ts`
- `SeeliePanel` 删除内联同步区 DOM 拼装与用户信息 DOM 拼装细节，改为调用视图模块
- 规模变化：
- `SeeliePanel.ts`：`376` 行
- 视图拆分模块总计：`316` 行（`syncView/userInfoView/errorView/options/syncResult`）
- 静态校验：`pnpm run type-check` 通过

### 2026-02-13 - Step 25

- 全量静态检查补验收：
- `pnpm run type-check` 通过
- `pnpm run lint` 通过
- 看板任务 `R0-R4` 全部完成

### 2026-02-14 - Step 26

- 启动并完成 `R5-1`：冗余/死代码清理
- 删除孤立模块 `src/utils/vnodeTraverser.ts`（依赖图不可达）
- `SeeliePanel` 改为直接依赖 `syncService`，移除对 `SyncService` 冗余转发导出的依赖
- `SyncService` 删除仅转发的便捷函数导出，保留实例导出与 DEV 调试 API
- 新增 `docs/refactor-before-after.md`：沉淀重构前后对比与原则映射
- 静态校验：`pnpm run type-check`、`pnpm run lint` 通过
