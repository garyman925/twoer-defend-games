/**
 * 屏幕震動效果系統
 * 為遊戲添加震動反饋，增強視覺衝擊感
 */

export class ScreenShake {
  constructor(scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.isShaking = false;
    this.shakeQueue = [];
    
    console.log('📳 屏幕震動系統初始化');
  }

  /**
   * 添加震動效果
   * @param {number} intensity - 震動強度 (1-10)
   * @param {number} duration - 持續時間(毫秒)
   * @param {string} type - 震動類型: 'impact', 'explosion', 'laser'
   */
  shake(intensity = 3, duration = 150, type = 'impact') {
    // 如果當前正在震動，加入隊列
    if (this.isShaking) {
      this.shakeQueue.push({ intensity, duration, type });
      return;
    }
    
    this.startShake(intensity, duration, type);
  }

  /**
   * 開始震動
   */
  startShake(intensity, duration, type) {
    this.isShaking = true;
    
    // 根據類型調整震動參數
    const shakeConfig = this.getShakeConfig(intensity, duration, type);
    
    console.log(`📳 屏幕震動: ${type}, 強度: ${intensity}, 持續: ${duration}ms`);
    
    // 使用Phaser的攝像機震動
    this.camera.shake(shakeConfig.duration, shakeConfig.intensity, true, (camera, progress) => {
      // 震動完成回調
      if (progress === 1) {
        this.onShakeComplete();
      }
    });
  }

  /**
   * 根據類型獲取震動配置
   */
  getShakeConfig(intensity, duration, type) {
    const baseIntensity = intensity * 0.003; // 基礎強度係數
    
    switch (type) {
      case 'laser':
        return {
          intensity: baseIntensity * 0.8, // 雷射震動較輕
          duration: duration * 0.8
        };
      
      case 'explosion':
        return {
          intensity: baseIntensity * 1.5, // 爆炸震動較強
          duration: duration * 1.2
        };
      
      case 'impact':
        return {
          intensity: baseIntensity * 1.0, // 標準衝擊
          duration: duration
        };
      
      case 'combo':
        return {
          intensity: baseIntensity * 0.6, // 連擊震動較短促
          duration: duration * 0.6
        };
      
      default:
        return {
          intensity: baseIntensity,
          duration: duration
        };
    }
  }

  /**
   * 震動完成處理
   */
  onShakeComplete() {
    this.isShaking = false;
    
    // 處理隊列中的下一個震動
    if (this.shakeQueue.length > 0) {
      const nextShake = this.shakeQueue.shift();
      this.startShake(nextShake.intensity, nextShake.duration, nextShake.type);
    }
  }

  /**
   * 雷射擊中震動
   */
  laserHit(intensity = 4) {
    this.shake(intensity, 120, 'laser');
  }

  /**
   * 爆炸震動
   */
  explosion(intensity = 6) {
    this.shake(intensity, 200, 'explosion');
  }

  /**
   * 衝擊震動
   */
  impact(intensity = 3) {
    this.shake(intensity, 100, 'impact');
  }

  /**
   * 連擊震動
   */
  combo(intensity = 2) {
    this.shake(intensity, 80, 'combo');
  }

  /**
   * 敵人死亡震動
   */
  enemyDeath(enemyType = 'basic') {
    const intensityMap = {
      'basic': 2,
      'fast': 1,
      'tank': 5,
      'flying': 3,
      'boss': 8
    };
    
    const intensity = intensityMap[enemyType] || 2;
    this.shake(intensity, 150, 'impact');
  }

  /**
   * 自定義震動模式
   */
  customShake(pattern) {
    if (!Array.isArray(pattern)) return;
    
    pattern.forEach((shake, index) => {
      this.scene.time.delayedCall(shake.delay || index * 100, () => {
        this.shake(shake.intensity, shake.duration, shake.type);
      });
    });
  }

  /**
   * 震動強度測試
   */
  testShake() {
    console.log('🧪 測試不同強度的震動效果');
    
    const testPattern = [
      { intensity: 1, duration: 100, type: 'impact', delay: 0 },
      { intensity: 3, duration: 150, type: 'laser', delay: 300 },
      { intensity: 5, duration: 200, type: 'explosion', delay: 600 },
      { intensity: 8, duration: 250, type: 'impact', delay: 1000 }
    ];
    
    this.customShake(testPattern);
  }

  /**
   * 停止所有震動
   */
  stopAll() {
    this.camera.stopShake();
    this.isShaking = false;
    this.shakeQueue = [];
    console.log('⏹️ 停止所有震動效果');
  }

  /**
   * 銷毀震動系統
   */
  destroy() {
    this.stopAll();
    console.log('🗑️ 屏幕震動系統已銷毀');
  }
}
