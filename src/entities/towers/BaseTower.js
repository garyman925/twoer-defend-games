/**
 * 基礎塔類
 * 所有防禦塔的基類，提供共通功能
 */

import GameConfig from '../../core/GameConfig.js';

export class BaseTower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, towerType = 'basic') {
    super(scene, x, y);
    
    // 塔的基本屬性
    this.towerType = towerType;
    this.level = 1;
    this.maxLevel = 5;
    
    // 戰鬥屬性
    this.damage = 0;
    this.range = 0;
    this.fireRate = 0;
    this.lastFireTime = 0;
    
    // 成本相關
    this.buildCost = 0;
    this.upgradeCosts = [];
    this.sellValue = 0;
    
    // 目標追蹤
    this.currentTarget = null;
    this.targetingMode = 'first'; // first, last, closest, strongest
    
    // 視覺組件
    this.towerSprite = null;
    this.rangeIndicator = null;
    this.levelIndicator = null;
    this.upgradeEffect = null;
    
    // 投射物管理
    this.projectiles = [];
    this.projectilePool = [];
    
    // 雷射系統
    this.laserBeam = null;
    this.laserParticles = null;
    this.laserHitEffect = null;
    this.laserActive = false;
    
    // 狀態
    this.isActive = true;
    this.isSelected = false;
    this.isUpgrading = false;
    
    // 調試用
    this.lastEnemyCount = 0;
    
    // 統計數據
    this.stats = {
      enemiesKilled: 0,
      damageDealt: 0,
      shotsFired: 0,
      timeActive: 0
    };
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 添加到場景
    scene.add.existing(this);
    
    // 初始化塔
    this.init();
    
