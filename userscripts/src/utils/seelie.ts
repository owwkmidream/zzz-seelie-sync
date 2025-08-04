// Seelie 工具类 - 用于操作 Vue 应用中的数据

/**
 * 树脂数据输入格式
 */
export interface ResinDataInput {
  progress: {
    max: number;
    current: number;
  };
  restore: number;
  day_type: number;
  hour: number;
  minute: number;
}

/**
 * AccountResin 格式
 */
interface AccountResin {
  amount: number;
  time: string;
}

/**
 * 角色属性信息
 */
interface CharacterProperty {
  property_name: string;
  property_id: number;
  base: string;
  add: string;
  final: string;
  final_val: string;
}

/**
 * 角色技能信息
 */
interface CharacterSkill {
  level: number;
  skill_type: number;
  items: Array<{
    title: string;
    text: string;
    awaken: boolean;
  }>;
}

/**
 * 武器属性信息
 */
interface WeaponProperty {
  property_name: string;
  property_id: number;
  base: string;
  level: number;
  valid: boolean;
  system_id: number;
  add: number;
}

/**
 * 武器数据
 */
interface WeaponData {
  id: number;
  level: number;
  name: string;
  star: number;
  icon: string;
  rarity: string;
  properties: WeaponProperty[];
  main_properties: WeaponProperty[];
  talent_title: string;
  talent_content: string;
  profession: number;
}

/**
 * 角色数据输入格式
 */
export interface CharacterDataInput {
  avatar: {
    id: number;
    level: number;
    name_mi18n: string;
    full_name_mi18n: string;
    element_type: number;
    camp_name_mi18n: string;
    avatar_profession: number;
    rarity: string;
    group_icon_path: string;
    hollow_icon_path: string;
    properties: CharacterProperty[];
    skills: CharacterSkill[];
    rank: number;
    ranks: Array<{
      id: number;
      name: string;
      desc: string;
      pos: number;
      is_unlocked: boolean;
    }>;
    sub_element_type: number;
    signature_weapon_id: number;
    awaken_state: string;
    skill_upgrade: {
      first: number[];
      second: number[];
      third: number[];
    };
    promotes: number;
    unlock: boolean;
  };
  weapon?: WeaponData;
}

/**
 * 角色统计数据 Mock
 */
interface CharacterStats {
  id: number;
  name: string;
  base: number;
  growth: number;
  core: number[];
  ascHP: number[];
}

/**
 * 武器统计数据 Mock
 */
interface WeaponStatsCommon {
  rate: { [level: number]: number };
  ascRate: number[];
}

/**
 * 武器数据 Mock
 */
interface WeaponInfo {
  id: number;
  name: string;
  craftable?: boolean;
}

/**
 * 目标数据格式
 */
interface Goal {
  type: string;
  character: string;
  cons: number;
  current: {
    level: number;
    asc: number;
  };
  goal: {
    level: number;
    asc: number;
  };
}

/**
 * Seelie 数据操作工具类
 * 提供对 #app._vnode.component.ctx.accountResin 等属性的读写操作
 */
class SeelieDataManager {
  private appElement: HTMLElement | null = null;
  private rootComponent: any = null;

  // Mock 角色统计数据
  private charactersStats: CharacterStats[] = [
    {
      id: 1091,
      name: "雅",
      base: 7673,
      growth: 818426,
      core: [0, 100, 200, 300, 400, 500],
      ascHP: [0, 414, 828, 1242, 1656, 2069]
    },
    {
      id: 1221,
      name: "柳",
      base: 6500,
      growth: 750000,
      core: [0, 90, 180, 270, 360, 450],
      ascHP: [0, 350, 700, 1050, 1400, 1750]
    },
    // 可以根据需要添加更多角色数据
  ];

  // Mock 突破等级数组
  private ascensions: number[] = [1, 10, 20, 30, 40, 50, 60];

  // Mock 技能类型映射
  private skills: { [key: number]: string } = {
    0: 'basic',    // 普通攻击
    1: 'special',  // 特殊技
    2: 'evade',    // 闪避
    3: 'chain',    // 连携技
    5: 'core',     // 核心被动
    6: 'assist'    // 支援技
  };

