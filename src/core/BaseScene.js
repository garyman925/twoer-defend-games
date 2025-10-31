/**
 * 基礎場景類
 * 所有場景的基類，提供共通功能
 */

import GameConfig from './GameConfig.js';

export class BaseScene extends Phaser.Scene {
  constructor(sceneKey) {
    super(sceneKey);
    this.sceneKey = sceneKey;
    this.eventEmitter = null;
  }

  /**
   * 場景初始化
   */
  init(data) {
    console.log(`初始化場景: ${this.sceneKey}`);
    this.eventEmitter = new Phaser.Events.EventEmitter();
  }

  /**
   * 場景創建
   */
  create() {
    console.log(`創建場景: ${this.sceneKey}`);
    
    // 初始化相機系統
    this.initializeCamera();
    
    // 設置事件監聽器
    this.setupEventListeners();
  }

  /**
   * 初始化相機系統
   */
  initializeCamera() {
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setBackgroundColor();
  }

  /**
   * 設置事件監聽器
   */
  setupEventListeners() {
    // 監聽視窗大小改變
    this.scale.on('resize', this.onResize, this);
  }

  /**
   * 視窗大小改變處理
   */
  onResize(gameSize) {
    let width;
    let height;
    // 兼容兩種呼叫方式：onResize({ width, height }) 與 onResize(width, height)
    if (typeof gameSize === 'number') {
      width = gameSize;
      height = arguments[1];
    } else if (gameSize && typeof gameSize.width === 'number' && typeof gameSize.height === 'number') {
      width = gameSize.width;
      height = gameSize.height;
    } else {
      // 從 scale 讀取當前尺寸作為保底
      width = this.scale?.width ?? this.game?.scale?.width ?? 1024;
      height = this.scale?.height ?? this.game?.scale?.height ?? 768;
    }
    
    // 確保相機已初始化
    if (!this.cameras || !this.cameras.main) {
      return;
    }
    
    // 更新相機視口
    this.cameras.main.setViewport(0, 0, width, height);
    
    // 更新UI佈局
    if (typeof this.repositionUI === 'function') {
      this.repositionUI(width, height);
    }
  }

  /**
   * 播放音效 (已禁用)
   */
  playSound(key, config = {}) {
    // 暫時禁用所有音效
    return;
  }

  /**
   * 切換到其他場景
   */
  switchToScene(sceneKey, data = {}) {
    console.log(`切換到場景: ${sceneKey}`);
    
    // 添加當前場景到數據中
    data.previousScene = this.sceneKey;
    
    // 先清理當前場景
    this.cleanupScene();
    
    // 確保相機系統存在並正常
    if (this.cameras && this.cameras.main) {
      // 場景轉換動畫
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(sceneKey, data);
      });
    } else {
      // 如果相機系統不可用，直接切換
      console.warn('相機系統不可用，直接切換場景');
      this.scene.start(sceneKey, data);
    }
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
   * 場景更新
   */
  update(time, delta) {
    // 更新場景邏輯
    this.updateSceneLogic(time, delta);
    
    // 更新性能監控
    this.updatePerformanceMonitoring(time, delta);
  }
}

export default BaseScene;