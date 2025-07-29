/**
 * 环境管理模块
 * 负责环境切换、环境相关数据处理和缓存管理
 */
class AppEnvironmentManager {
    constructor(appCore) {
        this.appCore = appCore;
        this.authManager = appCore.authManager;
        this.apiManager = appCore.apiManager;
        this.uiManager = appCore.uiManager;
<<<<<<< HEAD
        this.isEnvironmentDetected = false; // 环境检测完成标记
=======
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
        this.init();
    }

    /**
     * 初始化环境管理
     */
    init() {
        this.setupEnvironmentChangeListener();
<<<<<<< HEAD
        
        // 检查是否为强制刷新，如果是则延迟更新环境信息
        if (window.isForceRefresh) {
            this.handleForceRefreshEnvironmentUpdate();
        } else {
            // 非强制刷新情况下，立即标记环境检测完成
            this.isEnvironmentDetected = true;
        }
=======
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
    }

    /**
     * 设置环境切换事件监听
     */
    setupEnvironmentChangeListener() {
        window.addEventListener('environmentChanged', async (event) => {
            try {
                
                // 更新API网关的baseUrl
                if (window.apiGateway && typeof window.apiGateway.updateBaseUrl === 'function') {
                    window.apiGateway.updateBaseUrl();
                }
                
                // 更新认证管理器的baseUrl
                if (window.authManager && typeof window.authManager.updateBaseUrl === 'function') {
                    window.authManager.updateBaseUrl();
                }
                
                // 环境切换时重新获取头像信息
                if (this.uiManager) {
                    const userDataFromStorage = localStorage.getItem('userInfo');
                    
                    if (userDataFromStorage) {
                        try {
                            const userData = JSON.parse(userDataFromStorage);
                            
                            // 重新获取用户资料，更新头像缓存
                            const userId = userData.uuid || userData.id;
                            if (userId) {
                                const response = await window.apiGateway.get(`/api/profile?user_id=${userId}`);
                                if (response.ok) {
                                    const result = await response.json();
<<<<<<< HEAD
                                    if (result.success && result.profile && result.profile.avatarUrl) {
                                        // 使用新的头像URL
                                        const newAvatarUrl = result.profile.avatarUrl;
=======
                                    if (result.success && result.profile && result.profile.avatar) {
                                        // 构建新环境的头像URL
                                        const newAvatarUrl = window.apiGateway?.buildUrl('/uploads/avatars/' + result.profile.avatar);
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
                                        if (newAvatarUrl) {
                                            // 更新用户信息，包含新的头像URL
                                            const updatedUserInfo = {
                                                ...userData,
                                                ...result.profile,
                                                avatarUrl: newAvatarUrl
                                            };
                                            
                                            if (window.StorageManager && typeof window.StorageManager.setUserInfo === 'function') {
                                                window.StorageManager.setUserInfo(updatedUserInfo);
                                            } else if (window.StorageManager && typeof window.StorageManager.setUser === 'function') {
                                                window.StorageManager.setUser(updatedUserInfo);
                                            } else {
                                                // 如果 StorageManager 未加载，直接使用新的键结构
                                                const userInfo = {
                                                    ...userData,
                                                    ...result.profile,
                                                    avatarUrl: newAvatarUrl
                                                };
                                                localStorage.setItem('userInfo', JSON.stringify(userInfo));
                                            }
                                            
                                            // 更新显示
                                            this.uiManager.updateProfileDisplay(updatedUserInfo);
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('🔄 环境切换时获取新头像失败:', error);
                            // 如果获取失败，清除旧缓存，显示默认图标
                            if (window.StorageManager && typeof window.StorageManager.setAvatar === 'function') {
                                window.StorageManager.setAvatar(null);
                            } else {
                                // 如果 StorageManager 未加载，清除新的键结构中的头像URL
                                const userData = localStorage.getItem('userInfo');
                                if (userData) {
                                    try {
                                        const userInfo = JSON.parse(userData);
                                        delete userInfo.avatarUrl;
                                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                                    } catch (error) {
                                        console.warn('清除头像URL失败:', error);
                                    }
                                }
                            }
                            if (this.uiManager) {
                                this.uiManager.updateProfileDisplayFromCache(userData);
                            }
                        }
                    }
                }
                
            } catch (error) {
                console.error('❌ 环境切换后数据重新加载失败:', error);
            }
        });
    }

    /**
<<<<<<< HEAD
     * 处理强制刷新后的环境更新
     */
    async handleForceRefreshEnvironmentUpdate() {
        try {
            // 延迟执行，确保所有模块都已初始化
            setTimeout(async () => {
                // 检测当前环境
                const detectedEnv = this.detectCurrentEnvironment();
                
                // 获取当前存储的环境信息
                const storedEnv = this.getStoredEnvironment();
                
                // 如果检测到的环境与存储的环境不同，更新本地缓存
                if (detectedEnv !== storedEnv) {
                    // 更新本地缓存中的环境信息
                    this.updateStoredEnvironment(detectedEnv);
                    
                    // 更新系统信息中的环境属性
                    this.updateSystemInfoEnvironment(detectedEnv);
                    
                    // 触发环境切换事件
                    await this.switchEnvironment(detectedEnv);
                } else {
                    // 标记环境检测完成
                    this.isEnvironmentDetected = true;
                }
                
                // 触发强制刷新完成事件，让其他组件（如粒子特效）能够重新初始化
                const forceRefreshEvent = new CustomEvent('forceRefreshComplete', {
                    detail: { 
                        detectedEnvironment: detectedEnv,
                        storedEnvironment: storedEnv,
                        environmentChanged: detectedEnv !== storedEnv
                    }
                });
                window.dispatchEvent(forceRefreshEvent);
                
            }, 1500); // 延迟1.5秒执行，确保环境切换器已初始化
            
        } catch (error) {
            console.error('❌ 强制刷新后环境更新失败:', error);
            // 即使失败也要标记为完成
            this.isEnvironmentDetected = true;
            
            // 即使失败也要触发强制刷新完成事件
            const forceRefreshEvent = new CustomEvent('forceRefreshComplete', {
                detail: { 
                    error: error.message,
                    environmentChanged: false
                }
            });
            window.dispatchEvent(forceRefreshEvent);
        }
    }

    /**
     * 检测当前环境
     */
    detectCurrentEnvironment() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        // 开发环境检测
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            (hostname === 'localhost' && (port === '8080' || port === '8081' || port === '' || port === '3000')) ||
            protocol === 'file:' ||
            hostname.includes('localhost')) {
            return 'local';
        }
        
        // 生产环境检测
        if (hostname === 'redamancy.com.cn' || 
            hostname === 'www.redamancy.com.cn' ||
            hostname.includes('redamancy.com.cn')) {
            return 'prod';
        }
        
        // 默认使用开发环境
        return 'local';
    }

    /**
     * 获取存储的环境信息
     */
    getStoredEnvironment() {
        if (window.StorageManager && typeof window.StorageManager.getEnvironment === 'function') {
            return window.StorageManager.getEnvironment();
        } else {
            // 从systemInfo中获取环境信息
            const systemData = localStorage.getItem('systemInfo');
            if (systemData) {
                try {
                    const systemInfo = JSON.parse(systemData);
                    return systemInfo.environment || 'prod';
                } catch (error) {
                    console.warn('解析系统信息失败:', error);
                }
            }
            return 'prod';
        }
    }

    /**
     * 更新存储的环境信息
     */
    updateStoredEnvironment(environment) {
        if (window.StorageManager && typeof window.StorageManager.setEnvironment === 'function') {
            window.StorageManager.setEnvironment(environment);
        } else {
            // 更新systemInfo中的环境信息
            const systemData = localStorage.getItem('systemInfo');
            let systemInfo = {};
            if (systemData) {
                try {
                    systemInfo = JSON.parse(systemData);
                } catch (error) {
                    console.warn('解析系统信息失败:', error);
                }
            }
            systemInfo.environment = environment;
            localStorage.setItem('systemInfo', JSON.stringify(systemInfo));
        }
    }

    /**
     * 更新系统信息中的环境属性
     */
    updateSystemInfoEnvironment(environment) {
        try {
            const systemData = localStorage.getItem('systemInfo');
            let systemInfo = {};
            
            if (systemData) {
                try {
                    systemInfo = JSON.parse(systemData);
                } catch (error) {
                    console.warn('解析系统信息失败:', error);
                }
            }
            
            // 更新环境信息
            systemInfo.environment = environment;
            systemInfo.lastEnvironmentUpdate = new Date().toISOString();
            systemInfo.forceRefreshDetected = true;
            
            localStorage.setItem('systemInfo', JSON.stringify(systemInfo));
            
        } catch (error) {
            console.error('❌ 更新系统信息环境属性失败:', error);
        }
    }

    /**
=======
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
     * 切换环境
     */
    async switchEnvironment(env, customApiUrl = null) {
        try {
            // 更新环境配置
            if (window.ENV_MANAGER && typeof window.ENV_MANAGER.switchEnvironment === 'function') {
                window.ENV_MANAGER.switchEnvironment(env, customApiUrl);
            }
            
            // 触发环境切换事件
            const event = new CustomEvent('environmentChanged', { 
                detail: { environment: env, customApiUrl } 
            });
            window.dispatchEvent(event);
            
        } catch (error) {
            console.error('❌ 环境切换失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前环境
     */
    getCurrentEnvironment() {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.getCurrentEnvironment === 'function') {
            return window.ENV_MANAGER.getCurrentEnvironment();
        }
        return 'prod'; // 默认生产环境
    }

    /**
     * 获取可用环境列表
     */
    getAvailableEnvironments() {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.getAvailableEnvironments === 'function') {
            return window.ENV_MANAGER.getAvailableEnvironments();
        }
        return ['local', 'prod'];
    }

    /**
     * 检查是否为开发环境
     */
    isDevelopmentEnvironment() {
        const currentEnv = this.getCurrentEnvironment();
        return currentEnv === 'local' || currentEnv === 'dev';
    }

    /**
     * 检查是否为生产环境
     */
    isProductionEnvironment() {
        const currentEnv = this.getCurrentEnvironment();
        return currentEnv === 'prod';
    }

    /**
     * 获取环境配置
     */
    getEnvironmentConfig() {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.config === 'object') {
            return window.ENV_MANAGER.config;
        }
        return null;
    }

    /**
     * 构建API URL
     */
    buildApiUrl(endpoint) {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.buildApiUrl === 'function') {
            return window.ENV_MANAGER.buildApiUrl(endpoint);
        }
        
        // 降级处理
        const baseUrl = this.getEnvironmentConfig()?.apiBaseUrl || 'https://redamancy.com.cn';
        return `${baseUrl}${endpoint}`;
    }

    /**
     * 构建资源URL
     */
    buildResourceUrl(path) {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.buildResourceUrl === 'function') {
            return window.ENV_MANAGER.buildResourceUrl(path);
        }
        
        // 降级处理
        const baseUrl = this.getEnvironmentConfig()?.apiBaseUrl || 'https://redamancy.com.cn';
<<<<<<< HEAD
        return `${baseUrl}${path}`;
=======
        return `${baseUrl}/static${path}`;
    }

    /**
     * 构建头像URL
     */
    buildAvatarUrl(avatarPath) {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.buildAvatarUrl === 'function') {
            return window.ENV_MANAGER.buildAvatarUrl(avatarPath);
        }
        
        // 降级处理
        const baseUrl = this.getEnvironmentConfig()?.apiBaseUrl || 'https://redamancy.com.cn';
        return `${baseUrl}/uploads/avatars/${avatarPath}`;
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
    }

