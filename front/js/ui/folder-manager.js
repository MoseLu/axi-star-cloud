/**
 * 文件夹管理模块
 * 处理文件夹列表渲染、文件夹操作、面包屑导航等功能
 */
class UIFolderManager {
    constructor(uiManager) {
        this.uiManager = uiManager;
    }

    // 渲染文件夹列表
    async renderFolderList(folders, retry = 0) {
        if (!Array.isArray(folders)) folders = [];
        const category = this.uiManager.currentCategory;
        
        console.log('📁 开始渲染文件夹列表:', { 
            foldersCount: folders.length, 
            folders: folders,
            currentCategory: category,
            retry: retry
        });
        
        const foldersGrid = document.getElementById('folders-grid');
        const folderSection = document.getElementById('folder-section');
        
        console.log('🔍 DOM元素检查:', {
            foldersGrid: !!foldersGrid,
            folderSection: !!folderSection,
            folderSectionHidden: folderSection ? folderSection.classList.contains('hidden') : 'N/A'
        });
        
        if (!foldersGrid) {
            if (retry < 10) {
                setTimeout(() => this.renderFolderList(folders, retry + 1), 100);
            } else {
                console.warn('⚠️ 文件夹网格容器始终未找到: folders-grid');
            }
            return;
        }
        if (!folderSection) {
            if (retry < 10) {
                setTimeout(() => this.renderFolderList(folders, retry + 1), 100);
            } else {
                console.warn('⚠️ 文件夹区域容器始终未找到: folder-section');
            }
            return;
        }
        if (folderSection.classList.contains('hidden')) {
            console.log('📁 文件夹区域被隐藏，跳过渲染');
            return; // 区域隐藏时不渲染
        }
        
        foldersGrid.innerHTML = '';
        
        if (!category || category === 'all') {
            console.log('📁 全部文件页面，不渲染文件夹');
            return;
        }
        
        // 只渲染当前分类下的文件夹
        const categoryFolders = folders.filter(f => f.category === category);
        
        console.log('📁 分类过滤结果:', {
            category: category,
            totalFolders: folders.length,
            categoryFolders: categoryFolders.length,
            categoryFolders: categoryFolders
        });
        
        if (categoryFolders.length === 0) {
            console.log('📁 当前分类下没有文件夹，显示空状态');
            foldersGrid.innerHTML = `<div class="col-span-full text-center py-12">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i class="fa fa-folder-open text-2xl text-blue-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">暂无分组</h3>
                <p class="text-gray-400 text-sm">点击"新建分组"按钮创建第一个分组</p>
            </div>`;
            return;
        }
        
        console.log('📁 开始渲染文件夹卡片，数量:', categoryFolders.length);
        
        for (const folder of categoryFolders) {
            const folderHTML = await this.createFolderCardHTML(folder, {
                name: '', icon: 'fa-folder', color: this.uiManager.getCategoryColor(category)
            });
            foldersGrid.insertAdjacentHTML('beforeend', folderHTML);
        }
        
        foldersGrid.querySelectorAll('[data-folder-id]').forEach(card => {
            const folderId = card.getAttribute('data-folder-id');
            const folder = categoryFolders.find(f => f.id == folderId);
            if (folder) this.addFolderCardEventListeners(card, folder);
        });
        
        console.log('✅ 文件夹渲染完成，共渲染了', categoryFolders.length, '个文件夹');
    }

    // 创建类别分组
    createCategorySection(categoryInfo, folders) {
        const section = document.createElement('div');
        section.className = 'mb-8';
        
        section.innerHTML = `
            <div class="flex items-center space-x-3 mb-4">
                <div class="w-8 h-8 bg-gradient-to-br from-${categoryInfo.color}-500/20 to-${categoryInfo.color}-600/20 rounded-lg flex items-center justify-center">
                    <i class="fa ${categoryInfo.icon} text-${categoryInfo.color}-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-white">${categoryInfo.name}</h3>
                <span class="text-sm text-gray-400">(${folders.length})</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-category="${categoryInfo.name.toLowerCase()}">
                ${folders.map(folder => this.createFolderCardHTML(folder, categoryInfo)).join('')}
            </div>
        `;

        // 为每个文件夹卡片添加事件监听器
        const folderCards = section.querySelectorAll('[data-folder-id]');
        folderCards.forEach(card => {
            const folderId = card.getAttribute('data-folder-id');
            const folder = folders.find(f => f.id == folderId);
            if (folder) {
                this.addFolderCardEventListeners(card, folder);
            }
        });

        return section;
    }

