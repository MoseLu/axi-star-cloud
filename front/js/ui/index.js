/**
 * UI模块主入口
 * 整合所有UI功能模块，提供统一的UIManager接口
 */

// 核心模块将在HTML中单独引入
// 分类管理模块将在HTML中单独引入
// 文件渲染模块将在HTML中单独引入
// 文件夹管理模块将在HTML中单独引入
// 文件预览模块将在HTML中单独引入

class UIManager {
    constructor() {
        // 使用新的API系统，确保向后兼容
        this.api = window.apiSystem || window.apiManager;
        if (!this.api) {
            console.error('API system not initialized');
        }
        this.currentFolderId = null;
        this.folders = [];
        this.currentCategory = 'all'; // 记录当前分类
        this.allFiles = []; // 缓存所有文件数据
        this.isLoading = false; // 防抖标志
        this.isSubmittingDoc = false; // 防重复提交标志
        
        // 初始化核心功能
        this.core = new UICore();
        this.core.uiManager = this; // 设置引用
        
        // 初始化分类管理功能
        this.categories = new UICategories(this);
        
        // 初始化文件渲染功能
        this.fileRenderer = new UIFileRenderer(this);
        
        // 初始化文件夹管理功能
        this.folderManager = new UIFolderManager(this);
        
        // 初始化文件预览功能
        this.filePreview = new UIFilePreview(this);
        
        // 初始化文件操作功能
        this.fileOperations = new UIFileOperations();
        
        // 初始化上传管理功能
        this.uploadManager = new UIUploadManager();
        
        // 初始化模态框管理功能
        this.modalManager = new UIModalManager();
        
        // 初始化个人资料管理功能
        this.profileManager = new UIProfileManager();
        
        // 初始化管理员功能
        this.adminManager = new UIAdminManager();
        
        // 初始化文档同步功能
        this.docsSync = new UIDocsSync();
        
        // 初始化工具函数
        this.utils = new UIUtils();
        
        // 初始化设置管理
        this.settingsManager = new UISettingsManager();
        
        // 初始化URL管理
        this.urlManager = new UIUrlManager();
        
        this.init();
    }

    init() {
        // 委托给核心模块处理初始化
        this.core.init();
    }

    // 核心功能委托给UICore
    ensureScrollbarVisibility() {
        return this.core.ensureScrollbarVisibility();
    }

    cleanupExternalDocsStyles() {
        return this.core.cleanupExternalDocsStyles();
    }

    setupEventListeners() {
        return this.core.setupEventListeners();
    }

    setupLoginForm() {
        return this.core.setupLoginForm();
    }

    async onLoginSuccess(userData) {
        return this.core.onLoginSuccess(userData);
    }

    async loadUserData(userData) {
        return this.core.loadUserData(userData);
    }

    showMainInterface() {
        return this.core.showMainInterface();
    }

    showLoginInterface() {
        return this.core.showLoginInterface();
    }

    // 占位符方法 - 这些方法将在后续模块中实现
    // 为了避免一次性处理太多代码，先创建占位符
    
    // 文件渲染相关
    renderFileList(files) { 
        return this.fileRenderer.renderFileList(files);
    }
    
    createFileCard(file) { 
        return this.fileRenderer.createFileCard(file);
    }
    
    // 文件统计
    updateFileCount(current, total) {
        console.log('📈 更新文件统计:', { current, total });
        
        // 更新欢迎区域的统计
        const countElement = document.getElementById('file-count');
        if (countElement) {
            if (typeof total === 'number') {
                countElement.textContent = `${current} / ${total}`;
                console.log('✅ 欢迎区域文件统计更新成功:', `${current} / ${total}`);
            } else {
                countElement.textContent = current;
                console.log('✅ 欢迎区域文件统计更新成功:', current);
            }
        } else {
            console.warn('⚠️ 欢迎区域文件统计元素未找到: file-count');
        }
        
        // 更新文件列表区域的统计
        const countDisplayElement = document.getElementById('file-count-display');
        if (countDisplayElement) {
            if (typeof total === 'number') {
                countDisplayElement.textContent = `${current} / ${total}`;
                console.log('✅ 文件列表区域统计更新成功:', `${current} / ${total}`);
            } else {
                countDisplayElement.textContent = current;
                console.log('✅ 文件列表区域统计更新成功:', current);
            }
        } else {
            console.warn('⚠️ 文件列表区域统计元素未找到: file-count-display');
        }
    }
    
