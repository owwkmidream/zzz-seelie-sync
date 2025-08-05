# 文档目录

欢迎查看绝区零数据同步脚本的完整文档。

## 📚 文档列表

### 快速入门

#### [overview.md](./overview.md) - 系统总览 ⭐

- 系统架构和核心功能概述
- 数据流程和技术特性
- 快速开始指南
- 最佳实践和故障排除
- 文档导航和学习路径

### 核心功能文档

#### [README.md](./README.md) - 项目概述

- 项目介绍和功能概述
- 技术栈说明
- 核心功能详解
- 使用示例和配置说明
- 实际应用场景
- 性能考虑和故障排除

#### [API.md](./API.md) - API 参考手册

- VNode 遍历 API 详解
- 路由监听 API 使用指南
- 按钮注入 API 参考
- 全局调试函数说明
- 类型定义和接口
- 错误处理最佳实践

#### [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发指南

- 开发环境设置
- 项目架构说明
- 开发最佳实践
- 扩展开发指南
- 测试策略和调试技巧
- 部署和发布流程

### Seelie 工具类文档

#### [seelie-api-v2.md](./seelie-api-v2.md) - Seelie API 文档 (v2.0)

- 重构后的 Seelie 工具类完整 API 参考
- 模块化架构设计说明
- 类型定义和接口文档
- 使用示例和最佳实践
- 错误处理和调试方法
- 性能优化建议

#### [seelie-refactor.md](./seelie-refactor.md) - Seelie 重构文档

- 重构过程和设计思路
- 模块职责分工说明
- 新旧版本对比
- 向后兼容性说明
- 重构优势和改进点

### Hoyo API 文档

#### [hoyo-api-v2.md](./hoyo-api-v2.md) - 米哈游绝区零 API 文档 (v2.0)

- 完整的绝区零 API 客户端文档
- 角色数据、游戏便笺 API 参考
- 设备管理和用户认证
- 批量请求和性能优化
- 错误处理和故障排除

#### [ZZZ_API_Analysis.md](./ZZZ_API_Analysis.md) - 绝区零 API 分析

- API 接口分析和逆向工程
- 请求格式和响应结构
- 认证机制和安全考虑

### 集成使用指南

#### [integration-guide.md](./integration-guide.md) - Seelie & Hoyo API 集成指南

- 完整的数据同步工作流程
- 高级用法和选择性同步
- 自动同步和定时任务
- 错误处理和重试机制
- 调试工具和性能监控
- 最佳实践和故障排除

### 其他文档

#### [mihoyo-password-login.md](./mihoyo-password-login.md) - 米游社密码登录

- 米游社登录机制分析
- 密码登录实现方法

## 🚀 快速开始

如果你是第一次使用这个系统，建议按以下顺序阅读：

### 新手推荐路径

1. **[系统总览](./overview.md)** ⭐ - 快速了解整个系统的架构和功能
2. **[集成使用指南](./integration-guide.md)** - 学习如何使用完整的数据同步功能
3. **[Seelie API 文档](./seelie-api-v2.md)** - 了解 Seelie 工具类的具体用法

### 开发者路径

1. **[开发指南](./DEVELOPMENT.md)** - 设置开发环境
2. **[Hoyo API 文档](./hoyo-api-v2.md)** - 了解米哈游 API 客户端
3. **[API 参考手册](./API.md)** - 查看底层 API 详细信息

## 📋 功能概览

### 核心功能

- ✅ **VNode 遍历** - 为 Vue 3 应用中的 DOM 元素挂载 `__vue__` 属性
- ✅ **路由监听** - 监听 Vue Router 路由变化并自动响应
- ✅ **按钮注入** - 在特定路由下动态插入自定义功能按钮
- ✅ **调试支持** - 提供完整的调试接口和日志输出

### 技术特性

- 🔧 **TypeScript** - 完整的类型安全支持
- ⚡ **性能优化** - 使用 WeakSet 避免重复处理，不可枚举属性避免序列化问题
- 🛡️ **错误处理** - 完善的错误处理和优雅降级
- 🔍 **调试友好** - 详细的日志输出和全局调试函数

## 🎯 使用场景

### 开发调试

```javascript
// 获取任意元素的 Vue 实例
const element = document.querySelector(".some-component");
const vueInstance = window.getVueInstance(element);
console.log("组件数据:", vueInstance.setupState);
```

### 功能增强

```javascript
// 在特定页面添加自定义按钮
window.buttonManager.addButton("button.target", {
  text: "自定义功能",
  onClick: () => {
    // 执行自定义逻辑
  },
});
```

### 路由监听

```javascript
// 监听路由变化
window.useRouterWatcher((to, from) => {
  console.log(`从 ${from?.path} 跳转到 ${to?.path}`);
});
```

## 🔧 开发环境

### 安装和运行

```bash
cd userscripts
pnpm install
pnpm dev    # 开发模式
pnpm build  # 构建生产版本
```

### 项目结构

```
userscripts/
├── src/
│   ├── main.ts                    # 入口文件
│   ├── app.ts                     # 应用主逻辑
│   └── utils/
│       ├── vnodeTraverser.ts      # VNode 遍历工具
│       ├── useRouterWatcher.ts    # 路由监听 Hook
│       └── buttonInjector.ts      # 按钮注入工具
├── docs/                          # 文档目录
└── dist/                          # 构建输出
```

## 🐛 问题反馈

如果在使用过程中遇到问题，请：

1. 查看 [故障排除](./README.md#故障排除) 部分
2. 检查浏览器控制台的错误信息
3. 使用全局调试函数进行诊断
4. 参考 [开发指南](./DEVELOPMENT.md) 中的调试技巧

## 📝 更新日志

### v1.0.0 (当前版本)

- ✅ 实现 VNode 遍历功能
- ✅ 实现路由监听 Hook
- ✅ 实现按钮注入系统
- ✅ 解决循环引用问题
- ✅ 添加完整的调试功能
- ✅ 优化代码结构和性能
- ✅ 完善文档和 API 参考

---

**最后更新时间**: 2024 年 12 月

**适用版本**: Vue 3.x + Vue Router 4.x

**目标网站**: https://zzz.seelie.me/*
