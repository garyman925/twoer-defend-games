/**
 * 玩家武器系統
 * 處理玩家射擊、瞄準、武器升級等功能
 */

export class PlayerWeapon extends Phaser.GameObjects.Container {
  constructor(scene, player) {
    super(scene, 0, 0);
    
    this.scene = scene;
    this.player = player;
    
    // 武器屬性
    this.damage = 30;
    this.fireRate = 200; // 毫秒
    this.range = 300;
    this.accuracy = 0.9;
    this.piercing = 0;
    this.multiShot = 1;
    this.spreadAngle = 0.2;
    
    // 瞄準系統
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.aimLine = null;
    this.aimingSpeed = 0.1;
    
    // 射擊系統
    this.lastFireTime = 0;
    this.isFiring = false;
    this.projectiles = [];
    this.projectilePool = [];
    this.maxProjectiles = 50;
    
    // 視覺元素
    this.weaponSprite = null;
    this.muzzleFlash = null;
    this.recoilTween = null;
    
    this.init();
    scene.add.existing(this);
  }

  /**
   * 初始化武器
   */
  init() {
    // 創建武器視覺
    this.createWeaponVisuals();
    
    // 創建投射物池
    this.createProjectilePool();
    
    // 設置瞄準線
    this.createAimLine();
    
  }

  /**
   * 創建武器視覺
   */
  createWeaponVisuals() {
    // 創建武器精靈
    this.weaponSprite = this.scene.add.circle(0, 0, 8, 0x00ff00);
    this.weaponSprite.setStrokeStyle(2, 0xffffff);
    this.weaponSprite.setOrigin(0.5, 0.5);
    this.add(this.weaponSprite);
    
    // 創建槍口閃光
    this.muzzleFlash = this.scene.add.circle(0, 0, 15, 0xffff00, 0.8);
    this.muzzleFlash.setOrigin(0.5, 0.5);
    this.muzzleFlash.setVisible(false);
    this.add(this.muzzleFlash);
  }

  /**
   * 創建投射物池
   */
  createProjectilePool() {
    for (let i = 0; i < this.maxProjectiles; i++) {
      const projectile = new PlayerProjectile(this.scene, this);
      this.projectilePool.push(projectile);
      this.projectiles.push(projectile);
    }
  }

  /**
   * 創建瞄準線
   */
  createAimLine() {
    this.aimLine = this.scene.add.graphics();
    this.aimLine.setDepth(100);
  }

  /**
   * 更新瞄準
   */
  updateAim(targetX, targetY) {
    // 使用玩家的世界位置作為基準
    const playerWorldX = this.player.x;
    const playerWorldY = this.player.y;
    
    // 計算目標角度
    this.targetAngle = Phaser.Math.Angle.Between(playerWorldX, playerWorldY, targetX, targetY);
    
    // 平滑轉向
    const angleDiff = Phaser.Math.Angle.ShortestBetween(this.currentAngle, this.targetAngle);
    this.currentAngle += angleDiff * this.aimingSpeed;
    
    // 更新瞄準線
    this.updateAimLine();
  }

