/**
 * 模态框组件系统
 * 模仿Vue的组件化编程方式，实现可复用的模态框组件
 */

class ModalComponent {
    constructor(config = {}) {
        this.id = config.id || `modal-${Date.now()}`;
        this.title = config.title || '模态框';
        this.content = config.content || '';
        this.width = config.width || 'max-w-md';
        this.height = config.height || 'max-h-[80vh]';
        this.theme = config.theme || 'purple'; // purple, blue, green, red
        this.buttons = config.buttons || [];
        this.onShow = config.onShow || null;
        this.onHide = config.onHide || null;
        this.onConfirm = config.onConfirm || null;
        this.onCancel = config.onCancel || null;
        
        this.isVisible = false;
        this.element = null;
    }

    /**
     * 渲染模态框HTML
     */
    render() {
        const themeColors = {
            purple: {
                border: 'border-purple-400/30',
                title: 'text-purple-300',
                button: 'from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500',
                accent: 'border-purple-light/20'
            },
            blue: {
                border: 'border-blue-400/30',
                title: 'text-blue-300',
                button: 'from-blue-500/80 to-cyan-500/80 hover:from-blue-500 hover:to-cyan-500',
                accent: 'border-blue-light/20'
            },
            green: {
                border: 'border-green-400/30',
                title: 'text-green-300',
                button: 'from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500',
                accent: 'border-green-light/20'
            },
            red: {
                border: 'border-red-400/30',
                title: 'text-red-300',
                button: 'from-red-500/80 to-pink-500/80 hover:from-red-500 hover:to-pink-500',
                accent: 'border-red-light/20'
            }
        };

        const colors = themeColors[this.theme];

        return `
            <div id="${this.id}" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" style="display: none;">
                <div class="bg-dark-light rounded-xl p-6 w-full ${this.width} ${this.height} shadow-2xl border ${colors.border} overflow-hidden">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold ${colors.title}">${this.title}</h3>
                        <button class="text-gray-400 hover:text-white transition-colors modal-close-btn" data-modal-id="${this.id}">
                            <i class="fa fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="modal-content">
                        ${this.content}
                    </div>
                    
                    ${this.renderButtons(colors)}
                </div>
            </div>
        `;
    }

    /**
     * 渲染按钮
     */
    renderButtons(colors) {
        if (!this.buttons || this.buttons.length === 0) {
            return '';
        }

        const buttonHtml = this.buttons.map(btn => {
            const isPrimary = btn.primary || false;
            const buttonClass = isPrimary 
                ? `px-4 py-2 bg-gradient-to-r ${colors.button} text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-[1.03] text-sm`
                : 'px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm';
            
            return `<button class="${buttonClass} modal-btn" data-action="${btn.action}" data-modal-id="${this.id}">${btn.text}</button>`;
        }).join('');

        return `
            <div class="flex justify-end space-x-3 mt-6 pt-4 border-t ${colors.accent}">
                ${buttonHtml}
            </div>
        `;
    }

    /**
     * 显示模态框
     */
    show() {
        if (this.isVisible) return;

        // 如果元素不存在，先创建
        if (!this.element) {
            this.mount();
        }

        this.element.style.display = 'flex';
        this.isVisible = true;

        // 绑定事件
        this.bindEvents();

        // 调用onShow回调
        if (this.onShow) {
            this.onShow();
        }


    }

    /**
     * 隐藏模态框
     */
    hide() {
        if (!this.isVisible) return;

        this.element.style.display = 'none';
        this.isVisible = false;

        // 调用onHide回调
        if (this.onHide) {
            this.onHide();
        }


    }

    /**
     * 挂载到DOM
     */
    mount() {
        const html = this.render();
        document.body.insertAdjacentHTML('beforeend', html);
        this.element = document.getElementById(this.id);
    }

