/**
 * 遊戲場景
 * 主要的遊戲玩法場景，包含玩家、敵人、塔等
 */

import { BaseScene } from '../core/BaseScene.js';
import GameConfig from '../core/GameConfig.js';
import { Player } from '../entities/player/Player.js';
import { TowerPlacementSystem } from '../systems/TowerPlacementSystem.js';
// import { TowerBuildUI } from '../ui/TowerBuildUI.js'; // 已隱藏，使用新的 TowerCardUI
import { TowerUpgradeUI } from '../ui/TowerUpgradeUI.js';
import { TowerCardOverlay } from '../ui/TowerCardOverlay.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { PathfindingManager } from '../systems/PathfindingManager.js';
import { PerformanceMonitor } from '../systems/PerformanceMonitor.js';
import { ScreenShake } from '../effects/ScreenShake.js';
import { ComboSystem } from '../systems/ComboSystem.js';
import { EnhancedAudioManager } from '../effects/audio/EnhancedAudioManager.js';

export class GameplayScene extends BaseScene {
  constructor() {
    super('GameplayScene');
    
    // 遊戲對象
    this.player = null;
    this.enemies = null;
    this.towers = null;
    this.projectiles = null;
    
    // 遊戲系統
    this.towerPlacementSystem = null;
    this.towerBuildUI = null;
    this.towerUpgradeUI = null;
    this.towerCardUI = null;
    this.enemySpawner = null;
    this.pathfindingManager = null;
    this.performanceMonitor = null;
    this.screenShake = null;
    this.comboSystem = null;
    this.enhancedAudio = null;
    
    // 遊戲狀態
    this.gameState = 'preparation'; // preparation, playing, paused
    this.currentWave = 0;
    this.preparationTimer = null;
    this.isPaused = false;
    this.pauseOverlay = null;
    
    // UI元素
    this.gameHUD = null;
    this.waveDisplay = null;
    
    // 管理器引用
    this.gameManager = null;
    this.stateManager = null;
  }

  /**
   * 載入場景特定資源
   */
  loadSceneAssets() {
    console.log('🔄 開始載入 GameplayScene 資源...');
    
    // 載入太空背景圖片
    this.load.image('space-bg', 'assets/maps/space-bg.png');
    
    // 載入玩家飛船圖片
    this.load.image('player-ship', 'assets/sprites/ships/blue/Ship_LVL_1.png');
    
    // 載入 Tiled 地圖
    this.load.tilemapTiledJSON('map1', 'assets/maps/map1.tmj');
    
    // 載入圖塊集圖片
    this.load.image('ground', 'assets/tilesets/map/world-1.png');
    this.load.image('tileset-1', 'assets/tilesets/tileset-1.png');
    
    // 載入塔精靈圖集
    this.load.atlas('tower-sprites', 'assets/sprites/towers/tower-sprite.png', 'assets/sprites/towers/tower-sprite.json');
    
    // 載入敵人精靈圖集
    this.load.atlas('enemy_basic', 'assets/sprites/enemies/basic/basic.webp', 'assets/sprites/enemies/basic/basic.json');
    
    // 載入玩家爆炸動畫
    this.load.atlas('player-explosion', 'assets/sprites/ships/blue/explosion.webp', 'assets/sprites/ships/blue/explosion.json');    
    console.log('✅ GameplayScene 資源載入完成');
  }

  /**
   * 場景初始化
   */
  init(data) {
    super.init(data);
    
    console.log('遊戲場景初始化');
    
    // 獲取管理器引用
    this.gameManager = this.registry.get('gameManager');
    this.stateManager = this.registry.get('stateManager');
    
    // 如果GameManager不存在，創建一個簡化版本
    if (!this.gameManager) {
      this.createSimpleGameManager();
    }
    
    // 設置遊戲數據
    this.gameData = data || {
      level: 1,
      difficulty: 'normal'
    };
  }

  /**
   * 場景創建
   */
  create() {
    super.create();
    
    console.log('創建遊戲場景');
    
    const { width, height } = this.scale.gameSize;
    
    // 確保物理系統已啟動
    if (!this.physics.world) {
      console.error('物理世界未初始化');
      return;
    }
    
    // 創建遊戲背景
    this.createGameBackground(width, height);
    
    // 創建物理群組
    this.createPhysicsGroups();
    
    // 直接創建玩家（資源已在LoadingScene中載入）
    console.log('✅ 直接創建玩家');
    this.createPlayer();
    
    // 創建HUD
    this.createGameHUD(width, height);
    
    // 創建塔建造系統
    this.createTowerSystems();
    
    // 創建尋路系統（必須在敵人系統之前）
    this.createPathfindingSystem();
    
    // 創建敵人系統
    this.createEnemySystem();
    
    // 創建效能監控系統
    this.createPerformanceMonitor();
    
    // 創建屏幕震動系統
    this.createScreenShake();
    
    // 創建連擊系統
    this.createComboSystem();
    
    // 創建增強音頻系統
    this.createEnhancedAudio();
    
    // 創建暫停系統
    this.createPauseSystem();
    
    // 創建通用UI（現在gameHUD已經初始化）
    this.createCommonUI();
    
    // 設置碰撞檢測
    this.setupCollisions();
    
    // 設置金錢更新監聽
    this.setupMoneyUpdateListener();
    
    // 開始準備階段
    this.startPreparationPhase();
    
    // 播放背景音樂
    this.playMusic('battle_theme');
    
    // 創建玩家爆炸動畫
    this.createPlayerExplosionAnimations();
    
    // 場景淡入效果
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    
    // 創建座標偵測系統 (已禁用)
    // this.createCoordinateDebugSystem();
  }

  /**
   * 創建遊戲背景
   */
  createGameBackground(width, height) {
    // 直接創建 Tiled 地圖（資源已在 preload 階段加載）
    this.createSimpleGameBackground();
  }

  /**
   * 創建簡化的遊戲背景
   */
  createSimpleGameBackground() {
    
    // 創建太空背景圖片
    this.background = this.add.image(
      this.scale.width / 2, 
      this.scale.height / 2, 
      'space-bg'
    );
    
    // 縮放背景圖片以填滿整個螢幕
    const scaleX = this.scale.width / this.background.width;
    const scaleY = this.scale.height / this.background.height;
    const scale = Math.max(scaleX, scaleY); // 使用較大的縮放比例以確保完全覆蓋
    
    this.background.setScale(scale);
    this.background.setDepth(-100);
    
    // 設置遊戲邊界
    this.gameBounds = {
      left: 0,
      right: this.scale.width,
      top: 0,
      bottom: this.scale.height
    };
    
  }

  /**
   * 從 Tiled 地圖提取路徑
   */
  extractPathFromTiledMap() {
    if (!this.pathLayer) {
      console.warn('沒有找到路徑圖層');
      return;
    }
    
    const waypoints = [];
    
    // 掃描路徑圖層
    for (let y = 0; y < this.pathLayer.layer.height; y++) {
      for (let x = 0; x < this.pathLayer.layer.width; x++) {
        const tile = this.pathLayer.getTileAt(x, y);
        if (tile && tile.index > 0) {
          waypoints.push({
            x: x * this.tiledMap.tileWidth + this.tiledMap.tileWidth / 2,
            y: y * this.tiledMap.tileHeight + this.tiledMap.tileHeight / 2,
            type: tile.index,
            gridX: x,
            gridY: y
          });
        }
      }
    }
    
    // 優化路徑點並排序
    this.gamePath = this.optimizeAndSortPath(waypoints);
    
    // 設置敵人生成點和基地位置
    this.setupEnemySpawnAndBase();
    
    console.log(`提取到 ${this.gamePath.length} 個路徑點`);
    console.log('路徑點:', this.gamePath);
  }