    console.log(`創建${towerType}塔於 (${x}, ${y})`);
  }

  /**
   * 初始化塔
   */
  init() {
    // 加載塔配置
    this.loadTowerConfig();
    
    // 創建視覺元素
    this.createTowerVisuals();
    
    // 創建投射物池
    this.createProjectilePool();
    
    // 設置物理體（只有活躍塔才需要）
    this.setupPhysics();
    
    // 設置交互（只有活躍塔才需要）
    if (this.isActive) {
      this.setupInteraction();
    }
  }

  /**
   * 加載塔配置
   */
  loadTowerConfig() {
    // 從遊戲配置中獲取塔數據
    const towerData = GameConfig.TOWER.TYPES[this.towerType];
    
    if (!towerData) {
      console.error(`塔類型 ${this.towerType} 的配置不存在`);
      // 使用默認配置
      this.damage = 30;
      this.range = 120;
      this.fireRate = 1000;
      this.buildCost = 50;
      this.upgradeCosts = [30, 50, 80, 120];
      return;
    }
    
    // 設置基礎屬性
    this.damage = towerData.damage[this.level - 1] || towerData.damage[0];
    this.range = towerData.range[this.level - 1] || towerData.range[0];
    this.fireRate = towerData.fireRate[this.level - 1] || towerData.fireRate[0];
    this.buildCost = towerData.buildCost;
    this.upgradeCosts = towerData.upgradeCosts || [];
    
    console.log(`${this.towerType}塔配置加載完成 - 傷害:${this.damage}, 射程:${this.range}`);
  }

  /**
   * 創建塔視覺元素
   */
  createTowerVisuals() {
    // 塔主體 (使用你的塔圖片)
    this.createTowerBody();
    
    // 射程指示器
    this.createRangeIndicator();
    
    // 等級指示器
    this.createLevelIndicator();
  }

  /**
   * 創建塔底座
   */
  createTowerBase() {
    const baseSize = 30;
    this.towerBase = this.scene.add.circle(0, 0, baseSize, 0x666666);
    this.towerBase.setStrokeStyle(2, 0x444444);
    this.add(this.towerBase);
    
    // 底座裝飾
    const decoration = this.scene.add.circle(0, 0, baseSize - 5, 0x888888, 0.3);
    this.add(decoration);
  }

  /**
   * 創建塔主體
   */
  createTowerBody() {
    // 使用塔圖片而不是顏色方塊
    const towerFrameMap = {
      basic: 'tower-1.png',
      cannon: 'tower-2.png', 
      laser: 'tower-3.png',
      ice: 'tower-1.png',    // 暫時使用基礎塔圖片
      poison: 'tower-2.png'  // 暫時使用加農炮塔圖片
    };
    
    const frameName = towerFrameMap[this.towerType] || 'tower-1.png';
    
    // 創建塔精靈
    this.towerSprite = this.scene.add.image(0, 0, 'tower-sprites', frameName);
    
    // 縮放到合適大小 (64x64 -> 96x96 以佔3x3網格)
    this.towerSprite.setScale(1.5);
    
    // 設置錨點為中心
    this.towerSprite.setOrigin(0.5, 0.5);
    
    this.add(this.towerSprite);
    
    console.log(`創建 ${this.towerType} 塔，使用圖片: ${frameName}`);
  }

  /**
   * 創建塔圖標
   */
  createTowerIcon() {
    const icons = {
      basic: '●',
      cannon: '💥',
      laser: '⚡',
      ice: '❄️',
      poison: '☠️'
    };
    
    const icon = icons[this.towerType] || icons.basic;
    
    this.towerIcon = this.scene.add.text(0, 0, icon, {
      fontSize: '16px',
      fill: '#ffffff'
    });
    this.towerIcon.setOrigin(0.5);
    this.add(this.towerIcon);
  }

  /**
   * 創建塔炮管
   */
  createTowerBarrel() {
    this.towerBarrel = this.scene.add.rectangle(0, -15, 6, 20, 0xcccccc);
    this.towerBarrel.setStrokeStyle(1, 0xffffff);
    this.add(this.towerBarrel);
  }

  /**
   * 創建射程指示器
   */
  createRangeIndicator() {
    this.rangeIndicator = this.scene.add.circle(0, 0, this.range, 0x00ffff, 0);
    this.rangeIndicator.setStrokeStyle(4, 0x00ffff, 0.3); // 進一步增加線條粗細
    this.rangeIndicator.setVisible(false);
    this.add(this.rangeIndicator);
  }

  /**
   * 創建等級指示器
   */
  createLevelIndicator() {
    this.levelIndicator = this.scene.add.text(-30, -30, this.level.toString(), {
      fontSize: '20px', // 進一步增加字體大小
      fill: '#ffd93d',
      fontWeight: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 } // 進一步增加內邊距
    });
    this.levelIndicator.setOrigin(0.5);
    this.add(this.levelIndicator);
  }

  /**
   * 創建投射物池
   */
  createProjectilePool() {
    const poolSize = 20;
    
    for (let i = 0; i < poolSize; i++) {
      const projectile = new TowerProjectile(this.scene, this);
      projectile.setActive(false);
      projectile.setVisible(false);
      this.projectilePool.push(projectile);
    }
    
    console.log(`${this.towerType}塔投射物池創建完成，大小: ${poolSize}`);
  }

  /**
   * 設置物理體
   */
  setupPhysics() {
    // 只有非預覽塔才需要物理體
    if (this.isActive) {
      // 啟用物理體
      this.scene.physics.world.enable(this);
      
      // 檢查物理體是否成功創建
      if (this.body) {
        this.body.setCircle(30);
        this.body.setImmovable(true);
      } else {
        console.warn('塔物理體創建失敗');
      }
    }
  }

  /**
   * 設置調色（Container版本）
   * @param {number} tint - 調色值，如 0x00ff00 (綠色)，0xff0000 (紅色)
   */
  setTint(tint) {
    // 對所有子對象設置調色
    this.list.forEach(child => {
      if (child && typeof child.setTint === 'function') {
        child.setTint(tint);
      }
    });
    return this;
  }

  /**
   * 清除調色
   */
  clearTint() {
    this.list.forEach(child => {
      if (child && typeof child.clearTint === 'function') {
        child.clearTint();
      }
    });
    return this;
  }

  /**
   * 設置交互
   */
  setupInteraction() {
    // 設定容器尺寸與可點擊範圍，確保能接收到指標事件
    const hitRadius = 22; // 約略與塔基座相近
    this.setSize(hitRadius * 2, hitRadius * 2);
    this.setInteractive(new Phaser.Geom.Circle(0, 0, hitRadius), Phaser.Geom.Circle.Contains);
    this.input && (this.input.cursor = 'pointer');
    
    // 點擊選中
    this.on('pointerdown', this.onTowerClick, this);
    
    // 懸停效果
    this.on('pointerover', this.onTowerHover, this);
    this.on('pointerout', this.onTowerOut, this);
  }

  /**
   * 塔點擊處理
   */
  onTowerClick() {
    this.selectTower();
    this.showTowerInfo();
  }

  /**
   * 塔懸停處理
   */
  onTowerHover() {
    this.showRange(true);
    this.setScale(1.1);
  }

  /**
   * 塔移出處理
   */
  onTowerOut() {
    if (!this.isSelected) {
      this.showRange(false);
      this.setScale(1.0);
    }
  }

  /**
   * 選中塔
   */
  selectTower() {
    // 取消其他塔的選中狀態
    this.scene.towers.children.entries.forEach(tower => {
      if (tower !== this && tower.isSelected) {
        tower.deselectTower();
      }
    });
    
    this.isSelected = true;
    this.showRange(true);
    this.setScale(1.1);
    
    // 發送選中事件
    this.eventEmitter.emit('towerSelected', this);
    this.scene.events.emit('towerSelected', this);
    
    console.log(`選中${this.towerType}塔`);
  }

  /**
   * 取消選中塔
   */
  deselectTower() {
    this.isSelected = false;
    this.showRange(false);
    this.setScale(1.0);
    
    // 發送取消選中事件
    this.eventEmitter.emit('towerDeselected', this);
    
    console.log(`取消選中${this.towerType}塔`);
  }

  /**
   * 顯示/隱藏射程
   */
  showRange(visible) {
    if (this.rangeIndicator) {
      this.rangeIndicator.setVisible(visible);
      
      if (visible) {
        // 射程脈衝動畫
        this.scene.tweens.add({
          targets: this.rangeIndicator,
          alpha: { from: 0.3, to: 0.1 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else {
        // 停止動畫
        this.scene.tweens.killTweensOf(this.rangeIndicator);
        this.rangeIndicator.setAlpha(0.3);
      }
    }
  }

  /**
   * 顯示塔信息
   */
  showTowerInfo() {
    // 創建信息面板
    this.scene.events.emit('showTowerInfo', {
      tower: this,
      info: {
        type: this.towerType,
        level: this.level,
        damage: this.damage,
        range: this.range,
        fireRate: this.fireRate,
        upgradeCost: this.getUpgradeCost(),
        sellValue: this.getSellValue(),
        stats: this.stats
      }
    });
  }

  /**
   * 更新塔邏輯
   */
  update(time, delta) {
    if (!this.isActive) {
      console.log(`${this.towerType}塔未激活，跳過更新`);
      return;
    }
    
    // 定期輸出塔的狀態（每3秒一次）
    if (Math.floor(time / 3000) !== Math.floor((time - delta) / 3000)) {
      console.log(`📍 ${this.towerType}塔狀態: 位置(${this.x.toFixed(1)}, ${this.y.toFixed(1)}), 射程: ${this.range}, 活躍: ${this.isActive}`);
    }
    
    // 更新統計數據
    this.stats.timeActive += delta;
    
    // 尋找目標
    this.findTarget();
    
    // 瞄準目標
    if (this.currentTarget) {
      this.aimAtTarget();
      
      // 射擊
      if (this.canFire(time)) {
        this.fire();
        this.lastFireTime = time;
      }
    }
    
    // 更新投射物
    this.updateProjectiles(time, delta);
  }

  /**
   * 尋找目標
   */
  findTarget() {
    if (!this.scene.enemies || this.scene.enemies.children.entries.length === 0) {
      this.currentTarget = null;
      return;
    }
    
    const allEnemies = this.scene.enemies.children.entries;
    // 只在有目標變化時輸出日誌，減少控制台噪音
    const enemiesInRange = allEnemies.filter(enemy => {
      if (!enemy.active || !enemy.isAlive) return false;
      
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      return distance <= this.range;
    });
    
    // 只在射程內敵人數量變化時輸出
    if (enemiesInRange.length !== this.lastEnemyCount) {
      console.log(`🎯 ${this.towerType}塔檢查: 射程內敵人 ${enemiesInRange.length}/${allEnemies.length} 個 (射程: ${this.range})`);
      this.lastEnemyCount = enemiesInRange.length;
    }
    
    if (enemiesInRange.length === 0) {
      // 如果失去目標，記錄日誌
      if (this.currentTarget) {
        console.log(`${this.towerType}塔失去目標`);
      }
      this.currentTarget = null;
      return;
    }
    
    // 根據瞄準模式選擇目標
    const newTarget = this.selectTargetByMode(enemiesInRange);
    
    // 如果目標改變，記錄日誌
    if (newTarget !== this.currentTarget) {
      if (newTarget) {
        console.log(`${this.towerType}塔鎖定新目標: ${newTarget.enemyType}敵人`);
      }
    }
    
    this.currentTarget = newTarget;
  }

  /**
   * 根據模式選擇目標
   */
  selectTargetByMode(enemies) {
    switch (this.targetingMode) {
      case 'first':
        // 選擇距離終點最近的敵人
        return enemies.reduce((closest, enemy) => {
          return enemy.distanceToEnd < closest.distanceToEnd ? enemy : closest;
        });
        
      case 'last':
        // 選擇距離終點最遠的敵人
        return enemies.reduce((farthest, enemy) => {
          return enemy.distanceToEnd > farthest.distanceToEnd ? enemy : farthest;
        });
        
      case 'closest':
        // 選擇距離塔最近的敵人
        return enemies.reduce((closest, enemy) => {
          const distToCurrent = Phaser.Math.Distance.Between(this.x, this.y, closest.x, closest.y);
          const distToEnemy = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
          return distToEnemy < distToCurrent ? enemy : closest;
        });
        
      case 'strongest':
        // 選擇生命值最高的敵人
        return enemies.reduce((strongest, enemy) => {
          return enemy.health > strongest.health ? enemy : strongest;
        });
        
      default:
        return enemies[0];
    }
  }

  /**
   * 瞄準目標
   */
  aimAtTarget() {
    if (!this.currentTarget || !this.towerSprite) return;
    
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
    
    // 旋轉整個塔圖片來瞄準目標
    this.towerSprite.setRotation(angle + Math.PI / 2);
  }

  /**
   * 檢查是否可以射擊
   */
  canFire(time) {
    return time - this.lastFireTime >= this.fireRate;
  }

  /**
   * 射擊
   */
  fire() {
    if (!this.currentTarget) return;
    
    // 獲取投射物
    const projectile = this.getProjectileFromPool();
    if (!projectile) return;
    
    // 計算射擊位置
    const firePos = this.getFirePosition();
    
    // 發射投射物
    projectile.fire(firePos.x, firePos.y, this.currentTarget, {
      damage: this.damage,
      speed: 300,
      towerType: this.towerType
    });
    
    this.projectiles.push(projectile);
    
    // 播放射擊效果
    this.playFireEffects();
    
    // 更新統計
    this.stats.shotsFired++;
    
    // 播放射擊音效
    this.scene.playSound && this.scene.playSound('tower_shoot');
    
    // 添加到場景投射物群組
    if (this.scene.projectiles) {
      this.scene.projectiles.add(projectile);
    }
    
    console.log(`${this.towerType}塔射擊，目標: ${this.currentTarget.enemyType}敵人`);
  }

  /**
   * 獲取射擊位置
   */
  getFirePosition() {
    // 從塔圖片的前端發射
    if (!this.towerSprite) {
      // 如果塔圖片不存在，從塔中心發射
      return { x: this.x, y: this.y };
    }
    
    const angle = this.towerSprite.rotation - Math.PI / 2;
    const distance = 48; // 增加距離，因為塔圖片更大
    
    return {
      x: this.x + Math.cos(angle) * distance,
      y: this.y + Math.sin(angle) * distance
    };
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
    const muzzleFlash = this.scene.add.circle(0, -25, 8, 0xffff00, 0.8);
    this.add(muzzleFlash);
    
    this.scene.tweens.add({
      targets: muzzleFlash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        muzzleFlash.destroy();
      }
    });
    
    // 塔震動 (保持當前縮放比例)
    const currentScale = this.towerSprite.scaleX;
    this.scene.tweens.add({
      targets: this.towerSprite,
      scaleX: { from: currentScale, to: currentScale * 1.1 },
      scaleY: { from: currentScale, to: currentScale * 1.1 },
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
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
  }

  /**
   * 升級塔
   */
  upgrade() {
    if (this.level >= this.maxLevel) {
      console.log('塔已達到最高等級');
      return false;
    }
    
    const upgradeCost = this.getUpgradeCost();
    
    // 檢查是否有足夠資源（這裡需要與資源管理系統集成）
    // if (!this.scene.canAfford(upgradeCost)) return false;
    
    this.isUpgrading = true;
    this.level++;
    
    // 重新加載配置
    this.loadTowerConfig();
    
    // 更新視覺
    this.updateVisualForLevel();
    
    // 播放升級效果
    this.playUpgradeEffect();
    
    // 發送升級事件
    this.eventEmitter.emit('towerUpgraded', {
      tower: this,
      newLevel: this.level,
      cost: upgradeCost
    });
    
    this.isUpgrading = false;
    
    console.log(`${this.towerType}塔升級到等級 ${this.level}`);
    
    return true;
  }

  /**
   * 更新等級視覺效果
   */
  updateVisualForLevel() {
    // 更新等級指示器
    this.levelIndicator.setText(this.level.toString());
    
    // 根據等級調整大小 (保持 1.5 基礎縮放，額外增加升級縮放)
    const baseScale = 1.5; // 基礎縮放 (64x64 -> 96x96)
    const upgradeScale = 1 + (this.level - 1) * 0.1;
    this.towerSprite.setScale(baseScale * upgradeScale);
    
    // 更新射程指示器
    this.rangeIndicator.setRadius(this.range);
    
    // 根據等級添加光效
    if (this.level >= 3) {
      const glow = this.scene.add.circle(0, 0, 35, 0xffffff, 0.1);
      this.add(glow);
      
      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.1, to: 0.3 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * 播放升級效果
   */
  playUpgradeEffect() {
    // 升級光環效果
    const upgradeRing = this.scene.add.circle(0, 0, 10, 0xffd93d, 0.8);
    this.add(upgradeRing);
    
    this.scene.tweens.add({
      targets: upgradeRing,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        upgradeRing.destroy();
      }
    });
    
    // 升級粒子效果
    this.createUpgradeParticles();
    
    // 播放升級音效
    this.scene.playSound && this.scene.playSound('tower_upgrade');
  }

  /**
   * 創建升級粒子效果
   */
  createUpgradeParticles() {
    for (let i = 0; i < 12; i++) {
      const particle = this.scene.add.circle(0, 0, 3, 0xffd93d);
      this.add(particle);
      
      const angle = (i / 12) * Math.PI * 2;
      const distance = 50;
      
      this.scene.tweens.add({
        targets: particle,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * 出售塔
   */
  sell() {
    const sellValue = this.getSellValue();
    
    // 播放出售效果
    this.playSellEffect();
    
    // 發送出售事件
    this.eventEmitter.emit('towerSold', {
      tower: this,
      sellValue: sellValue
    });
    
    // 延遲銷毀以顯示效果
    this.scene.time.delayedCall(500, () => {
      this.destroy();
    });
    
    console.log(`出售${this.towerType}塔，獲得 ${sellValue} 金幣`);
    
    return sellValue;
  }

  /**
   * 播放出售效果
   */
  playSellEffect() {
    // 出售爆炸效果
    const explosion = this.scene.add.circle(this.x, this.y, 5, 0xff6b6b, 0.8);
    
    this.scene.tweens.add({
      targets: explosion,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        explosion.destroy();
      }
    });
    
    // 播放出售音效
    this.scene.playSound && this.scene.playSound('tower_sell');
  }

  /**
   * 獲取升級成本
   */
  getUpgradeCost() {
    if (this.level >= this.maxLevel) return 0;
    return this.upgradeCosts[this.level - 1] || 100;
  }

  /**
   * 獲取出售價值
   */
  getSellValue() {
    let totalValue = this.buildCost;
    
    // 加上已升級的成本
    for (let i = 0; i < this.level - 1; i++) {
      totalValue += this.upgradeCosts[i] || 50;
    }
    
    // 出售時返回70%的總投資
    return Math.floor(totalValue * 0.7);
  }

  /**
   * 改變瞄準模式
   */
  setTargetingMode(mode) {
    this.targetingMode = mode;
    console.log(`${this.towerType}塔瞄準模式改為: ${mode}`);
  }

  /**
   * 獲取塔狀態
   */
  getStatus() {
    return {
      type: this.towerType,
      level: this.level,
      damage: this.damage,
      range: this.range,
      fireRate: this.fireRate,
      position: { x: this.x, y: this.y },
      isActive: this.isActive,
      isSelected: this.isSelected,
      stats: { ...this.stats },
      upgradeCost: this.getUpgradeCost(),
      sellValue: this.getSellValue()
    };
  }

  /**
   * 銷毀塔
   */
  destroy() {
    // 清理投射物
    this.projectiles.forEach(projectile => {
      projectile.destroy();
    });
    this.projectilePool.forEach(projectile => {
      projectile.destroy();
    });
    
    // 清理事件監聽器
    this.eventEmitter.removeAllListeners();
    
    // 移除動畫
    this.scene.tweens.killTweensOf(this.rangeIndicator);
    
    super.destroy();
    
    console.log(`${this.towerType}塔已銷毀`);
  }
}

/**
 * 塔投射物類
 */
class TowerProjectile extends Phaser.GameObjects.Container {
  constructor(scene, tower) {
    super(scene, 0, 0);
    
    this.tower = tower;
    this.target = null;
    this.config = null;
    
    // 移動屬性
    this.velocity = { x: 0, y: 0 };
    this.speed = 300;
    this.damage = 30;
    
    // 視覺元素
    this.projectileSprite = null;
    this.trail = [];
    
    this.init();
    scene.add.existing(this);
  }

  /**
   * 初始化投射物
   */
  init() {
    // 創建投射物視覺
    this.projectileSprite = this.scene.add.circle(0, 0, 4, 0xffff00);
    this.projectileSprite.setStrokeStyle(1, 0xffffff);
    this.add(this.projectileSprite);
    
    // 設置物理體
    this.scene.physics.world.enable(this);
    this.body.setCircle(4);
    
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * 發射投射物
   */
  fire(x, y, target, config) {
    this.target = target;
    this.config = config;
    this.damage = config.damage;
    this.speed = config.speed;
    
    this.setPosition(x, y);
    
    // 計算初始方向
    this.updateDirection();
    
    // 根據塔類型更新外觀
    this.updateVisualForTowerType(config.towerType);
    
    this.setActive(true);
    this.setVisible(true);
    
    console.log('塔投射物發射');
  }

  /**
   * 更新方向
   */
  updateDirection() {
    if (!this.target || !this.target.active) return;
    
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    this.velocity.x = Math.cos(angle) * this.speed;
    this.velocity.y = Math.sin(angle) * this.speed;
  }

  /**
   * 根據塔類型更新視覺
   */
  updateVisualForTowerType(towerType) {
    const colors = {
      basic: 0xffff00,
      cannon: 0xff6b6b,
      laser: 0x00ff00,
      ice: 0x74b9ff,
      poison: 0xa29bfe
    };
    
    const color = colors[towerType] || colors.basic;
    this.projectileSprite.setFillStyle(color);
  }

  /**
   * 更新投射物
   */
  update(time, delta) {
    if (!this.active) return;
    
    // 檢查目標是否仍然有效
    if (!this.target || !this.target.active || !this.target.isAlive) {
      this.deactivate();
      return;
    }
    
    // 更新方向（追蹤目標）
    this.updateDirection();
    
    // 更新位置
    this.x += this.velocity.x * delta / 1000;
    this.y += this.velocity.y * delta / 1000;
    
    // 檢查是否擊中目標
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (distance < 10) {
      this.hitTarget();
    }
    
    // 檢查是否超出範圍
    if (this.isOutOfBounds()) {
      this.deactivate();
    }
  }

  /**
   * 擊中目標
   */
  hitTarget() {
    if (this.target && this.target.takeDamage) {
      const damageDealt = this.target.takeDamage(this.damage, 'projectile', this.tower);
      
      // 更新塔的統計數據
      if (this.tower) {
        this.tower.stats.damageDealt += damageDealt;
        
        // 檢查敵人是否被擊殺（在造成傷害後檢查）
        if (this.target.health <= 0) {
          this.tower.stats.enemiesKilled++;
          console.log(`🎯 ${this.tower.towerType}塔擊殺 ${this.target.enemyType}敵人！總擊殺: ${this.tower.stats.enemiesKilled}`);
        }
      }
      
      console.log(`💥 投射物擊中${this.target.enemyType}敵人，造成${damageDealt}點傷害`);
    }
    
    // 創建擊中效果
    this.createHitEffect();
    
    this.deactivate();
  }

  /**
   * 創建擊中效果
   */
  createHitEffect() {
    const hitEffect = this.scene.add.circle(this.x, this.y, 3, 0xffffff, 0.8);
    
    this.scene.tweens.add({
      targets: hitEffect,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => hitEffect.destroy()
    });
  }

  /**
   * 檢查是否超出邊界
   */
  isOutOfBounds() {
    const { width, height } = this.scene.scale.gameSize;
    return this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50;
  }

  /**
   * 停用投射物
   */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.target = null;
    console.log('投射物停用');
  }

  /**
   * 重置投射物
   */
  reset() {
    this.deactivate();
    this.setPosition(0, 0);
    this.velocity = { x: 0, y: 0 };
    this.trail = [];
  }
}

export default BaseTower;
