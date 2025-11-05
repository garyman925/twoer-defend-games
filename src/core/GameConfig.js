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
  GAME_HEIGHT: 768, // 改為 4:3 比例 (1024:768 = 4:3)
  DEBUG: true,
  
  // 遊戲狀態定義
  GAME: {
    STATES: {
      LOADING: 'LOADING',
      MENU: 'MENU',
      PREPARATION: 'PREPARATION',
      PLAYING: 'PLAYING',
      PAUSED: 'PAUSED',
      GAME_OVER: 'GAME_OVER',
      VICTORY: 'VICTORY',
      SHOP: 'SHOP'
    },
    TIME_LIMIT: 10 // 🐛 DEBUG: 改為 10 秒方便測試（正常應為 180 秒）
  },
  
  // 響應式設計設置
  RESPONSIVE: {
    ENABLED: true,
    MIN_WIDTH: 1024,
    MIN_HEIGHT: 768, // 4:3 比例的最小高度
    MAX_WIDTH: 10000,  // 放寬上限避免被卡住
    MAX_HEIGHT: 10000,
    SCALE_MODE: 'RESIZE', // 視窗改變時重算畫布
    AUTO_CENTER: true
  },
  
  // 地圖設定 (匹配 Tiled 地圖)
  MAP: {
    WIDTH: 1280,  // 40 tiles × 32px = 1280px
    HEIGHT: 832,  // 26 tiles × 32px = 832px
    GRID_SIZE: 32, // 匹配 Tiled 地圖的圖塊大小
    TILE_WIDTH: 32,
    TILE_HEIGHT: 32,
    MAP_WIDTH_TILES: 40,  // Tiled 地圖寬度 (tiles)
    MAP_HEIGHT_TILES: 26, // Tiled 地圖高度 (tiles)
    SAFE_AREA: {
      WIDTH: 1024,
      HEIGHT: 512,       // 調整為適應新地圖高度
      TOP_MARGIN: 96,    // 上方黑邊
      BOTTOM_MARGIN: 130 // 下方預留給塔選擇UI
    }
  },

  // 玩家設置
  PLAYER: {
    HEALTH: {
      MAX: 5,  // 改為 5 格血量
      REGENERATION: 0 // 關閉自動回血（限時模式）
    },
    WEAPON: {
      DAMAGE: 30,
      FIRE_RATE: 500, // 每500毫秒射擊一次
      RANGE: 150,
      ROTATION_SPEED: 5
    },
    POSITION: {
      X: 512, // 螢幕中間 (1024 / 2)
      Y: 384  // 螢幕中間 (768 / 2)
    },
    BASE_GRID_POSITION: {
      COL: 16, // 中間位置
      ROW: 12  // 中間位置
    }
  },

  // 敵人設置
  ENEMY: {
    SPAWN_RATE: 2000, // 每2秒生成一個敵人
    BASE_HEALTH: 50,
    BASE_SPEED: 50,
    BASE_DAMAGE: 15, // 敵人攻擊力
    HEALTH_MULTIPLIER: 1.2, // 每波血量增加20%
    SPEED_MULTIPLIER: 1.1, // 每波速度增加10%
    DAMAGE_MULTIPLIER: 1.1, // 每波攻擊力增加10%
    
    // 敵人類型
    TYPES: {
      BASIC: {
        health: 50,
        speed: 60,
        reward: 10,
        damage: 15
      },
      FAST: {
        health: 30,
        speed: 100,
        reward: 15,
        damage: 12
      },
      TANK: {
        health: 120,
        speed: 30,
        reward: 25,
        damage: 25
      },
      FLYING: {
        health: 40,
        speed: 80,
        reward: 20,
        damage: 18
      },
      BOSS: {
        health: 300,
        speed: 40,
        reward: 100,
        damage: 50
      },
      RANGED: {
        health: 40,
        speed: 50,
        reward: 20,
        damage: 20,
        attackType: 'ranged' // 遠程攻擊
      },
      MELEE: {
        health: 60,
        speed: 70,
        reward: 15,
        damage: 25,
        attackType: 'melee' // 近戰攻擊
      },
      METEOR: {
        health: 80,
        speed: 20, // 緩慢漂浮
        reward: 0, // 不給獎勵
        damage: 30,
        maxCount: 2, // 最多2個
        behavior: 'passive', // 被動行為
        attackType: 'collision' // 碰撞傷害
      }
    }
  },

  // 塔設置
  TOWER: {
    BUILD_COST: 50,
    UPGRADE_COST_MULTIPLIER: 1.5,
    PLACEMENT_GRID_SIZE: 32, // 匹配 Tiled 地圖的圖塊大小
    BASE_HEALTH: 100, // 炮塔基礎血量
    HEALTH_PER_LEVEL: 50, // 每級增加的血量
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
    PREPARATION_TIME: 10000, // 10秒準備時間
    WAVE_INTERVAL: 3000, // 波次間隔
    ENEMY_COUNT_MULTIPLIER: 1.2, // 每波敵人數量增長
    DIFFICULTY_MULTIPLIER: 1.1, // 每波難度增長
    MAX_WAVES: 50,
    
    // 波次配置（效能測試：每波20個敵人）
    PATTERNS: [
      { enemyType: 'BASIC', count: 20, interval: 500 }, // 第1波：20個基礎敵人
      { enemyType: 'RANGED', count: 20, interval: 500 }, // 第2波：20個遠程敵人
      { enemyType: 'BASIC', count: 20, interval: 500 },
      { enemyType: 'BASIC', count: 20, interval: 500 },
      { enemyType: 'FAST', count: 20, interval: 400 },
      { enemyType: 'BASIC', count: 20, interval: 500 },
      { enemyType: 'BASIC', count: 20, interval: 500 },
      { enemyType: 'TANK', count: 20, interval: 600 },
      { enemyType: 'RANGED', count: 20, interval: 500 },
      { enemyType: 'FAST', count: 20, interval: 400 },
      { enemyType: 'BASIC', count: 20, interval: 500 },
      { enemyType: 'BASIC', count: 20, interval: 500 },
      { enemyType: 'RANGED', count: 20, interval: 500 },
      { enemyType: 'FLYING', count: 20, interval: 500 },
      { enemyType: 'TANK', count: 20, interval: 600 },
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
    SHADOWS: true,
    QUALITY: {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    }
  },

  // 性能設置
  PERFORMANCE: {
    MAX_PARTICLES: 1000,
    MAX_PROJECTILES: 200,
    MAX_ENEMIES: 50,
    PHYSICS_STEPS: 60,
    TARGET_FPS: 60,
    AUTO_ADJUST: true,
    OBJECT_POOL_SIZE: 100,
    CULL_DISTANCE: 200,
    QUALITY_THRESHOLDS: {
      HIGH_END: 55,
      MID_RANGE: 45
    }
  }
};

export default GameConfig;