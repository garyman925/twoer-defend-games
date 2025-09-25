  /**
   * 載入場景特定資源
   */
  loadSceneAssets() {
    console.log('🔄 開始載入 GameplayScene 資源...');
    
    // 載入太空背景圖片
    this.load.image('space-bg', 'assets/maps/space-bg.png');
    
    // 載入玩家飛船圖片
    this.load.image('player-ship', 'assets/sprites/ships/blue/Ship_LVL_1.png');
    
    // 載入玩家爆炸動畫
    this.load.atlas('player-explosion', 'assets/sprites/ships/blue/explosion.webp', 'assets/sprites/ships/blue/explosion.json');
    
    // 載入 Tiled 地圖
    this.load.tilemapTiledJSON('map1', 'assets/maps/map1.tmj');
    
    // 載入圖塊集圖片
    this.load.image('ground', 'assets/tilesets/map/world-1.png');
    this.load.image('tileset-1', 'assets/tilesets/tileset-1.png');
    
    // 載入塔精靈圖集
    this.load.atlas('tower-sprites', 'assets/sprites/towers/tower-sprite.png', 'assets/sprites/towers/tower-sprite.json');
    
    // 載入敵人精靈圖集
    this.load.atlas('enemy-sprites', 'assets/sprites/enemies/enemy-sprite.png', 'assets/sprites/enemies/enemy-sprite.json');
    
    console.log('✅ GameplayScene 資源載入完成');
  }
