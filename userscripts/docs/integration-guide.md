# Seelie & Hoyo API 集成使用指南

## 概述

本指南介绍如何结合使用重构后的 Seelie 工具类和 Hoyo API，实现从米哈游官方 API 获取绝区零角色数据，并自动同步到 Seelie 网站的完整工作流程。

## 完整工作流程

### 1. 基础设置

```typescript
import {
  getAvatarBasicList,
  batchGetAvatarDetail,
  getGameNote,
} from "@/api/hoyo";
import { syncAllCharacters, setResinData, setToast } from "@/utils/seelie";

// 确保用户已登录米游社
await ensureUserInfo();
```

### 2. 获取并同步体力数据

```typescript
async function syncEnergyData() {
  try {
    console.log("🔄 开始同步体力数据...");

    // 获取游戏便笺
    const gameNote = await getGameNote();
    const energyInfo = gameNote.energy;

    // 转换为 Seelie 格式并设置
    const success = setResinData(energyInfo);

    if (success) {
      setToast(
        `体力数据同步成功: ${energyInfo.progress.current}/${energyInfo.progress.max}`,
        "success"
      );
      console.log("✅ 体力数据同步完成");
    } else {
      setToast("体力数据同步失败", "error");
    }

    return success;
  } catch (error) {
    console.error("❌ 体力数据同步失败:", error);
    setToast("体力数据同步失败: " + error.message, "error");
    return false;
  }
}
```

### 3. 获取并同步角色数据

```typescript
async function syncCharacterData() {
  try {
    console.log("🔄 开始同步角色数据...");

    // 1. 获取角色基础列表
    const avatarBasicList = await getAvatarBasicList();
    console.log(`📋 获取到 ${avatarBasicList.length} 个角色`);

    // 2. 过滤已解锁的角色
    const unlockedAvatars = avatarBasicList.filter((item) => item.unlocked);
    console.log(`🔓 已解锁角色: ${unlockedAvatars.length} 个`);

    // 3. 构建详细信息请求列表
    const detailRequests = unlockedAvatars.map((item) => ({
      avatar_id: item.avatar.id,
      is_teaser: false,
      teaser_need_weapon: true, // 需要武器信息
      teaser_sp_skill: false,
    }));

    // 4. 批量获取角色详细信息
    console.log("📡 批量获取角色详细信息...");
    const avatarDetails = await batchGetAvatarDetail(undefined, detailRequests);
    console.log(`✅ 获取到 ${avatarDetails.length} 个角色的详细信息`);

    // 5. 转换为 Seelie 格式
    const characterDataList = avatarDetails.map((detail) => ({
      avatar: detail.avatar,
      weapon: detail.weapon,
    }));

    // 6. 批量同步到 Seelie
    console.log("🔄 开始批量同步到 Seelie...");
    const syncResult = syncAllCharacters(characterDataList);

    // 7. 显示结果
    console.log("🎯 同步结果:", syncResult);

    if (syncResult.success > 0) {
      setToast(
        `成功同步 ${syncResult.success}/${syncResult.total} 个角色`,
        syncResult.failed === 0 ? "success" : "warning"
      );
    }

    if (syncResult.failed > 0) {
      setToast(`${syncResult.failed} 个角色同步失败，请查看控制台`, "error");
      console.log("❌ 同步失败的角色:", syncResult.errors);
    }

    return syncResult;
  } catch (error) {
    console.error("❌ 角色数据同步失败:", error);
    setToast("角色数据同步失败: " + error.message, "error");
    throw error;
  }
}
```

### 4. 完整同步函数

```typescript
async function fullSync() {
  console.log("🚀 开始完整数据同步...");

  const results = {
    energy: false,
    characters: null as any,
  };

  try {
    // 同步体力数据
    results.energy = await syncEnergyData();

    // 同步角色数据
    results.characters = await syncCharacterData();

    // 显示总结
    const totalSuccess = results.characters?.success || 0;
    const totalFailed = results.characters?.failed || 0;
    const energyStatus = results.energy ? "成功" : "失败";

    console.log("🎉 完整同步完成:");
    console.log(`   体力数据: ${energyStatus}`);
    console.log(`   角色数据: ${totalSuccess} 成功, ${totalFailed} 失败`);

    setToast(
      `同步完成: 体力${energyStatus}, 角色 ${totalSuccess}/${
        totalSuccess + totalFailed
      }`,
      totalFailed === 0 && results.energy ? "success" : "warning"
    );

    return results;
  } catch (error) {
    console.error("❌ 完整同步失败:", error);
    setToast("完整同步失败: " + error.message, "error");
    throw error;
  }
}
```

