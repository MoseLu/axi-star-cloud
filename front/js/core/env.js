/**
 * 动态环境配置系统 (Dynamic Environment Configuration System)
 * 类似EPS设计，支持动态切换环境配置
 */

// 环境配置管理器
window.ENV_MANAGER = (function() {
    // 环境配置定义
    const ENVIRONMENTS = {
        // 开发环境
        local: {
            name: '开发环境',
            apiBaseUrl: 'http://localhost:8080',
            debug: true,
            features: {
                hotReload: true,
                detailedLogs: true,
                mockData: false
            }
        },
        // 生产环境
        prod: {
            name: '生产环境',
            apiBaseUrl: 'https://redamancy.com.cn',
            debug: false,
            features: {
                hotReload: false,
                detailedLogs: false,
                mockData: false
            }
        }
    };

    // 当前环境配置
    let currentEnv = 'local';
    let customConfig = null;

    // 环境检测函数
    function detectEnvironment() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const protocol = window.location.protocol;
        
        // 开发环境检测 - localhost
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            (hostname === 'localhost' && (port === '8080' || port === '8081' || port === '' || port === '3000')) ||
            protocol === 'file:' ||
            hostname.includes('localhost')) {
            return 'local';
        }
        
        // 生产环境检测 - redamancy.com.cn
        if (hostname === 'redamancy.com.cn' || 
            hostname === 'www.redamancy.com.cn' ||
            hostname.includes('redamancy.com.cn')) {
            return 'prod';
        }
        
        // 其他情况默认使用开发环境（更安全）
        return 'local';
    }

    // 从URL参数获取环境配置
    function getEnvFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('env');
    }

    // 清除localStorage中的环境配置
    function clearStoredEnvironment() {
        if (window.StorageManager && typeof window.StorageManager.setEnvironment === 'function') {
            window.StorageManager.setEnvironment(null);
        } else {
            // 如果 StorageManager 未加载，清除新的键结构中的环境设置
            const systemData = localStorage.getItem('systemInfo');
            if (systemData) {
                try {
                    const systemInfo = JSON.parse(systemData);
                    delete systemInfo.environment;
                    localStorage.setItem('systemInfo', JSON.stringify(systemInfo));
                } catch (error) {
                    console.warn('清除环境设置失败:', error);
                }
            }
        }
    }

    // 从localStorage获取保存的环境配置
    function getEnvFromStorage() {
        if (window.StorageManager && typeof window.StorageManager.getEnvironment === 'function') {
            return window.StorageManager.getEnvironment();
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
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

    // 保存环境配置到localStorage
    function saveEnvToStorage(env) {
        if (window.StorageManager && typeof window.StorageManager.setEnvironment === 'function') {
            window.StorageManager.setEnvironment(env);
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
            const systemData = localStorage.getItem('systemInfo');
            let systemInfo = {};
            if (systemData) {
                try {
                    systemInfo = JSON.parse(systemData);
                } catch (error) {
                    console.warn('解析系统信息失败:', error);
                }
            }
            systemInfo.environment = env;
            localStorage.setItem('systemInfo', JSON.stringify(systemInfo));
        }
    }

    // 初始化环境配置
    function initEnvironment() {
<<<<<<< HEAD
        // 优先从URL参数获取环境配置
        const urlEnv = getEnvFromUrl();
        if (urlEnv && ENVIRONMENTS[urlEnv]) {
            currentEnv = urlEnv;
            saveEnvToStorage(currentEnv);
        } else {
            // 从localStorage获取保存的环境配置
            const storedEnv = getEnvFromStorage();
            if (storedEnv && ENVIRONMENTS[storedEnv]) {
                currentEnv = storedEnv;
            } else {
                // 自动检测环境
                const detectedEnv = detectEnvironment();
                currentEnv = detectedEnv;
                saveEnvToStorage(currentEnv);
            }
        }
        
        // 强制刷新时检测环境变化
        const storageEnv = getEnvFromStorage();
        const detectedEnv = detectEnvironment();
        if (storageEnv && storageEnv !== detectedEnv) {
            // 环境发生变化，更新为检测到的环境
            currentEnv = detectedEnv;
            saveEnvToStorage(currentEnv);
        }
=======
        // 优先级：URL参数 > localStorage > 自动检测
        const urlEnv = getEnvFromUrl();
        const storageEnv = getEnvFromStorage();
        const detectedEnv = detectEnvironment();
        
        let env = urlEnv || storageEnv || detectedEnv;
        
        // 验证环境是否有效
        if (!ENVIRONMENTS[env]) {
            console.warn(`❌ 无效的环境配置: ${env}，使用默认环境: local`);
            env = 'local';
        }
        
        currentEnv = env;
        saveEnvToStorage(env);
        
        return env;
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
    }

    // 切换环境
    function switchEnvironment(env, customApiUrl = null) {
        if (!ENVIRONMENTS[env] && env !== 'custom') {
            console.error(`无效的环境: ${env}`);
            return false;
        }
        
        currentEnv = env;
        saveEnvToStorage(env);
        
        if (env === 'custom' && customApiUrl) {
            customConfig = {
                ...ENVIRONMENTS.custom,
                apiBaseUrl: customApiUrl
            };
        }
        
        // 触发环境切换事件
        window.dispatchEvent(new CustomEvent('environmentChanged', {
            detail: { environment: env, config: getCurrentEnvironment() }
        }));
        
        return true;
    }

    // 获取当前环境配置
    function getCurrentEnvironment() {
        if (currentEnv === 'custom' && customConfig) {
            return customConfig;
        }
        return ENVIRONMENTS[currentEnv];
    }

    // 获取所有可用环境
    function getAvailableEnvironments() {
        return Object.keys(ENVIRONMENTS).map(key => ({
            key: key,
            name: ENVIRONMENTS[key].name,
            isCurrent: key === currentEnv
        }));
    }

    // 构建API URL
    function buildApiUrl(endpoint) {
        if (!endpoint) return null;
        
        const config = getCurrentEnvironment();
        
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        // 如果API_BASE_URL为空，使用相对路径
        if (!config.apiBaseUrl) {
            return endpoint;
        }
        
        return config.apiBaseUrl + endpoint;
    }

<<<<<<< HEAD
    /**
     * 构建资源URL
     */
    function buildResourceUrl(path) {
        if (!path) return '';
        
        // 如果是绝对URL，直接返回
=======
    // 构建资源URL
    function buildResourceUrl(path) {
        if (!path) return null;
        
        const config = getCurrentEnvironment();
        
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
<<<<<<< HEAD
        // 如果是相对路径，添加baseUrl
        const baseUrl = getCurrentEnvironment()?.apiBaseUrl || 'https://redamancy.com.cn';
        return `${baseUrl}${path}`;
=======
        if (path.startsWith('/')) {
            if (!config.apiBaseUrl) {
                return path;
            }
            return config.apiBaseUrl + path;
        }
        
        if (!config.apiBaseUrl) {
            return '/' + path;
        }
        
        return config.apiBaseUrl + '/' + path;
    }

    // 构建头像URL
    function buildAvatarUrl(avatarPath) {
        if (!avatarPath || avatarPath === 'null' || avatarPath === 'undefined') {
            return '/static/public/docs.png';
        }
        
        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
            return avatarPath;
        }
        
        if (avatarPath.startsWith('/uploads/avatars/')) {
            const fileName = avatarPath.replace('/uploads/avatars/', '');
            return window.apiGateway?.buildUrl('/uploads/avatars/' + fileName) || ('/uploads/avatars/' + fileName);
        }
        
        if (avatarPath.startsWith('/')) {
            return avatarPath;
        }
        
        if (avatarPath.includes('avatars/')) {
            return window.apiGateway?.buildUrl('/uploads/' + avatarPath) || ('/uploads/' + avatarPath);
        } else {
            return window.apiGateway?.buildUrl('/uploads/avatars/' + avatarPath) || ('/uploads/avatars/' + avatarPath);
        }
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
    }

    // 构建文件URL
    function buildFileUrl(filePath) {
        if (!filePath) return '/static/public/docs.png';
        
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        
        if (filePath.startsWith('/')) {
            return filePath;
        }
        
        return '/uploads/' + filePath;
    }

    // 检查功能是否启用
    function isFeatureEnabled(feature) {
        const config = getCurrentEnvironment();
        return config.features && config.features[feature];
    }

    // 获取调试信息
    function getDebugInfo() {
        const config = getCurrentEnvironment();
        return {
            environment: currentEnv,
            name: config.name,
            apiBaseUrl: config.apiBaseUrl,
            debug: config.debug,
            features: config.features,
            hostname: window.location.hostname,
            port: window.location.port,
            protocol: window.location.protocol
        };
    }

    // 初始化
    initEnvironment();

    // 返回公共API
    return {
        // 环境管理
        switchEnvironment,
        getCurrentEnvironment,
        getAvailableEnvironments,
        getDebugInfo,
        
        // URL构建
        buildApiUrl,
        buildResourceUrl,
<<<<<<< HEAD
=======
        buildAvatarUrl,
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
        buildFileUrl,
        
        // 功能检查
        isFeatureEnabled,
        
        // 配置访问
        get config() {
            return getCurrentEnvironment();
        },
        get currentEnv() {
            return currentEnv;
        },
        clearStoredEnvironment // 添加清除localStorage的方法
    };
})();

