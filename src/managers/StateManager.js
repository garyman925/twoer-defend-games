/**
 * 狀態管理器
 * 負責管理遊戲的各種狀態和狀態轉換
 */

import { GameConfig } from '../core/GameConfig.js';

export class StateManager {
  constructor(game) {
    this.game = game;
    this.currentState = GameConfig.GAME.STATES.LOADING;
    this.previousState = null;
    this.stateHistory = [];
    this.stateData = new Map();
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 狀態轉換規則
    this.stateTransitions = this.initializeStateTransitions();
    
    console.log('狀態管理器初始化');
  }

  /**
   * 初始化狀態轉換規則
   */
  initializeStateTransitions() {
    return {
      [GameConfig.GAME.STATES.LOADING]: [
        GameConfig.GAME.STATES.MENU
      ],
      [GameConfig.GAME.STATES.MENU]: [
        GameConfig.GAME.STATES.PREPARATION,
        GameConfig.GAME.STATES.SHOP
      ],
      [GameConfig.GAME.STATES.PREPARATION]: [
        GameConfig.GAME.STATES.PLAYING,
        GameConfig.GAME.STATES.MENU,
        GameConfig.GAME.STATES.PAUSED
      ],
      [GameConfig.GAME.STATES.PLAYING]: [
        GameConfig.GAME.STATES.PAUSED,
        GameConfig.GAME.STATES.PREPARATION,
        GameConfig.GAME.STATES.GAME_OVER,
        GameConfig.GAME.STATES.VICTORY,
        GameConfig.GAME.STATES.MENU
      ],
      [GameConfig.GAME.STATES.PAUSED]: [
        GameConfig.GAME.STATES.PLAYING,
        GameConfig.GAME.STATES.MENU
      ],
      [GameConfig.GAME.STATES.GAME_OVER]: [
        GameConfig.GAME.STATES.MENU,
        GameConfig.GAME.STATES.PREPARATION
      ],
      [GameConfig.GAME.STATES.VICTORY]: [
        GameConfig.GAME.STATES.MENU,
        GameConfig.GAME.STATES.PREPARATION
      ],
      [GameConfig.GAME.STATES.SHOP]: [
        GameConfig.GAME.STATES.MENU,
        GameConfig.GAME.STATES.PREPARATION
      ]
    };
  }

  /**
   * 設置狀態
   */
  setState(newState, data = {}) {
    // 檢查狀態轉換是否有效
    if (!this.isValidTransition(this.currentState, newState)) {
      console.warn(`無效的狀態轉換: ${this.currentState} -> ${newState}`);
      return false;
    }

    const oldState = this.currentState;
    this.previousState = oldState;
    this.currentState = newState;

    // 記錄狀態歷史
    this.stateHistory.push({
      from: oldState,
      to: newState,
      timestamp: Date.now(),
      data: data
    });

    // 限制歷史記錄長度
    if (this.stateHistory.length > 50) {
      this.stateHistory.shift();
    }

    console.log(`狀態轉換: ${oldState} -> ${newState}`);

    // 處理狀態退出
    this.handleStateExit(oldState);

    // 處理狀態進入
    this.handleStateEnter(newState, data);

    // 發送狀態變化事件
    this.eventEmitter.emit('stateChanged', {
      oldState,
      newState,
      data
    });

    return true;
  }

  /**
   * 檢查狀態轉換是否有效
   */
  isValidTransition(fromState, toState) {
    const allowedTransitions = this.stateTransitions[fromState];
    return allowedTransitions && allowedTransitions.includes(toState);
  }

  /**
   * 處理狀態退出
   */
  handleStateExit(state) {
    switch (state) {
      case GameConfig.GAME.STATES.PLAYING:
        this.handlePlayingStateExit();
        break;
      case GameConfig.GAME.STATES.PAUSED:
        this.handlePausedStateExit();
        break;
      case GameConfig.GAME.STATES.PREPARATION:
        this.handlePreparationStateExit();
        break;
    }

    // 發送狀態退出事件
    this.eventEmitter.emit('stateExit', state);
  }

