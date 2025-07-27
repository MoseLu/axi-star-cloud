/**
 * 性能监控模块
 * 
 * 提供页面性能分析、资源加载监控、用户体验指标等功能，包括：
 * - 页面加载性能监控
 * - 资源加载时间分析
 * - 用户体验指标收集
 * - 性能数据上报
 * - 性能优化建议
 * 
 * 该模块提供全面的性能监控解决方案
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: {},
            resources: [],
            userInteractions: [],
            errors: [],
            memory: []
        };
        
        this.observers = {
            performance: null,
            resource: null,
            error: null
        };
        
        this.config = {
            enableReporting: true,
            reportInterval: 60000, // 1分钟
            maxDataPoints: 1000,
            enableMemoryMonitoring: true
        };
        
        this.init();
    }

    /**
     * 初始化监控器
     */
    init() {
        // 设置性能观察器
        this.setupPerformanceObserver();
        
        // 设置资源观察器
        this.setupResourceObserver();
        
        // 设置错误监控
        this.setupErrorMonitoring();
        
        // 设置内存监控
        if (this.config.enableMemoryMonitoring) {
            this.setupMemoryMonitoring();
        }
        
        // 设置用户交互监控
        this.setupUserInteractionMonitoring();
        
        // 开始数据上报
        this.startReporting();
        
        // console.log('Performance Monitor initialized');
    }

    /**
     * 设置性能观察器
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            this.observers.performance = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.handlePerformanceEntry(entry);
                }
            });
            
            this.observers.performance.observe({ 
                entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input'] 
            });
        }
    }

    /**
     * 设置资源观察器
     */
    setupResourceObserver() {
        if ('PerformanceObserver' in window) {
            this.observers.resource = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.handleResourceEntry(entry);
                }
            });
            
            this.observers.resource.observe({ entryTypes: ['resource'] });
        }
    }

    /**
     * 设置错误监控
     */
    setupErrorMonitoring() {
        // JavaScript错误
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event.message, 'javascript', event);
        });

        // Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'promise', event);
        });

        // 资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target && event.target.tagName) {
                this.handleError(`Resource load failed: ${event.target.src || event.target.href}`, 'resource', event);
            }
        }, true);
    }

    /**
     * 设置内存监控
     */
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memory.push({
                    timestamp: Date.now(),
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit
                });
                
                // 限制数据点数量
                if (this.metrics.memory.length > this.config.maxDataPoints) {
                    this.metrics.memory.shift();
                }
            }, 10000); // 每10秒记录一次
        }
    }

    /**
     * 设置用户交互监控
     */
    setupUserInteractionMonitoring() {
        const interactionEvents = ['click', 'input', 'scroll', 'resize'];
        
        interactionEvents.forEach(eventType => {
            window.addEventListener(eventType, (event) => {
                this.handleUserInteraction(eventType, event);
            }, { passive: true });
        });
    }

    /**
     * 处理性能条目
     */
    handlePerformanceEntry(entry) {
        switch (entry.entryType) {
            case 'navigation':
                this.handleNavigationTiming(entry);
                break;
            case 'paint':
                this.handlePaintTiming(entry);
                break;
            case 'largest-contentful-paint':
                this.handleLCP(entry);
                break;
            case 'first-input':
                this.handleFID(entry);
                break;
        }
    }

    /**
     * 处理导航时序
     */
    handleNavigationTiming(entry) {
        this.metrics.pageLoad = {
            timestamp: Date.now(),
            navigationStart: entry.navigationStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
            loadComplete: entry.loadEventEnd - entry.navigationStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            firstPaint: entry.loadEventEnd - entry.navigationStart,
            redirectCount: entry.redirectCount,
            type: entry.type
        };
    }

    /**
     * 处理绘制时序
     */
    handlePaintTiming(entry) {
        if (entry.name === 'first-paint') {
            this.metrics.pageLoad.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
            this.metrics.pageLoad.firstContentfulPaint = entry.startTime;
        }
    }

    /**
     * 处理最大内容绘制
     */
    handleLCP(entry) {
        this.metrics.pageLoad.largestContentfulPaint = entry.startTime;
    }

    /**
     * 处理首次输入延迟
     */
    handleFID(entry) {
        this.metrics.pageLoad.firstInputDelay = entry.processingStart - entry.startTime;
    }

    /**
     * 处理资源条目
     */
    handleResourceEntry(entry) {
        const resourceData = {
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize || 0,
            startTime: entry.startTime,
            timestamp: Date.now()
        };
        
        this.metrics.resources.push(resourceData);
        
        // 限制数据点数量
        if (this.metrics.resources.length > this.config.maxDataPoints) {
            this.metrics.resources.shift();
        }
    }

    /**
     * 处理错误
     */
    handleError(error, type, event) {
        const errorData = {
            message: error.toString(),
            type: type,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            stack: error.stack
        };
        
        this.metrics.errors.push(errorData);
        
        // 限制错误数量
        if (this.metrics.errors.length > 100) {
            this.metrics.errors.shift();
        }
    }

    /**
     * 处理用户交互
     */
    handleUserInteraction(eventType, event) {
        const interactionData = {
            type: eventType,
            timestamp: Date.now(),
            target: event.target.tagName || 'unknown',
            path: this.getElementPath(event.target)
        };
        
        this.metrics.userInteractions.push(interactionData);
        
        // 限制交互数据数量
        if (this.metrics.userInteractions.length > this.config.maxDataPoints) {
            this.metrics.userInteractions.shift();
        }
    }

    /**
     * 获取元素路径
     */
    getElementPath(element) {
        const path = [];
        let current = element;
        
        while (current && current !== document.body) {
            let selector = (current.tagName ? current.tagName.toLowerCase() : 'unknown');
            if (current.id) {
                selector += `#${current.id}`;
            } else if (current.className) {
                selector += `.${current.className.split(' ').join('.')}`;
            }
            path.unshift(selector);
            current = current.parentElement;
        }
        
        return path.join(' > ');
    }

    /**
     * 开始数据上报
     */
    startReporting() {
        if (this.config.enableReporting) {
            setInterval(() => {
                this.reportMetrics();
            }, this.config.reportInterval);
        }
    }

    /**
     * 上报性能指标
     */
    async reportMetrics() {
        try {
            const reportData = {
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                metrics: this.metrics
            };
            
            // 发送到分析服务器（如果有的话）
            if (window.ENV_MANAGER && window.ENV_MANAGER.config.debug) {
                console.log('Performance Report:', reportData);
            }
            
            // 这里可以添加实际的数据上报逻辑
            // await fetch('/api/analytics/performance', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(reportData)
            // });
            
        } catch (error) {
            console.warn('Failed to report performance metrics:', error);
        }
    }

    /**
     * 获取性能统计
     */
    getPerformanceStats() {
        const stats = {
            pageLoad: this.metrics.pageLoad,
            resourceCount: this.metrics.resources.length,
            errorCount: this.metrics.errors.length,
            interactionCount: this.metrics.userInteractions.length,
            memoryUsage: this.getMemoryStats()
        };
        
        // 计算资源加载统计
        if (this.metrics.resources.length > 0) {
            const durations = this.metrics.resources.map(r => r.duration);
            stats.resourceStats = {
                averageLoadTime: durations.reduce((a, b) => a + b, 0) / durations.length,
                slowestResource: Math.max(...durations),
                fastestResource: Math.min(...durations)
            };
        }
        
        return stats;
    }

    /**
     * 获取内存统计
     */
    getMemoryStats() {
        if (this.metrics.memory.length === 0) {
            return null;
        }
        
        const latest = this.metrics.memory[this.metrics.memory.length - 1];
        return {
            usedJSHeapSize: latest.usedJSHeapSize,
            totalJSHeapSize: latest.totalJSHeapSize,
            jsHeapSizeLimit: latest.jsHeapSizeLimit,
            usagePercentage: (latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100
        };
    }

    /**
     * 获取性能建议
     */
    getPerformanceRecommendations() {
        const recommendations = [];
        const stats = this.getPerformanceStats();
        
        // 页面加载时间建议
        if (stats.pageLoad.loadComplete > 3000) {
            recommendations.push({
                type: 'warning',
                message: '页面加载时间过长，建议优化资源加载',
                metric: 'pageLoad',
                value: stats.pageLoad.loadComplete
            });
        }
        
        // 资源加载建议
        if (stats.resourceStats && stats.resourceStats.averageLoadTime > 1000) {
            recommendations.push({
                type: 'warning',
                message: '资源平均加载时间过长，建议使用CDN或压缩资源',
                metric: 'resourceLoad',
                value: stats.resourceStats.averageLoadTime
            });
        }
        
        // 内存使用建议
        const memoryStats = stats.memoryUsage;
        if (memoryStats && memoryStats.usagePercentage > 80) {
            recommendations.push({
                type: 'error',
                message: '内存使用率过高，建议检查内存泄漏',
                metric: 'memory',
                value: memoryStats.usagePercentage
            });
        }
        
        // 错误率建议
        if (stats.errorCount > 10) {
            recommendations.push({
                type: 'error',
                message: '错误数量过多，建议检查代码质量',
                metric: 'errors',
                value: stats.errorCount
            });
        }
        
        return recommendations;
    }

    /**
     * 清理监控数据
     */
    clearMetrics() {
        this.metrics = {
            pageLoad: {},
            resources: [],
            userInteractions: [],
            errors: [],
            memory: []
        };
    }

    /**
     * 销毁监控器
     */
    destroy() {
        // 断开观察器
        Object.values(this.observers).forEach(observer => {
            if (observer) {
                observer.disconnect();
            }
        });
        
        // 清理数据
        this.clearMetrics();
        
        console.log('Performance Monitor destroyed');
    }
}

// 创建全局实例
window.PerformanceMonitor = new PerformanceMonitor(); 