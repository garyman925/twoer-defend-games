/**
 * 連擊效果系統
 * 追蹤快速擊殺，提供視覺和獎勵反饋
 */

export class ComboSystem {
  constructor(scene) {
    this.scene = scene;
    
    // 連擊狀態
    this.comboCount = 0;
    this.maxCombo = 0;
    this.lastKillTime = 0;
    this.comboTimeWindow = 3000; // 3秒內的擊殺算連擊
    this.comboMultiplier = 1.0;
    
    // 連擊顯示
    this.comboDisplay = null;
    this.comboText = null;
    this.comboEffects = [];
    
    // 連擊閾值
    this.comboThresholds = {
      3: { name: '三連擊', multiplier: 1.2, color: 0xffff00 },
      5: { name: '五連擊', multiplier: 1.5, color: 0xff8800 },
      7: { name: '七連擊', multiplier: 1.8, color: 0xff4400 },
      10: { name: '超級連擊', multiplier: 2.0, color: 0xff0000 },
      15: { name: '大師級連擊', multiplier: 2.5, color: 0xff0080 },
      20: { name: '傳奇連擊', multiplier: 3.0, color: 0x8000ff }
    };
    
    this.setupEventListeners();
  }

  /**
   * 設置事件監聽器
   */
  setupEventListeners() {
    // 監聽敵人被擊殺事件
    this.scene.events.on('enemyKilled', (data) => {
      this.onEnemyKilled(data);
    });
  }

  /**
   * 處理敵人被擊殺
   */
  onEnemyKilled(data) {
    const currentTime = Date.now();
    
    // 檢查是否在連擊時間窗口內
    if (currentTime - this.lastKillTime <= this.comboTimeWindow) {
      this.comboCount++;
      console.log(`🔥 連擊 +1! 當前連擊: ${this.comboCount}`);
    } else {
      // 重新開始計算連擊
      if (this.comboCount > 0) {
        console.log(`⏰ 連擊中斷，最終連擊: ${this.comboCount}`);
      }
      this.comboCount = 1;
      
      // 播放連擊開始音效
      if (this.scene.enhancedAudio) {
        this.scene.enhancedAudio.playSound('combo_hit');
      }
    }
    
    this.lastKillTime = currentTime;
    
    // 更新最高連擊記錄
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }
    
    // 處理連擊效果
    this.processCombo(data);
    
