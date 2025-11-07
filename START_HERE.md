# 🎮 快速開始 - XAMPP 部署

## 🚀 一鍵打包（推薦）

### Windows 用戶
直接雙擊執行：
```
build-for-xampp.bat
```

這會自動：
1. 安裝依賴（如果需要）
2. 打包遊戲
3. 顯示訪問地址

---

## 📝 手動步驟

### 1. 安裝依賴（首次執行）
```bash
npm install
```

### 2. 打包遊戲
```bash
npm run build
```

### 3. 訪問遊戲
打開瀏覽器，訪問：
```
http://localhost/games/tower-defend_v2/dist/
```

---

## 📂 重要文件

- **XAMPP_DEPLOYMENT.md** - 完整的部署指南
- **TUTORIAL_SYSTEM.md** - 教學系統說明
- **build-for-xampp.bat** - 一鍵打包腳本
- **webpack.config.js** - Webpack 配置（已優化）

---

## 🔄 開發 vs 部署

### 開發模式（實時預覽）
```bash
npm run dev
```
訪問：`http://localhost:3000`

### 生產模式（XAMPP 部署）
```bash
npm run build
```
訪問：`http://localhost/games/tower-defend_v2/dist/`

---

## ✅ 驗證清單

打包成功的標誌：
- [ ] 看到 "webpack compiled successfully" 訊息
- [ ] `dist` 文件夾已創建
- [ ] `dist/index.html` 存在
- [ ] `dist/bundle.js` 存在
- [ ] `dist/assets/` 目錄存在
- [ ] 獨立頁面已複製（my-ship.html 等）

---

## 🐛 遇到問題？

查看詳細的故障排除指南：
- **XAMPP_DEPLOYMENT.md** - 部署問題
- **package.json** - 依賴問題

---

## 📞 需要幫助？

常見問題：

**Q: 打包失敗？**
A: 確保已執行 `npm install`

**Q: 資源找不到？**
A: 檢查 dist/assets 目錄是否存在

**Q: 頁面空白？**
A: 打開瀏覽器控制台（F12）查看錯誤

---

🎯 **現在開始：雙擊 `build-for-xampp.bat` 開始打包！**

