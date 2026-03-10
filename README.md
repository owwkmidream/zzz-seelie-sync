# ZZZ Seelie 数据同步脚本

为 ZZZ Seelie（`zzz.seelie.me`）提供**数据同步 + 登录 + 辅助工具**的油猴脚本。


## 🎯 你能做什么

- 在页面底部生成 Seelie 面板（用户信息 + 同步入口）
- 扫码登录（二维码弹窗、过期自动刷新、支持取消/关闭）
- 一键同步全部数据（电量 / 角色 / 养成材料）
- 单项同步与“重置设备信息”
- 设置面板：脚本去广告开关、uBlock Origin 规则一键复制
- 全流程状态反馈（按钮态 + Toast）


## 🌏 适用范围

- 仅支持：`https://zzz.seelie.me/*`
- 若页面结构或接口变更，脚本可能需要同步更新


## 🚀 安装方式

### 1) 直接安装（推荐）

稳定版（`release` 分支）：

[![安装稳定版](https://img.shields.io/badge/Install-Stable-2ea44f?style=for-the-badge)](https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release/zzz-seelie-sync.user.js)
[![安装稳定版-mini](https://img.shields.io/badge/Install-Stable--Mini-2ea44f?style=for-the-badge)](https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release/zzz-seelie-sync.mini.user.js)

夜间版（`release-nightly` 分支）：

[![安装夜间版](https://img.shields.io/badge/Install-Nightly-f59e0b?style=for-the-badge)](https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.user.js)
[![安装夜间版-mini](https://img.shields.io/badge/Install-Nightly--Mini-f59e0b?style=for-the-badge)](https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.mini.user.js)

> 注意：脚本元数据的 `downloadURL/updateURL` 指向 `release` / `release-nightly`，
> 稳定版建议固定使用 `release`。


### 2) 本地构建安装

```bash
pnpm install
pnpm run build
```

构建产物位于 `dist/`：

- `zzz-seelie-sync.user.js`
- `zzz-seelie-sync.mini.user.js`

> 本地构建默认不生成 `*.meta.js`，仅 CI 环境生成。


## 🧭 功能说明

### Seelie 面板

- 显示昵称 / UID
- 未登录时提示“请先登录”，并提供扫码入口
- 同步结果会在按钮与 Toast 中反馈

### 同步能力

- **电量同步**：读取游戏便笺并写入 Seelie
- **角色同步**：批量拉取角色详情并同步
- **材料同步**：优先使用 ID 映射，命中率不足时降级名称映射

### 设置面板

- **脚本去广告**：仅在目标站点显示，关闭后停止脚本去广告逻辑
- **uBlock Origin 规则**：一键复制到剪贴板
- **重置设备信息**：用于处理 1034 设备异常

## 🧪 开发与测试

```bash
pnpm run dev          # 启动本地开发服务
pnpm run type-check   # 类型检查
pnpm run lint         # 代码检查
pnpm run test:unit    # 单元测试
```

提交前建议执行：

```bash
pnpm run docs:index:check
```


## 📚 文档入口

- `docs/index.md`：仓库索引与关键入口导航

## 🏗️ 构建与发布说明

- `release:patch | release:minor | release:major` 会调用 `scripts/release.js`
- CI 会在 `main` 推送时构建并发布到 `release-nightly`
- `v*` tag 会触发正式发布并推送到 `release`
- userscript 版本号规则由 `vite.config.ts` 统一生成


## 🤝 贡献约定（摘要）

- 修改代码必须补测试或更新现有测试
- 修改 `src/api/hoyo/*` 或鉴权相关逻辑时，应至少运行：
  - `pnpm run test:unit`
  - `pnpm run type-check`
- 结构变更（新增/删除/重命名文件）需先：
  - `pnpm run docs:index:generate`
  - `pnpm run docs:index:check`


## 📄 License

MIT
