/**
 * 雷射塔類
 * 具有特殊雷射攻擊功能的防禦塔
 */

import { BaseTower } from './BaseTower.js';

export class LaserTower extends BaseTower {
  constructor(scene, x, y) {
    super(scene, x, y, 'laser');
    
    // 雷射特殊屬性
    this.laserBeam = null;
    this.laserParticles = null;
    this.laserHitEffect = null;
    this.laserActive = false;
    this.laserRange = null; // 雷射射程指示器
    
    // 充能動畫相關
    this.chargeEffect = null;
    this.chargeParticles = null;
    this.chargeInterval = null; // 充能動畫計時器
    this.isCharging = false;
    this.chargeTime = 300; // 充能時間(毫秒)
    
    console.log(`🔫 雷射塔創建於 (${x}, ${y})`);
  }

  /**
   * 創建塔視覺元素 - 雷射塔特殊外觀
   */
  createTowerVisuals() {
    super.createTowerVisuals();
    
    // 為雷射塔添加特殊視覺效果
    this.addLaserTowerEffects();
  }

  /**
   * 添加雷射塔特殊效果
   */
  addLaserTowerEffects() {
    // 創建雷射塔特殊發光效果
    if (this.towerBody) {
      this.towerBody.setTint(0x66ffff); // 藍色光芒
    }
    
    // 添加能量核心
    this.energyCore = this.scene.add.circle(0, 0, 8, 0x00ffff);
    this.energyCore.setAlpha(0.8);
    this.add(this.energyCore);
    
    // 創建能量脈衝動畫
    this.energyPulse = this.scene.tweens.add({
      targets: this.energyCore,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.4,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 添加能量環
    this.energyRings = [];
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(0, 0, 12 + i * 4, 0x00ffff, 0);
      ring.setStrokeStyle(1, 0x00ffff, 0.3 - i * 0.1);
      this.add(ring);
      this.energyRings.push(ring);
    }
  }

  /**
   * 覆寫：升級後的外觀變化（雷射塔專屬）
   */
  updateVisuals() {
    // 先讓基類處理通用外觀（等級字樣、射程圈、主體顏色等）
    super.updateVisuals();

    // 依等級強化能量核心大小與亮度
    if (this.energyCore) {
      const coreScale = 1 + (this.level - 1) * 0.12; // 每級+12%
      this.energyCore.setScale(coreScale);
      this.energyCore.setAlpha(0.7 + (this.level - 1) * 0.05); // 略增亮度
    }

    // 依等級強化能量環的筆觸與透明度
    if (this.energyRings && this.energyRings.length) {
      this.energyRings.forEach((ring, index) => {
        const width = 1 + Math.min(this.level - 1, 3) * 0.5; // 筆觸略加粗（上限）
        const alpha = Math.max(0, 0.35 - index * 0.08 + (this.level - 1) * 0.03);
        ring.setStrokeStyle(width, 0x00ffff, alpha);
      });
    }

    // 顯示一次升級脈衝特效（雷射塔專屬）
    this.createLaserUpgradeBurst();
  }

  /**
   * 升級時的雷射專屬脈衝光環
   */
  createLaserUpgradeBurst() {
    const burst = this.scene.add.graphics();
    burst.setDepth(92);

    let radius = 6;
    const maxRadius = 36 + (this.level - 1) * 4;

    const tween = this.scene.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (!burst || !burst.clear) { tween.remove(false); return; }
        burst.clear();
        burst.lineStyle(2, 0x00ffff, 0.9);
        burst.strokeCircle(this.x, this.y, radius);
        burst.lineStyle(6, 0x00aaff, 0.15);
        burst.strokeCircle(this.x, this.y, radius);
        radius += 2;
        if (radius >= maxRadius) {
          tween.remove(false);
          burst.destroy();
        }
      }
    });
  }

  /**
   * 重寫射擊方法 - 雷射特殊攻擊
   */
  fire() {
    if (!this.currentTarget || this.isCharging) return;
    
    console.log(`⚡ 雷射塔開始充能攻擊目標 (${this.currentTarget.x.toFixed(1)}, ${this.currentTarget.y.toFixed(1)})`);
    
    // 開始充能動畫
    this.startChargeAnimation();
  }

  /**
   * 創建雷射束效果
   */
  createLaserBeam() {
    if (!this.currentTarget) return;
    
    // 移除舊的雷射束
    if (this.laserBeam) {
      this.laserBeam.destroy();
    }
    
    // 計算雷射束起點和終點
    const firePos = this.getFirePosition();
    const targetPos = { x: this.currentTarget.x, y: this.currentTarget.y };
    
    // 創建雷射束線條
    this.laserBeam = this.scene.add.graphics();
    this.laserBeam.setDepth(100); // 確保在最上層
    
    // 繪製主雷射束（紅色核心）
    this.laserBeam.lineStyle(3, 0xff0000, 1);
    this.laserBeam.moveTo(firePos.x, firePos.y);
    this.laserBeam.lineTo(targetPos.x, targetPos.y);
    this.laserBeam.strokePath();
    
    // 繪製外層發光效果（淺紅色）
    this.laserBeam.lineStyle(8, 0xff6666, 0.3);
    this.laserBeam.moveTo(firePos.x, firePos.y);
    this.laserBeam.lineTo(targetPos.x, targetPos.y);
    this.laserBeam.strokePath();
    
    // 創建雷射粒子效果
    this.createLaserParticles(firePos, targetPos);
    
    console.log(`✨ 雷射束從 (${firePos.x.toFixed(1)}, ${firePos.y.toFixed(1)}) 到 (${targetPos.x.toFixed(1)}, ${targetPos.y.toFixed(1)})`);
  }

  /**
   * 創建雷射粒子效果
   */
  createLaserParticles(startPos, endPos) {
    // 如果場景沒有粒子系統，跳過
    if (!this.scene.add.particles) {
      console.log('⚠️ 粒子系統不可用，跳過雷射粒子效果');
      return;
    }
    
    try {
      // 計算中點位置用於粒子發射
      const midX = (startPos.x + endPos.x) / 2;
      const midY = (startPos.y + endPos.y) / 2;
      
      // 移除舊的粒子效果
      if (this.laserParticles) {
        this.laserParticles.destroy();
      }
      
      // 創建簡單的圓形粒子紋理
      if (!this.scene.textures.exists('laser_particle')) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xff0000);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('laser_particle', 8, 8);
        graphics.destroy();
      }
      
      // 創建粒子發射器
      this.laserParticles = this.scene.add.particles(midX, midY, 'laser_particle', {
        speed: { min: 20, max: 50 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 100,
        quantity: 3,
        blendMode: 'ADD'
      });
      
      this.laserParticles.setDepth(99);
      
      // 短時間後停止粒子發射
      this.scene.time.delayedCall(150, () => {
        if (this.laserParticles) {
          this.laserParticles.stop();
          this.scene.time.delayedCall(200, () => {
            if (this.laserParticles) {
              this.laserParticles.destroy();
              this.laserParticles = null;
            }
          });
        }
      });
      
      console.log(`🌟 雷射粒子效果創建於 (${midX.toFixed(1)}, ${midY.toFixed(1)})`);
      
    } catch (error) {
      console.log('⚠️ 粒子效果創建失敗:', error.message);
    }
  }

  /**
   * 創建雷射命中效果
   */
  createLaserHitEffect() {
    if (!this.currentTarget) return;
    
    try {
      // 創建命中爆炸效果
      if (!this.scene.textures.exists('hit_particle')) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffff00); // 黃色爆炸
        graphics.fillCircle(3, 3, 3);
        graphics.generateTexture('hit_particle', 6, 6);
        graphics.destroy();
      }
      
      // 移除舊的命中效果
      if (this.laserHitEffect) {
        this.laserHitEffect.destroy();
      }
      
      // 創建命中粒子爆炸
      this.laserHitEffect = this.scene.add.particles(this.currentTarget.x, this.currentTarget.y, 'hit_particle', {
        speed: { min: 50, max: 100 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 200,
        quantity: 8,
        blendMode: 'ADD'
      });
      
      this.laserHitEffect.setDepth(101);
      this.laserHitEffect.explode();
      
      // 清理命中效果
      this.scene.time.delayedCall(300, () => {
        if (this.laserHitEffect) {
          this.laserHitEffect.destroy();
          this.laserHitEffect = null;
        }
      });
      
      console.log(`💥 雷射命中效果於 (${this.currentTarget.x.toFixed(1)}, ${this.currentTarget.y.toFixed(1)})`);
      
    } catch (error) {
      console.log('⚠️ 命中效果創建失敗:', error.message);
    }
  }

  /**
   * 隱藏雷射束
   */
  hideLaserBeam() {
    this.laserActive = false;
    
    if (this.laserBeam) {
      this.laserBeam.destroy();
      this.laserBeam = null;
    }
    
    console.log(`🔌 雷射束效果結束`);
  }

  /**
   * 開始充能動畫
   */
  startChargeAnimation() {
    if (this.isCharging) return;
    
    // 清理任何之前的充能效果
    this.cleanupChargeEffects();
    
    this.isCharging = true;
    console.log(`🔋 雷射塔開始充能...`);
    
    // 播放充能音效
    if (this.scene.enhancedAudio) {
      this.scene.enhancedAudio.playSound('laser_charge');
    }
    
    // 停止原有的脈衝動畫
    if (this.energyPulse) {
      this.energyPulse.pause();
    }
    
    // 創建充能粒子效果
    this.createChargeParticles();
    
    // 創建充能視覺效果
    this.createChargeVisualEffect();
    
    // 能量核心充能動畫
    this.scene.tweens.add({
      targets: this.energyCore,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 1,
      duration: this.chargeTime,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.fireAfterCharge();
      }
    });
    
    // 能量環擴散動畫
    this.energyRings.forEach((ring, index) => {
      this.scene.tweens.add({
        targets: ring,
        scaleX: 1.5 + index * 0.2,
        scaleY: 1.5 + index * 0.2,
        alpha: 0.6 - index * 0.1,
        duration: this.chargeTime,
        ease: 'Power2.easeOut'
      });
    });
  }

  /**
   * 創建充能粒子效果
   */
  createChargeParticles() {
    try {
      // 創建充能粒子紋理
      if (!this.scene.textures.exists('charge_particle')) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x00ffff);
        graphics.fillCircle(3, 3, 3);
        graphics.generateTexture('charge_particle', 6, 6);
        graphics.destroy();
      }
      
      // 移除舊的充能粒子
      if (this.chargeParticles) {
        this.chargeParticles.destroy();
      }
      
      // 創建向中心聚集的粒子效果
      this.chargeParticles = this.scene.add.particles(this.x, this.y, 'charge_particle', {
        speed: { min: 20, max: 40 },
        scale: { start: 0.1, end: 0.4 },
        alpha: { start: 0.8, end: 1 },
        lifespan: this.chargeTime,
        quantity: 2,
        blendMode: 'ADD',
        emitZone: {
          type: 'edge',
          source: new Phaser.Geom.Circle(0, 0, 30),
          quantity: 8
        },
        gravityX: 0,
        gravityY: 0
      });
      
      // 設置粒子向中心移動
      this.chargeParticles.setGravity(0, 0);
      this.chargeParticles.setDepth(95);
      
      console.log(`⚡ 充能粒子效果創建`);
      
    } catch (error) {
      console.log('⚠️ 充能粒子效果創建失敗:', error.message);
    }
  }

  /**
   * 創建充能視覺效果
   */
  createChargeVisualEffect() {
    // 移除舊的充能效果
    if (this.chargeEffect) {
      this.chargeEffect.destroy();
    }
    
    // 創建充能光環
    this.chargeEffect = this.scene.add.graphics();
    this.chargeEffect.setDepth(90);
    
    // 繪製充能光環動畫
    let currentRadius = 5;
    const maxRadius = 25;
    
    // 存儲計時器引用以便清理
    this.chargeInterval = this.scene.time.addEvent({
      delay: 20,
      repeat: this.chargeTime / 20,
      callback: () => {
        // 安全檢查：確保chargeEffect仍然存在
        if (!this.chargeEffect || !this.chargeEffect.clear) {
          console.log('⚠️ chargeEffect已被銷毀，停止動畫');
          if (this.chargeInterval) {
            this.chargeInterval.destroy();
            this.chargeInterval = null;
          }
          return;
        }
        
        this.chargeEffect.clear();
        
        // 繪製多層光環
        for (let i = 0; i < 3; i++) {
          const radius = currentRadius + i * 5;
          const alpha = 0.8 - i * 0.2 - (currentRadius / maxRadius) * 0.3;
          
          if (alpha > 0) {
            this.chargeEffect.lineStyle(2, 0x00ffff, alpha);
            this.chargeEffect.strokeCircle(this.x, this.y, radius);
          }
        }
        
        currentRadius += 0.8;
        if (currentRadius > maxRadius) {
          currentRadius = 5;
        }
      }
    });
    
    // 充能結束後清理
    this.scene.time.delayedCall(this.chargeTime, () => {
      this.cleanupChargeInterval();
      if (this.chargeEffect) {
        this.chargeEffect.destroy();
        this.chargeEffect = null;
      }
    });
  }

  /**
   * 充能完成後發射雷射
   */
  fireAfterCharge() {
    console.log(`🚀 雷射塔充能完成，發射雷射！`);
    
    // 重置充能狀態
    this.isCharging = false;
    
    // 清理充能效果
    this.cleanupChargeEffects();
    
    // 恢復能量核心到正常狀態
    this.scene.tweens.add({
      targets: this.energyCore,
      scaleX: 1,
      scaleY: 1,
      alpha: 0.8,
      duration: 100,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // 恢復正常脈衝動畫
        if (this.energyPulse) {
          this.energyPulse.resume();
        }
      }
    });
    
    // 重置能量環
    this.energyRings.forEach(ring => {
      this.scene.tweens.add({
        targets: ring,
        scaleX: 1,
        scaleY: 1,
        alpha: 0,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });
    
    // 創建增強版雷射束效果
    this.createEnhancedLaserBeam();
    
    // 執行原有的傷害邏輯
    if (this.currentTarget && this.currentTarget.takeDamage) {
      const damageDealt = this.currentTarget.takeDamage(this.damage, 'laser', this);
      this.stats.damageDealt += damageDealt;
      
      if (this.currentTarget.health <= 0) {
        this.stats.enemiesKilled++;
        console.log(`⚡ 雷射塔擊殺 ${this.currentTarget.enemyType}敵人！總擊殺: ${this.stats.enemiesKilled}`);
      }
      
      console.log(`💥 增強雷射造成 ${damageDealt} 點傷害`);
    }
    
    // 創建增強版命中效果
    this.createEnhancedLaserHitEffect();
    
    // 添加屏幕震動效果
    if (this.scene.screenShake) {
      this.scene.screenShake.laserHit(5);
    }
    
    // 更新統計
    this.stats.shotsFired++;
    
    // 播放雷射音效
    if (this.scene.enhancedAudio) {
      this.scene.enhancedAudio.playSound('laser_fire');
    }
    
    // 增強版雷射束持續時間更長
    this.laserActive = true;
    this.scene.time.delayedCall(250, () => {
      this.hideLaserBeam();
    });
  }

  /**
   * 清理充能效果
   */
  cleanupChargeEffects() {
    // 清理充能計時器
    this.cleanupChargeInterval();
    
    // 清理充能粒子
    if (this.chargeParticles) {
      this.chargeParticles.stop();
      this.scene.time.delayedCall(200, () => {
        if (this.chargeParticles) {
          this.chargeParticles.destroy();
          this.chargeParticles = null;
        }
      });
    }
    
    // 清理充能圖形效果
    if (this.chargeEffect) {
      this.chargeEffect.destroy();
      this.chargeEffect = null;
    }
  }

  /**
   * 清理充能動畫計時器
   */
  cleanupChargeInterval() {
    if (this.chargeInterval) {
      this.chargeInterval.destroy();
      this.chargeInterval = null;
      console.log('🧹 充能動畫計時器已清理');
    }
  }

  /**
   * 創建增強版雷射束效果
   */
  createEnhancedLaserBeam() {
    if (!this.currentTarget) return;
    
    // 移除舊的雷射束
    if (this.laserBeam) {
      this.laserBeam.destroy();
    }
    
    // 計算雷射束起點和終點
    const firePos = this.getFirePosition();
    const targetPos = { x: this.currentTarget.x, y: this.currentTarget.y };
    
    // 創建增強版雷射束線條
    this.laserBeam = this.scene.add.graphics();
    this.laserBeam.setDepth(100);
    
    // 繪製核心雷射束（更亮的紅色）
    this.laserBeam.lineStyle(4, 0xff0000, 1);
    this.laserBeam.moveTo(firePos.x, firePos.y);
    this.laserBeam.lineTo(targetPos.x, targetPos.y);
    this.laserBeam.strokePath();
    
    // 繪製內層發光（白色核心）
    this.laserBeam.lineStyle(2, 0xffffff, 0.8);
    this.laserBeam.moveTo(firePos.x, firePos.y);
    this.laserBeam.lineTo(targetPos.x, targetPos.y);
    this.laserBeam.strokePath();
    
    // 繪製外層發光效果（更大範圍）
    this.laserBeam.lineStyle(12, 0xff3333, 0.2);
    this.laserBeam.moveTo(firePos.x, firePos.y);
    this.laserBeam.lineTo(targetPos.x, targetPos.y);
    this.laserBeam.strokePath();
    
    // 創建增強版雷射粒子效果
    this.createEnhancedLaserParticles(firePos, targetPos);
    
    console.log(`✨ 增強雷射束從 (${firePos.x.toFixed(1)}, ${firePos.y.toFixed(1)}) 到 (${targetPos.x.toFixed(1)}, ${targetPos.y.toFixed(1)})`);
  }

  /**
   * 創建增強版雷射粒子效果
   */
  createEnhancedLaserParticles(startPos, endPos) {
    try {
      // 計算多個發射點沿著雷射束
      const points = [];
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        points.push({
          x: startPos.x + (endPos.x - startPos.x) * t,
          y: startPos.y + (endPos.y - startPos.y) * t
        });
      }
      
      // 移除舊的粒子效果
      if (this.laserParticles) {
        this.laserParticles.destroy();
      }
      
      // 為每個點創建粒子發射器
      points.forEach((point, index) => {
        const particles = this.scene.add.particles(point.x, point.y, 'laser_particle', {
          speed: { min: 30, max: 80 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 200,
          quantity: index === 0 || index === points.length - 1 ? 8 : 4, // 起點終點更多粒子
          blendMode: 'ADD'
        });
        
        particles.setDepth(99);
        particles.explode();
        
        // 清理粒子效果
        this.scene.time.delayedCall(300, () => {
          if (particles) {
            particles.destroy();
          }
        });
      });
      
      console.log(`🌟 增強雷射粒子效果創建於 ${points.length} 個位置`);
      
    } catch (error) {
      console.log('⚠️ 增強雷射粒子效果創建失敗:', error.message);
    }
  }

  /**
   * 創建增強版雷射命中效果
   */
  createEnhancedLaserHitEffect() {
    if (!this.currentTarget) return;
    
    try {
      // 創建增強版命中爆炸效果
      if (!this.scene.textures.exists('enhanced_hit_particle')) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffffff); // 白色核心
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('enhanced_hit_particle', 8, 8);
        graphics.destroy();
      }
      
      // 移除舊的命中效果
      if (this.laserHitEffect) {
        this.laserHitEffect.destroy();
      }
      
      // 創建多層爆炸效果
      for (let layer = 0; layer < 3; layer++) {
        const particles = this.scene.add.particles(this.currentTarget.x, this.currentTarget.y, 
          layer === 0 ? 'enhanced_hit_particle' : 'hit_particle', {
          speed: { min: 60 + layer * 20, max: 120 + layer * 30 },
          scale: { start: 0.8 - layer * 0.2, end: 0 },
          alpha: { start: 1 - layer * 0.2, end: 0 },
          lifespan: 300 + layer * 100,
          quantity: 12 - layer * 2,
          blendMode: 'ADD'
        });
        
        particles.setDepth(101 + layer);
        particles.explode();
        
        // 清理命中效果
        this.scene.time.delayedCall(500 + layer * 100, () => {
          if (particles) {
            particles.destroy();
          }
        });
      }
      
      console.log(`💥 增強雷射命中效果於 (${this.currentTarget.x.toFixed(1)}, ${this.currentTarget.y.toFixed(1)})`);
      
    } catch (error) {
      console.log('⚠️ 增強命中效果創建失敗:', error.message);
    }
  }

  /**
   * 顯示射程範圍 - 雷射塔特殊效果
   */
  showRange() {
    super.showRange();
    
    // 為雷射塔添加特殊射程指示效果
    if (this.rangeIndicator) {
      this.rangeIndicator.setStrokeStyle(2, 0x00ffff, 0.6); // 藍色邊框
      this.rangeIndicator.setFillStyle(0x0066ff, 0.1); // 淺藍色填充
    }
  }

  /**
   * 更新塔邏輯 - 添加雷射特殊邏輯
   */
  update(time, delta) {
    super.update(time, delta);
    
    // 雷射塔特殊更新邏輯
    if (this.laserActive && this.currentTarget) {
      // 雷射束跟隨目標（可選，讓雷射更動態）
      // this.updateLaserBeamPosition();
    }
  }

  /**
   * 銷毀雷射塔
   */
  destroy() {
    // 清理充能相關資源
    this.cleanupChargeEffects();
    
    // 清理雷射相關資源
    if (this.laserBeam) {
      this.laserBeam.destroy();
    }
    
    if (this.laserParticles) {
      this.laserParticles.destroy();
    }
    
    if (this.laserHitEffect) {
      this.laserHitEffect.destroy();
    }
    
    super.destroy();
    console.log('🔫 雷射塔已銷毀');
  }
}
