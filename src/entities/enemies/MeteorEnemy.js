/**
 * Meteor敵人類
 * 被動漂浮的隕石，玩家碰撞會受到傷害
 */

import { BaseEnemy } from './BaseEnemy.js';

export class MeteorEnemy extends BaseEnemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'METEOR');
    
    // Meteor特殊屬性
    this.isPassive = true; // 被動行為
    this.rotationSpeed = Phaser.Math.Between(0.5, 2); // 隨機旋轉速度
    this.floatDirection = Phaser.Math.Between(0, 360); // 隨機漂浮方向
    this.floatSpeed = Phaser.Math.Between(15, 20); // 隨機漂浮速度
 
  }
  
  /**
   * 創建視覺效果
   */
  createEnemyVisuals() {
    // 隨機選擇meteor外觀
    const meteorFrames = [
      'Meteor_1', 'Meteor_2', 'Meteor_3', 'Meteor_4', 'Meteor_5', 
      'Meteor_6', 'Meteor_7', 'Meteor_8', 'Meteor_9', 'Meteor_10'
    ];
    const randomFrame = Phaser.Utils.Array.GetRandom(meteorFrames);
    
    this.sprite = this.scene.add.sprite(0, 0, 'enemy_meteor', randomFrame);
    this.sprite.setScale(0.2); // 縮小到30%
    this.sprite.setOrigin(0.5, 0.5);
    this.add(this.sprite);
    

  }
  
  /**
   * 更新邏輯
   */
  update(time, delta) {
    super.update(time, delta);
    
    // Meteor緩慢旋轉
    this.sprite.rotation += this.rotationSpeed * delta * 0.001;
    
    // Meteor緩慢漂浮
    this.x += Math.cos(this.floatDirection * Math.PI / 180) * this.floatSpeed * delta * 0.001;
    this.y += Math.sin(this.floatDirection * Math.PI / 180) * this.floatSpeed * delta * 0.001;
    
    // 邊界檢查 - 環繞屏幕
    this.checkBounds();
  }
  
  /**
   * 邊界檢查 - 環繞屏幕
   */
  checkBounds() {
    const { width, height } = this.scene.scale.gameSize;
    
    if (this.x < -50) this.x = width + 50;
    if (this.x > width + 50) this.x = -50;
    if (this.y < -50) this.y = height + 50;
    if (this.y > height + 50) this.y = -50;
  }
  
  /**
   * 重寫攻擊邏輯 - Meteor不主動攻擊
   */
  attack() {
    // Meteor不主動攻擊，只通過碰撞造成傷害
    return;
  }
  
  /**
   * 碰撞檢測
   */
  onCollision(other) {
    if (other === this.scene.player) {
      // 對玩家造成傷害
      this.scene.player.takeDamage(this.damage);
      console.log('🌠 Meteor碰撞玩家，造成傷害:', this.damage);
    }
  }
}
