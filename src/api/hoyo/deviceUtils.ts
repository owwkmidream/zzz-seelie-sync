/**
 * 生成产品名称 (6位大写字母数字组合)
 */
export function generateProductName(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * 生成 UUID v4 字符串 (带连字符格式)
 */
export function generateUUID(): string {
  // 使用 crypto.randomUUID() 如果可用（现代浏览器）
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 回退方案：手动生成 UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成 Seed ID (16位十六进制字符串，对齐 C# 版本)
 */
export function generateSeedId(): string {
  return generateHexString(16);
}

/**
 * 生成指定长度的十六进制字符串 (对齐 C# 版本的随机生成逻辑)
 */
export function generateHexString(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));

  // 使用 crypto.getRandomValues() 如果可用
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // 回退方案：使用 Math.random()
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // 转换为十六进制字符串
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

  // 如果需要奇数长度，截取到指定长度
  return hex.substring(0, length);
}
