/**
 * 遊戲配置文件
 * 包含所有遊戲的全局配置和常數
 */

export const GameConfig = {
  // 版本信息
  VERSION: '1.0.0',
  BUILD_DATE: new Date().toISOString().split('T')[0],
  
  // 基本遊戲設置
  GAME_WIDTH: 1024,
  GAME_HEIGHT: 768,
  DEBUG: true,
  
  // 地圖設定
  MAP: {
    WIDTH: 1920,
    HEIGHT: 1080,
    GRID_SIZE: 64,
    SAFE_AREA: {
      WIDTH: 1024,
      HEIGHT: 576,
      TOP_MARGIN: 96,    // 上方黑邊
      BOTTOM_MARGIN: 96  // 下方黑邊
    }
  },

  // 玩家設置
  PLAYER: {
    HEALTH: {
      MAX: 100,
      REGENERATION: 1 // 每秒恢復1點
    },
    WEAPON: {
      DAMAGE: 30,
      FIRE_RATE: 500, // 每500毫秒射擊一次
      RANGE: 150,
      ROTATION_SPEED: 5
    },
            POSITION: {
          X: 64 * 28, // 第29列 × 64像素 = 1792
          Y: 64 * 13  // 第14行 × 64像素 = 832
        },
    BASE_GRID_POSITION: {
      COL: 33, // 第34列 (從0開始是33)
      ROW: 12  // 第13行 (從0開始是12)
    }
  },

  // 敵人設置
  ENEMY: {
    SPAWN_RATE: 2000, // 每2秒生成一個敵人
    BASE_HEALTH: 50,
    BASE_SPEED: 50,
    HEALTH_MULTIPLIER: 1.2, // 每波血量增加20%
    SPEED_MULTIPLIER: 1.1, // 每波速度增加10%
    
    // 敵人類型
    TYPES: {
      BASIC: {
        health: 50,
        speed: 60,
        reward: 10,
        damage: 10
      },
      FAST: {
        health: 30,
        speed: 100,
        reward: 15,
        damage: 8
      },
      TANK: {
        health: 120,
        speed: 30,
        reward: 25,
        damage: 20
      },
      FLYING: {
        health: 40,
        speed: 80,
        reward: 20,
        damage: 12
      },
      BOSS: {
        health: 300,
        speed: 40,
        reward: 100,
        damage: 50
      }
    }
  },

  // 塔設置
  TOWER: {
    BUILD_COST: 50,
    UPGRADE_COST_MULTIPLIER: 1.5,
    PLACEMENT_GRID_SIZE: 64,
    TYPES: {
      basic: {
        damage: [30, 45, 65, 90, 120],
        range: [250, 280, 310, 340, 370],  // 大幅增加射程
        fireRate: [1000, 900, 800, 700, 600],
        buildCost: 50,
        upgradeCosts: [30, 50, 80, 120]
      },
      cannon: {
        damage: [80, 120, 170, 230, 300],
        range: [200, 220, 240, 260, 280],  // 短射程但高傷害
        fireRate: [2000, 1800, 1600, 1400, 1200],
        buildCost: 100,
        upgradeCosts: [60, 100, 160, 240]
      },
      laser: {
        damage: [25, 35, 50, 70, 95],
        range: [300, 330, 360, 390, 420],  // 最遠射程，快速射擊
        fireRate: [500, 450, 400, 350, 300],
        buildCost: 80,
        upgradeCosts: [50, 80, 130, 200]
      },
      ice: {
        damage: [20, 30, 45, 65, 90],
        range: [220, 240, 260, 280, 300],  // 中等射程，減速效果
        fireRate: [800, 750, 700, 650, 600],
        buildCost: 70,
        upgradeCosts: [40, 70, 110, 170]
      },
      poison: {
        damage: [15, 25, 40, 60, 85],
        range: [200, 220, 240, 260, 280],  // 中等射程，持續傷害
        fireRate: [1200, 1100, 1000, 900, 800],
        buildCost: 90,
        upgradeCosts: [50, 90, 140, 220]
      }
    }
  },

  // 波次設置
  WAVE: {
    PREPARATION_TIME: 15000, // 15秒準備時間
    WAVE_INTERVAL: 3000, // 波次間隔
    ENEMY_COUNT_MULTIPLIER: 1.2, // 每波敵人數量增長
    DIFFICULTY_MULTIPLIER: 1.1, // 每波難度增長
    MAX_WAVES: 50,
    
    // 波次配置
    PATTERNS: [
      { enemyType: 'BASIC', count: 5, interval: 1000 },
      { enemyType: 'BASIC', count: 8, interval: 800 },
      { enemyType: 'FAST', count: 6, interval: 600 },
      { enemyType: 'BASIC', count: 10, interval: 700 },
      { enemyType: 'TANK', count: 3, interval: 2000 },
      { enemyType: 'FAST', count: 12, interval: 500 },
      { enemyType: 'BASIC', count: 15, interval: 600 },
      { enemyType: 'FLYING', count: 8, interval: 800 },
      { enemyType: 'TANK', count: 5, interval: 1500 },
      { enemyType: 'BOSS', count: 1, interval: 3000 }
    ]
  },

  // 資源設置
  RESOURCES: {
    STARTING_MONEY: 500,
    KILL_REWARD_MULTIPLIER: 1.0,
    WAVE_COMPLETION_BONUS: 50
  },

  // UI設置
  UI: {
    COLORS: {
      PRIMARY: '#00ffff',
      SECONDARY: '#ffd93d',
      SUCCESS: '#00ff00',
      WARNING: '#ffff00',
      DANGER: '#ff4757',
      BACKGROUND: '#000000'
    },
    FONTS: {
      PRIMARY: 'Arial',
      SIZE_SMALL: '12px',
      SIZE_MEDIUM: '16px',
      SIZE_LARGE: '24px',
      SIZE_XLARGE: '32px'
    }
  },

  // 音效設置
  AUDIO: {
    MASTER_VOLUME: 1.0,
    MUSIC_VOLUME: 0.7,
    SFX_VOLUME: 0.8,
    VOICE_VOLUME: 0.9
  },

  // 效果設置
  EFFECTS: {
    PARTICLE_DENSITY: 1.0,
    SCREEN_SHAKE: true,
    BLOOM: true,
    SHADOWS: true
  },

  // 性能設置
  PERFORMANCE: {
    MAX_PARTICLES: 1000,
    MAX_PROJECTILES: 200,
    MAX_ENEMIES: 50,
    PHYSICS_STEPS: 60
  }
};

export default GameConfig;