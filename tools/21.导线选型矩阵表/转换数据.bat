@echo off
chcp 65001 >nul
echo 正在转换Excel文件为JSON数据...
python converter.py
echo.
echo 转换完成！
pause
