# 🎮 Tower Defense Game

一個使用 Phaser.js 建立的現代化塔防遊戲，具備完整的音效系統、可擴展的架構和專業級的遊戲體驗。

## 🚀 特色功能

### 🎯 核心遊戲玩法
- **玩家360度射擊系統** - 滑鼠控制武器方向，自由射擊
- **塔建造與升級** - 多種塔類型，可升級和改進
- **敵人波次系統** - 漸進式難度，多種敵人類型
- **準備階段機制** - 每波前給予建造時間
- **資源管理系統** - 金幣收集和消費

### 🎨 視覺與音效
- **完整音效系統** - 背景音樂、音效、語音、環境音
- **3D定位音效** - 根據位置播放空間音頻
- **視覺特效系統** - 粒子效果、爆炸、發光等
- **響應式UI設計** - 完美適應各種螢幕尺寸

### 📱 跨平台支援
- **手機與桌面兼容** - 完美支援觸控和滑鼠操作
- **性能自動優化** - 根據設備性能自動調整畫質
- **網頁部署友好** - 快速載入，小文件體積

### 🔧 可擴展架構
- **模組化設計** - 易於添加新塔、敵人、武器
- **數據驅動配置** - JSON配置文件，無需重編譯
- **完整管理器系統** - 遊戲狀態、性能、音頻管理

## 🏗️ 項目架構

```
🎮 Tower Defense Game/
├── 📁 src/                          # 源代碼
│   ├── 📁 core/                     # 核心引擎
│   │   ├── Game.js                  # 主遊戲類
│   │   ├── BaseScene.js             # 場景基類
│   │   ├── GameConfig.js            # 遊戲配置
│   │   └── AssetLoader.js           # 資源載入器
│   │
│   ├── 📁 scenes/                   # 遊戲場景
│   │   ├── LoadingScene.js          # 載入場景
│   │   ├── MainMenuScene.js         # 主選單
│   │   ├── GameplayScene.js         # 遊戲場景
│   │   ├── PauseScene.js            # 暫停場景
│   │   ├── GameOverScene.js         # 遊戲結束
│   │   └── ShopScene.js             # 商店場景
│   │
│   ├── 📁 entities/                 # 遊戲實體
│   │   ├── 📁 player/               # 玩家系統
│   │   ├── 📁 towers/               # 塔系統
│   │   ├── 📁 enemies/              # 敵人系統
│   │   └── 📁 projectiles/          # 投射物系統
│   │
│   ├── 📁 systems/                  # 遊戲系統
│   │   ├── 📁 upgrade/              # 升級系統
│   │   ├── 📁 combat/               # 戰鬥系統
│   │   ├── 📁 spawning/             # 生成系統
│   │   └── 📁 input/                # 輸入系統
│   │
│   ├── 📁 ui/                       # 用戶界面
│   │   ├── 📁 components/           # UI組件
│   │   ├── 📁 menus/                # 選單界面
│   │   ├── 📁 hud/                  # 遊戲HUD
│   │   └── 📁 dialogs/              # 對話框
│   │
│   ├── 📁 effects/                  # 特效系統
│   │   ├── 📁 visual/               # 視覺特效
│   │   ├── 📁 audio/                # 音頻系統
│   │   ├── 📁 shaders/              # 著色器
│   │   └── 📁 animations/           # 動畫系統
│   │
│   ├── 📁 utils/                    # 工具函數
│   └── 📁 managers/                 # 管理器
│       ├── GameManager.js           # 遊戲管理器
│       ├── StateManager.js          # 狀態管理器
│       └── PerformanceManager.js    # 性能管理器
│
├── 📁 assets/                       # 資源文件
│   ├── 📁 images/                   # 圖片資源
│   ├── 📁 audio/                    # 音頻資源
│   ├── 📁 fonts/                    # 字體文件
│   └── 📁 data/                     # 配置數據
│
└── 📁 config/                       # 項目配置
    ├── webpack.config.js            # 打包配置
    ├── package.json                 # 依賴管理
    ├── index.html                   # 主頁面
    └── style.css                    # 樣式表
```

## 🎮 遊戲流程

### 遊戲狀態機
```
載入 → 主選單 → 準備階段 → 戰鬥階段 → 結果 → 下一波
  ↓       ↓        ↓          ↓        ↓       ↓
 資源   選擇模式   建造塔    即時戰鬥   統計   升級
 載入   設置     等待開始   玩家射擊   獎勵   購買
```

