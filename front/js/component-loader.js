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
                throw new Error(`Failed to load component: ${componentName}`);
            }
            
            const html = await response.text();
            let container = document.getElementById(containerId);
            
            // 如果容器不存在，等待一下再重试
            if (!container) {
                await new Promise(resolve => setTimeout(resolve, 100));
                container = document.getElementById(containerId);
            }
            
            if (container) {
                container.innerHTML = html;
                this.loadedComponents.add(componentName);
            } else {
                console.error(`❌ Container not found after retry: ${containerId}`);
            }
        } catch (error) {
            console.error(`❌ Error loading component ${componentName}:`, error);
        }
    }

    /**
     * 加载所有组件
     * @returns {Promise} - 加载Promise
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
            
            // 触发组件加载完成事件
            document.dispatchEvent(new CustomEvent('componentsLoaded', {
                detail: { loadedComponents: this.loadedComponents }
            }));
            
            // 确保文件夹区域显示
            const folderSection = document.getElementById('folder-section');
            if (folderSection) {
                folderSection.classList.remove('hidden');
                console.log('✅ 组件加载完成：确保文件夹区域可见');
            }
            
            console.log('✅ 所有组件加载完成');
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
});

// 导出组件加载器类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
} 