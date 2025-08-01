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
            autoSync: false,
            syncInterval: 30000, // 30秒
            maxRetries: 3,
            syncOnStartup: false,
            syncOnChange: false
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
        this.selectedDocFile = null;
        this.isSubmittingDoc = false;
        
        // 从localStorage加载外站文档数据
        this.loadExternalDocsFromStorage();
    }

    /**
     * 初始化文档同步模块
     */
    init() {
        this.loadSyncConfig();
        this.setupSyncUI();
        this.bindSyncEvents();
        this.bindSyncDocsEvents();
        
        // 设置全局函数，确保外站文档操作能正常工作
        this.setupGlobalFunctions();
        
        // 不在这里加载外站文档，而是在切换到外站文档分类时加载
        // this.loadExternalDocs();
        
        // 移除自动同步启动
        // if (this.syncConfig.syncOnStartup) {
        //     this.startAutoSync();
        // }
    }

    /**
     * 设置全局函数
     */
    setupGlobalFunctions() {
        // 设置外站文档操作的全局函数
        window.previewExternalDocument = (docId) => this.previewExternalDocument(docId);
        window.downloadExternalDocument = (docId) => this.downloadExternalDocument(docId);
        window.removeExternalDocument = (docId) => this.removeExternalDocument(docId);
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

        // 绑定设置面板事件 - 暂时注释掉，因为方法不存在
        // this.bindSettingsEvents();
    }

    /**
     * 绑定同步文档事件（别名方法，与index.js调用匹配）
     */
    bindSyncDocsEvents() {
        // 同步文档按钮事件 - 防止重复绑定
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        if (syncDocsBtn) {
            // 移除可能存在的旧事件监听器
            if (this._syncDocsClickHandler) {
                syncDocsBtn.removeEventListener('click', this._syncDocsClickHandler);
            }
            
            // 创建新的事件处理器
            this._syncDocsClickHandler = () => {
                this.showSyncDocsModal();
            };
            
            // 绑定新的事件监听器
            syncDocsBtn.addEventListener('click', this._syncDocsClickHandler);
        } else {
            // 未找到同步文档按钮元素
        }

        // 同步文档模态框事件
        this.bindSyncDocsModalEvents();
    }
    
    /**
     * 绑定同步文档模态框事件
     */
    bindSyncDocsModalEvents() {
        // 延迟绑定，确保DOM元素已加载
        setTimeout(() => {
            // 关闭按钮
            const closeBtn = document.getElementById('close-sync-docs-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideSyncDocsModal();
                });
            }
            
            // 取消按钮
            const cancelBtn = document.getElementById('cancel-sync-docs-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.hideSyncDocsModal();
                });
            }
            
            // 提交按钮
            const submitBtn = document.getElementById('submit-sync-docs-btn');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    this.submitSyncDocs();
                });
            }
            
            // 文件选择
            const fileInput = document.getElementById('doc-file-input');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    this.handleDocFileSelect(e);
                });
            }
            
            // 移除文件按钮
            const removeFileBtn = document.getElementById('doc-remove-file');
            if (removeFileBtn) {
                removeFileBtn.addEventListener('click', () => {
                    this.removeDocFile();
                });
            }
            
            // 拖放区域
            const dropArea = document.getElementById('doc-drop-area');
            if (dropArea) {
                dropArea.addEventListener('click', () => {
                    const fileInput = document.getElementById('doc-file-input');
                    if (fileInput) {
                        fileInput.click();
                    }
                });
                
                dropArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropArea.classList.add('border-emerald-light/60');
                });
                
                dropArea.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    dropArea.classList.remove('border-emerald-light/60');
                });
                
                dropArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropArea.classList.remove('border-emerald-light/60');
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        this.handleDocFile(files[0]);
                    }
                });
            }
            
            // 清空文档标题按钮
            const clearTitleBtn = document.getElementById('clear-doc-title');
            const titleInput = document.getElementById('doc-title');
            if (clearTitleBtn && titleInput) {
                // 初始状态检查
                this.updateClearButtonVisibility(titleInput, clearTitleBtn);
                
                // 点击清空
                clearTitleBtn.addEventListener('click', () => {
                    titleInput.value = '';
                    titleInput.focus();
                    this.updateClearButtonVisibility(titleInput, clearTitleBtn);
                });
                
                // 输入时更新按钮显示状态
                titleInput.addEventListener('input', () => {
                    this.updateClearButtonVisibility(titleInput, clearTitleBtn);
                });
            }
            
            // 清空文档分类按钮
            const clearCategoryBtn = document.getElementById('clear-doc-category');
            const categoryInput = document.getElementById('doc-category');
            if (clearCategoryBtn && categoryInput) {
                // 初始状态检查
                this.updateClearButtonVisibility(categoryInput, clearCategoryBtn);
                
                // 点击清空
                clearCategoryBtn.addEventListener('click', () => {
                    categoryInput.value = '';
                    categoryInput.focus();
                    this.updateClearButtonVisibility(categoryInput, clearCategoryBtn);
                });
                
                // 输入时更新按钮显示状态
                categoryInput.addEventListener('input', () => {
                    this.updateClearButtonVisibility(categoryInput, clearCategoryBtn);
                });
            }
        }, 100);
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
        return new Promise((resolve) => {
            setTimeout(() => {
                doc.lastSync = new Date();
                doc.status = 'synced';
                resolve();
            }, 500);
        });
    }

    /**
     * 开始手动同步
     */
    startManualSync() {
        if (this.syncStatus === 'syncing') {
            if (window.showMessage) {
                window.showMessage('同步正在进行中，请稍候...', 'info');
            }
            return;
        }

        this.syncStatus = 'syncing';
        this.syncProgress = 0;
        this.updateSyncStatus();
        this.updateSyncProgress();

        // 执行同步
        this.performSync().then(() => {
            this.syncStatus = 'success';
            this.lastSyncTime = new Date();
            this.updateSyncStats();
            
            if (window.showMessage) {
                window.showMessage('同步完成', 'success');
            }
        }).catch((error) => {
            console.error('同步失败:', error);
            this.syncStatus = 'error';
            
            if (window.showMessage) {
                window.showMessage('同步失败，请重试', 'error');
            }
        }).finally(() => {
            this.updateSyncStatus();
            this.updateSyncProgress();
        });
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
        if (window.showMessage) {
            window.showMessage('同步设置功能暂未开放', 'info');
        }
    }



    /**
     * 从localStorage加载外站文档数据
     */
    loadExternalDocsFromStorage() {
        try {
            const savedDocs = localStorage.getItem('externalDocs');
            if (savedDocs) {
                this.externalDocs = JSON.parse(savedDocs);
                // 确保日期对象正确解析
                this.externalDocs.forEach(doc => {
                    if (doc.addedAt) {
                        doc.addedAt = new Date(doc.addedAt);
                    }
                    if (doc.lastSync) {
                        doc.lastSync = new Date(doc.lastSync);
                    }
                });
            }
        } catch (error) {
            console.error('加载外站文档数据失败:', error);
            this.externalDocs = [];
        }
    }

    /**
     * 保存外站文档数据到localStorage
     */
    saveExternalDocsToStorage() {
        try {
            localStorage.setItem('externalDocs', JSON.stringify(this.externalDocs));
        } catch (error) {
            console.error('保存外站文档数据失败:', error);
        }
    }

    /**
     * 获取当前用户ID
     * @returns {string|null} 用户ID或null
     */
    getCurrentUserId() {
        let userId = null;
        
        // 方式1: 从API系统获取（最可靠）
        if (window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
            userId = window.apiSystem.getCurrentUserId();
        }
        
        // 方式2: 从localStorage获取userInfo（与登录系统一致）
        if (!userId) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    userId = user.uuid || user.id;
                } catch (e) {
                    console.warn('解析userInfo失败:', e);
                }
            }
        }
        
        // 方式3: 从认证系统获取
        if (!userId && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
            const currentUser = window.authSystem.getCurrentUser();
            userId = currentUser?.uuid || currentUser?.id;
        }
        
        // 方式4: 从localStorage获取currentUser（兼容旧版本）
        if (!userId) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    userId = userData.uuid || userData.id || userData.user_id;
                } catch (e) {
                    console.warn('解析存储的用户数据失败:', e);
                }
            }
        }
        
        // 方式5: 从URL参数获取（如果有的话）
        if (!userId) {
            const urlParams = new URLSearchParams(window.location.search);
            userId = urlParams.get('user_id');
        }
        
        // 方式6: 使用默认用户ID（仅用于开发测试）
        if (!userId && window.APP_CONFIG && window.APP_CONFIG.DEBUG) {
            userId = '550e8400-e29b-41d4-a716-446655440000';
            console.warn('使用默认用户ID进行开发测试');
        }
        
        return userId;
    }

    /**
     * 获取用户详细信息
     * @returns {Object|null} 用户详细信息或null
     */
    getUserData() {
        const savedUserData = localStorage.getItem('userData');
        if (savedUserData) {
            try {
                return JSON.parse(savedUserData);
            } catch (e) {
                console.warn('解析用户详细信息失败:', e);
                localStorage.removeItem('userData');
                return null;
            }
        }
        return null;
    }

    /**
     * 加载外部文档
     */
    async loadExternalDocs() {
        try {
            // 获取当前用户ID
            const userId = this.getCurrentUserId();
            
            if (!userId) {
                console.error('无法获取用户ID，跳过加载外部文档');
                this.externalDocs = [];
                this.updateSyncStats();
                this.renderExternalDocs();
                return;
            }
            
            // 调用后端API获取文档列表 - 包含认证信息
            const response = await fetch(window.APP_UTILS.buildApiUrl(`/api/documents?user_id=${userId}`), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // 包含cookie中的管理员token
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.documents) {
                    // 转换后端数据格式为前端格式
                    this.externalDocs = data.documents.map(doc => ({
                        id: doc.id.toString(),
                        title: doc.title,
                        url: doc.path, // 使用path作为URL
                        category: doc.category,
                        status: 'synced', // 后端文档默认为已同步状态
                        addedAt: new Date(doc.created_at),
                        lastSync: new Date(doc.updated_at),
                        lastError: null,
                        order: doc.order || 0,
                        filename: doc.filename
                    }));
                } else {
                    this.externalDocs = [];
                }
            } else {
                console.error('加载外部文档失败:', response.status, response.statusText);
                this.externalDocs = [];
            }
        } catch (error) {
            console.error('加载外部文档失败:', error);
            this.externalDocs = [];
        }

        // 更新统计信息
        this.syncStats.totalDocs = this.externalDocs.length;
        this.syncStats.syncedDocs = this.externalDocs.filter(doc => doc.status === 'synced').length;
        this.syncStats.failedDocs = this.externalDocs.filter(doc => doc.status === 'failed').length;
        this.updateSyncStats();
        
        this.renderExternalDocs();
    }

    /**
     * 渲染外部文档列表
     */
    renderExternalDocs() {
        // 检查是否在外站文档分类下
        if (!document.body.classList.contains('external-docs-category')) {
            return;
        }
        
        const filesGrid = document.getElementById('files-grid');
        if (!filesGrid) return;
        
        // 清空文件网格
        filesGrid.innerHTML = '';
        
        if (this.externalDocs.length === 0) {
            // 显示外站文档空状态
            filesGrid.innerHTML = `
                <div class="external-docs-empty-state col-span-full flex flex-col items-center justify-center py-12 md:py-16 text-center">
                    <div class="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 rounded-full bg-purple-light/10 flex items-center justify-center animate-pulse">
                        <i class="fa fa-book text-2xl md:text-4xl text-purple-light/70"></i>
                    </div>
                    <h2 class="text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-2">暂无外站文档</h2>
                    <p class="text-gray-400 max-w-md mb-4 md:mb-6 text-sm md:text-base px-4">你的外站文档库是空的。点击顶部的同步文档按钮添加Markdown文档。</p>
                </div>
            `;
            
            // 更新文件计数为0，并设置外站文档分类的计数文本
            if (window.uiManager && window.uiManager.updateFileCount) {
                window.uiManager.updateFileCount(0, 0);
            }
            // 不调用toggleEmptyState，因为外站文档有自己的空状态处理
            return;
        }
        
        // 渲染外站文档卡片
        const docsHTML = this.externalDocs.map(doc => this.createExternalDocCard(doc)).join('');
        filesGrid.innerHTML = docsHTML;
        
        // 更新文件计数
        if (window.uiManager && window.uiManager.updateFileCount) {
            window.uiManager.updateFileCount(this.externalDocs.length, this.externalDocs.length);
        }
        
        // 确保文件网格可见
        filesGrid.classList.remove('hidden');
        filesGrid.style.opacity = '1';
        
        // 隐藏默认空状态
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.classList.add('hidden');
        }
    }
    
    /**
     * 创建外站文档卡片
     */
    createExternalDocCard(doc) {
        return `
            <div class="file-card bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 rounded-xl p-4 border border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg backdrop-blur-sm cursor-pointer group" data-doc-id="${doc.id}" data-type="external-docs">
                <div class="flex flex-col items-center text-center">
                    <div class="w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-lg flex items-center justify-center mb-3">
                        <i class="fa fa-book text-emerald-400 text-xl"></i>
                    </div>
                    <div class="flex-1 min-w-0 mb-3">
                        <h4 class="text-white font-semibold truncate mb-3" title="${doc.title}">${doc.title}</h4>
                        <div style="height:8px;"></div>
                        <div class="flex flex-col items-center justify-center space-y-2 text-xs text-gray-400">
                            <div class="flex items-center space-x-1">
                                <i class="fa fa-clock-o text-emerald-400"></i>
                                <span class="text-emerald-300 font-medium">${this.formatDate(doc.addedAt)}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                <i class="fa fa-tag text-emerald-400"></i>
                                <span class="text-emerald-300 font-medium">${doc.category || '外站文档'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 操作按钮 -->
                    <div class="doc-actions flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button class="doc-preview-btn text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10" title="预览" onclick="previewExternalDocument('${doc.id}')">
                            <i class="fa fa-eye text-sm"></i>
                        </button>
                        <button class="doc-download-btn text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/10" title="下载" onclick="downloadExternalDocument('${doc.id}')">
                            <i class="fa fa-download text-sm"></i>
                        </button>
                        <button class="doc-delete-btn text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="删除" onclick="removeExternalDocument('${doc.id}')">
                            <i class="fa fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 获取状态样式类
     */
    getStatusClass(status) {
        switch (status) {
            case 'synced': return 'bg-green-500/80 text-green-300 border-green-400';
            case 'syncing': return 'bg-yellow-500/80 text-yellow-300 border-yellow-400';
            case 'error': return 'bg-red-500/80 text-red-300 border-red-400';
            case 'pending': 
            default: return 'bg-gray-500/80 text-gray-300 border-gray-400';
        }
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
     * @param {string} category - 文档分类
     */
    async addExternalDoc(url, category = '外站文档') {
        if (!url || !this.validateUrl(url)) {
            if (window.showMessage) {
                window.showMessage('请输入有效的文档URL', 'error');
            }
            return;
        }

        try {
            // 获取当前用户ID
            const userId = this.getCurrentUserId();
            
            if (!userId) {
                if (window.showMessage) {
                    window.showMessage('无法获取用户信息', 'error');
                }
                return;
            }
            
            // 对于外部文档，我们需要创建一个虚拟的Markdown文件
            // 创建一个包含外部链接的Markdown内容
            const markdownContent = `# ${this.extractTitleFromUrl(url)}

> 外部文档链接

**URL:** ${url}
**分类:** ${category}

---

这是一个外部文档的引用。原始文档位于：${url}

请访问原始链接查看完整内容。
`;

            // 创建Blob对象
            const blob = new Blob([markdownContent], { type: 'text/markdown' });
            const file = new File([blob], this.extractTitleFromUrl(url) + '.md', { type: 'text/markdown' });

            // 创建FormData对象
            const formData = new FormData();
            formData.append('title', this.extractTitleFromUrl(url));
            formData.append('category', category);
            formData.append('order', '0');
            formData.append('file', file);
            
            // 调用后端API创建文档
            const response = await fetch(window.APP_UTILS.buildApiUrl(`/api/documents?user_id=${userId}`), {
                method: 'POST',
                body: formData,
                credentials: 'include' // 包含cookie中的管理员token
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.document) {
                    // 转换后端数据格式为前端格式
                    const newDoc = {
                        id: data.document.id.toString(),
                        title: data.document.title,
                        url: data.document.path,
                        category: data.document.category,
                        status: 'synced',
                        addedAt: new Date(data.document.created_at),
                        lastSync: new Date(data.document.updated_at),
                        lastError: null,
                        order: data.document.order || 0,
                        filename: data.document.filename
                    };
                    
                    // 添加到本地列表
                    this.externalDocs.push(newDoc);
                    this.renderExternalDocs();
                    this.updateSyncStats();
                    
                    if (window.showMessage) {
                        window.showMessage('外部文档添加成功', 'success');
                    }
                } else {
                    throw new Error(data.message || '添加文档失败');
                }
            } else {
                console.error('API响应错误:', response.status, response.statusText);
                console.error('请求URL:', window.APP_UTILS.buildApiUrl(`/api/documents?user_id=${userId}`));
                console.error('请求体: FormData with file:', this.extractTitleFromUrl(url) + '.md');
                
                let errorMessage = `添加文档失败: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.error('无法解析错误响应:', e);
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('添加外部文档失败:', error);
            if (window.showMessage) {
                window.showMessage('添加外部文档失败: ' + error.message, 'error');
            }
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
    }

    /**
     * 删除文档
     * @param {string} docId - 文档ID
     */
    async removeDoc(docId) {
        const doc = this.externalDocs.find(d => d.id === docId);
        if (!doc) return;

        // 使用封装的二次确认模态框
        if (window.showConfirmModal) {
            window.showConfirmModal({
                title: '删除文档',
                message: `确定要删除文档 "${doc.title}" 吗？此操作不可撤销。`,
                confirmText: '删除',
                cancelText: '取消',
                confirmClass: 'btn-danger',
                onConfirm: async () => {
                    try {
                        // 调用后端API删除文档
                        const response = await fetch(window.APP_UTILS.buildApiUrl(`/api/documents/${docId}`), {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.ok) {
                            // 从本地列表中移除
                            this.externalDocs = this.externalDocs.filter(d => d.id !== docId);
                            this.renderExternalDocs();
                            this.updateSyncStats();
                            
                            if (window.MessageBox && window.MessageBox.show) {
                                window.MessageBox.show({
                                    message: '文档删除成功',
                                    type: 'success',
                                    duration: 3000
                                });
                            } else if (window.showMessage) {
                                window.showMessage('文档删除成功', 'success');
                            }
                        } else {
                            const errorData = await response.json();
                            throw new Error(errorData.message || `删除文档失败: ${response.status}`);
                        }
                    } catch (error) {
                        console.error('删除文档失败:', error);
                        if (window.MessageBox && window.MessageBox.show) {
                            window.MessageBox.show({
                                message: '删除文档失败: ' + error.message,
                                type: 'error',
                                duration: 4000
                            });
                        } else if (window.showMessage) {
                            window.showMessage('删除文档失败: ' + error.message, 'error');
                        }
                    }
                }
            });
        } else {
            // 降级到原生confirm
            if (confirm(`确定要删除文档 "${doc.title}" 吗？此操作不可撤销。`)) {
                try {
                    // 调用后端API删除文档
                    const response = await fetch(window.APP_UTILS.buildApiUrl(`/api/documents/${docId}`), {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        // 从本地列表中移除
                        this.externalDocs = this.externalDocs.filter(d => d.id !== docId);
                        this.renderExternalDocs();
                        this.updateSyncStats();
                        
                        if (window.MessageBox && window.MessageBox.show) {
                            window.MessageBox.show({
                                message: '文档删除成功',
                                type: 'success',
                                duration: 3000
                            });
                        } else if (window.showMessage) {
                            window.showMessage('文档删除成功', 'success');
                        }
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `删除文档失败: ${response.status}`);
                    }
                } catch (error) {
                    console.error('删除文档失败:', error);
                    if (window.MessageBox && window.MessageBox.show) {
                        window.MessageBox.show({
                            message: '删除文档失败: ' + error.message,
                            type: 'error',
                            duration: 4000
                        });
                    } else if (window.showMessage) {
                        window.showMessage('删除文档失败: ' + error.message, 'error');
                    }
                }
            }
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
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        if (year === 1970 || year === 1) return '';
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
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
        return [];
    }
    
    /**
     * 预览外站文档
     * @param {string} docId - 文档ID
     */
    previewExternalDocument(docId) {
        const doc = this.externalDocs.find(d => d.id === docId);
        if (doc) {
            // 在新窗口打开文档URL
            window.open(doc.url, '_blank');
        }
    }
    
    /**
     * 下载外站文档
     * @param {string} docId - 文档ID
     */
    downloadExternalDocument(docId) {
        const doc = this.externalDocs.find(d => d.id === docId);
        if (doc) {
            // 创建下载链接
            const link = document.createElement('a');
            link.href = doc.url;
            link.download = doc.title;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    /**
     * 删除外站文档
     * @param {string} docId - 文档ID
     */
    removeExternalDocument(docId) {
        const doc = this.externalDocs.find(d => d.id === docId);
        if (!doc) return;

        // 使用封装的二次确认模态框
        if (window.showConfirmModal) {
            window.showConfirmModal({
                title: '删除文档',
                message: `确定要删除文档 "${doc.title}" 吗？`,
                confirmText: '删除',
                cancelText: '取消',
                confirmClass: 'btn-danger',
                onConfirm: () => {
                    this.externalDocs = this.externalDocs.filter(d => d.id !== docId);
                    this.saveExternalDocsToStorage(); // 保存到localStorage
                    this.renderExternalDocs();
                    this.updateSyncStats();
                    
                    if (window.MessageBox && window.MessageBox.show) {
                        window.MessageBox.show({
                            message: '文档删除成功',
                            type: 'success',
                            duration: 3000
                        });
                    } else if (window.showMessage) {
                        window.showMessage('文档删除成功', 'success');
                    }
                }
            });
        } else {
            // 降级到原生confirm
            if (confirm(`确定要删除文档 "${doc.title}" 吗？`)) {
                this.externalDocs = this.externalDocs.filter(d => d.id !== docId);
                this.saveExternalDocsToStorage(); // 保存到localStorage
                this.renderExternalDocs();
                this.updateSyncStats();
                
                if (window.MessageBox && window.MessageBox.show) {
                    window.MessageBox.show({
                        message: '文档删除成功',
                        type: 'success',
                        duration: 3000
                    });
                } else if (window.showMessage) {
                    window.showMessage('文档删除成功', 'success');
                }
            }
        }
    }
    
    /**
     * 显示同步文档模态框
     */
    async showSyncDocsModal() {
        // 直接弹窗，不再判断cookie
        const modal = document.getElementById('sync-docs-modal');
        if (modal) {
            modal.classList.remove('opacity-0', 'invisible');
            modal.classList.add('opacity-100');
            const glassEffect = modal.querySelector('.glass-effect');
            if (glassEffect) {
                glassEffect.classList.remove('scale-95');
                glassEffect.classList.add('scale-100');
            }
            this.bindSyncDocsModalEvents();
        }
    }

    /**
     * 隐藏同步文档模态框
     */
    hideSyncDocsModal() {
        const modal = document.getElementById('sync-docs-modal');
        if (modal) {
            modal.classList.add('opacity-0', 'invisible');
            modal.classList.remove('opacity-100');
            const glassEffect = modal.querySelector('.glass-effect');
            if (glassEffect) {
                glassEffect.classList.add('scale-95');
                glassEffect.classList.remove('scale-100');
            }
            
            // 重置表单
            this.resetSyncDocsForm();
        }
    }

    /**
     * 重置同步文档表单
     */
    resetSyncDocsForm() {
        const titleInput = document.getElementById('doc-title');
        const categoryInput = document.getElementById('doc-category');
        const clearTitleBtn = document.getElementById('clear-doc-title');
        const clearCategoryBtn = document.getElementById('clear-doc-category');
        
        if (titleInput) {
            titleInput.value = '';
            if (clearTitleBtn) {
                this.updateClearButtonVisibility(titleInput, clearTitleBtn);
            }
        }
        
        if (categoryInput) {
            categoryInput.value = '';
            if (clearCategoryBtn) {
                this.updateClearButtonVisibility(categoryInput, clearCategoryBtn);
            }
        }
        
        document.getElementById('doc-order').value = '';
        document.getElementById('doc-file-input').value = '';
        document.getElementById('doc-file-info').classList.add('hidden');
        document.getElementById('doc-file-name').textContent = '';
        this.selectedDocFile = null;
    }

    /**
     * 处理文档文件选择
     */
    handleDocFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleDocFile(file);
        }
    }

    /**
     * 处理文档文件
     */
    handleDocFile(file) {
        if (!file.name.toLowerCase().endsWith('.md')) {
            if (window.showMessage) {
                window.showMessage('只支持上传.md格式的文件', 'error');
            }
            return;
        }

        const fileInfo = document.getElementById('doc-file-info');
        const fileName = document.getElementById('doc-file-name');
        
        fileName.textContent = file.name;
        fileInfo.classList.remove('hidden');
        
        // 存储文件对象
        this.selectedDocFile = file;
        
        // 自动填充标题：如果标题输入框为空，则使用文件名（去掉扩展名）作为标题
        const titleInput = document.getElementById('doc-title');
        const clearTitleBtn = document.getElementById('clear-doc-title');
        if (titleInput && !titleInput.value.trim()) {
            // 去掉.md扩展名，获取文件名作为标题
            const fileNameWithoutExt = file.name.replace(/\.md$/i, '');
            titleInput.value = fileNameWithoutExt;
            // 更新清空按钮显示状态
            if (clearTitleBtn) {
                this.updateClearButtonVisibility(titleInput, clearTitleBtn);
            }
        }
    }

    /**
     * 移除文档文件
     */
    removeDocFile() {
        document.getElementById('doc-file-info').classList.add('hidden');
        document.getElementById('doc-file-name').textContent = '';
        document.getElementById('doc-file-input').value = '';
        this.selectedDocFile = null;
    }

    /**
     * 提交同步文档
     */
    async submitSyncDocs() {
        // 防止重复提交
        if (this.isSubmittingDoc) {
            return;
        }
        
        this.isSubmittingDoc = true;
        
        const title = document.getElementById('doc-title').value.trim();
        const category = document.getElementById('doc-category').value.trim();
        const order = document.getElementById('doc-order').value.trim();

        // 验证必填字段
        if (!title) {
            if (window.showMessage) {
                window.showMessage('请输入文档标题', 'error');
            }
            this.isSubmittingDoc = false;
            return;
        }

        if (!category) {
            if (window.showMessage) {
                window.showMessage('请输入文档分类', 'error');
            }
            this.isSubmittingDoc = false;
            return;
        }

        if (!this.selectedDocFile) {
            if (window.showMessage) {
                window.showMessage('请选择Markdown文件', 'error');
            }
            this.isSubmittingDoc = false;
            return;
        }

        try {
            // 读取文件内容
            const content = await this.readFileContent(this.selectedDocFile);
            
            // 生成frontmatter
            const frontmatter = this.generateFrontmatter(title, category, order);
            
            // 合并内容
            const fullContent = frontmatter + '\n\n' + content;
            
            // 获取当前用户ID
            const userId = this.getCurrentUserId();
            
            if (!userId) {
                throw new Error('无法获取用户信息');
            }
            
            // 创建FormData对象，因为后端期望multipart/form-data格式
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('order', order ? order.toString() : '0');
            formData.append('file', this.selectedDocFile);
            
            // 调用后端API创建文档
            const response = await fetch(window.APP_UTILS.buildApiUrl(`/api/documents?user_id=${userId}`), {
                method: 'POST',
                body: formData,
                credentials: 'include' // 包含cookie中的管理员token
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.document) {
                    // 转换后端数据格式为前端格式
                    const newDoc = {
                        id: data.document.id.toString(),
                        title: data.document.title,
                        url: data.document.path,
                        category: data.document.category,
                        status: 'synced',
                        addedAt: new Date(data.document.created_at),
                        lastSync: new Date(data.document.updated_at),
                        lastError: null,
                        order: data.document.order || 0,
                        filename: data.document.filename
                    };
                    
                    // 添加到本地列表
                    this.externalDocs.push(newDoc);
                    
                    // 更新统计信息
                    this.syncStats.totalDocs = this.externalDocs.length;
                    this.syncStats.syncedDocs = this.externalDocs.length;
                    this.updateSyncStats();
                    
                    // 重新渲染
                    this.renderExternalDocs();
                    
                    // 隐藏模态框
                    this.hideSyncDocsModal();
                    
                    if (window.showMessage) {
                        window.showMessage('文档同步成功！', 'success');
                    }
                } else {
                    throw new Error(data.message || '同步文档失败');
                }
            } else {
                console.error('API响应错误:', response.status, response.statusText);
                console.error('请求URL:', window.APP_UTILS.buildApiUrl(`/api/documents?user_id=${userId}`));
                console.error('请求体: FormData with file:', this.selectedDocFile.name);
                
                let errorMessage = `同步文档失败: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.error('无法解析错误响应:', e);
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('同步文档失败:', error);
            if (window.showMessage) {
                window.showMessage('同步文档失败: ' + error.message, 'error');
            }
        } finally {
            this.isSubmittingDoc = false;
        }
    }

    /**
     * 读取文件内容
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('读取文件失败'));
            reader.readAsText(file);
        });
    }

    /**
     * 生成frontmatter
     */
    generateFrontmatter(title, category, order) {
        const frontmatter = {
            title: title,
            category: category,
            order: order ? parseInt(order) : 0,
            date: new Date().toISOString().split('T')[0]
        };
        
        return '---\n' + 
               Object.entries(frontmatter)
                   .map(([key, value]) => `${key}: ${value}`)
                   .join('\n') + 
               '\n---';
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
     * 更新清空按钮的显示状态
     * @param {HTMLElement} input - 输入框元素
     * @param {HTMLElement} button - 清空按钮元素
     */
    updateClearButtonVisibility(input, button) {
        if (input.value.trim() !== '') {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        } else {
            button.style.opacity = '0';
            button.style.pointerEvents = 'none';
        }
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

 