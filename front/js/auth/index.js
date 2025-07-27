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
        // 创建一个简单的认证管理器，不依赖复杂的AppAuthManager
        this.authManager = new SimpleAuthManager();
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

    // 显示登录表单
    showLoginForm() {
        return this.authManager.showLoginForm();
    }

    // 显示消息
    showMessage(message, type = 'info') {
        if (window.MessageBox) {
            window.MessageBox.show({
                type: type,
                message: message,
                duration: 3000
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// 简单的认证管理器类
class SimpleAuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.authAPI = null;
        this.tokenManager = null;
        this.init();
    }

    // 初始化
    init() {
        // 等待API系统加载完成
        this.waitForAPISystem();
    }

    // 等待API系统加载
    waitForAPISystem() {
        let retryCount = 0;
        const maxRetries = 50; // 最多等待5秒
        
        const checkAPISystem = () => {
            retryCount++;
            
            // 检查所有必需的组件
            const hasApiGateway = !!window.apiGateway;
            const hasAuth = !!window.Auth;
            const hasTokenManager = !!window.TokenManager;
            
            if (hasApiGateway && hasAuth && hasTokenManager) {
                try {
                    // 创建一个简单的core对象，包含必要的方法
                    const simpleCore = {
                        clearUserData: () => {
                            localStorage.removeItem('userInfo');
                            if (this.tokenManager) {
                                this.tokenManager.clearTokens();
                            }
                        }
                    };
                    
                    this.authAPI = new window.Auth(simpleCore);
                    this.tokenManager = new window.TokenManager();
                    console.log('✅ 认证系统初始化完成');
                } catch (error) {
                    console.error('❌ 认证系统初始化失败:', error);
                    if (retryCount < maxRetries) {
                        setTimeout(checkAPISystem, 100);
                    } else {
                        console.error('❌ 认证系统初始化超时');
                    }
                }
            } else {
                if (retryCount < maxRetries) {
                    console.log(`⏳ 等待API系统加载... (${retryCount}/${maxRetries})`, {
                        apiGateway: hasApiGateway,
                        Auth: hasAuth,
                        TokenManager: hasTokenManager
                    });
                    setTimeout(checkAPISystem, 100);
                } else {
                    console.error('❌ API系统加载超时', {
                        apiGateway: hasApiGateway,
                        Auth: hasAuth,
                        TokenManager: hasTokenManager
                    });
                }
            }
        };
        checkAPISystem();
    }

    // 处理登录
    async handleLogin() {
        try {
            const username = document.getElementById('loginUsername')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            if (!username || !password) {
                this.showMessage('请输入用户名和密码', 'error');
                return false;
            }

            // 等待API系统就绪
            if (!this.authAPI) {
                this.showMessage('系统正在初始化，请稍后重试', 'error');
                return false;
            }

            // 调用真实的登录API
            const loginResult = await this.authAPI.login(username, password);
            
            if (loginResult && loginResult.success) {
                // 保存用户信息
                this.currentUser = loginResult.user || { 
                    username: loginResult.user?.username || username,
                    uuid: loginResult.user?.uuid || loginResult.user?.id
                };
                this.isLoggedIn = true;
                
                // 保存到localStorage
                localStorage.setItem('userInfo', JSON.stringify(this.currentUser));
                
                this.showMessage(loginResult.message || '登录成功', 'success');
                
                // 触发登录成功事件
                document.dispatchEvent(new CustomEvent('loginSuccess', {
                    detail: this.currentUser
                }));
                
                return true;
            } else {
                this.showMessage(loginResult?.message || '登录失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('登录失败:', error);
            this.showMessage(error.message || '登录失败，请重试', 'error');
            return false;
        }
    }

    // 处理注册
    async handleRegister() {
        try {
            const username = document.getElementById('registerUsername')?.value;
            const password = document.getElementById('registerPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            const email = document.getElementById('registerEmail')?.value;
            
            if (!username || !password || !confirmPassword) {
                this.showMessage('请填写所有必填字段', 'error');
                return false;
            }

            if (password !== confirmPassword) {
                this.showMessage('两次输入的密码不一致', 'error');
                return false;
            }

            // 等待API系统就绪
            if (!this.authAPI) {
                this.showMessage('系统正在初始化，请稍后重试', 'error');
                return false;
            }

            // 调用真实的注册API
            const registerResult = await this.authAPI.register(username, password, email);
            
            if (registerResult && registerResult.success) {
                this.showMessage('注册成功，请登录', 'success');
                // 切换到登录表单
                this.showLoginForm();
                return true;
            } else {
                this.showMessage(registerResult?.message || '注册失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('注册失败:', error);
            this.showMessage(error.message || '注册失败，请重试', 'error');
            return false;
        }
    }

    // 检查登录状态
    checkLoginStatus() {
        // 从localStorage获取用户信息
        const userData = localStorage.getItem('userInfo');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isLoggedIn = true;
                
                // 验证token是否有效
                if (this.tokenManager) {
                    this.tokenManager.checkAndRefreshTokens();
                }
                
                return true;
            } catch (error) {
                console.warn('解析用户信息失败:', error);
                this.clearLoginData();
            }
        }
        return false;
    }

    // 是否已登录
    isLoggedIn() {
        return this.isLoggedIn;
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 清除登录数据
    clearLoginData() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('userInfo');
        
        // 清除token
        if (this.tokenManager) {
            this.tokenManager.clearTokens();
        }
    }

    // 退出登录
    async logout() {
        try {
            if (this.authAPI) {
                await this.authAPI.logout();
            }
        } catch (error) {
            console.error('退出登录失败:', error);
        } finally {
            this.clearLoginData();
            this.showMessage('已退出登录', 'info');
            
            // 触发退出登录事件
            document.dispatchEvent(new CustomEvent('logout'));
        }
    }

    // 显示登录页面
    showLoginPage() {
        // 切换到登录表单
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm && registerForm) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        }
    }

    // 显示注册表单
    showRegisterForm() {
        // 切换到注册表单
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm && registerForm) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    // 显示登录表单
    showLoginForm() {
        this.showLoginPage();
    }

    // 显示消息
    showMessage(message, type = 'info') {
        if (window.MessageBox) {
            window.MessageBox.show({
                type: type,
                message: message,
                duration: 3000
            });
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// 创建全局认证系统实例
if (!window.authSystem) {
    window.authSystem = new AuthSystem();
}

// 为了向后兼容，保留原来的AuthManager类名
window.AuthManager = AuthSystem; 