## 高级用法

### 1. 选择性同步

```typescript
async function selectiveSync(options = {}) {
  const {
    syncEnergy = true,
    syncCharacters = true,
    characterIds = null, // 指定角色ID列表
    minLevel = 1, // 最低等级过滤
    maxLevel = 60, // 最高等级过滤
  } = options;

  const results = {};

  // 体力数据同步
  if (syncEnergy) {
    results.energy = await syncEnergyData();
  }

  // 角色数据同步
  if (syncCharacters) {
    const avatarBasicList = await getAvatarBasicList();

    // 应用过滤条件
    let filteredAvatars = avatarBasicList.filter((item) => {
      if (!item.unlocked) return false;

      const avatar = item.avatar;

      // 角色ID过滤
      if (characterIds && !characterIds.includes(avatar.id)) {
        return false;
      }

      // 等级过滤
      if (avatar.level < minLevel || avatar.level > maxLevel) {
        return false;
      }

      return true;
    });

    console.log(`🎯 过滤后的角色数量: ${filteredAvatars.length}`);

    if (filteredAvatars.length > 0) {
      const detailRequests = filteredAvatars.map((item) => ({
        avatar_id: item.avatar.id,
        is_teaser: false,
        teaser_need_weapon: true,
        teaser_sp_skill: false,
      }));

      const avatarDetails = await batchGetAvatarDetail(
        undefined,
        detailRequests
      );
      const characterDataList = avatarDetails.map((detail) => ({
        avatar: detail.avatar,
        weapon: detail.weapon,
      }));

      results.characters = syncAllCharacters(characterDataList);
    }
  }

  return results;
}

// 使用示例
// 只同步指定角色
await selectiveSync({
  characterIds: [1011, 1021, 1031], // 只同步这些角色
  minLevel: 50, // 只同步50级以上的角色
});
```

### 2. 增量同步

```typescript
async function incrementalSync() {
  try {
    // 获取当前 Seelie 中的角色数据
    const currentGoals = seelieDataManager.getGoals();
    const existingCharacters = new Set(
      currentGoals
        .filter((goal) => goal.type === "character")
        .map((goal) => goal.character)
    );

    console.log(`📊 Seelie 中已有 ${existingCharacters.size} 个角色目标`);

    // 获取米游社角色数据
    const avatarBasicList = await getAvatarBasicList();
    const unlockedAvatars = avatarBasicList.filter((item) => item.unlocked);

    // 找出需要更新的角色（新角色或等级变化的角色）
    const needUpdateAvatars = [];

    for (const item of unlockedAvatars) {
      const avatar = item.avatar;
      const characterKey = findCharacterKeyById(avatar.id);

      if (!characterKey) {
        console.log(`⚠️ 未找到角色 ${avatar.name_mi18n} 的映射`);
        continue;
      }

      // 检查是否需要更新
      const existingGoal = currentGoals.find(
        (goal) => goal.character === characterKey && goal.type === "character"
      );

      if (!existingGoal || existingGoal.current.level < avatar.level) {
        needUpdateAvatars.push(item);
        console.log(
          `🔄 需要更新角色: ${avatar.name_mi18n} (等级: ${avatar.level})`
        );
      }
    }

    console.log(`📝 需要更新 ${needUpdateAvatars.length} 个角色`);

    if (needUpdateAvatars.length > 0) {
      // 获取详细信息并同步
      const detailRequests = needUpdateAvatars.map((item) => ({
        avatar_id: item.avatar.id,
        is_teaser: false,
        teaser_need_weapon: true,
        teaser_sp_skill: false,
      }));

      const avatarDetails = await batchGetAvatarDetail(
        undefined,
        detailRequests
      );
      const characterDataList = avatarDetails.map((detail) => ({
        avatar: detail.avatar,
        weapon: detail.weapon,
      }));

      const syncResult = syncAllCharacters(characterDataList);

      setToast(`增量同步完成: 更新了 ${syncResult.success} 个角色`, "success");

      return syncResult;
    } else {
      setToast("所有角色数据已是最新", "success");
      return { success: 0, failed: 0, total: 0, errors: [], details: [] };
    }
  } catch (error) {
    console.error("❌ 增量同步失败:", error);
    setToast("增量同步失败: " + error.message, "error");
    throw error;
  }
}

// 辅助函数：根据角色ID查找角色键名
function findCharacterKeyById(characterId) {
  const characters = seelieDataManager.getCharacters();
  return Object.keys(characters).find(
    (key) => characters[key].id === characterId
  );
}
```