    // 重置連擊計時器
    this.resetComboTimer();
  }

  /**
   * 處理連擊效果
   */
  processCombo(killData) {
    // 檢查是否達到連擊閾值
    const threshold = this.comboThresholds[this.comboCount];
    
    if (threshold) {
      this.triggerComboMilestone(threshold, killData);
    }
    
    // 更新連擊顯示
    this.updateComboDisplay();
    
    // 創建連擊視覺效果
    this.createComboEffect(killData.position);
    
    // 計算連擊獎勵
    this.calculateComboReward(killData);
  }

  /**
   * 觸發連擊里程碑
   */
  triggerComboMilestone(threshold, killData) {
    console.log(`🏆 達成 ${threshold.name}！倍率: ${threshold.multiplier}x`);
    
    // 創建里程碑特效
    this.createMilestoneEffect(threshold, killData.position);
    
    // 屏幕震動
    if (this.scene.screenShake) {
      this.scene.screenShake.combo(this.comboCount);
    }
    
    // 播放連擊音效
    if (this.scene.enhancedAudio) {
      this.scene.enhancedAudio.playSound('combo_milestone');
    }
    
    // 更新倍率
    this.comboMultiplier = threshold.multiplier;
  }

  /**
   * 創建里程碑特效
   */
  createMilestoneEffect(threshold, position) {
    // 創建大字提示
    const milestoneText = this.scene.add.text(
      this.scene.scale.width / 2, 
      this.scene.scale.height / 3, 
      threshold.name, 
      {
        fontSize: '32px',
        fill: `#${threshold.color.toString(16).padStart(6, '0')}`,
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    
    milestoneText.setOrigin(0.5);
    milestoneText.setDepth(300);
    
    // 里程碑動畫
    this.scene.tweens.add({
      targets: milestoneText,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      y: milestoneText.y - 50,
      duration: 2000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        milestoneText.destroy();
      }
    });
    
    // 創建里程碑粒子爆炸
    this.createMilestoneParticles(position, threshold.color);
  }

  /**
   * 創建里程碑粒子效果
   */
  createMilestoneParticles(position, color) {
    try {
      // 創建里程碑粒子紋理
      const textureName = `milestone_particle_${color}`;
      if (!this.scene.textures.exists(textureName)) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color);
        graphics.fillStar(5, 5, 4, 8, 4, 0);
        graphics.generateTexture(textureName, 10, 10);
        graphics.destroy();
      }
      
      // 創建粒子爆炸
      const particles = this.scene.add.particles(position.x, position.y, textureName, {
        speed: { min: 100, max: 200 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 15,
        blendMode: 'ADD'
      });
      
      particles.setDepth(250);
      particles.explode();
      
      // 清理粒子效果
      this.scene.time.delayedCall(1200, () => {
        if (particles) {
          particles.destroy();
        }
      });
      
    } catch (error) {
      console.log('⚠️ 里程碑粒子效果創建失敗:', error.message);
    }
  }

  /**
   * 更新連擊顯示
   */
  updateComboDisplay() {
    if (this.comboCount < 2) {
      this.hideComboDisplay();
      return;
    }
    
    this.showComboDisplay();
  }

  /**
   * 顯示連擊界面
   */
  showComboDisplay() {
    if (!this.comboDisplay) {
      this.createComboDisplay();
    }
    
    // 更新連擊文字
    this.comboText.setText(`${this.comboCount} 連擊!`);
    
    // 根據連擊數量改變顏色
    const color = this.getComboColor();
    this.comboText.setStyle({ fill: color });
    
    // 連擊數字動畫
    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
    
    this.comboDisplay.setVisible(true);
  }

  /**
   * 創建連擊顯示界面
   */
  createComboDisplay() {
    const x = this.scene.scale.width / 2;
    const y = 80;
    
    // 創建容器
    this.comboDisplay = this.scene.add.container(x, y);
    
    // 背景
    const background = this.scene.add.rectangle(0, 0, 150, 40, 0x000000, 0.8);
    background.setStrokeStyle(2, 0xff4400, 1);
    this.comboDisplay.add(background);
    
    // 連擊文字
    this.comboText = this.scene.add.text(0, 0, '2 連擊!', {
      fontSize: '18px',
      fill: '#ff4400',
      fontWeight: 'bold',
      fontFamily: 'Arial'
    });
    this.comboText.setOrigin(0.5);
    this.comboDisplay.add(this.comboText);
    
    this.comboDisplay.setDepth(200);
    this.comboDisplay.setVisible(false);
  }

  /**
   * 隱藏連擊顯示
   */
  hideComboDisplay() {
    if (this.comboDisplay) {
      this.comboDisplay.setVisible(false);
    }
  }

  /**
   * 獲取連擊顏色
   */
  getComboColor() {
    if (this.comboCount >= 20) return '#8000ff';
    if (this.comboCount >= 15) return '#ff0080';
    if (this.comboCount >= 10) return '#ff0000';
    if (this.comboCount >= 7) return '#ff4400';
    if (this.comboCount >= 5) return '#ff8800';
    if (this.comboCount >= 3) return '#ffff00';
    return '#ff4400';
  }

  /**
   * 創建連擊效果
   */
  createComboEffect(position) {
    // 創建連擊數字顯示
    const comboNumberText = this.scene.add.text(position.x, position.y - 40, `${this.comboCount}`, {
      fontSize: '16px',
      fill: this.getComboColor(),
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    comboNumberText.setOrigin(0.5);
    comboNumberText.setDepth(180);
    
    // 連擊數字動畫
    this.scene.tweens.add({
      targets: comboNumberText,
      y: comboNumberText.y - 30,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        comboNumberText.destroy();
      }
    });
  }

  /**
   * 計算連擊獎勵
   */
  calculateComboReward(killData) {
    if (this.comboCount < 3) return;
    
    // 計算額外獎勵
    const baseReward = killData.reward;
    const bonusReward = Math.floor(baseReward * (this.comboMultiplier - 1));
    
    if (bonusReward > 0 && this.scene.gameManager) {
      this.scene.gameManager.addMoney(bonusReward);
      
      // 顯示獎勵文字
      this.showBonusReward(killData.position, bonusReward);
      
      console.log(`💰 連擊獎勵: +${bonusReward} 金幣 (${this.comboMultiplier}x)`);
    }
  }

  /**
   * 顯示連擊獎勵
   */
  showBonusReward(position, amount) {
    const bonusText = this.scene.add.text(position.x + 20, position.y - 50, `+${amount}`, {
      fontSize: '12px',
      fill: '#00ff00',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 1
    });
    
    bonusText.setOrigin(0.5);
    bonusText.setDepth(190);
    
    // 獎勵文字動畫
    this.scene.tweens.add({
      targets: bonusText,
      y: bonusText.y - 25,
      alpha: 0,
      scale: 1.3,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        bonusText.destroy();
      }
    });
  }

  /**
   * 重置連擊計時器
   */
  resetComboTimer() {
    // 清除之前的計時器
    if (this.comboTimer) {
      this.comboTimer.destroy();
    }
    
    // 設置新的計時器
    this.comboTimer = this.scene.time.delayedCall(this.comboTimeWindow, () => {
      this.endCombo();
    });
  }

  /**
   * 結束連擊
   */
  endCombo() {
    if (this.comboCount > 1) {
      console.log(`🏁 連擊結束，最終連擊: ${this.comboCount}`);
    }
    
    this.comboCount = 0;
    this.comboMultiplier = 1.0;
    this.hideComboDisplay();
  }

  /**
   * 獲取連擊統計
   */
  getComboStats() {
    return {
      currentCombo: this.comboCount,
      maxCombo: this.maxCombo,
      currentMultiplier: this.comboMultiplier
    };
  }

  /**
   * 重置連擊統計
   */
  reset() {
    this.endCombo();
    this.maxCombo = 0;
    console.log('🔄 連擊系統已重置');
  }

  /**
   * 銷毀連擊系統
   */
  destroy() {
    if (this.comboTimer) {
      this.comboTimer.destroy();
    }
    
    if (this.comboDisplay) {
      this.comboDisplay.destroy();
    }
    
    this.scene.events.off('enemyKilled', this.onEnemyKilled, this);
    
    console.log('🗑️ 連擊系統已銷毀');
  }
}
