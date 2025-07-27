/**
 * 认证工具函数
 * 提供认证相关的通用工具方法
 */
class Utils {
    /**
     * 验证用户名格式
     * @param {string} username - 用户名
     * @returns {boolean} - 是否有效
     */
    static validateUsername(username) {
        if (!username || username.trim().length === 0) {
            return false;
        }
        // 用户名长度限制：3-20个字符
        if (username.length < 3 || username.length > 20) {
            return false;
        }
        // 只允许字母、数字、下划线
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        return usernameRegex.test(username);
    }

    /**
     * 验证密码强度
     * @param {string} password - 密码
     * @returns {object} - 验证结果
     */
    static validatePassword(password) {
        const result = {
            isValid: false,
            errors: []
        };

        if (!password || password.length === 0) {
            result.errors.push('密码不能为空');
            return result;
        }

        if (password.length < 6) {
            result.errors.push('密码长度至少6位');
        }

        if (password.length > 50) {
            result.errors.push('密码长度不能超过50位');
        }

        // 检查是否包含数字
        if (!/\d/.test(password)) {
            result.errors.push('密码应包含至少一个数字');
        }

        // 检查是否包含字母
        if (!/[a-zA-Z]/.test(password)) {
            result.errors.push('密码应包含至少一个字母');
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱地址
     * @returns {boolean} - 是否有效
     */
    static validateEmail(email) {
        if (!email || email.trim().length === 0) {
            return true; // 邮箱可选
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 生成随机密码
     * @param {number} length - 密码长度，默认12
     * @returns {string} - 生成的密码
     */
    static generatePassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    /**
     * 安全地存储用户数据到localStorage
     * @param {string} key - 存储键
     * @param {object} data - 要存储的数据
     */
    static safeStore(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }

    /**
     * 安全地从localStorage获取数据
     * @param {string} key - 存储键
     * @returns {object|null} - 获取的数据或null
     */
    static safeRetrieve(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('获取数据失败:', error);
            localStorage.removeItem(key); // 清理损坏的数据
            return null;
        }
    }

    /**
     * 清理所有认证相关的本地存储
     */
    static clearAllAuthData() {
        const authKeys = [
            'currentUser',
            'userData',
            'loginData',
            'authToken',
            'refreshToken'
        ];

        authKeys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error(`清理${key}失败:`, error);
            }
        });
    }

    /**
     * 检查用户会话是否过期
     * @param {number} maxAge - 最大会话时间（毫秒），默认24小时
     * @returns {boolean} - 是否过期
     */
    static isSessionExpired(maxAge = 24 * 60 * 60 * 1000) {
        let lastLogin = null;
        
        // 优先从新的存储管理器获取
        if (window.StorageManager && typeof window.StorageManager.getLastLogin === 'function') {
            lastLogin = window.StorageManager.getLastLogin();
        } else {
            // 备用方案：从新的键结构获取
            const userData = localStorage.getItem('userInfo');
            if (userData) {
                try {
                    const userInfo = JSON.parse(userData);
                    lastLogin = userInfo.lastLogin;
                } catch (error) {
                    console.warn('解析用户信息失败:', error);
                }
            }
        }
        
        if (!lastLogin) {
            return true;
        }

        try {
            const loginTime = new Date(lastLogin).getTime();
            const now = Date.now();
            return (now - loginTime) > maxAge;
        } catch (error) {
            return true;
        }
    }

    /**
     * 更新最后登录时间
     */
    static updateLastLoginTime() {
        // 这个方法现在只用于检查会话是否过期，不再自动更新
        // 最后登录时间现在由后端在登录和退出时管理
        try {
            if (window.StorageManager && typeof window.StorageManager.setLastLogin === 'function') {
                window.StorageManager.setLastLogin(new Date().toISOString());
            } else {
                // 如果 StorageManager 未加载，直接更新 userInfo 中的最后登录时间
                const userData = localStorage.getItem('userInfo');
                if (userData) {
                    try {
                        const userInfo = JSON.parse(userData);
                        userInfo.lastLogin = new Date().toISOString();
                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                    } catch (error) {
                        console.warn('更新最后登录时间失败:', error);
                    }
                }
            }
        } catch (error) {
            console.error('更新登录时间失败:', error);
        }
    }

    /**
     * 格式化错误消息
     * @param {string|object} error - 错误信息
     * @returns {string} - 格式化的错误消息
     */
    static formatErrorMessage(error) {
        if (typeof error === 'string') {
            return error;
        }
        
        if (error && error.message) {
            return error.message;
        }
        
        if (error && error.error) {
            return error.error;
        }
        
        return '未知错误';
    }

    /**
     * 防抖函数
     * @param {function} func - 要防抖的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {function} - 防抖后的函数
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     * @param {function} func - 要节流的函数
     * @param {number} limit - 限制时间（毫秒）
     * @returns {function} - 节流后的函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// 导出Utils类
window.AuthUtils = Utils; 