  // Mock 武器统计数据
  private weaponsStatsCommon: WeaponStatsCommon = {
    rate: {
      1: 0, 10: 1000, 20: 2000, 30: 3000, 40: 4000, 50: 5000, 60: 6000
    },
    ascRate: [0, 500, 1000, 1500, 2000, 2500, 3000]
  };

  // Mock 武器基础攻击力数据
  private weaponsStats: { [id: number]: number } = {
    14109: 743, // 霰落星殿
    14001: 500, // 加农转子
    // 可以根据需要添加更多武器数据
  };

  // Mock 武器信息数据
  private weapons: { [key: string]: WeaponInfo } = {
    'weapon_1': { id: 14109, name: '霰落星殿' },
    'weapon_2': { id: 14001, name: '加农转子', craftable: true },
    // 可以根据需要添加更多武器数据
  };

  constructor() {
    this.init();
  }

  /**
   * 初始化，获取 #app 元素和根组件
   */
  private init(): void {
    this.appElement = document.querySelector('#app') as HTMLElement & { _vnode?: any };

    if (!this.appElement) {
      console.warn('⚠️ SeelieDataManager: 未找到 #app 元素');
      return;
    }

    if (!this.appElement._vnode?.component) {
      console.warn('⚠️ SeelieDataManager: #app 元素没有 _vnode.component');
      return;
    }

    this.rootComponent = this.appElement._vnode.component;
    console.log('✓ SeelieDataManager 初始化成功');
  }

  /**
   * 确保组件已初始化
   */
  private ensureInitialized(): boolean {
    if (!this.rootComponent) {
      this.init();
    }
    return !!this.rootComponent;
  }

  /**
   * 获取根组件的上下文 (ctx)
   */
  private getContext(): any {
    if (!this.ensureInitialized()) {
      return null;
    }
    return this.rootComponent.ctx;
  }

  /**
   * 获取根组件的 proxy 对象
   */
  private getProxy(): any {
    if (!this.ensureInitialized()) {
      return null;
    }
    return this.rootComponent.proxy;
  }

  /**
   * 获取 accountResin 属性值
   * @returns accountResin 的当前值
   */
  getAccountResin(): any {
    const proxy = this.getProxy();
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象');
      return null;
    }

