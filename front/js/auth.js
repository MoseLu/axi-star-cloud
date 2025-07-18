// 认证管理类
class AuthManager {
    constructor() {
        this.baseUrl = window.APP_CONFIG?.API_BASE_URL || '';
        this.currentUser = null;
        this.isInitialized = false;
        this.eventsBound = false;
        this.isLoggingIn = false; // 新增：防止重复提交

        
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
        
        
        
        // 立即尝试初始化粒子效果
        this.setupParticles();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 检查登录状态
        this.checkLoginStatus();
        
        // 延迟再次尝试初始化粒子效果，确保库已加载
        setTimeout(() => {
            this.setupParticles();
        }, 100);
        
        // 再次延迟尝试，确保DOM完全准备好
        setTimeout(() => {
            this.setupParticles();
        }, 500);
        
        // 标记为已初始化
        this.isInitialized = true;
    }

    // 设置粒子背景
    setupParticles() {

        
        // 检查是否在登录页面
        const loginPage = document.getElementById('login-page');
        if (!loginPage || loginPage.classList.contains('hidden')) {

            return;
        }

        const particlesContainer = document.getElementById('particles-js');
        if (!particlesContainer) {

            return;
        }

        // 检查particlesJS库是否已加载
        if (typeof particlesJS === 'undefined') {

            // 如果库未加载，延迟重试（最多重试3次）
            if (!this.particlesRetryCount) {
                this.particlesRetryCount = 0;
            }
            if (this.particlesRetryCount < 3) {
                this.particlesRetryCount++;
            setTimeout(() => {
                this.setupParticles();
            }, 200);
            } else {

            }
            return;
        }

        // 检查容器是否有内容
        if (particlesContainer.children.length > 0) {

            return;
        }

        try {

            
            // 先设置容器的基本样式，确保立即可见
            particlesContainer.style.position = 'fixed';
            particlesContainer.style.top = '0';
            particlesContainer.style.left = '0';
            particlesContainer.style.width = '100%';
            particlesContainer.style.height = '100%';
            particlesContainer.style.zIndex = '0';
            particlesContainer.style.pointerEvents = 'none';
            
            particlesJS('particles-js', {
                particles: {
                    number: {
                        value: 80,
                        density: {
                            enable: true,
                            value_area: 800
                        }
                    },
                    color: {
                        value: '#ffffff'
                    },
                    shape: {
                        type: 'circle',
                        stroke: {
                            width: 0,
                            color: '#000000'
                        }
                    },
                    opacity: {
                        value: 0.5,
                        random: false,
                        anim: {
                            enable: false,
                            speed: 1,
                            opacity_min: 0.1,
                            sync: false
                        }
                    },
                    size: {
                        value: 3,
                        random: true,
                        anim: {
                            enable: false,
                            speed: 40,
                            size_min: 0.1,
                            sync: false
                        }
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: '#ffffff',
                        opacity: 0.4,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 6,
                        direction: 'none',
                        random: false,
                        straight: false,
                        out_mode: 'out',
                        bounce: false,
                        attract: {
                            enable: false,
                            rotateX: 600,
                            rotateY: 1200
                        }
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: {
                            enable: true,
                            mode: 'repulse'
                        },
                        onclick: {
                            enable: true,
                            mode: 'push'
                        },
                        resize: true
                    },
                    modes: {
                        grab: {
                            distance: 400,
                            line_linked: {
                                opacity: 1
                            }
                        },
                        bubble: {
                            distance: 400,
                            size: 40,
                            duration: 2,
                            opacity: 8,
                            speed: 3
                        },
                        repulse: {
                            distance: 200,
                            duration: 0.4
                        },
                        push: {
                            particles_nb: 4
                        },
                        remove: {
                            particles_nb: 2
                        }
                    }
                },
                retina_detect: true
            });

        } catch (error) {

            // 如果初始化失败，延迟重试
            setTimeout(() => {
                this.setupParticles();
            }, 300);
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 防止重复绑定事件
        if (this.eventsBound) {

            return;
        }
        
        
        
        // 延迟设置事件监听器，确保DOM元素已加载
        setTimeout(() => {
            // 登录表单提交
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
    
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            } else {

            }

            // 注册表单提交
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
    
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegister();
                });
            } else {

            }

            // 切换表单按钮
            const showRegisterBtn = document.getElementById('showRegisterBtn');
            const showLoginBtn = document.getElementById('showLoginBtn');
            
            if (showRegisterBtn) {
    
                showRegisterBtn.addEventListener('click', () => {
                    this.showRegisterForm();
                });
            }
            
            if (showLoginBtn) {
    
                showLoginBtn.addEventListener('click', () => {
                    this.showLoginForm();
                });
            }
            
            // 标记事件已绑定
            this.eventsBound = true;

        }, 100);
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

                
                if (window.apiManager) {

                }
                
                if (window.apiManager && typeof window.apiManager.setCurrentUser === 'function') {
                    try {
                        window.apiManager.setCurrentUser(this.currentUser);
    
                    } catch (error) {

                    }
                } else {

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

// AuthManager类定义完成，由App类统一管理初始化 