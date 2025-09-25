  /**
   * 玩家死亡
   */
  die() {
    if (!this.isAlive) return;
    
    this.isAlive = false;
    console.log('玩家死亡');
    
    // 停止射擊
    if (this.weapon) {
      this.weapon.stopShooting();
    }
    
    // 播放死亡動畫（動畫完成後會發送事件）
    this.playDeathAnimation();
    
    // 播放死亡音效
    this.scene.playSound && this.scene.playSound('player_death');
    
    // 不立即發送事件，讓動畫完成後發送
    // this.eventEmitter.emit('playerDied');
    // this.scene.events.emit('playerDied');
  }