    /**
     * 卸载从DOM
     */
    unmount() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭按钮事件
        const closeBtn = this.element.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }

        // 按钮事件
        const buttons = this.element.querySelectorAll('.modal-btn');
        buttons.forEach(btn => {
            btn.onclick = (e) => {
                const action = e.target.dataset.action;
                this.handleButtonClick(action);
            };
        });

        // 点击背景关闭
        this.element.onclick = (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        };

        // 设置模态框的特殊事件
        if (this.id === 'settings-modal') {
            this.bindSettingsEvents();
        }


    }

    /**
     * 格式化存储大小
     */
    formatStorageSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * 绑定设置模态框特殊事件
     */
    bindSettingsEvents() {
        // 存储设置滑块和输入框同步
        const slider = this.element.querySelector('#storage-slider');
        const input = this.element.querySelector('#storage-input');

        if (slider && input) {
            // 更新右侧显示的函数
            const updateDisplay = (limitGB) => {
                const totalStorage = this.element.querySelector('#settings-total-storage');
                const usedStorage = this.element.querySelector('#settings-used-storage');
                const usagePercentage = this.element.querySelector('#settings-usage-percentage');
                
                if (totalStorage) {
                    const totalBytes = limitGB * 1024 * 1024 * 1024;
                    totalStorage.textContent = this.formatStorageSize(totalBytes);
    }

                // 如果有已使用空间数据，更新显示
                if (usedStorage && usagePercentage) {
                    // 尝试从已使用空间元素中获取数值
                    const usedText = usedStorage.textContent;
                    const usedMatch = usedText.match(/(\d+(?:\.\d+)?)\s*(MB|GB|KB)/);
                    if (usedMatch) {
                        const usedValue = parseFloat(usedMatch[1]);
                        const usedUnit = usedMatch[2];
                        let usedBytes;
                        
                        if (usedUnit === 'GB') {
                            usedBytes = usedValue * 1024 * 1024 * 1024;
                        } else if (usedUnit === 'MB') {
                            usedBytes = usedValue * 1024 * 1024;
                        } else if (usedUnit === 'KB') {
                            usedBytes = usedValue * 1024;
                        } else {
                            usedBytes = usedValue;
                        }
                        
                        const percentage = (usedBytes / (limitGB * 1024 * 1024 * 1024)) * 100;
                        usagePercentage.textContent = `${percentage.toFixed(1)}%`;
                    }
                }
            };
            
            // 确保滑块和输入框的值同步
            const syncValues = (value) => {
                const numValue = Math.max(1, Math.min(20, parseInt(value) || 1));
                slider.value = numValue;
                input.value = numValue;
                updateDisplay(numValue);
            };
            
            // 移除之前的事件监听器
            if (slider._sliderHandler) {
                slider.removeEventListener('input', slider._sliderHandler);
            }
            if (input._inputHandler) {
                input.removeEventListener('input', input._inputHandler);
            }
            if (input._blurHandler) {
                input.removeEventListener('blur', input._blurHandler);
            }
            
            // 创建新的事件处理器
            slider._sliderHandler = (e) => {
                syncValues(e.target.value);
            };
            
            input._inputHandler = (e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 20) {
                    syncValues(value);
                }
            };
            
            input._blurHandler = () => {
                const value = parseInt(input.value);
                if (isNaN(value) || value < 1) {
                    syncValues(1);
                } else if (value > 20) {
                    syncValues(20);
                }
            };
            
            // 绑定新的事件监听器
            slider.addEventListener('input', slider._sliderHandler);
            input.addEventListener('input', input._inputHandler);
            input.addEventListener('blur', input._blurHandler);
            
            // 初始化同步
            const initialValue = parseInt(slider.value) || 1;
            syncValues(initialValue);
                }
    }



    /**
     * 处理按钮点击
     */
    handleButtonClick(action) {
        switch (action) {
            case 'confirm':
                if (this.onConfirm) {
                    this.onConfirm();
                }
                this.hide();
                break;
            case 'cancel':
                if (this.onCancel) {
                    this.onCancel();
                }
                this.hide();
                break;
            default:
                // 自定义按钮处理
                if (this.onConfirm) {
                    this.onConfirm(action);
                }
                break;
        }
    }

    /**
     * 更新内容
     */
    updateContent(newContent) {
        this.content = newContent;
        if (this.element) {
            const contentEl = this.element.querySelector('.modal-content');
            if (contentEl) {
                contentEl.innerHTML = newContent;
            }
        }
    }

    /**
     * 更新标题
     */
    updateTitle(newTitle) {
        this.title = newTitle;
        if (this.element) {
            const titleEl = this.element.querySelector('h3');
            if (titleEl) {
                titleEl.textContent = newTitle;
            }
        }
    }
}

