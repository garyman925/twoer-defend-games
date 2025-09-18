/**
 * 敵人生成器
 * 負責根據波次配置生成敵人
 */

import GameConfig from '../core/GameConfig.js';
import { BaseEnemy } from '../entities/enemies/BaseEnemy.js';

export class EnemySpawner {
  constructor(scene) {
    this.scene = scene;
    
    // 生成配置
    this.spawnPoints = [];
    this.currentWave = 0;
    this.enemiesInWave = [];
    this.spawnQueue = [];
    
    // 生成狀態
    this.isSpawning = false;
    this.spawnTimer = null;
    this.waveComplete = false;
    
    // 統計數據
    this.stats = {
      totalEnemiesSpawned: 0,
      enemiesAlive: 0,
      enemiesKilled: 0
    };
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    this.init();
    
    console.log('敵人生成器初始化完成');
  }

  /**
   * 初始化生成器
   */
  init() {
    // 設置生成點
    this.setupSpawnPoints();
    
    // 監聽敵人事件
    this.setupEventListeners();
  }

  /**
   * 設置生成點
   */
  setupSpawnPoints() {
    // 優先使用 Tiled 地圖的生成點
    if (this.scene.enemySpawnPoint) {
      this.spawnPoints = [this.scene.enemySpawnPoint];
      console.log('使用 Tiled 地圖生成點:', this.spawnPoints);
      return;
    }
    
    // 備用：使用螢幕邊緣生成點
    const { width, height } = this.scene.scale.gameSize;
    
    this.spawnPoints = [
      // 左邊緣生成點
      { x: 50, y: height * 0.2 },
      { x: 50, y: height * 0.4 },
      { x: 50, y: height * 0.6 },
      { x: 50, y: height * 0.8 },
      // 上邊緣生成點
      { x: width * 0.2, y: 50 },
      { x: width * 0.8, y: 50 },
      // 右邊緣生成點
      { x: width - 50, y: height * 0.3 },
      { x: width - 50, y: height * 0.7 }
    ];
    
    console.log(`設置了 ${this.spawnPoints.length} 個敵人生成點`);
    console.log('生成點位置:', this.spawnPoints);
  }

  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    // 監聽敵人死亡事件
    this.eventEmitter.on('enemyDied', (data) => {
      this.onEnemyDied(data.enemy);
    });
    
