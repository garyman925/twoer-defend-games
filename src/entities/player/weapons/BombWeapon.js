/**
 * Bomb 炸彈
 * 大範圍 AOE 武器，造成巨大傷害
 */

import { BaseWeapon } from './BaseWeapon.js';

export class BombWeapon extends BaseWeapon {
  constructor(scene, player, config) {
    super(scene, player, config);
    
    // 炸彈特有屬性
    this.explosionRadius = config.special?.explosionRadius || 200;
    this.explosionDamage = config.special?.explosionDamage || 150;
    this.damageDropoff = config.special?.damageDropoff || 0.5;
    this.screenShake = config.special?.screenShake || false;
    this.shakeIntensity = config.special?.shakeIntensity || 10;
    
    this.init();
  }

  /**
   * 發射炸彈
   */
  fire(targetX, targetY) {
    // 獲取投射物
    const projectile = this.getProjectileFromPool();
    if (!projectile) return null;
    
    // 設置位置
    projectile.setPosition(this.player.x, this.player.y);
    projectile.setActive(true);
    projectile.setVisible(true);
    
    // 計算方向
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    
    // 炸彈速度較慢
    const speed = this.config.stats.projectileSpeed || 300;
    projectile.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    projectile.rotation = angle;
    
    // 儲存目標位置（炸彈會朝這個位置飛）
    projectile.targetX = targetX;
    projectile.targetY = targetY;
    projectile.startTime = this.scene.time.now;
    
    // 計算到達目標的時間
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    const travelTime = (distance / speed) * 1000;
    
    // 到達目標後爆炸（或最多3秒）
    this.scene.time.delayedCall(Math.min(travelTime, 3000), () => {
      if (projectile.active) {
        this.explodeBomb(projectile);
      }
    });
    
    // 槍口閃光
    this.showMuzzleFlash();
    
    console.log(`💣 發射炸彈，目標: (${Math.floor(targetX)}, ${Math.floor(targetY)})`);
    
    return projectile;
  }

  /**
   * 創建投射物
   */
  createProjectile() {
    const size = this.config.visuals.projectileSize || 12;
    const color = parseInt(this.config.visuals.projectileColor) || 0xffff00;
    
    // 創建炸彈
    const projectile = this.scene.add.circle(0, 0, size, color);
    projectile.setStrokeStyle(2, 0xff6600);
    projectile.setBlendMode(Phaser.BlendModes.ADD);
    
    // 添加物理
    this.scene.physics.add.existing(projectile);
    projectile.body.setCircle(size);
    
    // 炸彈屬性
    projectile.damage = this.config.stats.damage;
    projectile.weaponType = this.config.id;
    projectile.targetX = 0;
    projectile.targetY = 0;
    projectile.startTime = 0;
    
    // 尾跡粒子
    if (this.config.visuals.trailEffect) {
      projectile.trail = this.scene.add.particles(0, 0, {
        speed: { min: 10, max: 30 },
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        lifespan: 500,
        tint: parseInt(this.config.visuals.trailColor) || 0xffaa00,
        frequency: 50
      });
      projectile.trail.startFollow(projectile);
      projectile.trail.stop();
    }
    
    return projectile;
  }

  /**
   * 更新投射物
   */
  updateProjectile(projectile, time, delta) {
    if (!projectile.active) return;
    
    // 啟動尾跡
    if (projectile.trail && !projectile.trail.emitting) {
      projectile.trail.start();
    }
    
    // 炸彈旋轉動畫
    projectile.rotation += delta * 0.003;
    
    // 範圍檢查
    super.updateProjectile(projectile, time, delta);
  }

  /**
   * 炸彈爆炸
   */
  explodeBomb(projectile) {
    if (!projectile.active) return;
    
    const explosionX = projectile.x;
    const explosionY = projectile.y;
    
    console.log(`💥💥 炸彈爆炸於 (${Math.floor(explosionX)}, ${Math.floor(explosionY)}), 範圍: ${this.explosionRadius}`);
    
    // 🆕 強力螢幕震動（炸彈專屬）
    if (this.screenShake && this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(500, this.shakeIntensity / 1000);
      console.log(`📳 螢幕震動: 強度 ${this.shakeIntensity}`);
    }
    
    // 🆕 相機閃光效果
    this.scene.cameras.main.flash(200, 255, 255, 200, false, (camera, progress) => {
      if (progress === 1) {
        console.log('✨ 相機閃光完成');
      }
    });
    
    // 大範圍傷害
    this.dealExplosionDamage(explosionX, explosionY);
    
    // 爆炸特效
    this.createExplosionEffect(explosionX, explosionY);
    
    // 歸還投射物
    this.returnProjectileToPool(projectile);
  }

