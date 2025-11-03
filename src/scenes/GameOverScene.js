/**
 * 遊戲結束場景
 * 顯示遊戲結束信息和選項
 */

import { BaseScene } from '../core/BaseScene.js';
import { GameConfig } from '../core/GameConfig.js';
import { GameOverUI } from '../ui/GameOverUI.js';

export class GameOverScene extends BaseScene {
  constructor() {
    super('GameOverScene');
    
    this.gameData = null;
    this.gameOverUI = null;
  }

  /**
   * 場景初始化
   */
  init(data) {
    super.init(data);
    
    console.log('遊戲結束場景初始化');
    
    this.gameData = data || {
      score: 0,
      level: 1,
      enemiesKilled: 0,
      timePlayed: 0,
      isVictory: false
    };
  }

  /**
   * 場景創建
   */
  create() {
    super.create();
    
    console.log('創建遊戲結束場景');
    
    // 創建 DOM UI
    this.gameOverUI = new GameOverUI(this, this.gameData);
    this.gameOverUI.create();
    
    // 播放遊戲結束音效
    this.playGameOverSound();
  }

  /**
   * 創建背景
   */
  createBackground(width, height) {
    // 根據是否勝利創建不同的背景
    if (this.gameData.isVictory) {
      // 勝利背景 - 金色漸變
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(0x2c5530, 0x1a4a1f, 0x0d3312, 0x2c5530);
      graphics.fillRect(0, 0, width, height);
    } else {
      // 失敗背景 - 紅色漸變
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(0x4a1a1a, 0x2d1010, 0x1a0606, 0x4a1a1a);
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
    for (let i = 0; i < 30; i++) {
      const color = this.gameData.isVictory ? 0x00ff00 : 0xff4757;
      const orb = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 4),
        color
      );
      
      orb.setAlpha(Phaser.Math.FloatBetween(0.1, 0.4));
      
      // 漂浮動畫
      this.tweens.add({
        targets: orb,
        x: orb.x + Phaser.Math.Between(-200, 200),
        y: orb.y + Phaser.Math.Between(-200, 200),
        alpha: { from: orb.alpha, to: 0 },
        duration: Phaser.Math.Between(8000, 15000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * 創建粒子效果
   */
  createParticleEffects(width, height) {
    if (this.gameData.isVictory) {
      // 勝利煙火效果
      this.createVictoryParticles(width, height);
    } else {
      // 失敗煙霧效果
      this.createDefeatParticles(width, height);
    }
  }

  /**
   * 創建勝利粒子
   */
  createVictoryParticles(width, height) {
    // 創建多個煙火爆炸
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 1000, () => {
        this.createFirework(
          Phaser.Math.Between(width * 0.2, width * 0.8),
          Phaser.Math.Between(height * 0.2, height * 0.6)
        );
      });
    }
  }

  /**
   * 創建煙火
   */
  createFirework(x, y) {
    const colors = [0x00ff00, 0xffd93d, 0x00ffff, 0xff6b6b, 0xffffff];
    
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(x, y, 3, Phaser.Utils.Array.GetRandom(colors));
      
      const angle = (i / 20) * Math.PI * 2;
      const speed = Phaser.Math.Between(100, 200);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: { from: 1, to: 0 },
        scaleX: { from: 1, to: 0.1 },
        scaleY: { from: 1, to: 0.1 },
        duration: 2000,
        ease: 'Quad.easeOut',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    this.playSound('firework');
  }

  /**
   * 創建失敗粒子
   */
  createDefeatParticles(width, height) {
    // 創建下落的灰燼效果
    for (let i = 0; i < 50; i++) {
      this.time.delayedCall(i * 100, () => {
        this.createAshParticle(width, height);
      });
    }
  }

  /**
   * 創建灰燼粒子
   */
  createAshParticle(width, height) {
    const ash = this.add.circle(
      Phaser.Math.Between(0, width),
      -10,
      Phaser.Math.Between(1, 3),
      0x666666
    );
    
    ash.setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));
    
    this.tweens.add({
      targets: ash,
      y: height + 10,
      x: ash.x + Phaser.Math.Between(-50, 50),
      alpha: { from: ash.alpha, to: 0 },
      duration: Phaser.Math.Between(5000, 10000),
      ease: 'Linear',
      onComplete: () => {
        ash.destroy();
      }
    });
  }

  /**
   * 創建遊戲結束UI
   */
  createGameOverUI(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 主標題
    const title = this.gameData.isVictory ? '勝利！' : '遊戲結束';
    const titleColor = this.gameData.isVictory ? '#00ff00' : '#ff4757';
    
    const titleText = this.add.text(centerX, centerY - 200, title, {
      fontFamily: 'Arial',
      fontSize: '64px',
      fontWeight: 'bold',
      fill: titleColor,
      stroke: '#ffffff',
      strokeThickness: 3,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 5,
        fill: true
      }
    });
    titleText.setOrigin(0.5);
    
