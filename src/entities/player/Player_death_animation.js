  /**
   * 播放死亡動畫
   */
  playDeathAnimation() {
    // 根據玩家等級選擇爆炸動畫
    const explosionKey = `blue_explosion_lv${this.level || 1}`;
    
    // 創建爆炸精靈
    const explosion = this.scene.add.sprite(this.x, this.y, 'player-explosion');
    explosion.setDepth(1000); // 確保在最上層
    
    // 按玩家縮放比例縮小爆炸動畫
    const playerScale = this.playerSprite ? this.playerSprite.scaleX : 0.1;
    explosion.setScale(playerScale);
    
    // 播放對應等級的爆炸動畫
    explosion.play(explosionKey);
    
    // 動畫結束後銷毀
    explosion.on('animationcomplete', () => {
      explosion.destroy();
    });
    
    // 玩家淡出
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 1000,
      ease: 'Power2'
    });
    
    // 螢幕震動
    this.scene.cameras.main.shake(1000, 0.02);
    
    // 等待3秒後觸發遊戲結束
    this.scene.time.delayedCall(3000, () => {
      this.scene.events.emit('playerDied');
    });
  }
