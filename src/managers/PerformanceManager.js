/**
 * 性能管理器
 * 負責監控和優化遊戲性能
 */

import { GameConfig } from '../core/GameConfig.js';

export class PerformanceManager {
  constructor(game) {
    this.game = game;
    this.performanceData = this.initializePerformanceData();
    this.optimizationSettings = this.initializeOptimizationSettings();
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 性能監控間隔
    this.monitoringInterval = 1000; // 每秒檢查一次
    this.lastMonitorTime = 0;
    
    console.log('性能管理器初始化');
    
    // 開始性能監控
    this.startMonitoring();
  }

  /**
   * 初始化性能數據
   */
  initializePerformanceData() {
    return {
      // FPS 數據
      fps: {
        current: 60,
        average: 60,
        min: 60,
        max: 60,
        history: [],
        target: GameConfig.PERFORMANCE.TARGET_FPS
      },
      
      // 記憶體使用
      memory: {
        used: 0,
        total: 0,
        textures: 0,
        audio: 0,
        scripts: 0
      },
      
      // 渲染統計
      rendering: {
        drawCalls: 0,
        triangles: 0,
        sprites: 0,
        particles: 0
      },
      
      // 遊戲對象統計
      gameObjects: {
        total: 0,
        active: 0,
        visible: 0,
        pooled: 0
      },
      
      // 設備信息
      device: {
        platform: this.detectPlatform(),
        renderer: 'unknown',
        capabilities: this.detectCapabilities()
      },
      
      // 性能等級
      performanceLevel: 'unknown' // high, medium, low
    };
  }

  /**
   * 初始化優化設置
   */
  initializeOptimizationSettings() {
    return {
      // 自動優化開關
      autoOptimization: GameConfig.PERFORMANCE.AUTO_ADJUST,
      
      // 效果品質等級
      effectsQuality: GameConfig.EFFECTS.QUALITY.HIGH,
      
      // 對象池設置
      objectPooling: {
        enabled: true,
        maxPoolSize: GameConfig.PERFORMANCE.OBJECT_POOL_SIZE
      },
      
      // 剔除設置
      culling: {
        enabled: true,
        distance: GameConfig.PERFORMANCE.CULL_DISTANCE
      },
      
      // 粒子系統設置
      particles: {
        maxParticles: GameConfig.PERFORMANCE.MAX_PARTICLES,
        quality: 'high'
      },
      
      // 音頻設置
      audio: {
        maxSimultaneousSounds: 16,
        spatialAudio: true,
        compression: true
      }
    };
  }

  /**
   * 檢測平台
   */
  detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * 檢測設備能力
   */
  detectCapabilities() {
    const capabilities = {
      webgl: !!this.game.renderer.gl,
      webgl2: false,
      maxTextureSize: 2048,
      maxTextures: 16
    };
    
    if (this.game.renderer.gl) {
      const gl = this.game.renderer.gl;
      capabilities.webgl2 = gl instanceof WebGL2RenderingContext;
      capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      capabilities.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    }
    
    return capabilities;
  }

  /**
   * 開始性能監控
   */
  startMonitoring() {
    console.log('開始性能監控');
    
    // 檢測初始性能等級
    this.detectPerformanceLevel();
    
    // 應用初始優化設置
    this.applyOptimizations();
  }

  /**
   * 更新性能監控
   */
  update(time, delta) {
    // 每秒更新一次
    if (time - this.lastMonitorTime < this.monitoringInterval) {
      return;
    }
    
    this.lastMonitorTime = time;
    
    // 更新 FPS 數據
    this.updateFPSData();
    
    // 更新記憶體數據
    this.updateMemoryData();
    
    // 更新渲染統計
    this.updateRenderingData();
    
    // 更新遊戲對象統計
    this.updateGameObjectData();
    
    // 檢查性能並自動優化
    if (this.optimizationSettings.autoOptimization) {
      this.checkAndOptimize();
    }
    
    // 發送性能更新事件
    this.eventEmitter.emit('performanceUpdate', this.performanceData);
  }

