/**
 * 塔升級UI（右下角面板）
 */

import GameConfig from '../core/GameConfig.js';

export class TowerUpgradeUI {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.titleText = null;
    this.statsText = null;
    this.costText = null;
    this.btnUpgrade = null;
    this.btnRemove = null;
    this.btnClose = null;
    this.currentTower = null;
    this.visible = false;

    this.createPanel();
    this.layoutToBottomRight();

    // 監聽視窗尺寸變更
    this.scene.scale.on('resize', () => this.layoutToBottomRight());
  }

  createPanel() {
    const panelWidth = 280;
    const panelHeight = 200;

    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(3000);
    this.container.setScrollFactor && this.container.setScrollFactor(0);
    this.container.setVisible(false);

    const bg = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x0b0f14, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x00ffff, 0.8);
    this.container.add(bg);

    this.titleText = this.scene.add.text(10, 8, '塔升級', {
      fontSize: '18px',
      fill: '#00ffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.container.add(this.titleText);

    this.statsText = this.scene.add.text(10, 38, '', {
      fontSize: '13px',
      fill: '#cfd8dc',
      fontFamily: 'Arial'
    });
    this.container.add(this.statsText);

    this.costText = this.scene.add.text(10, 120, '', {
      fontSize: '14px',
      fill: '#ffff00',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.container.add(this.costText);

    // 升級按鈕 (+)
    this.btnUpgrade = this.createButton(panelWidth - 80, 95, 60, 40, '+', 0x00a651, () => this.handleUpgrade());
    this.container.add(this.btnUpgrade);

    // 移除按鈕 (移除塔並退款)
    this.btnRemove = this.createButton(panelWidth - 80, 145, 60, 40, '移除', 0x8e24aa, () => this.handleRemove());
    this.container.add(this.btnRemove);

    // 關閉按鈕 (×)
    this.btnClose = this.scene.add.text(panelWidth - 24, 6, '×', {
      fontSize: '18px',
      fill: '#ff5252',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.btnClose.setInteractive({ useHandCursor: true });
    this.btnClose.on('pointerdown', () => this.hide());
    this.container.add(this.btnClose);
  }

  createButton(x, y, w, h, label, color, onClick) {
    const btn = this.scene.add.container(x, y);
    const rect = this.scene.add.rectangle(0, 0, w, h, color, 0.9);
    rect.setStrokeStyle(2, color, 1);
    rect.setOrigin(0.5);
    const txt = this.scene.add.text(0, 0, label, { fontSize: '22px', fill: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold' });
    txt.setOrigin(0.5);
    btn.add(rect);
    btn.add(txt);
    btn.setSize(w, h);
    // 讓容器與內部矩形都可點擊，擴大命中區
    btn.setInteractive(new Phaser.Geom.Rectangle(-w/2, -h/2, w, h), Phaser.Geom.Rectangle.Contains);
    rect.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      this.scene.enhancedAudio?.playSound('button_click');
      onClick();
    });
    rect.on('pointerdown', () => {
      this.scene.enhancedAudio?.playSound('button_click');
      onClick();
    });
    btn.on('pointerover', () => this.scene.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 100 }));
    btn.on('pointerout', () => this.scene.tweens.add({ targets: btn, scaleX: 1.0, scaleY: 1.0, duration: 100 }));
    return btn;
  }

  layoutToBottomRight() {
    if (!this.container) return;
    const { width, height } = this.scene.scale.gameSize;
    const margin = 14;
    const panelWidth = 280;
    const panelHeight = 200;
    this.container.setPosition(width - panelWidth - margin, height - panelHeight - margin);
  }

  show(tower) {
    this.currentTower = tower;
    this.refresh();
    this.layoutToBottomRight();
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.container.setScale(0.9);
    this.scene.tweens.add({ targets: this.container, alpha: 1, scaleX: 1, scaleY: 1, duration: 180, ease: 'Back.out' });
    this.visible = true;
  }

  hide() {
    if (!this.visible) return;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 120,
      ease: 'Power2',
      onComplete: () => this.container.setVisible(false)
    });
    this.visible = false;
    this.currentTower = null;
  }

  refresh() {
    if (!this.currentTower) return;

    const tower = this.currentTower;
    const type = tower.towerType;
    const cfg = GameConfig.TOWER.TYPES[type];
    const level = tower.level || 1;
    // 從配置推導最大等級，避免與硬編碼不一致
    const cfgMax = Math.min(5, (cfg?.damage?.length || 5));
    const maxLevel = tower.maxLevel ? Math.min(tower.maxLevel, cfgMax) : cfgMax;
    tower.maxLevel = maxLevel;

    this.titleText.setText(`${type.toUpperCase()} 塔`);

    const damage = cfg?.damage?.[level - 1] ?? tower.damage;
    const range = cfg?.range?.[level - 1] ?? tower.range;
    const fireRate = cfg?.fireRate?.[level - 1] ?? tower.fireRate;
    this.statsText.setText(
      `等級: ${level}/${maxLevel}` +
      `\n傷害: ${damage}` +
      `\n射程: ${range}` +
      `\n射速: ${(1000 / (fireRate || 1)).toFixed(1)}/秒`
    );

    // 成本顯示
    if (level >= maxLevel) {
      this.costText.setText('已達最高等級');
      this.costText.setColor('#888888');
      this.btnUpgrade.setAlpha(0.5);
      this.btnUpgrade.disableInteractive();
    } else {
      const upgradeCost = tower.getUpgradeCost?.() ?? (cfg?.upgradeCosts?.[level - 1] || 0);
      const money = this.scene.gameManager?.playerData?.money ?? 0;
      const canAfford = money >= upgradeCost;
      this.costText.setText(`升級成本: ${upgradeCost} 金幣`);
      this.costText.setColor(canAfford ? '#ffff00' : '#ff5252');
      this.btnUpgrade.setAlpha(canAfford ? 1 : 0.6);
      // 重新建立 hitArea，避免曾 disable 之後無法再次點擊
      this.btnUpgrade.removeInteractive();
      if (canAfford) {
        this.btnUpgrade.setInteractive(new Phaser.Geom.Rectangle(-30, -20, 60, 40), Phaser.Geom.Rectangle.Contains);
      }
    }

    // 移除按鈕永遠可用
    this.btnRemove.removeInteractive();
    this.btnRemove.setInteractive(new Phaser.Geom.Rectangle(-30, -20, 60, 40), Phaser.Geom.Rectangle.Contains);
  }

  handleUpgrade() {
    if (!this.currentTower) return;
    const tower = this.currentTower;
    const cost = tower.getUpgradeCost?.() || 0;

    // 扣款（優先使用scene.gameManager）
    const gm = this.scene.gameManager;
    if (gm && gm.spendMoney) {
      const ok = gm.spendMoney(cost);
      if (!ok) {
        this.flashInsufficient();
        this.scene.enhancedAudio?.playSound('money_insufficient');
        return;
      }
    }

    if (tower.upgrade && tower.upgrade()) {
      this.scene.enhancedAudio?.playSound('tower_upgrade');
      this.scene.events.emit('moneyChanged', { amount: -cost, total: gm?.playerData?.money ?? 0 });
      this.bumpTower(tower);
      this.refresh();
    }
  }

  handleRemove() {
    if (!this.currentTower) return;
    const tower = this.currentTower;
    const refund = tower.getSellValue ? tower.getSellValue() : 0;

    // 退款
    const gm = this.scene.gameManager;
    if (gm && gm.addMoney) {
      gm.addMoney(refund);
      this.scene.events.emit('moneyChanged', { amount: refund, total: gm?.playerData?.money ?? 0 });
    }

    // 從放置系統移除與銷毀
    this.scene.towerPlacementSystem?.removeTower(tower);
    tower.destroy();
    this.hide();
    this.scene.enhancedAudio?.playSound('tower_sell');
  }

  bumpTower(tower, scale = 1.12) {
    this.scene.tweens.add({ targets: tower, scaleX: scale, scaleY: scale, duration: 160, yoyo: true, ease: 'Power2' });
  }

  flashInsufficient() {
    this.scene.tweens.add({ targets: this.costText, alpha: 0.2, duration: 100, yoyo: true, repeat: 2 });
    this.scene.tweens.add({ targets: this.container, x: this.container.x + 6, duration: 50, yoyo: true, repeat: 3 });
  }

  destroy() {
    if (this.container) this.container.destroy();
    this.container = null;
    this.currentTower = null;
    this.visible = false;
  }
}

export default TowerUpgradeUI;


