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
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
        
        // 合并默认设置
        this.settings = this.mergeSettings(this.getDefaultSettings(), this.settings);
    }

    /**
     * 保存设置
     */
    saveSettings() {
        try {
            localStorage.setItem('appSettings', JSON.stringify(this.settings));
            this.emit('settingsChanged', this.settings);
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    /**
     * 合并设置
     * @param {Object} defaultSettings - 默认设置
     * @param {Object} savedSettings - 保存的设置
     * @returns {Object} 合并后的设置
     */
    mergeSettings(defaultSettings, savedSettings) {
        const merged = { ...defaultSettings };
        
        if (savedSettings) {
            for (const key in savedSettings) {
                if (savedSettings.hasOwnProperty(key)) {
                    if (typeof savedSettings[key] === 'object' && savedSettings[key] !== null) {
                        merged[key] = this.mergeSettings(merged[key] || {}, savedSettings[key]);
                    } else {
                        merged[key] = savedSettings[key];
                    }
                }
            }
        }
        
        return merged;
    }

    /**
     * 设置设置UI
     */
    setupSettingsUI() {
        this.createSettingsPanel();
    }

    /**
     * 创建设置面板
     */
    createSettingsPanel() {
        // 创建设置面板HTML
        this.settingsPanel = document.createElement('div');
        this.settingsPanel.id = 'settings-panel';
        this.settingsPanel.className = 'settings-panel';
        this.settingsPanel.style.display = 'none';
        
        this.settingsPanel.innerHTML = `
            <div class="settings-overlay">
                <div class="settings-modal">
                    <div class="settings-header">
                        <h3>设置</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="settings-content">
                        <div class="settings-tabs">
                            <button class="tab-btn active" data-tab="general">常规</button>
                            <button class="tab-btn" data-tab="storage">存储</button>
                            <button class="tab-btn" data-tab="advanced">高级</button>
                        </div>
                        <form id="settingsForm">
                            <div id="general-section" class="settings-section">
                                <h4>常规设置</h4>
                                <div class="setting-group">
                                    <label>自动保存</label>
                                    <input type="checkbox" name="general.autoSave" />
                                </div>
                                <div class="setting-group">
                                    <label>主题</label>
                                    <select name="general.theme">
                                        <option value="dark">深色</option>
                                        <option value="light">浅色</option>
                                        <option value="auto">自动</option>
                                    </select>
                                </div>
                            </div>
                            <div id="storage-section" class="settings-section" style="display: none;">
                                <h4>存储设置</h4>
                                <div class="setting-group">
                                    <label>最大文件大小 (MB)</label>
                                    <input type="range" name="storage.maxFileSize" min="1" max="100" />
                                    <span class="range-value">10</span>
                                </div>
                                <div class="setting-group">
                                    <label>存储路径</label>
                                    <input type="text" name="storage.path" />
                                </div>
                            </div>
                            <div id="advanced-section" class="settings-section" style="display: none;">
                                <h4>高级设置</h4>
                                <div class="setting-group">
                                    <label>调试模式</label>
                                    <input type="checkbox" name="advanced.debug" />
                                </div>
                                <div class="setting-group">
                                    <label>日志级别</label>
                                    <select name="advanced.logLevel">
                                        <option value="error">错误</option>
                                        <option value="warn">警告</option>
                                        <option value="info">信息</option>
                                        <option value="debug">调试</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="settings-footer">
                        <button id="reset-settings-btn">重置</button>
                        <button id="export-settings-btn">导出</button>
                        <button id="import-settings-btn">导入</button>
                        <button id="save-settings-btn">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.settingsPanel);
    }

    /**
     * 绑定存储设置按钮
     */
    bindStorageSettingsButton() {
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        if (storageSettingsBtn) {
            storageSettingsBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                // 直接显示设置模态框，鉴权由后端API统一处理
                this.showSettingsModal();
                this.switchTab('storage');
            });
            return true;
        } else {
            return false;
        }
    }

    /**
     * 绑定设置事件
     */
    bindSettingsEvents() {
        // 绑定存储设置按钮
        this.bindStorageSettingsButton();

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

            // 重置按钮事件
            const resetBtn = this.settingsPanel.querySelector('#reset-settings-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetSettings();
                });
            }

            // 导出按钮事件
            const exportBtn = this.settingsPanel.querySelector('#export-settings-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this.exportSettings();
                });
            }

            // 导入按钮事件
            const importBtn = this.settingsPanel.querySelector('#import-settings-btn');
            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    this.importSettings();
                });
            }

            // 关闭按钮事件
            const closeBtn = this.settingsPanel.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideSettingsPanel();
                });
            }

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
            console.error('❌ 设置面板不存在');
        }
        
        
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
     * 显示设置模态框
     */
    async showSettingsModal() {
        try {
            // 先创建模态框
            if (window.uiManager && window.uiManager.showSettingsModal) {
                window.uiManager.showSettingsModal();
                
                // 设置跳过渲染标志，避免重复处理
                this.skipRender = true;
            } else {
                return;
            }
            
            // 等待模态框创建完成
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 检查是否需要跳过渲染（避免重复渲染）
            if (this.skipRender) {
                this.skipRender = false;
                return;
            }
            
            // 加载真实存储数据并渲染
            await this.loadAndRenderStorageData();
            
        } catch (error) {
            // 静默处理错误
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
        this.cachedUsedSpace = storageInfo.used_space;

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
            usagePercentage.textContent = `${percentage.toFixed(1)}%`;
        }
    }

    /**
     * 绑定存储滑块事件
     */
    bindStorageSliderEvents() {
        const slider = document.getElementById('storage-slider');
        const input = document.getElementById('storage-input');
        
        if (!slider || !input) {
            return;
        }
        
        // 参考ui.js的简单实现，添加动态更新功能
        const sliderHandler = (e) => {
            const newValue = e.target.value;
            
            // 同步输入框
            input.value = newValue;
            
            // 动态更新右侧显示
            this.updateStorageDisplayOnChange(newValue);
        };
        
        const inputHandler = (e) => {
            const newValue = e.target.value;
            
            const value = parseInt(newValue);
            if (!isNaN(value) && value >= 1 && value <= 20) {
                // 同步滑块
                slider.value = value;
                
                // 动态更新右侧显示
                this.updateStorageDisplayOnChange(value);
            }
        };
        
        const blurHandler = () => {
            const value = parseInt(input.value);
            if (isNaN(value) || value < 1) {
                input.value = 1;
                slider.value = 1;
    
                this.updateStorageDisplayOnChange(1);
            } else if (value > 20) {
                input.value = 20;
                slider.value = 20;

                this.updateStorageDisplayOnChange(20);
            }
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

        // 绑定新的事件监听器
        slider.addEventListener('input', sliderHandler);
        input.addEventListener('input', inputHandler);
        input.addEventListener('blur', blurHandler);
        
        // 保存引用以便后续移除
        slider._sliderHandler = sliderHandler;
        input._inputHandler = inputHandler;
        input._blurHandler = blurHandler;
        

    }

    /**
     * 根据滑块/输入框变化动态更新存储显示
     */
    updateStorageDisplayOnChange(limitGB) {

        
        const totalStorage = document.getElementById('settings-total-storage');
        const usedStorage = document.getElementById('settings-used-storage');
        const usagePercentage = document.getElementById('settings-usage-percentage');
        
        // 立即更新总空间显示（基于用户设置）
        if (totalStorage) {
            const totalBytes = limitGB * 1024 * 1024 * 1024;
            totalStorage.textContent = this.formatStorageSize(totalBytes);
        }
        
        // 简化实现：直接使用缓存的已使用空间，避免频繁API调用
        if (this.cachedUsedSpace !== undefined) {
            if (usedStorage) {
                usedStorage.textContent = this.formatStorageSize(this.cachedUsedSpace);
            }
            
            if (usagePercentage) {
                const totalBytes = limitGB * 1024 * 1024 * 1024;
                const percentage = (this.cachedUsedSpace / totalBytes) * 100;
                usagePercentage.textContent = `${percentage.toFixed(1)}%`;
            }
        } else {
            // 如果没有缓存，则获取一次
            this.getCurrentUsedSpace().then(usedSpace => {
                this.cachedUsedSpace = usedSpace;
                this.updateStorageDisplayOnChange(limitGB); // 递归调用更新显示
            }).catch(error => {
                // 静默处理错误
                // 使用默认值
                if (usedStorage) {
                    usedStorage.textContent = '0 B';
                }
                if (usagePercentage) {
                    usagePercentage.textContent = '0%';
                }
            });
        }
    }

    /**
     * 获取当前已使用空间
     */
    async getCurrentUsedSpace() {
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
        
        return storageInfo.used_space;
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
                usagePercentage.textContent = `${percentage.toFixed(1)}%`;
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
        const modal = document.querySelector('.fixed[data-modal="settings"]');
        if (modal) {
            modal.remove();
        }
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