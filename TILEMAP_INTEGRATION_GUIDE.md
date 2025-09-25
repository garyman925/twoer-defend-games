# Tilemap 整合指南

## 🎯 目標
- 視覺：重複單一 tile 作為背景
- 邏輯：用 Tilemap 控制塔的可建造區域和敵人路徑

## 📁 檔案結構
```
assets/
├── maps/
│   └── logic.json          # Tiled 輸出的邏輯地圖
├── tilesets/
│   ├── terrain.png         # 你的視覺 tileset（含想重複的 tile）
│   └── logic_simple.png    # 簡單的邏輯 tileset（純色塊即可）
```

## 🛠️ Tiled 設定

### 1. 創建邏輯地圖 (logic.json)
- 地圖尺寸：例如 30×20 tiles
- Tile 大小：32×32 px
- 創建圖層：
  * **Buildable** - 可建造區（用綠色 tile, ID=1）
  * **Blocked** - 阻擋區（用紅色 tile, ID=2）
  * **Path** - 敵人路徑（用藍色 tile, ID=3）

### 2. 簡單 tileset (logic_simple.png)
```
[0: 透明] [1: 綠色] [2: 紅色] [3: 藍色]
```
只需要 4 個 32×32 的色塊即可。

## 💻 GameplayScene 整合

### 在 create() 中添加：

```javascript
create() {
  super.create();
  
  // 1. 創建視覺背景
  this.createVisualBackground();
  
  // 2. 創建邏輯地圖
  this.createLogicMap();
  
  // ... 其他現有代碼
}

/**
 * 創建視覺背景（重複單一 tile）
 */
createVisualBackground() {
  // 載入你的 tileset 作為 spritesheet
  this.load.spritesheet('terrain', 'assets/tilesets/terrain.png', {
    frameWidth: 32,
    frameHeight: 32,
    margin: 1,      // 根據你的 tileset 調整
    spacing: 2      // 根據你的 tileset 調整
  });
  
  // 等載入完成後創建背景
  this.load.once('complete', () => {
    // 選擇你要重複的 frame（例如第 42 格）
    const bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'terrain', 42);
    bg.setOrigin(0).setDepth(-100); // 放在最底層
  });
  
  this.load.start();
}

/**
 * 創建邏輯地圖（隱藏，僅用於判斷）
 */
createLogicMap() {
  // 載入邏輯地圖
  this.load.tilemapTiledJSON('logic', 'assets/maps/logic.json');
  this.load.image('logic_tiles', 'assets/tilesets/logic_simple.png');
  
  this.load.once('complete', () => {
    // 創建地圖
    this.logicMap = this.make.tilemap({ key: 'logic' });
    const logicTiles = this.logicMap.addTilesetImage('logic', 'logic_tiles', 32, 32);
    
    // 創建邏輯層（設為透明或隱藏）
    this.buildableLayer = this.logicMap.createLayer('Buildable', logicTiles).setAlpha(0);
    this.blockedLayer = this.logicMap.createLayer('Blocked', logicTiles).setAlpha(0);
    this.pathLayer = this.logicMap.createLayer('Path', logicTiles).setAlpha(0);
    
    // 可選：顯示邏輯層用於調試（開發時可用）
    // this.buildableLayer.setAlpha(0.3).setTint(0x00ff00); // 綠色半透明
    // this.blockedLayer.setAlpha(0.3).setTint(0xff0000);   // 紅色半透明
    
    console.log('邏輯地圖載入完成');
  });
  
  this.load.start();
}
```

## 🔧 敵人路徑整合

### 修改 PathfindingManager 使用 Tilemap：

```javascript
// 在 PathfindingManager.js 中
setupGrid() {
  if (this.scene.logicMap && this.scene.blockedLayer) {
    // 從 Tilemap 讀取阻擋資訊
    for (let y = 0; y < this.scene.logicMap.height; y++) {
      for (let x = 0; x < this.scene.logicMap.width; x++) {
        const blockedTile = this.scene.blockedLayer.getTileAt(x, y);
        if (blockedTile && blockedTile.index > 0) {
          this.grid[y][x] = 1; // 阻擋
        } else {
          this.grid[y][x] = 0; // 可通行
        }
      }
    }
  }
}
```

## 🎮 使用方式

1. **準備素材**：
   - 你的視覺 tileset (terrain.png)
   - 簡單的邏輯 tileset (logic_simple.png)

2. **用 Tiled 設計**：
   - 創建邏輯地圖，標記可建造區和阻擋區
   - 輸出為 logic.json

3. **告訴我**：
   - 你想重複的 tile 在 tileset 中的位置（第幾格）
   - 你的 tileset 的 margin/spacing 設定
   - 地圖尺寸需求

4. **我會幫你**：
   - 整合到現有的 GameplayScene
   - 確保塔建造系統正確讀取限制
   - 確保敵人路徑系統正確避開阻擋

## ✨ 優勢
- **效能**：視覺用 TileSprite，只渲染一次
- **功能**：邏輯用 Tilemap，完整的碰撞/路徑支援
- **靈活**：可隨時調整 Tiled 地圖而不影響視覺
- **調試**：可切換顯示邏輯層來檢查設計

準備好素材後告訴我，我立即幫你整合！
