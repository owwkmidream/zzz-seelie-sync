/**
 * 设置面板视图 — 深色主题 UI
 *
 * 职责：
 *  1. 注入一次性自定义样式（toggle 开关、动画）
 *  2. 提供「设置入口按钮」工厂函数
 *  3. 提供「设置 Modal」工厂函数
 */

import {
  getAdCleanerEnabled,
  isAdCleanerSettingAvailable,
} from '@/utils/adCleanerMenu';

// ─── 常量 ───────────────────────────────────────────

const SETTINGS_STYLE_ID = 'ZSS-settings-style';

// ─── 注入全局样式（仅执行一次） ────────────────────────

function ensureSettingsStyles(): void {
  if (document.getElementById(SETTINGS_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SETTINGS_STYLE_ID;
  style.textContent = `
/* ── 设置入口按钮 ── */
.ZSS-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 20px;
  border-radius: 6px;
  border: 1px solid #dbe1eb33;
  background: rgba(49, 50, 77, 0.55);
  color: rgb(148 156 182);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  line-height: 1;
}
.ZSS-settings-btn:hover {
  color: rgb(255 255 255);
  border-color: #dbe1eb55;
  background: rgba(72, 75, 106, 0.8);
}
.ZSS-settings-btn .ZSS-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.ZSS-settings-btn:hover .ZSS-icon {
  transform: rotate(45deg);
}

/* ── icon 尺寸通用约束 ── */
.ZSS-icon {
  display: inline-block;
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(.4,0,.2,1);
}

/* ── Modal overlay ── */
.ZSS-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
  transition: background 0.25s ease, backdrop-filter 0.25s ease;
}
.ZSS-modal-overlay.ZSS-open {
  background: rgba(7, 4, 21, 0.55);
  backdrop-filter: blur(4px);
}

/* ── Modal dialog ── */
.ZSS-modal-dialog {
  width: 100%;
  max-width: 380px;
  border-radius: 12px;
  border: 1px solid #dbe1eb33;
  background: rgb(31 30 54);
  box-shadow: 0 20px 50px rgba(0,0,0,0.45);
  overflow: hidden;
  transform: translateY(16px) scale(0.97);
  opacity: 0;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s ease;
}
.ZSS-modal-overlay.ZSS-open .ZSS-modal-dialog {
  transform: translateY(0) scale(1);
  opacity: 1;
}

/* ── Modal header ── */
.ZSS-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #dbe1eb1f;
}
.ZSS-modal-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: rgb(255 255 255);
}
.ZSS-modal-title .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgb(148 156 182);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ZSS-modal-close:hover {
  background: rgba(72, 75, 106, 0.65);
  color: rgb(255 255 255);
}
.ZSS-modal-close .ZSS-icon {
  width: 16px;
  height: 16px;
}

/* ── Modal body ── */
.ZSS-modal-body {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Setting card ── */
.ZSS-card {
  border-radius: 8px;
  border: 1px solid #dbe1eb26;
  background: rgba(49, 50, 77, 0.28);
  padding: 12px 14px;
}

/* ── Toggle row（带开关的设置行） ── */
.ZSS-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ZSS-toggle-row > .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-toggle-info {
  flex: 1;
  min-width: 0;
}
.ZSS-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: rgb(255 255 255);
  line-height: 1.3;
}
.ZSS-toggle-desc {
  font-size: 11px;
  color: rgb(148 156 182);
  margin-top: 2px;
  line-height: 1.4;
}

/* ── Toggle 开关 ── */
.ZSS-switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
}
.ZSS-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}
.ZSS-switch-track {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgb(72 75 106);
  transition: background 0.2s ease;
}
.ZSS-switch input:checked + .ZSS-switch-track {
  background: rgb(139 92 246);
}
.ZSS-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.25);
  transition: transform 0.2s cubic-bezier(.4,0,.2,1);
}
.ZSS-switch input:checked ~ .ZSS-switch-knob {
  transform: translateX(16px);
}

/* ── Action row（带按钮的设置行） ── */
.ZSS-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ZSS-action-row > .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-action-btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(255 255 255);
  background: rgba(49, 50, 77, 0.6);
  border: 1px solid #dbe1eb33;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.ZSS-action-btn:hover {
  border-color: #dbe1eb55;
  color: rgb(255 255 255);
  background: rgba(72, 75, 106, 0.85);
}
.ZSS-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── uBlock section ── */
.ZSS-ublock-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  margin-top: 10px;
  padding: 7px 0;
}
.ZSS-ublock-copy.is-loading {
  opacity: 0.7;
  cursor: wait;
}
.ZSS-ublock-copy.is-success {
  border-color: #22c55e;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
}
.ZSS-ublock-copy.is-success:hover {
  border-color: #22c55e;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
}
.ZSS-ublock-copy.is-error {
  border-color: #f59e0b;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.12);
}
.ZSS-ublock-copy.is-error:hover {
  border-color: #f59e0b;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.12);
}
.ZSS-ublock-copy .ZSS-icon {
  width: 13px;
  height: 13px;
}

/* ── Modal footer ── */
.ZSS-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 18px;
  border-top: 1px solid #dbe1eb1f;
}
.ZSS-modal-footer-btn {
  padding: 5px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(255 255 255);
  background: rgba(49, 50, 77, 0.6);
  border: 1px solid #dbe1eb33;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.ZSS-modal-footer-btn:hover {
  border-color: #dbe1eb55;
  color: rgb(255 255 255);
  background: rgba(72, 75, 106, 0.85);
}
  `;

  (document.head || document.documentElement).appendChild(style);
}

// ─── 工具：创建固定尺寸 SVG 图标 ─────────────────────

function icon(svg: string): string {
  return `<span class="ZSS-icon">${svg}</span>`;
}

const SVG = {
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,

  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,

  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,

  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,

  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,

  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`,
} as const;

// ─── 公开接口 ────────────────────────────────────────

export interface SettingsModalActions {
  onToggleAdCleaner: (enabled: boolean) => void;
  onCopyUBlockRules: () => Promise<boolean>;
  onResetDevice: () => Promise<void>;
  onClose: () => void;
}

/**
 * 创建设置入口按钮
 */
export function createSettingsButton(onClick: () => void): HTMLButtonElement {
  ensureSettingsStyles();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ZSS-settings-btn';
  btn.innerHTML = `${icon(SVG.gear)}<span>设置</span>`;
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * 创建设置 Modal
 */
export function createSettingsModalView(actions: SettingsModalActions): HTMLDivElement {
  ensureSettingsStyles();

  // ── overlay
  const overlay = document.createElement('div');
  overlay.className = 'ZSS-modal-overlay';
  overlay.setAttribute('data-seelie-settings-modal', 'true');

  // ── dialog
  const dialog = document.createElement('div');
  dialog.className = 'ZSS-modal-dialog';

  // ── header
  const header = document.createElement('div');
  header.className = 'ZSS-modal-header';

  const title = document.createElement('div');
  title.className = 'ZSS-modal-title';
  title.innerHTML = `${icon(SVG.gear)}脚本设置`;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ZSS-modal-close';
  closeBtn.innerHTML = icon(SVG.close);
  closeBtn.addEventListener('click', actions.onClose);

  header.append(title, closeBtn);

  // ── body
  const body = document.createElement('div');
  body.className = 'ZSS-modal-body';

  // 广告相关设置 — 仅目标站点显示
  if (isAdCleanerSettingAvailable()) {
    body.append(
      buildAdCleanerCard(actions),
      buildUBlockCard(actions),
    );
  }

  // 重置设备 — 始终显示
  body.appendChild(buildResetDeviceCard(actions));

  // ── footer
  const footer = document.createElement('div');
  footer.className = 'ZSS-modal-footer';

  const footerBtn = document.createElement('button');
  footerBtn.type = 'button';
  footerBtn.className = 'ZSS-modal-footer-btn';
  footerBtn.textContent = '关闭';
  footerBtn.addEventListener('click', actions.onClose);
  footer.appendChild(footerBtn);

  // ── assemble
  dialog.append(header, body, footer);
  overlay.appendChild(dialog);

  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) actions.onClose();
  });
  dialog.addEventListener('click', (e) => e.stopPropagation());

  // 入场动画
  requestAnimationFrame(() => overlay.classList.add('ZSS-open'));

  return overlay;
}

// ─── 内部构建 ────────────────────────────────────────

function buildAdCleanerCard(actions: SettingsModalActions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'ZSS-card';

  const row = document.createElement('div');
  row.className = 'ZSS-toggle-row';

  const iconEl = document.createElement('span');
  iconEl.className = 'ZSS-icon';
  iconEl.innerHTML = SVG.shield;

  const info = document.createElement('div');
  info.className = 'ZSS-toggle-info';

  const label = document.createElement('div');
  label.className = 'ZSS-toggle-label';
  label.textContent = '脚本去广告';

  const desc = document.createElement('div');
  desc.className = 'ZSS-toggle-desc';
  desc.textContent = '关闭后将停止脚本内的去广告逻辑';

  info.append(label, desc);

  const toggle = document.createElement('label');
  toggle.className = 'ZSS-switch';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = getAdCleanerEnabled();
  input.addEventListener('change', () => actions.onToggleAdCleaner(input.checked));

  const track = document.createElement('span');
  track.className = 'ZSS-switch-track';

  const knob = document.createElement('span');
  knob.className = 'ZSS-switch-knob';

  toggle.append(input, track, knob);

  row.append(iconEl, info, toggle);
  card.appendChild(row);

  return card;
}

function buildUBlockCard(actions: SettingsModalActions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'ZSS-card';

  const row = document.createElement('div');
  row.className = 'ZSS-action-row';

  const iconEl = document.createElement('span');
  iconEl.className = 'ZSS-icon';
  iconEl.innerHTML = SVG.filter;

  const info = document.createElement('div');
  info.className = 'ZSS-toggle-info';

  const label = document.createElement('div');
  label.className = 'ZSS-toggle-label';
  label.textContent = 'uBlock Origin 规则';

  const desc = document.createElement('div');
  desc.className = 'ZSS-toggle-desc';
  desc.textContent = '复制到「我的过滤器」，在浏览器层拦截广告';
  info.append(label, desc);

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'ZSS-action-btn ZSS-ublock-copy';
  copyBtn.innerHTML = `${icon(SVG.copy)}<span class="ZSS-ublock-copy-text">复制规则到剪贴板</span>`;
  const copyText = copyBtn.querySelector('.ZSS-ublock-copy-text') as HTMLSpanElement;
  let resetTimer: number | null = null;

  const setCopyButtonState = (state: 'idle' | 'loading' | 'success' | 'error'): void => {
    copyBtn.classList.remove('is-loading', 'is-success', 'is-error');
    copyBtn.disabled = false;

    if (state === 'loading') {
      copyBtn.classList.add('is-loading');
      copyBtn.disabled = true;
      copyText.textContent = '复制中…';
      return;
    }

    if (state === 'success') {
      copyBtn.classList.add('is-success');
      copyText.textContent = '已复制';
      return;
    }

    if (state === 'error') {
      copyBtn.classList.add('is-error');
      copyText.textContent = '复制失败';
      return;
    }

    copyText.textContent = '复制规则到剪贴板';
  };

  copyBtn.addEventListener('click', async () => {
    if (resetTimer !== null) {
      window.clearTimeout(resetTimer);
      resetTimer = null;
    }

    setCopyButtonState('loading');

    try {
      const copied = await actions.onCopyUBlockRules();
      setCopyButtonState(copied ? 'success' : 'error');
    } catch {
      setCopyButtonState('error');
    }

    resetTimer = window.setTimeout(() => {
      setCopyButtonState('idle');
      resetTimer = null;
    }, 1800);
  });

  row.append(iconEl, info);
  card.append(row, copyBtn);
  return card;
}

function buildResetDeviceCard(actions: SettingsModalActions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'ZSS-card';

  const row = document.createElement('div');
  row.className = 'ZSS-action-row';

  const iconEl = document.createElement('span');
  iconEl.className = 'ZSS-icon';
  iconEl.innerHTML = SVG.refresh;

  const info = document.createElement('div');
  info.className = 'ZSS-toggle-info';

  const label = document.createElement('div');
  label.className = 'ZSS-toggle-label';
  label.textContent = '重置设备信息';

  const desc = document.createElement('div');
  desc.className = 'ZSS-toggle-desc';
  desc.textContent = '同步遇到 1034 设备异常时使用';

  info.append(label, desc);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ZSS-action-btn';
  btn.textContent = '重置';
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = '重置中…';
    try {
      await actions.onResetDevice();
    } finally {
      btn.disabled = false;
      btn.textContent = '重置';
    }
  });

  row.append(iconEl, info, btn);
  card.appendChild(row);

  return card;
}
