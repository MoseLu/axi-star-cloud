/**
 * 设置管理器
 * 负责管理应用程序的所有设置
 */
class UISettingsManager {
    constructor() {
        this.settings = {};
        this.settingsPanel = null;
        this.currentTab = 'general';
        this.autoSaveTimer = null;
        this.observers = new Map();
        this.init();
    }

    /**
     * 初始化设置管理器
     */
    init() {
        this.loadSettings();
        this.setupSettingsUI();
        this.bindSettingsEvents();
        // 延迟绑定存储设置按钮，确保DOM元素已加载
        setTimeout(() => {
            this.bindStorageSettingsButton();
        }, 1000);
        
        // 移除重复的绑定调用，避免多次绑定
        // setTimeout(() => {
        //     this.bindStorageSettingsButton();
        // }, 2000);
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            // 从localStorage加载设置
            const savedSettings = localStorage.getItem('appSettings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
            } else {
                // 使用默认设置
                this.settings = this.getDefaultSettings();
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * 设置设置UI
     */
    setupSettingsUI() {
        // 延迟初始化，确保DOM已加载
        setTimeout(() => {
            this.settingsPanel = document.getElementById('settings-panel');
            if (this.settingsPanel) {
                this.renderSettingsForm();
                this.updateFormValues();
            } else {
                // 如果面板不存在，延迟重试
                setTimeout(() => {
                    this.setupSettingsUI();
                }, 500);
            }
        }, 100);
    }

    /**
     * 绑定存储设置按钮
     */
    bindStorageSettingsButton() {
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        if (storageSettingsBtn) {
            // 检查是否已经绑定过事件，避免重复绑定
            if (storageSettingsBtn._hasBoundEvent) {
                console.debug('存储设置按钮事件已绑定，跳过重复绑定');
                return true;
            }
            
            // 移除已存在的事件监听器
            storageSettingsBtn.removeEventListener('click', this.handleStorageSettingsClick);
            
            // 创建新的事件处理函数
            this.handleStorageSettingsClick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                // 检查是否已经有模态框存在，避免重复创建
                const existingModals = document.querySelectorAll('.fixed[data-modal="settings"]');
                if (existingModals.length > 0) {
                    console.warn('设置模态框已存在，跳过重复创建');
                    return;
                }
                
                // 显示设置模态框
                this.showSettingsModal();
                // 移除 switchTab 调用，因为模态框已经包含了存储设置
                // this.switchTab('storage');
            };
            
            // 绑定事件监听器
            storageSettingsBtn.addEventListener('click', this.handleStorageSettingsClick);
            
            // 标记已绑定事件
            storageSettingsBtn._hasBoundEvent = true;
            
            // 确保按钮可见
            storageSettingsBtn.style.display = 'inline-block';
            storageSettingsBtn.style.visibility = 'visible';
            storageSettingsBtn.classList.remove('hidden');
            storageSettingsBtn.removeAttribute('hidden');
            
            return true;
        } else {
            // 如果按钮不存在，延迟重试，但限制重试次数
            if (!this._bindRetryCount) {
                this._bindRetryCount = 0;
            }
            
            if (this._bindRetryCount < 5) { // 最多重试5次
                this._bindRetryCount++;
                setTimeout(() => {
                    this.bindStorageSettingsButton();
                }, 500);
            } else {
                console.warn('存储设置按钮绑定失败，已达到最大重试次数');
            }
            return false;
        }
    }

    /**
     * 绑定设置事件
     */
    bindSettingsEvents() {
        // 移除重复的绑定调用，避免多次绑定
        // this.bindStorageSettingsButton();

        // 绑定设置面板事件
        if (this.settingsPanel) {
            
            // 标签切换事件
            const tabBtns = this.settingsPanel.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.switchTab(btn.dataset.tab);
                });
            });

            // 表单变化事件
            const form = document.getElementById('settingsForm');
            if (form) {
                form.addEventListener('change', () => {
                    this.updateSettingsFromForm();
                    this.startAutoSave();
                });

                form.addEventListener('input', () => {
                    this.updateSettingsFromForm();
                    this.startAutoSave();
                });
            }

            // 范围滑块值显示更新
            const rangeInputs = this.settingsPanel.querySelectorAll('input[type="range"]');
            rangeInputs.forEach(input => {
                input.addEventListener('input', () => {
                    const valueSpan = input.parentNode.querySelector('.range-value');
                    if (valueSpan) {
                        valueSpan.textContent = input.value;
                    }
                });
            });

            // 保存按钮事件
            const saveBtn = this.settingsPanel.querySelector('#save-settings-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.saveSettings();
                    this.hideSettingsPanel();
                });
            }

            // 模态框按钮事件在 showSettingsModal() 中绑定
        } else {
            // 静默处理，不显示错误信息，因为设置面板可能还没有创建
            console.debug('设置面板尚未创建，跳过事件绑定');
        }
    }

    /**
     * 绑定设置模态框事件
     */
    bindModalSettingsEvents() {
        // 创建事件处理函数
        this._settingsEventHandler = (e) => {
            // 取消按钮
            if (e.target.id === 'cancel-settings-btn') {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
                return;
            }
            
            // 保存按钮
            if (e.target.id === 'save-settings-btn') {
                e.preventDefault();
                e.stopPropagation();
                this.saveStorageSettings();
                return;
            }
            
            // 关闭按钮 - 改进关闭按钮检测逻辑
            const closeButton = e.target.closest('button');
            if (closeButton && (
                closeButton.id === 'close-settings-modal' ||
                closeButton.innerHTML.includes('fa-times') ||
                closeButton.querySelector('.fa-times')
            )) {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
                return;
            }
            
            // 点击模态框外部区域关闭
            if (e.target.classList.contains('fixed') && e.target.getAttribute('data-modal') === 'settings') {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
                return;
            }
        };
        
        // 绑定新的事件监听器
        document.addEventListener('click', this._settingsEventHandler);
    }

    /**
     * 显示设置面板
     */
    showSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.style.display = 'block';
            this.renderSettingsForm();
            this.updateFormValues();
        }
    }

    /**
     * 显示存储设置模态框
     * 这是showSettingsModal的别名，用于兼容admin-manager.js的调用
     */
    async showStorageSettingsModal() {
        return this.showSettingsModal();
    }

    /**
     * 显示设置模态框
     */
    async showSettingsModal() {
        try {
            // 清理所有已存在的设置模态框
            const existingModals = document.querySelectorAll('.fixed[data-modal="settings"]');
            existingModals.forEach(modal => {
                // 清理事件监听器
                const slider = modal.querySelector('#storage-slider');
                const input = modal.querySelector('#storage-input');
                if (slider && slider._sliderHandler) {
                    slider.removeEventListener('input', slider._sliderHandler);
                    slider.removeEventListener('change', slider._sliderHandler);
                }
                if (input && input._inputHandler) {
                    input.removeEventListener('input', input._inputHandler);
                    input.removeEventListener('change', input._inputHandler);
                }
                modal.remove();
            });

            // 清理旧的事件监听器
            if (this._settingsEventHandler) {
                document.removeEventListener('click', this._settingsEventHandler);
                this._settingsEventHandler = null;
            }
            
            // 获取真实存储数据
            let storageInfo;
            try {
                const api = window.apiSystem || window.apiManager;
                if (api && api.storage && api.storage.getStorageInfo) {
                    storageInfo = await api.storage.getStorageInfo();
                } else if (api && api.getStorageInfo) {
                    storageInfo = await api.getStorageInfo();
                } else {
                    return;
                }
                
                if (!storageInfo) {
                    return;
                }
            } catch (error) {
                return;
            }

            // 计算真实数据
            const limitGB = Math.round((storageInfo.limit_bytes || storageInfo.total_space || 1073741824) / (1024 * 1024 * 1024)); // 默认1GB
            const usedGB = (storageInfo.used_bytes || storageInfo.used_space || 0) / (1024 * 1024 * 1024);
            const usagePercentage = limitGB > 0 ? ((usedGB / limitGB) * 100).toFixed(2) : '0.00';
            
            // 缓存已使用空间数据
            this.cachedUsedSpace = storageInfo.used_bytes || storageInfo.used_space || 0;
            
            // 创建模态框，使用真实数据
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
            modal.setAttribute('data-modal', 'settings');
            
            modal.innerHTML = `
                <div class="bg-dark-light rounded-xl p-6 w-full max-w-md max-h-[80vh] shadow-2xl border border-purple-400/30 overflow-hidden">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-purple-300">存储空间设置</h3>
                        <button id="close-settings-modal" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fa fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">存储空间限制</label>
                            <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <input type="range" id="storage-slider" min="1" max="20" value="${limitGB}" 
                                       class="flex-1 h-2 bg-dark-light rounded-lg appearance-none cursor-pointer slider">
                                <div class="flex items-center space-x-2">
                                    <input type="number" id="storage-input" min="1" max="20" value="${limitGB}" 
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
                                    <div id="settings-total-storage" class="text-blue-300 font-medium">${limitGB} GB</div>
                                </div>
                                <div>
                                    <div class="text-gray-400">已使用</div>
                                    <div id="settings-used-storage" class="text-purple-300 font-medium">
                                        ${usedGB < 0.1 ? `${(usedGB * 1024).toFixed(1)} MB` : `${usedGB.toFixed(1)} GB`}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-gray-400">使用率</div>
                                    <div id="settings-usage-percentage" class="text-emerald-300 font-medium">${usagePercentage}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button id="cancel-settings-btn" class="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                            取消
                        </button>
                        <button id="save-settings-btn" class="px-4 py-2 bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary to-secondary text-white rounded-lg shadow-md shadow-primary/20 transition-all duration-300 transform hover:scale-[1.03]">
                            <i class="fa fa-save mr-1"></i> 保存设置
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 使用setTimeout确保DOM元素已经完全渲染后再绑定事件
            setTimeout(() => {
                // 绑定存储滑块事件
                this.bindStorageSliderEvents();
                
                // 绑定设置模态框事件
                this.bindModalSettingsEvents();
            }, 0);
            
        } catch (error) {
            console.error('显示设置模态框失败:', error);
        }
    }

    /**
     * 启用设置控件
     */
    enableSettingsControls() {
        const slider = document.getElementById('storage-slider');
        const input = document.getElementById('storage-input');
        const saveBtn = document.getElementById('save-settings-btn');
        
        if (slider) slider.disabled = false;
        if (input) input.disabled = false;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    /**
     * 绑定模态框事件
     */
    bindModalEvents() {
        // 由于模态框现在是动态创建的，事件绑定已经在index.js中通过事件委托处理
        // 这里不再需要手动绑定事件，因为事件委托已经处理了所有按钮点击

    }

    /**
     * 加载并渲染真实存储数据
     */
    async loadAndRenderStorageData() {
        try {
            const api = window.apiSystem || window.apiManager;
            if (!api) {
                return;
            }

            // 获取真实存储信息
            let storageInfo;
            if (api.storage && api.storage.getStorageInfo) {
                storageInfo = await api.storage.getStorageInfo();
            } else if (api.getStorageInfo) {
                storageInfo = await api.getStorageInfo();
            } else {
                return;
            }

            if (!storageInfo) {
                return;
            }

            // 渲染存储数据
            this.renderStorageData(storageInfo);
            
            // 注意：滑块事件绑定现在由index.js中的bindStorageSliderEvents处理
            // 这里不再调用this.bindStorageSliderEvents()，避免事件冲突
            
        } catch (error) {
            // 静默处理错误
        }
    }

    /**
     * 渲染存储数据到界面
     */
    renderStorageData(storageInfo) {
        const slider = document.getElementById('storage-slider');
        const input = document.getElementById('storage-input');
        const totalStorage = document.getElementById('settings-total-storage');
        const usedStorage = document.getElementById('settings-used-storage');
        const usagePercentage = document.getElementById('settings-usage-percentage');

        // 缓存已使用空间，避免频繁API调用
        this.cachedUsedSpace = storageInfo.used_space || 0;

        // 计算当前设置的总空间（GB）
        const currentLimitGB = Math.round(storageInfo.total_space / (1024 * 1024 * 1024));
        
        // 设置滑块和输入框的初始值
        if (slider && input) {
            // 强制设置值并触发更新
            slider.value = currentLimitGB;
            input.value = currentLimitGB;
            
            // 强制更新DOM
            slider.setAttribute('value', currentLimitGB);
            input.setAttribute('value', currentLimitGB);
            
            // 触发change事件确保UI更新
            slider.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 更新存储状态显示
        if (totalStorage) {
            totalStorage.textContent = this.formatStorageSize(storageInfo.total_space);
        }

        if (usedStorage) {
            usedStorage.textContent = this.formatStorageSize(storageInfo.used_space);
        }

                                if (usagePercentage) {
                            const percentage = (storageInfo.used_space / storageInfo.total_space) * 100;
                            usagePercentage.textContent = `${percentage.toFixed(2)}%`;
                        }
    }

    /**
     * 绑定存储滑块事件
     */
    bindStorageSliderEvents() {
        const slider = document.getElementById('storage-slider');
        const input = document.getElementById('storage-input');
        
        if (!slider || !input) {
            console.warn('存储滑块或输入框未找到');
            return;
        }
        
        // 清除之前的事件监听器
        const newSlider = slider.cloneNode(true);
        const newInput = input.cloneNode(true);
        slider.parentNode.replaceChild(newSlider, slider);
        input.parentNode.replaceChild(newInput, input);
        
        // 重新获取元素
        const newSliderElement = document.getElementById('storage-slider');
        const newInputElement = document.getElementById('storage-input');
        
        if (!newSliderElement || !newInputElement) {
            console.warn('重新获取存储控件失败');
            return;
        }
        
        // 滑块事件处理
        const sliderHandler = (e) => {
            const newValue = parseInt(e.target.value);
            if (!isNaN(newValue)) {
                // 同步输入框
                newInputElement.value = newValue;
                
                // 动态更新显示
                this.updateStorageDisplayOnChange(newValue);
            }
        };
        
        // 输入框事件处理
        const inputHandler = (e) => {
            const newValue = parseInt(e.target.value);
            if (!isNaN(newValue) && newValue >= 1 && newValue <= 20) {
                // 同步滑块
                newSliderElement.value = newValue;
                
                // 动态更新显示
                this.updateStorageDisplayOnChange(newValue);
            }
        };
        
        // 输入框失焦处理
        const blurHandler = () => {
            const value = parseInt(newInputElement.value);
            if (isNaN(value) || value < 1) {
                newInputElement.value = 1;
                newSliderElement.value = 1;
                this.updateStorageDisplayOnChange(1);
            } else if (value > 20) {
                newInputElement.value = 20;
                newSliderElement.value = 20;
                this.updateStorageDisplayOnChange(20);
            }
        };
        
        // 绑定事件监听器
        newSliderElement.addEventListener('input', sliderHandler);
        newSliderElement.addEventListener('change', sliderHandler);
        newInputElement.addEventListener('input', inputHandler);
        newInputElement.addEventListener('change', inputHandler);
        newInputElement.addEventListener('blur', blurHandler);
        
        // 初始化同步
        const initialValue = parseInt(newSliderElement.value) || 1;
        this.updateStorageDisplayOnChange(initialValue);
    }

    /**
     * 根据滑块/输入框变化动态更新存储显示
     */
    updateStorageDisplayOnChange(limitGB) {
        const totalStorage = document.getElementById('settings-total-storage');
        const usedStorage = document.getElementById('settings-used-storage');
        const usagePercentage = document.getElementById('settings-usage-percentage');
        
        if (!totalStorage || !usedStorage || !usagePercentage) {
            console.warn('存储显示元素未找到');
            return;
        }
        
        // 立即更新总空间显示（基于用户设置）
        const totalBytes = limitGB * 1024 * 1024 * 1024;
        totalStorage.textContent = this.formatStorageSize(totalBytes);
        
        // 使用缓存的已使用空间数据
        if (this.cachedUsedSpace !== undefined) {
            usedStorage.textContent = this.formatStorageSize(this.cachedUsedSpace);
            
            // 计算使用率
            const percentage = (this.cachedUsedSpace / totalBytes) * 100;
            usagePercentage.textContent = `${Math.min(percentage, 100).toFixed(2)}%`;
        } else {
            // 如果没有缓存，则获取一次
            this.getCurrentUsedSpace().then(usedSpace => {
                this.cachedUsedSpace = usedSpace;
                usedStorage.textContent = this.formatStorageSize(usedSpace);
                
                const percentage = (usedSpace / totalBytes) * 100;
                usagePercentage.textContent = `${Math.min(percentage, 100).toFixed(2)}%`;
            }).catch(error => {
                console.error('获取已使用空间失败:', error);
                usedStorage.textContent = '0 B';
                usagePercentage.textContent = '0.00%';
            });
        }
    }

    /**
     * 获取当前已使用空间
     */
    async getCurrentUsedSpace() {
        try {
            const api = window.apiSystem || window.apiManager;
            if (!api) {
                throw new Error('API不可用');
            }
            
            let storageInfo;
            if (api.storage && api.storage.getStorageInfo) {
                storageInfo = await api.storage.getStorageInfo();
            } else if (api.getStorageInfo) {
                storageInfo = await api.getStorageInfo();
            } else {
                throw new Error('未找到存储API方法');
            }
            
            if (!storageInfo) {
                throw new Error('获取存储信息失败');
            }
            
            // 返回已使用空间（字节）
            return storageInfo.used_bytes || storageInfo.used_space || 0;
        } catch (error) {
            console.error('获取已使用空间失败:', error);
            return 0;
        }
    }

    /**
     * 动态更新存储状态显示
     */
    updateStorageStatusDisplay(limitGB) {
        const totalStorage = document.getElementById('settings-total-storage');
        const usedStorage = document.getElementById('settings-used-storage');
        const usagePercentage = document.getElementById('settings-usage-percentage');

        if (totalStorage) {
            const totalBytes = limitGB * 1024 * 1024 * 1024;
            totalStorage.textContent = this.formatStorageSize(totalBytes);
        }

        // 异步更新已使用空间
        this.getCurrentUsedSpace().then(() => {
            if (usedStorage) {
                usedStorage.textContent = this.formatStorageSize(this.cachedUsedSpace);
            }

            if (usagePercentage) {
                const percentage = (this.cachedUsedSpace / (limitGB * 1024 * 1024 * 1024)) * 100;
                usagePercentage.textContent = `${percentage.toFixed(2)}%`;
            }
        });
    }

    /**
     * 保存存储设置
     */
    async saveStorageSettings() {
        try {
            const input = document.getElementById('storage-input');
            if (!input) {
                return;
            }

            const limitGB = parseInt(input.value);
            if (isNaN(limitGB) || limitGB < 1 || limitGB > 20) {
                this.showErrorMessage('存储限制必须在1-20GB之间');
                return;
            }

            const api = window.apiSystem || window.apiManager;
            if (!api) {
                this.showErrorMessage('API系统未初始化');
                return;
            }

            let response;
            if (api.storage && api.storage.updateStorageLimit) {
                response = await api.storage.updateStorageLimit(limitGB);
            } else if (api.updateStorageLimit) {
                response = await api.updateStorageLimit(limitGB);
            } else {
                this.showErrorMessage('存储API方法不可用');
                return;
            }

            if (response && response.success) {
                this.showSuccessMessage('存储设置保存成功');
                
                // 立即刷新所有存储空间显示
                await this.refreshAllStorageDisplays();
            } else {
                this.showErrorMessage('保存失败，请重试');
            }
        } catch (error) {
            this.showErrorMessage('保存失败：' + error.message);
        }
    }

    /**
     * 刷新所有存储空间显示
     */
    async refreshAllStorageDisplays() {
        try {
            // 获取最新的存储信息
            const api = window.apiSystem || window.apiManager;
            if (!api || !api.storage || !api.storage.getStorageInfo) {
                console.warn('⚠️ 存储API不可用');
                return;
            }
            
            const storageInfo = await api.storage.getStorageInfo();
            
            if (storageInfo && storageInfo.used_space !== undefined && storageInfo.total_space !== undefined) {
                // 调用主页的统一同步方法
                const uiManager = window.uiManager || window.UIManager || 
                                 (window.app && window.app.uiManager) ||
                                 (window.apiSystem && window.apiSystem.uiManager);
                
                if (uiManager && typeof uiManager.syncStorageDisplay === 'function') {
                    await uiManager.syncStorageDisplay(storageInfo);
                } else if (uiManager && typeof uiManager.updateStorageDisplay === 'function') {
                    uiManager.updateStorageDisplay(storageInfo);
                } else {
                    console.warn('⚠️ uiManager的存储显示方法不可用');
                }
                
                // 直接更新设置页面的存储显示
                if (this.renderStorageData && typeof this.renderStorageData === 'function') {
                    this.renderStorageData(storageInfo);
                }
                
                // 更新主页存储空间概览
                this.updateStorageDisplay(storageInfo);
            } else {
                console.warn('⚠️ 存储信息格式不正确:', storageInfo);
            }
        } catch (error) {
            console.error('❌ 刷新存储空间显示失败:', error);
        }
    }

    /**
     * 显示保存中提示
     */
    showSavingMessage() {
        const messageBox = document.getElementById('message-box');
        if (messageBox) {
            messageBox.innerHTML = `
                <div class="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 text-blue-300">
                    <div class="flex items-center space-x-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
                        <span>正在保存设置...</span>
                    </div>
                </div>
            `;
            messageBox.style.display = 'block';
        }
    }

    /**
     * 显示成功提示
     */
    showSuccessMessage(message) {
        const messageBox = document.getElementById('message-box');
        if (messageBox) {
            messageBox.innerHTML = `
                <div class="bg-green-500/10 border border-green-400/30 rounded-lg p-4 text-green-300">
                    <div class="flex items-center justify-between">
                        <span>${message}</span>
                        <button onclick="this.parentElement.parentElement.style.display='none'" class="text-green-400 hover:text-green-300">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
            messageBox.style.display = 'block';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * 显示错误提示
     */
    showErrorMessage(message) {
        const messageBox = document.getElementById('message-box');
        if (messageBox) {
            messageBox.innerHTML = `
                <div class="bg-red-500/10 border border-red-400/30 rounded-lg p-4 text-red-300">
                    <div class="flex items-center justify-between">
                        <span>${message}</span>
                        <button onclick="this.parentElement.parentElement.style.display='none'" class="text-red-400 hover:text-red-300">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
            messageBox.style.display = 'block';
            
            // 5秒后自动隐藏
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * 隐藏设置模态框
     */
    hideSettingsModal() {
        // 移除所有设置相关的模态框
        const modals = document.querySelectorAll('.fixed[data-modal="settings"]');
        modals.forEach(modal => {
            // 清理模态框的事件监听器
            const slider = modal.querySelector('#storage-slider');
            const input = modal.querySelector('#storage-input');
            
            if (slider && slider._sliderHandler) {
                slider.removeEventListener('input', slider._sliderHandler);
                slider.removeEventListener('change', slider._sliderHandler);
                slider._sliderHandler = null;
            }
            if (input && input._inputHandler) {
                input.removeEventListener('input', input._inputHandler);
                input.removeEventListener('change', input._inputHandler);
                input._inputHandler = null;
            }
            modal.remove();
        });
        
        // 清理事件监听器
        if (this._settingsEventHandler) {
            document.removeEventListener('click', this._settingsEventHandler);
            this._settingsEventHandler = null;
        }
        
        // 确保所有相关的事件监听器都被清理
        const allSettingsButtons = document.querySelectorAll('#close-settings-modal, #cancel-settings-btn, #save-settings-btn');
        allSettingsButtons.forEach(button => {
            // 移除可能存在的内联事件监听器
            button.onclick = null;
            button.onmousedown = null;
            button.onmouseup = null;
        });
    }

    /**
     * 更新存储显示
     */
    updateStorageDisplay(storageInfo) {
        // 更新存储信息显示
        const totalStorageElement = document.getElementById('total-storage');
        const usedStorageElement = document.getElementById('used-storage');
        const usagePercentageElement = document.getElementById('usage-percentage');
        const progressBarElement = document.getElementById('storage-progress-bar');
        const progressTextElement = document.getElementById('storage-progress-text');
        
        if (totalStorageElement) {
            totalStorageElement.textContent = this.formatStorageSize(storageInfo.total_space);
        }
        
        if (usedStorageElement) {
            usedStorageElement.textContent = this.formatStorageSize(storageInfo.used_space);
        }
        
        if (usagePercentageElement) {
            const percentage = (storageInfo.used_space / storageInfo.total_space) * 100;
            usagePercentageElement.textContent = `${percentage.toFixed(2)}%`;
        }
        
        // 更新进度条
        if (progressBarElement) {
            const percentage = (storageInfo.used_space / storageInfo.total_space) * 100;
            progressBarElement.style.width = `${percentage}%`;
        }
        
        // 更新进度文本
        if (progressTextElement) {
            const percentage = (storageInfo.used_space / storageInfo.total_space) * 100;
            progressTextElement.textContent = `${percentage.toFixed(2)}% 已使用`;
        }
        
        // 更新存储状态
        this.updateStorageStatus(storageInfo);
    }

    /**
     * 更新存储状态显示
     * @param {Object} storageInfo - 存储信息
     */
    updateStorageStatus(storageInfo) {
        const statusElement = document.getElementById('storage-status');
        if (!statusElement) return;

        const percentage = (storageInfo.used_space / storageInfo.total_space) * 100;
        const remainingPercentage = 100 - percentage;
        
        let statusText, textColor, bgColor, borderColor;
        
        if (remainingPercentage > 30) {
            // 充足：剩余空间大于30%
            statusText = '充足';
            textColor = 'text-emerald-400';
            bgColor = 'bg-emerald-500/20';
            borderColor = 'border-emerald-400/30';
        } else if (remainingPercentage >= 10) {
            // 不足：剩余空间在10%-30%之间
            statusText = '不足';
            textColor = 'text-yellow-400';
            bgColor = 'bg-yellow-500/20';
            borderColor = 'border-yellow-400/30';
        } else {
            // 严重不足：剩余空间小于10%
            statusText = '严重不足';
            textColor = 'text-red-400';
            bgColor = 'bg-red-500/20';
            borderColor = 'border-red-400/30';
        }
        
        // 更新状态文本和样式
        statusElement.textContent = statusText;
        statusElement.className = `px-2 md:px-3 py-1 ${bgColor} ${textColor} text-xs rounded-full border ${borderColor}`;
        
        // 触发自定义事件，通知其他模块存储状态已更新
        window.dispatchEvent(new CustomEvent('storageStatusUpdated', {
            detail: {
                status: statusText,
                percentage: percentage,
                remainingPercentage: remainingPercentage,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * 格式化存储大小
     */
    formatStorageSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 隐藏设置面板
     */
    hideSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.style.display = 'none';
        }
    }

    /**
     * 切换标签
     * @param {string} tabName - 标签名称
     */
    switchTab(tabName) {
        // 检查 settingsPanel 是否存在
        if (!this.settingsPanel) {
            console.warn('设置面板未找到，跳过标签切换');
            return;
        }
        
        // 更新标签按钮状态
        const tabBtns = this.settingsPanel.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 显示对应的设置区域
        const sections = this.settingsPanel.querySelectorAll('.settings-section');
        sections.forEach(section => {
            section.style.display = section.id === `${tabName}-section` ? 'block' : 'none';
        });

        this.currentTab = tabName;
    }

    /**
     * 渲染设置表单
     */
    renderSettingsForm() {
        // 检查是否已存在settingsForm
        const existingForm = document.getElementById('settingsForm');
        if (existingForm) {
            console.warn('settingsForm已存在，跳过重复创建');
            return;
        }
        
        // 表单已经在HTML中定义，这里主要是更新值
        this.updateFormValues();
    }

    /**
     * 更新表单值
     */
    updateFormValues() {
        const form = document.getElementById('settingsForm');
        if (!form) return;

        // 遍历所有表单元素并设置值
        const formElements = form.elements;
        for (let element of formElements) {
            if (element.name) {
                const value = this.getNestedValue(this.settings, element.name);
                if (value !== undefined) {
                    if (element.type === 'checkbox') {
                        element.checked = Boolean(value);
                    } else {
                        element.value = value;
                    }
                }
            }
        }

        // 更新范围滑块的值显示
        const rangeInputs = form.querySelectorAll('input[type="range"]');
        rangeInputs.forEach(input => {
            const valueSpan = input.parentNode.querySelector('.range-value');
            if (valueSpan) {
                valueSpan.textContent = input.value;
            }
        });
    }

    /**
     * 获取嵌套属性值
     * @param {Object} obj - 对象
     * @param {string} path - 属性路径
     * @returns {*} 属性值
     */
    getNestedValue(obj, path) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return undefined;
            }
        }
        
        return result;
    }

    /**
     * 设置嵌套属性值
     * @param {Object} obj - 对象
     * @param {string} path - 属性路径
     * @param {*} value - 属性值
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    /**
     * 从表单更新设置
     */
    updateSettingsFromForm() {
        const form = document.getElementById('settingsForm');
        if (!form) return;

        const formElements = form.elements;
        for (let element of formElements) {
            if (element.name) {
                let value;
                if (element.type === 'checkbox') {
                    value = element.checked;
                } else if (element.type === 'range') {
                    value = parseInt(element.value);
                } else {
                    value = element.value;
                }
                
                this.setNestedValue(this.settings, element.name, value);
            }
        }
    }

    /**
     * 检查是否为数字字段
     * @param {string} fieldName - 字段名
     * @returns {boolean} 是否为数字字段
     */
    isNumericField(fieldName) {
        const numericFields = [
            'storage.maxFileSize',
            'advanced.logLevel'
        ];
        return numericFields.includes(fieldName);
    }

    /**
     * 重置设置
     */
    resetSettings() {
        if (confirm('确定要重置所有设置吗？')) {
            this.settings = this.getDefaultSettings();
            this.updateFormValues();
            this.saveSettings();
        }
    }

    /**
     * 获取默认设置
     * @returns {Object} 默认设置
     */
    getDefaultSettings() {
        return {
            general: {
                autoSave: true,
                theme: 'dark'
            },
            storage: {
                maxFileSize: 10,
                path: '/uploads'
            },
            advanced: {
                debug: false,
                logLevel: 'info'
            }
        };
    }

    /**
     * 保存设置
     */
    saveSettings() {
        try {
            localStorage.setItem('appSettings', JSON.stringify(this.settings));
            this.emit('settingsSaved', this.settings);
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    /**
     * 合并设置
     * @param {Object} defaultSettings - 默认设置
     * @param {Object} importedSettings - 导入的设置
     * @returns {Object} 合并后的设置
     */
    mergeSettings(defaultSettings, importedSettings) {
        const merged = this.deepClone(defaultSettings);
        
        const mergeRecursive = (target, source) => {
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        if (!target[key] || typeof target[key] !== 'object') {
                            target[key] = {};
                        }
                        mergeRecursive(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        };
        
        mergeRecursive(merged, importedSettings);
        return merged;
    }

    /**
     * 导出设置
     */
    exportSettings() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'settings.json';
        link.click();
    }

    /**
     * 导入设置
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedSettings = JSON.parse(e.target.result);
                        this.settings = this.mergeSettings(this.getDefaultSettings(), importedSettings);
                        this.updateFormValues();
                        this.saveSettings();
                        this.showSuccessMessage('设置导入成功！');
                    } catch (error) {
                        this.showErrorMessage('设置导入失败：' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    /**
     * 开始自动保存
     */
    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveTimer = setTimeout(() => {
            this.saveSettings();
        }, 1000);
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * 获取设置值
     * @param {string} path - 设置路径
     * @param {*} defaultValue - 默认值
     * @returns {*} 设置值
     */
    getSetting(path, defaultValue = undefined) {
        const value = this.getNestedValue(this.settings, path);
        return value !== undefined ? value : defaultValue;
    }

    /**
     * 设置设置值
     * @param {string} path - 设置路径
     * @param {*} value - 设置值
     */
    setSetting(path, value) {
        this.setNestedValue(this.settings, path, value);
        this.saveSettings();
    }

    /**
     * 获取所有设置
     * @returns {Object} 所有设置
     */
    getAllSettings() {
        return this.deepClone(this.settings);
    }

    /**
     * 更新设置
     * @param {Object} newSettings - 新设置
     */
    updateSettings(newSettings) {
        this.settings = this.mergeSettings(this.settings, newSettings);
        this.saveSettings();
    }

    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        
        return cloned;
    }

    /**
     * 添加观察者
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    on(event, callback) {
        if (!this.observers.has(event)) {
            this.observers.set(event, []);
        }
        this.observers.get(event).push(callback);
    }

    /**
     * 移除观察者
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (!this.observers.has(event)) return;
        
        const callbacks = this.observers.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {...*} args - 参数
     */
    emit(event, ...args) {
        if (!this.observers.has(event)) return;
        
        const callbacks = this.observers.get(event);
        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error('设置观察者回调执行错误:', error);
            }
        });
    }

    /**
     * 清理资源
     */
    destroy() {
        this.stopAutoSave();
        this.observers.clear();
        if (this.settingsPanel) {
            this.settingsPanel.remove();
            this.settingsPanel = null;
        }
    }

    /**
     * 检查是否为管理员
     * @returns {boolean} 是否为管理员
     */
    async isAdmin() {
        try {
            // 使用token验证管理员权限
            if (window.tokenManager && typeof window.tokenManager.validateAdminTokens === 'function') {
                return await window.tokenManager.validateAdminTokens();
            } else {
                // 兼容性处理：检查当前用户是否为管理员用户（Mose）
                const currentUser = this.getCurrentUser();
                return currentUser && currentUser.username === 'Mose';
            }
        } catch (error) {
            console.error('验证管理员权限失败:', error);
            return false;
        }
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 用户信息
     */
    getCurrentUser() {
        if (window.StorageManager && typeof window.StorageManager.getUserInfo === 'function') {
            return window.StorageManager.getUserInfo();
        } else {
            const userData = localStorage.getItem('userInfo');
            return userData ? JSON.parse(userData) : null;
        }
    }
}

// 全局暴露
window.UISettingsManager = UISettingsManager; 