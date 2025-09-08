/**
 * 玩家類
 * 處理玩家角色的所有邏輯，包括位置、生命值、武器等
 */

import GameConfig from '../../core/GameConfig.js';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    // 基本屬性
    this.health = GameConfig.PLAYER.HEALTH.MAX;
    this.maxHealth = GameConfig.PLAYER.HEALTH.MAX;
    this.isAlive = true;
    
    // 武器相關
    this.weapon = null;
    this.isImmune = false;
    this.immunityDuration = 1000; // 受傷後1秒無敵時間
    
    // 視覺組件
    this.playerSprite = null;
    this.healthBar = null;
    this.damageFlash = null;
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 初始化玩家
    this.init();
    
    // 添加到場景
    scene.add.existing(this);
    
    console.log('玩家創建完成');
  }

  /**
   * 初始化玩家
   */
  init() {
    // 創建玩家視覺元素
    this.createPlayerVisuals();
    
    // 創建武器
    this.createWeapon();
    
    // 創建生命值條
    this.createHealthBar();
    
    // 設置碰撞檢測
    this.setupCollision();
    
    // 設置輸入處理
    this.setupInput();
  }

  /**
   * 創建玩家視覺元素
   */
  createPlayerVisuals() {
    // 玩家主體（使用簡單圖形作為佔位）
    this.playerSprite = this.scene.add.circle(0, 0, 20, 0x00ffff);
    this.playerSprite.setStrokeStyle(3, 0xffffff);
    this.add(this.playerSprite);
    
    // 玩家方向指示器
    this.directionIndicator = this.scene.add.triangle(0, -25, 0, 0, -8, 15, 8, 15, 0x00ff00);
    this.add(this.directionIndicator);
    
    // 傷害閃爍效果
    this.damageFlash = this.scene.add.circle(0, 0, 25, 0xff0000, 0);
    this.add(this.damageFlash);
    
    // 玩家範圍圈（顯示攻擊範圍）
    this.rangeCircle = this.scene.add.circle(0, 0, GameConfig.PLAYER.WEAPON.RANGE, 0x00ffff, 0);
    this.rangeCircle.setStrokeStyle(1, 0x00ffff, 0.3);
    this.rangeCircle.setVisible(false);
    this.add(this.rangeCircle);
  }

  /**
   * 創建武器
   */
  createWeapon() {
    // 暫時創建簡單武器，避免循環依賴
    this.weapon = {
      setTargetAngle: (angle) => { this.targetAngle = angle; },
      startShooting: () => { this.isShooting = true; },
      stopShooting: () => { this.isShooting = false; },
      update: () => {},
      getStatus: () => ({ damage: 30, fireRate: 500 }),
      upgrade: () => {},
      reset: () => {},
      destroy: () => {},
      isShooting: false
    };
  }

  /**
   * 創建生命值條
   */
  createHealthBar() {
    // 生命值條背景
    this.healthBarBg = this.scene.add.rectangle(0, -40, 50, 8, 0x444444);
    this.healthBarBg.setStrokeStyle(1, 0xffffff);
    this.add(this.healthBarBg);
    
    // 生命值條前景
    this.healthBar = this.scene.add.rectangle(-23, -40, 46, 6, 0x00ff00);
    this.healthBar.setOrigin(0, 0.5);
    this.add(this.healthBar);
    
    // 生命值文字
    this.healthText = this.scene.add.text(0, -55, `${this.health}/${this.maxHealth}`, {
      fontSize: '12px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    });
    this.healthText.setOrigin(0.5);
    this.add(this.healthText);
  }

  /**
   * 設置碰撞檢測
   */
  setupCollision() {
    // 為玩家創建物理體
    this.scene.physics.world.enable(this);
    this.body.setCircle(20);
    this.body.setImmovable(true);
    
    // 設置碰撞組
    this.body.checkCollision.none = false;
  }

  /**
   * 設置輸入處理
   */
  setupInput() {
    // 滑鼠移動事件
    this.scene.input.on('pointermove', this.handleMouseMove, this);
    
    // 滑鼠點擊事件
    this.scene.input.on('pointerdown', this.handleMouseDown, this);
    this.scene.input.on('pointerup', this.handleMouseUp, this);
    
    // 鍵盤事件
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasdKeys = this.scene.input.keyboard.addKeys('W,S,A,D');
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    console.log('玩家輸入設置完成');
  }

  /**
   * 處理滑鼠移動
   */
  handleMouseMove(pointer) {
    if (!this.isAlive) return;
    
    // 計算滑鼠相對於玩家的角度
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
    
    // 更新武器方向
    if (this.weapon) {
      this.weapon.setTargetAngle(angle);
    }
    
    // 更新方向指示器
    this.directionIndicator.setRotation(angle + Math.PI / 2);
  }

  /**
   * 處理滑鼠按下
   */
  handleMouseDown(pointer) {
    if (!this.isAlive) return;
    
    if (pointer.leftButtonDown()) {
      // 開始射擊
      if (this.weapon) {
        this.weapon.startShooting();
      }
      
      // 顯示射程範圍
      this.showRange(true);
    }
  }

  /**
   * 處理滑鼠放開
   */
  handleMouseUp(pointer) {
    if (!this.isAlive) return;
    
    if (pointer.leftButtonReleased()) {
      // 停止射擊
      if (this.weapon) {
        this.weapon.stopShooting();
      }
      
      // 隱藏射程範圍
      this.showRange(false);
    }
  }

  /**
   * 顯示/隱藏射程範圍
   */
  showRange(visible) {
    if (this.rangeCircle) {
      this.rangeCircle.setVisible(visible);
      
      if (visible) {
        // 範圍圈脈衝動畫
        this.scene.tweens.add({
          targets: this.rangeCircle,
          alpha: { from: 0.3, to: 0.1 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else {
        // 停止動畫
        this.scene.tweens.killTweensOf(this.rangeCircle);
        this.rangeCircle.setAlpha(0.3);
      }
    }
  }

  /**
   * 更新玩家邏輯
   */
  update(time, delta) {
    if (!this.isAlive) return;
    
    // 更新武器
    if (this.weapon) {
      this.weapon.update(time, delta);
    }
    
    // 處理鍵盤輸入
    this.handleKeyboardInput();
    
    // 更新無敵狀態
    this.updateImmunity(delta);
  }

  /**
   * 處理鍵盤輸入
   */
  handleKeyboardInput() {
    // 空白鍵射擊
    if (this.spaceKey.isDown) {
      if (this.weapon && !this.weapon.isShooting) {
        this.weapon.startShooting();
        this.showRange(true);
      }
    } else {
      if (this.weapon && this.weapon.isShooting) {
        this.weapon.stopShooting();
        this.showRange(false);
      }
    }
    
    // R鍵重新裝彈（如果有裝彈機制的話）
    const rKey = this.scene.input.keyboard.addKey('R');
    if (Phaser.Input.Keyboard.JustDown(rKey)) {
      if (this.weapon) {
        this.weapon.reload();
      }
    }
  }

  /**
   * 更新無敵狀態
   */
  updateImmunity(delta) {
    if (this.isImmune) {
      this.immunityTime -= delta;
      
      if (this.immunityTime <= 0) {
        this.isImmune = false;
        this.setAlpha(1); // 恢復正常透明度
      }
    }
  }

  /**
   * 玩家受傷
   */
  takeDamage(damage) {
    if (!this.isAlive || this.isImmune) return false;
    
    // 減少生命值
    this.health -= damage;
    this.health = Math.max(0, this.health);
    
    console.log(`玩家受到 ${damage} 點傷害，剩餘生命: ${this.health}`);
    
    // 更新生命值條
    this.updateHealthBar();
    
    // 播放受傷效果
    this.playDamageEffect();
    
    // 播放受傷音效
    this.scene.playSound && this.scene.playSound('player_hurt');
    
    // 設置無敵時間
    this.setImmunity();
    
    // 發送受傷事件
    this.eventEmitter.emit('playerDamaged', {
      damage: damage,
      currentHealth: this.health,
      maxHealth: this.maxHealth
    });
    
    // 檢查是否死亡
    if (this.health <= 0) {
      this.die();
    }
    
    return true;
  }

  /**
   * 更新生命值條
   */
  updateHealthBar() {
    const healthPercentage = this.health / this.maxHealth;
    
    // 更新生命值條寬度
    this.healthBar.scaleX = healthPercentage;
    
    // 根據生命值改變顏色
    if (healthPercentage > 0.6) {
      this.healthBar.setFillStyle(0x00ff00); // 綠色
    } else if (healthPercentage > 0.3) {
      this.healthBar.setFillStyle(0xffff00); // 黃色
    } else {
      this.healthBar.setFillStyle(0xff0000); // 紅色
    }
    
    // 更新生命值文字
    this.healthText.setText(`${this.health}/${this.maxHealth}`);
    
    // 生命值條動畫
    this.scene.tweens.add({
      targets: this.healthBar,
      scaleY: { from: 1.5, to: 1 },
      duration: 200,
      ease: 'Power2'
    });
  }

  /**
   * 播放受傷效果
   */
  playDamageEffect() {
    // 傷害閃爍
    this.damageFlash.setAlpha(0.7);
    this.scene.tweens.add({
      targets: this.damageFlash,
      alpha: 0,
      duration: 300,
      ease: 'Power2'
    });
    
    // 玩家震動
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 5, to: this.x + 5 },
      duration: 50,
      yoyo: true,
      repeat: 3
    });
    
    // 螢幕震動
    this.scene.cameras.main.shake(200, 0.01);
  }

  /**
   * 設置無敵狀態
   */
  setImmunity() {
    this.isImmune = true;
    this.immunityTime = this.immunityDuration;
    
    // 閃爍效果
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.5 },
      duration: 100,
      yoyo: true,
      repeat: Math.floor(this.immunityDuration / 200)
    });
  }

  /**
   * 治療
   */
  heal(amount) {
    if (!this.isAlive) return;
    
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    
    if (this.health > oldHealth) {
      console.log(`玩家恢復 ${this.health - oldHealth} 點生命`);
      
      // 更新生命值條
      this.updateHealthBar();
      
      // 治療效果
      this.playHealEffect();
      
      // 發送治療事件
      this.eventEmitter.emit('playerHealed', {
        amount: this.health - oldHealth,
        currentHealth: this.health,
        maxHealth: this.maxHealth
      });
    }
  }

  /**
   * 播放治療效果
   */
  playHealEffect() {
    // 綠色治療光效
    const healEffect = this.scene.add.circle(0, 0, 30, 0x00ff00, 0.5);
    this.add(healEffect);
    
    this.scene.tweens.add({
      targets: healEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        healEffect.destroy();
      }
    });
    
    // 播放治療音效
    this.scene.playSound && this.scene.playSound('player_heal');
  }

  /**
   * 玩家死亡
   */
  die() {
    if (!this.isAlive) return;
    
    this.isAlive = false;
    console.log('玩家死亡');
    
    // 停止射擊
    if (this.weapon) {
      this.weapon.stopShooting();
    }
    
    // 播放死亡動畫
    this.playDeathAnimation();
    
    // 播放死亡音效
    this.scene.playSound && this.scene.playSound('player_death');
    
    // 發送死亡事件
    this.eventEmitter.emit('playerDied');
    
    // 觸發遊戲結束
    this.scene.events.emit('playerDied');
  }

  /**
   * 播放死亡動畫
   */
  playDeathAnimation() {
    // 玩家爆炸效果
    const explosionParticles = this.scene.add.particles(this.x, this.y, 'explosion', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      quantity: 20,
      lifespan: 1000
    });
    
    // 玩家淡出
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 1000,
      ease: 'Power2'
    });
    
    // 螢幕震動
    this.scene.cameras.main.shake(1000, 0.02);
  }

  /**
   * 升級武器
   */
  upgradeWeapon(upgradeType, level) {
    if (this.weapon) {
      this.weapon.upgrade(upgradeType, level);
    }
  }

  /**
   * 獲取玩家狀態
   */
  getStatus() {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      isAlive: this.isAlive,
      isImmune: this.isImmune,
      position: { x: this.x, y: this.y },
      weaponStatus: this.weapon ? this.weapon.getStatus() : null
    };
  }

  /**
   * 重置玩家狀態
   */
  reset() {
    this.health = this.maxHealth;
    this.isAlive = true;
    this.isImmune = false;
    this.setAlpha(1);
    
    // 重置武器
    if (this.weapon) {
      this.weapon.reset();
    }
    
    // 更新生命值條
    this.updateHealthBar();
    
    console.log('玩家狀態已重置');
  }

  /**
   * 銷毀玩家
   */
  destroy() {
    // 移除事件監聽器
    this.scene.input.off('pointermove', this.handleMouseMove, this);
    this.scene.input.off('pointerdown', this.handleMouseDown, this);
    this.scene.input.off('pointerup', this.handleMouseUp, this);
    
    // 清理事件發送器
    this.eventEmitter.removeAllListeners();
    
    // 銷毀武器
    if (this.weapon) {
      this.weapon.destroy();
    }
    
    super.destroy();
    
    console.log('玩家已銷毀');
  }
}

export default Player;