    const accountResin = proxy.accountResin;
    console.log('📖 获取 accountResin:', accountResin);
    return accountResin;
  }

  /**
   * 设置 accountResin 属性值
   * @param value 输入参数格式: ResinDataInput
   * @returns 是否设置成功
   */
  setAccountResin(value: ResinDataInput): boolean {
    const proxy = this.getProxy();
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象');
      return false;
    }

    try {
      const oldValue = proxy.accountResin;

      // 转换输入参数为 accountResin 格式
      const convertedValue = this.convertToAccountResinFormat(value);

      proxy.accountResin = convertedValue;

      console.log('✏️ 设置 accountResin:', {
        oldValue,
        inputValue: value,
        convertedValue
      });

      return true;
    } catch (error) {
      console.error('❌ 设置 accountResin 失败:', error);
      return false;
    }
  }

  /**
   * 将输入参数转换为 accountResin 格式
   * @param input 输入参数 ResinDataInput
   * @returns 转换后的格式 AccountResin
   */
  private convertToAccountResinFormat(input: ResinDataInput): AccountResin {
    if (!input || !input.progress) {
      throw new Error('输入参数格式错误，缺少 progress 字段');
    }

    const { progress, restore } = input;
    const currentAmount = progress.current;
    const maxAmount = progress.max;
    const restoreSeconds = restore;

    // 回复间隔6分钟
    const resinInterval = 360;

    // 计算当前 amount 的更新时间
    // 参考逻辑：this.dayjs().add(u, "seconds").subtract(this.resinInterval * (m - n), "seconds").toString()
    // 即：now + restore - resinInterval * (max - current)
    const now = new Date();
    const theoreticalRestoreTime = (maxAmount - currentAmount) * resinInterval; // 理论恢复时间（秒）

    // time = now + API返回的实际恢复时间 - 理论恢复时间
    const updateTime = new Date(now.getTime() + (restoreSeconds - theoreticalRestoreTime) * 1000);

    return {
      amount: currentAmount,
      time: updateTime.toString()
    };
  }



  /**
   * 获取完整的组件上下文信息（调试用）
   * @returns 组件上下文的详细信息
   */
  getContextInfo(): any {
    const proxy = this.getProxy();
    if (!proxy) {
      return null;
    }

    return {
      keys: Object.keys(proxy),
      accountResin: proxy.accountResin,
      hasAccountResin: 'accountResin' in proxy,
      contextType: typeof proxy
    };
  }

  /**
   * 设置 Toast 消息
   * @param message Toast 消息内容
   * @param type Toast 类型: 'error' | 'warning' | 'success'
   * @returns 是否设置成功
   */
  setToast(message: string, type: 'error' | 'warning' | 'success' = 'success'): boolean {
    const proxy = this.getProxy();
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象');
      return false;
    }

    try {
      proxy.toast = message;
      proxy.toastType = type;

      console.log('🍞 设置 Toast:', {
        message,
        type
      });

      return true;
    } catch (error) {
      console.error('❌ 设置 Toast 失败:', error);
      return false;
    }
  }

  /**
   * 获取角色突破等级
   * @param character 角色数据
   * @returns 突破等级
   */
  private getCharacterAsc(character: CharacterDataInput['avatar']): number {
    const stats = this.charactersStats.find(s => s.id === character.id);
    if (!stats) {
      console.warn(`⚠️ 未找到角色 ${character.name_mi18n} 的统计数据`);
      return this.ascensions.findIndex(level => level >= character.level);
    }

    const hpProperty = character.properties.find(p => p.property_id === 1);
    if (!hpProperty) {
      console.warn(`⚠️ 角色 ${character.name_mi18n} 缺少生命值属性`);
      return this.ascensions.findIndex(level => level >= character.level);
    }

    const actualHP = parseInt(hpProperty.base || hpProperty.final);
    const baseHP = stats.base;
    const growthHP = (character.level - 1) * stats.growth / 10000;
    const coreSkill = character.skills.find(s => s.skill_type === 5);
    const coreHP = (coreSkill && stats.core) ? (stats.core[coreSkill.level - 2] || 0) : 0;
    const calculatedBaseHP = baseHP + growthHP + coreHP;

    // 查找匹配的突破等级
    for (let i = 0; i < stats.ascHP.length; i++) {
      const ascHP = stats.ascHP[i];
      if (Math.floor(calculatedBaseHP + ascHP) === actualHP) {
        return i;
      }
    }

    console.log(`HP error: ${character.name_mi18n}, base: ${baseHP}, growth: ${growthHP}, core: ${coreHP}, fixed: ${calculatedBaseHP}, target: ${actualHP}`);
    return this.ascensions.findIndex(level => level >= character.level);
  }

  /**
   * 获取武器突破等级
   * @param weapon 武器数据
   * @returns 突破等级
   */
  private getWeaponAsc(weapon: WeaponData): number {
    const levelRate = this.weaponsStatsCommon.rate[weapon.level] || 0;
    const atkProperty = weapon.main_properties.find(p => p.property_id === 12101);
    if (!atkProperty) {
      console.warn(`⚠️ 武器 ${weapon.name} 缺少攻击力属性`);
      return this.ascensions.findIndex(level => level >= weapon.level);
    }

    const actualATK = parseInt(atkProperty.base);
    const baseATK = this.weaponsStats[weapon.id] || 500;
    const growthATK = baseATK * levelRate / 10000;
    const calculatedBaseATK = baseATK + growthATK;

    // 查找匹配的突破等级
    for (let i = 0; i < this.weaponsStatsCommon.ascRate.length; i++) {
      const ascRate = this.weaponsStatsCommon.ascRate[i];
      const ascATK = baseATK * ascRate / 10000;
      if (Math.floor(calculatedBaseATK + ascATK) === actualATK) {
        return i;
      }
    }

    console.log(`ATK error: ${weapon.name}, base: ${baseATK}, growth: ${growthATK}, fixed: ${calculatedBaseATK}, target: ${actualATK}`);
    return this.ascensions.findIndex(level => level >= weapon.level);
  }

  /**
   * 设置角色数据
   * @param data 角色数据
   * @returns 是否设置成功
   */
  setCharacter(data: CharacterDataInput): boolean {
    const proxy = this.getProxy();
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象');
      return false;
    }

    try {
      const character = data.avatar || data;

      // 查找角色在 characters 中的键名
      const characterKey = Object.keys(proxy.characters || {}).find(key =>
        proxy.characters[key].id === character.id
      );

      if (!characterKey) {
        throw new Error("Character not found.");
      }

      // 查找现有目标
      const existingGoal = (proxy.goals || []).find((goal: any) =>
        goal.character === characterKey && goal.type === "character"
      );

      // 计算目标等级
      let targetLevel = existingGoal?.goal?.level;
      if (!targetLevel || targetLevel < character.level) {
        targetLevel = character.level;
      }

      // 计算当前和目标突破等级
      const currentAsc = this.getCharacterAsc(character);
      let targetAsc = existingGoal?.goal?.asc;
      if (!targetAsc || targetAsc < currentAsc) {
        targetAsc = currentAsc;
      }

      // 调用 addGoal 方法
      if (typeof proxy.addGoal === 'function') {
        proxy.addGoal({
          type: "character",
          character: characterKey,
          cons: character.rank,
          current: {
            level: character.level,
            asc: currentAsc
          },
          goal: {
            level: targetLevel || character.level,
            asc: targetAsc || currentAsc
          }
        });

        console.log('✓ 角色数据设置成功:', {
          character: characterKey,
          level: character.level,
          rank: character.rank,
          currentAsc,
          targetLevel,
          targetAsc
        });

        return true;
      } else {
        console.warn('⚠️ addGoal 方法不存在');
        return false;
      }

    } catch (error) {
      console.error('❌ 设置角色数据失败:', error);
      return false;
    }
  }

  /**
   * 设置角色天赋数据
   * @param data 角色数据
   * @returns 是否设置成功
   */
  setTalents(data: CharacterDataInput): boolean {
    const proxy = this.getProxy();
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象');
      return false;
    }

    try {
      const character = data.avatar || data;

      // 查找角色在 characters 中的键名
      const characterKey = Object.keys(proxy.characters || {}).find(key =>
        proxy.characters[key].id === character.id
      );

      if (!characterKey) {
        throw new Error("Character not found.");
      }

      // 查找现有天赋目标
      const existingGoal = (proxy.goals || []).find((goal: any) =>
        goal.character === characterKey && goal.type === "talent"
      );

      const talents: any = {};

      // 处理每个技能
      character.skills.forEach(skill => {
        const skillType = this.skills[skill.skill_type];
        if (!skillType) return;

        let currentLevel = skill.level;

        // 根据技能类型和角色命座调整等级
        if (skillType === 'core') {
          currentLevel--; // 核心被动等级减1
        } else if (character.rank >= 5) {
          currentLevel -= 4; // 5命以上减4
        } else if (character.rank >= 3) {
          currentLevel -= 2; // 3命以上减2
        }

        // 计算目标等级
        let targetLevel = existingGoal?.[skillType]?.goal;
        if (!targetLevel || targetLevel < currentLevel) {
          targetLevel = currentLevel;
        }

        talents[skillType] = {
          current: currentLevel,
          goal: targetLevel || currentLevel
        };
      });

      // 调用 addGoal 方法
      if (typeof proxy.addGoal === 'function') {
        proxy.addGoal({
          type: "talent",
          character: characterKey,
          ...talents
        });

        console.log('✓ 角色天赋数据设置成功:', {
          character: characterKey,
          talents
        });

        return true;
      } else {
        console.warn('⚠️ addGoal 方法不存在');
        return false;
      }

    } catch (error) {
      console.error('❌ 设置角色天赋数据失败:', error);
      return false;
    }
  }

  /**
   * 设置武器数据
   * @param data 角色数据（包含武器信息）
   * @returns 是否设置成功
   */
  setWeapon(data: CharacterDataInput): boolean {
    const proxy = this.getProxy();
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象');
      return false;
    }

    try {
      const character = data.avatar || data;
      const weapon = data.weapon;

      // 查找角色在 characters 中的键名
      const characterKey = Object.keys(proxy.characters || {}).find(key =>
        proxy.characters[key].id === character.id
      );

      if (!characterKey) {
        throw new Error("Character not found.");
      }

      // 查找现有武器目标
      const existingGoal = (proxy.goals || []).find((goal: any) =>
        goal.character === characterKey && goal.type === "weapon"
      );

      // 如果没有武器数据，移除现有目标
      if (!weapon) {
        if (existingGoal && typeof proxy.removeGoal === 'function') {
          proxy.removeGoal(existingGoal);
          console.log('✓ 移除武器目标成功');
        }
        return true;
      }

      // 计算当前武器数据
      const currentAsc = this.getWeaponAsc(weapon);
      const current = {
        level: weapon.level,
        asc: currentAsc
      };

      // 初始化目标数据
      let goal = {
        level: current.level,
        asc: current.asc
      };

      // 查找现有武器信息和新武器信息
      const existingWeapon = existingGoal ? this.weapons[existingGoal.weapon] : null;
      const weaponKey = Object.keys(this.weapons).find(key =>
        this.weapons[key].id === weapon.id
      );
      const newWeapon = weaponKey ? this.weapons[weaponKey] : null;

      if (!weaponKey) {
        throw new Error("Weapon not found.");
      }

      // 如果是同一把武器，保持现有目标
      if (existingWeapon?.id === newWeapon?.id) {
        goal.level = existingGoal.goal.level;
        if (goal.level < current.level) {
          goal.level = current.level;
        }

        goal.asc = existingGoal.goal.asc;
        if (goal.asc < current.asc) {
          goal.asc = current.asc;
        }

        // 处理可锻造武器的精炼等级
        if (newWeapon?.craftable) {
          (current as any).craft = weapon.star;
          (goal as any).craft = existingGoal.goal.craft;
          if ((goal as any).craft < (current as any).craft) {
            (goal as any).craft = (current as any).craft;
          }
        }
      } else {
        // 不同武器，处理可锻造武器
        if (newWeapon?.craftable) {
          (current as any).craft = weapon.star;
          (goal as any).craft = weapon.star;
        }
      }

      // 调用 addGoal 方法
      if (typeof proxy.addGoal === 'function') {
        proxy.addGoal({
          type: "weapon",
          character: characterKey,
          weapon: weaponKey,
          current,
          goal
        });

        console.log('✓ 武器数据设置成功:', {
          character: characterKey,
          weapon: weaponKey,
          current,
          goal
        });

        return true;
      } else {
        console.warn('⚠️ addGoal 方法不存在');
        return false;
      }

    } catch (error) {
      console.error('❌ 设置武器数据失败:', error);
      return false;
    }
  }

  /**
   * 重新初始化（当页面路由变化时调用）
   */
  refresh(): void {
    console.log('🔄 SeelieDataManager 重新初始化...');
    this.appElement = null;
    this.rootComponent = null;
    this.init();
  }
}

