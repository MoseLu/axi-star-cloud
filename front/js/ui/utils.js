/**
 * 工具函数模块
 * 包含通用工具函数、格式化函数、辅助方法和工具类函数
 */
class UIUtils {
    constructor() {
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        this.observers = new Map();
        this.cache = new Map();
        this.config = {
            dateFormat: 'YYYY-MM-DD HH:mm:ss',
            numberFormat: {
                decimal: '.',
                thousands: ',',
                precision: 2
            },
            fileSizeUnits: ['B', 'KB', 'MB', 'GB', 'TB'],
            maxCacheSize: 100,
            defaultTimeout: 5000
        };
    }

    /**
     * 初始化工具模块
     */
    init() {
        this.setupGlobalUtils();
        this.loadConfig();
    }

    /**
     * 设置全局工具函数
     */
    setupGlobalUtils() {
        // 将常用方法暴露到全局
        window.$utils = {
            formatDate: this.formatDate.bind(this),
            formatFileSize: this.formatFileSize.bind(this),
            formatNumber: this.formatNumber.bind(this),
            debounce: this.debounce.bind(this),
            throttle: this.throttle.bind(this),
            deepClone: this.deepClone.bind(this),
            isEmpty: this.isEmpty.bind(this),
            generateId: this.generateId.bind(this),
            validateEmail: this.validateEmail.bind(this),
            validateUrl: this.validateUrl.bind(this),
            showMessage: this.showMessage.bind(this),
            hideMessage: this.hideMessage.bind(this),
            showLoading: this.showLoading.bind(this),
            hideLoading: this.hideLoading.bind(this)
        };
    }

    /**
     * 加载配置
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('uiUtilsConfig');
            if (savedConfig) {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.error('加载工具配置失败:', error);
        }
    }

    /**
     * 保存配置
     */
    saveConfig() {
        try {
            localStorage.setItem('uiUtilsConfig', JSON.stringify(this.config));
        } catch (error) {
            console.error('保存工具配置失败:', error);
        }
    }

    // ==================== 日期时间工具 ====================