    /**
     * 构建文件URL
     */
    buildFileUrl(filePath) {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.buildFileUrl === 'function') {
            return window.ENV_MANAGER.buildFileUrl(filePath);
        }
        
        // 降级处理
        const baseUrl = this.getEnvironmentConfig()?.apiBaseUrl || 'https://redamancy.com.cn';
        return `${baseUrl}/uploads/${filePath}`;
    }

    /**
     * 检查功能是否启用
     */
    isFeatureEnabled(feature) {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.isFeatureEnabled === 'function') {
            return window.ENV_MANAGER.isFeatureEnabled(feature);
        }
        
        // 降级处理
        const config = this.getEnvironmentConfig();
        return config?.features?.[feature] || false;
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.getDebugInfo === 'function') {
            return window.ENV_MANAGER.getDebugInfo();
        }
        
        return {
            currentEnvironment: this.getCurrentEnvironment(),
            isDevelopment: this.isDevelopmentEnvironment(),
            isProduction: this.isProductionEnvironment(),
            config: this.getEnvironmentConfig(),
            timestamp: Date.now()
        };
    }

    /**
     * 清除环境缓存
     */
    clearEnvironmentCache() {
        try {
            // 清除localStorage中的环境相关缓存
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('env') || key.includes('environment'))) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
        } catch (error) {
            console.error('❌ 清除环境缓存失败:', error);
        }
    }

    /**
     * 重置环境配置
     */
    async resetEnvironment() {
        try {
            // 清除环境缓存
            this.clearEnvironmentCache();
            
            // 重新初始化环境
            if (window.ENV_MANAGER && typeof window.ENV_MANAGER.initEnvironment === 'function') {
                window.ENV_MANAGER.initEnvironment();
            }
            
            // 触发环境重置事件
            const event = new CustomEvent('environmentReset');
            window.dispatchEvent(event);
            
        } catch (error) {
            console.error('❌ 重置环境配置失败:', error);
            throw error;
        }
    }
}

// 导出AppEnvironmentManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppEnvironmentManager;
} 