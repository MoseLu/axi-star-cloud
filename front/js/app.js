// 主应用模块 - 初始化所有模块并协调它们的工作
class App {
    constructor() {
        this.authManager = null;
        this.apiManager = null;
        this.uiManager = null;
        this.init();
    }

    async init() {
        try {
            // 初始化各个模块
            this.authManager = new AuthManager();
            this.apiManager = new ApiManager();
            this.uiManager = new UIManager();

            // 设置全局引用
            window.authManager = this.authManager;
            window.apiManager = this.apiManager;
            window.uiManager = this.uiManager;

            // 初始化日期显示
            this.initDateDisplay();

            // 设置登录表单事件
            this.setupLoginForm();

            // 设置其他事件监听器
            this.setupEventListeners();

            // 检查登录状态
            this.checkLoginStatus();

        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }

    // 检查登录状态
    checkLoginStatus() {
        const currentUser = this.apiManager.getCurrentUser();
        if (currentUser) {
            // 用户已登录，显示主界面
            this.showMainInterface();
            this.updateUserDisplay(currentUser);
        } else {
            // 用户未登录，显示登录页面
            this.showLoginInterface();
        }
    }

    // 显示主界面
    showMainInterface() {
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage) loginPage.classList.add('hidden');
        if (app) app.classList.remove('hidden');
    }

    // 显示登录界面
    showLoginInterface() {
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage) loginPage.classList.remove('hidden');
        if (app) app.classList.add('hidden');
    }

    // 更新用户显示
    updateUserDisplay(user) {
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) {
            userName.textContent = user.username;
            // 确保金色渐变样式保持
            userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
        }
        
        if (userAvatar && user.avatar) {
            userAvatar.src = user.avatar;
        }
    }

    // 初始化日期显示
    initDateDisplay() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('zh-CN', options);
        }
    }

    // 设置登录表单 - 由 UIManager 处理
    setupLoginForm() {
        // 登录表单事件由 UIManager 处理，避免重复绑定
    }

    // 设置事件监听器
    setupEventListeners() {
        // 登录成功事件监听
        window.addEventListener('loginSuccess', async (event) => {
            await this.onLoginSuccess(event.detail);
        });

        // 退出登录事件
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // 设置按钮事件
        document.getElementById('settings-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.uiManager) {
                this.uiManager.showSettingsModal();
            }
        });
    }

    // 登录成功处理
    async onLoginSuccess(userData) {
        // 更新用户显示
        this.updateUserDisplay(userData);
        
        // 显示主界面
        this.showMainInterface();
        
        // 更新API管理器的用户信息
        this.apiManager.currentUser = userData;
        
        // 检查并显示管理员菜单
        if (this.uiManager) {
            this.uiManager.checkAndShowAdminMenu();
        }
        
        // 显示登录成功通知
        if (window.Notify) {
            window.Notify.show({ message: '登录成功', type: 'success' });
        }
    }

    // 退出登录
    logout() {
        // 清除本地存储
        localStorage.removeItem('currentUser');
        
        // 重置API管理器的用户信息
        this.apiManager.currentUser = null;
        
        // 显示登录界面
        this.showLoginInterface();
        
        // 显示退出通知
        if (window.Notify) {
            window.Notify.show({ message: '已退出登录', type: 'info' });
        }
    }
}

// 应用初始化由index.html中的模板加载完成后调用 