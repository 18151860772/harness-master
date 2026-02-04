# 接地清单生成器

根据回路表、插件清单和inline表自动生成接地清单的Web应用。

## 功能特性

1. **自动识别接地短号**：从插件清单中自动识别中文描述含"接地"或英文描述含"GROUND"/"GND"的插件
2. **智能分类**：自动识别焊点、inline连接器和普通插件
3. **回路连接分析**：使用图算法追踪五种连接方式，识别同一回路的所有插件
4. **生成完整清单**：生成包含6列的接地清单Excel文件

## 生成结果格式

接地清单包含以下6列：

1. **接地短号**：所有接地插件的短号
2. **插件短号**：同一回路的其他插件短号（除接地与inline）
3. **中文描述**：插件的中文描述（从插件清单中查找）
4. **插件PIN**：与接地同一回路的插件引脚
5. **线径**：每个PIN对应的线径（从回路表中查找）
6. **Option**：每个PIN对应的option（从回路表中查找）

## 安装步骤

### 1. 安装Python依赖

```bash
pip install -r requirements.txt
```

依赖包包括：
- Flask：Web框架
- pandas：数据处理
- openpyxl：Excel文件读写
- networkx：图算法
- Werkzeug：Flask工具

### 2. 运行应用

```bash
python app.py
```

应用将在 `http://localhost:5000` 启动。

## 使用方法

1. 打开浏览器访问 `http://localhost:5000`

2. 上传三个必需的Excel文件：
   - **回路表** (WIRELIST.xlsx)：包含线束连接信息，需要包含from code、to code、from pin、to pin、wire size、option等列
   - **插件清单** (Connlist.xlsx)：包含所有连接器信息，需要包含短号、中文描述、英文描述等列
   - **Inline表** (inline.xlsx)：包含Inline连接器关系

3. 点击"上传并解析文件"按钮

4. 等待处理完成后，可以：
   - 查看概览统计信息
   - 预览回路表数据
   - 查看生成的接地清单
   - 下载完整的Excel文件

## 数据处理逻辑

### 接地识别
- 从插件清单中筛选：中文描述含"接地"或英文描述含"GROUND"/"GND"

### 分类定义

**焊点定义**：
- 在wirelist中from pin或to pin为"X"
- 与之相对应的from code或to code在connlist的短号中不存在

**Inline定义**：
- 存在于inlinelist中的插件
- 回路wire通过inline中相同孔位进行连接

**插件定义**：
- 存在于connlist中，除去接地与inline的剩余插件

### 回路连接方式

系统识别以下五种连接方式：

1. 插件通过回路表单根直接连接
2. 插件通过接到同一焊点
3. 插件接到一对inline的两端同一脚位
4. 插件通过多次焊点传递接到一个焊点
5. 插件通过2和3的组合接到一起

如果在wirelist中，通过以上几种方式任意回路的from code与to code有联系，就叫做同一回路。

## 技术架构

- **前端**：HTML + CSS + JavaScript（原生）
- **后端**：Flask Web框架
- **数据处理**：pandas + networkx图算法
- **文件处理**：openpyxl

## 文件结构

```
.
├── app.py                          # Flask主应用
├── requirements.txt                # Python依赖
├── README.md                       # 说明文档
├── app/
│   ├── templates/
│   │   └── index.html             # 前端页面
│   └── uploads/                   # 文件上传目录
├── WIRELIST.xlsx                  # 示例回路表
├── T28-Connlist_20260113.xlsx     # 示例插件清单
└── inline.xlsx                    # 示例inline表
```

## 注意事项

1. 确保上传的Excel文件格式正确，包含必需的列
2. 文件大小限制为16MB
3. 支持的文件格式：.xlsx 和 .xls
4. 处理大文件可能需要一些时间，请耐心等待

## 故障排除

**问题：无法启动应用**
- 检查是否已安装所有依赖：`pip install -r requirements.txt`
- 确保端口5000未被占用

**问题：上传文件失败**
- 检查文件格式是否为.xlsx或.xls
- 检查文件大小是否超过16MB
- 检查Excel文件是否包含必需的列

**问题：生成的清单为空**
- 检查插件清单中是否包含"接地"关键词的描述
- 检查回路表中的连接关系是否正确
- 查看浏览器控制台是否有错误信息

## 开发说明

### 修改端口

在 `app.py` 最后一行修改端口号：
```python
app.run(debug=True, port=5000)  # 修改为其他端口
```

### 调试模式

应用默认在debug模式运行，可以在控制台看到详细的错误信息。生产环境建议关闭debug模式：
```python
app.run(debug=False, port=5000)
```

## 许可证

本项目仅供内部使用。