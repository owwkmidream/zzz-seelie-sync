// 按钮注入工具

/**
 * 在指定路由下插入自定义按钮
 * @param targetPath 目标路由路径
 * @param selector 目标元素选择器
 * @param buttonConfig 按钮配置
 */
export function injectButtonOnRoute(
  targetPath: string,
  selector: string,
  buttonConfig: {
    text?: string;
    className?: string;
    onClick?: () => void;
    position?: 'before' | 'after'; // 插入位置
  } = {}
) {
  const {
    className = '',
    onClick = () => console.log('🔘 自定义按钮被点击！'),
    position = 'after'
  } = buttonConfig;

  console.log(`🔍 尝试在路由 ${targetPath} 下插入按钮...`);

  // 查找目标元素
  const targetElement = document.querySelector(selector) as HTMLElement;
  if (!targetElement) {
    console.error(`❌ 未找到目标元素: ${selector}`);
    return null;
  }

  console.log('✓ 找到目标元素:', targetElement);

  // 检查是否已经插入过按钮（避免重复插入）
  const existingButton = targetElement.parentElement?.querySelector('.custom-injected-button') as HTMLElement;
  if (existingButton) {
    console.log('⚠️ 按钮已存在，跳过插入');
    return existingButton;
  }

  // 深度克隆目标元素作为按钮模板（包含所有子元素）
  const button = targetElement.cloneNode(true) as HTMLElement;
  button.className = `${targetElement.className} ${className} custom-injected-button`;

  // 添加绿色文字样式（Tailwind CSS）
  const greenClasses = ['text-green-400'];
  greenClasses.forEach(cls => {
    if (!button.classList.contains(cls)) {
      button.classList.add(cls);
    }
  });

  // 移除可能的冲突文字颜色样式
  const conflictClasses = ['text-gray-', 'text-blue-', 'text-red-', 'text-white', 'text-black'];
  conflictClasses.forEach(prefix => {
    Array.from(button.classList).forEach(cls => {
      if (cls.startsWith(prefix)) {
        button.classList.remove(cls);
      }
    });
  });

  // 添加点击事件
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });

  // 插入按钮
  if (position === 'after') {
    targetElement.parentElement?.insertBefore(button, targetElement.nextSibling);
  } else {
    targetElement.parentElement?.insertBefore(button, targetElement);
  }

  console.log('✅ 按钮插入成功:', button);
  return button;
}

/**
 * 移除所有注入的按钮
 */
export function removeInjectedButtons(): void {
  const buttons = document.querySelectorAll('.custom-injected-button');
  buttons.forEach(button => button.remove());
  console.log(`🧹 已移除 ${buttons.length} 个注入的按钮`);
}

/**
 * 路由特定的按钮管理器
 */
export class RouteButtonManager {
  private currentButtons: HTMLElement[] = [];

  /**
   * 清除当前所有按钮
   */
  clearButtons(): void {
    this.currentButtons.forEach(button => {
      if (button.parentElement) {
        button.remove();
      }
    });
    this.currentButtons = [];
    console.log('🧹 已清除当前路由的所有按钮');
  }

  /**
   * 在当前路由添加按钮
   */
  addButton(
    selector: string,
    config: Parameters<typeof injectButtonOnRoute>[2] = {}
  ): HTMLElement | null {
    const button = injectButtonOnRoute('', selector, config);
    if (button) {
      this.currentButtons.push(button);
    }
    return button;
  }

  /**
   * 路由变化时的处理
   */
  onRouteChange(currentPath: string): void {
    console.log(`🔄 路由变化到: ${currentPath}`);

    // 清除之前的按钮
    this.clearButtons();

    // 根据路由添加相应的按钮
    if (currentPath === '/planner') {
      console.log('📍 进入 planner 页面，准备插入按钮...');

      // 延迟一点确保页面元素已渲染
      setTimeout(() => {
        this.addButton('button.h-7.w-7', {
          className: 'ml-2',
          onClick: () => {
            console.log('🎉 Planner 页面的自定义按钮被点击了！');
            console.log('当前时间:', new Date().toLocaleString());
            console.log('页面标题:', document.title);
          }
        });
      }, 200);
    }
  }
}

// 将函数挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).injectButtonOnRoute = injectButtonOnRoute;
  (window as any).removeInjectedButtons = removeInjectedButtons;
  (window as any).RouteButtonManager = RouteButtonManager;
}