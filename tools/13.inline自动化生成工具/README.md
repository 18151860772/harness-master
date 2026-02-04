# Inline清单自动生成工具

## 📋 功能说明

这是一个基于Web的自动化工具，用于根据Inline和Wirelist数据自动生成Inline清单模板Excel文件。

### 主要功能
- ✅ 支持拖拽上传或点击选择Excel文件
- ✅ 自动解析inline.xlsx和WIRELIST.xlsx数据
- ✅ 智能匹配Inline配对关系
- ✅ 自动生成包含所有Inline配对的Excel清单
- ✅ 实时进度显示和错误提示

## 🚀 使用方法

### 1. 打开工具
双击 `index.html` 文件在浏览器中打开

### 2. 准备数据文件
确保你有以下两个Excel文件：
- **inline.xlsx** - 包含INLINE-LEFT和INLINE-RIGHT列，定义Inline连接器配对关系
- **WIRELIST.xlsx** - 包含线缆详细信息（Wire ID, Color, From/To等）

### 3. 上传文件
- 点击"选择文件"按钮或直接拖拽文件到对应的上传区域
- 等待文件加载完成（会显示已加载数据行数）

### 4. 生成清单
- 当两个文件都加载完成后，点击"🚀 生成Inline清单"按钮
- 等待处理完成（会显示实时进度）
- 文件将自动下载为 `inline清单生成结果.xlsx`

## 📊 数据结构说明

### inline.xlsx 格式
| INLINE-LEFT | INLINE-RIGHT |
|-------------|--------------|
| BDBT        | BTBD         |
| BDDHT       | DHTBD        |
| BDDP1       | DPBD1        |

### WIRELIST.xlsx 格式
| Wire ID | Color | Size / Gauge | Material | From Code | From Pin | To Code | To Pin |
|---------|-------|--------------|----------|-----------|----------|---------|--------|
| SR4     | G     | 0.35         | FLRY-B   | SRF       | 6        | FDL     | 5      |
| SR5     | L     | 0.35         | FLRY-B   | SRF       | 5        | FDL     | 4      |

### 生成结果格式
每个Inline配对会生成一个独立的工作表，包含：
- 连接器信息（左侧和右侧）
- 管脚定义
- 功能说明
- 线径、线色信息
- From/To连接信息
- 端子型号、密封塞型号等详细信息

## 🔧 技术实现

- **前端框架**: 原生HTML + CSS + JavaScript
- **Excel处理**: SheetJS (xlsx.js) 库
- **响应式设计**: 支持桌面和移动设备
- **实时进度**: 显示处理进度和状态

## 📝 注意事项

1. **文件格式**: 仅支持.xlsx和.xls格式的Excel文件
2. **数据要求**:
   - inline.xlsx必须包含"INLINE-LEFT"和"INLINE-RIGHT"列
   - WIRELIST.xlsx必须包含"Wire ID"、"From Code"、"To Code"等列
3. **浏览器兼容**: 推荐使用Chrome、Edge或Firefox浏览器
4. **文件大小**: 建议单个文件不超过10MB

## 🎯 使用场景

适用于汽车线束设计、电气系统设计等需要生成Inline连接清单的场景，可以大大提高工作效率，避免手动录入错误。

## 💡 优势

- ⚡ **自动化**: 无需手动复制粘贴，自动匹配数据
- 🎨 **美观**: 现代化的界面设计，操作简单直观
- 📱 **响应式**: 支持各种设备和屏幕尺寸
- ✅ **准确**: 基于数据自动匹配，减少人为错误
- 🚀 **快速**: 秒级生成，节省大量时间

---

**开发日期**: 2025-01-14
**版本**: v1.0
