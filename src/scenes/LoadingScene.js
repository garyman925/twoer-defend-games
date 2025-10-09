/**
 * 載入場景
 * 負責載入所有遊戲資源並顯示載入進度
 */

import { BaseScene } from '../core/BaseScene.js';
import { AssetLoader } from '../core/AssetLoader.js';
import { GameConfig } from '../core/GameConfig.js';

export class LoadingScene extends BaseScene {
  constructor() {
    super('LoadingScene');
    
    this.assetLoader = null;
    this.loadingText = null;
    this.progressBar = null;
    this.progressBarBg = null;
    this.loadingTips = [];
    this.currentTip = 0;
    this.tipText = null;
    this.tipTimer = null;
  }

  /**
   * 場景初始化
   */
  init(data) {
    super.init(data);
    
    console.log('載入場景初始化');
    
    // 設置載入提示
    this.setupLoadingTips();
    
    // 初始化資源載入器
    this.assetLoader = new AssetLoader(this);
    this.assetLoader.init();
  }

  /**
   * 預載入基礎資源
   */
  preload() {
    console.log('開始預載入基礎資源');
    
    // 載入載入畫面的基礎資源
    this.loadBasicAssets();
    
    // 設置載入事件
    this.setupPreloadEvents();
  }

  /**
   * 載入基礎資源
   */
  loadBasicAssets() {
    // 創建簡單的彩色矩形作為暫時的UI元素
    this.load.image('loading_bg', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  }

  /**
   * 設置預載入事件
   */
  setupPreloadEvents() {
    this.load.on('progress', (progress) => {
      // 載入進度處理
    });

    this.load.on('complete', () => {
    });
  }

  /**
   * 場景創建
   */
  create() {
    super.create();
    
    
    const { width, height } = this.scale.gameSize;
    
    // 創建載入背景
    this.createLoadingBackground(width, height);
    
    // 創建載入界面
    this.createLoadingUI(width, height);
    
    // 開始載入所有資源
    this.startAssetLoading();
    
    // 開始載入提示輪播
    this.startTipRotation();
  }

  /**
   * 創建載入背景
   */
  createLoadingBackground(width, height) {
    // 創建漸變背景
    const graphics = this.add.graphics();
    
    // 繪製漸變背景
    graphics.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0c0c0c, 0x1a1a2e);
    graphics.fillRect(0, 0, width, height);
    
    // 添加一些星星效果
    this.createStarField(width, height);
  }

