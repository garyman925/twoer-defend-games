  /**
   * 創建玩家爆炸動畫
   */
  createPlayerExplosionAnimations() {
    // 創建5個等級的爆炸動畫
    for (let level = 1; level <= 5; level++) {
      this.anims.create({
        key: `blue_explosion_lv${level}`,
        frames: this.anims.generateFrameNames('player-explosion', {
          prefix: `blue_explosion_lv${level}_`,
          start: 0,
          end: 8,
          zeroPad: 2
        }),
        frameRate: 20,
        repeat: 0
      });
    }
    
    console.log('✅ 玩家爆炸動畫創建完成');
  }
