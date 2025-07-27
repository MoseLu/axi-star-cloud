/**
 * 代码分割和打包优化模块
 * 
 * 提供动态导入、资源优化、代码分割等功能，包括：
 * - 动态模块加载
 * - 资源预加载
 * - 代码分割策略
 * - 缓存优化
 * - 性能监控
 * 
 * 该模块提供高性能的代码分割解决方案
 */

class BundleOptimizer {
    constructor() {
        this.loadedModules = new Map();
        this.loadingModules = new Map();
        this.moduleCache = new Map();
        this.performanceMetrics = {
            loadTimes: [],
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.init();
    }

    /**
     * 初始化优化器
     */
    init() {
        // 设置性能监控
        this.setupPerformanceMonitoring();
        
        // 预加载关键模块
        this.preloadCriticalModules();
        
        // 设置缓存策略
        this.setupCacheStrategy();
    }

    /**
     * 动态导入模块
     * @param {string} modulePath - 模块路径
     * @param {Object} options - 导入选项
     * @returns {Promise} - 模块加载Promise
     */
    async importModule(modulePath, options = {}) {
        const {
            priority = 'normal',
            preload = false,
            cache = true,
            timeout = 10000
        } = options;

        // 检查缓存
        if (cache && this.moduleCache.has(modulePath)) {
            this.performanceMetrics.cacheHits++;
            return this.moduleCache.get(modulePath);
        }

        // 检查是否正在加载
        if (this.loadingModules.has(modulePath)) {
            return this.loadingModules.get(modulePath);
        }

        // 创建加载Promise
        const loadPromise = this.loadModuleWithTimeout(modulePath, timeout);
        this.loadingModules.set(modulePath, loadPromise);

        try {
            const module = await loadPromise;
            
            // 缓存模块
            if (cache) {
                this.moduleCache.set(modulePath, module);
                this.performanceMetrics.cacheMisses++;
            }

            // 记录加载时间
            this.recordLoadTime(modulePath, performance.now());

            return module;
        } finally {
            this.loadingModules.delete(modulePath);
        }
    }

    /**
     * 带超时的模块加载
     * @param {string} modulePath - 模块路径
     * @param {number} timeout - 超时时间
     * @returns {Promise} - 加载Promise
     */
    async loadModuleWithTimeout(modulePath, timeout) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Module load timeout: ${modulePath}`)), timeout);
        });

        const loadPromise = this.loadModule(modulePath);
        
        return Promise.race([loadPromise, timeoutPromise]);
    }

    /**
     * 加载模块
     * @param {string} modulePath - 模块路径
     * @returns {Promise} - 模块Promise
     */
    async loadModule(modulePath) {
        const startTime = performance.now();

        try {
            // 根据模块类型选择加载策略
            if (modulePath.endsWith('.js')) {
                return await this.loadJavaScriptModule(modulePath);
            } else if (modulePath.endsWith('.css')) {
                return await this.loadCSSModule(modulePath);
            } else if (modulePath.endsWith('.html')) {
                return await this.loadHTMLModule(modulePath);
            } else {
                throw new Error(`Unsupported module type: ${modulePath}`);
            }
        } catch (error) {
            console.error(`Failed to load module: ${modulePath}`, error);
            throw error;
        } finally {
            const loadTime = performance.now() - startTime;
            this.recordLoadTime(modulePath, loadTime);
        }
    }

    /**
     * 加载JavaScript模块
     * @param {string} modulePath - 模块路径
     * @returns {Promise} - 模块Promise
     */
    async loadJavaScriptModule(modulePath) {
        const response = await fetch(modulePath);
        if (!response.ok) {
            throw new Error(`Failed to load JS module: ${modulePath}`);
        }

        const code = await response.text();
        
        // 动态执行代码
        const module = new Function('return ' + code)();
        return module;
    }

    /**
     * 加载CSS模块
     * @param {string} modulePath - 模块路径
     * @returns {Promise} - 样式表Promise
     */
    async loadCSSModule(modulePath) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = modulePath;
            
            link.onload = () => resolve(link);
            link.onerror = () => reject(new Error(`Failed to load CSS: ${modulePath}`));
            
            document.head.appendChild(link);
        });
    }

    /**
     * 加载HTML模块
     * @param {string} modulePath - 模块路径
     * @returns {Promise} - HTML内容Promise
     */
    async loadHTMLModule(modulePath) {
        const response = await fetch(modulePath);
        if (!response.ok) {
            throw new Error(`Failed to load HTML module: ${modulePath}`);
        }

        return await response.text();
    }

    /**
     * 预加载关键模块
     */
    preloadCriticalModules() {
        const criticalModules = [
            '/static/js/api/core.js',
            '/static/js/ui/core.js'
        ];

        criticalModules.forEach(modulePath => {
            this.importModule(modulePath, { priority: 'high', preload: true });
        });
    }

    /**
     * 设置缓存策略
     */
    setupCacheStrategy() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏时清理非关键缓存
                this.cleanupNonCriticalCache();
            }
        });

        // 监听内存压力
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
                    this.cleanupCache();
                }
            }, 30000);
        }
    }

    /**
     * 清理非关键缓存
     */
    cleanupNonCriticalCache() {
        const criticalModules = [
            '/static/js/api/core.js',
            '/static/js/ui/core.js'
        ];

        for (const [path, module] of this.moduleCache) {
            if (!criticalModules.includes(path)) {
                this.moduleCache.delete(path);
            }
        }
    }

    /**
     * 清理所有缓存
     */
    cleanupCache() {
        this.moduleCache.clear();
        this.loadedModules.clear();
    }

    /**
     * 记录加载时间
     * @param {string} modulePath - 模块路径
     * @param {number} loadTime - 加载时间
     */
    recordLoadTime(modulePath, loadTime) {
        this.performanceMetrics.loadTimes.push({
            module: modulePath,
            loadTime: loadTime,
            timestamp: Date.now()
        });

        // 保持最近100条记录
        if (this.performanceMetrics.loadTimes.length > 100) {
            this.performanceMetrics.loadTimes.shift();
        }
    }

    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 监控模块加载性能
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name.includes('/static/')) {
                    this.recordLoadTime(entry.name, entry.duration);
                }
            }
        });

        observer.observe({ entryTypes: ['resource'] });
    }

    /**
     * 获取性能统计
     * @returns {Object} - 性能统计信息
     */
    getPerformanceStats() {
        const loadTimes = this.performanceMetrics.loadTimes;
        const avgLoadTime = loadTimes.length > 0 
            ? loadTimes.reduce((sum, item) => sum + item.loadTime, 0) / loadTimes.length 
            : 0;

        return {
            cacheHitRate: this.performanceMetrics.cacheHits / 
                (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses),
            averageLoadTime: avgLoadTime,
            totalModulesLoaded: this.moduleCache.size,
            cacheSize: this.moduleCache.size
        };
    }

    /**
     * 预加载模块
     * @param {Array} modulePaths - 模块路径数组
     * @param {Object} options - 预加载选项
     */
    async preloadModules(modulePaths, options = {}) {
        const { priority = 'low', parallel = true } = options;

        if (parallel) {
            const promises = modulePaths.map(path => 
                this.importModule(path, { priority, preload: true })
            );
            await Promise.allSettled(promises);
        } else {
            for (const path of modulePaths) {
                await this.importModule(path, { priority, preload: true });
            }
        }
    }
}

// 创建全局实例
window.BundleOptimizer = new BundleOptimizer(); 