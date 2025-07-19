/**
 * API核心管理器
 * 负责基础API功能、用户管理和URL构建
 */
class Core {
    constructor() {
        // 从环境配置获取baseUrl
        this.baseUrl = window.APP_CONFIG?.API_BASE_URL || '';
        this.currentUser = this.getCurrentUser();
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

    // 获取当前用户信息
    getCurrentUser() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                // 同步到实例变量
                this.currentUser = user;
                return user;
            } catch (error) {
                localStorage.removeItem('currentUser');
                this.currentUser = null;
                return null;
            }
        }
        this.currentUser = null;
        return null;
    }

    // 设置当前用户信息
    setCurrentUser(userData) {
        this.currentUser = userData;
        if (userData) {
            localStorage.setItem('currentUser', JSON.stringify(userData));
        } else {
            localStorage.removeItem('currentUser');
        }
    }

    // 获取当前用户UUID
    getCurrentUserId() {
        return this.currentUser?.uuid;
    }

    // 检查是否为管理员
    isAdmin() {
        return this.currentUser?.isAdmin === true;
    }

    // 检查用户是否已登录
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 清除用户数据
    clearUserData() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
} 