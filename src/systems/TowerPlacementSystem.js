/**
 * 塔建造放置系統
 * 處理塔的拖放建造、網格對齊、碰撞檢測等
 */

import GameConfig from '../core/GameConfig.js';
import { BaseTower } from '../entities/towers/BaseTower.js';
import { LaserTower } from '../entities/towers/LaserTower.js';

export class TowerPlacementSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Tilemap 邏輯層引用
    this.logicMap = null;
    this.buildableLayer = null;
    this.blockedLayer = null;
    
    // 建造狀態
    this.isBuilding = false;
    this.selectedTowerType = null;
    this.buildPreview = null;
    
    // 網格系統
    this.gridSize = GameConfig.TOWER.PLACEMENT_GRID_SIZE || 64;
    this.placementGrid = [];
    this.occupiedCells = new Set();
    
    // 有效建造區域
    this.buildableAreas = [];
    this.restrictedAreas = [];
    
    // 視覺輔助
    this.gridOverlay = null;
    this.placementIndicator = null;
    this.rangePreview = null;
    
    // 拖放狀態
    this.isDragging = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.currentGridPos = { x: -1, y: -1 };
    
    // 成本檢查
    this.resourceManager = null;
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 初始化系統
    this.init();
    
    console.log('塔建造放置系統初始化完成');
  }

  /**
   * 初始化建造系統
   */
  init() {
    // 初始化網格
    this.initializeGrid();
    
    // 載入邏輯地圖（如果存在）
    this.initializeLogicMap();
    
    // 創建視覺輔助元素
    this.createVisualHelpers();
    
    // 設置輸入處理
    this.setupInputHandlers();
    
    // 定義建造區域
    this.defineBuildableAreas();
  }

  /**
   * 初始化網格系統
   */
  initializeGrid() {
    const { width, height } = this.scene.scale.gameSize;
    const cols = Math.ceil(width / this.gridSize);
    const rows = Math.ceil(height / this.gridSize);
    
    // 創建2D網格陣列
    for (let y = 0; y < rows; y++) {
      this.placementGrid[y] = [];
      for (let x = 0; x < cols; x++) {
        this.placementGrid[y][x] = {
          x: x,
          y: y,
          worldX: x * this.gridSize + this.gridSize / 2,
          worldY: y * this.gridSize + this.gridSize / 2,
          occupied: false,
          buildable: true,
          tower: null
        };
      }
    }
    
    console.log(`網格初始化完成: ${cols}x${rows} (${this.gridSize}px)`);
  }

  /**
   * 創建視覺輔助元素
   */
  createVisualHelpers() {
    // 創建放置指示器
    this.placementIndicator = this.scene.add.graphics();
    this.placementIndicator.setVisible(false);
    this.placementIndicator.setDepth(100);
    
    // 創建射程預覽
    this.rangePreview = this.scene.add.graphics();
    this.rangePreview.setVisible(false);
    this.rangePreview.setDepth(99);
    
    // 創建網格覆蓋層
    this.gridOverlay = this.scene.add.graphics();
    this.gridOverlay.setVisible(false);
    this.gridOverlay.setDepth(98);
    
    this.drawGridOverlay();
  }

  /**
   * 繪製網格覆蓋層
   */
  drawGridOverlay() {
    this.gridOverlay.clear();
    this.gridOverlay.lineStyle(1, 0x00ffff, 0.3);
    
    const { width, height } = this.scene.scale.gameSize;
    
    // 繪製垂直線
    for (let x = 0; x <= width; x += this.gridSize) {
      this.gridOverlay.moveTo(x, 0);
      this.gridOverlay.lineTo(x, height);
    }
    
    // 繪製水平線
    for (let y = 0; y <= height; y += this.gridSize) {
      this.gridOverlay.moveTo(0, y);
      this.gridOverlay.lineTo(width, y);
    }
    
    this.gridOverlay.strokePath();
  }

  /**
   * 設置輸入處理
   */
  setupInputHandlers() {
    // 滑鼠移動
    this.scene.input.on('pointermove', this.onPointerMove, this);
    
    // 滑鼠點擊
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
    
    // 鍵盤快捷鍵
    this.scene.input.keyboard.on('keydown-ESC', this.cancelBuilding, this);
    this.scene.input.keyboard.on('keydown-G', this.toggleGridOverlay, this);
  }

  /**
   * 定義可建造區域
   */
  defineBuildableAreas() {
    const { width, height } = this.scene.scale.gameSize;
    
    // 玩家周圍不能建造
    const playerX = GameConfig.PLAYER.POSITION.X;
    const playerY = GameConfig.PLAYER.POSITION.Y;
    const playerRadius = 100;
    
    this.restrictedAreas.push({
      type: 'circle',
      x: playerX,
      y: playerY,
      radius: playerRadius
    });
    
    // 邊界區域不能建造
    const borderSize = 50;
    this.restrictedAreas.push(
      { type: 'rect', x: 0, y: 0, width: width, height: borderSize }, // 上邊界
      { type: 'rect', x: 0, y: height - borderSize, width: width, height: borderSize }, // 下邊界
      { type: 'rect', x: 0, y: 0, width: borderSize, height: height }, // 左邊界
      { type: 'rect', x: width - borderSize, y: 0, width: borderSize, height: height } // 右邊界
    );
    
    // 更新網格可建造狀態
    this.updateGridBuildability();
  }

  /**
   * 更新網格可建造狀態
   */
  updateGridBuildability() {
    for (let y = 0; y < this.placementGrid.length; y++) {
      for (let x = 0; x < this.placementGrid[y].length; x++) {
        const cell = this.placementGrid[y][x];
        cell.buildable = this.isCellBuildable(cell.worldX, cell.worldY);
      }
    }
  }

  /**
   * 檢查位置是否可建造
   */
  isCellBuildable(worldX, worldY) {
    // 檢查是否在限制區域內
    for (const area of this.restrictedAreas) {
      if (area.type === 'circle') {
        const distance = Phaser.Math.Distance.Between(worldX, worldY, area.x, area.y);
        if (distance < area.radius) return false;
      } else if (area.type === 'rect') {
        if (worldX >= area.x && worldX <= area.x + area.width &&
            worldY >= area.y && worldY <= area.y + area.height) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 開始建造模式
   */
  startBuilding(towerType) {
    if (this.isBuilding) {
      this.cancelBuilding();
    }
    
    this.isBuilding = true;
    this.selectedTowerType = towerType;
    
    console.log(`開始建造${towerType}塔`);
    
    // 顯示網格
    this.gridOverlay.setVisible(true);
    
    // 創建建造預覽
    this.createBuildPreview();
    
    // 發送建造開始事件
    this.eventEmitter.emit('buildingStarted', { towerType });
    this.scene.events.emit('buildingStarted', { towerType });
  }

  /**
   * 創建建造預覽
   */
  createBuildPreview() {
    if (this.buildPreview) {
      this.buildPreview.destroy();
    }
    
    // 創建預覽塔（透明）
    this.buildPreview = this.createTowerByType(this.selectedTowerType, 0, 0);
    this.buildPreview.setAlpha(0.6);
    this.buildPreview.setDepth(101);
    
    // 禁用預覽塔的交互和邏輯
    this.buildPreview.isActive = false;
    this.buildPreview.disableInteractive();
    
    // 移除預覽塔的物理體（如果存在）
    if (this.buildPreview.body) {
      this.scene.physics.world.disable(this.buildPreview);
    }
    
    // 隱藏預覽塔直到滑鼠移動
    this.buildPreview.setVisible(false);
  }

  /**
   * 取消建造模式
   */
  cancelBuilding() {
    if (!this.isBuilding) return;
    
    this.isBuilding = false;
    this.selectedTowerType = null;
    this.isDragging = false;
    
    // 隱藏視覺輔助
    this.gridOverlay.setVisible(false);
    this.placementIndicator.setVisible(false);
    this.rangePreview.setVisible(false);
    
    // 銷毀建造預覽
    if (this.buildPreview) {
      // 清除調色
      if (this.buildPreview.clearTint && typeof this.buildPreview.clearTint === 'function') {
        this.buildPreview.clearTint();
      }
      this.buildPreview.destroy();
      this.buildPreview = null;
    }
    
    console.log('取消建造模式');
    
    // 發送建造取消事件
    this.eventEmitter.emit('buildingCancelled');
    this.scene.events.emit('buildingCancelled');
  }

  /**
   * 滑鼠移動處理
   */
  onPointerMove(pointer) {
    if (!this.isBuilding) return;
    
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.worldToGrid(worldPoint.x, worldPoint.y);
    
    // 如果網格位置改變
    if (gridPos.x !== this.currentGridPos.x || gridPos.y !== this.currentGridPos.y) {
      this.currentGridPos = gridPos;
      this.updateBuildPreview(gridPos);
    }
  }

  /**
   * 滑鼠按下處理
   */
  onPointerDown(pointer) {
    if (!this.isBuilding) return;
    
    this.isDragging = true;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.dragStartPos = { x: worldPoint.x, y: worldPoint.y };
  }

  /**
   * 滑鼠釋放處理
   */
  onPointerUp(pointer) {
    if (!this.isBuilding || !this.isDragging) return;
    
    this.isDragging = false;
    
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.worldToGrid(worldPoint.x, worldPoint.y);
    
    // 嘗試放置塔
    if (this.canPlaceTower(gridPos)) {
      this.placeTower(gridPos);
    } else {
      this.showPlacementError(gridPos);
    }
  }

  /**
   * 更新建造預覽
   */
  updateBuildPreview(gridPos) {
    if (!this.buildPreview) return;
    
    const cell = this.getGridCell(gridPos.x, gridPos.y);
    
    if (cell) {
      // 顯示並定位預覽塔
      this.buildPreview.setVisible(true);
      this.buildPreview.setPosition(cell.worldX, cell.worldY);
      
      // 根據是否可放置改變顏色
      const canPlace = this.canPlaceTower(gridPos);
      if (this.buildPreview.setTint && typeof this.buildPreview.setTint === 'function') {
        this.buildPreview.setTint(canPlace ? 0x00ff00 : 0xff0000);
      }
      
      // 更新放置指示器
      this.updatePlacementIndicator(cell, canPlace);
      
      // 更新射程預覽
      this.updateRangePreview(cell);
    } else {
      this.buildPreview.setVisible(false);
      this.placementIndicator.setVisible(false);
      this.rangePreview.setVisible(false);
    }
  }

  /**
   * 更新放置指示器
   */
  updatePlacementIndicator(cell, canPlace) {
    this.placementIndicator.clear();
    this.placementIndicator.setVisible(true);
    
    const color = canPlace ? 0x00ff00 : 0xff0000;
    const alpha = canPlace ? 0.3 : 0.5;
    
    // 繪製網格格子高亮
    this.placementIndicator.fillStyle(color, alpha);
    this.placementIndicator.fillRect(
      cell.worldX - this.gridSize / 2,
      cell.worldY - this.gridSize / 2,
      this.gridSize,
      this.gridSize
    );
    
    // 繪製邊框
    this.placementIndicator.lineStyle(2, color, 0.8);
    this.placementIndicator.strokeRect(
      cell.worldX - this.gridSize / 2,
      cell.worldY - this.gridSize / 2,
      this.gridSize,
      this.gridSize
    );
  }

  /**
   * 更新射程預覽
   */
  updateRangePreview(cell) {
    if (!this.selectedTowerType) return;
    
    // 獲取塔的射程
    const towerData = GameConfig.TOWER.TYPES[this.selectedTowerType];
    const range = towerData ? towerData.range[0] : 100;
    
    this.rangePreview.clear();
    this.rangePreview.setVisible(true);
    
    // 繪製射程圓圈
    this.rangePreview.lineStyle(2, 0x00ffff, 0.4);
    this.rangePreview.strokeCircle(cell.worldX, cell.worldY, range);
    
    // 填充射程區域
    this.rangePreview.fillStyle(0x00ffff, 0.1);
    this.rangePreview.fillCircle(cell.worldX, cell.worldY, range);
  }

  /**
   * 世界坐標轉網格坐標
   */
  worldToGrid(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.gridSize),
      y: Math.floor(worldY / this.gridSize)
    };
  }

  /**
   * 網格坐標轉世界坐標
   */
  gridToWorld(gridX, gridY) {
    return {
      x: gridX * this.gridSize + this.gridSize / 2,
      y: gridY * this.gridSize + this.gridSize / 2
    };
  }

  /**
   * 獲取網格格子
   */
  getGridCell(gridX, gridY) {
    if (gridY < 0 || gridY >= this.placementGrid.length ||
        gridX < 0 || gridX >= this.placementGrid[0].length) {
      return null;
    }
    return this.placementGrid[gridY][gridX];
  }

  /**
   * 初始化邏輯地圖
   */
  initializeLogicMap() {
    // 如果場景有邏輯地圖，則使用它來判斷可建造區域
    if (this.scene.logicMap) {
      this.logicMap = this.scene.logicMap;
      this.buildableLayer = this.scene.buildableLayer;
      this.blockedLayer = this.scene.blockedLayer;
      console.log('整合邏輯地圖到塔放置系統');
    }
  }

  /**
   * 檢查是否可以放置塔
   */
  canPlaceTower(gridPos) {
    const cell = this.getGridCell(gridPos.x, gridPos.y);
    
    if (!cell) return false;
    if (cell.occupied) return false;
    
    // 使用 Tilemap 邏輯層判斷可建造性
    if (!this.isBuildableFromTilemap(gridPos)) return false;
    
    // 檢查資源是否足夠
    if (!this.checkResourceRequirement()) return false;
    
    return true;
  }

  /**
   * 從 Tilemap 檢查是否可建造
   */
  isBuildableFromTilemap(gridPos) {
    if (!this.logicMap || !this.buildableLayer) {
      // 沒有邏輯地圖時，使用原有邏輯
      const cell = this.getGridCell(gridPos.x, gridPos.y);
      return cell ? cell.buildable : true;
    }
    
    // 檢查該位置在 Tilemap 中是否為可建造區域
    const tile = this.buildableLayer.getTileAt(gridPos.x, gridPos.y);
    if (!tile) return false;
    
    // tile.index > 0 表示有放置可建造 tile
    const canBuild = tile.index > 0;
    
    // 同時檢查是否有阻擋 tile
    if (this.blockedLayer) {
      const blockedTile = this.blockedLayer.getTileAt(gridPos.x, gridPos.y);
      if (blockedTile && blockedTile.index > 0) {
        return false; // 有阻擋 tile 就不能建造
      }
    }
    
    return canBuild;
  }

  /**
   * 檢查資源需求
   */
  checkResourceRequirement() {
    if (!this.selectedTowerType) return false;
    
    const towerData = GameConfig.TOWER.TYPES[this.selectedTowerType];
    const cost = towerData ? towerData.buildCost : 100;
    
    // 這裡需要與資源管理系統集成
    // return this.scene.resourceManager.canAfford(cost);
    
    // 臨時返回true
    return true;
  }

  /**
   * 放置塔
   */
  placeTower(gridPos) {
    const cell = this.getGridCell(gridPos.x, gridPos.y);
    if (!cell) return false;
    
    console.log(`在網格 (${gridPos.x}, ${gridPos.y}) 放置${this.selectedTowerType}塔`);
    
    // 創建新塔
    const tower = this.createTowerByType(this.selectedTowerType, cell.worldX, cell.worldY);
    
    // 添加到場景的塔群組
    if (this.scene.towers) {
      this.scene.towers.add(tower);
    }
    
    // 標記網格為已占用
    cell.occupied = true;
    cell.tower = tower;
    this.occupiedCells.add(`${gridPos.x},${gridPos.y}`);
    
    // 扣除資源
    this.consumeResources();
    
    // 播放建造效果
    this.playBuildEffect(cell.worldX, cell.worldY);
    
    // 播放建造音效
    this.scene.playSound && this.scene.playSound('tower_place');
    
    // 發送塔放置事件
    this.eventEmitter.emit('towerPlaced', {
      tower: tower,
      gridPos: gridPos,
      position: { x: cell.worldX, y: cell.worldY }
    });
    this.scene.events.emit('towerPlaced', { tower, gridPos });
    
    // 取消建造模式
    this.cancelBuilding();
    
    return true;
  }

  /**
   * 消耗建造資源
   */
  consumeResources() {
    if (!this.selectedTowerType) return;
    
    const towerData = GameConfig.TOWER.TYPES[this.selectedTowerType];
    const cost = towerData ? towerData.buildCost : 100;
    
    // 這裡需要與資源管理系統集成
    // this.scene.resourceManager.spendMoney(cost);
    
    console.log(`消耗 ${cost} 金幣建造塔`);
  }

  /**
   * 播放建造效果
   */
  playBuildEffect(x, y) {
    // 建造光環效果
    const buildRing = this.scene.add.circle(x, y, 10, 0x00ff00, 0.8);
    
    this.scene.tweens.add({
      targets: buildRing,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        buildRing.destroy();
      }
    });
    
    // 建造粒子效果
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(x, y, 3, 0x00ff00);
      
      const angle = (i / 8) * Math.PI * 2;
      const distance = 40;
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * 顯示放置錯誤
   */
  showPlacementError(gridPos) {
    const cell = this.getGridCell(gridPos.x, gridPos.y);
    if (!cell) return;
    
    // 創建錯誤指示
    const errorIndicator = this.scene.add.text(cell.worldX, cell.worldY - 30, '無法放置!', {
      fontSize: '16px',
      fill: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    errorIndicator.setOrigin(0.5);
    
    // 錯誤動畫
    this.scene.tweens.add({
      targets: errorIndicator,
      y: cell.worldY - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        errorIndicator.destroy();
      }
    });
    
    // 播放錯誤音效
    this.scene.playSound && this.scene.playSound('error');
    
    console.log('無法在此位置放置塔');
  }

  /**
   * 移除塔（出售時調用）
   */
  removeTower(tower) {
    // 找到塔對應的網格位置
    const gridPos = this.worldToGrid(tower.x, tower.y);
    const cell = this.getGridCell(gridPos.x, gridPos.y);
    
    if (cell && cell.tower === tower) {
      cell.occupied = false;
      cell.tower = null;
      this.occupiedCells.delete(`${gridPos.x},${gridPos.y}`);
      
      console.log(`從網格 (${gridPos.x}, ${gridPos.y}) 移除塔`);
    }
  }

  /**
   * 切換網格覆蓋層
   */
  toggleGridOverlay() {
    if (this.gridOverlay) {
      this.gridOverlay.setVisible(!this.gridOverlay.visible);
    }
  }

  /**
   * 獲取系統狀態
   */
  getStatus() {
    return {
      isBuilding: this.isBuilding,
      selectedTowerType: this.selectedTowerType,
      gridSize: this.gridSize,
      occupiedCells: this.occupiedCells.size,
      totalCells: this.placementGrid.length * this.placementGrid[0].length
    };
  }

  /**
   * 清理系統
   */
  cleanup() {
    // 取消建造模式
    this.cancelBuilding();
    
    // 移除事件監聽器
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    
    // 清理視覺輔助
    if (this.gridOverlay) this.gridOverlay.destroy();
    if (this.placementIndicator) this.placementIndicator.destroy();
    if (this.rangePreview) this.rangePreview.destroy();
    
    // 清理事件發送器
    this.eventEmitter.removeAllListeners();
    
    console.log('塔建造放置系統已清理');
  }

  /**
   * 銷毀系統
   */
  destroy() {
    this.cleanup();
  }

  /**
   * 根據類型創建塔
   */
  createTowerByType(towerType, x, y) {
    switch (towerType) {
      case 'laser':
        console.log(`🔫 創建雷射塔於 (${x}, ${y})`);
        return new LaserTower(this.scene, x, y);
      
      case 'basic':
      case 'cannon':
      case 'ice':
      case 'poison':
      default:
        console.log(`🏰 創建${towerType}塔於 (${x}, ${y})`);
        return new BaseTower(this.scene, x, y, towerType);
    }
  }
}

export default TowerPlacementSystem;
