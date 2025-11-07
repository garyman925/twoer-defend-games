# 🎮 遊戲教學系統說明

## 功能概述

教學系統在玩家第一次點擊「開始遊戲」時自動顯示，引導新玩家了解遊戲的基本玩法。

## 系統特性

### ✨ 核心功能
- **5 個教學步驟**：覆蓋遊戲的主要玩法
- **Skip 按鈕**：固定在右上角，可隨時跳過教學
- **步驟導航**：上一步/下一步按鈕，流暢切換
- **進度指示器**：圓點顯示當前步驟和已完成步驟
- **動畫效果**：步驟切換時的淡入淡出動畫
- **記憶功能**：完成教學後不再自動顯示（可配置）

### 📚 教學內容

#### 步驟 1：歡迎來到太空攻防戰 🚀
- 遊戲目標介紹
- 基本遊戲規則

#### 步驟 2：玩家控制 🎮
- 滑鼠移動控制
- 射擊操作說明
- 瞄準技巧

#### 步驟 3：防禦塔系統 🏗️
- 如何選擇和放置防禦塔
- 不同塔型的特點
- 布局策略建議

#### 步驟 4：資源與升級 💰
- 金幣獲取方式
- 商店系統
- 戰機升級
- 知識問答

#### 步驟 5：準備開始 ⚔️
- 關鍵提示總結
- 開始遊戲按鈕

## 文件結構

```
📁 教學系統相關文件
├── assets/css/tutorial.css        # 教學系統樣式
├── src/ui/TutorialUI.js           # 教學系統邏輯
└── src/scenes/MainMenuScene.js    # 整合教學系統
```

## 使用方式

### 自動觸發
教學系統會在以下情況自動顯示：
1. 玩家首次點擊「開始遊戲」
2. localStorage 中沒有 `hasCompletedTutorial` 記錄

### 重新顯示教學
如果需要讓玩家重新看到教學，有兩種方式：

**方法 1：清除 localStorage**
```javascript
localStorage.removeItem('hasCompletedTutorial');
```

**方法 2：修改代碼（永久顯示教學）**
在 `MainMenuScene.js` 的 `showTutorial()` 方法中，註釋掉以下這行：
```javascript
// localStorage.setItem('hasCompletedTutorial', 'true');
```

## 自定義教學內容

### 修改教學步驟
在 `src/ui/TutorialUI.js` 中的 `steps` 數組修改：

```javascript
this.steps = [
  {
    title: '步驟標題',
    icon: '🎮',  // Emoji 圖標
    description: '描述文字',
    points: [
      '要點 1',
      '<span class="tutorial-highlight">重點文字</span>',
      '要點 3'
    ]
  },
  // ... 更多步驟
];
```

### 調整步驟數量
修改 `totalSteps` 變量：
```javascript
this.totalSteps = 5;  // 改為你需要的步驟數
```

## 樣式自定義

所有樣式定義在 `assets/css/tutorial.css` 中：

- `.tutorial-overlay` - 遮罩層
- `.tutorial-box` - 主體框
- `.tutorial-skip-btn` - Skip 按鈕
- `.tutorial-btn-next` - 下一步按鈕
- `.tutorial-btn-prev` - 上一步按鈕
- `.tutorial-highlight` - 重點文字高亮

## 響應式設計

教學系統已適配不同螢幕尺寸：
- **桌面版**：最大寬度 700px
- **平板版** (≤768px)：寬度 95%，調整字體大小
- **手機版** (≤480px)：進一步縮小尺寸

## API 參考

### TutorialUI 類

#### 構造函數
```javascript
const tutorial = new TutorialUI(scene);
```

#### 方法

**create(onComplete)**
- 創建並顯示教學 UI
- 參數：`onComplete` - 完成教學後的回調函數

**nextStep()**
- 前進到下一步

**prevStep()**
- 返回上一步

**skip()**
- 跳過教學，直接完成

**destroy()**
- 清理教學 UI

## 開發注意事項

1. ✅ 確保 `tutorial.css` 在 `index.html` 中已引入
2. ✅ 確保 Orbitron 字體已載入
3. ✅ 教學完成後會自動清理 DOM 元素
4. ✅ Skip 按鈕會直接觸發完成回調
5. ✅ 支援鍵盤導航（可擴展）

## 未來改進建議

- [ ] 添加鍵盤快捷鍵支持（左右箭頭、ESC）
- [ ] 添加背景音效
- [ ] 支援多語言切換
- [ ] 添加教學進度持久化
- [ ] 支援視頻教學內容
- [ ] 添加互動式教學（實際操作演示）

## 故障排除

### 教學不顯示
1. 檢查 `tutorial.css` 是否正確引入
2. 檢查瀏覽器控制台是否有錯誤
3. 清除 localStorage 重試

### 樣式錯亂
1. 確認 CSS 引入順序正確
2. 檢查是否有 CSS 衝突
3. 清除瀏覽器緩存

### Skip 按鈕無效
1. 檢查事件監聽器是否正確綁定
2. 確認 `onComplete` 回調函數存在

---

**創建日期**：2025-11-07
**版本**：1.0.0
**維護者**：開發團隊

