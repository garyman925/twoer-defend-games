/**
 * 資源載入管理器
 * 負責預載入和管理所有遊戲資源
 */

import { GameConfig } from './GameConfig.js';

export class AssetLoader {
  constructor(scene) {
    this.scene = scene;
    this.loadedAssets = new Set();
    this.loadingQueue = [];
    this.totalAssets = 0;
    this.loadedCount = 0;
    
    // 資源分類
    this.assetCategories = {
      images: [],
      audio: [],
      fonts: [],
      data: []
    };
  }

  /**
   * 初始化資源載入器
   */
  init() {
    this.setupAssetLists();
    this.calculateTotalAssets();
  }

  /**
   * 設置資源列表
   */
  setupAssetLists() {
    // 圖片資源
    this.assetCategories.images = [
      // UI資源
      { key: 'button_normal', path: 'assets/images/ui/button_normal.png' },
      { key: 'button_hover', path: 'assets/images/ui/button_hover.png' },
      { key: 'button_pressed', path: 'assets/images/ui/button_pressed.png' },
      { key: 'progress_bg', path: 'assets/images/ui/progress_bg.png' },
      { key: 'progress_fill', path: 'assets/images/ui/progress_fill.png' },
      { key: 'panel_bg', path: 'assets/images/ui/panel_bg.png' },
      { key: 'coin_icon', path: 'assets/images/ui/coin_icon.png' },
      { key: 'health_icon', path: 'assets/images/ui/health_icon.png' },
      { key: 'wave_icon', path: 'assets/images/ui/wave_icon.png' },
      
      // 玩家資源
      { key: 'player_idle', path: 'assets/sprites/ships/blue/player_idle.webp' },
      { key: 'player_idle_json', path: 'assets/sprites/ships/blue/player_idle.json' },
      { key: 'player_weapon', path: 'assets/images/entities/player_weapon.png' },
      { key: 'player_skin_default', path: 'assets/images/skins/player_default.png' },
      
      // 敵人資源
      { key: 'enemy_basic', path: 'assets/images/entities/enemy_basic.png' },
      { key: 'enemy_fast', path: 'assets/images/entities/enemy_fast.png' },
      { key: 'enemy_tank', path: 'assets/images/entities/enemy_tank.png' },
      { key: 'enemy_boss', path: 'assets/images/entities/enemy_boss.png' },
      
      // 塔資源
      { key: 'tower_basic', path: 'assets/images/entities/tower_basic.png' },
      { key: 'tower_laser', path: 'assets/images/entities/tower_laser.png' },
      { key: 'tower_cannon', path: 'assets/images/entities/tower_cannon.png' },
      { key: 'tower_ice', path: 'assets/images/entities/tower_ice.png' },
      { key: 'tower_base', path: 'assets/images/entities/tower_base.png' },
      
      // 投射物資源
      { key: 'bullet_basic', path: 'assets/images/entities/bullet_basic.png' },
      { key: 'bullet_laser', path: 'assets/images/entities/bullet_laser.png' },
      { key: 'bullet_cannon', path: 'assets/images/entities/bullet_cannon.png' },
      { key: 'bullet_ice', path: 'assets/images/entities/bullet_ice.png' },
      
      // 特效資源
      { key: 'explosion', path: 'assets/images/effects/explosion.png' },
      { key: 'muzzle_flash', path: 'assets/images/effects/muzzle_flash.png' },
      { key: 'impact_effect', path: 'assets/images/effects/impact_effect.png' },
      { key: 'particle_spark', path: 'assets/images/effects/particle_spark.png' },
      { key: 'particle_smoke', path: 'assets/images/effects/particle_smoke.png' },
      
      // 背景資源
      { key: 'game_bg', path: 'assets/images/backgrounds/game_bg.png' },
      { key: 'menu_bg', path: 'assets/images/backgrounds/menu_bg.png' },
      { key: 'grid_overlay', path: 'assets/images/backgrounds/grid_overlay.png' }
    ];

    // 音頻資源
    this.assetCategories.audio = [
      // 背景音樂
      { key: 'menu_theme', path: 'assets/audio/music/menu_theme.mp3' },
      { key: 'battle_theme', path: 'assets/audio/music/battle_theme.mp3' },
      { key: 'victory_theme', path: 'assets/audio/music/victory_theme.mp3' },
      { key: 'defeat_theme', path: 'assets/audio/music/defeat_theme.mp3' },
      { key: 'shop_theme', path: 'assets/audio/music/shop_theme.mp3' },
      
      // 武器音效
      { key: 'laser_shot', path: 'assets/audio/sfx/weapons/laser_shot.wav' },
      { key: 'cannon_fire', path: 'assets/audio/sfx/weapons/cannon_fire.wav' },
      { key: 'machine_gun', path: 'assets/audio/sfx/weapons/machine_gun.wav' },
      { key: 'ice_shot', path: 'assets/audio/sfx/weapons/ice_shot.wav' },
      
      // 敵人音效
      { key: 'enemy_death', path: 'assets/audio/sfx/enemies/enemy_death.wav' },
      { key: 'enemy_spawn', path: 'assets/audio/sfx/enemies/enemy_spawn.wav' },
      { key: 'enemy_hit', path: 'assets/audio/sfx/enemies/enemy_hit.wav' },
      { key: 'boss_roar', path: 'assets/audio/sfx/enemies/boss_roar.wav' },
      
      // 塔音效
      { key: 'tower_build', path: 'assets/audio/sfx/towers/tower_build.wav' },
      { key: 'tower_upgrade', path: 'assets/audio/sfx/towers/tower_upgrade.wav' },
      { key: 'tower_sell', path: 'assets/audio/sfx/towers/tower_sell.wav' },
      
      // UI音效
      { key: 'button_click', path: 'assets/audio/sfx/ui/button_click.wav' },
      { key: 'button_confirm', path: 'assets/audio/sfx/ui/button_confirm.wav' },
      { key: 'button_cancel', path: 'assets/audio/sfx/ui/button_cancel.wav' },
      { key: 'purchase_success', path: 'assets/audio/sfx/ui/purchase_success.wav' },
      { key: 'error_sound', path: 'assets/audio/sfx/ui/error_sound.wav' },
      
      // 環境音效
      { key: 'wave_start', path: 'assets/audio/sfx/environment/wave_start.wav' },
      { key: 'wave_complete', path: 'assets/audio/sfx/environment/wave_complete.wav' },
      { key: 'coin_collect', path: 'assets/audio/sfx/environment/coin_collect.wav' },
      { key: 'low_health', path: 'assets/audio/sfx/environment/low_health.wav' },
      
      // 語音
      { key: 'tutorial_voice', path: 'assets/audio/voice/tutorial_voice.mp3' },
      { key: 'wave_warning', path: 'assets/audio/voice/wave_warning.mp3' },
      { key: 'achievement', path: 'assets/audio/voice/achievement.mp3' },
      
      // 環境音
      { key: 'wind_ambient', path: 'assets/audio/ambient/wind_ambient.mp3' },
      { key: 'battle_ambient', path: 'assets/audio/ambient/battle_ambient.mp3' },
      { key: 'fortress_ambient', path: 'assets/audio/ambient/fortress_ambient.mp3' }
    ];

    // 配置數據
    this.assetCategories.data = [
      { key: 'gameConfig', path: 'assets/data/gameConfig.json' },
      { key: 'upgradeData', path: 'assets/data/upgradeData.json' },
      { key: 'enemyData', path: 'assets/data/enemyData.json' },
      { key: 'towerData', path: 'assets/data/towerData.json' },
      { key: 'skinData', path: 'assets/data/skinData.json' },
      { key: 'audioConfig', path: 'assets/data/audioConfig.json' }
    ];
  }

