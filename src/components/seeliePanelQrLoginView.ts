/**
 * 扫码登录 Modal 视图
 * 以弹窗形式展示二维码并实时更新扫码状态
 */

import type { QRLoginData, QRLoginStatus } from '@/api/hoyo/types';
import * as QRCode from 'qrcode';
import { logger } from '@logger';

const QR_SIZE = 180;
const QR_ERROR_TEXT = '二维码加载失败，请重试';

const STATUS_TEXT: Record<QRLoginStatus, string> = {
  Created: '请使用米游社 App 扫描二维码',
  Scanned: '已扫码，请在手机上确认',
  Confirmed: '登录成功，正在刷新…',
};

// ─── SVG 图标 ────────────────────────────────────────

const SVG = {
  qrcode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h2v2h-2z"/><path d="M20 14h2v2h-2z"/><path d="M14 20h2v2h-2z"/><path d="M20 20h2v2h-2z"/><path d="M17 17h2v2h-2z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
} as const;

function icon(svg: string): string {
  return `<span class="ZSS-icon">${svg}</span>`;
}

// ─── 内部工具 ────────────────────────────────────────

export interface QRLoginViewElements {
  overlay: HTMLDivElement;
  qrImage: HTMLCanvasElement;
  statusText: HTMLDivElement;
}

function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function getNextRenderToken(canvas: HTMLCanvasElement): number {
  const current = Number(canvas.dataset.renderToken || '0');
  const next = current + 1;
  canvas.dataset.renderToken = String(next);
  return next;
}

function isRenderTokenCurrent(canvas: HTMLCanvasElement, token: number): boolean {
  return canvas.dataset.renderToken === String(token);
}

async function renderQRCode(elements: QRLoginViewElements, qrText: string): Promise<void> {
  const token = getNextRenderToken(elements.qrImage);
  clearCanvas(elements.qrImage);

  try {
    await QRCode.toCanvas(elements.qrImage, qrText, {
      width: QR_SIZE,
      margin: 1,
      errorCorrectionLevel: 'L',
    });
    if (!isRenderTokenCurrent(elements.qrImage, token)) return;
  } catch (error) {
    if (!isRenderTokenCurrent(elements.qrImage, token)) return;
    clearCanvas(elements.qrImage);
    elements.statusText.textContent = QR_ERROR_TEXT;
    elements.statusText.classList.remove('ZSS-qr-status--success');
    logger.error('二维码渲染失败:', error);
  }
}

// ─── 公开接口 ────────────────────────────────────────

/**
 * 创建扫码登录 Modal
 */
export function createQRLoginModal(
  qrData: QRLoginData,
  onCancel: () => void,
): QRLoginViewElements {
  // ── overlay
  const overlay = document.createElement('div');
  overlay.className = 'ZSS-modal-overlay';
  overlay.setAttribute('data-seelie-qr-modal', 'true');

  // ── dialog
  const dialog = document.createElement('div');
  dialog.className = 'ZSS-modal-dialog';

  // ── header
  const header = document.createElement('div');
  header.className = 'ZSS-modal-header';

  const title = document.createElement('div');
  title.className = 'ZSS-modal-title';
  title.innerHTML = `${icon(SVG.qrcode)}扫码登录`;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ZSS-modal-close';
  closeBtn.innerHTML = icon(SVG.close);
  closeBtn.addEventListener('click', onCancel);

  header.append(title, closeBtn);

  // ── body
  const body = document.createElement('div');
  body.className = 'ZSS-modal-body';
  body.style.alignItems = 'center';

  // 二维码画布
  const qrImage = document.createElement('canvas');
  qrImage.className = 'ZSS-qr-image';
  qrImage.width = QR_SIZE;
  qrImage.height = QR_SIZE;
  qrImage.setAttribute('aria-label', '扫码登录二维码');
  clearCanvas(qrImage);

  // 状态文本
  const statusText = document.createElement('div');
  statusText.className = 'ZSS-qr-status';
  statusText.textContent = STATUS_TEXT.Created;

  body.append(qrImage, statusText);

  // ── footer
  const footer = document.createElement('div');
  footer.className = 'ZSS-modal-footer';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'ZSS-modal-footer-btn';
  cancelButton.textContent = '取消';
  cancelButton.addEventListener('click', onCancel);
  footer.appendChild(cancelButton);

  // ── assemble
  dialog.append(header, body, footer);
  overlay.appendChild(dialog);

  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) onCancel();
  });
  dialog.addEventListener('click', (e) => e.stopPropagation());

  // 入场动画
  requestAnimationFrame(() => overlay.classList.add('ZSS-open'));

  const elements: QRLoginViewElements = { overlay, qrImage, statusText };
  void renderQRCode(elements, qrData.url);
  return elements;
}

/** 更新状态文本 */
export function updateQRLoginStatus(
  elements: QRLoginViewElements,
  status: QRLoginStatus,
): void {
  elements.statusText.textContent = STATUS_TEXT[status] || status;

  if (status === 'Confirmed') {
    elements.statusText.classList.add('ZSS-qr-status--success');
  }
}

/** 刷新二维码（过期后重新生成） */
export function refreshQRCode(
  elements: QRLoginViewElements,
  newData: QRLoginData,
): void {
  elements.statusText.textContent = STATUS_TEXT.Created;
  elements.statusText.classList.remove('ZSS-qr-status--success');
  void renderQRCode(elements, newData.url);
}