    // 標題動畫
    titleText.setScale(0);
    this.tweens.add({
      targets: titleText,
      scaleX: 1,
      scaleY: 1,
      duration: 800,
      ease: 'Bounce.easeOut'
    });
    
    // 副標題
    const subtitle = this.gameData.isVictory ? 
      '恭喜你成功防禦了所有敵人！' : 
      '你的基地被敵人攻陷了...';
    
    const subtitleText = this.add.text(centerX, centerY - 130, subtitle, {
      fontFamily: 'Arial',
      fontSize: '20px',
      fill: '#ffffff',
      alpha: 0.8
    });
    subtitleText.setOrigin(0.5);
    
    // 副標題延遲出現
    subtitleText.setAlpha(0);
    this.tweens.add({
      targets: subtitleText,
      alpha: 0.8,
      duration: 500,
      delay: 800
    });
  }

  /**
   * 創建統計信息
   */
  createStatistics(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 統計面板背景
    const statsBg = this.add.rectangle(centerX, centerY - 30, 400, 180, 0x000000, 0.7);
    statsBg.setStrokeStyle(2, 0x00ffff);
    
    // 統計標題
    const statsTitle = this.add.text(centerX, centerY - 100, '遊戲統計', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fontWeight: 'bold',
      fill: '#00ffff'
    });
    statsTitle.setOrigin(0.5);
    
    // 統計數據
    const stats = [
      { label: '最終分數', value: this.gameData.score.toLocaleString(), color: '#ffd93d' },
      { label: '到達關卡', value: this.gameData.level, color: '#00ff00' },
      { label: '擊殺敵人', value: this.gameData.enemiesKilled, color: '#ff6b6b' },
      { label: '遊戲時間', value: this.formatTime(this.gameData.timePlayed), color: '#00ffff' }
    ];
    
    stats.forEach((stat, index) => {
      const y = centerY - 60 + (index * 25);
      
      // 標籤
      const label = this.add.text(centerX - 120, y, `${stat.label}:`, {
        fontFamily: 'Arial',
        fontSize: '16px',
        fill: '#ffffff'
      });
      
      // 數值
      const value = this.add.text(centerX + 50, y, stat.value, {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontWeight: 'bold',
        fill: stat.color
      });
      
      // 統計項目動畫
      [label, value].forEach(text => {
        text.setAlpha(0);
        text.setScale(0.8);
        
        this.tweens.add({
          targets: text,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 400,
          delay: 1200 + (index * 150),
          ease: 'Back.easeOut'
        });
      });
    });
    
    // 計算並顯示新記錄
    this.checkAndDisplayNewRecord(centerX, centerY + 80);
  }

  /**
   * 檢查並顯示新記錄
   */
  checkAndDisplayNewRecord(x, y) {
    // 這裡可以檢查是否創造了新記錄
    const isHighScore = this.checkHighScore(this.gameData.score);
    
    if (isHighScore) {
      const newRecordText = this.add.text(x, y, '🏆 新記錄！', {
        fontFamily: 'Arial',
        fontSize: '20px',
        fontWeight: 'bold',
        fill: '#ffd93d',
        stroke: '#ff6b6b',
        strokeThickness: 1
      });
      newRecordText.setOrigin(0.5);
      
      // 新記錄閃爍動畫
      this.tweens.add({
        targets: newRecordText,
        alpha: { from: 1, to: 0.3 },
        scaleX: { from: 1, to: 1.2 },
        scaleY: { from: 1, to: 1.2 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.playSound('new_record');
    }
  }

  /**
   * 檢查高分記錄
   */
  checkHighScore(score) {
    // 這裡應該與實際的記錄系統連接
    const currentHighScore = localStorage.getItem('towerDefenseHighScore') || 0;
    
    if (score > currentHighScore) {
      localStorage.setItem('towerDefenseHighScore', score);
      return true;
    }
    
    return false;
  }

  /**
   * 格式化時間
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 創建菜單按鈕
   */
  createMenuButtons(width, height) {
    const centerX = width / 2;
    const startY = height / 2 + 150;
    const buttonSpacing = 80;
    
    const buttonConfigs = [
      {
        text: '再玩一次',
        action: () => this.restartGame(),
        color: '#00ff00'
      },
      {
        text: '返回主選單',
        action: () => this.returnToMainMenu(),
        color: '#00ffff'
      },
      {
        text: '查看排行榜',
        action: () => this.showLeaderboard(),
        color: '#ffd93d'
      }
    ];
    
    buttonConfigs.forEach((config, index) => {
      const button = this.createMenuButton(
        centerX,
        startY + (index * buttonSpacing),
        config.text,
        config.action,
        config.color
      );
      
      this.menuButtons.push(button);
      
      // 按鈕進入動畫
      button.setAlpha(0);
      button.setY(button.y + 50);
      
      this.tweens.add({
        targets: button,
        alpha: 1,
        y: startY + (index * buttonSpacing),
        duration: 600,
        delay: 2000 + (index * 200),
        ease: 'Back.easeOut'
      });
    });
  }

  /**
   * 創建菜單按鈕
   */
  createMenuButton(x, y, text, action, color = '#00ffff') {
    // 按鈕背景
    const buttonBg = this.add.rectangle(x, y, 300, 60, 0x000000, 0.8);
    buttonBg.setStrokeStyle(2, color);
    
    // 按鈕文字
    const buttonText = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '22px',
      fontWeight: 'bold',
      fill: color
    });
    buttonText.setOrigin(0.5);
    
    // 創建按鈕容器
    const button = this.add.container(0, 0, [buttonBg, buttonText]);
    
    // 設置互動
    buttonBg.setInteractive();
    
    // 懸停效果
    buttonBg.on('pointerover', () => {
      this.tweens.add({
        targets: [buttonBg, buttonText],
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        ease: 'Back.easeOut'
      });
      
      buttonBg.setFillStyle(color, 0.2);
      this.playSound('button_hover');
    });
    
    buttonBg.on('pointerout', () => {
      this.tweens.add({
        targets: [buttonBg, buttonText],
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeOut'
      });
      
      buttonBg.setFillStyle(0x000000, 0.8);
    });
    
    // 點擊效果
    buttonBg.on('pointerdown', () => {
      this.tweens.add({
        targets: [buttonBg, buttonText],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
      
      this.playSound('button_click');
      
      // 延遲執行動作
      this.time.delayedCall(150, action);
    });
    
    return button;
  }

  /**
   * 重新開始遊戲
   */
  restartGame() {
    console.log('重新開始遊戲');
    
    this.playSound('button_confirm');
    
    // 切換到遊戲場景
    this.switchToScene('GameplayScene', {
      level: 1,
      difficulty: this.gameData.difficulty || 'normal'
    });
  }

  /**
   * 返回主選單
   */
  returnToMainMenu() {
    console.log('返回主選單');
    
    this.playSound('button_confirm');
    
    // 切換到主選單
    this.switchToScene('MainMenuScene');
  }

  /**
   * 顯示排行榜
   */
  showLeaderboard() {
    console.log('顯示排行榜');
    
    this.playSound('button_click');
    
    // 創建排行榜對話框
    this.createLeaderboardDialog();
  }

  /**
   * 創建排行榜對話框
   */
  createLeaderboardDialog() {
    const { width, height } = this.scale.gameSize;
    
    // 創建遮罩
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setInteractive();
    
    // 創建對話框
    const dialog = this.add.rectangle(width / 2, height / 2, 500, 400, 0x1a1a2e);
    dialog.setStrokeStyle(3, 0x00ffff);
    
    // 標題
    const title = this.add.text(width / 2, height / 2 - 170, '排行榜', {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontWeight: 'bold',
      fill: '#00ffff'
    });
    title.setOrigin(0.5);
    
    // 模擬排行榜數據
    const leaderboard = this.getLeaderboardData();
    
    leaderboard.forEach((entry, index) => {
      const y = height / 2 - 120 + (index * 30);
      
      // 排名
      const rank = this.add.text(width / 2 - 200, y, `${index + 1}.`, {
        fontFamily: 'Arial',
        fontSize: '18px',
        fontWeight: 'bold',
        fill: '#ffd93d'
      });
      
      // 玩家名稱
      const name = this.add.text(width / 2 - 170, y, entry.name, {
        fontFamily: 'Arial',
        fontSize: '18px',
        fill: '#ffffff'
      });
      
      // 分數
      const score = this.add.text(width / 2 + 150, y, entry.score.toLocaleString(), {
        fontFamily: 'Arial',
        fontSize: '18px',
        fontWeight: 'bold',
        fill: '#00ff00'
      });
      score.setOrigin(1, 0);
    });
    
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
      
      // 移除排行榜對話框
      overlay.destroy();
      dialog.destroy();
      title.destroy();
      closeButton.destroy();
    });
  }

  /**
   * 獲取排行榜數據
   */
  getLeaderboardData() {
    // 這裡應該從實際的數據源獲取
    return [
      { name: '玩家1', score: 15000 },
      { name: '玩家2', score: 12500 },
      { name: '玩家3', score: 10000 },
      { name: '玩家4', score: 8500 },
      { name: '你', score: this.gameData.score },
      { name: '玩家5', score: 6000 },
      { name: '玩家6', score: 4500 },
      { name: '玩家7', score: 3000 }
    ].sort((a, b) => b.score - a.score).slice(0, 8);
  }

  /**
   * 播放遊戲結束音效
   */
  playGameOverSound() {
    if (this.gameData.isVictory) {
      this.playSound('victory');
    } else {
      this.playSound('game_over');
    }
  }

  /**
   * 重新佈局UI
   */
  repositionUI(width, height) {
    // 重新定位遊戲結束UI元素
  }

  /**
   * 清理場景
   */
  cleanupScene() {
    // 清理 DOM UI
    if (this.gameOverUI) {
      this.gameOverUI.destroy();
      this.gameOverUI = null;
    }
    
    console.log('遊戲結束場景清理完成');
  }
}

export default GameOverScene;