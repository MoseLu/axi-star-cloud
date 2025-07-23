/**
 * 环境切换器UI组件
 * 右下角悬浮按钮设计，只包含开发和生产环境
 * 只有管理员可见
 */

class EnvSwitcher {
    constructor() {
        this.isVisible = false;
        this.isExpanded = false;
        this.init();
    }

    init() {
        // 检查是否为管理员或调试模式
        const isAdmin = this.isAdmin();
        const isDebugMode = window.ENV_MANAGER.config.debug;
        
        if (!isAdmin && !isDebugMode) {
            console.log('❌ 非管理员且非调试模式，不显示环境切换器');
            return;
        }
        
        console.log('✅ 开始初始化环境切换器');
        console.log('  - 管理员权限:', isAdmin);
        console.log('  - 调试模式:', isDebugMode);
        this.createSwitcher();
        this.bindEvents();
        this.updateDisplay();
    }

    isAdmin() {
        // 检查是否为管理员用户
        const user = window.authManager?.getCurrentUser();
        const isAdmin = user && user.role === 'admin';
        
        console.log('🔍 管理员权限检查:');
        console.log('  - 用户信息:', user);
        console.log('  - 用户角色:', user?.role);
        console.log('  - 是否为管理员:', isAdmin);
        
        // 如果用户信息未加载，尝试从localStorage获取
        if (!user) {
            try {
                const storedUser = localStorage.getItem('user');
                const currentUser = localStorage.getItem('currentUser');
                const userData = localStorage.getItem('userData');
                
                console.log('  - localStorage中的user:', storedUser);
                console.log('  - localStorage中的currentUser:', currentUser);
                console.log('  - localStorage中的userData:', userData);
                
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    const storedIsAdmin = parsedUser && parsedUser.role === 'admin';
                    console.log('  - 从localStorage获取用户信息:', parsedUser);
                    console.log('  - localStorage中的管理员权限:', storedIsAdmin);
                    return storedIsAdmin;
                }
                
                if (currentUser) {
                    const parsedCurrentUser = JSON.parse(currentUser);
                    const currentUserIsAdmin = parsedCurrentUser && parsedCurrentUser.isAdmin;
                    console.log('  - 从currentUser获取用户信息:', parsedCurrentUser);
                    console.log('  - currentUser中的管理员权限:', currentUserIsAdmin);
                    return currentUserIsAdmin;
                }
            } catch (error) {
                console.log('  - localStorage解析失败:', error);
            }
        }
        
