// 米哈游绝区零API工具函数

import type {
  AvatarBasicInfo
} from './types';

/**
 * 获取属性类型名称
 */
export function getElementName(elementType: number): string {
  const elementNames: Record<number, string> = {
    200: '物理', // ElementType.Physical
    201: '火',   // ElementType.Fire
    202: '冰',   // ElementType.Ice
    203: '电',   // ElementType.Electric
    205: '以太'  // ElementType.Ether
  };
  return elementNames[elementType] || '未知';
}

/**
 * 获取职业类型名称
 */
export function getProfessionName(profession: number): string {
  const professionNames: Record<number, string> = {
    1: '攻击', // AvatarProfession.Attack
    2: '击破', // AvatarProfession.Stun
    3: '异常', // AvatarProfession.Anomaly
    4: '支援', // AvatarProfession.Support
    5: '防护', // AvatarProfession.Defense
    6: '命破'  // AvatarProfession.Rupture
  };
  return professionNames[profession] || '未知';
}

/**
 * 获取技能类型名称
 */
export function getSkillTypeName(skillType: number): string {
  const skillTypeNames: Record<number, string> = {
    0: '普通攻击', // SkillType.NormalAttack
    1: '特殊技',   // SkillType.SpecialSkill
    2: '闪避技能', // SkillType.Dodge
    3: '连携技',   // SkillType.Chain
    5: '核心被动', // SkillType.CorePassive
    6: '支援技能'  // SkillType.SupportSkill
  };
  return skillTypeNames[skillType] || '未知技能';
}

/**
 * 获取装备位置名称
 */
export function getEquipmentSlotName(slotType: number): string {
  const slotNames: Record<number, string> = {
    1: '1号位驱动盘', // EquipmentType.Slot1
    2: '2号位驱动盘', // EquipmentType.Slot2
    3: '3号位驱动盘', // EquipmentType.Slot3
    4: '4号位驱动盘', // EquipmentType.Slot4
    5: '5号位驱动盘', // EquipmentType.Slot5
    6: '6号位驱动盘'  // EquipmentType.Slot6
  };
  return slotNames[slotType] || '未知位置';
}/**
 * 
筛选已解锁的角色
 */
export function filterUnlockedAvatars(avatarList: AvatarBasicInfo[]): AvatarBasicInfo[] {
  return avatarList.filter(item => item.unlocked);
}

/**
 * 按属性分组角色
 */
export function groupAvatarsByElement(avatarList: AvatarBasicInfo[]): Record<string, AvatarBasicInfo[]> {
  const groups: Record<string, AvatarBasicInfo[]> = {};

  avatarList.forEach(item => {
    if (item.unlocked) {
      const elementName = getElementName(item.avatar.element_type);
      if (!groups[elementName]) {
        groups[elementName] = [];
      }
      groups[elementName].push(item);
    }
  });

  return groups;
}

/**
 * 按职业分组角色
 */
export function groupAvatarsByProfession(avatarList: AvatarBasicInfo[]): Record<string, AvatarBasicInfo[]> {
  const groups: Record<string, AvatarBasicInfo[]> = {};

  avatarList.forEach(item => {
    if (item.unlocked) {
      const professionName = getProfessionName(item.avatar.avatar_profession);
      if (!groups[professionName]) {
        groups[professionName] = [];
      }
      groups[professionName].push(item);
    }
  });

  return groups;
}

/**
 * 获取S级角色列表
 */
export function getSRankAvatars(avatarList: AvatarBasicInfo[]): AvatarBasicInfo[] {
  return avatarList.filter(item => item.unlocked && item.avatar.rarity === 'S');
}

/**
 * 获取A级角色列表
 */
export function getARankAvatars(avatarList: AvatarBasicInfo[]): AvatarBasicInfo[] {
  return avatarList.filter(item => item.unlocked && item.avatar.rarity === 'A');
}