  /**
   * 處理狀態進入
   */
  handleStateEnter(state, data) {
    switch (state) {
      case GameConfig.GAME.STATES.MENU:
        this.handleMenuStateEnter(data);
        break;
      case GameConfig.GAME.STATES.PREPARATION:
        this.handlePreparationStateEnter(data);
        break;
      case GameConfig.GAME.STATES.PLAYING:
        this.handlePlayingStateEnter(data);
        break;
      case GameConfig.GAME.STATES.PAUSED:
        this.handlePausedStateEnter(data);
        break;
      case GameConfig.GAME.STATES.GAME_OVER:
        this.handleGameOverStateEnter(data);
        break;
      case GameConfig.GAME.STATES.VICTORY:
        this.handleVictoryStateEnter(data);
        break;
      case GameConfig.GAME.STATES.SHOP:
        this.handleShopStateEnter(data);
        break;
    }

    // 儲存狀態數據
    this.stateData.set(state, data);

    // 發送狀態進入事件
    this.eventEmitter.emit('stateEnter', { state, data });
  }

  /**
   * 處理選單狀態進入
   */
  handleMenuStateEnter(data) {
    console.log('進入選單狀態');
    
    // 重置遊戲相關狀態
    this.resetGameStates();
  }

  /**
   * 處理準備狀態進入
   */
  handlePreparationStateEnter(data) {
    console.log('進入準備狀態');
    
    // 設置準備階段計時器
    this.startPreparationTimer(data.preparationTime || GameConfig.WAVE.PREPARATION_TIME);
  }

  /**
   * 處理準備狀態退出
   */
  handlePreparationStateExit() {
    // 清理準備階段計時器
    this.stopPreparationTimer();
  }

  /**
   * 處理遊戲狀態進入
   */
  handlePlayingStateEnter(data) {
    console.log('進入遊戲狀態');
    
    // 恢復遊戲計時器
    this.resumeGameTimers();
  }

  /**
   * 處理遊戲狀態退出
   */
  handlePlayingStateExit() {
    // 暫停遊戲計時器
    this.pauseGameTimers();
  }

  /**
   * 處理暫停狀態進入
   */
  handlePausedStateEnter(data) {
    console.log('進入暫停狀態');
    
    // 暫停所有計時器
    this.pauseAllTimers();
  }

  /**
   * 處理暫停狀態退出
   */
  handlePausedStateExit() {
    // 恢復所有計時器
    this.resumeAllTimers();
  }

  /**
   * 處理遊戲結束狀態進入
   */
  handleGameOverStateEnter(data) {
    console.log('進入遊戲結束狀態');
    
    // 停止所有計時器
    this.stopAllTimers();
    
    // 記錄遊戲結果
    this.recordGameResult(false, data);
  }

  /**
   * 處理勝利狀態進入
   */
  handleVictoryStateEnter(data) {
    console.log('進入勝利狀態');
    
    // 停止所有計時器
    this.stopAllTimers();
    
    // 記錄遊戲結果
    this.recordGameResult(true, data);
  }

  /**
   * 處理商店狀態進入
   */
  handleShopStateEnter(data) {
    console.log('進入商店狀態');
  }

  /**
   * 開始準備階段計時器
   */
  startPreparationTimer(duration) {
    this.preparationTimer = {
      startTime: Date.now(),
      duration: duration,
      remaining: duration
    };
    
    console.log(`準備階段計時開始: ${duration}ms`);
  }

  /**
   * 停止準備階段計時器
   */
  stopPreparationTimer() {
    if (this.preparationTimer) {
      console.log('準備階段計時停止');
      this.preparationTimer = null;
    }
  }

  /**
   * 暫停遊戲計時器
   */
  pauseGameTimers() {
    this.gameTimersPaused = true;
    this.pauseTime = Date.now();
  }

