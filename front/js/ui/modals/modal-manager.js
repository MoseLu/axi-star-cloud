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

            // 绑定事件
            this.bindModalEvents({
                modalId,
                onConfirm,
                onCancel,
                closeOnOverlay,
                closeOnEscape,
                resolve
            });

            // 添加到活动模态框列表
            this.activeModals.push(modalId);
        });
    }

    /**
     * 创建模态框HTML
     * @param {Object} config - 配置对象
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

        const buttonsHTML = this.generateButtonsHTML(buttons, confirmText, cancelText, confirmClass);
        const inputsHTML = this.generateInputsHTML(inputs);

        return `
            <div id="${modalId}" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="modal-content bg-white rounded-lg shadow-xl max-w-md w-full mx-4" style="width: ${width}px; height: ${height};">
                    <div class="modal-header flex items-center justify-between p-4 border-b">
                        <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                        ${showClose ? `<button class="modal-close text-gray-400 hover:text-gray-600 text-xl">&times;</button>` : ''}
                    </div>
                    <div class="modal-body p-4">
                        ${message ? `<p class="text-gray-700 mb-4">${message}</p>` : ''}
                        ${content ? `<div class="modal-content">${content}</div>` : ''}
                        ${inputsHTML}
                    </div>
                    ${buttonsHTML ? `<div class="modal-footer flex justify-end space-x-2 p-4 border-t">${buttonsHTML}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 生成按钮HTML
     * @param {Array} buttons - 按钮数组
     * @param {string} confirmText - 确认按钮文本
     * @param {string} cancelText - 取消按钮文本
     * @param {string} confirmClass - 确认按钮样式类
     * @returns {string} 按钮HTML
     */
    generateButtonsHTML(buttons, confirmText, cancelText, confirmClass) {
        if (buttons.length > 0) {
            return buttons.map(button => `
                <button class="modal-btn ${button.class || 'bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded'}">
                    ${button.text}
                </button>
            `).join('');
        }

        return `
            <button class="modal-btn modal-confirm ${confirmClass} text-white px-4 py-2 rounded mr-2">
                ${confirmText}
            </button>
            <button class="modal-btn modal-cancel bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">
                ${cancelText}
            </button>
        `;
    }

    /**
     * 生成输入框HTML
     * @param {Array} inputs - 输入框配置数组
     * @returns {string} 输入框HTML
     */
    generateInputsHTML(inputs) {
        if (inputs.length === 0) return '';

        return inputs.map(input => `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">${input.label}</label>
                <input type="${input.type || 'text'}" 
                       class="modal-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="${input.placeholder || ''}"
                       value="${input.value || ''}"
                       ${input.required ? 'required' : ''}>
            </div>
        `).join('');
    }

    /**
     * 绑定模态框事件
     * @param {Object} config - 配置对象
     */
    bindModalEvents(config) {
        const {
            modalId,
            onConfirm,
            onCancel,
            closeOnOverlay,
            closeOnEscape,
            resolve
        } = config;

        const modal = document.getElementById(modalId);
        if (!modal) return;

        const closeModal = (result) => {
            // 从活动模态框列表中移除
            const index = this.activeModals.indexOf(modalId);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }

            // 移除模态框
            modal.remove();
            resolve(result);
        };

        // 确认按钮
        const confirmBtn = modal.querySelector('.modal-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const inputValues = this.getInputValues(modalId, config.inputs || []);
                if (onConfirm) {
                    onConfirm(inputValues);
                }
                closeModal(inputValues);
            });
        }

        // 取消按钮
        const cancelBtn = modal.querySelector('.modal-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (onCancel) {
                    onCancel();
                }
                closeModal(null);
            });
        }

        // 关闭按钮
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (onCancel) {
                    onCancel();
                }
                closeModal(null);
            });
        }

        // 遮罩点击关闭
        if (closeOnOverlay) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (onCancel) {
                        onCancel();
                    }
                    closeModal(null);
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
                    closeModal(null);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }

        // 自定义按钮
        const customButtons = modal.querySelectorAll('.modal-btn:not(.modal-confirm):not(.modal-cancel)');
        customButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const inputValues = this.getInputValues(modalId, config.inputs || []);
                closeModal({ button: index, inputs: inputValues });
            });
        });
    }

    /**
     * 获取输入框值
     * @param {string} modalId - 模态框ID
     * @param {Array} inputs - 输入框配置
     * @returns {Object} 输入值对象
     */
    getInputValues(modalId, inputs) {
        const values = {};
        inputs.forEach((input, index) => {
            const inputElement = document.querySelector(`#${modalId} .modal-input:nth-child(${index + 1})`);
            if (inputElement) {
                values[input.name || `input${index}`] = inputElement.value;
            }
        });
        return values;
    }

    /**
     * 显示确认对话框
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Object} options - 选项
     * @returns {Promise<boolean>} 用户选择结果
     */
    showConfirmDialog(title, message, options = {}) {
        return this.showModal({
            type: 'confirm',
            title,
            message,
            ...options
        });
    }

    /**
     * 显示输入对话框
     * @param {string} title - 标题
     * @param {Array} inputs - 输入框配置
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 输入值
     */
    showInputDialog(title, inputs, options = {}) {
        return this.showModal({
            type: 'input',
            title,
            inputs,
            ...options
        });
    }

    /**
     * 显示自定义对话框
     * @param {Object} config - 配置对象
     * @returns {Promise<any>} 结果
     */
    showCustomDialog(config) {
        return this.showModal(config);
    }

    /**
     * 显示紧凑确认对话框
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Object} options - 选项
     * @returns {Promise<boolean>} 用户选择结果
     */
    showCompactConfirmDialog(title, message, options = {}) {
        return this.showConfirmDialog(title, message, {
            width: 300,
            height: 'auto',
            ...options
        });
    }

    /**
     * 创建消息元素
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     * @param {Object} config - 配置
     * @returns {HTMLElement} 消息元素
     */
    createMessageElement(message, type, config) {
        const messageElement = document.createElement('div');
        messageElement.className = `message-item message-${type} bg-white border-l-4 border-${this.getMessageColor(type)} p-4 mb-2 shadow-lg rounded-r-lg`;
        
        const icon = this.getMessageIcon(type);
        messageElement.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <i class="fa ${icon} text-${this.getMessageColor(type)}"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-gray-700">${message}</p>
                </div>
                <div class="ml-auto pl-3">
                    <button class="message-close text-gray-400 hover:text-gray-600">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        return messageElement;
    }

    /**
     * 获取消息图标
     * @param {string} type - 消息类型
     * @returns {string} 图标类名
     */
    getMessageIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * 添加消息到队列
     * @param {HTMLElement} messageElement - 消息元素
     */
    addMessageToQueue(messageElement) {
        this.messageQueue.push(messageElement);
        this.processMessageQueue();
    }

    /**
     * 处理消息队列
     */
    processMessageQueue() {
        if (this.isShowingMessage || this.messageQueue.length === 0) {
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
        if (!container) return;

        container.appendChild(messageElement);

        // 添加显示动画
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10);

        // 自动移除
        setTimeout(() => {
            this.removeMessage(messageElement);
        }, 3000);
    }

    /**
     * 移除消息
     * @param {HTMLElement} messageElement - 消息元素
     */
    removeMessage(messageElement) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(-20px)';
        
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
        
        this.isShowingMessage = false;
        this.processMessageQueue();
    }

    /**
     * 显示加载对话框
     * @param {string} message - 加载消息
     * @returns {string} 模态框ID
     */
    showLoadingDialog(message = '加载中...') {
        const modalId = `loading-${Date.now()}`;
        const modalHTML = `
            <div id="${modalId}" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="modal-content bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
                    <div class="flex items-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
                        <p class="text-gray-700">${message}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.activeModals.push(modalId);
        
        return modalId;
    }

    /**
     * 隐藏加载对话框
     * @param {string} modalId - 模态框ID
     */
    hideLoadingDialog(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
            const index = this.activeModals.indexOf(modalId);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }
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
        this.activeModals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.remove();
            }
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
            const topModalId = this.activeModals[this.activeModals.length - 1];
            const modal = document.getElementById(topModalId);
            if (modal) {
                modal.remove();
                this.activeModals.pop();
            }
        }
    }

    /**
     * 通过元素关闭模态框
     * @param {HTMLElement} element - 元素
     */
    closeModalByElement(element) {
        const modal = element.closest('.modal-overlay');
        if (modal) {
            const modalId = modal.id;
            modal.remove();
            const index = this.activeModals.indexOf(modalId);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }
        }
    }

    /**
     * 获取消息颜色
     * @param {string} type - 消息类型
     * @returns {string} 颜色类名
     */
    getMessageColor(type) {
        const colors = {
            success: 'green-500',
            error: 'red-500',
            warning: 'yellow-500',
            info: 'blue-500'
        };
        return colors[type] || colors.info;
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

// 为了兼容性，同时暴露showConfirmModal
window.showConfirmModal = function({ title, message, onConfirm, onCancel, confirmText, cancelText, confirmClass }) {
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
        .custom-modal-box .btn-danger {
            background: #ef4444; color: #fff; font-weight: 500;
        }
        .custom-modal-box .btn-danger:hover {
            background: #dc2626;
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
            <button id="confirm-ok-btn" class="btn ${confirmClass || 'btn-confirm'}">${confirmText || '确定'}</button>
            <button id="confirm-cancel-btn" class="btn btn-cancel">${cancelText || '取消'}</button>
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