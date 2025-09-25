    // 基本屬性
    this.health = GameConfig.PLAYER.HEALTH.MAX;
    this.maxHealth = GameConfig.PLAYER.HEALTH.MAX;
    this.isAlive = true;
    this.money = GameConfig.RESOURCES.STARTING_MONEY; // 初始金錢
    
    // 玩家等級
    this.level = 1; // 默認等級1
    
    // 武器相關
    this.weapon = null;
    this.isImmune = false;
    this.immunityDuration = 1000; // 受傷後1秒無敵時間
