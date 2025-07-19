/**
 * 上传管理模块
 * 处理文件上传、拖拽上传、上传区域管理等功能
 */
class UIUploadManager {
    constructor() {
        this.uploadArea = null;
        this.fileInput = null;
        this.isDragOver = false;
        this.uploadQueue = [];
        this.isUploading = false;
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.allowedTypes = [
            'image/*',
            'video/*',
            'audio/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/*'
        ];
        this.uploadProgress = {};
    }

    /**
     * 初始化上传管理器
     * @param {string} uploadAreaSelector - 上传区域选择器
     * @param {string} fileInputSelector - 文件输入框选择器
     */
    init(uploadAreaSelector = '#uploadArea', fileInputSelector = '#fileInput') {
        this.uploadArea = document.querySelector(uploadAreaSelector);
        this.fileInput = document.querySelector(fileInputSelector);
        
        if (this.uploadArea) {
            this.setupUploadArea();
        }
        
        if (this.fileInput) {
            this.setupFileInput();
        }
        
        this.setupGlobalUploadHandlers();
    }

    /**
     * 设置上传区域
     */
    setupUploadArea() {
        if (!this.uploadArea) return;

        // 拖拽事件
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver(e);
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.handleDragLeave(e);
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
        });

        // 点击上传
        this.uploadArea.addEventListener('click', () => {
            this.triggerFileInput();
        });

        // 显示上传区域
        this.showUploadArea();
    }

    /**
     * 设置文件输入框
     */
    setupFileInput() {
        if (!this.fileInput) return;

        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // 支持多文件选择
        this.updateFileInputMultiple();
    }

    /**
     * 设置全局上传处理器
     */
    setupGlobalUploadHandlers() {
        // 监听全局拖拽事件
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            // 检查是否在页面上拖拽文件
            if (e.dataTransfer.files.length > 0) {
                this.handleGlobalDrop(e);
            }
        });
    }

    /**
     * 处理拖拽悬停
     * @param {DragEvent} e - 拖拽事件
     */
    handleDragOver(e) {
        e.preventDefault();
        if (!this.isDragOver) {
            this.isDragOver = true;
            this.uploadArea.classList.add('drag-over');
        }
    }

    /**
     * 处理拖拽离开
     * @param {DragEvent} e - 拖拽事件
     */
    handleDragLeave(e) {
        e.preventDefault();
        // 检查是否真的离开了上传区域
        if (!this.uploadArea.contains(e.relatedTarget)) {
            this.isDragOver = false;
            this.uploadArea.classList.remove('drag-over');
        }
    }

    /**
     * 处理文件拖拽放置
     * @param {DragEvent} e - 拖拽事件
     */
    handleDrop(e) {
        e.preventDefault();
        this.isDragOver = false;
        this.uploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    }

    /**
     * 处理全局文件拖拽
     * @param {DragEvent} e - 拖拽事件
     */
    handleGlobalDrop(e) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        
        // 显示上传区域并处理文件
        this.showUploadArea();
        this.handleFiles(files);
    }

    /**
     * 处理文件选择
     * @param {Event} e - 文件选择事件
     */
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
        
        // 清空文件输入框，允许重复选择相同文件
        e.target.value = '';
    }

    /**
     * 处理文件列表
     * @param {File[]} files - 文件列表
     */
    handleFiles(files) {
        if (files.length === 0) return;

        // 验证文件
        const validFiles = files.filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showMessage('没有有效的文件可以上传', 'warning');
            return;
        }

        // 添加到上传队列
        this.addToUploadQueue(validFiles);
        
        // 开始上传
        this.processUploadQueue();
    }

    /**
     * 验证文件
     * @param {File} file - 文件对象
     * @returns {boolean} 是否有效
     */
    validateFile(file) {
        // 检查文件大小
        if (file.size > this.maxFileSize) {
            this.showMessage(`文件 ${file.name} 超过最大大小限制 (100MB)`, 'error');
            return false;
        }

        // 检查文件类型
        const isValidType = this.allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });

        if (!isValidType) {
            this.showMessage(`不支持的文件类型: ${file.name}`, 'error');
            return false;
        }

        return true;
    }

    /**
     * 添加到上传队列
     * @param {File[]} files - 文件列表
     */
    addToUploadQueue(files) {
        files.forEach(file => {
            this.uploadQueue.push({
                file: file,
                id: this.generateFileId(),
                status: 'pending',
                progress: 0
            });
        });

        this.updateUploadQueueDisplay();
    }

    /**
     * 处理上传队列
     */
    async processUploadQueue() {
        if (this.isUploading || this.uploadQueue.length === 0) return;

        this.isUploading = true;
        this.showUploadProgress();

        for (let i = 0; i < this.uploadQueue.length; i++) {
            const item = this.uploadQueue[i];
            if (item.status === 'pending') {
                await this.uploadFile(item);
            }
        }

        this.isUploading = false;
        this.hideUploadProgress();
        this.clearUploadQueue();
    }

    /**
     * 上传单个文件
     * @param {Object} item - 上传队列项
     */
    async uploadFile(item) {
        try {
            item.status = 'uploading';
            this.updateUploadQueueDisplay();

            const formData = new FormData();
            formData.append('file', item.file);

            const xhr = new XMLHttpRequest();

            // 进度监听
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    item.progress = Math.round((e.loaded / e.total) * 100);
                    this.updateUploadProgress(item);
                }
            });

            // 完成监听
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    item.status = 'completed';
                    this.showMessage(`文件 ${item.file.name} 上传成功`, 'success');
                } else {
                    item.status = 'failed';
                    this.showMessage(`文件 ${item.file.name} 上传失败`, 'error');
                }
                this.updateUploadQueueDisplay();
            });

            // 错误监听
            xhr.addEventListener('error', () => {
                item.status = 'failed';
                this.showMessage(`文件 ${item.file.name} 上传失败`, 'error');
                this.updateUploadQueueDisplay();
            });

            // 发送请求
            xhr.open('POST', '/api/files/upload');
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
            xhr.send(formData);

        } catch (error) {
            console.error('上传文件失败:', error);
            item.status = 'failed';
            this.showMessage(`文件 ${item.file.name} 上传失败: ${error.message}`, 'error');
            this.updateUploadQueueDisplay();
        }
    }

    /**
     * 显示上传区域
     */
    showUploadArea() {
        if (this.uploadArea) {
            this.uploadArea.style.display = 'block';
            this.updateUploadAreaHint();
        }
    }

    /**
     * 隐藏上传区域
     */
    hideUploadArea() {
        if (this.uploadArea) {
            this.uploadArea.style.display = 'none';
        }
    }

    /**
     * 触发文件输入框
     */
    triggerFileInput() {
        if (this.fileInput) {
            this.fileInput.click();
        }
    }

    /**
     * 更新文件输入框多选设置
     */
    updateFileInputMultiple() {
        if (this.fileInput) {
            this.fileInput.multiple = true;
            this.fileInput.accept = this.allowedTypes.join(',');
        }
    }

    /**
     * 更新上传区域提示
     */
    updateUploadAreaHint() {
        if (!this.uploadArea) return;

        const hintElement = this.uploadArea.querySelector('.upload-hint');
        if (hintElement) {
            const queueCount = this.uploadQueue.length;
            if (queueCount > 0) {
                hintElement.textContent = `准备上传 ${queueCount} 个文件`;
            } else {
                hintElement.textContent = '点击或拖拽文件到此处上传';
            }
        }
    }

    /**
     * 显示上传进度
     */
    showUploadProgress() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'upload-progress-container';
        progressContainer.innerHTML = `
            <div class="upload-progress">
                <div class="upload-progress-header">
                    <h3>文件上传中...</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="upload-queue"></div>
            </div>
        `;

        document.body.appendChild(progressContainer);

        // 关闭按钮事件
        const closeBtn = progressContainer.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            this.hideUploadProgress();
        });
    }

    /**
     * 隐藏上传进度
     */
    hideUploadProgress() {
        const progressContainer = document.querySelector('.upload-progress-container');
        if (progressContainer) {
            progressContainer.remove();
        }
    }

    /**
     * 更新上传队列显示
     */
    updateUploadQueueDisplay() {
        const queueContainer = document.querySelector('.upload-queue');
        if (!queueContainer) return;

        queueContainer.innerHTML = this.uploadQueue.map(item => `
            <div class="upload-item ${item.status}">
                <div class="upload-item-info">
                    <div class="upload-item-name">${item.file.name}</div>
                    <div class="upload-item-size">${this.formatFileSize(item.file.size)}</div>
                </div>
                <div class="upload-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                    </div>
                    <div class="progress-text">${item.progress}%</div>
                </div>
                <div class="upload-item-status">
                    ${this.getStatusText(item.status)}
                </div>
            </div>
        `).join('');

        this.updateUploadAreaHint();
    }

    /**
     * 更新上传进度
     * @param {Object} item - 上传队列项
     */
    updateUploadProgress(item) {
        const progressFill = document.querySelector(`[data-file-id="${item.id}"] .progress-fill`);
        if (progressFill) {
            progressFill.style.width = `${item.progress}%`;
        }
    }

    /**
     * 清除上传队列
     */
    clearUploadQueue() {
        this.uploadQueue = [];
        this.updateUploadQueueDisplay();
    }

    /**
     * 生成文件ID
     * @returns {string} 文件ID
     */
    generateFileId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化的大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取状态文本
     * @param {string} status - 状态
     * @returns {string} 状态文本
     */
    getStatusText(status) {
        const statusMap = {
            'pending': '等待中',
            'uploading': '上传中',
            'completed': '已完成',
            'failed': '失败'
        };
        return statusMap[status] || status;
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
     * 设置最大文件大小
     * @param {number} size - 文件大小（字节）
     */
    setMaxFileSize(size) {
        this.maxFileSize = size;
    }

    /**
     * 设置允许的文件类型
     * @param {string[]} types - 文件类型列表
     */
    setAllowedTypes(types) {
        this.allowedTypes = types;
        this.updateFileInputMultiple();
    }

    /**
     * 获取上传队列
     * @returns {Array} 上传队列
     */
    getUploadQueue() {
        return this.uploadQueue;
    }

    /**
     * 检查是否正在上传
     * @returns {boolean} 是否正在上传
     */
    isCurrentlyUploading() {
        return this.isUploading;
    }

    /**
     * 取消上传
     * @param {string} fileId - 文件ID
     */
    cancelUpload(fileId) {
        const item = this.uploadQueue.find(item => item.id === fileId);
        if (item && item.status === 'uploading') {
            item.status = 'cancelled';
            this.updateUploadQueueDisplay();
        }
    }

    /**
     * 重试上传
     * @param {string} fileId - 文件ID
     */
    retryUpload(fileId) {
        const item = this.uploadQueue.find(item => item.id === fileId);
        if (item && item.status === 'failed') {
            item.status = 'pending';
            item.progress = 0;
            this.updateUploadQueueDisplay();
            this.processUploadQueue();
        }
    }
}

// 全局暴露
window.UIUploadManager = UIUploadManager; 