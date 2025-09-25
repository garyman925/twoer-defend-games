# 敵人資源命名規則

## 概述
本項目使用統一的敵人資源命名規則，確保所有敵人相關資源使用一致的命名格式。

## 命名規則

### 1. 資源鍵名格式
- **格式**: `enemy_{type}`
- **範例**: `enemy_basic`, `enemy_meteor`, `enemy_boss`

### 2. 文件路徑格式
- **圖片文件**: `assets/sprites/enemies/{type}/{type}.webp`
- **JSON文件**: `assets/sprites/enemies/{type}/{type}.json`

### 3. 具體範例

#### Basic 敵人
- **資源鍵名**: `enemy_basic`
- **圖片路徑**: `assets/sprites/enemies/basic/basic.webp`
- **JSON路徑**: `assets/sprites/enemies/basic/basic.json`

#### Meteor 敵人
- **資源鍵名**: `enemy_meteor`
- **圖片路徑**: `assets/sprites/enemies/meteor.webp`
- **JSON路徑**: `assets/sprites/enemies/meteor.json`

## 代碼中的使用

### 1. AssetLoader.js
```javascript
// 資源定義
{ key: 'enemy_basic', path: 'assets/sprites/enemies/basic/basic.webp' },
{ key: 'enemy_basic_json', path: 'assets/sprites/enemies/basic/basic.json' },

// 載入atlas
this.scene.load.atlas('enemy_basic', 'assets/sprites/enemies/basic/basic.webp', 'assets/sprites/enemies/basic/basic.json');
```

### 2. GameplayScene.js
```javascript
// 載入敵人資源
this.load.atlas('enemy_basic', 'assets/sprites/enemies/basic/basic.webp', 'assets/sprites/enemies/basic/basic.json');
```

### 3. BaseEnemy.js
```javascript
// 創建敵人視覺
if (this.enemyType === 'BASIC') {
  this.enemySprite = this.scene.add.sprite(0, 0, 'enemy_basic');
} else {
  this.enemySprite = this.scene.add.image(0, 0, 'enemy_basic', frameName);
}
```

## 動畫命名規則

### 1. 動畫鍵名格式
- **格式**: `{enemy_type}_{animation_name}`
- **範例**: `enemy_basic_idle`, `enemy_basic_walk`, `enemy_meteor_float`

### 2. 具體範例
```javascript
// Basic敵人待機動畫
key: 'enemy_basic_idle'

// Meteor漂浮動畫
key: 'meteor_float'
```

## 重要注意事項

1. **一致性**: 所有敵人資源必須使用相同的命名格式
2. **下劃線分隔**: 使用下劃線 `_` 分隔單詞，不使用連字符 `-`
3. **小寫字母**: 資源鍵名使用小寫字母
4. **類型前綴**: 所有敵人資源都以 `enemy_` 開頭

## 文件結構
```
assets/sprites/enemies/
├── basic/
│   ├── basic.webp
│   └── basic.json
├── meteor/
│   ├── meteor.webp
│   └── meteor.json
└── boss/
    ├── boss.webp
    └── boss.json
```

## 更新日誌
- 2025-01-25: 建立初始命名規則
- 統一所有敵人資源使用 `enemy_basic` 格式