    toggleEmptyState(visibleCount = null) {
        return this.fileRenderer.toggleEmptyState(visibleCount);
    }

    generateThumbnailContent(file) {
        return this.fileRenderer.generateThumbnailContent(file);
    }

    getThumbnailUrl(file) {
        return this.fileRenderer.getThumbnailUrl(file);
    }

    addFileCardEventListeners(fileCard, file) {
        return this.fileRenderer.addFileCardEventListeners(fileCard, file);
    }

    getCategoryBadgeColor(category) {
        return this.fileRenderer.getCategoryBadgeColor(category);
    }

    getCategoryBadgeBg(category) {
        return this.fileRenderer.getCategoryBadgeBg(category);
    }

    getCategoryLabel(category) {
        return this.fileRenderer.getCategoryLabel(category);
    }

    truncateFileName(fileName) {
        return this.fileRenderer.truncateFileName(fileName);
    }

    formatStorageSize(bytes) {
        return this.fileRenderer.formatStorageSize(bytes);
    }

    handleImageError(imgElement, fallbackSrc = '/static/public/docs.png') {
        return this.fileRenderer.handleImageError(imgElement, fallbackSrc);
    }
    
    // 获取分类颜色
    getCategoryColor(category) {
        const colorMap = {
            'image': 'blue',
            'video': 'purple',
            'audio': 'green',
            'document': 'orange',
            'word': 'blue',
            'excel': 'green',
            'powerpoint': 'orange',
            'pdf': 'red',
            'url': 'cyan',
            'other': 'gray',
            'external-docs': 'indigo'
        };
        return colorMap[category] || 'blue';
    }
    
    // 获取分类标签
    getCategoryLabel(category) {
        const labelMap = {
            'image': '图片',
            'video': '视频',
            'audio': '音频',
            'document': '文档',
            'word': 'Word',
            'excel': 'Excel',
            'powerpoint': 'PowerPoint',
            'pdf': 'PDF',
            'url': 'URL',
            'other': '其他',
            'external-docs': '外站文档'
        };
        return labelMap[category] || '未知';
    }
    
    // 文件夹管理相关
    renderFolderList(folders) { 
        return this.folderManager.renderFolderList(folders);
    }
    
    // 刷新文件夹列表
    async refreshFolders() {
        console.log('🔄 开始刷新文件夹列表');
        try {
            if (!this.api || !this.api.getFolders) {
                console.error('❌ API系统未初始化或缺少getFolders方法');
                return;
            }
            
            const folders = await this.api.getFolders();
            console.log('📁 获取到文件夹数据:', folders);
            
            if (Array.isArray(folders)) {
                this.folders = folders;
                await this.folderManager.renderFolderList(this.folders);
                console.log('✅ 文件夹列表刷新完成');
            } else {
                console.warn('⚠️ 文件夹数据格式异常:', folders);
            }
        } catch (error) {
            console.error('❌ 刷新文件夹列表失败:', error);
        }
    }
    
    goBackToAllFiles() { 
        return this.folderManager.goBackToAllFiles();
    }

    showFolderFiles(folderId, folderName) { 
        return this.folderManager.showFolderFiles(folderId, folderName);
    }
    
    showFolderFromFile(folderId) { 
        return this.folderManager.showFolderFromFile(folderId);
    }

    showBreadcrumb(folderName) {
        return this.folderManager.showBreadcrumb(folderName);
    }

    hideBreadcrumb() {
        return this.folderManager.hideBreadcrumb();
    }

    updateFolderFileCount(count) {
        return this.folderManager.updateFolderFileCount(count);
    }

    editFolder(folderId, currentName) {
        return this.folderManager.editFolder(folderId, currentName);
    }

    deleteFolder(folderId, folderName) {
        return this.folderManager.deleteFolder(folderId, folderName);
    }

    showEditFolderDialog(folder) {
        return this.folderManager.showEditFolderDialog(folder);
    }

    addFolderCardEventListeners(folderCard, folder) {
        return this.folderManager.addFolderCardEventListeners(folderCard, folder);
    }

    createFolderCardHTML(folder, categoryInfo) {
        return this.folderManager.createFolderCardHTML(folder, categoryInfo);
    }

