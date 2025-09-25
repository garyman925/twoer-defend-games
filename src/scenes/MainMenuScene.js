/**
 * 主選單場景
 * 遊戲的主選單界面
 */

import { BaseScene } from '../core/BaseScene.js';
import GameConfig from '../core/GameConfig.js';

export class MainMenuScene extends BaseScene {
  constructor() {
    super('MainMenuScene');
    
    this.menuButtons = [];
    this.titleText = null;
    this.backgroundMusic = null;
  }

  /**
   * 場景初始化
   */
  init(data) {
    super.init(data);
    console.log('主選單場景初始化');
  }

  /**
   * 載入場景資源
   */
  loadSceneAssets() {
    // 主選單特定資源在這裡載入
    // 大部分資源已經在LoadingScene中載入
  }

  /**
   * 場景創建
   */
  create() {
    super.create();
    
    console.log('創建主選單場景');
    
    const { width, height } = this.scale.gameSize;
    
    // 創建背景
    this.createBackground(width, height);
    
    // 創建標題
    this.createTitle(width, height);
    
    // 創建選單按鈕
    this.createMenuButtons(width, height);
    
    // 創建版本信息
    this.createVersionInfo(width, height);
    
    // 播放背景音樂
    this.playBackgroundMusic();
    
    // 場景淡入效果
    this.cameras.main.fadeIn(1000, 0, 0, 0);
  }

  /**
   * 創建背景
   */
  createBackground(width, height) {
    // 使用新的背景圖片
    if (this.textures.exists('game_start_screen')) {
      this.backgroundImage = this.add.image(width / 2, height / 2, 'game_start_screen');
      
      // 調整背景圖片大小以適應螢幕
      const scaleX = width / this.backgroundImage.width;
      const scaleY = height / this.backgroundImage.height;
      const scale = Math.max(scaleX, scaleY);
      
      this.backgroundImage.setScale(scale);
      this.backgroundImage.setDepth(-1000); // 確保背景在最底層
    } else {
      // 如果背景圖片未載入，使用漸變背景作為備用
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(0x0c0c0c, 0x1a1a2e, 0x16213e, 0x0c0c0c);
      graphics.fillRect(0, 0, width, height);
    }
    
    // 添加動態背景效果
    this.createBackgroundEffects(width, height);
  }

