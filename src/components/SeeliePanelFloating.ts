/**
 * 悬浮窗宿主
 *
 * 站点改版导致侧边栏挂载点消失时，面板会注入失败。
 * 这里提供一个不依赖站点 DOM 的兜底容器：直接挂到 body，可拖拽、可关闭。
 */

import { logger } from '@logger';
import { SeeliePanel } from './SeeliePanel';
import { ensurePanelStyles } from './zssPanelStyles';

const FLOATING_HOST_ID = 'ZSS-floating-host';
const POSITION_STORAGE_KEY = 'seelie_floating_panel_position';

interface FloatingPosition {
  left: number;
  top: number;
}

let hostElement: HTMLDivElement | null = null;
let panelInstance: SeeliePanel | null = null;
let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

function readPosition(): FloatingPosition | null {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<FloatingPosition>;
    if (typeof parsed?.left !== 'number' || typeof parsed?.top !== 'number') {
      return null;
    }

    return { left: parsed.left, top: parsed.top };
  } catch (error) {
    logger.warn('读取悬浮窗位置失败，使用默认位置:', error);
    return null;
  }
}

function writePosition(position: FloatingPosition): void {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch (error) {
    logger.warn('保存悬浮窗位置失败:', error);
  }
}

/**
 * 约束到可视区域内，避免窗口拖出屏幕后再也点不到
 */
function clampPosition(position: FloatingPosition, host: HTMLElement): FloatingPosition {
  const width = host.offsetWidth || 300;
  const height = host.offsetHeight || 200;
  const maxLeft = Math.max(0, window.innerWidth - width);
  const maxTop = Math.max(0, window.innerHeight - height);

  return {
    left: Math.min(Math.max(0, position.left), maxLeft),
    top: Math.min(Math.max(0, position.top), maxTop),
  };
}

function applyPosition(host: HTMLDivElement, position: FloatingPosition): void {
  const clamped = clampPosition(position, host);
  host.style.left = `${clamped.left}px`;
  host.style.top = `${clamped.top}px`;
  host.style.right = 'auto';
  host.style.bottom = 'auto';
}

function setupDrag(host: HTMLDivElement, handle: HTMLElement): void {
  let pointerId: number | null = null;
  let offsetX = 0;
  let offsetY = 0;

  const onPointerMove = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) {
      return;
    }

    applyPosition(host, {
      left: event.clientX - offsetX,
      top: event.clientY - offsetY,
    });
  };

  const onPointerUp = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) {
      return;
    }

    pointerId = null;
    handle.classList.remove('ZSS-floating-dragging');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    writePosition({
      left: Number.parseFloat(host.style.left) || 0,
      top: Number.parseFloat(host.style.top) || 0,
    });
  };

  handle.addEventListener('pointerdown', (event) => {
    // 只响应左键/触摸，且避开关闭按钮
    if (event.button !== 0 || (event.target as HTMLElement).closest('.ZSS-floating-close')) {
      return;
    }

    const rect = host.getBoundingClientRect();
    pointerId = event.pointerId;
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    handle.classList.add('ZSS-floating-dragging');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    event.preventDefault();
  });
}

function createHost(): HTMLDivElement {
  const host = document.createElement('div');
  host.id = FLOATING_HOST_ID;
  host.className = 'ZSS-floating-host';
  host.setAttribute('role', 'dialog');
  host.setAttribute('aria-label', 'ZZZ Seelie Sync 同步面板');

  const header = document.createElement('div');
  header.className = 'ZSS-floating-header';

  const title = document.createElement('span');
  title.className = 'ZSS-floating-title';
  title.textContent = 'Seelie Sync';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'ZSS-floating-close';
  closeButton.setAttribute('aria-label', '关闭同步面板');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    closeFloatingPanel();
  });

  header.appendChild(title);
  header.appendChild(closeButton);

  const body = document.createElement('div');
  body.className = 'ZSS-floating-body';

  host.appendChild(header);
  host.appendChild(body);

  setupDrag(host, header);

  return host;
}

/**
 * 悬浮窗是否已打开
 */
export function isFloatingPanelOpen(): boolean {
  return hostElement !== null && hostElement.isConnected;
}

/**
 * 打开悬浮窗（已打开时只做聚焦）
 */
export async function openFloatingPanel(): Promise<void> {
  if (isFloatingPanelOpen()) {
    hostElement?.classList.add('ZSS-floating-highlight');
    setTimeout(() => hostElement?.classList.remove('ZSS-floating-highlight'), 600);
    return;
  }

  ensurePanelStyles();

  const host = createHost();
  hostElement = host;
  document.body.appendChild(host);

  const savedPosition = readPosition();
  if (savedPosition) {
    applyPosition(host, savedPosition);
  }

  const body = host.querySelector('.ZSS-floating-body') as HTMLDivElement;

  try {
    const panel = new SeeliePanel({ mountHost: body });
    panelInstance = panel;
    await panel.init();
  } catch (error) {
    logger.error('❌ 悬浮窗面板初始化失败:', error);
    closeFloatingPanel();
    throw error;
  }

  keydownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeFloatingPanel();
    }
  };
  window.addEventListener('keydown', keydownHandler);

  logger.info('✅ 悬浮同步面板已打开');
}

/**
 * 关闭悬浮窗
 */
export function closeFloatingPanel(): void {
  if (panelInstance) {
    panelInstance.destroy();
    panelInstance = null;
  }

  if (hostElement) {
    hostElement.remove();
    hostElement = null;
  }

  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
}

/**
 * 开关悬浮窗
 */
export async function toggleFloatingPanel(): Promise<void> {
  if (isFloatingPanelOpen()) {
    closeFloatingPanel();
    return;
  }

  await openFloatingPanel();
}
