/**
 * 主選單場景
 * 遊戲的主選單界面
 */

import { BaseScene } from '../core/BaseScene.js';
import { MenuUI } from '../ui/MenuUI.js';
import { TutorialUI } from '../ui/TutorialUI.js';

export class MainMenuScene extends BaseScene {
  constructor() {
    super('MainMenuScene');
    this.menuUI = null;
    this.tutorialUI = null;
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
    console.log('準備開始遊戲 - 顯示教學');
    
    // 每次都顯示教學系統
    this.showTutorial();
  }

  /**
   * 顯示教學系統
   */
  showTutorial() {
    this.tutorialUI = new TutorialUI(this);
    this.tutorialUI.create(() => {
      // 教學完成後的回調
      console.log('教學完成，開始遊戲');
      
      // 不記錄完成狀態，每次都顯示教學
      // localStorage.setItem('hasCompletedTutorial', 'true');
      
      // 啟動遊戲
      this.launchGame();
    });
  }

  /**
   * 啟動遊戲場景
   */
  launchGame() {
    console.log('啟動遊戲場景');
    
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
   * 打開我的戰機
   */
  openMyShip() {
    console.log('打開我的戰機');
    
    // 在新分頁打開 HTML 頁面
    window.open('my-ship.html', '_blank');
  }

  /**
   * 打開排行榜
   */
  openLeaderboard() {
    console.log('打開排行榜');
    
    // 在新分頁打開 HTML 頁面
    window.open('leaderboard.html', '_blank');
  }

  /**
   * 清理場景
   */
  cleanupScene() {
    // 清理教學 UI
    if (this.tutorialUI) {
      this.tutorialUI.destroy();
      this.tutorialUI = null;
    }
    
    // 清理 DOM UI
    if (this.menuUI) {
      this.menuUI.destroy();
      this.menuUI = null;
    }
    
    console.log('主選單場景清理完成');
  }
}

export default MainMenuScene;