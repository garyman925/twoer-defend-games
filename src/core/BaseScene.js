/**
 * 基礎場景類
 * 所有遊戲場景都應該繼承這個基類
 */

import { GameConfig } from './GameConfig.js';

export class BaseScene extends Phaser.Scene {
  constructor(sceneKey) {
    super({ key: sceneKey });
    
    this.sceneKey = sceneKey;
    this.isInitialized = false;
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 場景狀態
    this.sceneState = 'inactive';
    this.previousScene = null;
    
    // 通用資源
    this.commonAssets = [];
  }

  /**
   * 場景初始化
   */
  init(data) {
    console.log(`初始化場景: ${this.sceneKey}`);
    
    // 儲存傳入的數據
    this.sceneData = data || {};
    this.previousScene = data?.previousScene || null;
    
    // 設置場景狀態
    this.sceneState = 'initializing';
    
    // 綁定通用事件
    this.bindCommonEvents();
    
    // 初始化音頻管理器引用
    this.initAudioReferences();
    
    this.isInitialized = true;
  }

  /**
   * 預載入資源
   */
  preload() {
    console.log(`載入場景資源: ${this.sceneKey}`);
    
    // 載入通用資源
    this.loadCommonAssets();
    
    // 載入場景特定資源
    this.loadSceneAssets();
    
    // 設置載入進度事件
    this.setupLoadingEvents();
  }

  /**
   * 場景創建
   */
  create() {
    
    this.sceneState = 'creating';
    
    // 設置響應式縮放
    this.setupResponsiveScale();
    
    // 創建場景內容（子場景先初始化）
    this.createSceneContent();
    
    // 設置輸入處理
    this.setupInputHandlers();
    
    // 場景創建完成
    this.sceneState = 'active';
    
    // 發送場景就緒事件
    this.eventEmitter.emit('sceneReady', this.sceneKey);
  }

  /**
   * 場景更新
   */
  update(time, delta) {
    // 只在場景活躍時更新
    if (this.sceneState !== 'active') return;
    
    // 更新場景邏輯
    this.updateSceneLogic(time, delta);
    
    // 更新性能監控
    this.updatePerformanceMonitoring(time, delta);
  }

  /**
   * 場景銷毀
   */
  destroy() {
    console.log(`銷毀場景: ${this.sceneKey}`);
    
    this.sceneState = 'destroying';
    
    // 清理場景特定資源
    this.cleanupScene();
    
    // 移除事件監聽器
    this.removeEventListeners();
    
    // 清理通用資源
    this.cleanupCommonAssets();
    
    super.destroy();
  }

  /**
   * 載入通用資源
   */
  loadCommonAssets() {
    // UI元素
    if (!this.textures.exists('button_normal')) {
      this.load.image('button_normal', 'assets/images/ui/button_normal.png');
    }
    if (!this.textures.exists('button_hover')) {
      this.load.image('button_hover', 'assets/images/ui/button_hover.png');
    }
    
    // 通用音效
    if (!this.cache.audio.exists('button_click')) {
      this.load.audio('button_click', 'assets/audio/sfx/ui/button_click.wav');
    }
    if (!this.cache.audio.exists('button_confirm')) {
      this.load.audio('button_confirm', 'assets/audio/sfx/ui/button_confirm.wav');
    }
  }

  /**
   * 載入場景特定資源（由子類實現）
   */
  loadSceneAssets() {
    // 由子類實現
  }

  /**
   * 設置載入進度事件
   */
  setupLoadingEvents() {
    this.load.on('progress', (value) => {
      this.updateLoadingProgress(value);
    });

    this.load.on('complete', () => {
      this.onLoadingComplete();
    });

    this.load.on('loaderror', (file) => {
      console.error(`載入失敗: ${file.src}`);
    });
  }

  /**
   * 更新載入進度
   */
  updateLoadingProgress(progress) {
    // 更新載入條
    const loadingFill = document.getElementById('loading-fill');
    if (loadingFill) {
      loadingFill.style.width = (progress * 100) + '%';
    }
    
    // 發送進度事件
    this.eventEmitter.emit('loadingProgress', progress);
  }

  /**
   * 載入完成
   */
  onLoadingComplete() {
    // 隱藏載入畫面
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    this.eventEmitter.emit('loadingComplete');
  }

  /**
   * 設置響應式縮放
   */
  setupResponsiveScale() {
    const { width, height } = this.scale.gameSize;
    
    // 設置世界邊界 - 添加空值檢查
    if (this.physics && this.physics.world && this.physics.world.setBounds) {
      this.physics.world.setBounds(0, 0, width, height);
    }
    
    // 相機設置 - 添加空值檢查
    if (this.cameras && this.cameras.main && this.cameras.main.setBounds) {
      this.cameras.main.setBounds(0, 0, width, height);
    }
    
    // 處理縮放變化 - 先移除可能存在的舊監聽器
    this.scale.off('resize', this.handleResize, this);
    this.scale.on('resize', this.handleResize, this);
  }

  /**
   * 處理螢幕大小變化
   */
  handleResize(gameSize) {
    // 確保場景已初始化並且gameSize有效
    if (!gameSize || !this.scene || !this.scene.isActive()) {
      return;
    }
    
    const { width, height } = gameSize;
    
    // 更新世界邊界
    // 添加空值檢查防止錯誤
    if (this.physics && this.physics.world && this.physics.world.setBounds) {
      this.physics.world.setBounds(0, 0, width, height);
    }
    
    if (this.cameras && this.cameras.main && this.cameras.main.setBounds) {
      this.cameras.main.setBounds(0, 0, width, height);
    }
    
    // 重新佈局UI - 添加空值檢查
    if (this.repositionUI && typeof this.repositionUI === 'function') {
      this.repositionUI(width, height);
    }
    
    // 發送縮放事件 - 添加空值檢查
    if (this.eventEmitter && this.eventEmitter.emit) {
      this.eventEmitter.emit('sceneResized', { width, height });
    }
  }

