/**
 * 主選單場景
 * 遊戲的主選單界面
 */

import { BaseScene } from '../core/BaseScene.js';
import { MenuUI } from '../ui/MenuUI.js';

export class MainMenuScene extends BaseScene {
  constructor() {
    super('MainMenuScene');
    this.menuUI = null;
  }

  /**
   * 場景初始化
   */
  init(data) {
    super.init(data);
    console.log('主選單場景初始化');
  }

  /**
   * 場景創建
   */
  create() {
    super.create();
    console.log('創建主選單場景');
    
    // 創建 DOM UI（包含背景）
    this.menuUI = new MenuUI(this);
    this.menuUI.create();
    
    // 播放背景音樂
    this.playBackgroundMusic();
  }

  /**
   * 播放背景音樂
   */
  playBackgroundMusic() {
    if (this.audioManager && this.audioManager.musicManager) {
      this.audioManager.musicManager.playMusic('menu');
    }
  }

  /**
   * 開始遊戲
   */
  startGame() {
    console.log('開始遊戲');
    
    // 切換到遊戲場景
    this.switchToScene('GameplayScene', {
      level: 1,
      difficulty: 'normal'
    });
  }

  /**
   * 打開商店
   */
  openShop() {
    console.log('打開升級商店');
    
    // 切換到商店場景
    this.switchToScene('ShopScene');
  }

  /**
   * 清理場景
   */
  cleanupScene() {
    // 清理 DOM UI
    if (this.menuUI) {
      this.menuUI.destroy();
      this.menuUI = null;
    }
    
    console.log('主選單場景清理完成');
  }
}

export default MainMenuScene;