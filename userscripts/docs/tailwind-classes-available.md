# Seelie 网站可用的 Tailwind CSS 类

> 基于 `index-5f65299a.css` 分析，这些是网站中实际可用的 Tailwind 类，脚本开发时应优先使用这些类。

## 布局 (Layout)

### 容器

- `.container`, `.!container`
- 响应式断点: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### 定位

- `.relative`, `.absolute`, `.fixed`, `.sticky`
- `.inset-0`, `.inset-x-0`, `.inset-y-0`
- `.top-0`, `.top-3`, `.top-6`, `.top-[10px]`, `.top-[7px]`
- `.bottom-0`, `.left-0`, `.right-0`
- `.z-0` 到 `.z-50`, `.z-[999]`, `.z-[9999]`, `.z-[99999]`, `.z-[1110]`

### 显示

- `.block`, `.inline-block`, `.inline`, `.flex`, `.inline-flex`
- `.table`, `.grid`, `.hidden`
- `.visible`, `.invisible`

## 尺寸 (Sizing)

### 宽度

- `.w-0` 到 `.w-72`
- `.w-1/2`, `.w-3/12`, `.w-4/12`, `.w-6/12`, `.w-8/12`
- `.w-[170px]`, `.w-[200px]`, `.w-[240px]`, `.w-[245px]`
- `.w-auto`, `.w-full`, `.w-max`
- `.min-w-[250px]`, `.min-w-max`
- `.max-w-14`, `.max-w-64`, `.max-w-[300px]`, `.max-w-[600px]`, `.max-w-xs`

### 高度

- `.h-1` 到 `.h-28`
- `.h-[250px]`, `.h-[48px]`
- `.h-auto`, `.h-full`, `.h-screen`
- `.min-h-8`, `.min-h-[5rem]`, `.min-h-screen`
- `.max-h-0`, `.max-h-[300px]`, `.max-h-screen`

## 间距 (Spacing)

### 外边距

- `.m-1` 到 `.m-4`, `.m-[0.1rem]`, `.m-px`
- `.mx-1` 到 `.mx-10`, `.mx-auto`, `.mx-px`
- `.my-1` 到 `.my-8`, `.my-px`
- `.mt-0` 到 `.mt-10`, `.mt-auto`, `.mt-px`
- `.mb-0` 到 `.mb-5`, `.mb-auto`, `.mb-px`
- `.ml-0.5` 到 `.ml-4`, `.ml-auto`, `.ml-px`
- `.mr-1` 到 `.mr-16`, `.mr-px`
- 负边距: `.-m-1`, `.-m-2`, `.-mx-1` 到 `.-mx-6`, `.-my-1`, `.-my-2`

### 内边距

- `.p-0` 到 `.p-4`, `.p-[1px]`, `.p-[2px]`, `.p-px`
- `.px-0` 到 `.px-6`, `.px-[.4rem]`, `.px-[0.35rem]`
- `.py-0.5` 到 `.py-16`, `.py-[.15rem]`, `.py-[.1rem]`, `.py-px`
- `.pt-16`, `.pt-20`, `.pt-[6.25rem]`
- `.pb-2` 到 `.pb-6`
- `.pl-1` 到 `.pl-4`, `.pl-[.1rem]`, `.pl-px`
- `.pr-1` 到 `.pr-8`, `.pr-[.1rem]`

### 间隙

- `.gap-0.5` 到 `.gap-4`
- `.gap-x-1` 到 `.gap-x-3`
- `.gap-y-1` 到 `.gap-y-6`
- `.space-x-1`, `.space-x-[0.2rem]`
- `.space-y-1`, `.space-y-2`

## Flexbox & Grid

### Flexbox

- `.flex-row`, `.flex-col`
- `.flex-wrap`
- `.items-start`, `.items-end`, `.items-center`, `.items-stretch`
- `.justify-start`, `.justify-end`, `.justify-center`, `.justify-between`, `.justify-around`
- `.self-start`
- `.shrink-0`

### Grid

- `.grid-cols-1`, `.grid-cols-2`
- `.grid-rows-2`
- `.col-span-2`
- `.grid-flow-col`
- `.justify-self-end`

