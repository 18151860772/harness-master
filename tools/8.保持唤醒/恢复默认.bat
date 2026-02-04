@echo off
chcp 65001 >nul
echo ========================================
echo       正在恢复默认电源设置...
echo ========================================
echo.

echo [1/4] 恢复睡眠模式（接通电源）- 15分钟...
powercfg /change standby-timeout-ac 15
if %errorlevel% equ 0 (
    echo     √ 成功
) else (
    echo     × 失败
)

echo.
echo [2/4] 恢复睡眠模式（使用电池）- 10分钟...
powercfg /change standby-timeout-dc 10
if %errorlevel% equ 0 (
    echo     √ 成功
) else (
    echo     × 失败
)

echo.
echo [3/4] 恢复屏幕关闭（接通电源）- 15分钟...
powercfg /change monitor-timeout-ac 15
if %errorlevel% equ 0 (
    echo     √ 成功
) else (
    echo     × 失败
)

echo.
echo [4/4] 恢复屏幕关闭（使用电池）- 5分钟...
powercfg /change monitor-timeout-dc 5
if %errorlevel% equ 0 (
    echo     √ 成功
) else (
    echo     × 失败
)

echo.
echo ========================================
echo          恢复完成！
echo    电源设置已恢复为默认值
echo ========================================
echo.
pause
