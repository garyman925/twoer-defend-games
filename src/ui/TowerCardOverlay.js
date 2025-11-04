export class TowerCardOverlay {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.root = null;
    this.cards = [];
    this.selectedType = null;
    this.isEnabled = true; // 🆕 卡片是否可用（準備階段為 true，戰鬥階段為 false）

    // 🆕 每個塔類型的初始使用次數（改為次數制）
    this.towerTypes = [
      { type: 'basic', name: 'Gatling', usesRemaining: 5, icon: '●' },
      { type: 'cannon', name: 'Striker', usesRemaining: 5, icon: '💥' },
      { type: 'laser', name: 'Railgun', usesRemaining: 5, icon: '⚡' },
      { type: 'ice', name: 'Frost', usesRemaining: 5, icon: '❄️' }
    ];
  }

  ensureOverlayContainer() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return null;

    let overlay = gameContainer.querySelector('#ui-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ui-overlay';
      overlay.style.position = 'absolute';
      overlay.style.inset = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '10';
      gameContainer.appendChild(overlay);
    }
    return overlay;
  }

  create() {
    this.container = this.ensureOverlayContainer();
    if (!this.container) return;

    // 半透明底部背景（使用 CSS 類別以便外部樣式控制）
    const bg = document.createElement('div');
    bg.setAttribute('data-overlay-bg', '');
    bg.className = 'tower-card-bg';
    this.container.appendChild(bg);

    // 卡片列容器
    this.root = document.createElement('div');
    this.root.id = 'tower-card-bar';
    this.root.classList.add('preparation-mode'); // 🆕 初始為準備模式
    this.container.appendChild(this.root);

    // 生成卡片
    this.towerTypes.forEach(cfg => {
      const card = document.createElement('button');
      card.type = 'button';
      card.dataset.tower = cfg.type;
      card.dataset.uses = String(cfg.usesRemaining);
      card.className = 'tower-card';
      
      // 🆕 只顯示剩餘次數
      card.innerHTML = `
        <div class="tower-icon tower-icon-${cfg.type}"></div>
        <div class="tower-name">${cfg.name}</div>
        <div class="tower-cost">${cfg.usesRemaining}</div>
      `;

      card.addEventListener('mouseenter', () => {
        // hover 效果交由 CSS 控制
      });
      card.addEventListener('mouseleave', () => {
        // hover 效果交由 CSS 控制
      });
      card.addEventListener('click', () => this.select(cfg.type));

      this.cards.push({ el: card, ...cfg });
      this.root.appendChild(card);
    });
    
    // 初始更新可用性
    this.updateCardAvailability();
  }

  select(type) {
    // 🆕 如果卡片被禁用，無法選擇
    if (!this.isEnabled) {
      console.warn('⚠️ 塔卡片已禁用，無法選擇（戰鬥階段中）');
      return;
    }
    
    // 取消舊選擇
    this.cards.forEach(c => {
      if (c.type === this.selectedType) {
        c.el.classList.remove('is-selected');
      }
    });

    this.selectedType = type;
    const card = this.cards.find(c => c.type === type);
    if (card && card.usesRemaining > 0) {
      card.el.classList.add('is-selected');
      // 通知 Phaser 場景
      this.scene.events.emit('towerCardSelected', {
        type: card.type,
        name: card.name,
        usesRemaining: card.usesRemaining
      });
    }
  }

  // 🆕 使用一次塔（減少次數）
  useTower(type) {
    const card = this.cards.find(c => c.type === type);
    if (card && card.usesRemaining > 0) {
      card.usesRemaining--;
      
      // 更新 UI 顯示（只顯示數字）
      const costEl = card.el.querySelector('.tower-cost');
      if (costEl) {
        costEl.textContent = card.usesRemaining;
      }
      
      card.el.dataset.uses = String(card.usesRemaining);
      
      console.log(`${card.name} 使用一次，剩餘: ${card.usesRemaining}`);
      
      this.updateCardAvailability();
      
      return true;
    }
    return false;
  }

  // 🆕 檢查是否還有使用次數
  hasUsesRemaining(type) {
    const card = this.cards.find(c => c.type === type);
    return card && card.usesRemaining > 0;
  }

  // 🆕 重置所有塔的使用次數
  resetAllUses() {
    this.cards.forEach(card => {
      card.usesRemaining = 5;
      const costEl = card.el.querySelector('.tower-cost');
      if (costEl) {
        costEl.textContent = card.usesRemaining;
      }
      card.el.dataset.uses = String(card.usesRemaining);
    });
    this.updateCardAvailability();
  }

  // 🆕 更新卡片可用性（基於剩餘次數）
  updateCardAvailability() {
    this.cards.forEach(c => {
      const canUse = c.usesRemaining > 0;
      c.el.disabled = !canUse;
      
      if (!canUse && this.selectedType === c.type) {
        this.selectedType = null;
        c.el.classList.remove('is-selected');
      }
      
      // 簡單的視覺反饋：沒有次數時變暗
      if (!canUse) {
        c.el.style.opacity = '0.3';
      } else {
        c.el.style.opacity = '1';
      }
    });
  }

  // 🆕 設置卡片啟用/禁用狀態
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    // 切換容器的視覺狀態
    if (this.root) {
      if (enabled) {
        this.root.classList.remove('combat-mode');
        this.root.classList.add('preparation-mode');
        this.root.style.opacity = '1';
        this.root.style.pointerEvents = 'auto';
        this.root.style.transition = 'opacity 0.3s ease';
      } else {
        this.root.classList.remove('preparation-mode');
        this.root.classList.add('combat-mode');
        this.root.style.opacity = '0.5';
        this.root.style.pointerEvents = 'none';
        this.root.style.transition = 'opacity 0.3s ease';
      }
    }
    
    // 設置每個卡片的狀態
    this.cards.forEach(card => {
      if (!enabled) {
        // 禁用時：取消選擇
        card.el.classList.remove('is-selected');
      }
    });
    
    // 如果禁用，取消當前選擇
    if (!enabled) {
      this.selectedType = null;
    }
    
    console.log(`🃏 塔卡片 UI ${enabled ? '已啟用' : '已禁用'}`);
  }

  deselectAll() {
    this.cards.forEach(c => {
      c.el.classList.remove('is-selected');
    });
    this.selectedType = null;
  }

  destroy() {
    if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
    if (this.container) {
      const bg = this.container.querySelector('[data-overlay-bg]');
      if (bg && bg.parentNode) bg.parentNode.removeChild(bg);
    }
    this.cards = [];
    this.root = null;
    this.container = null;
  }
}

export default TowerCardOverlay;
