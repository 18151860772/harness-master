@echo off
chcp 65001 >nul
echo ========================================
echo       正在设置屏幕不休眠模式...
echo ========================================
echo.

echo [1/4] 禁用睡眠模式（接通电源）...
powercfg /change standby-timeout-ac 0
if %errorlevel% equ 0 (
    echo     √ 成功
) else (
    echo     × 失败
)

echo.
echo [2/4] 禁用睡眠模式（使用电池）...
powercfg /change standby-timeout-dc 0
if %errorlevel% equ 0 (
    echo     √ 成功
) else (
    echo     × 失败
)

echo.
echo [3/4] 禁用屏幕关闭（接通电源）...
powercfg /change monitor-timeout-ac 0
if %errorlevel% equ 0 (
    echo     √ 成功
) else (
    echo     × 失败
)

echo.
echo [4/4] 禁用屏幕关闭（使用电池）...
powercfg /change monitor-timeout-dc 0
if %errorlevel% equ 0 (
    echo     √ 成功
) else (
    echo     × 失败
)

echo.
echo ========================================
echo          设置完成！
echo    现在您的屏幕将不会休眠
echo ========================================
echo.
echo 提示：如需恢复默认设置，请运行"恢复默认.bat"
echo.
pause
