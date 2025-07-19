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
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('登录成功', 'success');

                // 保存用户信息到本地存储
                this.currentUser = {
                    uuid: data.user.uuid,
                    username: data.user.username,
                    isAdmin: data.user.is_admin
                };
                
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

                // 同步到API管理器
                if (window.apiManager && typeof window.apiManager.setCurrentUser === 'function') {
                    try {
                        window.apiManager.setCurrentUser(this.currentUser);
                    } catch (error) {
                        // 静默处理错误
                    }
                }
                
                // 触发登录成功事件，让App管理器处理界面切换
                window.dispatchEvent(new CustomEvent('loginSuccess', { detail: this.currentUser }));

            } else {
                this.showMessage(data.error || '登录失败', 'error');
            }
        } catch (error) {
            this.showMessage('网络错误，请稍后重试', 'error');
        } finally {
            this.isLoggingIn = false;
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
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
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                // 不再自动跳转，让App管理器处理界面切换
            } catch (error) {
                localStorage.removeItem('currentUser');
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

    // 清除登录数据
    clearLoginData() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userData');
        localStorage.removeItem('loginData');
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