/**
 * 认证事件处理器
 * 负责处理登录注册表单的事件绑定和交互
 */
class Events {
    constructor(authManager) {
        this.authManager = authManager;
        this.eventsBound = false;
    }

    // 初始化事件监听器
    init() {
        if (this.eventsBound) {
            return;
        }

        // 延迟设置事件监听器，确保DOM元素已加载
        setTimeout(() => {
            this.setupFormEvents();
            this.setupToggleEvents();
            this.eventsBound = true;
        }, 100);
    }

    // 设置表单事件
    setupFormEvents() {
        // 登录表单提交
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.authManager.handleLogin();
            });
        }

        // 注册表单提交
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.authManager.handleRegister();
            });
        }
    }

    // 设置切换事件
    setupToggleEvents() {
        // 切换表单按钮
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const showLoginBtn = document.getElementById('showLoginBtn');
        
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => {
                this.authManager.showRegisterForm();
            });
        }
        
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => {
                this.authManager.showLoginForm();
            });
        }
    }

    // 重新绑定事件（用于动态内容更新后）
    rebindEvents() {
        this.eventsBound = false;
        this.init();
    }

    // 清理事件监听器
    cleanup() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const showLoginBtn = document.getElementById('showLoginBtn');

        if (loginForm) {
            loginForm.removeEventListener('submit', this.authManager.handleLogin);
        }
        if (registerForm) {
            registerForm.removeEventListener('submit', this.authManager.handleRegister);
        }
        if (showRegisterBtn) {
            showRegisterBtn.removeEventListener('click', this.authManager.showRegisterForm);
        }
        if (showLoginBtn) {
            showLoginBtn.removeEventListener('click', this.authManager.showLoginForm);
        }

        this.eventsBound = false;
    }
}

// 导出Events类
window.AuthEvents = Events; 