/**
 * 玩家武器類
 * 處理玩家武器的射擊、升級、特效等
 */

import GameConfig from '../../core/GameConfig.js';

export class PlayerWeapon extends Phaser.GameObjects.Container {
  constructor(scene, player) {
    super(scene, 0, 0);
    
    this.player = player;
    
    // 武器基礎屬性
    this.damage = GameConfig.PLAYER.WEAPON.DAMAGE;
    this.fireRate = GameConfig.PLAYER.WEAPON.FIRE_RATE;
    this.range = GameConfig.PLAYER.WEAPON.RANGE;
    this.rotationSpeed = GameConfig.PLAYER.WEAPON.ROTATION_SPEED;
    
    // 射擊狀態
    this.isShooting = false;
    this.lastFireTime = 0;
    this.targetAngle = 0;
    this.currentAngle = 0;
    
    // 彈藥系統（可選）
    this.maxAmmo = Infinity; // 無限彈藥
    this.currentAmmo = this.maxAmmo;
    this.reloadTime = 2000;
    this.isReloading = false;
    
    // 升級等級
    this.upgrades = {
      damage: 0,
      fireRate: 0,
      range: 0,
      multiShot: 0,
      piercing: 0
    };
    
    // 特殊能力
    this.specialAbilities = {
      explosiveShots: false,
      homingBullets: false,
      rapidFire: false
    };
    
    // 視覺組件
    this.weaponSprite = null;
    this.muzzleFlash = null;
    this.aimLine = null;
    
    // 投射物管理
    this.projectiles = [];
    this.projectilePool = [];
    
    // 初始化武器
    this.init();
    
    console.log('玩家武器創建完成');
  }

  /**
   * 初始化武器
   */
  init() {
    // 創建武器視覺元素
    this.createWeaponVisuals();
    
    // 創建投射物池
    this.createProjectilePool();
    
    // 設置物理碰撞
    this.setupPhysics();
  }

  /**
   * 創建武器視覺元素
   */
  createWeaponVisuals() {
    // 武器主體
    this.weaponSprite = this.scene.add.rectangle(0, -15, 30, 8, 0x888888);
    this.weaponSprite.setStrokeStyle(1, 0xffffff);
    this.add(this.weaponSprite);
    
    // 武器槍管
    this.barrel = this.scene.add.rectangle(0, -25, 4, 15, 0xcccccc);
    this.add(this.barrel);
    
    // 瞄準線（可選顯示）
    this.aimLine = this.scene.add.line(0, 0, 0, 0, 0, -this.range, 0xff0000, 0.3);
    this.aimLine.setLineWidth(1);
    this.aimLine.setVisible(false);
    this.add(this.aimLine);
    
    // 槍口閃光
    this.muzzleFlash = this.scene.add.circle(0, -30, 8, 0xffff00, 0);
    this.add(this.muzzleFlash);
  }

  /**
   * 創建投射物池
   */
  createProjectilePool() {
    const poolSize = 50;
    
    for (let i = 0; i < poolSize; i++) {
      const projectile = new PlayerProjectile(this.scene, this);
      projectile.setActive(false);
      projectile.setVisible(false);
      this.projectilePool.push(projectile);
    }
    
    console.log(`投射物池創建完成，大小: ${poolSize}`);
  }

  /**
   * 設置物理碰撞
   */
  setupPhysics() {
    // 武器本身通常不需要物理體
    // 投射物會有自己的物理體
  }

  /**
   * 設置目標角度
   */
  setTargetAngle(angle) {
    this.targetAngle = angle;
  }

  /**
   * 開始射擊
   */
  startShooting() {
    if (this.isReloading || this.currentAmmo <= 0) return;
    
    this.isShooting = true;
    console.log('開始射擊');
    
    // 顯示瞄準線
    this.aimLine.setVisible(true);
  }

  /**
   * 停止射擊
   */
  stopShooting() {
    this.isShooting = false;
    console.log('停止射擊');
    
    // 隱藏瞄準線
    this.aimLine.setVisible(false);
  }

