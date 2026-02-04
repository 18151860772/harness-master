@echo off
chcp 65001 >nul
echo ============================================
echo   线束大师 - GitHub Pages 一键部署脚本
echo ============================================
echo.

REM 设置变量
set PROJECT_DIR=%~dp0
set REPO_NAME=harness-master

REM 检查是否安装了 git
where git >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Git，请先安装 Git
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/6] 检查项目文件...
if not exist "%PROJECT_DIR%index.html" (
    echo [错误] 未找到 index.html，请确保脚本在项目根目录运行
    pause
    exit /b 1
)
echo [✓] 项目文件检查完成

echo.
echo [2/6] 初始化 Git 仓库...
if exist "%PROJECT_DIR%.git" (
    echo [ℹ] 已存在 Git 仓库，跳过初始化
) else (
    git init
    if errorlevel 1 (
        echo [错误] Git 初始化失败
        pause
        exit /b 1
    )
    echo [✓] Git 仓库初始化完成
)

echo.
echo [3/6] 配置用户信息...
set /p github_username="请输入您的 GitHub 用户名: "
set /p github_email="请输入您的邮箱 (用于提交): "

git config user.name "%github_username%"
git config user.email "%github_email%"

echo.
echo [4/6] 添加文件并提交...
git add -A
git commit -m "Initial commit: Harness Master v2.1.0 - 线束大师工具箱"

echo.
echo [5/6] 创建 GitHub 仓库...
echo.
echo 请手动创建 GitHub 仓库：
echo 1. 打开 https://github.com/new
echo 2. Repository name 输入: %REPO_NAME%
echo 3. 选择 Public
echo 4. 点击 Create repository
echo.
set /p create_done="创建完成后按 Enter 继续..."

echo.
echo [6/6] 推送到 GitHub...
set /p remote_url="请粘贴仓库地址 (例如: https://github.com/用户名/harness-master.git): "

git branch -M main
git remote add origin "%remote_url%" 2>nul
git remote set-url origin "%remote_url%" 2>nul
git push -u origin main

echo.
echo ============================================
echo   部署完成！
echo ============================================
echo.
echo 下一步 - 启用 GitHub Pages:
echo 1. 打开 https://github.com/%github_username%/%REPO_NAME%/settings/pages
echo 2. Branch 选择: main
echo 3. Folder 选择: /(root)
echo 4. 点击 Save
echo.
echo 网站地址将是:
echo   https://%github_username%.github.io/%REPO_NAME%/
echo.
pause