    // 创建文件夹卡片HTML
    async createFolderCardHTML(folder, categoryInfo) {
        // 获取文件夹文件数量
        let fileCount = 0;
        try {
            fileCount = await this.uiManager.api.getFolderFileCount(folder.id);
        } catch (error) {
            // 获取文件夹文件数量失败
        }

        return `
            <div class="glass-effect rounded-xl p-3 border border-blue-400/40 hover:border-blue-400/80 transition-all duration-300 cursor-pointer group drop-zone relative min-h-[100px] max-w-[200px] flex flex-col justify-between items-center bg-gradient-to-br from-blue-900/60 to-dark/80 shadow-lg" data-folder-id="${folder.id}" title="点击查看文件夹内容">
                <!-- 第一行：文件夹名称和操作按钮 -->
                <div class="flex items-center justify-between w-full mb-2">
                    <h4 class="font-semibold text-blue-300 truncate text-xs flex-1 min-w-0 max-w-[70%]" title="${folder.name}">
                        ${folder.name.length > 7 ? folder.name.slice(0, 7) + '…' : folder.name}
                    </h4>
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button class="folder-edit-btn text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-lg hover:bg-blue-400/10" title="重命名">
                            <i class="fa fa-edit text-xs"></i>
                        </button>
                        <button class="folder-delete-btn text-red-400 hover:text-red-300 transition-colors p-1 rounded-lg hover:bg-red-400/10" title="删除">
                            <i class="fa fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
                
                <!-- 第二行：文件数量 -->
                <div class="flex items-center w-full mb-2">
                    <div class="w-5 h-5 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-lg flex items-center justify-center mr-1 flex-shrink-0">
                        <i class="fa fa-folder text-xs text-blue-300"></i>
                    </div>
                    <div class="flex items-center">
                        <span class="text-xs font-medium text-blue-200 drop-shadow-sm flex-shrink-0">文件数：</span>
                        <span class="text-xs font-bold text-cyan-400 ml-0.5 flex-shrink-0">${fileCount}</span>
                    </div>
                </div>
                
                <!-- 第三行：创建时间 -->
                <div class="flex items-center w-full mb-2">
                    <div class="w-5 h-5 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-lg flex items-center justify-center mr-1 flex-shrink-0">
                        <i class="fa fa-calendar text-xs text-blue-300"></i>
                    </div>
                    <div class="flex items-center">
                        <span class="text-xs font-medium text-blue-200 drop-shadow-sm flex-shrink-0">创建于</span>
                        <span class="text-xs font-bold text-cyan-400 ml-0.5 flex-shrink-0">${this.formatDate(folder.created_at)}</span>
                    </div>
                </div>
                <div class="absolute inset-0 bg-blue-500/5 border-2 border-dashed border-blue-400/30 rounded-xl opacity-0 transition-opacity duration-300 flex items-center justify-center pointer-events-none drag-hint">
                    <div class="text-center">
                        <i class="fa fa-arrow-down text-xl text-blue-400 mb-2"></i>
                        <p class="text-xs text-blue-400 font-medium">拖拽文件到这里</p>
                    </div>
                </div>
            </div>
        `;
    }

