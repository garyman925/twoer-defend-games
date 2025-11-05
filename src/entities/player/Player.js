/**
 * 玩家類
 * 處理玩家角色的所有邏輯，包括位置、生命值、武器等
 */

import GameConfig from '../../core/GameConfig.js';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    console.log('🎮 創建玩家，位置:', x, y);
    
    // 🆕 讀取升級數據
    this.upgrades = this.loadUpgrades();
    
    // 基本屬性（應用升級）
    this.maxHealth = this.upgrades.health?.currentValue || GameConfig.PLAYER.HEALTH.MAX;
    this.health = this.maxHealth;
    this.isAlive = true;
    // this.lives = 3; // ❌ 已移除：不再使用 lives 系統，改用 10 格血量系統
    this.money = GameConfig.RESOURCES.STARTING_MONEY; // 初始金錢
    
    // 武器相關
    this.weapon = null;
    this.isImmune = false;
    this.immunityDuration = 1000; // 受傷後1秒無敵時間
    
    // 移動相關（應用升級）
    this.moveSpeed = this.upgrades.moveSpeed?.currentValue || GameConfig.PLAYER.MOVEMENT.SPEED || 300;
    this.velocity = { x: 0, y: 0 };
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    
    console.log('✅ 玩家屬性已應用升級:');
    console.log('   生命值:', this.maxHealth);
    console.log('   移動速度:', this.moveSpeed);
    
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
   * 🆕 讀取升級數據
   */
  loadUpgrades() {
    try {
      const config = JSON.parse(localStorage.getItem('playerShipConfig') || '{}');
      return config.upgrades || {};
    } catch (error) {
      console.warn('⚠️ 讀取升級數據失敗:', error);
      return {};
    }
  }

  /**
   * 初始化玩家
   */
  init() {
    // 創建玩家視覺
    this.createPlayerVisuals();
    
    // ❌ 移除玩家底下的生命值條（血量顯示在 UI 上）
    // this.createHealthBar();
    
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
    
    // ✅ 改為 false，避免碰撞後被"卡住"
    this.body.setImmovable(false);
    
    // ❌ 移除邊界碰撞限制（無邊界地圖）
    // this.body.setCollideWorldBounds(true);
    
    console.log('🎮 玩家物理體設置完成（無邊界模式）');
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
    
    // 🆕 更新新武器系統（持續射擊）
    if (this.scene.weaponManager) {
      const currentWeapon = this.scene.weaponManager.getCurrentWeaponState();
      if (currentWeapon && currentWeapon.weapon) {
        const weaponInstance = this.scene.weaponManager.weaponInstances.get(currentWeapon.weapon.id);
        
        // 如果正在射擊，持續發射
        if (weaponInstance && weaponInstance.isFiring) {
          const pointer = this.scene.input.activePointer;
          const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
          this.scene.weaponManager.fire(worldPoint.x, worldPoint.y);
        }
      }
    } else if (this.weapon) {
      // 備用：舊武器系統
      this.weapon.update(time, delta);
    }
    
    // 更新無敵時間
    this.updateImmunity(time);
  }

  /**
   * 處理移動
   */
  handleMovement(time, delta) {
    // ✅ 添加調試：檢查是否能接收輸入
    const hasInput = this.keys.up || this.keys.down || this.keys.left || this.keys.right;
    
    if (hasInput) {
      console.log('🎮 玩家輸入檢測:', {
        up: this.keys.up,
        down: this.keys.down,
        left: this.keys.left,
        right: this.keys.right,
        isAlive: this.isAlive,
        position: { x: this.x, y: this.y }
      });
    }
    
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
    
    // ✅ 添加調試：記錄位置更新
    const oldX = this.x;
    const oldY = this.y;
    
    // 更新位置
    this.x += this.velocity.x * (delta / 1000);
    this.y += this.velocity.y * (delta / 1000);
    
    if (this.x !== oldX || this.y !== oldY) {
      console.log('📍 玩家位置更新:', {
        from: { x: oldX, y: oldY },
        to: { x: this.x, y: this.y },
        velocity: { x: this.velocity.x, y: this.velocity.y }
      });
    }
    
    // ❌ 移除邊界檢查（無邊界地圖）
    // this.checkBoundaries();
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
    
    // 🆕 使用 WeaponManager 進行射擊
    if (this.scene.weaponManager) {
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      
      // 獲取當前武器實例
      const currentWeapon = this.scene.weaponManager.getCurrentWeaponState();
      if (currentWeapon && currentWeapon.weapon) {
        const weaponInstance = this.scene.weaponManager.weaponInstances.get(currentWeapon.weapon.id);
        if (weaponInstance) {
          weaponInstance.startFiring();
          console.log(`🎯 開始使用 ${currentWeapon.weapon.displayName}`);
        }
      }
    } else if (this.weapon) {
      // 備用：使用舊的武器系統
      console.log('🎯 開始射擊（舊系統）');
      this.weapon.startFiring();
    }
  }

  /**
   * 處理滑鼠釋放
   */
  handleMouseUp(pointer) {
    if (!this.isAlive) return;
    
    // 🆕 停止射擊
    if (this.scene.weaponManager) {
      const currentWeapon = this.scene.weaponManager.getCurrentWeaponState();
      if (currentWeapon && currentWeapon.weapon) {
        const weaponInstance = this.scene.weaponManager.weaponInstances.get(currentWeapon.weapon.id);
        if (weaponInstance) {
          weaponInstance.stopFiring();
        }
      }
    } else if (this.weapon) {
      // 備用：使用舊的武器系統
      this.weapon.stopFiring();
    }
  }

  /**
   * 受到傷害
   */
  takeDamage(damage) {
    console.log('💔 takeDamage() 被調用！');
    console.log('   damage:', damage);
    console.log('   當前血量:', this.health);
    console.log('   isAlive:', this.isAlive);
    console.log('   isImmune:', this.isImmune);
    
    if (!this.isAlive || this.isImmune) {
      console.log('   ⚠️ 無法受傷（已死或無敵）');
      return false;
    }
    
    // ✅ 立即設置無敵時間（在扣血之前，防止同一幀多次扣血）
    console.log('   → 調用 setImmunity()...');
    this.setImmunity();
    console.log('   ✓ setImmunity() 完成');
    
    // 扣除血量並確保不會是負數
    this.health -= damage;
    this.health = Math.max(0, this.health);
    console.log('   ✓ 扣血後血量:', this.health);
    
    this.updateHealthBar();
    
    // 播放受傷效果
    this.playDamageEffect();
    
    // 發送受傷事件
    this.eventEmitter.emit('playerDamaged', {
      currentHealth: this.health,
      maxHealth: this.maxHealth,
      damage: damage
    });
    
    // 檢查是否死亡（血量歸零才死亡）
    if (this.health <= 0) {
      console.log('   ☠️ 血量歸零，調用 die()');
      this.die();
    }
    
    console.log('   ✓ takeDamage() 完成');
    return true;
  }

  /**
   * 死亡
   */
  die() {
    if (!this.isAlive) return;
    
    this.isAlive = false;
    
    console.log('玩家死亡，血量歸零，遊戲結束');
    
    // 直接播放死亡動畫，不復活
    this.playDeathAnimation();
    
    // 通知場景遊戲結束
    this.eventEmitter.emit('playerDied');
  }

  /**
   * 復活（已停用 - 不再使用 lives 系統）
   */
  /*
  respawn() {
    // ❌ 已停用：不再需要復活功能，改用 10 格血量系統
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
  */

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
    // 🆕 如果生命值條不存在，不執行更新（已移除玩家底下的血條）
    if (!this.healthBarFill || !this.healthText) {
      return;
    }
    
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
    console.log('🛡️ 設置無敵狀態！');
    console.log('   this.scene:', this.scene ? '存在' : 'undefined');
    console.log('   this.scene.time:', this.scene && this.scene.time ? '存在' : 'undefined');
    console.log('   this.scene.time.now:', this.scene && this.scene.time ? this.scene.time.now : 'undefined');
    
    this.isImmune = true;
    
    // ✅ 安全設置無敵開始時間
    if (this.scene && this.scene.time && typeof this.scene.time.now === 'number') {
      this.immunityStartTime = this.scene.time.now;
      console.log('   ✓ 無敵開始時間:', this.immunityStartTime);
    } else {
      // 備用方案：使用 Date.now()
      this.immunityStartTime = Date.now();
      console.warn('   ⚠️ scene.time.now 不可用，使用 Date.now() 作為備用:', this.immunityStartTime);
    }
    
    // ✅ 將玩家重新定位到畫面中間（避免被敵人包圍）
    const { width, height } = this.scene.scale.gameSize;
    this.x = width / 2;
    this.y = height / 2;
    
    console.log('   ✓ 玩家重新定位到中心:', this.x, this.y);
    
    // ✅ 添加閃爍效果表示無敵狀態
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.add({
        targets: this,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 10, // 閃爍 10 次（約 1 秒）
        onComplete: () => {
          this.alpha = 1; // 恢復不透明
        }
      });
    }
  }

  /**
   * 更新無敵時間
   */
  updateImmunity(time) {
    if (this.isImmune) {
      // ✅ 添加安全檢查
      if (!time || typeof time.now !== 'number' || typeof this.immunityStartTime !== 'number') {
        console.warn('⚠️ 無敵時間數據無效:', {
          'time': time ? '存在' : 'undefined',
          'time.now': time ? time.now : 'undefined',
          'immunityStartTime': this.immunityStartTime
        });
        // 如果數據無效，直接結束無敵狀態
        this.isImmune = false;
        console.log('   → 強制結束無敵狀態（數據無效）');
        return;
      }
      
      const elapsed = time.now - this.immunityStartTime;
      console.log('⏱️ 無敵時間檢查:', {
        isImmune: this.isImmune,
        elapsed: elapsed.toFixed(0),
        duration: this.immunityDuration,
        remaining: (this.immunityDuration - elapsed).toFixed(0)
      });
      
      if (elapsed >= this.immunityDuration) {
        console.log('🛡️ 無敵狀態結束！經過時間:', elapsed.toFixed(0), 'ms');
        this.isImmune = false;
      }
    }
  }

  /**
   * 播放受傷效果
   */
  playDamageEffect() {
    // 檢查傷害閃光是否存在
    if (!this.damageFlash) {
      console.warn('⚠️ damageFlash 不存在，跳過傷害效果');
      return;
    }
    
    // 傷害閃光
    this.damageFlash.setAlpha(0.5);
    this.scene.tweens.add({
      targets: this.damageFlash,
      alpha: 0,
      duration: 200,
      ease: 'Power2'
    });
    
    // ❌ 屏幕震動已移除
    // if (this.scene.screenShake) {
    //   this.scene.screenShake.shake(200, 0.01);
    // }
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