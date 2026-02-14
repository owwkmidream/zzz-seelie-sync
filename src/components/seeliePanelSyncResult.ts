import type { BatchSyncResult } from '@/utils/seelie';

export interface FullSyncResult {
  resinSync: boolean;
  characterSync: BatchSyncResult;
  itemsSync: boolean;
}

/**
 * 校验完整同步结果，不成功时抛出可展示的错误信息
 */
export function assertFullSyncSuccess(result: FullSyncResult): void {
  const { resinSync, characterSync, itemsSync } = result;
  const totalSuccess = resinSync && characterSync.success > 0 && itemsSync;

  if (totalSuccess) {
    return;
  }

  const errorMessages: string[] = [];

  if (!resinSync) errorMessages.push('电量同步失败');
  if (characterSync.success === 0) {
    const charErrors = characterSync.errors || ['角色同步失败'];
    errorMessages.push(...charErrors);
  }
  if (!itemsSync) errorMessages.push('养成材料同步失败');

  const errorMessage = errorMessages.length > 0
    ? errorMessages.join(', ')
    : '同步过程中出现错误';

  throw new Error(errorMessage);
}