    // 创建文件夹卡片
    createFolderCard(folder) {
        const folderCard = document.createElement('div');
        folderCard.className = 'glass-effect rounded-xl p-6 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 cursor-pointer group folder-card drop-zone relative min-h-[180px] max-w-[280px]';
        folderCard.setAttribute('data-folder-id', folder.id);

        folderCard.innerHTML = `
            <!-- 主要内容区域 -->
            <div class="card-content flex flex-col h-full" data-folder-id="${folder.id}" title="点击查看文件夹内容">
                <!-- 顶部：图标 -->
                <div class="folder-icon-container flex flex-col items-center justify-center mb-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0 mb-3">
                        <i class="fa fa-folder text-3xl text-blue-400"></i>
                    </div>
                </div>
                
                <!-- 第一行：文件夹名称和操作按钮 -->
                <div class="flex items-center justify-between w-full mb-3">
                    <div class="flex items-center gap-1 flex-1 min-w-0 max-w-[70%]">
                        <h4 class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 truncate text-sm" title="${folder.name}">${this.uiManager.truncateFileName(folder.name)}</h4>
                        <span class="text-xs px-1.5 py-0.5 rounded-full ${this.uiManager.getCategoryBadgeColor(folder.category)} ${this.uiManager.getCategoryBadgeBg(folder.category)} font-medium flex-shrink-0">
                            ${this.uiManager.getCategoryLabel(folder.category)}
                        </span>
                    </div>
                    <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button class="folder-edit-btn text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-lg hover:bg-blue-400/10" title="重命名">
                            <i class="fa fa-edit text-xs"></i>
                        </button>
                        <button class="folder-delete-btn text-red-400 hover:text-red-300 transition-colors p-1 rounded-lg hover:bg-red-400/10" title="删除">
                            <i class="fa fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
                
                <!-- 第二行：文件数量 -->
                <div class="flex items-center mb-3 w-full">
                    <i class="fa fa-file-o text-xs text-gray-400 mr-1"></i>
                    <span class="text-xs text-gray-400">0 个文件</span>
                </div>
                
                <!-- 第三行：创建时间 -->
                <div class="flex items-center mb-3 w-full">
                    <i class="fa fa-calendar text-xs text-gray-400 mr-1"></i>
                    <span class="text-xs text-gray-400">创建于 ${this.formatDate(folder.created_at)}</span>
                </div>
            </div>
            
            <!-- 拖拽提示区域 -->
            <div class="absolute inset-0 bg-blue-500/5 border-2 border-dashed border-blue-400/30 rounded-xl opacity-0 transition-opacity duration-300 flex items-center justify-center pointer-events-none drag-hint">
                <div class="text-center">
                    <i class="fa fa-arrow-down text-2xl text-blue-400 mb-2"></i>
                    <p class="text-sm text-blue-400 font-medium">拖拽文件到这里</p>
                </div>
            </div>
        `;

        // 添加事件监听器
        this.addFolderCardEventListeners(folderCard, folder);

        return folderCard;
    }

