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
        // 使用Notify.show()而不是动态创建DOM
        if (window.Notify && typeof window.Notify.show === 'function') {
            window.Notify.show({ message, type, duration: options.duration || 3000 });
        } else {
            // 降级处理：如果Notify不可用，静默处理
        }
    }

    /**
     * 通用模态框渲染器
     * @param {Object} config - 模态框配置
     * @returns {Promise<any>} 模态框结果
     */
    showModal(config) {
        
        return new Promise((resolve) => {
            const {
                type = 'dialog',
                title = '',
                message = '',
                content = '',
                width = 320,
                height = 'auto',
                buttons = [],
                inputs = [],
                onConfirm,
                onCancel,
                confirmText = '确认',
                cancelText = '取消',
                confirmClass = 'bg-blue-600 hover:bg-blue-700',
                showClose = true,
                closeOnOverlay = true,
                closeOnEscape = true
            } = config;

            // 生成唯一ID
                    const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // 创建模态框HTML
            const modalHTML = this.createModalHTML({
                modalId,
                type,
                title,
                message,
                content,
                width,
                height,
                buttons,
                inputs,
                confirmText,
                cancelText,
                confirmClass,
                showClose
            });
            
            // 添加到DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // 获取模态框元素
            const modalElement = document.getElementById(modalId);
            const overlayElement = modalElement; // overlay就是modalElement本身
            const contentElement = document.getElementById(`${modalId}-content`);

            // 检查元素是否存在
            if (!modalElement) {
                console.error('Modal element not found:', modalId);
                resolve({ confirmed: false, error: 'Modal element not found' });
                return;
            }

            // 显示模态框
            setTimeout(() => {
                modalElement.classList.remove('opacity-0', 'invisible');
                modalElement.classList.add('show');
            }, 10);

            // 绑定事件
            this.bindModalEvents({
                modalId,
                modalElement,
                overlayElement,
                contentElement,
                buttons,
                inputs,
                onConfirm,
                onCancel,
                closeOnOverlay,
                closeOnEscape,
                resolve
            });
        });
    }

    /**
     * 创建模态框HTML
     * @param {Object} config - 配置
     * @returns {string} HTML字符串
     */
    createModalHTML(config) {
        const {
            modalId,
            type,
            title,
            message,
            content,
            width,
            height,
            buttons,
            inputs,
            confirmText,
            cancelText,
            confirmClass,
            showClose
        } = config;

        // 生成按钮HTML
        const buttonsHTML = this.generateButtonsHTML(buttons, confirmText, cancelText, confirmClass);
        
        // 生成输入框HTML
        const inputsHTML = this.generateInputsHTML(inputs);

        return `
            <div id="${modalId}" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center opacity-0 invisible transition-all duration-300 p-4 modal-overlay">
                <div id="${modalId}-content" class="bg-dark-light rounded-xl p-5 w-full border border-purple-light/20 shadow-2xl backdrop-blur-sm" style="max-width: ${width}px !important; width: ${width}px !important; height: ${height};">
                    ${showClose ? `
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-base font-semibold text-white">${title}</h3>
                            <button id="${modalId}-close" class="text-gray-400 hover:text-white transition-colors">
                                <i class="fa fa-times text-sm"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="mb-4">
                            <h3 class="text-base font-semibold text-white">${title}</h3>
                        </div>
                    `}
                    
                    ${message ? `
                        <div class="mb-4">
                            <p class="text-gray-300 text-sm leading-relaxed">${message}</p>
                        </div>
                    ` : ''}
                    
                    ${content ? `
                        <div class="mb-4">
                            ${content}
                        </div>
                    ` : ''}
                    
                    ${inputsHTML}
                    
                    ${buttonsHTML}
                </div>
            </div>
        `;
    }

    /**
     * 生成按钮HTML
     * @param {Array} buttons - 按钮配置
     * @param {string} confirmText - 确认按钮文本
     * @param {string} cancelText - 取消按钮文本
     * @param {string} confirmClass - 确认按钮样式
     * @returns {string} 按钮HTML
     */
    generateButtonsHTML(buttons, confirmText, cancelText, confirmClass) {
        if (buttons.length > 0) {
            return `
                <div class="flex justify-end space-x-2">
                    ${buttons.map(btn => `
                        <button class="px-3 py-1.5 ${btn.class || 'border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm'}" data-action="${btn.action}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="flex justify-end space-x-2">
                <button id="cancel-btn" class="px-3 py-1.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                    ${cancelText}
                </button>
                <button id="confirm-btn" class="px-3 py-1.5 ${confirmClass} text-white rounded-lg transition-colors text-sm">
                    ${confirmText}
                </button>
            </div>
        `;
    }

    /**
     * 生成输入框HTML
     * @param {Array} inputs - 输入框配置
     * @returns {string} 输入框HTML
     */
    generateInputsHTML(inputs) {
        if (inputs.length === 0) return '';

        return inputs.map(input => `
            <div class="mb-4">
                <label for="${input.id}" class="block text-sm font-medium text-gray-300 mb-2">${input.label}</label>
                <input type="${input.type || 'text'}" id="${input.id}" 
                       class="w-full px-3 py-2 bg-dark-light/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-light/50 focus:outline-none transition-colors text-sm" 
                       placeholder="${input.placeholder || ''}"
                       ${input.required ? 'required' : ''}
                       ${input.maxlength ? `maxlength="${input.maxlength}"` : ''}
                       ${input.value ? `value="${input.value}"` : ''}>
            </div>
        `).join('');
    }

    /**
     * 绑定模态框事件
     * @param {Object} config - 事件配置
     */
    bindModalEvents(config) {
        const {
            modalId,
            modalElement,
            overlayElement,
            contentElement,
            buttons,
            inputs,
            onConfirm,
            onCancel,
            closeOnOverlay,
            closeOnEscape,
            resolve
        } = config;

        // 检查modalElement是否存在
        if (!modalElement) {
            console.error('Modal element is null in bindModalEvents');
            resolve({ confirmed: false, error: 'Modal element is null' });
            return;
        }

        const closeModal = (result) => {
            modalElement.classList.add('opacity-0', 'invisible');
            setTimeout(() => {
                modalElement.remove();
                resolve(result);
            }, 300);
        };

        // 确认按钮
        const confirmBtn = modalElement.querySelector('#confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const inputValues = this.getInputValues(modalId, inputs);
                if (onConfirm) {
                    onConfirm(inputValues);
                }
                closeModal({ confirmed: true, inputs: inputValues });
            });
        }

        // 取消按钮
        const cancelBtn = modalElement.querySelector('#cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (onCancel) {
                    onCancel();
                }
                closeModal({ confirmed: false });
            });
        }

        // 关闭按钮
        const closeBtn = modalElement.querySelector(`#${modalId}-close`);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (onCancel) {
                    onCancel();
                }
                closeModal({ confirmed: false });
            });
        }

        // 自定义按钮
        buttons.forEach(btn => {
            const btnElement = modalElement.querySelector(`[data-action="${btn.action}"]`);
            if (btnElement) {
                btnElement.addEventListener('click', () => {
                    if (btn.onClick) {
                        btn.onClick();
                    }
                    closeModal({ action: btn.action });
                });
            }
        });

        // 背景点击关闭
        if (closeOnOverlay && overlayElement) {
            overlayElement.addEventListener('click', (e) => {
                if (e.target === overlayElement) {
                    if (onCancel) {
                        onCancel();
                    }
                    closeModal({ confirmed: false });
                }
            });
        }

        // ESC键关闭
        if (closeOnEscape) {
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    if (onCancel) {
                        onCancel();
                    }
                    closeModal({ confirmed: false });
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }

        // 回车键确认
        if (inputs && Array.isArray(inputs)) {
            inputs.forEach(input => {
                const inputElement = modalElement.querySelector(`#${input.id}`);
                if (inputElement) {
                    inputElement.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            const inputValues = this.getInputValues(modalId, inputs);
                            if (onConfirm) {
                                onConfirm(inputValues);
                            }
                            closeModal({ confirmed: true, inputs: inputValues });
                        }
                    });
                }
            });
        }
    }

    /**
     * 获取输入框值
     * @param {string} modalId - 模态框ID
     * @param {Array} inputs - 输入框配置
     * @returns {Object} 输入值
     */
    getInputValues(modalId, inputs) {
        const values = {};
        inputs.forEach(input => {
            const inputElement = document.querySelector(`#${modalId} #${input.id}`);
            if (inputElement) {
                values[input.id] = inputElement.value;
            }
        });
        return values;
    }

    /**
     * 显示确认对话框
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     * @returns {Promise<boolean>} 用户选择结果
     */
    showConfirmDialog(title, message, options = {}) {
        return this.showModal({
            type: 'confirm',
            title,
            message,
            width: 280,
            confirmText: options.confirmText || '确认',
            cancelText: options.cancelText || '取消',
            confirmClass: options.confirmClass || 'bg-blue-600 hover:bg-blue-700',
            ...options
        }).then(result => result.confirmed);
    }

    /**
     * 显示输入对话框
     * @param {string} title - 标题
     * @param {Array} inputs - 输入框配置
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 用户输入结果
     */
    showInputDialog(title, inputs, options = {}) {
        const config = {
            type: 'input',
            title,
            inputs,
            width: 320,
            confirmText: options.confirmText || '确认',
            cancelText: options.cancelText || '取消',
            ...options
        };
        
        const promise = this.showModal(config);
        
        return promise.then(result => {
            return result.inputs;
        }).catch(error => {
            console.error('showModal错误:', error);
            throw error;
        });
    }

    /**
     * 显示自定义对话框
     * @param {Object} config - 完整配置
     * @returns {Promise<any>} 对话框结果
     */
    showCustomDialog(config) {
        return this.showModal(config);
    }

    // 保持向后兼容的方法
    showCompactConfirmDialog(title, message, options = {}) {
        return this.showConfirmDialog(title, message, { width: 280, ...options });
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
            success: '<i class="fa fa-check-circle"></i>',
            error: '<i class="fa fa-exclamation-circle"></i>',
            warning: '<i class="fa fa-exclamation-triangle"></i>',
            info: '<i class="fa fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    /**
     * 添加消息到队列
     * @param {HTMLElement} messageElement - 消息元素
     */
    addMessageToQueue(messageElement) {
        this.messageQueue.push(messageElement);
        if (!this.isShowingMessage) {
            this.processMessageQueue();
        }
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
        if (container) {
        container.appendChild(messageElement);

            // 添加显示动画
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 10);

            // 自动移除
            setTimeout(() => {
                this.removeMessage(messageElement);
            }, 5000);
        }
    }

    /**
     * 移除消息
     * @param {HTMLElement} messageElement - 消息元素
     */
    removeMessage(messageElement) {
        messageElement.classList.remove('show');
        setTimeout(() => {
            this.removeMessageElement(messageElement);
        }, 300);
    }

    /**
     * 移除消息元素
     * @param {HTMLElement} messageElement - 消息元素
     */
    removeMessageElement(messageElement) {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
        this.processMessageQueue();
    }

    /**
     * 显示加载对话框
     * @param {string} message - 加载消息
     * @returns {HTMLElement} 加载模态框
     */
    showLoadingDialog(message = '加载中...') {
        const loadingModal = document.createElement('div');
        loadingModal.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center';
        loadingModal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 max-w-sm w-full mx-4 border border-purple-light/20 shadow-2xl">
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                    <span class="text-white">${message}</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingModal);
        return loadingModal;
    }

    /**
     * 隐藏加载对话框
     * @param {HTMLElement} loadingModal - 加载模态框
     */
    hideLoadingDialog(loadingModal) {
        if (loadingModal && loadingModal.parentNode) {
            loadingModal.parentNode.removeChild(loadingModal);
        }
    }

    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    showSuccess(message, options = {}) {
        return this.showMessage(message, 'success', options);
    }

    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    showError(message, options = {}) {
        return this.showMessage(message, 'error', options);
    }

    /**
     * 显示警告消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    showWarning(message, options = {}) {
        return this.showMessage(message, 'warning', options);
    }

    /**
     * 显示信息消息
     * @param {string} message - 消息内容
     * @param {Object} options - 选项
     */
    showInfo(message, options = {}) {
        return this.showMessage(message, 'info', options);
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
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.remove();
        });
        this.activeModals = [];
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

    /**
     * 关闭顶部模态框
     */
    closeTopModal() {
        if (this.activeModals.length > 0) {
            const topModal = this.activeModals[this.activeModals.length - 1];
            topModal.remove();
            this.activeModals.pop();
        }
    }

    /**
     * 通过元素关闭模态框
     * @param {HTMLElement} element - 元素
     */
    closeModalByElement(element) {
        if (element.classList.contains('modal-overlay')) {
            element.remove();
            const index = this.activeModals.indexOf(element);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }
        }
    }
}

