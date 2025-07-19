/**
 * 文档同步模块
 * 处理文档同步功能、外部文档管理、同步状态显示和同步配置管理
 */
class UIDocsSync {
    constructor() {
        this.syncStatus = 'idle'; // idle, syncing, success, error
        this.syncProgress = 0;
        this.syncQueue = [];
        this.syncConfig = {
            autoSync: true,
            syncInterval: 30000, // 30秒
            maxRetries: 3,
            syncOnStartup: true,
            syncOnChange: true
        };
        this.externalDocs = [];
        this.syncTimer = null;
        this.lastSyncTime = null;
        this.syncStats = {
            totalDocs: 0,
            syncedDocs: 0,
            failedDocs: 0,
            lastSyncDuration: 0
        };
    }

    /**
     * 初始化文档同步模块
     */
    init() {
        this.loadSyncConfig();
        this.setupSyncUI();
        this.bindSyncEvents();
        this.loadExternalDocs();
        
        if (this.syncConfig.syncOnStartup) {
            this.startAutoSync();
        }
    }

    /**
     * 加载同步配置
     */
    loadSyncConfig() {
        try {
            const savedConfig = localStorage.getItem('docsSyncConfig');
            if (savedConfig) {
                this.syncConfig = { ...this.syncConfig, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.error('加载同步配置失败:', error);
        }
    }

    /**
     * 保存同步配置
     */
    saveSyncConfig() {
        try {
            localStorage.setItem('docsSyncConfig', JSON.stringify(this.syncConfig));
        } catch (error) {
            console.error('保存同步配置失败:', error);
        }
    }

    /**
     * 设置同步UI
     */
    setupSyncUI() {
        this.createSyncPanel();
        this.updateSyncStatus();
        this.updateSyncProgress();
    }

    /**
     * 创建同步面板
     */
    createSyncPanel() {
        const syncPanelHTML = `
            <div class="docs-sync-panel" style="display: none;">
                <div class="sync-header">
                    <h3>文档同步</h3>
                    <button class="sync-close">&times;</button>
                </div>
                <div class="sync-content">
                    <div class="sync-status-section">
                        <div class="sync-status">
                            <span class="status-label">同步状态:</span>
                            <span class="status-value" id="syncStatusValue">空闲</span>
                            <span class="status-indicator" id="syncStatusIndicator"></span>
                        </div>
                        <div class="sync-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="syncProgressFill"></div>
                            </div>
                            <span class="progress-text" id="syncProgressText">0%</span>
                        </div>
                    </div>
                    
                    <div class="sync-controls">
                        <button class="btn btn-primary" id="startSyncBtn">开始同步</button>
                        <button class="btn btn-warning" id="stopSyncBtn" style="display: none;">停止同步</button>
                        <button class="btn btn-info" id="refreshSyncBtn">刷新状态</button>
                        <button class="btn btn-secondary" id="syncSettingsBtn">同步设置</button>
                    </div>
                    
                    <div class="sync-stats">
                        <div class="stat-item">
                            <span class="stat-label">总文档数:</span>
                            <span class="stat-value" id="totalDocsCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">已同步:</span>
                            <span class="stat-value" id="syncedDocsCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">失败:</span>
                            <span class="stat-value" id="failedDocsCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">最后同步:</span>
                            <span class="stat-value" id="lastSyncTime">从未</span>
                        </div>
                    </div>
                    
                    <div class="external-docs-section">
                        <h4>外部文档</h4>
                        <div class="docs-list" id="externalDocsList"></div>
                        <div class="add-doc-controls">
                            <input type="text" id="newDocUrl" placeholder="输入文档URL">
                            <button class="btn btn-success" id="addDocBtn">添加文档</button>
                        </div>
                    </div>
                    
                    <div class="sync-queue-section">
                        <h4>同步队列</h4>
                        <div class="sync-queue" id="syncQueueList"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', syncPanelHTML);
        this.syncPanel = document.querySelector('.docs-sync-panel');
    }

    /**
     * 绑定同步事件
     */
    bindSyncEvents() {
        if (!this.syncPanel) return;

        // 关闭按钮
        const closeBtn = this.syncPanel.querySelector('.sync-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideSyncPanel();
            });
        }

        // 同步控制按钮
        const startSyncBtn = document.getElementById('startSyncBtn');
        const stopSyncBtn = document.getElementById('stopSyncBtn');
        const refreshSyncBtn = document.getElementById('refreshSyncBtn');
        const syncSettingsBtn = document.getElementById('syncSettingsBtn');

        if (startSyncBtn) {
            startSyncBtn.addEventListener('click', () => {
                this.startManualSync();
            });
        }

        if (stopSyncBtn) {
            stopSyncBtn.addEventListener('click', () => {
                this.stopSync();
            });
        }

        if (refreshSyncBtn) {
            refreshSyncBtn.addEventListener('click', () => {
                this.refreshSyncStatus();
            });
        }

        if (syncSettingsBtn) {
            syncSettingsBtn.addEventListener('click', () => {
                this.showSyncSettings();
            });
        }

        // 添加文档按钮
        const addDocBtn = document.getElementById('addDocBtn');
        const newDocUrl = document.getElementById('newDocUrl');

        if (addDocBtn && newDocUrl) {
            addDocBtn.addEventListener('click', () => {
                this.addExternalDoc(newDocUrl.value);
                newDocUrl.value = '';
            });
        }

        // 绑定设置面板事件
        this.bindSettingsEvents();
    }

    /**
     * 绑定同步文档事件（别名方法，与index.js调用匹配）
     */
    bindSyncDocsEvents() {
        // 初始化同步模块
        this.init();
        
        // 绑定同步事件
        this.bindSyncEvents();
        
        console.log('✅ 文档同步事件绑定完成');
    }

    /**
     * 显示同步面板
     */
    showSyncPanel() {
        if (this.syncPanel) {
            this.syncPanel.style.display = 'block';
            this.updateSyncStatus();
            this.updateSyncProgress();
            this.renderExternalDocs();
            this.renderSyncQueue();
        }
    }

    /**
     * 隐藏同步面板
     */
    hideSyncPanel() {
        if (this.syncPanel) {
            this.syncPanel.style.display = 'none';
        }
    }

    /**
     * 更新同步状态
     */
    updateSyncStatus() {
        const statusValue = document.getElementById('syncStatusValue');
        const statusIndicator = document.getElementById('syncStatusIndicator');
        const startSyncBtn = document.getElementById('startSyncBtn');
        const stopSyncBtn = document.getElementById('stopSyncBtn');

        if (statusValue) {
            const statusText = {
                'idle': '空闲',
                'syncing': '同步中',
                'success': '同步成功',
                'error': '同步失败'
            };
            statusValue.textContent = statusText[this.syncStatus] || '未知';
        }

        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.syncStatus}`;
        }

        if (startSyncBtn && stopSyncBtn) {
            if (this.syncStatus === 'syncing') {
                startSyncBtn.style.display = 'none';
                stopSyncBtn.style.display = 'inline-block';
            } else {
                startSyncBtn.style.display = 'inline-block';
                stopSyncBtn.style.display = 'none';
            }
        }
    }

    /**
     * 更新同步进度
     */
    updateSyncProgress() {
        const progressFill = document.getElementById('syncProgressFill');
        const progressText = document.getElementById('syncProgressText');

        if (progressFill) {
            progressFill.style.width = `${this.syncProgress}%`;
        }

        if (progressText) {
            progressText.textContent = `${Math.round(this.syncProgress)}%`;
        }
    }

    /**
     * 更新同步统计
     */
    updateSyncStats() {
        const totalDocsCount = document.getElementById('totalDocsCount');
        const syncedDocsCount = document.getElementById('syncedDocsCount');
        const failedDocsCount = document.getElementById('failedDocsCount');
        const lastSyncTime = document.getElementById('lastSyncTime');

        if (totalDocsCount) {
            totalDocsCount.textContent = this.syncStats.totalDocs;
        }

        if (syncedDocsCount) {
            syncedDocsCount.textContent = this.syncStats.syncedDocs;
        }

        if (failedDocsCount) {
            failedDocsCount.textContent = this.syncStats.failedDocs;
        }

        if (lastSyncTime) {
            lastSyncTime.textContent = this.lastSyncTime ? 
                this.formatDate(this.lastSyncTime) : '从未';
        }
    }

    /**
     * 开始手动同步
     */
    async startManualSync() {
        if (this.syncStatus === 'syncing') {
            return;
        }

        this.syncStatus = 'syncing';
        this.syncProgress = 0;
        this.updateSyncStatus();
        this.updateSyncProgress();

        try {
            await this.performSync();
            this.syncStatus = 'success';
            this.lastSyncTime = new Date();
            this.updateSyncStats();
        } catch (error) {
            console.error('同步失败:', error);
            this.syncStatus = 'error';
        }

        this.updateSyncStatus();
        this.updateSyncProgress();
    }

    /**
     * 停止同步
     */
    stopSync() {
        this.syncStatus = 'idle';
        this.syncProgress = 0;
        this.updateSyncStatus();
        this.updateSyncProgress();
        
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    /**
     * 执行同步
     */
    async performSync() {
        const startTime = Date.now();
        const totalDocs = this.externalDocs.length;
        
        if (totalDocs === 0) {
            this.syncProgress = 100;
            this.updateSyncProgress();
            return;
        }

        this.syncStats.totalDocs = totalDocs;
        this.syncStats.syncedDocs = 0;
        this.syncStats.failedDocs = 0;

        for (let i = 0; i < totalDocs; i++) {
            const doc = this.externalDocs[i];
            
            try {
                await this.syncDocument(doc);
                this.syncStats.syncedDocs++;
            } catch (error) {
                console.error(`同步文档失败: ${doc.url}`, error);
                this.syncStats.failedDocs++;
            }

            this.syncProgress = ((i + 1) / totalDocs) * 100;
            this.updateSyncProgress();
            
            // 模拟同步延迟
            await this.delay(500);
        }

        this.syncStats.lastSyncDuration = Date.now() - startTime;
        this.updateSyncStats();
    }

    /**
     * 同步单个文档
     * @param {Object} doc - 文档对象
     */
    async syncDocument(doc) {
        // 模拟文档同步过程
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 模拟90%的成功率
                if (Math.random() > 0.1) {
                    doc.lastSync = new Date();
                    doc.status = 'synced';
                    resolve();
                } else {
                    doc.status = 'failed';
                    doc.lastError = '网络连接失败';
                    reject(new Error('同步失败'));
                }
            }, 1000);
        });
    }

    /**
     * 开始自动同步
     */
    startAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(() => {
            if (this.syncConfig.autoSync && this.syncStatus !== 'syncing') {
                this.startManualSync();
            }
        }, this.syncConfig.syncInterval);
    }

    /**
     * 停止自动同步
     */
    stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    /**
     * 刷新同步状态
     */
    refreshSyncStatus() {
        this.updateSyncStatus();
        this.updateSyncProgress();
        this.updateSyncStats();
        this.renderExternalDocs();
        this.renderSyncQueue();
    }

    /**
     * 显示同步设置
     */
    showSyncSettings() {
        const settingsHTML = `
            <div class="sync-settings-modal">
                <div class="settings-header">
                    <h3>同步设置</h3>
                    <button class="settings-close">&times;</button>
                </div>
                <div class="settings-content">
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="autoSyncCheck" ${this.syncConfig.autoSync ? 'checked' : ''}>
                            启用自动同步
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>同步间隔 (秒)</label>
                        <input type="number" id="syncIntervalInput" value="${this.syncConfig.syncInterval / 1000}" min="10" max="3600">
                    </div>
                    <div class="setting-group">
                        <label>最大重试次数</label>
                        <input type="number" id="maxRetriesInput" value="${this.syncConfig.maxRetries}" min="1" max="10">
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="syncOnStartupCheck" ${this.syncConfig.syncOnStartup ? 'checked' : ''}>
                            启动时同步
                        </label>
                    </div>
                    <div class="setting-group">
                        <label>
                            <input type="checkbox" id="syncOnChangeCheck" ${this.syncConfig.syncOnChange ? 'checked' : ''}>
                            文件变化时同步
                        </label>
                    </div>
                    <div class="settings-actions">
                        <button class="btn btn-primary" onclick="saveSyncSettings()">保存设置</button>
                        <button class="btn btn-secondary" onclick="closeSyncSettings()">取消</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', settingsHTML);
        this.bindSettingsEvents();
    }

    /**
     * 绑定设置事件
     */
    bindSettingsEvents() {
        const settingsModal = document.querySelector('.sync-settings-modal');
        const closeBtn = settingsModal?.querySelector('.settings-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSyncSettings();
            });
        }
    }

    /**
     * 关闭同步设置
     */
    closeSyncSettings() {
        const settingsModal = document.querySelector('.sync-settings-modal');
        if (settingsModal) {
            settingsModal.remove();
        }
    }

    /**
     * 保存同步设置
     */
    saveSyncSettings() {
        const autoSyncCheck = document.getElementById('autoSyncCheck');
        const syncIntervalInput = document.getElementById('syncIntervalInput');
        const maxRetriesInput = document.getElementById('maxRetriesInput');
        const syncOnStartupCheck = document.getElementById('syncOnStartupCheck');
        const syncOnChangeCheck = document.getElementById('syncOnChangeCheck');

        this.syncConfig.autoSync = autoSyncCheck?.checked || false;
        this.syncConfig.syncInterval = (parseInt(syncIntervalInput?.value) || 30) * 1000;
        this.syncConfig.maxRetries = parseInt(maxRetriesInput?.value) || 3;
        this.syncConfig.syncOnStartup = syncOnStartupCheck?.checked || false;
        this.syncConfig.syncOnChange = syncOnChangeCheck?.checked || false;

        this.saveSyncConfig();

        if (this.syncConfig.autoSync) {
            this.startAutoSync();
        } else {
            this.stopAutoSync();
        }

        this.closeSyncSettings();
        
        if (window.showMessage) {
            window.showMessage('同步设置已保存', 'success');
        }
    }

    /**
     * 加载外部文档
     */
    async loadExternalDocs() {
        // 临时屏蔽外部文档加载，避免404错误
        console.log('📝 外部文档功能暂时禁用');
        this.externalDocs = this.getMockExternalDocs();
        this.updateSyncStats();
        this.renderExternalDocs();
        
        // 原有代码暂时注释
        /*
        try {
            const response = await fetch('/api/docs/external', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.externalDocs = await response.json();
            }
        } catch (error) {
            console.error('加载外部文档失败:', error);
            // 使用模拟数据
            this.externalDocs = this.getMockExternalDocs();
        }

        this.updateSyncStats();
        this.renderExternalDocs();
        */
    }

    /**
     * 渲染外部文档列表
     */
    renderExternalDocs() {
        const docsList = document.getElementById('externalDocsList');
        if (!docsList) return;

        const docsHTML = this.externalDocs.map(doc => `
            <div class="doc-item" data-doc-id="${doc.id}">
                <div class="doc-info">
                    <div class="doc-title">${doc.title}</div>
                    <div class="doc-url">${doc.url}</div>
                    <div class="doc-status ${doc.status}">${this.getStatusText(doc.status)}</div>
                </div>
                <div class="doc-actions">
                    <button class="btn btn-sm btn-primary" onclick="syncSingleDoc('${doc.id}')">同步</button>
                    <button class="btn btn-sm btn-warning" onclick="editDoc('${doc.id}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="removeDoc('${doc.id}')">删除</button>
                </div>
            </div>
        `).join('');

        docsList.innerHTML = docsHTML || '<p class="no-docs">暂无外部文档</p>';
    }

    /**
     * 渲染同步队列
     */
    renderSyncQueue() {
        const queueList = document.getElementById('syncQueueList');
        if (!queueList) return;

        const queueHTML = this.syncQueue.map((item, index) => `
            <div class="queue-item">
                <div class="queue-info">
                    <span class="queue-index">${index + 1}</span>
                    <span class="queue-doc">${item.title}</span>
                    <span class="queue-status ${item.status}">${this.getStatusText(item.status)}</span>
                </div>
                <div class="queue-actions">
                    <button class="btn btn-sm btn-warning" onclick="removeFromQueue(${index})">移除</button>
                </div>
            </div>
        `).join('');

        queueList.innerHTML = queueHTML || '<p class="no-queue">同步队列为空</p>';
    }

    /**
     * 添加外部文档
     * @param {string} url - 文档URL
     */
    async addExternalDoc(url) {
        if (!url || !this.validateUrl(url)) {
            if (window.showMessage) {
                window.showMessage('请输入有效的文档URL', 'error');
            }
            return;
        }

        const newDoc = {
            id: this.generateId(),
            title: this.extractTitleFromUrl(url),
            url: url,
            status: 'pending',
            addedAt: new Date(),
            lastSync: null,
            lastError: null
        };

        try {
            const response = await fetch('/api/docs/external', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newDoc)
            });

            if (response.ok) {
                this.externalDocs.push(newDoc);
                this.renderExternalDocs();
                this.updateSyncStats();
                
                if (window.showMessage) {
                    window.showMessage('外部文档添加成功', 'success');
                }
            }
        } catch (error) {
            console.error('添加外部文档失败:', error);
            // 模拟添加成功
            this.externalDocs.push(newDoc);
            this.renderExternalDocs();
            this.updateSyncStats();
        }
    }

    /**
     * 同步单个文档
     * @param {string} docId - 文档ID
     */
    async syncSingleDoc(docId) {
        const doc = this.externalDocs.find(d => d.id === docId);
        if (!doc) return;

        doc.status = 'syncing';
        this.renderExternalDocs();

        try {
            await this.syncDocument(doc);
            doc.status = 'synced';
            doc.lastSync = new Date();
        } catch (error) {
            doc.status = 'failed';
            doc.lastError = error.message;
        }

        this.renderExternalDocs();
        this.updateSyncStats();
    }

    /**
     * 编辑文档
     * @param {string} docId - 文档ID
     */
    editDoc(docId) {
        const doc = this.externalDocs.find(d => d.id === docId);
        if (!doc) return;

        // 实现编辑功能
        console.log('编辑文档:', doc);
    }

    /**
     * 删除文档
     * @param {string} docId - 文档ID
     */
    async removeDoc(docId) {
        const index = this.externalDocs.findIndex(d => d.id === docId);
        if (index === -1) return;

        try {
            const response = await fetch(`/api/docs/external/${docId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.externalDocs.splice(index, 1);
                this.renderExternalDocs();
                this.updateSyncStats();
                
                if (window.showMessage) {
                    window.showMessage('文档删除成功', 'success');
                }
            }
        } catch (error) {
            console.error('删除文档失败:', error);
            // 模拟删除成功
            this.externalDocs.splice(index, 1);
            this.renderExternalDocs();
            this.updateSyncStats();
        }
    }

    /**
     * 从队列中移除
     * @param {number} index - 队列索引
     */
    removeFromQueue(index) {
        if (index >= 0 && index < this.syncQueue.length) {
            this.syncQueue.splice(index, 1);
            this.renderSyncQueue();
        }
    }

    /**
     * 验证URL
     * @param {string} url - URL字符串
     * @returns {boolean} 是否有效
     */
    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 从URL提取标题
     * @param {string} url - URL字符串
     * @returns {string} 标题
     */
    extractTitleFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + urlObj.pathname;
        } catch {
            return url;
        }
    }

    /**
     * 获取状态文本
     * @param {string} status - 状态
     * @returns {string} 状态文本
     */
    getStatusText(status) {
        const statusMap = {
            'pending': '待同步',
            'syncing': '同步中',
            'synced': '已同步',
            'failed': '同步失败'
        };
        return statusMap[status] || status;
    }

    /**
     * 生成ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {string} 格式化的日期字符串
     */
    formatDate(date) {
        return new Date(date).toLocaleString('zh-CN');
    }

    /**
     * 延迟函数
     * @param {number} ms - 毫秒数
     * @returns {Promise} Promise对象
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 获取模拟外部文档
     * @returns {Array} 外部文档数组
     */
    getMockExternalDocs() {
        return [
            {
                id: '1',
                title: '项目文档',
                url: 'https://docs.example.com/project',
                status: 'synced',
                addedAt: new Date('2024-01-15'),
                lastSync: new Date('2024-01-20'),
                lastError: null
            },
            {
                id: '2',
                title: 'API文档',
                url: 'https://api.example.com/docs',
                status: 'pending',
                addedAt: new Date('2024-01-18'),
                lastSync: null,
                lastError: null
            },
            {
                id: '3',
                title: '用户手册',
                url: 'https://help.example.com/manual',
                status: 'failed',
                addedAt: new Date('2024-01-10'),
                lastSync: new Date('2024-01-12'),
                lastError: '网络连接失败'
            }
        ];
    }

    /**
     * 获取同步状态
     * @returns {string} 同步状态
     */
    getSyncStatus() {
        return this.syncStatus;
    }

    /**
     * 获取同步进度
     * @returns {number} 同步进度百分比
     */
    getSyncProgress() {
        return this.syncProgress;
    }

    /**
     * 获取同步配置
     * @returns {Object} 同步配置
     */
    getSyncConfig() {
        return this.syncConfig;
    }

    /**
     * 获取外部文档列表
     * @returns {Array} 外部文档列表
     */
    getExternalDocs() {
        return this.externalDocs;
    }

    /**
     * 获取同步统计
     * @returns {Object} 同步统计信息
     */
    getSyncStats() {
        return this.syncStats;
    }

    /**
     * 检查是否正在同步
     * @returns {boolean} 是否正在同步
     */
    isSyncing() {
        return this.syncStatus === 'syncing';
    }

    /**
     * 检查自动同步是否启用
     * @returns {boolean} 是否启用自动同步
     */
    isAutoSyncEnabled() {
        return this.syncConfig.autoSync;
    }
}

// 全局暴露
window.UIDocsSync = UIDocsSync;

// 全局函数
window.syncSingleDoc = function(docId) {
    if (window.uiManager && window.uiManager.docsSync) {
        window.uiManager.docsSync.syncSingleDoc(docId);
    }
};

window.editDoc = function(docId) {
    if (window.uiManager && window.uiManager.docsSync) {
        window.uiManager.docsSync.editDoc(docId);
    }
};

window.removeDoc = function(docId) {
    if (window.uiManager && window.uiManager.docsSync) {
        window.uiManager.docsSync.removeDoc(docId);
    }
};

window.removeFromQueue = function(index) {
    if (window.uiManager && window.uiManager.docsSync) {
        window.uiManager.docsSync.removeFromQueue(index);
    }
};

window.saveSyncSettings = function() {
    if (window.uiManager && window.uiManager.docsSync) {
        window.uiManager.docsSync.saveSyncSettings();
    }
};

window.closeSyncSettings = function() {
    if (window.uiManager && window.uiManager.docsSync) {
        window.uiManager.docsSync.closeSyncSettings();
    }
}; 