  /**
   * 計算總資源數量
   */
  calculateTotalAssets() {
    this.totalAssets = 
      this.assetCategories.images.length +
      this.assetCategories.audio.length +
      this.assetCategories.data.length;
  }

  /**
   * 載入所有資源
   */
  loadAllAssets() {
    
    // 暫時只載入基礎必要資源，避免載入不存在的檔案
    this.loadEssentialAssets();
    
    // 設置載入事件
    this.setupLoadEvents();
  }

  /**
   * 載入基礎必要資源
   */
  loadEssentialAssets() {
    // 只載入JSON配置檔案
    this.loadData();
    
    // 載入關鍵圖片資源
    this.loadCriticalImages();
    
    // 創建基礎佔位圖片
    this.createPlaceholderAssets();
  }

  /**
   * 載入關鍵圖片資源
   */
  loadCriticalImages() {
    // 載入玩家待機動畫資源
    this.scene.load.atlas('player_idle', 'assets/sprites/ships/blue/player_idle.webp', 'assets/sprites/ships/blue/player_idle.json');
    
    // 載入其他關鍵資源
    this.scene.load.image('enemy_basic', 'assets/sprites/enemies/enemy-sprite.webp');
    this.scene.load.image('tower_basic', 'assets/sprites/towers/tower-sprite.png');
    this.scene.load.image('bullet_basic', 'assets/sprites/bullets/bullets.webp');
  }