  /**
   * 創建背景特效
   */
  createBackgroundEffects(width, height) {
    // 創建移動的光點
    for (let i = 0; i < 20; i++) {
      const orb = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(2, 6),
        0x00ffff
      );
      
      orb.setAlpha(Phaser.Math.FloatBetween(0.1, 0.3));
      
      // 漂浮動畫
      this.tweens.add({
        targets: orb,
        x: orb.x + Phaser.Math.Between(-100, 100),
        y: orb.y + Phaser.Math.Between(-100, 100),
        alpha: { from: orb.alpha, to: 0 },
        duration: Phaser.Math.Between(5000, 10000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * 創建標題
   */
  createTitle(width, height) {
    // 標題和副標題已移除
  }

  /**
   * 創建選單按鈕
   */
  createMenuButtons(width, height) {
    // 按鈕位置設置在右下角
    const startX = width - 150; // 距離右邊 200px
    const startY = height - 300; // 距離底部 200px
    const buttonSpacing = 90;
    
    const buttonConfigs = [
      {
        text: '開始遊戲',
        action: () => this.startGame(),
        color: '#00ff00'
      },
      {
        text: '商店',
        action: () => this.openShop(),
        color: '#ffd93d'
      },
      {
        text: '說明',
        action: () => this.showInstructions(),
        color: '#ff6b6b'
      }
    ];
    
    buttonConfigs.forEach((config, index) => {
      const button = this.createMenuButton(
        startX,
        startY + (index * buttonSpacing),
        config.text,
        config.action,
        config.color
      );
      
      this.menuButtons.push(button);
    });
  }

  /**
   * 創建選單按鈕
   */
  createMenuButton(x, y, text, action, color = '#00ffff') {
    // 使用圖片按鈕
    const buttonBg = this.add.image(x, y, 'ui_buttons', 'btn.png');
    buttonBg.setScale(0.5); // 調整按鈕大小
    
    // 按鈕文字
    const buttonText = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    buttonText.setOrigin(0.5);
    
    // 創建按鈕容器
    const button = this.add.container(0, 0, [buttonBg, buttonText]);
    
    // 設置互動
    buttonBg.setInteractive();
    

    // 懸停效果
    buttonBg.on('pointerover', () => {
      // 切換到懸停狀態
      buttonBg.setFrame('btn-hover.png');      
      this.playSound('button_hover');
      
    });
    
    buttonBg.on('pointerout', () => {

      // 切換回正常狀態
      buttonBg.setFrame('btn.png');

    });
    
    // 點擊效果
    buttonBg.on('pointerdown', () => {

      this.playSound('button_click');
      // 延遲執行動作
      this.time.delayedCall(150, action);
    });
    
    return button;
  }

  /**
   * 創建版本信息
   */
  createVersionInfo(width, height) {
    // 添加空值檢查防止錯誤
    const version = GameConfig.VERSION || '1.0.0';
    
    const versionText = this.add.text(width - 20, height - 20, `v${version}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      fill: '#666666'
    });
    versionText.setOrigin(1, 1);
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
    
    this.playSound('button_confirm');
    
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
    
    this.playSound('button_confirm');
    
    // 切換到商店場景
    this.switchToScene('ShopScene');
  }

  /**
   * 打開設置
   */
  openSettings() {
    console.log('打開設置');
    
    this.playSound('button_click');
    
    // 創建設置對話框
    this.createSettingsDialog();
  }

  /**
   * 顯示說明
   */
  showInstructions() {
    console.log('顯示遊戲說明');
    
    this.playSound('button_click');
    
    // 創建說明對話框
    this.createInstructionsDialog();
  }

  /**
   * 創建設置對話框
   */
  createSettingsDialog() {
    const { width, height } = this.scale.gameSize;
    
    // 創建遮罩
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();
    
    // 創建對話框
    const dialog = this.add.rectangle(width / 2, height / 2, 400, 300, 0x1a1a2e);
    dialog.setStrokeStyle(2, 0x00ffff);
    
    // 標題
    const title = this.add.text(width / 2, height / 2 - 120, '設置', {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontWeight: 'bold',
      fill: '#00ffff'
    });
    title.setOrigin(0.5);
    
    // 音量設置
    const musicVolumeText = this.add.text(width / 2 - 150, height / 2 - 60, '音樂音量:', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fill: '#ffffff'
    });
    
    const sfxVolumeText = this.add.text(width / 2 - 150, height / 2 - 20, '音效音量:', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fill: '#ffffff'
    });
    
    // 關閉按鈕
    const closeButton = this.add.text(width / 2, height / 2 + 100, '關閉', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#ff6b6b',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive();
    
    closeButton.on('pointerdown', () => {
      this.playSound('button_click');
      
      // 移除對話框
      overlay.destroy();
      dialog.destroy();
      title.destroy();
      musicVolumeText.destroy();
      sfxVolumeText.destroy();
      closeButton.destroy();
    });
    
    // 懸停效果
    closeButton.on('pointerover', () => {
      closeButton.setScale(1.1);
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setScale(1);
    });
  }

  /**
   * 創建說明對話框
   */
  createInstructionsDialog() {
    const { width, height } = this.scale.gameSize;
    
    // 創建遮罩
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();
    
    // 創建對話框
    const dialog = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1a1a2e);
    dialog.setStrokeStyle(2, 0x00ffff);
    
    // 標題
    const title = this.add.text(width / 2, height / 2 - 170, '遊戲說明', {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontWeight: 'bold',
      fill: '#00ffff'
    });
    title.setOrigin(0.5);
    
    // 說明內容
    const instructions = `
• 使用滑鼠控制玩家武器方向
• 點擊射擊或按住滑鼠持續射擊
• 建造不同類型的塔來防禦敵人
• 升級塔來增強威力和射程
• 收集金幣來購買更多塔和升級
• 保護你的基地，不要讓敵人到達！
    `;
    
    const instructionText = this.add.text(width / 2, height / 2 - 50, instructions, {
      fontFamily: 'Arial',
      fontSize: '16px',
      fill: '#ffffff',
      align: 'left',
      lineSpacing: 10
    });
    instructionText.setOrigin(0.5);
    
    // 關閉按鈕
    const closeButton = this.add.text(width / 2, height / 2 + 150, '關閉', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontWeight: 'bold',
      fill: '#ff6b6b',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive();
    
    closeButton.on('pointerdown', () => {
      this.playSound('button_click');
      
      // 移除對話框
      overlay.destroy();
      dialog.destroy();
      title.destroy();
      instructionText.destroy();
      closeButton.destroy();
    });
    
    // 懸停效果
    closeButton.on('pointerover', () => {
      closeButton.setScale(1.1);
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setScale(1);
    });
  }

  /**
   * 重新佈局UI
   */
  repositionUI(width, height) {
    // 重新定位按鈕到右下角
    const startX = width - 200; // 距離右邊 200px
    const startY = height - 200; // 距離底部 200px
    const buttonSpacing = 80;
    
    this.menuButtons.forEach((button, index) => {
      if (button) {
        button.setPosition(startX, startY + (index * buttonSpacing));
      }
    });
  }

  /**
   * 清理場景
   */
  cleanupScene() {
    // 停止背景音樂
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
    
    console.log('主選單場景清理完成');
  }
}

export default MainMenuScene;