  /**
   * 更新 FPS 數據
   */
  updateFPSData() {
    const fps = Math.round(this.game.loop.actualFps);
    
    this.performanceData.fps.current = fps;
    this.performanceData.fps.history.push(fps);
    
    // 限制歷史記錄長度
    if (this.performanceData.fps.history.length > 60) {
      this.performanceData.fps.history.shift();
    }
    
    // 計算平均值
    const history = this.performanceData.fps.history;
    this.performanceData.fps.average = Math.round(
      history.reduce((sum, value) => sum + value, 0) / history.length
    );
    
    // 更新最小值和最大值
    this.performanceData.fps.min = Math.min(this.performanceData.fps.min, fps);
    this.performanceData.fps.max = Math.max(this.performanceData.fps.max, fps);
  }

  /**
   * 更新記憶體數據
   */
  updateMemoryData() {
    if (performance.memory) {
      this.performanceData.memory.used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      this.performanceData.memory.total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
    }
    
    // 估算紋理記憶體使用
    this.performanceData.memory.textures = this.estimateTextureMemory();
    
    // 估算音頻記憶體使用
    this.performanceData.memory.audio = this.estimateAudioMemory();
  }

  /**
   * 更新渲染統計
   */
  updateRenderingData() {
    if (this.game.renderer.gl && this.game.renderer.gl.getExtension) {
      // WebGL 渲染統計
      const ext = this.game.renderer.gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        // 獲取渲染器信息
        this.performanceData.device.renderer = this.game.renderer.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      }
    }
    
