/**
 * 劫持站点原生 SYNC 按钮
 *
 * 站点原生同步链路：
 *   按钮 → clickedSync() → 弹账号窗 → sync() → syncZZZ()
 *        → postMessage 向浏览器扩展取 cookie
 *        → gb.inmagi.com/cors 代理 → sg-public-api.hoyolab.com（国际服）
 *        → setCharGoal / setTalentGoal / setWeaponGoal → addGoal()
 *
 * 国服账号走不了这条链路，但**终点 addGoal() 和我们完全相同**。
 * 因此不在 postMessage 层伪造扩展应答（后面的国际服 URL 是写死的，改不动），
 * 而是直接替换组件的 clickedSync / sync 方法，让原生按钮跑我们的国服链路。
 * 弹窗、loading 转圈、Toast 等 UI 状态全部复用组件自身的响应式属性。
 */

import { logger } from './logger';
import { syncService } from '@/services/SyncService';
import {
  classifySyncComponent,
  collectSyncInstances,
  type SyncComponentKind,
  type VueInstance
} from './nativeSyncTree';

const HIJACK_FLAG = '__zssHijacked';

interface HijackStats {
  /** 扫描到的同步按钮组件数 */
  found: number;
  /** 本次新劫持的数量 */
  hijacked: number;
  /** 已劫持过、跳过的数量 */
  skipped: number;
  /** 方法替换失败的数量（proxy 不可写） */
  failed: number;
}

/**
 * 把 Seelie 角色 key 换成米哈游 avatar id
 *
 * 组件自身持有 characters 映射表（站点原生 syncZZZ 也用它做同样转换）
 */
function resolveAvatarId(proxy: Record<string, unknown>, characterKey: string): number | null {
  const characters = proxy.characters as Record<string, { id?: unknown }> | undefined;
  const id = characters?.[characterKey]?.id;

  if (typeof id === 'number') {
    return id;
  }
  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return Number(id);
  }

  return null;
}

/**
 * 构造替换用的 sync 实现，复用组件自身的 loading / error / 弹窗状态
 */
async function runResinSync(): Promise<void> {
  const ok = await syncService.syncResinData();
  if (!ok) {
    throw new Error('电量同步失败');
  }
}

async function runItemsSync(): Promise<void> {
  const result = await syncService.syncItemsData();
  if (result.successNum === 0 && result.failNum > 0) {
    throw new Error('材料同步失败');
  }
}

async function runCharacterSync(proxy: Record<string, unknown>): Promise<void> {
  const characterKey = typeof proxy.character === 'string' ? proxy.character : null;

  if (characterKey) {
    // 单角色同步：按钮挂在角色卡片上
    const avatarId = resolveAvatarId(proxy, characterKey);
    if (avatarId === null) {
      throw new Error(`未能解析角色 ${characterKey} 的 avatar id`);
    }

    const result = await syncService.syncSingleCharacter(avatarId);
    if (result.success === 0) {
      throw new Error(result.errors[0] || '角色同步失败');
    }
    return;
  }

  const result = await syncService.syncAllCharacters();
  if (result.success === 0 && result.failed > 0) {
    throw new Error('角色批量同步失败');
  }
}

const KIND_LABELS: Record<SyncComponentKind, string> = {
  resin: '电量',
  items: '养成材料',
  characters: '角色',
};

/**
 * 调用组件自身的 setToast，复用站点的提示 UI
 */
function toast(proxy: Record<string, unknown>, message: string, type: string): void {
  const setToast = proxy.setToast;
  if (typeof setToast !== 'function') {
    return;
  }

  try {
    (setToast as (message: string, type: string) => void).call(proxy, message, type);
  } catch (error) {
    logger.warn('⚠️ 调用组件 setToast 失败:', error);
  }
}