  /**
   * 更新武器邏輯
   */
  update(time, delta) {
    // 更新武器旋轉
    this.updateRotation(delta);
    
    // 處理射擊
    if (this.isShooting && !this.isReloading) {
      this.handleShooting(time);
    }
    
    // 更新投射物
    this.updateProjectiles(time, delta);
    
    // 更新重新裝彈
    if (this.isReloading) {
      this.updateReloading(time);
    }
  }

  /**
   * 更新武器旋轉
   */
  updateRotation(delta) {
    // 計算角度差
    let angleDiff = this.targetAngle - this.currentAngle;
    
    // 處理角度環繞
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    // 平滑旋轉
    const maxRotation = (this.rotationSpeed * delta) / 1000;
    
    if (Math.abs(angleDiff) > maxRotation) {
      this.currentAngle += Math.sign(angleDiff) * maxRotation;
    } else {
      this.currentAngle = this.targetAngle;
    }
    
    // 應用旋轉
    this.setRotation(this.currentAngle);
  }

  /**
   * 處理射擊
   */
  handleShooting(time) {
    const actualFireRate = this.getActualFireRate();
    
    if (time - this.lastFireTime >= actualFireRate) {
      this.fire();
      this.lastFireTime = time;
    }
  }

  /**
   * 射擊
   */
  fire() {
    if (this.currentAmmo <= 0) {
      this.reload();
      return;
    }
    
    // 消耗彈藥
    if (this.maxAmmo !== Infinity) {
      this.currentAmmo--;
    }
    
    // 創建投射物
    this.createProjectile();
    
    // 播放射擊效果
    this.playFireEffects();
    
    // 播放射擊音效
    this.scene.playSound && this.scene.playSound('player_shoot');
    
    console.log('射擊！');
  }

  /**
   * 創建投射物
   */
  createProjectile() {
    const multiShotCount = 1 + this.upgrades.multiShot;
    const spreadAngle = this.upgrades.multiShot > 0 ? 0.2 : 0; // 多重射擊的散射角度
    
    for (let i = 0; i < multiShotCount; i++) {
      let projectile = this.getProjectileFromPool();
      
      if (!projectile) {
        projectile = new PlayerProjectile(this.scene, this);
      }
      
      // 計算射擊角度
      let shootAngle = this.currentAngle;
      if (multiShotCount > 1) {
        const angleOffset = (i - (multiShotCount - 1) / 2) * spreadAngle;
        shootAngle += angleOffset;
      }
      
      // 計算發射位置
      const firePos = this.getFirePosition();
      const worldPos = this.player.getWorldTransformMatrix().transformPoint(firePos.x, firePos.y);
      
      // 配置投射物
      projectile.fire(worldPos.x, worldPos.y, shootAngle, {
        damage: this.getActualDamage(),
        speed: 500,
        range: this.getActualRange(),
        piercing: this.upgrades.piercing,
        explosive: this.specialAbilities.explosiveShots,
        homing: this.specialAbilities.homingBullets
      });
      
      this.projectiles.push(projectile);
    }
  }

  /**
   * 獲取發射位置
   */
  getFirePosition() {
    // 從槍管末端發射
    return { x: 0, y: -30 };
  }

  /**
   * 從對象池獲取投射物
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
   * 播放射擊效果
   */
  playFireEffects() {
    // 槍口閃光
    this.muzzleFlash.setAlpha(1);
    this.scene.tweens.add({
      targets: this.muzzleFlash,
      alpha: 0,
      duration: 100,
      ease: 'Power2'
    });
    
    // 武器後坐力
    this.scene.tweens.add({
      targets: this.weaponSprite,
      y: { from: -15, to: -10 },
      duration: 50,
      yoyo: true,
      ease: 'Power2'
    });
    
    // 輕微螢幕震動
    this.scene.cameras.main.shake(50, 0.005);
  }

