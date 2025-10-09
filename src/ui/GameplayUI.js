/**
 * 遊戲 UI 管理器
 * 使用 DOM 元素建立遊戲界面
 */
export class GameplayUI {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.statusBar = null;
    this.gameStatus = null;
    
    // UI 元素引用
    this.healthDisplay = null;
    this.moneyDisplay = null;
    this.waveDisplay = null;
    this.scoreDisplay = null;
  }

  /**
   * 建立遊戲 UI
   */
  create() {
    // 添加遊戲場景背景類
    document.body.classList.add('gameplay-scene');
    
    // 建立主容器
    this.container = document.createElement('div');
    this.container.id = 'gameplay-ui';
    
    // 建立狀態欄
    this.createStatusBar();
    
    // 建立遊戲狀態顯示
    this.createGameStatus();
    
    // 監聽遊戲事件
    this.setupEventListeners();
    
    // 將 UI 添加到頁面
    const uiOverlay = document.getElementById('ui-overlay');
    if (uiOverlay) {
      uiOverlay.appendChild(this.container);
    } else {
      document.body.appendChild(this.container);
    }
    
    console.log('✅ GameplayUI 創建完成');
  }

  /**
   * 建立狀態欄
   */
  createStatusBar() {
    this.statusBar = document.createElement('div');
    this.statusBar.className = 'status-bar';
    
    // 生命值顯示 - 分段式設計
    this.healthDisplay = document.createElement('div');
    this.healthDisplay.className = 'health-display';
    this.healthDisplay.innerHTML = `
      <span class="health-icon"></span>
      <div class="health-info">
        <div class="health-title">Healthy Power</div>
        <div class="health-segments" data-health="100">
          ${Array.from({length: 10}, (_, i) => 
            `<div class="health-segment" data-segment="${i}"></div>`
          ).join('')}
        </div>
      </div>
    `;
    
    // 金錢顯示
    this.moneyDisplay = document.createElement('div');
    this.moneyDisplay.className = 'money-display';
    this.moneyDisplay.innerHTML = `
      <span class="icon">💰</span>
      <span class="value" data-money="500">500</span>
    `;
    
    // 波次顯示
    this.waveDisplay = document.createElement('div');
    this.waveDisplay.className = 'wave-display';
    this.waveDisplay.innerHTML = `
      <span class="icon">🌊</span>
      <span class="value" data-wave="0">波次 0</span>
    `;
    
    // 分數顯示
    this.scoreDisplay = document.createElement('div');
    this.scoreDisplay.className = 'score-display';
    this.scoreDisplay.innerHTML = `
      <span class="icon">⭐</span>
      <span class="value" data-score="0">0</span>
    `;
    
    this.statusBar.appendChild(this.healthDisplay);
    this.statusBar.appendChild(this.moneyDisplay);
    this.statusBar.appendChild(this.waveDisplay);
    this.statusBar.appendChild(this.scoreDisplay);
    
    this.container.appendChild(this.statusBar);
  }

  /**
   * 建立遊戲狀態顯示
   */
  createGameStatus() {
    this.gameStatus = document.createElement('div');
    this.gameStatus.className = 'game-status';
    this.gameStatus.innerHTML = `
      <div class="status-message"></div>
      <div class="preparation-timer"></div>
    `;
    this.container.appendChild(this.gameStatus);
  }

  /**
   * 設置事件監聽器
   */
  setupEventListeners() {
    // 生命值更新
    this.scene.events.on('health:update', (data) => {
      this.updateHealth(data.health);
    });
    
    // 金錢更新
    this.scene.events.on('money:update', (data) => {
      this.updateMoney(data.money);
    });
    
    // 波次更新
    this.scene.events.on('wave:update', (data) => {
      this.updateWave(data.wave, data.enemies || 0);
    });
    
    // 分數更新
    this.scene.events.on('score:update', (data) => {
      this.updateScore(data.score);
    });
  }

  /**
   * 更新生命值顯示 - 分段式
   */
  updateHealth(health) {
    const segmentsContainer = this.healthDisplay.querySelector('.health-segments');
    const segments = this.healthDisplay.querySelectorAll('.health-segment');
    
    if (segmentsContainer && segments.length === 10) {
      // 計算滿血片段數量 (每10點血量 = 1片段)
      const filledSegments = Math.ceil(health / 10);
      
      segments.forEach((segment, index) => {
        if (index < filledSegments) {
          segment.classList.remove('empty');
        } else {
          segment.classList.add('empty');
        }
      });
      
      segmentsContainer.setAttribute('data-health', health);
      
      // 低血量警告
      if (health < 30) {
        this.healthDisplay.classList.add('low-health');
      } else {
        this.healthDisplay.classList.remove('low-health');
      }
      
      console.log(`❤️ 血量更新: ${health}/100 (${filledSegments}/10 片段)`);
    }
  }

  /**
   * 更新金錢顯示
   */
  updateMoney(money) {
    const valueEl = this.moneyDisplay.querySelector('.value');
    if (valueEl) {
      valueEl.textContent = money;
      valueEl.setAttribute('data-money', money);
      
      // 添加動畫效果
      valueEl.classList.add('value-change');
      setTimeout(() => valueEl.classList.remove('value-change'), 300);
    }
  }

  /**
   * 更新波次顯示
   */
  updateWave(wave, enemies) {
    const valueEl = this.waveDisplay.querySelector('.value');
    if (valueEl) {
      valueEl.textContent = `波次 ${wave}`;
      valueEl.setAttribute('data-wave', wave);
      
      // 添加動畫效果
      valueEl.classList.add('value-change');
      setTimeout(() => valueEl.classList.remove('value-change'), 300);
    }
  }

  /**
   * 更新分數顯示
   */
  updateScore(score) {
    const valueEl = this.scoreDisplay.querySelector('.value');
    if (valueEl) {
      valueEl.textContent = score;
      valueEl.setAttribute('data-score', score);
      
      // 添加動畫效果
      valueEl.classList.add('value-change');
      setTimeout(() => valueEl.classList.remove('value-change'), 300);
    }
  }

  /**
   * 顯示遊戲狀態訊息
   */
  showGameStatus(message, duration = 2000) {
    const statusMessage = this.gameStatus.querySelector('.status-message');
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.classList.add('show');
      
      setTimeout(() => {
        statusMessage.classList.remove('show');
        setTimeout(() => {
          statusMessage.textContent = '';
        }, 300);
      }, duration);
    }
  }

  /**
   * 更新準備計時器
   */
  updatePreparationTimer(time) {
    const timerEl = this.gameStatus.querySelector('.preparation-timer');
    if (timerEl) {
      timerEl.textContent = `準備時間: ${time}秒`;
      timerEl.classList.add('show');
    }
  }

  /**
   * 隱藏準備計時器
   */
  hidePreparationTimer() {
    const timerEl = this.gameStatus.querySelector('.preparation-timer');
    if (timerEl) {
      timerEl.classList.remove('show');
      timerEl.textContent = '';
    }
  }

  /**
   * 清理 UI
   */
  destroy() {
    // 移除遊戲場景背景類
    document.body.classList.remove('gameplay-scene');
    
    // 移除事件監聽
    if (this.scene && this.scene.events) {
      this.scene.events.off('health:update');
      this.scene.events.off('money:update');
      this.scene.events.off('wave:update');
      this.scene.events.off('score:update');
    }
    
    // 移除 DOM 元素
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    console.log('✅ GameplayUI 已清理');
  }
}
