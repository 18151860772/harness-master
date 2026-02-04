/**
 * 线束大师 - 动态工具加载器
 * 自动扫描和集成Tools文件夹中的HTML工具
 */

// ================================================
// 工具配置
// ================================================
const ToolsConfig = {
    // 工具列表配置
    tools: [
        {
            id: 'part-feature-compare',
            name: '零件号功能差异比对',
            category: '对比分析',
            description: '比对不同零件号的功能差异，支持多文件对比分析',
            path: 'tools/1.零件号功能差异/零件号功能差异比对工具_最终正确版.html',
            icon: 'fas fa-balance-scale'
        },
        {
            id: 'masterlist-compare',
            name: 'Master List比对工具',
            category: '对比分析',
            description: 'Master List文件比对和差异分析',
            path: 'tools/11.master list比对工具/masterlist比对工具.html',
            icon: 'fas fa-list-alt'
        },
        {
            id: 'config-compare',
            name: '配置表比对工具',
            category: '对比分析',
            description: '不同配置表的差异对比和分析',
            path: 'tools/12.配置表比对升级/配置表比对-全屏V9.html',
            icon: 'fas fa-columns'
        },
        {
            id: 'inline-generator',
            name: 'Inline清单生成工具',
            category: '生成工具',
            description: '自动生成Inline清单，支持多种格式导出',
            path: 'tools/13.inline自动化生成工具/Inline清单生成工具_v2.html',
            icon: 'fas fa-clipboard-list'
        },
        {
            id: 'config-merge',
            name: '配置表合并工具',
            category: '合并工具',
            description: '合并多个配置表为一个完整文件',
            path: 'tools/14.配置表合并/配置表合并.html',
            icon: 'fas fa-object-group'
        },
        {
            id: 'grounding-generator',
            name: '接地清单生成器',
            category: '生成工具',
            description: '生成接地清单和搭铁拓扑结构',
            path: 'tools/16.接地清单&搭铁拓扑/接地清单生成器V6.html',
            icon: 'fas fa-ground-hazard'
        },
        {
            id: 'purchasing-list',
            name: '外购件清单生成器',
            category: '生成工具',
            description: '自动生成外购件清单和采购清单',
            path: 'tools/17.外购件清单/外购件清单生成器.html',
            icon: 'fas fa-shopping-cart'
        },
        {
            id: 'fuse-wire-match',
            name: '保险丝线径匹配评审',
            category: '评审工具',
            description: '评审保险丝与线径的匹配合理性',
            path: 'tools/18.保险丝线径匹配评审/fuse-wire-matcher-终极版本.html',
            icon: 'fas fa-shield-alt'
        },
        {
            id: 'masterlist-generator',
            name: 'Master List自动生成',
            category: '生成工具',
            description: '自动化生成Master List文件',
            path: 'tools/2.master list自动化生成/masterlist-generator-v7.html',
            icon: 'fas fa-magic'
        },
        {
            id: 'wire-matrix',
            name: '导线选型矩阵表',
            category: '选型工具',
            description: '导线选型参考矩阵表',
            path: 'tools/21.导线选型矩阵表/导线选型矩阵表V3.html',
            icon: 'fas fa-table'
        },
        {
            id: '回路表比对',
            name: '回路表比对工具',
            category: '对比分析',
            description: '回路表差异对比和分析',
            path: 'tools/22.回路表比对/excel-compare.html',
            icon: 'fas fa-exchange-alt'
        },
        {
            id: '回路表检查',
            name: '回路表检查工具',
            category: '检查工具',
            description: '检查回路表的完整性和正确性',
            path: 'tools/23.回路表检查工具/index.html',
            icon: 'fas fa-check-circle'
        },
        {
            id: 'similar-parts',
            name: '相似零件号分析',
            category: '分析工具',
            description: '分析相似零件号的差异和关联',
            path: 'tools/25.相似零件号分析/similar_parts_analyzer_v2.html',
            icon: 'fas fa-search'
        },
        {
            id: 'can-topology',
            name: 'CAN网络拓扑分析',
            category: '分析工具',
            description: '分析和可视化CAN总线网络拓扑',
            path: 'tools/30.CAN网络拓扑/can_wire_analyzer_v10.html',
            icon: 'fas fa-network-wired'
        },
        {
            id: 'short-sample',
            name: '短样自动化工具',
            category: '自动化工具',
            description: '短样制作流程自动化',
            path: 'tools/31.短样自动化/插件回路查询工具_V4.html',
            icon: 'fas fa-bolt'
        },
        {
            id: 'ecr-generator',
            name: 'ECR List生成器',
            category: '生成工具',
            description: '生成工程更改请求列表',
            path: 'tools/33.ECR list生成/ECR列表生成器.html',
            icon: 'fas fa-edit'
        },
        {
            id: 'wire-chart',
            name: 'Wire Chart生成工具',
            category: '生成工具',
            description: '生成线束图表和清单',
            path: 'tools/35.master list&wire list生成chart/wire_chart_v8.html',
            icon: 'fas fa-chart-line'
        },
        {
            id: 'wire-calculator',
            name: '汽车线束线径计算',
            category: '计算工具',
            description: '计算线束所需的导线直径',
            path: 'tools/4.汽车线束线径计算/汽车线束线径计算.html',
            icon: 'fas fa-calculator'
        },
        {
            id: 'circuit-compare',
            name: '回路表比对软件',
            category: '对比分析',
            description: '回路表详细对比和分析软件',
            path: 'tools/5.回路表比对软件/excel_compare_v2_final_fixed.html',
            icon: 'fas fa-balance-scale'
        },
        {
            id: 'ecr-compare',
            name: '工程更改Log比对',
            category: '对比分析',
            description: '工程更改记录的对比分析',
            path: 'tools/6.工程更改log自动化/ecr_compare.html',
            icon: 'fas fa-history'
        },
        {
            id: 'wirelist-process',
            name: 'Wirelist处理工具',
            category: '处理工具',
            description: '流程化处理Wirelist文件',
            path: 'tools/9.流程化处理wirelist/Excel处理工具_v3.3_自动下载版.html',
            icon: 'fas fa-cogs'
        }
    ],

    // 分类配置
    categories: [
        { id: 'all', name: '全部工具', icon: 'fas fa-th-large' },
        { id: 'analysis', name: '分析工具', icon: 'fas fa-chart-pie' },
        { id: 'comparison', name: '对比分析', icon: 'fas fa-balance-scale' },
        { id: 'generation', name: '生成工具', icon: 'fas fa-magic' },
        { id: 'calculation', name: '计算工具', icon: 'fas fa-calculator' },
        { id: 'check', name: '检查工具', icon: 'fas fa-check-double' },
        { id: 'automation', name: '自动化工具', icon: 'fas fa-robot' }
    ]
};

