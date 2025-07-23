/**
 * 分类管理模块
 * 处理文件类型按钮、分类过滤、可展开分类等功能
 */
class UICategories {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.clickTimeout = null; // 用于处理可展开按钮的单击延迟
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
        this.bindExpandableCategoryEvents();
        
        // 初始化新建分组按钮事件
        this.initializeCreateFolderButton();
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
        categoryButtons.forEach(btn => {
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
        expandableButtons.forEach(btn => {
            // 移除可能存在的旧事件监听器
            btn.removeEventListener('dblclick', this.handleExpandableDoubleClick);
            
            // 添加新的双击事件监听器
            btn.addEventListener('dblclick', this.handleExpandableDoubleClick.bind(this));
        });
        
        // 为子分类按钮绑定点击事件
        const subButtons = document.querySelectorAll('.sub-file-type-btn');
        subButtons.forEach(btn => {
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
        
        // 取消单击延迟
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        
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
        }, 500);
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
        subContainer.classList.remove('hidden');
        
        // 设置按钮动画延迟
        const subButtons = subContainer.querySelectorAll('.sub-file-type-btn');
        subButtons.forEach((button, index) => {
            button.style.setProperty('--btn-index', index);
        });
        
        // 触发展开动画
        requestAnimationFrame(() => {
            subContainer.classList.add('show');
        });
    }

    // 收起子分类
    collapseSubCategories(btn, subContainer) {
        btn.setAttribute('data-expanded', 'false');
        subContainer.classList.remove('show');
        
        // 延迟隐藏容器
        setTimeout(() => {
            subContainer.classList.add('hidden');
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

    // 处理子分类按钮点击
    handleSubFileTypeFilter(btn) {
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
        
        // 过滤文件
        this.filterFiles(type);
        
        // 更新上传按钮显示状态
        this.forceUpdateCreateFolderButton();
    }

    // 处理文件类型过滤
    handleFileTypeFilter(event) {
        const btn = event.target.closest('.file-type-btn');
        if (!btn) return;
        
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
            }, 200); // 200ms延迟，给双击事件留出时间
            
            return;
        }
        
        // 普通按钮直接执行
        this.executeFileTypeFilter(btn);
    }
    
    // 执行文件类型过滤
    executeFileTypeFilter(btn) {
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

        // 添加当前标签的活动状态
        btn.classList.add('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
        btn.classList.remove('bg-dark-light', 'hover:bg-dark-light/70');

        // 过滤文件
        const type = btn.getAttribute('data-type');
        this.uiManager.currentCategory = type; // 记录当前分类
        
        // 清理外站文档样式（默认情况）
        document.body.classList.remove('external-docs-category');
        
        // 处理外站文档分类的特殊逻辑
        if (type === 'external-docs') {
            this.handleExternalDocsCategory();
            return;
        }
        
        // 处理其他分类
        this.handleRegularCategory(type);
    }
    
    // 处理外站文档分类
    handleExternalDocsCategory() {
        // 设置当前分类
        this.uiManager.currentCategory = 'external-docs';
        
        // 添加外站文档分类CSS类
        document.body.classList.add('external-docs-category');
        
        // 隐藏文件夹区域
        const folderSection = document.getElementById('folder-section');
        if (folderSection) {
            folderSection.classList.add('hidden');
        }
        
        // 隐藏新建分组按钮
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        if (createFolderBtn) {
            createFolderBtn.style.display = 'none';
        }
        
        // 隐藏上传按钮，显示同步文档按钮
        const uploadBtn = document.getElementById('upload-btn');
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        
        if (uploadBtn) {
            uploadBtn.style.display = 'none';
        }
        
        if (syncDocsBtn) {
            syncDocsBtn.style.display = 'flex';
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
        
        // 先过滤文件，确保文件显示正确
        this.filterFiles(type);

        // 控制分组区域显示/隐藏
        const folderSection = document.getElementById('folder-section');
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        
        if (folderSection) {
            if (type === 'all') {
                folderSection.classList.add('hidden');
                if (createFolderBtn) {
                    createFolderBtn.style.display = 'none';
                }
            } else {
                folderSection.classList.remove('hidden');
                if (createFolderBtn) {
                    createFolderBtn.style.display = 'flex';
                }
            }
        }
        
        // 显示上传按钮，隐藏同步文档按钮（非外站文档分类）
        const uploadBtn = document.getElementById('upload-btn');
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        
        if (uploadBtn) {
            if (type === 'url') {
                // URL类型显示特殊的"添加链接"按钮
                uploadBtn.innerHTML = '<i class="fa fa-link mr-2"></i>添加链接';
                uploadBtn.style.display = 'flex';
            } else {
                uploadBtn.innerHTML = '<i class="fa fa-upload mr-2"></i>上传文件';
                uploadBtn.style.display = 'flex';
            }
        }
        
        if (syncDocsBtn) {
            syncDocsBtn.style.display = 'none';
        }

        // 延迟刷新分组，确保文件过滤完成后再刷新分组
        setTimeout(() => {
            if (this.uiManager.refreshFolders) {
                this.uiManager.refreshFolders();
            }
        }, 100);
        
        // 更新上传区域提示信息和文件输入框设置
        if (this.uiManager.updateUploadAreaHint) {
            this.uiManager.updateUploadAreaHint();
        }
        if (this.uiManager.updateFileInputMultiple) {
            this.uiManager.updateFileInputMultiple();
        }
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
            console.error('加载外站文档失败:', error);
        }
    }

    // 过滤文件
    filterFiles(type) {
        this.uiManager.currentCategory = type;
        
        // 外站文档分类不进行文件过滤，由docs-sync模块处理
        if (type === 'external-docs') {
            // 更新文件计数为0，因为外站文档由docs-sync模块处理
            if (this.uiManager.updateFileCount) {
                this.uiManager.updateFileCount(0, 0);
            }
            if (this.uiManager.toggleEmptyState) {
                this.uiManager.toggleEmptyState(0);
            }
            return;
        }
        
        if (type === 'all' && window.app && typeof window.app.loadUserData === 'function') {
            // 切换到全部时强制刷新所有数据
            window.app.loadUserData(window.app.apiManager.currentUser);
            return;
        }
        
        // 检查是否为列表模式
        const fileGrid = document.getElementById('files-grid');
        const isListMode = fileGrid && (fileGrid.classList.contains('list-layout') || fileGrid.style.display === 'flex');
        
        if (isListMode) {
            // 列表模式：重新渲染文件列表
            if (this.uiManager && this.uiManager.fileRenderer && this.uiManager.allFiles) {
                // 确保传递正确的布局模式
                const currentLayoutMode = this.uiManager.fileRenderer.layoutMode || 'list';
        
                this.uiManager.fileRenderer.renderFileList(this.uiManager.allFiles, currentLayoutMode);
            }
            return;
        }
        
        // 卡片模式：使用DOM操作过滤
        const fileCards = document.querySelectorAll('#files-grid > div');
        let visibleCount = 0;
        fileCards.forEach(card => {
            const fileData = card.getAttribute('data-type');
            let shouldShow = false;
            if (type === 'document') {
                shouldShow = ['document', 'word', 'excel', 'powerpoint', 'pdf'].includes(fileData);
            } else {
                shouldShow = fileData === type;
            }
            if (shouldShow) {
                card.classList.remove('hidden');
                card.style.opacity = '1';
                visibleCount++;
            } else {
                card.classList.add('hidden');
                card.style.opacity = '0';
            }
        });
        if (this.uiManager.updateFileCount) {
            this.uiManager.updateFileCount(visibleCount, this.uiManager.totalFileCount);
        }
        if (this.uiManager.toggleEmptyState) {
            this.uiManager.toggleEmptyState(visibleCount);
        }
        this.forceUpdateCreateFolderButton();
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