### 核心機制
1. **準備階段** - 玩家有15秒時間建造和布置塔
2. **戰鬥階段** - 敵人按波次出現，玩家可射擊
3. **塔防機制** - 自動瞄準塔協助防禦
4. **升級系統** - 玩家武器和塔都可升級
5. **資源管理** - 金幣用於建造、升級和購買

## 🔧 技術特色

### 性能優化
- **對象池系統** - 避免頻繁創建銷毀
- **LOD系統** - 根據距離調整細節度
- **自動品質調整** - 根據FPS自動優化
- **資源管理** - 按需載入和釋放

### 音頻系統
- **多層音頻混合** - 音樂、音效、語音、環境音
- **3D空間音效** - 根據位置播放立體聲
- **動態音效** - 根據遊戲狀態調整
- **設備優化** - 根據平台調整音頻設置

### 可擴展性
- **數據驅動** - 所有遊戲數據外部化
- **模組化架構** - 功能獨立，易於維護
- **事件系統** - 鬆散耦合的組件通信
- **插件支援** - 易於添加新功能

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 建置生產版本
```bash
npm run build
```

### 運行測試
```bash
npm test
```

## 📝 配置文件說明

### gameConfig.json
```json
{
  "gameplay": {
    "startingMoney": 500,
    "startingHealth": 100,
    "preparationTime": 15000
  },
  "player": {
    "weapon": {
      "damage": 30,
      "fireRate": 500,
      "range": 200
    }
  }
}
```

### upgradeData.json
- 定義所有升級路線和效果
- 支援百分比和固定值加成
- 可設置升級前置條件

### enemyData.json
- 定義敵人類型和屬性
- 配置波次模式
- 設置敵人能力和弱點

### towerData.json
- 定義塔的類型和屬性
- 配置升級路線
- 設置特殊能力

### audioConfig.json
- 音頻檔案配置
- 音量和效果設置
- 設備優化參數

## 🎯 開發指南

### 添加新塔類型
1. 在 `towerData.json` 中定義塔屬性
2. 創建塔類繼承 `BaseTower`
3. 添加相應的視覺和音效資源
4. 在商店中添加購買選項

### 添加新敵人
1. 在 `enemyData.json` 中定義敵人屬性
2. 創建敵人類繼承 `BaseEnemy`
3. 在波次配置中添加敵人
4. 實現特殊能力（如有）

### 添加新武器
1. 在 `upgradeData.json` 中定義升級路線
2. 在 `PlayerWeapon` 中實現新功能
3. 添加相應的視覺效果
4. 配置音效和動畫

### 添加新特效
1. 在 `VisualEffects` 中創建特效函數
2. 使用 Phaser 的粒子系統或自定義著色器
3. 在相應事件中觸發特效
4. 考慮性能影響和優化

## 🔮 未來計劃

### 即將推出功能
- [ ] 更多塔類型（毒素塔、電擊塔、治療塔）
- [ ] Boss戰機制
- [ ] 多人模式支援
- [ ] 成就系統
- [ ] 每日挑戰
- [ ] 皮膚系統擴展

### 技術改進
- [ ] WebGPU 渲染支援
- [ ] PWA 深度整合
- [ ] 雲端存檔同步
- [ ] AI 輔助平衡調整
- [ ] 即時 PvP 模式

## 🤝 貢獻指南

歡迎貢獻代碼！請遵循以下步驟：

1. Fork 本倉庫
2. 創建功能分支 (`git checkout -b feature/新功能`)
3. 提交更改 (`git commit -am '添加新功能'`)
4. 推送到分支 (`git push origin feature/新功能`)
5. 創建 Pull Request

### 代碼規範
- 使用 ES6+ 語法
- 遵循 JSDoc 註解規範
- 保持代碼模組化和可測試性
- 添加適當的錯誤處理

## 📄 開源協議

本項目採用 MIT 協議 - 詳見 [LICENSE](LICENSE) 文件。

## 🙏 致謝

- [Phaser.js](https://phaser.io/) - 優秀的 HTML5 遊戲框架
- [Webpack](https://webpack.js.org/) - 模組打包工具
- 所有貢獻者和測試者

## 📞 聯繫方式

- 開發者：Tower Defense 開發團隊
- 電子郵件：dev@towerdefense.com
- 官方網站：https://towerdefense.com
- GitHub：https://github.com/your-username/tower-defense

---

**享受遊戲！防禦你的基地！🏰**