## 背景 (Background)

### 背景色

- `.bg-black`, `.bg-white`, `.bg-transparent`
- `.bg-gray-200` 到 `.bg-gray-900`
- `.bg-red-400` 到 `.bg-red-900`
- `.bg-blue-500` 到 `.bg-blue-800`
- `.bg-green-500` 到 `.bg-green-900`
- `.bg-yellow-500` 到 `.bg-yellow-900`
- `.bg-purple-500` 到 `.bg-purple-950`
- `.bg-pink-500`, `.bg-pink-600`, `.bg-pink-800`
- `.bg-orange-500`, `.bg-orange-600`, `.bg-orange-700`
- `.bg-teal-500` 到 `.bg-teal-900`
- `.bg-indigo-600`

### 透明度背景

- `.bg-black/50`, `.bg-black/90`
- `.bg-gray-500/50` 到 `.bg-gray-900/80`
- `.bg-red-500/20` 到 `.bg-red-900/50`
- 其他颜色的透明度变体

### 自定义背景色

- `.bg-[#0e2da0]`, `.bg-[#3b4354]`, `.bg-[#6a6db6]`
- `.bg-[#d1204f]`, `.bg-[#d5761b]`
- `.bg-item`
- `.bg-epic-550`, `.bg-legendary-550`
- `.bg-rank-a`, `.bg-rank-b`, `.bg-rank-c`, `.bg-rank-s`

### 渐变

- `.bg-gradient-to-b`, `.bg-gradient-to-br`, `.bg-gradient-to-tl`
- `.from-*` 和 `.to-*` 类（各种颜色和透明度）

## 边框 (Border)

### 边框宽度

- `.border`, `.border-2`, `.!border`
- `.border-b`, `.border-b-2`, `.!border-b-2`
- `.border-l`, `.border-r`, `.border-t`
- `.border-none`

### 边框颜色

- `.border-white`, `.border-gray-200/20` 到 `.border-gray-700/50`
- `.border-blue-500/80`
- `.border-red-800/50`
- `.border-purple-500/20`, `.border-purple-500/70`
- `.border-orange-500`, `.border-yellow-400`
- `.border-pink-800`
- `.border-white/10`

### 边框圆角

- `.rounded`, `.rounded-md`, `.rounded-lg`, `.rounded-xl`, `.rounded-2xl`, `.rounded-3xl`
- `.rounded-full`, `.rounded-[50%]`
- `.rounded-l`, `.rounded-r`, `.rounded-l-md`, `.rounded-r-md`
- `.rounded-bl`, `.rounded-br`
- `.rounded-l-none`

## 文字 (Typography)

### 字体大小

- `.text-xs` 到 `.text-3xl`
- `.text-[.6rem]`, `.text-[0.6rem]`, `.text-[0.82rem]`, `.text-[0.84rem]`, `.text-[0.8rem]`
- `.!text-xs`, `.!text-sm`, `.!text-[.5rem]`

### 字体粗细

- `.font-normal`, `.font-semibold`, `.font-bold`

### 文字颜色

- `.text-white`, `.text-white/20`, `.text-white/50`
- `.text-gray-100/50` 到 `.text-gray-600/70`
- `.text-red-300` 到 `.text-red-500/70`
- `.text-blue-200`, `.text-blue-400`, `.text-blue-500`
- `.text-green-200` 到 `.text-green-500`
- `.text-yellow-200` 到 `.text-yellow-500`
- `.text-purple-100` 到 `.text-purple-400`
- `.text-pink-100`, `.text-pink-400`, `.text-pink-500`
- `.text-orange-400`, `.text-orange-500`

### 自定义文字颜色

- `.text-epic-550`, `.text-legendary-550`, `.text-rare-550`

### 文字对齐

- `.text-left`, `.text-center`, `.text-right`, `.text-start`

### 文字装饰

- `.underline`
- `.uppercase`, `.lowercase`
- `.italic`
- `.leading-none`, `.leading-tight`, `.leading-snug`, `.leading-5`
- `.tracking-tight`, `.tracking-wide`, `.tracking-wider`, `.tracking-widest`

