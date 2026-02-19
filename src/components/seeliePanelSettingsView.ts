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

const SETTINGS_STYLE_ID = 'seelie-settings-style';

// ─── 注入全局样式（仅执行一次） ────────────────────────

function ensureSettingsStyles(): void {
  if (document.getElementById(SETTINGS_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SETTINGS_STYLE_ID;
  style.textContent = `
/* ── 设置入口按钮 ── */
.seelie-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 20px;
  border-radius: 6px;
  border: 1px solid rgba(75, 85, 99, 0.6);
  background: rgba(31, 41, 55, 0.8);
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  line-height: 1;
}
.seelie-settings-btn:hover {
  color: #c7d2fe;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(49, 46, 89, 0.5);
}
.seelie-settings-btn .seelie-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.seelie-settings-btn:hover .seelie-icon {
  transform: rotate(45deg);
}

/* ── icon 尺寸通用约束 ── */
.seelie-icon {
  display: inline-block;
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(.4,0,.2,1);
}

/* ── Modal overlay ── */
.seelie-modal-overlay {
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
.seelie-modal-overlay.seelie-open {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* ── Modal dialog ── */
.seelie-modal-dialog {
  width: 100%;
  max-width: 380px;
  border-radius: 12px;
  border: 1px solid #374151;
  background: #111827;
  box-shadow: 0 20px 50px rgba(0,0,0,0.45);
  overflow: hidden;
  transform: translateY(16px) scale(0.97);
  opacity: 0;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s ease;
}
.seelie-modal-overlay.seelie-open .seelie-modal-dialog {
  transform: translateY(0) scale(1);
  opacity: 1;
}

/* ── Modal header ── */
.seelie-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #1f2937;
}
.seelie-modal-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: #f3f4f6;
}
.seelie-modal-title .seelie-icon {
  width: 16px;
  height: 16px;
  color: #818cf8;
}
.seelie-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.seelie-modal-close:hover {
  background: #1f2937;
  color: #e5e7eb;
}
.seelie-modal-close .seelie-icon {
  width: 16px;
  height: 16px;
}

/* ── Modal body ── */
.seelie-modal-body {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Setting card ── */
.seelie-card {
  border-radius: 8px;
  border: 1px solid #1f2937;
  background: #1a2233;
  padding: 12px 14px;
}

/* ── Toggle row（带开关的设置行） ── */
.seelie-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.seelie-toggle-row > .seelie-icon {
  width: 16px;
  height: 16px;
  color: #818cf8;
}
.seelie-toggle-info {
  flex: 1;
  min-width: 0;
}
.seelie-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: #e5e7eb;
  line-height: 1.3;
}
.seelie-toggle-desc {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.4;
}

/* ── Toggle 开关 ── */
.seelie-switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
}
.seelie-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}
.seelie-switch-track {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: #374151;
  transition: background 0.2s ease;
}
.seelie-switch input:checked + .seelie-switch-track {
  background: #6366f1;
}
.seelie-switch-knob {
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
.seelie-switch input:checked ~ .seelie-switch-knob {
  transform: translateX(16px);
}

/* ── Action row（带按钮的设置行） ── */
.seelie-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.seelie-action-row > .seelie-icon {
  width: 16px;
  height: 16px;
  color: #818cf8;
}
.seelie-action-btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #d1d5db;
  background: transparent;
  border: 1px solid #374151;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.seelie-action-btn:hover {
  border-color: #6366f1;
  color: #c7d2fe;
  background: rgba(99, 102, 241, 0.08);
}
.seelie-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── uBlock section ── */
.seelie-ublock-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.seelie-ublock-header .seelie-icon {
  width: 14px;
  height: 14px;
  color: #818cf8;
}
.seelie-ublock-title {
  font-size: 13px;
  font-weight: 500;
  color: #e5e7eb;
}
.seelie-ublock-desc {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 10px;
}
.seelie-ublock-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  padding: 7px 0;
  font-size: 12px;
  font-weight: 500;
  color: #d1d5db;
  background: transparent;
  border: 1px solid #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.seelie-ublock-copy:hover {
  border-color: #6366f1;
  color: #c7d2fe;
  background: rgba(99, 102, 241, 0.08);
}
.seelie-ublock-copy .seelie-icon {
  width: 13px;
  height: 13px;
}
.seelie-ublock-textarea {
  display: block;
  width: 100%;
  height: 90px;
  margin-top: 8px;
  padding: 8px 10px;
  font-size: 11px;
  font-family: ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
  line-height: 1.6;
  color: #9ca3af;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 6px;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.seelie-ublock-textarea:focus {
  border-color: #4f46e5;
}

/* ── Modal footer ── */
.seelie-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 18px;
  border-top: 1px solid #1f2937;
}
.seelie-modal-footer-btn {
  padding: 5px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #d1d5db;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.seelie-modal-footer-btn:hover {
  border-color: #4b5563;
  color: #f3f4f6;
}
  `;

  (document.head || document.documentElement).appendChild(style);
}

// ─── 工具：创建固定尺寸 SVG 图标 ─────────────────────

function icon(svg: string): string {
  return `<span class="seelie-icon">${svg}</span>`;
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
  onCopyUBlockRules: () => Promise<void>;
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
  btn.className = 'seelie-settings-btn';
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
  overlay.className = 'seelie-modal-overlay';
  overlay.setAttribute('data-seelie-settings-modal', 'true');

  // ── dialog
  const dialog = document.createElement('div');
  dialog.className = 'seelie-modal-dialog';

  // ── header
  const header = document.createElement('div');
  header.className = 'seelie-modal-header';

  const title = document.createElement('div');
  title.className = 'seelie-modal-title';
  title.innerHTML = `${icon(SVG.gear)}脚本设置`;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'seelie-modal-close';
  closeBtn.innerHTML = icon(SVG.close);
  closeBtn.addEventListener('click', actions.onClose);

  header.append(title, closeBtn);

  // ── body
  const body = document.createElement('div');
  body.className = 'seelie-modal-body';

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
  footer.className = 'seelie-modal-footer';

  const footerBtn = document.createElement('button');
  footerBtn.type = 'button';
  footerBtn.className = 'seelie-modal-footer-btn';
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
  requestAnimationFrame(() => overlay.classList.add('seelie-open'));

  return overlay;
}

// ─── 内部构建 ────────────────────────────────────────

function buildAdCleanerCard(actions: SettingsModalActions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'seelie-card';

  const row = document.createElement('div');
  row.className = 'seelie-toggle-row';

  const iconEl = document.createElement('span');
  iconEl.className = 'seelie-icon';
  iconEl.innerHTML = SVG.shield;

  const info = document.createElement('div');
  info.className = 'seelie-toggle-info';

  const label = document.createElement('div');
  label.className = 'seelie-toggle-label';
  label.textContent = '脚本去广告';

  const desc = document.createElement('div');
  desc.className = 'seelie-toggle-desc';
  desc.textContent = '关闭后将停止脚本内的去广告逻辑';

  info.append(label, desc);

  const toggle = document.createElement('label');
  toggle.className = 'seelie-switch';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = getAdCleanerEnabled();
  input.addEventListener('change', () => actions.onToggleAdCleaner(input.checked));

  const track = document.createElement('span');
  track.className = 'seelie-switch-track';

  const knob = document.createElement('span');
  knob.className = 'seelie-switch-knob';

  toggle.append(input, track, knob);

  row.append(iconEl, info, toggle);
  card.appendChild(row);

  return card;
}

function buildUBlockCard(actions: SettingsModalActions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'seelie-card';

  const headerRow = document.createElement('div');
  headerRow.className = 'seelie-ublock-header';
  headerRow.innerHTML = `${icon(SVG.filter)}<span class="seelie-ublock-title">uBlock Origin 规则</span>`;

  const desc = document.createElement('div');
  desc.className = 'seelie-ublock-desc';
  desc.textContent = '复制规则到 uBlock Origin「我的过滤器」，在浏览器层面拦截广告。';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'seelie-ublock-copy';
  copyBtn.innerHTML = `${icon(SVG.copy)}<span>复制规则到剪贴板</span>`;

  copyBtn.addEventListener('click', () => {
    void actions.onCopyUBlockRules();
  });

  card.append(headerRow, desc, copyBtn);
  return card;
}

function buildResetDeviceCard(actions: SettingsModalActions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'seelie-card';

  const row = document.createElement('div');
  row.className = 'seelie-action-row';

  const iconEl = document.createElement('span');
  iconEl.className = 'seelie-icon';
  iconEl.innerHTML = SVG.refresh;

  const info = document.createElement('div');
  info.className = 'seelie-toggle-info';

  const label = document.createElement('div');
  label.className = 'seelie-toggle-label';
  label.textContent = '重置设备信息';

  const desc = document.createElement('div');
  desc.className = 'seelie-toggle-desc';
  desc.textContent = '同步遇到 1034 设备异常时使用';

  info.append(label, desc);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'seelie-action-btn';
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