// 暴露到全局作用域
window.UIModalManager = UIModalManager; 
window.modalManager = window.modalManager || {};
window.modalManager.showConfirm = function({ title, message, onConfirm, onCancel }) {
    // 移除旧模态，防止重复
    let modal = document.getElementById('custom-confirm-modal');
    if (modal) modal.remove();

    // 注入一次全局样式
    if (!document.getElementById('custom-modal-style')) {
        const style = document.createElement('style');
        style.id = 'custom-modal-style';
        style.innerHTML = `
        .custom-modal-mask {
            position: fixed; z-index: 9999; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(20,22,30,0.55); display: flex; align-items: center; justify-content: center;
            animation: modal-fade-in 0.18s;
        }
        @keyframes modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .custom-modal-box {
            background: #23272f; color: #e5e7eb; border-radius: 12px; min-width: 280px; max-width: 92vw;
            box-shadow: 0 4px 32px #000a; padding: 28px 36px 22px 36px; text-align: center; position: relative;
        }
        .custom-modal-box .modal-title {
            font-size: 19px; font-weight: 600; margin-bottom: 14px; color: #fff;
        }
        .custom-modal-box .modal-message {
            font-size: 15px; margin-bottom: 26px; color: #b5bac8;
        }
        .custom-modal-box .modal-actions {
            display: flex; gap: 18px; justify-content: center;
        }
        .custom-modal-box .btn {
            padding: 7px 28px; font-size: 15px; border: none; border-radius: 6px; cursor: pointer;
            transition: background 0.18s, color 0.18s, box-shadow 0.18s;
        }
        .custom-modal-box .btn-confirm {
            background: #22c55e; color: #fff; font-weight: 500;
        }
        .custom-modal-box .btn-confirm:hover {
            background: #16a34a;
        }
        .custom-modal-box .btn-cancel {
            background: #353945; color: #b5bac8;
        }
        .custom-modal-box .btn-cancel:hover {
            background: #23272f; color: #fff;
        }
        `;
        document.head.appendChild(style);
    }

    // 创建新模态
    modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.innerHTML = `
      <div class="modal-mask custom-modal-mask">
        <div class="modal-box custom-modal-box">
          <div class="modal-title">${title || '确认操作'}</div>
          <div class="modal-message">${message || ''}</div>
          <div class="modal-actions">
            <button id="confirm-ok-btn" class="btn btn-confirm">确定</button>
            <button id="confirm-cancel-btn" class="btn btn-cancel">取消</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // 事件绑定，确保元素已存在
    setTimeout(() => {
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const mask = modal.querySelector('.custom-modal-mask');
        const box = modal.querySelector('.custom-modal-box');
        if (okBtn) okBtn.onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };
        if (cancelBtn) cancelBtn.onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };
        // 点击遮罩关闭
        if (mask) mask.onclick = (e) => {
            if (e.target === mask) {
                modal.remove();
                if (onCancel) onCancel();
            }
        };
        // ESC关闭
        document.addEventListener('keydown', function escHandler(ev) {
            if (ev.key === 'Escape') {
                modal.remove();
                if (onCancel) onCancel();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }, 0);
}; 