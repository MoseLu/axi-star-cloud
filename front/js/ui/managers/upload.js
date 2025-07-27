/**
 * 上传管理模块
 * 处理文件上传、拖拽上传、上传区域管理等功能
 */
class UIUploadManager {
    constructor(uiManager = null) {
        this.uiManager = uiManager;
        this.uploadArea = null;
        this.fileInput = null;
        this.isDragOver = false;
        this.uploadQueue = [];
        this.isUploading = false;
        this.maxFileSize = 20 * 1024 * 1024; // 20MB
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
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        this.uploadProgress = {};
        this.previewFiles = null; // 新增：存储预览文件
        this.lastValidationFailedAt = null; // 新增：记录最近一次验证失败的时间
        
        // 初始化上传队列管理器
        this.queueManager = new UploadQueueManager();
        this.currentUserID = null;
        
        // 设置全局引用
        window.uploadManager = this;
        
        this.init();
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
        
        // 初始化时设置默认状态
        this.resetUploadUIToDefault();
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
    async handleDrop(e) {
        e.preventDefault();
        this.isDragOver = false;
        this.uploadArea.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        
        // 无论什么分类，都根据拖拽的文件类型自动调整UI
        await this.autoAdjustUploadUI(files);
        
        // 阻止事件冒泡，避免触发全局拖拽处理
        e.stopPropagation();
    }

    /**
     * 处理全局文件拖拽
     * @param {DragEvent} e - 拖拽事件
     */
    async handleGlobalDrop(e) {
        e.preventDefault();
        
        // 检查是否在上传区域内，如果是则不处理（避免重复）
        if (this.uploadArea && this.uploadArea.contains(e.target)) {
            return;
        }
        
        const files = Array.from(e.dataTransfer.files);
        
        // 无论什么分类，都根据拖拽的文件类型自动调整UI
        await this.autoAdjustUploadUI(files);
    }

    /**
     * 处理文件选择
     * @param {Event} e - 文件选择事件
     */
    async handleFileSelect(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        // 无论什么分类，都根据选择的文件类型自动调整UI
        await this.autoAdjustUploadUI(files);
        // 不立即开始上传，等待用户点击上传按钮
        
        e.target.value = '';
    }

    /**
     * 只添加文件到队列，不自动上传
     * @param {File[]} files - 文件列表
     * @param {boolean} showQueueTip - 是否显示队列提示
     */
    async addFilesToQueue(files, showQueueTip = true) {
        if (files.length === 0) return;

        // 只添加未在队列中的文件
        const newFiles = files.filter(file => {
            return !this.uploadQueue.some(item => item.file.name === file.name && item.file.size === file.size);
        });

        // 异步验证文件
        const validFiles = [];
        
        for (const file of newFiles) {
            const isValid = await this.validateFile(file);
            if (isValid) {
                validFiles.push(file);
            }
            // 如果验证失败，validateFile已经显示了相应的错误提示，不需要额外处理
        }
        
        if (validFiles.length === 0) {
            // 如果所有文件都验证失败，不显示额外的提示（因为validateFile已经显示了具体原因）
            return;
        }

        // 添加到上传队列
        this.addToUploadQueue(validFiles);
        
        if (showQueueTip) {
        this.showMessage(`已添加 ${validFiles.length} 个文件到上传队列，请点击上传按钮开始上传`, 'info');
        }
    }

    /**
     * 处理文件列表（立即上传）
     * @param {File[]} files - 文件列表
     */
    async handleFiles(files) {
        if (files.length === 0) return;

        // 获取当前用户ID - 使用最可靠的方式
        let currentUserID = null;
        
        // 方式1: 从API系统获取（最可靠）
        if (window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
            currentUserID = window.apiSystem.getCurrentUserId();
        }
        
        // 方式2: 从localStorage获取userInfo（备用）
        if (!currentUserID) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    currentUserID = user.uuid || user.id;
                } catch (e) {
                    console.warn('解析userInfo失败:', e);
                }
            }
        }
        
        // 方式3: 从认证系统获取（备用）
        if (!currentUserID && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
            const currentUser = window.authSystem.getCurrentUser();
            currentUserID = currentUser?.uuid || currentUser?.id;
        }

        if (!currentUserID) {
            console.error('无法获取用户ID');
            this.showMessage('用户未登录，无法上传文件', 'error');
            return;
        }

        this.currentUserID = currentUserID;

        // 验证文件
        const validFiles = [];
        for (const file of files) {
            const isValid = await this.validateFile(file);
            if (isValid) {
                validFiles.push(file);
            }
            // 如果验证失败，validateFile已经显示了相应的错误提示，不需要额外处理
        }
        
        if (validFiles.length === 0) {
            // 如果所有文件都验证失败，不显示额外的提示（因为validateFile已经显示了具体原因）
            return;
        }

        // 如果已经在上传中，阻止重复上传
        if (this.isUploading) {
            this.showMessage('请等待当前上传完成后再试', 'warning');
            return;
        }

        // 检查是否有活跃的上传任务
        if (this.uploadQueue.length > 0 && this.uploadQueue.some(item => item.status === 'uploading')) {
            this.showMessage('请等待当前上传完成后再试', 'warning');
            return;
        }

        // 为每个文件创建上传任务
        for (const file of validFiles) {
            try {
                const taskID = await this.queueManager.createTask(
                    this.currentUserID, 
                    file.name, 
                    file.size
                );
                
                // 将任务ID添加到文件对象
                file.taskID = taskID;
            } catch (error) {
                console.error('创建上传任务失败:', error);
                this.showMessage(`创建上传任务失败: ${file.name}`, 'error');
                continue;
            }
        }

        // 添加到上传队列
        this.addToUploadQueue(validFiles);
    }

    /**
     * 验证文件
     * @param {File} file - 文件对象
     * @returns {boolean} 是否有效
     */
    /**
     * 验证文件
     * @param {File} file - 文件对象
     * @returns {Promise<boolean>} 验证结果
     */
    async validateFile(file) {
        // 检查文件类型
        const isValidType = this.allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        });

        if (!isValidType) {
            this.showMessage(`不支持的文件类型: ${file.name}`, 'error');
            this.lastValidationFailedAt = Date.now();
            return false;
        }

        // 根据文件类型检查大小限制
        let maxSize = this.maxFileSize; // 默认20MB
        let sizeLimitText = '20MB';

        // 视频文件限制为50MB
        if (file.type.startsWith('video/')) {
            maxSize = 50 * 1024 * 1024; // 50MB
            sizeLimitText = '50MB';
        }

        // 检查文件大小
        if (file.size > maxSize) {
            this.showMessage(`文件 ${file.name} 超过最大大小限制 (${sizeLimitText})`, 'error');
            this.lastValidationFailedAt = Date.now();
            return false;
        }

        // 注意：重复文件检查已移除，由后端处理同名文件逻辑
        // 后端会根据文件大小差异决定是否允许上传或需要确认替换

        return true;
    }

    /**
     * 添加到上传队列
     * @param {File[]} files - 文件列表
     */
    addToUploadQueue(files) {
        files.forEach(async file => {
            // 检查文件是否已经存在于队列中
            const isDuplicate = this.uploadQueue.some(item => 
                item.file.name === file.name && 
                item.file.size === file.size &&
                item.file.lastModified === file.lastModified
            );
            
            if (!isDuplicate) {
                const item = {
                    file: file,
                    id: this.generateFileId(),
                    status: 'pending',
                    progress: 0
                };
                
                // 视频文件生成缩略图
                if (file.type.startsWith('video/')) {
                    try {
                        const thumbnail = await this.generateVideoThumbnail(file);
                        item.thumbnail = thumbnail;
                    } catch (error) {
                        console.error(`视频缩略图生成失败: ${file.name}`, error);
                        item.thumbnail = null;
            }
                }
                
                this.uploadQueue.push(item);
        this.updateUploadQueueDisplay();
            }
        });
    }

    // 新增：生成视频缩略图（返回Promise<dataURL>）
    generateVideoThumbnail(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.src = URL.createObjectURL(file);
            video.currentTime = 1; // 抽第1秒帧
            video.onloadeddata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(video.src);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            video.onerror = () => {
                resolve(null); // 失败时返回null
            };
        });
    }

    /**
     * 处理上传队列
     */
    async processUploadQueue() {
        if (this.isUploading || this.uploadQueue.length === 0) return;


        this.isUploading = true;
        
        // 区分单个文件和批量上传
        const isSingleFile = this.uploadQueue.length === 1;
        
        // 显示进度条（包括单个文件上传）
        this.showUploadProgress();
        
        // 如果是单个文件，直接上传
        if (isSingleFile) {
            const item = this.uploadQueue[0];
            try {
                await this.uploadFile(item, true);
                
                // 根据结果显示消息（成功消息由handleUploadSuccess处理）
                if (item.status === 'failed') {
                    this.showMessage('文件上传失败', 'error');
                }
            } catch (error) {
                console.error('单个文件上传失败:', error);
                this.showMessage('文件上传失败', 'error');
            } finally {
                this.isUploading = false;
                this.hideUploadProgress();
                this.clearUploadQueue();
            }
        } else {
            // 批量上传处理 - 使用新的批量上传API
            try {
                await this.uploadFilesBatch();
            } catch (error) {
                console.error('批量上传失败:', error);
                this.showMessage('批量上传失败', 'error');
            } finally {
                this.isUploading = false;
                this.hideUploadProgress();
                this.clearUploadQueue();
            }
        }
    }

    /**
     * 批量上传文件
     */
    async uploadFilesBatch() {
        try {
            // 获取用户ID
            let userId = null;
            
            // 方式1: 使用已保存的currentUserID
            if (this.currentUserID) {
                userId = this.currentUserID;
            }
            
            // 方式2: 从API系统获取（最可靠）
            if (!userId && window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
                userId = window.apiSystem.getCurrentUserId();
            }
            
            // 方式3: 从localStorage获取userInfo（备用）
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
            
            // 方式4: 从认证系统获取（备用）
            if (!userId && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
                const currentUser = window.authSystem.getCurrentUser();
                userId = currentUser?.uuid || currentUser?.id;
            }
            
            if (!userId) {
                console.error('无法获取用户ID');
                this.showMessage('未检测到用户ID，无法上传！请重新登录', 'error');
                return;
            }

            // 创建FormData
            const formData = new FormData();
            
            // 添加所有文件
            for (const item of this.uploadQueue) {
                if (item.status === 'pending') {
                    formData.append('files', item.file);
                }
            }
            
            formData.append('user_id', userId);

            // 如果有当前文件夹ID，也发送
            if (this.uiManager && this.uiManager.currentFolderId) {
                formData.append('folder_id', this.uiManager.currentFolderId);
            }

            // 创建XHR请求
            const xhr = new XMLHttpRequest();
            const uploadUrl = '/api/upload/batch';
                
            // 设置超时
            xhr.timeout = 300000; // 5分钟

            // 进度处理
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    // 更新所有待上传文件的进度
                    for (const item of this.uploadQueue) {
                        if (item.status === 'pending') {
                            item.progress = progress;
                        }
                    }
                    this.updateUploadSummary();
                }
            });

            // 请求完成处理
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            this.handleBatchUploadSuccess(response);
                        } else {
                            this.handleBatchUploadError(response.error || '批量上传失败');
                        }
                    } catch (error) {
                        this.handleBatchUploadError('解析响应失败');
                    }
                } else {
                    this.handleBatchUploadError(`HTTP错误: ${xhr.status}`);
                }
            });

            // 错误处理
            xhr.addEventListener('error', () => {
                this.handleBatchUploadError('网络错误');
            });

            // 超时处理
            xhr.addEventListener('timeout', () => {
                this.handleBatchUploadError('上传超时');
            });

            // 发送请求
            xhr.open('POST', uploadUrl);
            xhr.send(formData);

        } catch (error) {
            console.error('批量上传请求创建失败:', error);
            this.handleBatchUploadError('创建上传请求失败');
        }
    }

    /**
     * 处理批量上传成功
     */
    handleBatchUploadSuccess(response) {
        
        // 更新队列中所有文件的状态
        for (const item of this.uploadQueue) {
            if (item.status === 'pending') {
                // 查找对应的结果
                const result = response.results.find(r => r.filename === item.file.name);
                if (result && result.success) {
                    item.status = 'completed';
                    item.progress = 100;
                } else {
                    item.status = 'failed';
                    item.error = result ? result.error : '上传失败';
                }
            }
        }

        // 显示批量上传结果消息
        this.showMessage(response.message, response.failed_count > 0 ? 'warning' : 'success');

        // 刷新文件列表和存储空间 - 增加延迟确保后端处理完成
        if (response.success_count > 0) {
            setTimeout(async () => {
                try {
                    await this.refreshFileListAndStorage();
                } catch (error) {
                    console.error('❌ 批量上传后刷新文件列表失败:', error);
                    // 如果刷新失败，尝试直接刷新
                    setTimeout(async () => {
                        try {
                            await this.refreshFileListDirect();
                        } catch (retryError) {
                            console.error('❌ 批量上传后直接刷新文件列表也失败:', retryError);
                        }
                    }, 1000);
                }
            }, 1000); // 增加到1秒延迟
        }

        // 更新上传队列显示
        this.updateUploadQueueDisplay();
    }

    /**
     * 处理批量上传错误
     */
    handleBatchUploadError(error) {
        console.error('批量上传失败:', error);
        
        // 将所有待上传文件标记为失败
        for (const item of this.uploadQueue) {
            if (item.status === 'pending') {
                item.status = 'failed';
                item.error = error;
            }
        }

        this.showMessage(`批量上传失败: ${error}`, 'error');
        this.updateUploadQueueDisplay();
    }

    /**
     * 上传单个文件
     * @param {Object} item - 上传队列项
     * @param {boolean} isSingleFile - 是否为单个文件上传
     */
    async uploadFile(item, isSingleFile = false) {
        try {
            // 更新状态
            item.status = 'uploading';
            this.updateUploadQueueDisplay();
            this.updateUploadProgress(item);

            // 创建FormData
            const formData = new FormData();
            // 添加文件数据
            formData.append('file', item.file);
            
            // 获取用户ID - 使用最可靠的方式
            let userId = null;
            
            // 方式1: 使用已保存的currentUserID
            if (this.currentUserID) {
                userId = this.currentUserID;
            }
            
            // 方式2: 从API系统获取（最可靠）
            if (!userId && window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
                userId = window.apiSystem.getCurrentUserId();
            }
            
            // 方式3: 从localStorage获取userInfo（备用）
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
            
            // 方式4: 从认证系统获取（备用）
            if (!userId && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
                const currentUser = window.authSystem.getCurrentUser();
                userId = currentUser?.uuid || currentUser?.id;
            }
            
            if (!userId) {
                console.error('无法获取用户ID');
                // 只在单个文件上传时显示错误消息，批量上传时由processUploadQueue统一处理
                if (this.uploadQueue.length === 1) {
                    this.showMessage('未检测到用户ID，无法上传！请重新登录', 'error');
                }
                return;
            }
            
            formData.append('user_id', userId);

            // 如果是视频文件且有缩略图，将缩略图数据也发送到后端
            if (item.file.type.startsWith('video/') && item.thumbnail) {
                formData.append('thumbnail', item.thumbnail);
            }

            // 如果有当前文件夹ID，也发送
            if (this.uiManager && this.uiManager.currentFolderId) {
                formData.append('folder_id', this.uiManager.currentFolderId);
            }

            // 添加确认替换参数
            if (item.confirmReplace) {
                formData.append('confirm_replace', 'true');
            }

            // 创建XHR请求
            const xhr = new XMLHttpRequest();
            const uploadUrl = '/api/upload';
                
            // 设置超时
            xhr.timeout = 300000; // 5分钟

            // 进度处理
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    item.progress = progress;
                    this.updateUploadProgress(item);
                    this.updateUploadSummary();
                }
            });

            // 请求完成处理
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            this.handleUploadSuccess(item, response);
                        } else {
                            // 处理同名文件冲突 - 不显示控制台错误
                            if (response.conflict_type === 'duplicate_same_size') {
                                // 同名同大小文件，直接显示错误
                                this.handleUploadError(item, response.message || '文件已存在');
                            } else if (response.conflict_type === 'duplicate_different_size') {
                                // 需要二次确认
                                this.handleDuplicateFileConfirmation(item, response);
                            } else {
                                // 其他错误
                                this.handleUploadError(item, response.error || '上传失败');
                            }
                        }
                    } catch (error) {
                        this.handleUploadError(item, '解析响应失败');
                    }
                } else {
                    this.handleUploadError(item, `HTTP错误: ${xhr.status}`);
                }
            });

            // 错误处理
            xhr.addEventListener('error', () => {
                this.handleUploadError(item, '网络错误');
            });

            // 超时处理
            xhr.addEventListener('timeout', () => {
                this.handleUploadError(item, '上传超时');
            });

            // 发送请求
            xhr.open('POST', uploadUrl);
            xhr.send(formData);

        } catch (error) {
            this.handleUploadError(item, error.message || '上传失败');
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
        // 检查是否已经存在进度条，避免重复显示
        const existingProgress = document.querySelector('.fixed.inset-0.z-50');
        if (existingProgress) {
            return;
        }
        const progressContainer = document.createElement('div');
        progressContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        progressContainer.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-2xl shadow-2xl border border-purple-400/30">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-purple-300">文件上传中...</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" id="upload-progress-close">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                <div class="upload-queue space-y-3 max-h-96 overflow-y-auto"></div>
                <div class="mt-6 pt-4 border-t border-gray-700/50">
                    <div class="flex items-center justify-between text-sm text-gray-400">
                        <span id="upload-summary">准备上传...</span>
                        <span id="upload-total-progress">0%</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(progressContainer);

        // 关闭按钮事件
        const closeBtn = progressContainer.querySelector('#upload-progress-close');
        closeBtn.addEventListener('click', () => {
            // 如果还在上传中，询问用户是否确认关闭
            if (this.isUploading) {
                if (confirm('确定要取消上传吗？')) {
                    this.isUploading = false;
                    this.hideUploadProgress();
                    this.clearUploadQueue();
                }
            } else {
                this.hideUploadProgress();
                this.clearUploadQueue();
            }
        });
    }

    /**
     * 隐藏上传进度
     */
    hideUploadProgress() {
        const progressContainer = document.querySelector('.fixed.inset-0.z-50');
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

        queueContainer.innerHTML = this.uploadQueue.map(item => {
            // 优先显示视频缩略图
            let fileIconHtml = '';
            if (item.thumbnail) {
                fileIconHtml = `<img src="${item.thumbnail}" class="w-10 h-10 object-cover rounded shadow" alt="视频缩略图">`;
            } else {
            const fileIcon = this.getFileIcon(item.file.name);
            const fileIconColor = this.getFileIconColor(item.file.name);
                fileIconHtml = `<i class="fa ${fileIcon} text-lg ${fileIconColor}"></i>`;
            }
            return `
                <div class="flex items-center justify-between p-4 bg-dark-light/50 border border-gray-700/50 rounded-lg hover:border-purple-400/30 transition-all duration-200" data-file-id="${item.id}">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                        <div class="flex-shrink-0">
                            ${fileIconHtml}
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-gray-200 text-sm font-medium truncate" title="${item.file.name}">
                                ${item.file.name}
                            </div>
                            <div class="text-gray-400 text-xs">
                                ${this.formatFileSize(item.file.size)}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3 ml-4">
                        <div class="flex-1 w-32">
                            <div class="h-2 bg-gray-700/50 rounded-full overflow-hidden relative">
                                <div class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out" style="width: ${item.progress || 0}%"></div>
                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" style="width: ${item.progress || 0}%"></div>
                            </div>
                            <div class="flex justify-between mt-1 text-xs">
                                <span class="text-gray-400">${this.getStatusText(item.status)}</span>
                                <span class="text-purple-400 font-medium">${item.progress || 0}%</span>
                            </div>
                        </div>
                        <div class="flex-shrink-0">
                            ${item.status === 'pending' ? '<i class="fa fa-clock text-gray-400"></i>' : ''}
                            ${item.status === 'uploading' ? '<i class="fa fa-spinner fa-spin text-blue-400"></i>' : ''}
                            ${item.status === 'completed' ? '<i class="fa fa-check-circle text-green-400"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 更新总体进度和摘要
        this.updateUploadSummary();
        this.updateUploadAreaHint();
    }

    /**
     * 更新上传进度
     * @param {Object} item - 上传队列项
     */
    updateUploadProgress(item) {
        const progressFill = document.querySelector(`[data-file-id="${item.id}"] .bg-gradient-to-r`);
        if (progressFill) {
            progressFill.style.width = `${item.progress || 0}%`;
        }
        
        const progressText = document.querySelector(`[data-file-id="${item.id}"] .text-purple-400`);
        if (progressText) {
            progressText.textContent = `${item.progress || 0}%`;
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
     * 获取文件图标
     * @param {string} fileName - 文件名
     * @returns {string} 图标类名
     */
    getFileIcon(fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        const iconMap = {
            // 图片
            'jpg': 'fa-image', 'jpeg': 'fa-image', 'png': 'fa-image', 'gif': 'fa-image', 'bmp': 'fa-image', 'webp': 'fa-image',
            // 视频
            'mp4': 'fa-video', 'avi': 'fa-video', 'mov': 'fa-video', 'mkv': 'fa-video', 'wmv': 'fa-video', 'flv': 'fa-video',
            // 音频
            'mp3': 'fa-music', 'wav': 'fa-music', 'ogg': 'fa-music', 'flac': 'fa-music', 'aac': 'fa-music',
            // 文档
            'pdf': 'fa-file-pdf-o', 'doc': 'fa-file-word-o', 'docx': 'fa-file-word-o',
            'xls': 'fa-file-excel-o', 'xlsx': 'fa-file-excel-o', 'ppt': 'fa-file-powerpoint-o', 'pptx': 'fa-file-powerpoint-o',
            'txt': 'fa-file-text-o', 'md': 'fa-file-text-o',
            // 压缩
            'zip': 'fa-file-archive-o', 'rar': 'fa-file-archive-o', '7z': 'fa-file-archive-o',
            // 默认
            'default': 'fa-file-o'
        };
        return iconMap[ext] || iconMap.default;
    }

    /**
     * 根据选择的文件类型自动调整上传UI
     * @param {File[]} files - 选择的文件列表
     */
    async autoAdjustUploadUI(files) {
        if (!files || files.length === 0) return;
        
        // 不进行文件验证，只进行UI调整
        const validFiles = files;
        
        // 判断文件类型
        const imageFiles = validFiles.filter(file => this.isImageFile(file));
        const nonImageFiles = validFiles.filter(file => !this.isImageFile(file));
        
        // 修复逻辑：只有图片类且选择了很多文件时才渲染文件列表UI，其他情况都渲染文件信息UI
        if (imageFiles.length > 0 && nonImageFiles.length === 0 && validFiles.length > 1) {
            this.renderMultiFileUploadUI(validFiles);
        } else {
            this.renderSingleFileInfoUI(validFiles);
        }
    }
    
    /**
     * 判断是否为图片文件
     * @param {File} file - 文件对象
     * @returns {boolean} 是否为图片文件
     */
    isImageFile(file) {
        // 主要检查MIME类型
        const isImageByMime = file.type && file.type.startsWith('image/');
        
        // 备用检查：通过文件扩展名
        const fileName = file.name.toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
        const isImageByExtension = imageExtensions.some(ext => fileName.endsWith(ext));
        
        return isImageByMime || isImageByExtension;
    }
    
    /**
     * 渲染多文件上传列表UI
     * @param {File[]} files - 图片文件列表
     */
    renderMultiFileUploadUI(files) {
        // 更新文件输入框为多文件模式
        if (this.fileInput) {
            this.fileInput.multiple = true;
            this.fileInput.accept = 'image/*';
        }
        
        // 更新上传区域提示
        this.updateUploadAreaHintForImages();
        
        // 渲染文件列表预览
        this.renderFileListPreview(files);
        
        // 显示多文件上传提示
        this.showMessage(`已选择 ${files.length} 个图片文件，可以继续添加更多图片`, 'info');
    }
    
    /**
     * 渲染单文件信息UI
     * @param {File[]} files - 文件列表
     */
    renderSingleFileInfoUI(files) {
        // 更新文件输入框为单文件模式
        if (this.fileInput) {
            this.fileInput.multiple = false;
            this.fileInput.accept = this.allowedTypes.join(',');
        }
        
        // 更新上传区域提示
        this.updateUploadAreaHintForAllFiles();
        
        // 渲染文件信息预览
        this.renderFileInfoPreview(files);
        
        // 对于单个文件，不显示"准备上传"的提示，因为单个文件应该直接上传
        // 对于多个文件，显示提示
        if (files.length > 1) {
            this.showMessage(`已选择 ${files.length} 个文件，准备上传`, 'info');
        }
    }
    
    /**
     * 渲染文件列表预览（用于多图片上传）
     * @param {File[]} files - 文件列表
     */
    renderFileListPreview(files) {
        // 隐藏原有的上传区域
        if (this.uploadArea) {
            this.uploadArea.style.display = 'none';
        }
        
        // 创建或更新文件列表预览容器
        let previewContainer = document.getElementById('file-list-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'file-list-preview';
            previewContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
            document.body.appendChild(previewContainer);
        }
        
        // 生成文件列表HTML
        const filesHTML = files.map((file, index) => `
            <div class="bg-dark border border-gray-700 rounded-lg p-4 mb-3 hover:border-blue-400/50 transition-colors">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                        <i class="fa fa-image text-blue-400 text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-white">${file.name}</h4>
                        <p class="text-gray-400 text-sm">${this.formatFileSize(file.size)}</p>
                        <p class="text-gray-500 text-xs">图片文件</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm" 
                                onclick="window.uploadManager.removeFileFromPreview(${index})">
                            移除
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        previewContainer.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-2xl max-h-[80vh] shadow-2xl border border-purple-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-purple-300">图片文件预览</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" onclick="window.uploadManager.closeFilePreview()">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="overflow-y-auto max-h-[calc(80vh-120px)]">
                    ${filesHTML}
                </div>
                
                <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                    <button class="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors" 
                            onclick="window.uploadManager.closeFilePreview()">
                        取消
                    </button>
                    <button class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary/80 hover:to-secondary/80 transition-all duration-300 transform hover:scale-[1.02]" 
                            onclick="window.uploadManager.uploadSelectedFiles()">
                        开始上传
                    </button>
                </div>
            </div>
        `;
        
        // 存储文件列表供后续使用
        this.previewFiles = files;
    }
    
    /**
     * 渲染文件信息预览（用于单文件上传）
     * @param {File[]} files - 文件列表
     */
    renderFileInfoPreview(files) {
        // 隐藏原有的上传区域
        if (this.uploadArea) {
            this.uploadArea.style.display = 'none';
        }
        
        // 创建或更新文件信息预览容器
        let previewContainer = document.getElementById('file-info-preview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'file-info-preview';
            previewContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
            document.body.appendChild(previewContainer);
        }
        
        // 如果是单个文件，渲染简洁的文件信息UI
        if (files.length === 1) {
            const file = files[0];
            const fileSize = this.formatFileSize(file.size);
            const fileIcon = this.getFileIcon(file.name);
            const fileIconColor = this.getFileIconColor(file.name);
            
            previewContainer.innerHTML = `
                <div class="bg-dark-light rounded-xl p-6 w-full max-w-md shadow-2xl border border-purple-400/30">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-purple-300">文件信息</h3>
                        <button class="text-gray-400 hover:text-white transition-colors" onclick="window.uploadManager.closeFilePreview()">
                            <i class="fa fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="flex flex-col items-center justify-center py-4">
                        <div class="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full mb-4 border border-purple-400/30">
                            <i class="fa ${fileIcon} text-2xl ${fileIconColor}"></i>
                        </div>
                        <div class="text-center mb-3">
                            <div class="text-gray-200 text-sm font-medium mb-1 truncate max-w-xs" title="${file.name}">
                                ${file.name}
                            </div>
                            <div class="text-gray-400 text-xs">
                                ${fileSize}
                            </div>
                            <div class="text-gray-500 text-xs mt-1">
                                ${file.type || '未知类型'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                        <button class="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors" 
                                onclick="window.uploadManager.closeFilePreview()">
                            取消
                        </button>
                        <button class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary/80 hover:to-secondary/80 transition-all duration-300 transform hover:scale-[1.02]" 
                                onclick="window.uploadManager.uploadSelectedFiles()">
                            开始上传
                        </button>
                    </div>
                </div>
            `;
        } else {
            // 如果是多个文件，渲染文件列表
            const filesHTML = files.map((file, index) => {
                const fileIcon = this.getFileIcon(file.name);
                const fileColor = this.getFileIconColor(file.name);
                
                return `
                    <div class="bg-dark border border-gray-700 rounded-lg p-4 mb-3 hover:border-blue-400/50 transition-colors">
                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 bg-gradient-to-br ${fileColor} rounded-lg flex items-center justify-center">
                                <i class="fa ${fileIcon} text-white text-xl"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-semibold text-white">${file.name}</h4>
                                <p class="text-gray-400 text-sm">${this.formatFileSize(file.size)}</p>
                                <p class="text-gray-500 text-xs">${file.type || '未知类型'}</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button class="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm" 
                                        onclick="window.uploadManager.removeFileFromPreview(${index})">
                                    移除
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            previewContainer.innerHTML = `
                <div class="bg-dark-light rounded-xl p-6 w-full max-w-2xl max-h-[80vh] shadow-2xl border border-purple-400/30 overflow-hidden">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-purple-300">文件信息预览</h3>
                        <button class="text-gray-400 hover:text-white transition-colors" onclick="window.uploadManager.closeFilePreview()">
                            <i class="fa fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="overflow-y-auto max-h-[calc(80vh-120px)]">
                        ${filesHTML}
                    </div>
                    
                    <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                        <button class="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors" 
                                onclick="window.uploadManager.closeFilePreview()">
                            取消
                        </button>
                        <button class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:from-primary/80 hover:to-secondary/80 transition-all duration-300 transform hover:scale-[1.02]" 
                                onclick="window.uploadManager.uploadSelectedFiles()">
                            开始上传
                        </button>
                    </div>
                </div>
            `;
        }
        
        // 存储文件列表供后续使用
        this.previewFiles = files;
    }
    
    /**
     * 为图片文件更新上传区域提示
     */
    updateUploadAreaHintForImages() {
        if (!this.uploadArea) return;
        
        // 更新标题
        const titleElement = this.uploadArea.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = '上传图片';
        }
        
        // 更新描述
        const descElement = this.uploadArea.querySelector('.text-gray-400');
        if (descElement) {
            descElement.textContent = '拖放图片文件到此处，或点击选择图片';
        }
        
        // 更新拖拽区域提示
        const dropHintElement = this.uploadArea.querySelector('#drop-area p.text-gray-300');
        if (dropHintElement) {
            dropHintElement.textContent = '拖放图片文件到此处上传';
        }
        
        // 更新文件类型提示
        const fileTypesElement = this.uploadArea.querySelector('#drop-area-file-types');
        if (fileTypesElement) {
            fileTypesElement.textContent = '支持的图片格式: JPG, PNG, GIF, BMP, WEBP';
        }
        
        // 更新提示文本
        const tipElement = this.uploadArea.querySelector('.text-emerald-light');
        if (tipElement) {
            tipElement.textContent = '💡 提示: 可以同时选择或拖拽多个图片文件';
        }
    }
    
    /**
     * 为全部文件更新上传区域提示
     */
    updateUploadAreaHintForAllFiles() {
        if (!this.uploadArea) return;
        
        // 更新标题
        const titleElement = this.uploadArea.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = '上传文件';
        }
        
        // 更新描述
        const descElement = this.uploadArea.querySelector('.text-gray-400');
        if (descElement) {
            descElement.textContent = '拖放文件到此处，或点击选择文件';
        }
        
        // 更新拖拽区域提示
        const dropHintElement = this.uploadArea.querySelector('#drop-area p.text-gray-300');
        if (dropHintElement) {
            dropHintElement.textContent = '拖放文件到此处上传';
        }
        
        // 更新文件类型提示
        const fileTypesElement = this.uploadArea.querySelector('#drop-area-file-types');
        if (fileTypesElement) {
            fileTypesElement.textContent = '支持的格式: JPG, PNG, GIF, MP4, AVI, MP3, WAV, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD 等';
        }
        
        // 更新提示文本
        const tipElement = this.uploadArea.querySelector('.text-emerald-light');
        if (tipElement) {
            tipElement.textContent = '💡 提示: 可以同时选择或拖拽多个图片文件';
        }
    }
    
    /**
     * 重置上传UI到默认状态
     */
    resetUploadUIToDefault() {
        if (!this.uploadArea) return;
        
        // 重置文件输入框
        if (this.fileInput) {
            this.fileInput.multiple = true;
            this.fileInput.accept = this.allowedTypes.join(',');
        }
        
        // 重置上传区域提示
        this.updateUploadAreaHintForAllFiles();
    }

    /**
     * 获取文件图标颜色
     * @param {string} fileName - 文件名
     * @returns {string} 颜色类名
     */
    getFileIconColor(fileName) {
        const ext = fileName.toLowerCase().split('.').pop();
        const colorMap = {
            // 图片
            'jpg': 'text-green-400', 'jpeg': 'text-green-400', 'png': 'text-green-400', 'gif': 'text-green-400', 'bmp': 'text-green-400', 'webp': 'text-green-400',
            // 视频
            'mp4': 'text-red-400', 'avi': 'text-red-400', 'mov': 'text-red-400', 'mkv': 'text-red-400', 'wmv': 'text-red-400', 'flv': 'text-red-400',
            // 音频
            'mp3': 'text-yellow-400', 'wav': 'text-yellow-400', 'ogg': 'text-yellow-400', 'flac': 'text-yellow-400', 'aac': 'text-yellow-400',
            // 文档
            'pdf': 'text-red-500', 'doc': 'text-blue-500', 'docx': 'text-blue-500',
            'xls': 'text-green-500', 'xlsx': 'text-green-500', 'ppt': 'text-orange-500', 'pptx': 'text-orange-500',
            'txt': 'text-gray-400', 'md': 'text-gray-400',
            // 压缩
            'zip': 'text-purple-400', 'rar': 'text-purple-400', '7z': 'text-purple-400',
            // 默认
            'default': 'text-gray-400'
        };
        return colorMap[ext] || colorMap.default;
    }

    /**
     * 更新上传摘要
     */
    updateUploadSummary() {
        const summaryElement = document.getElementById('upload-summary');
        const progressElement = document.getElementById('upload-total-progress');
        
        if (!summaryElement || !progressElement) return;

        const total = this.uploadQueue.length;
        const completed = this.uploadQueue.filter(item => item.status === 'completed').length;
        const failed = this.uploadQueue.filter(item => item.status === 'failed').length;
        const uploading = this.uploadQueue.filter(item => item.status === 'uploading').length;
        const pending = this.uploadQueue.filter(item => item.status === 'pending').length;

        // 计算总体进度（基于实际上传进度）
        let totalProgress = 0;
        if (total > 0) {
            const totalProgressValue = this.uploadQueue.reduce((sum, item) => {
                return sum + (item.progress || 0);
            }, 0);
            totalProgress = Math.round(totalProgressValue / total);
        }

        // 更新摘要文本
        let summaryText = '';
        if (total === 0) {
            summaryText = '准备上传...';
        } else if (completed === total) {
            summaryText = `上传完成！成功: ${completed} 个文件`;
        } else if (failed > 0 && completed + failed === total) {
            summaryText = `上传完成！成功: ${completed} 个，失败: ${failed} 个`;
        } else if (uploading > 0) {
            summaryText = `正在上传... 已完成: ${completed}/${total}`;
        } else if (pending > 0) {
            summaryText = `等待上传... 待上传: ${pending} 个文件`;
        } else {
            summaryText = `上传状态: 已完成 ${completed} 个，失败 ${failed} 个`;
        }

        summaryElement.textContent = summaryText;
        progressElement.textContent = `${totalProgress}%`;
        

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
            'failed': '上传失败'
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
        return this.isUploading || this.uploadQueue.some(item => item.status === 'uploading');
    }

    /**
     * 手动开始上传队列中的文件
     */
    startUpload() {
        if (this.isCurrentlyUploading()) {
            this.showMessage('当前正在上传中，请等待完成', 'warning');
            return;
        }

        // 检查是否有待上传的文件
        const pendingFiles = this.uploadQueue.filter(item => item.status === 'pending');
        if (pendingFiles.length === 0) {
            // 检查是否有已完成或失败的文件
            const completedFiles = this.uploadQueue.filter(item => item.status === 'completed');
            const failedFiles = this.uploadQueue.filter(item => item.status === 'failed');
            
            if (completedFiles.length > 0) {
                this.showMessage('所有文件已上传完成', 'success');
                return;
            } else if (failedFiles.length > 0) {
                this.showMessage('所有文件上传失败，请重试', 'error');
                return;
            } else {
                this.showMessage('没有待上传的文件', 'warning');
                return;
            }
        }

        this.processUploadQueue();
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
     * @param {boolean} confirmReplace - 是否确认替换同名文件
     */
    retryUpload(fileId, confirmReplace = false) {
        const item = this.uploadQueue.find(item => item.id === fileId);
        if (!item) {
            console.warn('未找到要重试的文件:', fileId);
            return;
        }

        // 重置状态
        item.status = 'pending';
        item.progress = 0;
        item.error = null;
        
        // 设置确认替换标志
        item.confirmReplace = confirmReplace;

        this.updateUploadQueueDisplay();
        this.updateUploadSummary();

        // 重新开始上传
        this.uploadFile(item);
    }

    /**
     * 更新进度条
     * @param {string} fileId - 文件ID
     * @param {number} progress - 进度百分比
     */
    updateProgressBar(fileId, progress) {
        const progressFill = document.querySelector(`[data-file-id="${fileId}"] .bg-gradient-to-r`);
        const progressShine = document.querySelector(`[data-file-id="${fileId}"] .absolute.inset-0`);
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
            progressFill.style.transition = 'width 0.2s ease-out';
        }
        if (progressShine) {
            progressShine.style.width = `${progress}%`;
            progressShine.style.transition = 'width 0.2s ease-out';
        }
        
        // 更新进度文本
        const progressText = document.querySelector(`[data-file-id="${fileId}"] .progress-text`);
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
    }

    /**
     * 刷新文件列表
     */
    refreshFileList() {
        // 调用新的综合刷新方法
        this.refreshFileListAndStorage();
    }

    /**
     * 直接刷新文件列表（降级方案）
     */
    async refreshFileListDirect() {
        try {
            // 获取API管理器
            const apiManager = window.apiSystem || window.apiManager || window.api;
            if (!apiManager) {
                console.error('无法找到API管理器');
                return;
            }

            // 重新获取文件列表
            const [files, urlFiles] = await Promise.all([
                apiManager.files.getFiles(),
                apiManager.urlFiles.getUrlFiles()
            ]);

            // 合并文件列表
            const allFiles = [...files, ...urlFiles];

            // 尝试渲染文件列表
            const uiManager = window.uiManager || window.UIManager || 
                             (window.app && window.app.uiManager) ||
                             (window.apiSystem && window.apiSystem.uiManager);
            
            if (uiManager && typeof uiManager.renderFileList === 'function') {
                uiManager.renderFileList(allFiles);
            }
        } catch (error) {
            console.error('刷新文件列表失败:', error);
        }
    }

    /**
     * 刷新文件列表和存储空间
     */
    async refreshFileListAndStorage() {
        try {
            // 获取API管理器
            const apiManager = window.apiSystem || window.apiManager || window.api;
            if (!apiManager) {
                console.error('无法找到API管理器');
                return;
            }

            // 并行获取文件列表和存储信息
            const [files, urlFiles, storageInfo] = await Promise.all([
                apiManager.files.getFiles(),
                apiManager.urlFiles.getUrlFiles(),
                apiManager.storage.getStorageInfo()
            ]);

            // 合并文件列表
            const allFiles = [...files, ...urlFiles];

            // 获取UI管理器
            const uiManager = window.uiManager || window.UIManager || 
                             (window.app && window.app.uiManager) ||
                             (window.apiSystem && window.apiSystem.uiManager);
            
            if (uiManager) {
                // 更新文件缓存
                if (uiManager.allFiles) {
                    uiManager.allFiles = allFiles;
                }
                
                // 更新存储信息到本地缓存
                if (storageInfo && window.StorageManager && typeof window.StorageManager.setStorageInfo === 'function') {
                    window.StorageManager.setStorageInfo(storageInfo);
                }
                
                // 更新存储空间显示
                if (typeof uiManager.syncStorageDisplay === 'function') {
                    await uiManager.syncStorageDisplay(storageInfo);
                } else if (typeof uiManager.updateStorageDisplay === 'function') {
                    uiManager.updateStorageDisplay(storageInfo);
                }
                
                // 重新渲染文件列表
                if (typeof uiManager.renderFileList === 'function') {
                    uiManager.renderFileList(allFiles);
                }
                
                // 如果当前在特定分类下，重新过滤文件
                if (uiManager.currentCategory && uiManager.currentCategory !== 'all') {
                    const categoriesManager = window.categoriesManager || 
                                           (uiManager.categoriesManager);
                    if (categoriesManager && typeof categoriesManager.filterFiles === 'function') {
                        categoriesManager.filterFiles(uiManager.currentCategory);
                    }
                }
            }
        } catch (error) {
            console.error('❌ 刷新文件列表和存储空间失败:', error);
        }
    }

    /**
     * 处理上传成功
     * @param {Object} item - 上传项
     * @param {Object} response - 服务器响应
     */
    handleUploadSuccess(item, response) {
        // 更新上传项状态
        item.status = 'completed';
        item.progress = 100;
        
        // 保存服务器返回的文件信息
        if (response.file) {
            item.serverFile = response.file;
            
            // 如果是视频文件且有缩略图，将缩略图信息保存到localStorage
            if (item.file.type.startsWith('video/') && item.thumbnail) {
                // 保存缩略图到localStorage，使用文件名作为key
                const thumbnailKey = `video_thumbnail_${response.file.name}`;
                localStorage.setItem(thumbnailKey, item.thumbnail);

                // 同时保存到服务器文件数据中（用于当前会话）
                response.file.thumbnail = item.thumbnail;
                response.file.hasVideoThumbnail = true;
            }
        }
        
        // 更新显示
        this.updateUploadQueueDisplay();
        this.updateUploadSummary();
        
        // 显示上传成功消息
        this.showMessage('文件上传成功！', 'success');
        
        // 刷新文件列表和存储空间 - 增加延迟确保后端处理完成
        setTimeout(async () => {
            try {
                await this.refreshFileListAndStorage();
            } catch (error) {
                console.error('❌ 刷新文件列表失败:', error);
                // 如果刷新失败，尝试直接刷新
                setTimeout(async () => {
                    try {
                        await this.refreshFileListDirect();
                    } catch (retryError) {
                        console.error('❌ 直接刷新文件列表也失败:', retryError);
                    }
                }, 1000);
            }
        }, 1000); // 增加到1秒延迟
        
        // 如果是单个文件上传，关闭进度条
        if (this.uploadQueue.length === 1) {
            setTimeout(() => {
                this.hideUploadProgress();
            }, 2000);
        }
    }

    /**
     * 处理上传错误
     * @param {Object} item - 上传项
     * @param {string} error - 错误信息
     */
    handleUploadError(item, error) {
        // 对于409错误（同名文件冲突），不显示控制台错误信息
        // 因为这是已知的错误，前端网关应该自行处理
        if (!error.includes('检测到同名同大小文件') && !error.includes('文件已存在')) {
            console.error('处理上传错误:', item, error);
        }
        
        // 更新上传项状态
        item.status = 'failed';
        item.error = error;
        
        // 更新显示
        this.updateUploadQueueDisplay();
        this.updateUploadSummary();
        
        // 显示上传错误消息
        this.showMessage(`上传失败: ${error}`, 'error');
    }
    
    /**
     * 处理同名文件冲突
     * @param {Object} item - 上传项
     * @param {Object} response - 服务器响应
     */
    handleDuplicateFileConfirmation(item, response) {
        console.warn('检测到同名文件冲突，需要二次确认:', response);
        const confirm = window.confirm(`文件 "${item.file.name}" 已存在，是否覆盖？\n\n` +
                                        `当前文件大小: ${this.formatFileSize(item.file.size)}\n` +
                                        `服务器文件大小: ${this.formatFileSize(response.existing_file.size)}\n` +
                                        `大小差异: ${this.formatFileSize(response.size_difference)}\n\n` +
                                        `如果您选择覆盖，将删除服务器上的旧文件。`);
        if (confirm) {
            this.retryUpload(item.id, true); // 使用 retryUpload 进行覆盖上传
        } else {
            item.status = 'failed';
            item.error = '用户取消覆盖';
            this.updateUploadQueueDisplay();
            this.updateUploadSummary();
            this.showMessage('文件上传已取消', 'warning');
        }
    }
    
    /**
     * 关闭文件预览
     */
    closeFilePreview() {
        // 移除预览容器
        const listPreview = document.getElementById('file-list-preview');
        const infoPreview = document.getElementById('file-info-preview');
        
        if (listPreview) {
            listPreview.remove();
        }
        if (infoPreview) {
            infoPreview.remove();
        }
        
        // 显示原有的上传区域
        if (this.uploadArea) {
            this.uploadArea.style.display = 'block';
        }
        
        // 清空预览文件
        this.previewFiles = null;
    }
    
    /**
     * 从预览中移除文件
     * @param {number} index - 文件索引
     */
    removeFileFromPreview(index) {
        if (!this.previewFiles || index < 0 || index >= this.previewFiles.length) {
            return;
        }
        
        // 移除指定索引的文件
        this.previewFiles.splice(index, 1);
        
        // 如果没有文件了，关闭预览
        if (this.previewFiles.length === 0) {
            this.closeFilePreview();
            return;
        }
        
        // 重新渲染预览 - 使用与autoAdjustUploadUI相同的逻辑
        const imageFiles = this.previewFiles.filter(file => this.isImageFile(file));
        const nonImageFiles = this.previewFiles.filter(file => !this.isImageFile(file));
        
        // 修复逻辑：只有图片类且选择了很多文件时才渲染文件列表UI，其他情况都渲染文件信息UI
        if (imageFiles.length > 0 && nonImageFiles.length === 0 && this.previewFiles.length > 1) {
            this.renderFileListPreview(this.previewFiles);
        } else {
            this.renderFileInfoPreview(this.previewFiles);
        }
    }
    
    /**
     * 上传选中的文件
     */
    async uploadSelectedFiles() {
        if (!this.previewFiles || this.previewFiles.length === 0) {
            this.showMessage('没有文件可以上传', 'warning');
            return;
        }
        
        // 验证文件
        const validFiles = [];
        for (const file of this.previewFiles) {
            const isValid = await this.validateFile(file);
            if (isValid) {
                validFiles.push(file);
            }
        }
        
        if (validFiles.length === 0) {
            this.showMessage('没有有效的文件可以上传', 'warning');
            return;
        }
        
        // 关闭预览
        this.closeFilePreview();
        
        // 将文件添加到上传队列并开始上传
        await this.addFilesToQueue(validFiles, false);
        await this.startUpload();
    }
}

// 全局暴露
window.UIUploadManager = UIUploadManager;
window.uploadManager = null; // 将在实例化时设置 