/**
 * 遊戲管理器
 * 負責管理整體遊戲狀態和流程
 */

import { GameConfig } from '../core/GameConfig.js';

export class GameManager {
  constructor(game) {
    this.game = game;
    this.gameState = GameConfig.GAME.STATES.LOADING;
    this.playerData = this.initializePlayerData();
    this.gameData = this.initializeGameData();
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    console.log('遊戲管理器初始化');
  }

  /**
   * 初始化玩家數據
   */
  initializePlayerData() {
    return {
      // 基本資源
      money: GameConfig.PLAYER.STARTING_MONEY || 500,
      health: GameConfig.PLAYER.HEALTH.MAX || 100,
      maxHealth: GameConfig.PLAYER.HEALTH.MAX || 100,
      
      // 玩家位置
      position: {
        x: GameConfig.PLAYER.POSITION.X,
        y: GameConfig.PLAYER.POSITION.Y
      },
      
      // 武器統計
      weapon: {
        damage: GameConfig.PLAYER.WEAPON.DAMAGE || 30,
        fireRate: GameConfig.PLAYER.WEAPON.FIRE_RATE || 500,
        range: GameConfig.PLAYER.WEAPON.RANGE || 200,
        level: 1
      },
      
      // 升級數據
      upgrades: {
        weaponDamage: 0,
        weaponSpeed: 0,
        weaponRange: 0,
        playerHealth: 0
      },
      
      // 統計數據
      stats: {
        enemiesKilled: 0,
        towersBuilt: 0,
        totalDamageDealt: 0,
        wavesSurvived: 0,
        totalPlayTime: 0
      },
      
      // 成就進度
      achievements: [],
      
      // 解鎖內容
      unlockedTowers: ['basic'],
      unlockedSkins: ['default']
    };
  }

  /**
   * 初始化遊戲數據
   */
  initializeGameData() {
    return {
      // 當前關卡資訊
      currentWave: 0,
      maxWave: GameConfig.WAVE.MAX_WAVES || 50,
      waveInProgress: false,
      
      // 敵人資訊
      enemies: [],
      enemiesAlive: 0,
      enemiesInWave: 0,
      
      // 塔資訊
      towers: [],
      towersCount: 0,
      
      // 遊戲計時
      gameStartTime: 0,
      waveStartTime: 0,
      preparationTimeLeft: 0,
      
      // 難度設定
      difficulty: 'normal',
      difficultyMultiplier: 1.0,
      
      // 遊戲設置
      gameSpeed: 1.0,
      isPaused: false
    };
  }

  /**
   * 開始新遊戲
   */
  startNewGame(difficulty = 'normal') {
    console.log(`開始新遊戲 - 難度: ${difficulty}`);
    
    // 重置遊戲數據
    this.gameData = this.initializeGameData();
    this.gameData.difficulty = difficulty;
    this.gameData.gameStartTime = Date.now();
    
    // 設置難度倍數
    this.setDifficultyMultiplier(difficulty);
    
    // 設置遊戲狀態
    this.setGameState(GameConfig.GAME.STATES.PREPARATION);
    
    // 發送遊戲開始事件
    this.eventEmitter.emit('gameStarted', {
      difficulty: difficulty,
      playerData: this.playerData
    });
    
    return true;
  }

  /**
   * 設置難度倍數
   */
  setDifficultyMultiplier(difficulty) {
    switch (difficulty) {
      case 'easy':
        this.gameData.difficultyMultiplier = 0.8;
        break;
      case 'normal':
        this.gameData.difficultyMultiplier = 1.0;
        break;
      case 'hard':
        this.gameData.difficultyMultiplier = 1.3;
        break;
      case 'nightmare':
        this.gameData.difficultyMultiplier = 1.6;
        break;
      default:
        this.gameData.difficultyMultiplier = 1.0;
    }
  }

  /**
   * 設置遊戲狀態
   */
  setGameState(newState) {
    const oldState = this.gameState;
    this.gameState = newState;
    
    console.log(`遊戲狀態變更: ${oldState} -> ${newState}`);
    
    // 發送狀態變更事件
    this.eventEmitter.emit('gameStateChanged', {
      oldState: oldState,
      newState: newState
    });
    
    // 處理狀態變更邏輯
    this.handleStateChange(oldState, newState);
  }

  /**
   * 處理狀態變更
   */
  handleStateChange(oldState, newState) {
    switch (newState) {
      case GameConfig.GAME.STATES.PREPARATION:
        this.startPreparationPhase();
        break;
      case GameConfig.GAME.STATES.PLAYING:
        this.startWavePhase();
        break;
      case GameConfig.GAME.STATES.PAUSED:
        this.pauseGame();
        break;
      case GameConfig.GAME.STATES.GAME_OVER:
        this.endGame(false);
        break;
      case GameConfig.GAME.STATES.VICTORY:
        this.endGame(true);
        break;
    }
  }

