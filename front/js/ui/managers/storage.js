/**
 * 统一本地存储管理器
 * 将数据分为用户信息和系统信息两大类，进一步减少存储键
 * 用户信息完全合并：currentUser + userData + avatarUrl + lastLogin
 * 确保只使用 userInfo 和 systemInfo 两个键
 */
class StorageManager {
    constructor() {
        // 定义存储键常量
        this.KEYS = {
            // 用户信息（完全合并所有用户相关数据）
            USER_INFO: 'userInfo',
            
            // 系统信息（合并所有系统配置和状态）
            SYSTEM_INFO: 'systemInfo'
        };
        
        this.init();
    }
    
    init() {
        // 迁移旧数据到新结构
        this.migrateOldData();
    }
    
    /**
     * 迁移旧数据到新的统一结构
     */
    migrateOldData() {
        // 迁移用户信息 - 完全合并
        const oldCurrentUser = localStorage.getItem('currentUser');
        const oldUserData = localStorage.getItem('userData');
        const oldCachedAvatar = localStorage.getItem('cachedAvatar');
        const oldLastLoginTime = localStorage.getItem('lastLoginTime');
        
        let userInfo = {};
        
        // 合并 currentUser 数据
        if (oldCurrentUser) {
            try {
                const currentUser = JSON.parse(oldCurrentUser);
                userInfo = { ...userInfo, ...currentUser };
                localStorage.removeItem('currentUser');
            } catch (e) {
                console.warn('迁移 currentUser 失败:', e);
            }
        }
        
        // 合并 userData 数据
        if (oldUserData) {
            try {
                const userDataObj = JSON.parse(oldUserData);
                userInfo = { ...userInfo, ...userDataObj };
                localStorage.removeItem('userData');
            } catch (e) {
                console.warn('迁移 userData 失败:', e);
            }
        }
        
        // 添加头像URL
        if (oldCachedAvatar) {
            userInfo.avatarUrl = oldCachedAvatar;
            localStorage.removeItem('cachedAvatar');
        }
        
        // 添加最后登录时间
        if (oldLastLoginTime) {
            userInfo.lastLogin = oldLastLoginTime;
            localStorage.removeItem('lastLoginTime');
        }
        
        if (Object.keys(userInfo).length > 0) {
            this.setUserInfo(userInfo);
        }
        
        // 迁移系统信息
        const oldAppEnvironment = localStorage.getItem('app_environment');
        const oldTheme = localStorage.getItem('theme') || localStorage.getItem('currentTheme');
        const oldStorageInfo = localStorage.getItem('storageInfo');
        const oldStorageStatus = localStorage.getItem('storageStatus');
        
        let systemInfo = {};
        
        // 环境设置
        if (oldAppEnvironment) {
            systemInfo.environment = oldAppEnvironment;
            localStorage.removeItem('app_environment');
        }
        
        // 主题设置
        if (oldTheme) {
            systemInfo.theme = oldTheme;
            localStorage.removeItem('theme');
            localStorage.removeItem('currentTheme');
        }
        
        // 存储信息
        if (oldStorageInfo) {
            try {
                systemInfo.storageInfo = JSON.parse(oldStorageInfo);
                localStorage.removeItem('storageInfo');
            } catch (e) {
                console.warn('迁移 storageInfo 失败:', e);
            }
        }
        
        // 存储状态
        if (oldStorageStatus) {
            try {
                systemInfo.storageStatus = JSON.parse(oldStorageStatus);
                localStorage.removeItem('storageStatus');
            } catch (e) {
                console.warn('迁移 storageStatus 失败:', e);
            }
        }
        
        if (Object.keys(systemInfo).length > 0) {
            this.setSystemInfo(systemInfo);
        }
    }
    
    // ==================== 用户信息管理 ====================
    
