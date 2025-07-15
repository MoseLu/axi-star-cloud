// 认证管理类
class AuthManager {
    constructor() {
        this.baseUrl = window.location.origin;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkLoginStatus();
        this.setupEventListeners();
        
        // 检查是否在登录页面，如果是则初始化粒子效果
        const loginPage = document.getElementById('login-page');
        if (loginPage && !loginPage.classList.contains('hidden')) {
            console.log('检测到登录页面，准备初始化粒子效果...');
            // 延迟初始化粒子效果，确保DOM已加载
            setTimeout(() => {
                this.setupParticles();
            }, 1500);
        } else {
            console.log('不在登录页面，跳过粒子效果初始化');
        }
    }

    // 设置粒子背景
    setupParticles() {
        console.log('setupParticles 被调用 - 暂时禁用粒子效果');
        return; // 暂时禁用粒子效果，避免错误
        
        // 检查是否在登录页面
        const loginPage = document.getElementById('login-page');
        if (!loginPage || loginPage.classList.contains('hidden')) {
            console.log('不在登录页面，跳过粒子效果初始化');
            return;
        }

        const particlesContainer = document.getElementById('particles-js');
        if (!particlesContainer) {
            console.warn('粒子容器未找到，跳过粒子效果初始化');
            return;
        }

        // 检查particlesJS库是否已加载
        if (typeof particlesJS === 'undefined') {
            console.warn('particlesJS 库未加载，跳过粒子效果初始化');
            return;
        }

        // 检查容器是否有内容
        if (particlesContainer.children.length > 0) {
            console.log('粒子容器已有内容，跳过重复初始化');
            return;
        }

        try {
            console.log('开始初始化粒子效果...');
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
            console.log('粒子效果初始化成功');
        } catch (error) {
            console.error('粒子效果初始化失败:', error);
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 延迟设置事件监听器，确保DOM元素已加载
        setTimeout(() => {
            // 登录表单提交
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }

            // 注册表单提交
            const registerForm = document.getElementById('registerForm');
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegister();
                });
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
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) {
            this.showMessage('请填写用户名和密码', 'error');
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>登录中...';
        loginBtn.disabled = true;

        try {
            const response = await fetch(`${this.baseUrl}/api/login`, {
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
                
                // 触发登录成功事件，让App管理器处理界面切换
                window.dispatchEvent(new CustomEvent('loginSuccess', { detail: this.currentUser }));
                
                // 如果App管理器已初始化，直接调用其方法
                if (window.app && window.app.onLoginSuccess) {
                    window.app.onLoginSuccess(this.currentUser);
                }
            } else {
                this.showMessage(data.error || '登录失败', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showMessage('网络错误，请稍后重试', 'error');
        } finally {
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
            const response = await fetch(`${this.baseUrl}/api/register`, {
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
            console.error('注册错误:', error);
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
                console.error('解析用户信息失败:', error);
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，准备初始化AuthManager...');
    // 延迟初始化，确保所有模板都已加载
    setTimeout(() => {
        console.log('开始初始化AuthManager...');
        window.authManager = new AuthManager();
        console.log('AuthManager初始化完成');
    }, 1000);
}); 