  /**
   * 恢復遊戲計時器
   */
  resumeGameTimers() {
    if (this.gameTimersPaused && this.pauseTime) {
      const pausedDuration = Date.now() - this.pauseTime;
      
      // 調整計時器
      if (this.preparationTimer) {
        this.preparationTimer.startTime += pausedDuration;
      }
      
      this.gameTimersPaused = false;
      this.pauseTime = null;
    }
  }

  /**
   * 暫停所有計時器
   */
  pauseAllTimers() {
    this.pauseGameTimers();
  }

  /**
   * 恢復所有計時器
   */
  resumeAllTimers() {
    this.resumeGameTimers();
  }

  /**
   * 停止所有計時器
   */
  stopAllTimers() {
    this.stopPreparationTimer();
    this.gameTimersPaused = false;
    this.pauseTime = null;
  }

  /**
   * 記錄遊戲結果
   */
  recordGameResult(victory, data) {
    const result = {
      victory,
      timestamp: Date.now(),
      duration: this.getGameDuration(),
      data
    };
    
    console.log('遊戲結果記錄:', result);
    
    // 可以在這裡保存到本地存儲或發送到服務器
  }

  /**
   * 重置遊戲狀態
   */
  resetGameStates() {
    this.stopAllTimers();
    this.stateData.clear();
  }

  /**
   * 獲取遊戲持續時間
   */
  getGameDuration() {
    const gameStartEntry = this.stateHistory.find(
      entry => entry.to === GameConfig.GAME.STATES.PREPARATION
    );
    
    if (gameStartEntry) {
      return Date.now() - gameStartEntry.timestamp;
    }
    
    return 0;
  }

  /**
   * 獲取當前狀態
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * 獲取前一個狀態
   */
  getPreviousState() {
    return this.previousState;
  }

  /**
   * 獲取狀態數據
   */
  getStateData(state) {
    return this.stateData.get(state || this.currentState);
  }

  /**
   * 檢查是否為特定狀態
   */
  isState(state) {
    return this.currentState === state;
  }

  /**
   * 檢查是否為遊戲中狀態
   */
  isGameActive() {
    return this.isState(GameConfig.GAME.STATES.PLAYING) || 
           this.isState(GameConfig.GAME.STATES.PREPARATION);
  }

  /**
   * 檢查是否為暫停狀態
   */
  isPaused() {
    return this.isState(GameConfig.GAME.STATES.PAUSED);
  }

  /**
   * 暫停遊戲
   */
  pauseGame() {
    if (this.isGameActive()) {
      this.setState(GameConfig.GAME.STATES.PAUSED);
    }
  }

  /**
   * 恢復遊戲
   */
  resumeGame() {
    if (this.isPaused()) {
      this.setState(this.previousState);
    }
  }

  /**
   * 獲取狀態歷史
   */
  getStateHistory() {
    return [...this.stateHistory];
  }

  /**
   * 更新計時器
   */
  update(time, delta) {
    if (this.gameTimersPaused) return;
    
    // 更新準備階段計時器
    if (this.preparationTimer) {
      const elapsed = Date.now() - this.preparationTimer.startTime;
      this.preparationTimer.remaining = Math.max(0, this.preparationTimer.duration - elapsed);
      
      // 發送計時器更新事件
      this.eventEmitter.emit('preparationTimerUpdate', {
        remaining: this.preparationTimer.remaining,
        total: this.preparationTimer.duration
      });
      
      // 檢查是否計時結束
      if (this.preparationTimer.remaining <= 0) {
        this.eventEmitter.emit('preparationTimerComplete');
        this.stopPreparationTimer();
      }
    }
  }

  /**
   * 銷毀狀態管理器
   */
  destroy() {
    this.stopAllTimers();
    this.eventEmitter.removeAllListeners();
    this.stateData.clear();
    this.stateHistory = [];
    
    console.log('狀態管理器已銷毀');
  }
}

export default StateManager;