// 创建全局实例
export const seelieDataManager = new SeelieDataManager();

/**
 * 设置树脂数据的便捷函数
 * @param data 树脂数据对象
 */
export const setResinData = (data: ResinDataInput): boolean => {
  return seelieDataManager.setAccountResin(data);
};

/**
 * 设置 Toast 消息的便捷函数
 * @param message Toast 消息内容
 * @param type Toast 类型: 'error' | 'warning' | 'success'
 */
export const setToast = (message: string, type: 'error' | 'warning' | 'success' = 'success'): boolean => {
  return seelieDataManager.setToast(message, type);
};

/**
 * 设置角色数据的便捷函数
 * @param data 角色数据对象
 */
export const setCharacter = (data: CharacterDataInput): boolean => {
  return seelieDataManager.setCharacter(data);
};

/**
 * 设置角色天赋数据的便捷函数
 * @param data 角色数据对象
 */
export const setTalents = (data: CharacterDataInput): boolean => {
  return seelieDataManager.setTalents(data);
};

/**
 * 设置武器数据的便捷函数
 * @param data 角色数据对象（包含武器信息）
 */
export const setWeapon = (data: CharacterDataInput): boolean => {
  return seelieDataManager.setWeapon(data);
};

// 挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).setResinData = setResinData;
  (window as any).setToast = setToast;
  (window as any).setCharacter = setCharacter;
  (window as any).setTalents = setTalents;
  (window as any).setWeapon = setWeapon;
}