/**
 * 文件操作模块
 * 处理文件下载、删除、搜索等操作
 */
class UIFileOperations {
    constructor() {
        this.searchTimeout = null;
        this.searchResults = [];
        this.currentSearchQuery = '';
        this.isSearching = false;
    }

    init() {
        // 初始化文件操作管理器
        // 可以在这里添加初始化逻辑
    }

    /**
     * 下载文件
     * @param {Object} file - 文件对象
     */
    async downloadFile(file) {
        try {
            // 显示下载进度
            this.showDownloadProgress(file.name);
            
            // 添加调试信息
            console.log('下载文件信息:', file);
            console.log('文件ID类型:', typeof file.id, '值:', file.id);
            
            // 获取用户ID
            let userId = null;
            
            // 方式1: 从API系统获取（最可靠）
            if (window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
                userId = window.apiSystem.getCurrentUserId();
            }
            
            // 方式2: 从localStorage获取userInfo（备用）
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
            
            // 方式3: 从认证系统获取（备用）
            if (!userId && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
                const currentUser = window.authSystem.getCurrentUser();
                userId = currentUser?.uuid || currentUser?.id;
            }
            
            // 方式4: 从localStorage获取currentUser（兼容旧版本）
            if (!userId) {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    try {
                        const user = JSON.parse(currentUser);
                        userId = user.uuid || user.id;
                    } catch (e) {
                        console.warn('解析currentUser失败:', e);
                    }
                }
            }
            
            // 方式5: 从localStorage获取user_id（兼容旧版本）
            if (!userId) {
                userId = localStorage.getItem('user_id');
            }
            
            // 方式6: 从全局变量获取
            if (!userId && window.userId) {
                userId = window.userId;
            }
            
            if (!userId) {
                throw new Error('未检测到用户ID，请重新登录');
            }
            
            // 使用API网关构建正确的URL
            let downloadUrl;
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                downloadUrl = window.apiGateway.buildUrl(`/api/files/${file.id}/download?user_id=${userId}`);
            } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                downloadUrl = window.APP_UTILS.buildApiUrl(`/api/files/${file.id}/download?user_id=${userId}`);
            } else {
                downloadUrl = `/api/files/${file.id}/download?user_id=${userId}`;
            }
            
            console.log('下载URL:', downloadUrl);
            
            const response = await fetch(downloadUrl, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status}`);
            }

            // 获取文件名
            const contentDisposition = response.headers.get('content-disposition');
            let filename = file.name;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            // 创建下载链接
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            // 隐藏下载进度
            this.hideDownloadProgress();
            
            // 显示成功消息
            this.showMessage(`文件 ${file.name} 下载成功`, 'success');
            
        } catch (error) {
            console.error('下载失败:', error);
            this.hideDownloadProgress();
            this.showMessage(`下载失败: ${error.message}`, 'error');
        }
    }

    /**
     * 显示下载进度
     * @param {string} filename - 文件名
     */
    showDownloadProgress(filename) {
        // 创建进度条
        const progressContainer = document.createElement('div');
        progressContainer.className = 'download-progress';
        progressContainer.innerHTML = `
            <div class="progress-content">
                <div class="progress-text">正在下载: ${filename}</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(progressContainer);
        
        // 添加动画效果
        setTimeout(() => {
            const progressFill = progressContainer.querySelector('.progress-fill');
            progressFill.style.width = '100%';
        }, 100);
    }

    /**
     * 隐藏下载进度
     */
    hideDownloadProgress() {
        const progressContainer = document.querySelector('.download-progress');
        if (progressContainer) {
            progressContainer.remove();
        }
    }

    /**
     * 删除文件
     * @param {Object} file - 文件对象
     * @param {Function} onSuccess - 成功回调
     */
    async deleteFile(file, onSuccess) {
        try {
            // 显示删除确认对话框
            const confirmed = await this.showConfirmDialog(
                '删除文件',
                `确定要删除文件 "${file.name}" 吗？此操作不可撤销。`
            );

            if (!confirmed) {
                return;
            }

            // 获取用户ID - 使用多种可靠的方式
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
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    try {
                        const user = JSON.parse(currentUser);
                        userId = user.uuid || user.id;
                    } catch (e) {
                        console.warn('解析currentUser失败:', e);
                    }
                }
            }
            
            // 方式5: 从localStorage获取user_id（兼容旧版本）
            if (!userId) {
                userId = localStorage.getItem('user_id');
            }
            
            // 方式6: 从全局变量获取
            if (!userId && window.userId) {
                userId = window.userId;
            }
            
            if (!userId) {
                throw new Error('用户未登录');
            }

            // 显示删除进度
            this.showDeleteProgress(file.name);

            let endpoint;
            if (file.type === 'url') {
                // URL文件使用专门的API端点
                endpoint = `/api/url-files/${file.id}`;
            } else {
                // 普通文件使用标准API端点
                endpoint = `/api/files/${file.id}`;
            }

            const response = await window.apiGateway.delete(`${endpoint}?user_id=${userId}`);

            if (!response.ok) {
                throw new Error(`删除失败: ${response.status}`);
            }

            // 隐藏进度条
            this.hideDeleteProgress();
            
            // 显示成功消息
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '文件删除成功',
                    type: 'success',
                    duration: 3000
                });
            } else {
                this.showMessage('文件删除成功', 'success');
            }
            
            // 调用成功回调
            if (onSuccess) {
                onSuccess();
            }
            
        } catch (error) {
            console.error('删除文件失败:', error);
            this.hideDeleteProgress();
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: `删除失败: ${error.message}`,
                    type: 'error',
                    duration: 4000
                });
            } else {
                this.showMessage(`删除失败: ${error.message}`, 'error');
            }
        }
    }

    /**
     * 显示删除进度
     * @param {string} filename - 文件名
     */
    showDeleteProgress(filename) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'delete-progress';
        progressContainer.innerHTML = `
            <div class="progress-content">
                <div class="progress-text">正在删除: ${filename}</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(progressContainer);
        
        setTimeout(() => {
            const progressFill = progressContainer.querySelector('.progress-fill');
            progressFill.style.width = '100%';
        }, 100);
    }

    /**
     * 隐藏删除进度
     */
    hideDeleteProgress() {
        const progressContainer = document.querySelector('.delete-progress');
        if (progressContainer) {
            progressContainer.remove();
        }
    }

    /**
     * 显示确认对话框
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @returns {Promise<boolean>} 用户选择结果
     */
    showConfirmDialog(title, message) {
        if (window.uiManager && typeof window.uiManager.showConfirmDialog === 'function') {
            return window.uiManager.showConfirmDialog(title, message);
        }
        return Promise.resolve(confirm(message));
    }

    /**
     * 搜索文件
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项
     * @returns {Promise<Array>} 搜索结果
     */
    async searchFiles(query, options = {}) {
        if (this.isSearching) {
            return this.searchResults;
        }

        this.isSearching = true;
        this.showSearchProgress();

        try {
            // 获取当前用户ID - 使用多种可靠的方式
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
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    try {
                        const user = JSON.parse(currentUser);
                        userId = user.uuid || user.id;
                    } catch (e) {
                        console.warn('解析currentUser失败:', e);
                    }
                }
            }
            
            // 方式5: 从全局变量获取
            if (!userId && window.userId) {
                userId = window.userId;
            }
            
            // 方式6: 尝试从URL参数获取
            if (!userId) {
                const urlParams = new URLSearchParams(window.location.search);
                const userIdFromUrl = urlParams.get('user_id');
                if (userIdFromUrl) {
                    userId = userIdFromUrl;
                }
            }
            
            // 方式7: 尝试从页面元素获取
            if (!userId) {
                const userElements = document.querySelectorAll('[data-user-id]');
                if (userElements.length > 0) {
                    const userIdFromElement = userElements[0].getAttribute('data-user-id');
                    if (userIdFromElement) {
                        userId = userIdFromElement;
                    }
                }
            }

            if (!userId) {
                throw new Error('无法获取用户信息');
            }

            const params = new URLSearchParams({
                q: query,
                user_id: userId,
                ...options
            });

            const response = await window.apiGateway.get(`/api/files/search?${params}`);

            if (!response.ok) {
                throw new Error(`搜索失败: ${response.status}`);
            }

            const data = await response.json();
            this.searchResults = data.files || [];
            
            // 添加调试信息
            console.log('搜索结果:', this.searchResults);
            if (this.searchResults.length > 0) {
                console.log('第一个文件的ID类型:', typeof this.searchResults[0].id, '值:', this.searchResults[0].id);
            }
            
            // 隐藏进度条
            this.hideSearchProgress();
            
            return this.searchResults;
            
        } catch (error) {
            console.error('搜索文件失败:', error);
            this.hideSearchProgress();
            this.showMessage(`搜索失败: ${error.message}`, 'error');
            return [];
        } finally {
            this.isSearching = false;
        }
    }

    /**
     * 显示搜索进度
     */
    showSearchProgress() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'search-progress';
        progressContainer.innerHTML = `
            <div class="progress-content">
                <div class="progress-text">正在搜索...</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(progressContainer);
        
        setTimeout(() => {
            const progressFill = progressContainer.querySelector('.progress-fill');
            progressFill.style.width = '100%';
        }, 100);
    }

    /**
     * 隐藏搜索进度
     */
    hideSearchProgress() {
        const progressContainer = document.querySelector('.search-progress');
        if (progressContainer) {
            progressContainer.remove();
        }
    }

    /**
     * 防抖搜索
     * @param {string} query - 搜索查询
     * @param {Function} callback - 回调函数
     * @param {number} delay - 延迟时间
     */
    debouncedSearch(query, callback, delay = 500) {
        // 清除之前的定时器
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // 设置新的定时器
        this.searchTimeout = setTimeout(async () => {
            if (query.trim()) {
                const results = await this.searchFiles(query);
                callback(results);
            } else {
                // 搜索为空时，清空搜索结果
                this.searchResults = [];
                this.currentSearchQuery = '';
                // 不调用回调函数，让调用方自己处理空搜索
            }
        }, delay);
    }

    /**
     * 批量删除文件
     * @param {Array} files - 文件列表
     * @param {Function} onSuccess - 成功回调
     */
    async batchDeleteFiles(files, onSuccess) {
        try {
            const confirmed = await this.showConfirmDialog(
                '批量删除',
                `确定要删除选中的 ${files.length} 个文件吗？此操作不可撤销。`
            );

            if (!confirmed) {
                return;
            }

            // 显示批量删除进度
            this.showBatchDeleteProgress(files.length);

            // 获取用户ID - 使用多种可靠的方式
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
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    try {
                        const user = JSON.parse(currentUser);
                        userId = user.uuid || user.id;
                    } catch (e) {
                        console.warn('解析currentUser失败:', e);
                    }
                }
            }
            
            // 方式5: 从localStorage获取user_id（兼容旧版本）
            if (!userId) {
                userId = localStorage.getItem('user_id');
            }
            
            // 方式6: 从全局变量获取
            if (!userId && window.userId) {
                userId = window.userId;
            }
            
            if (!userId) {
                throw new Error('用户未登录');
            }

            let successCount = 0;
            let errorCount = 0;

            for (const file of files) {
                try {
                    // 根据文件类型选择不同的API端点
                    let endpoint;
                    if (file.type === 'url') {
                        // URL文件使用专门的API端点
                        endpoint = `/api/url-files/${file.id}`;
                    } else {
                        // 普通文件使用标准API端点
                        endpoint = `/api/files/${file.id}`;
                    }

                    const response = await window.apiGateway.delete(`${endpoint}?user_id=${userId}`);

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            }

            // 隐藏进度条
            this.hideBatchDeleteProgress();
            
            // 显示结果消息
            if (errorCount === 0) {
                if (window.MessageBox && window.MessageBox.show) {
                    window.MessageBox.show({
                        message: `批量删除成功，共删除 ${successCount} 个文件`,
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    this.showMessage(`批量删除成功，共删除 ${successCount} 个文件`, 'success');
                }
            } else if (successCount === 0) {
                if (window.MessageBox && window.MessageBox.show) {
                    window.MessageBox.show({
                        message: `批量删除失败，共 ${errorCount} 个文件删除失败`,
                        type: 'error',
                        duration: 4000
                    });
                } else {
                    this.showMessage(`批量删除失败，共 ${errorCount} 个文件删除失败`, 'error');
                }
            } else {
                if (window.MessageBox && window.MessageBox.show) {
                    window.MessageBox.show({
                        message: `批量删除完成，成功 ${successCount} 个，失败 ${errorCount} 个`,
                        type: 'warning',
                        duration: 4000
                    });
                } else {
                    this.showMessage(`批量删除完成，成功 ${successCount} 个，失败 ${errorCount} 个`, 'warning');
                }
            }
            
            // 调用成功回调
            if (onSuccess) {
                onSuccess();
            }
            
        } catch (error) {
            console.error('批量删除文件失败:', error);
            this.hideBatchDeleteProgress();
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: `批量删除失败: ${error.message}`,
                    type: 'error',
                    duration: 4000
                });
            } else {
                this.showMessage(`批量删除失败: ${error.message}`, 'error');
            }
        }
    }

    /**
     * 显示批量删除进度
     * @param {number} total - 总文件数
     */
    showBatchDeleteProgress(total) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'batch-delete-progress';
        progressContainer.innerHTML = `
            <div class="progress-content">
                <div class="progress-text">正在批量删除文件 (0/${total})</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(progressContainer);
    }

    /**
     * 隐藏批量删除进度
     */
    hideBatchDeleteProgress() {
        const progressContainer = document.querySelector('.batch-delete-progress');
        if (progressContainer) {
            progressContainer.remove();
        }
    }

    /**
     * 获取文件统计信息
     * @returns {Promise<Object>} 统计信息
     */
    async getFileStats() {
        try {
            // 由于后端没有实现 /api/files/stats 端点，返回模拟数据
            const mockStats = {
                totalFiles: 156,
                totalSize: '2.5 GB',
                fileTypes: {
                    'image': 45,
                    'document': 67,
                    'video': 12,
                    'audio': 8,
                    'other': 24
                },
                recentUploads: 8,
                storageUsed: '2.5 GB',
                storageLimit: '10 GB'
            };

            return mockStats;
            
        } catch (error) {
            console.error('获取文件统计失败:', error);
            this.showMessage(`获取统计信息失败: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    showMessage(message, type = 'info') {
        if (window.uiManager && window.uiManager.showMessage) {
            window.uiManager.showMessage(message, type);
        } else {
            // 降级处理：如果其他消息系统不可用，静默处理
        }
    }

    /**
     * 初始化搜索框
     * @param {string} searchInputSelector - 搜索输入框选择器
     * @param {Function} onSearchResults - 搜索结果回调
     */
    initSearchBox(searchInputSelector, onSearchResults) {
        const searchInput = document.querySelector(searchInputSelector);
        if (!searchInput) return;

        // 获取已存在的清空按钮
        const clearButton = document.querySelector('#search-clear-btn');
        if (!clearButton) return;

        // 监听输入事件
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // 显示/隐藏清空按钮
            if (query.length > 0) {
                clearButton.classList.remove('hidden');
            } else {
                clearButton.classList.add('hidden');
            }
            
            // 防抖搜索，0.5秒延迟
            this.debouncedSearch(query, onSearchResults, 500);
        });

        // 清空按钮点击事件
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.classList.add('hidden');
            this.clearSearch();
            // 还原完整文件列表
            if (onSearchResults) {
                onSearchResults([]);
            }
        });

        // 添加搜索图标点击事件
        const searchIcon = searchInput.parentElement?.querySelector('.fa-search');
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                const query = searchInput.value.trim();
                this.debouncedSearch(query, onSearchResults, 0); // 立即搜索
            });
        }

        // 回车键搜索
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                this.debouncedSearch(query, onSearchResults, 0); // 立即搜索
            }
        });
    }

    /**
     * 清除搜索
     */
    clearSearch() {
        this.currentSearchQuery = '';
        this.searchResults = [];
        
        // 清除搜索输入框
        const searchInputs = document.querySelectorAll('input[type="search"], .search-input, #search-input');
        searchInputs.forEach(input => {
            input.value = '';
        });

        // 隐藏清空按钮
        const clearButton = document.querySelector('#search-clear-btn');
        if (clearButton) {
            clearButton.classList.add('hidden');
        }

        // 清除搜索超时
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }
    }

    /**
     * 获取当前搜索结果
     * @returns {Array} 搜索结果
     */
    getSearchResults() {
        return this.searchResults;
    }

    /**
     * 获取当前搜索查询
     * @returns {string} 搜索查询
     */
    getCurrentSearchQuery() {
        return this.currentSearchQuery;
    }

    /**
     * 检查是否正在搜索
     * @returns {boolean} 是否正在搜索
     */
    isCurrentlySearching() {
        return this.isSearching;
    }
}

// 全局暴露
window.UIFileOperations = UIFileOperations; 