  /**
   * 開始準備階段
   */
  startPreparationPhase() {
    console.log('開始準備階段');
    
    this.gameData.preparationTimeLeft = GameConfig.WAVE.PREPARATION_TIME;
    this.gameData.waveInProgress = false;
    
    // 發送準備階段開始事件
    this.eventEmitter.emit('preparationPhaseStarted', {
      wave: this.gameData.currentWave + 1,
      preparationTime: this.gameData.preparationTimeLeft
    });
  }

  /**
   * 開始波次階段
   */
  startWavePhase() {
    console.log(`開始波次 ${this.gameData.currentWave + 1}`);
    
    this.gameData.currentWave++;
    this.gameData.waveInProgress = true;
    this.gameData.waveStartTime = Date.now();
    
    // 發送波次開始事件
    this.eventEmitter.emit('waveStarted', {
      wave: this.gameData.currentWave,
      difficulty: this.gameData.difficulty
    });
  }

  /**
   * 暫停遊戲
   */
  pauseGame() {
    console.log('遊戲暫停');
    this.gameData.isPaused = true;
    this.eventEmitter.emit('gamePaused');
  }

  /**
   * 恢復遊戲
   */
  resumeGame() {
    console.log('遊戲恢復');
    this.gameData.isPaused = false;
    this.setGameState(GameConfig.GAME.STATES.PLAYING);
    this.eventEmitter.emit('gameResumed');
  }

  /**
   * 結束遊戲
   */
  endGame(victory = false) {
    console.log(`遊戲結束 - ${victory ? '勝利' : '失敗'}`);
    
    const gameEndTime = Date.now();
    const totalPlayTime = gameEndTime - this.gameData.gameStartTime;
    
    // 更新統計數據
    this.playerData.stats.totalPlayTime += totalPlayTime;
    this.playerData.stats.wavesSurvived = Math.max(
      this.playerData.stats.wavesSurvived, 
      this.gameData.currentWave
    );
    
    // 計算獎勵
    const rewards = this.calculateEndGameRewards(victory);
    
    // 發送遊戲結束事件
    this.eventEmitter.emit('gameEnded', {
      victory: victory,
      wave: this.gameData.currentWave,
      playTime: totalPlayTime,
      stats: this.playerData.stats,
      rewards: rewards
    });
    
    // 保存遊戲數據
    this.saveGameData();
  }

  /**
   * 計算遊戲結束獎勵
   */
  calculateEndGameRewards(victory) {
    let moneyReward = this.gameData.currentWave * 10;
    
    if (victory) {
      moneyReward *= 2; // 勝利雙倍獎勵
    }
    
    // 難度加成
    moneyReward = Math.floor(moneyReward * this.gameData.difficultyMultiplier);
    
    return {
      money: moneyReward,
      experience: this.gameData.currentWave * 5
    };
  }

  /**
   * 玩家受傷
   */
  playerTakeDamage(damage) {
    this.playerData.health -= damage;
    this.playerData.health = Math.max(0, this.playerData.health);
    
    console.log(`玩家受到 ${damage} 點傷害，剩餘生命: ${this.playerData.health}`);
    
    // 發送傷害事件
    this.eventEmitter.emit('playerDamaged', {
      damage: damage,
      currentHealth: this.playerData.health,
      maxHealth: this.playerData.maxHealth
    });
    
    // 檢查是否死亡
    if (this.playerData.health <= 0) {
      this.setGameState(GameConfig.GAME.STATES.GAME_OVER);
    }
  }
  
  /**
   * 基地被攻擊（重定向到玩家受傷）
   */
  onBaseAttacked(damage) {
    console.log(`🏰 基地受到 ${damage} 點傷害，重定向到玩家`);
    
    // 直接調用玩家受傷方法
    if (this.game.scene.getScene('GameplayScene') && this.game.scene.getScene('GameplayScene').player) {
      this.game.scene.getScene('GameplayScene').player.takeDamage(damage);
    }
    
    // 播放基地被攻擊的音效
    if (this.game.scene.getScene('GameplayScene') && this.game.scene.getScene('GameplayScene').playSound) {
      this.game.scene.getScene('GameplayScene').playSound('base_hit');
    }
    
    // 發送基地被攻擊事件
    this.eventEmitter.emit('baseAttacked', {
      damage: damage,
      timestamp: Date.now()
    });
  }

