// 智能环境检测和URL配置
window.APP_CONFIG = (function() {
    // 检测当前环境
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || 
                        hostname === '127.0.0.1' ||
                        hostname.startsWith('192.168.');
    const isCloudIP = hostname === '47.112.163.152';

    let API_BASE_URL;

    if (isLocalhost) {
        // 本地开发环境
        API_BASE_URL = 'http://localhost:8080';
        console.log('🌐 检测到本地开发环境，使用:', API_BASE_URL);
    } else if (isCloudIP) {
        // 云服务器环境
        API_BASE_URL = 'http://47.112.163.152:8080';
        console.log('☁️ 检测到云服务器环境，使用:', API_BASE_URL);
    } else {
        // 生产环境 - 使用当前域名
        API_BASE_URL = window.location.origin;
        console.log('🚀 检测到生产环境，使用:', API_BASE_URL);
    }

    return {
        API_BASE_URL: API_BASE_URL,
        ENV: isLocalhost ? 'local' : (isCloudIP ? 'cloud' : 'prod'),
        DEBUG: isLocalhost || isCloudIP
    };
})();

// 全局工具函数
window.APP_UTILS = {
    // 构建完整的资源URL
    buildResourceUrl: function(path) {
        if (!path) return null;
        
        // 如果已经是完整URL，直接返回
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        
        // 如果是相对路径，添加API基地址
        if (path.startsWith('/')) {
            return window.APP_CONFIG.API_BASE_URL + path;
        }
        
        // 其他情况，添加API基地址和路径
        return window.APP_CONFIG.API_BASE_URL + '/' + path;
    },
    
    // 构建API URL
    buildApiUrl: function(endpoint) {
        if (!endpoint) return null;
        
        // 如果已经是完整URL，直接返回
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        
        // 确保endpoint以/开头
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        return window.APP_CONFIG.API_BASE_URL + endpoint;
    },
    
    // 构建头像URL
    buildAvatarUrl: function(avatarPath) {
        if (!avatarPath || avatarPath.trim() === '') {
            return null; // 返回null，前端会显示默认图标
        }
        
        // 如果已经是完整URL，直接返回
        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
            return avatarPath;
        }
        
        // 如果是默认头像且文件不存在，返回null
        if (avatarPath === 'avatar.jpg') {
            // 检查默认头像是否存在，如果不存在返回null
            return null;
        }
        
        // 如果头像路径是完整路径（旧格式），提取文件名
        if (avatarPath.startsWith('/uploads/avatars/')) {
            const fileName = avatarPath.replace('/uploads/avatars/', '');
            return window.APP_CONFIG.API_BASE_URL + '/uploads/avatars/' + fileName;
        }
        
        // 如果是相对路径，添加API基地址
        if (avatarPath.startsWith('/')) {
            return window.APP_CONFIG.API_BASE_URL + avatarPath;
        }
        
        // 其他情况，添加API基地址和uploads/avatars路径
        // 确保路径正确，avatarPath可能已经包含avatars目录
        if (avatarPath.includes('avatars/')) {
            return window.APP_CONFIG.API_BASE_URL + '/uploads/' + avatarPath;
        } else {
            // 如果只是文件名，添加完整路径
            return window.APP_CONFIG.API_BASE_URL + '/uploads/avatars/' + avatarPath;
        }
    },
    
    // 构建文件URL
    buildFileUrl: function(filePath) {
        if (!filePath) return null;
        
        // 如果已经是完整URL，直接返回
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }
        
        // 如果是相对路径，添加API基地址
        if (filePath.startsWith('/')) {
            return window.APP_CONFIG.API_BASE_URL + filePath;
        }
        
        // 其他情况，添加API基地址和uploads路径
        return window.APP_CONFIG.API_BASE_URL + '/uploads/' + filePath;
    }
};

// 输出环境信息
console.log('🔧 应用配置已加载:', window.APP_CONFIG); 