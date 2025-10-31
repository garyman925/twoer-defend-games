/**
 * 主遊戲類
 * 遊戲的入口點，負責初始化Phaser引擎和遊戲配置
 */

import Phaser from 'phaser';
import GameConfig from './GameConfig.js';

// 導入場景
import LoadingScene from '../scenes/LoadingScene.js';
import MainMenuScene from '../scenes/MainMenuScene.js';
import GameplayScene from '../scenes/GameplayScene.js';
import PauseScene from '../scenes/PauseScene.js';
import GameOverScene from '../scenes/GameOverScene.js';
import ShopScene from '../scenes/ShopScene.js';

// 導入管理器
import { AudioManager } from '../effects/audio/AudioManager.js';
import { GameManager } from '../managers/GameManager.js';
import { StateManager } from '../managers/StateManager.js';
import { PerformanceManager } from '../managers/PerformanceManager.js';

class TowerDefenseGame {
  constructor() {
    this.game = null;
    this.isInitialized = false;
    this.gameManagers = {};
    
    console.log('初始化塔防遊戲...');
    this.init();
  }

  /**
   * 初始化遊戲
   */
  init() {
    // 創建Phaser遊戲配置
    const phaserConfig = this.createPhaserConfig();
    
    // 創建Phaser遊戲實例
    this.game = new Phaser.Game(phaserConfig);
    
    // 設置遊戲事件監聽器
    this.setupGameEvents();
    
    // 初始化管理器
    this.initializeManagers();
    
    this.isInitialized = true;
    console.log('遊戲初始化完成');
  }

  /**
   * 創建Phaser配置
   */
  createPhaserConfig() {
    // 響應式設計配置
    const responsiveConfig = GameConfig.RESPONSIVE;
    
    // 根據 SCALE_MODE 選擇對應的 Phaser 縮放模式
    let phaserScaleMode;
    switch (responsiveConfig.SCALE_MODE) {
      case 'FIT':
        phaserScaleMode = Phaser.Scale.FIT;
        break;
      case 'RESIZE':
        phaserScaleMode = Phaser.Scale.RESIZE;
        break;
      case 'WIDTH_CONTROLS_HEIGHT':
        phaserScaleMode = Phaser.Scale.WIDTH_CONTROLS_HEIGHT;
        break;
      case 'HEIGHT_CONTROLS_WIDTH':
        phaserScaleMode = Phaser.Scale.HEIGHT_CONTROLS_WIDTH;
        break;
      default:
        phaserScaleMode = Phaser.Scale.FIT;
    }
    
    return {
      type: Phaser.AUTO,
      width: GameConfig.GAME_WIDTH || 1024,
      height: GameConfig.GAME_HEIGHT || 768,
      parent: 'game-container',
      backgroundColor: 'transparent',
      
      // 響應式縮放配置
      scale: {
        mode: responsiveConfig.ENABLED ? phaserScaleMode : Phaser.Scale.NONE,
        parent: 'game-container',
        autoCenter: responsiveConfig.AUTO_CENTER ? 
          Phaser.Scale.CENTER_BOTH : 
          Phaser.Scale.NO_CENTER,
        min: {
          width: responsiveConfig.MIN_WIDTH || 1024,
          height: responsiveConfig.MIN_HEIGHT || 768
        },
        max: {
          width: responsiveConfig.MAX_WIDTH || 1920,
          height: responsiveConfig.MAX_HEIGHT || 1080
        },
        // 響應式事件
        resizeInterval: 100, // 窗口大小改變時的響應間隔（毫秒）
        fullscreenTarget: 'game-container'
      },

      // 物理引擎配置
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: GameConfig.DEBUG || false
        }
      },

