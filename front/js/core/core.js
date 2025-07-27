/**
 * 应用核心模块
 * 负责应用的基础初始化、生命周期管理和模块协调
 */
class AppCore {
    constructor() {
        this.authManager = null;
        this.apiManager = null;
        this.uiManager = null;
        this.isInitialized = false;
        this.modules = {};
        this.init();
    }

    /**
     * 初始化应用核心
     */
    async init() {
        try {
    
            
            // 等待API系统准备就绪
            await this.waitForApiSystem();
            
            // 初始化管理器
            this.initManagers();
            
            // 设置全局函数
            this.setupGlobalFunctions();
            
            // 初始化基础功能
            this.initBasicFeatures();
            
            this.isInitialized = true;

            
            // 触发核心就绪事件
            this.dispatchEvent('app:core:ready');
            
        } catch (error) {
            console.error('❌ 应用核心初始化失败:', error);
            this.handleInitError(error);
        }
    }

    /**
     * 等待API系统初始化
     */
    async waitForApiSystem() {
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒
        
        while (attempts < maxAttempts) {
            if (window.apiSystem && window.apiSystem.isInitialized) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('API系统初始化超时');
    }

    /**
     * 初始化管理器
     */
    initManagers() {
        // 使用新的API系统，确保向后兼容
        this.apiManager = window.apiSystem || window.apiManager;
        if (!this.apiManager) {
            console.warn('API管理器未找到');
            return;
        }

        // 使用已存在的认证系统实例，避免重复初始化
        this.authManager = window.authSystem || window.authManager;
        if (!this.authManager) {
            console.warn('认证管理器未找到');
            return;
        }
        
        // 初始化UI管理器
        this.uiManager = new UIManager();
        window.uiManager = this.uiManager;
    }

    /**
     * 设置全局函数
     */
    setupGlobalFunctions() {
        // 设置全局showMessage函数
        window.showMessage = (message, type = 'info') => {
            if (window.Notify && typeof window.Notify.show === 'function') {
                window.Notify.show({ message, type });
            } else {
                // 降级处理：如果其他消息系统不可用，静默处理
            }
        };
    }

    /**
     * 初始化基础功能
     */
    initBasicFeatures() {
        // 初始化日期显示
        this.initDateDisplay();
        
        // 设置事件监听器
        this.setupEventListeners();
    }

    /**
     * 初始化日期显示
     */
    initDateDisplay() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('zh-CN', options);
        } else {
            // 如果元素不存在，延迟重试
            setTimeout(() => {
                this.initDateDisplay();
            }, 100);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听组件加载完成事件
        document.addEventListener('componentsLoaded', (event) => {
            this.initDateDisplay();
        });
    }

    /**
     * 处理初始化错误
     */
    handleInitError(error) {
        console.error('应用核心初始化错误:', error);
        
        // 显示错误消息
        if (window.MessageBox) {
            window.MessageBox.show({
                type: 'error',
                title: '应用启动失败',
                message: '应用初始化过程中发生错误，请刷新页面重试。',
                duration: 0
            });
        }
    }

    /**
     * 分发事件
     */
    dispatchEvent(eventName, data = null) {
        const event = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(event);
    }

    /**
     * 获取应用状态
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            modules: Object.keys(this.modules),
            timestamp: Date.now()
        };
    }

    /**
     * 重启应用
     */
    async restart() {
        console.log('🔄 重启应用中...');
        this.isInitialized = false;
        this.modules = {};
        
        // 清理现有实例
        if (window.uiManager) {
            window.uiManager = null;
        }
        if (window.authManager) {
            window.authManager = null;
        }
        
        // 重新初始化
        await this.init();
    }
}

// 导出AppCore类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppCore;
} 