    createCategorySection(categoryInfo, folders) {
        return this.folderManager.createCategorySection(categoryInfo, folders);
    }

    createFolderCard(folder) {
        return this.folderManager.createFolderCard(folder);
    }
    
    // 文件预览相关
    showFilePreview(file) { 
        return this.filePreview.showFilePreview(file);
    }

    previewImage(file) {
        return this.filePreview.previewImage(file);
    }

    previewVideo(file) {
        return this.filePreview.previewVideo(file);
    }

    previewAudio(file) {
        return this.filePreview.previewAudio(file);
    }

    previewPDF(file) {
        return this.filePreview.previewPDF(file);
    }

    previewDocument(file) {
        return this.filePreview.previewDocument(file);
    }

    previewWord(file) {
        return this.filePreview.previewWord(file);
    }

    previewExcel(file) {
        return this.filePreview.previewExcel(file);
    }

    previewPowerPoint(file) {
        return this.filePreview.previewPowerPoint(file);
    }

    previewUrl(file) {
        return this.filePreview.previewUrl(file);
    }

    previewTextFile(file) {
        return this.filePreview.previewTextFile(file);
    }

    previewMarkdown(file) {
        return this.filePreview.previewMarkdown(file);
    }

    renderMarkdown(text) {
        return this.filePreview.renderMarkdown(text);
    }

    showExcelDownloadOptions(file) {
        return this.filePreview.showExcelDownloadOptions(file);
    }

    showExcelTablePreview(file, data, sheetNames) {
        return this.filePreview.showExcelTablePreview(file, data, sheetNames);
    }

    generatePaginatedTableHTML(data, config) {
        return this.filePreview.generatePaginatedTableHTML(data, config);
    }

    generateTableHTML(data) {
        return this.filePreview.generateTableHTML(data);
    }

    initializePaginationControls(modal, data, config) {
        return this.filePreview.initializePaginationControls(modal, data, config);
    }

    updatePageNumbers(modal, config) {
        return this.filePreview.updatePageNumbers(modal, config);
    }
    
    // 文件操作相关
    handleSearch(searchTerm) { 
        return this.fileOperations.debouncedSearch(searchTerm, (results) => {
            // 处理搜索结果
            if (results.length > 0) {
                this.renderFileList(results);
            } else {
                this.showMessage('未找到匹配的文件', 'info');
            }
        });
    }
    
    downloadFile(file) { 
        return this.fileOperations.downloadFile(file);
    }
    
    deleteFile(file) { 
        return this.fileOperations.deleteFile(file, () => {
            // 删除成功后刷新文件列表
            this.loadFiles();
        });
    }

    batchDeleteFiles(files) {
        return this.fileOperations.batchDeleteFiles(files, () => {
            // 批量删除成功后刷新文件列表
            this.loadFiles();
        });
    }

    searchFiles(query, options) {
        return this.fileOperations.searchFiles(query, options);
    }

    initSearchBox(searchInputSelector, onSearchResults) {
        return this.fileOperations.initSearchBox(searchInputSelector, onSearchResults);
    }

    clearSearch() {
        return this.fileOperations.clearSearch();
    }

    getSearchResults() {
        return this.fileOperations.getSearchResults();
    }

    getCurrentSearchQuery() {
        return this.fileOperations.getCurrentSearchQuery();
    }

    isCurrentlySearching() {
        return this.fileOperations.isCurrentlySearching();
    }

    getFileStats() {
        return this.fileOperations.getFileStats();
    }
    
    // 上传管理相关
    showUploadArea() { 
        return this.uploadManager.showUploadArea();
    }
    
    hideUploadArea() { 
        return this.uploadManager.hideUploadArea();
    }
    
    handleFileUpload(files) { 
        return this.uploadManager.handleFiles(files);
    }
    
    handleFileSelect(event) { 
        return this.uploadManager.handleFileSelect(event);
    }
    
    updateFileInputMultiple() { 
        return this.uploadManager.updateFileInputMultiple();
    }
    
    updateUploadAreaHint() { 
        return this.uploadManager.updateUploadAreaHint();
    }

    initUploadManager(uploadAreaSelector, fileInputSelector) {
        return this.uploadManager.init(uploadAreaSelector, fileInputSelector);
    }

