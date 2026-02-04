/**
 * 线束大师 - 汽车线束设计自动化平台
 * 聊天功能模块
 */

// ================================================
// 聊天状态管理
// ================================================
const ChatState = {
    messages: [],
    isTyping: false,
    quickQuestions: [
        '如何选择合适的线径？',
        '线束设计的基本流程是什么？',
        '推荐一些学习资源',
        '什么是CAN总线？',
        '如何进行线束优化？'
    ]
};

// ================================================
// 初始化聊天功能
// ================================================
function initChat() {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    
    // 加载历史消息
    loadChatHistory();
    
    // 输入框事件
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// ================================================
// 发送消息
// ================================================
window.sendMessage = function() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput ? chatInput.value.trim() : '';
    
    if (!message) {
        showToast('请输入消息内容', 'warning');
        return;
    }
    
    // 添加用户消息
    addMessage(message, 'user');
    
    // 清空输入框
    if (chatInput) {
        chatInput.value = '';
    }
    
    // 显示打字动画
    showTypingIndicator();
    
    // 模拟AI响应
    setTimeout(() => {
        hideTypingIndicator();
        const response = generateAIResponse(message);
        addMessage(response, 'bot');
    }, 1000 + Math.random() * 1500);
};

window.sendQuickQuestion = function(question) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = question;
    }
    sendMessage();
};

// ================================================
// 处理键盘事件
// ================================================
window.handleChatKeypress = function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
};

// ================================================
// 添加消息到聊天界面
// ================================================
function addMessage(content, type) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageData = {
        id: generateMessageId(),
        content: content,
        type: type,
        timestamp: new Date().toISOString()
    };
    
    ChatState.messages.push(messageData);
    
    const messageEl = createMessageElement(messageData);
    chatMessages.appendChild(messageEl);
    
    // 滚动到底部
    scrollToBottom(chatMessages);
    
    // 保存到本地存储
    saveChatHistory();
    
    // 标记最后活跃时间
    localStorage.setItem('chatLastActive', new Date().toISOString());
}

function createMessageElement(messageData) {
    const div = document.createElement('div');
    div.className = `message ${messageData.type}`;
    div.dataset.id = messageData.id;
    
    const time = formatTime(messageData.timestamp);
    
    if (messageData.type === 'bot') {
        div.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${formatMessageContent(messageData.content)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="message-content" style="margin-left: auto; max-width: 80%;">
                <div class="message-text">${escapeHtml(messageData.content)}</div>
                <div class="message-time" style="text-align: right;">${time}</div>
            </div>
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
    }
    
    return div;
}

// ================================================
// 消息内容格式化
// ================================================
function formatMessageContent(content) {
    // 检测是否为代码
    if (content.includes('```')) {
        content = formatCodeBlocks(content);
    }
    
    // 检测列表
    if (content.includes('\n- ') || content.includes('\n* ')) {
        content = formatLists(content);
    }
    
    // 检测链接
    content = formatLinks(content);
    
    // 检测粗体文本
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 换行符转换
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

function formatCodeBlocks(content) {
    return content.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
        return `
            <div class="code-block">
                <div">
                    <span class="code class="code-header-lang">${lang || 'code'}</span>
                    <button class="code-copy" onclick="copyCode(this)">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <pre><code>${escapeHtml(code.trim())}</code></pre>
            </div>
        `;
    });
}

