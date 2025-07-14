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