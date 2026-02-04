# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个**回路表比对工具**，用于比较两个版本的 Excel 回路表，识别新增、删除和变更的记录。

项目提供**两种实现方式**：
1. **Python 脚本**：使用 openpyxl 库进行本地处理
2. **Web 工具**（index.html）：使用 SheetJS 在浏览器中进行比对

## 常用命令

### 运行 Python 比对工具

```bash
# 主比对脚本（推荐）
python circuit_compare.py

# 详细日志版本
python analyze_circuits.py

# V2 版本（控制台 + 文件双重输出）
python analyze_circuits_v2.py

# 使用批处理文件
run_compare.bat
```

**输出结果**：
- `比对/NEW_已标注.xlsx` - 标注后的 Excel 文件（第1列包含变更标记）
- `比对结果.txt` 或 `compare_output.txt` - 详细比对日志
- 控制台输出统计信息（新增/删除/变更/未变更数量）

### 安装依赖

```bash
pip install openpyxl
```

### 使用 Web 界面

直接在浏览器中打开 `index.html` - 无需服务器。所有处理都在客户端完成。

## 核心架构

### 比对算法

所有 Python 脚本共享相同的核心比对逻辑：

1. **键值字段**：第2列（线号/导线号）作为比对的唯一键
2. **数据起始行**：第4行（前3行为表头）
3. **变更类型识别**：
   - **新增**（绿色）：仅存在于新文件
   - **删除**（灰色）：仅存在于旧文件
   - **变更**（黄色）：两个文件都存在但内容有差异
   - **未变更**：两个文件内容完全相同

4. **输出标注**：在新文件的第1列写入变更标记：
   - `✓ 新增` - 新增记录
   - `★ 变更: 列X:旧值→新值; 列Y:旧值→新值` - 变更记录

### 文件结构约定

- 输入文件必须位于 `比对/` 目录
- 旧文件：`比对/OLD.xlsx`
- 新文件：`比对/NEW.xlsx`
- 输出：`比对/NEW_已标注.xlsx`

### 脚本差异

- **circuit_compare.py**：主生产脚本，简洁输出
- **analyze_circuits.py**：详细日志版本，将标准输出重定向到 `比对_result.txt`
- **analyze_circuits_v2.py**：增强版本，同时输出到控制台和 `比对结果.txt`
- **simple_check.py, test_excel.py, verify_excel.py**：测试/诊断脚本

### Web 工具（index.html）

- 使用 SheetJS 库的纯客户端 JavaScript
- 与 Python 脚本相同的比对逻辑
- 支持拖放文件上传
- 可导出比对结果到 Excel
- 数据不离开浏览器（全本地处理）

### 智谱 AI 集成

项目包含 `使用智谱API.py` 和 `智谱AI使用说明.md`，提供智谱 AI API 的命令行客户端。这是独立工具，与回路表比对功能无直接关系。

## 数据要求

- 文件格式：`.xlsx` 或 `.xls`
- 第2列必须包含唯一的线号/回路号（不能重复）
- 数据从第4行开始（前3行为表头）
- 两个文件应具有相同的列结构以确保准确比对

## 重要实现细节

修改比对逻辑时注意：
1. 始终使用第2列（index 2）作为键值字段
2. 比较行内容时跳过第1列（用于写入变更标记）
3. 一致处理 None/空值（视为空字符串）
4. 使用 openpyxl 的 PatternFill 设置单元格颜色，使用8位十六进制代码（如 "00FF00"）
5. 重复的线号应生成警告但不停止处理
