export class TowerCardOverlay {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.root = null;
    this.cards = [];
    this.selectedType = null;

    this.towerTypes = [
      { type: 'basic', name: '基礎塔', cost: 50, icon: '●' },
      { type: 'cannon', name: '加農炮', cost: 100, icon: '💥' },
      { type: 'laser', name: '激光塔', cost: 150, icon: '⚡' },
      { type: 'ice', name: '冰凍塔', cost: 120, icon: '❄️' }
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
    this.container.appendChild(this.root);

    // 生成卡片
    this.towerTypes.forEach(cfg => {
      const card = document.createElement('button');
      card.type = 'button';
      card.dataset.tower = cfg.type;
      card.dataset.cost = String(cfg.cost);
      card.className = 'tower-card';
      card.innerHTML = `
        <div class="tower-icon tower-icon-${cfg.type}"></div>
        <div class="tower-name">${cfg.name}</div>
        <div class="tower-cost">$${cfg.cost}</div>
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
  }

  select(type) {
    // 取消舊選擇
    this.cards.forEach(c => {
      if (c.type === this.selectedType) {
        c.el.classList.remove('is-selected');
      }
    });

    this.selectedType = type;
    const card = this.cards.find(c => c.type === type);
    if (card) {
      card.el.classList.add('is-selected');
      // 通知 Phaser 場景
      this.scene.events.emit('towerCardSelected', {
        type: card.type,
        name: card.name,
        cost: card.cost
      });
    }
  }

  updateCardAvailability(playerMoney) {
    this.cards.forEach(c => {
      const can = playerMoney >= c.cost;
      c.el.disabled = !can;
      if (!can && this.selectedType === c.type) {
        this.selectedType = null;
        c.el.classList.remove('is-selected');
      }
    });
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
