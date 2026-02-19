/**
 * 扫码登录 UI 视图
 * 在面板内展示二维码并实时更新扫码状态
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

interface QRLoginViewElements {
  container: HTMLDivElement;
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

/**
 * 创建扫码登录视图
 */
export function createQRLoginView(
  qrData: QRLoginData,
  onCancel: () => void,
): QRLoginViewElements {
  const container = document.createElement('div');
  container.className = 'ZSS-qr-container';

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

  // 操作区域
  const actions = document.createElement('div');
  actions.className = 'ZSS-qr-actions';

  const cancelButton = document.createElement('button');
  cancelButton.className = 'ZSS-action-button ZSS-action-button--retry-default';
  cancelButton.textContent = '取消';
  cancelButton.addEventListener('click', onCancel);

  actions.appendChild(cancelButton);

  container.appendChild(qrImage);
  container.appendChild(statusText);
  container.appendChild(actions);

  const elements: QRLoginViewElements = { container, qrImage, statusText };
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
