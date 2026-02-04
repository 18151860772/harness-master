@echo off
chcp 65001 > nul
cd /d "%~dp0"
python circuit_compare.py > compare_output.txt 2>&1
type compare_output.txt
echo.
echo 详细输出已保存到 compare_output.txt
pause
