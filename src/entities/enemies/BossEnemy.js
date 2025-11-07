/**
 * Boss敵人類 - 支持多种Boss类型
 * 
 * Boss类型：
 * - berserker: 狂暴者（近战高伤害）💥
 * - summoner: 召唤师（召唤流）🔮
 * - tank: 坦克（超高血量+护盾）🛡️
 * 
 * 对应图片：
 * - berserker: assets/sprites/enemies/boss/boss1/boss_1.png
 * - summoner: assets/sprites/enemies/boss/boss2/boss_2.png
 * - tank: assets/sprites/enemies/boss/boss3/boss_3.png
 */

import { BaseEnemy } from './BaseEnemy.js';

// 🎯 Boss 类型配置
const BOSS_TYPES = {
  berserker: {
    name: '狂暴者',
    emoji: '💥',
    color: 0xff0000,
    textureKey: 'boss_berserker',
    healthMultiplier: 1.0,
    damageMultiplier: 1.5,
    speedMultiplier: 1.2,
    abilities: ['dash', 'groundSlam'],
    description: '近戰狂攻型Boss'
  },
  summoner: {
    name: '召喚師',
    emoji: '🔮',
    color: 0x9900ff,
    textureKey: 'boss_summoner',
    healthMultiplier: 0.7,
    damageMultiplier: 0.8,
    speedMultiplier: 0.6,
    abilities: ['summon', 'teleport'],
    description: '召喚大軍型Boss'
  },
  tank: {
    name: '坦克',
    emoji: '🛡️',
    color: 0x00ffff,
    textureKey: 'boss_tank',
    healthMultiplier: 2.0,
    damageMultiplier: 0.6,
    speedMultiplier: 0.4,
    abilities: ['shield', 'stoneThrow'],
    description: '超級護甲型Boss'
  }
};

export class BossEnemy extends BaseEnemy {
  constructor(scene, x, y, bossLevel = 1, bossType = 'berserker') {
    super(scene, x, y, 'BOSS');
    
    // 🎯 Boss 类型和配置
    this.bossType = bossType;
    this.bossConfig = BOSS_TYPES[bossType] || BOSS_TYPES.berserker;
    this.bossLevel = bossLevel;
    this.isBoss = true;
    this.isPassive = false;
    
    // 💪 根據類型和等級設置屬性
    const baseHealth = 500 * bossLevel;
    const baseDamage = 3 * bossLevel;
    const baseSpeed = 60;
    
    this.maxHealth = Math.floor(baseHealth * this.bossConfig.healthMultiplier);
    this.health = this.maxHealth;
    this.damage = Math.floor(baseDamage * this.bossConfig.damageMultiplier);
    this.speed = baseSpeed * this.bossConfig.speedMultiplier;
    this.reward = Math.floor(200 * bossLevel * this.bossConfig.healthMultiplier);
    this.attackType = 'ranged';
    
    // ⚔️ 根據類型初始化能力
    this.initializeAbilities();
    
    // 🎭 階段系統（血量階段）
    this.phases = [
      { threshold: 0.75, triggered: false },
      { threshold: 0.50, triggered: false },
      { threshold: 0.25, triggered: false }
    ];
    
    // 視覺效果
    this.bossGlow = null;
    this.specialEffect = null;
    this.shieldEffect = null;
    
    // 攻擊模式
    this.attackPattern = 0; // 0: 正常, 1: 狂暴, 2: 防禦
    
    // 🆕 清理 BaseEnemy 创建的默认视觉效果
    if (this.list && this.list.length > 0) {
      this.removeAll(true);
    }
    
    // 🆕 重新创建 Boss 专属视觉效果（现在 bossConfig 已正确设置）
    this.createEnemyVisuals();
    
    console.log(`👾 ${this.bossConfig.name} Boss 創建 - 等級 ${this.bossLevel}, HP: ${this.health}/${this.maxHealth}`);
  }
  