  /**
   * 玩家獲得金錢
   */
  addMoney(amount) {
    this.playerData.money += amount;
    
    console.log(`獲得 ${amount} 金幣，總計: ${this.playerData.money}`);
    
    // 發送金錢變化事件
    this.eventEmitter.emit('moneyChanged', {
      amount: amount,
      total: this.playerData.money
    });
  }

  /**
   * 花費金錢
   */
  spendMoney(amount) {
    if (this.playerData.money >= amount) {
      this.playerData.money -= amount;
      
      console.log(`花費 ${amount} 金幣，剩餘: ${this.playerData.money}`);
      
      // 發送金錢變化事件
      this.eventEmitter.emit('moneyChanged', {
        amount: -amount,
        total: this.playerData.money
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * 敵人被擊殺
   */
  enemyKilled(enemy) {
    this.playerData.stats.enemiesKilled++;
    this.gameData.enemiesAlive--;
    
    // 獲得獎勵
    if (enemy.reward) {
      this.addMoney(enemy.reward);
    }
    
    console.log(`敵人被擊殺，剩餘敵人: ${this.gameData.enemiesAlive}`);
    
    // 發送敵人死亡事件
    this.eventEmitter.emit('enemyKilled', {
      enemy: enemy,
      totalKilled: this.playerData.stats.enemiesKilled
    });
    
    // 檢查波次是否完成
    this.checkWaveComplete();
  }

  /**
   * 檢查波次是否完成
   */
  checkWaveComplete() {
    if (this.gameData.waveInProgress && this.gameData.enemiesAlive <= 0) {
      console.log(`波次 ${this.gameData.currentWave} 完成`);
      
      this.gameData.waveInProgress = false;
      
      // 發送波次完成事件
      this.eventEmitter.emit('waveCompleted', {
        wave: this.gameData.currentWave
      });
      
      // 檢查是否勝利
      if (this.gameData.currentWave >= this.gameData.maxWave) {
        this.setGameState(GameConfig.GAME.STATES.VICTORY);
      } else {
        // 開始下一波準備
        this.setGameState(GameConfig.GAME.STATES.PREPARATION);
      }
    }
  }

  /**
   * 建造塔
   */
  buildTower(towerType, position) {
    this.playerData.stats.towersBuilt++;
    this.gameData.towersCount++;
    
    console.log(`建造塔: ${towerType} 在位置 (${position.x}, ${position.y})`);
    
    // 發送建造事件
    this.eventEmitter.emit('towerBuilt', {
      type: towerType,
      position: position,
      totalTowers: this.gameData.towersCount
    });
  }

  /**
   * 獲取當前遊戲狀態
   */
  getGameState() {
    return this.gameState;
  }

  /**
   * 獲取玩家數據
   */
  getPlayerData() {
    return this.playerData;
  }

  /**
   * 獲取遊戲數據
   */
  getGameData() {
    return this.gameData;
  }

  /**
   * 保存遊戲數據
   */
  saveGameData() {
    const saveData = {
      playerData: this.playerData,
      timestamp: Date.now(),
      version: GameConfig.SAVE.VERSION
    };
    
    try {
      localStorage.setItem(GameConfig.SAVE.LOCAL_STORAGE_KEY, JSON.stringify(saveData));
      console.log('遊戲數據已保存');
    } catch (error) {
      console.error('保存遊戲數據失敗:', error);
    }
  }

  /**
   * 載入遊戲數據
   */
  loadGameData() {
    try {
      const saveDataString = localStorage.getItem(GameConfig.SAVE.LOCAL_STORAGE_KEY);
      if (saveDataString) {
        const saveData = JSON.parse(saveDataString);
        
        // 檢查版本兼容性
        if (saveData.version === GameConfig.SAVE.VERSION) {
          this.playerData = { ...this.playerData, ...saveData.playerData };
          console.log('遊戲數據載入成功');
          return true;
        } else {
          console.warn('存檔版本不兼容，使用預設數據');
        }
      }
    } catch (error) {
      console.error('載入遊戲數據失敗:', error);
    }
    
    return false;
  }

  /**
   * 重置遊戲數據
   */
  resetGameData() {
    this.playerData = this.initializePlayerData();
    this.gameData = this.initializeGameData();
    
    // 清除存檔
    localStorage.removeItem(GameConfig.SAVE.LOCAL_STORAGE_KEY);
    
    console.log('遊戲數據已重置');
    
    // 發送重置事件
    this.eventEmitter.emit('gameDataReset');
  }

  /**
   * 銷毀管理器
   */
  destroy() {
    // 保存最終數據
    this.saveGameData();
    
    // 清理事件
    this.eventEmitter.removeAllListeners();
    
    console.log('遊戲管理器已銷毀');
  }
}

export default GameManager;
