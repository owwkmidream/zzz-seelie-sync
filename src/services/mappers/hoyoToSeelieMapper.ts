import type { AvatarDetail, Property as ApiProperty, Weapon as ApiWeapon } from '@/api/hoyo/types'
import type { CharacterDataInput } from '@/utils/seelie'
import type { WeaponData, WeaponProperty } from '@/utils/seelie/types'

type SkillUpgrade = CharacterDataInput['avatar']['skill_upgrade']

function resolveSkillUpgrade(avatar: AvatarDetail['avatar']): SkillUpgrade {
  const withSkillUpgrade = avatar as AvatarDetail['avatar'] & { skill_upgrade?: SkillUpgrade }
  return withSkillUpgrade.skill_upgrade || {
    first: [],
    second: [],
    third: []
  }
}

function toNumber(value: string | number): number {
  const converted = Number(value)
  return Number.isFinite(converted) ? converted : 0
}

function mapWeaponProperty(property: ApiProperty): WeaponProperty {
  return {
    property_name: property.property_name,
    property_id: property.property_id,
    base: property.base,
    level: 0,
    valid: true,
    system_id: 0,
    add: toNumber(property.add)
  }
}

function mapWeaponData(weapon: ApiWeapon): WeaponData {
  return {
    id: weapon.id,
    level: weapon.level,
    name: weapon.name,
    star: weapon.star,
    icon: weapon.icon,
    rarity: weapon.rarity,
    properties: weapon.properties.map(mapWeaponProperty),
    main_properties: weapon.main_properties.map(mapWeaponProperty),
    talent_title: weapon.talent_title,
    talent_content: weapon.talent_content,
    profession: weapon.profession
  }
}

/**
 * 将 Hoyo 角色详情结构转换为 Seelie 同步输入结构
 */
export function mapAvatarDetailToCharacterDataInput(detail: AvatarDetail): CharacterDataInput {
  const avatar = detail.avatar

  return {
    avatar: {
      id: avatar.id,
      level: avatar.level,
      name_mi18n: avatar.name_mi18n,
      full_name_mi18n: avatar.full_name_mi18n,
      element_type: avatar.element_type,
      camp_name_mi18n: avatar.camp_name_mi18n,
      avatar_profession: avatar.avatar_profession,
      rarity: avatar.rarity,
      group_icon_path: avatar.group_icon_path,
      hollow_icon_path: avatar.hollow_icon_path,
      properties: detail.properties as CharacterDataInput['avatar']['properties'],
      skills: detail.skills as CharacterDataInput['avatar']['skills'],
      rank: avatar.rank,
      ranks: detail.ranks as CharacterDataInput['avatar']['ranks'],
      sub_element_type: avatar.sub_element_type,
      signature_weapon_id: avatar.signature_weapon_id ?? 0,
      awaken_state: avatar.awaken_state,
      skill_upgrade: resolveSkillUpgrade(avatar),
      promotes: avatar.promotes ?? 0,
      unlock: avatar.unlock ?? true
    },
    weapon: mapWeaponData(detail.weapon)
  }
}

/**
 * 批量转换 Hoyo 角色详情
 */
export function mapAvatarDetailsToCharacterDataInput(details: AvatarDetail[]): CharacterDataInput[] {
  return details.map(mapAvatarDetailToCharacterDataInput)
}
