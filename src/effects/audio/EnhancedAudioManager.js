/**
 * 增強音頻管理器
 * 管理遊戲中的所有音效和背景音樂，包含程序化音效生成
 */

export class EnhancedAudioManager {
  constructor(scene) {
    this.scene = scene;
    
    // 音量控制
    this.masterVolume = 1.0;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.8;
    
    // 音頻對象存儲
    this.sounds = new Map();
    this.music = null;
    this.currentMusicKey = null;
    
    // 靜音狀態
    this.isMuted = false;
    
    // 音效隊列（防止重複播放）
    this.soundQueue = new Map();
    this.soundCooldowns = new Map();
    
    
    // 創建音效庫
    this.createSoundLibrary();
  }

  /**
   * 創建音效庫（程序化生成音效）
   */
  createSoundLibrary() {
    
    // 雷射音效
    this.createLaserSounds();
    
    // 金錢音效
    this.createMoneySounds();
    
    // 連擊音效
    this.createComboSounds();
    
    // 敵人音效
    this.createEnemySounds();
    
    // UI音效
    this.createUISounds();
    
  }

  /**
   * 創建雷射相關音效
   */
  createLaserSounds() {
    // 雷射充能音效 - 頻率上升
    this.createToneSequence('laser_charge', [
      { frequency: 220, duration: 0.1, volume: 0.3 },
      { frequency: 330, duration: 0.1, volume: 0.4 },
      { frequency: 440, duration: 0.1, volume: 0.5 }
    ]);
    
    // 雷射發射音效 - 高頻爆發
    this.createToneSequence('laser_fire', [
      { frequency: 880, duration: 0.05, volume: 0.6 },
      { frequency: 660, duration: 0.1, volume: 0.4 },
      { frequency: 440, duration: 0.1, volume: 0.2 }
    ]);
    
    // 雷射命中音效
    this.createToneSequence('laser_hit', [
      { frequency: 1320, duration: 0.03, volume: 0.5 },
      { frequency: 990, duration: 0.05, volume: 0.3 },
      { frequency: 660, duration: 0.07, volume: 0.2 }
    ]);
  }

  /**
   * 創建金錢相關音效
   */
  createMoneySounds() {
    // 金錢獲得音效 - 愉悅的叮聲
    this.createToneSequence('money_gain', [
      { frequency: 523, duration: 0.1, volume: 0.4 },
      { frequency: 659, duration: 0.1, volume: 0.5 },
      { frequency: 784, duration: 0.15, volume: 0.4 }
    ]);
    
    // 金錢不足音效
    this.createToneSequence('money_insufficient', [
      { frequency: 220, duration: 0.2, volume: 0.3 },
      { frequency: 196, duration: 0.2, volume: 0.2 }
    ]);
  }

  /**
   * 創建連擊相關音效
   */
  createComboSounds() {
    // 連擊增加音效
    this.createToneSequence('combo_hit', [
      { frequency: 440, duration: 0.05, volume: 0.3 },
      { frequency: 550, duration: 0.05, volume: 0.4 }
    ]);
    
    // 連擊里程碑音效
    this.createToneSequence('combo_milestone', [
      { frequency: 523, duration: 0.1, volume: 0.5 },
      { frequency: 659, duration: 0.1, volume: 0.6 },
      { frequency: 784, duration: 0.1, volume: 0.7 },
      { frequency: 1047, duration: 0.2, volume: 0.8 }
    ]);
  }

  /**
   * 創建敵人相關音效
   */
  createEnemySounds() {
    // 敵人死亡音效
    this.createToneSequence('enemy_death', [
      { frequency: 330, duration: 0.1, volume: 0.4 },
      { frequency: 220, duration: 0.15, volume: 0.3 },
      { frequency: 110, duration: 0.2, volume: 0.2 }
    ]);
    
    // 敵人受傷音效
    this.createToneSequence('enemy_hit', [
      { frequency: 440, duration: 0.05, volume: 0.3 },
      { frequency: 330, duration: 0.08, volume: 0.2 }
    ]);
    
    // 敵人生成音效
    this.createToneSequence('enemy_spawn', [
      { frequency: 196, duration: 0.1, volume: 0.3 },
      { frequency: 220, duration: 0.1, volume: 0.3 }
    ]);
  }

  /**
   * 創建UI相關音效
   */
  createUISounds() {
    // 按鈕點擊音效
    this.createToneSequence('button_click', [
      { frequency: 800, duration: 0.05, volume: 0.3 }
    ]);
    
    // 按鈕懸停音效
    this.createToneSequence('button_hover', [
      { frequency: 600, duration: 0.03, volume: 0.2 }
    ]);
    
    // 建造塔音效
    this.createToneSequence('tower_build', [
      { frequency: 392, duration: 0.1, volume: 0.4 },
      { frequency: 523, duration: 0.1, volume: 0.5 },
      { frequency: 659, duration: 0.15, volume: 0.4 }
    ]);
    
    // 遊戲開始音效
    this.createToneSequence('game_start', [
      { frequency: 262, duration: 0.2, volume: 0.4 },
      { frequency: 330, duration: 0.2, volume: 0.5 },
      { frequency: 392, duration: 0.2, volume: 0.6 },
      { frequency: 523, duration: 0.3, volume: 0.7 }
    ]);
  }

