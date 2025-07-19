/**
 * URL管理模块
 * 包含URL上传功能、链接管理、URL验证和链接预览功能
 */
class UIUrlManager {
    constructor() {
        this.urls = [];
        this.urlPanel = null;
        this.currentUrl = null;
        this.isUploading = false;
        this.uploadQueue = [];
        this.observers = new Map();
        this.config = {
            maxUrlLength: 2048,
            allowedProtocols: ['http:', 'https:', 'ftp:', 'sftp:'],
            maxPreviewSize: 1024 * 1024, // 1MB
            previewTimeout: 10000, // 10秒
            maxConcurrentUploads: 3,
            retryAttempts: 3,
            retryDelay: 2000
        };
    }

    /**
     * 初始化URL管理器
     */
    init() {
        this.loadUrls();
        this.setupUrlUI();
        this.bindUrlEvents();
        this.startUrlProcessor();
    }

    /**
     * 加载URL列表
     */
    loadUrls() {
        try {
            const savedUrls = localStorage.getItem('uiUrls');
            if (savedUrls) {
                this.urls = JSON.parse(savedUrls);
            }
        } catch (error) {
            console.error('加载URL列表失败:', error);
        }
    }

    /**
     * 保存URL列表
     */
    saveUrls() {
        try {
            localStorage.setItem('uiUrls', JSON.stringify(this.urls));
            this.emit('urlsChanged', this.urls);
        } catch (error) {
            console.error('保存URL列表失败:', error);
        }
    }

    /**
     * 设置URL UI
     */
    setupUrlUI() {
        this.createUrlPanel();
        this.renderUrlList();
    }

