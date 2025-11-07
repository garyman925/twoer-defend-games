/**
 * 教學系統 UI 管理器
 * 顯示遊戲教學步驟，引導新玩家了解遊戲玩法
 */
export class TutorialUI {
  constructor(scene) {
    this.scene = scene;
    this.overlay = null;
    this.currentStep = 0;
    this.totalSteps = 5;
    this.onComplete = null; // 完成教學後的回調函數
    
    // 教學內容配置
    this.steps = [
      {
        title: '歡迎來到太空攻防戰',
        icon: '🚀',
        description: '準備好保衛你的基地了嗎？讓我們快速了解遊戲的基本玩法！',
        points: [
          '你的目標是擊敗所有來襲的敵人',
          '保護你的基地不被敵人摧毀',
          '合理使用武器和防禦塔來應對敵人',
          '收集金幣來升級你的裝備'
        ]
      },
      {
        title: '玩家控制',
        icon: '🎮',
        description: '掌握基本操作，成為太空戰士！',
        points: [
          '<span class="tutorial-highlight">移動滑鼠</span> - 控制武器瞄準方向',
          '<span class="tutorial-highlight">點擊滑鼠左鍵</span> - 發射子彈攻擊敵人',
          '<span class="tutorial-highlight">按住左鍵</span> - 持續射擊（部分武器）',
          '瞄準敵人的飛行路徑提前射擊'
        ]
      },
      {
        title: '防禦塔系統',
        icon: '🏗️',
        description: '建造防禦塔是獲勝的關鍵！',
        points: [
          '點擊底部的<span class="tutorial-highlight">防禦塔卡片</span>選擇塔型',
          '在地圖上<span class="tutorial-highlight">點擊空地</span>放置防禦塔',
          '每種塔都有不同的攻擊方式和效果',
          '防禦塔會自動攻擊範圍內的敵人',
          '合理布局防禦塔以形成防線'
        ]
      },
      {
        title: '資源與升級',
        icon: '💰',
        description: '善用資源，提升你的戰鬥力！',
        points: [
          '擊敗敵人可獲得<span class="tutorial-highlight">金幣</span>',
          '使用金幣在<span class="tutorial-highlight">商店</span>購買新武器和防禦塔',
          '前往<span class="tutorial-highlight">我的戰機</span>升級生命值和速度',
          '完成<span class="tutorial-highlight">知識問答</span>賺取額外金幣',
          '每場勝利都會獲得獎勵'
        ]
      },
      {
        title: '準備開始！',
        icon: '⚔️',
        description: '你已經掌握了基本玩法，現在是時候展現你的實力了！',
        points: [
          '記住：<span class="tutorial-highlight">保護基地</span>是首要目標',
          '靈活運用武器和防禦塔的組合',
          '注意觀察敵人的移動路徑',
          '不要忘記升級你的裝備',
          '祝你好運，指揮官！🎖️'
        ]
      }
    ];
  }

