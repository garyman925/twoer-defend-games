@echo off
echo ================================
echo    打包遊戲供 XAMPP 使用
echo ================================
echo.

REM 檢查 node_modules 是否存在
if not exist "node_modules\" (
    echo [1/2] 首次運行，正在安裝依賴...
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ 依賴安裝失敗！
        pause
        exit /b 1
    )
    echo ✅ 依賴安裝完成
    echo.
) else (
    echo [1/2] 依賴已安裝，跳過安裝步驟
    echo.
)

echo [2/2] 開始打包遊戲...
call npm run build

if errorlevel 1 (
    echo.
    echo ❌ 打包失敗！請檢查錯誤訊息。
    pause
    exit /b 1
)

echo.
echo ================================
echo    ✅ 打包成功！
echo ================================
echo.
echo 遊戲已打包到 dist 目錄
echo.
echo 🌐 在 XAMPP 上訪問：
echo    http://localhost/games/tower-defend_v2/dist/
echo.
echo 或直接打開：
echo    C:\xampp\htdocs\games\tower-defend_v2\dist\index.html
echo.
echo ================================
pause