    // 添加文件夹卡片事件监听器
    addFolderCardEventListeners(folderCard, folder) {
        // 点击文件夹
        folderCard.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-edit-btn') && !e.target.closest('.folder-delete-btn')) {
                this.showFolderFiles(folder.id, folder.name);
            }
        });

        // 编辑按钮
        folderCard.querySelector('.folder-edit-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEditFolderDialog(folder).then(newName => {
                if (newName && newName !== folder.name) {
                    this.editFolder(folder.id, newName);
                }
            });
        });

        // 删除按钮
        folderCard.querySelector('.folder-delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.uiManager.showConfirmDialog) {
                this.uiManager.showConfirmDialog('确定要删除该文件夹吗？').then(confirmed => {
                    if (confirmed) {
                        this.deleteFolder(folder.id, folder.name);
                    }
                });
            }
        });
    }

    // 显示文件夹内容
    async showFolderFiles(folderId, folderName) {
        try {
            // 设置当前文件夹ID
            this.uiManager.currentFolderId = folderId;
            
            // 获取文件夹中的文件（包括普通文件和URL文件）
            const [files, urlFiles] = await Promise.all([
                this.uiManager.api.getFiles(folderId),
                this.uiManager.api.getUrlFiles(folderId)
            ]);
            
            // 合并文件列表
            const allFiles = [...files, ...urlFiles];
            
            // 渲染文件列表
            this.uiManager.renderFileList(allFiles);
            
            // 显示面包屑导航
            this.showBreadcrumb(folderName);
            
            // 更新面包屑中的文件数量
            this.updateFolderFileCount(allFiles.length);
            
            // 更新文件类型标签状态 - 在文件夹中时禁用分类切换
            this.disableCategoryButtons();
            
            // 隐藏文件夹区域
            this.hideFolderSection();
            
            // 显示返回按钮
            this.showBackButton();
            
        } catch (error) {
            if (this.uiManager.showMessage) {
                this.uiManager.showMessage('获取文件夹内容失败', 'error');
            }
        }
    }

    // 从文件跳转到对应文件夹
    async showFolderFromFile(folderId) {
        try {
            // 获取文件夹信息
            const folders = await this.uiManager.api.getFolders();
            const folder = folders.find(f => f.id === folderId);
            
            if (folder) {
                await this.showFolderFiles(folderId, folder.name);
            } else {
                if (this.uiManager.showMessage) {
                    this.uiManager.showMessage('文件夹不存在', 'error');
                }
            }
        } catch (error) {
            if (this.uiManager.showMessage) {
                this.uiManager.showMessage('跳转到文件夹失败', 'error');
            }
        }
    }

    // 显示面包屑导航
    showBreadcrumb(folderName) {
        // 先移除现有的面包屑导航
        const existingBreadcrumb = document.getElementById('breadcrumb-container');
        if (existingBreadcrumb) {
            existingBreadcrumb.remove();
        }
        
        // 创建新的面包屑导航
        const breadcrumb = document.createElement('div');
        breadcrumb.id = 'breadcrumb-container';
        breadcrumb.className = 'flex items-center justify-between mb-6 p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border-2 border-purple-400/50 backdrop-blur-sm shadow-xl';
        breadcrumb.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 10 !important;
            height: auto !important;
            width: auto !important;
            margin-bottom: 1.5rem !important;
            padding: 1rem !important;
            backdrop-filter: blur(10px) !important;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2)) !important;
            border: 2px solid rgba(139, 92, 246, 0.5) !important;
            border-radius: 0.75rem !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        `;
        
        breadcrumb.innerHTML = `
            <div class="flex items-center space-x-2">
                <button class="breadcrumb-back-btn flex items-center space-x-2 text-purple-light hover:text-purple-300 transition-colors" title="返回所有文件" style="padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; white-space: nowrap;">
                    <i class="fa fa-arrow-left"></i>
                    <span>返回</span>
                </button>
                <i class="fa fa-chevron-right text-gray-400"></i>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 font-medium truncate max-w-xs" title="${folderName}" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${folderName}</span>
            </div>
            <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-400">共</span>
                <span class="text-lg font-bold text-purple-light" id="folder-file-count">0</span>
                <span class="text-sm text-gray-400">个文件</span>
            </div>
        `;
        
        // 查找插入位置
        const fileTypeButtons = document.querySelector('.flex.flex-wrap.gap-3.mb-8.overflow-x-auto.pb-2');
        
        if (fileTypeButtons) {
            fileTypeButtons.insertAdjacentElement('afterend', breadcrumb);
        } else {
            // 备用方案：插入到主内容区域的开始位置
            const mainContent = document.querySelector('main');
            
            if (mainContent) {
                mainContent.insertBefore(breadcrumb, mainContent.firstChild);
            } else {
                return;
            }
        }
        
        // 绑定返回按钮事件
        const backBtn = breadcrumb.querySelector('.breadcrumb-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.goBackToAllFiles();
            });
        }
    }

    // 返回所有文件视图
    async goBackToAllFiles() {
        try {
            // 重置当前文件夹ID
            this.uiManager.currentFolderId = null;
            
            // 清理外站文档样式
            if (this.uiManager.cleanupExternalDocsStyles) {
                this.uiManager.cleanupExternalDocsStyles();
            }
            
            // 重新获取根目录的文件（包括普通文件和URL文件）
            const [files, urlFiles] = await Promise.all([
                this.uiManager.api.getFiles(),
                this.uiManager.api.getUrlFiles()
            ]);
            this.uiManager.allFiles = [...files, ...urlFiles]; // 更新缓存
            
            // 清空外站文档内容
            const externalDocsEmptyState = document.querySelector('#files-grid .col-span-full');
            if (externalDocsEmptyState) {
                externalDocsEmptyState.remove();
            }
            
            // 重新渲染文件列表
            this.uiManager.renderFileList(files);
            
            // 如果当前有分类过滤，重新应用过滤
            if (this.uiManager.currentCategory && this.uiManager.currentCategory !== 'all') {
                this.uiManager.filterFiles(this.uiManager.currentCategory);
            }
            
            // 隐藏面包屑导航
            this.hideBreadcrumb();
            
            // 启用分类按钮
            this.enableCategoryButtons();
            
            // 显示文件夹区域
            this.showFolderSection();
            
            // 隐藏返回按钮
            this.hideBackButton();
            
            // 重新渲染文件夹列表
            const folders = await this.uiManager.api.getFolders();
            await this.renderFolderList(folders);
            
        } catch (error) {
            if (this.uiManager.showMessage) {
                this.uiManager.showMessage('返回失败', 'error');
            }
        }
    }

    // 隐藏面包屑导航
    hideBreadcrumb() {
        const breadcrumbContainer = document.getElementById('breadcrumb-container');
        if (breadcrumbContainer) {
            breadcrumbContainer.remove();
        }
    }

    // 更新面包屑中的文件数量
    updateFolderFileCount(count) {
        const countElement = document.getElementById('folder-file-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // 禁用分类按钮
    disableCategoryButtons() {
        const categoryButtons = document.querySelectorAll('.file-type-btn');
        categoryButtons.forEach(btn => {
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.disabled = true;
        });
    }

    // 启用分类按钮
    enableCategoryButtons() {
        const categoryButtons = document.querySelectorAll('.file-type-btn');
        categoryButtons.forEach(btn => {
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            btn.disabled = false;
        });
    }

    // 隐藏文件夹区域
    hideFolderSection() {
        const folderSection = document.getElementById('folder-section');
        if (folderSection) {
            folderSection.classList.add('hidden');
        }
    }

    // 显示文件夹区域
    showFolderSection() {
        const folderSection = document.getElementById('folder-section');
        if (folderSection) {
            folderSection.classList.remove('hidden');
        }
    }

    // 显示返回按钮
    showBackButton() {
        const backButton = document.getElementById('back-to-all-btn');
        if (backButton) {
            backButton.classList.remove('hidden');
        }
    }

    // 隐藏返回按钮
    hideBackButton() {
        const backButton = document.getElementById('back-to-all-btn');
        if (backButton) {
            backButton.classList.add('hidden');
        }
    }

    // 编辑文件夹
    async editFolder(folderId, currentName) {
        try {
            const newName = await this.showEditFolderDialog({ id: folderId, name: currentName });
            if (newName && newName !== currentName) {
                await this.uiManager.api.updateFolder(folderId, { name: newName });
                if (this.uiManager.showMessage) {
                    this.uiManager.showMessage('文件夹重命名成功', 'success');
                }
                // 刷新文件夹列表
                if (this.uiManager.refreshFolders) {
                    this.uiManager.refreshFolders();
                }
            }
        } catch (error) {
            if (this.uiManager.showMessage) {
                this.uiManager.showMessage('重命名失败', 'error');
            }
        }
    }

    // 删除文件夹
    async deleteFolder(folderId, folderName) {
        try {
            await this.uiManager.api.deleteFolder(folderId);
            if (this.uiManager.showMessage) {
                this.uiManager.showMessage('文件夹删除成功', 'success');
            }
            // 刷新文件夹列表
            if (this.uiManager.refreshFolders) {
                this.uiManager.refreshFolders();
            }
        } catch (error) {
            if (this.uiManager.showMessage) {
                this.uiManager.showMessage('删除失败', 'error');
            }
        }
    }

    // 自定义编辑文件夹弹窗
    showEditFolderDialog(folder) {
        return new Promise((resolve) => {
            // 创建模态框
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
            modal.innerHTML = `
                <div class="bg-dark-light rounded-xl p-8 w-full max-w-xs shadow-2xl border border-blue-400/30 flex flex-col items-center">
                    <h3 class="text-lg font-bold text-blue-300 mb-4">重命名分组</h3>
                    <input id="edit-folder-input" type="text" class="w-full p-2 rounded-lg border border-blue-400/30 bg-dark text-white mb-6 focus:ring-2 focus:ring-blue-400 outline-none" value="${folder.name}" maxlength="20" autocomplete="off" />
                    <div class="flex w-full justify-between gap-4">
                        <button id="edit-folder-cancel" class="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">取消</button>
                        <button id="edit-folder-confirm" class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">确认</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const input = modal.querySelector('#edit-folder-input');
            const cancelBtn = modal.querySelector('#edit-folder-cancel');
            const confirmBtn = modal.querySelector('#edit-folder-confirm');
            
            // 聚焦输入框
            input.focus();
            input.select();
            
            // 绑定事件
            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });
            
            confirmBtn.addEventListener('click', () => {
                const newName = input.value.trim();
                if (newName) {
                    modal.remove();
                    resolve(newName);
                }
            });
            
            // 回车确认
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newName = input.value.trim();
                    if (newName) {
                        modal.remove();
                        resolve(newName);
                    }
                }
            });
            
            // ESC取消
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    resolve(null);
                }
            });
        });
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
}

// 暴露到全局作用域
window.UIFolderManager = UIFolderManager; 