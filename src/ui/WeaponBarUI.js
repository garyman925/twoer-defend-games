/**
 * 武器欄 UI
 * 顯示玩家裝備的3種武器及其狀態
 */

export class WeaponBarUI {
  constructor(scene, weaponManager) {
    this.scene = scene;
    this.weaponManager = weaponManager;
    this.container = null;
    this.weaponCards = [];
    this.cooldownTimers = new Map(); // 儲存每個武器的冷卻計時器
  }

  /**
   * 創建 UI
   */
  create() {
    // 創建武器欄容器
    this.container = document.createElement('div');
    this.container.id = 'weapon-bar';
    this.container.className = 'weapon-bar';
    
    // 創建3個武器卡片
    const weapons = this.weaponManager.getAllWeaponStates();
    
    weapons.forEach((weaponData, index) => {
      const card = this.createWeaponCard(weaponData, index);
      this.weaponCards.push(card);
      this.container.appendChild(card.element);
    });
    
    // 添加到遊戲容器
    let uiOverlay = document.getElementById('ui-overlay');
    if (!uiOverlay) {
      uiOverlay = document.getElementById('game-container');
    }
    
    if (uiOverlay) {
      uiOverlay.appendChild(this.container);
    }
    
    // 設置事件監聽
    this.setupEventListeners();
    
    console.log('✅ 武器欄 UI 創建完成');
  }

  /**
   * 創建武器卡片
   */
  createWeaponCard(weaponData, index) {
    const { config, state, isSelected } = weaponData;
    
    const card = document.createElement('div');
    card.className = 'weapon-card';
    card.dataset.weapon = config.id;
    card.dataset.slot = index;
    
    if (isSelected) {
      card.classList.add('selected');
    }
    
    card.innerHTML = `
      <div class="weapon-hotkey">${index + 1}</div>
      <div class="weapon-icon">${config.icon}</div>
      <div class="weapon-name">${config.displayName}</div>
      <div class="weapon-ammo">${this.getAmmoDisplay(config, state)}</div>
      <div class="weapon-cooldown-overlay" style="display: none;">
        <span class="cooldown-time">0s</span>
      </div>
    `;
    
    // 點擊切換武器
    card.addEventListener('click', () => {
      this.onWeaponCardClick(index);
    });
    
    return {
      element: card,
      weaponId: config.id,
      index: index
    };
  }

  /**
   * 獲取彈藥顯示文字
   */
  getAmmoDisplay(config, state) {
    if (config.ammo.type === 'infinite') {
      return '∞';
    } else {
      return `${state.currentAmmo}/${state.maxAmmo}`;
    }
  }

  /**
   * 武器卡片點擊處理
   */
  onWeaponCardClick(index) {
    console.log(`🖱️ 點擊武器卡片: 槽位 ${index + 1}`);
    this.weaponManager.switchWeapon(index);
  }

  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    // 監聽武器切換
    this.weaponManager.eventEmitter.on('weaponSwitched', (data) => {
      this.updateSelection(data.index);
    });
    
    // 監聽武器射擊
    this.weaponManager.eventEmitter.on('weaponFired', (data) => {
      this.updateAmmo(data.weapon.id);
    });
    
    // 監聽冷卻開始
    this.weaponManager.eventEmitter.on('weaponCooldownStart', (data) => {
      this.showCooldown(data.weaponId, data.duration);
    });
    
    // 監聽冷卻結束
    this.weaponManager.eventEmitter.on('weaponCooldownEnd', (data) => {
      this.hideCooldown(data.weaponId);
      this.updateAmmo(data.weaponId);
    });
    
    // 設置鍵盤快捷鍵
    this.setupHotkeys();
  }

  /**
   * 設置快捷鍵 (1/2/3)
   */
  setupHotkeys() {
    this.scene.input.keyboard.on('keydown-ONE', () => {
      this.weaponManager.switchWeapon(0);
    });
    
    this.scene.input.keyboard.on('keydown-TWO', () => {
      this.weaponManager.switchWeapon(1);
    });
    
    this.scene.input.keyboard.on('keydown-THREE', () => {
      this.weaponManager.switchWeapon(2);
    });
    
    console.log('⌨️ 武器快捷鍵已設置 (1/2/3)');
  }

  /**
   * 更新選中狀態
   */
  updateSelection(selectedIndex) {
    this.weaponCards.forEach((card, index) => {
      if (index === selectedIndex) {
        card.element.classList.add('selected');
      } else {
        card.element.classList.remove('selected');
      }
    });
  }

  /**
   * 更新彈藥顯示
   */
  updateAmmo(weaponId) {
    const card = this.weaponCards.find(c => c.weaponId === weaponId);
    if (!card) return;
    
    const config = this.weaponManager.weaponData.WEAPONS[weaponId];
    const state = this.weaponManager.weaponStates.get(weaponId);
    
    const ammoEl = card.element.querySelector('.weapon-ammo');
    if (ammoEl) {
      ammoEl.textContent = this.getAmmoDisplay(config, state);
      
      // 彈藥變化動畫
      ammoEl.classList.add('ammo-change');
      setTimeout(() => ammoEl.classList.remove('ammo-change'), 300);
    }
  }

  /**
   * 顯示冷卻倒數
   */
  showCooldown(weaponId, duration) {
    const card = this.weaponCards.find(c => c.weaponId === weaponId);
    if (!card) return;
    
    const overlay = card.element.querySelector('.weapon-cooldown-overlay');
    const timeEl = overlay.querySelector('.cooldown-time');
    
    if (overlay && timeEl) {
      overlay.style.display = 'flex';
      
      // 停止舊的計時器
      if (this.cooldownTimers.has(weaponId)) {
        cancelAnimationFrame(this.cooldownTimers.get(weaponId));
      }
      
      // 倒數計時
      const startTime = Date.now();
      const updateCooldown = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const seconds = (remaining / 1000).toFixed(1);
        
        timeEl.textContent = `${seconds}s`;
        
        if (remaining > 0) {
          const timerId = requestAnimationFrame(updateCooldown);
          this.cooldownTimers.set(weaponId, timerId);
        } else {
          this.hideCooldown(weaponId);
        }
      };
      
      updateCooldown();
    }
  }

  /**
   * 隱藏冷卻覆蓋
   */
  hideCooldown(weaponId) {
    const card = this.weaponCards.find(c => c.weaponId === weaponId);
    if (!card) return;
    
    const overlay = card.element.querySelector('.weapon-cooldown-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    // 清理計時器
    if (this.cooldownTimers.has(weaponId)) {
      cancelAnimationFrame(this.cooldownTimers.get(weaponId));
      this.cooldownTimers.delete(weaponId);
    }
  }

  /**
   * 銷毀 UI
   */
  destroy() {
    // 清理所有冷卻計時器
    this.cooldownTimers.forEach((timerId) => {
      cancelAnimationFrame(timerId);
    });
    this.cooldownTimers.clear();
    
    // 移除 DOM 元素
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.weaponCards = [];
    this.container = null;
    
    console.log('🗑️ 武器欄 UI 已銷毀');
  }
}

