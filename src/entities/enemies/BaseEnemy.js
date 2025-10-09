/**
 * 基礎敵人類
 * 所有敵人的基類，提供共通功能
 */

import GameConfig from '../../core/GameConfig.js';

export class BaseEnemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, enemyType = 'basic') {
    super(scene, x, y);
    
    // 敵人基本屬性
    this.enemyType = enemyType;
    this.level = 1;
    
    // 戰鬥屬性
    this.health = 50;
    this.maxHealth = 50;
    this.speed = 60;
    this.damage = 10;
    this.reward = 10;
    
    // 移動相關
    this.path = [];
    this.pathIndex = 0;
    this.targetPosition = null;
    this.movementSpeed = { x: 0, y: 0 };
    this.isMoving = true;
    
    // 戰鬥狀態
    this.isAlive = true;
    this.isAttacking = false;
    this.attackCooldown = 1000; // 1秒攻擊間隔
    this.lastAttackTime = 0;
    this.lastDamageSource = null; // 記錄最後造成傷害的來源
    
    // 遠程攻擊相關
    this.projectiles = []; // 投射物列表
    this.attackType = 'melee'; // 默認近戰
    
    // 視覺組件
    this.enemySprite = null;
    this.healthBar = null;
    this.attackRangeIndicator = null; // 攻擊範圍指示器
    this.statusEffects = [];
    
    // 特殊狀態
    this.statusEffects = {
      frozen: { active: false, duration: 0 },
      poisoned: { active: false, duration: 0, damage: 0 },
      slowed: { active: false, duration: 0, speedMultiplier: 1 }
    };
    
    // 統計數據
    this.stats = {
      distanceTraveled: 0,
      damageDealt: 0,
      timeAlive: 0
    };
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 添加到場景
    scene.add.existing(this);
    
    // 初始化敵人
    this.init();
    
