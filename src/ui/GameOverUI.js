/**
 * 遊戲結束 UI
 * 使用 DOM 製作的遊戲結束畫面
 */

export class GameOverUI {
  constructor(scene, gameData) {
    this.scene = scene;
    this.gameData = gameData || {
      score: 0,
      level: 0,
      enemiesKilled: 0,
      timePlayed: 0,
      isVictory: false,
      reason: 'unknown'
    };
    
    this.container = null;
  }

  /**
   * 創建遊戲結束 UI
   */
  create() {
    // 創建主容器
    this.container = document.createElement('div');
    this.container.id = 'game-over-container';
    this.container.className = this.gameData.isVictory ? 'victory' : 'defeat';
    
    // 創建背景覆蓋層
    this.createBackground();
    
    // 創建內容區域
    this.createContent();
    
    // 添加到 DOM
    document.body.appendChild(this.container);
    
    // 淡入動畫
    setTimeout(() => {
      this.container.classList.add('show');
    }, 100);
  }

  /**
   * 創建背景
   */
  createBackground() {
    const background = document.createElement('div');
    background.className = 'game-over-background';
    this.container.appendChild(background);
  }

  /**
   * 創建內容區域
   */
  createContent() {
    const content = document.createElement('div');
    content.className = 'game-over-content';
    
    // 標題
    this.createTitle(content);
    
    // 統計資料
    this.createStatistics(content);
    
    // 按鈕
    this.createButtons(content);
    
    this.container.appendChild(content);
  }

  /**
   * 創建標題
   */
  createTitle(parent) {
    const titleContainer = document.createElement('div');
    titleContainer.className = 'game-over-title';
    
    const title = document.createElement('h1');
    title.className = 'title-text';
    
    if (this.gameData.isVictory) {
      title.innerHTML = `
        <span class="text">勝利！</span>
      `;
    } else {
      title.innerHTML = `
        <span class="text">遊戲結束</span>
      `;
    }
    
    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle-text';
    subtitle.textContent = this.getSubtitle();
    
    titleContainer.appendChild(title);
    titleContainer.appendChild(subtitle);
    parent.appendChild(titleContainer);
  }

  /**
   * 獲取副標題
   */
  getSubtitle() {
    if (this.gameData.isVictory) {
      return '成功撐過 3 分鐘！';
    } else {
      if (this.gameData.reason === 'playerDied') {
        return '生命值耗盡';
      } else {
        return '挑戰失敗';
      }
    }
  }

  /**
   * 創建統計資料
   */
  createStatistics(parent) {
    const statsContainer = document.createElement('div');
    statsContainer.className = 'game-over-stats';
    
    // 分數
    this.createStatItem(statsContainer, '最終分數', this.gameData.score, 'score');
    
    // 波次
    this.createStatItem(statsContainer, '完成波次', this.gameData.level, 'wave');
    
    // 擊破數
    this.createStatItem(statsContainer, '擊破敵人', this.gameData.enemiesKilled, 'enemies');
    
    // 遊戲時間
    const minutes = Math.floor(this.gameData.timePlayed / 60);
    const seconds = Math.floor(this.gameData.timePlayed % 60); // 取整，避免小數位
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    this.createStatItem(statsContainer, '遊戲時間', timeString, 'time');
    
    parent.appendChild(statsContainer);
  }

  /**
   * 創建單個統計項目
   */
  createStatItem(parent, label, value, type) {
    const item = document.createElement('div');
    item.className = `stat-item stat-${type}`;
    
    const labelEl = document.createElement('div');
    labelEl.className = 'stat-label';
    labelEl.textContent = label;
    
    const valueEl = document.createElement('div');
    valueEl.className = 'stat-value';
    valueEl.textContent = value;
    
    item.appendChild(labelEl);
    item.appendChild(valueEl);
    parent.appendChild(item);
  }

  /**
   * 創建按鈕
   */
  createButtons(parent) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'game-over-buttons';
    
    // 重新開始按鈕
    const restartBtn = this.createButton('重新開始', 'restart', () => {
      this.onRestartGame();
    });
    
    // 返回主選單按鈕
    const menuBtn = this.createButton('返回主選單', 'menu', () => {
      this.onReturnToMenu();
    });
    
    buttonsContainer.appendChild(restartBtn);
    buttonsContainer.appendChild(menuBtn);
    parent.appendChild(buttonsContainer);
  }

  /**
   * 創建單個按鈕
   */
  createButton(text, type, onClick) {
    const button = document.createElement('button');
    button.className = `game-over-btn btn-${type}`;
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  /**
   * 重新開始遊戲
   */
  onRestartGame() {
    console.log('重新開始遊戲');
    this.destroy();
    this.scene.scene.start('GameplayScene', {
      level: 1,
      difficulty: 'normal'
    });
  }

  /**
   * 返回主選單
   */
  onReturnToMenu() {
    console.log('返回主選單');
    this.destroy();
    this.scene.scene.start('MainMenuScene');
  }

  /**
   * 銷毀 UI
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.classList.remove('show');
      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
      }, 300);
    }
  }
}

