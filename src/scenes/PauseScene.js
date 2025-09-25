/**
 * 暫停場景 (佔位版本)
 */

import { BaseScene } from '../core/BaseScene.js';

export class PauseScene extends BaseScene {
  constructor() {
    super('PauseScene');
  }

  create() {
    super.create();
    
    const { width, height } = this.scale.gameSize;
    
    this.add.text(width/2, height/2, '暫停\n(開發中)', {
      fontSize: '32px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
  }
}

export default PauseScene;