    console.log(`創建${enemyType}敵人於 (${x}, ${y})`);
  }

  /**
   * 初始化敵人
   */
  init() {
    // 加載敵人配置
    this.loadEnemyConfig();
    
    // 創建視覺元素
    this.createEnemyVisuals();
    
    // 設置物理體
    this.setupPhysics();
    
    // 延遲設置路徑，確保尋路系統已初始化
    this.scene.time.delayedCall(100, () => {
      this.setupPath();
    });
  }

  /**
   * 加載敵人配置
   */
  loadEnemyConfig() {
    const enemyData = GameConfig.ENEMY.TYPES[this.enemyType.toUpperCase()];
    if (!enemyData) {
      console.error(`敵人類型 ${this.enemyType} 的配置不存在`);
      // 使用默認值
      this.health = 50;
      this.maxHealth = 50;
      this.speed = 60;
      this.damage = 10;
      this.reward = 10;
      return;
    }

    this.health = enemyData.health;
    this.maxHealth = enemyData.health;
    this.speed = enemyData.speed;
    this.damage = enemyData.damage;
    this.reward = enemyData.reward;
    
    // 設置攻擊類型
    if (enemyData.attackType) {
      this.attackType = enemyData.attackType;
    }
    
    console.log(`${this.enemyType}敵人配置加載完成: HP=${this.health}, 速度=${this.speed}, 攻擊類型=${this.attackType}`);
  }

  /**
   * 創建敵人視覺元素
   */
  createEnemyVisuals() {
    // 創建敵人主體（使用敵人圖片）
    const frameName = this.getEnemyFrameName();
    const size = this.getEnemySize();
    
    // 根據敵人類型選擇資源
    if (this.enemyType === 'BASIC') {
      this.enemySprite = this.scene.add.sprite(0, 0, 'enemy_basic');
    } else {
      this.enemySprite = this.scene.add.image(0, 0, 'enemy_basic', frameName);
    }
    this.enemySprite.setScale(this.getEnemyScale());
    this.enemySprite.setScale(0.1);
    this.enemySprite.setOrigin(0.5, 0.5);
    this.add(this.enemySprite);
    
    // 播放動畫
    if (this.enemyType === 'BASIC') {
      if (this.scene.anims.exists('enemy_basic_idle')) {
        this.enemySprite.play('enemy_basic_idle');
      }
    }
    
    // 建立血條
    this.createHealthBar(size);
    
    // 創建敵人類型標識
    this.typeIndicator = this.scene.add.text(0, 0, this.enemyType[0].toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: '12px',
      fill: '#ffffff',
      align: 'center'
    });
    this.typeIndicator.setOrigin(0.5);
    this.add(this.typeIndicator);
    
    // 創建攻擊範圍指示器
    this.createAttackRangeIndicator();
    
    // 設置敵人在UI上方顯示
    this.setDepth(50);
    
    console.log(`${this.enemyType}敵人視覺元素創建完成，位置: (${this.x}, ${this.y})`);
  }

  /**
   * 建立血條元件
   */
  createHealthBar(size) {
    const healthBarY = -size - 12;
    this.healthBarBg = this.scene.add.rectangle(0, healthBarY, 30, 4, 0x330000);
    this.add(this.healthBarBg);
    this.healthBar = this.scene.add.rectangle(0, healthBarY, 30, 4, 0xff0000);
    this.add(this.healthBar);
  }

  /**
   * 創建攻擊範圍指示器
   */
  createAttackRangeIndicator() {
    // 根據敵人類型和配置設置不同的攻擊範圍
    let attackRange = 30; // 默認近戰範圍
    let indicatorColor = 0xff0000; // 紅色表示近戰
    
    // 檢查敵人的攻擊類型
    const enemyData = GameConfig.ENEMY.TYPES[this.enemyType.toUpperCase()];
    if (enemyData && enemyData.attackType === 'ranged') {
      attackRange = 80; // 遠程攻擊範圍
      indicatorColor = 0x00ff00; // 綠色表示遠程
    } else if (enemyData && enemyData.attackType === 'melee') {
      attackRange = 35; // 近戰攻擊範圍
      indicatorColor = 0xff6600; // 橙色表示近戰
    }
    
    // 創建攻擊範圍圓圈
    this.attackRangeIndicator = this.scene.add.circle(0, 0, attackRange, indicatorColor, 0.1);
    this.attackRangeIndicator.setStrokeStyle(2, indicatorColor, 0.3);
    this.attackRangeIndicator.setVisible(false); // 默認隱藏
    this.attackRangeIndicator.setDepth(10); // 設置深度確保可見
    this.add(this.attackRangeIndicator);
    
    // 存儲攻擊範圍數據
    this.attackRange = attackRange;
  }

  /**
   * 顯示/隱藏攻擊範圍指示器
   */
  showAttackRange(visible) {
    if (this.attackRangeIndicator) {
      this.attackRangeIndicator.setVisible(visible);
      // console.log(`🎯 ${this.enemyType}敵人攻擊範圍指示器: ${visible ? '顯示' : '隱藏'}`);
    }
  }

  /**
   * 獲取敵人顏色
   */
  getEnemyColor() {
    const colors = {
      basic: 0xff6b6b,
      fast: 0x4ecdc4,
      tank: 0x45b7d1,
      flying: 0xf9ca24,
      boss: 0x6c5ce7
    };
    return colors[this.enemyType] || 0xff6b6b;
  }

  /**
   * 獲取敵人大小
   */
  getEnemySize() {
    const sizes = {
      basic: 12,
      fast: 10,
      tank: 18,
      flying: 14,
      boss: 25
    };
    return sizes[this.enemyType] || 12;
  }

  /**
   * 獲取敵人圖片幀名稱
   */
  getEnemyFrameName() {
    const frameMap = {
      'basic': 'enemy-1.png',    // 基礎敵人使用較大的圖片
      'fast': 'enemy-2.png',     // 快速敵人使用較高的圖片
      'tank': 'enemy-1.png',     // 坦克敵人使用較大的圖片
      'flying': 'enemy-2.png',   // 飛行敵人使用較高的圖片
      'boss': 'enemy-1.png'      // Boss敵人使用較大的圖片
    };
    return frameMap[this.enemyType] || 'enemy-1.png';
  }

  /**
   * 獲取敵人縮放比例
   */
  getEnemyScale() {
    const scaleMap = {
      'basic': 0.35,   // 基礎敵人：129x102 -> 約45x36 (放大75%)
      'fast': 0.25,    // 快速敵人：83x124 -> 約21x31 (放大67%)
      'tank': 0.5,     // 坦克敵人：129x102 -> 約65x51 (放大67%)
      'flying': 0.3,   // 飛行敵人：83x124 -> 約25x37 (放大67%)
      'boss': 0.6      // Boss敵人：129x102 -> 約77x61 (放大50%)
    };
    return scaleMap[this.enemyType] || 0.35;
  }

  /**
   * 設置物理體
   */
  setupPhysics() {
    // 敵人總是需要物理體來移動
    console.log(`🔧 ${this.enemyType}敵人設置物理體...`);
    
    // 啟用物理體
    this.scene.physics.world.enable(this);
    
    if (this.body) {
      this.body.setCircle(this.getEnemySize());
      this.body.setCollideWorldBounds(false); // 敵人可以離開螢幕
      
      // 設置碰撞分組
      this.body.setImmovable(false);
      
      console.log(`✅ ${this.enemyType}敵人物理體創建成功`);
    } else {
      console.error(`❌ ${this.enemyType}敵人物理體創建失敗`);
    }
  }
  /**
   * 設置智能追蹤目標
   */
  setSmartTargeting() {
    this.isMoving = true;
    this.targetType = 'player'; // 默認追蹤玩家
    this.target = null;
    this.lastTargetUpdate = 0; // 初始化目標更新時間
    
    console.log(`🎯 ${this.enemyType}敵人啟用智能追蹤模式`);
    this.findBestTarget();
  }
  
  /**
   * 尋找最佳目標
   */
  findBestTarget() {
    const player = this.scene.player;
    
    // 安全獲取炮塔列表
    let towers = [];
    if (this.scene.towerPlacementSystem && this.scene.towerPlacementSystem.placedTowers) {
      towers = Array.isArray(this.scene.towerPlacementSystem.placedTowers) 
        ? this.scene.towerPlacementSystem.placedTowers 
        : [];
    }
    
    let bestTarget = null;
    let bestDistance = Infinity;
    let bestTargetType = 'player';
    
    // 檢查玩家距離
    if (player && player.isAlive) {
      const playerDistance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (playerDistance < bestDistance) {
        bestDistance = playerDistance;
        bestTarget = player;
        bestTargetType = 'player';
      }
    }
    
    // 檢查炮塔距離
    if (Array.isArray(towers)) {
      for (const tower of towers) {
        if (tower && tower.isAlive && !tower.isDestroyed) {
          const towerDistance = Phaser.Math.Distance.Between(this.x, this.y, tower.x, tower.y);
          if (towerDistance < bestDistance) {
            bestDistance = towerDistance;
            bestTarget = tower;
            bestTargetType = 'tower';
          }
        }
      }
    }
    
    this.target = bestTarget;
    this.targetType = bestTargetType;
    
    if (this.target) {
      // console.log(`🎯 ${this.enemyType}敵人選擇目標: ${this.targetType} (距離: ${bestDistance.toFixed(1)})`);
      this.moveToTarget();
    }
  }
  
  /**
   * 移動到目標
   */
  moveToTarget() {
    if (!this.target) return;
    
    this.targetPosition = {
      x: this.target.x,
      y: this.target.y
    };
    
    this.calculateMovementDirection();
  }
  
  /**
   * 攻擊目標
   */
  attackTarget() {
    if (!this.target || !this.isAlive) return;
    
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    const attackRange = this.attackRange || 30; // 使用動態攻擊範圍
    
    // 如果接近攻擊範圍，顯示指示器
    if (distance <= attackRange * 1.5) { // 在1.5倍攻擊範圍內就顯示
      this.showAttackRange(true);
    } else {
      this.showAttackRange(false);
    }
    
    if (distance <= attackRange) {
      if (this.attackType === 'ranged') {
        // 遠程攻擊：發射投射物
        this.fireProjectile();
      } else {
        // 近戰攻擊：直接造成傷害
        this.meleeAttack();
      }
      
      // 攻擊冷卻
      this.lastAttackTime = this.scene.time.now;
    }
  }

  /**
   * 近戰攻擊
   */
  meleeAttack() {
    if (this.targetType === 'tower') {
      // 攻擊炮塔（保持不變）
      this.target.takeDamage(this.damage);
      // console.log(`🗡️ ${this.enemyType}敵人近戰攻擊炮塔，造成 ${this.damage} 點傷害`);
    } else if (this.targetType === 'player') {
      // ❌ 禁用近戰攻擊玩家（改用物理碰撞處理）
      // if (this.scene.player) {
      //   this.scene.player.takeDamage(this.damage);
      // }
      console.log('⚠️ 敵人近戰攻擊玩家已禁用，使用物理碰撞代替');
    }
  }

  /**
   * 遠程攻擊：發射投射物
   */
  fireProjectile() {
    if (!this.target) return;
    
    // ✅ 如果目標是玩家，不發射投射物（改用物理碰撞處理）
    if (this.targetType === 'player' || this.target === this.scene.player) {
      console.log('⚠️ 敵人遠程攻擊玩家已禁用，使用物理碰撞代替');
      return;
    }
    
    // 創建投射物（只對炮塔）
    const projectile = new EnemyProjectile(this.scene, this, this.target);
    this.projectiles.push(projectile);
    
    // console.log(`🏹 ${this.enemyType}敵人發射投射物攻擊炮塔`);
  }

  /**
   * 設置移動路徑 (舊方法，保留備用)
   */
  setupPath() {
    // 獲取玩家位置
    const playerPos = this.scene.player ? 
      { x: this.scene.player.x, y: this.scene.player.y } :
      { x: GameConfig.PLAYER.POSITION.X, y: GameConfig.PLAYER.POSITION.Y };
    
    // 使用尋路系統計算智能路徑
    if (this.scene.pathfindingManager) {
      // console.log(`🛣️ ${this.enemyType}敵人開始智能尋路...`);
      try {
        const intelligentPath = this.scene.pathfindingManager.getPath(
          this.x, this.y,
          playerPos.x, playerPos.y
        );
        
        if (intelligentPath && Array.isArray(intelligentPath) && intelligentPath.length > 0) {
          this.path = intelligentPath;
          // console.log(`✅ ${this.enemyType}敵人智能尋路成功: ${this.path.length}個路徑點`);
          // console.log(`📍 路徑詳情:`, this.path.map(p => `(${p.x}, ${p.y})`));
        } else {
          console.log(`⚠️ 智能尋路失敗，使用備用路徑`, intelligentPath);
          this.path = [
            { x: this.x, y: this.y },
            { x: playerPos.x, y: playerPos.y }
          ];
        }
      } catch (error) {
        console.error(`❌ 智能尋路出錯:`, error);
        this.path = [
          { x: this.x, y: this.y },
          { x: playerPos.x, y: playerPos.y }
        ];
      }
    } else {
      // 備用：直線路徑
      console.log(`⚠️ 尋路系統不可用，使用直線路徑`);
      this.path = [
        { x: this.x, y: this.y }, // 起始位置
        { x: playerPos.x, y: playerPos.y } // 目標：玩家位置
      ];
      
      // console.log(`${this.enemyType}敵人直線路徑: 從(${this.x}, ${this.y})到(${playerPos.x}, ${playerPos.y})`);
    }
    
    this.pathIndex = 0;
    
    
    // 強制確保移動狀態
    this.isMoving = true;
    
    this.setNextTarget();
  }

  /**
   * 設置下一個目標點
   */
  setNextTarget() {
    
    // 檢查路徑是否有效
    if (!this.path || !Array.isArray(this.path) || this.path.length === 0) {
      console.error(`❌ ${this.enemyType}敵人路徑無效:`, this.path);
      return;
    }
    
    if (this.pathIndex < this.path.length - 1) {
      this.pathIndex++;
      const nextTarget = this.path[this.pathIndex];
      
      // 檢查目標點是否有效
      if (!nextTarget || typeof nextTarget.x !== 'number' || typeof nextTarget.y !== 'number') {
        console.error(`❌ ${this.enemyType}敵人目標點無效:`, nextTarget);
        return;
      }
      
      this.targetPosition = nextTarget;
      
      // 計算移動方向
      this.calculateMovementDirection();
    } else {
      // 到達終點（玩家位置）
      this.reachDestination();
    }
  }

  /**
   * 計算移動方向
   */
  calculateMovementDirection() {
    if (!this.targetPosition) {
      return;
    }
    
    const dx = this.targetPosition.x - this.x;
    const dy = this.targetPosition.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const currentSpeed = this.getCurrentSpeed();
      this.movementSpeed.x = (dx / distance) * currentSpeed;
      this.movementSpeed.y = (dy / distance) * currentSpeed;
      
      // 設置物理速度
      if (this.body) {
        // 先檢查物理體是否正確啟用
        if (!this.body.enable) {
          this.scene.physics.world.enable(this);
        }
        
        this.body.setVelocity(this.movementSpeed.x, this.movementSpeed.y);
        
        // 確保移動狀態
        this.isMoving = true;
      } else {
        // 嘗試重新創建物理體
        this.setupPhysics();
      }
    }
  }

  /**
   * 獲取當前速度（考慮狀態效果）
   */
  getCurrentSpeed() {
    let speed = this.speed;
    
    // 冰凍效果
    if (this.statusEffects.frozen.active) {
      speed = 0;
    }
    // 減速效果
    else if (this.statusEffects.slowed.active) {
      speed *= this.statusEffects.slowed.speedMultiplier;
    }
    
    return speed;
  }

  /**
   * 更新敵人
   */
  update(time, delta) {
    if (!this.isAlive) {
      console.log(`❌ ${this.enemyType}敵人已死亡，跳過更新`);
      return;
    }
    
    
    // 更新統計
    this.stats.timeAlive += delta;
    
    // 更新狀態效果
    this.updateStatusEffects(delta);
    
    // 更新移動
    this.updateMovement(time, delta);
    
    // 檢查是否到達目標點
    this.checkTargetReached();
    
    // 定期重新計算路徑（每5秒）
    if (Math.floor(time / 5000) !== Math.floor((time - delta) / 5000)) {
      this.recalculatePath();
    }
    
    // 檢查與玩家的距離
    this.checkPlayerDistance();
    
    // 更新投射物
    this.updateProjectiles(time, delta);
  }

  /**
   * 更新投射物
   */
  updateProjectiles(time, delta) {
    if (!this.projectiles || this.projectiles.length === 0) return;
    
    // 更新所有投射物
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      if (projectile && projectile.isActive) {
        projectile.update(time, delta);
      } else {
        // 移除已銷毀的投射物
        this.projectiles.splice(i, 1);
      }
    }
  }

  /**
   * 更新狀態效果
   */
  updateStatusEffects(delta) {
    // 更新冰凍狀態
    if (this.statusEffects.frozen.active) {
      this.statusEffects.frozen.duration -= delta;
      if (this.statusEffects.frozen.duration <= 0) {
        this.statusEffects.frozen.active = false;
        this.calculateMovementDirection(); // 重新計算移動
      }
    }
    
    // 更新中毒狀態
    if (this.statusEffects.poisoned.active) {
      this.statusEffects.poisoned.duration -= delta;
      
      // 每秒造成中毒傷害
      if (Math.floor(this.statusEffects.poisoned.duration / 1000) < 
          Math.floor((this.statusEffects.poisoned.duration + delta) / 1000)) {
        this.takeDamage(this.statusEffects.poisoned.damage, 'poison');
      }
      
      if (this.statusEffects.poisoned.duration <= 0) {
        this.statusEffects.poisoned.active = false;
      }
    }
    
    // 更新減速狀態
    if (this.statusEffects.slowed.active) {
      this.statusEffects.slowed.duration -= delta;
      if (this.statusEffects.slowed.duration <= 0) {
        this.statusEffects.slowed.active = false;
        this.statusEffects.slowed.speedMultiplier = 1;
        this.calculateMovementDirection(); // 重新計算移動
      }
    }
  }

  /**
   * 更新移動和攻擊
   */
  updateMovement(time, delta) {
    if (!this.isMoving || !this.isAlive) {
      return;
    }
    
    // 智能追蹤模式
    if (this.targetType) {
      // 定期重新評估目標
      if (time - this.lastTargetUpdate > 1000) { // 每秒重新評估一次
        this.findBestTarget();
        this.lastTargetUpdate = time;
      }
      
      // 檢查攻擊冷卻
      if (time - this.lastAttackTime > this.attackCooldown) {
        this.attackTarget();
      }
      
      // 更新目標位置
      if (this.target && this.target.isAlive && !this.target.isDestroyed) {
        this.moveToTarget();
      } else {
        // 目標已死亡，重新尋找目標
        this.findBestTarget();
      }
    } else {
      // 傳統路徑模式
      if (!this.targetPosition) {
        this.setNextTarget();
        return;
      }
    }
    
    // 檢查物理體速度是否為零
    if (this.body && Math.abs(this.body.velocity.x) < 0.1 && Math.abs(this.body.velocity.y) < 0.1) {
      this.calculateMovementDirection();
    }
    
    // 記錄移動距離
    const prevX = this.x;
    const prevY = this.y;
    
    const deltaX = this.x - prevX;
    const deltaY = this.y - prevY;
    this.stats.distanceTraveled += Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * 檢查是否到達目標點
   */
  checkTargetReached() {
    if (!this.targetPosition) return;
    
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.targetPosition.x, this.targetPosition.y
    );
    
    // 根據敵人速度動態調整到達閾值
    const reachThreshold = Math.max(5, this.speed * 0.1);
    
    if (distance < reachThreshold) { // 接近目標點
      // 檢查是否到達最後一個路徑點（基地）
      if (this.pathIndex >= this.path.length - 1) {
        this.attackBase();
        return;
      }
      
      this.setNextTarget();
    }
  }

  /**
   * 攻擊基地
   */
  attackBase() {
    this.isMoving = false;
    this.isAttacking = true;
    
    // 停止移動
    if (this.body) {
      this.body.setVelocity(0, 0);
    }
    
    
    // 發送攻擊基地事件
    this.eventEmitter.emit('enemyReachedDestination', this);
    
    // 創建攻擊特效
    this.createAttackEffect();
  }

  /**
   * 檢查與玩家的距離
   */
  checkPlayerDistance() {
    if (!this.scene.player) return;
    
    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.scene.player.x, this.scene.player.y
    );
    
    // 如果靠近玩家，嘗試攻擊
    if (distance < 30 && this.canAttack()) {
      this.attackPlayer();
    }
  }

  /**
   * 檢查是否可以攻擊
   */
  canAttack() {
    const currentTime = this.scene.time.now;
    return currentTime - this.lastAttackTime >= this.attackCooldown;
  }

  /**
   * 攻擊玩家（已停用）
   */
  attackPlayer() {
    // ❌ 禁用所有攻擊玩家的邏輯（改用物理碰撞處理）
    console.log('⚠️ 敵人攻擊玩家已禁用，使用物理碰撞代替');
    return;
    
    /* 以下代碼已停用
    if (!this.scene.player || !this.scene.player.isAlive) return;
    
    this.lastAttackTime = this.scene.time.now;
    
    // 造成傷害
    const damageDealt = this.scene.player.takeDamage(this.damage);
    if (damageDealt) {
      this.stats.damageDealt += this.damage;
      
      // console.log(`${this.enemyType}敵人攻擊玩家，造成 ${this.damage} 點傷害`);
      
      // 播放攻擊音效
      this.scene.playSound && this.scene.playSound('enemy_attack');
      
      // 創建攻擊特效
      this.createAttackEffect();
    }
    */
  }

  /**
   * 創建攻擊特效
   */
  createAttackEffect() {
    const effect = this.scene.add.circle(this.x, this.y, 20, 0xff0000, 0.5);
    
    this.scene.tweens.add({
      targets: effect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        effect.destroy();
      }
    });
  }

  /**
   * 敵人受傷
   */
  takeDamage(damage, damageType = 'normal', damageSource = null) {
    if (!this.isAlive) return 0;
    
    // 記錄傷害來源
    if (damageSource) {
      this.lastDamageSource = damageSource;
    }
    
    // 減少生命值
    const actualDamage = Math.min(damage, this.health);
    this.health -= actualDamage;
    this.health = Math.max(0, this.health);
    
    // console.log(`${this.enemyType}敵人受到 ${actualDamage} 點${damageType}傷害，剩餘生命: ${this.health}`);
    
    // 更新血條
    this.updateHealthBar();
    
    // 播放受傷效果
    this.playDamageEffect(damageType);
    
    // 發送受傷事件
    this.eventEmitter.emit('enemyDamaged', {
      enemy: this,
      damage: actualDamage,
      damageType: damageType,
      currentHealth: this.health,
      maxHealth: this.maxHealth
    });
    
    // 檢查是否死亡
    if (this.health <= 0) {
      this.die();
    }
    
    return actualDamage;
  }

  /**
   * 更新血條
   */
  updateHealthBar() {
    if (!this.healthBar) {
      // 防呆：若血條尚未建立則直接跳出，避免崩潰
      return;
    }
    const healthPercentage = this.health / this.maxHealth;
    const maxWidth = 30;
    const currentWidth = maxWidth * healthPercentage;
    
    this.healthBar.width = currentWidth;
    
    // 根據血量改變顏色
    if (healthPercentage > 0.6) {
      this.healthBar.fillColor = 0x00ff00; // 綠色
    } else if (healthPercentage > 0.3) {
      this.healthBar.fillColor = 0xffff00; // 黃色
    } else {
      this.healthBar.fillColor = 0xff0000; // 紅色
    }
  }

  /**
   * 播放受傷效果
   */
  playDamageEffect(damageType) {
    // 閃爍效果
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 1
    });
    
    // 根據傷害類型顯示不同顏色
    const effectColor = this.getDamageEffectColor(damageType);
    
    // 創建傷害數字
    this.createDamageNumber(this.damage, effectColor);
  }

  /**
   * 獲取傷害效果顏色
   */
  getDamageEffectColor(damageType) {
    const colors = {
      normal: 0xffffff,
      poison: 0x00ff00,
      ice: 0x00ffff,
      fire: 0xff4500,
      explosion: 0xff6600
    };
    return colors[damageType] || 0xffffff;
  }

  /**
   * 創建傷害數字
   */
  createDamageNumber(damage, color) {
    const damageText = this.scene.add.text(this.x, this.y - 20, `-${damage}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      fill: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    });
    damageText.setOrigin(0.5);
    
    // 動畫效果
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        damageText.destroy();
      }
    });
  }

  /**
   * 應用狀態效果
   */
  applyStatusEffect(effectType, config) {
    switch (effectType) {
      case 'freeze':
        this.statusEffects.frozen.active = true;
        this.statusEffects.frozen.duration = config.duration || 2000;
        if (this.body) this.body.setVelocity(0, 0);
        break;
        
      case 'poison':
        this.statusEffects.poisoned.active = true;
        this.statusEffects.poisoned.duration = config.duration || 5000;
        this.statusEffects.poisoned.damage = config.damage || 5;
        break;
        
      case 'slow':
        this.statusEffects.slowed.active = true;
        this.statusEffects.slowed.duration = config.duration || 3000;
        this.statusEffects.slowed.speedMultiplier = config.speedMultiplier || 0.5;
        this.calculateMovementDirection();
        break;
    }
    
    // console.log(`${this.enemyType}敵人受到${effectType}效果`);
  }

  /**
   * 重新計算路徑（當塔布局改變時）
   */
  recalculatePath() {
    if (!this.isAlive || !this.isMoving) return;
    
    const playerPos = this.scene.player ? 
      { x: this.scene.player.x, y: this.scene.player.y } :
      { x: GameConfig.PLAYER.POSITION.X, y: GameConfig.PLAYER.POSITION.Y };
    
    if (this.scene.pathfindingManager) {
      const newPath = this.scene.pathfindingManager.getPath(
        this.x, this.y,
        playerPos.x, playerPos.y
      );
      
      // 如果新路徑不同，更新路徑
      if (newPath.length !== this.path.length || 
          this.pathHasChanged(newPath)) {
        this.path = newPath;
        this.pathIndex = 0;
        this.setNextTarget();
        
        // console.log(`${this.enemyType}敵人重新尋路: ${this.path.length}個路徑點`);
      }
    }
  }

  /**
   * 檢查路徑是否改變
   */
  pathHasChanged(newPath) {
    if (!this.path || newPath.length !== this.path.length) return true;
    
    for (let i = 0; i < newPath.length; i++) {
      const oldPoint = this.path[i];
      const newPoint = newPath[i];
      
      if (Math.abs(oldPoint.x - newPoint.x) > 10 || 
          Math.abs(oldPoint.y - newPoint.y) > 10) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 到達目的地
   */
  reachDestination() {
    // console.log(`${this.enemyType}敵人到達玩家位置`);
    
    // 立即攻擊玩家
    if (this.scene.player && this.scene.player.isAlive) {
      this.attackPlayer();
    }
    
    // 停止移動
    this.isMoving = false;
    if (this.body) {
      this.body.setVelocity(0, 0);
    }
    
    // 發送到達事件
    this.eventEmitter.emit('enemyReachedDestination', this);
  }

  /**
   * 敵人死亡
   */
  die() {
    console.log('🎯 die() 被調用！enemyType:', this.enemyType);
    console.log('   this.isAlive:', this.isAlive);
    console.log('   this.scene:', this.scene ? '存在' : 'undefined');
    console.log('   this.body:', this.body ? '存在' : 'undefined');
    
    if (!this.isAlive) {
      console.log('⚠️ 敵人已死（isAlive=false），跳過 die() 的剩餘邏輯');
      console.log('   ❌ 這是問題！敵人被標記為已死但沒有執行完整的死亡流程');
      return;
    }
    
    this.isAlive = false;
    
    console.log(`💀 ${this.enemyType}敵人死亡流程開始`);
    console.log('   位置:', this.x, this.y);
    
    // ✅ 立即禁用物理體（避免與玩家持續碰撞導致卡住）
    if (this.body) {
      console.log('   → 禁用物理體...');
      this.body.setVelocity(0, 0);
      this.scene.physics.world.disable(this);
      console.log('   ✓ 物理體已禁用');
    } else {
      console.log('   ⚠️ 沒有物理體');
    }
    
    // 播放死亡音效
    if (this.scene.enhancedAudio) {
      this.scene.enhancedAudio.playSound('enemy_death');
    }
    
    // 創建死亡特效（爆炸）
    console.log('   → 創建死亡特效（爆炸）...');
    this.createDeathEffect();
    console.log('   ✓ 死亡特效創建完成');
    
    // 給予玩家獎勵
    this.giveRewards();
    
    // 發送死亡事件
    this.eventEmitter.emit('enemyDied', {
      enemy: this,
      position: { x: this.x, y: this.y },
      reward: this.reward,
      stats: this.stats
    });
    
    // 向場景發送擊殺事件
    if (this.scene && this.scene.events) {
      this.scene.events.emit('enemyKilled', {
        enemy: this,
        enemyType: this.enemyType,
        reward: this.reward,
        position: { x: this.x, y: this.y },
        killedBy: this.lastDamageSource || 'unknown'
      });
    }
    
    // 延遲銷毀
    this.scene.time.delayedCall(1000, () => {
      this.destroy();
    });
  }

  /**
   * 創建死亡特效
   */
  createDeathEffect() {
    console.log('💥 createDeathEffect() 開始執行');
    console.log('   this.scene:', this.scene ? '存在' : 'undefined');
    console.log('   this.scene.add:', this.scene && this.scene.add ? '存在' : 'undefined');
    console.log('   位置:', this.x, this.y);
    
    // 爆炸效果
    const explosion = this.scene.add.circle(this.x, this.y, 5, 0xffff00, 0.8);
    console.log('   ✓ 爆炸圓形已創建:', explosion ? '成功' : '失敗');
    
    this.scene.tweens.add({
      targets: explosion,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        explosion.destroy();
      }
    });
    
    // 粒子效果（簡化版）
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        this.x, this.y, 2, 
        this.getEnemyColor(), 0.7
      );
      
      const angle = (i / 8) * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * 給予獎勵
   */
  giveRewards() {
    // 計算實際獎勵（可能有加成）
    const actualReward = Math.round(this.reward * (this.scene.gameManager?.rewardMultiplier || 1));
    
    // 通過場景的遊戲管理器給予金錢獎勵
    if (this.scene.gameManager && this.scene.gameManager.addMoney) {
      this.scene.gameManager.addMoney(actualReward);
      
      // 播放金錢獲得音效
      if (this.scene.enhancedAudio) {
        this.scene.enhancedAudio.playSound('money_gain');
      }
      
      // 創建金錢獲得視覺效果
      this.createRewardEffect(actualReward);
    } else {
      console.warn('⚠️ GameManager不可用，無法給予獎勵');
    }
    
    // console.log(`💰 擊殺${this.enemyType}敵人獲得 ${actualReward} 金幣獎勵`);
  }

  /**
   * 創建獲得金錢的視覺效果
   */
  createRewardEffect(amount) {
    // 創建金錢文字效果
    const rewardText = this.scene.add.text(this.x, this.y - 30, `+${amount}`, {
      fontSize: '14px',
      fill: '#ffd93d',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    rewardText.setOrigin(0.5);
    rewardText.setDepth(200); // 確保在最上層
    
    // 創建上升和淡出動畫
    this.scene.tweens.add({
      targets: rewardText,
      y: rewardText.y - 40,
      alpha: 0,
      scale: 1.2,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        rewardText.destroy();
      }
    });
    
    // 創建金幣粒子效果
    this.createCoinParticles();
  }

  /**
   * 創建金幣粒子效果
   */
  createCoinParticles() {
    try {
      // 創建金幣粒子紋理
      if (!this.scene.textures.exists('coin_particle')) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffd93d);
        graphics.fillCircle(2, 2, 2);
        graphics.generateTexture('coin_particle', 4, 4);
        graphics.destroy();
      }
      
      // 創建金幣粒子爆發效果
      const coinParticles = this.scene.add.particles(this.x, this.y, 'coin_particle', {
        speed: { min: 30, max: 80 },
        scale: { start: 0.8, end: 0.2 },
        alpha: { start: 1, end: 0 },
        lifespan: 800,
        quantity: 5,
        blendMode: 'ADD'
      });
      
      coinParticles.setDepth(150);
      coinParticles.explode();
      
      // 清理粒子效果
      this.scene.time.delayedCall(1000, () => {
        if (coinParticles) {
          coinParticles.destroy();
        }
      });
      
    } catch (error) {
      console.log('⚠️ 金幣粒子效果創建失敗:', error.message);
    }
  }

  /**
   * 銷毀敵人
   */
  destroy() {
    // 清理事件監聽
    this.eventEmitter.removeAllListeners();
    
    // 清理物理體
    if (this.body) {
      this.scene.physics.world.disable(this);
    }
    
    // 銷毀視覺元素
    super.destroy();
    
    console.log(`${this.enemyType}敵人已銷毀`);
  }
}

/**
 * 敵人投射物類
 */
class EnemyProjectile extends Phaser.GameObjects.Container {
  constructor(scene, enemy, target) {
    super(scene, enemy.x, enemy.y);
    
    this.enemy = enemy;
    this.target = target;
    this.damage = enemy.damage;
    this.speed = 200; // 投射物速度
    this.isActive = true;
    
    // 創建投射物視覺
    this.createProjectileVisual();
    
    // 計算移動方向
    this.calculateDirection();
    
    // 添加到場景
    scene.add.existing(this);
    scene.physics.world.enable(this);
    
    // 設置物理體
    this.body.setCircle(5);
    this.body.setVelocity(this.velocity.x, this.velocity.y);
    
    // console.log(`🏹 敵人投射物創建，目標: ${target.constructor.name}`);
  }

  /**
   * 創建投射物視覺
   */
  createProjectileVisual() {
    // 創建投射物主體
    this.projectileSprite = this.scene.add.circle(0, 0, 3, 0xff6600);
    this.add(this.projectileSprite);
    
    // 創建拖尾效果
    this.trail = this.scene.add.circle(0, 0, 2, 0xffaa00, 0.5);
    this.add(this.trail);
  }

  /**
   * 計算移動方向
   */
  calculateDirection() {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    this.velocity = {
      x: (dx / distance) * this.speed,
      y: (dy / distance) * this.speed
    };
  }

  /**
   * 更新投射物
   */
  update(time, delta) {
    if (!this.isActive) return;
    
    // 檢查是否擊中目標
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (distance < 20) {
      this.hitTarget();
      return;
    }
    
    // 檢查是否超出邊界
    const { width, height } = this.scene.scale.gameSize;
    if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
      this.destroy();
      return;
    }
  }

  /**
   * 擊中目標
   */
  hitTarget() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // 造成傷害
    if (this.target.takeDamage) {
      // ✅ 檢查目標是否為玩家
      if (this.target === this.scene.player) {
        // ❌ 禁用投射物攻擊玩家（改用物理碰撞處理）
        console.log('⚠️ 敵人投射物擊中玩家，但傷害已禁用（使用物理碰撞代替）');
      } else {
        // 攻擊炮塔（保持不變）
        this.target.takeDamage(this.damage);
        // console.log(`💥 敵人投射物擊中炮塔，造成 ${this.damage} 點傷害`);
      }
    }
    
    // 創建擊中效果
    this.createHitEffect();
    
    // 從敵人投射物列表中移除
    if (this.enemy && this.enemy.projectiles) {
      const index = this.enemy.projectiles.indexOf(this);
      if (index > -1) {
        this.enemy.projectiles.splice(index, 1);
      }
    }
    
    this.destroy();
  }

  /**
   * 創建擊中效果
   */
  createHitEffect() {
    const hitEffect = this.scene.add.circle(this.x, this.y, 5, 0xff6600, 0.8);
    this.scene.tweens.add({
      targets: hitEffect,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => hitEffect.destroy()
    });
  }

  /**
   * 銷毀投射物
   */
  destroy() {
    this.isActive = false;
    super.destroy();
  }
}

