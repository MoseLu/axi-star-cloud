/**
 * 设置管理模块
 * 包含存储设置、系统设置、用户偏好设置和配置管理功能
 */
class UISettingsManager {
    constructor() {
        this.settings = {
            storage: {
                maxFileSize: 100 * 1024 * 1024, // 100MB
                allowedTypes: ['*'],
                autoCompress: true,
                compressionQuality: 0.8,
                backupEnabled: true,
                backupInterval: 24 * 60 * 60 * 1000, // 24小时
                cleanupEnabled: true,
                cleanupInterval: 7 * 24 * 60 * 60 * 1000 // 7天
            },
            system: {
                theme: 'light',
                language: 'zh-CN',
                timezone: 'Asia/Shanghai',
                dateFormat: 'YYYY-MM-DD',
                timeFormat: 'HH:mm:ss',
                notifications: true,
                soundEnabled: true,
                autoSave: true,
                autoSaveInterval: 30000, // 30秒
                debugMode: false,
                performanceMode: 'balanced'
            },
            user: {
                displayName: '',
                email: '',
                avatar: '',
                preferences: {
                    defaultView: 'grid',
                    sortBy: 'name',
                    sortOrder: 'asc',
                    showHidden: false,
                    showThumbnails: true,
                    thumbnailSize: 'medium',
                    autoRefresh: true,
                    refreshInterval: 60000, // 1分钟
                    rememberLastFolder: true,
                    showFileSize: true,
                    showFileDate: true,
                    showFileType: true
                },
                shortcuts: {
                    enableKeyboardShortcuts: true,
                    enableMouseGestures: false,
                    enableVoiceCommands: false
                },
                privacy: {
                    shareUsageData: false,
                    allowAnalytics: false,
                    allowCookies: true,
                    allowNotifications: true
                }
            },
            sync: {
                autoSync: true,
                syncInterval: 300000, // 5分钟
                syncOnStartup: true,
                syncOnChange: true,
                maxRetries: 3,
                retryDelay: 5000, // 5秒
                conflictResolution: 'server-wins'
            },
            security: {
                requirePassword: false,
                sessionTimeout: 30 * 60 * 1000, // 30分钟
                maxLoginAttempts: 5,
                lockoutDuration: 15 * 60 * 1000, // 15分钟
                twoFactorAuth: false,
                encryptionEnabled: false,
                passwordPolicy: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: false
                }
            }
        };
        
