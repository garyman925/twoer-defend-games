/**
 * Vulcan 機槍
 * 快速連發武器，無限彈藥
 */

import { BaseWeapon } from './BaseWeapon.js';

export class VulcanWeapon extends BaseWeapon {
  constructor(scene, player, config) {
    super(scene, player, config);
    
    // Vulcan 特有屬性
    this.spreadAngle = config.stats.spread || 5;
    this.lastFireTime = 0;
    
    this.init();
  }

  /**
   * 發射機槍
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
    
    // 計算方向（加入散射）
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const spreadRadians = Phaser.Math.DegToRad(this.spreadAngle);
    const randomSpread = Phaser.Math.FloatBetween(-spreadRadians, spreadRadians);
    const angle = baseAngle + randomSpread;
    
    // 設置速度
    const speed = this.config.stats.projectileSpeed || 600;
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    projectile.rotation = angle;
    
    // 投射物生命週期
    this.scene.time.delayedCall(2000, () => {
      this.returnProjectileToPool(projectile);
    });
    
    // 槍口閃光
    this.showMuzzleFlash();
    
    return projectile;
  }

  /**
   * 創建投射物
   */
  createProjectile() {
    const size = this.config.visuals.projectileSize || 4;
    const color = parseInt(this.config.visuals.projectileColor) || 0x00ffff;
    
    // 創建子彈容器
    const projectile = this.scene.add.container(0, 0);
    
    // 🆕 子彈核心（發光）
    const core = this.scene.add.circle(0, 0, size, color);
    core.setBlendMode(Phaser.BlendModes.ADD);
    projectile.add(core);
    
    // 🆕 子彈光暈
    const glow = this.scene.add.circle(0, 0, size * 2, color, 0.3);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    projectile.add(glow);
    
    // 添加物理（對容器）
    this.scene.physics.add.existing(projectile);
    projectile.body.setCircle(size);
    
    // 投射物屬性
    projectile.damage = this.config.stats.damage;
    projectile.weaponType = this.config.id;
    projectile.piercing = this.config.stats.piercing || false;
    
    return projectile;
  }

  /**
   * 更新投射物
   */
  updateProjectile(projectile, time, delta) {
    super.updateProjectile(projectile, time, delta);
    
    // Vulcan 投射物的尾跡效果（可選）
    if (this.config.visuals.trailEffect && projectile.active) {
      projectile.setAlpha(0.9); // 稍微透明
    }
  }
}

