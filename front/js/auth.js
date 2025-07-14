// 认证模块 - 处理登录状态管理
class AuthManager {
    constructor() {
        this.loginData = null;
        this.init();
    }

    init() {
        this.checkLoginStatus();
    }

    // 检查登录状态
    checkLoginStatus() {
        const loginData = localStorage.getItem('loginData');

        
        if (loginData) {
            try {
                const userData = JSON.parse(loginData);
    
                
                // 验证登录状态是否有效
                if (userData.username && userData.uuid && userData.timestamp) {
    
                    this.loginData = userData;
                    this.onLoginSuccess(userData);
                    return true;
                } else {
    
                    this.clearLoginData();
                }
            } catch (e) {
                this.clearLoginData();
            }
        }
        
        // 显示登录页面

        this.showLoginPage();
        return false;
    }

    // 登录成功回调
    onLoginSuccess(userData) {
        // 更新UI
        const userName = document.getElementById('user-name');
        if (userName) {
            userName.textContent = userData.username;
            // 确保金色渐变样式保持
            userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
        }
        document.getElementById('welcome-message').textContent = `欢迎回来，${userData.username}`;
        
        // 切换到主界面
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        // 显示登录成功通知
        if (window.Notify) {
            window.Notify.show({ message: '登录成功', type: 'success' });
        }
        
        // 触发登录成功事件
        window.dispatchEvent(new CustomEvent('loginSuccess', { detail: userData }));
    }

    // 显示登录页面
    showLoginPage() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        
        // 初始化登录页面的粒子效果
        initLoginParticles();
        
        // 绑定登录表单事件
        bindLoginEvents();
    }

    // 保存登录数据
    saveLoginData(userData) {
        const loginData = {
            username: userData.username,
            uuid: userData.uuid,
            timestamp: Date.now()
        };

        localStorage.setItem('loginData', JSON.stringify(loginData));

        
        // 验证数据是否保存成功
        const savedData = localStorage.getItem('loginData');

        if (savedData) {
            const parsedData = JSON.parse(savedData);
    
        }
        
        this.loginData = loginData;
        this.onLoginSuccess(userData);
    }

    // 清除登录数据
    clearLoginData() {
        localStorage.removeItem('loginData');
        this.loginData = null;
    }

    // 获取当前用户数据
    getCurrentUser() {
        return this.loginData;
    }

    // 检查是否已登录
    isLoggedIn() {
        return this.loginData !== null;
    }
}

// 导出认证管理器
window.AuthManager = AuthManager; 

// 初始化登录页面的粒子效果
function initLoginParticles() {
    if (typeof particlesJS !== 'undefined') {
        // 确保粒子容器存在
        const particlesContainer = document.getElementById('particles-js');
        if (particlesContainer) {
            particlesJS("particles-js", {
                particles: {
                    number: { 
                        value: 100, 
                        density: { enable: true, value_area: 800 } 
                    },
                    color: { value: "#ffffff" },
                    shape: {
                        type: "circle",
                        stroke: { width: 0, color: "#000000" },
                        polygon: { nb_sides: 5 }
                    },
                    opacity: {
                        value: 0.6,
                        random: true,
                        anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
                    },
                    size: {
                        value: 2,
                        random: true,
                        anim: { enable: true, speed: 2, size_min: 0.1, sync: false }
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: "#7B61FF",
                        opacity: 0.3,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 1.5,
                        direction: "none",
                        random: true,
                        straight: false,
                        out_mode: "out",
                        bounce: false
                    }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: {
                        onhover: { enable: true, mode: "grab" },
                        onclick: { enable: true, mode: "push" },
                        resize: true
                    },
                    modes: {
                        grab: { distance: 140, line_linked: { opacity: 0.5 } },
                        push: { particles_nb: 4 }
                    }
                },
                retina_detect: true
            });
        }
    }
}

// 绑定登录表单事件
function bindLoginEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username && password) {
                const userData = {
                    username: username,
                    uuid: 'temp-uuid', // 实际应用中应从后端获取
                    timestamp: Date.now()
                };
                AuthManager.saveLoginData(userData);
            } else {
                if (window.Notify) {
                    window.Notify.show({ message: '请输入用户名和密码', type: 'error' });
                }
            }
        });
    }
} 