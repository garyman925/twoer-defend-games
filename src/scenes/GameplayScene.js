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
    
    // 遊戲狀態
    this.gameState = 'preparation'; // preparation, playing, paused
    this.currentWave = 0;
    this.preparationTimer = null;
    this.isPaused = false;
    
    // 遊戲計時（使用累計方式）
    this.elapsedTime = 0;
    
    // 當前波次預期敵人總數
    this.currentWaveExpectedEnemies = 0;
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
    
    // 設置碰撞檢測
    this.setupCollisions();
    
    // 設置金錢更新監聽
    this.setupMoneyUpdateListener();
    
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

    // 將金錢顯示移到塔列左側
    if (this.gameplayUI && typeof this.gameplayUI.mountMoneyToTowerBar === 'function') {
      this.gameplayUI.mountMoneyToTowerBar();
    }

    // 初始化卡片可用性（以當前金錢）
    const initMoney = this.gameManager ? this.gameManager.playerData.money : 500;
    if (this.towerCardUI && typeof this.towerCardUI.updateCardAvailability === 'function') {
      this.towerCardUI.updateCardAvailability(initMoney);
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
  }

  /**
   * 塔卡片選擇事件處理
   */
  onTowerCardSelected(data) {
    const { type, name, cost } = data;
    console.log(`🎯 選擇了塔卡片: ${name} (${type}) - 價格: $${cost}`);
    
    // 檢查玩家是否有足夠的金錢
    if (this.gameManager && this.gameManager.playerData.money >= cost) {
      console.log(`✅ 金錢檢查通過`);
      
      // 開始塔放置模式
      if (this.towerPlacementSystem) {
        this.towerPlacementSystem.startTowerPlacement(type);
      }
    } else {
      console.warn(`❌ 無法購買 ${name}: 金錢不足`);
      
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
      
      // 延遲2秒後直接開始準備階段（不經過 endWave）
      this.time.delayedCall(2000, () => {
        this.startPreparationPhase();
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
    
    console.log('✅ 碰撞檢測設置完成（包含敵人碰撞玩家）');
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
   * 敵人碰撞玩家
   */
  onEnemyHitPlayer(obj1, obj2) {
    // ✅ 正確識別敵人和玩家（Phaser 碰撞回調的參數順序可能不固定）
    const actualPlayer = this.player;
    let enemy = null;
    
    // 判斷哪個是敵人
    if (obj1.constructor.name === 'Player' || obj1 === actualPlayer) {
      enemy = obj2;  // obj1 是玩家，obj2 是敵人
    } else {
      enemy = obj1;  // obj1 是敵人，obj2 是玩家
    }
    
    // ✅ 添加詳細調試日誌
    console.log('🔍 碰撞檢測觸發！');
    console.log('   obj1.constructor.name:', obj1.constructor ? obj1.constructor.name : 'undefined');
    console.log('   obj2.constructor.name:', obj2.constructor ? obj2.constructor.name : 'undefined');
    console.log('   enemy.constructor.name:', enemy.constructor ? enemy.constructor.name : 'undefined');
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
    
    // 1. 敵人立即死亡（爆炸） - 總是執行，無論玩家是否無敵
    console.log('   → 準備調用 enemy.die()...');
    console.log('   → enemy.isAlive:', enemy.isAlive);
    
    try {
      console.log('   → 執行 enemy.die()...');
      enemy.die();
      console.log('   ✓ enemy.die() 執行完成，無錯誤');
    } catch (error) {
      console.error('   ❌ enemy.die() 執行失敗:', error);
      console.error('   錯誤堆疊:', error.stack);
    }
    
    console.log('   ✓ 敵人死亡處理完成');
    
    // 2. 玩家扣血 - 只在非無敵時執行
    if (!actualPlayer.isImmune) {
      console.log('   → 玩家不是無敵，開始扣血（10點）');
      console.log('   → 扣血前血量:', actualPlayer.health);
      actualPlayer.takeDamage(10);
      console.log('   ✓ 扣血後血量:', actualPlayer.health);
      console.log('   ✓ 玩家進入無敵狀態');
    } else {
      console.log('   ⚠️ 玩家無敵中，不扣血（但敵人已爆炸）');
    }
    
    console.log('   ✅ 碰撞處理完成');
  }

  /**
   * 設置金錢更新監聽器
   */
  setupMoneyUpdateListener() {
    // 監聽金錢變化事件
    this.events.on('moneyChanged', (data) => {
      // 同步 DOM UI
      this.events.emit('money:update', { money: data.total });
      
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
    
    // 通過 GameManager 處理敵人擊殺（會計算金錢和分數）
    if (this.gameManager && typeof this.gameManager.enemyKilled === 'function') {
      this.gameManager.enemyKilled(enemy);
    } else {
      // 備用方案：直接更新金錢
      if (reward) {
        this.gameManager.addMoney(reward);
      }
    }
    
    // 更新 UI
    this.events.emit('money:update', {
      money: this.gameManager.playerData.money
    });
    
    // 更新分數並發送事件（GameManager.enemyKilled 已經計算了分數）
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
    this.gameState = 'preparation';
    this.currentWave++;
    
    console.log(`🕐 開始準備階段 - 第 ${this.currentWave} 波`);
    console.log(`   gameState: ${this.gameState}`);
    
    // 準備計時器會顯示波次，不需要額外訊息
    
    // 開始準備計時器
    const preparationTime = GameConfig.WAVE ? GameConfig.WAVE.PREPARATION_TIME : 10000;
    let timeLeft = preparationTime / 1000;
    
    console.log(`   準備時間: ${timeLeft}秒`);
    
    // 立即顯示準備倒數（帶波次名稱）
    if (this.gameplayUI) {
      this.gameplayUI.updatePreparationTimer(timeLeft, `第${this.currentWave}波`);
    }
    
    this.preparationTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        timeLeft--;
        console.log(`   ⏱️ 準備倒數: ${timeLeft}秒`);
        
        // 使用準備計時器專用方法顯示倒數（帶波次名稱）
        if (this.gameplayUI) {
          this.gameplayUI.updatePreparationTimer(timeLeft, `第${this.currentWave}波`);
        }
        
        if (timeLeft <= 0) {
          console.log(`   ✅ 準備結束，開始波次`);
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
    if (this.enemySpawner) {
      this.enemySpawner.startWave(this.currentWave);
    }
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
    console.log('⏰ 時間到！遊戲結束');
    
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
    console.log('玩家死亡，遊戲結束');
    
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
   * 返回主選單
   */
  returnToMainMenu() {
    this.switchToScene('MainMenuScene');
  }

  /**
   * 場景更新
   */
  updateSceneLogic(time, delta) {
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
    
    // 更新敵人生成器
    if (this.enemySpawner) {
      this.enemySpawner.update(time, delta);
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
    this.events.off('moneyChanged');
    this.events.off('enemyKilled');
    
    console.log('遊戲場景清理完成');
  }
}

export default GameplayScene;