    // 統計活躍的精靈數量
    this.performanceData.rendering.sprites = this.countActiveSprites();
  }

  /**
   * 更新遊戲對象統計
   */
  updateGameObjectData() {
    const activeScene = this.game.scene.getScenes(true)[0];
    if (activeScene) {
      const children = activeScene.children;
      this.performanceData.gameObjects.total = children.length;
      this.performanceData.gameObjects.active = children.list.filter(obj => obj.active).length;
      this.performanceData.gameObjects.visible = children.list.filter(obj => obj.visible).length;
    }
  }

  /**
   * 估算紋理記憶體使用
   */
  estimateTextureMemory() {
    let totalMemory = 0;
    
    // 遍歷紋理緩存
    const textures = this.game.textures.list;
    for (const key in textures) {
      const texture = textures[key];
      if (texture.source && texture.source[0]) {
        const source = texture.source[0];
        // 估算：寬度 × 高度 × 4 字節 (RGBA)
        totalMemory += source.width * source.height * 4;
      }
    }
    
    return Math.round(totalMemory / 1024 / 1024); // 轉換為 MB
  }

  /**
   * 估算音頻記憶體使用
   */
  estimateAudioMemory() {
    // 簡單估算，實際應該根據音頻文件大小計算
    const audioCache = this.game.cache.audio;
    return Object.keys(audioCache.entries.entries).length * 0.5; // 每個音頻文件估算 0.5MB
  }

  /**
   * 統計活躍精靈數量
   */
  countActiveSprites() {
    let count = 0;
    const activeScene = this.game.scene.getScenes(true)[0];
    
    if (activeScene) {
      activeScene.children.list.forEach(obj => {
        if (obj.type === 'Sprite' || obj.type === 'Image') {
          count++;
        }
      });
    }
    
    return count;
  }

  /**
   * 檢測性能等級
   */
  detectPerformanceLevel() {
    const fps = this.performanceData.fps.average;
    const platform = this.performanceData.device.platform;
    
    let level = 'medium';
    
    if (platform === 'mobile') {
      if (fps >= 50) {
        level = 'medium';
      } else {
        level = 'low';
      }
    } else {
      if (fps >= GameConfig.PERFORMANCE.QUALITY_THRESHOLDS.HIGH_END) {
        level = 'high';
      } else if (fps >= GameConfig.PERFORMANCE.QUALITY_THRESHOLDS.MID_RANGE) {
        level = 'medium';
      } else {
        level = 'low';
      }
    }
    
    if (this.performanceData.performanceLevel !== level) {
      this.performanceData.performanceLevel = level;
      console.log(`性能等級檢測: ${level}`);
      
      // 發送性能等級變化事件
      this.eventEmitter.emit('performanceLevelChanged', level);
    }
  }

  /**
   * 檢查並優化性能
   */
  checkAndOptimize() {
    const fps = this.performanceData.fps.current;
    const targetFps = this.performanceData.fps.target;
    
    // 如果 FPS 持續低於目標值，進行優化
    if (fps < targetFps * 0.8) {
      this.optimizeForLowPerformance();
    } else if (fps > targetFps * 0.95) {
      this.optimizeForHighPerformance();
    }
  }

  /**
   * 低性能優化
   */
  optimizeForLowPerformance() {
    console.log('應用低性能優化設置');
    
    // 降低效果品質
    if (this.optimizationSettings.effectsQuality > GameConfig.EFFECTS.QUALITY.LOW) {
      this.optimizationSettings.effectsQuality = GameConfig.EFFECTS.QUALITY.LOW;
      this.applyEffectsQuality();
    }
    
    // 減少粒子數量
    if (this.optimizationSettings.particles.maxParticles > 50) {
      this.optimizationSettings.particles.maxParticles = 50;
      this.applyParticleSettings();
    }
    
    // 啟用更積極的剔除
    this.optimizationSettings.culling.distance = 50;
    
    // 發送優化事件
    this.eventEmitter.emit('performanceOptimized', 'low');
  }

  /**
   * 高性能優化
   */
  optimizeForHighPerformance() {
    // 如果性能良好，可以提升效果品質
    if (this.optimizationSettings.effectsQuality < GameConfig.EFFECTS.QUALITY.HIGH) {
      this.optimizationSettings.effectsQuality = GameConfig.EFFECTS.QUALITY.MEDIUM;
      this.applyEffectsQuality();
    }
  }

  /**
   * 應用優化設置
   */
  applyOptimizations() {
    this.applyEffectsQuality();
    this.applyParticleSettings();
    this.applyAudioSettings();
  }

  /**
   * 應用效果品質設置
   */
  applyEffectsQuality() {
    const quality = this.optimizationSettings.effectsQuality;
    
    // 通知所有場景更新效果品質
    this.game.scene.scenes.forEach(scene => {
      if (scene.events) {
        scene.events.emit('effectsQualityChanged', quality);
      }
    });
  }

  /**
   * 應用粒子設置
   */
  applyParticleSettings() {
    const settings = this.optimizationSettings.particles;
    
    // 通知粒子管理器更新設置
    this.eventEmitter.emit('particleSettingsChanged', settings);
  }

  /**
   * 應用音頻設置
   */
  applyAudioSettings() {
    const settings = this.optimizationSettings.audio;
    
    // 根據平台調整音頻設置
    if (this.performanceData.device.platform === 'mobile') {
      settings.maxSimultaneousSounds = Math.min(settings.maxSimultaneousSounds, 8);
      settings.spatialAudio = false;
    }
    
    // 通知音頻管理器更新設置
    this.eventEmitter.emit('audioSettingsChanged', settings);
  }

  /**
   * 獲取性能數據
   */
  getPerformanceData() {
    return this.performanceData;
  }

  /**
   * 獲取優化設置
   */
  getOptimizationSettings() {
    return this.optimizationSettings;
  }

  /**
   * 設置優化參數
   */
  setOptimizationSetting(category, key, value) {
    if (this.optimizationSettings[category] && this.optimizationSettings[category][key] !== undefined) {
      this.optimizationSettings[category][key] = value;
      
      // 應用相應的優化
      switch (category) {
        case 'effectsQuality':
          this.applyEffectsQuality();
          break;
        case 'particles':
          this.applyParticleSettings();
          break;
        case 'audio':
          this.applyAudioSettings();
          break;
      }
      
      console.log(`優化設置更新: ${category}.${key} = ${value}`);
      return true;
    }
    
    return false;
  }

  /**
   * 強制性能檢測
   */
  forcePerformanceCheck() {
    this.detectPerformanceLevel();
    this.checkAndOptimize();
  }

  /**
   * 重置性能統計
   */
  resetPerformanceStats() {
    this.performanceData.fps.history = [];
    this.performanceData.fps.min = 60;
    this.performanceData.fps.max = 60;
    
    console.log('性能統計已重置');
  }

  /**
   * 獲取性能報告
   */
  getPerformanceReport() {
    return {
      timestamp: Date.now(),
      performanceLevel: this.performanceData.performanceLevel,
      fps: {
        current: this.performanceData.fps.current,
        average: this.performanceData.fps.average,
        min: this.performanceData.fps.min,
        max: this.performanceData.fps.max
      },
      memory: { ...this.performanceData.memory },
      device: { ...this.performanceData.device },
      optimizations: { ...this.optimizationSettings }
    };
  }

  /**
   * 銷毀性能管理器
   */
  destroy() {
    this.eventEmitter.removeAllListeners();
    
    console.log('性能管理器已銷毀');
  }
}

export default PerformanceManager;