  /**
   * 優化並排序路徑點
   */
  optimizeAndSortPath(waypoints) {
    if (waypoints.length === 0) return [];
    
    // 找到起點和終點
    const startPoint = waypoints.find(p => p.type === 14 || p.type === 15); // 起點類型
    const endPoint = waypoints.find(p => p.type === 14 || p.type === 15); // 終點類型（可能與起點相同類型）
    
    if (!startPoint) {
      console.warn('沒有找到起點，使用第一個路徑點');
      return this.simplePathSort(waypoints);
    }
    
    // 使用 A* 算法排序路徑點
    const sortedPath = this.sortPathByDistance(startPoint, waypoints);
    
    // 移除重複點
    const uniquePoints = [];
    const threshold = 16; // 16像素內視為重複點
    
    for (const point of sortedPath) {
      const isDuplicate = uniquePoints.some(existing => 
        Math.abs(existing.x - point.x) < threshold && 
        Math.abs(existing.y - point.y) < threshold
      );
      
      if (!isDuplicate) {
        uniquePoints.push(point);
      }
    }
    
    return uniquePoints;
  }

  /**
   * 簡單路徑排序（備用方法）
   */
  simplePathSort(waypoints) {
    // 按 Y 坐標排序，然後按 X 坐標排序
    return waypoints.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 32) {
        return a.x - b.x; // 同一行按 X 排序
      }
      return a.y - b.y; // 按 Y 排序
    });
  }

  /**
   * 按距離排序路徑點
   */
  sortPathByDistance(startPoint, waypoints) {
    const sorted = [startPoint];
    const remaining = waypoints.filter(p => p !== startPoint);
    
    let currentPoint = startPoint;
    
    while (remaining.length > 0) {
      // 找到距離當前點最近的路徑點
      let nearestIndex = 0;
      let nearestDistance = Phaser.Math.Distance.Between(
        currentPoint.x, currentPoint.y,
        remaining[0].x, remaining[0].y
      );
      
      for (let i = 1; i < remaining.length; i++) {
        const distance = Phaser.Math.Distance.Between(
          currentPoint.x, currentPoint.y,
          remaining[i].x, remaining[i].y
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      // 添加最近點到排序路徑
      const nearestPoint = remaining.splice(nearestIndex, 1)[0];
      sorted.push(nearestPoint);
      currentPoint = nearestPoint;
    }
    
    return sorted;
  }

  /**
   * 設置敵人生成點和基地位置
   */
  setupEnemySpawnAndBase() {
    if (!this.gamePath || this.gamePath.length === 0) {
      console.warn('沒有路徑點，無法設置生成點和基地');
      return;
    }
    
    // 設置敵人生成點（路徑起點）
    this.enemySpawnPoint = {
      x: this.gamePath[0].x,
      y: this.gamePath[0].y
    };
    
    // 設置基地位置（路徑終點）
    this.basePosition = {
      x: this.gamePath[this.gamePath.length - 1].x,
      y: this.gamePath[this.gamePath.length - 1].y
    };
    
    console.log('敵人生成點:', this.enemySpawnPoint);
    console.log('基地位置:', this.basePosition);
  }

  /**
   * 優化路徑點 (舊方法，保留備用)
   */
  optimizePath(waypoints) {
    if (waypoints.length === 0) return [];
    
    // 按類型排序：起點(1) -> 路徑(3) -> 轉彎(4) -> 終點(2)
    const sortedWaypoints = waypoints.sort((a, b) => {
      const typeOrder = { 1: 0, 3: 1, 4: 2, 2: 3 }; // 起點、路徑、轉彎、終點
      return (typeOrder[a.type] || 1) - (typeOrder[b.type] || 1);
    });
    
    // 移除重複點
    const uniquePoints = [];
    const threshold = 16; // 16像素內視為重複點
    
    for (const point of sortedWaypoints) {
      const isDuplicate = uniquePoints.some(existing => 
        Math.abs(existing.x - point.x) < threshold && 
        Math.abs(existing.y - point.y) < threshold
      );
      
      if (!isDuplicate) {
        uniquePoints.push(point);
      }
    }
    
    return uniquePoints;
  }

  /**
   * 創建世界地圖背景 (備用方法)
   */
  createWorldMapBackground() {
    // 獲取地圖尺寸 (匹配 Tiled 地圖)
    const mapWidth = GameConfig.MAP.WIDTH;  // 1280
    const mapHeight = GameConfig.MAP.HEIGHT; // 960
    
    // 獲取遊戲視窗尺寸
    const { width, height } = this.scale.gameSize;
    
    console.log(`載入世界地圖: ${mapWidth}×${mapHeight} 像素`);
    console.log(`遊戲視窗: ${width}×${height} 像素`);
    
    // 創建世界地圖背景
    this.worldMap = this.add.image(0, 0, 'world-map');
    this.worldMap.setOrigin(0, 0);
    this.worldMap.setDepth(-100);
    
    // 計算縮放比例以適應遊戲視窗
    const scaleX = width / mapWidth;
    const scaleY = height / mapHeight;
    const scale = Math.max(scaleX, scaleY); // 保持比例，完全覆蓋
    
    this.worldMap.setScale(scale);
    
    // 居中地圖
    const scaledWidth = mapWidth * scale;
    const scaledHeight = mapHeight * scale;
    this.worldMap.setPosition(
      (width - scaledWidth) / 2,
      (height - scaledHeight) / 2
    );
    
    // 添加網格線作為建造參考
    this.createGrid(width, height);
    
    console.log('世界地圖背景創建完成');
    console.log(`地圖縮放: ${scale.toFixed(3)}`);
    console.log(`縮放後尺寸: ${scaledWidth.toFixed(0)}×${scaledHeight.toFixed(0)} 像素`);
  }

  /**
   * 創建網格
   */
  createGrid(width, height) {
    const gridSize = GameConfig.TOWER.PLACEMENT_GRID_SIZE || 64;
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x444444, 0.3);
    graphics.setDepth(-50);
    
    // 計算地圖在遊戲視窗中的實際位置和尺寸 (匹配 Tiled 地圖)
    const mapWidth = GameConfig.MAP.WIDTH;  // 1280
    const mapHeight = GameConfig.MAP.HEIGHT; // 960
    
    const scaleX = width / mapWidth;
    const scaleY = height / mapHeight;
    const scale = Math.max(scaleX, scaleY);
    
    const scaledWidth = mapWidth * scale;
    const scaledHeight = mapHeight * scale;
    const mapX = (width - scaledWidth) / 2;
    const mapY = (height - scaledHeight) / 2;
    
    // 只在可建造區域內繪制網格
    const startX = Math.floor(mapX / gridSize) * gridSize;
    const startY = Math.floor(mapY / gridSize) * gridSize;
    const endX = Math.ceil((mapX + scaledWidth) / gridSize) * gridSize;
    const endY = Math.ceil((mapY + scaledHeight) / gridSize) * gridSize;
    
    // 垂直線
    for (let x = startX; x <= endX; x += gridSize) {
      graphics.moveTo(x, mapY);
      graphics.lineTo(x, mapY + scaledHeight);
    }
    
    // 水平線  
    for (let y = startY; y <= endY; y += gridSize) {
      graphics.moveTo(mapX, y);
      graphics.lineTo(mapX + scaledWidth, y);
    }
    
    graphics.strokePath();
    
    console.log(`網格創建完成: 覆蓋區域 (${startX}, ${startY}) 到 (${endX}, ${endY})`);
  }

  /**
   * 計算格子編號（統一計算方法）
   */
  calculateGridNumber(row, col) {
    // 根據 Safe Area 尺寸計算
    const safeAreaWidth = GameConfig.MAP.SAFE_AREA.WIDTH;  // 1024
    const safeAreaHeight = GameConfig.MAP.SAFE_AREA.HEIGHT; // 576
    const gridSize = GameConfig.MAP.GRID_SIZE; // 64
    
    const totalCols = Math.floor(safeAreaWidth / gridSize); // 16列
    const totalRows = Math.floor(safeAreaHeight / gridSize); // 9行
    
    console.log(`Safe Area 尺寸: ${safeAreaWidth}×${safeAreaHeight}`);
    console.log(`格子大小: ${gridSize}×${gridSize}`);
    console.log(`實際列數: ${totalCols}, 實際行數: ${totalRows}`);
    
    // 格子編號 = 行數 × 總列數 + 列數 + 1
    const gridNumber = row * totalCols + col + 1;
    
    console.log(`計算格子編號: 第${row + 1}行 × ${totalCols}列 + 第${col + 1}列 = ${gridNumber}`);
    
    return gridNumber;
  }

  /**
   * 創建座標偵測系統
   */
  createCoordinateDebugSystem() {
    const { width, height } = this.scale.gameSize;
    
    // 創建座標顯示文字
    this.coordinateText = this.add.text(10, 10, '座標偵測系統已啟動', {
      fontFamily: 'Arial',
      fontSize: '14px',
      fill: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    });
    this.coordinateText.setDepth(10000);
    
    // 創建滑鼠座標顯示
    this.mouseCoordinateText = this.add.text(10, 35, '滑鼠位置: (0, 0)', {
      fontFamily: 'Arial',
      fontSize: '12px',
      fill: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    });
    this.mouseCoordinateText.setDepth(10000);
    
    // 創建格子座標顯示
    this.gridCoordinateText = this.add.text(10, 58, '格子位置: 第0行, 第0列 (格子#0)', {
      fontFamily: 'Arial',
      fontSize: '12px',
      fill: '#00ffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    });
    this.gridCoordinateText.setDepth(10000);
    
    // 創建基地位置標記
    this.createBasePositionMarker();
    
    // 設置滑鼠移動事件
    this.input.on('pointermove', (pointer) => {
      this.updateCoordinateDisplay(pointer);
    });
    
    // 設置滑鼠點擊事件
    this.input.on('pointerdown', (pointer) => {
      this.onMouseClick(pointer);
    });
    
  }

  /**
   * 創建基地位置標記
   */
  createBasePositionMarker() {
    const { width, height } = this.scale.gameSize;
    const mapWidth = GameConfig.MAP.WIDTH;  // 1280
    const mapHeight = GameConfig.MAP.HEIGHT; // 960
    
    // 計算縮放比例
    const scaleX = width / mapWidth;
    const scaleY = height / mapHeight;
    const scale = Math.max(scaleX, scaleY);
    
    const scaledWidth = mapWidth * scale;
    const scaledHeight = mapHeight * scale;
    const mapX = (width - scaledWidth) / 2;
    const mapY = (height - scaledHeight) / 2;
    
    // 基地位置：第13行, 第34列 (從0開始是第12行, 第33列)
    const baseRow = 12; // 第13行 (從0開始)
    const baseCol = 33; // 第34列 (從0開始)
    
    // 計算基地像素位置
    const baseX = mapX + (baseCol * 64 * scale) + (32 * scale);
    const baseY = mapY + (baseRow * 64 * scale) + (32 * scale);
    
    // 創建基地標記圓圈
    const baseCircle = this.add.circle(baseX, baseY, 30, 0xff0000, 0.6);
    baseCircle.setDepth(-80);
    
    // 創建基地標記文字
    const baseText = this.add.text(baseX, baseY + 40, '基地 #538', {
      fontFamily: 'Arial',
      fontSize: '14px',
      fill: '#ff0000',
      stroke: '#ffffff',
      strokeThickness: 2
    });
    baseText.setOrigin(0.5);
    baseText.setDepth(-80);
    
    // 創建基地邊框
    const baseBorder = this.add.graphics();
    baseBorder.lineStyle(3, 0xff0000, 0.8);
    baseBorder.strokeCircle(baseX, baseY, 35);
    baseBorder.setDepth(-80);
    
    console.log(`基地標記創建完成: 位置 (${baseX.toFixed(1)}, ${baseY.toFixed(1)})`);
    console.log(`基地格子位置: 第${baseRow + 1}行, 第${baseCol + 1}列 (格子#${this.calculateGridNumber(baseRow, baseCol)})`);
    const totalCols = Math.floor(GameConfig.MAP.SAFE_AREA.WIDTH / GameConfig.MAP.GRID_SIZE);
    console.log(`格子編號驗證: 第${baseRow + 1}行 × ${totalCols}列 + 第${baseCol + 1}列 = ${this.calculateGridNumber(baseRow, baseCol)}`);
  }

  /**
   * 更新座標顯示
   */
  updateCoordinateDisplay(pointer) {
    const { width, height } = this.scale.gameSize;
    const mapWidth = GameConfig.MAP.WIDTH;  // 1280
    const mapHeight = GameConfig.MAP.HEIGHT; // 960
    
    // 計算縮放比例
    const scaleX = width / mapWidth;
    const scaleY = height / mapHeight;
    const scale = Math.max(scaleX, scaleY);
    
    const scaledWidth = mapWidth * scale;
    const scaledHeight = mapHeight * scale;
    const mapX = (width - scaledWidth) / 2;
    const mapY = (height - scaledHeight) / 2;
    
    // 加入調試日誌
    console.log('=== 座標偵測調試信息 ===');
    console.log(`遊戲視窗尺寸: ${width}×${height}`);
    console.log(`地圖原始尺寸: ${mapWidth}×${mapHeight}`);
    console.log(`縮放比例: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}, scale=${scale.toFixed(3)}`);
    console.log(`縮放後地圖尺寸: ${scaledWidth.toFixed(1)}×${scaledHeight.toFixed(1)}`);
    console.log(`地圖偏移量: mapX=${mapX.toFixed(1)}, mapY=${mapY.toFixed(1)}`);
    
    // 更新滑鼠座標顯示
    this.mouseCoordinateText.setText(`滑鼠位置: (${pointer.x.toFixed(1)}, ${pointer.y.toFixed(1)})`);
    
    // 檢查是否在地圖範圍內
    if (pointer.x >= mapX && pointer.x <= mapX + scaledWidth &&
        pointer.y >= mapY && pointer.y <= mapY + scaledHeight) {
      
      // 計算地圖相對座標 - 限制在畫布範圍內
      const mapRelativeX = Math.max(0, Math.min(pointer.x - mapX, width));
      const mapRelativeY = Math.max(0, Math.min(pointer.y - mapY, height));
      
      // 計算格子座標 - 使用邏輯格子大小 (64px)
      const gridSize = 64; // 固定邏輯格子大小，不使用縮放
      const gridCol = Math.floor(mapRelativeX / gridSize);
      const gridRow = Math.floor(mapRelativeY / gridSize);
      
      // 限制列數在16列內
      const limitedGridCol = Math.min(gridCol, 15); // 最大15 (索引)，對應第16列
      
      // 加入格子計算調試日誌
      console.log(`滑鼠絕對位置: (${pointer.x.toFixed(1)}, ${pointer.y.toFixed(1)})`);
      console.log(`地圖相對位置(限制後): (${mapRelativeX.toFixed(1)}, ${mapRelativeY.toFixed(1)})`);
      console.log(`格子大小(邏輯): ${gridSize}px`);
      console.log(`原始格子座標: 第${gridRow + 1}行, 第${gridCol + 1}列`);
      console.log(`限制後格子座標: 第${gridRow + 1}行, 第${limitedGridCol + 1}列`);
      console.log('========================');
      
      // 計算格子編號 - 使用限制後的列數
      const gridNumber = this.calculateGridNumber(gridRow, limitedGridCol);
      
      // 更新格子座標顯示 - 顯示限制後的座標
      this.gridCoordinateText.setText(`格子位置: 第${gridRow + 1}行, 第${limitedGridCol + 1}列 (格子#${gridNumber})`);
      this.gridCoordinateText.setFill('#00ffff');
      
    } else {
      // 滑鼠在地圖外
      console.log('滑鼠在地圖範圍外');
      this.gridCoordinateText.setText('格子位置: 地圖外');
      this.gridCoordinateText.setFill('#ff0000');
    }
  }

  /**
   * 滑鼠點擊事件
   */
  onMouseClick(pointer) {
    const { width, height } = this.scale.gameSize;
    const mapWidth = GameConfig.MAP.WIDTH;  // 1280
    const mapHeight = GameConfig.MAP.HEIGHT; // 960
    
    // 計算縮放比例
    const scaleX = width / mapWidth;
    const scaleY = height / mapHeight;
    const scale = Math.max(scaleX, scaleY);
    
    const scaledWidth = mapWidth * scale;
    const scaledHeight = mapHeight * scale;
    const mapX = (width - scaledWidth) / 2;
    const mapY = (height - scaledHeight) / 2;
    
    // 檢查是否在地圖範圍內
    if (pointer.x >= mapX && pointer.x <= mapX + scaledWidth &&
        pointer.y >= mapY && pointer.y <= mapY + scaledHeight) {
      
      // 計算地圖相對座標 - 限制在畫布範圍內
      const mapRelativeX = Math.max(0, Math.min(pointer.x - mapX, width));
      const mapRelativeY = Math.max(0, Math.min(pointer.y - mapY, height));
      
      // 計算格子座標 - 使用邏輯格子大小 (64px)
      const gridSize = 64; // 固定邏輯格子大小，不使用縮放
      const gridCol = Math.floor(mapRelativeX / gridSize);
      const gridRow = Math.floor(mapRelativeY / gridSize);
      
      // 限制列數在16列內
      const limitedGridCol = Math.min(gridCol, 15); // 最大15 (索引)，對應第16列
      
      // 計算格子編號 - 使用限制後的列數
      const gridNumber = this.calculateGridNumber(gridRow, limitedGridCol);
      
      console.log(`點擊位置: 滑鼠(${pointer.x.toFixed(1)}, ${pointer.y.toFixed(1)})`);
      console.log(`地圖相對位置: (${mapRelativeX.toFixed(1)}, ${mapRelativeY.toFixed(1)})`);
      console.log(`原始格子座標: 第${gridRow + 1}行, 第${gridCol + 1}列`);
      console.log(`限制後格子座標: 第${gridRow + 1}行, 第${limitedGridCol + 1}列`);
      console.log(`格子編號: #${gridNumber}`);
      
      // 創建點擊效果 - 使用限制後的座標
      this.createClickEffect(pointer.x, pointer.y, gridNumber);
    }
  }

  /**
   * 創建點擊效果
   */
  createClickEffect(x, y, gridNumber) {
    // 創建點擊圓圈
    const clickCircle = this.add.circle(x, y, 20, 0xffff00, 0.5);
    clickCircle.setDepth(1000);
    
    // 創建格子編號文字
    const gridText = this.add.text(x, y - 30, `#${gridNumber}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      fill: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    });
    gridText.setOrigin(0.5);
    gridText.setDepth(1000);
    
    // 動畫效果
    this.tweens.add({
      targets: [clickCircle, gridText],
      scale: 1.5,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        clickCircle.destroy();
        gridText.destroy();
      }
    });
  }

  /**
   * 創建邊界
   */
  createBoundaries(width, height) {
    // 創建不可見的邊界牆
    this.boundaries = this.physics.add.staticGroup();
    
    // 使用地圖實際尺寸作為邊界
    const mapWidth = GameConfig.MAP.WIDTH;  // 1280
    const mapHeight = GameConfig.MAP.HEIGHT; // 960
    
    // 計算地圖在遊戲視窗中的實際位置和尺寸
    const scaleX = width / mapWidth;
    const scaleY = height / mapHeight;
    const scale = Math.max(scaleX, scaleY);
    
    const scaledWidth = mapWidth * scale;
    const scaledHeight = mapHeight * scale;
    const mapX = (width - scaledWidth) / 2;
    const mapY = (height - scaledHeight) / 2;
    
    // 上牆
    const topWall = this.add.rectangle(mapX + scaledWidth/2, mapY - 10, scaledWidth, 20);
    this.physics.add.existing(topWall, true);
    this.boundaries.add(topWall);
    
    // 下牆
    const bottomWall = this.add.rectangle(mapX + scaledWidth/2, mapY + scaledHeight + 10, scaledWidth, 20);
    this.physics.add.existing(bottomWall, true);
    this.boundaries.add(bottomWall);
    
    // 左牆
    const leftWall = this.add.rectangle(mapX - 10, mapY + scaledHeight/2, 20, scaledHeight);
    this.physics.add.existing(leftWall, true);
    this.boundaries.add(leftWall);
    
    // 右牆
    const rightWall = this.add.rectangle(mapX + scaledWidth + 10, mapY + scaledHeight/2, 20, scaledHeight);
    this.physics.add.existing(rightWall, true);
    this.boundaries.add(rightWall);
    
    console.log(`邊界創建完成: 地圖區域 (${mapX.toFixed(0)}, ${mapY.toFixed(0)}) 到 (${(mapX + scaledWidth).toFixed(0)}, ${(mapY + scaledHeight).toFixed(0)})`);
  }

  /**
   * 創建物理群組
   */
  createPhysicsGroups() {
    // 敵人群組
    this.enemies = this.physics.add.group();
    
    // 塔群組
    this.towers = this.physics.add.group();
    
    // 投射物群組
    this.projectiles = this.physics.add.group();
    
  }

  /**
   * 創建玩家
   */
  createPlayer() {
    // 玩家位置設在螢幕中間
    const playerX = this.scale.width / 2;
    const playerY = this.scale.height / 2;
    
    this.player = new Player(this, playerX, playerY);
    
    // 設置玩家事件監聽器
    this.player.eventEmitter.on('playerDied', this.onPlayerDied, this);
    this.player.eventEmitter.on('playerDamaged', this.onPlayerDamaged, this);
    
  }

  /**
   * 創建遊戲HUD
   */
  createGameHUD(width, height) {
    // HUD容器
    this.gameHUD = this.add.container(0, 0);
    
    // 生命值顯示
    this.createHealthDisplay(20, 20);
    
    // 資源顯示
    this.createResourceDisplay(20, 60);
    
    // 波次顯示
    this.createWaveDisplay(width/2, 30);
    
    // 準備階段計時器
    this.createPreparationTimer(width/2, 80);
    
    // 返回主選單按鈕
    this.createBackButton(50, height - 50);
    
    // 暫停按鈕將由createCommonUI()創建
  }

  /**
   * 創建生命值顯示
   */
  createHealthDisplay(x, y) {
    const healthBg = this.add.rectangle(x, y, 120, 30, 0x000000, 0.7);
    healthBg.setOrigin(0, 0);
    healthBg.setStrokeStyle(2, 0xff4757);
    
    this.healthText = this.add.text(x + 10, y + 5, 'HP: 100/100', {
      fontSize: '16px',
      fill: '#ffffff',
      fontWeight: 'bold'
    });
    
    this.gameHUD.add([healthBg, this.healthText]);
  }

  /**
   * 創建資源顯示
   */
  createResourceDisplay(x, y) {
    const resourceBg = this.add.rectangle(x, y, 120, 30, 0x000000, 0.7);
    resourceBg.setOrigin(0, 0);
    resourceBg.setStrokeStyle(2, 0xffd93d);
    
    // 獲取當前金錢數量
    const currentMoney = this.gameManager ? this.gameManager.playerData.money : 500;
    
    this.moneyText = this.add.text(x + 10, y + 5, `金幣: ${currentMoney}`, {
      fontSize: '16px',
      fill: '#ffd93d',
      fontWeight: 'bold'
    });
    
    this.gameHUD.add([resourceBg, this.moneyText]);
  }

  /**
   * 創建波次顯示
   */
  createWaveDisplay(x, y) {
    this.waveDisplay = this.add.text(x, y, '波次 1 - 準備階段', {
      fontSize: '24px',
      fill: '#00ffff',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.waveDisplay.setOrigin(0.5);
    
    this.gameHUD.add(this.waveDisplay);
  }

  /**
   * 創建準備階段計時器
   */
  createPreparationTimer(x, y) {
    this.preparationTimerText = this.add.text(x, y, '', {
      fontSize: '18px',
      fill: '#ffffff',
      fontWeight: 'bold'
    });
    this.preparationTimerText.setOrigin(0.5);
    this.preparationTimerText.setVisible(false);
    
    this.gameHUD.add(this.preparationTimerText);
  }

  /**
   * 創建返回按鈕
   */
  createBackButton(x, y) {
    const backButton = this.add.text(x, y, '← 主選單', {
      fontSize: '18px',
      fill: '#00ffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    
    backButton.setInteractive();
    backButton.on('pointerdown', () => {
      this.playSound('button_click');
      this.returnToMainMenu();
    });
    
    this.gameHUD.add(backButton);
  }

  // createPauseButton 已移至 BaseScene.js

  /**
   * 創建塔建造系統
   */
  createTowerSystems() {
    // 創建塔建造放置系統
    this.towerPlacementSystem = new TowerPlacementSystem(this);
    
    // 創建塔建造UI (已隱藏，使用新的 TowerCardUI)
    // this.towerBuildUI = new TowerBuildUI(this);
    // this.towerBuildUI.setPlacementSystem(this.towerPlacementSystem);
    
    // 創建塔升級UI（右下角面板）
    this.towerUpgradeUI = new TowerUpgradeUI(this);
    
    // 創建塔卡片選擇UI（底部，改為 DOM 疊加版）
    this.towerCardUI = new TowerCardOverlay(this);
    this.towerCardUI.create();

    // 初始化卡片可用性（以當前金錢）
    const initMoney = this.gameManager ? this.gameManager.playerData.money : 500;
    if (this.towerCardUI && typeof this.towerCardUI.updateCardAvailability === 'function') {
      this.towerCardUI.updateCardAvailability(initMoney);
    }
    
    // 設置塔系統事件監聽器
    this.setupTowerSystemEvents();
    
  }

  /**
   * 創建敵人系統
   */
  createEnemySystem() {
    this.enemySpawner = new EnemySpawner(this);
    this.setupEnemySystemEvents();
    
  }

  /**
   * 設置敵人系統事件
   */
  setupEnemySystemEvents() {
    // 監聽敵人生成事件
    this.enemySpawner.eventEmitter.on('enemySpawned', (data) => {
      console.log(`敵人已生成: ${data.type}`);
    });
    
    // 監聽敵人死亡事件
    this.enemySpawner.eventEmitter.on('enemyDied', (data) => {
      console.log('敵人死亡');
    });
    
    // 監聽波次完成事件
    this.enemySpawner.eventEmitter.on('waveComplete', (data) => {
      console.log(`波次 ${data.wave} 完成`);
      // 延遲開始下一波
      this.time.delayedCall(2000, () => {
        this.endWave();
      });
    });
  }

  /**
   * 創建尋路系統
   */
  createPathfindingSystem() {
    this.pathfindingManager = new PathfindingManager(this);
    
  }

  /**
   * 創建效能監控系統
   */
  createPerformanceMonitor() {
    this.performanceMonitor = new PerformanceMonitor(this);
    this.performanceMonitor.startMonitoring();
    
    // 顯示效能監控界面（開發時使用，可選）
    // this.performanceMonitor.showPerformanceDisplay(); // 取消注釋以顯示效能監控
    
    // 添加鍵盤快捷鍵切換效能顯示（P鍵）
    this.input.keyboard.on('keydown-P', () => {
      if (this.performanceMonitor.showDisplay) {
        this.performanceMonitor.hidePerformanceDisplay();
      } else {
        this.performanceMonitor.showPerformanceDisplay();
      }
    });
    
  }

  /**
   * 創建簡化的遊戲管理器
   */
  createSimpleGameManager() {
    this.gameManager = {
      playerData: {
        money: 500,
        health: 100,
        score: 0
      },
      rewardMultiplier: 1.0,
      
      addMoney: (amount) => {
        this.gameManager.playerData.money += amount;
        console.log(`💰 獲得 ${amount} 金幣，總計: ${this.gameManager.playerData.money}`);
        
        // 更新UI
        if (this.moneyText) {
          this.moneyText.setText(`金幣: ${this.gameManager.playerData.money}`);
          
          // 創建金錢增加動畫
          this.tweens.add({
            targets: this.moneyText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 150,
            yoyo: true,
            ease: 'Power2'
          });
        }
        
        // 發送金錢變化事件
        this.events.emit('moneyChanged', {
          amount: amount,
          total: this.gameManager.playerData.money
        });
      },
      
      spendMoney: (amount) => {
        if (this.gameManager.playerData.money >= amount) {
          this.gameManager.playerData.money -= amount;
          console.log(`💸 花費 ${amount} 金幣，剩餘: ${this.gameManager.playerData.money}`);
          
          // 更新UI
          if (this.moneyText) {
            this.moneyText.setText(`金幣: ${this.gameManager.playerData.money}`);
          }
          
          return true;
        }
        return false;
      }
    };
    
    console.log('🏪 創建簡化遊戲管理器');
  }

  /**
   * 設置金錢更新監聽器
   */
  setupMoneyUpdateListener() {
    // 監聽金錢變化事件
    this.events.on('moneyChanged', (data) => {
      if (this.moneyText) {
        this.moneyText.setText(`金幣: ${data.total}`);
      }
      // 同步 DOM 卡片可用性
      if (this.towerCardUI && typeof this.towerCardUI.updateCardAvailability === 'function') {
        this.towerCardUI.updateCardAvailability(data.total);
      }
    });
    
    // 監聽敵人死亡事件（來自BaseTower的投射物擊殺）
    this.events.on('enemyKilled', (data) => {
      console.log(`🎯 敵人被擊殺: ${data.enemy.enemyType}, 獎勵: ${data.reward}`);
    });
    
  }

  /**
   * 創建屏幕震動系統
   */
  createScreenShake() {
    this.screenShake = new ScreenShake(this);
    
    // 監聽敵人死亡事件，添加震動反饋
    this.events.on('enemyKilled', (data) => {
      this.screenShake.enemyDeath(data.enemyType);
    });
    
    // 移除S鍵測試震動，避免與玩家移動衝突
    // this.input.keyboard.on('keydown-S', () => {
    //   this.screenShake.testShake();
    // });
    
  }

  /**
   * 創建連擊系統
   */
  createComboSystem() {
    this.comboSystem = new ComboSystem(this);
    
    // 添加鍵盤快捷鍵重置連擊（R鍵）
    this.input.keyboard.on('keydown-R', () => {
      this.comboSystem.reset();
      console.log('🔄 連擊系統已重置');
    });
    
  }

  /**
   * 創建增強音頻系統
   */
  createEnhancedAudio() {
    this.enhancedAudio = new EnhancedAudioManager(this);
    
    // 播放遊戲開始音效
    this.time.delayedCall(1000, () => {
      this.enhancedAudio.playSound('game_start');
    });
    
  }

  /**
   * 創建暫停系統
   */
  createPauseSystem() {
    // 只監聽ESC鍵暫停，空格鍵用於攻擊
    this.input.keyboard.on('keydown-ESC', () => {
      this.togglePause();
    });
    
    // 調試按鍵：R鍵切換敵人攻擊範圍顯示
    this.input.keyboard.on('keydown-R', () => {
      this.toggleEnemyAttackRanges();
    });
    
    // 監聽M鍵切換靜音
    this.input.keyboard.on('keydown-M', () => {
      if (this.enhancedAudio) {
        const isMuted = this.enhancedAudio.toggleMute();
        console.log(`🔊 音頻${isMuted ? '靜音' : '開啟'}`);
      }
    });
    
  }

  /**
   * 切換敵人攻擊範圍顯示
   */
  toggleEnemyAttackRanges() {
    if (!this.enemies) return;
    
    // 切換所有敵人的攻擊範圍顯示
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.showAttackRange) {
        // 如果當前隱藏，則顯示；如果顯示，則隱藏
        const isVisible = enemy.attackRangeIndicator && enemy.attackRangeIndicator.visible;
        enemy.showAttackRange(!isVisible);
      }
    });
    
    console.log('🎯 切換敵人攻擊範圍顯示');
  }

  /**
   * 切換暫停狀態
   */
  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  /**
   * 暫停遊戲
   */
  pauseGame() {
    if (this.isPaused) return;
    
    this.isPaused = true;
    console.log('⏸️ 遊戲已暫停');
    
    // 暫停物理世界
    this.physics.world.pause();
    
    // 暫停所有動畫
    this.tweens.pauseAll();
    
    // 暫停計時器
    this.time.paused = true;
    
    // 暫停音頻
    if (this.enhancedAudio) {
      this.enhancedAudio.pauseAudio();
    }
    
    // 顯示暫停覆蓋層
    this.showPauseOverlay();
    
    // 播放暫停音效
    if (this.enhancedAudio) {
      this.enhancedAudio.playSound('button_click');
    }
  }

  /**
   * 恢復遊戲
   */
  resumeGame() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    console.log('▶️ 遊戲已恢復');
    
    // 恢復物理世界
    this.physics.world.resume();
    
    // 恢復所有動畫
    this.tweens.resumeAll();
    
    // 恢復計時器
    this.time.paused = false;
    
    // 恢復音頻
    if (this.enhancedAudio) {
      this.enhancedAudio.resumeAudio();
    }
    
    // 隱藏暫停覆蓋層
    this.hidePauseOverlay();
    
    // 播放恢復音效
    if (this.enhancedAudio) {
      this.enhancedAudio.playSound('button_click');
    }
  }

  /**
   * 顯示暫停覆蓋層
   */
  showPauseOverlay() {
    if (this.pauseOverlay) return;
    
    const { width, height } = this.scale.gameSize;
    
    // 創建暫停容器
    this.pauseOverlay = this.add.container(width / 2, height / 2);
    
    // 半透明背景
    const background = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    this.pauseOverlay.add(background);
    
    // 暫停標題
    const pauseTitle = this.add.text(0, -50, '遊戲已暫停', {
      fontSize: '32px',
      fill: '#ffffff',
      fontWeight: 'bold',
      fontFamily: 'Arial'
    });
    pauseTitle.setOrigin(0.5);
    this.pauseOverlay.add(pauseTitle);
    
    // 提示文字
    const instructionText = this.add.text(0, 20, '按空格鍵或ESC鍵繼續遊戲', {
      fontSize: '16px',
      fill: '#cccccc',
      fontFamily: 'Arial'
    });
    instructionText.setOrigin(0.5);
    this.pauseOverlay.add(instructionText);
    
    // 快捷鍵提示
    const shortcutsText = this.add.text(0, 60, 'M鍵: 靜音 | P鍵: 效能監控 | R鍵: 重置連擊', {
      fontSize: '12px',
      fill: '#888888',
      fontFamily: 'Arial'
    });
    shortcutsText.setOrigin(0.5);
    this.pauseOverlay.add(shortcutsText);
    
    this.pauseOverlay.setDepth(1000);
    
    // 暫停覆蓋層淡入動畫
    this.pauseOverlay.setAlpha(0);
    this.tweens.add({
      targets: this.pauseOverlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2.easeOut'
    });
  }

  /**
   * 隱藏暫停覆蓋層
   */
  hidePauseOverlay() {
    if (!this.pauseOverlay) return;
    
    // 暫停覆蓋層淡出動畫
    this.tweens.add({
      targets: this.pauseOverlay,
      alpha: 0,
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => {
        if (this.pauseOverlay) {
          this.pauseOverlay.destroy();
          this.pauseOverlay = null;
        }
      }
    });
  }

  /**
   * 設置塔系統事件監聽器
   */
  setupTowerSystemEvents() {
    // 監聽塔放置事件
    this.events.on('towerPlaced', this.onTowerPlaced, this);
    
    // 監聽塔選中事件
    this.events.on('towerSelected', this.onTowerSelected, this);
    
    // 監聽塔卡片選擇事件
    this.events.on('towerCardSelected', this.onTowerCardSelected, this);
    
    // 監聽建造事件
    this.events.on('buildingStarted', this.onBuildingStarted, this);
    this.events.on('buildingCancelled', this.onBuildingCancelled, this);
  }

  /**
   * 塔放置事件處理
   */
  onTowerPlaced(data) {
    const { tower, gridPos } = data;
    
    console.log(`塔已放置在網格 (${gridPos.x}, ${gridPos.y})`);
    
    // 更新資源顯示（臨時）
    const currentMoney = 500; // 這裡需要實際的資源管理
    this.moneyText.setText(`金幣: ${currentMoney - tower.buildCost}`);
    
    // 播放建造完成音效
    this.playSound('tower_place_complete');
  }

  /**
   * 塔選中事件處理
   */
  onTowerSelected(tower) {
    console.log(`選中了${tower.towerType}塔`);
    
    // 顯示右下角塔升級UI
    if (this.towerUpgradeUI) {
      this.towerUpgradeUI.show(tower);
    }
  }

  /**
   * 塔卡片選擇事件處理
   */
  onTowerCardSelected(data) {
    const { type, name, cost } = data;
    console.log(`🎯 選擇了塔卡片: ${name} (${type}) - 價格: $${cost}`);
    
    // 調試信息
    console.log('🔍 調試信息:');
    console.log('  - 玩家對象:', this.player);
    console.log('  - 玩家金錢:', this.player ? this.player.money : 'undefined');
    console.log('  - 塔放置系統:', this.towerPlacementSystem);
    console.log('  - 塔卡片UI:', this.towerCardUI);
    
    // 檢查玩家是否有足夠的金錢
    if (this.player && this.player.money >= cost) {
      console.log(`✅ 金錢檢查通過: 玩家有 $${this.player.money}，需要 $${cost}`);
      
      // 開始塔放置模式
      if (this.towerPlacementSystem) {
        console.log(`🚀 調用 startTowerPlacement(${type})`);
        this.towerPlacementSystem.startTowerPlacement(type);
        
        // 檢查放置系統狀態
        const status = this.towerPlacementSystem.getStatus();
        console.log('📊 塔放置系統狀態:', status);
        
        console.log(`✅ 開始放置 ${type} 塔`);
      } else {
        console.error('❌ 塔放置系統未初始化');
      }
    } else {
      const reason = !this.player ? '玩家對象不存在' : 
                    this.player.money < cost ? `金錢不足 (有$${this.player.money}，需要$${cost})` : '未知原因';
      console.warn(`❌ 無法購買 ${name}: ${reason}`);
      
      // 取消卡片選擇（相容 DOM 版本與舊版）
      if (this.towerCardUI && typeof this.towerCardUI.deselectAll === 'function') {
        this.towerCardUI.deselectAll();
      }
    }
  }

  /**
   * 建造開始事件處理
   */
  onBuildingStarted(data) {
    console.log(`開始建造${data.towerType}塔`);
    
    // 暫停遊戲時間流逝（可選）
    // this.physics.world.pause();
  }

  /**
   * 建造取消事件處理
   */
  onBuildingCancelled() {
    console.log('建造已取消');
    
    // 恢復遊戲時間流逝（可選）
    // this.physics.world.resume();
  }

  /**
   * 顯示塔升級UI（臨時實現）
   */
  showTowerUpgradeUI(tower) {
    // 創建簡單的升級選項
    const upgradePanel = this.createTowerUpgradePanel(tower);
    
    // 3秒後自動隱藏
    this.time.delayedCall(3000, () => {
      if (upgradePanel) {
        upgradePanel.destroy();
      }
    });
  }

  /**
   * 創建塔升級面板（臨時實現）
   */
  createTowerUpgradePanel(tower) {
    const { width, height } = this.scale.gameSize;
    
    // 面板背景
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.9);
    panel.lineStyle(2, 0x00ffff);
    panel.fillRect(width - 250, 100, 240, 200);
    panel.strokeRect(width - 250, 100, 240, 200);
    
    // 塔信息
    const info = this.add.text(width - 240, 120, `${tower.towerType}塔 等級${tower.level}`, {
      fontSize: '16px',
      fill: '#00ffff',
      fontWeight: 'bold'
    });
    
    const stats = this.add.text(width - 240, 150, 
      `傷害: ${tower.damage}\n射程: ${tower.range}\n射速: ${(1000/tower.fireRate).toFixed(1)}/秒`, {
      fontSize: '12px',
      fill: '#ffffff'
    });
    
    // 升級按鈕
    if (tower.level < tower.maxLevel) {
      const upgradeCost = tower.getUpgradeCost();
      const upgradeBtn = this.add.text(width - 240, 220, `升級 ($${upgradeCost})`, {
        fontSize: '14px',
        fill: '#00ff00',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
      });
      
      upgradeBtn.setInteractive();
      upgradeBtn.on('pointerdown', () => {
        if (tower.upgrade()) {
          this.playSound('tower_upgrade');
          panel.destroy();
        }
      });
    }
    
    // 出售按鈕
    const sellValue = tower.getSellValue();
    const sellBtn = this.add.text(width - 240, 260, `出售 ($${sellValue})`, {
      fontSize: '14px',
      fill: '#ff6b6b',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    });
    
    sellBtn.setInteractive();
    sellBtn.on('pointerdown', () => {
      // 出售塔
      this.towerPlacementSystem.removeTower(tower);
      tower.sell();
      this.playSound('tower_sell');
      panel.destroy();
    });
    
    return panel;
  }

  /**
   * 設置碰撞檢測
   */
  setupCollisions() {
    // 塔投射物與敵人的碰撞
    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHitEnemy, null, this);
    
    // 玩家投射物與敵人的碰撞
    if (this.player && this.player.weapon && this.player.weapon.projectiles) {
      this.physics.add.overlap(this.player.weapon.projectiles, this.enemies, this.onPlayerProjectileHitEnemy, null, this);
    }
    
    // 投射物與邊界的碰撞
    this.physics.add.collider(this.projectiles, this.boundaries, (projectile) => {
      if (projectile.deactivate) {
        projectile.deactivate();
      }
    });
    
    // 敵人與邊界的碰撞
    this.physics.add.collider(this.enemies, this.boundaries);
    
  }

  /**
   * 塔投射物擊中敵人
   */
  onProjectileHitEnemy(projectile, enemy) {
    if (!projectile.isActive || !enemy.isAlive) return;
    
    // 投射物造成傷害
    if (projectile.hitTarget) {
      projectile.target = enemy;
      projectile.hitTarget();
    } else {
      // 備用傷害邏輯
      const damage = projectile.damage || 30;
      const damageDealt = enemy.takeDamage(damage, 'projectile', projectile.tower);
      
      // 如果敵人被擊殺，更新塔的統計
      if (projectile.tower && enemy.health <= 0) {
        projectile.tower.stats.enemiesKilled++;
        console.log(`🎯 ${projectile.tower.towerType}塔擊殺 ${enemy.enemyType}敵人！`);
      }
      
      console.log(`💥 投射物擊中${enemy.enemyType}敵人，造成${damageDealt}點傷害`);
      
      // 銷毀投射物
      projectile.destroy();
    }
  }

  /**
   * 玩家投射物擊中敵人
   */
  onPlayerProjectileHitEnemy(projectile, enemy) {
    if (!projectile.isActive || !enemy.isAlive) return;
    
    // 玩家投射物造成傷害
    const damage = projectile.config ? projectile.config.damage : 30;
    const damageDealt = enemy.takeDamage(damage);
    
    console.log(`玩家投射物擊中${enemy.enemyType}敵人，造成${damageDealt}點傷害`);
    
    // 處理穿透效果
    if (projectile.config && projectile.config.piercing > 0) {
      projectile.config.piercing--;
      if (projectile.config.piercing <= 0) {
        projectile.deactivate && projectile.deactivate();
      }
    } else {
      // 銷毀投射物
      projectile.deactivate && projectile.deactivate();
    }
  }

  /**
   * 開始準備階段
   */
  startPreparationPhase() {
    this.gameState = 'preparation';
    this.currentWave++;
    
    
    // 更新波次顯示
    this.waveDisplay.setText(`波次 ${this.currentWave} - 準備階段`);
    
    // 開始準備計時器
    this.startPreparationTimer();
    
    // 播放準備音效
    this.playSound('wave_prepare');
  }

  /**
   * 開始準備計時器
   */
  startPreparationTimer() {
    const preparationTime = GameConfig.WAVE.PREPARATION_TIME;
    let timeLeft = preparationTime / 1000;
    
    this.preparationTimerText.setText(`準備時間: ${timeLeft}秒`);
    this.preparationTimerText.setVisible(true);
    
    this.preparationTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        this.preparationTimerText.setText(`準備時間: ${timeLeft}秒`);
        
        if (timeLeft <= 0) {
          this.startWavePhase();
        } else if (timeLeft <= 5) {
          // 最後5秒警告
          this.preparationTimerText.setFill('#ff4757');
          this.preparationTimerText.setScale(1.2);
          this.tweens.add({
            targets: this.preparationTimerText,
            scaleX: 1,
            scaleY: 1,
            duration: 200
          });
        }
      },
      repeat: Math.floor(preparationTime / 1000)
    });
  }

  /**
   * 開始波次階段
   */
  startWavePhase() {
    this.gameState = 'playing';
    
    console.log(`開始波次 ${this.currentWave}`);
    
    // 隱藏準備計時器
    this.preparationTimerText.setVisible(false);
    
    // 更新波次顯示
    this.waveDisplay.setText(`波次 ${this.currentWave} - 戰鬥中`);
    this.waveDisplay.setFill('#ff6b6b');
    
    // 播放波次開始音效
    this.playSound('wave_start');
    
    // 開始生成敵人
    this.spawnEnemies();
  }

  /**
   * 結束波次
   */
  endWave() {
    console.log(`波次 ${this.currentWave} 結束`);
    
    // 播放波次完成音效
    this.playSound('wave_complete');
    
    // 給予獎勵
    this.giveWaveReward();
    
    // 短暫延遲後開始下一波
    this.time.delayedCall(3000, () => {
      this.startPreparationPhase();
    });
  }

  /**
   * 給予波次獎勵
   */
  giveWaveReward() {
    const reward = this.currentWave * 50;
    console.log(`獲得波次獎勵: ${reward} 金幣`);
    
    // 更新資源顯示
    // 這裡需要實際的資源管理系統
    this.moneyText.setText(`金幣: ${500 + reward}`);
  }

  /**
   * 玩家死亡處理
   */
  onPlayerDied() {
    console.log('玩家死亡，遊戲結束');
    
    // 切換到遊戲結束場景
    this.switchToScene('GameOverScene', {
      score: this.currentWave * 1000,
      level: this.currentWave,
      enemiesKilled: 0,
      timePlayed: Math.floor(this.time.now / 1000),
      isVictory: false
    });
  }

  /**
   * 玩家受傷處理
   */
  onPlayerDamaged(data) {
    // 更新生命值顯示
    this.healthText.setText(`HP: ${data.currentHealth}/${data.maxHealth}`);
    
    // 生命值低於30%時警告
    if (data.currentHealth / data.maxHealth < 0.3) {
      this.healthText.setFill('#ff4757');
      this.playSound('low_health');
    }
  }

  /**
   * 暫停遊戲
   */
  pauseGame() {
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  /**
   * 生成敵人
   */
  spawnEnemies() {
    if (this.enemySpawner) {
      this.enemySpawner.startWave(this.currentWave);
    }
  }

  /**
   * 返回主選單
   */
  returnToMainMenu() {
    this.switchToScene('MainMenuScene');
  }

  /**
   * 場景更新
   */
  updateSceneLogic(time, delta) {
    // 更新玩家
    if (this.player && this.player.isAlive) {
      this.player.update(time, delta);
    }
    
    // 更新敵人
    const aliveEnemies = this.enemies.children.entries.filter(enemy => enemy.isAlive);
    
    
    this.enemies.children.entries.forEach((enemy, index) => {
      if (enemy.update && enemy.isAlive) {
        enemy.update(time, delta);
      }
    });
    
    // 更新敵人生成器
    if (this.enemySpawner) {
      this.enemySpawner.update(time, delta);
    }
    
    // 更新塔（減少日誌噪音）
    const activeTowers = this.towers.children.entries.filter(tower => tower.isActive);
    
    this.towers.children.entries.forEach(tower => {
      if (tower.update && tower.isActive) {
        tower.update(time, delta);
      }
    });
    
    // 更新投射物
    this.projectiles.children.entries.forEach(projectile => {
      if (projectile.update) {
        projectile.update(time, delta);
      }
    });
    
    // 更新效能監控
    if (this.performanceMonitor) {
      this.performanceMonitor.update();
    }
  }

  /**
   * 重新佈局UI
   */
  repositionUI(width, height) {
    // 重新定位HUD元素
    if (this.waveDisplay) {
      this.waveDisplay.setPosition(width/2, 30);
    }
    
    if (this.preparationTimerText) {
      this.preparationTimerText.setPosition(width/2, 80);
    }
    
    if (this.pauseButton) {
      this.pauseButton.setPosition(width - 50, 30);
    }
  }

  /**
   * 清理場景
   */
  cleanupScene() {
    // 清理計時器
    if (this.preparationTimer) {
      this.preparationTimer.destroy();
    }
    
    // 清理玩家事件監聽器
    if (this.player) {
      this.player.eventEmitter.off('playerDied', this.onPlayerDied, this);
      this.player.eventEmitter.off('playerDamaged', this.onPlayerDamaged, this);
    }
    
    // 清理塔系統
    if (this.towerPlacementSystem) {
      this.towerPlacementSystem.cleanup();
    }
    
    // if (this.towerBuildUI) {
    //   this.towerBuildUI.cleanup();
    // }
    
    if (this.towerUpgradeUI) {
      this.towerUpgradeUI.destroy();
      this.towerUpgradeUI = null;
    }
    
    if (this.towerCardUI) {
      this.towerCardUI.destroy();
      this.towerCardUI = null;
    }
    
    // 清理敵人系統
    if (this.enemySpawner) {
      this.enemySpawner.destroy();
      this.enemySpawner = null;
    }
    
    // 清理尋路系統
    if (this.pathfindingManager) {
      this.pathfindingManager.destroy();
      this.pathfindingManager = null;
    }
    
    // 清理效能監控系統
    if (this.performanceMonitor) {
      this.performanceMonitor.destroy();
      this.performanceMonitor = null;
    }
    
    // 清理屏幕震動系統
    if (this.screenShake) {
      this.screenShake.destroy();
      this.screenShake = null;
    }
    
    // 清理連擊系統
    if (this.comboSystem) {
      this.comboSystem.destroy();
      this.comboSystem = null;
    }
    
    // 清理增強音頻系統
    if (this.enhancedAudio) {
      this.enhancedAudio.destroy();
      this.enhancedAudio = null;
    }
    
    // 清理塔系統事件監聽器
    this.events.off('towerPlaced', this.onTowerPlaced, this);
    this.events.off('towerSelected', this.onTowerSelected, this);
    this.events.off('towerCardSelected', this.onTowerCardSelected, this);
    this.events.off('buildingStarted', this.onBuildingStarted, this);
    this.events.off('buildingCancelled', this.onBuildingCancelled, this);
    
    console.log('遊戲場景清理完成');
  }

  /**
   * 創建玩家爆炸動畫
   */
  createPlayerExplosionAnimations() {
    
    // 檢查資源是否存在
    if (!this.textures.exists('player-explosion')) {
      console.error('❌ 玩家爆炸資源不存在: player-explosion');
      return;
    }
    
    // 創建5個等級的爆炸動畫，每個等級使用對應的Explosion序列
    for (let level = 1; level <= 5; level++) {
      const animationKey = `blue_explosion_lv${level}`;
      
      try {
        this.anims.create({
          key: animationKey,
          frames: this.anims.generateFrameNames('player-explosion', {
            prefix: `Explosion_${level}_`,
            start: 0,
            end: 8,
            zeroPad: 3
          }),
          frameRate: 20,
          repeat: 0
        });
        
      } catch (error) {
        console.error(`❌ 爆炸動畫創建失敗: ${animationKey}`, error);
      }
    }
    
  }
}
export default GameplayScene;