  /**
   * 更新瞄準線
   */
  updateAimLine() {
    this.aimLine.clear();
    this.aimLine.lineStyle(2, 0x00ff00, 0.5);
    
    // 使用玩家的世界位置
    const playerWorldX = this.player.x;
    const playerWorldY = this.player.y;
    
    const startX = playerWorldX;
    const startY = playerWorldY;
    const endX = startX + Math.cos(this.currentAngle) * this.range;
    const endY = startY + Math.sin(this.currentAngle) * this.range;
    
    this.aimLine.beginPath();
    this.aimLine.moveTo(startX, startY);
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();
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
   * 更新武器
   */
  update(time, delta) {
    // 更新射擊
    if (this.isFiring && time.now - this.lastFireTime > this.fireRate) {
      this.fire();
      this.lastFireTime = time.now;
    }
    
    // 更新投射物
    this.updateProjectiles(time, delta);
  }

  /**
   * 射擊
   */
  fire() {
    // 檢查是否有可用的投射物
    if (this.projectiles.filter(p => p.active).length >= this.maxProjectiles) {
      return;
    }
    
    // 播放射擊音效
    this.playFireSound();
    
    // 創建槍口閃光效果
    this.createMuzzleFlash();
    
    // 創建後坐力效果
    this.createRecoilEffect();
    
    // 發射投射物
    this.createProjectile();
  }

  /**
   * 創建投射物
   */
  createProjectile() {
    const multiShotCount = this.multiShot;
    const spreadAngle = this.spreadAngle;
    
    for (let i = 0; i < multiShotCount; i++) {
      const projectile = new PlayerProjectile(this.scene, this);
      this.projectiles.push(projectile);
      
      // 計算散射角度
      const angleOffset = (i - (multiShotCount - 1) / 2) * spreadAngle;
      // 子彈飛行方向也需要調整，讓它與戰機頭部方向一致
      const fireAngle = this.currentAngle - Math.PI/2 + angleOffset;
      
      // 計算子彈發射位置（從戰機頭部發射）
      // 使用玩家的世界座標作為基準點
      const playerWorldX = this.player.x;
      const playerWorldY = this.player.y;
      
      // 從戰機頭部發射（戰機圖片是垂直向上的，需要調整角度）
      // 戰機頭部距離中心約 50 像素，需要減去 90 度（π/2）來對應戰機頭部方向
      const muzzleX = playerWorldX + Math.cos(this.currentAngle - Math.PI/2) * 50;
      const muzzleY = playerWorldY + Math.sin(this.currentAngle - Math.PI/2) * 50;
      
      // 設置投射物
      projectile.fire(muzzleX, muzzleY, fireAngle, this.getProjectileConfig());
    }
  }

  /**
   * 從池中獲取投射物
   */
  getProjectileFromPool() {
    for (let projectile of this.projectilePool) {
      if (!projectile.active) {
        return projectile;
      }
    }
    return null;
  }

  /**
   * 獲取投射物配置
   */
  getProjectileConfig() {
    return {
      damage: this.getActualDamage(),
      speed: 500,
      piercing: this.piercing,
      explosive: false,
      homing: false
    };
  }

  /**
   * 獲取實際傷害
   */
  getActualDamage() {
    return this.damage;
  }

  /**
   * 更新投射物
   */
  updateProjectiles(time, delta) {
    this.projectiles.forEach(projectile => {
      if (projectile.active) {
        projectile.update(time, delta);
      }
    });
  }

  /**
   * 創建槍口閃光
   */
  createMuzzleFlash() {
    this.muzzleFlash.setVisible(true);
    this.muzzleFlash.setScale(1);
    
    // 閃光動畫
    this.scene.tweens.add({
      targets: this.muzzleFlash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.muzzleFlash.setVisible(false);
        this.muzzleFlash.setAlpha(0.8);
      }
    });
  }

  /**
   * 創建後坐力效果
   */
  createRecoilEffect() {
    if (this.recoilTween) {
      this.recoilTween.stop();
    }
    
    // 後坐力動畫
    this.recoilTween = this.scene.tweens.add({
      targets: this,
      x: this.x - Math.cos(this.currentAngle) * 5,
      y: this.y - Math.sin(this.currentAngle) * 5,
      duration: 100,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        this.recoilTween = null;
      }
    });
  }

  /**
   * 播放射擊音效
   */
  playFireSound() {
    // 播放射擊音效
    this.scene.playSound('player_fire');
  }

  /**
   * 升級武器
   */
  upgradeWeapon(upgradeType, value) {
    switch (upgradeType) {
      case 'damage':
        this.damage += value;
        break;
      case 'fireRate':
        this.fireRate = Math.max(50, this.fireRate - value);
        break;
      case 'range':
        this.range += value;
        break;
      case 'accuracy':
        this.accuracy = Math.min(1, this.accuracy + value);
        break;
      case 'piercing':
        this.piercing += value;
        break;
      case 'multiShot':
        this.multiShot += value;
        break;
    }
    
    console.log(`武器升級: ${upgradeType} +${value}`);
  }

  /**
   * 銷毀武器
   */
  destroy() {
    // 銷毀所有投射物
    this.projectiles.forEach(projectile => {
      if (projectile) {
        projectile.destroy();
      }
    });
    
    // 銷毀瞄準線
    if (this.aimLine) {
      this.aimLine.destroy();
    }
    
    super.destroy();
  }
}

/**
 * 玩家投射物類
 */
class PlayerProjectile extends Phaser.GameObjects.Container {
  constructor(scene, weapon) {
    super(scene, 0, 0);
    
    this.weapon = weapon;
    this.config = null;
    
    // 移動屬性
    this.velocity = { x: 0, y: 0 };
    this.speed = 500;
    this.lifeTime = 0;
    this.maxLifeTime = 3000; // 3秒後自動消失
    
    // 特殊屬性
    this.piercing = 0;
    this.hitTargets = [];
    
    // 視覺元素
    this.bulletSprite = null;
    this.trail = [];
    
    this.init();
    scene.add.existing(this);
  }

