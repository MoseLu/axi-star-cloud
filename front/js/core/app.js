/**
 * 星际云盘主应用
 * 整合所有应用模块，提供统一的应用管理接口
 */

class App {
    constructor() {
        this.core = null;
        this.authManager = null;
        this.environmentManager = null;
        this.isInitialized = false;
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            // 立即隐藏登录页面，避免闪烁
            this.hideLoginPageInitially();
            
            // 等待DOM完全加载
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // 检测是否为强制刷新
            this.detectForceRefresh();

            // 初始化应用核心
            this.core = new AppCore();
            
            // 等待核心初始化完成
            await this.waitForCoreReady();
            
            // 初始化认证管理
            this.authManager = new AppAuthManager(this.core);
            
            // 初始化环境管理
            this.environmentManager = new AppEnvironmentManager(this.core);
            
            // 绑定上传按钮弹窗事件
            if (this.core.uiManager) {
                this.core.uiManager.bindUploadBtn();
            }
            
            this.isInitialized = true;

            // 触发应用就绪事件
            this.dispatchEvent('app:ready');
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.handleInitError(error);
        }
    }

    /**
     * 检测强制刷新
     */
    detectForceRefresh() {
        // 使用更可靠的方法检测强制刷新
        let isForceRefresh = false;
        
        // 方法1: 检查 performance.navigation.type (旧版浏览器)
        if (performance.navigation && performance.navigation.type === 1) {
            isForceRefresh = true;
        }
        
        // 方法2: 检查 performance.getEntriesByType (新版浏览器)
        if (!isForceRefresh && window.performance && window.performance.getEntriesByType) {
            const navigationEntries = window.performance.getEntriesByType('navigation');
            if (navigationEntries.length > 0) {
                const navigationEntry = navigationEntries[0];
                if (navigationEntry.type === 'reload') {
                    isForceRefresh = true;
                }
            }
        }
        
        // 方法3: 检查是否来自缓存 (通过检查页面加载时间)
        if (!isForceRefresh) {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            // 如果加载时间很短，可能是从缓存加载的
            if (loadTime < 100) {
                isForceRefresh = false; // 从缓存加载，不是强制刷新
            }
        }
        
        // 方法4: 检查 sessionStorage 标记
        const forceRefreshFlag = sessionStorage.getItem('forceRefresh');
        if (forceRefreshFlag === 'true') {
            isForceRefresh = true;
            sessionStorage.removeItem('forceRefresh');
        }
        
        if (isForceRefresh) {
            console.log('检测到强制刷新，将优先恢复本地缓存数据');
            // 设置强制刷新标记
            window.isForceRefresh = true;
            
            // 延迟清除标记，避免影响后续操作
            setTimeout(() => {
                window.isForceRefresh = false;
            }, 5000);
        }
    }
    
    /**
     * 初始时隐藏登录页面，避免闪烁
     */
    hideLoginPageInitially() {
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage) {
            loginPage.style.display = 'none';
        }
        if (app) {
            app.style.display = 'none'; // 先隐藏主应用，等检查完登录状态后再显示
        }
    }

    /**
     * 等待核心模块就绪
     */
    async waitForCoreReady() {
        return new Promise((resolve) => {
            const checkCoreReady = () => {
                if (this.core && this.core.isInitialized) {
                    resolve();
                } else {
                    setTimeout(checkCoreReady, 100);
                }
            };
            checkCoreReady();
        });
    }

    /**
     * 处理初始化错误
     */
    handleInitError(error) {
        console.error('应用初始化错误:', error);
        
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
            core: this.core?.getStatus(),
            modules: {
                auth: !!this.authManager,
                environment: !!this.environmentManager
            },
            timestamp: Date.now()
        };
    }

    /**
     * 重启应用
     */
    async restart() {
        this.isInitialized = false;
        
        // 清理现有实例
        this.core = null;
        this.authManager = null;
        this.environmentManager = null;
        
        // 重新初始化
        await this.init();
    }

    /**
     * 获取核心模块
     */
    getCore() {
        return this.core;
    }

    /**
     * 获取认证管理模块
     */
    getAuthManager() {
        return this.authManager;
    }

    /**
     * 获取环境管理模块
     */
    getEnvironmentManager() {
        return this.environmentManager;
    }

    /**
     * 获取UI管理器
     */
    getUIManager() {
        return this.core?.uiManager;
    }

    /**
     * 获取API管理器
     */
    getAPIManager() {
        return this.core?.apiManager;
    }
}

// 全局缓存渲染函数
function renderStorageFromCache() {
    let storageInfo = null;
    if (window.StorageManager && typeof window.StorageManager.getStorageInfo === 'function') {
        storageInfo = window.StorageManager.getStorageInfo();
    } else {
        // 如果 StorageManager 未加载，直接使用新的键结构
        const systemData = localStorage.getItem('systemInfo');
        if (systemData) {
            try {
                const systemInfo = JSON.parse(systemData);
                storageInfo = systemInfo.storageInfo || null;
            } catch (e) {
                console.warn('解析系统信息失败:', e);
            }
        }
    }
    
    // 检查主存储空间的关键DOM元素是否已加载
    const totalStorageEl = document.getElementById('total-storage');
    if (
        storageInfo &&
        window.uiManager &&
        typeof window.uiManager.updateStorageDisplay === 'function' &&
        totalStorageEl // 只有主存储区元素存在才渲染
    ) {
        try {
            window.uiManager.updateStorageDisplay(storageInfo);
            // 同步欢迎模块存储状态
            if (typeof window.uiManager.updateWelcomeStorageStatus === 'function') {
                const storageData = storageInfo.storage || storageInfo;
                const used = storageData.used_space || storageData.used_bytes || 0;
                const total = storageData.total_space || storageData.limit_bytes || 1073741824;
                const percent = total > 0 ? (used / total) * 100 : 0;
                
                // 根据百分比确定状态文本
                let statusText = '充足';
                if (percent >= 90) {
                    statusText = '严重不足';
                } else if (percent >= 70) {
                    statusText = '不足';
                }
                
                window.uiManager.updateWelcomeStorageStatus(statusText);
            }
        } catch (e) {
            // 忽略解析错误
        }
        return true;
    }
    return false;
}

function renderUserFromCache() {
    let userData = null;
    if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
        userData = window.StorageManager.getUser();
    } else {
        // 如果 StorageManager 未加载，直接使用新的键结构
        const userDataStr = localStorage.getItem('userInfo');
        if (userDataStr) {
            try {
                userData = JSON.parse(userDataStr);
            } catch (e) {
                console.warn('解析用户数据失败:', e);
            }
        }
    }
    
    const welcomeMessage = document.getElementById('welcome-message');
    if (
        userData &&
        window.uiManager &&
        typeof window.uiManager.updateProfileDisplayFromCache === 'function' &&
        welcomeMessage // 只有欢迎消息元素存在才渲染
    ) {
        try {
            window.uiManager.updateProfileDisplayFromCache(userData);
        } catch (e) {
            // 忽略解析错误
        }
        return true;
    }
    return false;
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function () {
    // 轮询直到 uiManager 挂载并渲染缓存数据
    let tryCount = 0;
    (function waitForUIManager() {
        const storageRendered = renderStorageFromCache();
        const userRendered = renderUserFromCache();
        
        if (!storageRendered || !userRendered) {
            tryCount++;
            if (tryCount < 50) { // 最多尝试5秒
                setTimeout(waitForUIManager, 100);
            }
        }
    })();
});

// 导出App类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} 