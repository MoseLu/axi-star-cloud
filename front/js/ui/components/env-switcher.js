/**
 * 环境切换器UI组件
 * 右下角悬浮按钮设计，类似移动端交互
 * 只有管理员可见
 */

class EnvSwitcher {
    constructor() {
        this.container = null;
        this.isExpanded = false; // 确保初始状态是收起的
        this.showEnvOptions = false; // 确保初始不显示环境选项
        this.isUpdating = false; // 添加更新状态标志，防止循环调用
        this.lastUpdateTime = 0; // 添加最后更新时间，用于防抖
    }

    init() {
        // 检查是否为管理员
        if (!this.isAdmin()) {
            return;
        }
        
        // 创建切换器
        this.createSwitcher();
        
        // 添加样式
        this.addStyles();
        
        // 绑定事件
        this.bindEvents();
        
        // 确保初始状态是收起的
        this.isExpanded = false;
        this.showEnvOptions = false;
        
        // 延迟初始化显示，确保DOM完全创建
        setTimeout(() => {
            if (this.container) {
                // 确保状态是收起的
                this.hide();
                this.updateDisplay();
            }
        }, 100);
    }

    isAdmin() {
        // 优先检查当前用户是否为管理员用户（Mose）
        let currentUser = null;
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            currentUser = window.StorageManager.getUser();
        } else {
            // 如果 StorageManager 未加载，使用 localStorage 作为备用
            const userData = localStorage.getItem('userInfo');
            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                } catch (e) {
                    console.warn('解析用户信息失败:', e);
                }
            }
        }
        
        // 检查用户是否为管理员（Mose）
        if (currentUser && currentUser.username === 'Mose') {
            return true;
        }
        
        // 使用token验证管理员权限
        if (window.tokenManager && typeof window.tokenManager.validateAdminTokens === 'function') {
            // 异步验证，这里暂时返回false，实际使用时应该等待验证结果
            return false;
        }
        
        // 检查cookie中的管理员token
        try {
            const cookies = document.cookie.split(';');
            const adminAccessToken = cookies.find(cookie => cookie.trim().startsWith('admin_access_token='));
            const adminRefreshToken = cookies.find(cookie => cookie.trim().startsWith('admin_refresh_token='));
            
            // 只有同时存在管理员访问token和刷新token才认为是管理员
            if (adminAccessToken && adminRefreshToken) {
                return true;
            }
        } catch (error) {
            console.error('检查管理员token失败:', error);
        }
        
        // 开发模式下，只有在没有用户信息时才显示（用于调试）
        if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !currentUser) {
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
                        <span class="env-option-url">localhost:8124</span>
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

            /* 明亮主题适配 */
            body.theme-light .env-switcher-toggle {
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(168, 85, 247, 0.8) 100%);
                box-shadow: 0 4px 20px rgba(139, 92, 246, 0.2);
                border: 2px solid rgba(139, 92, 246, 0.3);
            }

            .env-switcher-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
            }

            body.theme-light .env-switcher-toggle:hover {
                box-shadow: 0 8px 30px rgba(139, 92, 246, 0.4);
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
                font-size: 16px;
                color: #fff;
                transition: transform 0.3s ease;
                transform-origin: center;
                z-index: 2;
                position: absolute;
                left: 8px;
                top: 8px;
            }

            .env-icon-api {
                position: absolute;
                right: 8px;
                bottom: 8px;
                font-size: 16px;
                color: #fff;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 50%;
                width: 20px;
                height: 20px;
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

            /* 明亮主题菜单适配 */
            body.theme-light .env-switcher-menu {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(139, 92, 246, 0.2);
                box-shadow: 0 10px 40px rgba(139, 92, 246, 0.2);
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

            /* 明亮主题菜单项适配 */
            body.theme-light .env-menu-item {
                color: #374151;
            }

            body.theme-light .env-menu-item:hover {
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

            /* 明亮主题选项卡片适配 */
            body.theme-light .env-switcher-options {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
                box-shadow: 0 20px 60px rgba(139, 92, 246, 0.2);
                border: 1px solid rgba(139, 92, 246, 0.2);
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

            /* 明亮主题选项适配 */
            body.theme-light .env-option {
                color: #374151;
                border: 2px solid rgba(139, 92, 246, 0.2);
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
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

            body.theme-light .env-option:hover {
                background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(251, 146, 60, 0.1) 100%);
                border-color: #f97316;
                box-shadow: 0 8px 25px rgba(249, 115, 22, 0.2);
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

            body.theme-light .env-option.active {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%);
                border-color: #10b981;
                color: #10b981;
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
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
            // 确保container存在
            if (!this.container) {
                setTimeout(() => this.bindEvents(), 500);
                return;
            }
            
            // 主按钮点击事件
            const toggleBtn = this.container.querySelector('.env-switcher-toggle');
            if (toggleBtn) {
                // 移除已存在的事件监听器，避免重复绑定
                toggleBtn.removeEventListener('click', this.handleToggleClick);
                
                // 创建事件处理函数
                this.handleToggleClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggle();
                };
                
                // 绑定事件监听器
                toggleBtn.addEventListener('click', this.handleToggleClick);
            }

            // 菜单项点击事件
            this.container.querySelectorAll('.env-menu-item').forEach(item => {
                // 移除已存在的事件监听器
                item.removeEventListener('click', this.handleMenuItemClick);
                
                // 创建事件处理函数
                this.handleMenuItemClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const action = item.dataset.action;
                    if (action === 'switch-env') {
                        if (this.isExpanded && !this.showEnvOptions) {
                            this.showEnvOptions = true;
                            this.updateDisplay();
                        } else if (this.showEnvOptions) {
                            this.showEnvOptions = false;
                            this.updateDisplay();
                        } else {
                            this.showEnvOptions = false;
                            this.toggle();
                        }
                    } else if (action === 'view-docs') {
                        this.viewDocs();
                        this.hide();
                    }
                };
                item.addEventListener('click', this.handleMenuItemClick);
            });
            
            // 环境选项点击事件
            this.container.querySelectorAll('.env-option').forEach(option => {
                // 移除已存在的事件监听器
                option.removeEventListener('click', this.handleEnvOptionClick);
                
                // 创建事件处理函数
                this.handleEnvOptionClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const env = option.dataset.env;
                    if (env) {
                        this.switchEnvironment(env);
                        this.hide(); // 切换环境后关闭菜单
                    }
                };
                
                // 绑定事件监听器
                option.addEventListener('click', this.handleEnvOptionClick);
            });
            
            // 点击外部关闭菜单 - 使用一次性事件监听器避免重复绑定
            const existingClickHandler = this.externalClickHandler;
            if (existingClickHandler) {
                document.removeEventListener('click', existingClickHandler);
            }
            
            this.externalClickHandler = (e) => {
                if (!this.container.contains(e.target)) {
                    this.hide();
                }
            };
            
            document.addEventListener('click', this.externalClickHandler);
            
        }, 100);

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
        
        // 安全检查：确保container存在
        if (this.container && this.container.classList) {
            this.container.classList.add('expanded');
        }
        
        // 只在状态真正改变时才调用updateDisplay
        if (!this.isUpdating) {
            this.updateDisplay();
        }
        this.updateDisplay();
    }

    hide() {
        this.isExpanded = false;
        this.showEnvOptions = false;
        
        // 安全检查：确保container存在
        if (this.container && this.container.classList) {
            this.container.classList.remove('expanded');
        }
        
        // 只在状态真正改变时才调用updateDisplay
        if (!this.isUpdating) {
            this.updateDisplay();
        }
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

    async viewDocs() {
        // 创建并显示文档查看器
        if (!window.docViewer) {
            window.docViewer = new DocViewer();
            window.docViewer.addStyles();
            // 等待初始化完成
            await window.docViewer.init();
        }
        window.docViewer.show();
    }

    reloadData() {
        // 延迟重新加载数据，确保环境切换完成
        setTimeout(async () => {
            try {
                
                // 获取当前用户信息
                let currentUser = window.apiManager?.currentUser;
                if (!currentUser) {
                    if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
                        currentUser = window.StorageManager.getUser();
                    } else {
                        // 如果 StorageManager 未加载，使用 localStorage 作为备用
                        const userData = localStorage.getItem('currentUser');
                        if (userData) {
                            try {
                                currentUser = JSON.parse(userData);
                            } catch (e) {
                                console.warn('解析用户信息失败:', e);
                            }
                        }
                    }
                }
                if (!currentUser) currentUser = {};
                
                // 直接手动重新加载各个组件，避免循环调用
                
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
                    if (profile) {
                        if (window.uiManager.updateProfileDisplay) {
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
                
                // 延迟重新绑定事件，确保DOM元素完全加载
                setTimeout(() => {
                    // 重新绑定布局切换和排序按钮事件
                    if (window.fileRenderer) {
                        // 重新绑定布局切换按钮事件
                        if (typeof window.fileRenderer.bindLayoutSwitchEvent === 'function') {
                            window.fileRenderer.bindLayoutSwitchEvent();
                        }
                        // 重新绑定排序按钮事件
                        if (typeof window.fileRenderer.bindSortSwitchEvent === 'function') {
                            window.fileRenderer.bindSortSwitchEvent();
                        }
                    }
                    
                    // 重新绑定其他UI组件事件
                    if (window.uiManager) {
                        // 重新绑定上传按钮事件
                        if (typeof window.uiManager.bindUploadBtn === 'function') {
                            window.uiManager.bindUploadBtn();
                        }
                        
                        // 重新绑定分类事件
                        if (window.uiManager.categories && typeof window.uiManager.categories.bindEvents === 'function') {
                            window.uiManager.categories.bindEvents();
                        }
                        
                        // 重新绑定设置事件
                        if (window.uiManager.settingsManager && typeof window.uiManager.settingsManager.bindSettingsEvents === 'function') {
                            window.uiManager.settingsManager.bindSettingsEvents();
                        }
                        
                        // 重新绑定管理员事件
                        if (window.uiManager.adminManager && typeof window.uiManager.adminManager.bindAdminEvents === 'function') {
                            window.uiManager.adminManager.bindAdminEvents();
                        }
                        
                        // 重新绑定同步文档事件
                        if (window.uiManager.docsSync && typeof window.uiManager.docsSync.bindSyncEvents === 'function') {
                            window.uiManager.docsSync.bindSyncEvents();
                        }
                    }
                }, 500); // 延迟500ms确保DOM完全加载
                
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
        // 防抖机制：如果距离上次更新不到100ms，则跳过
        const now = Date.now();
        if (now - this.lastUpdateTime < 100) {
            return;
        }
        
        // 如果正在更新，则跳过
        if (this.isUpdating) {
            return;
        }
        
        // 安全检查：确保container存在
        if (!this.container) {
            console.warn('⚠️ container不存在，无法更新显示');
            return;
        }
        
        this.isUpdating = true;
        this.lastUpdateTime = now;
        
        const switcher = this.container;
        
        // 优先从ENV_MANAGER获取当前环境
        let currentEnv = 'local';
        if (window.ENV_MANAGER && window.ENV_MANAGER.currentEnv) {
            currentEnv = window.ENV_MANAGER.currentEnv;
        } else if (window.ENV_MANAGER && typeof window.ENV_MANAGER.getCurrentEnvironment === 'function') {
            currentEnv = window.ENV_MANAGER.getCurrentEnvironment();
        } else {
            // 降级处理：从localStorage获取环境信息
            const systemData = localStorage.getItem('systemInfo');
            if (systemData) {
                try {
                    const systemInfo = JSON.parse(systemData);
                    currentEnv = systemInfo.environment || 'local';
                } catch (error) {
                    console.warn('解析系统信息失败:', error);
                }
            }
        }
        // 安全检查：确保container存在
        if (!this.container) {
            return;
        }
        
        const switcherElement = this.container;
        const currentEnvName = window.ENV_MANAGER?.currentEnv || 'local';
        
        // 更新展开状态
        if (this.isExpanded) {
            switcherElement.classList.add('expanded');
        } else {
            switcherElement.classList.remove('expanded');
        }
        
        // 更新环境选项显示状态
        if (this.showEnvOptions) {
            switcherElement.classList.add('show-env-options');
        } else {
            switcherElement.classList.remove('show-env-options');
        }
        
        // 更新选项状态
        const envOptions = this.container.querySelectorAll('.env-option');
        if (envOptions.length > 0) {
            envOptions.forEach(option => {
                const env = option.dataset.env;
                if (env === currentEnvName) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
        
        // 更新API图标
        this.updateApiIcon();
        
        this.isUpdating = false;
    }

    updateApiIcon() {
        const apiIcon = document.getElementById('env-api-icon');
        if (!apiIcon) {
            return;
        }
        
        // 环境图标映射
        const envIcons = {
            'local': '🛠️',
            'prod': '🚀',
            'dev': '🔧',
            'test': '🧪'
        };
        
        // 优先从ENV_MANAGER获取当前环境
        let currentEnv = 'local';
        if (window.ENV_MANAGER && window.ENV_MANAGER.currentEnv) {
            currentEnv = window.ENV_MANAGER.currentEnv;
        } else if (window.ENV_MANAGER && typeof window.ENV_MANAGER.getCurrentEnvironment === 'function') {
            currentEnv = window.ENV_MANAGER.getCurrentEnvironment();
        } else {
            // 降级处理：从localStorage获取环境信息
            const systemData = localStorage.getItem('systemInfo');
            if (systemData) {
                try {
                    const systemInfo = JSON.parse(systemData);
                    currentEnv = systemInfo.environment || 'local';
                } catch (error) {
                    console.warn('解析系统信息失败:', error);
                }
            }
        }
        
        const newIcon = envIcons[currentEnv] || '🛠️';
        if (apiIcon.textContent !== newIcon) {
            apiIcon.textContent = newIcon;
        }
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
            // 确保DOM完全准备好
            if (document.readyState === 'loading') {
                setTimeout(() => initEnvSwitcher(retryCount), 100);
                return;
            }
            
            window.envSwitcher = new EnvSwitcher();
            // 调用init方法进行初始化
            window.envSwitcher.init();
            
            // 延迟更新图标，确保环境检测完成
            setTimeout(() => {
                if (window.envSwitcher && typeof window.envSwitcher.updateApiIcon === 'function') {
                    window.envSwitcher.updateApiIcon();
                    window.envSwitcher.updateDisplay();
                }
            }, 2000); // 延迟2秒，确保环境检测完成
        }
    } else {
        setTimeout(() => initEnvSwitcher(retryCount + 1), 100);
    }
};

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 延迟初始化，确保所有依赖都已加载
        setTimeout(initEnvSwitcher, 1000);
    });
} else {
    // 延迟初始化，确保所有依赖都已加载
    setTimeout(initEnvSwitcher, 1000);
}