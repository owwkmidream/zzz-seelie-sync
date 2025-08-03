// 绝区零API使用示例

import {
  getAvatarBasicList,
  getAvatarDetail,
  batchGetAvatarDetail,
  getElementName,
  getProfessionName,
  groupAvatarsByElement,
  groupAvatarsByProfession,
  getSRankAvatars,
  type AvatarBasicInfo,
  type AvatarDetail
} from '../api/hoyo';

/**
 * 基础使用示例
 */
export async function basicUsageExample() {
  const uid = '10946813'; // 示例UID

  try {
    console.log('🎮 开始获取角色数据...');

    // 1. 获取角色基础列表
    const avatarList = await getAvatarBasicList(uid);
    console.log(`📋 获取到 ${avatarList.length} 个角色`);

    // 2. 筛选已解锁的角色
    const unlockedAvatars = avatarList.filter(item => item.unlocked);
    console.log(`🔓 已解锁 ${unlockedAvatars.length} 个角色`);

    // 3. 获取S级角色
    const sRankAvatars = getSRankAvatars(avatarList);
    console.log(`⭐ S级角色 ${sRankAvatars.length} 个:`);
    sRankAvatars.forEach(item => {
      console.log(`  - ${item.avatar.name_mi18n} (Lv.${item.avatar.level}, ${item.avatar.rank}影)`);
    });

    // 4. 按属性分组
    const elementGroups = groupAvatarsByElement(avatarList);
    console.log('🔥 按属性分组:');
    Object.entries(elementGroups).forEach(([element, avatars]) => {
      console.log(`  ${element}: ${avatars.length}个`);
    });

    // 5. 按职业分组
    const professionGroups = groupAvatarsByProfession(avatarList);
    console.log('⚔️ 按职业分组:');
    Object.entries(professionGroups).forEach(([profession, avatars]) => {
      console.log(`  ${profession}: ${avatars.length}个`);
    });

  } catch (error) {
    console.error('❌ 获取数据失败:', error);
  }
}

/**
 * 获取角色详细信息示例
 */
export async function getCharacterDetailExample() {
  const uid = '10946813';
  const avatarId = 1021; // 猫又的ID

  try {
    console.log(`🔍 获取角色 ${avatarId} 的详细信息...`);

    const detail = await getAvatarDetail(uid, avatarId);

    console.log('📊 角色详细信息:');
    console.log(`  名称: ${detail.avatar.name_mi18n}`);
    console.log(`  等级: ${detail.avatar.level}`);
    console.log(`  属性: ${getElementName(detail.avatar.element_type)}`);
    console.log(`  职业: ${getProfessionName(detail.avatar.avatar_profession)}`);
    console.log(`  影级: ${detail.avatar.rank}`);

    // 显示属性信息
    console.log('💪 角色属性:');
    detail.properties.forEach(prop => {
      console.log(`  ${prop.property_name}: ${prop.final}`);
    });

    // 显示武器信息
    if (detail.weapon) {
      console.log('🗡️ 武器信息:');
      console.log(`  名称: ${detail.weapon.name}`);
      console.log(`  等级: ${detail.weapon.level}`);
      console.log(`  精炼: ${detail.weapon.star}`);
    }

    // 显示装备信息
    console.log('🛡️ 装备信息:');
    detail.equip.forEach(equip => {
      console.log(`  ${equip.equipment_type}号位: ${equip.name} (Lv.${equip.level})`);
      if (equip.equip_suit) {
        console.log(`    套装: ${equip.equip_suit.name} (${equip.equip_suit.cnt}件)`);
      }
    });

  } catch (error) {
    console.error('❌ 获取角色详情失败:', error);
  }
}

/**
 * 批量获取多个角色详情示例
 */
export async function batchGetCharacterDetailsExample() {
  const uid = '10946813';

  try {
    // 1. 先获取基础列表
    const avatarList = await getAvatarBasicList(uid);

    // 2. 筛选出S级角色
    const sRankAvatars = getSRankAvatars(avatarList);

    if (sRankAvatars.length === 0) {
      console.log('😅 没有S级角色');
      return;
    }

    // 3. 构建批量请求参数
    const avatarRequests = sRankAvatars.slice(0, 3).map(item => ({
      avatar_id: item.avatar.id,
      is_teaser: item.is_teaser,
      teaser_need_weapon: false,
      teaser_sp_skill: false
    }));

    console.log(`🔍 批量获取 ${avatarRequests.length} 个S级角色的详细信息...`);

    // 4. 批量获取详情
    const details = await batchGetAvatarDetail(uid, avatarRequests);

    // 5. 显示结果
    details.forEach(detail => {
      console.log(`\n📊 ${detail.avatar.name_mi18n}:`);
      console.log(`  等级: ${detail.avatar.level}`);
      console.log(`  属性: ${getElementName(detail.avatar.element_type)}`);
      console.log(`  职业: ${getProfessionName(detail.avatar.avatar_profession)}`);

      // 显示主要属性
      const mainProps = detail.properties.slice(0, 3);
      mainProps.forEach(prop => {
        console.log(`  ${prop.property_name}: ${prop.final}`);
      });
    });

  } catch (error) {
    console.error('❌ 批量获取角色详情失败:', error);
  }
}