  /**
   * 創建基礎佔位資源
   */
  createPlaceholderAssets() {
    // 為常用UI元素創建簡單的佔位圖片
    const canvas = this.scene.add.graphics();
    
    // 創建按鈕佔位圖
    canvas.fillStyle(0x666666);
    canvas.fillRect(0, 0, 200, 50);
    canvas.generateTexture('button_normal', 200, 50);
    
    canvas.clear();
    canvas.fillStyle(0x888888);
    canvas.fillRect(0, 0, 200, 50);
    canvas.generateTexture('button_hover', 200, 50);
    
    canvas.clear();
    canvas.fillStyle(0x444444);
    canvas.fillRect(0, 0, 200, 50);
    canvas.generateTexture('button_pressed', 200, 50);
    
    canvas.destroy();
  }

  /**
   * 載入圖片資源
   */
  loadImages() {
    this.assetCategories.images.forEach(asset => {
      if (!this.loadedAssets.has(asset.key)) {
        this.scene.load.image(asset.key, asset.path);
        this.loadingQueue.push(asset.key);
      }
    });
  }

  /**
   * 載入音頻資源
   */
  loadAudio() {
    this.assetCategories.audio.forEach(asset => {
      if (!this.loadedAssets.has(asset.key)) {
        // 根據檔案類型選擇載入方式
        const extension = asset.path.split('.').pop().toLowerCase();
        
        if (['mp3', 'wav', 'ogg'].includes(extension)) {
          this.scene.load.audio(asset.key, asset.path);
          this.loadingQueue.push(asset.key);
        }
      }
    });
  }

  /**
   * 載入數據資源
   */
  loadData() {
    this.assetCategories.data.forEach(asset => {
      if (!this.loadedAssets.has(asset.key)) {
        this.scene.load.json(asset.key, asset.path);
        this.loadingQueue.push(asset.key);
      }
    });
  }

  /**
   * 設置載入事件
   */
  setupLoadEvents() {
    // 載入進度
    this.scene.load.on('progress', (progress) => {
      this.onLoadProgress(progress);
    });

    // 單個檔案載入完成
    this.scene.load.on('filecomplete', (key, type, data) => {
      this.onFileComplete(key, type, data);
    });

    // 載入錯誤
    this.scene.load.on('loaderror', (file) => {
      this.onLoadError(file);
    });

    // 載入完成
    this.scene.load.on('complete', () => {
      this.onLoadComplete();
    });
  }

  /**
   * 載入進度回調
   */
  onLoadProgress(progress) {
    const percentage = Math.round(progress * 100);
    
    // 更新載入條
    this.updateLoadingBar(progress);
    
    // 發送進度事件
    this.scene.events.emit('loadProgress', progress);
  }

  /**
   * 單個檔案載入完成
   */
  onFileComplete(key, type, data) {
    this.loadedAssets.add(key);
    this.loadedCount++;
    
    
    // 標記資源為可用
    this.markAssetAsReady(key, type);
  }

  /**
   * 載入錯誤處理
   */
  onLoadError(file) {
    console.error(`載入失敗: ${file.key} - ${file.src}`);
    
    // 嘗試載入預設資源
    this.loadFallbackAsset(file.key, file.type);
  }

  /**
   * 載入完成
   */
  onLoadComplete() {
    
    // 隱藏載入畫面
    this.hideLoadingScreen();
    
    // 初始化資源後處理
    this.postProcessAssets();
    
    // 發送載入完成事件
    this.scene.events.emit('allAssetsLoaded');
  }

  /**
   * 更新載入條
   */
  updateLoadingBar(progress) {
    const loadingFill = document.getElementById('loading-fill');
    if (loadingFill) {
      loadingFill.style.width = (progress * 100) + '%';
    }
  }

  /**
   * 標記資源為就緒
   */
  markAssetAsReady(key, type) {
    // 根據資源類型進行特殊處理
    switch (type) {
      case 'image':
        this.processImage(key);
        break;
      case 'audio':
        this.processAudio(key);
        break;
      case 'json':
        this.processData(key);
        break;
    }
  }

  /**
   * 處理圖片資源
   */
  processImage(key) {
    // 檢查圖片是否為精靈表
    if (key.includes('_spritesheet')) {
      this.createSpritesheet(key);
    }
  }

  /**
   * 處理音頻資源
   */
  processAudio(key) {
    // 設置音頻預設配置
    const audio = this.scene.sound.add(key);
    if (audio) {
      // 根據音頻類型設置預設音量
      if (key.includes('music')) {
        audio.setVolume(GameConfig.AUDIO.MUSIC_VOLUME);
      } else if (key.includes('sfx')) {
        audio.setVolume(GameConfig.AUDIO.SFX_VOLUME);
      } else if (key.includes('voice')) {
        audio.setVolume(GameConfig.AUDIO.VOICE_VOLUME);
      }
    }
  }