  /**
   * 更新投射物
   */
  updateProjectiles(time, delta) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      if (projectile.active) {
        projectile.update(time, delta);
      } else {
        // 移除非活躍的投射物
        this.projectiles.splice(i, 1);
        this.returnProjectileToPool(projectile);
      }
    }
  }

  /**
   * 將投射物返回對象池
   */
  returnProjectileToPool(projectile) {
    projectile.reset();
    // 投射物已在池中，不需要額外操作
  }

  /**
   * 重新裝彈
   */
  reload() {
    if (this.isReloading || this.currentAmmo === this.maxAmmo) return;
    
    this.isReloading = true;
    this.reloadStartTime = Date.now();
    
    console.log('開始重新裝彈');
    
    // 播放重新裝彈音效
    this.scene.playSound && this.scene.playSound('weapon_reload');
    
    // 發送重新裝彈事件
    this.player.eventEmitter.emit('weaponReloading', {
      duration: this.reloadTime
    });
  }

  /**
   * 更新重新裝彈
   */
  updateReloading(time) {
    const elapsedTime = Date.now() - this.reloadStartTime;
    
    if (elapsedTime >= this.reloadTime) {
      this.finishReload();
    }
  }

  /**
   * 完成重新裝彈
   */
  finishReload() {
    this.isReloading = false;
    this.currentAmmo = this.maxAmmo;
    
    console.log('重新裝彈完成');
    
    // 播放裝彈完成音效
    this.scene.playSound && this.scene.playSound('weapon_reload_complete');
    
    // 發送裝彈完成事件
    this.player.eventEmitter.emit('weaponReloaded');
  }

  /**
   * 升級武器
   */
  upgrade(upgradeType, level) {
    if (this.upgrades.hasOwnProperty(upgradeType)) {
      this.upgrades[upgradeType] = level;
      console.log(`武器升級: ${upgradeType} -> 等級 ${level}`);
      
      // 更新視覺效果
      this.updateVisualForUpgrade(upgradeType, level);
      
      // 發送升級事件
      this.player.eventEmitter.emit('weaponUpgraded', {
        type: upgradeType,
        level: level
      });
    }
  }

  /**
   * 更新升級視覺效果
   */
  updateVisualForUpgrade(upgradeType, level) {
    switch (upgradeType) {
      case 'damage':
        // 武器變大表示威力增強
        this.weaponSprite.scaleX = 1 + (level * 0.1);
        break;
        
      case 'fireRate':
        // 槍管變長表示射速提升
        this.barrel.scaleY = 1 + (level * 0.1);
        break;
        
      case 'range':
        // 更新瞄準線長度
        this.aimLine.setTo(0, 0, 0, -this.getActualRange());
        break;
        
      case 'multiShot':
        // 武器發光表示多重射擊
        if (level > 0) {
          this.weaponSprite.setStrokeStyle(2, 0x00ff00);
        }
        break;
    }
  }

  /**
   * 啟用特殊能力
   */
  enableSpecialAbility(abilityName) {
    if (this.specialAbilities.hasOwnProperty(abilityName)) {
      this.specialAbilities[abilityName] = true;
      console.log(`特殊能力啟用: ${abilityName}`);
      
      // 更新視覺效果
      this.updateVisualForSpecialAbility(abilityName);
    }
  }

  /**
   * 更新特殊能力視覺效果
   */
  updateVisualForSpecialAbility(abilityName) {
    switch (abilityName) {
      case 'explosiveShots':
        this.weaponSprite.setFillStyle(0xff6b6b);
        break;
        
      case 'homingBullets':
        this.weaponSprite.setFillStyle(0x00ffff);
        break;
        
      case 'rapidFire':
        this.weaponSprite.setFillStyle(0xffd93d);
        break;
    }
  }

  /**
   * 獲取實際傷害值
   */
  getActualDamage() {
    const baseDamage = this.damage;
    const upgradeBonus = baseDamage * (this.upgrades.damage * 0.2);
    return Math.round(baseDamage + upgradeBonus);
  }

  /**
   * 獲取實際射擊速度
   */
  getActualFireRate() {
    const baseFireRate = this.fireRate;
    const upgradeReduction = baseFireRate * (this.upgrades.fireRate * 0.15);
    const actualFireRate = Math.max(100, baseFireRate - upgradeReduction);
    
    // 快速射擊特殊能力
    if (this.specialAbilities.rapidFire) {
      return actualFireRate * 0.3;
    }
    
    return actualFireRate;
  }

  /**
   * 獲取實際射程
   */
  getActualRange() {
    const baseRange = this.range;
    const upgradeBonus = baseRange * (this.upgrades.range * 0.1);
    return baseRange + upgradeBonus;
  }

  /**
   * 獲取武器狀態
   */
  getStatus() {
    return {
      damage: this.getActualDamage(),
      fireRate: this.getActualFireRate(),
      range: this.getActualRange(),
      ammo: this.currentAmmo,
      maxAmmo: this.maxAmmo,
      isReloading: this.isReloading,
      isShooting: this.isShooting,
      upgrades: { ...this.upgrades },
      specialAbilities: { ...this.specialAbilities }
    };
  }

  /**
   * 重置武器狀態
   */
  reset() {
    this.isShooting = false;
    this.isReloading = false;
    this.currentAmmo = this.maxAmmo;
    this.lastFireTime = 0;
    
    // 清理所有投射物
    this.projectiles.forEach(projectile => {
      projectile.deactivate();
    });
    this.projectiles = [];
    
    console.log('武器狀態已重置');
  }

  /**
   * 銷毀武器
   */
  destroy() {
    // 清理所有投射物
    this.projectiles.forEach(projectile => {
      projectile.destroy();
    });
    this.projectilePool.forEach(projectile => {
      projectile.destroy();
    });
    
    this.projectiles = [];
    this.projectilePool = [];
    
    super.destroy();
    
    console.log('玩家武器已銷毀');
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
    this.add(this.bulletSprite);
    
    // 設置物理體
    this.scene.physics.world.enable(this);
    this.body.setCircle(3);
    
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * 發射投射物
   */
  fire(x, y, angle, config) {
    this.config = config;
    this.setPosition(x, y);
    
    // 設置速度
    this.velocity.x = Math.cos(angle) * config.speed;
    this.velocity.y = Math.sin(angle) * config.speed;
    
    // 重置狀態
    this.lifeTime = 0;
    this.hitTargets = [];
    this.piercing = config.piercing || 0;
    
    // 更新視覺
    this.updateVisualForConfig(config);
    
    this.setActive(true);
    this.setVisible(true);
    
    console.log('投射物發射');
  }

  /**
   * 根據配置更新視覺
   */
  updateVisualForConfig(config) {
    if (config.explosive) {
      this.bulletSprite.setFillStyle(0xff6b6b);
    } else if (config.homing) {
      this.bulletSprite.setFillStyle(0x00ffff);
    } else {
      this.bulletSprite.setFillStyle(0xffff00);
    }
  }

  /**
   * 更新投射物
   */
  update(time, delta) {
    if (!this.active) return;
    
    // 更新位置
    this.x += this.velocity.x * delta / 1000;
    this.y += this.velocity.y * delta / 1000;
    
    // 更新生命時間
    this.lifeTime += delta;
    
    // 檢查生命時間
    if (this.lifeTime >= this.maxLifeTime) {
      this.deactivate();
      return;
    }
    
    // 檢查是否超出範圍
    if (this.isOutOfBounds()) {
      this.deactivate();
      return;
    }
    
    // 尋敵邏輯（如果有導向能力）
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
    // 簡單的拖尾效果
    this.trail.push({ x: this.x, y: this.y, alpha: 1 });
    
    if (this.trail.length > 5) {
      this.trail.shift();
    }
  }

  /**
   * 檢查是否超出邊界
   */
  isOutOfBounds() {
    const { width, height } = this.scene.scale.gameSize;
    return this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50;
  }

  /**
   * 碰撞處理
   */
  onHit(target) {
    // 檢查是否已經擊中過這個目標
    if (this.hitTargets.includes(target)) return;
    
    // 造成傷害
    if (target.takeDamage) {
      target.takeDamage(this.config.damage);
    }
    
    // 記錄擊中目標
    this.hitTargets.push(target);
    
    // 爆炸效果
    if (this.config.explosive) {
      this.createExplosion();
    }
    
    // 穿透邏輯
    if (this.piercing <= 0) {
      this.deactivate();
    } else {
      this.piercing--;
    }
    
    console.log('投射物擊中目標');
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
    console.log('投射物停用');
  }

  /**
   * 重置投射物
   */
  reset() {
    this.deactivate();
    this.lifeTime = 0;
    this.hitTargets = [];
    this.trail = [];
    this.setPosition(0, 0);
  }
}

export default PlayerWeapon;