        return isAdmin;
    }

    createSwitcher() {
        // 创建环境切换器容器
        const switcher = document.createElement('div');
        switcher.id = 'env-switcher';
        switcher.className = 'env-switcher';
        switcher.innerHTML = `
            <div class="env-switcher-main">
                <div class="env-switcher-toggle" title="API环境切换">
                    <span class="env-icon">🌐</span>
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

        // 添加样式
        this.addStyles();

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
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                position: relative;
                z-index: 2;
            }

            .env-switcher-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
            }

            .env-switcher-toggle:active {
                transform: scale(0.95);
            }

            .env-icon {
                font-size: 20px;
                color: white;
            }

            .env-switcher-options {
                position: absolute;
                bottom: 60px;
                right: 0;
                display: flex;
                flex-direction: column;
                gap: 8px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: all 0.3s ease;
            }

            .env-switcher.expanded .env-switcher-options {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .env-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px 12px;
                margin: 4px 0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(0, 0, 0, 0.1);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                min-width: 80px;
            }

            .env-option:hover {
                background: rgba(255, 255, 255, 1);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .env-option.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-color: #667eea;
            }

            .env-option-icon {
                font-size: 16px;
                margin-bottom: 4px;
            }

            .env-option-label {
                font-size: 10px;
                font-weight: 600;
                color: #333;
                text-align: center;
                line-height: 1;
            }

            .env-option-url {
                font-size: 10px;
                color: #2c3e50;
                margin-top: 4px;
                text-align: center;
                line-height: 1.3;
                font-weight: 600;
                background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
                padding: 4px 6px;
                border-radius: 4px;
                border: 2px solid #95a5a6;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
                letter-spacing: 0.5px;
            }

            .env-option.active .env-option-url {
                color: #ffffff;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
                border-color: rgba(255, 255, 255, 0.4);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }

            .env-option:not(.active) {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border: 2px solid #dee2e6;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }

            .env-option:not(.active):hover {
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                border-color: #64b5f6;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }

            /* 动画效果 */
            .env-switcher.expanded .env-option:nth-child(1) {
                animation: slideIn 0.3s ease 0.1s both;
            }

            .env-switcher.expanded .env-option:nth-child(2) {
                animation: slideIn 0.3s ease 0.2s both;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .env-switcher {
                    bottom: 15px;
                    right: 15px;
                }
                
                .env-switcher-toggle {
                    width: 45px;
                    height: 45px;
                }
                
                .env-option {
                    width: 45px;
                    height: 35px;
                }
                
                .env-icon {
                    font-size: 18px;
                }
                
                .env-option-icon {
                    font-size: 12px;
                }
                
                .env-option-label {
                    font-size: 9px;
                }

                .env-option-url {
                    font-size: 8px;
                    padding: 3px 4px;
                    margin-top: 3px;
                }
            }

            /* 暗色主题适配 */
            @media (prefers-color-scheme: dark) {
                .env-option {
                    background: #2d3748;
                    color: #e2e8f0;
                }
                
                .env-option:hover {
                    background: #4a5568;
                }
            }

            /* 移动端适配 */
            @media (max-width: 768px) {
                .env-switcher {
                    bottom: 15px;
                    right: 15px;
                }

                .env-switcher-toggle {
                    width: 45px;
                    height: 45px;
                }

                .env-switcher-options {
                    bottom: 55px;
                    right: 0;
                    min-width: 70px;
                }

                .env-option {
                    padding: 6px 8px;
                    margin: 3px 0;
                    min-width: 60px;
                }

                .env-option-icon {
                    font-size: 14px;
                }

                .env-option-label {
                    font-size: 9px;
                }

                .env-option-url {
                    font-size: 7px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // 主按钮点击事件
        const toggle = this.container.querySelector('.env-switcher-toggle');
        toggle.addEventListener('click', () => this.toggle());

        // 环境选项点击事件
        this.container.querySelectorAll('.env-option').forEach(option => {
            option.addEventListener('click', () => {
                const env = option.dataset.env;
                this.switchEnvironment(env);
            });
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hide();
            }
        });

        // 监听环境变化事件
        window.addEventListener('environmentChanged', () => {
            this.updateDisplay();
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
        this.container.classList.add('expanded');
        this.isExpanded = true;
        this.updateDisplay();
    }

    hide() {
        this.container.classList.remove('expanded');
        this.isExpanded = false;
    }

    switchEnvironment(env) {
        const currentEnv = window.ENV_MANAGER.currentEnv;
        
        if (env !== currentEnv) {
            // 根据环境设置对应的API地址
            if (env === 'local') {
                window.ENV_MANAGER.switchEnvironment('local');
            } else if (env === 'prod') {
                window.ENV_MANAGER.switchEnvironment('prod');
            }
            
            this.updateDisplay();
            this.hide();
            
            // 显示切换提示
            this.showNotification(env);
            
            // 自动重新加载数据
            this.reloadData();
        }
    }

    reloadData() {
        console.log('🔄 环境切换后重新加载数据...');
        
        // 延迟一点时间确保环境切换完成
        setTimeout(() => {
            // 重新加载文件列表
            if (window.uiManager && window.uiManager.fileRenderer) {
                console.log('📁 重新加载文件列表...');
                window.uiManager.fileRenderer.loadFiles();
            }
            
            // 重新加载文件夹列表
            if (window.uiManager && window.uiManager.folderManager) {
                console.log('📂 重新加载文件夹列表...');
                window.uiManager.folderManager.loadFolders();
            }
            
            // 重新加载URL文件列表
            if (window.apiSystem && window.apiSystem.urlFiles) {
                console.log('🔗 重新加载URL文件列表...');
                // 触发URL文件重新加载
                window.dispatchEvent(new CustomEvent('reloadUrlFiles'));
            }
            
            // 重新加载存储统计
            if (window.uiManager && window.uiManager.core) {
                console.log('💾 重新加载存储统计...');
                window.uiManager.core.loadStorageInfo();
            }
            
            // 重新加载用户资料
            if (window.uiManager && window.uiManager.profileManager) {
                console.log('👤 重新加载用户资料...');
                window.uiManager.profileManager.loadProfile();
            }
            
            // 触发全局重新加载事件
            window.dispatchEvent(new CustomEvent('environmentDataReload', {
                detail: { environment: window.ENV_MANAGER.currentEnv }
            }));
            
            console.log('✅ 数据重新加载完成');
        }, 500);
    }

    showNotification(env) {
        const envName = env === 'local' ? '开发环境' : '生产环境';
        const icon = env === 'local' ? '🛠️' : '🚀';
        
        // 使用现有的通知系统
        if (window.notify) {
            window.notify.success(`${icon} 已切换到${envName}，正在重新加载数据...`, {
                duration: 3000,
                position: 'top-right'
            });
        } else {
            // 备用提示
            console.log(`${icon} 已切换到${envName}，正在重新加载数据...`);
        }
    }

    updateDisplay() {
        const currentEnv = window.ENV_MANAGER.currentEnv;
        const config = window.ENV_MANAGER.config;
        
        // 更新主按钮图标和颜色
        const toggle = this.container.querySelector('.env-switcher-toggle');
        const icon = this.container.querySelector('.env-icon');
        
        // 根据当前环境设置图标和颜色
        if (currentEnv === 'local') {
            icon.textContent = '🛠️';
            toggle.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            icon.textContent = '🚀';
            toggle.style.background = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
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

// 自动初始化环境切换器
document.addEventListener('DOMContentLoaded', () => {
    // 优化初始化逻辑，减少延迟
    const initEnvSwitcher = (retryCount = 0) => {
        console.log(`🔍 检查环境切换器初始化条件... (尝试 ${retryCount + 1})`);
        
        // 检查环境管理器是否存在
        if (!window.ENV_MANAGER) {
            console.log('❌ ENV_MANAGER 不存在');
            if (retryCount < 3) {
                setTimeout(() => initEnvSwitcher(retryCount + 1), 500);
            }
            return;
        }
        
        // 智能检测用户信息：优先使用authManager，如果失败则直接检查localStorage
        let user = window.authManager?.getCurrentUser();
        let isAdmin = false;
        
        // 如果authManager获取失败，直接检查localStorage
        if (!user) {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                try {
                    user = JSON.parse(currentUser);
                    isAdmin = user.isAdmin === true;
                    console.log('📦 从localStorage获取用户信息:', user);
                } catch (e) {
                    console.log('❌ 解析localStorage用户信息失败:', e);
                }
            }
        } else {
            isAdmin = user && user.role === 'admin';
        }
        
        console.log('👤 当前用户:', user);
        console.log('🔑 管理员权限:', isAdmin);
        
        // 如果用户信息还没加载完成，重试（减少重试次数和间隔）
        if (!user && retryCount < 3) {
            console.log('⏳ 用户信息未加载，等待重试...');
            setTimeout(() => initEnvSwitcher(retryCount + 1), 300);
            return;
        }
        
        // 初始化条件：管理员权限 OR 调试模式
        if (isAdmin || window.ENV_MANAGER.config.debug) {
            console.log('✅ 初始化环境切换器');
            new EnvSwitcher();
        } else {
            console.log('❌ 不满足初始化条件');
        }
    };
    
    // 首次尝试，延迟500毫秒（进一步减少延迟）
    setTimeout(() => initEnvSwitcher(), 500);
});

// 导出类供外部使用
window.EnvSwitcher = EnvSwitcher;