  /**
   * 創建教學 UI
   * @param {Function} onComplete - 完成教學後的回調函數
   */
  create(onComplete) {
    this.onComplete = onComplete;
    this.currentStep = 0;
    
    // 創建遮罩層
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    
    // 創建教學框
    const tutorialBox = document.createElement('div');
    tutorialBox.className = 'tutorial-box';
    
    // Skip 按鈕
    const skipBtn = document.createElement('button');
    skipBtn.className = 'tutorial-skip-btn';
    skipBtn.textContent = 'Skip';
    skipBtn.addEventListener('click', () => this.skip());
    
    // 標題區
    const header = document.createElement('div');
    header.className = 'tutorial-header';
    header.innerHTML = `
      <h2 class="tutorial-title" id="tutorial-title"></h2>
      <div class="tutorial-step-indicator" id="tutorial-step-indicator"></div>
    `;
    
    // 內容區
    const content = document.createElement('div');
    content.className = 'tutorial-content';
    content.id = 'tutorial-content';
    
    // 生成所有步驟的 HTML
    this.steps.forEach((step, index) => {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'tutorial-step';
      stepDiv.id = `tutorial-step-${index}`;
      if (index === 0) stepDiv.classList.add('active');
      
      stepDiv.innerHTML = `
        <div class="tutorial-icon">${step.icon}</div>
        <div class="tutorial-description">${step.description}</div>
        <ul class="tutorial-points">
          ${step.points.map(point => `<li>${point}</li>`).join('')}
        </ul>
        <div class="tutorial-progress">
          ${Array.from({ length: this.totalSteps }, (_, i) => `
            <div class="tutorial-progress-dot ${i === index ? 'active' : ''} ${i < index ? 'completed' : ''}"></div>
          `).join('')}
        </div>
      `;
      
      content.appendChild(stepDiv);
    });
    
    // 底部按鈕區
    const footer = document.createElement('div');
    footer.className = 'tutorial-footer';
    footer.innerHTML = `
      <button class="tutorial-btn-prev" id="tutorial-btn-prev">
        ◀ 上一步
      </button>
      <button class="tutorial-btn-next" id="tutorial-btn-next">
        下一步 ▶
      </button>
    `;
    
    // 組裝
    tutorialBox.appendChild(skipBtn);
    tutorialBox.appendChild(header);
    tutorialBox.appendChild(content);
    tutorialBox.appendChild(footer);
    this.overlay.appendChild(tutorialBox);
    
    // 添加到頁面
    document.getElementById('game-container').appendChild(this.overlay);
    
    // 綁定按鈕事件
    document.getElementById('tutorial-btn-prev').addEventListener('click', () => this.prevStep());
    document.getElementById('tutorial-btn-next').addEventListener('click', () => this.nextStep());
    
    // 更新 UI
    this.updateUI();
    
    // 顯示教學
    this.show();
  }

  /**
   * 更新 UI 顯示
   */
  updateUI() {
    const step = this.steps[this.currentStep];
    
    // 更新標題和步驟指示器
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-step-indicator').textContent = `步驟 ${this.currentStep + 1} / ${this.totalSteps}`;
    
    // 更新步驟內容顯示
    document.querySelectorAll('.tutorial-step').forEach((stepEl, index) => {
      if (index === this.currentStep) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    });
    
    // 更新上一步按鈕狀態
    const prevBtn = document.getElementById('tutorial-btn-prev');
    if (this.currentStep === 0) {
      prevBtn.disabled = true;
    } else {
      prevBtn.disabled = false;
    }
    
    // 更新下一步按鈕文字和樣式
    const nextBtn = document.getElementById('tutorial-btn-next');
    if (this.currentStep === this.totalSteps - 1) {
      nextBtn.textContent = '🎮 開始遊戲';
      nextBtn.classList.add('start-game');
    } else {
      nextBtn.textContent = '下一步 ▶';
      nextBtn.classList.remove('start-game');
    }
  }

  /**
   * 下一步
   */
  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.updateUI();
    } else {
      // 最後一步，開始遊戲
      this.complete();
    }
  }

  /**
   * 上一步
   */
  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateUI();
    }
  }

  /**
   * 跳過教學
   */
  skip() {
    this.complete();
  }

  /**
   * 完成教學
   */
  complete() {
    this.hide();
    
    // 延遲執行回調，等待動畫完成
    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
      this.destroy();
    }, 300);
  }

  /**
   * 顯示教學
   */
  show() {
    if (this.overlay) {
      this.overlay.classList.add('active');
    }
  }

  /**
   * 隱藏教學
   */
  hide() {
    if (this.overlay) {
      this.overlay.classList.add('closing');
      
      setTimeout(() => {
        this.overlay.classList.remove('active', 'closing');
      }, 300);
    }
  }

  /**
   * 清理教學 UI
   */
  destroy() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    this.currentStep = 0;
    this.onComplete = null;
  }
}