function formatLists(content) {
    const lines = content.split('\n');
    let inList = false;
    let listType = '';
    
    lines.forEach((line, index) => {
        if (line.match(/^[-*]\s/)) {
            if (!inList) {
                inList = true;
                listType = 'ul';
                lines[index] = '<ul class="message-list">';
            }
            lines[index] = `<li>${line.replace(/^[-*]\s/, '')}</li>`;
        } else if (line.match(/^\d+\.\s/)) {
            if (!inList) {
                inList = true;
                listType = 'ol';
                lines[index] = '<ol class="message-list">';
            }
            lines[index] = `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
        } else {
            if (inList) {
                inList = false;
                lines[index] = `</${listType}>${line}`;
            }
        }
    });
    
    if (inList) {
        lines.push(`</${listType}>`);
    }
    
    return lines.join('\n');
}

function formatLinks(content) {
    return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}

window.copyCode = function(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock ? codeBlock.querySelector('code').textContent : '';
    
    navigator.clipboard.writeText(code).then(() => {
        showToast('代码已复制到剪贴板', 'success');
    }).catch(() => {
        showToast('复制失败', 'error');
    });
};

// ================================================
// AI响应生成
// ================================================
function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // 关键词匹配
    if (message.includes('线径') || message.includes('线材') || message.includes('wire')) {
        return generateWireResponse();
    } else if (message.includes('连接器') || message.includes('connector') || message.includes('端子')) {
        return generateConnectorResponse();
    } else if (message.includes('can') || message.includes('总线') || message.includes('bus')) {
        return generateCANResponse();
    } else if (message.includes('学习') || message.includes('教程') || message.includes('入门')) {
        return generateLearningResponse();
    } else if (message.includes('标准') || message.includes('iso') || message.includes('规范')) {
return generateStandardResponse();
    } else if (message.includes('流程') || message.includes('步骤') || message.includes('设计流程')) {
        return generateProcessResponse();
    } else if (message.includes('优化') || message.includes('优化') || message.includes('optimize')) {
        return generateOptimizationResponse();
    } else if (message.includes('仿真') || message.includes('仿真') || message.includes('simulation')) {
        return generateSimulationResponse();
    } else if (message.includes('bom') || message.includes('物料') || message.includes('清单')) {
        return generateBOMResponse();
    } else if (message.includes('原理图') || message.includes('schematic') || message.includes('图纸')) {
        return generateSchematicResponse();
    } else if (message.includes('你好') || message.includes('hi') || message.includes('hello')) {
        return generateGreetingResponse();
    } else {
        return generateDefaultResponse(userMessage);
    }
}

function generateWireResponse() {
    return `关于线径选择，我来为您详细说明：

**线径计算的基本原则**

线径的选择需要考虑以下几个关键因素：

1. **载流量（Current Carrying Capacity）**
   - 根据工作电流选择合适的截面积
   - 一般规则：每1mm²约可承载8-10A电流

2. **电压降（Voltage Drop）**
   - 线路长度越长，电压降越大
   - 一般要求电压降不超过3%
   - 公式：$S = \\frac{2 \\times L \\times I}{\\Delta V \\times U}$

3. **环境温度（Ambient Temperature）**
   - 温度越高，载流量越低
   - 需要使用温度修正系数

4. **安装方式**
   - 单根敷设 vs 捆扎敷设
   - 是否在管道内

**常用线径规格（mm²）**
- 0.22、0.35（信号线）
- 0.5、0.75（控制线）
- 1.0、1.5（普通电源线）
- 2.5、4.0（大电流电源线）
- 6.0及以上（主电源线）

您可以进入**工具箱**使用我们的**线径计算器**进行精确计算。`;
}

function generateConnectorResponse() {
    return `连接器选型是线束设计中的重要环节，以下是选型要点：

**主要考虑因素**

1. **电气参数**
   - 额定电压
   - 额定电流
   - 接触电阻

2. **机械参数**
   - 插拔力
   - 锁止方式
   - 抗震性能

3. **环境适应性**
   - 工作温度范围
   - 防护等级（IP等级）
   - 耐腐蚀性

**主流连接器品牌**

- **TE Connectivity** - 汽车行业领导者
- **Molex** - 工业和汽车解决方案
- **JST** - 日本精密连接器
- **Delphi** - 德尔福汽车连接器
- **Yazaki** - 日系线束专家

**选型建议**

1. 根据电流选择合适的端子规格
2. 考虑防水防尘需求
3. 确认装配空间和布线方式
4. 参考整车厂认可清单

您可以使用我们的**连接器选型**工具进行智能匹配！`;
}

function generateCANResponse() {
    return `CAN（Controller Area Network）总线是汽车线束中常用的通信协议：

**CAN总线特点**

- **高速传输**：最高可达1Mbps
- **多主结构**：任意节点可发起通信
- **错误检测**：具有完善的错误处理机制
- **线束简化**：大幅减少线束用量

**线束设计要求**

1. **双绞线结构**
   - 有效抑制电磁干扰
   - 绞距通常为15-25mm
   - 特性阻抗120Ω

2. **终端电阻**
   - 总线两端各120Ω
   - 用于阻抗匹配

3. **线径选择**
   - CAN High/ CAN Low：通常0.35-0.5mm²
   - 高速CAN可选用0.75mm²

**常见应用**
- 动力总成通信
- 底盘控制系统
- 车身电子网络

需要我详细解释其他方面吗？`;
}

function generateLearningResponse() {
    return `学习汽车线束设计，我推荐以下路径：

**入门阶段（1-2个月）**

1. **基础知识**
   - 汽车电气系统概论
   - 基本电气原理
   - 常用电子元件

2. **线束基础**
   - 线束组成和分类
   - 常用材料认识
   - 基本术语学习

**进阶阶段（3-6个月）**

1. **设计软件**
   - CATIA V5/6线束设计
   - CHS（Catia Harness Solution）
   - Capital Harness

2. **标准规范**
   - ISO 6722（道路车辆低压电线）
   - LV 214/215（大众线束标准）
   - 各主机厂规范

**推荐学习资源**

- **书籍**：《汽车电线束设计手册》
- **在线课程**：各大在线教育平台
- **行业标准**：ISO官网、各主机厂标准
- **实践项目**：参与实际项目积累经验

建议边学习边使用我们的平台进行实践！`;
}

function generateStandardResponse() {
    return `汽车线束设计涉及多个国际和行业标准：

**国际标准**

- **ISO 6722** - 道路车辆60V和600V单芯电线
- **ISO 7637** - 道路车辆传导和耦合干扰
- **ISO 11452** - 整车抗电磁干扰

**欧洲标准（LV系列）**

- **LV 214** - 车内电线技术要求
- **LV 215** - 车用电缆技术要求
- **VW 60330** - 大众线束设计标准

**美国标准**

- **SAE J1128** - 低压电线
- **SAE J1673** - 汽车线束设计

**国内标准**

- **QC/T 29106** - 汽车电线束技术条件
- **GB/T 25085** - 道路车辆汽车电缆

**设计注意事项**

1. 优先满足整车厂要求
2. 注意标准的版本更新
3. 结合具体应用场景
4. 考虑环保和法规要求

您可以查阅我们平台上的**开发文档**获取详细信息。`;
}

function generateProcessResponse() {
    return `汽车线束设计的基本流程如下：

**1. 需求分析阶段**
- 收集电气原理图
- 确定功能需求
- 整理元件清单

**2. 概念设计阶段**
- 初步布线规划
- 区域划分设计
- 走向方案确定

**3. 详细设计阶段**
- 3D布线设计
- 固定点设计
- 防护设计

**4. 设计验证**
- 设计评审
- 样件制作
- 测试验证

**5. 生产准备**
- 工艺文件编制
- BOM生成
- 工装模具开发

**常用设计工具**

- CATIA V5/6 + EHI
- CHS（Catia Harness Solution）
- Capital Harness
- Mentor Graphics Harness Design

每个阶段都需要与相关部门密切配合，确保设计的可行性和可靠性。`;
}

function generateOptimizationResponse() {
    return `线束优化是提升产品竞争力和降低成本的重要手段：

**重量优化**

1. **线径优化**
   - 根据实际电流选择合适线径
   - 避免过度保守设计
   - 考虑温度修正系数

2. **长度优化**
   - 优化布线路径
   - 减少绕行和冗余
   - 标准化长度系列

**成本优化**

1. **材料优化**
   - 选择性价比高的供应商
   - 统一规格减少种类
   - 考虑国产替代方案

2. **工艺优化**
   - 简化装配工艺
   - 减少分支点数量
   - 优化端子压接

**可靠性优化**

1. **防护优化**
   - 合理选择防护方式
   - 优化固定点布置
   - 改善振动防护

2. **热管理**
   - 避免热源集中
   - 改善散热条件
   - 控制温升

我们的**仿真分析**工具可以帮助您进行性能验证！`;
}

function generateSimulationResponse() {
    return `线束仿真分析是验证设计方案的重要手段：

**主要分析类型**

1. **电气仿真**
   - 电压降分析
   - 电流分布计算
   - 短路分析

2. **热仿真**
   - 温升计算
   - 热分布分析
   - 散热条件评估

3. **电磁兼容（EMC）**
   - 电磁辐射分析
   - 抗干扰能力评估
   - 信号完整性分析

4. **力学仿真**
   - 振动分析
   - 应力分析
   - 耐久性评估

**仿真参数设置**

- 环境温度
- 负载工况
- 边界条件

**仿真结果解读**

- 电压降是否满足要求
- 温升是否在允许范围
- 是否有热集中问题

使用我们的**仿真分析**工具，可以快速评估您的设计方案！`;
}

function generateBOMResponse() {
    return `BOM（Bill of Materials）是线束生产的重要文件：

**BOM主要内容**

1. **基础信息**
   - 项目编号
   - 版本号
   - 编制日期

2. **物料清单**
   - 电线规格和用量
   - 连接器型号和数量
   - 端子规格和数量
   - 护套和扎带
   - 其他辅材

3. **工艺信息**
   - 工序说明
   - 工艺要求
   - 检验标准

**BOM编制要点**

1. **准确性**
   - 与设计图纸一致
   - 数量计算准确
   - 规格描述清晰

2. **完整性**
   - 包含所有物料
   - 覆盖所有工序

3. **及时性**
   - 设计变更及时更新
   - 版本管理规范

我们的**BOM生成器**可以自动从设计文件生成BOM，大幅提高效率！`;
}

function generateSchematicResponse() {
    return `原理图是线束设计的重要依据：

**原理图要素**

1. **电气连接**
   - 电源回路
   - 信号传输
   - 接地设计

2. **元件标识**
   - 零件编号
   - 规格参数
   - 连接点定义

3. **线束信息**
   - 线号标识
   - 线径规格
   - 颜色编码

**识图要点**

1. **从上到下**
   - 电源分配
   - 接地分配
   - 信号回路

2. **从左到右**
   - 信号流向
   - 功能分区

3. **关注细节**
   - 连接器接口
   - 接地位置
   - 保险丝规格

**常见软件**

- AutoCAD Electrical
- EPLAN
- Capital Logic
- 达索ElECTRICAL

可以使用我们的**原理图查看器**在线预览和编辑！`;
}

function generateGreetingResponse() {
    return `您好！我是线束大师AI助手，很高兴为您服务！

我可以帮助您解答以下问题：

- **线束设计**：线径选择、连接器选型等
- **标准规范**：ISO、LV等标准解读
- **设计流程**：从需求到生产的完整流程
- **工具使用**：平台各功能模块介绍
- **学习建议**：入门和进阶学习路径

请告诉我您想了解什么？`;
}

function generateDefaultResponse(userMessage) {
    return `感谢您的提问！关于"${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}"，我建议：

1. **查看文档**：进入**文档中心**获取详细资料
2. **使用工具**：平台提供多种专业工具
3. **提交需求**：如需定制服务，可提交需求

您是否想了解：
- 线径计算方法？
- 连接器选型建议？
- 最新的行业标准？
- 设计流程详解？

请告诉我更多细节，我会为您提供更准确的解答！`;
}

// ================================================
// 打字指示器
// ================================================
function showTypingIndicator() {
    ChatState.isTyping = true;
    
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const typingEl = document.createElement('div');
    typingEl.className = 'message bot typing-indicator';
    typingEl.id = 'typingIndicator';
    typingEl.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingEl);
    scrollToBottom(chatMessages);
}

function hideTypingIndicator() {
    ChatState.isTyping = false;
    const typingEl = document.getElementById('typingIndicator');
    if (typingEl) {
        typingEl.remove();
    }
}

// ================================================
// 聊天历史管理
// ================================================
function saveChatHistory() {
    // 只保存最近的50条消息
    const messagesToSave = ChatState.messages.slice(-50);
    localStorage.setItem('chatMessages', JSON.stringify(messagesToSave));
}

function loadChatHistory() {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
        const messages = JSON.parse(saved);
        
        // 恢复消息
        messages.forEach(msg => {
            if (!document.getElementById('chatMessages').querySelector(`[data-id="${msg.id}"]`)) {
                ChatState.messages.push(msg);
                const msgEl = createMessageElement(msg);
                
                // 移除打字指示器
                const typing = document.getElementById('typingIndicator');
                if (typing) {
                    document.getElementById('chatMessages').insertBefore(msgEl, typing);
                } else {
                    document.getElementById('chatMessages').appendChild(msgEl);
                }
            }
        });
        
        // 滚动到底部
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            scrollToBottom(chatMessages);
        }
    }
}

// ================================================
// 工具函数
// ================================================
function generateMessageId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

// ================================================
// 快捷问题点击统计
// ================================================
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('quick-question')) {
        const question = e.target.textContent;
        const stats = JSON.parse(localStorage.getItem('questionStats') || '{}');
        stats[question] = (stats[question] || 0) + 1;
        localStorage.setItem('questionStats', JSON.stringify(stats));
    }
});

// ================================================
// 初始化（外部调用）
// ================================================
window.initChat = initChat;