    /**
     * 设置用户信息（完全合并的用户数据）
     * @param {Object} userInfo - 用户信息对象，包含所有用户相关数据
     */
    setUserInfo(userInfo) {
        localStorage.setItem(this.KEYS.USER_INFO, JSON.stringify(userInfo));
    }
    
    /**
     * 获取用户信息（完全合并的用户数据）
     * @returns {Object|null} 用户信息对象
     */
    getUserInfo() {
        const data = localStorage.getItem(this.KEYS.USER_INFO);
        return data ? JSON.parse(data) : null;
    }
    
    /**
     * 更新用户信息（部分更新）
     * @param {Object} updates - 要更新的字段
     */
    updateUserInfo(updates) {
        const currentUserInfo = this.getUserInfo();
        if (currentUserInfo) {
            const updatedUserInfo = { ...currentUserInfo, ...updates };
            this.setUserInfo(updatedUserInfo);
        }
    }
    
    /**
     * 清除用户信息
     */
    clearUserInfo() {
        localStorage.removeItem(this.KEYS.USER_INFO);
    }
    
    // ==================== 系统信息管理 ====================
    
    /**
     * 设置系统信息
     * @param {Object} systemInfo - 系统信息对象
     */
    setSystemInfo(systemInfo) {
        localStorage.setItem(this.KEYS.SYSTEM_INFO, JSON.stringify(systemInfo));
    }
    
    /**
     * 获取系统信息
     * @returns {Object|null} 系统信息对象
     */
    getSystemInfo() {
        const data = localStorage.getItem(this.KEYS.SYSTEM_INFO);
        return data ? JSON.parse(data) : {};
    }
    
    /**
     * 更新系统信息（部分更新）
     * @param {Object} updates - 要更新的字段
     */
    updateSystemInfo(updates) {
        const currentSystemInfo = this.getSystemInfo();
        const updatedSystemInfo = { ...currentSystemInfo, ...updates };
        this.setSystemInfo(updatedSystemInfo);
    }
    
    /**
     * 清除系统信息
     */
    clearSystemInfo() {
        localStorage.removeItem(this.KEYS.SYSTEM_INFO);
    }
    
    // ==================== 便捷方法 - 用户信息 ====================
    
    /**
     * 获取用户数据（兼容旧API）
     */
    getUser() {
        return this.getUserInfo();
    }
    
    /**
     * 设置用户数据（兼容旧API）
     */
    setUser(userData) {
        this.setUserInfo(userData);
    }
    
    /**
     * 获取头像URL
     */
    getAvatar() {
        const userInfo = this.getUserInfo();
        return userInfo ? userInfo.avatarUrl : null;
    }
    
    /**
     * 设置头像URL
     */
    setAvatar(avatarUrl) {
        this.updateUserInfo({ avatarUrl });
    }
    
    /**
     * 获取最后登录时间
     */
    getLastLogin() {
        const userInfo = this.getUserInfo();
        return userInfo ? userInfo.lastLogin : null;
    }
    
    /**
     * 设置最后登录时间
     */
    setLastLogin(loginTime) {
        this.updateUserInfo({ lastLogin: loginTime });
    }
    
    /**
     * 清除用户数据（兼容旧API）
     */
    clearUser() {
        this.clearUserInfo();
    }
    
    // ==================== 便捷方法 - 系统信息 ====================
    
    /**
     * 获取当前环境
     */
    getEnvironment() {
        const systemInfo = this.getSystemInfo();
        return systemInfo.environment || 'prod';
    }
    
    /**
     * 设置当前环境
     */
    setEnvironment(environment) {
        this.updateSystemInfo({ environment });
    }
    
    /**
     * 获取当前主题
     */
    getTheme() {
        const systemInfo = this.getSystemInfo();
        return systemInfo.theme || 'dark';
    }
    
    /**
     * 设置当前主题
     */
    setTheme(theme) {
        this.updateSystemInfo({ theme });
    }
    