// ================================================
// 主题管理
// ================================================
const ThemeManager = {
    STORAGE_KEY: 'harness-master-theme',
    ICON_DARK: 'fas fa-moon',
    ICON_LIGHT: 'fas fa-sun',

    init() {
        this.themeToggle = document.getElementById('themeToggle');
        if (!this.themeToggle) return;

        // 恢复保存的主题
        this.restoreTheme();

        // 绑定点击事件
        this.themeToggle.addEventListener('click', () => this.toggle());
    },

    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        this.updateIcon(theme);
        this.updateSettingsPanel(theme);
        this.emitChange(theme);
    },

    restoreTheme() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(theme);
    },

    updateIcon(theme) {
        const icon = this.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? this.ICON_DARK : this.ICON_LIGHT;
        }
        if (this.themeToggle) {
            this.themeToggle.title = theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式';
        }
    },

    updateSettingsPanel(theme) {
        // 更新设置面板中的主题选项状态
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },

    emitChange(theme) {
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
    }
};

// ================================================
// 语言管理
// ================================================
const LangManager = {
    STORAGE_KEY: 'harness-master-lang',
    currentLang: 'zh',

    translations: {
        zh: {
            // 导航
            'login': '登录',
            // 工具箱页面
            'searchTools': '搜索工具...',
            'scanTools': '扫描工具',
            'exportConfig': '导出配置',
            // 分类
            'allTools': '全部工具',
            'analysisTools': '分析工具',
            'comparisonTools': '对比分析',
            'generationTools': '生成工具',
            'calculationTools': '计算工具',
            'checkTools': '检查工具',
            'automationTools': '自动化工具',
            // Toast消息
            'toolLoaded': '工具已加载',
            'toolLoadFailed': '工具加载失败',
            'favoriteAdded': '已收藏',
            'favoriteRemoved': '已取消收藏',
            'toolAdded': '工具已添加',
            'toolRemoved': '工具已移除',
            'configExported': '工具配置已导出',
            'scanComplete': '扫描完成',
            'welcome': '欢迎使用工具箱！按 / 键快速搜索工具',
            // 设置
            'theme': '主题模式',
            'darkMode': '暗黑',
            'lightMode': '明亮',
            'language': '语言',
            'zh': '中文',
            'en': 'English',
            // 工作区
            'toolWorkspace': '工具工作区',
            'selectTool': '选择一个工具开始使用',
            'loadingTool': '正在加载',
            'loadFailed': '工具加载失败',
            'checkPath': '请检查工具文件是否存在',
            'fullscreen': '全屏',
            'exitFullscreen': '退出全屏',
            'enterFullscreen': '已进入全屏模式',
            'exitFullscreenMode': '已退出全屏模式',
            // 空状态
            'noTools': '未找到工具',
            'trySearch': '尝试其他搜索词或分类',
            // 错误
            'toolNotFound': '工具不存在'
        },
        en: {
            // Navigation
            'login': 'Login',
            // Tools Page
            'searchTools': 'Search tools...',
            'scanTools': 'Scan Tools',
            'exportConfig': 'Export Config',
            // Categories
            'allTools': 'All Tools',
            'analysisTools': 'Analysis Tools',
            'comparisonTools': 'Comparison Tools',
            'generationTools': 'Generation Tools',
            'calculationTools': 'Calculation Tools',
            'checkTools': 'Check Tools',
            'automationTools': 'Automation Tools',
            // Toast Messages
            'toolLoaded': 'Tool loaded',
            'toolLoadFailed': 'Tool failed to load',
            'favoriteAdded': 'Added to favorites',
            'favoriteRemoved': 'Removed from favorites',
            'toolAdded': 'Tool added',
            'toolRemoved': 'Tool removed',
            'configExported': 'Configuration exported',
            'scanComplete': 'Scan complete',
            'welcome': 'Welcome! Press / to search tools quickly',
            // Settings
            'theme': 'Theme',
            'darkMode': 'Dark',
            'lightMode': 'Light',
            'language': 'Language',
            'zh': '中文',
            'en': 'English',
            // Workspace
            'toolWorkspace': 'Tool Workspace',
            'selectTool': 'Select a tool to start',
            'loadingTool': 'Loading',
            'loadFailed': 'Tool failed to load',
            'checkPath': 'Please check if the tool file exists',
            'fullscreen': 'Fullscreen',
            'exitFullscreen': 'Exit Fullscreen',
            'enterFullscreen': 'Entered fullscreen mode',
            'exitFullscreenMode': 'Exited fullscreen mode',
            // Empty State
            'noTools': 'No tools found',
            'trySearch': 'Try different search terms or categories',
            // Error
            'toolNotFound': 'Tool not found'
        }
    },

    init() {
        this.restoreLang();
        this.updateLangToggle();
    },

    setLang(lang) {
        this.currentLang = lang;
        localStorage.setItem(this.STORAGE_KEY, lang);
        this.applyTranslations();
        this.updateLangPanel(lang);
        this.emitChange(lang);
    },

    restoreLang() {
        const savedLang = localStorage.getItem(this.STORAGE_KEY);
        this.setLang(savedLang || 'zh');
    },

    t(key) {
        return this.translations[this.currentLang]?.[key] || this.translations.zh[key] || key;
    },

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // 更新占位符
        const searchInput = document.getElementById('toolsSearch');
        if (searchInput) {
            searchInput.placeholder = this.t('searchTools');
        }

        // 更新按钮文本
        const scanBtn = document.querySelector('button[onclick="scanForTools()"]');
        if (scanBtn) {
            scanBtn.innerHTML = `<i class="fas fa-sync-alt"></i> ${this.t('scanTools')}`;
        }

        const exportBtn = document.querySelector('button[onclick="exportToolsConfig()"]');
        if (exportBtn) {
            exportBtn.innerHTML = `<i class="fas fa-file-export"></i> ${this.t('exportConfig')}`;
        }

        // 更新工作区标题
        const toolName = document.getElementById('currentToolName');
        if (toolName && !toolName.innerHTML.includes('fa-')) {
            toolName.innerHTML = `<i class="fas fa-th-large"></i> ${this.t('toolWorkspace')}`;
        }
    },

    updateLangPanel(lang) {
        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    },

    updateLangToggle() {
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.title = this.currentLang === 'zh' ? 'Switch to English' : '切换到中文';
        }
    },

    emitChange(lang) {
        window.dispatchEvent(new CustomEvent('langChange', { detail: { lang } }));
    }
};

