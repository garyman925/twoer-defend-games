/**
 * 玩家類
 * 處理玩家角色的所有邏輯，包括位置、生命值、武器等
 */

import GameConfig from '../../core/GameConfig.js';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    console.log('🎮 創建玩家，位置:', x, y);
    
    // 基本屬性
    this.health = GameConfig.PLAYER.HEALTH.MAX;
    this.maxHealth = GameConfig.PLAYER.HEALTH.MAX;
    this.isAlive = true;
    this.lives = 3; // 玩家生命次數
    this.money = GameConfig.RESOURCES.STARTING_MONEY; // 初始金錢
    
    // 武器相關
    this.weapon = null;
    this.isImmune = false;
    this.immunityDuration = 1000; // 受傷後1秒無敵時間
    
    // 移動相關
    this.moveSpeed = 300; // 移動速度
    this.velocity = { x: 0, y: 0 };
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    
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
    console.log('🎮 玩家已添加到場景，容器位置:', this.x, this.y);
    console.log('🎮 玩家容器可見性:', this.visible);
    console.log('🎮 玩家容器縮放:', this.scaleX, this.scaleY);
    
  }

  /**
   * 初始化玩家
   */
  init() {
    // 創建玩家視覺
    this.createPlayerVisuals();
    
    // 創建生命值條
    this.createHealthBar();
    
    // 創建武器
    this.createWeapon();
    
    // 設置物理體
    this.setupCollision();
    
    // 設置輸入
    this.setupInput();
  }

  /**
   * 創建玩家視覺
   */
  createPlayerVisuals() {
    console.log('🎮 開始創建玩家視覺');
    
    // 檢查資源是否存在
    if (!this.scene.textures.exists('player_idle')) {
      console.error('❌ player_idle 資源不存在');
      return;
    }
    
    // 創建玩家動畫精靈
    this.playerSprite = this.scene.add.sprite(0, 0, 'player_idle');
    this.playerSprite.setScale(0.1); // 縮小到10%
    this.playerSprite.setOrigin(0.5, 0.5); // 設置錨點為中心
    this.playerSprite.setRotation(Math.PI / 2); // 向右轉90度
    
    console.log('🎮 玩家精靈創建完成，位置:', this.playerSprite.x, this.playerSprite.y);
    console.log('🎮 玩家精靈縮放:', this.playerSprite.scaleX, this.playerSprite.scaleY);
    
    // 檢查動畫是否存在
    if (this.scene.anims.exists('player_idle_anim')) {
      console.log('✅ 播放玩家待機動畫');
      this.playerSprite.play('player_idle_anim');
    } else {
      console.warn('⚠️ 玩家待機動畫不存在，使用靜態圖片');
      this.playerSprite.setFrame('player_idle1_1_0.png');
    }
    
    this.add(this.playerSprite);
    console.log('🎮 玩家視覺創建完成');
    
    // 創建傷害閃光效果
    this.damageFlash = this.scene.add.rectangle(0, 0, 100, 100, 0xff0000, 0);
    this.damageFlash.setOrigin(0.5, 0.5);
    this.add(this.damageFlash);
  }

  /**
   * 創建生命值條
   */
  createHealthBar() {
    // 生命值條背景
    const healthBarBg = this.scene.add.rectangle(0, 50, 80, 8, 0x333333);
    healthBarBg.setOrigin(0.5, 1);
    this.add(healthBarBg);
    
    // 生命值條填充
    this.healthBarFill = this.scene.add.rectangle(0, 50, 80, 8, 0x00ff00);
    this.healthBarFill.setOrigin(0.5, 1);
    this.add(this.healthBarFill);
    
    // 生命值文字
    this.healthText = this.scene.add.text(0, 50, `${this.health}/${this.maxHealth}`, {
      fontSize: '12px',
      fill: '#ffffff',
      strokeThickness: 1
    });
    this.healthText.setOrigin(0.5, 1);
    this.add(this.healthText);
  }

  /**
   * 創建武器
   */
  createWeapon() {
    console.log('🔫 開始創建武器');
    
    // 導入武器類別
    const { PlayerWeapon } = require('./PlayerWeapon.js');
    this.weapon = new PlayerWeapon(this.scene, this);
    this.weapon.setPosition(0, 0); // 確保武器在玩家中心
    this.add(this.weapon);
    
    console.log('🔫 武器創建完成:', this.weapon ? '成功' : '失敗');
  }

  /**
   * 設置碰撞
   */
  setupCollision() {
    // 啟用物理體
    this.scene.physics.world.enable(this);
    
    // 設置碰撞體 - 基於玩家精靈的縮放尺寸動態設置
    const collisionRadius = (this.playerSprite ? this.playerSprite.displayWidth : 106) * 0.4;
    this.body.setCircle(collisionRadius);
    this.body.setImmovable(true);
  }

  /**
   * 設置輸入
   */
  setupInput() {
    // 滑鼠輸入
    this.scene.input.on('pointerdown', this.handleMouseDown, this);
    this.scene.input.on('pointerup', this.handleMouseUp, this);
    this.scene.input.on('pointermove', this.handleMouseMove, this);
    
    // 鍵盤輸入 - 改為持續監聽
    this.scene.input.keyboard.on('keydown-W', () => { this.keys.up = true; }, this);
    this.scene.input.keyboard.on('keydown-A', () => { this.keys.left = true; }, this);
    this.scene.input.keyboard.on('keydown-S', () => { this.keys.down = true; }, this);
    this.scene.input.keyboard.on('keydown-D', () => { this.keys.right = true; }, this);
    this.scene.input.keyboard.on('keydown-UP', () => { this.keys.up = true; }, this);
    this.scene.input.keyboard.on('keydown-LEFT', () => { this.keys.left = true; }, this);
    this.scene.input.keyboard.on('keydown-DOWN', () => { this.keys.down = true; }, this);
    this.scene.input.keyboard.on('keydown-RIGHT', () => { this.keys.right = true; }, this);
    
    this.scene.input.keyboard.on('keyup-W', () => { this.keys.up = false; }, this);
    this.scene.input.keyboard.on('keyup-A', () => { this.keys.left = false; }, this);
    this.scene.input.keyboard.on('keyup-S', () => { this.keys.down = false; }, this);
    this.scene.input.keyboard.on('keyup-D', () => { this.keys.right = false; }, this);
    this.scene.input.keyboard.on('keyup-UP', () => { this.keys.up = false; }, this);
    this.scene.input.keyboard.on('keyup-LEFT', () => { this.keys.left = false; }, this);
    this.scene.input.keyboard.on('keyup-DOWN', () => { this.keys.down = false; }, this);
    this.scene.input.keyboard.on('keyup-RIGHT', () => { this.keys.right = false; }, this);
  }

  /**
   * 更新玩家
   */
  update(time, delta) {
    if (!this.isAlive) return;
    
    // 更新移動
    this.handleMovement(time, delta);
    
    // 更新滑鼠跟隨轉向
    this.updateMouseRotation(time, delta);
    
    // 更新武器
    if (this.weapon) {
      this.weapon.update(time, delta);
    }
    
    // 更新無敵時間
    this.updateImmunity(time);
  }

  /**
   * 處理移動
   */
  handleMovement(time, delta) {
    // 重置速度
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    // 根據按鍵設置速度
    if (this.keys.up) {
      this.velocity.y = -this.moveSpeed;
    }
    if (this.keys.down) {
      this.velocity.y = this.moveSpeed;
    }
    if (this.keys.left) {
      this.velocity.x = -this.moveSpeed;
    }
    if (this.keys.right) {
      this.velocity.x = this.moveSpeed;
    }
    
    // 對角線移動速度調整
    if (this.velocity.x !== 0 && this.velocity.y !== 0) {
      this.velocity.x *= 0.707; // 1/√2
      this.velocity.y *= 0.707;
    }
    
    // 更新位置
    this.x += this.velocity.x * (delta / 1000);
    this.y += this.velocity.y * (delta / 1000);
    
    // 檢查邊界
    this.checkBoundaries();
  }

  /**
   * 檢查邊界
   */
  checkBoundaries() {
    const { width, height } = this.scene.scale.gameSize;
    
    // 限制在屏幕範圍內
    this.x = Phaser.Math.Clamp(this.x, 50, width - 50);
    this.y = Phaser.Math.Clamp(this.y, 50, height - 50);
  }

  /**
   * 處理滑鼠移動
   */
  handleMouseMove(pointer) {
    if (!this.isAlive) return;
    
    // 更新武器瞄準
    if (this.weapon) {
      this.weapon.updateAim(pointer.worldX, pointer.worldY);
    }
  }

  /**
   * 更新滑鼠跟隨轉向
   */
  updateMouseRotation(time, delta) {
    if (!this.isAlive) return;
    
    // 獲取滑鼠位置
    const mouseX = this.scene.input.mousePointer.x;
    const mouseY = this.scene.input.mousePointer.y;
    
    // 計算目標角度
    const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, mouseX, mouseY);
    
    // 平滑旋轉到目標角度
    const rotationSpeed = 0.1; // 旋轉速度 (0.1 = 較慢，0.5 = 較快)
    this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, targetAngle, rotationSpeed);
  }

  /**
   * 處理滑鼠按下
   */
  handleMouseDown(pointer) {
    if (!this.isAlive) return;
    
    console.log('🎯 滑鼠按下，武器狀態:', this.weapon ? '存在' : '不存在');
    
    // 開始射擊
    if (this.weapon) {
      console.log('🎯 開始射擊');
      this.weapon.startFiring();
    } else {
      console.log('❌ 武器不存在');
    }
  }

  /**
   * 處理滑鼠釋放
   */
  handleMouseUp(pointer) {
    if (!this.isAlive) return;
    
    // 停止射擊
    if (this.weapon) {
      this.weapon.stopFiring();
    }
  }

  /**
   * 受到傷害
   */
  takeDamage(damage) {
    if (!this.isAlive || this.isImmune) return false;
    
    this.health -= damage;
    this.updateHealthBar();
    
    // 設置無敵時間
    this.setImmunity();
    
    // 播放受傷效果
    this.playDamageEffect();
    
    // 發送受傷事件
    this.eventEmitter.emit('playerDamaged', {
      currentHealth: this.health,
      maxHealth: this.maxHealth,
      damage: damage
    });
    
    // 檢查是否死亡
    if (this.health <= 0) {
      this.die();
    }
    
    return true;
  }

  /**
   * 死亡
   */
  die() {
    if (!this.isAlive) return;
    
    this.isAlive = false;
    this.lives--;
    
    console.log(`玩家死亡，剩餘生命: ${this.lives}`);
    
    if (this.lives > 0) {
      // 還有生命，復活
      this.respawn();
    } else {
      // 沒有生命了，播放死亡動畫
      this.playDeathAnimation();
    }
  }

  /**
   * 復活
   */
  respawn() {
    console.log('玩家復活');
    
    // 重置狀態
    this.isAlive = true;
    this.health = this.maxHealth;
    this.isImmune = false;
    
    // 重置位置到中心
    const { width, height } = this.scene.scale.gameSize;
    this.x = width / 2;
    this.y = height / 2;
    
    // 更新生命值條
    this.updateHealthBar();
    
    // 重置視覺
    this.playerSprite.setVisible(true);
    this.damageFlash.setAlpha(0);
  }

  /**
   * 播放死亡動畫
   */
  playDeathAnimation() {
    console.log('播放玩家死亡動畫');
    
    // 隱藏玩家精靈
    this.playerSprite.setVisible(false);
    
    // 創建爆炸動畫
    const explosion = this.scene.add.sprite(this.x, this.y, 'player-explosion');
    explosion.setScale(this.playerSprite.scaleX); // 使用玩家的縮放比例
    explosion.setOrigin(0.5, 0.5);
    
    // 播放爆炸動畫
    explosion.play('blue_explosion_lv1');
    
    // 動畫完成後發送死亡事件
    explosion.on('animationcomplete', () => {
      explosion.destroy();
      this.eventEmitter.emit('playerDied');
    });
  }

  /**
   * 更新生命值條
   */
  updateHealthBar() {
    const healthPercentage = this.health / this.maxHealth;
    
    // 更新生命值條寬度
    this.healthBarFill.scaleX = healthPercentage;
    
    // 更新生命值文字
    this.healthText.setText(`${this.health}/${this.maxHealth}`);
    
    // 根據生命值改變顏色
    if (healthPercentage > 0.6) {
      this.healthBarFill.setFillStyle(0x00ff00); // 綠色
    } else if (healthPercentage > 0.3) {
      this.healthBarFill.setFillStyle(0xffff00); // 黃色
    } else {
      this.healthBarFill.setFillStyle(0xff0000); // 紅色
    }
  }

  /**
   * 設置無敵時間
   */
  setImmunity() {
    this.isImmune = true;
    this.immunityStartTime = this.scene.time.now;
  }

  /**
   * 更新無敵時間
   */
  updateImmunity(time) {
    if (time.now - this.immunityStartTime >= this.immunityDuration) {
      this.isImmune = false;
    }
  }

  /**
   * 播放受傷效果
   */
  playDamageEffect() {
    // 傷害閃光
    this.damageFlash.setAlpha(0.5);
    this.scene.tweens.add({
      targets: this.damageFlash,
      alpha: 0,
      duration: 200,
      ease: 'Power2'
    });
    
    // 屏幕震動
    if (this.scene.screenShake) {
      this.scene.screenShake.shake(200, 0.01);
    }
  }

  /**
   * 銷毀玩家
   */
  destroy() {
    // 移除事件監聽
    this.scene.input.off('pointerdown', this.handleMouseDown, this);
    this.scene.input.off('pointerup', this.handleMouseUp, this);
    this.scene.input.off('pointermove', this.handleMouseMove, this);
    
    // 銷毀武器
    if (this.weapon) {
      this.weapon.destroy();
    }
    
    super.destroy();
  }
}