  /**
   * 根據類型初始化能力
   */
  initializeAbilities() {
    const abilities = this.bossConfig.abilities;
    
    // 🔥 狂暴者能力
    if (abilities.includes('dash')) {
      this.dashAbility = {
        enabled: true,
        cooldown: 6000,
        lastUse: 0,
        damage: this.damage * 2,
        range: 300
      };
    }
    
    if (abilities.includes('groundSlam')) {
      this.groundSlamAbility = {
        enabled: true,
        cooldown: 8000,
        lastUse: 0,
        range: 250,
        damage: this.damage * 1.5
      };
    }
    
    // 🔮 召喚師能力
    if (abilities.includes('summon')) {
      this.summonAbility = {
        enabled: true,
        cooldown: 10000,
        lastUse: 0,
        minionCount: 4 + this.bossLevel
      };
    }
    
    if (abilities.includes('teleport')) {
      this.teleportAbility = {
        enabled: true,
        cooldown: 12000,
        lastUse: 0,
        range: 400
      };
    }
    
    // 🛡️ 坦克能力
    if (abilities.includes('shield')) {
      this.shieldAbility = {
        enabled: true,
        cooldown: 15000,
        lastUse: 0,
        duration: 5000,
        damageReduction: 0.7,
        active: false
      };
    }
    
    if (abilities.includes('stoneThrow')) {
      this.stoneThrowAbility = {
        enabled: true,
        cooldown: 8000,
        lastUse: 0,
        stoneCount: 8, // 每次释放的小石头数量
        stoneSpeed: 60 // 小石头移动速度（像素/秒）
      };
    }
  }
  