// ================================================
// 设置面板管理
// ================================================
const SettingsManager = {
    init() {
        this.panel = document.getElementById('settingsPanel');
        this.settingsBtn = document.getElementById('settingsBtn');

        if (!this.panel || !this.settingsBtn) return;

        // 点击设置按钮切换面板
        this.settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (!this.panel.contains(e.target) && e.target !== this.settingsBtn) {
                this.close();
            }
        });

        // ESC键关闭面板
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });

        // 初始化主题状态
        this.initThemeState();
    },

    toggle() {
        this.panel.classList.toggle('active');
        this.settingsBtn.classList.toggle('active');
    },

    close() {
        this.panel.classList.remove('active');
        if (this.settingsBtn) {
            this.settingsBtn.classList.remove('active');
        }
    },

    initThemeState() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.updateThemeState(currentTheme);
    },

    updateThemeState(theme) {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }
};

// ================================================
// 暴露全局函数
// ================================================
window.toggleSettingsPanel = function() {
    SettingsManager.toggle();
};

window.switchTheme = function(theme) {
    ThemeManager.setTheme(theme);
};

window.switchLang = function(lang) {
    LangManager.setLang(lang);
    SettingsManager.close();
};

window.toggleLangPanel = function() {
    // 直接切换语言
    const newLang = LangManager.currentLang === 'zh' ? 'en' : 'zh';
    LangManager.setLang(newLang);
};

