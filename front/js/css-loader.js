/**
 * CSS 加载器
 * 动态加载拆分后的 CSS 文件
 */

class CSSLoader {
    constructor() {
        this.loadedStylesheets = new Set();
            this.cssFiles = [
        '/static/css/base.css',
        '/static/css/scrollbar.css',
        '/static/css/breadcrumb.css',
        '/static/css/file-filters.css',
        '/static/css/preview.css',
        '/static/css/file-grid.css',
        '/static/css/notifications.css'
    ];
    
    // 添加版本号防止缓存
    this.version = '20250718';
    }

    /**
     * 加载所有 CSS 文件
     */
    async loadAllCSS() {
        console.log('🔄 开始加载 CSS 文件...');
        
        const loadPromises = this.cssFiles.map(cssFile => this.loadCSS(cssFile));
        
        try {
            await Promise.all(loadPromises);
            console.log('✅ 所有 CSS 文件加载完成');
        } catch (error) {
            console.error('❌ CSS 文件加载失败:', error);
        }
    }

    /**
     * 加载单个 CSS 文件
     * @param {string} href - CSS 文件路径
     * @returns {Promise} 加载完成的 Promise
     */
    loadCSS(href) {
        return new Promise((resolve, reject) => {
            // 检查是否已经加载过
            if (this.loadedStylesheets.has(href)) {
                console.log(`📄 CSS 文件已加载: ${href}`);
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href + '?v=' + this.version; // 使用固定版本号防止缓存

            link.onload = () => {
                console.log(`✅ CSS 文件加载成功: ${href}`);
                this.loadedStylesheets.add(href);
                resolve();
            };

            link.onerror = () => {
                console.error(`❌ CSS 文件加载失败: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };

            // 添加到 head 中
            document.head.appendChild(link);
        });
    }

    /**
     * 加载特定的 CSS 文件
     * @param {string} cssFile - CSS 文件名
     */
    async loadSpecificCSS(cssFile) {
        const fullPath = `/static/css/${cssFile}`;
        try {
            await this.loadCSS(fullPath);
        } catch (error) {
            console.error(`❌ 加载特定 CSS 文件失败: ${cssFile}`, error);
        }
    }

    /**
     * 检查 CSS 文件是否已加载
     * @param {string} href - CSS 文件路径
     * @returns {boolean} 是否已加载
     */
    isLoaded(href) {
        return this.loadedStylesheets.has(href);
    }

    /**
     * 获取已加载的 CSS 文件列表
     * @returns {Array} 已加载的文件列表
     */
    getLoadedFiles() {
        return Array.from(this.loadedStylesheets);
    }
}

// 创建全局 CSS 加载器实例
window.cssLoader = new CSSLoader();

// 页面加载完成后自动加载所有 CSS 文件
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CSS 加载器初始化完成');
    window.cssLoader.loadAllCSS();
});

// 导出 CSS 加载器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSLoader;
} 