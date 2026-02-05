/**
 * 线束大师 - 汽车线束设计自动化平台
 * 主JavaScript文件
 */

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

        this.restoreTheme();

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
    },

    updateSettingsPanel(theme) {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
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
            'login': '登录',
            'theme': '主题模式',
            'darkMode': '暗黑',
            'lightMode': '明亮',
            'language': '语言',
            'zh': '中文',
            'en': 'English'
        },
        en: {
            'login': 'Login',
            'theme': 'Theme',
            'darkMode': 'Dark',
            'lightMode': 'Light',
            'language': 'Language',
            'zh': '中文',
            'en': 'English'
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
    }
};

// ================================================
// 设置面板管理
// ================================================
const SettingsManager = {
    init() {
        this.panel = document.getElementById('settingsPanel');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.overlayMask = document.getElementById('overlayMask');

        if (!this.panel || !this.settingsBtn) {
            console.warn('设置面板元素未找到');
            return;
        }

        // 点击设置按钮切换面板
        this.settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });

        // ESC键关闭面板
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });

        this.initThemeState();
        console.log('设置面板初始化完成');
    },

    toggle() {
        if (!this.panel || !this.settingsBtn) return;
        const isActive = this.panel.classList.contains('active');

        if (isActive) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        if (!this.panel) return;
        this.panel.classList.add('active');
        this.settingsBtn?.classList.add('active');
        if (this.overlayMask) {
            this.overlayMask.classList.add('active');
        }
    },

    close() {
        if (this.panel) {
            this.panel.classList.remove('active');
        }
        if (this.settingsBtn) {
            this.settingsBtn.classList.remove('active');
        }
        if (this.overlayMask) {
            this.overlayMask.classList.remove('active');
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

// 全局关闭函数
window.closeSettingsPanel = function(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    SettingsManager.close();
};

window.closeAllPanels = function() {
    SettingsManager.close();
    AccountManager.closeAccountPanel();
};

// ================================================
// 账户管理
// ================================================
const AccountManager = {
    STORAGE_KEY: 'harness-master-user',
    USERS_KEY: 'harness-users',

    init() {
        this.accountPanel = document.getElementById('accountPanel');
        this.accountSection = document.getElementById('accountSection');
        this.updateUI();
        this.initAdminUser();
    },

    // 初始化管理员账户
    initAdminUser() {
        const users = this.getUsers();
        // 检查是否存在管理员
        const adminExists = users.some(u => u.email === 'admin@harness.com');
        if (!adminExists) {
            users.push({
                username: '管理员',
                email: 'admin@harness.com',
                password: 'admin123',
                role: 'admin',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        }
    },

    // 获取所有用户
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    },

    // 保存用户列表
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    // 检查是否为管理员
    isAdmin() {
        const user = this.getUser();
        if (!user) return false;

        // 检查本地存储中的用户角色
        if (user.role === 'admin') return true;

        // 从用户列表中重新获取最新信息
        const users = this.getUsers();
        const fullUser = users.find(u => u.email === user.email);
        return fullUser && fullUser.role === 'admin';
    },

    // 更新管理员菜单显示
    updateAdminMenu() {
        const adminMenu = document.getElementById('adminMenuItem');
        const logoutBtn = document.getElementById('logoutBtn');
        const footerLogout = document.getElementById('footerLogoutSection');
        const loginBtn = document.getElementById('loginBtn');
        const isLoggedIn = this.isLoggedIn();

        if (adminMenu) {
            const isAdminUser = this.isAdmin();
            adminMenu.style.display = isAdminUser ? 'flex' : 'none';
        }

        // 显示/隐藏账户区域的退出按钮
        if (logoutBtn) {
            logoutBtn.style.display = isLoggedIn ? 'flex' : 'none';
        }

        // 显示/隐藏底部退出按钮
        if (footerLogout) {
            footerLogout.style.display = isLoggedIn ? 'block' : 'none';
        }

        // 更新登录按钮状态
        if (loginBtn) {
            const loginSpan = loginBtn.querySelector('[data-i18n="login"]');
            if (loginSpan) {
                if (isLoggedIn) {
                    loginSpan.textContent = '个人中心';
                    loginBtn.onclick = function() {
                        SettingsManager.open();
                        AccountManager.showLoggedInPanel();
                    };
                } else {
                    loginSpan.textContent = '登录';
                    loginBtn.onclick = function() {
                        SettingsManager.open();
                        AccountManager.showLoginForm();
                    };
                }
            }
        }

        // 隐藏/显示账户面板的退出按钮（如果存在）
        const userLogoutBtn = document.getElementById('userLogoutBtn');
        if (userLogoutBtn) {
            userLogoutBtn.style.display = isLoggedIn ? 'flex' : 'none';
        }
    },

    // 检查是否已登录
    isLoggedIn() {
        const user = localStorage.getItem(this.STORAGE_KEY);
        return user !== null;
    },

    // 获取当前用户信息
    getUser() {
        const user = localStorage.getItem(this.STORAGE_KEY);
        return user ? JSON.parse(user) : null;
    },

    // 更新UI显示
    updateUI() {
        const user = this.getUser();
        const accountName = document.getElementById('accountName');
        const accountEmail = document.getElementById('accountEmail');
        const loginStatus = document.getElementById('loginStatus');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loggedInPanel = document.getElementById('loggedInPanel');
        const changePasswordForm = document.getElementById('changePasswordForm');

        if (user) {
            // 已登录状态
            if (accountName) accountName.textContent = user.username || '用户';
            if (accountEmail) accountEmail.textContent = user.email || '';
            if (loginStatus) {
                loginStatus.textContent = '已登录';
                loginStatus.classList.remove('not-logged-in');
            }

            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'none';
            if (loggedInPanel) loggedInPanel.style.display = 'flex';

            // 更新登录后的用户信息
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            if (userName) userName.textContent = user.username || '用户';
            if (userEmail) userEmail.textContent = user.email || '';

            // 更新管理员菜单显示
            this.updateAdminMenu();
        } else {
            // 未登录状态
            if (accountName) accountName.textContent = '未登录';
            if (accountEmail) accountEmail.textContent = '点击登录账户';
            if (loginStatus) {
                loginStatus.textContent = '未登录';
                loginStatus.classList.add('not-logged-in');
            }

            if (loginForm) loginForm.style.display = 'flex';
            if (registerForm) registerForm.style.display = 'none';
            if (loggedInPanel) loggedInPanel.style.display = 'none';
        }

        // 重置所有子面板
        if (changePasswordForm) changePasswordForm.style.display = 'none';
    },

    // 切换账户面板
    toggleAccountPanel() {
        if (!this.accountPanel) return;

        const isActive = this.accountPanel.classList.contains('active');

        if (isActive) {
            this.closeAccountPanel();
        } else {
            this.accountPanel.classList.add('active');
            this.accountSection.style.display = 'none';
            this.showLoginForm();
        }
    },

    // 关闭账户面板
    closeAccountPanel() {
        if (!this.accountPanel) return;
        this.accountPanel.classList.remove('active');
        this.accountSection.style.display = 'flex';
    },

    // 显示登录表单
    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loggedInPanel = document.getElementById('loggedInPanel');
        const changePasswordForm = document.getElementById('changePasswordForm');

        if (loginForm) loginForm.style.display = 'flex';
        if (registerForm) registerForm.style.display = 'none';
        if (loggedInPanel) loggedInPanel.style.display = 'none';
        if (changePasswordForm) changePasswordForm.style.display = 'none';
    },

    // 显示注册表单
    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'flex';
    },

    // 显示已登录面板
    showLoggedInPanel() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loggedInPanel = document.getElementById('loggedInPanel');
        const changePasswordForm = document.getElementById('changePasswordForm');
        const userManagementPanel = document.getElementById('userManagementPanel');

        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'none';
        if (changePasswordForm) changePasswordForm.style.display = 'none';
        if (userManagementPanel) userManagementPanel.style.display = 'none';
        if (loggedInPanel) loggedInPanel.style.display = 'flex';
    },

    // 处理登录
    handleLogin() {
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            showToast('请输入邮箱和密码', 'warning');
            return;
        }

        // 模拟登录（实际应用中应调用后端API）
        const users = JSON.parse(localStorage.getItem('harness-users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // 检查用户状态
            if (user.status === 'disabled') {
                showToast('账户已被禁用，请联系管理员', 'error');
                return;
            }

            // 保存登录状态
            const loginUser = { username: user.username, email: user.email, role: user.role };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(loginUser));

            // 先显示已登录面板
            const loginForm = document.getElementById('loginForm');
            const loggedInPanel = document.getElementById('loggedInPanel');
            if (loginForm) loginForm.style.display = 'none';
            if (loggedInPanel) loggedInPanel.style.display = 'flex';

            // 更新UI显示管理员菜单和退出按钮
            this.updateAdminMenu();

            // 解锁网站
            SiteLock.unlock();

            this.toggleAccountPanel();
            SettingsManager.close();
            showToast('登录成功', 'success');

            // 清空表单
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        } else {
            showToast('邮箱或密码错误', 'error');
        }
    },

    // 处理注册
    handleRegister() {
        const username = document.getElementById('regUsername')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;

        if (!username || !email || !password || !passwordConfirm) {
            showToast('请填写完整信息', 'warning');
            return;
        }

        if (password !== passwordConfirm) {
            showToast('两次输入的密码不一致', 'warning');
            return;
        }

        if (password.length < 6) {
            showToast('密码长度至少6位', 'warning');
            return;
        }

        // 检查邮箱是否已存在
        const users = JSON.parse(localStorage.getItem('harness-users') || '[]');
        if (users.find(u => u.email === email)) {
            showToast('该邮箱已被注册', 'error');
            return;
        }

        // 保存新用户
        users.push({ username, email, password, role: 'user', status: 'active', createdAt: new Date().toISOString() });
        localStorage.setItem('harness-users', JSON.stringify(users));

        // 自动登录
        const loginUser = { username, email, role: 'user' };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(loginUser));
        this.updateUI();

        // 解锁网站
        SiteLock.unlock();

        this.toggleAccountPanel();
        SettingsManager.close();
        showToast('注册成功', 'success');

        // 清空表单
        document.getElementById('regUsername').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPasswordConfirm').value = '';
    },

    // 显示修改密码表单
    showChangePassword() {
        const changePasswordForm = document.getElementById('changePasswordForm');
        const loggedInPanel = document.getElementById('loggedInPanel');

        if (changePasswordForm) changePasswordForm.style.display = 'flex';
        if (loggedInPanel) loggedInPanel.style.display = 'none';
    },

    // 显示修改邮箱表单
    showChangeEmail() {
        showToast('修改邮箱功能开发中', 'info');
    },

    // 处理修改密码
    handleChangePassword() {
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmNewPassword = document.getElementById('confirmNewPassword')?.value;
        const user = this.getUser();

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showToast('请填写完整信息', 'warning');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showToast('两次输入的新密码不一致', 'warning');
            return;
        }

        if (newPassword.length < 6) {
            showToast('新密码长度至少6位', 'warning');
            return;
        }

        // 验证当前密码
        const users = JSON.parse(localStorage.getItem('harness-users') || '[]');
        const userIndex = users.findIndex(u => u.email === user.email);

        if (userIndex === -1 || users[userIndex].password !== currentPassword) {
            showToast('当前密码错误', 'error');
            return;
        }

        // 更新密码
        users[userIndex].password = newPassword;
        localStorage.setItem('harness-users', JSON.stringify(users));

        showToast('密码修改成功', 'success');

        // 清空表单并返回
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';

        this.showLoginForm();
    },

    // 处理退出登录
    handleLogout() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateUI();
        this.toggleAccountPanel();
        SettingsManager.close();
        showToast('已退出登录', 'info');
    },

    // ==================== 用户管理功能 ====================

    // 显示用户管理面板
    showUserManagement() {
        const userManagementPanel = document.getElementById('userManagementPanel');
        const loggedInPanel = document.getElementById('loggedInPanel');
        const changePasswordForm = document.getElementById('changePasswordForm');

        if (userManagementPanel) {
            userManagementPanel.style.display = 'flex';
            loggedInPanel.style.display = 'none';
            changePasswordForm.style.display = 'none';
            this.renderUserList();
        }
    },

    // 返回用户面板
    backToUserPanel() {
        const userManagementPanel = document.getElementById('userManagementPanel');
        const loggedInPanel = document.getElementById('loggedInPanel');

        if (userManagementPanel) {
            userManagementPanel.style.display = 'none';
            loggedInPanel.style.display = 'flex';
        }
    },

    // 渲染用户列表
    renderUserList() {
        const userListContainer = document.getElementById('userListContainer');
        if (!userListContainer) return;

        const users = this.getUsers();
        const currentUser = this.getUser();

        let html = `
            <div class="user-list-header">
                <span>用户列表 (${users.length})</span>
            </div>
        `;

        users.forEach((user, index) => {
            const isCurrentUser = user.email === currentUser?.email;
            const isAdmin = user.role === 'admin';
            const statusClass = user.status === 'disabled' ? 'user-disabled' : '';
            const statusText = user.status === 'disabled' ? '(已禁用)' : '';

            html += `
                <div class="user-item ${statusClass}">
                    <div class="user-item-info">
                        <div class="user-item-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-item-details">
                            <span class="user-item-name">${user.username} ${statusText} ${isAdmin ? '<span class="admin-badge">管理员</span>' : ''}</span>
                            <span class="user-item-email">${user.email}</span>
                        </div>
                    </div>
                    <div class="user-item-actions">
                        <button class="btn-icon-sm" onclick="AccountManager.showChangeUserPasswordForm('${user.email}')" title="修改密码">
                            <i class="fas fa-key"></i>
                        </button>
                        ${!isCurrentUser ? `
                            <button class="btn-icon-sm" onclick="AccountManager.toggleUserStatus('${user.email}')" title="${user.status === 'disabled' ? '启用用户' : '禁用用户'}">
                                <i class="fas ${user.status === 'disabled' ? 'fa-check' : 'fa-ban'}"></i>
                            </button>
                            ${!isAdmin ? `
                                <button class="btn-icon-sm danger" onclick="AccountManager.deleteUser('${user.email}')" title="删除用户">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        ` : '<span class="current-badge">当前</span>'}
                    </div>
                </div>
            `;
        });

        userListContainer.innerHTML = html;
    },

    // 切换用户状态（禁用/启用）
    toggleUserStatus(email) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex !== -1) {
            const user = users[userIndex];
            if (user.role === 'admin') {
                showToast('无法禁用管理员账户', 'error');
                return;
            }

            users[userIndex].status = users[userIndex].status === 'disabled' ? 'active' : 'disabled';
            this.saveUsers(users);
            this.renderUserList();
            showToast(`${users[userIndex].status === 'disabled' ? '已禁用' : '已启用'}用户: ${user.username}`, 'success');
        }
    },

    // 删除用户
    deleteUser(email) {
        const user = this.getUser();
        if (!user || user.role !== 'admin') {
            showToast('只有管理员可以删除用户', 'error');
            return;
        }

        const targetUser = this.getUsers().find(u => u.email === email);
        if (!targetUser) {
            showToast('用户不存在', 'error');
            return;
        }

        if (targetUser.role === 'admin') {
            showToast('无法删除管理员账户', 'error');
            return;
        }

        if (confirm(`确定要删除用户 "${targetUser.username}" 吗？此操作不可恢复。`)) {
            const users = this.getUsers().filter(u => u.email !== email);
            this.saveUsers(users);
            this.renderUserList();
            showToast(`已删除用户: ${targetUser.username}`, 'success');
        }
    },

    // ==================== 新增用户功能 ====================

    // 显示新增用户表单
    showAddUserForm() {
        const addUserForm = document.getElementById('addUserForm');
        const userListContainer = document.getElementById('userListContainer');

        if (addUserForm) {
            addUserForm.style.display = 'block';
            if (userListContainer) userListContainer.style.display = 'none';
        }
    },

    // 隐藏新增用户表单
    hideAddUserForm() {
        const addUserForm = document.getElementById('addUserForm');
        const userListContainer = document.getElementById('userListContainer');

        if (addUserForm) {
            addUserForm.style.display = 'none';
            // 清空表单
            document.getElementById('addUserUsername').value = '';
            document.getElementById('addUserEmail').value = '';
            document.getElementById('addUserPassword').value = '';
            document.getElementById('addUserRole').value = 'user';
        }
        if (userListContainer) userListContainer.style.display = 'block';
    },

    // 处理新增用户
    handleAddUser() {
        const username = document.getElementById('addUserUsername')?.value.trim();
        const email = document.getElementById('addUserEmail')?.value.trim();
        const password = document.getElementById('addUserPassword')?.value;
        const role = document.getElementById('addUserRole')?.value;

        // 验证输入
        if (!username || !email || !password) {
            showToast('请填写完整信息', 'warning');
            return;
        }

        if (password.length < 6) {
            showToast('密码长度至少6位', 'warning');
            return;
        }

        // 检查邮箱是否已存在
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            showToast('该邮箱已被注册', 'error');
            return;
        }

        // 创建新用户
        const newUser = {
            username,
            email,
            password,
            role,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        // 清空表单并返回用户列表
        this.hideAddUserForm();
        this.renderUserList();
        showToast(`用户 "${username}" 创建成功`, 'success');
    },

    // ==================== 修改用户密码功能 ====================
    currentEditEmail: null,

    // 显示修改密码表单
    showChangeUserPasswordForm(email) {
        const form = document.getElementById('changeUserPasswordForm');
        const userListContainer = document.getElementById('userListContainer');
        const emailDisplay = document.getElementById('changePasswordUserEmail');

        if (form) {
            this.currentEditEmail = email;
            // 显示用户邮箱
            if (emailDisplay) {
                emailDisplay.textContent = email;
            }
            // 清空密码输入
            document.getElementById('newUserPassword').value = '';
            document.getElementById('confirmNewUserPassword').value = '';
            form.style.display = 'block';
            if (userListContainer) userListContainer.style.display = 'none';
        }
    },

    // 隐藏修改密码表单
    hideChangeUserPasswordForm() {
        const form = document.getElementById('changeUserPasswordForm');
        const userListContainer = document.getElementById('userListContainer');

        if (form) {
            form.style.display = 'none';
            this.currentEditEmail = null;
        }
        if (userListContainer) userListContainer.style.display = 'block';
    },

    // 处理修改密码
    handleChangeUserPassword() {
        const newPassword = document.getElementById('newUserPassword')?.value;
        const confirmPassword = document.getElementById('confirmNewUserPassword')?.value;
        const email = this.currentEditEmail;

        if (!newPassword || !confirmPassword) {
            showToast('请填写完整信息', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('两次输入的密码不一致', 'warning');
            return;
        }

        if (newPassword.length < 6) {
            showToast('密码长度至少6位', 'warning');
            return;
        }

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            this.saveUsers(users);
            this.hideChangeUserPasswordForm();
            this.renderUserList();
            showToast(`已修改用户密码: ${users[userIndex].username}`, 'success');
        } else {
            showToast('用户不存在', 'error');
        }
    }
};

// 暴露全局函数
window.toggleAccountPanel = function() {
    AccountManager.toggleAccountPanel();
};

window.showLoginForm = function() {
    AccountManager.showLoginForm();
};

window.showRegisterForm = function() {
    AccountManager.showRegisterForm();
};

window.handleLogin = function() {
    AccountManager.handleLogin();
};

window.handleRegister = function() {
    AccountManager.handleRegister();
};

window.showChangePassword = function() {
    AccountManager.showChangePassword();
};

window.showChangeEmail = function() {
    AccountManager.showChangeEmail();
};

window.handleChangePassword = function() {
    AccountManager.handleChangePassword();
};

window.handleLogout = function() {
    AccountManager.handleLogout();
};

window.showUserManagement = function() {
    AccountManager.showUserManagement();
};

window.backToUserPanel = function() {
    AccountManager.backToUserPanel();
};

window.showAddUserForm = function() {
    AccountManager.showAddUserForm();
};

window.hideAddUserForm = function() {
    AccountManager.hideAddUserForm();
};

window.handleAddUser = function() {
    AccountManager.handleAddUser();
};

window.showChangeUserPasswordForm = function(email) {
    AccountManager.showChangeUserPasswordForm(email);
};

window.hideChangeUserPasswordForm = function() {
    AccountManager.hideChangeUserPasswordForm();
};

window.handleChangeUserPassword = function() {
    AccountManager.handleChangeUserPassword();
};

// 锁定屏幕登录
window.handleLockLogin = function() {
    const email = document.getElementById('lockLoginEmail')?.value.trim();
    const password = document.getElementById('lockLoginPassword')?.value;

    if (!email || !password) {
        showToast('请输入邮箱和密码', 'warning');
        return;
    }

    const users = JSON.parse(localStorage.getItem('harness-users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        if (user.status === 'disabled') {
            showToast('账户已被禁用，请联系管理员', 'error');
            return;
        }

        const loginUser = { username: user.username, email: user.email, role: user.role };
        localStorage.setItem(AccountManager.STORAGE_KEY, JSON.stringify(loginUser));

        SiteLock.unlock();
        showToast('登录成功', 'success');

        document.getElementById('lockLoginEmail').value = '';
        document.getElementById('lockLoginPassword').value = '';
    } else {
        showToast('邮箱或密码错误', 'error');
    }
};

// ================================================
// 全局函数
// ================================================
window.openSettingsAndLogin = function() {
    SettingsManager.open();
    AccountManager.showLoginForm();
};

window.switchTheme = function(theme) {
    ThemeManager.setTheme(theme);
};

window.switchLang = function(lang) {
    LangManager.setLang(lang);
    SettingsManager.close();
};

window.toggleLang = function() {
    const newLang = LangManager.currentLang === 'zh' ? 'en' : 'zh';
    LangManager.setLang(newLang);
};

// ================================================
// 网页加密/访问控制
// ================================================
const SiteLock = {
    LOCK_KEY: 'harness-site-locked',
    LOCK_ENABLED: true,

    init() {
        if (!this.LOCK_ENABLED) return;

        const isLoggedIn = AccountManager.isLoggedIn();
        const currentUser = AccountManager.getUser();

        // 检查用户是否被禁用
        if (currentUser && currentUser.status === 'disabled') {
            AccountManager.handleLogout();
            showToast('您的账户已被禁用，请联系管理员', 'error');
            this.showLockScreen('账户已禁用', '您的账户已被管理员禁用，请联系管理员。');
            localStorage.setItem(this.LOCK_KEY, 'true');
            return;
        }

        if (isLoggedIn) {
            // 已登录，解锁网站
            this.unlock();
        } else {
            // 未登录，显示锁定屏幕
            this.showLockScreen();
            localStorage.setItem(this.LOCK_KEY, 'true');
        }
    },

    showLockScreen(title = '请先登录', message = '需要登录后才能访问此网站') {
        const lockScreen = document.getElementById('lockScreen');

        if (lockScreen) {
            lockScreen.style.display = 'flex';
            const lockTitle = lockScreen.querySelector('.lock-title');
            const lockMessage = lockScreen.querySelector('.lock-message');
            if (lockTitle) lockTitle.textContent = title;
            if (lockMessage) lockMessage.textContent = message;
        }

        this.hideMainContent(true);

        // 显示设置面板的登录表单
        setTimeout(() => {
            SettingsManager.open();
            AccountManager.showLoginForm();
        }, 300);
    },

    hideMainContent(hidden) {
        const elements = document.querySelectorAll('.main-content, .tools-page, main, .hero-section, .tools-section, .footer, .navbar');
        elements.forEach(el => {
            if (el) {
                el.style.display = hidden ? 'none' : '';
            }
        });
    },

    unlock() {
        const lockScreen = document.getElementById('lockScreen');
        if (lockScreen) {
            lockScreen.style.display = 'none';
        }
        localStorage.setItem(this.LOCK_KEY, 'false');
        this.hideMainContent(false);
    }
};

// ================================================
// DOM加载完成后初始化
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    // 检查关键元素是否存在
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const accountPanel = document.getElementById('accountPanel');

    console.log('设置按钮:', settingsBtn ? '存在' : '不存在');
    console.log('设置面板:', settingsPanel ? '存在' : '不存在');
    console.log('账户面板:', accountPanel ? '存在' : '不存在');

    ThemeManager.init();
    LangManager.init();
    SettingsManager.init();
    AccountManager.init();

    // 初始化网站锁定功能
    SiteLock.init();

    initNavigation();
    initScrollEffects();
    initCountUpAnimation();
    initFormHandling();
    initFileUpload();
    initToolWorkspace();
    initModal();
    initComments();
    initChat();
});

// ================================================
// 导航栏功能
// ================================================
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    // 滚动效果
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // 移动端菜单
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // 平滑滚动到指定区域
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // 更新活动链接状态
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
    
    // 滚动监听更新活动链接
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ================================================
// 滚动效果
// ================================================
function initScrollEffects() {
    // 元素进入视口动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    document.querySelectorAll('.tool-card, .info-card, .comment-item').forEach(el => {
        observer.observe(el);
    });
}

// ================================================
// 数字递增动画
// ================================================
function initCountUpAnimation() {
    const stats = document.querySelectorAll('.stat-number');
    let animated = false;

    const animateNumbers = () => {
        stats.forEach(stat => {
            const target = parseInt(stat.dataset.count);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    stat.textContent = target.toLocaleString() + '+';
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current).toLocaleString();
                }
            }, 16);
        });
    };

    // 当英雄区域进入视口时触发动画
    const heroSection = document.querySelector('.hero-section');
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !animated) {
            animated = true;
            setTimeout(animateNumbers, 500);
        }
    }, { threshold: 0.5 });

    if (heroSection) {
        observer.observe(heroSection);
    }
}

// ================================================
// 表单处理
// ================================================
function initFormHandling() {
    const form = document.getElementById('requirementsForm');
    
    if (!form) return;
    
    // 表单步骤切换
    window.nextStep = function(step) {
        const currentStep = document.querySelector('.form-step.active');
        const nextStepEl = document.getElementById(`step${step}`);
        
        // 验证当前步骤
        if (currentStep && !validateStep(currentStep, step - 1)) {
            return;
        }
        
        if (currentStep) {
            currentStep.classList.remove('active');
            setTimeout(() => {
                if (nextStepEl) {
                    nextStepEl.classList.add('active');
                    updateStepIndicators(step);
                    if (step === 3) {
                        generateSummary();
                    }
                }
            }, 100);
        }
    };
    
    window.prevStep = function(step) {
        const currentStep = document.querySelector('.form-step.active');
        const prevStepEl = document.getElementById(`step${step}`);
        
        if (currentStep && prevStepEl) {
            currentStep.classList.remove('active');
            setTimeout(() => {
                prevStepEl.classList.add('active');
                updateStepIndicators(step);
            }, 100);
        }
    };
    
    // 更新步骤指示器
    function updateStepIndicators(activeStep) {
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 <= activeStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
    
    // 验证单个步骤
    function validateStep(stepEl, stepNumber) {
        const inputs = stepEl.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                highlightError(input);
            } else {
                removeError(input);
            }
        });
        
        if (!isValid) {
            showToast('请填写所有必填项', 'error');
        }
        
        return isValid;
    }
    
    // 高亮错误
    function highlightError(input) {
        input.style.borderColor = '#ef4444';
        input.addEventListener('input', function() {
            this.style.borderColor = '';
        }, { once: true });
    }
    
    // 移除错误样式
    function removeError(input) {
        input.style.borderColor = '';
    }
    
    // 生成摘要
    function generateSummary() {
        const summaryContent = document.getElementById('summaryContent');
        if (!summaryContent) return;
        
        const projectName = document.getElementById('projectName').value;
        const projectType = document.getElementById('projectType');
        const projectTypeText = projectType.options[projectType.selectedIndex].text;
        const priority = document.getElementById('priority');
        const priorityText = priority.options[priority.selectedIndex].text;
        const description = document.getElementById('description').value;
        const voltage = document.getElementById('voltage');
        const voltageText = voltage.value ? voltage.options[voltage.selectedIndex].text : '未指定';
        const environment = document.getElementById('environment');
        const environmentText = environment.value ? environment.options[environment.selectedIndex].text : '未指定';
        
        const standards = Array.from(document.querySelectorAll('input[name="standards"]:checked'))
            .map(cb => cb.value)
            .join(', ');
        
        summaryContent.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">项目名称</span>
                <span class="summary-value">${projectName}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">项目类型</span>
                <span class="summary-value">${projectTypeText}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">优先级</span>
                <span class="summary-value">${priorityText}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">电压等级</span>
                <span class="summary-value">${voltageText}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">使用环境</span>
                <span class="summary-value">${environmentText}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">适用标准</span>
                <span class="summary-value">${standards || '未选择'}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">描述字数</span>
                <span class="summary-value">${description.length} 字</span>
            </div>
        `;
    }
    
    // 表单提交
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const terms = document.querySelector('input[name="terms"]');
        if (!terms.checked) {
            showToast('请同意服务条款和隐私政策', 'warning');
            return;
        }
        
        // 收集表单数据
        const formData = {
            projectName: document.getElementById('projectName').value,
            projectType: document.getElementById('projectType').value,
            priority: document.getElementById('priority').value,
            description: document.getElementById('description').value,
            voltage: document.getElementById('voltage').value,
            environment: document.getElementById('environment').value,
            standards: Array.from(document.querySelectorAll('input[name="standards"]:checked'))
                .map(cb => cb.value),
            contact: document.getElementById('contact').value,
            submittedAt: new Date().toISOString()
        };
        
        // 保存到本地存储
        saveRequirement(formData);
        
        // 显示成功消息
        showToast('需求提交成功！我们将尽快与您联系。', 'success');
        
        // 重置表单
        form.reset();
        updateStepIndicators(1);
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        document.getElementById('step1').classList.add('active');
        
        // 清除文件列表
        const fileList = document.getElementById('fileList');
        if (fileList) {
            fileList.innerHTML = '';
        }
    });
}

