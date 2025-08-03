# 文档目录

欢迎查看 Vue 3 VNode 遍历与路由监听脚本的完整文档。

## 📚 文档列表

### [README.md](./README.md) - 项目概述

- 项目介绍和功能概述
- 技术栈说明
- 核心功能详解
- 使用示例和配置说明
- 实际应用场景
- 性能考虑和故障排除

### [API.md](./API.md) - API 参考手册

- VNode 遍历 API 详解
- 路由监听 API 使用指南
- 按钮注入 API 参考
- 全局调试函数说明
- 类型定义和接口
- 错误处理最佳实践

### [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发指南

- 开发环境设置
- 项目架构说明
- 开发最佳实践
- 扩展开发指南
- 测试策略和调试技巧
- 部署和发布流程

## 🚀 快速开始

如果你是第一次使用这个脚本，建议按以下顺序阅读：

1. **[README.md](./README.md)** - 了解项目整体功能和使用方法
2. **[API.md](./API.md)** - 查看具体的 API 使用方法
3. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - 如果需要修改或扩展功能

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
