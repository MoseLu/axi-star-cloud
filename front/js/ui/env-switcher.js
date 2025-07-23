/**
 * 环境切换器UI组件
 * 右下角悬浮按钮设计，类似移动端交互
 * 只有管理员可见
 */

class EnvSwitcher {
    constructor() {
        this.isVisible = false;
        this.isExpanded = false;
        this.showEnvOptions = false;
        this.init();
    }

    init() {
        // 检查是否为管理员
        if (!this.isAdmin()) {
            return;
        }
        
        // 创建环境切换器
        this.createSwitcher();
        
        // 添加样式
        this.addStyles();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化显示
        this.updateDisplay();
        
        // 添加404错误处理
        this.handle404Error();
    }

    isAdmin() {
        // 开发模式下总是显示
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return true;
        }
        
        // 优先使用authManager
        if (window.authManager && typeof window.authManager.getCurrentUser === 'function') {
            const user = window.authManager.getCurrentUser();
            if (user && user.role === 'admin') {
                return true;
            }
        }
        
        // 备用方案：直接检查localStorage
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                if (user.isAdmin === true) {
                    return true;
                }
            } catch (e) {
                console.warn('解析用户信息失败:', e);
            }
        }
        
        // 如果authManager不存在，在开发环境下也显示
        if (!window.authManager && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            return true;
        }
        
        return false;
    }

    createSwitcher() {
        // 创建环境切换器容器
        const switcher = document.createElement('div');
        switcher.id = 'env-switcher';
        switcher.className = 'env-switcher';
        switcher.innerHTML = `
            <div class="env-switcher-main">
                <div class="env-switcher-toggle" title="系统功能菜单">
                    <div class="env-icon-container">
                        <span class="env-icon-main">⚙️</span>
                        <span class="env-icon-api" id="env-api-icon">🛠️</span>
                    </div>
                </div>
                <div class="env-switcher-menu">
                    <div class="env-menu-item" data-action="switch-env" title="切换API环境">
                        <span class="env-menu-icon">🌐</span>
                        <span class="env-menu-label">路由切换</span>
                    </div>
                    <div class="env-menu-item" data-action="view-docs" title="查看系统文档">
                        <span class="env-menu-icon">📚</span>
                        <span class="env-menu-label">系统文档</span>
                    </div>
                </div>
                <div class="env-switcher-options">
                    <div class="env-option" data-env="local" title="开发环境API">
                        <span class="env-option-icon">🛠️</span>
                        <span class="env-option-label">开发API</span>
                        <span class="env-option-url">localhost:8080</span>
                    </div>
                    <div class="env-option" data-env="prod" title="生产环境API">
                        <span class="env-option-icon">🚀</span>
                        <span class="env-option-label">生产API</span>
                        <span class="env-option-url">redamancy.com.cn</span>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(switcher);
        this.container = switcher;
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .env-switcher {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .env-switcher-main {
                position: relative;
            }

            .env-switcher-toggle {
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2px solid rgba(255, 255, 255, 0.1);
                z-index: 10001;
            }

            .env-switcher-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
            }

            .env-switcher-toggle:active {
                transform: scale(0.95);
            }

            .env-icon-container {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }

            .env-icon-main {
                font-size: 18px;
                color: #fff;
                transition: transform 0.3s ease;
                transform-origin: center;
                z-index: 2;
            }

            .env-icon-api {
                position: absolute;
                bottom: 4px;
                right: 4px;
                font-size: 12px;
                color: #fff;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 50%;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .env-switcher.expanded .env-icon-main {
                transform: rotate(180deg);
            }

            /* 左侧展开菜单 */
            .env-switcher-menu {
                position: absolute;
                bottom: 0;
                right: 70px;
                background: #1a1a1a;
                border-radius: 28px;
                padding: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                min-width: 120px;
                opacity: 0;
                visibility: hidden;
                transform: translateX(20px) scale(0.9);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: row;
                align-items: center;
                height: 56px;
            }

            .env-switcher.expanded .env-switcher-menu {
                opacity: 1;
                visibility: visible;
                transform: translateX(0) scale(1);
            }

            .env-menu-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 20px;
                transition: all 0.2s ease;
                color: #e5e5e5;
                margin: 0 4px;
                min-width: 50px;
                height: 40px;
            }

            .env-menu-item:hover {
                background: rgba(139, 92, 246, 0.1);
                color: #8b5cf6;
            }

            .env-menu-icon {
                font-size: 16px;
                margin-bottom: 2px;
            }

            .env-menu-label {
                font-size: 10px;
                font-weight: 500;
                text-align: center;
                line-height: 1;
            }

            /* 上方环境选项卡片 */
            .env-switcher-options {
                position: absolute;
                bottom: 80px;
                right: 0;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
                border-radius: 16px;
                padding: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(139, 92, 246, 0.2);
                min-width: 240px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px) scale(0.9);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
                overflow: hidden;
            }

            .env-switcher-options::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(139, 92, 246, 0.1) 100%);
                animation: shimmer 3s ease-in-out infinite;
                pointer-events: none;
            }

            @keyframes shimmer {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.6; }
            }

            .env-switcher.show-env-options .env-switcher-options {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            .env-option {
                display: flex;
                flex-direction: column;
                padding: 16px 20px;
                cursor: pointer;
                border-radius: 12px;
                transition: all 0.3s ease;
                color: #ffffff;
                margin: 8px 0;
                border: 2px solid rgba(255, 255, 255, 0.3);
                background: linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.2) 100%);
                position: relative;
                overflow: hidden;
            }

            .env-option::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .env-option:hover {
                background: linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(251, 146, 60, 0.2) 100%);
                border-color: #f97316;
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
                color: #f97316;
            }

            .env-option:hover .env-option-label {
                color: #f97316;
            }

            .env-option:hover .env-option-url {
                color: #fb923c;
            }

            .env-option:hover::before {
                opacity: 1;
            }

            .env-option.active {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.3) 100%);
                border-color: #10b981;
                color: #10b981;
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                transform: translateY(-1px);
            }

            .env-option.active::before {
                opacity: 1;
            }

            .env-option-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }

            .env-option-icon {
                font-size: 20px;
                margin-right: 12px;
                width: 24px;
                text-align: center;
            }

            .env-option-label {
                font-size: 16px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }

            .env-option-url {
                font-size: 13px;
                color: #ffffff;
                margin-left: 36px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                opacity: 0.9;
            }

            .env-option.active .env-option-url {
                color: #10b981;
                opacity: 1;
            }

            .env-option:hover .env-option-url {
                color: #f97316;
                opacity: 1;
            }

            @media (max-width: 768px) {
                .env-switcher {
                    bottom: 16px;
                    right: 16px;
                }

                .env-switcher-toggle {
                    width: 52px;
                    height: 52px;
                }

                .env-icon {
                    font-size: 22px;
                }

                .env-switcher-menu {
                    right: 66px;
                    height: 52px;
                }

                .env-menu-item {
                    height: 36px;
                    min-width: 45px;
                }

                .env-menu-icon {
                    font-size: 14px;
                }

                .env-menu-label {
                    font-size: 9px;
                }

                .env-switcher-options {
                    min-width: 220px;
                    padding: 12px;
                    bottom: 70px;
                }

                .env-option {
                    padding: 12px 16px;
                    margin: 6px 0;
                }

                .env-option-icon {
                    font-size: 18px;
                    margin-right: 10px;
                    width: 20px;
                }

                .env-option-label {
                    font-size: 14px;
                }

                .env-option-url {
                    font-size: 11px;
                    margin-left: 30px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    bindEvents() {
        // 延迟绑定事件，确保DOM元素已创建
        setTimeout(() => {
            // 主按钮点击事件
            const toggleBtn = this.container.querySelector('.env-switcher-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggle();
                });
            }

            // 菜单项点击事件
            this.container.querySelectorAll('.env-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
        
                    if (action === 'switch-env') {
                        // 如果当前显示的是菜单，则切换到路由卡片
                        if (this.isExpanded && !this.showEnvOptions) {
                            this.showEnvOptions = true;
                            this.updateDisplay();
                        } else if (this.showEnvOptions) {
                            // 如果当前显示的是路由卡片，则关闭
                            this.showEnvOptions = false;
                            this.updateDisplay();
                        } else {
                            // 如果当前是收起状态，则展开菜单
                            this.showEnvOptions = false;
                            this.toggle();
                        }
                    } else if (action === 'view-docs') {
                        this.viewDocs();
                        this.hide();
                    }
                });
            });

            // 环境选项点击事件
            this.container.querySelectorAll('.env-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const env = option.dataset.env;
        
                    this.switchEnvironment(env);
                    this.showEnvOptions = false;
                    this.hide();
                });
            });
        }, 100);

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hide();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }

    toggle() {
        if (this.isExpanded) {
            // 如果当前是展开状态，则关闭所有内容
            this.hide();
        } else {
            // 如果当前是收起状态，则展开菜单
            this.show();
        }
    }

    show() {
        this.isExpanded = true;
        this.showEnvOptions = false; // 默认显示菜单，不显示路由卡片
        this.container.classList.add('expanded');
        this.updateDisplay();
    }

    hide() {
        this.isExpanded = false;
        this.showEnvOptions = false;
        this.container.classList.remove('expanded');
        this.updateDisplay();
    }

    switchEnvironment(env) {
        const currentEnv = window.ENV_MANAGER.currentEnv;
        
        if (env !== currentEnv) {
            // 先清空文件列表，避免不同环境的文件混在一起
            this.clearFileList();
            
            // 直接通过ENV_MANAGER切换环境
            window.ENV_MANAGER.switchEnvironment(env);
            
            // 更新API网关的baseUrl
            if (window.apiGateway && typeof window.apiGateway.updateBaseUrl === 'function') {
                window.apiGateway.updateBaseUrl();
            }
            
            // 重新初始化API系统，确保API调用指向正确的环境
            if (window.api && window.api.core) {
                window.api.core.updateBaseUrl();
            }
            
            // 更新认证管理器的baseUrl
            if (window.authManager && typeof window.authManager.updateBaseUrl === 'function') {
                window.authManager.updateBaseUrl();
            }
            
            // 更新上传队列管理器的baseUrl
            if (window.uploadQueueManager && typeof window.uploadQueueManager.updateBaseUrl === 'function') {
                window.uploadQueueManager.updateBaseUrl();
            }
            
            // 显示切换提示
            this.showNotification(env);
            
            // 延迟重新加载数据，确保环境切换完成
            setTimeout(() => {
                this.reloadData();
            }, 100);
        }
    }

    // 清空文件列表
    clearFileList() {
        // 清空文件网格
        const fileGrid = document.getElementById('files-grid');
        if (fileGrid) {
            fileGrid.innerHTML = '';
        }
        
        // 清空UI管理器的文件缓存
        if (window.uiManager) {
            window.uiManager.allFiles = [];
            window.uiManager.files = [];
            
            // 重置文件计数
            if (window.uiManager.updateFileCount) {
                window.uiManager.updateFileCount(0, 0);
            }
            
            // 显示空状态
            if (window.uiManager.toggleEmptyState) {
                window.uiManager.toggleEmptyState(0);
            }
        }
        
        // 清空文件渲染器的缓存
        if (window.fileRenderer) {
            window.fileRenderer.files = [];
        }
        
        // 重置分类状态
        if (window.uiManager) {
            window.uiManager.currentCategory = 'all';
        }
    }

    viewDocs() {
        // 创建并显示文档查看器
        if (!window.docViewer) {
            window.docViewer = new DocViewer();
            window.docViewer.addStyles();
        }
        window.docViewer.show();
    }

    reloadData() {
        // 延迟重新加载数据，确保环境切换完成
        setTimeout(async () => {
            try {
                console.log('开始重新加载数据...');
                
                // 获取当前用户信息
                const currentUser = window.apiManager?.currentUser || 
                                  JSON.parse(localStorage.getItem('currentUser') || '{}');
                
                // 方法1: 尝试使用app的loadUserData方法（最可靠）
                if (window.app && typeof window.app.loadUserData === 'function') {
                    console.log('使用app.loadUserData重新加载数据');
                    await window.app.loadUserData(currentUser);
                }
                // 方法2: 尝试使用uiManager的loadFiles方法
                else if (window.uiManager && typeof window.uiManager.loadFiles === 'function') {
                    console.log('使用uiManager.loadFiles重新加载数据');
                    await window.uiManager.loadFiles();
                }
                // 方法3: 尝试使用fileRenderer的loadFiles方法
                else if (window.fileRenderer && typeof window.fileRenderer.loadFiles === 'function') {
                    console.log('使用fileRenderer.loadFiles重新加载数据');
                    await window.fileRenderer.loadFiles();
                }
                // 方法4: 手动重新加载各个组件
                else {
                    console.log('手动重新加载各个组件');
                    
                    // 重新加载文件列表
                    if (window.uiManager && window.uiManager.api && window.uiManager.api.files) {
                        const files = await window.uiManager.api.files.getFiles();
                        if (files && window.uiManager.renderFileList) {
                            window.uiManager.allFiles = files;
                            window.uiManager.renderFileList(files);
                        }
                    }
                    
                    // 重新加载URL文件
                    if (window.uiManager && window.uiManager.api && window.uiManager.api.urlFiles) {
                        const urlFiles = await window.uiManager.api.urlFiles.getUrlFiles();
                        if (urlFiles && window.uiManager.allFiles) {
                            const regularFiles = window.uiManager.allFiles.filter(file => !file.isUrlFile);
                            window.uiManager.allFiles = [...regularFiles, ...urlFiles];
                            if (window.uiManager.renderFileList) {
                                window.uiManager.renderFileList(window.uiManager.allFiles);
                            }
                        }
                    }
                    
                    // 重新加载文件夹
                    if (window.uiManager && window.uiManager.api && window.uiManager.api.folders) {
                        const folders = await window.uiManager.api.folders.getFolders();
                        if (folders && window.uiManager.renderFolderList) {
                            window.uiManager.folders = folders;
                            window.uiManager.renderFolderList(folders);
                        }
                    }
                    
                    // 重新加载存储信息
                    if (window.uiManager && window.uiManager.api && window.uiManager.api.storage) {
                        const storageInfo = await window.uiManager.api.storage.getStorageInfo();
                        if (storageInfo && window.uiManager.updateStorageDisplay) {
                            window.uiManager.updateStorageDisplay(storageInfo);
                        }
                    }
                    
                    // 重新加载用户信息
                    if (window.uiManager && window.uiManager.api && window.uiManager.api.profile) {
                        const profile = await window.uiManager.api.profile.getProfile();
                        if (profile && window.uiManager.updateProfileDisplay) {
                            window.uiManager.updateProfileDisplay(profile);
                        }
                    }
                }
                
                // 重置分类状态到全部
                if (window.uiManager) {
                    window.uiManager.currentCategory = 'all';
                    // 触发分类按钮重置
                    const allCategoryBtn = document.querySelector('[data-category="all"]');
                    if (allCategoryBtn) {
                        allCategoryBtn.click();
                    }
                }
                
                console.log('数据重新加载完成');
                
            } catch (error) {
                console.error('重新加载数据时出错:', error);
                // 如果重新加载失败，显示错误提示
                if (window.Notify) {
                    window.Notify.show({ 
                        message: '环境切换后数据加载失败，请刷新页面', 
                        type: 'error' 
                    });
                }
            }
        }, 300);
    }

    handle404Error() {
        // 监听404错误，自动切换到备用环境
        window.addEventListener('error', (e) => {
            if (e.target && e.target.src && e.target.src.includes('localhost')) {
                console.warn('检测到localhost资源加载失败，可能需要切换环境');
            }
        });
    }

    showNotification(env) {
        const envName = env === 'local' ? '开发环境' : '生产环境';
        const message = `已切换到${envName}`;
        
        if (window.notify) {
            window.notify.success(message, {
                duration: 2000,
                position: 'top-center'
            });
        }
    }

    updateDisplay() {
        const switcher = this.container;
        const currentEnv = window.ENV_MANAGER.currentEnv;
        
        // 更新展开状态
        if (this.isExpanded) {
            switcher.classList.add('expanded');
        } else {
            switcher.classList.remove('expanded');
        }
        
        // 更新环境选项显示状态
        if (this.showEnvOptions) {
            switcher.classList.add('show-env-options');
        } else {
            switcher.classList.remove('show-env-options');
        }
        
        // 更新选项状态
        this.container.querySelectorAll('.env-option').forEach(option => {
            const env = option.dataset.env;
            if (env === currentEnv) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        // 更新API图标
        this.updateApiIcon();
    }

    updateApiIcon() {
        const apiIcon = document.getElementById('env-api-icon');
        if (!apiIcon) return;
        
        const currentEnv = window.ENV_MANAGER?.currentEnv || 'local';
        const envIcons = {
            'local': '🛠️',
            'prod': '🚀'
        };
        
        apiIcon.textContent = envIcons[currentEnv] || '🛠️';
    }
}

// 初始化函数
const initEnvSwitcher = (retryCount = 0) => {
    if (retryCount > 10) {
        console.warn('环境切换器初始化失败：超过最大重试次数');
        return;
    }
    
    // 检查基本依赖
    if (window.ENV_MANAGER) {
        if (!window.envSwitcher) {
            window.envSwitcher = new EnvSwitcher();
        }
    } else {
        setTimeout(() => initEnvSwitcher(retryCount + 1), 100);
    }
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initEnvSwitcher, 1000);
    });
} else {
    setTimeout(initEnvSwitcher, 1000);
}