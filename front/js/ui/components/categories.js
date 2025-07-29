/**
 * 分类管理模块
 * 处理文件类型按钮、分类过滤、可展开分类等功能
 */
class UICategories {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.isProcessingDoubleClick = false; // 防止双击事件重复触发
    }

    init() {
        // 确保移除外站文档分类CSS类
        document.body.classList.remove('external-docs-category');
        
        // 清理外站文档显示
        this.cleanupExternalDocsDisplay();
        
        // 确保文件夹区域在初始化时是隐藏的（默认是全部文件分类）
        const folderSection = document.getElementById('folder-section');
        if (folderSection) {
            folderSection.classList.add('hidden');
        }
        
        // 隐藏新建分组按钮（默认是全部文件分类）
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        if (createFolderBtn) {
            createFolderBtn.style.display = 'none';
        }
        
        // 初始化分类管理器
        this.initializeFileTypeButtons();
        
        // 绑定文件类型按钮点击事件
        this.bindCategoryClickEvents();
        
        // 延迟绑定可展开分类事件，确保DOM完全加载
        setTimeout(() => {
            this.bindExpandableCategoryEvents();
        }, 200); // 增加延迟时间，确保DOM完全加载
        
        // 初始化新建分组按钮事件
        this.initializeCreateFolderButton();
        
        // 移除空的全局双击事件监听器，避免干扰双击事件处理
        // document.addEventListener('dblclick', (e) => {
        //     if (e.target.closest('.file-type-btn.expandable')) {
        //     }
        // });
    }
    
    // 初始化新建分组按钮
    initializeCreateFolderButton() {
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        if (createFolderBtn) {
            // 直接绑定事件，不使用bind(this)
            createFolderBtn.addEventListener('click', (event) => this.handleCreateFolderClick(event));
        }
    }

    // 强制更新新建分组按钮状态
    forceUpdateCreateFolderButton() {
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        const folderSection = document.getElementById('folder-section');
        
        if (createFolderBtn && folderSection) {
            if (this.uiManager.currentCategory && this.uiManager.currentCategory !== 'all') {
                folderSection.classList.remove('hidden');
                createFolderBtn.style.display = 'flex';
            } else {
                folderSection.classList.add('hidden');
                createFolderBtn.style.display = 'none';
            }
        }
    }
    
    // 处理新建分组按钮点击
    handleCreateFolderClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // 调用UIManager的showCreateFolderModal方法
        if (this.uiManager && typeof this.uiManager.showCreateFolderModal === 'function') {
            this.uiManager.showCreateFolderModal();
        }
    }

    // 初始化文件类型标签
    initializeFileTypeButtons() {
        const allButton = document.querySelector('.file-type-btn[data-type="all"]');
        if (allButton) {
            // 移除所有按钮的活动状态
            document.querySelectorAll('.file-type-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
                btn.classList.add('bg-dark-light', 'hover:bg-dark-light/70', 'text-white');
            });
            
            // 设置"全部文件"为激活状态
            allButton.classList.add('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
            allButton.classList.remove('bg-dark-light', 'hover:bg-dark-light/70');
            
            // 确保上传按钮显示，同步文档按钮隐藏（默认是全部文件分类）
            const uploadBtn = document.getElementById('upload-btn');
            const syncDocsBtn = document.getElementById('sync-docs-btn');
            
            if (uploadBtn) {
                uploadBtn.style.display = 'flex';
            }
            
            if (syncDocsBtn) {
                syncDocsBtn.style.display = 'none';
            }
            
            // 初始化时隐藏文件夹区域（默认是全部文件分类）
            const folderSection = document.getElementById('folder-section');
            if (folderSection) {
                folderSection.classList.add('hidden');
            }
            
            // 初始化上传按钮文本（默认是全部文件分类）
            this.updateUploadButtonText('all');
        }
        
        // 绑定所有分类按钮的点击事件
        this.bindCategoryClickEvents();
        
        // 为现有的可展开按钮绑定双击事件
        this.bindExpandableCategoryEvents();
    }
    
    // 绑定分类按钮的点击事件
    bindCategoryClickEvents() {
        // 为所有分类按钮绑定点击事件（包括可展开的按钮）
        const categoryButtons = document.querySelectorAll('.file-type-btn');
        
        categoryButtons.forEach((btn, index) => {
            
            // 移除可能存在的旧事件监听器
            btn.removeEventListener('click', this.handleFileTypeFilter.bind(this));
            
            // 添加新的点击事件监听器
            btn.addEventListener('click', this.handleFileTypeFilter.bind(this));
        });
    }
    
    // 绑定可展开分类的事件
    bindExpandableCategoryEvents() {
        
        // 为所有可展开的按钮绑定双击事件
        const expandableButtons = document.querySelectorAll('.file-type-btn.expandable');
        
        expandableButtons.forEach((btn, index) => {
            
            // 移除可能存在的旧事件监听器
            btn.removeEventListener('dblclick', this.handleExpandableDoubleClick);
            btn.removeEventListener('click', this.handleExpandableClick);
            
            // 只添加双击事件监听器，移除单击事件
            btn.addEventListener('dblclick', this.handleExpandableDoubleClick.bind(this));
            
            // 确保按钮有正确的属性
            btn.setAttribute('data-expanded', 'false');
        });
        
        // 为子分类按钮绑定点击事件
        const subButtons = document.querySelectorAll('.sub-file-type-btn');
        
        subButtons.forEach((btn, index) => {
            
            // 移除可能存在的旧事件监听器
            btn.removeEventListener('click', this.handleSubFileTypeFilter);
            
            // 添加新的点击事件监听器
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleSubFileTypeFilter(btn);
            });
        });
    }
    

    
    // 处理可展开按钮的双击事件
    handleExpandableDoubleClick(e) {
        
        e.preventDefault();
        e.stopPropagation();
        
        // 防止重复触发
        if (this.isProcessingDoubleClick) {
            return;
        }
        
        this.isProcessingDoubleClick = true;
        
        // 获取按钮元素（可能是子元素触发的双击）
        const btn = e.target.closest('.file-type-btn.expandable');
        if (btn) {
            
            // 检查当前状态
            const isExpanded = btn.getAttribute('data-expanded') === 'true';
            const subContainer = document.getElementById('sub-categories-container');
            
            if (isExpanded) {
                // 如果已展开，则收起
                this.collapseSubCategories(btn, subContainer);
            } else {
                // 如果未展开，则展开
                this.expandSubCategories(btn, subContainer);
            }
        }
        
        // 延迟重置标志，防止重复触发
        setTimeout(() => {
            this.isProcessingDoubleClick = false;
        }, 300);
    }

    // 切换可展开分类的展开/收起
    toggleExpandableCategory(btn) {
        
        const isExpanded = btn.getAttribute('data-expanded') === 'true';
        const subContainer = document.getElementById('sub-categories-container');
        

        
        if (isExpanded) {
            // 收起子分类
            this.collapseSubCategories(btn, subContainer);
        } else {
            // 展开子分类
            this.expandSubCategories(btn, subContainer);
        }
    }

    // 展开子分类
    expandSubCategories(btn, subContainer) {
        btn.setAttribute('data-expanded', 'true');
        
        // 获取文档按钮和音频按钮
        const documentBtn = document.querySelector('.file-type-btn[data-type="document"]');
        const audioBtn = document.querySelector('.file-type-btn[data-type="audio"]');
        const fileTypeContainer = document.getElementById('file-type-container');
        
        if (!documentBtn || !audioBtn || !fileTypeContainer || !subContainer) {
            return;
        }
        
        // 设置子分类容器的样式
        subContainer.classList.remove('hidden');
        subContainer.classList.add('show');
        subContainer.style.display = 'inline-flex';
        subContainer.style.opacity = '1';
        subContainer.style.transform = 'translateX(0)';
        subContainer.style.pointerEvents = 'auto';
        subContainer.style.maxWidth = 'none';
        subContainer.style.width = 'auto';
        subContainer.style.height = 'auto';
        subContainer.style.overflow = 'visible';
        subContainer.style.margin = '0';
        subContainer.style.padding = '0';
        subContainer.style.border = 'none';
        subContainer.style.flex = '0 0 auto';
        subContainer.style.minWidth = 'auto';
        subContainer.style.minHeight = 'auto';
        subContainer.style.gap = '8px';
        subContainer.style.alignItems = 'center';
        subContainer.style.flexWrap = 'nowrap';
        
        // 将子分类容器插入到文档按钮和音频按钮之间
        if (subContainer.parentNode !== fileTypeContainer) {
            fileTypeContainer.insertBefore(subContainer, audioBtn);
        } else {
            // 如果已经在容器中，移动到正确位置
            const currentIndex = Array.from(fileTypeContainer.children).indexOf(subContainer);
            const audioIndex = Array.from(fileTypeContainer.children).indexOf(audioBtn);
            if (currentIndex !== audioIndex) {
                fileTypeContainer.insertBefore(subContainer, audioBtn);
            }
        }
        
        // 设置按钮动画延迟
        const subButtons = subContainer.querySelectorAll('.sub-file-type-btn');
        subButtons.forEach((button, index) => {
            button.style.setProperty('--btn-index', index);
            button.style.height = 'auto';
            button.style.minHeight = '2.5rem';
            button.style.lineHeight = '1';
            button.style.flexShrink = '0';
        });
        
        // 调整音频按钮的位置，确保间距一致
        setTimeout(() => {
            // 确保音频按钮与子分类容器之间有正确的间距
            if (audioBtn) {
                audioBtn.style.marginLeft = '8px';
            }
        }, 50);
    }

    // 收起子分类
    collapseSubCategories(btn, subContainer) {
        btn.setAttribute('data-expanded', 'false');
        
        // 恢复音频按钮的原始间距
        const audioBtn = document.querySelector('.file-type-btn[data-type="audio"]');
        if (audioBtn) {
            audioBtn.style.marginLeft = '';
        }
        
        subContainer.classList.remove('show');
        subContainer.style.opacity = '0';
        subContainer.style.transform = 'translateX(-20px)';
        subContainer.style.pointerEvents = 'none';
        subContainer.style.maxWidth = '0';
        subContainer.style.width = '0';
        subContainer.style.height = '0';
        subContainer.style.overflow = 'hidden';
        subContainer.style.margin = '0';
        subContainer.style.padding = '0';
        subContainer.style.border = 'none';
        subContainer.style.flex = '0 0 auto';
        subContainer.style.minWidth = '0';
        subContainer.style.minHeight = '0';
        subContainer.style.gap = '';
        subContainer.style.alignItems = '';
        subContainer.style.flexWrap = '';
        
        setTimeout(() => {
            subContainer.classList.add('hidden');
            subContainer.style.display = 'none';
        }, 300);
    }

    // 封装创建可展开分类的方法
    createExpandableCategory(config) {
        const {
            type,
            label,
            icon,
            subCategories = []
        } = config;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'expandable-category-wrapper relative';
        
        const mainBtn = document.createElement('button');
        mainBtn.className = 'file-type-btn expandable bg-dark-light hover:bg-dark-light/70 text-white px-5 py-2 rounded-full transition-all duration-300 transform hover:scale-[1.02]';
        mainBtn.setAttribute('data-type', type);
        mainBtn.setAttribute('data-expanded', 'false');
        mainBtn.innerHTML = `
            <i class="fa ${icon} mr-1"></i> ${label}
            <i class="fa fa-chevron-right ml-1 text-xs transition-transform duration-300"></i>
        `;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'sub-categories-dropdown hidden';
        
        // 添加子分类按钮
        subCategories.forEach(subCategory => {
            const subBtn = document.createElement('button');
            subBtn.className = `sub-file-type-btn ${subCategory.classes || ''}`;
            subBtn.setAttribute('data-type', subCategory.type);
            subBtn.innerHTML = `
                <i class="fa ${subCategory.icon} mr-1"></i> ${subCategory.label}
            `;
            
            // 绑定点击事件
            subBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleSubFileTypeFilter(subBtn);
            });
            
            dropdown.appendChild(subBtn);
        });
        
        // 绑定双击事件
        mainBtn.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleExpandableCategory(mainBtn);
        });
        
        wrapper.appendChild(mainBtn);
        wrapper.appendChild(dropdown);
        
        return wrapper;
    }

    // 处理子文件类型过滤
    handleSubFileTypeFilter(btn) {
        // 立即更新按钮样式
        this.updateButtonStyles(btn);
        
        // 异步处理文件过滤
        setTimeout(() => {
            const type = btn.getAttribute('data-type');
            
            // 移除所有按钮的活动状态
            document.querySelectorAll('.file-type-btn, .sub-file-type-btn').forEach(b => {
                b.classList.remove('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
                if (b.classList.contains('file-type-btn')) {
                    b.classList.add('bg-dark-light', 'hover:bg-dark-light/70', 'text-white');
                } else {
                    // 恢复子按钮的默认样式
                    b.classList.remove('active');
                }
            });
            
            // 设置当前按钮为激活状态
            btn.classList.add('active');
            
            // 更新当前分类
            this.uiManager.currentCategory = type;
            
            // 如果切换到非全部文件分类，重置上传UI
            if (this.uiManager.uploadManager && type !== 'all') {
                this.uiManager.uploadManager.resetUploadUIToDefault();
            }
            
            // 直接处理新建分组按钮的显示/隐藏
            const createFolderBtn = document.getElementById('create-folder-main-btn');
            if (createFolderBtn) {
                if (type === 'all') {
                    createFolderBtn.style.display = 'none';
                } else {
                    createFolderBtn.style.display = 'flex';
                }
            }
            
            // 更新上传按钮文本和图标
            this.updateUploadButtonText(type);
            
            // 过滤文件
            this.filterFiles(type);
        }, 0);
    }

    // 处理文件类型过滤
    handleFileTypeFilter(event) {
        const btn = event.target.closest('.file-type-btn');
        if (!btn) {
            return;
        }
        
        // 检查是否为可展开按钮
        const isExpandable = btn.classList.contains('expandable');
        
        // 如果是可展开按钮，添加延迟防止双击冲突
        if (isExpandable) {
            // 清除之前的延迟
            if (this.clickTimeout) {
                clearTimeout(this.clickTimeout);
            }
            
            // 设置新的延迟
            this.clickTimeout = setTimeout(() => {
                this.executeFileTypeFilter(btn);
            }, 100); // 减少延迟时间，给双击事件留出时间
            
            return;
        }
        
        // 普通按钮直接执行
        this.executeFileTypeFilter(btn);
    }
    
    // 执行文件类型过滤
    executeFileTypeFilter(btn) {
        // 立即更新按钮样式，不等待文件渲染
        this.updateButtonStyles(btn);
        
        // 异步处理文件过滤和渲染
        setTimeout(() => {
            this.processFileFiltering(btn);
        }, 0);
    }
    
    // 立即更新按钮样式
    updateButtonStyles(btn) {
        // 移除所有标签的活动状态
        document.querySelectorAll('.file-type-btn, .sub-file-type-btn').forEach(b => {
            b.classList.remove('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
            if (b.classList.contains('file-type-btn')) {
                b.classList.add('bg-dark-light', 'hover:bg-dark-light/70', 'text-white');
            } else {
                // 恢复子按钮的默认样式
                b.classList.remove('active');
            }
        });

        // 立即添加当前标签的活动状态
        btn.classList.add('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
        btn.classList.remove('bg-dark-light', 'hover:bg-dark-light/70');
    }
    
    // 处理文件过滤逻辑
    processFileFiltering(btn) {
        // 过滤文件
        const type = btn.getAttribute('data-type');
        this.uiManager.currentCategory = type; // 记录当前分类
        
        // 清理外站文档样式（默认情况）
        document.body.classList.remove('external-docs-category');
        
        // 如果从全部文件分类切换到其他分类，重置上传UI
        if (this.uiManager.uploadManager && type !== 'all') {
            this.uiManager.uploadManager.resetUploadUIToDefault();
        }
        
        // 处理外站文档分类的特殊逻辑
        if (type === 'external-docs') {
            // 检查是否为管理员，只有管理员才能访问外站文档分类
            const isAdmin = this.checkIfAdmin();
            if (!isAdmin) {
                console.warn('非管理员用户尝试访问外站文档分类，已阻止');
                // 阻止非管理员用户访问外站文档分类
                return;
            }
            this.handleExternalDocsCategory();
            return;
        }
        
        // 处理其他分类时，确保同步文档按钮被隐藏
        this.hideSyncDocsButton();
        
        // 处理其他分类
        this.handleRegularCategory(type);
    }
    
    // 隐藏同步文档按钮
    hideSyncDocsButton() {
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        if (syncDocsBtn) {
            syncDocsBtn.style.display = 'none';
            syncDocsBtn.classList.add('hidden');
            syncDocsBtn.setAttribute('hidden', '');
        }
    }
    
    // 检查是否为管理员
    checkIfAdmin() {
        try {
            // 检查cookie中是否有管理员token
            const cookies = document.cookie.split(';');
            const adminAccessToken = cookies.find(cookie => cookie.trim().startsWith('admin_access_token='));
            const adminRefreshToken = cookies.find(cookie => cookie.trim().startsWith('admin_refresh_token='));
            
            // 只有同时存在管理员访问token和刷新token才认为是管理员
            return !!(adminAccessToken && adminRefreshToken);
        } catch (error) {
            console.error('检查管理员权限失败:', error);
            return false;
        }
    }
    
    // 获取当前用户信息
    getCurrentUser() {
        try {
            // 优先从StorageManager获取
            if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
                return window.StorageManager.getUser();
            }
            
            // 备用方案：从localStorage获取
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                return JSON.parse(userInfo);
            }
            
            return null;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }

    // 处理外站文档分类
    handleExternalDocsCategory() {
        // 清理常规文件显示 - 这里不需要清理，因为外站文档分类是独立的
        // this.cleanupRegularFilesDisplay(); // 这个方法不存在，移除这行
        
        // 隐藏上传按钮，显示同步文档按钮（仅管理员可见）
        const uploadBtn = document.getElementById('upload-btn');
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        
        if (uploadBtn) {
            uploadBtn.style.display = 'none';
        }
        
        // 只有管理员才能显示同步文档按钮
        if (syncDocsBtn) {
            // 检查是否为管理员
            const isAdmin = this.checkIfAdmin();
            if (isAdmin) {
                syncDocsBtn.style.display = 'flex';
            } else {
                // 非管理员用户不显示同步文档按钮
                syncDocsBtn.style.display = 'none';
                syncDocsBtn.classList.add('hidden');
                syncDocsBtn.setAttribute('hidden', '');
            }
        }
        
        // 隐藏默认空状态容器（如果存在）
        const defaultEmptyState = document.getElementById('empty-state');
        if (defaultEmptyState) {
            defaultEmptyState.classList.add('hidden');
        }
        
        // 加载外站文档
        this.loadExternalDocs();
        
        // 重置文件计数为0，因为外站文档由docs-sync模块处理
        if (this.uiManager.updateFileCount) {
            this.uiManager.updateFileCount(0, 0);
        }
        if (this.uiManager.toggleEmptyState) {
            this.uiManager.toggleEmptyState(0);
        }
        
        // 更新上传区域提示信息和文件输入框设置
        if (this.uiManager.updateUploadAreaHint) {
            this.uiManager.updateUploadAreaHint();
        }
        if (this.uiManager.updateFileInputMultiple) {
            this.uiManager.updateFileInputMultiple();
        }
    }
    
    // 处理常规分类
    handleRegularCategory(type) {
        // 清理外站文档显示
        this.cleanupExternalDocsDisplay();
        
        // 确保同步文档按钮被隐藏
        this.hideSyncDocsButton();
        
        // 根据分类决定是否显示文件夹区域和新建分组按钮
        const folderSection = document.getElementById('folder-section');
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        
        if (folderSection) {
            if (type === 'all') {
                // 全部文件分类时隐藏文件夹区域
                folderSection.classList.add('hidden');
            } else {
                // 其他分类时显示文件夹区域
                folderSection.classList.remove('hidden');
                
                // 重新渲染文件夹列表（如果存在文件夹管理器）
                if (this.uiManager && this.uiManager.folderManager && this.uiManager.folders) {
                    this.uiManager.folderManager.renderFolderList(this.uiManager.folders);
                }
            }
        }
        
        // 直接处理新建分组按钮的显示/隐藏
        if (createFolderBtn) {
            if (type === 'all') {
                createFolderBtn.style.display = 'none';
            } else {
                createFolderBtn.style.display = 'flex';
            }
        }
        
        // 更新上传按钮文本和图标
        this.updateUploadButtonText(type);
        
        // 过滤文件
        this.filterFiles(type);
    }
    
    // 清理外站文档显示
    cleanupExternalDocsDisplay() {
        // 移除外站文档空状态
        const externalDocsEmptyState = document.querySelector('#files-grid .external-docs-empty-state');
        if (externalDocsEmptyState) {
            externalDocsEmptyState.remove();
        }
        
        // 移除外站文档卡片
        const externalDocsCards = document.querySelectorAll('#files-grid .external-doc-card');
        externalDocsCards.forEach(card => card.remove());
        
        // 恢复上传按钮显示状态
        const uploadBtn = document.getElementById('upload-btn');
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        
        if (uploadBtn) {
            uploadBtn.style.display = 'flex';
        }
        
        if (syncDocsBtn) {
            syncDocsBtn.style.display = 'none';
        }
        
        // 移除外站文档分类CSS类
        document.body.classList.remove('external-docs-category');
    }
    
    // 加载外站文档
    async loadExternalDocs() {
        try {
            // 调用docs-sync模块加载外站文档
            if (window.docsSyncManager && typeof window.docsSyncManager.loadExternalDocs === 'function') {
                await window.docsSyncManager.loadExternalDocs();
            } else if (this.uiManager && typeof this.uiManager.loadExternalDocs === 'function') {
                await this.uiManager.loadExternalDocs();
            } else if (this.uiManager && this.uiManager.docsSync && typeof this.uiManager.docsSync.loadExternalDocs === 'function') {
                await this.uiManager.docsSync.loadExternalDocs();
            }
        } catch (error) {
        }
    }

    // 更新上传按钮文本和图标
    updateUploadButtonText(type) {
        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) {
            const iconElement = uploadBtn.querySelector('i');
            const textElement = uploadBtn.querySelector('span');
            
            if (type === 'url') {
                // URL分类：显示"添加链接"和链接图标
                if (iconElement) {
                    iconElement.className = 'fa fa-link';
                }
                if (textElement) {
                    textElement.textContent = '添加链接';
                }
            } else {
                // 其他分类：显示"上传文件"和上传图标
                if (iconElement) {
                    iconElement.className = 'fa fa-upload';
                }
                if (textElement) {
                    textElement.textContent = '上传文件';
                }
            }
        }
    }

    // 过滤文件
    filterFiles(type) {
        this.uiManager.currentCategory = type;
        

        
        // 处理外站文档分类
        if (type === 'external-docs') {
            // 更新文件计数为0，因为外站文档由docs-sync模块处理
            if (this.uiManager.updateFileCount) {
                this.uiManager.updateFileCount(0, this.uiManager.totalFileCount || 0);
            }
            if (this.uiManager.toggleEmptyState) {
                this.uiManager.toggleEmptyState(0);
            }
            return;
        }
        
        // 检查是否需要重新加载文件数据
        if (!this.uiManager.allFiles || this.uiManager.allFiles.length === 0) {
            // 尝试重新加载文件数据
            if (this.uiManager.apiManager && typeof this.uiManager.apiManager.getFiles === 'function') {
                this.uiManager.apiManager.getFiles().then(files => {
                    this.uiManager.allFiles = files || [];
                    // 重新执行过滤
                    this.filterFiles(type);
                }).catch(error => {
                    console.error('重新加载文件失败:', error);
                });
                return;
            }
        }
        
        // 根据文件类型过滤文件
        let filteredFiles = [];
        
        if (type === 'all') {
            // 显示所有文件
            filteredFiles = this.uiManager.allFiles || [];
        } else {
            // 根据类型过滤文件
            filteredFiles = (this.uiManager.allFiles || []).filter(file => {
                // 处理子分类
                if (type === 'document') {
                    return ['word', 'excel', 'pdf', 'powerpoint'].includes(file.type);
                } else if (type === 'word') {
                    return file.type === 'word';
                } else if (type === 'excel') {
                    return file.type === 'excel';
                } else if (type === 'pdf') {
                    return file.type === 'pdf';
                } else if (type === 'powerpoint') {
                    return file.type === 'powerpoint';
                } else {
                    return file.type === type;
                }
            });
        }
        

        
        // 更新文件计数
        if (this.uiManager.updateFileCount) {
            this.uiManager.updateFileCount(filteredFiles.length, this.uiManager.totalFileCount || 0);
        }
        
        // 切换空状态显示
        if (this.uiManager.toggleEmptyState) {
            this.uiManager.toggleEmptyState(filteredFiles.length);
        }
        
        // 检查是否为列表模式
        const fileGrid = document.getElementById('files-grid');
        const isListMode = fileGrid && (fileGrid.classList.contains('list-layout') || fileGrid.style.display === 'flex');
        
        if (isListMode) {
            // 列表模式：重新渲染过滤后的文件列表
            if (this.uiManager && this.uiManager.fileRenderer) {
                const currentLayoutMode = this.uiManager.fileRenderer.layoutMode || 'list';
                this.uiManager.fileRenderer.renderFileList(filteredFiles, currentLayoutMode);
            }
        } else {
            // 卡片模式：重新渲染过滤后的文件列表
            if (this.uiManager && this.uiManager.fileRenderer) {
                const currentLayoutMode = this.uiManager.fileRenderer.layoutMode || 'card';
                this.uiManager.fileRenderer.renderFileList(filteredFiles, currentLayoutMode);
            }
        }
    }

    // 禁用分类按钮
    disableCategoryButtons() {
        document.querySelectorAll('.file-type-btn, .sub-file-type-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
    }

    // 启用分类按钮
    enableCategoryButtons() {
        document.querySelectorAll('.file-type-btn, .sub-file-type-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
    }
}

// 暴露到全局作用域
window.UICategories = UICategories; 