  /**
   * 創建星空效果
   */
  createStarField(width, height) {
    const starCount = 50;
    
    for (let i = 0; i < starCount; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0xffffff
      );
      
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1.0));
      
      // 閃爍動畫
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.1 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }
  }

  /**
   * 創建載入界面
   */
  createLoadingUI(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 遊戲標題
    const title = this.add.text(centerX, centerY - 150, 'TOWER DEFENSE', {
      fontFamily: 'Arial',
      fontSize: '48px',
      fontWeight: 'bold',
      fill: '#00ffff',
      stroke: '#ffffff',
      strokeThickness: 2
    });
    title.setOrigin(0.5);
    
    // 添加標題發光效果
    title.setPostPipeline('FX');
    if (title.postFX) {
      title.postFX.addGlow(0x00ffff, 2, 0, false, 0.1, 32);
    }
    
    // 載入文字
    this.loadingText = this.add.text(centerX, centerY - 50, '載入中...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#ffffff'
    });
    this.loadingText.setOrigin(0.5);
    
    // 進度條背景
    this.progressBarBg = this.add.rectangle(centerX, centerY, 400, 20, 0x333333);
    this.progressBarBg.setStrokeStyle(2, 0x00ffff);
    
    // 進度條
    this.progressBar = this.add.rectangle(centerX - 200, centerY, 0, 16, 0x00ffff);
    this.progressBar.setOrigin(0, 0.5);
    
    // 進度百分比文字
    this.progressText = this.add.text(centerX, centerY + 40, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fill: '#ffffff'
    });
    this.progressText.setOrigin(0.5);
    
    // 載入提示文字
    this.tipText = this.add.text(centerX, centerY + 100, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      fill: '#cccccc',
      align: 'center',
      wordWrap: { width: 500 }
    });
    this.tipText.setOrigin(0.5);
    
    // 添加載入動畫
    this.createLoadingAnimation();
  }

  /**
   * 創建載入動畫
   */
  createLoadingAnimation() {
    // 載入文字脈衝動畫
    this.tweens.add({
      targets: this.loadingText,
      alpha: { from: 1, to: 0.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // 進度條發光動畫
    this.tweens.add({
      targets: this.progressBar,
      alpha: { from: 1, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * 設置載入提示
   */
  setupLoadingTips() {
    this.loadingTips = [
      "提示：建造塔來防禦你的基地！",
      "提示：不同的塔對不同敵人有效果加成",
      "提示：升級塔可以增強威力和射程",
      "提示：合理配置塔的位置是勝利的關鍵",
      "提示：注意敵人的移動路線來制定策略",
      "提示：Boss級敵人需要集中火力才能擊敗",
      "提示：你可以360度旋轉武器射擊敵人",
      "提示：收集金幣來購買和升級武器裝備",
      "提示：冰霜塔可以減緩敵人移動速度",
      "提示：激光塔可以穿透多個敵人"
    ];
  }

  /**
   * 開始提示輪播
   */
  startTipRotation() {
    this.showCurrentTip();
    
    this.tipTimer = this.time.addEvent({
      delay: 3000, // 每3秒換一個提示
      callback: this.nextTip,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * 顯示當前提示
   */
  showCurrentTip() {
    const tip = this.loadingTips[this.currentTip];
    this.tipText.setText(tip);
    
    // 淡入動畫
    this.tipText.setAlpha(0);
    this.tweens.add({
      targets: this.tipText,
      alpha: 1,
      duration: 500
    });
  }

  /**
   * 下一個提示
   */
  nextTip() {
    // 淡出當前提示
    this.tweens.add({
      targets: this.tipText,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.currentTip = (this.currentTip + 1) % this.loadingTips.length;
        this.showCurrentTip();
      }
    });
  }

  /**
   * 開始資源載入
   */
  startAssetLoading() {
    console.log('🚀 開始資源載入流程...');
    
    // 開始載入
    this.assetLoader.loadAllAssets();
    
    // 監聽進度更新
    this.load.on('progress', (progress) => {
      this.updateLoadingProgress(progress);
    });
    
    // 監聽 AssetLoader 的載入完成事件
    this.events.once('allAssetsLoaded', () => {
      console.log('📢 收到資源載入完成事件');
      this.onLoadingComplete();
    });
    
    // 啟動載入
    this.load.start();
    
    console.log('✅ 載入器已啟動');
  }

  /**
   * 更新載入進度
   */
  updateLoadingProgress(progress) {
    const percentage = Math.round(progress * 100);
    
    // 更新進度條
    this.progressBar.width = 400 * progress;
    
    // 更新百分比文字
    this.progressText.setText(`${percentage}%`);
    
    // 更新載入文字
    this.loadingText.setText(`載入中... ${percentage}%`);
    
    // 進度條顏色變化
    const color = this.getProgressColor(progress);
    this.progressBar.setFillStyle(color);
  }

  /**
   * 更新載入文字
   */
  updateLoadingText(text) {
    // 可以顯示正在載入的具體檔案
    // this.loadingText.setText(text);
  }

  /**
   * 獲取進度條顏色
   */
  getProgressColor(progress) {
    if (progress < 0.3) {
      return 0xff4757; // 紅色
    } else if (progress < 0.7) {
      return 0xffd93d; // 黃色
    } else {
      return 0x00ff00; // 綠色
    }
  }

  /**
   * 載入完成
   */
  onLoadingComplete() {
    console.log('所有資源載入完成！');
    
    // 停止提示輪播
    if (this.tipTimer) {
      this.tipTimer.destroy();
    }
    
    // 更新UI
    this.loadingText.setText('載入完成！');
    this.tipText.setText('準備進入遊戲...');
    
    // 延遲一下然後切換到主選單
    this.time.delayedCall(1500, () => {
      this.transitionToMainMenu();
    });
  }

  /**
   * 切換到主選單
   */
  transitionToMainMenu() {
    console.log('切換到主選單');
    
    // 淡出效果
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // 切換到主選單場景
      this.scene.start('MainMenuScene');
    });
  }

  /**
   * 場景更新
   */
  updateSceneLogic(time, delta) {
    // 載入場景通常不需要持續更新邏輯
  }

  /**
   * 重新佈局UI
   */
  repositionUI(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 重新定位UI元素
    if (this.loadingText) {
      this.loadingText.setPosition(centerX, centerY - 50);
    }
    
    if (this.progressBarBg) {
      this.progressBarBg.setPosition(centerX, centerY);
    }
    
    if (this.progressBar) {
      this.progressBar.setPosition(centerX - 200, centerY);
    }
    
    if (this.progressText) {
      this.progressText.setPosition(centerX, centerY + 40);
    }
    
    if (this.tipText) {
      this.tipText.setPosition(centerX, centerY + 100);
    }
  }

  /**
   * 清理場景
   */
  cleanupScene() {
    // 清理提示計時器
    if (this.tipTimer) {
      this.tipTimer.destroy();
    }
    
    // 清理資源載入器
    if (this.assetLoader) {
      this.assetLoader.destroy();
    }
    
    console.log('載入場景清理完成');
  }
}

export default LoadingScene;
