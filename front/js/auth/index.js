/**
 * 认证系统主入口
 * 整合所有认证相关模块，提供统一的认证管理接口
 */
class AuthSystem {
    constructor() {
        this.authManager = null;
        this.particlesManager = null;
        this.authEvents = null;
        this.isInitialized = false;
        
        // 等待DOM加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            // DOM已经加载完成，延迟一点时间确保其他脚本已加载
            setTimeout(() => {
                this.init();
            }, 100);
        }
    }

    // 初始化认证系统
    init() {
        if (this.isInitialized) {
            return;
        }

        try {
            // 初始化各个模块
            this.initAuthManager();
            this.initParticlesManager();
            this.initAuthEvents();
            
            // 初始化粒子效果
            if (this.particlesManager) {
                this.particlesManager.init();
            }
            
            // 初始化事件监听器
            if (this.authEvents) {
                this.authEvents.init();
            }
            
            this.isInitialized = true;
        } catch (error) {
            console.error('AuthSystem initialization failed:', error);
        }
    }

    // 初始化认证管理器
    initAuthManager() {
        if (typeof Manager !== 'undefined') {
            this.authManager = new Manager();
        } else {
            console.error('Manager class not found');
        }
    }

    // 初始化粒子管理器
    initParticlesManager() {
        if (typeof Particles !== 'undefined') {
            this.particlesManager = new Particles();
        } else {
            console.error('Particles class not found');
        }
    }

    // 初始化认证事件处理器
    initAuthEvents() {
        if (typeof Events !== 'undefined' && this.authManager) {
            this.authEvents = new Events(this.authManager);
        } else {
            console.error('Events class not found or authManager not initialized');
        }
    }

    // 获取认证管理器
    getAuthManager() {
        return this.authManager;
    }

    // 获取粒子管理器
    getParticlesManager() {
        return this.particlesManager;
    }

    // 获取事件处理器
    getAuthEvents() {
        return this.authEvents;
    }

    // 重新初始化（用于动态内容更新后）
    reinit() {
        this.isInitialized = false;
        this.init();
    }

    // 清理所有资源
    cleanup() {
        if (this.authEvents) {
            this.authEvents.cleanup();
        }
        if (this.particlesManager) {
            this.particlesManager.destroy();
        }
        this.isInitialized = false;
    }

    // 代理方法：登录
    async handleLogin() {
        return this.authManager.handleLogin();
    }

    // 代理方法：注册
    async handleRegister() {
        return this.authManager.handleRegister();
    }

    // 代理方法：检查登录状态
    checkLoginStatus() {
        return this.authManager.checkLoginStatus();
    }

    // 代理方法：是否已登录
    isLoggedIn() {
        return this.authManager.isLoggedIn();
    }

    // 代理方法：获取当前用户
    getCurrentUser() {
        return this.authManager.getCurrentUser();
    }

    // 代理方法：清除登录数据
    clearLoginData() {
        return this.authManager.clearLoginData();
    }

    // 代理方法：显示登录页面
    showLoginPage() {
        return this.authManager.showLoginPage();
    }

    // 代理方法：显示注册表单
    showRegisterForm() {
        return this.authManager.showRegisterForm();
    }

    // 代理方法：显示登录表单
    showLoginForm() {
        return this.authManager.showLoginForm();
    }

    // 代理方法：显示消息
    showMessage(message, type = 'info') {
        return this.authManager.showMessage(message, type);
    }
}

// 创建全局认证系统实例
window.authSystem = new AuthSystem();

// 为了向后兼容，保留原来的AuthManager类名
window.AuthManager = AuthSystem; 