/**
 * 角色数据分析示例
 */
export async function analyzeCharacterDataExample() {
  const uid = '10946813';

  try {
    const avatarList = await getAvatarBasicList(uid);
    const unlockedAvatars = avatarList.filter(item => item.unlocked);

    console.log('📈 角色数据分析:');

    // 1. 等级分布统计
    const levelStats: Record<string, number> = {};
    unlockedAvatars.forEach(item => {
      const levelRange = Math.floor(item.avatar.level / 10) * 10;
      const key = `${levelRange}-${levelRange + 9}`;
      levelStats[key] = (levelStats[key] || 0) + 1;
    });

    console.log('📊 等级分布:');
    Object.entries(levelStats).forEach(([range, count]) => {
      console.log(`  Lv.${range}: ${count}个`);
    });

    // 2. 影级分布统计
    const rankStats: Record<number, number> = {};
    unlockedAvatars.forEach(item => {
      const rank = item.avatar.rank;
      rankStats[rank] = (rankStats[rank] || 0) + 1;
    });

    console.log('🌟 影级分布:');
    Object.entries(rankStats).forEach(([rank, count]) => {
      console.log(`  ${rank}影: ${count}个`);
    });

    // 3. 稀有度统计
    const rarityStats: Record<string, number> = {};
    unlockedAvatars.forEach(item => {
      const rarity = item.avatar.rarity;
      rarityStats[rarity] = (rarityStats[rarity] || 0) + 1;
    });

    console.log('💎 稀有度分布:');
    Object.entries(rarityStats).forEach(([rarity, count]) => {
      console.log(`  ${rarity}级: ${count}个`);
    });

    // 4. 找出需要培养的角色（低等级S级）
    const needTraining = unlockedAvatars.filter(item =>
      item.avatar.rarity === 'S' && item.avatar.level < 50
    );

    if (needTraining.length > 0) {
      console.log('🎯 建议优先培养的S级角色:');
      needTraining.forEach(item => {
        console.log(`  ${item.avatar.name_mi18n} (Lv.${item.avatar.level})`);
      });
    }

  } catch (error) {
    console.error('❌ 数据分析失败:', error);
  }
}

/**
 * 队伍搭配建议示例
 */
export async function teamCompositionExample() {
  const uid = '10946813';

  try {
    const avatarList = await getAvatarBasicList(uid);
    const unlockedAvatars = avatarList.filter(item => item.unlocked);

    // 按职业分组
    const professionGroups = groupAvatarsByProfession(avatarList);

    console.log('⚔️ 队伍搭配建议:');

    // 检查是否有完整的队伍配置
    const hasAttacker = professionGroups['攻击']?.length > 0;
    const hasStunner = professionGroups['击破']?.length > 0;
    const hasSupport = professionGroups['支援']?.length > 0;
    const hasDefense = professionGroups['防护']?.length > 0;
    const hasAnomaly = professionGroups['异常']?.length > 0;

    if (hasAttacker && hasStunner && hasSupport) {
      console.log('✅ 推荐配置: 攻击 + 击破 + 支援');
      console.log(`  攻击角色: ${professionGroups['攻击'][0].avatar.name_mi18n}`);
      console.log(`  击破角色: ${professionGroups['击破'][0].avatar.name_mi18n}`);
      console.log(`  支援角色: ${professionGroups['支援'][0].avatar.name_mi18n}`);
    } else if (hasAnomaly && hasSupport) {
      console.log('✅ 推荐配置: 异常 + 支援 + 自由位');
      console.log(`  异常角色: ${professionGroups['异常'][0].avatar.name_mi18n}`);
      console.log(`  支援角色: ${professionGroups['支援'][0].avatar.name_mi18n}`);
    } else {
      console.log('⚠️ 角色配置不够完整，建议补充以下职业:');
      if (!hasAttacker) console.log('  - 缺少攻击角色');
      if (!hasStunner) console.log('  - 缺少击破角色');
      if (!hasSupport) console.log('  - 缺少支援角色');
    }

  } catch (error) {
    console.error('❌ 队伍搭配分析失败:', error);
  }
}

// 将示例函数挂载到全局对象，方便在控制台中调用
if (typeof window !== 'undefined') {
  (window as any).ZZZExamples = {
    basicUsage: basicUsageExample,
    getCharacterDetail: getCharacterDetailExample,
    batchGetCharacterDetails: batchGetCharacterDetailsExample,
    analyzeCharacterData: analyzeCharacterDataExample,
    teamComposition: teamCompositionExample
  };
}