// ================================================
// 工具分类映射
// ================================================
const CategoryMapping = {
    '对比分析': 'comparison',
    '生成工具': 'generation',
    '计算工具': 'calculation',
    '检查工具': 'check',
    '自动化工具': 'automation',
    '评审工具': 'check',
    '合并工具': 'generation',
    '选型工具': 'calculation',
    '分析工具': 'analysis',
    '处理工具': 'automation'
};

// ================================================
// 键盘快捷键管理
// ================================================
const ShortcutManager = {
    shortcuts: {
        '/': () => {
            const searchInput = document.getElementById('toolsSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        },
        Escape: () => {
            if (window.closeTool) {
                closeTool();
            }
        },
        'f': (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (window.toggleFullscreen) {
                    toggleFullscreen();
                }
            }
        }
    },

    init() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;

            // 跳过输入框中的快捷键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // 查找并执行快捷键
            const shortcutKey = ctrl && key === 'f' ? 'f' : key;
            if (this.shortcuts[shortcutKey] || (ctrl && this.shortcuts[key])) {
                const handler = this.shortcuts[shortcutKey] || this.shortcuts[key];
                if (handler) {
                    handler(e);
                }
            }
        });
    }
};

// ================================================
// 初始化工具加载器
// ================================================
function initToolsLoader() {
    console.log('工具加载器初始化...');

    // 初始化各模块
    ThemeManager.init();
    LangManager.init();
    SettingsManager.init();
    ShortcutManager.init();

    renderToolsGrid();
    setupToolsSearch();
    setupCategoryFilter();

    // 加载本地保存的工具
    loadCustomTools();

    // 显示欢迎提示
    showWelcomeToast();
}

// ================================================
// 欢迎提示
// ================================================
function showWelcomeToast() {
    const hasVisited = localStorage.getItem('hasVisitedTools');
    if (!hasVisited) {
        setTimeout(() => {
            showToast('欢迎使用工具箱！按 / 键快速搜索工具', 'info', 5000);
            localStorage.setItem('hasVisitedTools', 'true');
        }, 1000);
    }
}

