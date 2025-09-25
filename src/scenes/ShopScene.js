/**
 * 商店場景 (佔位版本)
 */

import { BaseScene } from '../core/BaseScene.js';

export class ShopScene extends BaseScene {
  constructor() {
    super('ShopScene');
  }

  create() {
    super.create();
    
    const { width, height } = this.scale.gameSize;
    
    this.add.text(width/2, height/2, '升級商店\n(開發中)', {
      fontSize: '32px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // 返回主選單按鈕
    const backButton = this.add.text(50, 50, '← 返回主選單', {
      fontSize: '20px',
      fill: '#00ffff'
    });
    
    backButton.setInteractive();
    backButton.on('pointerdown', () => {
      this.switchToScene('MainMenuScene');
    });
  }
}

export default ShopScene;
