@echo off
chcp 65001 > nul
echo 正在运行回路表比对工具...
echo.
python analyze_circuits.py > output.log 2>&1
echo.
echo 比对完成！
echo 详细输出请查看 output.log 文件
pause
