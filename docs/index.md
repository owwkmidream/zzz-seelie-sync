# 项目索引（Agent 导航）

本文件用于帮助 Codex / Claude Code 快速定位仓库结构与关键入口。

## 使用方式

1. 任务开始前先阅读本文件，再定位目标代码。
2. 结构变更后运行 `pnpm run docs:index:generate` 更新自动区。
3. 提交前运行 `pnpm run docs:index:check` 检查索引是否过期。

## 手动维护区（Agent 可编辑）

### 当前重点模块

- `src/components/SeeliePanel.ts`：用户交互中枢，负责用户信息展示、扫码登录、同步按钮行为编排，以及同步结果反馈。
- `src/services/SyncService.ts`：同步编排核心，统一协调电量/角色/材料同步，封装错误处理、Toast 提示与批量结果汇总。
- `src/services/mappers/itemsSyncMapper.ts`：材料同步映射层，主路径为 ID 映射，命中不足时回退到名称映射，是材料同步准确性的关键点。
- `src/utils/useDOMInjector.ts` + `src/utils/componentRegistry.ts`：组件注入与生命周期管理中心，处理 DOM 变化与路由变化下的创建/重建/销毁。
- `src/api/hoyo/*`：米哈游 API 边界层，现已拆成 auth store、device profile、header profile、cookie router 与业务请求层；上层业务应通过统一导出调用，避免绕过封装。
- `src/utils/adCleaner.ts` + `src/utils/siteManifest.ts`：去广告能力与站点资源探测核心，使用 manifest + fallback 策略维持规则稳定性。

### 最近结构变更

- `2026-03-11`：收敛 NAP 脚本托管主链回 `cookie_token + account_id`，新增 `src/api/hoyo/passportCookieParser.ts` 与 `tests/api/hoyo/passportService.test.ts` 覆盖 `getCookieAccountInfoBySToken` 的响应解析，避免再次误判为 `cookie_token_v2`。
- `2026-03-11`：新增 `src/api/hoyo/deviceProfileCore.ts` 与对应单测，收敛 `getFp` 的 seed/request 标识持久化规则，并把 `getFp` 头压回最小结构。
- `2026-03-11`：新增 `src/api/hoyo/recordAuthCore.ts`，把 `note` 链的 `ltoken/ltuid` 刷新逻辑下沉到可注入 core，并补上 `recordAuthCore` / `requestCore` 的 note 路径单测。
- `2026-03-11`：新增 `src/api/hoyo/passportCore.ts`、`src/api/hoyo/requestCore.ts`，把 NAP 主链刷新/重试状态机下沉到可注入 core，并补上 mock 流程单测。
- `2026-03-11`：新增 `tests/api/hoyo/*.test.ts` 与 `test:unit`，开始为 HoYo 鉴权改造相关纯逻辑补单元测试，不再只靠手动请求回归。
- `2026-03-11`：新增 `temp/hoyo-auth-probe.cjs` 与 `docs/api-auth-minimal-probe.md`，把 `D:\2.js` + 真实存储样本的 HoYo 端点最小鉴权结构实测结果落为文档。
- `2026-03-10`：HoYo 鉴权体系重构为“扫码拿根凭证 -> 脚本派生 LToken / CookieToken / e_nap_token -> 按端点路由 Cookie / 手机头 profile”，新增 `authStore.ts`、`deviceProfile.ts`、`cookieJar.ts`、`headerProfiles.ts`、`ds.ts`、`authRouter.ts`。
- `2026-02-26`：移除第三方 `@trim21/gm-fetch` 依赖，新增 `src/utils/gmFetch.ts` 统一封装 `GM.xmlHttpRequest`，为后续匿名请求与手动 Cookie 注入预留能力。
- `2026-02-26`：建立索引维护体系，新增 `AGENT.md`、`scripts/index-doc.js`，并将 `docs/index.md` 固化为“手动区 + 自动区”双层结构。
- `2026-02-20`：材料同步策略升级为“ID 映射优先 + 名称映射降级”，核心变更在 `src/services/SyncService.ts` 与 `src/services/mappers/itemsSyncMapper.ts`。
- `2026-02-20`：开发调试全局导出策略统一，涉及 `src/main.ts`、`src/utils/devGlobals.ts`、`src/api/hoyo/index.ts`、`src/utils/seelie/index.ts`。
- `2026-02-20`：构建与发布侧调整（版本与二维码 CDN 相关），影响 `package.json`、`vite.config.ts`。

### 备注

- 主调用链（从页面加载到同步执行）：
  `src/main.ts` → `src/app.ts` → `registerAllComponents()` → `domInjector.init()` → `SeeliePanel` → `SyncService` → (`src/api/hoyo/*` + `src/utils/seelie/*`)。