  /**
   * 初始化投射物
   */
  init() {
    // 創建子彈視覺
    this.bulletSprite = this.scene.add.circle(0, 0, 3, 0xffff00);
    this.bulletSprite.setStrokeStyle(1, 0xffffff);
    this.bulletSprite.setOrigin(0.5, 0.5);
    this.add(this.bulletSprite);
    
    // 設置物理體 - 增加半徑，移除 onCollide 衝突
    this.scene.physics.world.enable(this);
    this.body.setCircle(8); // 增加碰撞半徑
    
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * 發射投射物
   */
  fire(x, y, angle, config) {
    this.config = config;
    this.setPosition(x, y);
    this.setRotation(angle);
    this.setActive(true);
    this.setVisible(true);
    
    // 計算速度
    this.velocity.x = Math.cos(angle) * this.config.speed;
    this.velocity.y = Math.sin(angle) * this.config.speed;
    
    // 重置屬性
    this.lifeTime = 0;
    this.hitTargets = [];
    this.piercing = this.config.piercing || 0;
    
    // 設置物理速度
    this.body.setVelocity(this.velocity.x, this.velocity.y);
  }

  /**
   * 更新投射物
   */
  update(time, delta) {
    if (!this.active) return;
    
    this.lifeTime += delta;
    
    // 檢查生命週期
    if (this.lifeTime >= this.maxLifeTime) {
      this.destroy();
      return;
    }
    
    // 更新位置
    this.x += this.velocity.x * (delta / 1000);
    this.y += this.velocity.y * (delta / 1000);
    
    // 檢查邊界
    const { width, height } = this.scene.scale.gameSize;
    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.destroy();
      return;
    }
    
    // 導向更新
    if (this.config.homing) {
      this.updateHoming();
    }
    
    // 更新拖尾效果
    this.updateTrail();
  }

  /**
   * 導向更新
   */
  updateHoming() {
    // 尋找最近的敵人
    const nearestEnemy = this.findNearestEnemy();
    
    if (nearestEnemy) {
      const angleToEnemy = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
      
      // 逐漸調整方向
      const currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
      let angleDiff = angleToEnemy - currentAngle;
      
      // 處理角度環繞
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // 限制轉向速度
      const maxTurnRate = 0.1;
      angleDiff = Phaser.Math.Clamp(angleDiff, -maxTurnRate, maxTurnRate);
      
      const newAngle = currentAngle + angleDiff;
      this.velocity.x = Math.cos(newAngle) * this.config.speed;
      this.velocity.y = Math.sin(newAngle) * this.config.speed;
    }
  }

  /**
   * 尋找最近的敵人
   */
  findNearestEnemy() {
    // 這裡需要從遊戲場景獲取敵人列表
    // 暫時返回null
    return null;
  }

  /**
   * 更新拖尾效果
   */
  updateTrail() {
    // 添加拖尾點
    this.trail.push({ x: this.x, y: this.y, time: this.scene.time.now });
    
    // 限制拖尾長度
    if (this.trail.length > 10) {
      this.trail.shift();
    }
    
    // 清理過期的拖尾點
    this.trail = this.trail.filter(point => 
      this.scene.time.now - point.time < 200
    );
  }

  /**
   * 擊中目標
   */
  onHit(target) {
    // 檢查是否已經擊中過這個目標
    if (this.hitTargets.includes(target)) {
      return;
    }
    
    // 記錄擊中的目標
    this.hitTargets.push(target);
    
    // 造成傷害
    if (target.takeDamage) {
      const damageDealt = target.takeDamage(this.config.damage);
      console.log(`玩家子彈擊中${target.enemyType}敵人，造成${damageDealt}點傷害`);
    }
    
    // 檢查穿透
    if (this.piercing <= 0) {
      this.destroy();
    } else {
      this.piercing--;
    }
    
    // 爆炸效果
    if (this.config.explosive) {
      this.createExplosion();
    }
  }

  /**
   * 創建爆炸效果
   */
  createExplosion() {
    // 爆炸視覺效果
    const explosion = this.scene.add.circle(this.x, this.y, 5, 0xff6b6b, 0.8);
    
    this.scene.tweens.add({
      targets: explosion,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => explosion.destroy()
    });
    
    // 範圍傷害邏輯在這裡實現
    console.log('爆炸！');
  }

  /**
   * 停用投射物
   */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
  }
  
  /**
   * 銷毀投射物
   */
  destroy() {
    this.deactivate();
    super.destroy();
  }
}