/**
 * 模态框管理模块
 * 处理消息显示、确认对话框和各种模态框管理功能
 */
class UIModalManager {
    constructor() {
        this.activeModals = [];
        this.messageQueue = [];
        this.isShowingMessage = false;
        this.defaultOptions = {
            duration: 3000,
            position: 'top-right',
            animation: 'slide-in'
        };
    }

    /**
     * 初始化模态框管理器
     */
    init() {
        this.setupGlobalEventListeners();
        this.createMessageContainer();
    }

    /**
     * 设置全局事件监听器
     */
    setupGlobalEventListeners() {
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });

        // 点击遮罩关闭模态框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModalByElement(e.target);
            }
        });
    }

    /**
     * 创建消息容器
     */
    createMessageContainer() {
        if (!document.querySelector('.message-container')) {
            const container = document.createElement('div');
            container.className = 'message-container';
            document.body.appendChild(container);
        }
    }

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, warning, info)
     * @param {Object} options - 选项
     */
    showMessage(message, type = 'info', options = {}) {
        const config = { ...this.defaultOptions, ...options };
        
        const messageElement = this.createMessageElement(message, type, config);
        this.addMessageToQueue(messageElement);
        
        if (!this.isShowingMessage) {
            this.processMessageQueue();
        }
    }

    /**
     * 创建消息元素
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     * @param {Object} config - 配置
     * @returns {HTMLElement} 消息元素
     */
    createMessageElement(message, type, config) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type} message-${config.position} message-${config.animation}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-icon">${this.getMessageIcon(type)}</div>
                <div class="message-text">${message}</div>
                <button class="message-close">&times;</button>
            </div>
        `;

        // 关闭按钮事件
        const closeBtn = messageDiv.querySelector('.message-close');
        closeBtn.addEventListener('click', () => {
            this.removeMessage(messageDiv);
        });

        // 自动关闭
        if (config.duration > 0) {
            setTimeout(() => {
                this.removeMessage(messageDiv);
            }, config.duration);
        }

        return messageDiv;
    }

    /**
     * 获取消息图标
     * @param {string} type - 消息类型
     * @returns {string} 图标HTML
     */
    getMessageIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    /**
     * 添加消息到队列
     * @param {HTMLElement} messageElement - 消息元素
     */
    addMessageToQueue(messageElement) {
        this.messageQueue.push(messageElement);
    }

    /**
     * 处理消息队列
     */
    processMessageQueue() {
        if (this.messageQueue.length === 0) {
            this.isShowingMessage = false;
            return;
        }

        this.isShowingMessage = true;
        const messageElement = this.messageQueue.shift();
        this.showMessageElement(messageElement);
    }

    /**
     * 显示消息元素
     * @param {HTMLElement} messageElement - 消息元素
     */
    showMessageElement(messageElement) {
        const container = document.querySelector('.message-container');
        container.appendChild(messageElement);

        // 触发动画
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 10);

        // 监听动画结束
        messageElement.addEventListener('animationend', () => {
            if (messageElement.classList.contains('hiding')) {
                this.removeMessageElement(messageElement);
                this.processMessageQueue();
            }
        });
    }

    /**
     * 移除消息
     * @param {HTMLElement} messageElement - 消息元素
     */
    removeMessage(messageElement) {
        if (messageElement.classList.contains('hiding')) return;
        
        messageElement.classList.add('hiding');
        messageElement.classList.remove('show');
    }

    /**
     * 移除消息元素
     * @param {HTMLElement} messageElement - 消息元素
     */
    removeMessageElement(messageElement) {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }

    /**
     * 显示确认对话框
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     * @returns {Promise<boolean>} 用户选择结果
     */
    showConfirmDialog(title, message, options = {}) {
        return new Promise((resolve) => {
            const config = {
                confirmText: '确认',
                cancelText: '取消',
                type: 'warning',
                ...options
            };

            const modal = this.createModal({
                title: title,
                content: message,
                type: 'confirm',
                config: config
            });

            // 添加按钮事件
            const confirmBtn = modal.querySelector('.btn-confirm');
            const cancelBtn = modal.querySelector('.btn-cancel');

            const closeModal = (result) => {
                this.closeModal(modal);
                resolve(result);
            };

            confirmBtn.addEventListener('click', () => closeModal(true));
            cancelBtn.addEventListener('click', () => closeModal(false));

            this.showModal(modal);
        });
    }

    /**
     * 显示输入对话框
     * @param {string} title - 标题
     * @param {string} placeholder - 输入框占位符
     * @param {Object} options - 选项
     * @returns {Promise<string|null>} 用户输入结果
     */
    showInputDialog(title, placeholder = '', options = {}) {
        return new Promise((resolve) => {
            const config = {
                confirmText: '确认',
                cancelText: '取消',
                defaultValue: '',
                ...options
            };

            const modal = this.createModal({
                title: title,
                content: `
                    <div class="input-dialog">
                        <input type="text" class="form-input" placeholder="${placeholder}" value="${config.defaultValue}">
                    </div>
                `,
                type: 'input',
                config: config
            });

            const input = modal.querySelector('.form-input');
            const confirmBtn = modal.querySelector('.btn-confirm');
            const cancelBtn = modal.querySelector('.btn-cancel');

            // 聚焦输入框
            setTimeout(() => input.focus(), 100);

            const closeModal = (result) => {
                this.closeModal(modal);
                resolve(result);
            };

            confirmBtn.addEventListener('click', () => {
                closeModal(input.value.trim());
            });

            cancelBtn.addEventListener('click', () => closeModal(null));

            // 回车确认
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    closeModal(input.value.trim());
                }
            });

            this.showModal(modal);
        });
    }

    /**
     * 显示选择对话框
     * @param {string} title - 标题
     * @param {Array} options - 选项列表
     * @param {Object} config - 配置
     * @returns {Promise<string|null>} 用户选择结果
     */
    showSelectDialog(title, options, config = {}) {
        return new Promise((resolve) => {
            const defaultConfig = {
                confirmText: '确认',
                cancelText: '取消',
                multiple: false,
                ...config
            };

            const optionsHtml = options.map(option => `
                <label class="select-option">
                    <input type="${defaultConfig.multiple ? 'checkbox' : 'radio'}" name="select-option" value="${option.value}">
                    <span class="option-text">${option.label}</span>
                </label>
            `).join('');

            const modal = this.createModal({
                title: title,
                content: `
                    <div class="select-dialog">
                        ${optionsHtml}
                    </div>
                `,
                type: 'select',
                config: defaultConfig
            });

            const confirmBtn = modal.querySelector('.btn-confirm');
            const cancelBtn = modal.querySelector('.btn-cancel');

            const closeModal = (result) => {
                this.closeModal(modal);
                resolve(result);
            };

            confirmBtn.addEventListener('click', () => {
                const selected = modal.querySelectorAll('input:checked');
                if (defaultConfig.multiple) {
                    const values = Array.from(selected).map(input => input.value);
                    closeModal(values.length > 0 ? values : null);
                } else {
                    const selectedInput = modal.querySelector('input:checked');
                    closeModal(selectedInput ? selectedInput.value : null);
                }
            });

            cancelBtn.addEventListener('click', () => closeModal(null));

            this.showModal(modal);
        });
    }

    /**
     * 创建模态框
     * @param {Object} config - 配置
     * @returns {HTMLElement} 模态框元素
     */
    createModal(config) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content modal-${config.type}">
                <div class="modal-header">
                    <h3 class="modal-title">${config.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${config.content}
                </div>
                <div class="modal-footer">
                    ${this.createModalButtons(config)}
                </div>
            </div>
        `;

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        return modal;
    }

    /**
     * 创建模态框按钮
     * @param {Object} config - 配置
     * @returns {string} 按钮HTML
     */
    createModalButtons(config) {
        const { confirmText, cancelText, type } = config.config || {};
        
        if (type === 'alert') {
            return `<button class="btn btn-primary btn-confirm">${confirmText || '确定'}</button>`;
        }
        
        return `
            <button class="btn btn-secondary btn-cancel">${cancelText || '取消'}</button>
            <button class="btn btn-primary btn-confirm">${confirmText || '确认'}</button>
        `;
    }

    /**
     * 显示模态框
     * @param {HTMLElement} modal - 模态框元素
     */
    showModal(modal) {
        document.body.appendChild(modal);
        this.activeModals.push(modal);

        // 触发动画
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
    }

    /**
     * 关闭模态框
     * @param {HTMLElement} modal - 模态框元素
     */
    closeModal(modal) {
        if (!modal || !modal.classList.contains('show')) return;

        modal.classList.remove('show');
        modal.classList.add('hiding');

        // 动画结束后移除
        modal.addEventListener('animationend', () => {
            this.removeModal(modal);
        }, { once: true });
    }

    /**
     * 移除模态框
     * @param {HTMLElement} modal - 模态框元素
     */
    removeModal(modal) {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }

        // 从活动列表中移除
        const index = this.activeModals.indexOf(modal);
        if (index > -1) {
            this.activeModals.splice(index, 1);
        }

        // 如果没有活动模态框，恢复背景滚动
        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
    }

    /**
     * 关闭顶部模态框
     */
    closeTopModal() {
        if (this.activeModals.length > 0) {
            const topModal = this.activeModals[this.activeModals.length - 1];
            this.closeModal(topModal);
        }
    }

    /**
     * 通过元素关闭模态框
     * @param {HTMLElement} element - 元素
     */
    closeModalByElement(element) {
        const modal = element.closest('.modal-overlay');
        if (modal) {
            this.closeModal(modal);
        }
    }

    /**
     * 显示加载对话框
     * @param {string} message - 加载消息
     * @returns {HTMLElement} 加载模态框
     */
    showLoadingDialog(message = '加载中...') {
        const modal = this.createModal({
            title: '请稍候',
            content: `
                <div class="loading-dialog">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message}</div>
                </div>
            `,
            type: 'loading',
            config: {}
        });

        this.showModal(modal);
        return modal;
    }

    /**
     * 隐藏加载对话框
     * @param {HTMLElement} loadingModal - 加载模态框
     */
    hideLoadingDialog(loadingModal) {
        if (loadingModal) {
            this.closeModal(loadingModal);
        }
    }

    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    showSuccess(message, options = {}) {
        this.showMessage(message, 'success', options);
    }

    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    showError(message, options = {}) {
        this.showMessage(message, 'error', options);
    }

    /**
     * 显示警告消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    showWarning(message, options = {}) {
        this.showMessage(message, 'warning', options);
    }

    /**
     * 显示信息消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    showInfo(message, options = {}) {
        this.showMessage(message, 'info', options);
    }

    /**
     * 清除所有消息
     */
    clearAllMessages() {
        const container = document.querySelector('.message-container');
        if (container) {
            container.innerHTML = '';
        }
        this.messageQueue = [];
        this.isShowingMessage = false;
    }

    /**
     * 关闭所有模态框
     */
    closeAllModals() {
        this.activeModals.forEach(modal => {
            this.closeModal(modal);
        });
    }

    /**
     * 获取活动模态框数量
     * @returns {number} 模态框数量
     */
    getActiveModalCount() {
        return this.activeModals.length;
    }

    /**
     * 检查是否有活动模态框
     * @returns {boolean} 是否有活动模态框
     */
    hasActiveModals() {
        return this.activeModals.length > 0;
    }
}

// 全局暴露
window.UIModalManager = UIModalManager; 