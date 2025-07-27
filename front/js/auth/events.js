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
            // 先移除旧的事件再绑定
            if (this._loginHandler) {
                loginForm.removeEventListener('submit', this._loginHandler);
            }
            this._loginHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('登录表单提交事件被触发');
                this.authManager.handleLogin();
                return false;
            };
            loginForm.addEventListener('submit', this._loginHandler);
            
            // 同时绑定按钮点击事件作为备用
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn && !this._loginBtnHandler) {
                this._loginBtnHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('登录按钮点击事件被触发');
                    this.authManager.handleLogin();
                    return false;
                };
                loginBtn.addEventListener('click', this._loginBtnHandler);
            }
        } else {
            console.warn('登录表单未找到，将在100ms后重试');
            setTimeout(() => this.setupFormEvents(), 100);
        }

        // 注册表单提交
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            if (this._registerHandler) {
                registerForm.removeEventListener('submit', this._registerHandler);
            }
            this._registerHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('注册表单提交事件被触发');
                this.authManager.handleRegister();
                return false;
            };
            registerForm.addEventListener('submit', this._registerHandler);
            
            // 同时绑定按钮点击事件作为备用
            const registerBtn = document.getElementById('registerBtn');
            if (registerBtn && !this._registerBtnHandler) {
                this._registerBtnHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('注册按钮点击事件被触发');
                    this.authManager.handleRegister();
                    return false;
                };
                registerBtn.addEventListener('click', this._registerBtnHandler);
            }
        } else {
            console.warn('注册表单未找到，将在100ms后重试');
            setTimeout(() => this.setupFormEvents(), 100);
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

        // 设置密码切换事件
        this.setupPasswordToggleEvents();
    }

    // 设置密码切换事件
    setupPasswordToggleEvents() {
        const passwordToggles = document.querySelectorAll('.password-toggle');
        
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const input = toggle.parentElement.querySelector('input[type="password"], input[type="text"]');
                const icon = toggle.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            });
        });
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
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');

        if (loginForm && this._loginHandler) {
            loginForm.removeEventListener('submit', this._loginHandler);
        }
        if (registerForm && this._registerHandler) {
            registerForm.removeEventListener('submit', this._registerHandler);
        }
        if (loginBtn && this._loginBtnHandler) {
            loginBtn.removeEventListener('click', this._loginBtnHandler);
        }
        if (registerBtn && this._registerBtnHandler) {
            registerBtn.removeEventListener('click', this._registerBtnHandler);
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