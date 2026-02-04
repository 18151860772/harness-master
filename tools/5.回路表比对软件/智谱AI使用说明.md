# 智谱AI 使用说明

## 简介
这是一个使用智谱AI API 的 Python 客户端，可以直接在命令行中与智谱AI进行对话。

## 已配置
✅ API Key 已配置：0964d97aae0e4d868915e95a2a830e2d.JaEMrMMD3I0lZ9zf
✅ Python 依赖已安装（requests）
✅ 编码问题已修复（支持中文和emoji）

## 使用方法

### 方法一：交互式对话（推荐）
直接运行脚本进入交互模式：
```cmd
py 使用智谱API.py
```

或使用批处理文件：
```cmd
启动智谱AI.bat
```

进入交互模式后，你可以：
- 输入任何问题与AI对话
- 输入 `quit` 或 `exit` 退出
- 输入 `clear` 清除对话历史

### 方法二：单次查询
在命令行直接提问：
```cmd
py 使用智谱API.py 你的问题
```

示例：
```cmd
py 使用智谱API.py 今天天气怎么样？
py 使用智谱API.py 帮我写一个Python函数
```

## 功能特性

### 1. 交互式对话
- 支持多轮对话，AI 会记住上下文
- 自动管理对话历史
- 可以随时清除历史记录

### 2. 单次查询
- 适合快速提问
- 不会保留历史记录
- 适合脚本自动化使用

### 3. 多模型支持
默认使用 `glm-4` 模型，如需切换其他模型（如 `glm-4-plus`、`glm-3-turbo`），可以修改脚本中的 `DEFAULT_MODEL` 变量。

## 可用模型
- `glm-4` - 默认模型，通用性强
- `glm-4-plus` - 增强版模型，能力更强
- `glm-3-turbo` - 轻量级模型，响应更快
- `glm-4v` - 多模态模型，支持图像

## 配置修改

### 修改 API Key
如果需要更换 API Key，编辑 `使用智谱API.py` 文件，找到第17行：

```python
ZHIPU_API_KEY = "你的新API_Key"
```

### 修改默认模型
编辑第19行：

```python
DEFAULT_MODEL = "glm-4-plus"
```

### 调整温度参数
在 `chat()` 方法调用时，可以调整 `temperature` 参数（0-1）：
- 0.0-0.3：更保守，回答更确定
- 0.4-0.7：平衡，适合大多数场景（默认0.7）
- 0.8-1.0：更有创意，回答更多样化

## 使用示例

### 编程助手
```cmd
py 使用智谱API.py 帮我写一个快速排序算法
```

### 文本创作
```cmd
py 使用智谱API.py 写一首关于春天的诗
```

### 知识问答
```cmd
py 使用智谱API.py 解释一下什么是机器学习
```

### 代码调试
```cmd
py 使用智谱API.py 帮我找出这段代码的错误
```

## 注意事项

1. **API Key 安全**
   - 脚本中已包含你的 API Key，请勿分享此文件
   - 如需公开代码，请先移除 API Key

2. **网络要求**
   - 需要联网才能使用
   - 国内网络通常无需代理

3. **费用说明**
   - 智谱API 按调用次数和 token 数量计费
   - 新账户通常有免费额度
   - 具体定价请查看：https://open.bigmodel.cn/pricing

4. **编码问题**
   - 脚本已配置 UTF-8 编码，支持中文和 emoji
   - 如遇到乱码，请确保终端支持 UTF-8

## 高级用法

### 在 Python 代码中调用
```python
from 使用智谱API import ZhipuAIClient

client = ZhipuAIClient()
response = client.chat("你好")
print(response)
```

### 自定义对话历史
```python
client = ZhipuAIClient()
client.conversation_history = [
    {"role": "user", "content": "我叫小明"},
    {"role": "assistant", "content": "你好小明！"}
]
response = client.chat("我叫什么名字？")
```

### 清除历史记录
```python
client.clear_history()
```

## 常见问题

### Q: 如何查看 API 使用情况？
A: 登录智谱AI控制台：https://open.bigmodel.cn/console

### Q: 提示 API Key 无效怎么办？
A: 检查 API Key 是否正确，或者是否已过期

### Q: 如何提高响应速度？
A: 可以尝试使用 `glm-3-turbo` 模型

### Q: 支持多文件上传吗？
A: 当前版本不支持，需要使用多模态 API（glm-4v）

### Q: 可以导出对话记录吗？
A: 对话历史存储在内存中，程序退出后会清空。如需保存，可以修改代码实现。

## 技术支持

如有问题，请访问：
- 智谱AI文档：https://open.bigmodel.cn/dev/api
- 智谱AI控制台：https://open.bigmodel.cn/console

## 更新日志

### v1.0 (2026-01-06)
- 初始版本发布
- 支持交互式对话和单次查询
- 支持多轮对话历史
- 修复 Windows 编码问题
- 支持 emoji 和特殊字符