    setMaxFileSize(size) {
        return this.uploadManager.setMaxFileSize(size);
    }

    setAllowedTypes(types) {
        return this.uploadManager.setAllowedTypes(types);
    }

    getUploadQueue() {
        return this.uploadManager.getUploadQueue();
    }

    isCurrentlyUploading() {
        return this.uploadManager.isCurrentlyUploading();
    }

    cancelUpload(fileId) {
        return this.uploadManager.cancelUpload(fileId);
    }

    retryUpload(fileId) {
        return this.uploadManager.retryUpload(fileId);
    }
    
    // 模态框管理相关
    showMessage(message, type = 'info') { 
        return this.modalManager.showMessage(message, type);
    }
    
    showCreateFolderModal() { 
        return this.modalManager.showInputDialog('创建文件夹', '请输入文件夹名称', {
            confirmText: '创建',
            cancelText: '取消'
        }).then(folderName => {
            if (folderName) {
                // 处理文件夹创建逻辑
                console.log('创建文件夹:', folderName);
            }
        });
    }
    
    showProfileModal() { 
        return this.modalManager.showConfirmDialog('个人资料', '个人资料功能开发中...', {
            confirmText: '确定',
            cancelText: '关闭'
        });
    }
    
    showSettingsModal() { 
        return this.modalManager.showConfirmDialog('系统设置', '系统设置功能开发中...', {
            confirmText: '确定',
            cancelText: '关闭'
        });
    }

    showConfirmDialog(title, message, options) {
        return this.modalManager.showConfirmDialog(title, message, options);
    }

    showInputDialog(title, placeholder, options) {
        return this.modalManager.showInputDialog(title, placeholder, options);
    }

    showSelectDialog(title, options, config) {
        return this.modalManager.showSelectDialog(title, options, config);
    }

    showLoadingDialog(message) {
        return this.modalManager.showLoadingDialog(message);
    }

    hideLoadingDialog(loadingModal) {
        return this.modalManager.hideLoadingDialog(loadingModal);
    }

    showSuccess(message, options) {
        return this.modalManager.showSuccess(message, options);
    }

    showError(message, options) {
        return this.modalManager.showError(message, options);
    }

    showWarning(message, options) {
        return this.modalManager.showWarning(message, options);
    }

    showInfo(message, options) {
        return this.modalManager.showInfo(message, options);
    }

    clearAllMessages() {
        return this.modalManager.clearAllMessages();
    }

    closeAllModals() {
        return this.modalManager.closeAllModals();
    }

    getActiveModalCount() {
        return this.modalManager.getActiveModalCount();
    }

    hasActiveModals() {
        return this.modalManager.hasActiveModals();
    }
    
    // 个人资料相关
    initUserProfile(userData) { 
        return this.profileManager.initUserProfile(userData);
    }
    
    // 头像渲染
    updateProfileDisplay(profile) {
        console.log('👤 更新用户资料:', profile);
        
        // 更新欢迎模块中的用户名
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage && profile && profile.username) {
            welcomeMessage.textContent = `欢迎回来，${profile.username}`;
            console.log('✅ 欢迎消息更新成功:', profile.username);
        }
        
        // 更新欢迎模块中的头像
        const avatarImage = document.getElementById('avatar-image');
        const avatarIcon = document.getElementById('avatar-icon');
        if (avatarImage && avatarIcon && profile && profile.avatar) {
            // 构建正确的头像URL
            const avatarUrl = `/uploads/avatars/${profile.avatar}`;
            avatarImage.src = avatarUrl;
            avatarImage.onerror = () => {
                // 如果头像加载失败，隐藏图片，显示图标
                avatarImage.classList.add('hidden');
                avatarIcon.classList.remove('hidden');
                console.warn('⚠️ 头像加载失败，使用默认图标');
            };
            avatarImage.onload = () => {
                // 头像加载成功，显示图片，隐藏图标
                avatarImage.classList.remove('hidden');
                avatarIcon.classList.add('hidden');
                console.log('✅ 头像更新成功:', avatarUrl);
            };
        } else if (avatarIcon) {
            // 没有头像时显示默认图标
            avatarIcon.classList.remove('hidden');
            if (avatarImage) {
                avatarImage.classList.add('hidden');
            }
            console.log('✅ 使用默认头像图标');
        }
        