    /**
     * 获取存储信息
     */
    getStorageInfo() {
        const systemInfo = this.getSystemInfo();
        return systemInfo.storageInfo || null;
    }
    
    /**
     * 设置存储信息
     */
    setStorageInfo(storageInfo) {
        this.updateSystemInfo({ storageInfo });
    }
    
    /**
     * 获取存储状态
     */
    getStorageStatus() {
        const systemInfo = this.getSystemInfo();
        return systemInfo.storageStatus || null;
    }
    
    /**
     * 设置存储状态
     */
    setStorageStatus(storageStatus) {
        this.updateSystemInfo({ storageStatus });
        
        // 触发自定义事件，通知其他模块存储状态已更新
        window.dispatchEvent(new CustomEvent('storageStatusUpdated', {
            detail: storageStatus
        }));
    }
    
    // ==================== 工具方法 ====================
    
    /**
     * 清除所有数据
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
    
    /**
     * 获取存储使用情况
     */
    getStorageUsage() {
        const usage = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            const data = localStorage.getItem(key);
            if (data) {
                usage[name] = {
                    key: key,
                    size: new Blob([data]).size,
                    data: data
                };
            }
        });
        return usage;
    }
    
    /**
     * 清理过期数据
     */
    cleanup() {
        // 清理过期的缩略图缓存（保留最近使用的）
        const thumbnails = this.getThumbnails();
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
        
        Object.keys(thumbnails).forEach(key => {
            if (thumbnails[key].timestamp && (now - thumbnails[key].timestamp) > maxAge) {
                delete thumbnails[key];
            }
        });
        
        this.setThumbnails(thumbnails);
    }
    
    /**
     * 清理所有旧的存储键
     */
    cleanupOldKeys() {
        const oldKeys = [
            'currentUser',
            'userData', 
            'cachedAvatar',
            'lastLoginTime',
            'app_environment',
            'storageInfo',
            // 'storageStatus', // 暂时保留，因为欢迎模块可能还在使用
            'theme',
            'currentTheme'
        ];
        
        let cleanedCount = 0;
        oldKeys.forEach(key => {
            if (localStorage.getItem(key) !== null) {
                localStorage.removeItem(key);
                cleanedCount++;
            }
        });
        
        return cleanedCount;
    }
    
    // ==================== 临时数据管理（保持原有结构） ====================
    
    /**
     * 设置缩略图缓存
     */
    setThumbnail(key, data) {
        const thumbnails = this.getThumbnails();
        thumbnails[key] = data;
        localStorage.setItem('thumbnails', JSON.stringify(thumbnails));
    }
    
    /**
     * 获取缩略图缓存
     */
    getThumbnail(key) {
        const thumbnails = this.getThumbnails();
        return thumbnails[key] || null;
    }
    
    /**
     * 获取所有缩略图缓存
     */
    getThumbnails() {
        const data = localStorage.getItem('thumbnails');
        return data ? JSON.parse(data) : {};
    }
    
    /**
     * 设置缩略图缓存
     */
    setThumbnails(thumbnails) {
        localStorage.setItem('thumbnails', JSON.stringify(thumbnails));
    }
    
    /**
     * 设置认证令牌
     */
    setToken(token) {
        localStorage.setItem('token', token);
    }
    
    /**
     * 获取认证令牌
     */
    getToken() {
        return localStorage.getItem('token');
    }
}

// 创建全局实例
window.StorageManager = new StorageManager();

// 添加测试方法
window.StorageManager.testMigration = function() {
    // 检查是否还有旧的存储键
    const oldKeys = ['currentUser', 'userData', 'cachedAvatar', 'lastLoginTime', 'app_environment', 'storageInfo', 'storageStatus', 'theme', 'currentTheme'];
    const remainingOldKeys = oldKeys.filter(key => localStorage.getItem(key) !== null);
    
    if (remainingOldKeys.length > 0) {
        console.warn('⚠️ 发现旧的存储键:', remainingOldKeys);
    }
}; 