      // 渲染配置
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
      },

      // 音頻配置
      audio: {
        disableWebAudio: false,
        context: false,
        noAudio: false
      },

      // 輸入配置
      input: {
        activePointers: 3, // 支援多點觸控
        smoothFactor: 0.2
      },

      // 場景配置
      scene: [
        LoadingScene,
        MainMenuScene,
        GameplayScene,
        PauseScene,
        GameOverScene,
        ShopScene
      ],

      // 插件配置
      plugins: {
        global: []
      },

      // FPS配置
      fps: {
        target: 60,
        forceSetTimeOut: true
      },

      // 橫幅配置
      banner: {
        hidePhaser: !GameConfig.DEBUG,
        text: '#ffffff',
        background: [
          '#16213e',
          '#1a1a2e', 
          '#0c0c0c'
        ]
      }
    };
  }

  /**
   * 設置遊戲事件監聽器
   */
  setupGameEvents() {
    // 遊戲就緒事件
    this.game.events.once('ready', () => {
      console.log('Phaser引擎就緒');
      this.onGameReady();
    });

    // 響應式事件處理已整合到其他方法中

    // 遊戲焦點事件
    this.game.events.on('focus', () => {
      this.onGameFocus();
    });

    this.game.events.on('blur', () => {
      this.onGameBlur();
    });

    // 螢幕可見性事件
    this.game.events.on('visible', () => {
      this.onGameVisible();
    });

    this.game.events.on('hidden', () => {
      this.onGameHidden();
    });

    // 錯誤處理
    window.addEventListener('error', (error) => {
      this.handleGameError(error);
    });

    // 螢幕方向變化
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });

    // 視窗大小變化
    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });
  }

  /**
   * 初始化管理器
   */
  initializeManagers() {
    // 狀態管理器
    this.gameManagers.stateManager = new StateManager(this.game);
    this.game.registry.set('stateManager', this.gameManagers.stateManager);

    // 遊戲管理器
    this.gameManagers.gameManager = new GameManager(this.game);
    this.game.registry.set('gameManager', this.gameManagers.gameManager);

    // 性能管理器
    this.gameManagers.performanceManager = new PerformanceManager(this.game);
    this.game.registry.set('performanceManager', this.gameManagers.performanceManager);

    console.log('管理器初始化完成');
  }

  /**
   * 遊戲就緒回調
   */
  onGameReady() {
    // 設置初始遊戲狀態
    // this.gameManagers.stateManager.setState('LOADING');
    
    // 開始載入序列
    this.startLoadingSequence();
    
    // 初始化音頻管理器（在第一個場景中）
    const loadingScene = this.game.scene.getScene('LoadingScene');
    if (loadingScene) {
      this.gameManagers.audioManager = new AudioManager(loadingScene);
      this.game.registry.set('audioManager', this.gameManagers.audioManager);
    }
  }

  /**
   * 開始載入序列
   */
  startLoadingSequence() {
    console.log('開始資源載入序列');
    
    // 啟動載入場景
    this.game.scene.start('LoadingScene');
  }

  /**
   * 遊戲獲得焦點
   */
  onGameFocus() {
    console.log('遊戲獲得焦點');
    
    // 恢復遊戲
    if (this.gameManagers.stateManager) {
      this.gameManagers.stateManager.resumeGame();
    }
    
    // 恢復音頻
    if (this.gameManagers.audioManager) {
      this.gameManagers.audioManager.resumeAudio();
    }
  }

  /**
   * 遊戲失去焦點
   */
  onGameBlur() {
    console.log('遊戲失去焦點');
    
    // 暫停遊戲
    if (this.gameManagers.stateManager) {
      this.gameManagers.stateManager.pauseGame();
    }
    
    // 暫停音頻
    if (this.gameManagers && this.gameManagers.audioManager && this.gameManagers.audioManager.pauseAudio) {
      this.gameManagers.audioManager.pauseAudio();
    }
  }

  /**
   * 遊戲變為可見
   */
  onGameVisible() {
    console.log('遊戲變為可見');
    this.onGameFocus();
  }

  /**
   * 遊戲變為隱藏
   */
  onGameHidden() {
    console.log('遊戲變為隱藏');
    this.onGameBlur();
  }

  /**
   * 處理遊戲錯誤
   */
  handleGameError(error) {
    console.error('遊戲錯誤:', error);
    
    // 記錄錯誤
    this.logError(error);
    
    // 嘗試恢復
    this.attemptRecovery(error);
  }

  /**
   * 處理螢幕方向變化
   */
  handleOrientationChange() {
    console.log('螢幕方向變化');
    
    // 延遲處理，等待方向變化完成
    setTimeout(() => {
      this.handleWindowResize();
    }, 500);
  }

  /**
   * 處理視窗大小變化
   */
  handleWindowResize() {
    if (!GameConfig.RESPONSIVE.ENABLED) return;
    
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    console.log(`🔄 視窗大小變化: ${newWidth}x${newHeight}`);
    
    // 更新遊戲縮放
    if (this.game && this.game.scale) {
      this.game.scale.refresh();
    }
    
    // 通知場景進行響應式更新
    this.game.events.emit('windowResize', { width: newWidth, height: newHeight });
    
    // 觸發當前場景的響應式更新
    const currentScene = this.game.scene.getScenes(true)[0];
    if (currentScene && typeof currentScene.onResize === 'function') {
      // 統一傳入物件參數，避免型別不一致
      const w = this.game.scale?.width ?? newWidth;
      const h = this.game.scale?.height ?? newHeight;
      currentScene.onResize({ width: w, height: h });
    }
  }

  /**
   * 記錄錯誤
   */
  logError(error) {
    // 可以發送錯誤到伺服器或本地存儲
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      gameState: this.gameManagers.stateManager?.getCurrentState()
    };
    
    console.error('錯誤日誌:', errorLog);
  }

  /**
   * 嘗試恢復
   */
  attemptRecovery(error) {
    // 簡單的恢復策略
    try {
      // 重新啟動當前場景
      const currentScene = this.game.scene.getScenes(true)[0];
      if (currentScene) {
        currentScene.scene.restart();
      }
    } catch (recoveryError) {
      console.error('恢復失敗:', recoveryError);
      // 顯示錯誤訊息給用戶
      this.showErrorMessage('遊戲發生錯誤，請重新載入頁面');
    }
  }

  /**
   * 顯示錯誤訊息
   */
  showErrorMessage(message) {
    // 創建錯誤覆蓋層
    const errorOverlay = document.createElement('div');
    errorOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      z-index: 10000;
    `;
    
    errorOverlay.innerHTML = `
      <h2>遊戲錯誤</h2>
      <p>${message}</p>
      <button onclick="location.reload()" style="
        background: #667eea;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 20px;
      ">重新載入</button>
    `;
    
    document.body.appendChild(errorOverlay);
  }

  /**
   * 獲取遊戲實例
   */
  getGameInstance() {
    return this.game;
  }

  /**
   * 獲取管理器
   */
  getManager(managerName) {
    return this.gameManagers[managerName];
  }

  /**
   * 銷毀遊戲
   */
  destroy() {
    console.log('銷毀遊戲...');
    
    // 銷毀管理器
    Object.values(this.gameManagers).forEach(manager => {
      if (manager && typeof manager.destroy === 'function') {
        manager.destroy();
      }
    });
    
    // 銷毀Phaser遊戲實例
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    
    this.isInitialized = false;
    console.log('遊戲已銷毀');
  }
}

// 創建遊戲實例並啟動
let gameInstance = null;

// 等待DOM載入完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    startGame();
  });
} else {
  startGame();
}

function startGame() {
  if (!gameInstance) {
    gameInstance = new TowerDefenseGame();
  }
}

// 導出遊戲實例供外部使用
export { gameInstance as default, TowerDefenseGame };
