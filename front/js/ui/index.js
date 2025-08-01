/**
 * UI模块主入口
 * 整合所有UI功能模块，提供统一的UIManager接口
 */

// 核心模块将在HTML中单独引用
// 分类管理模块将在HTML中单独引用
// 文件渲染模块将在HTML中单独引用
// 文件夹管理模块将在HTML中单独引用
// 文件预览模块将在HTML中单独引用
class UIManager {
    constructor() {
        // 使用新的API系统，确保向后兼容
        this.api = window.apiSystem || window.apiManager;
        if (!this.api) {
            console.warn('API系统未找到');
        }
        this.currentFolderId = null;
        this.folders = [];
        this.currentCategory = 'all'; // 记录当前分类
        this.allFiles = []; // 缓存所有文件数
        this.isLoading = false; // 防抖标志
        this.isSubmittingDoc = false; // 防重复提交标志
        this.isInitialized = false; // 初始化状态标志
        
        // 延迟初始化，确保所有依赖的类都已加载
        this.initWithRetry();
    }

    /**
     * 带重试的初始化方法
     */
    async initWithRetry() {
        let attempts = 0;
        const maxAttempts = 50; // 最多等待50次
        
        while (attempts < maxAttempts) {
            // 检查所有必需的类是否已定义
            if (this.checkAllClassesDefined()) {
                // 所有类都已定义，开始初始化
                this.initializeComponents();
                // 调用完整的初始化方法
                await this.init();
                return;
            }
            
            // 等待100ms后重试
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // 超时后仍然尝试初始化
        console.warn('⚠️ UI类加载超时，尝试初始化...');
        this.initializeComponents();
        await this.init();
    }

    /**
     * 检查所有必需的UI类是否已定义
     */
    checkAllClassesDefined() {
        const requiredClasses = [
            'UICore', 'UICategories', 'UIFileRenderer', 'UIFolderManager',
            'UIFilePreview', 'UIFileOperations', 'UIUploadManager', 'UIModalManager',
            'UIProfileManager', 'UIAdminManager', 'UIDocsSync', 'UIUtils',
            'UISettingsManager', 'UIUserManager', 'UIUpdateLogsManager'
        ];
        
        return requiredClasses.every(className => typeof window[className] === 'function');
    }

    /**
     * 初始化所有UI组件
     */
    initializeComponents() {
        // 初始化核心组件
        if (typeof UICore !== 'undefined') {
            this.core = new UICore();
            this.core.uiManager = this;
        }
        
        if (typeof UICategories !== 'undefined') {
            this.categories = new UICategories();
            this.categories.uiManager = this;
        }
        
        if (typeof UIFileRenderer !== 'undefined') {
            this.fileRenderer = new UIFileRenderer();
            this.fileRenderer.uiManager = this;
        }
        
        if (typeof UIFolderManager !== 'undefined') {
            this.folderManager = new UIFolderManager();
            this.folderManager.uiManager = this;
        }
        
        if (typeof UIFilePreview !== 'undefined') {
            this.filePreview = new UIFilePreview();
            this.filePreview.uiManager = this;
        }
        
        if (typeof UIFileOperations !== 'undefined') {
            this.fileOperations = new UIFileOperations();
            this.fileOperations.uiManager = this;
        }
        
        if (typeof UIModalManager !== 'undefined') {
            this.modalManager = new UIModalManager();
            this.modalManager.uiManager = this;
        }
        
        // 初始化各个管理器
        if (typeof UIHelpManager !== 'undefined') {
            this.helpManager = new UIHelpManager();
            this.helpManager.uiManager = this;
        }
        if (typeof UIProfileManager !== 'undefined') {
            this.profileManager = new UIProfileManager();
            this.profileManager.uiManager = this;
        }
        if (typeof UISettingsManager !== 'undefined') {
            this.settingsManager = new UISettingsManager();
            this.settingsManager.uiManager = this;
        }
        if (typeof UIUploadManager !== 'undefined') {
            this.uploadManager = new UIUploadManager();
            this.uploadManager.uiManager = this;
        }
        if (typeof UIUserManager !== 'undefined') {
            this.userManager = new UIUserManager();
            this.userManager.uiManager = this;
        }
        if (typeof UIAdminManager !== 'undefined') {
            this.adminManager = new UIAdminManager();
            this.adminManager.uiManager = this;
        }
        if (typeof UIDocsSync !== 'undefined') {
            this.docsSync = new UIDocsSync();
            this.docsSync.uiManager = this;
        }
        if (typeof UIUpdateLogsManager !== 'undefined') {
            this.updateLogsManager = new UIUpdateLogsManager();
            this.updateLogsManager.uiManager = this;
        }
    }

    /**
     * 使用降级方案的组件初始化
     */
    initializeComponentsWithFallback() {
        console.warn('⚠️ 使用降级方案初始化UI组件');
        
        // 只初始化可用的组件
        if (typeof UICore !== 'undefined') {
            this.core = new UICore();
            this.core.uiManager = this;
        }
        
        if (typeof UICategories !== 'undefined') {
            this.categories = new UICategories(this);
        }
        
        if (typeof UIFileRenderer !== 'undefined') {
            this.fileRenderer = new UIFileRenderer(this);
        }
        
        if (typeof UIFolderManager !== 'undefined') {
            this.folderManager = new UIFolderManager(this);
        }
        
        if (typeof UIFilePreview !== 'undefined') {
            this.filePreview = new UIFilePreview(this);
        }
        
        if (typeof UIFileOperations !== 'undefined') {
            this.fileOperations = new UIFileOperations();
        }
        
        if (typeof UIUploadManager !== 'undefined') {
            this.uploadManager = new UIUploadManager(this);
        }
        
        if (typeof UIModalManager !== 'undefined') {
            this.modalManager = new UIModalManager();
        }
        
        if (typeof UIProfileManager !== 'undefined') {
            this.profileManager = new UIProfileManager();
        }
        
        if (typeof UIAdminManager !== 'undefined') {
            this.adminManager = new UIAdminManager();
        }
        
        if (typeof UIDocsSync !== 'undefined') {
            this.docsSync = new UIDocsSync();
        }
        
        if (typeof UIUtils !== 'undefined') {
            this.utils = new UIUtils();
        }
        
        if (typeof UISettingsManager !== 'undefined') {
            this.settingsManager = new UISettingsManager();
        }
        
        if (typeof UIUserManager !== 'undefined') {
            this.userManager = new UIUserManager(this);
        }
        
        if (typeof UIHelpManager !== 'undefined') {
            this.helpManager = new UIHelpManager();
        }
        
        if (typeof UIUpdateLogsManager !== 'undefined') {
            this.updateLogsManager = new UIUpdateLogsManager();
        }
        
        this.init();
    }

    async init() {
        try {
            // 立即隐藏管理员按钮，避免页面刷新时短暂显示
            this.hideAdminButtonsImmediately();
            
            // 初始化组件
            await this.initializeComponents();
            
            // 初始化UICore
            if (this.core) {
                this.core.init();
            } else {
                console.error('❌ UICore未找到');
            }
            
            // 初始化各个管理器
            if (this.adminManager) {
                await this.adminManager.init();
            } else {
                console.error('❌ 管理员管理器未找到');
            }
            if (this.helpManager) {
                this.helpManager.init();
            }
            if (this.profileManager) {
                this.profileManager.init();
            }
            if (this.settingsManager) {
                this.settingsManager.init();
            }
            if (this.uploadManager) {
                this.uploadManager.init();
            }
            if (this.userManager) {
                this.userManager.init();
            }
            if (this.docsSync) {
                this.docsSync.init();
            }
            if (this.updateLogsManager) {
                this.updateLogsManager.init();
            }
            
            // 绑定事件
            this.bindSettingsEvents();
            this.bindProfileEvents();
            
            // 页面加载时检查管理员权限
            if (this.adminManager) {
                await this.adminManager.checkAdminPermissions();
            }
            
            // 延迟确保头像显示稳定
            setTimeout(() => {
                this.ensureAvatarDisplayStability();
            }, 100);
            
            // 强制绑定存储设置按钮（只调用一次，避免重复绑定）
            setTimeout(() => {
                this.forceBindStorageSettingsButton();
            }, 1000);
            
            // 延迟检查管理员权限并显示相应按钮
            setTimeout(() => {
                // 只有在确认是管理员后才显示存储设置按钮
                if (this.adminManager && this.adminManager.isAdmin) {
                    this.forceShowStorageSettingsButton();
                }
            }, 3000);
            
            // 设置滚动条可见
            this.ensureScrollbarVisibility();
            
            // 清理外部文档样式
            this.cleanupExternalDocsStyles();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 设置登录表单
            this.setupLoginForm();
            
            // 绑定上传按钮事件
            this.bindUploadBtn();
            
            // 标记初始化完成
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ UI管理器初始化失败:', error);
        }
    }
    
    /**
     * 确保头像显示稳定
     */
    ensureAvatarDisplayStability() {
        try {
            // 获取当前用户信息
            let userData = null;
            if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
                userData = window.StorageManager.getUser();
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    try {
                        userData = JSON.parse(userInfo);
                    } catch (error) {
                        console.warn('解析用户信息失败:', error);
                    }
                }
            }
            
            if (userData) {
                // 强制更新头像显示
                if (this.profileManager) {
                    this.profileManager.updateProfileDisplayFromCache(userData);
                }
                
                // 确保头像元素正确显示
                const avatarElements = [
                    document.getElementById('user-avatar'),
                    document.getElementById('avatar-image'),
                    document.getElementById('avatar-icon')
                ];
                
                avatarElements.forEach(element => {
                    if (element) {
                        // 确保头像元素可见
                        if (element.src && element.src !== '' && !element.src.includes('docs.png')) {
                            element.style.display = 'block';
                            element.style.visibility = 'visible';
                            element.style.opacity = '1';
                            element.classList.remove('hidden');
                        }
                    }
                });
            }
        } catch (error) {
            console.error('确保头像显示稳定失败:', error);
        }
    }

    /**
     * 立即隐藏管理员按钮，避免页面刷新时短暂显示
     */
    hideAdminButtonsImmediately() {
        // 管理员功能列表
        const adminFeatures = [
            { id: 'sync-docs-btn', type: 'flex' },
            { id: 'settings-btn', type: 'block' },
            { id: 'admin-menu', type: 'block' },
            { id: 'storage-settings-btn', type: 'inline-block' },
            { id: 'admin-users-btn', type: 'block' },
            { id: 'admin-update-logs-btn', type: 'block' }
        ];
        
        // 隐藏所有管理员功能
        adminFeatures.forEach(feature => {
            const element = document.getElementById(feature.id);
            if (element) {
                element.style.display = 'none';
                element.classList.add('hidden');
                element.setAttribute('hidden', '');
            }
        });
        
        // 隐藏外站文档按钮，保持正确的样式
        const externalDocsBtn = document.querySelector('.file-type-btn[data-type="external-docs"]');
        if (externalDocsBtn) {
            externalDocsBtn.style.display = 'none';
            externalDocsBtn.classList.add('hidden');
            externalDocsBtn.setAttribute('hidden', '');
            
            // 重置按钮样式，确保下次显示时正确
            externalDocsBtn.style.alignItems = '';
            externalDocsBtn.style.justifyContent = '';
            
            // 重置图标和文字样式
            const icon = externalDocsBtn.querySelector('i');
            const text = externalDocsBtn.querySelector('span');
            if (icon) {
                icon.style.display = '';
                icon.style.verticalAlign = '';
            }
            if (text) {
                text.style.display = '';
                text.style.verticalAlign = '';
            }
        }
    }

    /**
     * 强制显示管理存储空间按钮
     */
    forceShowStorageSettingsButton() {
        // 首先检查用户权限
        if (!this.isAdminUser()) {
            return;
        }
        
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        if (storageSettingsBtn) {
            // 强制显示按钮
            storageSettingsBtn.style.display = 'inline-block !important';
            storageSettingsBtn.style.visibility = 'visible !important';
            storageSettingsBtn.style.opacity = '1 !important';
            storageSettingsBtn.style.pointerEvents = 'auto !important';
            storageSettingsBtn.style.position = 'relative !important';
            storageSettingsBtn.style.zIndex = '1000 !important';
            
            // 移除隐藏相关的类和属性
            storageSettingsBtn.classList.remove('hidden');
            storageSettingsBtn.removeAttribute('hidden');
            storageSettingsBtn.removeAttribute('style'); // Remove all inline styles first
            
            // 重新设置样式
            storageSettingsBtn.style.setProperty('display', 'inline-block', 'important');
            storageSettingsBtn.style.setProperty('visibility', 'visible', 'important');
            storageSettingsBtn.style.setProperty('opacity', '1', 'important');
            storageSettingsBtn.style.setProperty('pointer-events', 'auto', 'important');
            
            // 检查父容器
            const parent = storageSettingsBtn.parentElement;
            if (parent) {
                parent.style.display = 'flex';
                parent.style.visibility = 'visible';
                parent.style.opacity = '1';
            }
            
            // 检查祖父容器
            const grandparent = parent ? parent.parentElement : null;
            if (grandparent) {
                grandparent.style.display = 'block';
                grandparent.style.visibility = 'visible';
                grandparent.style.opacity = '1';
            }
        }
    }

    // 绑定设置模态框事件
    bindSettingsEvents() {
        // 先移除之前的事件监听器，避免重复绑定
        const existingHandler = this._settingsEventHandler;
        if (existingHandler) {
            document.removeEventListener('click', existingHandler);
        }
        
        // 创建新的事件处理函数
        this._settingsEventHandler = (e) => {
            // 取消按钮
            if (e.target.id === 'cancel-settings-btn') {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
                return;
            }
            
            // 保存按钮
            if (e.target.id === 'save-settings-btn') {
                e.preventDefault();
                e.stopPropagation();
                this.saveStorageSettings();
                return;
            }
            
            // 关闭按钮 - 改进关闭按钮检测逻辑
            const closeButton = e.target.closest('button');
            if (closeButton && (
                closeButton.id === 'close-settings-modal' ||
                closeButton.innerHTML.includes('fa-times') ||
                closeButton.querySelector('.fa-times')
            )) {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
                return;
            }
            
            // 点击模态框外部区域关闭
            if (e.target.classList.contains('fixed') && e.target.getAttribute('data-modal') === 'settings') {
                e.preventDefault();
                e.stopPropagation();
                this.hideSettingsModal();
                return;
            }
        };
        
        // 绑定新的事件监听器
        document.addEventListener('click', this._settingsEventHandler);
    }

    // 绑定个人资料模态框事件
    bindProfileEvents() {
        // 头像文件选择
        document.addEventListener('change', (e) => {
            if (e.target.id === 'avatar-file-input') {
                if (this.profileManager) {
                    this.profileManager.handleProfileAvatarUpload(e);
                }
            }
        });
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

    async loadUserData(userData) {
        return this.core.loadUserData(userData);
    }

    showMainInterface() {
        return this.core.showMainInterface();
    }

    showLoginInterface() {
        return this.core.showLoginInterface();
    }

    // 文件渲染相关
    renderFileList(files) {
        // 传递当前布局模式给fileRenderer
        if (this.fileRenderer && typeof this.fileRenderer.renderFileList === 'function') {
            this.fileRenderer.layoutMode = this.fileRenderer.layoutMode || 'card';
            this.fileRenderer.renderFileList(files, this.fileRenderer.layoutMode);
        }
    }
    
    createFileCard(file) { 
        return this.fileRenderer.createFileCard(file);
    }
    
    // 文件统计
    updateFileCount(current, total) {
        // 更新欢迎区域的统计
        const countElement = document.getElementById('file-count');
        if (countElement) {
            // 显示当前文件数量
            countElement.textContent = current;
        }
        
        // 更新文件列表区域的统计
        const countDisplayElement = document.getElementById('file-count-display');
        const countDescElement = document.getElementById('file-count-desc');
        if (countDisplayElement) {
            // 在文件列表区域显示当前文件数
            countDisplayElement.textContent = current;
        }
        
        // 根据当前分类更新计数描述文本
        if (countDescElement) {
            const currentCategory = this.currentCategory || 'all';
            let unitText = '个文件';
            
            // 外站文档分类显示"个文档"，其他分类显示"个文件"
            if (currentCategory === 'external-docs') {
                unitText = '个文档';
            }
            
            // 更新计数描述文本
            const spans = countDescElement.querySelectorAll('span');
            spans.forEach(span => {
                if (span.classList.contains('hidden') && span.classList.contains('xs:inline')) {
                    // 这是显示"个文件"或"个文档"的span
                    if (span.textContent.includes('个文件')) {
                        span.textContent = ` ${unitText}`;
                    } else if (span.textContent.includes('个文')) {
                        span.textContent = ` ${unitText}`;
                    } else if (span.textContent.includes('个文档')) {
                        span.textContent = ` ${unitText}`;
                    }
                } else if (span.classList.contains('xs:hidden')) {
                    // 这是小屏幕显示的
                    span.textContent = unitText.replace(', ', '');
                }
            });
        }
        
        // 如果是管理员，确保文件统计正确显示
        if (this.adminManager && this.adminManager.isAdmin) {
            // 强制更新欢迎模块的文件统计
            const welcomeFileCount = document.getElementById('file-count');
            if (welcomeFileCount) {
                welcomeFileCount.textContent = current;
            }
            
            // 强制更新文件列表区域的统计
            const fileListCount = document.getElementById('file-count-display');
            if (fileListCount) {
                fileListCount.textContent = current;
            }
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
        if (this.folderManager && typeof this.folderManager.renderFolderList === 'function') {
            return this.folderManager.renderFolderList(folders);
        } else {
            console.warn('folderManager未初始化或renderFolderList方法不存在');
            return Promise.resolve();
        }
    }
    
    // 刷新文件夹列表
    async refreshFolders() {
        try {
            if (!this.folders) {
                const response = await fetch('/api/folders');
                const result = await response.json();
                if (result.success) {
                    this.folders = result.data;
                } else {
                    this.folders = [];
                }
            }
            
            if (this.folderManager && typeof this.folderManager.renderFolderList === 'function') {
                await this.folderManager.renderFolderList(this.folders);
            } else {
                console.warn('folderManager未初始化或renderFolderList方法不存在');
            }
        } catch (error) {
            console.error('刷新文件夹失败:', error);
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
    async loadFiles() {
        try {
            // 显示加载状态
            const fileGrid = document.getElementById('files-grid');
            if (fileGrid) {
                fileGrid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12 md:py-16 text-center">
                        <div class="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 rounded-full bg-purple-light/10 flex items-center justify-center animate-pulse">
                            <i class="fa fa-spinner fa-spin text-2xl md:text-4xl text-purple-light/70"></i>
                        </div>
                        <h2 class="text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 mb-2">正在加载文件...</h2>
                    </div>
                `;
            }
            
            // 从后端获取数据
            const [files, urlFiles] = await Promise.all([
                this.api.files.getFiles(),
                this.api.urlFiles.getUrlFiles()
            ]);

            // 合并普通文件和URL文件
            const allFiles = [...files, ...urlFiles];

            // 更新界面
            this.renderFileList(allFiles);
        } catch (error) {
            console.error('加载文件失败:', error);
            this.showMessage('重新加载文件失败', 'error');
            
            // 显示错误状态
            const fileGrid = document.getElementById('files-grid');
            if (fileGrid) {
                fileGrid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12 md:py-16 text-center">
                        <div class="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                            <i class="fa fa-exclamation-triangle text-2xl md:text-4xl text-red-400"></i>
                        </div>
                        <h2 class="text-lg md:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-pink-300 mb-2">加载失败</h2>
                        <p class="text-gray-400 max-w-md mb-4 md:mb-6 text-sm md:text-base px-4">文件加载失败，请刷新页面重试。</p>
                    </div>
                `;
            }
        }
    }

    async handleSearch(searchTerm) { 
        this.fileOperations.debouncedSearch(searchTerm, (results) => {
            // 处理搜索结果
            if (results.length > 0) {
                this.renderFileList(results);
                this.showMessage(`数据已更新，找到${results.length}个匹配结果`, 'success');
            } else if (searchTerm.trim()) {
                // 只有在有搜索词但没有结果时才显示消息
                this.showMessage('未找到匹配的文件', 'info');
            }
        });
        
        // 如果搜索为空，立即还原完整文件列表
        if (!searchTerm.trim()) {
            await this.loadFiles();
        }
    }
    
    downloadFile(file) { 
        return this.fileOperations.downloadFile(file);
    }
    
    deleteFile(file) { 
        return this.fileOperations.deleteFile(file, async () => {
            // 删除成功后刷新文件列表
            await this.loadFiles();
        });
    }

    batchDeleteFiles(files) {
        return this.fileOperations.batchDeleteFiles(files, async () => {
            // 批量删除成功后刷新文件列表
            await this.loadFiles();
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
    
    async handleFileUpload(files) { 
        // 先添加到队列，只有在成功添加文件后才开始上传
        const originalQueueLength = this.uploadManager.uploadQueue.length;
        await this.uploadManager.addFilesToQueue(files, false);
        
        // 只有当队列长度增加时才调用startUpload
        if (this.uploadManager.uploadQueue.length > originalQueueLength) {
            this.uploadManager.startUpload();
        }
        // 移除这里的成功提示，让upload-manager.js中的handleUploadSuccess方法处理
    }
    
    handleFileSelect(event) { 
        if (this.uploadManager && typeof this.uploadManager.handleFileSelect === 'function') {
            return this.uploadManager.handleFileSelect(event);
        }
        return false;
    }
    
    updateFileInputMultiple() { 
        if (this.uploadManager && typeof this.uploadManager.updateFileInputMultiple === 'function') {
            return this.uploadManager.updateFileInputMultiple();
        }
        // 如果uploadManager不存在，静默返回
        return false;
    }
    
    updateUploadAreaHint() { 
        if (this.uploadManager && typeof this.uploadManager.updateUploadAreaHint === 'function') {
            return this.uploadManager.updateUploadAreaHint();
        }
        // 如果uploadManager不存在，静默返回
        return false;
    }

    initUploadManager(uploadAreaSelector, fileInputSelector) {
        if (this.uploadManager && typeof this.uploadManager.init === 'function') {
            return this.uploadManager.init(uploadAreaSelector, fileInputSelector);
        }
        return false;
    }

    setMaxFileSize(size) {
        if (this.uploadManager && typeof this.uploadManager.setMaxFileSize === 'function') {
            return this.uploadManager.setMaxFileSize(size);
        }
        return false;
    }

    setAllowedTypes(types) {
        if (this.uploadManager && typeof this.uploadManager.setAllowedTypes === 'function') {
            return this.uploadManager.setAllowedTypes(types);
        }
        return false;
    }

    getUploadQueue() {
        if (this.uploadManager && typeof this.uploadManager.getUploadQueue === 'function') {
            return this.uploadManager.getUploadQueue();
        }
        return [];
    }

    isCurrentlyUploading() {
        if (this.uploadManager && typeof this.uploadManager.isCurrentlyUploading === 'function') {
            return this.uploadManager.isCurrentlyUploading();
        }
        return false;
    }

    cancelUpload(fileId) {
        if (this.uploadManager && typeof this.uploadManager.cancelUpload === 'function') {
            return this.uploadManager.cancelUpload(fileId);
        }
        return false;
    }

    retryUpload(fileId) {
        if (this.uploadManager && typeof this.uploadManager.retryUpload === 'function') {
            return this.uploadManager.retryUpload(fileId);
        }
        return false;
    }
    
    // 模态框管理相关
    showMessage(message, type = 'info') { 
        if (this.modalManager && typeof this.modalManager.showMessage === 'function') {
            return this.modalManager.showMessage(message, type);
        }
        // 如果modalManager不存在，使用备用方法
        return false;
    }
    
    showCreateFolderModal() { 
        const modal = document.getElementById('create-folder-modal');
        const input = document.getElementById('folder-name-input');
        
        if (modal && input) {
            input.value = ''; // 清空输入框
            modal.classList.remove('opacity-0', 'invisible');
            input.focus(); // 聚焦到输入框
            
            // 显示当前分类信息
            const categoryLabel = this.getCategoryLabel(this.currentCategory);
            const categoryInfo = document.getElementById('current-category-info');
            if (categoryInfo) {
                categoryInfo.textContent = `当前分类${categoryLabel}`;
                categoryInfo.style.display = 'block';
            }
            
            // 绑定事件监听器
            this.bindCreateFolderEvents();
        }
    }
    
    // 绑定创建文件夹模态框的事件
    bindCreateFolderEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('close-create-folder-btn');
        const cancelBtn = document.getElementById('cancel-create-folder-btn');
        const confirmBtn = document.getElementById('confirm-create-folder-btn');
        const input = document.getElementById('folder-name-input');
        
        // 检查所有元素是否存在
        if (!closeBtn || !cancelBtn || !confirmBtn || !input) {
            console.error('Some create folder modal elements not found:', {
                closeBtn: !!closeBtn,
                cancelBtn: !!cancelBtn,
                confirmBtn: !!confirmBtn,
                input: !!input
            });
            return;
        }
        
        // 直接绑定事件，不使用replaceWith
        closeBtn.addEventListener('click', () => this.hideCreateFolderModal());
        cancelBtn.addEventListener('click', () => this.hideCreateFolderModal());
        confirmBtn.addEventListener('click', () => this.createFolder());
        input.addEventListener('keypress', (event) => this.handleCreateFolderKeypress(event));
        
        // 点击模态框背景关闭
        const modal = document.getElementById('create-folder-modal');
        if (modal) {
            modal.addEventListener('click', (event) => this.handleCreateFolderModalClick(event));
        }
    }
    
    // 处理回车键
    handleCreateFolderKeypress(event) {
        if (event.key === 'Enter') {
            this.createFolder();
        }
    }
    
    // 处理模态框背景点击
    handleCreateFolderModalClick(event) {
        if (event.target.id === 'create-folder-modal') {
            this.hideCreateFolderModal();
        }
    }
    
    // 隐藏新建分组模态框
    hideCreateFolderModal() {
        const modal = document.getElementById('create-folder-modal');
        const categoryInfo = document.getElementById('current-category-info');
        
        if (modal) {
            modal.classList.add('opacity-0', 'invisible');
        }
        
        // 隐藏分类信息
        if (categoryInfo) {
            categoryInfo.style.display = 'none';
        }
    }
    
    // 创建文件夹
    async createFolder() {
        const input = document.getElementById('folder-name-input');
        const folderName = input?.value?.trim();
        const category = this.currentCategory;
        
        if (!folderName) {
            this.showMessage('请输入文件夹名称', 'error');
            return;
        }
        
        // 如果当前分类为全部文件，提示用户选择具体分类
        if (!category || category === 'all') {
            this.showMessage('请先选择具体分类（如文档、图片等），然后在该分类下创建文件夹', 'error');
            return;
        }
        
        // 检查是否存在同名文件夹（前端预检查）
        if (!this.folders || !Array.isArray(this.folders)) {
            this.folders = []; // 初始化为空数组
        }
        
        const existingFolders = this.folders.filter(folder => folder.category === category);
        const duplicateFolder = existingFolders.find(folder => 
            folder.name.toLowerCase() === folderName.toLowerCase()
        );
        
        if (duplicateFolder) {
            this.showMessage(`该分类下已存在名称${folderName}"的文件夹，请使用其他名称`, 'error');
            return;
        }
        
        try {
            const result = await this.api.folders.createFolder(folderName, category);
            
            if (result.success) {
                this.showMessage('文件夹创建成功', 'success');
                this.hideCreateFolderModal();
                await this.refreshFolders();
            } else {
                // 处理后端返回的错误信息
                const errorMessage = result.error || result.message || '文件夹创建失败';
                this.showMessage(errorMessage, 'error');
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMessage = error.message || '文件夹创建失败';
            this.showMessage(errorMessage, 'error');
        }
    }
    
    async showProfileModal() {
        // 直接调用profileManager的showProfileModal方法
        if (this.profileManager) {
            await this.profileManager.showProfileModal();
        } else {
            console.error('❌ UIManager - profileManager未找到');
        }
    }
    // 个人资料相关方法委托给profileManager
    loadProfileData() {
        return this.profileManager ? this.profileManager.loadProfileData() : null;
    }
    saveProfileData() {
        return this.profileManager ? this.profileManager.saveProfile() : null;
    }
    updateProfileModalAvatar(avatarUrl) {
        return this.profileManager ? this.profileManager.updateProfileModalAvatar(avatarUrl) : null;
    }
    bindProfileModalEvents() {
        return this.profileManager ? this.profileManager.bindProfileEvents() : null;
    }
    handleProfileAvatarUpload(e) {
        return this.profileManager ? this.profileManager.handleProfileAvatarUpload(e) : null;
    }
    
    async showSettingsModal() { 
        // 设置按钮只有管理员才能看到，所以不需要再次检查权限
        
        // 清理所有已存在的设置模态框
        const existingModals = document.querySelectorAll('.fixed[data-modal="settings"]');
        existingModals.forEach(modal => {
            // 清理事件监听器
            const slider = modal.querySelector('#storage-slider');
            const input = modal.querySelector('#storage-input');
            if (slider && slider._sliderHandler) {
                slider.removeEventListener('input', slider._sliderHandler);
                slider.removeEventListener('change', slider._sliderHandler);
            }
            if (input && input._inputHandler) {
                input.removeEventListener('input', input._inputHandler);
                input.removeEventListener('change', input._inputHandler);
            }
            modal.remove();
        });

        // 清理旧的事件监听器
        if (this._settingsEventHandler) {
            document.removeEventListener('click', this._settingsEventHandler);
            this._settingsEventHandler = null;
        }

        // 先获取真实存储数据
        let storageInfo;
        try {
            const api = window.apiSystem || window.apiManager;
            if (api && api.storage && api.storage.getStorageInfo) {
                storageInfo = await api.storage.getStorageInfo();
            } else if (api && api.getStorageInfo) {
                storageInfo = await api.getStorageInfo();
            } else {
                return;
            }
            
            if (!storageInfo) {
                return;
            }
        } catch (error) {
            return;
        }

        // 计算真实数据
        const limitGB = Math.round((storageInfo.limit_bytes || storageInfo.total_space || 1073741824) / (1024 * 1024 * 1024)); // 默认1GB
        const usedGB = (storageInfo.used_bytes || storageInfo.used_space || 0) / (1024 * 1024 * 1024);
        const usagePercentage = limitGB > 0 ? ((usedGB / limitGB) * 100).toFixed(2) : '0.00';
        
        // 创建模态框，使用真实数据
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'settings');
        
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-md max-h-[80vh] shadow-2xl border border-purple-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-purple-300">存储空间设置</h3>
                    <button id="close-settings-modal" class="text-gray-400 hover:text-white transition-colors">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">存储空间限制</label>
                        <div class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <input type="range" id="storage-slider" min="1" max="20" value="${limitGB}" 
                                   class="flex-1 h-2 bg-dark-light rounded-lg appearance-none cursor-pointer slider">
                            <div class="flex items-center space-x-2">
                                <input type="number" id="storage-input" min="1" max="20" value="${limitGB}" 
                                       class="w-20 bg-dark-light border border-purple-light/30 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-light/50 focus:border-purple-light transition-all duration-300">
                                <span class="text-gray-400 text-sm">GB</span>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">设置范围：1GB - 20GB</p>
                    </div>
                    
                    <div class="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-3 border border-blue-400/20">
                        <h4 class="text-sm font-medium text-gray-300 mb-2">当前存储状态</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                                <div class="text-gray-400">总空间</div>
                                <div id="settings-total-storage" class="text-blue-300 font-medium">${limitGB} GB</div>
                            </div>
                            <div>
                                <div class="text-gray-400">已使用</div>
                                <div id="settings-used-storage" class="text-purple-300 font-medium">
                                    ${usedGB < 0.1 ? `${(usedGB * 1024).toFixed(1)} MB` : `${usedGB.toFixed(1)} GB`}
                                </div>
                            </div>
                            <div>
                                <div class="text-gray-400">使用率</div>
                                <div id="settings-usage-percentage" class="text-emerald-300 font-medium">${usagePercentage}%</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button id="cancel-settings-btn" class="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                        取消
                    </button>
                    <button id="save-settings-btn" class="px-4 py-2 bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary to-secondary text-white rounded-lg shadow-md shadow-primary/20 transition-all duration-300 transform hover:scale-[1.03]">
                        <i class="fa fa-save mr-1"></i> 保存设置
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 使用setTimeout确保DOM元素已经完全渲染后再绑定事件
        setTimeout(() => {
            // 绑定存储滑块事件
            this.bindStorageSliderEvents(usedGB);
            
            // 绑定设置模态框事件
            this.bindSettingsEvents();
        }, 0);
    }

    // 绑定存储滑块事件
    bindStorageSliderEvents(usedGB = 0) {
        // 检查是否有多个设置模态框
        const allSettingsModals = document.querySelectorAll('.fixed[data-modal="settings"]');

        // 使用最后一个模态框（最新的）
        const modal = allSettingsModals[allSettingsModals.length - 1];
        if (!modal) {
            console.warn('未找到设置模态框');
            return;
        }

        const slider = modal.querySelector('#storage-slider');
        const input = modal.querySelector('#storage-input');
        if (!slider || !input) {
            console.warn('未找到存储控件');
            return;
        }

        let cachedUsedSpace = usedGB;
        
        // 更新右侧显示
        const updateDisplay = (limitGB) => {
            const usagePercentage = limitGB > 0 ? ((cachedUsedSpace / limitGB) * 100).toFixed(2) : '0.00';
            const totalStorage = modal.querySelector('#settings-total-storage');
            const usedStorage = modal.querySelector('#settings-used-storage');
            const usagePercentageEl = modal.querySelector('#settings-usage-percentage');
            
            if (totalStorage) totalStorage.textContent = `${limitGB} GB`;
            if (usedStorage) {
                if (cachedUsedSpace < 0.1) {
                    usedStorage.textContent = `${(cachedUsedSpace * 1024).toFixed(1)} MB`;
                } else {
                    usedStorage.textContent = `${cachedUsedSpace.toFixed(1)} GB`;
                }
            }
            if (usagePercentageEl) usagePercentageEl.textContent = `${usagePercentage}%`;
        };
        
        // 确保滑块和输入框的值相同
        const syncValues = (value) => {
            const numValue = Math.max(1, Math.min(20, parseInt(value) || 1));
    
            slider.value = numValue;
            input.value = numValue;
            updateDisplay(numValue);
        };
        
        // 移除之前的事件监听器
        if (slider._sliderHandler) {
            slider.removeEventListener('input', slider._sliderHandler);
            slider.removeEventListener('change', slider._sliderHandler);
        }
        if (input._inputHandler) {
            input.removeEventListener('input', input._inputHandler);
            input.removeEventListener('change', input._inputHandler);
        }

        // 创建滑块事件处理函数
        slider._sliderHandler = (e) => {
            syncValues(e.target.value);
        };
        
        // 创建输入框事件处理器
        input._inputHandler = (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 1 && value <= 20) {
                syncValues(value);
            }
        };
        
        // 绑定事件监听器 - 使用多种事件类型确保兼容性
        slider.addEventListener('input', slider._sliderHandler);
        slider.addEventListener('change', slider._sliderHandler);
        input.addEventListener('input', input._inputHandler);
        input.addEventListener('change', input._inputHandler);

        // 初始值
        const initialValue = parseInt(slider.value) || 1;
        syncValues(initialValue);
    }

    // 保存设置后刷新主页面存储空间信息
    async saveStorageSettings() {
        // 防重复提交
        if (this._isSavingSettings) {
            return;
        }
        this._isSavingSettings = true;

        try {
            // 获取当前活动的设置模态框中的输入框
            const allSettingsModals = document.querySelectorAll('.fixed[data-modal="settings"]');
            const currentModal = allSettingsModals[allSettingsModals.length - 1];
            const input = currentModal ? currentModal.querySelector('#storage-input') : null;
            
            if (!input) {
                this.showMessage('找不到存储设置输入框', 'error');
                return;
            }

            const limitGB = parseInt(input.value);

            if (limitGB < 1 || limitGB > 20) {
                this.showMessage('存储空间限制必须在1-20GB之间', 'error');
                return;
            }

            const limitBytes = limitGB * 1024 * 1024 * 1024;

            const result = await this.api.storage.updateStorageLimit(limitBytes);

            this.clearAllMessages();
            this.showMessage('存储空间设置已保存', 'success');
            this.hideSettingsModal();
            
            // 立即刷新所有存储空间显示
            await this.refreshAllStorageDisplays();
        } catch (error) {
            console.error('保存存储设置失败:', error);
            this.showMessage(error.message || '保存设置失败', 'error');
        } finally {
            this._isSavingSettings = false;
        }
    }

    // 刷新所有存储空间显示
    async refreshAllStorageDisplays() {
        try {
            // 获取最新的存储信息
            const storageInfo = await this.api.storage.getStorageInfo();
            if (!storageInfo) {
                console.warn('无法获取存储信息');
                return;
            }
            
            // 同步所有存储空间显示
            await this.syncStorageDisplay(storageInfo);
            
            // 更新设置模态框中的显示（如果存在）
            const settingsModals = document.querySelectorAll('.fixed[data-modal="settings"]');
            settingsModals.forEach(modal => {
                const totalStorage = modal.querySelector('#settings-total-storage');
                const usedStorage = modal.querySelector('#settings-used-storage');
                const usagePercentage = modal.querySelector('#settings-usage-percentage');
                
                if (totalStorage) {
                    const limitGB = Math.round((storageInfo.limit_bytes || storageInfo.total_space) / (1024 * 1024 * 1024));
                    totalStorage.textContent = `${limitGB} GB`;
                }
                
                if (usedStorage) {
                    const usedGB = (storageInfo.used_bytes || storageInfo.used_space) / (1024 * 1024 * 1024);
                    if (usedGB < 0.1) {
                        usedStorage.textContent = `${(usedGB * 1024).toFixed(1)} MB`;
                    } else {
                        usedStorage.textContent = `${usedGB.toFixed(1)} GB`;
                    }
                }
                
                if (usagePercentage) {
                    const limitGB = Math.round((storageInfo.limit_bytes || storageInfo.total_space) / (1024 * 1024 * 1024));
                    const usedGB = (storageInfo.used_bytes || storageInfo.used_space) / (1024 * 1024 * 1024);
                    const percentage = limitGB > 0 ? ((usedGB / limitGB) * 100).toFixed(2) : '0.00';
                    usagePercentage.textContent = `${percentage}%`;
                }
            });
            
        } catch (error) {
            console.error('刷新存储空间显示失败:', error);
        }
    }

    // 全局存储同步方法
    async syncStorageDisplay(storageInfo) {
        if (!storageInfo || storageInfo.used_space === undefined || storageInfo.total_space === undefined) {
            console.warn('⚠️ 存储信息格式不正确', storageInfo);
            return;
        }

        try {
            // 更新存储信息到本地缓存
            if (window.StorageManager && typeof window.StorageManager.setStorageInfo === 'function') {
                window.StorageManager.setStorageInfo(storageInfo);
            }
            
            // 更新主页存储空间概览
            this.updateStorageDisplay(storageInfo);
            
            // 更新用户管理页面的存储显示（如果存在）
            if (window.userManager && typeof window.userManager.updateStorageDisplay === 'function') {
                window.userManager.updateStorageDisplay(storageInfo);
            }
            

            
            // 更新设置页面的存储显示（如果存在）
            if (window.settingsManager && typeof window.settingsManager.renderStorageData === 'function') {
                window.settingsManager.renderStorageData(storageInfo);
            }
            
            // 更新个人资料页面的存储显示（如果存在）
            if (window.profileManager && typeof window.profileManager.updateStorageInfo === 'function') {
                window.profileManager.updateStorageInfo(storageInfo);
            }
            
        } catch (error) {
            console.error('同步存储空间显示失败:', error);
        }
    }

    // 隐藏设置模态框
    hideSettingsModal() {
        // 移除所有设置相关的模态框
        const modals = document.querySelectorAll('.fixed[data-modal="settings"]');
        modals.forEach(modal => {
            // 清理模态框的事件监听器
            const slider = modal.querySelector('#storage-slider');
            const input = modal.querySelector('#storage-input');
            
            if (slider && slider._sliderHandler) {
                slider.removeEventListener('input', slider._sliderHandler);
                slider.removeEventListener('change', slider._sliderHandler);
                slider._sliderHandler = null;
            }
            if (input && input._inputHandler) {
                input.removeEventListener('input', input._inputHandler);
                input.removeEventListener('change', input._inputHandler);
                input._inputHandler = null;
            }
            modal.remove();
        });
        
        // 清理事件监听器
        if (this._settingsEventHandler) {
            document.removeEventListener('click', this._settingsEventHandler);
            this._settingsEventHandler = null;
        }
        
        // 确保所有相关的事件监听器都被清理
        const allSettingsButtons = document.querySelectorAll('#close-settings-modal, #cancel-settings-btn, #save-settings-btn');
        allSettingsButtons.forEach(button => {
            // 移除可能存在的内联事件监听器
            button.onclick = null;
            button.onmousedown = null;
            button.onmouseup = null;
        });
    }

    hideProfileModal() {
        const modal = document.querySelector('.fixed[data-modal="profile"]');
        if (modal) {
            modal.remove();
        }
    }

    // 加载存储设置
    async loadStorageSettings() {
        try {
            const storageInfo = await this.api.storage.getStorageInfo();
            const slider = document.getElementById('storage-slider');
            const input = document.getElementById('storage-input');
            const totalStorage = document.getElementById('settings-total-storage');
            const usedStorage = document.getElementById('settings-used-storage');
            const usagePercentage = document.getElementById('settings-usage-percentage');

            if (slider && input) {
                const limitGB = Math.round(storageInfo.total_space / (1024 * 1024 * 1024));
                slider.value = limitGB;
                input.value = limitGB;
            }

            if (totalStorage) {
                totalStorage.textContent = this.formatStorageSize(storageInfo.total_space);
            }

            if (usedStorage) {
                usedStorage.textContent = this.formatStorageSize(storageInfo.used_space);
            }

            if (usagePercentage) {
                const percentage = (storageInfo.used_space / storageInfo.total_space) * 100;
                usagePercentage.textContent = `${percentage.toFixed(2)}%`;
            }
        } catch (error) {
            // 静默处理错误
        }
    }

    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            // 先移除旧弹窗
            let modal = document.getElementById('system-confirm-modal');
            if (modal) modal.remove();

            // 创建弹窗
            modal = document.createElement('div');
            modal.id = 'system-confirm-modal';
            modal.innerHTML = `
              <div class="modal-mask system-modal-mask">
                <div class="modal-box system-modal-box">
                  <div class="modal-title">${title || '确认操作'}</div>
                  <div class="modal-message">${message || ''}</div>
                  <div class="modal-actions">
                    <button id="system-confirm-ok-btn" class="btn btn-confirm">确定</button>
                    <button id="system-confirm-cancel-btn" class="btn btn-cancel">取消</button>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(modal);

            // 事件绑定
            setTimeout(() => {
                const okBtn = document.getElementById('system-confirm-ok-btn');
                const cancelBtn = document.getElementById('system-confirm-cancel-btn');
                const mask = modal.querySelector('.system-modal-mask');
                if (okBtn) okBtn.onclick = () => { modal.remove(); resolve(true); };
                if (cancelBtn) cancelBtn.onclick = () => { modal.remove(); resolve(false); };
                if (mask) mask.onclick = (e) => { if (e.target === mask) { modal.remove(); resolve(false); } };
                document.addEventListener('keydown', function escHandler(ev) {
                    if (ev.key === 'Escape') {
                        modal.remove();
                        resolve(false);
                        document.removeEventListener('keydown', escHandler);
                    }
                });
            }, 0);

            // 注入样式（如有必要，可复用你已有的管理弹窗样式）
            if (!document.getElementById('system-modal-style')) {
                const style = document.createElement('style');
                style.id = 'system-modal-style';
                style.innerHTML = `
                .system-modal-mask { position: fixed; z-index: 9999; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(20,22,30,0.55); display: flex; align-items: center; justify-content: center; }
                .system-modal-box { background: #23272f; color: #e5e7eb; border-radius: 12px; min-width: 280px; max-width: 92vw; box-shadow: 0 4px 32px #000a; padding: 28px 36px 22px 36px; text-align: center; position: relative; }
                .system-modal-box .modal-title { font-size: 19px; font-weight: 600; margin-bottom: 14px; color: #fff; }
                .system-modal-box .modal-message { font-size: 15px; margin-bottom: 26px; color: #b5bac8; }
                .system-modal-box .modal-actions { display: flex; gap: 18px; justify-content: center; }
                .system-modal-box .btn { padding: 7px 28px; font-size: 15px; border: none; border-radius: 6px; cursor: pointer; transition: background 0.18s, color 0.18s, box-shadow 0.18s; }
                .system-modal-box .btn-confirm { background: #22c55e; color: #fff; font-weight: 500; }
                .system-modal-box .btn-confirm:hover { background: #16a34a; }
                .system-modal-box .btn-cancel { background: #353945; color: #b5bac8; }
                .system-modal-box .btn-cancel:hover { background: #23272f; color: #fff; }
                `;
                document.head.appendChild(style);
            }
        });
    }

    showCompactConfirmDialog(title, message, options) {
        return this.modalManager.showCompactConfirmDialog(title, message, options);
    }

    showInputDialog(title, inputs, options) {
        return this.modalManager.showInputDialog(title, inputs, options);
    }

    showCustomDialog(config) {
        return this.modalManager.showCustomDialog(config);
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
        // 调用 profileManager的updateProfileDisplay方法来更新头像和用户信息
        if (this.profileManager) {
            this.profileManager.updateProfileDisplay(profile);
        }
        
        // 更新欢迎模块中的用户信息
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage && profile && profile.username) {
            welcomeMessage.textContent = `欢迎回来${profile.username}`;
        }
        
        // 如果是管理员，确保所有用户信息元素都正确显示
        if (profile && profile.username === 'Mose' && this.adminManager && this.adminManager.isAdmin) {
            // 强制更新欢迎模块的用户名
            if (welcomeMessage) {
                welcomeMessage.textContent = `欢迎回来${profile.username}`;
            }
            
            // 强制更新头像显示
            if (this.profileManager) {
                this.profileManager.updateProfileDisplay(profile);
            }
            
            // 确保当前日期显示
            const currentDateElement = document.getElementById('current-date');
            if (currentDateElement) {
                const today = new Date();
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                currentDateElement.textContent = today.toLocaleDateString('zh-CN', options);
            }
        }
    }

    // 从缓存更新用户信息（用于页面刷新时）
    updateProfileDisplayFromCache(userData) {
        // 调用 profileManager的updateProfileDisplayFromCache方法
        if (this.profileManager) {
            this.profileManager.updateProfileDisplayFromCache(userData);
        }
        
        // 更新欢迎模块中的用户信息
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage && userData && userData.username) {
            welcomeMessage.textContent = `欢迎回来${userData.username}`;
        }
        
        // 如果是管理员，确保所有用户信息元素都正确显示
        if (userData && userData.username === 'Mose' && this.adminManager && this.adminManager.isAdmin) {
            // 强制更新欢迎模块的用户名
            if (welcomeMessage) {
                welcomeMessage.textContent = `欢迎回来${userData.username}`;
            }
            
            // 强制更新头像显示
            if (this.profileManager) {
                this.profileManager.updateProfileDisplayFromCache(userData);
            }
            
            // 确保当前日期显示
            const currentDateElement = document.getElementById('current-date');
            if (currentDateElement) {
                const today = new Date();
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                currentDateElement.textContent = today.toLocaleDateString('zh-CN', options);
            }
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
    /**
     * 检查并显示管理员菜单
     */
    async checkAndShowAdminMenu() {
        try {
            if (this.adminManager) {
                const isAdmin = await this.adminManager.checkAdminPermissions();
                if (isAdmin) {
                    // 确保管理员数据已加载
                    await this.adminManager.ensureAdminDataLoaded();
                }
                return isAdmin;
            }
            return false;
        } catch (error) {
            console.error('检查管理员菜单失败:', error);
            return false;
        }
    }

    /**
     * 延迟检查并显示管理员菜单
     */
    async delayedCheckAndShowAdminMenu() {
        try {
            if (this.adminManager) {
                const isAdmin = await this.adminManager.delayedCheckAdminPermissions();
                if (isAdmin) {
                    // 确保管理员数据已加载
                    await this.adminManager.ensureAdminDataLoaded();
                }
                return isAdmin;
            }
            return false;
        } catch (error) {
            console.error('延迟检查管理员菜单失败:', error);
            return false;
        }
    }

    /**
     * 强制刷新后恢复管理员菜单
     */
    async restoreAdminMenuAfterForceRefresh() {
        try {
            if (this.adminManager) {
                const restored = await this.adminManager.restoreAdminPermissionsAfterForceRefresh();
                if (restored) {
                    // 确保管理员数据已加载
                    await this.adminManager.ensureAdminDataLoaded();
                }
                return restored;
            }
            return false;
        } catch (error) {
            console.error('强制刷新后恢复管理员菜单失败:', error);
            return false;
        }
    }

    /**
     * 检查并显示设置按钮（仅管理员可见）
     */
    checkAndShowSettingsButton() {
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            // 使用adminManager的isAdmin状态
            if (this.adminManager && this.adminManager.isAdmin) {
                settingsBtn.style.display = 'block';
                settingsBtn.classList.remove('hidden');
            } else {
                settingsBtn.style.display = 'none';
                settingsBtn.classList.add('hidden');
            }
        }
    }
    
    bindAdminEvents() { 
        return this.adminManager.bindAdminEvents();
    }

    showAdminMenu() {
        if (this.adminManager && typeof this.adminManager.showAdminMenu === 'function') {
            return this.adminManager.showAdminMenu();
        } else {
            console.warn('adminManager未初始化或showAdminMenu方法不存在');
            return Promise.resolve();
        }
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
            // 文档同步模块未正确初始化
        }
    }
    
    showSyncDocsModal() { 
        if (this.docsSync && this.docsSync.showSyncDocsModal) {
            this.docsSync.showSyncDocsModal();
        } else {
            // 文档同步模块未正确初始化
        }
    }
    
    // 弹窗上传文件（根据分类动态配置）
    showUploadModal(category = 'all') {
        
        // 分类与格式映射
        const FILE_TYPE_MAP = {
            image: {
                label: '图片',
                accept: 'image/*',
                multiple: true,
                max: 9,
                formats: ['JPG', 'PNG', 'GIF', 'WEBP', 'BMP', 'SVG']
            },
            video: {
                label: '视频',
                accept: 'video/*',
                multiple: false,
                formats: ['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'MKV']
            },
            audio: {
                label: '音频',
                accept: 'audio/*',
                multiple: false,
                formats: ['MP3', 'WAV', 'AAC', 'FLAC', 'OGG']
            },
            document: {
                label: '文档',
                accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md',
                multiple: false,
                formats: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'TXT', 'MD']
            },
            pdf: {
                label: 'PDF',
                accept: '.pdf',
                multiple: false,
                formats: ['PDF']
            },
            word: {
                label: 'Word',
                accept: '.doc,.docx',
                multiple: false,
                formats: ['DOC', 'DOCX']
            },
            excel: {
                label: 'Excel',
                accept: '.xls,.xlsx',
                multiple: false,
                formats: ['XLS', 'XLSX']
            },
            powerpoint: {
                label: 'PPT',
                accept: '.ppt,.pptx',
                multiple: false,
                formats: ['PPT', 'PPTX']
            }
        };
        let config;
        if (category === 'all') {
            config = {
                label: '全部文件',
                accept: Object.values(FILE_TYPE_MAP).map(t => t.accept).join(','),
                multiple: true,
                max: 9,
                formats: [].concat(...Object.values(FILE_TYPE_MAP).map(t => t.formats))
            };
        } else {
            config = FILE_TYPE_MAP[category] || FILE_TYPE_MAP['document'];
        }
        // 弹窗外壳
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-md shadow-2xl border border-purple-400/30">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-purple-300">上传${config.label}</h3>
                    <button class="text-gray-400 hover:text-white" id="modal-upload-close-btn">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                <div class="mb-4">
                    <div id="modal-upload-area" class="border-2 border-dashed border-purple-light/30 rounded-lg p-6 text-center cursor-pointer hover:border-purple-light/60 transition-colors">
                        <div id="upload-placeholder">
                            <i class="fa fa-cloud-upload text-3xl text-purple-light/60 mb-3"></i>
                            <p class="text-gray-300 mb-2 text-sm">拖放文件到此处上传，或点击选择文件</p>
                            <p class="text-purple-light text-xs" id="modal-upload-file-types">支持的格式 ${config.formats.join(', ')}</p>
                            ${category === 'image' || category === 'all' ? '<p class="text-emerald-light text-xs mt-1">💡 最多可上传9个文件</p>' : ''}
                            
                            <button id="modal-browse-btn" class="mt-3 bg-gradient-to-r from-primary/80 to-secondary/80 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-300 text-sm">选择文件</button>
                        </div>
                        <div id="modal-upload-file-info" class="hidden"></div>
                        <input type="file" id="modal-file-input" class="hidden" ${config.multiple ? 'multiple' : ''} accept="${config.accept}">
                    </div>
                    ${config.multiple ? '<div id="modal-upload-list" class="text-xs text-gray-300 mt-2"></div>' : ''}
                </div>
                <div class="flex justify-end mt-4">
                    <button id="modal-upload-cancel" class="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg mr-2">取消</button>
                    <button id="modal-upload-confirm" class="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg">上传</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // 事件绑定
        const fileInput = modal.querySelector('#modal-file-input');
        const browseBtn = modal.querySelector('#modal-browse-btn');
        const uploadList = modal.querySelector('#modal-upload-list');
        const uploadArea = modal.querySelector('#modal-upload-area');
        let selectedFiles = [];
        // 选择文件按钮点击事件
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            selectedFiles = Array.from(e.target.files);
            if (config.multiple && selectedFiles.length > config.max) {
                this.showMessage(`最多只能选择${config.max}个文件`, 'warning');
                // 安全地清空文件输入框
                try {
                    const dataTransfer = new DataTransfer();
                    fileInput.files = dataTransfer.files;
                } catch (error) {
                    console.warn('清空文件输入失败:', error);
                }
                selectedFiles = [];
                if (uploadList) {
                    uploadList.innerHTML = '';
                }
                return;
            }
            
            // 调用uploadManager的autoAdjustUploadUI方法来自动调整UI
            if (this.uploadManager && selectedFiles.length > 0) {
                this.uploadManager.autoAdjustUploadUI(selectedFiles, config.max);
                // 关闭模态框，让autoAdjustUploadUI处理文件预览
                modal.remove();
            }
        });
        // 拖拽上传
        uploadArea.addEventListener('dragover', e => { 
            e.preventDefault(); 
            uploadArea.classList.add('drag-over'); 
        });
        uploadArea.addEventListener('dragleave', e => { 
            e.preventDefault(); 
            uploadArea.classList.remove('drag-over'); 
        });
        uploadArea.addEventListener('drop', e => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            let files = Array.from(e.dataTransfer.files);
            if (!config.multiple) {
                files = files.length > 0 ? [files[0]] : [];
            }
            if (config.multiple && files.length > config.max) {
                this.showMessage(`最多只能选择${config.max}个文件`, 'warning');
                return;
            }
            if (files.length === 0) {
                this.showMessage('没有有效的文件可以上传', 'warning');
                return;
            }
            
            // 调用uploadManager的autoAdjustUploadUI方法来自动调整UI
            if (this.uploadManager && files.length > 0) {
                this.uploadManager.autoAdjustUploadUI(files, config.max);
                // 关闭模态框，让autoAdjustUploadUI处理文件预览
                modal.remove();
            }
        });
        // 关闭按钮
        modal.querySelector('#modal-upload-close-btn').onclick = () => modal.remove();
        
        // 取消按钮
        modal.querySelector('#modal-upload-cancel').onclick = () => modal.remove();
        
        // 确认上传按钮
        modal.querySelector('#modal-upload-confirm').onclick = () => {
            if (selectedFiles.length === 0) {
                this.showMessage('请先选择文件', 'warning');
                return;
            }
            // 关闭模态框
            modal.remove();
            // 延迟处理上传，确保模态框完全关闭
            setTimeout(() => {
                this.handleFileUpload(selectedFiles);
            }, 100);
        };
    }

    // 上传成功后弹出提示
    async handleFileUpload(files) {
        // 先添加到队列，只有在成功添加文件后才开始上传
        const originalQueueLength = this.uploadManager.uploadQueue.length;
        await this.uploadManager.addFilesToQueue(files, false);
        
        // 只有当队列长度增加时才调用startUpload
        if (this.uploadManager.uploadQueue.length > originalQueueLength) {
            this.uploadManager.startUpload();
        }
        // 移除这里的成功提示，让upload-manager.js中的handleUploadSuccess方法处理
    }

    /**
     * 渲染文件列表HTML（美化版本）
     * @param {File[]} files - 文件列表
     * @returns {string} HTML字符串
     */
    renderFileListHTML(files) {
        if (!files || files.length === 0) {
            return '<div class="text-gray-400 text-center py-4">未选择文件</div>';
        }

        return `
            <div class="space-y-2 max-h-40 overflow-y-auto">
                ${files.map((file, index) => {
                    const fileSize = this.formatFileSize(file.size);
                    const fileIcon = this.getFileIcon(file.name);
                    const fileIconColor = this.getFileIconColor(file.name);
                    
                    return `
                        <div class="flex items-center justify-between p-3 bg-dark-light/50 border border-gray-700/50 rounded-lg hover:border-purple-400/30 transition-all duration-200">
                            <div class="flex items-center space-x-3 flex-1 min-w-0">
                                <div class="flex-shrink-0">
                                    <i class="fa ${fileIcon} text-lg ${fileIconColor}"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-gray-200 text-sm font-medium truncate" title="${file.name}">
                                        ${file.name}
                                    </div>
                                    <div class="text-gray-400 text-xs">
                                        ${fileSize}
                                    </div>
                                </div>
                            </div>
                            <div class="flex-shrink-0 ml-2">
                                <span class="text-xs text-purple-400 bg-purple-900/20 px-2 py-1 rounded-full">
                                    ${index + 1}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
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

    // 顶栏上传按钮事件绑定到showUploadModal
    bindUploadBtn() {
        const uploadBtn = document.getElementById('upload-btn');
        
        if (uploadBtn) {
            // 移除之前的事件监听器，避免重复绑定
            uploadBtn.removeEventListener('click', this.handleUploadBtnClick);
            
            // 创建事件处理函数
            this.handleUploadBtnClick = (event) => {
                // 阻止默认行为，确保不会触发任何文件选择
                event.preventDefault();
                event.stopPropagation();
                
                // URL分类调用添加链接弹窗，外站文档分类调用同步文档弹窗，其他分类调用文件上传弹窗
                if (this.currentCategory === 'url') {
                    this.showAddLinkModal();
                } else if (this.currentCategory === 'external-docs') {
                    // 外站文档分类调用同步文档模态框
                    if (this.docsSync && this.docsSync.showSyncDocsModal) {
                        this.docsSync.showSyncDocsModal();
                    }
                } else {
                    this.showUploadModal(this.currentCategory || 'all');
                }
            };
            
            // 绑定新的事件监听器
            uploadBtn.addEventListener('click', this.handleUploadBtnClick);
        }
    }

    // 添加链接模态框
    showAddLinkModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-md shadow-2xl border border-purple-400/30">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-purple-300">添加链接</h3>
                    <button class="text-gray-400 hover:text-white" id="modal-link-close-btn">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">链接标题 <span class="text-red-400">*</span></label>
                        <input type="text" id="link-title" placeholder="请输入链接标题" 
                               class="w-full bg-dark-light border border-purple-light/30 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-light/50 focus:border-purple-light transition-all duration-300">
                        <div id="title-error" class="text-red-400 text-xs mt-1 hidden">请输入链接标题</div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">URL地址 <span class="text-red-400">*</span></label>
                        <input type="url" id="link-url" placeholder="请输入URL地址（如：https://example.com）" 
                               class="w-full bg-dark-light border border-purple-light/30 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-light/50 focus:border-purple-light transition-all duration-300">
                        <div id="url-error" class="text-red-400 text-xs mt-1 hidden">请输入有效的URL地址</div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">备注</label>
                        <textarea id="link-notes" placeholder="请输入备注信息（可选）" rows="3"
                                  class="w-full bg-dark-light border border-purple-light/30 text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-light/50 focus:border-purple-light transition-all duration-300 resize-none"></textarea>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-purple-light/20">
                    <button id="modal-link-cancel" class="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                        取消
                    </button>
                    <button id="modal-link-confirm" class="px-4 py-2 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-[1.03] text-sm">
                        <i class="fa fa-link mr-1"></i> 添加链接
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 事件绑定
        const titleInput = modal.querySelector('#link-title');
        const urlInput = modal.querySelector('#link-url');
        const notesInput = modal.querySelector('#link-notes');
        const titleError = modal.querySelector('#title-error');
        const urlError = modal.querySelector('#url-error');
        const confirmBtn = modal.querySelector('#modal-link-confirm');
        
        // 清除错误提示
        const clearErrors = () => {
            titleError.classList.add('hidden');
            urlError.classList.add('hidden');
            titleInput.classList.remove('border-red-500');
            urlInput.classList.remove('border-red-500');
        };
        
        // 显示错误提示
        const showError = (inputId, message) => {
            const errorElement = modal.querySelector(`#${inputId}-error`);
            const inputElement = modal.querySelector(`#${inputId}`);
            if (errorElement && inputElement) {
                errorElement.textContent = message;
                errorElement.classList.remove('hidden');
                inputElement.classList.add('border-red-500');
            }
        };
        
        // 输入时清除错误
        titleInput.addEventListener('input', () => {
            if (titleInput.value.trim()) {
                titleError.classList.add('hidden');
                titleInput.classList.remove('border-red-500');
            }
        });
        
        urlInput.addEventListener('input', () => {
            if (urlInput.value.trim()) {
                urlError.classList.add('hidden');
                urlInput.classList.remove('border-red-500');
            }
        });
        
        modal.querySelector('#modal-link-close-btn').onclick = () => modal.remove();
        modal.querySelector('#modal-link-cancel').onclick = () => modal.remove();
        
        confirmBtn.onclick = async () => {
            clearErrors();
            
            const title = titleInput.value.trim();
            const url = urlInput.value.trim();
            const notes = notesInput.value.trim();
            
            let hasError = false;
            
            // 验证标题
            if (!title) {
                showError('title', '请输入链接标题');
                hasError = true;
            }
            
            // 验证URL
            if (!url) {
                showError('url', '请输入URL地址');
                hasError = true;
            } else if (!this.validateUrl(url)) {
                showError('url', '请输入有效的URL地址（如：https://example.com）');
                hasError = true;
            }
            
            if (hasError) {
                return;
            }
            
            // 禁用按钮，显示加载状态
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-1"></i> 添加链接...';
            try {
                // 调用添加链接的API
                await this.addUrlLink({ title, url, notes });
                modal.remove();
            } catch (error) {
                // 恢复按钮状态
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fa fa-link mr-1"></i> 添加链接';
                this.showMessage(error.message || '添加链接失败', 'error');
            }
        };
    }

    // 验证URL
    validateUrl(url) {
        try {
            const urlObj = new URL(url);
            // 确保有协议
            if (!urlObj.protocol || (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:')) {
                return false;
            }
            // 确保有主机名
            if (!urlObj.hostname) {
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    // 添加链接到后端
    async addUrlLink(linkData) {
        try {
            const result = await this.api.urlFiles.createUrlFile(linkData);
            
            if (result.success) {
                this.showMessage('链接添加成功', 'success');
                // 刷新文件列表
                await this.loadFiles();
            } else {
                throw new Error(result.message || result.error || '添加链接失败');
            }
        } catch (error) {

            throw new Error(error.message || '添加链接失败');
        }
    }

    // 复制URL链接到剪贴板
    async copyUrl(file) {
        try {
            if (!file || !file.url) {
                this.showMessage('无效的URL文件', 'error');
                return;
            }

            // 使用工具类的复制功能
            if (this.utils && this.utils.copyToClipboard) {
                const success = await this.utils.copyToClipboard(file.url);
                if (success) {
                    this.showMessage('URL链接已复制到剪贴板', 'success');
                } else {
                    this.showMessage('复制失败，请手动复制', 'error');
                }
            } else {
                // 降级方案：使用原生剪贴板API
                try {
                    await navigator.clipboard.writeText(file.url);
                    this.showMessage('URL链接已复制到剪贴板', 'success');
                } catch (error) {
                    // 如果原生API失败，使用传统方法
                    const textArea = document.createElement('textarea');
                    textArea.value = file.url;
                    document.body.appendChild(textArea);
                    textArea.select();
                    const success = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    if (success) {
                        this.showMessage('URL链接已复制到剪贴板', 'success');
                    } else {
                        this.showMessage('复制失败，请手动复制', 'error');
                    }
                }
            }
        } catch (error) {
            console.error('复制URL失败:', error);
            this.showMessage('复制失败，请手动复制', 'error');
        }
    }

    // 设置管理相关
    // 存储空间渲染
    updateStorageDisplay(storageInfo) {
        if (!storageInfo) {
            return;
        }
        // 统一数据格式处理
        let used, total;
        
        // 处理不同的数据格式
        if (storageInfo.storage) {
            // 如果是嵌套格式{storage: {...}}
            used = storageInfo.storage.used_space || storageInfo.storage.used_bytes || 0;
            total = storageInfo.storage.total_space || storageInfo.storage.limit_bytes || 1073741824;
        } else {
            // 如果是直接格式{used_space: ..., total_space: ...}
            used = storageInfo.used_space || storageInfo.used_bytes || 0;
            total = storageInfo.total_space || storageInfo.limit_bytes || 1073741824;
        }
        
        // 确保数据类型正确
        used = parseInt(used) || 0;
        total = parseInt(total) || 1073741824;
        
        const percentage = total > 0 ? (used / total) * 100 : 0;
        
        // 格式化存储大小
        const formatSize = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        const usedFormatted = formatSize(used);
        const totalFormatted = formatSize(total);
        
        // 更新存储空间显示
        const totalStorageElement = document.getElementById('total-storage');
        if (totalStorageElement) {
            totalStorageElement.textContent = totalFormatted;
        }
        const usedStorageElement = document.getElementById('used-storage');
        if (usedStorageElement) {
            usedStorageElement.textContent = usedFormatted;
        }
        
        const progressBarElement = document.getElementById('storage-progress-bar');
        if (progressBarElement) {
            progressBarElement.style.width = `${percentage}%`;
        }
        const progressTextElement = document.getElementById('storage-progress-text');
        if (progressTextElement) {
            progressTextElement.textContent = `${percentage.toFixed(2)}% 已使用`;
        }
        
        // 更新空间利用率百分比显示
        const usagePercentageElement = document.getElementById('usage-percentage');
        if (usagePercentageElement) {
            usagePercentageElement.textContent = `${percentage.toFixed(2)}%`;
        }
        
        this.updateStorageStatus(percentage);
        
        // 缓存存储信息到本地存储
        if (window.StorageManager && typeof window.StorageManager.setStorageInfo === 'function') {
            window.StorageManager.setStorageInfo({
                used_space: used,
                total_space: total,
                used_space_str: usedFormatted,
                total_space_str: totalFormatted,
                usage_percent: percentage
            });
        }
    }

    /**
     * 更新存储状态显示
     * @param {number} percentage - 使用百分比
     */
    updateStorageStatus(percentage) {
        // 计算剩余空间百分比
        const remainingPercentage = 100 - percentage;
        
        let statusText;
        if (remainingPercentage > 30) {
            statusText = '充足';
        } else if (remainingPercentage >= 10) {
            statusText = '不足';
        } else {
            statusText = '严重不足';
        }
        
        // 更新存储空间概览状态
        const statusElement = document.getElementById('storage-status');
        if (statusElement) {
            let statusClass, textColor, bgColor, borderColor;
            
            if (remainingPercentage > 30) {
                statusClass = 'success';
                textColor = 'text-emerald-400';
                bgColor = 'bg-emerald-500/20';
                borderColor = 'border-emerald-400/30';
            } else if (remainingPercentage >= 10) {
                statusClass = 'warning';
                textColor = 'text-yellow-400';
                bgColor = 'bg-yellow-500/20';
                borderColor = 'border-yellow-400/30';
            } else {
                statusClass = 'error';
                textColor = 'text-red-400';
                bgColor = 'bg-red-500/20';
                borderColor = 'border-red-400/30';
            }
            
            statusElement.textContent = statusText;
            statusElement.className = `px-2 md:px-3 py-1 ${bgColor} ${textColor} text-xs rounded-full border ${borderColor}`;
        }
        
        // 将存储状态保存到本地缓存
        const storageStatusData = {
            status: statusText,
            percentage: percentage,
            remainingPercentage: remainingPercentage,
            timestamp: Date.now()
        };
        window.StorageManager.setStorageStatus(storageStatusData);
        
        // 触发自定义事件，通知其他模块存储状态已更新
        window.dispatchEvent(new CustomEvent('storageStatusUpdated', {
            detail: storageStatusData
        }));
        
        // 尝试立即更新欢迎模块
        this.updateWelcomeStorageStatus(statusText);
        
        // 延迟重试，确保欢迎模块已加载
        setTimeout(() => this.updateWelcomeStorageStatus(statusText), 100);
        setTimeout(() => this.updateWelcomeStorageStatus(statusText), 500);
        setTimeout(() => this.updateWelcomeStorageStatus(statusText), 1000);
        setTimeout(() => this.updateWelcomeStorageStatus(statusText), 2000);
    }
    
    /**
     * 更新欢迎模块中的存储状态
     * @param {string} statusText - 状态文本
     */
    updateWelcomeStorageStatus(statusText) {
        const welcomeStorageStatus = document.getElementById('welcome-storage-status');
        if (welcomeStorageStatus) {
            // 确保传入的是正确的状态文本，而不是数字
            let displayText = statusText;
            if (typeof statusText === 'number' || (typeof statusText === 'string' && !isNaN(parseFloat(statusText)))) {
                // 根据百分比确定状态文本
                const percent = typeof statusText === 'number' ? statusText : parseFloat(statusText);
                if (percent >= 90) {
                    displayText = '严重不足';
                } else if (percent >= 70) {
                    displayText = '不足';
                } else {
                    displayText = '充足';
                }
            }
            welcomeStorageStatus.textContent = displayText;
        }
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

    // 获取当前图片文件列表（用于图片预览切换）
    getCurrentImageFiles() {
        // 假设this.files为当前渲染的所有文件（如有分页/筛选需适配）
        if (!this.files || !Array.isArray(this.files)) return [];
        return this.files.filter(f => f.type === 'image');
    }
    async syncStorageDisplay(storageInfo) {
        if (!storageInfo) {
            console.warn('⚠️ 存储信息为空');
            return;
        }

        try {
            // 统一数据格式处理
            let processedStorageInfo;
            
            if (storageInfo.storage) {
                // 如果是嵌套格式{storage: {...}}
                processedStorageInfo = storageInfo.storage;
            } else {
                // 如果是直接格式{used_space: ..., total_space: ...}
                processedStorageInfo = storageInfo;
            }
            
            // 验证数据格式
            if (processedStorageInfo.used_space === undefined || processedStorageInfo.total_space === undefined) {
                console.warn('⚠️ 存储信息格式不正确', processedStorageInfo);
                return;
            }
            
            // 确保数据类型正确
            processedStorageInfo.used_space = parseInt(processedStorageInfo.used_space) || 0;
            processedStorageInfo.total_space = parseInt(processedStorageInfo.total_space) || 1073741824;
            
            // 更新存储信息到本地缓存
            if (window.StorageManager && typeof window.StorageManager.setStorageInfo === 'function') {
                window.StorageManager.setStorageInfo(processedStorageInfo);
            }
            
            // 更新主页存储空间概览
            this.updateStorageDisplay(processedStorageInfo);
            
            // 更新用户管理页面的存储显示（如果存在）
            if (window.userManager && typeof window.userManager.updateStorageDisplay === 'function') {
                window.userManager.updateStorageDisplay(processedStorageInfo);
            }
            

            
            // 更新设置页面的存储显示（如果存在）
            if (window.settingsManager && typeof window.settingsManager.renderStorageData === 'function') {
                window.settingsManager.renderStorageData(processedStorageInfo);
            }
            
            // 更新个人资料页面的存储显示（如果存在）
            if (window.profileManager && typeof window.profileManager.updateStorageInfo === 'function') {
                window.profileManager.updateStorageInfo(processedStorageInfo);
            }
            
        } catch (error) {
            console.error('同步存储空间显示失败:', error);
        }
    }

    /**
     * 强制绑定存储设置按钮
     */
    forceBindStorageSettingsButton() {
        try {
            // 确保设置管理器已初始化
            if (this.settingsManager && typeof this.settingsManager.bindStorageSettingsButton === 'function') {
                this.settingsManager.bindStorageSettingsButton();
            }
            
            // 不再直接绑定按钮事件，避免与 settings.js 中的绑定冲突
            // 让 settings.js 统一管理按钮事件
            
            const storageSettingsBtn = document.getElementById('storage-settings-btn');
            if (storageSettingsBtn) {
                // 确保按钮可见
                storageSettingsBtn.style.display = 'inline-block';
                storageSettingsBtn.style.visibility = 'visible';
                storageSettingsBtn.classList.remove('hidden');
                storageSettingsBtn.removeAttribute('hidden');
                
                // 检查是否已经绑定过事件
                if (storageSettingsBtn._hasBoundEvent) {
                    console.debug('存储设置按钮事件已绑定，跳过重复绑定');
                    return;
                }
            } else {
                console.warn('⚠️ 存储设置按钮不存在');
            }
        } catch (error) {
            console.error('绑定存储设置按钮失败:', error);
        }
    }

    /**
     * 显示存储设置按钮
     */
    showStorageSettingsButton() {
        if (!this.isAdminUser()) {
            // 非管理员用户，不显示存储设置按钮
            return;
        }
        
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        if (storageSettingsBtn) {
            storageSettingsBtn.style.display = 'inline-block';
            storageSettingsBtn.style.visibility = 'visible';
            storageSettingsBtn.classList.remove('hidden');
            storageSettingsBtn.removeAttribute('hidden');
        }
    }
}

// 导出UI管理器
window.UIManager = UIManager; 
