// 米哈游绝区零API通用工具函数

import { ensureUserInfo, getUserInfo } from './client';

/**
 * 获取用户信息的通用处理函数
 * 如果提供了 uid，直接使用；否则从缓存获取
 * @param uid 用户提供的UID
 * @param region 用户提供的区域
 * @returns 处理后的用户信息
 */
export async function resolveUserInfo(
  uid?: string | number,
  region?: string
): Promise<{ uid: string; region: string }> {
  // 如果提供了 uid，直接使用
  if (uid) {
    return {
      uid: String(uid),
      region: region || 'prod_gf_cn'
    };
  }

  // 如果没有提供 uid，确保用户信息已初始化并使用缓存的用户信息
  await ensureUserInfo();
  const userInfoCache = getUserInfo();

  if (userInfoCache) {
    return {
      uid: userInfoCache.uid,
      region: region || userInfoCache.region
    };
  }

  throw new Error('❌ 未提供 UID 且无法从缓存获取用户信息，请确保已登录米游社');
}

/**
 * 分批处理数组的通用函数
 * @param items 要处理的数组
 * @param batchSize 每批的大小
 * @param processor 处理函数，接收一批数据并返回处理结果
 * @returns 所有批次的处理结果合并后的数组
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  if (items.length <= batchSize) {
    return processor(items);
  }

  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const batchPromises = batches.map(batch => processor(batch));
  const batchResults = await Promise.all(batchPromises);
  return batchResults.flat();
}