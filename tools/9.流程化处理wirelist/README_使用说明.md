# Excel处理工具 - Python版本 v3.3

## 文件位置
```
C:\Users\HP\Desktop\tools\流程化处理wirelist\Excel处理工具_v3.3.py
```

## 安装依赖
首次使用前需要安装openpyxl库：
```bash
pip install openpyxl
```

## 使用方法

### 方式1：命令行指定文件
```bash
python Excel处理工具_v3.3.py "你的文件路径.xlsx"
```

### 方式2：自动查找文件
直接运行脚本，会自动查找当前目录下的Excel文件：
```bash
python Excel处理工具_v3.3.py
```

如果有多个Excel文件，会提示你选择要处理的文件。

## 功能说明

### 与v3.3 VBScript版本功能完全一致：

1. **文本格式设置** - 将所有单元格设置为文本格式
2. **空白字符清理** - 移除所有特殊空白字符
   - `\xa0` (Chr 160) - 不间断空格
   - `\n` (Chr 10) - 换行符
   - `\r` (Chr 13) - 回车符
   - `\t` (Chr 9) - 制表符
   - `\v` (Chr 11) - 垂直制表符
   - `\f` (Chr 12) - 换页符
3. **问号移除** - 移除所有半角问号 `?`
4. **增强Trim** - 去除首尾空格
5. **空字符串处理** - 清空纯空字符串
6. **删除前9行** - 删除工作表前9行
7. **清除A列** - 清除A列数据（保留前3行）
8. **删除指定列** - 删除列：V, U, T, Q, P, M, K, J, G, F
9. **删除工作表** - 删除sheet2和sheet3
10. **自动调整列宽** - 优化显示效果
11. **最终清理** - 再次执行清理步骤确保彻底
12. **重命名工作表** - 将第一个工作表重命名为"new"

## 输出文件

处理后的文件会保存在同一目录下，文件名添加 `_processed` 后缀：
```
原文件.xlsx → 原文件_processed.xlsx
```

## 示例

```bash
# 处理指定文件
python Excel处理工具_v3.3.py "C:\Users\HP\Desktop\test.xlsx"

# 或者在当前目录运行
cd C:\Users\HP\Desktop\tools\流程化处理wirelist
python Excel处理工具_v3.3.py
```

## 错误处理

- **文件未找到**：检查文件路径是否正确
- **权限错误**：请关闭Excel文件后重试
- **缺少依赖**：运行 `pip install openpyxl` 安装依赖

## 优势

相比VBScript版本，Python版本具有以下优势：

1. ✓ 更好的错误处理和提示信息
2. ✓ 不需要打开Excel应用程序
3. ✓ 支持命令行参数，可集成到自动化流程
4. ✓ 跨平台兼容（Windows/Linux/Mac）
5. ✓ 处理速度更快
6. ✓ 代码更易维护和扩展

## 版本

v3.3 - Python版本，功能与VBScript v3.3完全一致
