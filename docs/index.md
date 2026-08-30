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
- `src/utils/adCleaner.ts` + `src/utils/adCleanerRules.ts` + `src/utils/siteManifest.ts`：去广告能力与站点资源探测核心，使用 manifest + fallback 策略维持规则稳定性；选择器与规则文本已下沉到 `adCleanerRules.ts`（纯逻辑，可单测）。
- `src/components/seeliePanelTargets.ts`：面板挂载点候选与解析，按“精确 → 宽松 → 历史”顺序降级，是站点改版后面板能否注入的唯一判断入口。
- `src/components/SeeliePanelFloating.ts` + `src/utils/gmMenu.ts`：GM 菜单悬浮窗兜底通道，不依赖站点 DOM，站点结构再变时仍可唤出面板。
- `src/utils/nativeSyncTree.ts` + `src/utils/nativeSyncHijack.ts` + `src/utils/nativeSyncHijackRuntime.ts`：劫持站点原生 SYNC 按钮。站点原生同步走 postMessage 向浏览器扩展取 cookie、再经 `gb.inmagi.com/cors` 代理打国际服 HoYoLAB，国服账号走不通；但其落数据终点 `addGoal()` 与本脚本相同，因此改为替换组件的 `clickedSync` / `sync` 方法，复用组件自身的 loading / error / 弹窗状态。**不要**尝试在 postMessage 层伪造扩展应答——后续国际服 URL 在 bundle 里是写死的。

### 最近结构变更

- `2026-08-30`：站点侧边栏改版适配。挂载点 class 由 `...w-full mt-3` 变为 `...w-full mt-4 pt-4 border-t border-white/5`，新增 `src/components/seeliePanelTargets.ts` 承载候选解析；去广告补上 Signal Tracker 空壳分组与其前置分割线的清理，消除“多出来的分割线”；新增 `src/components/SeeliePanelFloating.ts` + `src/utils/gmMenu.ts` 提供 GM 菜单悬浮窗入口（`@grant GM.registerMenuCommand`）。站点结构事实来自 `index-*.js` 渲染函数，主页 HTML 只是空壳。
- `2026-08-30`：新增原生 SYNC 按钮劫持（`nativeSyncTree.ts` / `nativeSyncHijack.ts` / `nativeSyncHijackRuntime.ts`），并在 `SeelieCore` 上补 `getRootComponent()` 供组件树遍历。站点共 6 处 `$t("sync")` 按钮，组件特征是同时具备 `clickedSync` / `sync` / `getCookie` 三个方法。控制台可调 `zssProbeNativeSync()` 查看识别结果与 proxy 可写性。
- `2026-08-30`：侧边栏分割线已成为用户可配置项（`settings.sidebar_divider_style`），class 在 `thematic-divider` / `simple-divider` / 不渲染三态间切换，旧 `zzz-divider` 已下线。分割线同时从 hoisted 静态节点变为带 key 的条件渲染节点，Vue 会重新插入，因此已纳入 MutationObserver 的清理触发条件。`adCleaner` 的分组识别改为从链接向上取 `parentElement` 并校验“分组内仅此一条链接”，分割线识别以 `*-divider` 命名规律兜底，不再硬编码具体 class——该 class 在两周内已改名两次。

- `2026-03-11`：更新 `minimalAuthContracts` 的最小 Header 约束：`createQRLogin` / `queryQRLoginStatus` 增加 `x-rpc-device_fp`，`avatar_basic_list` / `batch_avatar_detail_v2` 增加 `x-rpc-device_id`，`note` 增加 `x-rpc-device_fp`。
- `2026-03-11`：按 `D:\download\act.mihoyo.com_cleaned.json` 收敛 `getFp` 的主字段语义，当前运行时改为 `device_id = deviceId(UUID)`、`seed_id = 16 位 hex`，并移除 `requestDeviceId` 与 `bbs_device_id`。
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
- 兜底调用链（侧边栏挂载点缺失时）：
  `src/app.ts` → `initGmMenu()` → GM 菜单 → `openFloatingPanel()` → `new SeeliePanel({ mountHost })`。
- 站点 DOM 结构事实的获取方式：`https://zzz.seelie.me` 主页是 Vue 空壳（仅 `#app`），
  侧边栏 class 串只存在于 `/assets/index-*.js` 的渲染函数里。改版排查时先抓 bundle
  再 grep `class:"..."`，不要指望从主页 HTML 看到结构。
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
| `src/components/SeeliePanelFloating.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelQrLoginView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelSettingsView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelSyncOptions.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelSyncResult.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelSyncView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelTargets.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelUserInfo.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/seeliePanelUserInfoView.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/components/zssPanelStyles.ts` | `components` | Seelie 面板相关 UI 组件 |
| `src/main.ts` | `src` | 脚本入口，初始化应用与调试全局 |
| `src/monkey-global.d.ts` | `src` | 油猴全局类型声明 |
| `src/services/mappers/itemsSyncMapper.ts` | `services/mappers` | 同步数据映射器 |
| `src/services/SyncService.ts` | `services` | 业务服务编排 |
| `src/utils/adCleaner.ts` | `utils` | 页面广告清理逻辑 |
| `src/utils/adCleanerMenu.ts` | `utils` | 去广告设置菜单 |
| `src/utils/adCleanerRules.ts` | `utils` | 通用工具模块 |
| `src/utils/componentRegistry.ts` | `utils` | 组件注册入口 |
| `src/utils/devGlobals.ts` | `utils` | 开发调试全局导出 |
| `src/utils/gmFetch.ts` | `utils` | 通用工具模块 |
| `src/utils/gmMenu.ts` | `utils` | 通用工具模块 |
| `src/utils/logger.ts` | `utils` | 日志工具 |
| `src/utils/nativeSyncHijack.ts` | `utils` | 通用工具模块 |
| `src/utils/nativeSyncHijackRuntime.ts` | `utils` | 通用工具模块 |
| `src/utils/nativeSyncTree.ts` | `utils` | 通用工具模块 |
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
