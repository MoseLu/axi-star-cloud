/**
 * 组件加载器
 * 用于动态加载拆分后的HTML组件
 */
class ComponentLoader {
    constructor() {
        this.components = {
            'welcome-section': '/static/html/welcome-section.html?v=20250718',
            'storage-overview': '/static/html/storage-overview.html',
            'file-type-filters': '/static/html/file-type-filters.html',
            'upload-area': '/static/html/upload-area.html',
            'folder-section': '/static/html/folder-section.html',
            'file-list': '/static/html/file-list.html',
            'modals': '/static/html/modals.html'
        };
        this.loadedComponents = new Set();
    }

    /**
     * 加载单个组件
     * @param {string} componentName - 组件名称
     * @param {string} containerId - 容器ID
     * @returns {Promise} - 加载Promise
     */
    async loadComponent(componentName, containerId) {
        // 强制重新加载欢迎模块，清除缓存
        if (componentName === 'welcome-section') {
            this.loadedComponents.delete(componentName);
        }
        
        if (this.loadedComponents.has(componentName)) {
            return;
        }

        try {
            const response = await fetch(this.components[componentName]);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}, status: ${response.status}`);
            }
            
            const html = await response.text();
            let container = document.getElementById(containerId);
            
            // 如果容器不存在，多次重试
            let retryCount = 0;
            const maxRetries = 20; // 增加重试次数
            while (!container && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 300)); // 增加等待时间
                container = document.getElementById(containerId);
                retryCount++;
            }
            
            if (container) {
                container.innerHTML = html;
                this.loadedComponents.add(componentName);
                console.log(`✅ Component loaded: ${componentName}`);
            } else {
                console.error(`❌ Container not found after ${maxRetries} retries: ${containerId}`);
                // 对于help-modal，如果容器不存在，直接添加到body
                if (componentName === 'help-modal') {
                    document.body.insertAdjacentHTML('beforeend', html);
                    this.loadedComponents.add(componentName);
                }
            }
        } catch (error) {
            console.error(`❌ Error loading component ${componentName}:`, error);
            // 如果是网络错误，尝试重新加载
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.log(`🔄 Retrying component ${componentName} in 2 seconds...`);
                setTimeout(() => {
                    this.loadedComponents.delete(componentName);
                    this.loadComponent(componentName, containerId);
                }, 2000);
            }
        }
    }

    /**
     * 加载所有组件
     */
    async loadAllComponents() {
        const loadPromises = [
            this.loadComponent('welcome-section', 'welcome-section-container'),
            this.loadComponent('storage-overview', 'storage-overview-container'),
            this.loadComponent('file-type-filters', 'file-type-filters-container'),
            this.loadComponent('upload-area', 'upload-area-container'),
            this.loadComponent('folder-section', 'folder-section-container'),
            this.loadComponent('file-list', 'file-list-container'),
            this.loadComponent('modals', 'modals-container')
        ];

        try {
            await Promise.all(loadPromises);
            
            // 注意：文件夹区域的显示状态由分类管理器控制
            // 不要在这里强制显示，避免与外站文档分类冲突
            
            // 触发组件加载完成事件
            document.dispatchEvent(new CustomEvent('componentsLoaded'));
        } catch (error) {
            console.error('❌ Error loading components:', error);
        }
    }

    /**
     * 触发组件加载完成事件
     */
    triggerComponentLoadedEvent() {
        const event = new CustomEvent('componentsLoaded', {
            detail: {
                timestamp: new Date().toISOString(),
                loadedComponents: Array.from(this.loadedComponents)
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 重新加载组件
     * @param {string} componentName - 组件名称
     * @param {string} containerId - 容器ID
     */
    async reloadComponent(componentName, containerId) {
        this.loadedComponents.delete(componentName);
        await this.loadComponent(componentName, containerId);
    }

    /**
     * 检查组件是否已加载
     * @param {string} componentName - 组件名称
     * @returns {boolean} - 是否已加载
     */
    isComponentLoaded(componentName) {
        return this.loadedComponents.has(componentName);
    }

    /**
     * 获取已加载的组件列表
     * @returns {Array} - 已加载的组件列表
     */
    getLoadedComponents() {
        return Array.from(this.loadedComponents);
    }
}

// 创建全局实例
window.componentLoader = new ComponentLoader();

// 页面加载完成后自动加载所有组件
document.addEventListener('DOMContentLoaded', () => {
    // 延迟一点时间确保DOM完全加载
    setTimeout(() => {
        window.componentLoader.loadAllComponents();
    }, 100);
});

// 监听组件加载完成事件
document.addEventListener('componentsLoaded', (event) => {
    // 这里可以初始化依赖于组件的功能
    // 例如：初始化事件监听器、绑定数据等
    
    // 重新初始化分类管理器，确保文件夹区域状态正确
    setTimeout(() => {
        if (window.uiManager && window.uiManager.categories) {
            window.uiManager.categories.init();
        }
    }, 100);
            
    // 重新尝试绑定存储设置按钮
    setTimeout(() => {
        if (window.uiManager && window.uiManager.settingsManager) {
            window.uiManager.settingsManager.bindStorageSettingsButton();
        } else {
            // 静默处理，不输出警告信息
            // console.log('⚠️ uiManager或settingsManager尚未初始化');
        }
    }, 200);
    

});

// 导出组件加载器类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
} 