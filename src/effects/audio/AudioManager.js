/**
 * 音頻管理器
 * 處理遊戲中的所有音效和音樂
 */

export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    
    // 音量設置
    this.volumes = {
      master: 1.0,
      music: 0.7,
      sfx: 0.8,
      voice: 0.9
    };
    
    // 音頻實例管理
    this.musicInstances = new Map();
    this.sfxInstances = new Map();
    this.voiceInstances = new Map();
    
    // 當前播放狀態
    this.currentMusic = null;
    this.activeSounds = new Set();
    
    // 音頻配置
    this.audioConfig = null;
    
    // 初始化狀態
    this.isInitialized = false;
    this.isMuted = false;
    
    // 事件發送器
    this.eventEmitter = new Phaser.Events.EventEmitter();
    
    // 初始化音頻系統
    this.init();
  }

  /**
   * 初始化音頻管理器
   */
  init() {
    console.log('音頻管理器初始化');
    
    // 加載音頻配置
    this.loadAudioConfig();
    
    // 設置音頻事件監聽器
    this.setupAudioEvents();
    
    // 初始化完成
    this.isInitialized = true;
  }

  /**
   * 加載音頻配置
   */
  loadAudioConfig() {
    // 從緩存中獲取音頻配置
    if (this.scene.cache.json.exists('audioConfig')) {
      this.audioConfig = this.scene.cache.json.get('audioConfig');
      console.log('音頻配置加載完成');
    } else {
      console.warn('音頻配置文件未找到，使用默認配置');
      this.audioConfig = this.getDefaultAudioConfig();
    }
  }

  /**
   * 獲取默認音頻配置
   */
  getDefaultAudioConfig() {
    return {
      music: {
        menu_theme: { volume: 0.6, loop: true },
        battle_theme: { volume: 0.7, loop: true },
        victory_theme: { volume: 0.8, loop: false }
      },
      sfx: {
        button_click: { volume: 0.5 },
        button_hover: { volume: 0.3 },
        player_shoot: { volume: 0.6 },
        enemy_hit: { volume: 0.7 },
        tower_place: { volume: 0.5 }
      },
      voice: {
        narrator: { volume: 0.9 }
      }
    };
  }

  /**
   * 設置音頻事件監聽器
   */
  setupAudioEvents() {
    // 監聽場景變化
    this.scene.events.on('shutdown', this.cleanup, this);
    this.scene.events.on('destroy', this.destroy, this);
    
    // 監聽遊戲暫停/恢復
    this.scene.game.events.on('pause', this.onGamePause, this);
    this.scene.game.events.on('resume', this.onGameResume, this);
  }

  /**
   * 播放音效
   */
  playSound(soundKey, config = {}) {
    if (!this.isInitialized) return null;
    
    // 檢查音效文件是否存在
    if (!this.scene.cache.audio.exists(soundKey)) {
      console.warn(`音效文件不存在: ${soundKey}`);
      // 創建靜音音頻避免錯誤
      this.createSilentAudio(soundKey);
      return null;
    }
    
    // 獲取音效配置
    const soundConfig = {
      volume: this.volumes.sfx * this.volumes.master,
      ...this.getAudioConfig('sfx', soundKey),
      ...config
    };
    
    // 播放音效
    const sound = this.scene.sound.add(soundKey, soundConfig);
    
    // 記錄活躍音效
    this.activeSounds.add(sound);
    
    // 播放完成後清理
    sound.once('complete', () => {
      this.activeSounds.delete(sound);
      sound.destroy();
    });
    
    sound.play();
    
    console.log(`播放音效: ${soundKey}`);
    
    return sound;
  }

  /**
   * 創建靜音音頻
   */
  createSilentAudio(soundKey) {
    if (!this.scene.cache.audio.exists(soundKey)) {
      // 創建一個非常短的靜音緩衝區
      const audioContext = this.scene.sound.context;
      if (audioContext) {
        const buffer = audioContext.createBuffer(1, 1, 22050);
        this.scene.cache.audio.add(soundKey, buffer);
        console.log(`為缺失音頻創建靜音替代: ${soundKey}`);
      }
    }
  }

  /**
   * 播放3D位置音效
   */
  play3DSound(soundKey, x, y, config = {}) {
    const sound = this.playSound(soundKey, config);
    
    if (sound && this.scene.cameras.main) {
      // 計算聲音的3D位置效果
      const camera = this.scene.cameras.main;
      const centerX = camera.scrollX + camera.width / 2;
      const centerY = camera.scrollY + camera.height / 2;
      
      const distance = Phaser.Math.Distance.Between(centerX, centerY, x, y);
      const maxDistance = Math.max(camera.width, camera.height);
      const volume = Math.max(0, 1 - (distance / maxDistance));
      
      sound.setVolume(volume * this.volumes.sfx * this.volumes.master);
      
      // 簡單的左右聲道平衡
      const pan = Phaser.Math.Clamp((x - centerX) / (camera.width / 2), -1, 1);
      sound.setPan(pan);
    }
    
    return sound;
  }

  /**
   * 播放音樂
   */
  playMusic(musicKey, fadeIn = true) {
    if (!this.isInitialized) return null;
    
    // 檢查音樂文件是否存在
    if (!this.scene.cache.audio.exists(musicKey)) {
      console.warn(`音樂文件不存在: ${musicKey}`);
      return null;
    }
    
    // 如果已經在播放相同音樂，則不做任何操作
    if (this.currentMusic && this.currentMusic.key === musicKey && this.currentMusic.isPlaying) {
      return this.currentMusic;
    }
    
    // 淡出當前音樂
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.fadeOutMusic(this.currentMusic);
    }
    
    // 獲取新音樂實例
    let newMusic = this.musicInstances.get(musicKey);
    if (!newMusic) {
      newMusic = this.scene.sound.add(musicKey, {
        loop: true,
        volume: 0
      });
      this.musicInstances.set(musicKey, newMusic);
    }
    
    // 設置為當前音樂
    this.currentMusic = newMusic;
    
    // 開始播放
    newMusic.play();
    
    // 淡入效果
    if (fadeIn) {
      this.fadeInMusic(newMusic);
    } else {
      newMusic.setVolume(this.volumes.music * this.volumes.master);
    }
    
    console.log(`播放音樂: ${musicKey}`);
    
    // 發送事件
    this.eventEmitter.emit('musicChanged', { musicKey, fadeIn });
    
    return newMusic;
  }

  /**
   * 音樂淡入效果
   */
  fadeInMusic(music) {
    const targetVolume = this.volumes.music * this.volumes.master;
    
    this.scene.tweens.add({
      targets: music,
      volume: targetVolume,
      duration: 2000,
      ease: 'Linear'
    });
  }

  /**
   * 音樂淡出效果
   */
  fadeOutMusic(music) {
    this.scene.tweens.add({
      targets: music,
      volume: 0,
      duration: 1500,
      ease: 'Linear',
      onComplete: () => {
        if (music.isPlaying) {
          music.stop();
        }
      }
    });
  }

  /**
   * 停止音樂
   */
  stopMusic(fadeOut = true) {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      if (fadeOut) {
        this.fadeOutMusic(this.currentMusic);
      } else {
        this.currentMusic.stop();
      }
      
      console.log('音樂已停止');
    }
  }

  /**
   * 暫停音樂
   */
  pauseMusic() {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.pause();
      console.log('音樂已暫停');
    }
  }

  /**
   * 恢復音樂播放
   */
  resumeMusic() {
    if (this.currentMusic && this.currentMusic.isPaused) {
      this.currentMusic.resume();
      console.log('音樂恢復播放');
    }
  }

  /**
   * 暫停所有音頻
   */
  pauseAudio() {
    // 暫停音樂
    this.pauseMusic();
    
    // 暫停所有音效
    if (this.scene && this.scene.sound && this.scene.sound.pauseAll) {
      this.scene.sound.pauseAll();
    }
    
    console.log('所有音頻已暫停');
  }

  /**
   * 恢復所有音頻
   */
  resumeAudio() {
    // 恢復音樂
    this.resumeMusic();
    
    // 恢復所有音效
    if (this.scene && this.scene.sound && this.scene.sound.resumeAll) {
      this.scene.sound.resumeAll();
    }
    
    console.log('所有音頻已恢復');
  }

  /**
   * 設置主音量
   */
  setMasterVolume(volume) {
    this.volumes.master = Phaser.Math.Clamp(volume, 0, 1);
    this.updateAllVolumes();
    
    console.log(`主音量設置為: ${this.volumes.master}`);
  }

  /**
   * 設置音樂音量
   */
  setMusicVolume(volume) {
    this.volumes.music = Phaser.Math.Clamp(volume, 0, 1);
    
    if (this.currentMusic) {
      this.currentMusic.setVolume(this.volumes.music * this.volumes.master);
    }
    
    console.log(`音樂音量設置為: ${this.volumes.music}`);
  }

  /**
   * 設置音效音量
   */
  setSfxVolume(volume) {
    this.volumes.sfx = Phaser.Math.Clamp(volume, 0, 1);
    console.log(`音效音量設置為: ${this.volumes.sfx}`);
  }

  /**
   * 設置語音音量
   */
  setVoiceVolume(volume) {
    this.volumes.voice = Phaser.Math.Clamp(volume, 0, 1);
    console.log(`語音音量設置為: ${this.volumes.voice}`);
  }

  /**
   * 更新所有音量
   */
  updateAllVolumes() {
    // 更新音樂音量
    if (this.currentMusic) {
      this.currentMusic.setVolume(this.volumes.music * this.volumes.master);
    }
    
    // 更新活躍音效音量
    this.activeSounds.forEach(sound => {
      const baseVolume = sound.config?.volume || this.volumes.sfx;
      sound.setVolume(baseVolume * this.volumes.master);
    });
  }

  /**
   * 靜音/取消靜音
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.scene.sound.setMute(true);
    } else {
      this.scene.sound.setMute(false);
    }
    
    console.log(`音頻${this.isMuted ? '已靜音' : '已取消靜音'}`);
    
    return this.isMuted;
  }

  /**
   * 獲取音頻配置
   */
  getAudioConfig(type, key) {
    if (this.audioConfig && this.audioConfig[type] && this.audioConfig[type][key]) {
      return this.audioConfig[type][key];
    }
    return {};
  }

  /**
   * 獲取音量狀態
   */
  getVolumeStatus() {
    return {
      master: this.volumes.master,
      music: this.volumes.music,
      sfx: this.volumes.sfx,
      voice: this.volumes.voice,
      isMuted: this.isMuted
    };
  }

  /**
   * 遊戲暫停時的處理
   */
  onGamePause() {
    this.pauseAudio();
  }

  /**
   * 遊戲恢復時的處理
   */
  onGameResume() {
    this.resumeAudio();
  }

  /**
   * 停止所有音效
   */
  stopAllSounds() {
    this.activeSounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
    this.activeSounds.clear();
    
    console.log('所有音效已停止');
  }

  /**
   * 預加載音頻
   */
  preloadAudio(audioList) {
    audioList.forEach(audioKey => {
      if (this.scene.cache.audio.exists(audioKey)) {
        // 預創建音頻實例
        const audio = this.scene.sound.add(audioKey);
        // 可以添加到對應的實例池中
      }
    });
  }

  /**
   * 清理資源
   */
  cleanup() {
    console.log('清理音頻管理器');
    
    // 停止所有音效
    this.stopAllSounds();
    
    // 停止音樂
    this.stopMusic(false);
    
    // 清理音頻實例
    this.musicInstances.forEach(music => {
      if (music && !music.pendingRemoval) {
        music.destroy();
      }
    });
    this.musicInstances.clear();
    
    this.sfxInstances.forEach(sfx => {
      if (sfx && !sfx.pendingRemoval) {
        sfx.destroy();
      }
    });
    this.sfxInstances.clear();
  }

  /**
   * 銷毀音頻管理器
   */
  destroy() {
    this.cleanup();
    
    // 移除事件監聽器
    this.scene.events.off('shutdown', this.cleanup, this);
    this.scene.events.off('destroy', this.destroy, this);
    this.scene.game.events.off('pause', this.onGamePause, this);
    this.scene.game.events.off('resume', this.onGameResume, this);
    
    // 清理事件發送器
    this.eventEmitter.removeAllListeners();
    
    this.isInitialized = false;
    
    console.log('音頻管理器已銷毀');
  }
}

export default AudioManager;