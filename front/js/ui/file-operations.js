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

    /**
     * 下载文件
     * @param {Object} file - 文件对象
     */
    async downloadFile(file) {
        try {
            // 显示下载进度
            this.showDownloadProgress(file.name);
            
            const response = await fetch(`/api/files/${file.id}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
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

            // 隐藏进度条
            this.hideDownloadProgress();
            
            // 显示成功消息
            this.showMessage('下载成功', 'success');
            
        } catch (error) {
            console.error('下载文件失败:', error);
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
            // 显示确认对话框
            const confirmed = await this.showConfirmDialog(
                '确认删除',
                `确定要删除文件 "${file.name}" 吗？此操作不可撤销。`
            );

            if (!confirmed) {
                return;
            }

            // 显示删除进度
            this.showDeleteProgress(file.name);

            const response = await fetch(`/api/files/${file.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`删除失败: ${response.status}`);
            }

            // 隐藏进度条
            this.hideDeleteProgress();
            
            // 显示成功消息
            this.showMessage('文件删除成功', 'success');
            
            // 调用成功回调
            if (onSuccess) {
                onSuccess();
            }
            
        } catch (error) {
            console.error('删除文件失败:', error);
            this.hideDeleteProgress();
            this.showMessage(`删除失败: ${error.message}`, 'error');
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
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay confirm-dialog';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-btn">取消</button>
                        <button class="btn btn-danger confirm-btn">确认删除</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // 事件监听
            const closeBtn = modal.querySelector('.close-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const confirmBtn = modal.querySelector('.confirm-btn');

            const closeModal = (result) => {
                modal.remove();
                resolve(result);
            };

            closeBtn.addEventListener('click', () => closeModal(false));
            cancelBtn.addEventListener('click', () => closeModal(false));
            confirmBtn.addEventListener('click', () => closeModal(true));

            // 点击遮罩关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(false);
                }
            });

            // ESC键关闭
            document.addEventListener('keydown', function escHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escHandler);
                    closeModal(false);
                }
            });
        });
    }

    /**
     * 搜索文件
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项
     * @returns {Promise<Array>} 搜索结果
     */
    async searchFiles(query, options = {}) {
        try {
            this.isSearching = true;
            this.currentSearchQuery = query;
            
            // 显示搜索进度
            this.showSearchProgress();

            const params = new URLSearchParams({
                q: query,
                ...options
            });

            const response = await fetch(`/api/files/search?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`搜索失败: ${response.status}`);
            }

            const data = await response.json();
            this.searchResults = data.files || [];
            
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
    debouncedSearch(query, callback, delay = 300) {
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
                callback([]);
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
                '批量删除确认',
                `确定要删除选中的 ${files.length} 个文件吗？此操作不可撤销。`
            );

            if (!confirmed) {
                return;
            }

            // 显示批量删除进度
            this.showBatchDeleteProgress(files.length);

            const deletePromises = files.map(file => 
                fetch(`/api/files/${file.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            );

            const results = await Promise.allSettled(deletePromises);
            
            // 统计结果
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
            const failed = results.length - successful;

            // 隐藏进度条
            this.hideBatchDeleteProgress();
            
            // 显示结果消息
            if (failed === 0) {
                this.showMessage(`成功删除 ${successful} 个文件`, 'success');
            } else {
                this.showMessage(`删除完成: ${successful} 个成功, ${failed} 个失败`, 'warning');
            }
            
            // 调用成功回调
            if (onSuccess) {
                onSuccess();
            }
            
        } catch (error) {
            console.error('批量删除失败:', error);
            this.hideBatchDeleteProgress();
            this.showMessage(`批量删除失败: ${error.message}`, 'error');
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
            const response = await fetch('/api/files/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`获取统计信息失败: ${response.status}`);
            }

            return await response.json();
            
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
        // 使用全局消息系统
        if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
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

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.debouncedSearch(query, onSearchResults);
        });

        // 添加搜索图标点击事件
        const searchIcon = searchInput.parentElement?.querySelector('.search-icon');
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
        const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
        searchInputs.forEach(input => {
            input.value = '';
        });
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