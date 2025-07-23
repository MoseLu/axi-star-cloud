/**
 * 环境切换器UI组件
 * 提供可视化的环境切换界面
 */

class EnvSwitcher {
    constructor() {
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createSwitcher();
        this.bindEvents();
        this.updateDisplay();
    }

    createSwitcher() {
        // 创建环境切换器容器
        const switcher = document.createElement('div');
        switcher.id = 'env-switcher';
        switcher.className = 'env-switcher';
        switcher.innerHTML = `
            <div class="env-switcher-toggle">
                <span class="env-icon">🌍</span>
                <span class="env-name">环境</span>
                <span class="env-arrow">▼</span>
            </div>
            <div class="env-switcher-panel">
                <div class="env-header">
                    <h4>环境切换</h4>
                    <button class="env-close">×</button>
                </div>
                <div class="env-list">
                    <!-- 环境列表将通过JavaScript动态生成 -->
                </div>
                <div class="env-custom">
                    <input type="text" placeholder="输入自定义API地址" class="env-custom-input">
                    <button class="env-custom-btn">应用</button>
                </div>
                <div class="env-info">
                    <div class="env-info-item">
                        <span class="env-label">当前环境:</span>
                        <span class="env-value" id="current-env-name">-</span>
                    </div>
                    <div class="env-info-item">
                        <span class="env-label">API地址:</span>
                        <span class="env-value" id="current-env-api">-</span>
                    </div>
                    <div class="env-info-item">
                        <span class="env-label">调试模式:</span>
                        <span class="env-value" id="current-env-debug">-</span>
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
                top: 20px;
                right: 20px;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .env-switcher-toggle {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
            }

            .env-switcher-toggle:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }

            .env-switcher-panel {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                min-width: 280px;
                margin-top: 8px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }

            .env-switcher.show .env-switcher-panel {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .env-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid #eee;
            }

            .env-header h4 {
                margin: 0;
                font-size: 14px;
                color: #333;
            }

            .env-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .env-close:hover {
                color: #666;
            }

            .env-list {
                padding: 8px 0;
            }

            .env-item {
                padding: 8px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background-color 0.2s ease;
            }

            .env-item:hover {
                background-color: #f5f5f5;
            }

            .env-item.active {
                background-color: #e3f2fd;
                color: #1976d2;
            }

            .env-item-icon {
                font-size: 14px;
            }

            .env-item-name {
                flex: 1;
                font-size: 13px;
            }

            .env-item-status {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 10px;
                background: #e8f5e8;
                color: #2e7d32;
            }

            .env-custom {
                padding: 12px 16px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 8px;
            }

            .env-custom-input {
                flex: 1;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
            }

            .env-custom-btn {
                padding: 6px 12px;
                background: #1976d2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .env-custom-btn:hover {
                background: #1565c0;
            }

            .env-info {
                padding: 12px 16px;
                background: #f8f9fa;
                border-top: 1px solid #eee;
            }

            .env-info-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
                font-size: 11px;
            }

            .env-info-item:last-child {
                margin-bottom: 0;
            }

            .env-label {
                color: #666;
            }

            .env-value {
                color: #333;
                font-weight: 500;
            }

            .env-arrow {
                transition: transform 0.3s ease;
            }

            .env-switcher.show .env-arrow {
                transform: rotate(180deg);
            }

            @media (max-width: 768px) {
                .env-switcher {
                    top: 10px;
                    right: 10px;
                }
                
                .env-switcher-panel {
                    min-width: 250px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // 切换器点击事件
        const toggle = this.container.querySelector('.env-switcher-toggle');
        toggle.addEventListener('click', () => this.toggle());

        // 关闭按钮事件
        const closeBtn = this.container.querySelector('.env-close');
        closeBtn.addEventListener('click', () => this.hide());

        // 自定义环境应用按钮
        const customBtn = this.container.querySelector('.env-custom-btn');
        const customInput = this.container.querySelector('.env-custom-input');
        customBtn.addEventListener('click', () => {
            const apiUrl = customInput.value.trim();
            if (apiUrl) {
                window.ENV_MANAGER.switchEnvironment('custom', apiUrl);
                this.updateDisplay();
                this.hide();
            }
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
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        this.container.classList.add('show');
        this.isVisible = true;
        this.updateEnvironmentList();
    }

    hide() {
        this.container.classList.remove('show');
        this.isVisible = false;
    }

    updateEnvironmentList() {
        const envList = this.container.querySelector('.env-list');
        const environments = window.ENV_MANAGER.getAvailableEnvironments();
        const currentEnv = window.ENV_MANAGER.currentEnv;

        envList.innerHTML = environments.map(env => `
            <div class="env-item ${env.isCurrent ? 'active' : ''}" data-env="${env.key}">
                <span class="env-item-icon">${this.getEnvIcon(env.key)}</span>
                <span class="env-item-name">${env.name}</span>
                ${env.isCurrent ? '<span class="env-item-status">当前</span>' : ''}
            </div>
        `).join('');

        // 绑定环境切换事件
        envList.querySelectorAll('.env-item').forEach(item => {
            item.addEventListener('click', () => {
                const env = item.dataset.env;
                if (env !== currentEnv) {
                    window.ENV_MANAGER.switchEnvironment(env);
                    this.updateDisplay();
                    this.hide();
                }
            });
        });
    }

    updateDisplay() {
        const config = window.ENV_MANAGER.config;
        const currentEnv = window.ENV_MANAGER.currentEnv;

        // 更新切换器显示
        const envName = this.container.querySelector('.env-name');
        envName.textContent = config.name;

        // 更新环境信息
        document.getElementById('current-env-name').textContent = config.name;
        document.getElementById('current-env-api').textContent = config.apiBaseUrl || '相对路径';
        document.getElementById('current-env-debug').textContent = config.debug ? '开启' : '关闭';

        // 更新切换器颜色
        const toggle = this.container.querySelector('.env-switcher-toggle');
        toggle.style.background = this.getEnvColor(currentEnv);
    }

    getEnvIcon(env) {
        const icons = {
            local: '🏠',
            test: '🧪',
            baota: '🛠️',
            prod: '🚀',
            custom: '⚙️'
        };
        return icons[env] || '🌍';
    }

    getEnvColor(env) {
        const colors = {
            local: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            test: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            baota: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            prod: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            custom: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        };
        return colors[env] || colors.local;
    }
}

// 自动初始化环境切换器
document.addEventListener('DOMContentLoaded', () => {
    // 只在开发模式下显示环境切换器
    if (window.ENV_MANAGER && window.ENV_MANAGER.config.debug) {
        new EnvSwitcher();
    }
});

// 导出类供外部使用
window.EnvSwitcher = EnvSwitcher; 