  /**
   * 創建 Boss 視覺效果
   */
  createEnemyVisuals() {
    // 🆕 安全检查：确保 bossConfig 已初始化
    if (!this.bossConfig) {
      console.log('⚠️ bossConfig 尚未初始化，跳過視覺創建（稍後重建）');
      return;
    }
    
    // 🆕 使用真实Boss图片
    const textureKey = this.bossConfig.textureKey;
    
    // 检查图片是否存在
    if (!this.scene.textures.exists(textureKey)) {
      console.warn(`⚠️ Boss 圖片 ${textureKey} 不存在，使用默認圖片`);
      this.sprite = this.scene.add.sprite(0, 0, 'enemy_meteor', 'Meteor_1');
    } else {
      this.sprite = this.scene.add.image(0, 0, textureKey);
      console.log(`✅ 載入 Boss 圖片: ${textureKey}`);
    }
    
    // 根據類型調整大小
    let baseScale = 0.3;
    
    switch (this.bossType) {
      case 'berserker':
        baseScale = 0.35;
        break;
      case 'summoner':
        baseScale = 0.28;
        break;
      case 'tank':
        baseScale = 0.45;
        break;
    }
    
    const finalScale = baseScale * (1 + this.bossLevel * 0.1);
    this.sprite.setScale(finalScale);
    this.sprite.setOrigin(0.5, 0.5);
    this.add(this.sprite);
    
    // ✨ Boss 光環效果
    this.bossGlow = this.scene.add.circle(0, 0, 100, this.bossConfig.color, 0.25);
    this.add(this.bossGlow);
    
    this.scene.tweens.add({
      targets: this.bossGlow,
      alpha: { from: 0.25, to: 0.5 },
      scaleX: { from: 1, to: 1.4 },
      scaleY: { from: 1, to: 1.4 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 👑 Boss 名称标签
    const labelBg = this.scene.add.rectangle(0, -120, 200, 35, 0x000000, 0.8);
    labelBg.setOrigin(0.5);
    this.add(labelBg);
    
    const bossLabel = this.scene.add.text(0, -120, 
      `${this.bossConfig.emoji} ${this.bossConfig.name} Lv.${this.bossLevel}`, {
        fontSize: '18px',
        fill: '#ffffff',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }
    );
    bossLabel.setOrigin(0.5);
    this.add(bossLabel);
    
    this.scene.tweens.add({
      targets: bossLabel,
      alpha: { from: 1, to: 0.7 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
    
    // 💚 Boss 血條
    this.createBossHealthBar();
    
    // 🎨 類型特殊效果
    this.createTypeSpecificVisuals();
  }
  
  /**
   * 創建 Boss 專用血條
   */
  createBossHealthBar() {
    const barWidth = 120;
    const barHeight = 12;
    
    // 血條背景
    this.healthBarBg = this.scene.add.rectangle(0, -100, barWidth + 4, barHeight + 4, 0x000000);
    this.healthBarBg.setOrigin(0.5, 0.5);
    this.add(this.healthBarBg);
    
    // 血條
    this.healthBar = this.scene.add.rectangle(0, -100, barWidth, barHeight, this.bossConfig.color);
    this.healthBar.setOrigin(0.5, 0.5);
    this.add(this.healthBar);
    
    // 血量文字
    this.healthText = this.scene.add.text(0, -100, `${this.health}/${this.maxHealth}`, {
      fontSize: '14px',
      fill: '#ffffff',
      fontWeight: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.healthText.setOrigin(0.5);
    this.add(this.healthText);
  }
  
  /**
   * 更新血條
   */
  updateHealthBar() {
    if (!this.healthBar) return;
    
    const healthPercent = this.health / this.maxHealth;
    const maxWidth = 120;
    const currentWidth = Math.max(0, maxWidth * healthPercent);
    
    this.healthBar.width = currentWidth;
    
    // 根據血量改變顏色
    if (healthPercent > 0.5) {
      this.healthBar.setFillStyle(this.bossConfig.color);
    } else if (healthPercent > 0.25) {
      this.healthBar.setFillStyle(0xff6600);
    } else {
      this.healthBar.setFillStyle(0xff00ff);
    }
    
    // 更新文字
    if (this.healthText) {
      this.healthText.setText(`${Math.ceil(this.health)}/${this.maxHealth}`);
    }
  }
  
  /**
   * 創建類型特定視覺效果
   */
  createTypeSpecificVisuals() {
    switch (this.bossType) {
      case 'berserker':
        this.createFireEffect();
        break;
      case 'summoner':
        this.createMagicCircle();
        break;
      case 'tank':
        this.createArmorPlating();
        break;
    }
  }
  
  /**
   * 狂暴者：火焰效果
   */
  createFireEffect() {
    const flame1 = this.scene.add.circle(-20, 10, 8, 0xff6600, 0.7);
    const flame2 = this.scene.add.circle(20, 10, 8, 0xff6600, 0.7);
    this.add(flame1);
    this.add(flame2);
    
    [flame1, flame2].forEach((flame, index) => {
      this.scene.tweens.add({
        targets: flame,
        y: flame.y - 30,
        alpha: 0,
        duration: 800,
        delay: index * 200,
        repeat: -1
      });
    });
  }
  
  /**
   * 召喚師：魔法環
   */
  createMagicCircle() {
    const circle = this.scene.add.circle(0, 0, 70, 0x9900ff, 0);
    circle.setStrokeStyle(3, 0x9900ff, 0.8);
    this.add(circle);
    
    this.scene.tweens.add({
      targets: circle,
      rotation: Math.PI * 2,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });
  }
  
  /**
   * 坦克：裝甲板
   */
  createArmorPlating() {
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const armor = this.scene.add.circle(
        Math.cos(angle) * 50,
        Math.sin(angle) * 50,
        10,
        0x00ffff,
        0.6
      );
      this.add(armor);
      
      this.scene.tweens.add({
        targets: armor,
        alpha: { from: 0.6, to: 0.9 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    }
  }
  
  /**
   * Boss 更新邏輯
   */
  update(time, delta) {
    if (!this.isAlive) return;
    
    super.update(time, delta);
    
    // 🌀 Boss 旋轉效果（根據類型調整）
    if (this.sprite) {
      let rotationSpeed = 0.3;
      if (this.bossType === 'berserker') rotationSpeed = 0.8;
      if (this.bossType === 'tank') rotationSpeed = 0.1;
      
      this.sprite.rotation += rotationSpeed * delta * 0.001;
    }
    
    // 檢查階段觸發
    this.checkPhaseTransition();
    
    // 使用類型特定能力
    this.useTypeSpecificAbilities(time);
    
    // 更新護盾狀態
    if (this.shieldAbility && this.shieldAbility.active) {
      if (time - this.shieldAbility.lastUse > this.shieldAbility.duration) {
        this.deactivateShield();
      }
    }
  }
  
  /**
   * 檢查階段轉換
   */
  checkPhaseTransition() {
    const healthPercent = this.health / this.maxHealth;
    
    this.phases.forEach((phase, index) => {
      if (healthPercent <= phase.threshold && !phase.triggered) {
        phase.triggered = true;
        this.onPhaseTransition(index + 1);
      }
    });
  }
  
  /**
   * 階段轉換事件
   */
  onPhaseTransition(phaseNumber) {
    console.log(`👾 ${this.bossConfig.name} 進入第 ${phaseNumber} 階段！`);
    
    // 階段特效
    this.playPhaseEffect();
    
    // 增強屬性
    this.speed *= 1.15;
    this.damage *= 1.1;
    
    // 改變視覺效果
    if (phaseNumber === 2) {
      this.bossGlow.setFillStyle(0xff6600, 0.4);
    } else if (phaseNumber === 3) {
      this.bossGlow.setFillStyle(0xff00ff, 0.5);
      this.attackPattern = 1;
    }
    
    // 通知場景
    this.scene.events.emit('bossPhaseChange', {
      boss: this,
      phase: phaseNumber
    });
  }
  
  /**
   * 播放階段轉換特效
   */
  playPhaseEffect() {
    // 🆕 保存位置，避免 Boss 销毁后出错
    const bossX = this.x;
    const bossY = this.y;
    
    const ring = this.scene.add.circle(bossX, bossY, 20, 0xffff00, 0.8);
    // ✅ 直接添加到场景，不使用 this.add()
    
    this.scene.tweens.add({
      targets: ring,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });
    
    this.scene.cameras.main.shake(500, 0.01);
  }
  
  /**
   * 使用類型特定能力
   */
  useTypeSpecificAbilities(time) {
    switch (this.bossType) {
      case 'berserker':
        this.useBerserkerAbilities(time);
        break;
      case 'summoner':
        this.useSummonerAbilities(time);
        break;
      case 'tank':
        this.useTankAbilities(time);
        break;
    }
  }
  
  /**
   * 狂暴者能力
   */
  useBerserkerAbilities(time) {
    if (this.dashAbility && time - this.dashAbility.lastUse > this.dashAbility.cooldown) {
      this.performDash();
      this.dashAbility.lastUse = time;
    }
    
    if (this.groundSlamAbility && time - this.groundSlamAbility.lastUse > this.groundSlamAbility.cooldown) {
      this.performGroundSlam();
      this.groundSlamAbility.lastUse = time;
    }
  }
  
  /**
   * 召喚師能力
   */
  useSummonerAbilities(time) {
    if (this.summonAbility && time - this.summonAbility.lastUse > this.summonAbility.cooldown) {
      this.summonMinions();
      this.summonAbility.lastUse = time;
    }
    
    if (this.teleportAbility && time - this.teleportAbility.lastUse > this.teleportAbility.cooldown) {
      this.performTeleport();
      this.teleportAbility.lastUse = time;
    }
  }
  
  /**
   * 坦克能力
   */
  useTankAbilities(time) {
    if (this.shieldAbility && !this.shieldAbility.active) {
      if (time - this.shieldAbility.lastUse > this.shieldAbility.cooldown) {
        this.activateShield();
        this.shieldAbility.lastUse = time;
      }
    }
    
    // 🆕 小石头投射
    if (this.stoneThrowAbility && time - this.stoneThrowAbility.lastUse > this.stoneThrowAbility.cooldown) {
      this.performStoneThrow();
      this.stoneThrowAbility.lastUse = time;
    }
  }
  
  /**
   * 技能：衝刺攻擊
   */
  performDash() {
    console.log('💥 狂暴者衝刺攻擊！');
    
    if (!this.scene.player) return;
    
    const angle = Phaser.Math.Angle.Between(
      this.x, this.y,
      this.scene.player.x, this.scene.player.y
    );
    
    this.scene.tweens.add({
      targets: this,
      x: this.x + Math.cos(angle) * 200,
      y: this.y + Math.sin(angle) * 200,
      duration: 300,
      ease: 'Power2'
    });
    
    // 🆕 保存位置，避免 Boss 销毁后特效出错
    const trailX = this.x;
    const trailY = this.y;
    
    const trail = this.scene.add.circle(trailX, trailY, 30, 0xff0000, 0.6);
    // ✅ 直接添加到场景，不使用 this.add()
    
    this.scene.tweens.add({
      targets: trail,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => trail.destroy()
    });
  }
  
  /**
   * 技能：震地波
   */
  performGroundSlam() {
    console.log('💥 狂暴者震地波！');
    
    const range = this.groundSlamAbility.range;
    
    // 🆕 保存 Boss 位置和场景引用
    const bossX = this.x;
    const bossY = this.y;
    const scene = this.scene;  // 🔑 保存 scene 引用
    
    for (let i = 1; i <= 3; i++) {
      scene.time.delayedCall(i * 200, () => {  // 使用保存的 scene
        const wave = scene.add.circle(bossX, bossY, range * i / 3, 0xff6600, 0);
        wave.setStrokeStyle(5, 0xff0000, 0.8);
        
        scene.tweens.add({
          targets: wave,
          alpha: 0,
          duration: 500,
          onComplete: () => wave.destroy()
        });
      });
    }
    
    this.scene.cameras.main.shake(300, 0.01);
    
    if (this.scene.player) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.scene.player.x, this.scene.player.y
      );
      
      if (distance <= range) {
        this.scene.player.takeDamage(this.groundSlamAbility.damage);
      }
    }
  }
  
  /**
   * 技能：召喚小怪
   */
  summonMinions() {
    console.log('🔮 召喚師召喚小怪！');
    
    const count = this.summonAbility.minionCount;
    
    // 🆕 保存 Boss 位置和场景引用
    const bossX = this.x;
    const bossY = this.y;
    const scene = this.scene;  // 🔑 保存 scene 引用
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = 100;
      const minionX = bossX + Math.cos(angle) * distance;
      const minionY = bossY + Math.sin(angle) * distance;
      
      scene.time.delayedCall(i * 300, () => {  // 使用保存的 scene
        const { MeteorEnemy } = require('./MeteorEnemy.js');
        const minion = new MeteorEnemy(scene, minionX, minionY);
        minion.health = 30;
        minion.maxHealth = 30;
        minion.setScale(0.5);
        
        if (scene.enemies) {
          scene.enemies.add(minion);
        }
        
        // 召喚特效（直接添加到场景）
        const summonEffect = scene.add.circle(minionX, minionY, 20, 0x9900ff, 0.8);
        
        scene.tweens.add({
          targets: summonEffect,
          scaleX: 2,
          scaleY: 2,
          alpha: 0,
          duration: 500,
          onComplete: () => summonEffect.destroy()
        });
      });
    }
  }
  
  /**
   * 技能：傳送
   */
  performTeleport() {
    console.log('🔮 召喚師傳送！');
    
    // 傳送特效（消失）
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 300,
      onComplete: () => {
        const newX = Phaser.Math.Between(100, this.scene.scale.width - 100);
        const newY = Phaser.Math.Between(100, this.scene.scale.height - 100);
        
        this.setPosition(newX, newY);
        
        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 300
        });
      }
    });
  }
  
  /**
   * 技能：啟動護盾
   */
  activateShield() {
    console.log('🛡️ 坦克啟動護盾！');
    
    this.shieldAbility.active = true;
    
    this.shieldEffect = this.scene.add.circle(0, 0, 110, 0x00ffff, 0.3);
    this.add(this.shieldEffect);
    
    this.scene.tweens.add({
      targets: this.shieldEffect,
      alpha: { from: 0.3, to: 0.6 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }
  
  /**
   * 關閉護盾
   */
  deactivateShield() {
    console.log('🛡️ 坦克護盾消失');
    
    this.shieldAbility.active = false;
    
    if (this.shieldEffect) {
      this.shieldEffect.destroy();
      this.shieldEffect = null;
    }
  }
  
  /**
   * 🆕 技能：投擲小石頭
   */
  performStoneThrow() {
    console.log('🪨 坦克投擲小石頭！');
    
    if (!this.scene || !this.scene.player) return;
    
    // 🆕 保存 Boss 位置和场景引用
    const bossX = this.x;
    const bossY = this.y;
    const scene = this.scene;
    const stoneCount = this.stoneThrowAbility.stoneCount;
    const stoneSpeed = this.stoneThrowAbility.stoneSpeed;
    
    // 创建小石头投射物组（如果不存在）
    if (!scene.bossStones) {
      scene.bossStones = scene.add.group();
      
      // 🆕 設置小石頭與玩家的碰撞檢測
      if (scene.onBossStoneHitPlayer) {
        scene.physics.add.overlap(scene.bossStones, scene.player, scene.onBossStoneHitPlayer, null, scene);
        console.log('✅ Boss 小石頭碰撞檢測已設置');
      }
    }
    
    // 向玩家方向投掷多个小石头
    const playerX = scene.player.x;
    const playerY = scene.player.y;
    const baseAngle = Phaser.Math.Angle.Between(bossX, bossY, playerX, playerY);
    
    for (let i = 0; i < stoneCount; i++) {
      // 计算角度（稍微分散）
      const angleOffset = (i - stoneCount / 2) * 0.3; // 每个石头角度偏移
      const angle = baseAngle + angleOffset;
      
      // 创建小石头
      const stone = scene.add.circle(bossX, bossY, 6, 0x888888, 0.9);
      stone.setStrokeStyle(2, 0x555555);
      
      // 添加物理
      scene.physics.add.existing(stone);
      stone.body.setCircle(6);
      
      // 设置速度
      const velocityX = Math.cos(angle) * stoneSpeed;
      const velocityY = Math.sin(angle) * stoneSpeed;
      stone.body.setVelocity(velocityX, velocityY);
      
      // 标记为小石头
      stone.isBossStone = true;
      stone.boss = this;
      
      // 添加到组
      scene.bossStones.add(stone);
      
      // 旋转动画
      scene.tweens.add({
        targets: stone,
        rotation: Math.PI * 2,
        duration: 2000,
        repeat: -1
      });
      
      // 10秒后自动销毁（防止内存泄漏）
      scene.time.delayedCall(10000, () => {
        if (stone && stone.active) {
          stone.destroy();
        }
      });
    }
    
    // 投掷特效
    const throwEffect = scene.add.circle(bossX, bossY, 30, 0x00ffff, 0.5);
    scene.tweens.add({
      targets: throwEffect,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => throwEffect.destroy()
    });
  }
  
  /**
   * 受到傷害（護盾）
   */
  takeDamage(damage, damageType = 'normal', source = null) {
    if (!this.isAlive) return 0;
    
    let actualDamage = damage;
    
    // 坦克護盾減傷
    if (this.shieldAbility && this.shieldAbility.active) {
      actualDamage *= (1 - this.shieldAbility.damageReduction);
      console.log(`🛡️ 護盾減傷！實際傷害: ${actualDamage.toFixed(1)}`);
    }
    
    return super.takeDamage(actualDamage, damageType, source);
  }
  
  /**
   * Boss 死亡（重写父类方法）
   */
  die() {
    // 🆕 添加调试日志
    console.log(`🔴 BossEnemy.die() 被調用`);
    console.log(`   Boss 類型: ${this.bossType}`);
    console.log(`   Boss 名稱: ${this.bossConfig ? this.bossConfig.name : 'undefined'}`);
    console.log(`   isAlive: ${this.isAlive}`);
    
    // 如果已经死亡，直接返回
    if (!this.isAlive) {
      console.log('⚠️ Boss 已死亡，跳過');
      return;
    }
    
    console.log(`💀 ${this.bossConfig.name} Boss 死亡流程開始`);
    
    // ⚠️ 不要在这里设置 isAlive = false，让 super.die() 处理
    
    // 播放Boss死亡特效
    this.playBossDeathEffect();
    
    // 🔑 关键：发送 Boss 击败事件（在 super.die() 之前）
    console.log('   → 發送 bossDied 事件...');
    this.eventEmitter.emit('bossDied', { 
      boss: this, 
      reward: this.reward,
      bossType: this.bossType,
      bossLevel: this.bossLevel
    });
    console.log('   ✓ bossDied 事件已發送');
    
    console.log('   → 發送 bossDefeated 事件到場景...');
    this.scene.events.emit('bossDefeated', { 
      boss: this, 
      level: this.bossLevel,
      bossType: this.bossType,
      reward: this.reward
    });
    console.log('   ✓ bossDefeated 事件已發送');
    
    // 調用父類死亡方法（它会设置 isAlive = false 并销毁 Boss）
    console.log('   → 調用 super.die()...');
    super.die();
    console.log('   ✓ Boss 死亡流程完成');
  }
  
  /**
   * Boss 死亡特效
   */
  playBossDeathEffect() {
    // 🆕 保存 Boss 位置、颜色和场景引用（Boss 销毁后仍可访问）
    const bossX = this.x;
    const bossY = this.y;
    const bossColor = this.bossConfig.color;
    const scene = this.scene;  // 🔑 保存 scene 引用，防止 Boss 销毁后出错
    
    // 多層爆炸效果
    for (let i = 0; i < 8; i++) {
      scene.time.delayedCall(i * 150, () => {  // 使用保存的 scene
        const explosion = scene.add.circle(
          bossX + Phaser.Math.Between(-60, 60),
          bossY + Phaser.Math.Between(-60, 60),
          30,
          bossColor,
          0.8
        );
        
        scene.tweens.add({
          targets: explosion,
          scaleX: 4,
          scaleY: 4,
          alpha: 0,
          duration: 800,
          ease: 'Power2',
          onComplete: () => explosion.destroy()
        });
      });
    }
    
    // 強烈震動效果
    scene.cameras.main.shake(1500, 0.025);
  }
  
  /**
   * 獲取 Boss 類型名稱
   */
  getBossTypeName() {
    return this.bossConfig.name;
  }
  
  /**
   * 獲取 Boss 描述
   */
  getBossDescription() {
    return this.bossConfig.description;
  }
}

// 導出Boss類型配置供其他模組使用
export { BOSS_TYPES };

