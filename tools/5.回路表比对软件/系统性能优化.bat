@echo off
chcp 65001 >nul
title 系统性能优化工具
color 0B

echo ========================================
echo       系统性能优化工具 v1.0
echo ========================================
echo.

echo [1/6] 正在检查系统信息...
echo.

echo 当前系统状态：
wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value
wmic logicaldisk get size,freespace,caption
wmic cpu get loadpercentage /Value
echo.

pause

echo ========================================
echo [2/6] 正在清理临时文件...
echo.

echo 清理用户临时文件...
del /f /s /q "%TEMP%\*" >nul 2>&1

echo 清理系统临时文件...
del /f /s /q "C:\Windows\Temp\*" >nul 2>&1

echo 清理预读取文件...
del /f /s /q "C:\Windows\Prefetch\*" >nul 2>&1

echo 清理浏览器缓存...
del /f /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*" >nul 2>&1
del /f /s /q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache\*" >nul 2>&1

echo 临时文件清理完成！
echo.

pause

echo ========================================
echo [3/6] 正在清理磁盘...
echo.

echo 分析C盘可用空间...
C:\Windows\System32\cleanmgr.exe /d C: /sagerun:1

echo 磁盘清理完成！
echo.

pause

echo ========================================
echo [4/6] 正在优化启动项...
echo.
echo 以下启动项过多导致开机缓慢，建议在任务管理器中禁用不需要的启动项：
echo.
echo 建议禁用的启动项：
echo - 豆包 (doubao)
echo - WPS云服务 (KWpsBox)
echo - WPS桌面 (KDesktop)
echo - 飞书
echo - 微信
echo - Notion
echo - Notion Calendar
echo - iFLYAssistant
echo - Everything (如果不需要常驻)
echo.
echo 正在打开任务管理器...
taskmgr /0 /startup

echo.
echo 请在任务管理器中右键点击不需要的启动项，选择"禁用"
echo 建议保留：Microsoft Edge Update、SecurityHealth、RtkAudUService
echo.

pause

echo ========================================
echo [5/6] 正在优化系统服务...
echo.
echo 优化视觉效果...
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f

echo 禁用不必要的Windows功能...
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" /v ClearPageFileAtShutdown /t REG_DWORD /d 0 /f
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" /v LargeSystemCache /t REG_DWORD /d 1 /f

echo 系统服务优化完成！
echo.

pause

echo ========================================
echo [6/6] 正在进行磁盘碎片整理...
echo.
echo 请选择要优化的磁盘：
echo 1. C盘 (系统盘)
echo 2. D盘 (数据盘)
echo 3. 全部
echo.
set /p choice=请输入选项 (1-3):

if "%choice%"=="1" (
    defrag C: /O
) else if "%choice%"=="2" (
    defrag D: /O
) else if "%choice%"=="3" (
    defrag C: /O
    defrag D: /O
) else (
    echo 跳过磁盘优化
)

echo.
echo ========================================
echo 优化完成！
echo ========================================
echo.
echo 优化建议：
echo 1. 定期清理临时文件（建议每周一次）
echo 2. 禁用不必要的启动项（已完成部分）
echo 3. 卸载不常用的软件
echo 4. 增加C盘空间（清理后如仍不足，建议移动大文件到D盘）
echo 5. 定期进行磁盘碎片整理（建议每月一次）
echo 6. 关闭不必要的后台应用
echo.
echo 注意：请重启计算机以使所有优化生效
echo.

pause