- `docs/api-cookie-inventory.md`：HoYo / Seelie 运行时接口与 Cookie 依赖盘点，供后续“手动接管 Cookie”时做最小集合验证。
- `docs/api-auth-minimal-probe.md`：基于 `D:\2.js` + 真实存储样本跑出的 HoYo 端点最小鉴权结构实测报告，优先用于判断哪些显式 header/cookie 可以删。
- 手动区维护要求：只写职责、调用链、关键约束与近期结构变化，不复制自动区文件清单。
- 当出现文件新增/删除/重命名或目录迁移时，先运行 `pnpm run docs:index:generate` 更新自动区，再补本手动区语义信息。

## 自动生成区（脚本覆盖）

<!-- AUTO_INDEX:START -->
### 源码（src）

| Path | Area | Role |
| --- | --- | --- |
| `src/api/hoyo/authRouter.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/authService.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/authStore.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/avatar.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/client.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/config.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/cookieJar.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/cookieUtils.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/devicePayload.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/deviceProfile.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/deviceProfileCore.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/deviceService.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/deviceUtils.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/ds.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/errors.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/game-note.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/headerProfiles.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/index.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/items.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/minimalAuthContracts.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/passportCookieParser.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/passportCore.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/passportService.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/recordAuthCore.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/requestCore.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/types.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/api/hoyo/utils.ts` | `api/hoyo` | 米哈游 API 客户端与鉴权模块 |
| `src/app.ts` | `src` | 应用初始化与 DOM 注入协调 |
| `src/components/SeeliePanel.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelErrorView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelQrLoginView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelSettingsView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelSyncOptions.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelSyncResult.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelSyncView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelUserInfo.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelUserInfoView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/zssPanelStyles.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/main.ts` | `src` | 脚本入口，初始化应用与调试全局 |
| `src/monkey-global.d.ts` | `src` | 油猴全局类型声明 |
| `src/services/mappers/itemsSyncMapper.ts` | `services/mappers` | 同步数据映射器 |
| `src/services/SyncService.ts` | `services` | 业务服务编排 |
| `src/utils/adCleaner.ts` | `utils` | 页面广告清理逻辑 |
| `src/utils/adCleanerMenu.ts` | `utils` | 去广告设置菜单 |
| `src/utils/componentRegistry.ts` | `utils` | 组件注册入口 |
| `src/utils/devGlobals.ts` | `utils` | 开发调试全局导出 |
| `src/utils/gmFetch.ts` | `utils` | 通用工具模块 |
| `src/utils/logger.ts` | `utils` | 日志工具 |
| `src/utils/seelie/calculators.ts` | `utils/seelie` | Seelie 数据处理核心模块 |
| `src/utils/seelie/constants.ts` | `utils/seelie` | Seelie 数据处理核心模块 |
| `src/utils/seelie/core.ts` | `utils/seelie` | Seelie 数据处理核心模块 |
| `src/utils/seelie/dataUpdater.ts` | `utils/seelie` | Seelie 数据处理核心模块 |
| `src/utils/seelie/index.ts` | `utils/seelie` | Seelie 数据处理核心模块 |
| `src/utils/seelie/managers.ts` | `utils/seelie` | Seelie 数据处理核心模块 |
| `src/utils/seelie/types.ts` | `utils/seelie` | Seelie 数据处理核心模块 |
| `src/utils/siteManifest.ts` | `utils` | 站点 manifest 获取与缓存 |
| `src/utils/useDOMInjector.ts` | `utils` | DOM 注入管理器 |
| `src/utils/useRouterWatcher.ts` | `utils` | 路由变化监听 |
| `src/vite-env.d.ts` | `src` | Vite/插件类型声明 |

### 配置与入口（根目录关键文件）

| Path | Area | Role |
| --- | --- | --- |
| `eslint.config.js` | `root` | ESLint 规则配置 |
| `package.json` | `root` | 项目元信息与命令入口 |
| `pnpm-workspace.yaml` | `root` | pnpm workspace 配置 |
| `README.md` | `root` | 项目说明与使用指南 |
| `tsconfig.app.json` | `root` | 应用 TypeScript 编译配置 |
| `tsconfig.json` | `root` | TypeScript 基础配置入口 |
| `tsconfig.node.json` | `root` | Node 脚本 TypeScript 配置 |
| `vite.config.ts` | `root` | Vite 与 userscript 构建配置 |

### 自动化脚本（scripts）

| Path | Area | Role |
| --- | --- | --- |
| `scripts/index-doc.js` | `scripts` | 索引生成与校验脚本 |
| `scripts/release.js` | `scripts` | 版本发布脚本 |

### 工作流（.github/workflows）

| Path | Area | Role |
| --- | --- | --- |
| `.github/workflows/ci.yml` | `.github/workflows` | CI 类型检查/构建/夜间部署 |
| `.github/workflows/release.yml` | `.github/workflows` | 标签发布与 Release 流程 |
<!-- AUTO_INDEX:END -->
