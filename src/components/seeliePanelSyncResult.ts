import type { BatchSyncResult } from '@/utils/seelie';

export interface FullSyncResult {
  resinSync: boolean;
  characterSync: BatchSyncResult;
  itemsSync: boolean;
  itemsPartial: boolean;
}

export type FullSyncStatus = 'success' | 'partial' | 'failed';

export interface FullSyncFeedback {
  status: FullSyncStatus;
  summary: string;
  details: string[];
}

function summarizeCharacterSync(characterSync: BatchSyncResult): {
  status: FullSyncStatus;
  summary: string;
} {
  const total = characterSync.total > 0 ? characterSync.total : characterSync.success + characterSync.failed;

  if (characterSync.success > 0 && characterSync.failed === 0) {
    return {
      status: 'success',
      summary: `角色同步成功（${characterSync.success}/${total}）`
    };
  }

  if (characterSync.success > 0) {
    return {
      status: 'partial',
      summary: `角色同步部分完成（成功 ${characterSync.success}，失败 ${characterSync.failed}）`
    };
  }

  return {
    status: 'failed',
    summary: '角色同步失败'
  };
}

/**
 * 构建完整同步反馈摘要，用于 UI 状态与日志输出
 */
export function buildFullSyncFeedback(result: FullSyncResult): FullSyncFeedback {
  const { resinSync, characterSync, itemsSync, itemsPartial } = result;
  const characterSummary = summarizeCharacterSync(characterSync);
  const itemsSummary = !itemsSync
    ? '养成材料同步失败'
    : itemsPartial
      ? '养成材料同步部分完成'
      : '养成材料同步成功';
  const details: string[] = [
    resinSync ? '电量同步成功' : '电量同步失败',
    characterSummary.summary,
    itemsSummary
  ];

  if (characterSync.errors.length > 0) {
    const topErrors = characterSync.errors.slice(0, 2).join('；');
    details.push(`角色错误摘要：${topErrors}`);
  }

  const allSuccess = resinSync && characterSummary.status === 'success' && itemsSync && !itemsPartial;
  const allFailed = !resinSync && characterSummary.status === 'failed' && !itemsSync;

  if (allSuccess) {
    return {
      status: 'success',
      summary: '完整同步成功',
      details
    };
  }

  if (allFailed) {
    return {
      status: 'failed',
      summary: '完整同步失败，请检查登录状态和网络后重试',
      details
    };
  }

  return {
    status: 'partial',
    summary: `完整同步部分完成：角色成功 ${characterSync.success}，失败 ${characterSync.failed}，养成材料${itemsSync ? (itemsPartial ? '部分完成' : '成功') : '失败'}`,
    details
  };
}