    /**
     * 格式化日期
     * @param {Date|string|number} date - 日期对象、字符串或时间戳
     * @param {string} format - 格式化字符串
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date, format = this.config.dateFormat) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * 获取相对时间
     * @param {Date|string|number} date - 日期
     * @returns {string} 相对时间字符串
     */
    getRelativeTime(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const now = new Date();
        const diff = now - d;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}天前`;
        } else if (hours > 0) {
            return `${hours}小时前`;
        } else if (minutes > 0) {
            return `${minutes}分钟前`;
        } else {
            return '刚刚';
        }
    }

    /**
     * 检查是否为今天
     * @param {Date|string|number} date - 日期
     * @returns {boolean} 是否为今天
     */
    isToday(date) {
        if (!date) return false;
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return false;

        const today = new Date();
        return d.toDateString() === today.toDateString();
    }

    /**
     * 检查是否为昨天
     * @param {Date|string|number} date - 日期
     * @returns {boolean} 是否为昨天
     */
    isYesterday(date) {
        if (!date) return false;
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return false;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return d.toDateString() === yesterday.toDateString();
    }

    // ==================== 数字格式化工具 ====================

    /**
     * 格式化数字
     * @param {number} num - 数字
     * @param {Object} options - 格式化选项
     * @returns {string} 格式化后的数字字符串
     */
    formatNumber(num, options = {}) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        
        const config = { ...this.config.numberFormat, ...options };
        const { decimal, thousands, precision } = config;
        
        const parts = num.toFixed(precision).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
        
        return parts.join(decimal);
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @param {number} precision - 精度
     * @returns {string} 格式化后的文件大小
     */
    formatFileSize(bytes, precision = 2) {
        if (bytes === 0) return '0 B';
        
        const units = this.config.fileSizeUnits;
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(precision)) + ' ' + units[i];
    }

    /**
     * 格式化百分比
     * @param {number} value - 值
     * @param {number} total - 总数
     * @param {number} precision - 精度
     * @returns {string} 格式化后的百分比
     */
    formatPercentage(value, total, precision = 1) {
        if (total === 0) return '0%';
        return ((value / total) * 100).toFixed(precision) + '%';
    }

    // ==================== 字符串工具 ====================

    /**
     * 截断字符串
     * @param {string} str - 字符串
     * @param {number} length - 最大长度
     * @param {string} suffix - 后缀
     * @returns {string} 截断后的字符串
     */
    truncate(str, length = 50, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }

    /**
     * 首字母大写
     * @param {string} str - 字符串
     * @returns {string} 首字母大写的字符串
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * 驼峰命名转下划线
     * @param {string} str - 驼峰命名字符串
     * @returns {string} 下划线命名字符串
     */
    camelToSnake(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    /**
     * 下划线命名转驼峰
     * @param {string} str - 下划线命名字符串
     * @returns {string} 驼峰命名字符串
     */
    snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    /**
     * 生成随机字符串
     * @param {number} length - 长度
     * @returns {string} 随机字符串
     */
    randomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // ==================== 数组工具 ====================

    /**
     * 数组去重
     * @param {Array} arr - 数组
     * @returns {Array} 去重后的数组
     */
    unique(arr) {
        return [...new Set(arr)];
    }

    /**
     * 数组分组
     * @param {Array} arr - 数组
     * @param {Function} keyFn - 分组键函数
     * @returns {Object} 分组后的对象
     */
    groupBy(arr, keyFn) {
        return arr.reduce((groups, item) => {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }

    /**
     * 数组排序
     * @param {Array} arr - 数组
     * @param {string} key - 排序键
     * @param {string} order - 排序方向 ('asc' | 'desc')
     * @returns {Array} 排序后的数组
     */
    sortBy(arr, key, order = 'asc') {
        return [...arr].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * 数组分页
     * @param {Array} arr - 数组
     * @param {number} page - 页码
     * @param {number} size - 每页大小
     * @returns {Object} 分页结果
     */
    paginate(arr, page = 1, size = 10) {
        const total = arr.length;
        const totalPages = Math.ceil(total / size);
        const start = (page - 1) * size;
        const end = start + size;
        
        return {
            data: arr.slice(start, end),
            pagination: {
                page,
                size,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    // ==================== 对象工具 ====================

    /**
     * 深度克隆对象
     * @param {*} obj - 要克隆的对象
     * @returns {*} 克隆后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
    }

    /**
     * 合并对象
     * @param {...Object} objects - 要合并的对象
     * @returns {Object} 合并后的对象
     */
    merge(...objects) {
        return objects.reduce((result, obj) => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        result[key] = this.merge(result[key] || {}, obj[key]);
                    } else {
                        result[key] = obj[key];
                    }
                }
            }
            return result;
        }, {});
    }

    /**
     * 检查对象是否为空
     * @param {*} value - 要检查的值
     * @returns {boolean} 是否为空
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim().length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * 获取对象嵌套属性值
     * @param {Object} obj - 对象
     * @param {string} path - 属性路径
     * @param {*} defaultValue - 默认值
     * @returns {*} 属性值
     */
    get(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return defaultValue;
            }
        }
        
        return result;
    }

    /**
     * 设置对象嵌套属性值
     * @param {Object} obj - 对象
     * @param {string} path - 属性路径
     * @param {*} value - 要设置的值
     * @returns {Object} 修改后的对象
     */
    set(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
        return obj;
    }

    // ==================== 函数工具 ====================

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间
     * @param {string} key - 防抖键
     * @returns {Function} 防抖后的函数
     */
    debounce(func, delay = 300, key = 'default') {
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} delay - 延迟时间
     * @param {string} key - 节流键
     * @returns {Function} 节流后的函数
     */
    throttle(func, delay = 300, key = 'default') {
        return (...args) => {
            if (this.throttleTimers.has(key)) {
                return;
            }
            
            func.apply(this, args);
            this.throttleTimers.set(key, true);
            
            setTimeout(() => {
                this.throttleTimers.delete(key);
            }, delay);
        };
    }

    /**
     * 异步重试函数
     * @param {Function} fn - 要重试的函数
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试延迟
     * @returns {Promise} 重试结果
     */
    async retry(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries) throw error;
                await this.delay(delay * Math.pow(2, i)); // 指数退避
            }
        }
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== 验证工具 ====================

    /**
     * 验证邮箱
     * @param {string} email - 邮箱地址
     * @returns {boolean} 是否有效
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 验证URL
     * @param {string} url - URL地址
     * @returns {boolean} 是否有效
     */
    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 验证手机号
     * @param {string} phone - 手机号
     * @returns {boolean} 是否有效
     */
    validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    /**
     * 验证身份证号
     * @param {string} idCard - 身份证号
     * @returns {boolean} 是否有效
     */
    validateIdCard(idCard) {
        const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        return idCardRegex.test(idCard);
    }

    // ==================== 缓存工具 ====================

    /**
     * 设置缓存
     * @param {string} key - 缓存键
     * @param {*} value - 缓存值
     * @param {number} ttl - 生存时间（毫秒）
     */
    setCache(key, value, ttl = 0) {
        if (this.cache.size >= this.config.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        const item = {
            value: this.deepClone(value),
            timestamp: Date.now(),
            ttl
        };
        
        this.cache.set(key, item);
    }

    /**
     * 获取缓存
     * @param {string} key - 缓存键
     * @returns {*} 缓存值
     */
    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (item.ttl > 0 && Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return this.deepClone(item.value);
    }

    /**
     * 删除缓存
     * @param {string} key - 缓存键
     */
    deleteCache(key) {
        this.cache.delete(key);
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
    }

    // ==================== 观察者模式 ====================

    /**
     * 添加观察者
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.observers.has(event)) {
            this.observers.set(event, []);
        }
        this.observers.get(event).push(callback);
    }

    /**
     * 移除观察者
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (!this.observers.has(event)) return;
        
        const callbacks = this.observers.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {...*} args - 参数
     */
    emit(event, ...args) {
        if (!this.observers.has(event)) return;
        
        const callbacks = this.observers.get(event);
        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error('观察者回调执行错误:', error);
            }
        });
    }

    // ==================== 消息工具 ====================

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     * @param {Object} options - 选项
     * @returns {HTMLElement} 消息元素
     */
    showMessage(message, type = 'info', options = {}) {
        // 使用Notify.show()而不是动态创建DOM
        if (window.Notify && typeof window.Notify.show === 'function') {
            window.Notify.show({ 
                message, 
                type, 
                duration: options.duration || 3000 
            });
            return null; // Notify不返回DOM元素
        } else {
            // 降级处理：如果Notify不可用，静默处理
            return null;
        }
    }

    /**
     * 隐藏消息
     * @param {HTMLElement} messageEl - 消息元素
     */
    hideMessage(messageEl) {
        if (!messageEl) return;
        
        messageEl.classList.remove('show');
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }

    /**
     * 显示加载状态
     * @param {string} message - 加载消息
     * @returns {HTMLElement} 加载元素
     */
    showLoading(message = '加载中...') {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'ui-loading';
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        
        document.body.appendChild(loadingEl);
        setTimeout(() => loadingEl.classList.add('show'), 10);
        
        return loadingEl;
    }

    /**
     * 隐藏加载状态
     * @param {HTMLElement} loadingEl - 加载元素
     */
    hideLoading(loadingEl) {
        if (!loadingEl) return;
        
        loadingEl.classList.remove('show');
        setTimeout(() => {
            if (loadingEl.parentNode) {
                loadingEl.parentNode.removeChild(loadingEl);
            }
        }, 300);
    }

    // ==================== 其他工具 ====================

    /**
     * 生成唯一ID
     * @param {string} prefix - 前缀
     * @returns {string} 唯一ID
     */
    generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return prefix + timestamp + random;
    }

    /**
     * 获取元素位置信息
     * @param {HTMLElement} element - 元素
     * @returns {Object} 位置信息
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom + window.pageYOffset,
            right: rect.right + window.pageXOffset
        };
    }

    /**
     * 检查元素是否在视口中
     * @param {HTMLElement} element - 元素
     * @returns {boolean} 是否在视口中
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * 滚动到元素
     * @param {HTMLElement} element - 目标元素
     * @param {Object} options - 滚动选项
     */
    scrollToElement(element, options = {}) {
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        
        const config = { ...defaultOptions, ...options };
        element.scrollIntoView(config);
    }

    /**
     * 复制到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {Promise<boolean>} 是否成功
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }

    /**
     * 下载文件
     * @param {string} url - 文件URL
     * @param {string} filename - 文件名
     */
    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 获取配置
     * @returns {Object} 配置对象
     */
    getConfig() {
        return this.deepClone(this.config);
    }

    /**
     * 更新配置
     * @param {Object} newConfig - 新配置
     */
    updateConfig(newConfig) {
        this.config = this.merge(this.config, newConfig);
        this.saveConfig();
    }

    /**
     * 清理资源
     */
    destroy() {
        this.debounceTimers.clear();
        this.throttleTimers.clear();
        this.observers.clear();
        this.cache.clear();
    }
}

// 全局暴露
window.UIUtils = UIUtils;

// 创建全局实例
window.uiUtils = new UIUtils();
window.uiUtils.init(); 