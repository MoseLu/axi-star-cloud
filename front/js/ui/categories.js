/**
 * 分类管理模块
 * 处理文件类型按钮、分类过滤、可展开分类等功能
 */
class UICategories {
    constructor(uiManager) {
        this.uiManager = uiManager;
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
            
            // 确保上传按钮显示（默认是全部文件分类）
            const uploadBtn = document.getElementById('upload-btn');
            if (uploadBtn) {
                uploadBtn.style.display = 'flex';
            }
        } else {
            // 未找到全部文件按钮
            console.warn('未找到全部文件按钮');
        }
        
        // 为现有的可展开按钮绑定双击事件
        this.bindExpandableCategoryEvents();
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
        this.toggleExpandableCategory(e.target);
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
        event.target.classList.add('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
        event.target.classList.remove('bg-dark-light', 'hover:bg-dark-light/70');

        // 过滤文件
        const type = event.target.getAttribute('data-type');
        this.uiManager.currentCategory = type; // 记录当前分类
        
        console.log('🔍 分类切换 - 设置currentCategory:', {
            type: type,
            currentCategory: this.uiManager.currentCategory,
            uiManager: this.uiManager
        });
        
        // 先过滤文件，确保文件显示正确
        this.filterFiles(type);

        // 控制分组区域显示/隐藏
        const folderSection = document.getElementById('folder-section');
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        
        console.log('🔍 分类切换时的文件夹区域检查:', {
            folderSection: !!folderSection,
            folderSectionHidden: folderSection ? folderSection.classList.contains('hidden') : 'N/A',
            type: type
        });
        
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

        // 延迟刷新分组，确保文件过滤完成后再刷新分组
        setTimeout(() => {
            console.log('🔍 延迟刷新文件夹 - currentCategory检查:', {
                currentCategory: this.uiManager.currentCategory,
                type: type
            });
            if (this.uiManager.refreshFolders) {
                this.uiManager.refreshFolders();
            }
        }, 100);
    }

    // 过滤文件
    filterFiles(type) {
        this.uiManager.currentCategory = type;
        if (type === 'all' && window.app && typeof window.app.loadUserData === 'function') {
            // 切换到全部时强制刷新所有数据
            window.app.loadUserData(window.app.apiManager.currentUser);
            return;
        }
        // 只用allFiles过滤
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