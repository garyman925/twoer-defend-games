/**
 * 塔建造UI界面
 * 顯示塔商店、建造按鈕、資源信息等
 */

import GameConfig from '../core/GameConfig.js';

export class TowerBuildUI extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    
    // UI狀態
    this.isVisible = true;
    this.selectedTowerType = null;
    
    // UI元素
    this.buildPanel = null;
    this.towerButtons = [];
    this.infoPanel = null;
    this.resourceDisplay = null;
    
    // 建造系統引用
    this.placementSystem = null;
    
    // 塔類型數據
    this.towerTypes = [];
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 初始化UI
    this.init();
    
    // 添加到場景
    scene.add.existing(this);
    
    console.log('塔建造UI創建完成');
  }

  /**
   * 初始化UI
   */
  init() {
    // 加載塔類型數據
    this.loadTowerTypes();
    
    // 創建主面板
    this.createBuildPanel();
    
    // 創建塔建造按鈕
    this.createTowerButtons();
    
    // 創建信息面板
    this.createInfoPanel();
    
    // 設置事件監聽器
    this.setupEventListeners();
  }

  /**
   * 加載塔類型數據
   */
  loadTowerTypes() {
    this.towerTypes = [
      {
        type: 'basic',
        name: '基礎塔',
        description: '平衡的攻擊和射程',
        cost: 50,
        damage: 30,
        range: 120,
        fireRate: 1000,
        icon: '●',
        color: 0x00ffff
      },
      {
        type: 'cannon',
        name: '加農炮',
        description: '高傷害，慢射速',
        cost: 100,
        damage: 80,
        range: 100,
        fireRate: 2000,
        icon: '💥',
        color: 0xff6b6b
      },
      {
        type: 'laser',
        name: '雷射塔',
        description: '快速射擊，中等傷害',
        cost: 80,
        damage: 25,
        range: 140,
        fireRate: 500,
        icon: '⚡',
        color: 0x00ff00
      },
      {
        type: 'ice',
        name: '冰凍塔',
        description: '減速敵人',
        cost: 70,
        damage: 20,
        range: 110,
        fireRate: 800,
        icon: '❄️',
        color: 0x74b9ff
      }
    ];
  }

  /**
   * 創建建造面板
   */
  createBuildPanel() {
    const { width, height } = this.scene.scale.gameSize;
    
    // 面板背景
    this.buildPanel = this.scene.add.graphics();
    this.buildPanel.fillStyle(0x000000, 0.8);
    this.buildPanel.lineStyle(2, 0x00ffff, 0.8);
    
    // 底部面板
    const panelHeight = 120;
    const panelY = height - panelHeight;
    
    this.buildPanel.fillRect(0, panelY, width, panelHeight);
    this.buildPanel.strokeRect(0, panelY, width, panelHeight);
    
    this.add(this.buildPanel);
    
    // 面板標題
    this.panelTitle = this.scene.add.text(20, panelY + 10, '塔建造', {
      fontSize: '20px',
      fill: '#00ffff',
      fontWeight: 'bold'
    });
    this.add(this.panelTitle);
    
    this.panelY = panelY;
    this.panelHeight = panelHeight;
  }

  /**
   * 創建塔建造按鈕
   */
  createTowerButtons() {
    const startX = 20;
    const startY = this.panelY + 40;
    const buttonWidth = 80;
    const buttonHeight = 60;
    const spacing = 10;
    
    this.towerTypes.forEach((towerData, index) => {
      const x = startX + index * (buttonWidth + spacing);
      const button = this.createTowerButton(x, startY, buttonWidth, buttonHeight, towerData);
      this.towerButtons.push(button);
    });
  }

  /**
   * 創建單個塔按鈕
   */
  createTowerButton(x, y, width, height, towerData) {
    const buttonContainer = this.scene.add.container(x, y);
    
    // 按鈕背景
    const buttonBg = this.scene.add.rectangle(0, 0, width, height, 0x333333);
    buttonBg.setStrokeStyle(2, towerData.color);
    buttonContainer.add(buttonBg);
    
    // 塔圖標
    const icon = this.scene.add.text(0, -15, towerData.icon, {
      fontSize: '20px',
      fill: '#ffffff'
    });
    icon.setOrigin(0.5);
    buttonContainer.add(icon);
    
    // 塔名稱
    const name = this.scene.add.text(0, 5, towerData.name, {
      fontSize: '10px',
      fill: '#ffffff',
      fontWeight: 'bold'
    });
    name.setOrigin(0.5);
    buttonContainer.add(name);
    
    // 成本顯示
    const cost = this.scene.add.text(0, 18, `$${towerData.cost}`, {
      fontSize: '10px',
      fill: '#ffd93d',
      fontWeight: 'bold'
    });
    cost.setOrigin(0.5);
    buttonContainer.add(cost);
    
    // 設置交互
    buttonBg.setInteractive();
    
    // 懸停效果
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(towerData.color, 0.3);
      this.showTowerInfo(towerData);
      this.scene.playSound && this.scene.playSound('button_hover');
    });
    
    buttonBg.on('pointerout', () => {
      if (this.selectedTowerType !== towerData.type) {
        buttonBg.setFillStyle(0x333333);
      }
      this.hideTowerInfo();
    });
    
    // 點擊效果
    buttonBg.on('pointerdown', () => {
      this.selectTowerType(towerData.type);
      this.scene.playSound && this.scene.playSound('button_click');
    });
    
    // 保存引用
    buttonContainer.towerData = towerData;
    buttonContainer.background = buttonBg;
    
    this.add(buttonContainer);
    
    return buttonContainer;
  }

  /**
   * 創建信息面板
   */
  createInfoPanel() {
    const { width } = this.scene.scale.gameSize;
    const panelWidth = 200;
    const panelHeight = 150;
    const x = width - panelWidth - 20;
    const y = this.panelY - panelHeight - 10;
    
    // 信息面板背景
    this.infoPanel = this.scene.add.graphics();
    this.infoPanel.fillStyle(0x000000, 0.9);
    this.infoPanel.lineStyle(2, 0xffd93d, 0.8);
    this.infoPanel.fillRect(x, y, panelWidth, panelHeight);
    this.infoPanel.strokeRect(x, y, panelWidth, panelHeight);
    this.infoPanel.setVisible(false);
    this.add(this.infoPanel);
    
    // 信息文本容器
    this.infoTextContainer = this.scene.add.container(x + 10, y + 10);
    this.infoTextContainer.setVisible(false);
    this.add(this.infoTextContainer);
    
    this.infoPanelX = x;
    this.infoPanelY = y;
  }

  /**
   * 設置事件監聽器
   */
  setupEventListeners() {
    // 監聽建造系統事件
    this.scene.events.on('buildingStarted', this.onBuildingStarted, this);
    this.scene.events.on('buildingCancelled', this.onBuildingCancelled, this);
    this.scene.events.on('towerPlaced', this.onTowerPlaced, this);
    
    // 監聽鍵盤快捷鍵
    this.scene.input.keyboard.on('keydown-ONE', () => this.selectTowerType('basic'));
    this.scene.input.keyboard.on('keydown-TWO', () => this.selectTowerType('cannon'));
    this.scene.input.keyboard.on('keydown-THREE', () => this.selectTowerType('laser'));
    this.scene.input.keyboard.on('keydown-FOUR', () => this.selectTowerType('ice'));
  }

  /**
   * 選擇塔類型
   */
  selectTowerType(towerType) {
    // 檢查是否有足夠的資源
    const towerData = this.towerTypes.find(t => t.type === towerType);
    if (!towerData) return;
    
    if (!this.canAffordTower(towerData.cost)) {
      this.showInsufficientFundsMessage();
      return;
    }
    
    console.log(`選擇塔類型: ${towerType}`);
    
    // 更新選中狀態
    this.updateButtonSelection(towerType);
    
    // 啟動建造模式
    if (this.placementSystem) {
      this.placementSystem.startBuilding(towerType);
    }
    
    this.selectedTowerType = towerType;
    
    // 發送選擇事件
    this.eventEmitter.emit('towerTypeSelected', { towerType, towerData });
  }

  /**
   * 更新按鈕選中狀態
   */
  updateButtonSelection(selectedType) {
    this.towerButtons.forEach(button => {
      const isSelected = button.towerData.type === selectedType;
      
      if (isSelected) {
        button.background.setFillStyle(button.towerData.color, 0.5);
        button.background.setStrokeStyle(3, 0xffffff);
      } else {
        button.background.setFillStyle(0x333333);
        button.background.setStrokeStyle(2, button.towerData.color);
      }
    });
  }

  /**
   * 檢查是否有足夠資源
   */
  canAffordTower(cost) {
    // 這裡需要與資源管理系統集成
    // return this.scene.resourceManager.getMoney() >= cost;
    
    // 臨時返回true
    return true;
  }

  /**
   * 顯示資金不足消息
   */
  showInsufficientFundsMessage() {
    const { width, height } = this.scene.scale.gameSize;
    
    const message = this.scene.add.text(width / 2, height / 2, '資金不足！', {
      fontSize: '24px',
      fill: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    message.setOrigin(0.5);
    
    // 消息動畫
    this.scene.tweens.add({
      targets: message,
      y: height / 2 - 50,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        message.destroy();
      }
    });
    
    // 播放錯誤音效
    this.scene.playSound && this.scene.playSound('error');
  }

  /**
   * 顯示塔信息
   */
  showTowerInfo(towerData) {
    this.infoPanel.setVisible(true);
    this.infoTextContainer.setVisible(true);
    
    // 清空之前的文本
    this.infoTextContainer.removeAll(true);
    
    // 塔名稱
    const title = this.scene.add.text(0, 0, towerData.name, {
      fontSize: '16px',
      fill: '#ffd93d',
      fontWeight: 'bold'
    });
    this.infoTextContainer.add(title);
    
    // 描述
    const description = this.scene.add.text(0, 25, towerData.description, {
      fontSize: '12px',
      fill: '#ffffff',
      wordWrap: { width: 180 }
    });
    this.infoTextContainer.add(description);
    
    // 屬性
    const stats = [
      `成本: $${towerData.cost}`,
      `傷害: ${towerData.damage}`,
      `射程: ${towerData.range}`,
      `射速: ${(1000 / towerData.fireRate).toFixed(1)}/秒`
    ];
    
    stats.forEach((stat, index) => {
      const statText = this.scene.add.text(0, 55 + index * 15, stat, {
        fontSize: '11px',
        fill: '#ffffff'
      });
      this.infoTextContainer.add(statText);
    });
  }

  /**
   * 隱藏塔信息
   */
  hideTowerInfo() {
    this.infoPanel.setVisible(false);
    this.infoTextContainer.setVisible(false);
  }

  /**
   * 建造開始事件處理
   */
  onBuildingStarted(data) {
    console.log('建造開始:', data.towerType);
    
    // 禁用其他按鈕
    this.setButtonsEnabled(false, data.towerType);
  }

  /**
   * 建造取消事件處理
   */
  onBuildingCancelled() {
    console.log('建造取消');
    
    // 清除選中狀態
    this.selectedTowerType = null;
    this.updateButtonSelection(null);
    
    // 重新啟用所有按鈕
    this.setButtonsEnabled(true);
  }

  /**
   * 塔放置事件處理
   */
  onTowerPlaced(data) {
    console.log('塔已放置:', data.tower.towerType);
    
    // 重新啟用所有按鈕
    this.setButtonsEnabled(true);
    
    // 清除選中狀態
    this.selectedTowerType = null;
    this.updateButtonSelection(null);
  }

  /**
   * 設置按鈕啟用狀態
   */
  setButtonsEnabled(enabled, exceptType = null) {
    this.towerButtons.forEach(button => {
      const isException = exceptType && button.towerData.type === exceptType;
      
      if (enabled || isException) {
        button.setAlpha(1);
        button.background.setInteractive();
      } else {
        button.setAlpha(0.5);
        button.background.disableInteractive();
      }
    });
  }

  /**
   * 設置建造系統引用
   */
  setPlacementSystem(placementSystem) {
    this.placementSystem = placementSystem;
  }

  /**
   * 顯示/隱藏UI
   */
  setVisible(visible) {
    this.isVisible = visible;
    super.setVisible(visible);
    
    if (!visible) {
      this.hideTowerInfo();
    }
  }

  /**
   * 切換UI顯示狀態
   */
  toggleVisibility() {
    this.setVisible(!this.isVisible);
  }

  /**
   * 更新資源顯示
   */
  updateResourceDisplay(money) {
    // 更新按鈕可用性
    this.towerButtons.forEach(button => {
      const canAfford = money >= button.towerData.cost;
      
      if (canAfford) {
        button.setTint(0xffffff);
      } else {
        button.setTint(0x666666);
      }
    });
  }

  /**
   * 獲取UI狀態
   */
  getStatus() {
    return {
      isVisible: this.isVisible,
      selectedTowerType: this.selectedTowerType,
      towerTypesCount: this.towerTypes.length
    };
  }

  /**
   * 清理UI
   */
  cleanup() {
    // 移除事件監聽器
    this.scene.events.off('buildingStarted', this.onBuildingStarted, this);
    this.scene.events.off('buildingCancelled', this.onBuildingCancelled, this);
    this.scene.events.off('towerPlaced', this.onTowerPlaced, this);
    
    // 清理事件發送器
    this.eventEmitter.removeAllListeners();
    
    console.log('塔建造UI已清理');
  }

  /**
   * 銷毀UI
   */
  destroy() {
    this.cleanup();
    super.destroy();
    
    console.log('塔建造UI已銷毀');
  }
}

export default TowerBuildUI;