    // 監聽敵人到達終點事件
    this.eventEmitter.on('enemyReachedDestination', (enemy) => {
      this.onEnemyReachedDestination(enemy);
    });
  }

  /**
   * 開始生成波次
   */
  startWave(waveNumber) {
    if (this.isSpawning) {
      console.warn('⚠️ 已在生成敵人中，無法開始新波次');
      return false;
    }
    
    this.currentWave = waveNumber;
    this.waveComplete = false;
    this.enemiesInWave = [];
    this.spawnQueue = [];
    
    console.log(`開始生成波次 ${waveNumber}`);
    
    // 獲取波次配置
    const waveConfig = this.getWaveConfig(waveNumber);
    if (!waveConfig) {
      console.error(`找不到波次 ${waveNumber} 的配置`);
      return false;
    }
    
    // 創建生成隊列
    this.createSpawnQueue(waveConfig);
    
    // 開始生成
    this.isSpawning = true;
    this.processSpawnQueue();
    
    return true;
  }

  /**
   * 獲取波次配置
   */
  getWaveConfig(waveNumber) {
    // 從GameConfig獲取配置
    const patterns = GameConfig.WAVE.PATTERNS;
    if (!patterns || patterns.length === 0) {
      return this.getDefaultWaveConfig(waveNumber);
    }
    
    // 如果波次超過配置數量，使用最後一個配置並增加難度
    let configIndex = Math.min(waveNumber - 1, patterns.length - 1);
    let config = { ...patterns[configIndex] };
    
    // 如果超過配置範圍，增加難度
    if (waveNumber > patterns.length) {
      const difficultyMultiplier = Math.pow(GameConfig.WAVE.DIFFICULTY_MULTIPLIER, 
                                          waveNumber - patterns.length);
      config.count = Math.floor(config.count * difficultyMultiplier);
    }
    
    return config;
  }

  /**
   * 獲取默認波次配置
   */
  getDefaultWaveConfig(waveNumber) {
    return {
      enemyType: 'BASIC',
      count: 5 + waveNumber * 2,
      interval: Math.max(500, 1000 - waveNumber * 50)
    };
  }

  /**
   * 創建生成隊列
   */
  createSpawnQueue(waveConfig) {
    const enemyType = waveConfig.enemyType.toLowerCase();
    const count = waveConfig.count;
    const interval = waveConfig.interval;
    
    // 創建生成時間表
    for (let i = 0; i < count; i++) {
      this.spawnQueue.push({
        enemyType: enemyType,
        spawnTime: i * interval,
        spawned: false
      });
    }
    
    console.log(`創建生成隊列：${count} 個 ${enemyType} 敵人，間隔 ${interval}ms`);
  }

  /**
   * 處理生成隊列
   */
  processSpawnQueue() {
    if (!this.isSpawning || this.spawnQueue.length === 0) return;
    
    // 檢查是否有需要生成的敵人
    const currentTime = this.scene.time.now;
    const waveStartTime = this.waveStartTime || currentTime;
    
    if (!this.waveStartTime) {
      this.waveStartTime = currentTime;
    }
    
    this.spawnQueue.forEach(spawn => {
      if (!spawn.spawned && currentTime - waveStartTime >= spawn.spawnTime) {
        this.spawnEnemy(spawn.enemyType);
        spawn.spawned = true;
      }
    });
    
    // 檢查是否所有敵人都已生成
    const allSpawned = this.spawnQueue.every(spawn => spawn.spawned);
    if (allSpawned) {
      this.isSpawning = false;
      console.log(`波次 ${this.currentWave} 所有敵人生成完成`);
      
      // 檢查波次是否完全結束
      this.checkWaveComplete();
    }
  }

  /**
   * 生成單個敵人
   */
  spawnEnemy(enemyType) {
    // 使用 Tiled 地圖的生成點
    const spawnPoint = this.getTiledSpawnPoint();
    
    // 創建敵人
    const enemy = new BaseEnemy(this.scene, spawnPoint.x, spawnPoint.y, enemyType);
    
    // 監聽敵人事件
    enemy.eventEmitter.on('enemyDied', (data) => {
      this.eventEmitter.emit('enemyDied', data);
    });
    
    enemy.eventEmitter.on('enemyReachedDestination', (enemy) => {
      this.eventEmitter.emit('enemyReachedDestination', enemy);
    });
    
    // 設置敵人的 Tiled 路徑
    this.setupEnemyTiledPath(enemy);
    
    // 添加到場景的敵人群組
    if (this.scene.enemies) {
      this.scene.enemies.add(enemy);
      console.log(`敵人已添加到群組，當前敵人數量: ${this.scene.enemies.children.entries.length}`);
    }
    
    // 記錄敵人
    this.enemiesInWave.push(enemy);
    this.stats.totalEnemiesSpawned++;
    this.stats.enemiesAlive++;
    
    console.log(`✅ 生成 ${enemyType} 敵人於 (${spawnPoint.x}, ${spawnPoint.y})`);
    console.log(`當前存活敵人數: ${this.stats.enemiesAlive}`);
    
    // 發送生成事件
    this.eventEmitter.emit('enemySpawned', {
      enemy: enemy,
      type: enemyType,
      wave: this.currentWave
    });
    
    return enemy;
  }

  /**
   * 獲取 Tiled 地圖生成點
   */
  getTiledSpawnPoint() {
    // 優先使用 Tiled 地圖的生成點
    if (this.scene.enemySpawnPoint) {
      return this.scene.enemySpawnPoint;
    }
    
    // 備用：使用隨機生成點
    return this.getRandomSpawnPoint();
  }

  /**
   * 獲取隨機生成點 (備用方法)
   */
  getRandomSpawnPoint() {
    return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
  }

  /**
   * 設置敵人的 Tiled 路徑
   */
  setupEnemyTiledPath(enemy) {
    // 使用場景中的 Tiled 路徑
    if (this.scene.gamePath && this.scene.gamePath.length > 0) {
      enemy.setPath(this.scene.gamePath);
      console.log(`敵人設置了 ${this.scene.gamePath.length} 個路徑點`);
    } else {
      console.warn('沒有找到 Tiled 路徑，使用默認路徑');
      // 使用默認路徑（從生成點到基地）
      const defaultPath = this.createDefaultPath(enemy.x, enemy.y);
      enemy.setPath(defaultPath);
    }
  }

  /**
   * 創建默認路徑 (備用方法)
   */
  createDefaultPath(startX, startY) {
    const { width, height } = this.scene.scale.gameSize;
    
    // 簡單的直線路徑到螢幕中心
    return [
      { x: startX, y: startY },
      { x: width / 2, y: height / 2 }
    ];
  }

  /**
   * 敵人死亡處理
   */
  onEnemyDied(enemy) {
    this.stats.enemiesAlive--;
    this.stats.enemiesKilled++;
    
    // 從敵人列表中移除
    const index = this.enemiesInWave.indexOf(enemy);
    if (index > -1) {
      this.enemiesInWave.splice(index, 1);
    }
    
    // 檢查波次是否完成
    this.checkWaveComplete();
    
    console.log(`敵人死亡，剩餘敵人: ${this.stats.enemiesAlive}`);
  }

  /**
   * 敵人到達終點處理
   */
  onEnemyReachedDestination(enemy) {
    this.stats.enemiesAlive--;
    
    // 從敵人列表中移除
    const index = this.enemiesInWave.indexOf(enemy);
    if (index > -1) {
      this.enemiesInWave.splice(index, 1);
    }
    
    // 敵人攻擊基地，對玩家造成傷害
    this.handleEnemyAttackBase(enemy);
    
    // 檢查波次是否完成
    this.checkWaveComplete();
    
    console.log(`🏰 ${enemy.enemyType}敵人到達基地並攻擊！`);
  }

  /**
   * 處理敵人攻擊基地
   */
  handleEnemyAttackBase(enemy) {
    // 對玩家造成傷害
    if (this.scene.player) {
      this.scene.player.takeDamage(enemy.damage);
      console.log(`💥 基地受到 ${enemy.damage} 點傷害！`);
    }
    
    // 可以添加基地生命值系統
    if (this.scene.gameManager) {
      // 通知遊戲管理器敵人攻擊基地
      this.scene.gameManager.onBaseAttacked(enemy.damage);
    }
  }

  /**
   * 檢查波次是否完成
   */
  checkWaveComplete() {
    // 如果所有敵人都已生成且沒有存活的敵人
    if (!this.isSpawning && this.stats.enemiesAlive === 0) {
      this.completeWave();
    }
  }

  /**
   * 完成波次
   */
  completeWave() {
    if (this.waveComplete) return;
    
    this.waveComplete = true;
    this.waveStartTime = null;
    
    console.log(`波次 ${this.currentWave} 完成！`);
    
    // 發送波次完成事件
    this.eventEmitter.emit('waveComplete', {
      wave: this.currentWave,
      enemiesKilled: this.stats.enemiesKilled,
      stats: { ...this.stats }
    });
  }

  /**
   * 更新生成器
   */
  update(time, delta) {
    // 處理生成隊列
    if (this.isSpawning) {
      this.processSpawnQueue();
    }
  }

  /**
   * 停止當前波次
   */
  stopCurrentWave() {
    this.isSpawning = false;
    this.spawnQueue = [];
    
    // 清理所有當前波次的敵人
    this.enemiesInWave.forEach(enemy => {
      if (enemy && enemy.destroy) {
        enemy.destroy();
      }
    });
    
    this.enemiesInWave = [];
    this.stats.enemiesAlive = 0;
    
    console.log('當前波次已停止');
  }

  /**
   * 獲取當前狀態
   */
  getStatus() {
    return {
      currentWave: this.currentWave,
      isSpawning: this.isSpawning,
      enemiesAlive: this.stats.enemiesAlive,
      enemiesKilled: this.stats.enemiesKilled,
      totalSpawned: this.stats.totalEnemiesSpawned,
      waveComplete: this.waveComplete
    };
  }

  /**
   * 重置生成器
   */
  reset() {
    this.stopCurrentWave();
    this.currentWave = 0;
    this.stats = {
      totalEnemiesSpawned: 0,
      enemiesAlive: 0,
      enemiesKilled: 0
    };
    
    console.log('敵人生成器已重置');
  }

  /**
   * 銷毀生成器
   */
  destroy() {
    this.stopCurrentWave();
    this.eventEmitter.removeAllListeners();
    
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    
    console.log('敵人生成器已銷毀');
  }
}
