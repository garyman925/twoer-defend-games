/**
 * Missile 導彈
 * 追蹤敵人並造成範圍爆炸傷害
 */

import { BaseWeapon } from './BaseWeapon.js';

export class MissileWeapon extends BaseWeapon {
  constructor(scene, player, config) {
    super(scene, player, config);
    
    // 導彈特有屬性
    this.homingStrength = config.special?.homingStrength || 6; // 🆕 從 2 → 6（超強追蹤曲度）
    this.explosionRadius = config.special?.explosionRadius || 80;
    this.explosionDamage = config.special?.explosionDamage || 50;
    this.lastFireTime = 0;
    
    this.init();
  }

  /**
   * 發射導彈
   */
  fire(targetX, targetY) {
    const currentTime = this.scene.time.now;
    
    // 檢查射速限制
    if (currentTime - this.lastFireTime < this.config.stats.fireRate) {
      return null;
    }
    
    this.lastFireTime = currentTime;
    
    // 獲取投射物
    const projectile = this.getProjectileFromPool();
    if (!projectile) return null;
    
    // 設置位置
    projectile.setPosition(this.player.x, this.player.y);
    projectile.setActive(true);
    projectile.setVisible(true);
    
    // 找到最近的敵人作為目標
    projectile.target = this.findNearestEnemy();
    
    // 初始方向（朝向目標或滑鼠）
    const initialTargetX = projectile.target ? projectile.target.x : targetX;
    const initialTargetY = projectile.target ? projectile.target.y : targetY;
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, initialTargetX, initialTargetY);
    
    const speed = this.config.stats.projectileSpeed || 400;
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    projectile.rotation = angle;
    
    // 導彈生命週期（最多5秒）
    this.scene.time.delayedCall(5000, () => {
      if (projectile.active) {
        this.explodeMissile(projectile);
      }
    });
    
    // 槍口閃光
    this.showMuzzleFlash();
    
    console.log(`🚀 發射導彈，目標: ${projectile.target ? '敵人' : '滑鼠位置'}`);
    
