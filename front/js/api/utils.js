/**
 * API工具函数
 * 提供各种工具方法，如文件大小格式化等
 */
class ApiUtils {
    constructor() {
        // 工具类不需要依赖core
    }

    // 工具方法：格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 文件类型图标映射
    getFileIcon(type) {
        const iconMap = {
            'image': 'fa-file-image-o',
            'video': 'fa-file-video-o',
            'audio': 'fa-file-audio-o',
            'document': 'fa-file-text-o',
            'word': 'fa-file-word-o',
            'excel': 'fa-file-excel-o',
            'powerpoint': 'fa-file-powerpoint-o',
            'other': 'fa-file-o'
        };
        return iconMap[type] || 'fa-file-o';
    }

    // 文件类型颜色映射
    getFileIconColor(type) {
        const colorMap = {
            'image': 'text-green-400',
            'video': 'text-red-400',
            'audio': 'text-purple-400',
            'document': 'text-blue-400',
            'word': 'text-blue-500',
            'excel': 'text-green-500',
            'powerpoint': 'text-orange-500',
            'other': 'text-gray-400'
        };
        return colorMap[type] || 'text-gray-400';
    }
}

// 导出ApiUtils类到全局作用域
window.ApiUtils = ApiUtils; 