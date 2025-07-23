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
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                // 验证用户数据完整性
                if (user && user.uuid && user.username) {
                    // 同步到实例变量
                    this.currentUser = user;
                    return user;
                } else {
                    console.warn('用户数据不完整，清除登录状态');
                    localStorage.removeItem('currentUser');
                    this.currentUser = null;
                    return null;
                }
            } catch (error) {
                console.error('解析用户数据失败:', error);
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
        if (userData && userData.uuid && userData.username) {
            localStorage.setItem('currentUser', JSON.stringify(userData));
        } else if (userData === null) {
            // 只有在明确传入null时才清除登录数据
            localStorage.removeItem('currentUser');
        }
    }

    // 获取当前用户UUID
    getCurrentUserId() {
        const userId = this.currentUser?.uuid;
        return userId;
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

    // 更新baseUrl（用于环境切换）
    updateBaseUrl() {
        this.baseUrl = window.APP_CONFIG?.API_BASE_URL || '';
    }
} 
window.Core = Core; 