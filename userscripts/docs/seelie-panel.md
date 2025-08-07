# Seelie 面板组件

## 概述

Seelie 面板是一个集成在 ZZZ Seelie 网站底部的交互组件，为用户提供便捷的数据同步功能。

## 功能特性

### 用户信息显示

- **用户昵称**: 显示当前登录用户的游戏昵称
- **UID**: 显示用户的游戏 UID
- **错误提示**: 当用户信息加载失败时，在昵称位置显示红色错误信息

### 同步功能

- **同步全部按钮**: 一键同步所有游戏数据
- **加载动画**: 同步过程中显示旋转动画和状态文本
- **状态反馈**: 同步成功/失败的视觉反馈

### 设置功能

- **设置按钮**: 快速访问脚本设置（待实现）

## 技术实现

### 组件架构

```typescript
export class SeeliePanel {
  private container: HTMLDivElement | null = null;
  private userInfo: UserInfo | null = null;
  private isLoading = false;
}
```

### 样式设计

- 使用 Tailwind CSS 类名保持与页面风格一致
- 响应式设计，适配不同屏幕尺寸
- 深色主题，与 Seelie 网站整体风格匹配

### 自动初始化

- 页面加载完成后自动创建面板
- 监听页面变化，确保路由切换后面板仍然存在
- 自动获取用户信息并显示

## 使用方法

### 安装脚本

1. 构建项目：`pnpm run build`
2. 安装生成的 `dist/zzz-seelie-sync.user.js` 文件
3. 访问 https://zzz.seelie.me/ 即可看到面板

### 面板位置

面板会自动插入到页面底部的用户信息区域顶部，具体位置为：

```html
<div class="flex flex-col items-center justify-center w-full mt-3">
  <!-- Seelie 面板会插入到这里 -->
  <div data-seelie-panel="true">...</div>
  <!-- 原有的 Account 4、语言选择等内容 -->
</div>
```

## 开发说明

### 文件结构

```
userscripts/src/components/
└── SeeliePanel.ts          # 面板组件主文件
```

### 依赖关系

- `@/api/hoyo`: 用户信息获取
- `@logger`: 日志输出
- Tailwind CSS: 样式框架

### 扩展开发

如需添加新功能，可以：

1. 在 `SeeliePanel` 类中添加新方法
2. 在 `createPanelElement()` 中添加新的 UI 元素
3. 绑定相应的事件处理器

## 故障排除

### 面板未显示

1. 检查控制台是否有错误信息
2. 确认目标容器是否存在
3. 检查用户信息是否正确获取

### 用户信息加载失败

1. 检查米哈游 API 连接状态
2. 确认 Cookie 是否有效
3. 查看网络请求是否被拦截

### 样式显示异常

1. 确认页面已加载 Tailwind CSS
2. 检查是否有样式冲突
3. 验证 CSS 类名是否正确

## 更新日志

### v1.0.0

- 初始版本发布
- 基础用户信息显示
- 同步全部功能（测试版本）
- 设置按钮占位