  /**
   * 創建音調序列
   */
  createToneSequence(key, tones) {
    try {
      if (this.scene.sound && this.scene.sound.context) {
        // 創建音頻buffer
        const audioContext = this.scene.sound.context;
        const totalDuration = tones.reduce((sum, tone) => sum + tone.duration, 0);
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, totalDuration * sampleRate, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        let currentSample = 0;
        
        tones.forEach(tone => {
          const sampleCount = tone.duration * sampleRate;
          
          for (let i = 0; i < sampleCount; i++) {
            const time = i / sampleRate;
            const envelope = Math.max(0, 1 - (i / sampleCount)); // 漸弱包絡
            channelData[currentSample + i] = Math.sin(2 * Math.PI * tone.frequency * time) * tone.volume * envelope;
          }
          
          currentSample += sampleCount;
        });
        
        // 添加到Phaser音頻緩存
        this.scene.cache.audio.add(key, buffer);
      } else {
        // 備用：創建靜音音頻
        this.createSilentAudio(key);
      }
    } catch (error) {
      console.log(`⚠️ 音效創建失敗 ${key}:`, error.message);
      this.createSilentAudio(key);
    }
  }

  /**
   * 創建靜音音頻（備用）
   */
  createSilentAudio(key) {
    if (this.scene.sound && this.scene.sound.context) {
      const audioContext = this.scene.sound.context;
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate);
      this.scene.cache.audio.add(key, buffer);
    }
  }

  /**
   * 播放音效
   */
  playSound(key, config = {}) {
    if (this.isMuted) return;
    
    // 檢查冷卻時間
    const now = Date.now();
    const cooldown = this.soundCooldowns.get(key) || 0;
    if (now < cooldown) {
      return;
    }
    
    try {
      const volume = (config.volume || 1) * this.sfxVolume * this.masterVolume;
      
      if (this.scene.cache.audio.exists(key)) {
        const sound = this.scene.sound.add(key, { volume });
        sound.play();
        
        // 設置冷卻時間（防止重複播放）
        this.soundCooldowns.set(key, now + (config.cooldown || 50));
        
      } else {
        console.log(`⚠️ 音效不存在: ${key}`);
      }
    } catch (error) {
      console.log(`⚠️ 音效播放失敗 ${key}:`, error.message);
    }
  }

  /**
   * 播放背景音樂
   */
  playMusic(key, config = {}) {
    if (this.isMuted) return;
    
    try {
      // 停止當前音樂
      if (this.music && this.music.isPlaying) {
        this.music.stop();
      }
      
      const volume = (config.volume || 1) * this.musicVolume * this.masterVolume;
      
      if (this.scene.cache.audio.exists(key)) {
        this.music = this.scene.sound.add(key, { 
          volume, 
          loop: config.loop !== false 
        });
        this.music.play();
        this.currentMusicKey = key;
        
        console.log(`🎵 播放背景音樂: ${key}`);
      } else {
        console.log(`⚠️ 背景音樂不存在: ${key}`);
      }
    } catch (error) {
      console.log(`⚠️ 背景音樂播放失敗 ${key}:`, error.message);
    }
  }

  /**
   * 停止音樂
   */
  stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
      this.currentMusicKey = null;
      console.log('🔇 背景音樂已停止');
    }
  }

  /**
   * 暫停所有音頻
   */
  pauseAudio() {
    if (this.music && this.music.isPlaying) {
      this.music.pause();
    }
    console.log('⏸️ 音頻已暫停');
  }

  /**
   * 恢復所有音頻
   */
  resumeAudio() {
    if (this.music && this.music.isPaused) {
      this.music.resume();
    }
    console.log('▶️ 音頻已恢復');
  }

  /**
   * 切換靜音
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.pauseAudio();
    } else {
      this.resumeAudio();
    }
    
    console.log(`🔊 音頻${this.isMuted ? '靜音' : '開啟'}`);
    return this.isMuted;
  }

  /**
   * 設置主音量
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    if (this.music) {
      this.music.setVolume(this.musicVolume * this.masterVolume);
    }
    
    console.log(`🔊 主音量設置為: ${this.masterVolume}`);
  }

  /**
   * 設置音效音量
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 音效音量設置為: ${this.sfxVolume}`);
  }

  /**
   * 設置音樂音量
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.music) {
      this.music.setVolume(this.musicVolume * this.masterVolume);
    }
    
    console.log(`🎵 音樂音量設置為: ${this.musicVolume}`);
  }

  /**
   * 預加載所有音效
   */
  preloadSounds() {
    const soundKeys = [
      'laser_charge', 'laser_fire', 'laser_hit',
      'money_gain', 'money_insufficient',
      'combo_hit', 'combo_milestone',
      'enemy_death', 'enemy_hit', 'enemy_spawn',
      'button_click', 'button_hover', 'tower_build', 'game_start'
    ];
    
    console.log(`🎵 預加載 ${soundKeys.length} 個音效`);
  }

  /**
   * 銷毀音頻管理器
   */
  destroy() {
    this.stopMusic();
    this.sounds.clear();
    this.soundQueue.clear();
    this.soundCooldowns.clear();
    
    console.log('🗑️ 音頻管理器已銷毀');
  }
}