// ================================================
// 渲染工具网格
// ================================================
function renderToolsGrid(category = 'all', searchTerm = '') {
    const toolsGrid = document.getElementById('toolsGrid');
    if (!toolsGrid) return;

    // 过滤工具
    let filteredTools = ToolsConfig.tools;

    if (category !== 'all') {
        const categoryKey = Object.keys(CategoryMapping).find(key =>
            CategoryMapping[key] === category
        );
        if (categoryKey) {
            filteredTools = filteredTools.filter(tool => tool.category === categoryKey);
        }
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredTools = filteredTools.filter(tool =>
            tool.name.toLowerCase().includes(term) ||
            tool.description.toLowerCase().includes(term) ||
            tool.category.toLowerCase().includes(term)
        );
    }

    // 空状态处理
    if (filteredTools.length === 0) {
        toolsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>未找到工具</h3>
                <p>尝试其他搜索词或分类</p>
            </div>
        `;
        return;
    }

    // 渲染工具卡片
    toolsGrid.innerHTML = filteredTools.map((tool, index) => `
        <div class="tool-card"
             data-tool-id="${tool.id}"
             data-category="${tool.category}"
             tabindex="0"
             role="button"
             aria-label="打开 ${tool.name}"
             onclick="openTool('${tool.id}')"
             onkeypress="if(event.key==='Enter')openTool('${tool.id}')"
             style="animation-delay: ${index * 0.05}s">
            <div class="tool-icon">
                <i class="${tool.icon}"></i>
            </div>
            <h3 class="tool-name">${tool.name}</h3>
            <p class="tool-description">${tool.description}</p>
            <div class="tool-tags">
                <span class="tag">${tool.category}</span>
            </div>
            <div class="tool-actions">
                <button class="btn-tool" onclick="event.stopPropagation();openTool('${tool.id}')">
                    <i class="fas fa-external-link-alt"></i>
                    打开工具
                </button>
                <button class="btn-icon-small" onclick="event.stopPropagation();favoriteTool('${tool.id}')" title="收藏">
                    <i class="far fa-star"></i>
                </button>
            </div>
        </div>
    `).join('');

    // 添加动画效果
    animateTools();
}

// ================================================
// 添加工具动画
// ================================================
function animateTools() {
    const cards = document.querySelectorAll('.tool-card:not(.animated)');
    cards.forEach((card, index) => {
        card.classList.add('animated');
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50 + 100);
    });
}

// ================================================
// 收藏工具
// ================================================
function favoriteTool(toolId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const tool = ToolsConfig.tools.find(t => t.id === toolId);
    if (!tool) return;

    const index = favorites.indexOf(toolId);
    if (index > -1) {
        favorites.splice(index, 1);
        showToast(`已取消收藏: ${tool.name}`, 'info');
    } else {
        favorites.push(toolId);
        showToast(`已收藏: ${tool.name}`, 'success');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// ================================================
// 打开工具
// ================================================
window.openTool = function(toolId) {
    const tool = ToolsConfig.tools.find(t => t.id === toolId);
    if (!tool) {
        console.error('工具不存在:', toolId);
        showToast('工具不存在', 'error');
        return;
    }

    // 打开工具工作区
    openToolWorkspace(tool);

    // 记录使用统计
    trackToolUsage(toolId);
};

// ================================================
// 记录工具使用统计
// ================================================
function trackToolUsage(toolId) {
    const stats = JSON.parse(localStorage.getItem('toolStats') || '{}');
    stats[toolId] = (stats[toolId] || 0) + 1;
    localStorage.setItem('toolStats', JSON.stringify(stats));
}

// ================================================
// 打开工具工作区
// ================================================
function openToolWorkspace(tool) {
    const workspace = document.getElementById('toolWorkspace');
    const content = document.getElementById('toolContent');
    const toolName = document.getElementById('currentToolName');

    if (!workspace || !content || !toolName) return;

    // 显示工作区
    workspace.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 更新工作区标题
    toolName.innerHTML = `<i class="${tool.icon}"></i> ${tool.name}`;

    // 显示加载状态
    content.innerHTML = `
        <div class="tool-loading">
            <div class="loading-spinner"></div>
            <p>正在加载 ${tool.name}...</p>
        </div>
    `;

    // 使用iframe嵌入工具 - 使用宽松的sandbox设置以支持更多功能
    content.innerHTML = `
        <div class="tool-iframe-container">
            <iframe
                id="toolFrame"
                src="${tool.path}"
                class="tool-iframe"
                allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                allowfullscreen
                onload="onToolLoaded()"
                onerror="onToolError('${tool.name}')"
            ></iframe>
        </div>
    `;

    // 记录打开历史
    recordToolHistory(tool);
}

// ================================================
// 工具加载完成
// ================================================
window.onToolLoaded = function() {
    console.log('工具加载完成');
    // 延迟显示成功提示，避免遮挡
    setTimeout(() => {
        showToast('工具已加载', 'success', 2000);
    }, 500);
};

// ================================================
// 工具加载错误
// ================================================
window.onToolError = function(toolName) {
    console.error('工具加载失败:', toolName);
    showToast(`工具 "${toolName}" 加载失败，请检查路径是否正确`, 'error');

    // 显示错误信息
    const content = document.getElementById('toolContent');
    if (content) {
        content.innerHTML = `
            <div class="tool-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>工具加载失败</h3>
                <p>无法加载工具 "${toolName}"</p>
                <p>请检查工具文件是否存在</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="closeTool()">
                        <i class="fas fa-times"></i>
                        关闭
                    </button>
                    <a href="${ToolsConfig.tools.find(t => t.name === toolName)?.path}"
                       target="_blank" class="btn btn-secondary">
                        <i class="fas fa-external-link-alt"></i>
                        在新窗口打开
                    </a>
                </div>
            </div>
        `;
    }
};

// ================================================
// 记录工具使用历史
// ================================================
function recordToolHistory(tool) {
    const history = JSON.parse(localStorage.getItem('toolHistory') || '[]');

    // 移除已存在的相同工具
    const filtered = history.filter(h => h.id !== tool.id);

    // 添加到开头
    filtered.unshift({
        id: tool.id,
        name: tool.name,
        path: tool.path,
        openedAt: new Date().toISOString()
    });

    // 只保留最近10个
    const trimmed = filtered.slice(0, 10);

    localStorage.setItem('toolHistory', JSON.stringify(trimmed));
}

// ================================================
// 加载使用历史
// ================================================
function loadToolHistory() {
    const history = JSON.parse(localStorage.getItem('toolHistory') || '[]');

    if (history.length > 0) {
        // 可以显示最近使用的工具
        console.log('最近使用:', history.slice(0, 5));
    }

    return history;
}

// ================================================
// 设置搜索功能
// ================================================
function setupToolsSearch() {
    const searchInput = document.getElementById('toolsSearch');
    if (!searchInput) return;

    let debounceTimer;

    searchInput.addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const activeCategory = document.querySelector('.category-filter.active')?.dataset.category || 'all';
            renderToolsGrid(activeCategory, e.target.value);
        }, 200);
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const activeCategory = document.querySelector('.category-filter.active')?.dataset.category || 'all';
            renderToolsGrid(activeCategory, e.target.value);
        }
    });

    // 清除搜索
    searchInput.addEventListener('search', function(e) {
        const activeCategory = document.querySelector('.category-filter.active')?.dataset.category || 'all';
        renderToolsGrid(activeCategory, '');
    });
}

// ================================================
// 设置分类筛选
// ================================================
function setupCategoryFilter() {
    const filterContainer = document.getElementById('categoryFilters');
    if (!filterContainer) return;

    // 渲染分类筛选器
    filterContainer.innerHTML = ToolsConfig.categories.map(cat => `
        <button class="category-filter ${cat.id === 'all' ? 'active' : ''}"
                data-category="${cat.id}"
                onclick="filterByCategory('${cat.id}')"
                aria-pressed="${cat.id === 'all'}">
            <i class="${cat.icon}"></i>
            <span>${cat.name}</span>
            <span class="count">${getCategoryCount(cat.id)}</span>
        </button>
    `).join('');
}

// ================================================
// 获取分类数量
// ================================================
function getCategoryCount(categoryId) {
    if (categoryId === 'all') return ToolsConfig.tools.length;

    const categoryKey = Object.keys(CategoryMapping).find(key =>
        CategoryMapping[key] === categoryId
    );
    if (!categoryKey) return 0;

    return ToolsConfig.tools.filter(tool => tool.category === categoryKey).length;
}

// ================================================
// 按分类筛选
// ================================================
window.filterByCategory = function(categoryId) {
    // 更新按钮状态
    document.querySelectorAll('.category-filter').forEach(btn => {
        const isActive = btn.dataset.category === categoryId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });

    // 获取搜索词
    const searchInput = document.getElementById('toolsSearch');
    const searchTerm = searchInput ? searchInput.value : '';

    // 渲染工具
    renderToolsGrid(categoryId, searchTerm);

    // 滚动到工具区域
    const toolsSection = document.querySelector('.tools-section');
    if (toolsSection) {
        toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// ================================================
// 加载自定义工具
// ================================================
function loadCustomTools() {
    const customTools = JSON.parse(localStorage.getItem('customTools') || '[]');

    if (customTools.length > 0) {
        // 将自定义工具添加到工具列表
        customTools.forEach(tool => {
            // 检查是否已存在
            if (!ToolsConfig.tools.some(t => t.id === `custom-${tool.name}`)) {
                ToolsConfig.tools.push({
                    id: `custom-${tool.name}`,
                    name: tool.name,
                    category: '自定义工具',
                    description: '用户自定义上传的工具',
                    path: `data:text/html;charset=utf-8,${encodeURIComponent(tool.content)}`,
                    icon: 'fas fa-code',
                    isCustom: true
                });
            }
        });
    }
}

// ================================================
// 添加自定义工具
// ================================================
window.addCustomTool = function(name, content, description = '自定义工具') {
    const tool = {
        id: `custom-${Date.now()}`,
        name: name,
        category: '自定义工具',
        description: description,
        path: `data:text/html;charset=utf-8,${encodeURIComponent(content)}`,
        icon: 'fas fa-code',
        isCustom: true,
        createdAt: new Date().toISOString()
    };

    ToolsConfig.tools.push(tool);

    // 保存到本地存储
    const customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
    customTools.push({
        name: name,
        content: content,
        description: description,
        createdAt: tool.createdAt
    });
    localStorage.setItem('customTools', JSON.stringify(customTools));

    // 重新渲染工具网格
    renderToolsGrid();

    showToast(`工具 "${name}" 已添加`, 'success');

    return tool;
};

// ================================================
// 移除自定义工具
// ================================================
window.removeCustomTool = function(toolId) {
    const toolIndex = ToolsConfig.tools.findIndex(t => t.id === toolId);
    if (toolIndex === -1) return;

    const tool = ToolsConfig.tools[toolIndex];
    if (!tool.isCustom) {
        showToast('只能移除自定义工具', 'warning');
        return;
    }

    // 从工具列表移除
    ToolsConfig.tools.splice(toolIndex, 1);

    // 从本地存储移除
    const customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
    const filtered = customTools.filter(t => t.name !== tool.name);
    localStorage.setItem('customTools', JSON.stringify(filtered));

    // 重新渲染
    renderToolsGrid();

    showToast(`工具 "${tool.name}" 已移除`, 'success');
};

// ================================================
// 导出工具配置
// ================================================
window.exportToolsConfig = function() {
    const config = {
        tools: ToolsConfig.tools,
        exportedAt: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'harness-tools-config.json';
    a.click();
    URL.revokeObjectURL(url);

    showToast('工具配置已导出', 'success');
};

// ================================================
// 扫描工具文件夹（需要服务器支持）
// ================================================
async function scanToolsFolder() {
    try {
        const response = await fetch('Tools/scan.php');
        if (!response.ok) throw new Error('扫描失败');

        const data = await response.json();

        if (data.success && data.tools) {
            // 更新工具列表
            data.tools.forEach(newTool => {
                if (!ToolsConfig.tools.some(t => t.path === newTool.path)) {
                    ToolsConfig.tools.push(newTool);
                }
            });

            renderToolsGrid();
            showToast(`扫描完成，发现 ${data.tools.length} 个工具`, 'success');
        }
    } catch (error) {
        console.error('扫描工具文件夹失败:', error);
        // 静默失败，不显示错误
    }
}

// ================================================
// Toast 通知系统
// ================================================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // 自动移除
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

// ================================================
// 关闭工具工作区
// ================================================
window.closeTool = function() {
    const workspace = document.getElementById('toolWorkspace');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // 如果浏览器处于全屏状态，先退出全屏
    const isBrowserFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
    );

    if (isBrowserFullscreen) {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    if (workspace) {
        workspace.classList.remove('active');
        workspace.classList.remove('fullscreen');
        document.body.style.overflow = '';
    }

    // 重置全屏按钮状态
    if (fullscreenBtn) {
        const icon = fullscreenBtn.querySelector('i');
        if (icon) {
            icon.className = 'fas fa-expand';
        }
        fullscreenBtn.classList.remove('fullscreen-mode');
        fullscreenBtn.title = '全屏 (Ctrl+F)';
    }
};

// ================================================
// 全屏切换
// ================================================
window.toggleFullscreen = function() {
    const workspace = document.getElementById('toolWorkspace');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (!workspace) return;

    const isFullscreen = workspace.classList.contains('fullscreen');

    if (!isFullscreen) {
        // 进入全屏
        workspace.classList.add('fullscreen');

        // 尝试使用浏览器全屏API
        const elem = workspace;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        // 退出全屏
        workspace.classList.remove('fullscreen');

        // 退出浏览器全屏
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    // 切换图标
    const icon = fullscreenBtn.querySelector('i');
    if (icon) {
        icon.className = !isFullscreen ? 'fas fa-compress-alt' : 'fas fa-expand';
    }

    // 更新按钮状态
    fullscreenBtn.classList.toggle('fullscreen-mode', !isFullscreen);
    fullscreenBtn.title = !isFullscreen ? '退出全屏 (Ctrl+F)' : '全屏 (Ctrl+F)';

    showToast(!isFullscreen ? '已进入全屏模式' : '已退出全屏模式', 'info', 2000);
};

// 监听浏览器全屏状态变化
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);

function handleFullscreenChange() {
    const workspace = document.getElementById('toolWorkspace');
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    if (!workspace || !fullscreenBtn) return;

    const isBrowserFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
    );

    // 同步状态
    workspace.classList.toggle('fullscreen', isBrowserFullscreen);

    const icon = fullscreenBtn.querySelector('i');
    if (icon) {
        icon.className = isBrowserFullscreen ? 'fas fa-compress-alt' : 'fas fa-expand';
    }

    fullscreenBtn.classList.toggle('fullscreen-mode', isBrowserFullscreen);
    fullscreenBtn.title = isBrowserFullscreen ? '退出全屏 (Ctrl+F)' : '全屏 (Ctrl+F)';
}

// ================================================
// 初始化
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    initToolsLoader();

    // 点击页面其他地方关闭设置面板
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('settingsPanel');
        const btn = document.getElementById('settingsBtn');
        if (panel && btn && !panel.contains(e.target) && e.target !== btn) {
            panel.classList.remove('active');
            btn.classList.remove('active');
        }
    });
});

// 添加退出动画CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes toastOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    .btn-icon-small {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-glass);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .btn-icon-small:hover {
        background: var(--bg-hover);
        color: var(--primary-cyan);
        border-color: var(--primary-cyan);
    }

    .tool-actions {
        display: flex;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
    }

    .tool-actions .btn-tool {
        flex: 1;
    }

    .tool-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 300px;
        gap: var(--spacing-md);
    }

    .loading-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid var(--border-primary);
        border-top-color: var(--primary-cyan);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-actions {
        display: flex;
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
    }

    .empty-state {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-3xl);
        text-align: center;
        color: var(--text-tertiary);
    }

    .empty-state i {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
        opacity: 0.3;
    }

    .empty-state h3 {
        font-size: 1.5rem;
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary);
    }

    .category-filter .count {
        background: var(--bg-glass);
        padding: 2px 8px;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    .category-filter.active .count {
        background: var(--primary-cyan);
        color: var(--bg-primary);
    }
`;
document.head.appendChild(style);