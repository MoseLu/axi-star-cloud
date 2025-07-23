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
            apiBaseUrl: '', // 相对路径，前后端同域名
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
        
        // 开发环境检测
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            (hostname === 'localhost' && port === '8080')) {
            return 'local';
        }
        
        // 生产环境（默认）
        return 'prod';
    }

    // 从URL参数获取环境配置
    function getEnvFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('env');
    }

    // 从localStorage获取保存的环境配置
    function getEnvFromStorage() {
        return localStorage.getItem('app_environment');
    }

    // 保存环境配置到localStorage
    function saveEnvToStorage(env) {
        localStorage.setItem('app_environment', env);
    }

    // 初始化环境配置
    function initEnvironment() {
        // 优先级：URL参数 > localStorage > 自动检测
        let env = getEnvFromUrl() || getEnvFromStorage() || detectEnvironment();
        
        // 验证环境是否有效
        if (!ENVIRONMENTS[env]) {
            console.warn(`无效的环境配置: ${env}，使用默认环境: local`);
            env = 'local';
        }
        
        currentEnv = env;
        saveEnvToStorage(env);
        
        console.log(`🌍 当前环境: ${ENVIRONMENTS[env].name} (${env})`);
        return env;
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
        
        console.log(`🔄 切换到环境: ${getCurrentEnvironment().name} (${env})`);
        
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

    // 构建资源URL
    function buildResourceUrl(path) {
        if (!path) return null;
        
        const config = getCurrentEnvironment();
        
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
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
        if (!avatarPath || avatarPath.trim() === '') {
            return '/static/public/docs.png';
        }
        
        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
            return avatarPath;
        }
        
        if (avatarPath === 'avatar.png') {
            return '/static/public/docs.png';
        }
        
        if (avatarPath.startsWith('/uploads/avatars/')) {
            const fileName = avatarPath.replace('/uploads/avatars/', '');
            return '/uploads/avatars/' + fileName;
        }
        
        if (avatarPath.startsWith('/')) {
            return avatarPath;
        }
        
        if (avatarPath.includes('avatars/')) {
            return '/uploads/' + avatarPath;
        } else {
            return '/uploads/avatars/' + avatarPath;
        }
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
        buildAvatarUrl,
        buildFileUrl,
        
        // 功能检查
        isFeatureEnabled,
        
        // 配置访问
        get config() {
            return getCurrentEnvironment();
        },
        get currentEnv() {
            return currentEnv;
        }
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
    buildAvatarUrl: window.ENV_MANAGER.buildAvatarUrl,
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
        console.group('🌍 环境信息');
        console.log('环境:', info.name);
        console.log('API地址:', info.apiBaseUrl);
        console.log('调试模式:', info.debug);
        console.log('功能特性:', info.features);
        console.groupEnd();
    }
};

    // 开发模式下显示环境信息
    if (window.ENV_MANAGER.config.debug) {
        window.ENV_UTILS.showEnvInfo();
        
        // 在控制台提供便捷的环境切换命令
        console.log('💡 环境切换命令:');
        console.log('  ENV_UTILS.switchToLocal()  - 切换到开发环境');
        console.log('  ENV_UTILS.switchToProd()   - 切换到生产环境');
        console.log('  ENV_UTILS.showEnvInfo()    - 显示当前环境信息');
    }

 