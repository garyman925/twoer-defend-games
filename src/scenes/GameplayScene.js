/**
 * 遊戲場景
 * 主要的遊戲玩法場景，包含玩家、敵人、塔等
 */

import { BaseScene } from '../core/BaseScene.js';
import GameConfig from '../core/GameConfig.js';
import { Player } from '../entities/player/Player.js';
import { TowerPlacementSystem } from '../systems/TowerPlacementSystem.js';
import { GameplayUI } from '../ui/GameplayUI.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { PathfindingManager } from '../systems/PathfindingManager.js';
import { PerformanceMonitor } from '../systems/PerformanceMonitor.js';
// import { ScreenShake } from '../effects/ScreenShake.js'; // ❌ 已移除
import { ComboSystem } from '../systems/ComboSystem.js';
import { EnhancedAudioManager } from '../effects/audio/EnhancedAudioManager.js';
import { WeaponManager } from '../managers/WeaponManager.js';
import { WeaponBarUI } from '../ui/WeaponBarUI.js';

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
    this.gameplayUI = null;
    this.enemySpawner = null;
    this.pathfindingManager = null;
    this.performanceMonitor = null;
    // this.screenShake = null; // ❌ 已移除
    this.comboSystem = null;
    this.enhancedAudio = null;
    this.weaponManager = null; // 🆕 武器管理器
    this.weaponBarUI = null;   // 🆕 武器欄 UI
    
    // 遊戲狀態
    this.gameState = 'preparation'; // preparation, playing, paused
    this.currentWave = 0;
    this.preparationTimer = null;
    this.isPaused = false;
    
    // 遊戲計時（使用累計方式）
    this.elapsedTime = 0;
    
    // 當前波次預期敵人總數
    this.currentWaveExpectedEnemies = 0;
    
    // 🆕 遊戲結束標記（防止重複調用）
    this.isGameOver = false;
    
    // 🆕 Boss 系統
    this.isBossWave = false;        // 是否為 Boss 波次
    this.bossDefeated = false;      // Boss 是否已擊敗
    this.currentBoss = null;        // 當前 Boss 實例
    this.bossSpawnInterval = 5;     // 🆕 每5波出現一次 Boss (Wave 5完成後)
    this.debugBossType = null;      // 🐛 DEBUG: 強制指定 Boss 類型（'berserker', 'summoner', 'tank'）
  }

  /**
   * 場景初始化
   */
  init(data) {
    super.init(data);
    console.log('遊戲場景初始化');
    
    // 🆕 重置所有遊戲狀態（確保每次重新開始都是全新的）
    this.currentWave = 0;
    this.elapsedTime = 0;
    this.gameState = 'preparation';
    this.isPaused = false;
    this.isGameOver = false;
    this.currentWaveExpectedEnemies = 0;
    
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
   * 預載入場景資源
   */
  preload() {
    console.log('🔄 GameplayScene preload 開始...');
    
    // 檢查並載入玩家資源
    if (!this.textures.exists('player_idle')) {
      console.log('📦 載入 player_idle...');
      this.load.atlas('player_idle', 
        'assets/sprites/ships/blue/player_idle.webp', 
        'assets/sprites/ships/blue/player_idle.json');
    }
    
    if (!this.textures.exists('player-explosion')) {
      console.log('📦 載入 player-explosion...');
      this.load.atlas('player-explosion', 
        'assets/sprites/ships/blue/explosion.webp', 
        'assets/sprites/ships/blue/explosion.json');
    }
    
    // 檢查並載入敵人資源
    if (!this.textures.exists('enemy_basic')) {
      console.log('📦 載入 enemy_basic...');
      this.load.atlas('enemy_basic', 
        'assets/sprites/enemies/basic/basic.webp', 
        'assets/sprites/enemies/basic/basic.json');
    }
    
    if (!this.textures.exists('enemy_meteor')) {
      console.log('📦 載入 enemy_meteor...');
      this.load.atlas('enemy_meteor', 
        'assets/sprites/enemies/meteor.webp', 
        'assets/sprites/enemies/meteor.json');
    }
    
    // 檢查並載入塔圖片（飛船圖片）
    if (!this.textures.exists('ship_basic')) {
      console.log('📦 載入 ship_basic...');
      this.load.image('ship_basic', 'assets/sprites/ships/type1/type-1.png');
    }
    if (!this.textures.exists('ship_cannon')) {
      console.log('📦 載入 ship_cannon...');
      this.load.image('ship_cannon', 'assets/sprites/ships/type2/type-2.png');
    }
    if (!this.textures.exists('ship_laser')) {
      console.log('📦 載入 ship_laser...');
      this.load.image('ship_laser', 'assets/sprites/ships/type3/type-3.png');
    }
    if (!this.textures.exists('ship_ice')) {
      console.log('📦 載入 ship_ice...');
      this.load.image('ship_ice', 'assets/sprites/ships/type4/type-4.png');
    }
    
    // 檢查並載入子彈資源
    if (!this.textures.exists('bullets')) {
      console.log('📦 載入 bullets...');
      this.load.atlas('bullets', 
        'assets/sprites/bullets/bullets.webp', 
        'assets/sprites/bullets/bullets.json');
    }
    
    // 檢查並載入敵人爆炸效果
    if (!this.textures.exists('enemy-explosion')) {
      console.log('📦 載入 enemy-explosion...');
      this.load.atlas('enemy-explosion', 
        'assets/sprites/explosion/explosion.png', 
        'assets/sprites/explosion/explosion.json');
    }
    
    // 檢查並載入UI資源
    if (!this.textures.exists('ui_buttons')) {
      console.log('📦 載入 ui_buttons...');
      this.load.atlas('ui_buttons', 
        'assets/ui/ui.webp', 
        'assets/ui/ui.json');
    }
    
    // 檢查並載入背景
    if (!this.textures.exists('space-bg')) {
      console.log('📦 載入 space-bg...');
      this.load.image('space-bg', 'assets/maps/space-bg.png');
    }
    
    console.log('✅ GameplayScene preload 完成');
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
    
    // 創建玩家動畫（在創建玩家之前）
    this.createPlayerAnimations();
    
    // 創建玩家
    this.createPlayer();
    
    // 🆕 創建武器系統（在玩家創建後）
    this.createWeaponSystem();
    
    // 創建 DOM UI
    this.gameplayUI = new GameplayUI(this);
    this.gameplayUI.create();
    
    // 創建塔建造系統
    this.createTowerSystems();
    
    // 創建尋路系統
    this.createPathfindingSystem();
    
    // 創建敵人系統
    this.createEnemySystem();
    
    // 創建效能監控系統
    this.createPerformanceMonitor();
    
    // ❌ 創建屏幕震動系統（已移除）
    // this.createScreenShake();
    
    // 創建連擊系統
    this.createComboSystem();
    
    // 創建增強音頻系統
    this.createEnhancedAudio();
    
    // 創建暫停系統
    this.createPauseSystem();
    
    // 🚧 設置調試控制（臨時功能，正式發佈前刪除）
    this.setupDebugControls();
    
    // 設置碰撞檢測
    this.setupCollisions();
    
    // 設置事件監聽
    this.setupEventListeners();
    
    // 開始準備階段
    this.startPreparationPhase();
    
    // 播放背景音樂 (已移除)
    // this.playMusic('battle_theme');
    
    // 創建玩家爆炸動畫
    this.createPlayerExplosionAnimations();
    
    // 場景淡入效果
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    
    // 初始化時間顯示為 03:00
    if (this.gameplayUI) {
      this.gameplayUI.updateTime(0);
    }
  }

  /**
   * 創建遊戲背景
   */
  createGameBackground(width, height) {
    // 創建太空背景圖片（固定在鏡頭上）
    this.background = this.add.image(
      width / 2,
      height / 2,
      'space-bg'
    );

    // 讓背景不跟隨世界捲動，永遠貼齊可視區域
    this.background.setScrollFactor(0);
    this.background.setDisplaySize(width, height);
    this.background.setDepth(-100);

    // 設置遊戲邊界（若用於碰撞可保留；視覺背景已由 display size 覆蓋）
    this.gameBounds = {
      left: 0,
      right: width,
      top: 0,
      bottom: height
    };
  }

  /**
   * 重新佈局：背景隨可視區域更新
   */
  onResize(gameSize) {
    super.onResize(gameSize);
    const w = gameSize?.width ?? this.scale.width;
    const h = gameSize?.height ?? this.scale.height;
    if (this.background) {
      this.background.setPosition(w / 2, h / 2);
      this.background.setDisplaySize(w, h);
    }
  }

  /**
   * 創建物理群組
   */
  createPhysicsGroups() {
    // 敵人群組
    this.enemies = this.physics.add.group();
    
    // 塔群組
    this.towers = this.physics.add.group();
    
    // 塔投射物群組
    this.projectiles = this.physics.add.group();
    
    // 玩家投射物群組
    this.playerProjectiles = this.physics.add.group();
    
    console.log('✅ 物理群組創建完成（包含玩家投射物群組）');
  }

  /**
   * 創建玩家動畫
   */
  createPlayerAnimations() {
    // 檢查圖集是否載入
    if (!this.textures.exists('player_idle')) {
      console.warn('⚠️ player_idle 圖集未載入，跳過動畫創建');
      return;
    }
    
    // 檢查動畫是否已存在
    if (this.anims.exists('player_idle_anim')) {
      console.log('✅ player_idle_anim 動畫已存在');
      return;
    }
    
    try {
      // 創建待機動畫
      this.anims.create({
        key: 'player_idle_anim',
        frames: this.anims.generateFrameNames('player_idle', {
          prefix: 'player_idle1_',
          start: 1,
          end: 6,
          suffix: '_0.png',
          zeroPad: 1
        }),
        frameRate: 10,
        repeat: -1
      });
      
      console.log('✅ 玩家待機動畫創建成功');
    } catch (error) {
      console.error('❌ 創建玩家動畫失敗:', error);
    }
  }

  /**
   * 創建玩家
   */
  createPlayer() {
    // 玩家位置設在螢幕中間
    const playerX = this.scale.width / 2;
    const playerY = this.scale.height / 2;
    
    this.player = new Player(this, playerX, playerY);
    
    // ✅ 設置鏡頭追蹤玩家（無邊界地圖模式）
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // ✅ 設置無限的鏡頭邊界
    this.cameras.main.setBounds(
      -10000, -10000,  // 左上角
      20000, 20000     // 右下角（10000 x 10000 的大地圖）
    );
    
    console.log('📷 鏡頭追蹤玩家已啟用（無邊界模式）');
    
    // 設置玩家事件監聽器
    this.player.eventEmitter.on('playerDied', this.onPlayerDied, this);
    this.player.eventEmitter.on('playerDamaged', this.onPlayerDamaged, this);
  }

  /**
   * 創建塔建造系統
   */
  createTowerSystems() {
    const { TowerCardOverlay } = require('../ui/TowerCardOverlay.js');
    const { TowerUpgradeUI } = require('../ui/TowerUpgradeUI.js');
    
    // 創建塔建造放置系統
    this.towerPlacementSystem = new TowerPlacementSystem(this);
    
    // 創建塔升級UI（右下角面板）
    this.towerUpgradeUI = new TowerUpgradeUI(this);
    
    // 創建塔卡片選擇UI（底部，改為 DOM 疊加版）
    this.towerCardUI = new TowerCardOverlay(this);
    this.towerCardUI.create();

    // 🆕 重置所有塔的使用次數為 5（新遊戲開始）
    if (this.towerCardUI && typeof this.towerCardUI.resetAllUses === 'function') {
      this.towerCardUI.resetAllUses();
      console.log('✅ 塔卡片使用次數已重置');
    }
    
    // 設置塔系統事件監聽器
    this.setupTowerSystemEvents();
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
    
    // 🆕 添加背景點擊監聽：點擊空位時取消炮塔選擇
    this.input.on('pointerdown', (pointer) => {
      // 只處理左鍵點擊
      if (pointer.button !== 0) return;
      
      // 獲取世界坐標
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      
      // 檢查是否點擊了炮塔
      let clickedTower = false;
      if (this.towers && this.towers.children) {
        this.towers.children.entries.forEach(tower => {
          if (!tower.active) return;
          
          // 計算距離
          const distance = Phaser.Math.Distance.Between(worldX, worldY, tower.x, tower.y);
          
          // 如果點擊在炮塔範圍內（半徑約50像素）
          if (distance < 50) {
            clickedTower = true;
          }
        });
      }
      
      // 如果沒有點擊炮塔，取消所有選中
      if (!clickedTower && this.towers && this.towers.children) {
        this.towers.children.entries.forEach(tower => {
          if (tower.isSelected && typeof tower.deselectTower === 'function') {
            tower.deselectTower();
          }
        });
      }
    });
  }

  /**
   * 塔卡片選擇事件處理
   */
  onTowerCardSelected(data) {
    const { type, name, usesRemaining } = data;
    console.log(`🎯 選擇了塔卡片: ${name} (${type}) - 剩餘次數: ${usesRemaining}`);
    
    // 🆕 只允許在準備階段放置炮塔
    if (this.gameState !== 'preparation') {
      console.warn(`❌ 只能在準備階段放置炮塔！當前狀態: ${this.gameState}`);
      
      // 取消卡片選擇
      if (this.towerCardUI && typeof this.towerCardUI.deselectAll === 'function') {
        this.towerCardUI.deselectAll();
      }
      
      // 顯示提示訊息
      if (this.gameplayUI) {
        this.gameplayUI.showGameStatus('只能在準備階段放置炮塔！', 1500);
      }
      
      return;
    }
    
    // 檢查是否還有使用次數
    if (usesRemaining > 0) {
      console.log(`✅ 次數檢查通過，剩餘: ${usesRemaining}`);
      
      // 開始塔放置模式
      if (this.towerPlacementSystem) {
        this.towerPlacementSystem.startTowerPlacement(type);
      }
    } else {
      console.warn(`❌ 無法使用 ${name}: 沒有剩餘次數`);
      
      // 取消卡片選擇
      if (this.towerCardUI && typeof this.towerCardUI.deselectAll === 'function') {
        this.towerCardUI.deselectAll();
      }
    }
  }

  /**
   * 塔放置事件處理
   */
  onTowerPlaced(data) {
    const { tower, gridPos } = data;
    console.log(`塔已放置在網格 (${gridPos.x}, ${gridPos.y})`);
    
    // 播放建造完成音效 (已移除)
    // this.playSound('tower_place_complete');
  }

  /**
   * 建造開始事件處理
   */
  onBuildingStarted(data) {
    console.log(`開始建造${data.towerType}塔`);
  }

  /**
   * 建造取消事件處理
   */
  onBuildingCancelled() {
    console.log('建造已取消');
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
      // 不在生成時更新計數，因為波次開始時已預先顯示總數
      // 只在擊殺時更新（減少尚餘數量）
    });
    
    // 監聽敵人死亡事件
    this.enemySpawner.eventEmitter.on('enemyDied', (data) => {
      console.log('敵人死亡');
    });
    
    // 監聽波次完成事件
    this.enemySpawner.eventEmitter.on('waveComplete', (data) => {
      console.log(`波次 ${data.wave} 完成`);
      
      // 顯示全滅訊息（使用特殊背景）
      if (this.gameplayUI) {
        this.gameplayUI.showGameStatus(`全滅！`, 2000, 'victory');
      }
      
      // 🔑 延遲2秒後調用 endWave()（會檢查 Boss 條件並調用準備階段）
      // endWave() 內部會再延遲3秒後調用 startPreparationPhase()
      this.time.delayedCall(2000, () => {
        this.endWave();  // ✅ 改為調用 endWave()，確保 Boss 檢測邏輯執行
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
   * 創建屏幕震動系統（已停用）
   */
  /*
  createScreenShake() {
    // ❌ 已停用：ScreenShake 使用過時的 Phaser API
    this.screenShake = new ScreenShake(this);
    
    // 監聽敵人死亡事件，添加震動反饋
    this.events.on('enemyKilled', (data) => {
      this.screenShake.enemyDeath(data.enemyType);
    });
  }
  */

  /**
   * 🚧 設置調試控制（臨時功能）
   * TODO: 正式發佈前刪除此功能
   */
  setupDebugControls() {
    console.log('🐛 DEBUG: 調試控制已啟用');
    
    // 🆕 先移除舊的監聽器（防止累積）
    this.input.keyboard.off('keydown-B');
    this.input.keyboard.off('keydown-N');
    this.input.keyboard.off('keydown-K');
    
    console.log('   [B] 鍵 - 跳轉到下一個 Boss 波次（Wave 5, 10, 15...）');
    console.log('   [N] 鍵 - 跳過當前波次');
    console.log('   [K] 鍵 - 清除所有敵人');
    console.log('   [F1] 鍵 - 強制生成 Berserker Boss（狂戰士）');
    console.log('   [F2] 鍵 - 強制生成 Summoner Boss（召喚師）');
    console.log('   [F3] 鍵 - 強制生成 Tank Boss（坦克）');
    console.log('   [F4] 鍵 - 取消強制 Boss 類型（使用正常輪換）');
    
    // 按 B 鍵跳轉到下一個 Boss 波次
    this.input.keyboard.on('keydown-B', () => {
      console.log('🐛 DEBUG: 跳轉到 Boss 波次');
      
      // 計算下一個 Boss 波次（每5波一次：5, 10, 15...）
      const nextBossWave = Math.ceil((this.currentWave + 1) / this.bossSpawnInterval) * this.bossSpawnInterval;
      
      // 直接設置為 Boss 波次的前一波
      this.currentWave = nextBossWave - 1;
      
      // 🆕 重置 Boss 状态
      this.bossDefeated = false;
      this.currentBoss = null;
      
      // 結束當前波次，開始準備階段
      if (this.gameState === 'playing') {
        // 清除所有敵人
        if (this.enemies && this.enemies.children) {
          this.enemies.children.entries.forEach(enemy => {
            if (enemy.isAlive && enemy.die) {
              enemy.die();
            }
          });
        }
        this.endWave();
      } else {
        this.startPreparationPhase();
      }
      
      console.log(`🐛 DEBUG: 已跳轉，下一波為第 ${this.currentWave + 1} 波（Boss 波次）`);
    });
    
    // 按 N 鍵跳過當前波次
    this.input.keyboard.on('keydown-N', () => {
      console.log('🐛 DEBUG: 跳過當前波次');
      
      // 清除所有敵人
      if (this.enemies && this.enemies.children) {
        this.enemies.children.entries.forEach(enemy => {
          if (enemy.isAlive && enemy.die) {
            enemy.die();
          }
        });
      }
      
      this.endWave();
    });
    
    // 按 K 鍵殺死所有敵人
    this.input.keyboard.on('keydown-K', () => {
      console.log('🐛 DEBUG: 清除所有敵人');
      
      if (this.enemies && this.enemies.children) {
        this.enemies.children.entries.forEach(enemy => {
          if (enemy.isAlive && enemy.die) {
            enemy.die();
          }
        });
      }
    });
    
    // 🐛 使用 addKey 方式處理功能鍵（F1-F4）
    const keyF1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    const keyF2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);
    const keyF3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
    const keyF4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F4);
    
    // 🐛 按 F1 鍵強制生成 Berserker Boss
    keyF1.on('down', () => {
      this.debugBossType = 'berserker';
      console.log('🐛 DEBUG: 已設置強制 Boss 類型為 Berserker（狂戰士）');
      console.log('   下次生成 Boss 時將使用此類型');
    });
    
    // 🐛 按 F2 鍵強制生成 Summoner Boss
    keyF2.on('down', () => {
      this.debugBossType = 'summoner';
      console.log('🐛 DEBUG: 已設置強制 Boss 類型為 Summoner（召喚師）');
      console.log('   下次生成 Boss 時將使用此類型');
    });
    
    // 🐛 按 F3 鍵強制生成 Tank Boss
    keyF3.on('down', () => {
      this.debugBossType = 'tank';
      console.log('🐛 DEBUG: 已設置強制 Boss 類型為 Tank（坦克）');
      console.log('   下次生成 Boss 時將使用此類型');
    });
    
    // 🐛 按 F4 鍵取消強制 Boss 類型
    keyF4.on('down', () => {
      this.debugBossType = null;
      console.log('🐛 DEBUG: 已取消強制 Boss 類型，恢復正常輪換');
    });
  }

  /**
   * 🆕 創建武器系統
   */
  async createWeaponSystem() {
    if (!this.player) {
      console.error('❌ 玩家不存在，無法創建武器系統');
      return;
    }
    
    // 創建武器管理器
    this.weaponManager = new WeaponManager(this, this.player);
    await this.weaponManager.init();
    
    // 創建武器欄 UI
    this.weaponBarUI = new WeaponBarUI(this, this.weaponManager);
    this.weaponBarUI.create();
    
    // 🆕 設置武器投射物碰撞（在武器創建後）
    this.setupWeaponCollisions();
    
    console.log('✅ 武器系統創建完成');
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
    
    // 播放遊戲開始音效 (已移除)
    // this.time.delayedCall(1000, () => {
    //   this.enhancedAudio.playSound('game_start');
    // });
  }

  /**
   * 創建暫停系統
   */
  createPauseSystem() {
    // 只監聽ESC鍵暫停，空格鍵用於攻擊
    this.input.keyboard.on('keydown-ESC', () => {
      this.togglePause();
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
    const instructionText = this.add.text(0, 20, '按ESC鍵繼續遊戲', {
      fontSize: '16px',
      fill: '#cccccc',
      fontFamily: 'Arial'
    });
    instructionText.setOrigin(0.5);
    this.pauseOverlay.add(instructionText);
    
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
   * 設置碰撞檢測
   */
  setupCollisions() {
    // 塔投射物與敵人的碰撞
    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHitEnemy, null, this);
    
    // 玩家投射物與敵人的碰撞（使用專用群組）
    this.physics.add.overlap(this.playerProjectiles, this.enemies, this.onPlayerProjectileHitEnemy, null, this);
    
    // 敵人與玩家的碰撞
    this.physics.add.overlap(this.enemies, this.player, this.onEnemyHitPlayer, null, this);
    
    // 🆕 Boss 小石頭與玩家的碰撞（動態設置，因為 bossStones 組在 Boss 生成時才創建）
    // 這會在 Boss 生成小石頭時自動設置
    
    console.log('✅ 碰撞檢測設置完成（包含敵人碰撞玩家）');
  }

  /**
   * 🆕 設置武器投射物碰撞（在武器創建後調用）
   */
  setupWeaponCollisions() {
    if (!this.weaponManager || !this.weaponManager.weaponInstances) return;
    
    // 為每個武器的投射物設置碰撞
    this.weaponManager.weaponInstances.forEach((weaponInstance, weaponId) => {
      if (weaponInstance.projectilePool) {
        weaponInstance.projectilePool.forEach(projectile => {
          if (projectile && projectile.body) {
            // 設置投射物與敵人的碰撞
            this.physics.add.overlap(projectile, this.enemies, this.onWeaponProjectileHitEnemy, null, this);
          }
        });
      }
    });
    
    console.log('✅ 武器投射物碰撞檢測設置完成');
  }

  /**
   * 🆕 武器投射物擊中敵人
   */
  onWeaponProjectileHitEnemy(projectile, enemy) {
    if (!projectile.active || !enemy.isAlive) return;
    
    const damage = projectile.damage || 20;
    const weaponType = projectile.weaponType || 'unknown';
    
    // 🔑 防御性检查：确保 weaponManager 和 weaponInstances 存在
    if (!this.weaponManager) {
      console.warn('⚠️ weaponManager 不存在，跳過武器特效處理');
      // 仍然造成基礎傷害
      enemy.takeDamage(damage, 'projectile', this.player);
      return;
    }
    
    // 🔑 使用局部变量保存引用，并在每次访问前检查
    const weaponInstances = this.weaponManager.weaponInstances;
    if (!weaponInstances) {
      console.warn('⚠️ weaponManager.weaponInstances 不存在，跳過武器特效處理');
      // 仍然造成基礎傷害
      enemy.takeDamage(damage, 'projectile', this.player);
      return;
    }
    
    // 造成傷害
    enemy.takeDamage(damage, 'projectile', this.player);
    
    console.log(`💥 ${weaponType} 擊中 ${enemy.enemyType}敵人，造成 ${damage} 點傷害`);
    
    // 🔑 在每次访问前再次检查（防止在异步操作中被销毁）
    if (!this.weaponManager || !this.weaponManager.weaponInstances) {
      console.warn('⚠️ weaponManager 在處理過程中已被銷毀，跳過武器特效');
      return;
    }
    
    // 根據武器類型處理
    if (weaponType === 'missile') {
      // 導彈：觸發爆炸
      const weaponInstance = weaponInstances.get('missile');
      if (weaponInstance && weaponInstance.explodeMissile) {
        weaponInstance.explodeMissile(projectile);
      }
    } else if (weaponType === 'bomb') {
      // 炸彈：觸發大爆炸
      const weaponInstance = weaponInstances.get('bomb');
      if (weaponInstance && weaponInstance.explodeBomb) {
        weaponInstance.explodeBomb(projectile);
      }
    } else {
      // Vulcan 等：穿透檢查
      if (!projectile.piercing) {
        // 🔑 再次检查（防止在 else 分支中被销毁）
        if (!this.weaponManager || !this.weaponManager.weaponInstances) {
          console.warn('⚠️ weaponManager 在處理過程中已被銷毀，跳過投射物回收');
          return;
        }
        // 如果不穿透，銷毀投射物
        const weaponInstance = weaponInstances.get(weaponType);
        if (weaponInstance && weaponInstance.returnProjectileToPool) {
          weaponInstance.returnProjectileToPool(projectile);
        }
      }
    }
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
    // 添加調試日誌
    console.log('💥 玩家子彈碰撞檢測觸發！');
    console.log('   projectile.active:', projectile.active);
    console.log('   projectile 位置:', projectile.x, projectile.y);
    console.log('   enemy.isAlive:', enemy.isAlive);
    console.log('   enemy 位置:', enemy.x, enemy.y);
    
    if (!projectile.active || !enemy.isAlive) return;
    
    // 玩家投射物造成傷害
    const damage = projectile.config ? projectile.config.damage : 30;
    const damageDealt = enemy.takeDamage(damage);
    
    console.log(`✅ 玩家投射物擊中${enemy.enemyType}敵人，造成${damageDealt}點傷害`);
    
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
   * 🆕 Boss 小石頭擊中玩家
   */
  onBossStoneHitPlayer(stone, player) {
    if (!stone.active || !player.isAlive) return;
    
    // 暫停玩家移動 1 秒
    if (player.disableMovement) {
      player.disableMovement(1000);
    }
    
    // 視覺效果：小石頭爆炸
    const hitEffect = this.add.circle(stone.x, stone.y, 15, 0x888888, 0.8);
    this.tweens.add({
      targets: hitEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => hitEffect.destroy()
    });
    
    // 銷毀小石頭
    stone.destroy();
    
    console.log('🪨 Boss 小石頭擊中玩家，移動被暫停 1 秒');
  }
  
  onEnemyHitPlayer(obj1, obj2) {
    // ✅ 正確識別敵人和玩家（Phaser 碰撞回調的參數順序可能不固定）
    const actualPlayer = this.player;
    let enemy = null;
    
    // 判斷哪個是敵人
    // 🔑 改进：同时检查是否是玩家实例和是否在 enemies 组中
    if (obj1 === actualPlayer || (obj1.constructor && obj1.constructor.name === 'Player')) {
      enemy = obj2;  // obj1 是玩家，obj2 是敵人
    } else if (obj2 === actualPlayer || (obj2.constructor && obj2.constructor.name === 'Player')) {
      enemy = obj1;  // obj2 是玩家，obj1 是敵人
    } else {
      // 如果无法通过 constructor.name 判断，检查是否在 enemies 组中
      if (this.enemies && this.enemies.contains(obj1)) {
        enemy = obj1;
      } else if (this.enemies && this.enemies.contains(obj2)) {
        enemy = obj2;
      } else {
        console.warn('⚠️ 無法識別敵人，跳過碰撞處理');
        return;
      }
    }
    
    // ✅ 添加詳細調試日誌
    console.log('🔍 碰撞檢測觸發！');
    console.log('   obj1.constructor.name:', obj1.constructor ? obj1.constructor.name : 'undefined');
    console.log('   obj2.constructor.name:', obj2.constructor ? obj2.constructor.name : 'undefined');
    console.log('   enemy.constructor.name:', enemy.constructor ? enemy.constructor.name : 'undefined');
    console.log('   enemy.enemyType:', enemy.enemyType || 'undefined');
    console.log('   enemy.isBoss:', enemy.isBoss || false);
    console.log('   enemy.isAlive:', enemy.isAlive);
    console.log('   player.isAlive:', actualPlayer.isAlive);
    console.log('   player.isImmune:', actualPlayer.isImmune);
    console.log('   enemy 位置:', enemy.x, enemy.y);
    console.log('   player 位置:', actualPlayer.x, actualPlayer.y);
    
    // ✅ 只檢查敵人和玩家是否活著（移除無敵檢查）
    if (!enemy.isAlive || !actualPlayer.isAlive) {
      console.log('⚠️ 碰撞被忽略，原因:');
      if (!enemy.isAlive) console.log('   - 敵人已死');
      if (!actualPlayer.isAlive) console.log('   - 玩家已死');
      return;
    }
    
    console.log('💥 敵人碰撞玩家！開始處理...');
    
    // ✅ 如果玩家已經無敵，忽略此次碰撞
    if (actualPlayer.isImmune) {
      console.log('   ⚠️ 玩家無敵中，忽略碰撞');
      return;
    }
    
    // 🆕 玩家智能傳送並扣血（敵人不死亡）
    console.log('   → 玩家傳送到安全位置並扣血');
    console.log('   → 扣血前血量:', actualPlayer.health);
    
    // 先傳送到安全位置（此時敵人還活著，可以正確計算安全區域）
    actualPlayer.teleportToSafePosition();
    
    // 再扣血（會自動設置無敵）
    actualPlayer.takeDamage(1);
    
    console.log('   ✓ 扣血後血量:', actualPlayer.health);
    console.log('   ✓ 玩家進入無敵狀態');
    console.log('   ✅ 碰撞處理完成（敵人繼續存活）');
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
          
          // 發送金錢變化事件
          this.events.emit('moneyChanged', {
            amount: -amount,
            total: this.gameManager.playerData.money
          });
          
          return true;
        }
        return false;
      }
    };
    
    console.log('🏪 創建簡化遊戲管理器');
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
    
    // 創建5個等級的爆炸動畫
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

  /**
   * 設置事件監聽器
   */
  setupEventListeners() {
    // 監聽塔選擇事件
    this.events.on('tower:selected', this.onTowerSelected, this);
    
    // 監聽敵人死亡事件（兩種事件名稱都監聽）
    this.events.on('enemy:died', this.onEnemyDied, this);
    this.events.on('enemyKilled', (data) => {
      this.onEnemyDied({ enemy: data.enemy, reward: data.reward });
    });
    
    // 監聽玩家受傷事件
    this.events.on('player:damaged', this.onPlayerDamaged, this);
    
    // 監聽波次事件
    this.events.on('wave:start', this.onWaveStart, this);
    this.events.on('wave:complete', this.onWaveComplete, this);
  }

  /**
   * 塔選擇事件處理
   */
  onTowerSelected(towerData) {
    const { type, cost } = towerData;
    
    // 檢查是否有足夠金錢
    if (this.gameManager.playerData.money >= cost) {
      this.towerPlacementSystem.startBuilding(type);
    } else {
      this.gameplayUI.showGameStatus('金錢不足！');
    }
  }

  /**
   * 敵人死亡事件處理
   */
  onEnemyDied(data) {
    const { enemy, reward } = data;
    
    // 通過 GameManager 處理敵人擊殺（只計算分數，不再給金錢）
    if (this.gameManager && typeof this.gameManager.enemyKilled === 'function') {
      this.gameManager.enemyKilled(enemy);
    }
    
    // 更新分數 UI
    this.events.emit('score:update', {
      score: this.gameManager.playerData.score
    });
    
    // 🆕 更新敵人計數顯示（使用 waveActualKills）
    if (this.enemySpawner && this.gameplayUI) {
      const killed = this.enemySpawner.waveActualKills; // 改用 waveActualKills
      const total = this.enemySpawner.waveTargetKills;  // 使用 waveTargetKills
      console.log(`📊 更新 UI: killed=${killed}, total=${total}`);
      this.gameplayUI.updateEnemyCount(killed, undefined); // 只更新擊破數，總數不變
    }
  }

  /**
   * 玩家受傷事件處理
   */
  onPlayerDamaged(data) {
    // ❌ 移除重複扣血（Player.takeDamage() 已經處理了）
    // this.gameManager.playerData.health -= damage;
    
    // ✅ 同步 GameManager 的血量數據（使用 Player 傳來的實際血量）
    this.gameManager.playerData.health = data.currentHealth;
    
    console.log('❤️ 玩家受傷事件，同步血量:', data.currentHealth);
    
    // 更新 UI
    this.events.emit('health:update', {
      health: data.currentHealth
    });
    
    // ❌ 移除遊戲結束檢查（Player.die() 會發送 playerDied 事件）
    // if (this.gameManager.playerData.health <= 0) {
    //   this.onPlayerDied();
    // }
  }

  /**
   * 波次開始事件處理
   */
  onWaveStart(data) {
    const { wave, enemies } = data;
    
    // 更新 UI
    this.events.emit('wave:update', { wave, enemies });
    this.gameplayUI.showGameStatus(`第 ${wave} 波開始！`);
  }

  /**
   * 波次完成事件處理
   */
  onWaveComplete(data) {
    const { wave } = data;
    
    // 顯示全滅訊息（使用特殊背景）
    this.gameplayUI.showGameStatus(`全滅！`, 2000, 'victory');
    
    // 延遲後開始準備階段
    this.time.delayedCall(2000, () => {
      this.startPreparationPhase();
    });
  }

  /**
   * 開始準備階段
   */
  startPreparationPhase() {
    // 🔑 關鍵：先清除舊的準備計時器（防止多個計時器同時運行）
    if (this.preparationTimer) {
      console.log('   🔄 清除舊的準備計時器');
      this.preparationTimer.remove();
      this.preparationTimer = null;
    }
    
    this.gameState = 'preparation';
    this.currentWave++;
    
    // 🆕 檢查**上一波**是否為5的倍數（決定這次是否為 Boss 戰）
    const prevWave = this.currentWave - 1;
    // 🔑 關鍵：只根據波次號判斷，不檢查 bossDefeated（由 endWave 管理）
    const isBossWaveByNumber = (prevWave % this.bossSpawnInterval === 0 && prevWave > 0);
    // 如果是 Boss 波次號，且 Boss 未被擊敗，則為 Boss 戰
    this.isBossWave = isBossWaveByNumber && !this.bossDefeated;
    
    console.log(`   🔍 準備階段判斷:`);
    console.log(`      prevWave: ${prevWave}, currentWave: ${this.currentWave}`);
    console.log(`      isBossWaveByNumber: ${isBossWaveByNumber}`);
    console.log(`      bossDefeated: ${this.bossDefeated}`);
    console.log(`      最終 isBossWave: ${this.isBossWave}`);
    
    // 🆕 決定準備階段顯示的文字
    let waveText;
    if (this.isBossWave) {
      waveText = 'Boss戰！';
      console.log(`🕐 Boss 戰準備階段（Wave ${prevWave} 完成後）`);
      console.log(`   下一個戰鬥將是 Boss，然後繼續 Wave ${this.currentWave}`);
    } else {
      waveText = `第${this.currentWave}波`;
      console.log(`🕐 開始準備階段 - 第 ${this.currentWave} 波`);
    }
    
    console.log(`   gameState: ${this.gameState}`);
    
    // 🆕 啟用塔卡片 UI（準備階段可以放置）
    if (this.towerCardUI && typeof this.towerCardUI.setEnabled === 'function') {
      this.towerCardUI.setEnabled(true);
      console.log('   🃏 塔卡片已啟用');
    }
    
    // 🆕 顯示放置格網（幫助玩家放置炮塔）
    if (this.towerPlacementSystem && this.towerPlacementSystem.gridOverlay) {
      this.towerPlacementSystem.gridOverlay.setVisible(true);
      console.log('   📐 格網已顯示');
    }
    
    // 開始準備計時器
    const preparationTime = GameConfig.WAVE ? GameConfig.WAVE.PREPARATION_TIME : 10000;
    let timeLeft = preparationTime / 1000;
    
    console.log(`   準備時間: ${timeLeft}秒`);
    console.log(`   顯示文字: ${waveText}`);
    
    // 🆕 立即更新右上角波次显示
    if (this.gameplayUI) {
      if (this.isBossWave) {
        // Boss 战准备阶段显示 "Boss"
        this.gameplayUI.updateWave('Boss', 0);
        console.log(`   📊 更新波次顯示: Boss`);
      } else {
        // 正常波次显示数字
        this.gameplayUI.updateWave(this.currentWave, 0);
        console.log(`   📊 更新波次顯示: Wave ${this.currentWave}`);
      }
    }
    
    // 立即顯示準備倒數（使用固定的 waveText）
    if (this.gameplayUI) {
      this.gameplayUI.updatePreparationTimer(timeLeft, waveText);
    }
    
    this.preparationTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        console.log(`   ⏱️ 準備倒數: ${timeLeft}秒`);
        
        // 使用準備計時器專用方法顯示倒數（使用闭包中固定的 waveText）
        if (this.gameplayUI) {
          this.gameplayUI.updatePreparationTimer(timeLeft, waveText);
        }
        
        if (timeLeft <= 0) {
          console.log(`   ✅ 準備結束，開始波次`);
          
          // 🆕 隱藏格網（準備時間結束）
          if (this.towerPlacementSystem && this.towerPlacementSystem.gridOverlay) {
            this.towerPlacementSystem.gridOverlay.setVisible(false);
            console.log('   📐 格網已隱藏');
          }
          
          // 隱藏準備計時器
          if (this.gameplayUI) {
            this.gameplayUI.hidePreparationTimer();
          }
          this.startWavePhase();
        }
      },
      repeat: Math.floor(preparationTime / 1000)
    });
    
    // 播放準備音效 (已移除)
    // this.playSound('wave_prepare');
  }

  /**
   * 開始波次階段
   */
  startWavePhase() {
    this.gameState = 'playing';
    
    console.log(`⚔️ 開始波次 ${this.currentWave}`);
    console.log(`   gameState: ${this.gameState}`);
    console.log(`   elapsedTime: ${this.elapsedTime}`);
    console.log(`   isBossWave: ${this.isBossWave}, bossDefeated: ${this.bossDefeated}`);
    
    // 🆕 更新右上角的波次显示
    if (this.gameplayUI) {
      if (this.isBossWave && !this.bossDefeated) {
        // Boss 战阶段显示 "Boss"
        this.gameplayUI.updateWave('Boss', 0);
        console.log(`   📊 更新波次顯示: Boss`);
      } else {
        // 正常波次显示数字
        this.gameplayUI.updateWave(this.currentWave, 0);
        console.log(`   📊 更新波次顯示: Wave ${this.currentWave}`);
      }
    }
    
    // 🆕 禁用塔卡片 UI（戰鬥中不可放置）
    if (this.towerCardUI && typeof this.towerCardUI.setEnabled === 'function') {
      this.towerCardUI.setEnabled(false);
      console.log('   🃏 塔卡片已禁用');
    }
    
    // 🆕 強制停止任何正在進行的建造
    if (this.towerPlacementSystem && this.towerPlacementSystem.isBuilding) {
      this.towerPlacementSystem.cancelBuilding();
      console.log('   🛑 已強制停止建造');
    }
    
    // 🆕 強制隱藏格網（戰鬥階段不允許顯示）
    if (this.towerPlacementSystem && this.towerPlacementSystem.gridOverlay) {
      this.towerPlacementSystem.gridOverlay.setVisible(false);
      console.log('   📐 格網已強制隱藏');
    }
    
    // 開始生成敵人（這會設定 waveTargetKills）
    this.spawnEnemies();
    
    // 更新 UI（使用 waveTargetKills）
    if (this.gameplayUI) {
      this.gameplayUI.showGameStatus(`第 ${this.currentWave} 波 - 戰鬥中`);
      
      // 🆕 使用 EnemySpawner 的 waveTargetKills
      if (this.enemySpawner) {
        const targetEnemies = this.enemySpawner.waveTargetKills || 20;
        console.log(`🎯 波次 ${this.currentWave} 目標敵人數: ${targetEnemies}`);
        
        // 初始化為 0 擊破 / 目標總數
        this.gameplayUI.updateEnemyCount(0, targetEnemies);
      }
    }
    
    // 發送波次開始事件
    this.events.emit('wave:start', {
      wave: this.currentWave,
      enemies: this.enemySpawner ? this.enemySpawner.waveTargetKills : 20
    });
  }

  /**
   * 生成敵人
   */
  spawnEnemies() {
    if (!this.enemySpawner) return;
    
    console.log(`📢 spawnEnemies() 被調用`);
    console.log(`   currentWave: ${this.currentWave}`);
    console.log(`   isBossWave: ${this.isBossWave}`);
    console.log(`   bossDefeated: ${this.bossDefeated}`);
    
    // 🆕 如果是 Boss 波次且 Boss 未被擊敗，先生成 Boss
    if (this.isBossWave && !this.bossDefeated) {
      console.log(`   → 生成 Boss`);
      this.spawnBoss();
    } else {
      console.log(`   → 生成 Wave ${this.currentWave} 正常敵人`);
      // 正常敵人生成
      this.enemySpawner.startWave(this.currentWave);
    }
  }

  /**
   * 🆕 生成 Boss
   */
  spawnBoss() {
    // 🆕 防止重复生成
    if (this.currentBoss && this.currentBoss.isAlive) {
      console.warn('⚠️ Boss 已存在，跳過生成');
      return;
    }
    
    console.log(`👾 生成 BOSS - 第 ${this.currentWave} 波`);
    
    // 暫停正常敵人生成
    if (this.enemySpawner) {
      this.enemySpawner.pauseSpawning();
    }
    
    // 計算 Boss 等級（每5波提升一級）
    const bossLevel = Math.floor(this.currentWave / this.bossSpawnInterval);
    
    // 🎯 根據波次選擇Boss類型（輪換）
    // 🐛 DEBUG: 如果設置了 debugBossType，優先使用它
    let bossType;
    if (this.debugBossType) {
      bossType = this.debugBossType;
      console.log(`🐛 DEBUG: 使用強制指定的 Boss 類型: ${bossType}`);
    } else {
      const cycle = Math.floor((this.currentWave / this.bossSpawnInterval - 1) % 3);
      
      switch (cycle) {
        case 0:
          bossType = 'berserker'; // Wave 5, 20, 35...
          break;
        case 1:
          bossType = 'summoner'; // Wave 10, 25, 40...
          break;
        case 2:
          bossType = 'tank'; // Wave 15, 30, 45...
          break;
        default:
          bossType = 'berserker';
      }
    }
    
    console.log(`👾 生成 ${bossType} Boss - 等級 ${bossLevel}`);
    
    // 更新 UI 顯示 Boss 警告
    if (this.gameplayUI) {
      const { BOSS_TYPES } = require('../entities/enemies/BossEnemy.js');
      const bossName = BOSS_TYPES[bossType].name;
      this.gameplayUI.showGameStatus(`⚠️ ${bossName} Boss 來襲！`, 3000);
    }
    
    // 計算 Boss 生成位置（屏幕中央上方）
    const bossX = this.scale.width / 2;
    const bossY = -150;
    
    // 創建 Boss
    const { BossEnemy } = require('../entities/enemies/BossEnemy.js');
    this.currentBoss = new BossEnemy(this, bossX, bossY, bossLevel, bossType);
    
    // 添加到敵人組
    if (this.enemies) {
      this.enemies.add(this.currentBoss);
    }
    
    // 🔑 監聽 Boss 死亡事件（雙重保險）
    console.log('   → 設置 Boss 死亡事件監聽器...');
    
    // 方式1：监听 Boss 实例的事件
    this.currentBoss.eventEmitter.once('bossDied', (data) => {
      console.log('🔔 收到 bossDied 事件（Boss實例）！');
      console.log('   data:', data);
      this.onBossDefeated(data);
    });
    
    // 方式2：监听场景事件（备份）
    this.events.once('bossDefeated', (data) => {
      console.log('🔔 收到 bossDefeated 事件（場景級）！');
      console.log('   data:', data);
      // 如果第一个监听器没触发，这个作为备份
      if (!this.bossDefeated) {
        this.onBossDefeated({ 
          reward: data.reward || this.currentWave * 100 
        });
      }
    });
    
    console.log('   ✓ Boss 死亡事件監聽器已設置');
    
    // Boss 入場動畫
    this.tweens.add({
      targets: this.currentBoss,
      y: this.scale.height / 2,
      duration: 2000,
      ease: 'Power2.easeOut'
    });
    
    // 播放Boss出現音效（如有）
    if (this.enhancedAudio) {
      this.enhancedAudio.playSound('boss_roar');
    }
    
    // 震動效果
    this.cameras.main.shake(800, 0.015);
    
    // 🆕 顯示屏幕頂部 Boss 血條
    if (this.gameplayUI && typeof this.gameplayUI.showBossHealthBar === 'function') {
      this.gameplayUI.showBossHealthBar(this.currentBoss);
    }
    
    console.log(`👾 ${bossType} Boss 生成完成 - HP: ${this.currentBoss.health}/${this.currentBoss.maxHealth}`);
  }

  /**
   * 🆕 Boss 被擊敗
   */
  onBossDefeated(data) {
    console.log('🎯 onBossDefeated() 被調用！');
    console.log('   data:', data);
    console.log('   this.bossDefeated:', this.bossDefeated);
    console.log('   this.isBossWave:', this.isBossWave);
    console.log('   this.gameState:', this.gameState);
    
    // 🆕 防止重复调用
    if (this.bossDefeated) {
      console.warn('⚠️ Boss 擊敗事件已處理，跳過重複調用');
      return;
    }
    
    console.log(`💀 Boss 被擊敗！獎勵: ${data.reward} 金幣`);
    
    this.bossDefeated = true;
    this.currentBoss = null;
    
    // 🆕 清除所有 Boss 小石头
    if (this.bossStones && this.bossStones.children) {
      let stoneCount = 0;
      this.bossStones.children.entries.forEach(stone => {
        if (stone && stone.active) {
          stone.destroy();
          stoneCount++;
        }
      });
      this.bossStones.clear(true, true);
      console.log(`🗑️ 已清除 ${stoneCount} 個 Boss 小石頭`);
    }
    
    // 🎁 時間獎勵：增加30秒
    const timeBonus = 30000; // 30秒（毫秒）
    this.elapsedTime = Math.max(0, this.elapsedTime - timeBonus);
    
    console.log(`⏱️ 時間獎勵: +30秒，當前遊戲時間: ${(this.elapsedTime / 1000).toFixed(1)}秒`);
    
    // 🆕 隱藏 Boss 血條
    if (this.gameplayUI && typeof this.gameplayUI.hideBossHealthBar === 'function') {
      this.gameplayUI.hideBossHealthBar();
    }
    
    // 🆕 更新右上角波次显示（確保同步）
    if (this.gameplayUI) {
      this.gameplayUI.updateWave(this.currentWave, 0);
      console.log(`   📊 更新波次顯示: Wave ${this.currentWave}`);
    }
    
    // 顯示獎勵提示
    if (this.gameplayUI) {
      this.gameplayUI.showGameStatus(`🎉 Boss 擊敗！獲得 +30 秒時間獎勵！`, 3000);
    }
    
    // 播放勝利音效（如有）
    if (this.enhancedAudio) {
      this.enhancedAudio.playSound('boss_defeated');
    }
    
    // 給予額外金錢獎勵
    const moneyReward = data.reward || (this.currentWave * 100);
    if (this.gameManager && this.gameManager.addMoney) {
      this.gameManager.addMoney(moneyReward);
      console.log(`💰 金錢獎勵: ${moneyReward}`);
    }
    
    // 🆕 Boss 擊敗後，回到準備階段（不增加波次）
    console.log(`   → 3秒後回到準備階段，準備第 ${this.currentWave} 波正常敵人...`);
    
    this.time.addEvent({
      delay: 3000,  // 给玩家3秒看奖励提示
      callback: () => {
        console.log(`⏰ 延遲結束，開始第 ${this.currentWave} 波的準備階段...`);
        
        // 🆕 回到准备阶段（不增加波次）
        this.startPreparationTimerAfterBoss();
      },
      callbackScope: this,
      loop: false
    });
  }

  /**
   * 🆕 Boss 擊敗後開始準備計時器（不增加波次）
   */
  startPreparationTimerAfterBoss() {
    // 🔑 關鍵：先清除舊的準備計時器
    if (this.preparationTimer) {
      console.log('   🔄 清除舊的準備計時器');
      this.preparationTimer.remove();
      this.preparationTimer = null;
    }
    
    this.gameState = 'preparation';
    
    // 🆕 Boss 击败后，currentWave 保持不变（因为 Boss 战不占用波次号）
    // currentWave 已经在 startPreparationPhase() 时 +1 了
    // 例如：Wave 5 完成 → currentWave = 6 → Boss 战 → Boss 击败 → Wave 6
    
    console.log(`🕐 Boss 擊敗後的準備階段 - 準備 Wave ${this.currentWave}`);
    console.log(`   gameState: ${this.gameState}`);
    console.log(`   currentWave: ${this.currentWave} (Boss 擊敗後繼續此波次)`);
    
    // 🆕 更新右上角波次显示（顯示即將戰鬥的波次號）
    if (this.gameplayUI) {
      this.gameplayUI.updateWave(this.currentWave, 0);
      console.log(`   📊 更新波次顯示: Wave ${this.currentWave}`);
    }
    
    // 啟用塔卡片 UI
    if (this.towerCardUI && typeof this.towerCardUI.setEnabled === 'function') {
      this.towerCardUI.setEnabled(true);
      console.log('   🃏 塔卡片已啟用');
    }
    
    // 顯示放置格網
    if (this.towerPlacementSystem && this.towerPlacementSystem.gridOverlay) {
      this.towerPlacementSystem.gridOverlay.setVisible(true);
      console.log('   📐 格網已顯示');
    }
    
    // 開始準備計時器
    const preparationTime = GameConfig.WAVE ? GameConfig.WAVE.PREPARATION_TIME : 10000;
    let timeLeft = preparationTime / 1000;
    
    console.log(`   準備時間: ${timeLeft}秒`);
    
    // 🔑 固定 waveText（在闭包中不会变化）
    const waveText = `第${this.currentWave}波`;
    console.log(`   顯示文字: ${waveText}`);
    
    if (this.gameplayUI) {
      this.gameplayUI.updatePreparationTimer(timeLeft, waveText);
    }
    
    this.preparationTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        console.log(`   ⏱️ 準備倒數: ${timeLeft}秒`);
        
        // ✅ 使用闭包中固定的 waveText
        if (this.gameplayUI) {
          this.gameplayUI.updatePreparationTimer(timeLeft, waveText);
        }
        
        if (timeLeft <= 0) {
          console.log(`   ✅ 準備結束，開始第 ${this.currentWave} 波正常敵人`);
          
          // 隱藏格網
          if (this.towerPlacementSystem && this.towerPlacementSystem.gridOverlay) {
            this.towerPlacementSystem.gridOverlay.setVisible(false);
            console.log('   📐 格網已隱藏');
          }
          
          // 隱藏準備計時器
          if (this.gameplayUI) {
            this.gameplayUI.hidePreparationTimer();
          }
          
          // 開始波次（此時 bossDefeated 為 true，所以會生成正常敵人）
          this.startWavePhase();
        }
      },
      repeat: Math.floor(preparationTime / 1000)
    });
  }

  /**
   * 結束波次
   */
  endWave() {
    console.log(`波次 ${this.currentWave} 結束`);
    
    // 播放波次完成音效 (已移除)
    // this.playSound('wave_complete');
    
    // 給予獎勵
    this.giveWaveReward();
    
    // 🆕 檢查**當前波次**是否為5的倍數
    // 如果是，下一個準備階段就是 Boss 戰
    console.log(`   🔍 檢查 Boss 條件:`);
    console.log(`      currentWave: ${this.currentWave}`);
    console.log(`      bossSpawnInterval: ${this.bossSpawnInterval}`);
    console.log(`      ${this.currentWave} % ${this.bossSpawnInterval} = ${this.currentWave % this.bossSpawnInterval}`);
    
    const shouldSpawnBossNext = (this.currentWave % this.bossSpawnInterval === 0 && this.currentWave > 0);
    console.log(`      shouldSpawnBossNext: ${shouldSpawnBossNext}`);
    console.log(`      當前 bossDefeated 狀態: ${this.bossDefeated}`);
    
    if (shouldSpawnBossNext) {
      this.bossDefeated = false;  // 重置 Boss 狀態
      console.log(`   ✅ Wave ${this.currentWave} 完成，下一個準備階段為 Boss 戰！`);
      console.log(`   🔄 重置 bossDefeated = false`);
    } else {
      console.log(`   ➡️ 不是 Boss 波次，繼續正常流程`);
    }
    
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
    
    // 更新資源
    if (this.gameManager) {
      this.gameManager.addMoney(reward);
    }
  }

  /**
   * 時間到達處理
   */
  onTimeUp() {
    // 🔴 防止重複調用
    if (this.isGameOver) {
      return;
    }
    this.isGameOver = true;
    
    console.log('⏰ 時間到！遊戲結束');
    
    // 🆕 獎勵金幣
    this.rewardMoney(
      this.gameManager.playerData.score,
      this.gameManager.playerData.stats.enemiesKilled,
      this.elapsedTime
    );
    
    // 切換到遊戲結束場景（勝利）
    this.switchToScene('GameOverScene', {
      score: this.gameManager.playerData.score,
      level: this.currentWave,
      enemiesKilled: this.gameManager.playerData.stats.enemiesKilled,
      timePlayed: this.elapsedTime,
      isVictory: true, // 撐滿3分鐘視為勝利
      reason: 'timeUp'
    });
  }

  /**
   * 玩家死亡處理
   */
  onPlayerDied() {
    // 🔴 防止重複調用
    if (this.isGameOver) {
      return;
    }
    this.isGameOver = true;
    
    console.log('玩家死亡，遊戲結束');
    
    // 🆕 獎勵金幣
    this.rewardMoney(
      this.gameManager.playerData.score,
      this.gameManager.playerData.stats.enemiesKilled,
      this.elapsedTime
    );
    
    // 切換到遊戲結束場景（失敗）
    this.switchToScene('GameOverScene', {
      score: this.gameManager.playerData.score,
      level: this.currentWave,
      enemiesKilled: this.gameManager.playerData.stats.enemiesKilled,
      timePlayed: this.elapsedTime,
      isVictory: false,
      reason: 'playerDied'
    });
  }

  /**
   * 🆕 獎勵金幣
   * @param {number} score - 遊戲分數
   * @param {number} enemiesKilled - 擊殺數
   * @param {number} timePlayed - 遊戲時長（毫秒）
   */
  rewardMoney(score, enemiesKilled, timePlayed) {
    // 計算獎勵金幣
    const scoreBonus = Math.floor(score / 10);  // 每10分 = 1金幣
    const killBonus = enemiesKilled * 2;  // 每擊殺 = 2金幣
    const timeBonus = Math.floor(timePlayed / 10000);  // 每10秒 = 1金幣
    const totalReward = scoreBonus + killBonus + timeBonus;
    
    try {
      const config = JSON.parse(localStorage.getItem('playerShipConfig') || '{}');
      const oldMoney = config.playerMoney || 5000;
      config.playerMoney = oldMoney + totalReward;
      localStorage.setItem('playerShipConfig', JSON.stringify(config));
      
      console.log('💰 遊戲結束獎勵：');
      console.log('   分數獎勵:', scoreBonus, '金幣');
      console.log('   擊殺獎勵:', killBonus, '金幣');
      console.log('   時間獎勵:', timeBonus, '金幣');
      console.log('   總獎勵:', totalReward, '金幣');
      console.log('   原金幣:', oldMoney, '→ 新金幣:', config.playerMoney);
    } catch (error) {
      console.error('❌ 保存金幣獎勵失敗:', error);
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
    // 🆕 如果遊戲已結束，停止所有邏輯更新
    if (this.isGameOver) {
      return;
    }
    
    // 更新遊戲時間（僅在遊戲進行中且未暫停時）
    if (this.gameState === 'playing' && !this.isPaused) {
      // 累計遊戲時間（使用 delta 累加，避免暫停時計時）
      const previousElapsed = this.elapsedTime;
      this.elapsedTime += delta / 1000; // delta 是毫秒，轉換為秒
      const elapsedSeconds = Math.floor(this.elapsedTime);
      
      // 檢查時間限制（3分鐘）
      const timeLimit = GameConfig.GAME.TIME_LIMIT || 180;
      if (elapsedSeconds >= timeLimit) {
        console.log(`⏰ 時間到達: ${elapsedSeconds}秒`);
        this.onTimeUp();
        return;
      }
      
      // 更新時間顯示（每秒更新一次）
      const prevSeconds = Math.floor(previousElapsed);
      if (this.gameplayUI && elapsedSeconds !== prevSeconds) {
        console.log(`⏱️ 更新時間顯示: ${elapsedSeconds}秒`);
        this.gameplayUI.updateTime(elapsedSeconds);
      }
    }
    
    // 更新玩家
    if (this.player && this.player.isAlive) {
      this.player.update(time, delta);
    }
    
    // 更新敵人
    this.enemies.children.entries.forEach((enemy) => {
      if (enemy.update && enemy.isAlive) {
        enemy.update(time, delta);
      }
    });
    
    // 🆕 更新 Boss 血條（如果 Boss 存在）
    if (this.currentBoss && this.currentBoss.isAlive && this.gameplayUI) {
      if (typeof this.gameplayUI.updateBossHealthBar === 'function') {
        this.gameplayUI.updateBossHealthBar(this.currentBoss);
      }
    }
    
    // 更新敵人生成器
    if (this.enemySpawner) {
      this.enemySpawner.update(time, delta);
    }
    
    // 🆕 更新武器管理器（冷卻計時）
    if (this.weaponManager) {
      this.weaponManager.update(time, delta);
    }
    
    // 更新塔
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
    // DOM UI 會自動響應式調整
    console.log('UI repositioned for new size:', width, height);
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
    
    // ❌ 清理屏幕震動系統（已停用）
    // if (this.screenShake) {
    //   this.screenShake.destroy();
    //   this.screenShake = null;
    // }
    
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
    
    // 清理 DOM UI
    if (this.gameplayUI) {
      this.gameplayUI.destroy();
      this.gameplayUI = null;
    }
    
    // 🆕 清理武器系統
    if (this.weaponBarUI) {
      this.weaponBarUI.destroy();
      this.weaponBarUI = null;
    }
    
    if (this.weaponManager) {
      this.weaponManager.destroy();
      this.weaponManager = null;
    }
    
    // 清理塔系統事件監聽器
    this.events.off('towerPlaced', this.onTowerPlaced, this);
    this.events.off('towerSelected', this.onTowerSelected, this);
    this.events.off('towerCardSelected', this.onTowerCardSelected, this);
    this.events.off('buildingStarted', this.onBuildingStarted, this);
    this.events.off('buildingCancelled', this.onBuildingCancelled, this);
    
    // 移除事件監聽
    this.events.off('tower:selected');
    this.events.off('enemy:died');
    this.events.off('player:damaged');
    this.events.off('wave:start');
    this.events.off('wave:complete');
    this.events.off('enemyKilled');
    
    // ❌ 不要在這裡重置 isGameOver，會導致場景切換時的競態條件
    // isGameOver 會在 init() 中重置
    
    console.log('遊戲場景清理完成');
  }
}

export default GameplayScene;