    /**
     * 创建URL面板
     */
    createUrlPanel() {
        const urlPanelHTML = `
            <div class="url-panel" style="display: none;">
                <div class="url-header">
                    <h3>URL管理</h3>
                    <button class="url-close">&times;</button>
                </div>
                <div class="url-content">
                    <div class="url-tabs">
                        <button class="tab-btn active" data-tab="upload">URL上传</button>
                        <button class="tab-btn" data-tab="manage">链接管理</button>
                        <button class="tab-btn" data-tab="preview">链接预览</button>
                    </div>
                    
                    <!-- URL上传区域 -->
                    <div class="url-section" id="upload-section">
                        <h4>URL上传</h4>
                        <div class="url-upload-area">
                            <div class="url-input-group">
                                <input type="url" id="urlInput" placeholder="输入URL地址" class="url-input">
                                <button class="btn btn-primary" id="addUrlBtn">添加URL</button>
                            </div>
                            <div class="url-batch-input">
                                <textarea id="batchUrlInput" placeholder="批量输入URL，每行一个" class="url-textarea"></textarea>
                                <button class="btn btn-success" id="addBatchUrlBtn">批量添加</button>
                            </div>
                        </div>
                        
                        <div class="url-upload-queue">
                            <h5>上传队列</h5>
                            <div id="uploadQueueList" class="queue-list"></div>
                        </div>
                    </div>
                    
                    <!-- 链接管理区域 -->
                    <div class="url-section" id="manage-section" style="display: none;">
                        <h4>链接管理</h4>
                        <div class="url-filters">
                            <input type="text" id="urlSearchInput" placeholder="搜索URL" class="url-search">
                            <select id="urlStatusFilter" class="url-filter">
                                <option value="all">所有状态</option>
                                <option value="active">活跃</option>
                                <option value="inactive">非活跃</option>
                                <option value="error">错误</option>
                            </select>
                        </div>
                        
                        <div class="url-list-container">
                            <div id="urlList" class="url-list"></div>
                        </div>
                        
                        <div class="url-actions">
                            <button class="btn btn-primary" id="refreshUrlsBtn">刷新</button>
                            <button class="btn btn-warning" id="exportUrlsBtn">导出</button>
                            <button class="btn btn-info" id="importUrlsBtn">导入</button>
                            <button class="btn btn-danger" id="clearUrlsBtn">清空</button>
                        </div>
                    </div>
                    
                    <!-- 链接预览区域 -->
                    <div class="url-section" id="preview-section" style="display: none;">
                        <h4>链接预览</h4>
                        <div class="url-preview-container">
                            <div class="url-preview-info">
                                <div class="preview-url"></div>
                                <div class="preview-status"></div>
                            </div>
                            <div class="url-preview-content">
                                <div id="previewContent" class="preview-content"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', urlPanelHTML);
        this.urlPanel = document.querySelector('.url-panel');
    }

    /**
     * 绑定URL事件
     */
    bindUrlEvents() {
        if (!this.urlPanel) return;

        // 关闭按钮
        const closeBtn = this.urlPanel.querySelector('.url-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideUrlPanel();
            });
        }

        // 标签切换
        const tabBtns = this.urlPanel.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchUrlTab(btn.dataset.tab);
            });
        });

        // URL输入事件
        const urlInput = document.getElementById('urlInput');
        const addUrlBtn = document.getElementById('addUrlBtn');
        const batchUrlInput = document.getElementById('batchUrlInput');
        const addBatchUrlBtn = document.getElementById('addBatchUrlBtn');

        if (addUrlBtn) {
            addUrlBtn.addEventListener('click', () => {
                this.addUrl(urlInput.value);
                urlInput.value = '';
            });
        }

        if (addBatchUrlBtn) {
            addBatchUrlBtn.addEventListener('click', () => {
                this.addBatchUrls(batchUrlInput.value);
                batchUrlInput.value = '';
            });
        }

        // 搜索和过滤事件
        const searchInput = document.getElementById('urlSearchInput');
        const statusFilter = document.getElementById('urlStatusFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterUrls();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterUrls();
            });
        }

        // 操作按钮事件
        const refreshBtn = document.getElementById('refreshUrlsBtn');
        const exportBtn = document.getElementById('exportUrlsBtn');
        const importBtn = document.getElementById('importUrlsBtn');
        const clearBtn = document.getElementById('clearUrlsBtn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshUrls();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportUrls();
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importUrls();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearUrls();
            });
        }
    }

    /**
     * 显示URL面板
     */
    showUrlPanel() {
        if (this.urlPanel) {
            this.urlPanel.style.display = 'block';
            this.renderUrlList();
            this.updateUploadQueue();
        }
    }

    /**
     * 隐藏URL面板
     */
    hideUrlPanel() {
        if (this.urlPanel) {
            this.urlPanel.style.display = 'none';
        }
    }

    /**
     * 切换URL标签
     * @param {string} tabName - 标签名称
     */
    switchUrlTab(tabName) {
        // 更新标签按钮状态
        const tabBtns = this.urlPanel.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 显示对应的区域
        const sections = this.urlPanel.querySelectorAll('.url-section');
        sections.forEach(section => {
            section.style.display = section.id === `${tabName}-section` ? 'block' : 'none';
        });
    }

    /**
     * 添加URL
     * @param {string} url - URL地址
     */
    addUrl(url) {
        if (!url || !this.validateUrl(url)) {
            if (window.showMessage) {
                window.showMessage('请输入有效的URL地址', 'error');
            }
            return;
        }

        const urlObj = {
            id: this.generateId(),
            url: url,
            title: '',
            description: '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {},
            tags: [],
            category: 'general'
        };

        this.urls.push(urlObj);
        this.saveUrls();
        this.renderUrlList();
        this.addToUploadQueue(urlObj);

        if (window.showMessage) {
            window.showMessage('URL已添加', 'success');
        }
    }

    /**
     * 批量添加URL
     * @param {string} urlsText - URL文本
     */
    addBatchUrls(urlsText) {
        if (!urlsText.trim()) {
            if (window.showMessage) {
                window.showMessage('请输入URL列表', 'error');
            }
            return;
        }

        const urls = urlsText.split('\n').filter(url => url.trim());
        let addedCount = 0;
        let errorCount = 0;

        urls.forEach(url => {
            if (this.validateUrl(url.trim())) {
                this.addUrl(url.trim());
                addedCount++;
            } else {
                errorCount++;
            }
        });

        if (window.showMessage) {
            window.showMessage(`批量添加完成: 成功${addedCount}个，失败${errorCount}个`, 'info');
        }
    }

    /**
     * 验证URL
     * @param {string} url - URL地址
     * @returns {boolean} 是否有效
     */
    validateUrl(url) {
        try {
            const urlObj = new URL(url);
            return this.config.allowedProtocols.includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    /**
     * 渲染URL列表
     */
    renderUrlList() {
        const urlList = document.getElementById('urlList');
        if (!urlList) return;

        if (this.urls.length === 0) {
            urlList.innerHTML = '<div class="empty-state">暂无URL</div>';
            return;
        }

        const urlItems = this.urls.map(url => this.createUrlItem(url)).join('');
        urlList.innerHTML = urlItems;

        // 绑定URL项事件
        this.bindUrlItemEvents();
    }

    /**
     * 创建URL项
     * @param {Object} url - URL对象
     * @returns {string} URL项HTML
     */
    createUrlItem(url) {
        const statusClass = this.getStatusClass(url.status);
        const statusText = this.getStatusText(url.status);
        
        return `
            <div class="url-item" data-url-id="${url.id}">
                <div class="url-item-header">
                    <div class="url-item-title">
                        <span class="url-text">${this.truncateUrl(url.url)}</span>
                        <span class="url-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="url-item-actions">
                        <button class="btn btn-sm btn-info preview-url-btn" title="预览">👁</button>
                        <button class="btn btn-sm btn-primary edit-url-btn" title="编辑">✏</button>
                        <button class="btn btn-sm btn-danger delete-url-btn" title="删除">🗑</button>
                    </div>
                </div>
                <div class="url-item-details">
                    <div class="url-meta">
                        <span class="url-category">${url.category}</span>
                        <span class="url-date">${this.formatDate(url.createdAt)}</span>
                    </div>
                    ${url.description ? `<div class="url-description">${url.description}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 绑定URL项事件
     */
    bindUrlItemEvents() {
        const urlItems = this.urlPanel.querySelectorAll('.url-item');
        
        urlItems.forEach(item => {
            const urlId = item.dataset.urlId;
            const url = this.urls.find(u => u.id === urlId);
            
            if (!url) return;

            // 预览按钮
            const previewBtn = item.querySelector('.preview-url-btn');
            if (previewBtn) {
                previewBtn.addEventListener('click', () => {
                    this.previewUrl(url);
                });
            }

            // 编辑按钮
            const editBtn = item.querySelector('.edit-url-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.editUrl(url);
                });
            }

            // 删除按钮
            const deleteBtn = item.querySelector('.delete-url-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    this.deleteUrl(url.id);
                });
            }
        });
    }

    /**
     * 过滤URL
     */
    filterUrls() {
        const searchInput = document.getElementById('urlSearchInput');
        const statusFilter = document.getElementById('urlStatusFilter');
        
        if (!searchInput || !statusFilter) return;

        const searchTerm = searchInput.value.toLowerCase();
        const statusFilterValue = statusFilter.value;

        const filteredUrls = this.urls.filter(url => {
            const matchesSearch = url.url.toLowerCase().includes(searchTerm) ||
                                (url.description && url.description.toLowerCase().includes(searchTerm));
            const matchesStatus = statusFilterValue === 'all' || url.status === statusFilterValue;
            
            return matchesSearch && matchesStatus;
        });

        this.renderFilteredUrls(filteredUrls);
    }

    /**
     * 渲染过滤后的URL
     * @param {Array} filteredUrls - 过滤后的URL列表
     */
    renderFilteredUrls(filteredUrls) {
        const urlList = document.getElementById('urlList');
        if (!urlList) return;

        if (filteredUrls.length === 0) {
            urlList.innerHTML = '<div class="empty-state">没有找到匹配的URL</div>';
            return;
        }

        const urlItems = filteredUrls.map(url => this.createUrlItem(url)).join('');
        urlList.innerHTML = urlItems;
        this.bindUrlItemEvents();
    }

    /**
     * 预览URL
     * @param {Object} url - URL对象
     */
    async previewUrl(url) {
        this.currentUrl = url;
        this.switchUrlTab('preview');
        
        const previewUrl = this.urlPanel.querySelector('.preview-url');
        const previewStatus = this.urlPanel.querySelector('.preview-status');
        const previewContent = document.getElementById('previewContent');
        
        if (previewUrl) previewUrl.textContent = url.url;
        if (previewStatus) previewStatus.textContent = '加载中...';
        if (previewContent) previewContent.innerHTML = '<div class="loading">正在加载预览...</div>';

        try {
            const preview = await this.fetchUrlPreview(url.url);
            if (previewContent) {
                previewContent.innerHTML = preview;
            }
            if (previewStatus) {
                previewStatus.textContent = '预览成功';
            }
        } catch (error) {
            if (previewContent) {
                previewContent.innerHTML = '<div class="error">无法加载预览</div>';
            }
            if (previewStatus) {
                previewStatus.textContent = '预览失败';
            }
        }
    }

    /**
     * 获取URL预览
     * @param {string} url - URL地址
     * @returns {Promise<string>} 预览内容
     */
    async fetchUrlPreview(url) {
        try {
            const response = await fetch(`/api/url-preview?url=${encodeURIComponent(url)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                timeout: this.config.previewTimeout
            });

            if (response.ok) {
                const data = await response.json();
                return this.formatPreviewContent(data);
            } else {
                throw new Error('预览请求失败');
            }
        } catch (error) {
            // 降级到模拟预览
            return this.getMockPreview(url);
        }
    }

    /**
     * 格式化预览内容
     * @param {Object} data - 预览数据
     * @returns {string} 格式化的预览内容
     */
    formatPreviewContent(data) {
        return `
            <div class="preview-card">
                <div class="preview-header">
                    <h3>${data.title || '无标题'}</h3>
                    <p class="preview-url">${data.url}</p>
                </div>
                <div class="preview-body">
                    <p class="preview-description">${data.description || '无描述'}</p>
                    ${data.image ? `<img src="${data.image}" alt="预览图片" class="preview-image">` : ''}
                </div>
                <div class="preview-footer">
                    <span class="preview-type">${data.type || '网页'}</span>
                    <span class="preview-size">${data.size || ''}</span>
                </div>
            </div>
        `;
    }

    /**
     * 获取模拟预览
     * @param {string} url - URL地址
     * @returns {string} 模拟预览内容
     */
    getMockPreview(url) {
        const urlObj = new URL(url);
        return `
            <div class="preview-card">
                <div class="preview-header">
                    <h3>${urlObj.hostname}</h3>
                    <p class="preview-url">${url}</p>
                </div>
                <div class="preview-body">
                    <p class="preview-description">这是一个模拟的URL预览内容。</p>
                    <div class="preview-meta">
                        <span>协议: ${urlObj.protocol}</span>
                        <span>域名: ${urlObj.hostname}</span>
                        <span>路径: ${urlObj.pathname}</span>
                    </div>
                </div>
                <div class="preview-footer">
                    <span class="preview-type">网页</span>
                    <span class="preview-status">模拟预览</span>
                </div>
            </div>
        `;
    }

    /**
     * 编辑URL
     * @param {Object} url - URL对象
     */
    editUrl(url) {
        // 创建编辑对话框
        const editDialog = document.createElement('div');
        editDialog.className = 'url-edit-dialog';
        editDialog.innerHTML = `
            <div class="dialog-content">
                <h3>编辑URL</h3>
                <form id="editUrlForm">
                    <div class="form-group">
                        <label>URL地址</label>
                        <input type="url" name="url" value="${url.url}" required>
                    </div>
                    <div class="form-group">
                        <label>标题</label>
                        <input type="text" name="title" value="${url.title || ''}">
                    </div>
                    <div class="form-group">
                        <label>描述</label>
                        <textarea name="description">${url.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <select name="category">
                            <option value="general" ${url.category === 'general' ? 'selected' : ''}>通用</option>
                            <option value="work" ${url.category === 'work' ? 'selected' : ''}>工作</option>
                            <option value="personal" ${url.category === 'personal' ? 'selected' : ''}>个人</option>
                            <option value="research" ${url.category === 'research' ? 'selected' : ''}>研究</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">保存</button>
                        <button type="button" class="btn btn-secondary cancel-btn">取消</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(editDialog);

        // 绑定表单事件
        const form = editDialog.querySelector('#editUrlForm');
        const cancelBtn = editDialog.querySelector('.cancel-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            url.url = formData.get('url');
            url.title = formData.get('title');
            url.description = formData.get('description');
            url.category = formData.get('category');
            url.updatedAt = new Date().toISOString();

            this.saveUrls();
            this.renderUrlList();
            document.body.removeChild(editDialog);

            if (window.showMessage) {
                window.showMessage('URL已更新', 'success');
            }
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(editDialog);
        });
    }

    /**
     * 删除URL
     * @param {string} urlId - URL ID
     */
    deleteUrl(urlId) {
        if (confirm('确定要删除这个URL吗？')) {
            this.urls = this.urls.filter(url => url.id !== urlId);
            this.saveUrls();
            this.renderUrlList();

            if (window.showMessage) {
                window.showMessage('URL已删除', 'success');
            }
        }
    }

    /**
     * 刷新URL列表
     */
    refreshUrls() {
        this.renderUrlList();
        if (window.showMessage) {
            window.showMessage('URL列表已刷新', 'success');
        }
    }

    /**
     * 导出URL列表
     */
    exportUrls() {
        const data = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            urls: this.urls
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `urls-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (window.showMessage) {
            window.showMessage('URL列表已导出', 'success');
        }
    }

    /**
     * 导入URL列表
     */
    importUrls() {
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
                        if (data.urls && Array.isArray(data.urls)) {
                            this.urls = [...this.urls, ...data.urls];
                            this.saveUrls();
                            this.renderUrlList();

                            if (window.showMessage) {
                                window.showMessage(`已导入 ${data.urls.length} 个URL`, 'success');
                            }
                        } else {
                            throw new Error('无效的文件格式');
                        }
                    } catch (error) {
                        if (window.showMessage) {
                            window.showMessage('导入失败: ' + error.message, 'error');
                        }
                    }
                };
                reader.readAsText(file);
            }
        });

        input.click();
    }

    /**
     * 清空URL列表
     */
    clearUrls() {
        if (confirm('确定要清空所有URL吗？此操作不可恢复。')) {
            this.urls = [];
            this.saveUrls();
            this.renderUrlList();

            if (window.showMessage) {
                window.showMessage('URL列表已清空', 'success');
            }
        }
    }

    /**
     * 添加到上传队列
     * @param {Object} url - URL对象
     */
    addToUploadQueue(url) {
        this.uploadQueue.push(url);
        this.updateUploadQueue();
        this.processUploadQueue();
    }

    /**
     * 更新上传队列显示
     */
    updateUploadQueue() {
        const queueList = document.getElementById('uploadQueueList');
        if (!queueList) return;

        if (this.uploadQueue.length === 0) {
            queueList.innerHTML = '<div class="empty-queue">队列为空</div>';
            return;
        }

        const queueItems = this.uploadQueue.map(url => `
            <div class="queue-item">
                <span class="queue-url">${this.truncateUrl(url.url)}</span>
                <span class="queue-status">${url.status}</span>
            </div>
        `).join('');

        queueList.innerHTML = queueItems;
    }

    /**
     * 处理上传队列
     */
    async processUploadQueue() {
        if (this.isUploading || this.uploadQueue.length === 0) return;

        this.isUploading = true;
        const processingUrls = this.uploadQueue.splice(0, this.config.maxConcurrentUploads);

        const promises = processingUrls.map(url => this.processUrl(url));
        
        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('处理URL队列失败:', error);
        }

        this.isUploading = false;
        this.updateUploadQueue();

        // 继续处理队列
        if (this.uploadQueue.length > 0) {
            setTimeout(() => this.processUploadQueue(), 1000);
        }
    }

    /**
     * 处理单个URL
     * @param {Object} url - URL对象
     */
    async processUrl(url) {
        url.status = 'processing';
        this.updateUploadQueue();

        try {
            // 模拟URL处理
            await this.delay(2000);
            
            // 更新URL状态
            const urlIndex = this.urls.findIndex(u => u.id === url.id);
            if (urlIndex !== -1) {
                this.urls[urlIndex].status = 'active';
                this.urls[urlIndex].updatedAt = new Date().toISOString();
            }

            this.saveUrls();
            this.renderUrlList();
        } catch (error) {
            const urlIndex = this.urls.findIndex(u => u.id === url.id);
            if (urlIndex !== -1) {
                this.urls[urlIndex].status = 'error';
            }
        }
    }

    /**
     * 开始URL处理器
     */
    startUrlProcessor() {
        // 定期清理过期的URL
        setInterval(() => {
            this.cleanupUrls();
        }, 60000); // 每分钟清理一次
    }

    /**
     * 清理URL
     */
    cleanupUrls() {
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        this.urls = this.urls.filter(url => {
            const urlDate = new Date(url.createdAt);
            return urlDate > oneMonthAgo || url.status === 'active';
        });

        this.saveUrls();
    }

    /**
     * 获取状态类名
     * @param {string} status - 状态
     * @returns {string} 状态类名
     */
    getStatusClass(status) {
        const statusClasses = {
            pending: 'status-pending',
            processing: 'status-processing',
            active: 'status-active',
            inactive: 'status-inactive',
            error: 'status-error'
        };
        return statusClasses[status] || 'status-unknown';
    }

    /**
     * 获取状态文本
     * @param {string} status - 状态
     * @returns {string} 状态文本
     */
    getStatusText(status) {
        const statusTexts = {
            pending: '待处理',
            processing: '处理中',
            active: '活跃',
            inactive: '非活跃',
            error: '错误'
        };
        return statusTexts[status] || '未知';
    }

    /**
     * 截断URL显示
     * @param {string} url - URL地址
     * @returns {string} 截断后的URL
     */
    truncateUrl(url) {
        if (url.length <= 50) return url;
        return url.substring(0, 47) + '...';
    }

    /**
     * 格式化日期
     * @param {string} dateString - 日期字符串
     * @returns {string} 格式化后的日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }

    /**
     * 生成ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
                console.error('URL观察者回调执行错误:', error);
            }
        });
    }

    /**
     * 获取URL列表
     * @returns {Array} URL列表
     */
    getUrls() {
        return this.urls;
    }

    /**
     * 获取URL统计
     * @returns {Object} URL统计信息
     */
    getUrlStats() {
        const stats = {
            total: this.urls.length,
            active: this.urls.filter(url => url.status === 'active').length,
            pending: this.urls.filter(url => url.status === 'pending').length,
            processing: this.urls.filter(url => url.status === 'processing').length,
            error: this.urls.filter(url => url.status === 'error').length,
            inactive: this.urls.filter(url => url.status === 'inactive').length
        };

        return stats;
    }

    /**
     * 清理资源
     */
    destroy() {
        this.observers.clear();
        if (this.urlPanel) {
            this.urlPanel.remove();
            this.urlPanel = null;
        }
    }
}

// 全局暴露
window.UIUrlManager = UIUrlManager; 