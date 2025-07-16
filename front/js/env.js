// 智能环境检测和URL配置
window.APP_CONFIG = (function() {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || 
                        hostname === '127.0.0.1' ||
                        hostname.startsWith('192.168.');
    let API_BASE_URL = '';
    if (isLocalhost) {
        API_BASE_URL = 'http://localhost:8080';
    }
    return {
        API_BASE_URL: API_BASE_URL,
        ENV: isLocalhost ? 'local' : 'prod',
        DEBUG: isLocalhost
    };
})();

// 全局工具函数
window.APP_UTILS = {
    // 构建完整的资源URL
    buildResourceUrl: function(path) {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        if (path.startsWith('/')) {
            // 如果API_BASE_URL为空，使用相对路径
            if (!window.APP_CONFIG.API_BASE_URL) {
                return path;
            }
            return window.APP_CONFIG.API_BASE_URL + path;
        }
        // 如果API_BASE_URL为空，使用相对路径
        if (!window.APP_CONFIG.API_BASE_URL) {
            return '/' + path;
        }
        return window.APP_CONFIG.API_BASE_URL + '/' + path;
    },
    // 构建API URL
    buildApiUrl: function(endpoint) {
        if (!endpoint) return null;
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        // 如果API_BASE_URL为空，使用相对路径
        if (!window.APP_CONFIG.API_BASE_URL) {
            return endpoint;
        }
        return window.APP_CONFIG.API_BASE_URL + endpoint;
    },
    // 构建头像URL
    buildAvatarUrl: function(avatarPath) {
        if (!avatarPath || avatarPath.trim() === '') {
            return null;
        }
        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
            return avatarPath;
        }
        if (avatarPath === 'avatar.jpg') {
            return null;
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
    },
    // 构建文件URL
    buildFileUrl: function(filePath) {
        if (!filePath) return null;
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        if (filePath.startsWith('/')) {
            return filePath;
        }
        return '/uploads/' + filePath;
    }
};

console.log('🔧 应用配置已加载:', window.APP_CONFIG); 