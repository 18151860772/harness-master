@echo off
chcp 65001 >nul
echo ========================================
echo      Wire Chart 工具启动器
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python
    pause
    exit /b 1
)
echo ✓ Python环境正常

echo.
echo [2/4] 检查必要文件...
if not exist "wire_chart_v4.html" (
    echo 错误: 找不到 wire_chart_v4.html
    pause
    exit /b 1
)
if not exist "start_server.py" (
    echo 错误: 找不到 start_server.py
    pause
    exit /b 1
)
if not exist "export_with_format.py" (
    echo 错误: 找不到 export_with_format.py
    pause
    exit /b 1
)
echo ✓ 所有文件存在

echo.
echo [3/4] 检查端口8765是否被占用...
netstat -ano | findstr ":8765" >nul 2>&1
if not errorlevel 1 (
    echo 警告: 端口8765已被占用，尝试关闭占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8765"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)
echo ✓ 端口检查完成

echo.
echo [4/4] 启动服务器...
echo.
echo ========================================
echo 正在启动Wire Chart服务器...
echo 浏览器即将自动打开...
echo ========================================
echo.
echo 提示：如浏览器未自动打开，请手动访问：
echo http://localhost:8765/wire_chart_v4.html
echo.
echo 按 Ctrl+C 可停止服务器
echo ========================================

python start_server.py