### 3. 定时同步

```typescript
class AutoSyncManager {
  private syncInterval: number | null = null;
  private isRunning = false;

  /**
   * 开始自动同步
   * @param intervalMinutes 同步间隔（分钟）
   * @param options 同步选项
   */
  start(intervalMinutes = 30, options = {}) {
    if (this.isRunning) {
      console.log("⚠️ 自动同步已在运行中");
      return;
    }

    this.isRunning = true;
    console.log(`🕐 开始自动同步，间隔: ${intervalMinutes} 分钟`);

    // 立即执行一次
    this.performSync(options);

    // 设置定时器
    this.syncInterval = window.setInterval(() => {
      this.performSync(options);
    }, intervalMinutes * 60 * 1000);

    setToast(`自动同步已启动，间隔 ${intervalMinutes} 分钟`, "success");
  }

  /**
   * 停止自动同步
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.isRunning = false;
    console.log("⏹️ 自动同步已停止");
    setToast("自动同步已停止", "success");
  }

  /**
   * 执行同步
   */
  private async performSync(options) {
    try {
      console.log("🔄 执行定时同步...");

      if (options.incremental) {
        await incrementalSync();
      } else {
        await fullSync();
      }

      console.log("✅ 定时同步完成");
    } catch (error) {
      console.error("❌ 定时同步失败:", error);
      setToast("定时同步失败: " + error.message, "error");
    }
  }

  /**
   * 获取运行状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.syncInterval,
    };
  }
}

// 创建全局实例
const autoSyncManager = new AutoSyncManager();

// 使用示例
// 开始自动同步（每30分钟一次，增量模式）
autoSyncManager.start(30, { incremental: true });

// 停止自动同步
// autoSyncManager.stop();
```

## 错误处理和重试机制