    return projectile;
  }

  /**
   * 創建投射物（增強版導彈）
   */
  createProjectile() {
    const size = this.config.visuals.projectileSize || 8;
    const color = parseInt(this.config.visuals.projectileColor) || 0xff0000;
    
    // 🆕 創建導彈容器
    const projectile = this.scene.add.container(0, 0);
    
    // 🆕 導彈主體（橢圓形）
    const body = this.scene.add.ellipse(0, 0, size * 2, size, color);
    body.setBlendMode(Phaser.BlendModes.ADD);
    projectile.add(body);
    
    // 🆕 導彈尾翼（兩側）
    const wing1 = this.scene.add.triangle(0, -size * 0.6, -size, 0, -size * 1.5, -size * 0.5, -size * 1.5, size * 0.5, color, 0.6);
    const wing2 = this.scene.add.triangle(0, size * 0.6, -size, 0, -size * 1.5, -size * 0.5, -size * 1.5, size * 0.5, color, 0.6);
    wing1.setBlendMode(Phaser.BlendModes.ADD);
    wing2.setBlendMode(Phaser.BlendModes.ADD);
    projectile.add(wing1);
    projectile.add(wing2);
    
    // 🆕 導彈頭部光點
    const tip = this.scene.add.circle(size, 0, size * 0.5, 0xffffff);
    tip.setBlendMode(Phaser.BlendModes.ADD);
    projectile.add(tip);
    
    // 添加物理
    this.scene.physics.add.existing(projectile);
    projectile.body.setCircle(size);
    
    // 導彈屬性
    projectile.damage = this.config.stats.damage;
    projectile.weaponType = this.config.id;
    projectile.target = null;
    projectile.isHoming = true;
    
    // 🆕 增強尾跡粒子效果
    if (this.config.visuals.trailEffect) {
      projectile.trail = this.scene.add.particles(0, 0, {
        speed: { min: 30, max: 80 },
        scale: { start: 0.6, end: 0 },
        blendMode: 'ADD',
        lifespan: 500,
        frequency: 30,
        tint: [
          parseInt(this.config.visuals.trailColor) || 0xff6600,
          0xff0000,
          0xffaa00
        ]
      });
      projectile.trail.startFollow(projectile, -size, 0);
      projectile.trail.stop();
    }
    
    return projectile;
  }

  /**
   * 找到最近的敵人
   */
  findNearestEnemy() {
    if (!this.scene.enemies || this.scene.enemies.children.entries.length === 0) {
      return null;
    }
    
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    this.scene.enemies.children.entries.forEach(enemy => {
      if (enemy.isAlive) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          enemy.x, enemy.y
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = enemy;
        }
      }
    });
    
    return nearestEnemy;
  }

  /**
   * 更新投射物（追蹤邏輯 - 增強曲線版）
   */
  updateProjectile(projectile, time, delta) {
    if (!projectile.active) return;
    
    // 追蹤目標
    if (projectile.target && projectile.target.isAlive) {
      const angle = Phaser.Math.Angle.Between(
        projectile.x, projectile.y,
        projectile.target.x, projectile.target.y
      );
      
      const currentAngle = Phaser.Math.Angle.Normalize(Math.atan2(projectile.body.velocity.y, projectile.body.velocity.x));
      const targetAngle = Phaser.Math.Angle.Normalize(angle);
      
      // 計算與目標的距離
      const distance = Phaser.Math.Distance.Between(
        projectile.x, projectile.y,
        projectile.target.x, projectile.target.y
      );
      
      // 🆕 根據距離動態調整（降低速度，增強轉向）
      let speed = this.config.stats.projectileSpeed || 250; // 基礎速度較慢
      let turnMultiplier = 1;
      
      if (distance < 150) {
        // 非常接近：超強轉向（不加速太多）
        turnMultiplier = 3.5;  // 🆕 轉向力度 × 3.5
        speed = speed * 1.2;    // 🆕 只微幅加速 × 1.2
      } else if (distance < 300) {
        // 中距離：強轉向（不加速太多）
        turnMultiplier = 2.5;  // 🆕 轉向力度 × 2.5
        speed = speed * 1.1;    // 🆕 只微幅加速 × 1.1
      } else {
        // 遠距離：中等轉向
        turnMultiplier = 1.5;  // 🆕 轉向力度 × 1.5
        // 速度保持不變
      }
      
      // 計算轉向
      const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
      const baseTurnSpeed = this.homingStrength * (delta / 1000);
      const actualTurnSpeed = baseTurnSpeed * turnMultiplier;
      const newAngle = currentAngle + Phaser.Math.Clamp(angleDiff, -actualTurnSpeed, actualTurnSpeed);
      
      // 更新速度方向
      projectile.body.setVelocity(
        Math.cos(newAngle) * speed,
        Math.sin(newAngle) * speed
      );
      
      projectile.rotation = newAngle;
      
    } else if (projectile.target && !projectile.target.isAlive) {
      // 目標已死，尋找新目標
      projectile.target = this.findNearestEnemy();
    }
    
    // 啟動尾跡
    if (projectile.trail && !projectile.trail.emitting) {
      projectile.trail.start();
    }
    
    // 範圍檢查
    super.updateProjectile(projectile, time, delta);
  }

  /**
   * 導彈爆炸
   */
  explodeMissile(projectile) {
    if (!projectile.active) return;
    
    const explosionX = projectile.x;
    const explosionY = projectile.y;
    
    console.log(`💥 導彈爆炸於 (${Math.floor(explosionX)}, ${Math.floor(explosionY)})`);
    
    // 範圍傷害
    this.dealExplosionDamage(explosionX, explosionY);
    
    // 爆炸特效
    this.createExplosionEffect(explosionX, explosionY);
    
    // 歸還投射物
    this.returnProjectileToPool(projectile);
  }

  /**
   * 造成範圍傷害
   */
  dealExplosionDamage(x, y) {
    if (!this.scene.enemies) return;
    
    let hitCount = 0;
    
    this.scene.enemies.children.entries.forEach(enemy => {
      if (enemy.isAlive) {
        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        
        if (distance <= this.explosionRadius) {
          // 範圍內的敵人受到傷害
          enemy.takeDamage(this.explosionDamage, 'explosion', this.player);
          hitCount++;
        }
      }
    });
    
    console.log(`💥 爆炸命中 ${hitCount} 個敵人`);
  }

  /**
   * 創建爆炸特效
   */
  createExplosionEffect(x, y) {
    // 🆕 播放爆炸音效
    if (this.config.audio && this.config.audio.explosionSound) {
      if (this.scene.playSound) {
        this.scene.playSound(this.config.audio.explosionSound);
      }
    }
    
    // 主爆炸圈（增強版）
    const explosionCircle = this.scene.add.circle(x, y, 10, 0xff6600);
    explosionCircle.setBlendMode(Phaser.BlendModes.ADD);
    explosionCircle.setAlpha(1);
    
    this.scene.tweens.add({
      targets: explosionCircle,
      radius: this.explosionRadius,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        explosionCircle.destroy();
      }
    });
    
    // 🆕 次級爆炸圈（衝擊波）
    const shockwave = this.scene.add.circle(x, y, this.explosionRadius * 0.3, 0xff0000, 0);
    shockwave.setStrokeStyle(2, 0xff6600);
    shockwave.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: shockwave,
      radius: this.explosionRadius * 1.3,
      alpha: { from: 0.8, to: 0 },
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        shockwave.destroy();
      }
    });
    
    // 🆕 增強爆炸粒子（更多、更華麗）
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const distance = Phaser.Math.Between(40, 80);
      
      // 主粒子
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(3, 6), 0xff0000);
      particle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.1 },
        duration: Phaser.Math.Between(400, 600),
        ease: 'Quad.easeOut',
        onComplete: () => {
          particle.destroy();
        }
      });
      
      // 🆕 次級粒子（火花）
      if (i % 2 === 0) {
        const spark = this.scene.add.circle(x, y, 2, 0xffff00);
        spark.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
          targets: spark,
          x: x + Math.cos(angle + 0.3) * (distance * 0.7),
          y: y + Math.sin(angle + 0.3) * (distance * 0.7),
          alpha: { from: 1, to: 0 },
          duration: 300,
          ease: 'Linear',
          onComplete: () => {
            spark.destroy();
          }
        });
      }
    }
    
    // 🆕 中心閃光
    const flash = this.scene.add.circle(x, y, 30, 0xffffff);
    flash.setBlendMode(Phaser.BlendModes.ADD);
    flash.setAlpha(1);
    
    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * 歸還投射物（清理尾跡）
   */
  returnProjectileToPool(projectile) {
    if (projectile.trail) {
      projectile.trail.stop();
    }
    super.returnProjectileToPool(projectile);
  }

  /**
   * 銷毀
   */
  destroy() {
    // 清理所有尾跡粒子
    this.projectilePool.forEach(projectile => {
      if (projectile.trail) {
        projectile.trail.destroy();
      }
    });
    
    super.destroy();
  }
}

