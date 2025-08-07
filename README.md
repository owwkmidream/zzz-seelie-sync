# ZZZ Seelie 数据同步脚本

一个为 [ZZZ Seelie](https://zzz.seelie.me/) 网站提供数据同步功能的油猴脚本。

## 功能特性

### 🎯 Seelie 面板

- **用户信息显示**: 自动获取并显示用户昵称、UID 和连接状态
- **一键同步**: 提供"同步全部"按钮，快速同步游戏数据
- **状态反馈**: 实时显示同步进度和结果
- **响应式设计**: 完美适配 Seelie 网站的深色主题

### 🔧 技术特性

- **TypeScript**: 完整的类型安全支持
- **模块化架构**: 清晰的代码组织结构
- **现代化 API**: 使用 GM_fetch 进行网络请求
- **智能缓存**: 设备信息和用户信息缓存机制
- **开发友好**: 完整的开发工具链支持

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm run dev
```

开发模式会自动打开浏览器并提供脚本安装链接。

### 构建生产版本

```bash
pnpm run build
```

构建完成后，安装 `dist/zzz-seelie-sync.user.js` 文件到你的油猴脚本管理器。

### 类型检查

```bash
pnpm run type-check
```

### 代码检查

```bash
pnpm run lint
pnpm run lint:fix  # 自动修复
```

## 版本发布

### 自动版本号

项目支持自动版本号管理：

- **开发环境**: 使用 `git describe` 生成版本号，格式如 `1.0.0.6-g0230769`
- **CI 构建**: 夜间构建使用 git describe，正式发布使用 package.json 版本
- **本地构建**: 自动检测 git 状态生成版本号

### 发布流程

#### 1. 自动发布（推荐）

```bash
# 发布补丁版本 (1.0.0 -> 1.0.1)
pnpm run release:patch

# 发布次要版本 (1.0.0 -> 1.1.0)
pnpm run release:minor

# 发布主要版本 (1.0.0 -> 2.0.0)
pnpm run release:major
```

#### 2. 手动发布

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 推送标签
git push --tags
```

### GitHub Actions

项目配置了完整的 CI/CD 流程：

#### CI 工作流 (`.github/workflows/ci.yml`)

- **触发条件**: 推送到 main 分支或创建 PR
- **执行步骤**:
  1. 类型检查和代码检查
  2. 构建脚本
  3. 部署到 `release-nightly` 分支（仅 main 分支）

#### Release 工作流 (`.github/workflows/release.yml`)

- **触发条件**: 推送 `v*` 标签
- **执行步骤**:
  1. 构建正式版本
  2. 部署到 `release` 分支
  3. 创建 GitHub Release
  4. 上传 `.user.js` 文件作为附件

### 版本分支

- **`release-nightly`**: 夜间构建，包含最新开发版本
- **`release`**: 正式发布版本，仅包含标签版本

### 安装链接

- **稳定版本**: `https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release/zzz-seelie-sync.user.js`
- **开发版本**: `https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.user.js`

## 项目结构

```
userscripts/
├── src/
│   ├── api/hoyo/           # 米哈游 API 相关
│   │   ├── client.ts       # API 客户端核心
│   │   ├── types.ts        # 类型定义
│   │   ├── avatar.ts       # 角色相关 API
│   │   ├── game-note.ts    # 游戏便笺 API
│   │   ├── utils.ts        # 工具函数
│   │   └── index.ts        # 统一导出
│   ├── components/         # UI 组件
│   │   └── SeeliePanel.ts  # Seelie 面板组件
│   ├── utils/              # 工具函数
│   │   ├── logger.ts       # 日志工具
│   │   ├── vnodeTraverser.ts # VNode 遍历
│   │   ├── useRouterWatcher.ts # 路由监听
│   │   └── seelie/         # Seelie 相关工具
│   ├── app.ts              # 应用主逻辑
│   ├── main.ts             # 入口文件
│   └── vite-env.d.ts       # 类型声明
├── docs/                   # 文档
├── dist/                   # 构建输出
├── vite.config.ts          # Vite 配置
├── tsconfig.*.json         # TypeScript 配置
└── package.json            # 项目配置
```

## 使用说明

### 安装脚本

1. 确保已安装油猴脚本管理器（如 Tampermonkey）
2. 构建项目：`pnpm run build`
3. 安装生成的 `dist/zzz-seelie-sync.user.js` 文件
4. 访问 https://zzz.seelie.me/ 即可看到 Seelie 面板

### 面板功能

- **用户信息**: 显示当前登录用户的昵称和 UID
- **连接状态**: 绿点表示已连接，红点表示连接失败
- **同步全部**: 点击按钮同步所有游戏数据（当前为测试版本）
- **设置**: 快速访问脚本设置（待实现）

## 开发指南

### 添加新功能

1. 在相应目录下创建新文件
2. 使用 TypeScript 编写代码
3. 导入到 `app.ts` 中进行初始化
4. 运行类型检查确保无误

### 样式开发

- 使用 Tailwind CSS 类名
- 保持与 Seelie 网站风格一致
- 支持深色主题

### API 开发

- 所有 API 请求使用 `@trim21/gm-fetch`
- 遵循米哈游 API 规范
- 实现适当的错误处理和重试机制

## 故障排除

### 常见问题

1. **面板未显示**: 检查控制台错误，确认目标容器存在
2. **用户信息加载失败**: 检查 Cookie 有效性和网络连接
3. **构建失败**: 运行 `pnpm run type-check` 检查类型错误

### 调试技巧

- 使用 `logger.debug()` 输出调试信息（仅开发环境）
- 检查浏览器开发者工具的网络面板
- 查看油猴脚本管理器的日志

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License

## 更新日志

### v1.0.0

- 初始版本发布
- Seelie 面板组件
- 用户信息显示
- 基础同步功能
