/**
 * 塔卡片選擇 UI
 * 負責顯示底部塔選擇區域和處理卡片交互
 */
export class TowerCardUI {
  constructor(scene) {
    this.scene = scene;
    this.cards = [];
    this.selectedCard = null;
    this.cardSpacing = 20; // 卡片間距
    this.cardWidth = 97;   // 卡片寬度
    this.cardHeight = 129; // 卡片高度
    this.uiHeight = 130;   // 底部UI區域高度
    
    // 塔類型配置
    this.towerTypes = [
      { type: 'basic', name: '基礎塔', cardFrame: 'basic-tower-card.png', cost: 50 },
      { type: 'cannon', name: '加農炮', cardFrame: 'canon-tower-card.png', cost: 100 },
      { type: 'laser', name: '激光塔', cardFrame: 'laser-tower-card.png', cost: 150 },
      { type: 'ice', name: '冰凍塔', cardFrame: 'ice-tower-card.png', cost: 120 }
    ];
  }

  /**
   * 創建塔卡片選擇區域
   */
  create() {
    
    // 計算卡片區域位置
    const { width, height } = this.scene.scale.gameSize;
    const startX = this.cardSpacing;
    const cardY = height - this.uiHeight + (this.uiHeight - this.cardHeight) / 2;
    
    // 創建背景
    this.createBackground(width, height);
    
    // 創建每個塔卡片
    this.towerTypes.forEach((towerConfig, index) => {
      const cardX = startX + index * (this.cardWidth + this.cardSpacing);
      const card = this.createTowerCard(cardX, cardY, towerConfig, index);
      this.cards.push(card);
    });
    
  }

  /**
   * 創建底部背景
   */
  createBackground(width, height) {
    // 創建半透明背景
    this.background = this.scene.add.rectangle(
      width / 2, 
      height - this.uiHeight / 2, 
      width, 
      this.uiHeight, 
      0x000000, 
      0.8
    );
    this.background.setDepth(1000);
    
    // 添加頂部邊框
    this.border = this.scene.add.rectangle(
      width / 2,
      height - this.uiHeight,
      width,
      2,
      0x444444
    );
    this.border.setDepth(1001);
  }

  /**
   * 創建單個塔卡片
   */
  createTowerCard(x, y, towerConfig, index) {
    const card = {
      type: towerConfig.type,
      name: towerConfig.name,
      cost: towerConfig.cost,
      cardFrame: towerConfig.cardFrame,
      index: index,
      container: null,
      sprite: null,
      shadow: null,
      highlight: null,
      costText: null,
      isSelected: false
    };

    // 創建卡片容器
    card.container = this.scene.add.container(x, y);
    card.container.setDepth(1002);
    card.container.setSize(this.cardWidth, this.cardHeight);
    card.container.setInteractive();

    // 創建陰影
    card.shadow = this.scene.add.rectangle(2, 2, this.cardWidth, this.cardHeight, 0x000000, 0.3);
    card.shadow.setOrigin(0.5);
    card.container.add(card.shadow);

    // 創建卡片精靈
    card.sprite = this.scene.add.image(0, 0, 'tower-sprites', card.cardFrame);
    card.sprite.setOrigin(0.5);
    card.container.add(card.sprite);

    // 創建高亮效果（初始隱藏）
    card.highlight = this.scene.add.rectangle(0, 0, this.cardWidth + 8, this.cardHeight + 8, 0x00ff00, 0);
    card.highlight.setStrokeStyle(3, 0x00ff00, 0.8);
    card.highlight.setOrigin(0.5);
    card.container.add(card.highlight);

    // 創建價格文字
    card.costText = this.scene.add.text(0, this.cardHeight / 2 - 10, `$${card.cost}`, {
      fontSize: '14px',
      fill: '#ffd93d',
      fontWeight: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    card.costText.setOrigin(0.5);
    card.container.add(card.costText);

    // 添加交互事件
    this.addCardInteractions(card);

    return card;
  }

  /**
   * 添加卡片交互事件
   */
  addCardInteractions(card) {
    // Hover 效果
    card.container.on('pointerover', () => {
      if (!card.isSelected) {
        card.sprite.setScale(1.1);
        card.shadow.setScale(1.1);
        card.container.y -= 5;
      }
    });

    card.container.on('pointerout', () => {
      if (!card.isSelected) {
        card.sprite.setScale(1.0);
        card.shadow.setScale(1.0);
        card.container.y += 5;
      }
    });

    // 點擊選擇
    card.container.on('pointerdown', () => {
      this.selectCard(card);
    });
  }

  /**
   * 選擇卡片
   */
  selectCard(selectedCard) {
    // 取消之前選中的卡片
    if (this.selectedCard) {
      this.deselectCard(this.selectedCard);
    }

    // 選中新的卡片
    selectedCard.isSelected = true;
    selectedCard.highlight.setVisible(true);
    selectedCard.sprite.setScale(1.1);
    selectedCard.shadow.setScale(1.1);
    selectedCard.container.y -= 5;

    this.selectedCard = selectedCard;

    console.log(`🎯 選擇了塔: ${selectedCard.name} (${selectedCard.type})`);

    // 通知遊戲場景開始放置塔
    this.scene.events.emit('towerCardSelected', {
      type: selectedCard.type,
      name: selectedCard.name,
      cost: selectedCard.cost
    });
  }

  /**
   * 取消選擇卡片
   */
  deselectCard(card) {
    card.isSelected = false;
    card.highlight.setVisible(false);
    card.sprite.setScale(1.0);
    card.shadow.setScale(1.0);
    card.container.y += 5;
  }

  /**
   * 取消所有選擇
   */
  deselectAll() {
    if (this.selectedCard) {
      this.deselectCard(this.selectedCard);
      this.selectedCard = null;
    }
  }

  /**
   * 檢查是否有足夠的金錢購買塔
   */
  canAffordTower(towerType, playerMoney) {
    const towerConfig = this.towerTypes.find(t => t.type === towerType);
    return towerConfig && playerMoney >= towerConfig.cost;
  }

  /**
   * 更新卡片可用性（基於金錢）
   */
  updateCardAvailability(playerMoney) {
    this.cards.forEach(card => {
      const canAfford = playerMoney >= card.cost;
      card.sprite.setAlpha(canAfford ? 1.0 : 0.5);
      card.costText.setAlpha(canAfford ? 1.0 : 0.5);
      
      // 如果無法負擔且已選中，取消選擇
      if (!canAfford && card.isSelected) {
        this.deselectAll();
      }
    });
  }

  /**
   * 銷毀UI
   */
  destroy() {
    if (this.background) {
      this.background.destroy();
    }
    if (this.border) {
      this.border.destroy();
    }
    this.cards.forEach(card => {
      if (card.container) {
        card.container.destroy();
      }
    });
    this.cards = [];
    this.selectedCard = null;
  }
}