// 兼容性：保持原有的APP_CONFIG和APP_UTILS
window.APP_CONFIG = {
    get API_BASE_URL() {
        return window.ENV_MANAGER.config.apiBaseUrl;
    },
    get ENV() {
        return window.ENV_MANAGER.currentEnv;
    },
    get DEBUG() {
        return window.ENV_MANAGER.config.debug;
    },
    get HOSTNAME() {
        return window.location.hostname;
    }
};

window.APP_UTILS = {
    buildResourceUrl: window.ENV_MANAGER.buildResourceUrl,
    buildApiUrl: window.ENV_MANAGER.buildApiUrl,
<<<<<<< HEAD
=======
    buildAvatarUrl: window.ENV_MANAGER.buildAvatarUrl,
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
    buildFileUrl: window.ENV_MANAGER.buildFileUrl
};

// 环境切换工具函数
window.ENV_UTILS = {
    // 快速切换到开发环境
    switchToLocal: () => window.ENV_MANAGER.switchEnvironment('local'),
    
    // 快速切换到生产环境
    switchToProd: () => window.ENV_MANAGER.switchEnvironment('prod'),
    
    // 获取当前环境信息
    getCurrentEnv: () => window.ENV_MANAGER.getDebugInfo(),
    
    // 显示环境信息
    showEnvInfo: () => {
        const info = window.ENV_MANAGER.getDebugInfo();
        return info;
    }
};

 