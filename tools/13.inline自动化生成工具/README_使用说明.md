# Inline清单自动化生成工具 V2.0

## 📋 工具简介

这是一个自动生成Inline清单的工具，可以根据Inline和Wirelist两个Excel文件的数据，自动匹配并生成标准格式的Inline清单Excel文件。

### 主要功能

- ✨ **智能匹配**：自动从wirelist中查找匹配From Code和To Code的线缆信息
- 🔢 **自动排序**：管脚号自动按数字顺序排列，数字优先、字母其次
- 📐 **格式完美**：完全复制模板格式，包括字体、行高、列宽、合并单元格、边框等
- 🚀 **快速生成**：后端处理，速度快，支持大量数据生成
- 💾 **模板下载**：网页内置模板下载功能

## 📦 文件结构

```
Inline清单生成工具/
├── index_v2.html              # 主网页应用（双击打开即可使用）
├── inline.xlsx                # Inline数据模板文件
├── WIRELIST.xlsx              # Wirelist数据模板文件
├── requirements.txt           # Python依赖库列表
├── README_使用说明.md          # 本说明文件
└── webapp/                    # 后端服务文件夹
    ├── app.py                 # Flask后端程序
    ├── 启动应用.bat            # Windows一键启动脚本
    ├── static/                # 静态资源文件夹
    │   ├── css/
    │   │   └── style.css
    │   └── js/
    │       └── app.js
    ├── templates/             # 模板文件夹
    └── uploads/               # 临时文件存储（运行时自动生成）
```

## 🔧 环境要求

### 系统要求
- **操作系统**：Windows / macOS / Linux
- **Python版本**：Python 3.7 或更高版本
- **浏览器**：Chrome、Edge、Firefox、Safari等现代浏览器

### Python依赖库

工具依赖以下Python库，已包含在 `requirements.txt` 中：
- Flask（Web框架）
- Flask-CORS（跨域支持）
- pandas（数据处理）
- openpyxl（Excel文件处理）
- werkzeug（文件处理）

## 🚀 快速开始

### 第一步：安装Python依赖

打开命令行（终端），进入项目文件夹，执行：

```bash
# 使用pip安装依赖（推荐）
pip install -r requirements.txt

# 或者逐个安装
pip install flask flask-cors pandas openpyxl werkzeug
```

**提示**：
- Windows用户：如果在PowerShell中遇到问题，可以尝试使用命令提示符（CMD）
- macOS/Linux用户：可能需要使用 `pip3` 而不是 `pip`
- 如果安装速度慢，可以使用国内镜像源：
  ```bash
  pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
  ```

### 第二步：启动后端服务

**Windows用户：**
1. 双击 `webapp/启动应用.bat` 文件
2. 或者在命令行中执行：
   ```bash
   cd webapp
   python app.py
   ```

**macOS/Linux用户：**
```bash
cd webapp
python app.py
```

启动成功后会显示：
```
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
```

**注意**：后端服务需要在整个使用过程中保持运行状态。

### 第三步：打开网页应用

1. 双击打开 `index_v2.html` 文件
2. 或者在浏览器中打开该文件

## 📖 使用说明

### 1. 下载模板文件

如果还没有Inline和Wirelist数据文件，可以在网页上点击下载按钮获取示例模板：
- 📄 **下载 inline.xlsx 模板**
- 📋 **下载 WIRELIST.xlsx 模板**

### 2. 准备数据文件

**inline.xlsx 文件格式要求：**
- 必须包含以下列：
  - `INLINE-LEFT`：左侧连接器名称
  - `INLINE-RIGHT`：右侧连接器名称

**WIRELIST.xlsx 文件格式要求：**
- 必须包含以下列：
  - `From Code`：起始连接器代码
  - `To Code`：目标连接器代码
  - `From Pin`：起始管脚号
  - `To Pin`：目标管脚号
  - `Size / Gauge`：线缆规格
  - `Color`：线缆颜色
  - `Multicore ID`：多芯ID（可选）
  - `Option`：选项（可选）

### 3. 上传文件并生成清单

1. 在网页中分别上传准备好的 `inline.xlsx` 和 `WIRELIST.xlsx` 文件
2. 支持拖拽上传或点击按钮选择文件
3. 两个文件都上传成功后，"生成Inline清单"按钮会变为可用状态
4. 点击"生成Inline清单"按钮
5. 等待生成完成（会显示进度）
6. 预览生成的数据表格
7. 点击"下载Excel文件"按钮获取生成的清单文件

### 4. 生成结果

生成的Excel文件包含：
- 完整的Inline配对信息
- 从Wirelist中匹配的线缆详细信息
- 与模板完全一致的格式（字体、行高、列宽、边框等）
- 自动排序的管脚信息

## ⚠️ 常见问题

### 问题1：点击"生成Inline清单"按钮提示错误

**原因**：后端服务未启动或端口被占用

**解决方案**：
1. 检查是否已启动后端服务（查看是否有 `webapp/启动应用.bat` 窗口在运行）
2. 重新启动后端服务
3. 如果端口5000被占用，可以修改 `webapp/app.py` 中的端口号

### 问题2：上传文件后提示"解析失败"

**原因**：文件格式不正确或缺少必要的列

**解决方案**：
1. 确保上传的是 `.xlsx` 或 `.xls` 格式的Excel文件
2. 检查文件是否包含所需的列（见"数据文件格式要求"）
3. 可以先下载示例模板查看格式

### 问题3：生成的清单数据不完整

**原因**：Inline和Wirelist中的连接器代码不匹配

**解决方案**：
1. 检查两个文件中的From Code和To Code是否完全一致（包括大小写、空格等）
2. 确保INLINE-LEFT和INLINE-RIGHT中的值存在于Wirelist的From Code或To Code中

### 问题4：安装依赖时提示权限错误

**解决方案**：
```bash
# Windows
pip install -r requirements.txt --user

# macOS/Linux
pip3 install -r requirements.txt --user
```

### 问题5：提示找不到Python命令

**解决方案**：
1. 确保已安装Python 3.7或更高版本
2. 检查Python是否已添加到系统环境变量
3. 使用完整路径运行Python（如 `C:\Python39\python.exe`）

## 📞 技术支持

如果遇到其他问题，可以：
1. 检查后端服务窗口中的错误日志
2. 打开浏览器开发者工具（F12）查看前端错误信息
3. 联系工具开发者获取支持

## 📄 更新日志

### V2.0 (当前版本)
- 🎨 全新的用户界面设计
- ⚡ 优化的文件上传体验
- 📊 实时进度显示
- 📥 内置模板下载功能
- 🔍 生成的数据预览功能
- 💾 改进的下载体验

## 📜 许可说明

本工具仅供内部使用，请勿用于商业目的。

---

**祝您使用愉快！** 🎉
