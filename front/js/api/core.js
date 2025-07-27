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
        // 使用API网关构建URL
        if (window.apiGateway) {
            return window.apiGateway.buildUrl(endpoint);
        }
        
        // 备用方案：原来的逻辑
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
        // 优先从新的存储管理器获取
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            const user = window.StorageManager.getUser();
            if (user && user.uuid && user.username) {
                this.currentUser = user;
                return user;
            }
        }
        
        // 备用方案：从新的键结构获取
        const savedUser = localStorage.getItem('userInfo');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                // 验证用户数据完整性
                if (user && (user.uuid || user.id) && user.username) {
                    // 同步到实例变量
                    this.currentUser = user;
                    return user;
                } else {
                    console.warn('用户数据不完整，清除登录状态');
                    localStorage.removeItem('userInfo');
                    this.currentUser = null;
                    return null;
                }
            } catch (error) {
                console.error('解析用户数据失败:', error);
                localStorage.removeItem('userInfo');
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
        if (userData && (userData.uuid || userData.id) && userData.username) {
            // 优先使用新的存储管理器
            if (window.StorageManager && typeof window.StorageManager.setUser === 'function') {
                window.StorageManager.setUser(userData);
            } else {
                // 备用方案：直接使用新的键结构
                localStorage.setItem('userInfo', JSON.stringify(userData));
            }
        } else if (userData === null) {
            // 只有在明确传入null时才清除登录数据
            if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
                window.StorageManager.clearUser();
            } else {
                localStorage.removeItem('userInfo');
            }
        }
    }

    // 获取当前用户UUID
    getCurrentUserId() {
        const userId = this.currentUser?.uuid || this.currentUser?.id;
        return userId;
    }

    // 检查是否为管理员
    async isAdmin() {
        try {
            // 使用token验证管理员权限
            if (window.tokenManager && typeof window.tokenManager.validateAdminTokens === 'function') {
                return await window.tokenManager.validateAdminTokens();
            } else {
                // 兼容性处理：检查当前用户是否为管理员用户（Mose）
                const user = this.getCurrentUser();
                return user && user.username === 'Mose';
            }
        } catch (error) {
            console.error('验证管理员权限失败:', error);
            return false;
        }
    }

    // 检查用户是否已登录
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 清除用户数据
    clearUserData() {
        this.currentUser = null;
        if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
            window.StorageManager.clearUser();
        } else {
            localStorage.removeItem('userInfo');
        }
    }

    // 更新baseUrl（用于环境切换）
    updateBaseUrl() {
        this.baseUrl = window.APP_CONFIG?.API_BASE_URL || '';
    }
} 
window.Core = Core; 