// ================================================
// 文件上传处理
// ================================================
function initFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    
    if (!fileUploadArea || !fileInput) return;
    
    // 点击上传
    fileUploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 文件选择
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // 拖拽上传
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#00d4ff';
        this.style.background = 'rgba(0, 212, 255, 0.02)';
    });
    
    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = '';
        this.style.background = '';
    });
    
    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '';
        this.style.background = '';
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
    
    // 处理文件
    function handleFiles(files) {
        if (!fileList) return;
        
        Array.from(files).forEach(file => {
            // 验证文件类型
            const allowedTypes = ['.pdf', '.dwg', '.dxf', '.csv'];
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            
            if (!allowedTypes.includes(fileExt)) {
                showToast(`不支持的文件格式: ${fileExt}`, 'error');
                return;
            }
            
            // 验证文件大小 (10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast('文件大小不能超过10MB', 'error');
                return;
            }
            
            // 添加到文件列表
            addFileToList(file);
        });
    }
    
    // 添加文件到列表
    function addFileToList(file) {
        if (!fileList) return;
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${formatFileSize(file.size)})</span>
            <span class="remove-file" onclick="removeFile(this, '${file.name}')">
                <i class="fas fa-times"></i>
            </span>
        `;
        
        fileList.appendChild(fileItem);
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    // 移除文件
    window.removeFile = function(element, fileName) {
        const fileItem = element.closest('.file-item');
        if (fileItem) {
            fileItem.remove();
        }
    };
}

// ================================================
// 工具工作区
// ================================================
function initToolWorkspace() {
    // 工具已经定义在HTML中
}

window.openTool = function(toolId) {
    const workspace = document.getElementById('toolWorkspace');
    const content = document.getElementById('toolContent');
    const toolName = document.getElementById('currentToolName');
    
    if (!workspace || !content) return;
    
    // 显示工作区
    workspace.classList.add('active');
    
    // 根据工具ID加载内容
    const toolContents = {
        'wire-calculator': createWireCalculator(),
        'connector-selector': createConnectorSelector(),
        'bom-generator': createBOMGenerator(),
        'schematic-viewer': createSchematicViewer(),
        'simulation': createSimulation(),
        'custom': showCustomUpload()
    };
    
    const toolNames = {
        'wire-calculator': '线径计算器',
        'connector-selector': '连接器选型',
        'bom-generator': 'BOM生成器',
        'schematic-viewer': '原理图查看器',
        'simulation': '仿真分析',
        'custom': '自定义工具'
    };
    
    toolName.textContent = toolNames[toolId] || '工具工作区';
    
    if (toolContents[toolId]) {
        content.innerHTML = toolContents[toolId];
    }
};

window.closeTool = function() {
    const workspace = document.getElementById('toolWorkspace');
    const content = document.getElementById('toolContent');
    
    if (workspace) {
        workspace.classList.remove('active');
    }
    
    if (content) {
        content.innerHTML = `
            <div class="placeholder-content">
                <i class="fas fa-magic"></i>
                <p>选择一个工具开始使用</p>
            </div>
        `;
    }
};

window.toggleFullscreen = function() {
    const workspace = document.getElementById('toolWorkspace');
    if (workspace) {
        workspace.classList.toggle('fullscreen');
    }
};

// ================================================
// 工具内容模板
// ================================================
function createWireCalculator() {
    return `
        <div class="calculator-tool">
            <div class="calculator-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>工作电流 (A)</label>
                        <input type="number" id="current" value="10" min="0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>工作电压 (V)</label>
                        <select id="voltage">
                            <option value="12">12V</option>
                            <option value="24">24V</option>
                            <option value="48">48V</option>
                            <option value="400">400V</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>环境温度 (°C)</label>
                        <input type="number" id="temperature" value="40" min="-40" max="150">
                    </div>
                    <div class="form-group">
                        <label>线束类型</label>
                        <select id="harnessType">
                            <option value="single">单芯线</option>
                            <option value="multi">多芯线</option>
                            <option value="shielded">屏蔽线</option>
                        </select>
                    </div>
                </div>
                <button class="btn-primary" onclick="calculateWireSize()">
                    <i class="fas fa-calculator"></i>
                    计算线径
                </button>
            </div>
            <div class="calculator-result" id="wireResult">
                <div class="result-placeholder">
                    <i class="fas fa-ruler"></i>
                    <p>输入参数后点击计算</p>
                </div>
            </div>
        </div>
    `;
}

function createConnectorSelector() {
    return `
        <div class="connector-tool">
            <div class="connector-search">
                <div class="form-group">
                    <label>搜索连接器</label>
                    <input type="text" placeholder="输入型号、品牌或规格..." id="connectorSearch">
                </div>
                <button class="btn-primary" onclick="searchConnector()">
                    <i class="fas fa-search"></i>
                    搜索
                </button>
            </div>
            <div class="connector-filters">
                <div class="form-group">
                    <label>品牌</label>
                    <select id="brand">
                        <option value="">全部</option>
                        <option value="te">TE Connectivity</option>
                        <option value="molex">Molex</option>
                        <option value="amp">AMP</option>
                        <option value="jst">JST</option>
                        <option value=" Delphi">Delphi</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>引脚数</label>
                    <select id="pins">
                        <option value="">全部</option>
                        <option value="2">2Pin</option>
                        <option value="4">4Pin</option>
                        <option value="6">6Pin</option>
                        <option value="8">8Pin</option>
                        <option value="12">12Pin</option>
                        <option value="24">24Pin</option>
                    </select>
                </div>
            </div>
            <div class="connector-results" id="connectorResults">
                <div class="result-placeholder">
                    <i class="fas fa-plug"></i>
                    <p>搜索连接器查看结果</p>
                </div>
            </div>
        </div>
    `;
}

function createBOMGenerator() {
    return `
        <div class="bom-tool">
            <div class="bom-upload">
                <div class="file-upload-area">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>上传设计文件生成BOM</p>
                    <span class="file-hint">支持 DWG, DXF, CSV 格式</span>
                </div>
            </div>
            <div class="bom-options">
                <div class="form-group">
                    <label>导出格式</label>
                    <select id="exportFormat">
                        <option value="excel">Excel (.xlsx)</option>
                        <option value="pdf">PDF</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>
                <button class="btn-primary" onclick="generateBOM()">
                    <i class="fas fa-file-export"></i>
                    生成BOM
                </button>
            </div>
        </div>
    `;
}

function createSchematicViewer() {
    return `
        <div class="schematic-tool">
            <div class="schematic-toolbar">
                <button class="btn-icon" title="放大">
                    <i class="fas fa-search-plus"></i>
                </button>
                <button class="btn-icon" title="缩小">
                    <i class="fas fa-search-minus"></i>
                </button>
                <button class="btn-icon" title="实际大小">
                    <i class="fas fa-expand"></i>
                </button>
                <button class="btn-icon" title="平移">
                    <i class="fas fa-hand-paper"></i>
                </button>
                <div class="toolbar-divider"></div>
                <button class="btn-icon" title="选择">
                    <i class="fas fa-mouse-pointer"></i>
                </button>
                <button class="btn-icon" title="测量">
                    <i class="fas fa-ruler-combined"></i>
                </button>
            </div>
            <div class="schematic-canvas" id="schematicCanvas">
                <svg viewBox="0 0 800 600" class="schematic-svg">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#00d4ff"/>
                        </marker>
                    </defs>
                    <!-- 背景网格 -->
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 212, 255, 0.1)" stroke-width="0.5"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)"/>
                    
                    <!-- 线束连接示意 -->
                    <g class="wiring-diagram">
                        <!-- 连接器A -->
                        <rect x="50" y="200" width="60" height="120" rx="5" fill="rgba(0, 212, 255, 0.1)" stroke="#00d4ff" stroke-width="2"/>
                        <text x="80" y="185" fill="#00d4ff" font-size="12" text-anchor="middle">Connector A</text>
                        
                        <!-- 连接器B -->
                        <rect x="650" y="200" width="60" height="120" rx="5" fill="rgba(139, 92, 246, 0.1)" stroke="#8b5cf6" stroke-width="2"/>
                        <text x="680" y="185" fill="#8b5cf6" font-size="12" text-anchor="middle">Connector B</text>
                        
                        <!-- 线束路径 -->
                        <path d="M 110 230 C 200 230, 200 280, 350 280 C 500 280, 500 230, 590 230" 
                              fill="none" stroke="#10b981" stroke-width="3" marker-end="url(#arrowhead)"/>
                        <path d="M 110 260 C 200 260, 200 300, 350 300 C 500 300, 500 260, 590 260" 
                              fill="none" stroke="#f59e0b" stroke-width="3" marker-end="url(#arrowhead)"/>
                        <path d="M 110 290 C 200 290, 200 320, 350 320 C 500 320, 500 290, 590 290" 
                              fill="none" stroke="#ef4444" stroke-width="3" marker-end="url(#arrowhead)"/>
                        
                        <!-- 标注 -->
                        <text x="350" y="270" fill="#10b981" font-size="10" text-anchor="middle">CAN_H (0.75mm²)</text>
                        <text x="350" y="340" fill="#f59e0b" font-size="10" text-anchor="middle">CAN_L (0.75mm²)</text>
                    </g>
                </svg>
            </div>
        </div>
    `;
}

function createSimulation() {
    return `
        <div class="simulation-tool">
            <div class="simulation-controls">
                <div class="simulation-param">
                    <label>导线长度 (m)</label>
                    <input type="range" min="1" max="100" value="50" id="wireLength">
                    <span id="wireLengthValue">50</span>
                </div>
                <div class="simulation-param">
                    <label>负载电流 (A)</label>
                    <input type="range" min="1" max="100" value="20" id="loadCurrent">
                    <span id="loadCurrentValue">20</span>
                </div>
                <div class="simulation-param">
                    <label>环境温度 (°C)</label>
                    <input type="range" min="-40" max="150" value="40" id="envTemp">
                    <span id="envTempValue">40</span>
                </div>
                <button class="btn-primary" onclick="runSimulation()">
                    <i class="fas fa-play"></i>
                    运行仿真
                </button>
            </div>
            <div class="simulation-results" id="simulationResults">
                <div class="simulation-chart">
                    <canvas id="thermalChart"></canvas>
                </div>
                <div class="simulation-metrics">
                    <div class="metric">
                        <span class="metric-label">电压降</span>
                        <span class="metric-value" id="voltageDrop">-- V</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">温升</span>
                        <span class="metric-value" id="tempRise">-- °C</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">功率损耗</span>
                        <span class="metric-value" id="powerLoss">-- W</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showCustomUpload() {
    openModal();
    return '';
}

