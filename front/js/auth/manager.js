/**
 * 认证管理器 - 核心认证功能
 * 负责用户登录、注册、状态管理等核心认证逻辑
 */
class Manager {
    constructor() {
        this.baseUrl = window.APP_CONFIG?.API_BASE_URL || '';
        this.currentUser = null;
        this.isInitialized = false;
        this.isLoggingIn = false;
        
        // 延迟初始化，确保所有依赖都准备好
        setTimeout(() => {
            this.init();
        }, 0);
    }

    // 构建API URL的通用方法
    buildApiUrl(endpoint) {
        if (!endpoint) return '';
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        return this.baseUrl ? this.baseUrl + endpoint : endpoint;
    }

    init() {
        // 防止重复初始化
        if (this.isInitialized) {
            return;
        }
        
        // 检查登录状态
        this.checkLoginStatus();
        
        // 标记为已初始化
        this.isInitialized = true;
    }

    // 处理登录
    async handleLogin() {
        // 防止重复提交
        if (this.isLoggingIn) {
            return;
        }
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) {
            this.showMessage('请填写用户名和密码', 'error');
            return;
        }

        this.isLoggingIn = true;
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>登录中...';
        loginBtn.disabled = true;

        try {
            const response = await fetch(this.buildApiUrl('/api/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                }),
                credentials: 'include' // 包含cookie
            });

            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: errorText };
                }
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // 保存用户信息
                const userInfo = {
                    uuid: data.user.uuid,
                    username: data.user.username,
                    email: data.user.email,
                    bio: data.user.bio,
                    avatar: data.user.avatar
                };
                
                // 保存到localStorage
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                
                // 如果使用StorageManager，也保存到那里
                if (window.StorageManager && typeof window.StorageManager.setUserInfo === 'function') {
                    window.StorageManager.setUserInfo(userInfo);
                }
                
                // 更新当前用户
                this.currentUser = userInfo;
                
                // 保存token信息（如果后端返回了token）
                if (data.tokens) {
                    const tokenInfo = {
                        accessToken: data.tokens.access_token,
                        refreshToken: data.tokens.refresh_token,
                        expiresAt: data.tokens.expires_at
                    };
                    
                    if (window.StorageManager && typeof window.StorageManager.setSystemInfo === 'function') {
                        const systemInfo = window.StorageManager.getSystemInfo() || {};
                        systemInfo.tokens = tokenInfo;
                        window.StorageManager.setSystemInfo(systemInfo);
                    } else {
                        localStorage.setItem('tokens', JSON.stringify(tokenInfo));
                    }
                }

                // 保存管理员token信息（如果是管理员用户）
                if (data.admin_tokens && userInfo.username === 'Mose') {
                    const adminTokenInfo = {
                        adminAccessToken: data.admin_tokens.admin_access_token,
                        adminRefreshToken: data.admin_tokens.admin_refresh_token,
                        adminExpiresAt: data.admin_tokens.admin_expires_at
                    };
                    
                    if (window.StorageManager && typeof window.StorageManager.setSystemInfo === 'function') {
                        const systemInfo = window.StorageManager.getSystemInfo() || {};
                        systemInfo.adminTokens = adminTokenInfo;
                        window.StorageManager.setSystemInfo(systemInfo);
                    } else {
                        localStorage.setItem('adminTokens', JSON.stringify(adminTokenInfo));
                    }
                }

                // 触发登录成功事件
                document.dispatchEvent(new CustomEvent('loginSuccess', {
                    detail: { user: userInfo }
                }));

                // 恢复按钮状态
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
                this.isLoggingIn = false;

            } else {
                this.showMessage(data.error || '登录失败', 'error');
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
                this.isLoggingIn = false;
            }
        } catch (error) {
            console.error('登录请求失败:', error);
            this.showMessage(error.message || '网络错误，请检查网络连接', 'error');
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            this.isLoggingIn = false;
        }
    }

    // 处理注册
    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const email = document.getElementById('registerEmail').value.trim();

        if (!username || !password || !confirmPassword) {
            this.showMessage('请填写必填项', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('两次输入的密码不一致', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('密码长度至少6位', 'error');
            return;
        }

        const registerBtn = document.getElementById('registerBtn');
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>注册中...';
        registerBtn.disabled = true;

        try {
            const response = await fetch(this.buildApiUrl('/api/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    email: email
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('注册成功！请登录', 'success');
                
                // 清空注册表单
                document.getElementById('registerForm').reset();
                
                // 切换到登录表单
                setTimeout(() => {
                    this.showLoginForm();
                }, 1500);
            } else {
                this.showMessage(data.error || '注册失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
        } finally {
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    }

    // 检查登录状态
    checkLoginStatus() {
        let savedUser = null;
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            savedUser = window.StorageManager.getUser();
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
            const userData = localStorage.getItem('userInfo');
            if (userData) {
                try {
                    savedUser = JSON.parse(userData);
                } catch (error) {
                    console.warn('解析用户信息失败:', error);
                }
            }
        }
        
        if (savedUser) {
            try {
                this.currentUser = savedUser;
                // 不再自动跳转，让App管理器处理界面切换
            } catch (error) {
                if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
                    window.StorageManager.clearUser();
                } else {
                    localStorage.removeItem('userInfo');
                }
            }
        }
    }

    // 检查是否已登录
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 获取用户详细信息
    getUserData() {
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            return window.StorageManager.getUser();
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
            const userData = localStorage.getItem('userInfo');
            if (userData) {
                try {
                    return JSON.parse(userData);
                } catch (error) {
                    console.warn('解析用户数据失败:', error);
                    return null;
                }
            }
            return null;
        }
    }

    // 清除登录数据
    clearLoginData() {
        // 清除用户信息
        if (window.StorageManager && typeof window.StorageManager.clearUserInfo === 'function') {
            window.StorageManager.clearUserInfo();
        } else {
            localStorage.removeItem('userInfo');
        }

        // 清除token信息
        if (window.StorageManager && typeof window.StorageManager.setSystemInfo === 'function') {
            const systemInfo = window.StorageManager.getSystemInfo() || {};
            delete systemInfo.tokens;
            delete systemInfo.adminTokens;
            window.StorageManager.setSystemInfo(systemInfo);
        } else {
            localStorage.removeItem('tokens');
            localStorage.removeItem('adminTokens');
        }

        // 清除当前用户
        this.currentUser = null;

        // 调用后端退出登录接口
        const userData = this.getUserData();
        if (userData && userData.uuid) {
            fetch(this.buildApiUrl(`/api/logout?user_id=${userData.uuid}`), {
                method: 'POST',
                credentials: 'include'
            }).catch(error => {
                console.error('退出登录请求失败:', error);
            });
        }
    }

    // 更新baseUrl（用于环境切换）
    updateBaseUrl() {
        this.baseUrl = window.APP_CONFIG?.API_BASE_URL || '';
    }

    // 显示登录页面
    showLoginPage() {
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage) loginPage.classList.remove('hidden');
        if (app) app.classList.add('hidden');
    }

    // 显示注册表单
    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm && registerForm) {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    }

    // 显示登录表单
    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm && registerForm) {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 使用全局的Notify系统
        if (window.Notify) {
            window.Notify.show({ message: message, type: type });
        } else {
            // 备用方案：使用alert
            alert(message);
        }
    }
}

// 导出Manager类
window.AuthManager = Manager; 