/**
 * 模态框管理器
 * 管理所有模态框实例
 */
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.defaultConfig = {
            width: 'max-w-md',
            height: 'max-h-[80vh]',
            theme: 'purple'
        };
    }

    /**
     * 创建模态框
     */
    create(config) {
        const modal = new ModalComponent({
            ...this.defaultConfig,
            ...config
        });
        
        this.modals.set(modal.id, modal);
        return modal;
    }

    /**
     * 获取模态框
     */
    get(id) {
        return this.modals.get(id);
    }

    /**
     * 显示模态框
     */
    show(id) {
        const modal = this.get(id);
        if (modal) {
            modal.show();
        } else {
            console.error(`模态框 ${id} 不存在`);
        }
    }

    /**
     * 隐藏模态框
     */
    hide(id) {
        const modal = this.get(id);
        if (modal) {
            modal.hide();
        }
    }

    /**
     * 销毁模态框
     */
    destroy(id) {
        const modal = this.get(id);
        if (modal) {
            modal.unmount();
            this.modals.delete(id);
        }
    }

    /**
     * 创建设置模态框
     */
    createSettingsModal() {
        return this.create({
            id: 'settings-modal',
            title: '存储空间设置',
            theme: 'purple',
            content: `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">存储空间限制</label>
                        <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <input type="range" id="storage-slider" min="1" max="20" value="5" 
                                   class="flex-1 h-2 bg-dark-light rounded-lg appearance-none cursor-pointer slider">
                            <div class="flex items-center space-x-2">
                                <input type="number" id="storage-input" min="1" max="20" value="5" 
                                       class="w-20 bg-dark-light border border-purple-light/30 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-light/50 focus:border-purple-light transition-all duration-300">
                                <span class="text-gray-400 text-sm">GB</span>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">设置范围：1GB - 20GB</p>
                    </div>
                    
                    <div class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-3 border border-blue-400/20">
                        <h4 class="text-sm font-medium text-gray-300 mb-2">当前存储状态</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                                <div class="text-gray-400">总空间</div>
                                <div id="settings-total-storage" class="text-blue-300 font-medium">5 GB</div>
                            </div>
                            <div>
                                <div class="text-gray-400">已使用</div>
                                <div id="settings-used-storage" class="text-purple-300 font-medium">1.2 GB</div>
                            </div>
                            <div>
                                <div class="text-gray-400">使用率</div>
                                <div id="settings-usage-percentage" class="text-emerald-300 font-medium">24%</div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                { text: '取消', action: 'cancel' },
                { text: '保存设置', action: 'confirm', primary: true }
            ],
            onShow: async () => {
                try {
                    // 加载存储设置
                    if (window.uiManager && window.uiManager.api) {
                        const storageInfo = await window.uiManager.api.storage.getStorageInfo();
                        const slider = document.getElementById('storage-slider');
                        const input = document.getElementById('storage-input');
                        const totalStorage = document.getElementById('settings-total-storage');
                        const usedStorage = document.getElementById('settings-used-storage');
                        const usagePercentage = document.getElementById('settings-usage-percentage');

                        if (slider && input) {
                            const limitGB = Math.round(storageInfo.total_space / (1024 * 1024 * 1024));
                            slider.value = limitGB;
                            input.value = limitGB;
                        }

                        if (totalStorage) {
                            totalStorage.textContent = window.uiManager.formatStorageSize(storageInfo.total_space);
                        }

                        if (usedStorage) {
                            usedStorage.textContent = window.uiManager.formatStorageSize(storageInfo.used_space);
                        }

                        if (usagePercentage) {
                            const percentage = (storageInfo.used_space / storageInfo.total_space) * 100;
                            usagePercentage.textContent = `${percentage.toFixed(2)}%`;
                        }
                    }
                } catch (error) {
                    // 静默处理错误
                }
            },
            onConfirm: async () => {
                try {
                    const input = document.getElementById('storage-input');
                    if (!input) return;

                    const limitGB = parseInt(input.value);
                    if (limitGB < 1 || limitGB > 20) {
                        if (window.Notify) {
                            window.Notify.show({ message: '存储空间限制必须在1-20GB之间', type: 'error' });
                        }
                        return;
                    }

                    const limitBytes = limitGB * 1024 * 1024 * 1024;
                    await window.uiManager.api.storage.updateStorageLimit(limitBytes);
                    
                    if (window.Notify) {
                        window.Notify.show({ message: '存储空间设置已保存', type: 'success' });
                    }
                    
                    // 立即刷新所有存储空间显示
                    await window.uiManager.refreshAllStorageDisplays();
                } catch (error) {
                    if (window.Notify) {
                        window.Notify.show({ message: error.message || '保存设置失败', type: 'error' });
                    }
                }
            }
        });
    }


}

// 全局暴露
window.ModalComponent = ModalComponent;
window.ModalManager = ModalManager;

// 创建全局实例
window.modalManager = new ModalManager();