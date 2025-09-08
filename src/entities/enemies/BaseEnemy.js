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
    
    // 視覺組件
    this.enemySprite = null;
    this.healthBar = null;
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
    
    console.log(`${this.enemyType}敵人配置加載完成: HP=${this.health}, 速度=${this.speed}`);
  }

  /**
   * 創建敵人視覺元素
   */
  createEnemyVisuals() {
    // 創建敵人主體（臨時使用圓形）
    const color = this.getEnemyColor();
    const size = this.getEnemySize();
    
    this.enemySprite = this.scene.add.circle(0, 0, size, color);
    this.add(this.enemySprite);
    
    // 創建血條背景
    this.healthBarBg = this.scene.add.rectangle(0, -size - 8, 30, 4, 0x330000);
    this.add(this.healthBarBg);
    
    // 創建血條
    this.healthBar = this.scene.add.rectangle(0, -size - 8, 30, 4, 0xff0000);
    this.add(this.healthBar);
    
    // 創建敵人類型標識
    this.typeIndicator = this.scene.add.text(0, 0, this.enemyType[0].toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: '12px',
      fill: '#ffffff',
      align: 'center'
    });
    this.typeIndicator.setOrigin(0.5);
    this.add(this.typeIndicator);
    
    // 設置敵人在UI上方顯示
    this.setDepth(50);
    
    console.log(`${this.enemyType}敵人視覺元素創建完成，位置: (${this.x}, ${this.y})`);
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
   * 設置移動路徑
   */
  setupPath() {
    // 獲取玩家位置
    const playerPos = this.scene.player ? 
      { x: this.scene.player.x, y: this.scene.player.y } :
      { x: GameConfig.PLAYER.POSITION.X, y: GameConfig.PLAYER.POSITION.Y };
    
    // 使用尋路系統計算智能路徑
    if (this.scene.pathfindingManager) {
      console.log(`🛣️ ${this.enemyType}敵人開始智能尋路...`);
      try {
        const intelligentPath = this.scene.pathfindingManager.getPath(
          this.x, this.y,
          playerPos.x, playerPos.y
        );
        
        if (intelligentPath && Array.isArray(intelligentPath) && intelligentPath.length > 0) {
          this.path = intelligentPath;
          console.log(`✅ ${this.enemyType}敵人智能尋路成功: ${this.path.length}個路徑點`);
          console.log(`📍 路徑詳情:`, this.path.map(p => `(${p.x}, ${p.y})`));
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
      
      console.log(`${this.enemyType}敵人直線路徑: 從(${this.x}, ${this.y})到(${playerPos.x}, ${playerPos.y})`);
    }
    
    this.pathIndex = 0;
    
    console.log(`🎯 ${this.enemyType}敵人準備設置初始目標，路徑長度: ${this.path.length}`);
    
    // 強制確保移動狀態
    this.isMoving = true;
    
    this.setNextTarget();
  }

  /**
   * 設置下一個目標點
   */
  setNextTarget() {
    console.log(`🎯 ${this.enemyType}敵人設置目標: 當前索引 ${this.pathIndex}/${this.path.length - 1}`);
    
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
      console.log(`📍 新目標設置: (${this.targetPosition.x}, ${this.targetPosition.y})`);
      
      // 計算移動方向
      this.calculateMovementDirection();
    } else {
      // 到達終點（玩家位置）
      console.log(`🏁 ${this.enemyType}敵人到達終點`);
      this.reachDestination();
    }
  }

  /**
   * 計算移動方向
   */
  calculateMovementDirection() {
    if (!this.targetPosition) {
      console.log(`⚠️ ${this.enemyType}敵人沒有目標位置`);
      return;
    }
    
    const dx = this.targetPosition.x - this.x;
    const dy = this.targetPosition.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    console.log(`📐 ${this.enemyType}敵人計算移動:`);
    console.log(`  - 當前位置: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
    console.log(`  - 目標位置: (${this.targetPosition.x}, ${this.targetPosition.y})`);
    console.log(`  - 距離/方向: ${distance.toFixed(1)}, (${dx.toFixed(1)}, ${dy.toFixed(1)})`);
    
    if (distance > 0) {
      const currentSpeed = this.getCurrentSpeed();
      this.movementSpeed.x = (dx / distance) * currentSpeed;
      this.movementSpeed.y = (dy / distance) * currentSpeed;
      
      console.log(`  - 計算速度: (${this.movementSpeed.x.toFixed(1)}, ${this.movementSpeed.y.toFixed(1)}), 基礎速度: ${currentSpeed}`);
      
      // 設置物理速度
      if (this.body) {
        // 先檢查物理體是否正確啟用
        if (!this.body.enable) {
          console.log(`🔧 啟用${this.enemyType}敵人物理體`);
          this.scene.physics.world.enable(this);
        }
        
        this.body.setVelocity(this.movementSpeed.x, this.movementSpeed.y);
        console.log(`✅ 物理速度設置: (${this.body.velocity.x.toFixed(1)}, ${this.body.velocity.y.toFixed(1)})`);
        
        // 確保移動狀態
        this.isMoving = true;
        
        // 立即驗證速度是否設置成功
        if (Math.abs(this.body.velocity.x) < 0.1 && Math.abs(this.body.velocity.y) < 0.1) {
          console.log(`⚠️ 警告：物理速度設置後仍為零！`);
          console.log(`🔍 物理體狀態: enable=${this.body.enable}, immovable=${this.body.immovable}`);
        }
      } else {
        console.log(`❌ ${this.enemyType}敵人沒有物理體！`);
        // 嘗試重新創建物理體
        this.setupPhysics();
      }
    } else {
      console.log(`📍 ${this.enemyType}敵人已在目標位置`);
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
    
    // 每3秒輸出一次詳細狀態
    if (Math.floor(time / 3000) !== Math.floor((time - delta) / 3000)) {
      console.log(`🔍 ${this.enemyType}敵人狀態檢查:`);
      console.log(`  - 位置: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
      console.log(`  - 存活: ${this.isAlive}, 移動中: ${this.isMoving}`);
      console.log(`  - 路徑索引: ${this.pathIndex}/${this.path.length - 1}`);
      console.log(`  - 目標位置: ${this.targetPosition ? `(${this.targetPosition.x}, ${this.targetPosition.y})` : '無'}`);
      console.log(`  - 物理體速度: ${this.body ? `(${this.body.velocity.x.toFixed(1)}, ${this.body.velocity.y.toFixed(1)})` : '無物理體'}`);
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
   * 更新移動
   */
  updateMovement(time, delta) {
    if (!this.isMoving) {
      console.log(`⏸️ ${this.enemyType}敵人未在移動狀態`);
      return;
    }
    
    if (!this.targetPosition) {
      console.log(`🎯 ${this.enemyType}敵人沒有目標位置，重新設置目標`);
      this.setNextTarget();
      return;
    }
    
    // 檢查物理體速度是否為零
    if (this.body && Math.abs(this.body.velocity.x) < 0.1 && Math.abs(this.body.velocity.y) < 0.1) {
      console.log(`🔄 ${this.enemyType}敵人速度為零，重新計算移動方向`);
      this.calculateMovementDirection();
    }
    
    // 記錄移動距離
    const prevX = this.x;
    const prevY = this.y;
    
    // 移動已經由物理系統處理，這裡只需要更新統計
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
      this.setNextTarget();
    }
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
   * 攻擊玩家
   */
  attackPlayer() {
    if (!this.scene.player || !this.scene.player.isAlive) return;
    
    this.lastAttackTime = this.scene.time.now;
    
    // 造成傷害
    const damageDealt = this.scene.player.takeDamage(this.damage);
    if (damageDealt) {
      this.stats.damageDealt += this.damage;
      
      console.log(`${this.enemyType}敵人攻擊玩家，造成 ${this.damage} 點傷害`);
      
      // 播放攻擊音效
      this.scene.playSound && this.scene.playSound('enemy_attack');
      
      // 創建攻擊特效
      this.createAttackEffect();
    }
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
    
    console.log(`${this.enemyType}敵人受到 ${actualDamage} 點${damageType}傷害，剩餘生命: ${this.health}`);
    
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
    
    console.log(`${this.enemyType}敵人受到${effectType}效果`);
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
        
        console.log(`${this.enemyType}敵人重新尋路: ${this.path.length}個路徑點`);
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
    console.log(`${this.enemyType}敵人到達玩家位置`);
    
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
    if (!this.isAlive) return;
    
    this.isAlive = false;
    
    console.log(`${this.enemyType}敵人死亡`);
    
    // 停止移動
    if (this.body) {
      this.body.setVelocity(0, 0);
    }
    
    // 播放死亡音效
    if (this.scene.enhancedAudio) {
      this.scene.enhancedAudio.playSound('enemy_death');
    }
    
    // 創建死亡特效
    this.createDeathEffect();
    
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
    // 爆炸效果
    const explosion = this.scene.add.circle(this.x, this.y, 5, 0xffff00, 0.8);
    
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
    
    console.log(`💰 擊殺${this.enemyType}敵人獲得 ${actualReward} 金幣獎勵`);
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