// ================================================
// 自定义工具上传
// ================================================
function initModal() {
    const overlay = document.getElementById('modalOverlay');
    const uploadArea = document.getElementById('customToolUpload');
    const fileInput = document.getElementById('customToolInput');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function() {
            handleCustomToolUpload(this.files);
        });
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#00d4ff';
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
            handleCustomToolUpload(e.dataTransfer.files);
        });
    }
}

function handleCustomToolUpload(files) {
    const preview = document.getElementById('uploadPreview');
    
    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file-code"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${formatFileSize(file.size)})</span>
        `;
        
        if (preview) {
            preview.innerHTML = '';
            preview.appendChild(fileItem);
        }
    });
}

window.uploadTool = function() {
    const fileInput = document.getElementById('customToolInput');
    
    if (!fileInput || !fileInput.files.length) {
        showToast('请先选择一个文件', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // 保存工具到本地存储
        const tools = JSON.parse(localStorage.getItem('customTools') || '[]');
        const tool = {
            name: file.name.replace(/\.[^/.]+$/, ''),
            content: e.target.result,
            type: file.name.endsWith('.html') ? 'html' : 'zip',
            createdAt: new Date().toISOString()
        };
        
        tools.push(tool);
        localStorage.setItem('customTools', JSON.stringify(tools));
        
        closeModal();
        showToast('工具上传成功！', 'success');
        
        // 添加到工具列表
        addCustomToolToGrid(tool);
    };
    
    if (file.name.endsWith('.html')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
};

function addCustomToolToGrid(tool) {
    const toolsGrid = document.querySelector('.tools-grid');
    if (!toolsGrid) return;
    
    const customToolCard = document.querySelector('.custom-tool');
    
    const newToolCard = document.createElement('div');
    newToolCard.className = 'tool-card';
    newToolCard.dataset.tool = `custom-${tool.name}`;
    newToolCard.innerHTML = `
        <div class="tool-icon">
            <i class="fas fa-code"></i>
        </div>
        <h3 class="tool-name">${tool.name}</h3>
        <p class="tool-description">自定义工具</p>
        <div class="tool-tags">
            <span class="tag">自定义</span>
        </div>
        <button class="btn-tool" onclick="openCustomTool('${tool.name}')">
            <i class="fas fa-play"></i>
            启动工具
        </button>
    `;
    
    if (customToolCard) {
        customToolCard.after(newToolCard);
    }
}

window.openCustomTool = function(toolName) {
    const tools = JSON.parse(localStorage.getItem('customTools') || '[]');
    const tool = tools.find(t => t.name === toolName);
    
    if (tool) {
        const workspace = document.getElementById('toolWorkspace');
        const content = document.getElementById('toolContent');
        const toolNameEl = document.getElementById('currentToolName');
        
        if (workspace && content) {
            workspace.classList.add('active');
            toolNameEl.textContent = tool.name;
            content.innerHTML = `<div class="custom-tool-content">${tool.content}</div>`;
            
            // 执行内联的script标签
            const scripts = content.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
            });
        }
    }
};

window.openModal = function() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
};

window.closeModal = function() {
    const overlay = document.getElementById('modalOverlay');
    const preview = document.getElementById('uploadPreview');
    const fileInput = document.getElementById('customToolInput');
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    if (preview) {
        preview.innerHTML = '';
    }
    
    if (fileInput) {
        fileInput.value = '';
    }
};

// 点击遮罩关闭模态框
document.addEventListener('click', function(e) {
    const overlay = document.getElementById('modalOverlay');
    if (e.target === overlay) {
        closeModal();
    }
});

// ================================================
// Toast 通知
// ================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <span class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </span>
    `;
    
    container.appendChild(toast);
    
    // 自动移除
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ================================================
// 辅助函数
// ================================================
function scrollToSection(sectionId) {
    const section = document.querySelector(`#${sectionId}`);
    if (section) {
        const offsetTop = section.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ================================================
// 需求数据管理
// ================================================
function saveRequirement(data) {
    const requirements = JSON.parse(localStorage.getItem('requirements') || '[]');
    requirements.push(data);
    localStorage.setItem('requirements', JSON.stringify(requirements));
}

function getRequirements() {
    return JSON.parse(localStorage.getItem('requirements') || '[]');
}

// ================================================
// 工具计算功能
// ================================================
window.calculateWireSize = function() {
    const current = parseFloat(document.getElementById('current').value) || 0;
    const voltage = parseFloat(document.getElementById('voltage').value) || 12;
    const temperature = parseFloat(document.getElementById('temperature').value) || 40;
    const harnessType = document.getElementById('harnessType').value;
    
    // 简化的线径计算逻辑
    const baseArea = current / 8; // 基础截面积计算
    const tempFactor = 1 + (temperature - 20) * 0.004; // 温度修正系数
    const typeFactors = {
        'single': 1.0,
        'multi': 1.2,
        'shielded': 1.3
    };
    
    const finalArea = baseArea * tempFactor * (typeFactors[harnessType] || 1);
    
    // 选择标准线规
    const standardSizes = [0.22, 0.35, 0.5, 0.75, 1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0, 35.0];
    const recommendedSize = standardSizes.find(size => size >= finalArea) || 35.0;
    
    const resultDiv = document.getElementById('wireResult');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="result-content">
                <h4>计算结果</h4>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">推荐线径</span>
                        <span class="result-value highlight">${recommendedSize} mm²</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">截面积</span>
                        <span class="result-value">${finalArea.toFixed(2)} mm²</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">载流量</span>
                        <span class="result-value">${(recommendedSize * 8).toFixed(1)} A</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">电压降</span>
                        <span class="result-value">${(current * 0.017 / recommendedSize).toFixed(2)} V</span>
                    </div>
                </div>
                <div class="result-note">
                    <i class="fas fa-info-circle"></i>
                    <span>基于ISO 6722标准计算，实际选型请考虑其他因素</span>
                </div>
            </div>
        `;
    }
};

window.searchConnector = function() {
    const resultsDiv = document.getElementById('connectorResults');
    if (!resultsDiv) return;
    
    // 模拟搜索结果
    const mockResults = [
        { brand: 'TE Connectivity', model: 'MULTILOCK', pins: 24, type: '混合型' },
        { brand: 'Molex', model: 'MX150', pins: 12, type: '信号型' },
        { brand: 'JST', model: 'VH', pins: 6, type: '电源型' },
        { brand: 'TE', model: 'FASTON', pins: 2, type: '端子' }
    ];
    
    let html = '<div class="connector-list">';
    mockResults.forEach(conn => {
        html += `
            <div class="connector-item">
                <div class="connector-info">
                    <span class="connector-brand">${conn.brand}</span>
                    <span class="connector-model">${conn.model}</span>
                </div>
                <div class="connector-details">
                    <span class="connector-pins">${conn.pins} Pin</span>
                    <span class="connector-type">${conn.type}</span>
                </div>
                <button class="btn-secondary btn-sm">查看详情</button>
            </div>
        `;
    });
    html += '</div>';
    
    resultsDiv.innerHTML = html;
};

window.generateBOM = function() {
    showToast('BOM生成中，请稍候...', 'info');
    
    setTimeout(() => {
        showToast('BOM生成完成！', 'success');
    }, 2000);
};

window.runSimulation = function() {
    showToast('仿真运行中...', 'info');
    
    setTimeout(() => {
        document.getElementById('voltageDrop').textContent = '0.48 V';
        document.getElementById('tempRise').textContent = '15.2 °C';
        document.getElementById('powerLoss').textContent = '9.6 W';
        showToast('仿真完成！', 'success');
    }, 1500);
};

// 更新滑块值显示
document.addEventListener('input', function(e) {
    if (e.target.type === 'range') {
        const valueSpan = document.getElementById(e.target.id + 'Value');
        if (valueSpan) {
            valueSpan.textContent = e.target.value;
        }
    }
});

// ================================================
// 粒子动画
// ================================================
function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.color = Math.random() > 0.5 ? '#00d4ff' : '#8b5cf6';
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function createParticles() {
        particles = [];
        const count = Math.min(50, Math.floor(canvas.width * canvas.height / 10000));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // 绘制连线
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = '#00d4ff';
                    ctx.globalAlpha = (1 - distance / 100) * 0.2;
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            });
        });

        animationId = requestAnimationFrame(animate);
    }

    createParticles();
    animate();
}

// ================================================
// 增强数字滚动动画
// ================================================
function initCountUpAnimationV2() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                animateNumber(el, target);
                observer.unobserve(el);
            }
        });
    }, observerOptions);

    statNumbers.forEach(el => observer.observe(el));
}

function animateNumber(element, target) {
    const suffix = element.parentElement.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 缓动函数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(startValue + (target - startValue) * easeOutQuart);

        // 格式化数字
        if (target >= 1000) {
            element.textContent = current.toLocaleString() + suffix;
        } else {
            element.textContent = current + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            // 确保最终值准确
            element.textContent = target >= 1000 ? target.toLocaleString() + suffix : target + suffix;
        }
    }

    requestAnimationFrame(update);
}

// ================================================
// 滚动显示动画
// ================================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.tool-card, .info-card, .chat-panel, .comments-panel, .docs-article, .requirements-form-card'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });
}

// ================================================
// 添加CSS动画类
// ================================================
const style = document.createElement('style');
style.textContent = `
    .revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// 初始化增强动画
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化以确保DOM完全就绪
    setTimeout(() => {
        initParticles();
        initCountUpAnimationV2();
        initScrollReveal();
    }, 100);
});