        this.settingsPanel = null;
        this.currentTab = 'storage';
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.observers = new Map();
    }

    /**
     * 初始化设置管理器
     */
    init() {
        this.loadSettings();
        this.setupSettingsUI();
        this.bindSettingsEvents();
        this.startAutoSave();
    }

    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('uiSettings');
            if (savedSettings) {
                this.settings = this.mergeSettings(this.settings, JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        try {
            localStorage.setItem('uiSettings', JSON.stringify(this.settings));
            this.isDirty = false;
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
        const merged = {};
        
        for (const category in defaultSettings) {
            if (savedSettings[category]) {
                merged[category] = { ...defaultSettings[category], ...savedSettings[category] };
            } else {
                merged[category] = defaultSettings[category];
            }
        }
        
        return merged;
    }

    /**
     * 设置设置UI
     */
    setupSettingsUI() {
        this.createSettingsPanel();
        this.renderSettingsForm();
    }

    /**
     * 创建设置面板
     */
    createSettingsPanel() {
        const settingsPanelHTML = `
            <div class="settings-panel" style="display: none;">
                <div class="settings-header">
                    <h3>设置</h3>
                    <button class="settings-close">&times;</button>
                </div>
                <div class="settings-content">
                    <div class="settings-tabs">
                        <button class="tab-btn active" data-tab="storage">存储设置</button>
                        <button class="tab-btn" data-tab="system">系统设置</button>
                        <button class="tab-btn" data-tab="user">用户偏好</button>
                        <button class="tab-btn" data-tab="sync">同步设置</button>
                        <button class="tab-btn" data-tab="security">安全设置</button>
                    </div>
                    
                    <div class="settings-form-container">
                        <form id="settingsForm">
                            <!-- 存储设置 -->
                            <div class="settings-section" id="storage-section">
                                <h4>存储设置</h4>
                                <div class="form-group">
                                    <label>最大文件大小 (MB)</label>
                                    <input type="number" name="storage.maxFileSize" min="1" max="1000">
                                </div>
                                <div class="form-group">
                                    <label>允许的文件类型</label>
                                    <input type="text" name="storage.allowedTypes" placeholder="* 表示所有类型">
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="storage.autoCompress">
                                        自动压缩文件
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>压缩质量</label>
                                    <input type="range" name="storage.compressionQuality" min="0.1" max="1" step="0.1">
                                    <span class="range-value">0.8</span>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="storage.backupEnabled">
                                        启用自动备份
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>备份间隔 (小时)</label>
                                    <input type="number" name="storage.backupInterval" min="1" max="168">
                                </div>
                            </div>
                            
                            <!-- 系统设置 -->
                            <div class="settings-section" id="system-section" style="display: none;">
                                <h4>系统设置</h4>
                                <div class="form-group">
                                    <label>主题</label>
                                    <select name="system.theme">
                                        <option value="light">浅色主题</option>
                                        <option value="dark">深色主题</option>
                                        <option value="auto">自动</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>语言</label>
                                    <select name="system.language">
                                        <option value="zh-CN">中文 (简体)</option>
                                        <option value="en-US">English</option>
                                        <option value="ja-JP">日本語</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>时区</label>
                                    <select name="system.timezone">
                                        <option value="Asia/Shanghai">中国标准时间</option>
                                        <option value="UTC">协调世界时</option>
                                        <option value="America/New_York">美国东部时间</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="system.notifications">
                                        启用通知
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="system.soundEnabled">
                                        启用声音
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="system.autoSave">
                                        自动保存
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>自动保存间隔 (秒)</label>
                                    <input type="number" name="system.autoSaveInterval" min="5" max="300">
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="system.debugMode">
                                        调试模式
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>性能模式</label>
                                    <select name="system.performanceMode">
                                        <option value="balanced">平衡</option>
                                        <option value="performance">高性能</option>
                                        <option value="battery">省电</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- 用户偏好设置 -->
                            <div class="settings-section" id="user-section" style="display: none;">
                                <h4>用户偏好设置</h4>
                                <div class="form-group">
                                    <label>默认视图</label>
                                    <select name="user.preferences.defaultView">
                                        <option value="grid">网格视图</option>
                                        <option value="list">列表视图</option>
                                        <option value="details">详细信息</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>排序方式</label>
                                    <select name="user.preferences.sortBy">
                                        <option value="name">按名称</option>
                                        <option value="date">按日期</option>
                                        <option value="size">按大小</option>
                                        <option value="type">按类型</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>排序顺序</label>
                                    <select name="user.preferences.sortOrder">
                                        <option value="asc">升序</option>
                                        <option value="desc">降序</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="user.preferences.showHidden">
                                        显示隐藏文件
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="user.preferences.showThumbnails">
                                        显示缩略图
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>缩略图大小</label>
                                    <select name="user.preferences.thumbnailSize">
                                        <option value="small">小</option>
                                        <option value="medium">中</option>
                                        <option value="large">大</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="user.preferences.autoRefresh">
                                        自动刷新
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>刷新间隔 (秒)</label>
                                    <input type="number" name="user.preferences.refreshInterval" min="10" max="3600">
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="user.preferences.rememberLastFolder">
                                        记住最后访问的文件夹
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="user.preferences.showFileSize">
                                        显示文件大小
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="user.preferences.showFileDate">
                                        显示文件日期
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="user.preferences.showFileType">
                                        显示文件类型
                                    </label>
                                </div>
                            </div>
                            
                            <!-- 同步设置 -->
                            <div class="settings-section" id="sync-section" style="display: none;">
                                <h4>同步设置</h4>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="sync.autoSync">
                                        启用自动同步
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>同步间隔 (分钟)</label>
                                    <input type="number" name="sync.syncInterval" min="1" max="1440">
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="sync.syncOnStartup">
                                        启动时同步
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="sync.syncOnChange">
                                        文件变化时同步
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>最大重试次数</label>
                                    <input type="number" name="sync.maxRetries" min="1" max="10">
                                </div>
                                <div class="form-group">
                                    <label>重试延迟 (秒)</label>
                                    <input type="number" name="sync.retryDelay" min="1" max="60">
                                </div>
                                <div class="form-group">
                                    <label>冲突解决策略</label>
                                    <select name="sync.conflictResolution">
                                        <option value="server-wins">服务器优先</option>
                                        <option value="client-wins">客户端优先</option>
                                        <option value="manual">手动解决</option>
                                    </select>
                                </div>
                            </div>
                            
                            <!-- 安全设置 -->
                            <div class="settings-section" id="security-section" style="display: none;">
                                <h4>安全设置</h4>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="security.requirePassword">
                                        需要密码
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>会话超时 (分钟)</label>
                                    <input type="number" name="security.sessionTimeout" min="5" max="480">
                                </div>
                                <div class="form-group">
                                    <label>最大登录尝试次数</label>
                                    <input type="number" name="security.maxLoginAttempts" min="3" max="10">
                                </div>
                                <div class="form-group">
                                    <label>锁定持续时间 (分钟)</label>
                                    <input type="number" name="security.lockoutDuration" min="5" max="60">
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="security.twoFactorAuth">
                                        双因素认证
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="security.encryptionEnabled">
                                        启用加密
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>密码最小长度</label>
                                    <input type="number" name="security.passwordPolicy.minLength" min="6" max="20">
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="security.passwordPolicy.requireUppercase">
                                        要求大写字母
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="security.passwordPolicy.requireLowercase">
                                        要求小写字母
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="security.passwordPolicy.requireNumbers">
                                        要求数字
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" name="security.passwordPolicy.requireSpecialChars">
                                        要求特殊字符
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    
                    <div class="settings-actions">
                        <button class="btn btn-primary" id="saveSettingsBtn">保存设置</button>
                        <button class="btn btn-secondary" id="resetSettingsBtn">重置设置</button>
                        <button class="btn btn-warning" id="exportSettingsBtn">导出设置</button>
                        <button class="btn btn-info" id="importSettingsBtn">导入设置</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', settingsPanelHTML);
        this.settingsPanel = document.querySelector('.settings-panel');
    }

    /**
     * 绑定设置事件
     */
    bindSettingsEvents() {
        if (!this.settingsPanel) return;

        // 关闭按钮
        const closeBtn = this.settingsPanel.querySelector('.settings-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideSettingsPanel();
            });
        }

        // 标签切换
        const tabBtns = this.settingsPanel.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // 表单事件
        const form = document.getElementById('settingsForm');
        if (form) {
            form.addEventListener('change', () => {
                this.isDirty = true;
                this.updateFormValues();
            });

            // 范围滑块值显示
            const rangeInputs = form.querySelectorAll('input[type="range"]');
            rangeInputs.forEach(input => {
                const valueSpan = input.parentNode.querySelector('.range-value');
                if (valueSpan) {
                    input.addEventListener('input', () => {
                        valueSpan.textContent = input.value;
                    });
                }
            });
        }

        // 按钮事件
        const saveBtn = document.getElementById('saveSettingsBtn');
        const resetBtn = document.getElementById('resetSettingsBtn');
        const exportBtn = document.getElementById('exportSettingsBtn');
        const importBtn = document.getElementById('importSettingsBtn');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportSettings();
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importSettings();
            });
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
     * @param {*} value - 要设置的值
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    }

    /**
     * 从表单更新设置
     */
    updateSettingsFromForm() {
        const form = document.getElementById('settingsForm');
        if (!form) return;

        const formData = new FormData(form);
        for (let [name, value] of formData.entries()) {
            if (name.includes('.')) {
                // 处理复选框
                const element = form.elements[name];
                if (element && element.type === 'checkbox') {
                    this.setNestedValue(this.settings, name, element.checked);
                } else {
                    // 处理数字类型
                    if (this.isNumericField(name)) {
                        value = parseFloat(value) || 0;
                    }
                    this.setNestedValue(this.settings, name, value);
                }
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
            'storage.compressionQuality',
            'storage.backupInterval',
            'system.autoSaveInterval',
            'user.preferences.refreshInterval',
            'sync.syncInterval',
            'sync.maxRetries',
            'sync.retryDelay',
            'security.sessionTimeout',
            'security.maxLoginAttempts',
            'security.lockoutDuration',
            'security.passwordPolicy.minLength'
        ];
        return numericFields.includes(fieldName);
    }

    /**
     * 重置设置
     */
    resetSettings() {
        if (confirm('确定要重置所有设置吗？这将恢复默认设置。')) {
            this.settings = this.getDefaultSettings();
            this.renderSettingsForm();
            this.saveSettings();
            
            if (window.showMessage) {
                window.showMessage('设置已重置为默认值', 'success');
            }
        }
    }

    /**
     * 获取默认设置
     * @returns {Object} 默认设置
     */
    getDefaultSettings() {
        return {
            storage: {
                maxFileSize: 100 * 1024 * 1024,
                allowedTypes: ['*'],
                autoCompress: true,
                compressionQuality: 0.8,
                backupEnabled: true,
                backupInterval: 24 * 60 * 60 * 1000,
                cleanupEnabled: true,
                cleanupInterval: 7 * 24 * 60 * 60 * 1000
            },
            system: {
                theme: 'light',
                language: 'zh-CN',
                timezone: 'Asia/Shanghai',
                dateFormat: 'YYYY-MM-DD',
                timeFormat: 'HH:mm:ss',
                notifications: true,
                soundEnabled: true,
                autoSave: true,
                autoSaveInterval: 30000,
                debugMode: false,
                performanceMode: 'balanced'
            },
            user: {
                displayName: '',
                email: '',
                avatar: '',
                preferences: {
                    defaultView: 'grid',
                    sortBy: 'name',
                    sortOrder: 'asc',
                    showHidden: false,
                    showThumbnails: true,
                    thumbnailSize: 'medium',
                    autoRefresh: true,
                    refreshInterval: 60000,
                    rememberLastFolder: true,
                    showFileSize: true,
                    showFileDate: true,
                    showFileType: true
                },
                shortcuts: {
                    enableKeyboardShortcuts: true,
                    enableMouseGestures: false,
                    enableVoiceCommands: false
                },
                privacy: {
                    shareUsageData: false,
                    allowAnalytics: false,
                    allowCookies: true,
                    allowNotifications: true
                }
            },
            sync: {
                autoSync: true,
                syncInterval: 300000,
                syncOnStartup: true,
                syncOnChange: true,
                maxRetries: 3,
                retryDelay: 5000,
                conflictResolution: 'server-wins'
            },
            security: {
                requirePassword: false,
                sessionTimeout: 30 * 60 * 1000,
                maxLoginAttempts: 5,
                lockoutDuration: 15 * 60 * 1000,
                twoFactorAuth: false,
                encryptionEnabled: false,
                passwordPolicy: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: false
                }
            }
        };
    }

    /**
     * 导出设置
     */
    exportSettings() {
        const settingsData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            settings: this.settings
        };
        
        const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (window.showMessage) {
            window.showMessage('设置已导出', 'success');
        }
    }

    /**
     * 导入设置
     */
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.settings) {
                            this.settings = this.mergeSettings(this.settings, data.settings);
                            this.renderSettingsForm();
                            this.saveSettings();
                            
                            if (window.showMessage) {
                                window.showMessage('设置已导入', 'success');
                            }
                        } else {
                            throw new Error('无效的设置文件格式');
                        }
                    } catch (error) {
                        console.error('导入设置失败:', error);
                        if (window.showMessage) {
                            window.showMessage('导入设置失败: ' + error.message, 'error');
                        }
                    }
                };
                reader.readAsText(file);
            }
        });
        
        input.click();
    }

    /**
     * 开始自动保存
     */
    startAutoSave() {
        if (this.settings.system.autoSave) {
            this.autoSaveTimer = setInterval(() => {
                if (this.isDirty) {
                    this.updateSettingsFromForm();
                    this.saveSettings();
                }
            }, this.settings.system.autoSaveInterval);
        }
    }

    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
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
        this.isDirty = true;
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
        this.isDirty = true;
        this.saveSettings();
    }

    /**
     * 深度克隆对象
     * @param {*} obj - 要克隆的对象
     * @returns {*} 克隆后的对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
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
}

// 全局暴露
window.UISettingsManager = UISettingsManager; 