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
                return user.isAdmin === true;
            } catch (e) {
                return false;
            }
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
                    <span class="env-icon">⚙️</span>
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
                <div class="env-switcher-options" style="display: none;">
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
            }

            .env-switcher-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
            }

            .env-switcher-toggle:active {
                transform: scale(0.95);
            }

            .env-icon {
                font-size: 24px;
                color: #fff;
                transition: transform 0.3s ease;
            }

            .env-switcher.expanded .env-icon {
                transform: rotate(180deg);
            }

            .env-switcher-menu {
                position: absolute;
                bottom: 70px;
                right: 0;
                background: #1a1a1a;
                border-radius: 12px;
                padding: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                min-width: 160px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px) scale(0.9);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .env-switcher.expanded .env-switcher-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            .env-menu-item {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.2s ease;
                color: #e5e5e5;
                margin: 2px 0;
            }

            .env-menu-item:hover {
                background: rgba(139, 92, 246, 0.1);
                color: #8b5cf6;
            }

            .env-menu-icon {
                font-size: 18px;
                margin-right: 12px;
                width: 20px;
                text-align: center;
            }

            .env-menu-label {
                font-size: 14px;
                font-weight: 500;
            }

            .env-switcher-options {
                position: absolute;
                bottom: 70px;
                right: 0;
                background: #1a1a1a;
                border-radius: 12px;
                padding: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                border: 1px solid #333;
                min-width: 200px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px) scale(0.9);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .env-switcher.show-env-options .env-switcher-options {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            .env-option {
                display: flex;
                flex-direction: column;
                padding: 12px 16px;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.2s ease;
                color: #e5e5e5;
                margin: 4px 0;
                border: 1px solid transparent;
            }

            .env-option:hover {
                background: rgba(139, 92, 246, 0.1);
                border-color: rgba(139, 92, 246, 0.3);
            }

            .env-option.active {
                background: rgba(139, 92, 246, 0.2);
                border-color: #8b5cf6;
                color: #8b5cf6;
            }

            .env-option-header {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
            }

            .env-option-icon {
                font-size: 16px;
                margin-right: 8px;
            }

            .env-option-label {
                font-size: 14px;
                font-weight: 600;
            }

            .env-option-url {
                font-size: 12px;
                color: #888;
                margin-left: 24px;
            }

            .env-back-button {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s ease;
                color: #888;
                margin-bottom: 8px;
                font-size: 12px;
            }

            .env-back-button:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            .env-back-icon {
                margin-right: 6px;
                font-size: 14px;
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

                .env-switcher-menu,
                .env-switcher-options {
                    min-width: 140px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    bindEvents() {
        // 主按钮点击事件
        this.container.querySelector('.env-switcher-toggle').addEventListener('click', () => {
            this.toggle();
        });

        // 菜单项点击事件
        this.container.querySelectorAll('.env-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                if (action === 'switch-env') {
                    this.showEnvOptions = true;
                    this.updateDisplay();
                } else if (action === 'view-docs') {
                    this.viewDocs();
                    this.hide();
                }
            });
        });

        // 环境选项点击事件
        this.container.querySelectorAll('.env-option').forEach(option => {
            option.addEventListener('click', () => {
                const env = option.dataset.env;
                this.switchEnvironment(env);
                this.showEnvOptions = false;
                this.hide();
            });
        });

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
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        this.isExpanded = true;
        this.updateDisplay();
    }

    hide() {
        this.isExpanded = false;
        this.showEnvOptions = false;
        this.updateDisplay();
    }

    switchEnvironment(env) {
        const currentEnv = window.ENV_MANAGER.currentEnv;
        
        if (env !== currentEnv) {
            // 直接通过ENV_MANAGER切换环境
            window.ENV_MANAGER.switchEnvironment(env);
            
            // 重新初始化API系统，确保API调用指向正确的环境
            if (window.api && window.api.core) {
                window.api.core.updateBaseUrl();
            }
            
            // 更新认证管理器的baseUrl
            if (window.authManager && typeof window.authManager.updateBaseUrl === 'function') {
                window.authManager.updateBaseUrl();
            }
            
            // 显示切换提示
            this.showNotification(env);
            
            // 自动重新加载数据
            this.reloadData();
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
        setTimeout(() => {
            // 重新加载文件列表
            if (window.fileRenderer && typeof window.fileRenderer.loadFiles === 'function') {
                window.fileRenderer.loadFiles();
            }
            
            // 重新加载存储信息
            if (window.storageManager && typeof window.storageManager.updateStorageInfo === 'function') {
                window.storageManager.updateStorageInfo();
            }
            
            // 重新加载用户信息
            if (window.profileManager && typeof window.profileManager.loadProfile === 'function') {
                window.profileManager.loadProfile();
            }
        }, 500);
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
        } else {
            // 备用通知方式
            console.log(message);
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
    }
}

// 初始化函数
const initEnvSwitcher = (retryCount = 0) => {
    if (retryCount > 10) {
        console.warn('环境切换器初始化失败');
        return;
    }
    
    if (window.ENV_MANAGER && window.authManager) {
        if (!window.envSwitcher) {
            window.envSwitcher = new EnvSwitcher();
            console.log('环境切换器已初始化');
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