function createSyncReplacement(proxy: Record<string, unknown>, kind: SyncComponentKind) {
  const label = KIND_LABELS[kind];

  return async function hijackedSync(): Promise<void> {
    // 重入保护：材料同步耗时较长，且其外层按钮不绑 isLoadingSync，
    // 没有转圈反馈，用户容易连点触发多次同步
    if (proxy.isLoadingSync === true) {
      toast(proxy, `${label}同步进行中，请稍候`, 'warning');
      return;
    }

    proxy.isLoadingSync = true;
    proxy.error = null;
    proxy.stepError = null;
    proxy.stepSuccess = 0;

    // 起始提示：站点原生按钮只在弹窗内画转圈，弹窗被我们跳过后没有可见反馈
    toast(proxy, `开始同步${label}...`, '');

    try {
      if (kind === 'resin') {
        await runResinSync();
      } else if (kind === 'items') {
        await runItemsSync();
      } else {
        await runCharacterSync(proxy);
      }

      proxy.stepSuccess = 3;
      proxy.isVisible = false;
      logger.info(`✅ 原生 SYNC 按钮（${kind}）已通过国服链路完成同步`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      proxy.error = message;
      proxy.stepError = 2;
      logger.error(`❌ 原生 SYNC 按钮（${kind}）同步失败:`, error);
    } finally {
      proxy.isLoadingSync = false;
    }
  };
}

/**
 * 替换单个组件实例的同步方法
 */
/**
 * 拦截弹窗打开：材料组件没有 clickedSync，弹窗由模板内联 `isVisible = true` 打开，
 * 没有方法可替换。改用 Vue 自身的 $watch 监听，弹窗一开就立刻关掉并直接同步。
 */
function interceptDialogOpen(
  proxy: Record<string, unknown>,
  replacement: () => Promise<void>
): void {
  const watch = proxy.$watch;
  if (typeof watch !== 'function') {
    logger.warn('⚠️ 组件无 $watch，材料同步弹窗无法拦截');
    return;
  }

  (watch as (source: string, cb: (value: unknown) => void) => void).call(
    proxy,
    'isVisible',
    (visible: unknown) => {
      if (visible !== true) {
        return;
      }

      proxy.isVisible = false;
      void replacement();
    }
  );
}

function hijackInstance(instance: VueInstance): 'hijacked' | 'skipped' | 'failed' {
  const proxy = instance.proxy;
  if (!proxy) {
    return 'failed';
  }

  if (proxy[HIJACK_FLAG]) {
    return 'skipped';
  }

  const kind = classifySyncComponent(proxy);
  const replacement = createSyncReplacement(proxy, kind);

  try {
    // Vue 3 的 methods 挂在 ctx 上，写 proxy 会落到 ctx。
    // 渲染函数里是 `n.sync && n.sync(...)`，调用时动态查找，所以替换能生效。
    proxy.sync = replacement;

    // 校验是否真的写进去了（proxy 可能拒绝写入而不报错）
    if (proxy.sync !== replacement) {
      logger.warn('⚠️ sync 方法替换未生效，proxy 拒绝写入');
      return 'failed';
    }

    if (typeof proxy.clickedSync === 'function') {
      // clickedSync 默认会先弹账号选择窗，我们不用账号体系，直接同步
      proxy.clickedSync = replacement;
    } else {
      // 没有 clickedSync 的组件（材料）靠拦弹窗
      interceptDialogOpen(proxy, replacement);
    }

    proxy[HIJACK_FLAG] = true;
    return 'hijacked';
  } catch (error) {
    logger.warn('⚠️ 替换 sync 方法失败:', error);
    return 'failed';
  }
}

/**
 * 扫描并劫持当前页面上所有原生 SYNC 按钮
 */
export function hijackNativeSyncButtons(root: VueInstance | null): HijackStats {
  const stats: HijackStats = { found: 0, hijacked: 0, skipped: 0, failed: 0 };

  if (!root) {
    return stats;
  }

  const instances = collectSyncInstances(root);
  stats.found = instances.length;

  for (const instance of instances) {
    const result = hijackInstance(instance);
    if (result === 'hijacked') {
      stats.hijacked += 1;
    } else if (result === 'skipped') {
      stats.skipped += 1;
    } else {
      stats.failed += 1;
    }
  }

  if (stats.hijacked > 0 || stats.failed > 0) {
    logger.info(
      `🔀 原生 SYNC 按钮劫持：发现 ${stats.found}，新劫持 ${stats.hijacked}，`
      + `已劫持 ${stats.skipped}，失败 ${stats.failed}`
    );
  }

  return stats;
}

/**
 * 探测用：只扫描不替换，返回每个同步按钮组件的关键状态
 *
 * 在控制台调用可确认组件识别是否正确、proxy 是否可写。
 */
export function probeNativeSyncButtons(root: VueInstance | null): Array<Record<string, unknown>> {
  return collectSyncInstances(root).map((instance) => {
    const proxy = instance.proxy as Record<string, unknown>;
    let writable = false;

    try {
      const original = proxy.sync;
      const probe = () => undefined;
      proxy.sync = probe;
      writable = proxy.sync === probe;
      proxy.sync = original;
    } catch {
      writable = false;
    }

    return {
      kind: classifySyncComponent(proxy),
      game: proxy.game,
      character: proxy.character ?? '(全量)',
      iconOnly: proxy.iconOnly,
      hasClickedSync: typeof proxy.clickedSync === 'function',
      hijacked: Boolean(proxy[HIJACK_FLAG]),
      syncWritable: writable,
    };
  });
}