  /**
   * 造成範圍傷害（遞減）
   */
  dealExplosionDamage(x, y) {
    if (!this.scene.enemies) return;
    
    let hitCount = 0;
    
    this.scene.enemies.children.entries.forEach(enemy => {
      if (enemy.isAlive) {
        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        
        if (distance <= this.explosionRadius) {
          // 根據距離計算傷害（中心最高，邊緣遞減）
          const damageRatio = 1 - (distance / this.explosionRadius) * this.damageDropoff;
          const damage = Math.floor(this.explosionDamage * damageRatio);
          
          enemy.takeDamage(damage, 'explosion', this.player);
          hitCount++;
          
          console.log(`  💥 敵人受到 ${damage} 點爆炸傷害 (距離: ${Math.floor(distance)})`);
        }
      }
    });
    
    console.log(`💥 炸彈爆炸命中 ${hitCount} 個敵人`);
  }

  /**
   * 創建爆炸特效（超級增強版）
   */
  createExplosionEffect(x, y) {
    // 🆕 播放爆炸音效
    if (this.config.audio && this.config.audio.explosionSound) {
      if (this.scene.playSound) {
        this.scene.playSound(this.config.audio.explosionSound);
      }
    }
    
    // 🆕 中心白色閃光（最強烈）
    const centerFlash = this.scene.add.circle(x, y, 50, 0xffffff);
    centerFlash.setBlendMode(Phaser.BlendModes.ADD);
    centerFlash.setAlpha(1);
    
    this.scene.tweens.add({
      targets: centerFlash,
      scale: 3,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        centerFlash.destroy();
      }
    });
    
    // 主爆炸圈（黃色）
    const mainExplosion = this.scene.add.circle(x, y, 30, 0xffff00);
    mainExplosion.setBlendMode(Phaser.BlendModes.ADD);
    mainExplosion.setAlpha(1);
    
    this.scene.tweens.add({
      targets: mainExplosion,
      radius: this.explosionRadius,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        mainExplosion.destroy();
      }
    });
    
    // 🆕 第一波衝擊波（橙色）
    const shockwave1 = this.scene.add.circle(x, y, this.explosionRadius * 0.4, 0xff6600, 0);
    shockwave1.setStrokeStyle(4, 0xffaa00);
    shockwave1.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: shockwave1,
      radius: this.explosionRadius * 1.3,
      alpha: { from: 0.8, to: 0 },
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        shockwave1.destroy();
      }
    });
    
    // 🆕 第二波衝擊波（紅色）
    const shockwave2 = this.scene.add.circle(x, y, this.explosionRadius * 0.3, 0xff0000, 0);
    shockwave2.setStrokeStyle(3, 0xff6600);
    shockwave2.setBlendMode(Phaser.BlendModes.ADD);
    
    this.scene.tweens.add({
      targets: shockwave2,
      radius: this.explosionRadius * 1.5,
      alpha: { from: 0.6, to: 0 },
      duration: 800,
      delay: 100,
      ease: 'Quad.easeOut',
      onComplete: () => {
        shockwave2.destroy();
      }
    });
    
    // 🆕 大量爆炸粒子（40個，分三層）
    for (let layer = 0; layer < 3; layer++) {
      const particlesInLayer = layer === 0 ? 16 : (layer === 1 ? 12 : 8);
      
      for (let i = 0; i < particlesInLayer; i++) {
        const angle = (i / particlesInLayer) * Math.PI * 2 + (layer * 0.3);
        const distance = Phaser.Math.Between(50, 120) + (layer * 30);
        const size = Phaser.Math.Between(8, 16) - (layer * 3);
        
        // 選擇粒子顏色（黃-橙-紅漸變）
        const colors = [0xffff00, 0xffaa00, 0xff6600, 0xff0000];
        const color = colors[Phaser.Math.Between(0, colors.length - 1)];
        
        const particle = this.scene.add.circle(x, y, size, color);
        particle.setBlendMode(Phaser.BlendModes.ADD);
        
        this.scene.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: { from: 1, to: 0 },
          scale: { from: 1, to: 0.1 },
          duration: Phaser.Math.Between(500, 900) + (layer * 100),
          delay: layer * 50,
          ease: 'Quad.easeOut',
          onComplete: () => {
            particle.destroy();
          }
        });
      }
    }
    
    // 🆕 火花粒子（快速飛散）
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(80, 150);
      
      const spark = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffffff);
      spark.setBlendMode(Phaser.BlendModes.ADD);
      
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0 },
        duration: Phaser.Math.Between(300, 500),
        ease: 'Linear',
        onComplete: () => {
          spark.destroy();
        }
      });
    }
    
    // 🆕 地面衝擊圈（底層效果）
    const groundImpact = this.scene.add.circle(x, y, 20, 0x000000, 0);
    groundImpact.setStrokeStyle(6, 0xff6600, 0.5);
    groundImpact.setDepth(-1);
    
    this.scene.tweens.add({
      targets: groundImpact,
      radius: this.explosionRadius * 0.8,
      alpha: { from: 0.8, to: 0 },
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => {
        groundImpact.destroy();
      }
    });
  }

  /**
   * 歸還投射物
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