### 文字处理

- `.truncate`, `.text-nowrap`
- `.line-clamp-2`

## 效果 (Effects)

### 阴影

- `.shadow`, `.shadow-sm`, `.shadow-md`, `.shadow-lg`, `.shadow-xl`
- `.shadow-gray-700/50`, `.shadow-indigo-500/20`

### 透明度

- `.opacity-0` 到 `.opacity-100`
- `.!opacity-40`, `.!opacity-100`

### 模糊和滤镜

- `.blur`, `.blur-sm`
- `.grayscale`
- `.filter`, `.!filter`

### 环形边框

- `.ring`, `.ring-2`, `.ring-[8px]`
- `.ring-gray-600/60`, `.ring-gray-900`
- `.ring-purple-500`, `.ring-purple-600/60`
- `.ring-red-500`, `.ring-yellow-500`
- `.!ring-0`

## 变换 (Transform)

### 平移

- `.translate-x-0` 到 `.translate-x-full`
- `.translate-x-[-50%]`
- `.translate-y-0` 到 `.translate-y-full`

### 旋转和缩放

- `.rotate-90`, `.rotate-180`
- `.scale-110`, `.scale-[.8]`
- `.transform`

## 交互 (Interactivity)

### 光标

- `.cursor-default`, `.cursor-pointer`, `.cursor-move`, `.cursor-not-allowed`

### 用户选择

- `.select-none`

### 调整大小

- `.resize`, `.resize-none`

### 指针事件

- `.pointer-events-none`, `.pointer-events-auto`

## 响应式和状态

### 悬停状态

- `.hover:bg-*`, `.hover:text-*`, `.hover:opacity-*`
- `.hover:visible`, `.hover:underline`, `.hover:shadow-lg`

### 焦点状态

- `.focus:outline-none`, `.focus:ring`, `.focus:ring-0`, `.focus:ring-2`
- `.focus:ring-white`, `.focus:ring-offset-*`

### 禁用状态

- `.disabled:opacity-*`, `.disabled:pointer-events-none`
- `.disabled:hover:bg-transparent`

### 组合状态

- `.group:hover .group-hover:opacity-75`

## 动画 (Animation)

### 过渡

- `.transition`, `.transition-all`, `.transition-colors`, `.transition-transform`
- `.duration-100` 到 `.duration-500`
- `.delay-150`
- `.ease-in`, `.ease-out`

### 动画

- `.animate-spin`

## 特殊类

### 自定义组件类

- `.item-wrapper`, `.item-container`, `.item-image`, `.item-name`
- `.absolute-tag`
- `.glass` (毛玻璃效果)
- `.link` (链接样式)

### 游戏相关

- `.bg-epic-550`, `.bg-legendary-550`, `.bg-rank-*`
- `.text-epic-550`, `.text-legendary-550`, `.text-rare-550`

### 滚动条

- `.custom-scrollbar` (自定义滚动条样式)

## 使用建议

1. **优先使用已存在的类**: 上述列出的类都是网站中实际可用的，使用这些类可以确保样式正确应用。

2. **避免使用不存在的类**: 如果需要使用上述列表中没有的 Tailwind 类，建议通过 CSS-in-JS 的方式动态注入样式。

3. **响应式设计**: 网站支持 `sm:`, `md:`, `lg:`, `xl:`, `2xl:` 断点，可以使用这些前缀创建响应式设计。

4. **颜色系统**: 网站主要使用灰色调 (gray-\*) 作为基础色，配合各种游戏相关的颜色 (epic, legendary, rare 等)。

5. **透明度**: 大量使用了带透明度的颜色类 (如 `/20`, `/50`, `/80` 等)，这些在创建层次感时很有用。

## 示例用法

```typescript
// 创建一个面板容器
const panel = document.createElement("div");
panel.className =
  "fixed top-6 right-0 z-50 bg-gray-800/90 border border-gray-600/50 rounded-lg p-4 shadow-lg";

// 创建按钮
const button = document.createElement("button");
button.className =
  "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors";

// 创建文本
const text = document.createElement("span");
text.className = "text-sm text-gray-300 font-semibold";
```
