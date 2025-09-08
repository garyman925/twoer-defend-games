/**
 * 效能監控系統
 * 監控粒子效果和雷射系統對遊戲效能的影響
 */

export class PerformanceMonitor {
  constructor(scene) {
    this.scene = scene;
    this.isMonitoring = false;
    
    // 效能數據
    this.frameCount = 0;
    this.lastTime = 0;
    this.fps = 0;
    this.minFps = Infinity;
    this.maxFps = 0;
    this.avgFps = 0;
    
    // 粒子效果統計
    this.particleCount = 0;
    this.maxParticles = 0;
    this.laserEffectCount = 0;
    
    // 效能警告閾值
    this.fpsWarningThreshold = 30;
    this.particleWarningThreshold = 500;
    
    // 顯示元素
    this.performanceDisplay = null;
    this.showDisplay = false;
    
    console.log('🔬 效能監控系統初始化');
  }

  /**
   * 開始監控
   */
  startMonitoring() {
    this.isMonitoring = true;
    this.lastTime = Date.now();
    this.frameCount = 0;
    
    console.log('📊 開始效能監控');
  }

  /**
   * 停止監控
   */
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('⏹️ 停止效能監控');
  }

  /**
   * 更新效能數據
   */
  update() {
    if (!this.isMonitoring) return;
    
    this.frameCount++;
    const currentTime = Date.now();
    
    // 每秒更新一次FPS
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // 更新FPS統計
      if (this.fps < this.minFps) this.minFps = this.fps;
      if (this.fps > this.maxFps) this.maxFps = this.fps;
      this.avgFps = (this.avgFps + this.fps) / 2;
      
      // 檢查效能警告
      this.checkPerformanceWarnings();
      
      // 更新顯示
      if (this.showDisplay) {
        this.updateDisplay();
      }
    }
    
    // 統計粒子數量
    this.updateParticleCount();
  }

  /**
   * 統計場景中的粒子數量
   */
  updateParticleCount() {
    let totalParticles = 0;
    let laserEffects = 0;
    
    try {
      // 遍歷場景中的所有遊戲對象
      this.scene.children.list.forEach(child => {
        if (child.type === 'ParticleEmitterManager') {
          // 統計粒子發射器的粒子數量
          if (child.emitters && child.emitters.list) {
            child.emitters.list.forEach(emitter => {
              totalParticles += emitter.getAliveParticleCount();
            });
          }
        } else if (child.type === 'Graphics') {
          // 檢查是否為雷射束效果
          if (child.depth === 100) {
            laserEffects++;
          }
        }
      });
      
      this.particleCount = totalParticles;
      this.laserEffectCount = laserEffects;
      
      if (totalParticles > this.maxParticles) {
        this.maxParticles = totalParticles;
      }
      
    } catch (error) {
      console.log('⚠️ 粒子統計失敗:', error.message);
    }
  }

  /**
   * 檢查效能警告
   */
  checkPerformanceWarnings() {
    // FPS過低警告
    if (this.fps < this.fpsWarningThreshold) {
      console.log(`⚠️ 效能警告: FPS過低 (${this.fps})`);
      this.suggestOptimizations();
    }
    
    // 粒子數量過多警告
    if (this.particleCount > this.particleWarningThreshold) {
      console.log(`⚠️ 效能警告: 粒子數量過多 (${this.particleCount})`);
    }
  }

  /**
   * 建議優化措施
   */
  suggestOptimizations() {
    const suggestions = [];
    
    if (this.particleCount > 100) {
      suggestions.push('減少粒子效果數量或持續時間');
    }
    
    if (this.laserEffectCount > 5) {
      suggestions.push('限制同時存在的雷射效果數量');
    }
    
    if (suggestions.length > 0) {
      console.log('💡 優化建議:', suggestions.join(', '));
    }
  }

  /**
   * 顯示效能監控界面
   */
  showPerformanceDisplay() {
    this.showDisplay = true;
    
    if (!this.performanceDisplay) {
      this.createPerformanceDisplay();
    }
    
    this.performanceDisplay.setVisible(true);
  }

  /**
   * 隱藏效能監控界面
   */
  hidePerformanceDisplay() {
    this.showDisplay = false;
    
    if (this.performanceDisplay) {
      this.performanceDisplay.setVisible(false);
    }
  }

  /**
   * 創建效能顯示界面
   */
  createPerformanceDisplay() {
    const x = 10;
    const y = 10;
    const width = 140;
    const height = 100;
    
    // 創建容器
    this.performanceDisplay = this.scene.add.container(x, y);
    
    // 創建背景
    const background = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    background.setOrigin(0, 0);
    background.setStrokeStyle(1, 0x333333, 1);
    this.performanceDisplay.add(background);
    
    // FPS顯示
    this.fpsText = this.scene.add.text(5, 5, 'FPS: --', {
      fontSize: '11px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    });
    this.performanceDisplay.add(this.fpsText);
    
    // 粒子數量顯示
    this.particleText = this.scene.add.text(5, 22, '粒子: --', {
      fontSize: '11px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    });
    this.performanceDisplay.add(this.particleText);
    
    // 雷射效果顯示
    this.laserText = this.scene.add.text(5, 39, '雷射: --', {
      fontSize: '11px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    });
    this.performanceDisplay.add(this.laserText);
    
    // 記憶體使用（模擬）
    this.memoryText = this.scene.add.text(5, 56, '記憶體: --', {
      fontSize: '11px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    });
    this.performanceDisplay.add(this.memoryText);
    
    // 說明文字
    this.helpText = this.scene.add.text(5, 75, '按P鍵切換', {
      fontSize: '9px',
      fill: '#888888',
      fontFamily: 'Arial'
    });
    this.performanceDisplay.add(this.helpText);
    
    this.performanceDisplay.setDepth(1000); // 確保在最上層
    
    console.log('📊 效能監控界面創建完成');
  }

  /**
   * 更新效能顯示
   */
  updateDisplay() {
    if (!this.performanceDisplay || !this.showDisplay) return;
    
    // 更新FPS顯示，根據效能設置顏色
    const fpsColor = this.fps >= 60 ? '#00ff00' : 
                     this.fps >= 30 ? '#ffff00' : '#ff0000';
    this.fpsText.setText(`FPS: ${this.fps}`);
    this.fpsText.setStyle({ fill: fpsColor });
    
    // 更新粒子數量顯示
    const particleColor = this.particleCount > 200 ? '#ff0000' : '#ffffff';
    this.particleText.setText(`粒子: ${this.particleCount}`);
    this.particleText.setStyle({ fill: particleColor });
    
    // 更新雷射效果顯示
    this.laserText.setText(`雷射: ${this.laserEffectCount}`);
    
    // 模擬記憶體使用
    const memoryUsage = Math.round((this.particleCount * 0.1 + this.laserEffectCount * 2) * 100) / 100;
    this.memoryText.setText(`記憶體: ${memoryUsage}MB`);
  }

  /**
   * 獲取效能報告
   */
  getPerformanceReport() {
    return {
      fps: {
        current: this.fps,
        min: this.minFps,
        max: this.maxFps,
        average: Math.round(this.avgFps)
      },
      particles: {
        current: this.particleCount,
        max: this.maxParticles
      },
      effects: {
        laser: this.laserEffectCount
      },
      warnings: {
        lowFps: this.fps < this.fpsWarningThreshold,
        highParticles: this.particleCount > this.particleWarningThreshold
      }
    };
  }

  /**
   * 重置統計數據
   */
  reset() {
    this.frameCount = 0;
    this.minFps = Infinity;
    this.maxFps = 0;
    this.avgFps = 0;
    this.maxParticles = 0;
    this.lastTime = Date.now();
    
    console.log('🔄 效能統計數據已重置');
  }

  /**
   * 銷毀效能監控系統
   */
  destroy() {
    this.stopMonitoring();
    
    if (this.performanceDisplay) {
      this.performanceDisplay.destroy();
    }
    
    console.log('🗑️ 效能監控系統已銷毀');
  }
}