        // 同时更新顶部导航栏中的用户名和头像（如果存在）
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        if (userName && profile && profile.username) {
            userName.textContent = profile.username;
            userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
            console.log('✅ 导航栏用户名更新成功:', profile.username);
        }
        if (userAvatar && profile && profile.avatar) {
            // 构建正确的头像URL
            const avatarUrl = `/uploads/avatars/${profile.avatar}`;
            userAvatar.src = avatarUrl;
            userAvatar.onerror = () => {
                // 如果头像加载失败，使用默认头像
                userAvatar.src = '/static/public/docs.png';
                console.warn('⚠️ 导航栏头像加载失败，使用默认头像');
            };
            console.log('✅ 导航栏头像更新成功:', avatarUrl);
        }
    }

    triggerAvatarUpload() {
        return this.profileManager.triggerAvatarUpload();
    }

    toggleEditMode() {
        return this.profileManager.toggleEditMode();
    }

    saveProfile() {
        return this.profileManager.saveProfile();
    }

    cancelEdit() {
        return this.profileManager.cancelEdit();
    }

    getCurrentUser() {
        return this.profileManager.getCurrentUser();
    }

    isAdmin() {
        return this.profileManager.isAdmin();
    }

    refreshUserInfo() {
        return this.profileManager.refreshUserInfo();
    }
    
    // 管理员功能相关
    checkAndShowAdminMenu() { 
        return this.adminManager.checkAdminPermissions();
    }
    
    bindAdminEvents() { 
        return this.adminManager.bindAdminEvents();
    }

    showAdminMenu() {
        return this.adminManager.showAdminMenu();
    }

    hideAdminMenu() {
        return this.adminManager.hideAdminMenu();
    }

    switchAdminView(view) {
        return this.adminManager.switchAdminView(view);
    }

    loadAdminData() {
        return this.adminManager.loadAdminData();
    }

    loadSystemStats() {
        return this.adminManager.loadSystemStats();
    }

    loadUserList() {
        return this.adminManager.loadUserList();
    }

    loadStorageData() {
        return this.adminManager.loadStorageData();
    }

    loadSystemSettings() {
        return this.adminManager.loadSystemSettings();
    }

    saveSystemSettings() {
        return this.adminManager.saveSystemSettings();
    }

    loadSystemLogs() {
        return this.adminManager.loadSystemLogs();
    }

    isAdminUser() {
        return this.adminManager.isAdminUser();
    }

    getAdminSettings() {
        return this.adminManager.getAdminSettings();
    }

    getSystemStats() {
        return this.adminManager.getSystemStats();
    }

    // 文档同步功能相关
    showSyncPanel() {
        return this.docsSync.showSyncPanel();
    }

    hideSyncPanel() {
        return this.docsSync.hideSyncPanel();
    }

    startManualSync() {
        return this.docsSync.startManualSync();
    }

    stopSync() {
        return this.docsSync.stopSync();
    }

    refreshSyncStatus() {
        return this.docsSync.refreshSyncStatus();
    }

    showSyncSettings() {
        return this.docsSync.showSyncSettings();
    }

    addExternalDoc(url) {
        return this.docsSync.addExternalDoc(url);
    }

    syncSingleDoc(docId) {
        return this.docsSync.syncSingleDoc(docId);
    }

    editDoc(docId) {
        return this.docsSync.editDoc(docId);
    }

    removeDoc(docId) {
        return this.docsSync.removeDoc(docId);
    }

    removeFromQueue(index) {
        return this.docsSync.removeFromQueue(index);
    }

    getSyncStatus() {
        return this.docsSync.getSyncStatus();
    }

    getSyncProgress() {
        return this.docsSync.getSyncProgress();
    }

    getSyncConfig() {
        return this.docsSync.getSyncConfig();
    }

    getExternalDocs() {
        return this.docsSync.getExternalDocs();
    }

    getSyncStats() {
        return this.docsSync.getSyncStats();
    }

    isSyncing() {
        return this.docsSync.isSyncing();
    }

    isAutoSyncEnabled() {
        return this.docsSync.isAutoSyncEnabled();
    }
    
    // 文档同步相关
    bindSyncDocsEvents() { 
        if (this.docsSync && this.docsSync.bindSyncDocsEvents) {
            this.docsSync.bindSyncDocsEvents();
        } else {
            console.warn('文档同步模块未正确初始化');
        }
    }
    
    showSyncDocsModal() { 
        if (this.docsSync && this.docsSync.showSyncPanel) {
            this.docsSync.showSyncPanel();
        } else {
            console.warn('文档同步模块未正确初始化');
        }
    }
    
    // URL管理相关
    showUrlUploadModal() { 
        if (this.urlManager && this.urlManager.showUrlPanel) {
            this.urlManager.showUrlPanel();
        } else {
            console.warn('URL管理模块未正确初始化');
        }
    }
    
    hideUrlUploadModal() { 
        if (this.urlManager && this.urlManager.hideUrlPanel) {
            this.urlManager.hideUrlPanel();
        } else {
            console.warn('URL管理模块未正确初始化');
        }
    }
    
    submitUrlUpload() { 
        if (this.urlManager && this.urlManager.submitUrlUpload) {
            this.urlManager.submitUrlUpload();
        } else {
            console.warn('URL管理模块未正确初始化');
        }
    }
    
    // 工具函数相关
    logout() { 
        if (this.utils && this.utils.logout) {
            this.utils.logout();
        } else {
            // 默认登出逻辑
            if (window.app && window.app.logout) {
                window.app.logout();
            } else {
                console.warn('登出功能未正确初始化');
            }
        }
    }
    
    // 设置管理相关
    // 存储空间渲染
    updateStorageDisplay(storageInfo) {
        console.log('💾 更新存储空间显示:', storageInfo);
        if (!storageInfo) {
            console.warn('⚠️ 存储信息为空');
            return;
        }
        
        const used = storageInfo.used_space || 0;
        const total = storageInfo.total_space || 0;
        const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
        
        const formatSize = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        const usedFormatted = formatSize(used);
        const totalFormatted = formatSize(total);
        
        // 更新总空间
        const totalStorageElement = document.getElementById('total-storage');
        if (totalStorageElement) {
            totalStorageElement.textContent = totalFormatted;
        }
        
        // 更新已使用空间
        const usedStorageElement = document.getElementById('used-storage');
        if (usedStorageElement) {
            usedStorageElement.textContent = usedFormatted;
        }
        
        // 更新使用率
        const usagePercentageElement = document.getElementById('usage-percentage');
        if (usagePercentageElement) {
            usagePercentageElement.textContent = `${percentage}%`;
        }
        
        // 更新进度条
        const progressBarElement = document.getElementById('storage-progress-bar');
        if (progressBarElement) {
            progressBarElement.style.width = `${percentage}%`;
        }
        
        // 更新进度文本
        const progressTextElement = document.getElementById('storage-progress-text');
        if (progressTextElement) {
            progressTextElement.textContent = `${percentage}% 已使用`;
        }
        
        console.log('✅ 存储空间更新成功:', { 
            used, total, percentage, 
            usedFormatted, totalFormatted,
            elementsFound: {
                totalStorage: !!totalStorageElement,
                usedStorage: !!usedStorageElement,
                usagePercentage: !!usagePercentageElement,
                progressBar: !!progressBarElement,
                progressText: !!progressTextElement
            }
        });
    }

    // 分类管理相关方法
    initializeFileTypeButtons() {
        return this.categories.initializeFileTypeButtons();
    }

    forceUpdateCreateFolderButton() {
        return this.categories.forceUpdateCreateFolderButton();
    }

    handleFileTypeFilter(event) {
        return this.categories.handleFileTypeFilter(event);
    }

    filterFiles(type) {
        return this.categories.filterFiles(type);
    }

    toggleExpandableCategory(btn) {
        return this.categories.toggleExpandableCategory(btn);
    }

    expandSubCategories(btn, subContainer) {
        return this.categories.expandSubCategories(btn, subContainer);
    }

    collapseSubCategories(btn, subContainer) {
        return this.categories.collapseSubCategories(btn, subContainer);
    }

    createExpandableCategory(config) {
        return this.categories.createExpandableCategory(config);
    }

    handleSubFileTypeFilter(btn) {
        return this.categories.handleSubFileTypeFilter(btn);
    }

    disableCategoryButtons() {
        return this.categories.disableCategoryButtons();
    }

    enableCategoryButtons() {
        return this.categories.enableCategoryButtons();
    }
}

// 导出UI管理器
window.UIManager = UIManager; 