  /**
   * 處理數據資源
   */
  processData(key) {
    const data = this.scene.cache.json.get(key);
    if (data) {
      // 將數據註冊到遊戲註冊表
      this.scene.registry.set(key, data);
    }
  }

  /**
   * 載入預設資源
   */
  loadFallbackAsset(key, type) {
    // 為載入失敗的資源提供預設替代
    switch (type) {
      case 'image':
        this.createPlaceholderImage(key);
        break;
      case 'audio':
        console.warn(`音頻載入失敗，跳過: ${key}`);
        break;
      case 'json':
        this.createPlaceholderData(key);
        break;
    }
  }

  /**
   * 創建佔位圖片
   */
  createPlaceholderImage(key) {
    // 創建簡單的佔位圖片
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // 繪製簡單的佔位圖案
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MISSING', 10, 35);
    
    // 將佔位圖片添加到紋理緩存
    this.scene.textures.addCanvas(key, canvas);
  }

  /**
   * 創建佔位數據
   */
  createPlaceholderData(key) {
    // 創建空的數據對象
    const placeholderData = {};
    this.scene.registry.set(key, placeholderData);
  }

  /**
   * 隱藏載入畫面
   */
  hideLoadingScreen() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      // 淡出動畫
      loadingElement.style.transition = 'opacity 0.5s ease-out';
      loadingElement.style.opacity = '0';
      
      setTimeout(() => {
        loadingElement.style.display = 'none';
      }, 500);
    }
  }

  /**
   * 資源後處理
   */
  postProcessAssets() {
    // 創建動畫
    this.createAnimations();
    
    // 設置音頻配置
    this.setupAudioConfiguration();
    
    // 驗證關鍵資源
    this.validateCriticalAssets();
    
    // 發送資源載入完成事件
    this.scene.events.emit('allAssetsLoaded');
  }

  /**
   * 創建動畫
   */
  createAnimations() {
    // 爆炸動畫
    if (this.scene.textures.exists('explosion')) {
      this.scene.anims.create({
        key: 'explosion_anim',
        frames: this.scene.anims.generateFrameNumbers('explosion'),
        frameRate: 20,
        repeat: 0
      });
    }
    
    // 玩家待機動畫
    if (this.scene.textures.exists('player_idle')) {
      this.scene.anims.create({
        key: 'player_idle_anim',
        frames: this.scene.anims.generateFrameNames('player_idle', {
          prefix: 'player_idle1_1_',
          suffix: '.png',
          start: 0,
          end: 9
        }),
        frameRate: 8,
        repeat: -1
      });
    }
    
    // 敵人行走動畫
    Object.keys(GameConfig.ENEMY.TYPES).forEach(enemyType => {
      const key = `enemy_${enemyType.toLowerCase()}`;
      if (this.scene.textures.exists(key)) {
        this.scene.anims.create({
          key: `${key}_walk`,
          frames: this.scene.anims.generateFrameNumbers(key),
          frameRate: 8,
          repeat: -1
        });
      }
    });
  }

  /**
   * 設置音頻配置
   */
  setupAudioConfiguration() {
    // 從註冊表獲取音頻配置
    const audioConfig = this.scene.registry.get('audioConfig');
    if (audioConfig) {
      // 應用音頻配置
      Object.assign(GameConfig.AUDIO, audioConfig);
    }
  }

  /**
   * 驗證關鍵資源
   */
  validateCriticalAssets() {
    const criticalAssets = [
      'player_idle',
      'enemy_basic',
      'tower_basic',
      'bullet_basic',
      'button_normal'
    ];
    
    const missingAssets = criticalAssets.filter(asset => 
      !this.scene.textures.exists(asset)
    );
    
    if (missingAssets.length > 0) {
      console.error('缺少關鍵資源:', missingAssets);
      // 可以在這裡顯示錯誤訊息或載入預設資源
    }
  }

  /**
   * 檢查資源是否已載入
   */
  isAssetLoaded(key) {
    return this.loadedAssets.has(key);
  }

  /**
   * 獲取載入進度
   */
  getLoadProgress() {
    return this.totalAssets > 0 ? this.loadedCount / this.totalAssets : 0;
  }

  /**
   * 清理資源載入器
   */
  destroy() {
    this.loadedAssets.clear();
    this.loadingQueue = [];
    this.assetCategories = null;
  }
}

export default AssetLoader;