  /**
   * 創建通用UI元素
   */
  createCommonUI() {
    // 創建場景轉換覆蓋層
    this.createTransitionOverlay();
    
    // 創建暫停按鈕（只有遊戲場景且gameHUD已初始化時）
    if (this.sceneKey === 'GameplayScene' && this.gameHUD) {
      this.createPauseButton();
    }
  }

  /**
   * 創建場景內容（由子類實現）
   */
  createSceneContent() {
    // 由子類實現
  }

  /**
   * 設置輸入處理
   */
  setupInputHandlers() {
    // ESC鍵暫停遊戲
    this.input.keyboard.on('keydown-ESC', () => {
      this.handlePauseToggle();
    });
    
    // F11鍵全螢幕切換
    this.input.keyboard.on('keydown-F11', () => {
      this.toggleFullscreen();
    });
  }

  /**
   * 綁定通用事件
   */
  bindCommonEvents() {
    // 綁定遊戲狀態變化事件
    this.game.events.on('blur', this.onGameBlur, this);
    this.game.events.on('focus', this.onGameFocus, this);
    this.game.events.on('hidden', this.onGameHidden, this);
    this.game.events.on('visible', this.onGameVisible, this);
  }

  /**
   * 初始化音頻管理器引用
   */
  initAudioReferences() {
    // 從遊戲註冊表獲取音頻管理器
    this.audioManager = this.registry.get('audioManager');
  }

  /**
   * 場景切換
   */
  switchToScene(sceneKey, data = {}) {
    console.log(`切換到場景: ${sceneKey}`);
    
    // 添加當前場景到數據中
    data.previousScene = this.sceneKey;
    
    // 場景轉換動畫
    this.cameras.main.fadeOut(300, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, data);
    });
  }

  /**
   * 更新場景邏輯（由子類實現）
   */
  updateSceneLogic(time, delta) {
    // 由子類實現
  }

  /**
   * 性能監控更新
   */
  updatePerformanceMonitoring(time, delta) {
    if (GameConfig.DEBUG.SHOW_FPS) {
      // 顯示FPS信息
      const fps = Math.round(this.game.loop.actualFps);
      if (this.fpsText) {
        this.fpsText.setText(`FPS: ${fps}`);
      }
    }
  }

  /**
   * 重新佈局UI（由子類實現）
   */
  repositionUI(width, height) {
    // 由子類實現
  }

  /**
   * 清理場景（由子類實現）
   */
  cleanupScene() {
    // 由子類實現
  }

  /**
   * 移除事件監聽器
   */
  removeEventListeners() {
    this.game.events.off('blur', this.onGameBlur, this);
    this.game.events.off('focus', this.onGameFocus, this);
    this.game.events.off('hidden', this.onGameHidden, this);
    this.game.events.off('visible', this.onGameVisible, this);
    
    this.scale.off('resize', this.handleResize, this);
  }

  /**
   * 清理通用資源
   */
  cleanupCommonAssets() {
    // 清理事件發送器
    this.eventEmitter.removeAllListeners();
  }

  /**
   * 遊戲失去焦點
   */
  onGameBlur() {
    if (this.sceneKey === 'GameplayScene') {
      this.handlePauseToggle();
    }
  }

  /**
   * 遊戲獲得焦點
   */
  onGameFocus() {
    // 可以在這裡處理重新獲得焦點的邏輯
  }

  /**
   * 遊戲隱藏
   */
  onGameHidden() {
    if (this.sceneKey === 'GameplayScene') {
      this.handlePauseToggle();
    }
  }

  /**
   * 遊戲可見
   */
  onGameVisible() {
    // 可以在這裡處理重新可見的邏輯
  }

  /**
   * 處理暫停切換
   */
  handlePauseToggle() {
    if (this.sceneKey === 'GameplayScene') {
      // 切換到暫停場景
      this.scene.launch('PauseScene');
      this.scene.pause();
    }
  }

  /**
   * 切換全螢幕
   */
  toggleFullscreen() {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
    } else {
      this.scale.startFullscreen();
    }
  }

  /**
   * 創建場景轉換覆蓋層
   */
  createTransitionOverlay() {
    const { width, height } = this.scale.gameSize;
    
    this.transitionOverlay = this.add.rectangle(
      width / 2, height / 2, width, height, 0x000000
    );
    this.transitionOverlay.setAlpha(0);
    this.transitionOverlay.setDepth(10000);
  }

  /**
   * 創建暫停按鈕
   */
  createPauseButton() {
    const { width } = this.scale.gameSize;
    
    this.pauseButton = this.add.text(width - 60, 30, '⏸', {
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    
    this.pauseButton.setInteractive();
    this.pauseButton.on('pointerdown', () => {
      this.handlePauseToggle();
    });
    
    this.pauseButton.setDepth(9999);
  }

  /**
   * 播放音效
   */
  playSound(soundKey, config = {}) {
    if (this.audioManager && this.audioManager.sfxManager) {
      this.audioManager.sfxManager.playSound(soundKey, config);
    }
  }

  /**
   * 播放音樂
   */
  playMusic(musicKey) {
    if (this.audioManager && this.audioManager.musicManager) {
      this.audioManager.musicManager.playMusic(musicKey);
    }
  }
}

export default BaseScene;
