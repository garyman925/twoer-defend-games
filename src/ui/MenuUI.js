/**
 * 主選單 UI 管理器
 * 使用 DOM 元素建立選單界面
 */
export class MenuUI {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.background = null;
    this.menuButtons = [];
    this.dialogs = new Map();
  }

  /**
   * 建立選單 UI
   */
  create() {
    // 建立背景
    this.createBackground();
    
    // 建立主選單容器
    this.container = document.createElement('div');
    this.container.id = 'menu-overlay';
    
    // 建立按鈕容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'menu-button-container';
    
    // 定義按鈕配置
    const buttons = [
      { 
        text: '開始遊戲',
        action: () => this.scene.startGame(),
        class: 'primary'
      },
      { 
        text: '我的戰機',
        action: () => this.scene.openMyShip(),
        class: 'secondary'
      },
      { 
        text: '商店',
        action: () => this.scene.openShop(),
        class: 'secondary'
      },
      { 
        text: '排行榜',
        action: () => this.scene.openLeaderboard(),
        class: ''
      },
      { 
        text: '說明',
        action: () => this.showInstructions(),
        class: ''
      }
    ];
    
    // 建立按鈕
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = `menu-button ${btn.class}`;
      button.textContent = btn.text;
      button.addEventListener('click', () => {
        btn.action();
      });
      
      buttonContainer.appendChild(button);
      this.menuButtons.push(button);
    });
    
    this.container.appendChild(buttonContainer);
    
    // 添加版本資訊
    const version = this.scene.game.config.gameVersion || '1.0.0';
    const versionInfo = document.createElement('div');
    versionInfo.className = 'version-info';
    versionInfo.textContent = `v${version}`;
    this.container.appendChild(versionInfo);
    
    // 將選單添加到遊戲容器
    document.getElementById('game-container').appendChild(this.container);
  }

  /**
   * 建立背景
   */
  createBackground() {
    // 背景圖片容器
    const background = document.createElement('div');
    background.className = 'menu-background';
    
    // 簡單的暗色遮罩
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    background.appendChild(overlay);
    
    document.getElementById('game-container').appendChild(background);
    this.background = background;
  }

  /**
   * 顯示說明對話框
   */
  showInstructions() {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog-container">
        <h2 class="dialog-title">遊戲說明</h2>
        <div class="dialog-content">
          • 使用滑鼠控制玩家武器方向<br>
          • 點擊射擊或按住滑鼠持續射擊<br>
          • 建造不同類型的塔來防禦敵人<br>
          • 升級塔來增強威力和射程<br>
          • 收集金幣來購買更多塔和升級<br>
          • 保護你的基地，不要讓敵人到達！
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button">關閉</button>
        </div>
      </div>
    `;
    
    // 綁定關閉按鈕事件
    dialog.querySelector('.dialog-button').addEventListener('click', () => {
      dialog.remove();
    });
    
    document.getElementById('game-container').appendChild(dialog);
    this.dialogs.set('instructions', dialog);
  }

  /**
   * 清理所有 UI 元素
   */
  destroy() {
    // 移除所有對話框
    this.dialogs.forEach(dialog => dialog.remove());
    this.dialogs.clear();
    
    // 移除背景
    if (this.background) {
      this.background.remove();
      this.background = null;
    }
    
    // 移除主選單
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    
    this.menuButtons = [];
  }
}