```typescript
async function robustSync(maxRetries = 3, retryDelay = 5000) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 同步尝试 ${attempt}/${maxRetries}`);

      const result = await fullSync();

      console.log("✅ 同步成功");
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ 同步尝试 ${attempt} 失败:`, error);

      if (attempt < maxRetries) {
        console.log(`⏳ ${retryDelay / 1000} 秒后重试...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        // 清理可能的缓存问题
        if (error.message.includes("设备指纹")) {
          await refreshDeviceFingerprint();
        }

        if (error.message.includes("用户信息")) {
          clearUserInfo();
          await ensureUserInfo();
        }
      }
    }
  }

  // 所有重试都失败了
  setToast(`同步失败，已重试 ${maxRetries} 次: ${lastError.message}`, "error");
  throw lastError;
}
```

## 调试和监控

```typescript
// 调试工具
const DebugUtils = {
  /**
   * 检查系统状态
   */
  async checkSystemStatus() {
    console.log("🔍 系统状态检查:");

    // 检查用户信息
    const userInfo = getUserInfo();
    console.log("👤 用户信息:", userInfo);

    // 检查设备信息
    const deviceInfo = await getCurrentDeviceInfo();
    console.log("📱 设备信息:", deviceInfo);

    // 检查 Seelie 组件
    const contextInfo = seelieDataManager.getContextInfo();
    console.log("🎯 Seelie 组件:", contextInfo);

    // 检查现有目标
    const goals = seelieDataManager.getGoals();
    console.log("📋 现有目标数量:", goals.length);

    return {
      userInfo,
      deviceInfo,
      contextInfo,
      goalsCount: goals.length,
    };
  },

  /**
   * 测试 API 连接
   */
  async testApiConnection() {
    console.log("🌐 API 连接测试:");

    try {
      // 测试角色列表 API
      const avatarList = await getAvatarBasicList();
      console.log("✅ 角色列表 API 正常:", avatarList.length, "个角色");

      // 测试游戏便笺 API
      const gameNote = await getGameNote();
      console.log("✅ 游戏便笺 API 正常:", gameNote.energy);

      return true;
    } catch (error) {
      console.error("❌ API 连接测试失败:", error);
      return false;
    }
  },

  /**
   * 性能监控
   */
  async performanceTest() {
    console.log("⚡ 性能测试开始...");

    const startTime = Date.now();

    try {
      // 测试角色列表获取速度
      const listStart = Date.now();
      const avatarList = await getAvatarBasicList();
      const listTime = Date.now() - listStart;
      console.log(
        `📋 角色列表获取: ${listTime}ms (${avatarList.length} 个角色)`
      );

      // 测试批量详细信息获取速度
      const detailStart = Date.now();
      const detailRequests = avatarList.slice(0, 5).map((item) => ({
        avatar_id: item.avatar.id,
        is_teaser: false,
        teaser_need_weapon: true,
        teaser_sp_skill: false,
      }));
      const avatarDetails = await batchGetAvatarDetail(
        undefined,
        detailRequests
      );
      const detailTime = Date.now() - detailStart;
      console.log(
        `📊 批量详细信息获取: ${detailTime}ms (${avatarDetails.length} 个角色)`
      );

      // 测试同步速度
      const syncStart = Date.now();
      const characterDataList = avatarDetails.map((detail) => ({
        avatar: detail.avatar,
        weapon: detail.weapon,
      }));
      const syncResult = syncAllCharacters(characterDataList);
      const syncTime = Date.now() - syncStart;
      console.log(`🔄 数据同步: ${syncTime}ms (${syncResult.success} 成功)`);

      const totalTime = Date.now() - startTime;
      console.log(`⚡ 总耗时: ${totalTime}ms`);

      return {
        listTime,
        detailTime,
        syncTime,
        totalTime,
        charactersProcessed: avatarDetails.length,
      };
    } catch (error) {
      console.error("❌ 性能测试失败:", error);
      throw error;
    }
  },
};

// 挂载到全局对象
if (typeof window !== "undefined") {
  window.DebugUtils = DebugUtils;
  window.autoSyncManager = autoSyncManager;
  window.fullSync = fullSync;
  window.incrementalSync = incrementalSync;
  window.robustSync = robustSync;
}
```

## 最佳实践

### 1. 错误处理

- 始终使用 try-catch 包装异步操作
- 提供有意义的错误消息给用户
- 记录详细的错误信息到控制台

### 2. 性能优化

- 使用批量 API 而不是单个请求
- 实现增量同步减少不必要的数据传输
- 合理设置自动同步间隔

### 3. 用户体验

- 提供清晰的进度反馈
- 使用 Toast 消息通知用户操作结果
- 在长时间操作时显示进度信息

### 4. 数据一致性

- 在同步前验证数据格式
- 处理 API 数据结构变化
- 提供数据回滚机制

## 故障排除

### 常见问题

1. **设备指纹问题**

   - 症状：请求返回设备指纹错误
   - 解决：调用 `refreshDeviceFingerprint()`

2. **用户信息过期**

   - 症状：返回未登录错误
   - 解决：重新登录米游社或清除缓存

3. **角色数据不匹配**

   - 症状：角色无法找到或数据错误
   - 解决：检查角色 ID 映射，更新常量数据

4. **网络连接问题**
   - 症状：请求超时或连接失败
   - 解决：检查网络连接，使用重试机制

### 调试命令

```javascript
// 在浏览器控制台中使用
await DebugUtils.checkSystemStatus();
await DebugUtils.testApiConnection();
await DebugUtils.performanceTest();

// 手动同步
await fullSync();
await incrementalSync();

// 清理和重置
clearDeviceInfo();
clearUserInfo();
seelieDataManager.refresh();
```

这个集成指南提供了完整的工作流程和高级功能，帮助开发者充分利用重构后的 Seelie 和 Hoyo API。
