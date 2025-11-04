/**
 * 武器管理器
 * 管理玩家的武器配置、切換、彈藥和冷卻
 */

export class WeaponManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    
    // 武器配置
    this.weaponData = null;
    this.equippedWeapons = []; // 已裝備的武器ID（最多3個）
    this.currentWeapon = null;
    this.currentWeaponIndex = 0;
    
    // 武器狀態
    this.weaponStates = new Map(); // 儲存每個武器的彈藥/冷卻狀態
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
  }

  /**
   * 初始化武器系統
   */
  async init() {
    // 載入武器數據
    await this.loadWeaponData();
    
    // 從玩家裝備配置載入武器
    this.loadPlayerLoadout();
    
    // 初始化武器狀態
    this.initializeWeaponStates();
    
    // 切換到第一個武器
    this.switchWeapon(0);
    
    console.log('✅ 武器管理器初始化完成');
  }

  /**
   * 載入武器數據
   */
  async loadWeaponData() {
    try {
      const response = await fetch('assets/data/weaponData.json');
      this.weaponData = await response.json();
      console.log('✅ 武器數據載入完成', this.weaponData);
    } catch (error) {
      console.error('❌ 武器數據載入失敗', error);
      // 使用預設配置
      this.weaponData = this.getDefaultWeaponData();
    }
  }

  /**
   * 載入玩家武器配置
   */
  loadPlayerLoadout() {
    // 從 localStorage 讀取玩家裝備
    const savedLoadout = localStorage.getItem('playerWeaponLoadout');
    
    if (savedLoadout) {
      try {
        const loadout = JSON.parse(savedLoadout);
        this.equippedWeapons = loadout.weapons || ['vulcan', 'missile', 'bomb'];
      } catch (error) {
        console.warn('⚠️ 讀取武器配置失敗，使用預設配置', error);
        this.equippedWeapons = ['vulcan', 'missile', 'bomb'];
      }
    } else {
      // 預設配置（新手武器）
      this.equippedWeapons = ['vulcan', 'missile', 'bomb'];
    }
    
    console.log('✅ 玩家武器配置:', this.equippedWeapons);
  }

  /**
   * 初始化武器狀態
   */
  initializeWeaponStates() {
    this.equippedWeapons.forEach(weaponId => {
      const weaponConfig = this.weaponData.WEAPONS[weaponId];
      if (weaponConfig) {
        this.weaponStates.set(weaponId, {
          currentAmmo: weaponConfig.ammo.maxAmmo === -1 ? -1 : weaponConfig.ammo.maxAmmo,
          maxAmmo: weaponConfig.ammo.maxAmmo,
          cooldownRemaining: 0,
          isReloading: false,
          lastFireTime: 0
        });
      }
    });
    
    console.log('✅ 武器狀態初始化完成');
  }

  /**
   * 切換武器
   */
  switchWeapon(index) {
    if (index < 0 || index >= this.equippedWeapons.length) {
      console.warn('⚠️ 無效的武器索引:', index);
      return false;
    }
    
    const weaponId = this.equippedWeapons[index];
    const weaponConfig = this.weaponData.WEAPONS[weaponId];
    
    if (!weaponConfig) {
      console.error('❌ 武器配置不存在:', weaponId);
      return false;
    }
    
    this.currentWeaponIndex = index;
    this.currentWeapon = weaponConfig;
    
    console.log(`🔫 切換到武器: ${weaponConfig.displayName} (槽位${index + 1})`);
    
    // 發送武器切換事件
    this.eventEmitter.emit('weaponSwitched', {
      weapon: weaponConfig,
      index: index
    });
    
    return true;
  }

  /**
   * 使用當前武器（射擊）
   */
  fire(targetX, targetY) {
    if (!this.currentWeapon) return false;
    
    const weaponId = this.currentWeapon.id;
    const state = this.weaponStates.get(weaponId);
    
    // 檢查是否可以射擊
    if (!this.canFire(weaponId)) {
      console.log(`⚠️ ${this.currentWeapon.displayName} 無法射擊`);
      return false;
    }
    
    // 更新彈藥
    if (state.maxAmmo !== -1) {
      state.currentAmmo--;
      
      console.log(`🔫 ${this.currentWeapon.displayName} 發射！剩餘彈藥: ${state.currentAmmo}/${state.maxAmmo}`);
      
      // 如果彈藥用完，開始冷卻
      if (state.currentAmmo <= 0) {
        this.startCooldown(weaponId);
      }
    }
    
    state.lastFireTime = this.scene.time.now;
    
    // 發送射擊事件
    this.eventEmitter.emit('weaponFired', {
      weapon: this.currentWeapon,
      targetX: targetX,
      targetY: targetY,
      ammoRemaining: state.currentAmmo
    });
    
    return true;
  }

  /**
   * 檢查是否可以射擊
   */
  canFire(weaponId) {
    const state = this.weaponStates.get(weaponId);
    const config = this.weaponData.WEAPONS[weaponId];
    
    if (!state || !config) return false;
    
    // 檢查冷卻
    if (state.cooldownRemaining > 0) {
      return false;
    }
    
    // 檢查彈藥
    if (state.maxAmmo !== -1 && state.currentAmmo <= 0) {
      return false;
    }
    
    // 檢查射速
    const timeSinceLastFire = this.scene.time.now - state.lastFireTime;
    if (timeSinceLastFire < config.stats.fireRate) {
      return false;
    }
    
    return true;
  }

  /**
   * 開始冷卻
   */
  startCooldown(weaponId) {
    const state = this.weaponStates.get(weaponId);
    const config = this.weaponData.WEAPONS[weaponId];
    
    if (!state || !config) return;
    
    state.isReloading = true;
    state.cooldownRemaining = config.ammo.cooldown;
    
    console.log(`⏱️ ${config.displayName} 開始冷卻: ${state.cooldownRemaining / 1000}秒`);
    
    // 發送冷卻開始事件
    this.eventEmitter.emit('weaponCooldownStart', {
      weaponId: weaponId,
      duration: state.cooldownRemaining
    });
  }

  /**
   * 更新武器狀態（每幀調用）
   */
  update(time, delta) {
    // 更新所有武器的冷卻狀態
    this.weaponStates.forEach((state, weaponId) => {
      if (state.cooldownRemaining > 0) {
        state.cooldownRemaining -= delta;
        
        if (state.cooldownRemaining <= 0) {
          // 冷卻結束，恢復彈藥
          state.cooldownRemaining = 0;
          state.isReloading = false;
          
          const config = this.weaponData.WEAPONS[weaponId];
          state.currentAmmo = config.ammo.maxAmmo;
          
          console.log(`✅ ${config.displayName} 冷卻完成，彈藥已恢復`);
          
          this.eventEmitter.emit('weaponCooldownEnd', {
            weaponId: weaponId
          });
        }
      }
    });
  }

  /**
   * 獲取當前武器狀態
   */
  getCurrentWeaponState() {
    if (!this.currentWeapon) return null;
    
    return {
      weapon: this.currentWeapon,
      state: this.weaponStates.get(this.currentWeapon.id),
      index: this.currentWeaponIndex
    };
  }

  /**
   * 獲取所有武器狀態（供UI使用）
   */
  getAllWeaponStates() {
    return this.equippedWeapons.map((weaponId, index) => {
      const config = this.weaponData.WEAPONS[weaponId];
      const state = this.weaponStates.get(weaponId);
      
      return {
        index: index,
        id: weaponId,
        config: config,
        state: state,
        isSelected: index === this.currentWeaponIndex,
        canFire: this.canFire(weaponId)
      };
    });
  }

  /**
   * 裝備武器（從商店購買後調用）
   */
  equipWeapon(weaponId, slotIndex) {
    if (slotIndex < 0 || slotIndex > 2) {
      console.error('❌ 無效的武器槽位:', slotIndex);
      return false;
    }
    
    const weaponConfig = this.weaponData.WEAPONS[weaponId];
    if (!weaponConfig) {
      console.error('❌ 武器不存在:', weaponId);
      return false;
    }
    
    // 替換武器槽位
    this.equippedWeapons[slotIndex] = weaponId;
    
    // 初始化新武器的狀態
    this.weaponStates.set(weaponId, {
      currentAmmo: weaponConfig.ammo.maxAmmo === -1 ? -1 : weaponConfig.ammo.maxAmmo,
      maxAmmo: weaponConfig.ammo.maxAmmo,
      cooldownRemaining: 0,
      isReloading: false,
      lastFireTime: 0
    });
    
    // 儲存配置
    this.saveLoadout();
    
    console.log(`✅ ${weaponConfig.displayName} 已裝備到槽位 ${slotIndex + 1}`);
    
    this.eventEmitter.emit('weaponEquipped', {
      weaponId: weaponId,
      slotIndex: slotIndex
    });
    
    return true;
  }

  /**
   * 儲存武器配置到 localStorage
   */
  saveLoadout() {
    const loadout = {
      weapons: this.equippedWeapons,
      timestamp: Date.now()
    };
    
    localStorage.setItem('playerWeaponLoadout', JSON.stringify(loadout));
    console.log('💾 武器配置已儲存');
  }

  /**
   * 獲取預設武器數據（備用）
   */
  getDefaultWeaponData() {
    return {
      WEAPONS: {
        vulcan: {
          id: 'vulcan',
          name: 'Vulcan',
          displayName: 'Vulcan',
          type: 'rapid',
          category: 'primary',
          icon: '🔫',
          stats: { damage: 20, fireRate: 150, projectileSpeed: 600 },
          ammo: { type: 'infinite', maxAmmo: -1, cooldown: 0 }
        },
        missile: {
          id: 'missile',
          name: 'Missile',
          displayName: 'Missile',
          type: 'homing',
          category: 'secondary',
          icon: '🚀',
          stats: { damage: 100, fireRate: 1000, projectileSpeed: 400 },
          ammo: { type: 'cooldown', maxAmmo: 3, cooldown: 5000, autoReload: true }
        },
        bomb: {
          id: 'bomb',
          name: 'Bomb',
          displayName: 'Bomb',
          type: 'aoe',
          category: 'special',
          icon: '💣',
          stats: { damage: 200, fireRate: 0, projectileSpeed: 300 },
          ammo: { type: 'cooldown', maxAmmo: 1, cooldown: 10000, autoReload: true }
        }
      },
      DEFAULT_LOADOUT: {
        slot1: 'vulcan',
        slot2: 'missile',
        slot3: 'bomb'
      }
    };
  }

  /**
   * 銷毀
   */
  destroy() {
    this.eventEmitter.removeAllListeners();
    this.weaponStates.clear();
    this.weaponData = null;
    this.currentWeapon = null;
  }
}

