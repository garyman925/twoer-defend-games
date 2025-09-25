  /**
   * 玩家死亡處理
   */
  onPlayerDied() {
    console.log('玩家死亡，遊戲結束');
    
    // 延遲3秒後才轉到結束畫面，讓爆炸動畫完整播放
    this.time.delayedCall(3000, () => {
      this.switchToScene('GameOverScene', {
        score: this.currentWave * 1000,
        level: this.currentWave,
        enemiesKilled: 0,
        timePlayed: Math.floor(this.time.now / 1000),
        isVictory: false
      });
    });
  }
