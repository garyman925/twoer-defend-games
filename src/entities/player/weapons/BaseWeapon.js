/**
 * 武器基類
 * 所有武器的基礎類別，定義共通介面和行為
 */

export class BaseWeapon {
  constructor(scene, player, config) {
    this.scene = scene;
    this.player = player;
    this.config = config;
    
    // 武器狀態
    this.isActive = true;
    this.isFiring = false;
    
    // 投射物池
    this.projectiles = [];
    this.projectilePool = [];
    this.maxProjectiles = 50;
    
    // 視覺效果
    this.muzzleFlash = null;
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
  }

  /**
   * 初始化武器
   */
  init() {
    this.createProjectilePool();
    this.createVisualEffects();
  }

  /**
   * 創建投射物池
   */
  createProjectilePool() {
    for (let i = 0; i < this.maxProjectiles; i++) {
      const projectile = this.createProjectile();
      projectile.setActive(false);
      projectile.setVisible(false);
      this.projectilePool.push(projectile);
    }
    
    console.log(`✅ ${this.config.displayName} 投射物池創建完成: ${this.maxProjectiles}`);
  }

  /**
   * 創建單個投射物（子類需實現）
   */
  createProjectile() {
    // 基礎投射物
    const projectile = this.scene.add.circle(0, 0, this.config.visuals.projectileSize || 4);
    projectile.setFillStyle(parseInt(this.config.visuals.projectileColor) || 0x00ffff);
    
    // 添加物理
    this.scene.physics.add.existing(projectile);
    projectile.body.setCircle(this.config.visuals.projectileSize || 4);
    
    // 投射物屬性
    projectile.damage = this.config.stats.damage;
    projectile.weaponType = this.config.id;
    
    return projectile;
  }

  /**
   * 創建視覺效果
   */
  createVisualEffects() {
    // 槍口閃光（可選）
    if (this.config.visuals.muzzleFlashColor) {
      this.muzzleFlash = this.scene.add.circle(0, 0, 15, parseInt(this.config.visuals.muzzleFlashColor), 0.8);
      this.muzzleFlash.setVisible(false);
    }
  }

  /**
   * 發射武器（子類可重寫）
   */
  fire(targetX, targetY) {
    // 從池中獲取投射物
    const projectile = this.getProjectileFromPool();
    if (!projectile) {
      console.warn('⚠️ 投射物池已滿');
      return null;
    }
    
    // 設置投射物位置
    projectile.setPosition(this.player.x, this.player.y);
    projectile.setActive(true);
    projectile.setVisible(true);
    
    // 計算方向
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    
    // 設置速度
    const speed = this.config.stats.projectileSpeed || 600;
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    // 設置角度（視覺）
    projectile.rotation = angle;
    
    // 投射物生命週期
    this.scene.time.delayedCall(3000, () => {
      this.returnProjectileToPool(projectile);
    });
    
    // 顯示槍口閃光
    this.showMuzzleFlash();
    
    // 🆕 播放射擊音效
    this.playFireSound();
    
    return projectile;
  }

  /**
   * 🆕 播放射擊音效
   */
  playFireSound() {
    if (this.config.audio && this.config.audio.fireSound) {
      // 使用場景的音效播放方法
      if (this.scene.playSound) {
        this.scene.playSound(this.config.audio.fireSound);
      }
    }
  }

  /**
   * 從池中獲取投射物
   */
  getProjectileFromPool() {
    for (let i = 0; i < this.projectilePool.length; i++) {
      const projectile = this.projectilePool[i];
      if (!projectile.active) {
        return projectile;
      }
    }
    return null;
  }

  /**
   * 歸還投射物到池
   */
  returnProjectileToPool(projectile) {
    if (projectile && projectile.active) {
      projectile.setActive(false);
      projectile.setVisible(false);
      projectile.body.setVelocity(0, 0);
    }
  }

  /**
   * 顯示槍口閃光（增強版）
   */
  showMuzzleFlash() {
    if (!this.muzzleFlash) return;
    
    // 計算玩家朝向的方向
    const rotation = this.player.rotation || 0;
    const offset = 20; // 槍口偏移距離
    const flashX = this.player.x + Math.cos(rotation) * offset;
    const flashY = this.player.y + Math.sin(rotation) * offset;
    
    this.muzzleFlash.setPosition(flashX, flashY);
    this.muzzleFlash.setVisible(true);
    this.muzzleFlash.setAlpha(1);
    this.muzzleFlash.setScale(1);
    
    // 🆕 增強動畫：縮放 + 淡出
    this.scene.tweens.add({
      targets: this.muzzleFlash,
      alpha: 0,
      scale: 1.5,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.muzzleFlash.setVisible(false);
        this.muzzleFlash.setScale(1);
      }
    });
  }

  /**
   * 更新武器（每幀調用）
   */
  update(time, delta) {
    // 更新活躍的投射物
    this.projectilePool.forEach(projectile => {
      if (projectile.active) {
        this.updateProjectile(projectile, time, delta);
      }
    });
  }

  /**
   * 更新投射物（子類可重寫）
   */
  updateProjectile(projectile, time, delta) {
    // 檢查是否超出範圍
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      projectile.x, projectile.y
    );
    
    if (distance > (this.config.stats.range || 600)) {
      this.returnProjectileToPool(projectile);
    }
  }

  /**
   * 開始射擊
   */
  startFiring() {
    this.isFiring = true;
  }

  /**
   * 停止射擊
   */
  stopFiring() {
    this.isFiring = false;
  }

  /**
   * 銷毀武器
   */
  destroy() {
    // 清理投射物
    this.projectilePool.forEach(projectile => {
      if (projectile) {
        projectile.destroy();
      }
    });
    
    this.projectilePool = [];
    this.projectiles = [];
    
    // 清理視覺效果
    if (this.muzzleFlash) {
      this.muzzleFlash.destroy();
      this.muzzleFlash = null;
    }
    
    // 清理事件
    this.eventEmitter.removeAllListeners();
  }
}

