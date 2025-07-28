/**
 * 文件夹管理模块
 * 处理文件夹的创建、删除、重命名等操作
 */
if (typeof UIFolderManager === 'undefined') {
    class UIFolderManager {
        constructor(uiManager) {
            this.uiManager = uiManager;
            this._lastRenderedFoldersKey = null;
            this._lastRenderedCategory = null;
            this._isRendering = false;
        }

        init() {
            // 初始化文件夹管理器
            // 可以在这里添加初始化逻辑，比如绑定事件等
        }

        // 渲染文件夹列表
        async renderFolderList(folders, retry = 0) {
            if (!Array.isArray(folders)) folders = [];
            const category = this.uiManager.currentCategory;
            
            // 防止重复渲染：检查当前渲染的文件夹是否与上次相同
            const currentFoldersKey = JSON.stringify(folders.map(f => ({ id: f.id, name: f.name, category: f.category })));
            const currentCategory = this.uiManager.currentCategory;
            
            // 如果分类发生了变化，即使文件夹列表相同也要重新渲染
            if (this._lastRenderedFoldersKey === currentFoldersKey && this._lastRenderedCategory === currentCategory) {
                return;
            }
            
            // 如果正在渲染中，等待一下再重试
            if (this._isRendering) {
                setTimeout(() => this.renderFolderList(folders, retry + 1), 100);
                return;
            }
            
            // 设置渲染标志
            this._isRendering = true;
            this._lastRenderedFoldersKey = currentFoldersKey;
            this._lastRenderedCategory = currentCategory;
            
            const foldersGrid = document.getElementById('folders-grid');
            const folderSection = document.getElementById('folder-section');
            
            if (!foldersGrid) {
                if (retry < 10) {
                    setTimeout(() => this.renderFolderList(folders, retry + 1), 100);
                }
                this._isRendering = false; // 清除渲染标志
                return;
            }
            if (!folderSection) {
                if (retry < 10) {
                    setTimeout(() => this.renderFolderList(folders, retry + 1), 100);
                }
                this._isRendering = false; // 清除渲染标志
                return;
            }
            if (folderSection.classList.contains('hidden')) {
                this._isRendering = false; // 清除渲染标志
                return; // 区域隐藏时不渲染
            }
            
            foldersGrid.innerHTML = '';
            
            if (!category || category === 'all') {
                this._isRendering = false; // 清除渲染标志
                return;
            }
            
            // 只渲染当前分类下的文件夹
            const categoryFolders = folders.filter(f => f.category === category);
            
            if (categoryFolders.length === 0) {
                foldersGrid.classList.add('empty-state');
                foldersGrid.innerHTML = `<div class="w-full flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <i class="fa fa-folder-open text-2xl text-blue-400"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-white mb-2">暂无分组</h3>
                        <p class="text-gray-400 text-sm">点击"新建分组"按钮创建第一个分组</p>
                    </div>
                </div>`;
                this._isRendering = false; // 清除渲染标志
                return;
            }
            
            // 移除空状态类
            foldersGrid.classList.remove('empty-state');
            
            // 使用DocumentFragment来提高性能
            const fragment = document.createDocumentFragment();
            
            for (const folder of categoryFolders) {
                const folderHTML = await this.createFolderCardHTML(folder, {
                    name: '', icon: 'fa-folder', color: this.uiManager.getCategoryColor(category)
                });
                
                // 创建临时容器来解析HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = folderHTML;
                const folderElement = tempDiv.firstElementChild;
                
                if (folderElement) {
                    fragment.appendChild(folderElement);
                }
            }
            
            // 一次性添加到DOM
            foldersGrid.appendChild(fragment);
            
            // 绑定事件监听器
            foldersGrid.querySelectorAll('[data-folder-id]').forEach(card => {
                const folderId = card.getAttribute('data-folder-id');
                const folder = categoryFolders.find(f => f.id == folderId);
                if (folder) {
                    this.addFolderCardEventListeners(card, folder);
                }
            });
            
            // 异步更新每个文件夹的文件数量
            setTimeout(() => {
                categoryFolders.forEach(folder => {
                    const folderCard = foldersGrid.querySelector(`[data-folder-id="${folder.id}"]`);
                    if (folderCard) {
                        this.updateFolderCardFileCount(folderCard, folder.id);
                    }
                });
            }, 100);
            
            // 清除渲染标志
            this._isRendering = false;
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
            // 直接显示0个文件，避免API调用延迟问题
            // 文件数量会在后续的updateFolderCardFileCount中异步更新
            let fileCount = 0;

            return `
                <div class="glass-effect rounded-xl p-2 border border-blue-400/40 hover:border-blue-400/80 transition-all duration-300 cursor-pointer group drop-zone relative max-w-[200px] flex flex-col justify-between items-center bg-gradient-to-br from-blue-900/60 to-dark/80 shadow-lg" data-folder-id="${folder.id}" title="点击查看文件夹内容">
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
                    <div class="flex items-center justify-center w-full mb-2">
                        <div class="w-5 h-5 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-lg flex items-center justify-center mr-1 flex-shrink-0">
                            <i class="fa fa-folder text-xs text-blue-300"></i>
                        </div>
                        <div class="flex items-center">
                            <span class="text-xs font-medium text-blue-200 drop-shadow-sm flex-shrink-0">文件数：</span>
                            <span class="text-xs font-bold text-cyan-400 ml-0.5 flex-shrink-0 file-count">${fileCount}</span>
                        </div>
                    </div>
                    
                    <!-- 第三行：创建时间 -->
                    <div class="flex items-center justify-center w-full h-5">
                        <i class="fa fa-calendar text-xs mr-1" style="color: #86efac;"></i>
                        <span class="text-xs" style="color: #86efac;">${this.formatDate(folder.created_at)}</span>
                    </div>
                </div>
            `;
        }

        // 创建文件夹卡片
        createFolderCard(folder) {
            const folderCard = document.createElement('div');
                        folderCard.className = 'rounded-xl p-4 transition-all duration-300 cursor-pointer group folder-card drop-zone relative max-w-[280px]';
            folderCard.setAttribute('data-folder-id', folder.id);

            folderCard.innerHTML = `
                <!-- 主要内容区域 -->
                <div class="card-content flex flex-col" data-folder-id="${folder.id}" title="点击查看文件夹内容">
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
                    <div class="flex items-center justify-center mb-3 w-full">
                        <i class="fa fa-file-o text-xs text-gray-400 mr-1"></i>
                        <span class="text-xs text-gray-400 file-count">0 个文件</span>
                    </div>
                    
                    <!-- 第三行：创建时间 -->
                    <div class="flex items-center justify-center mb-3 w-full h-5">
                        <i class="fa fa-calendar text-xs mr-1" style="color: #86efac;"></i>
                        <span class="text-xs" style="color: #86efac;">${this.formatDate(folder.created_at)}</span>
                    </div>
                </div>
                

            `;

            // 添加事件监听器
            this.addFolderCardEventListeners(folderCard, folder);

            // 异步更新文件数量（对于新创建的文件夹，延迟更新）
            const folderCreatedAt = new Date(folder.created_at);
            const now = new Date();
            const timeDiff = now - folderCreatedAt;
            const isNewFolder = timeDiff < 5000; // 5秒内创建的文件夹认为是新文件夹
            
            if (isNewFolder) {
                // 对于新创建的文件夹，延迟2秒后更新文件数量
                setTimeout(() => {
                    this.updateFolderCardFileCount(folderCard, folder.id);
                }, 2000);
            } else {
                // 对于已存在的文件夹，立即更新文件数量
                this.updateFolderCardFileCount(folderCard, folder.id);
            }

            return folderCard;
        }

        // 更新文件夹卡片的文件数量
        async updateFolderCardFileCount(folderCard, folderId) {
            try {
                const fileCount = await this.uiManager.api.folders.getFolderFileCount(folderId);
                
                // 查找文件数量元素
                let countElement = folderCard.querySelector('.file-count');
                
                if (countElement) {
                    // 根据元素类型设置不同的文本格式
                    if (countElement.classList.contains('text-cyan-400')) {
                        // 新格式：只显示数字
                        countElement.textContent = `${fileCount}`;
                    } else {
                        // 旧格式：显示完整文本
                        countElement.textContent = `${fileCount} 个文件`;
                    }
                } else {
                    console.warn('未找到文件数量元素，文件夹ID:', folderId);
                }
            } catch (error) {
                console.error('更新文件夹文件数量失败:', error);
            }
        }

        // 添加文件夹卡片事件监听器
        addFolderCardEventListeners(folderCard, folder) {
            // 清理可能存在的旧事件监听器
            const newFolderCard = folderCard.cloneNode(true);
            folderCard.parentNode.replaceChild(newFolderCard, folderCard);
            
            // 点击文件夹
            newFolderCard.addEventListener('click', (e) => {
                if (!e.target.closest('.folder-edit-btn') && !e.target.closest('.folder-delete-btn')) {
                    this.showFolderFiles(folder.id, folder.name);
                }
            });

            // 编辑按钮
            const editBtn = newFolderCard.querySelector('.folder-edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showEditFolderDialog(folder).then(newName => {
                        if (newName && newName !== folder.name) {
                            this.updateFolderName(folder.id, newName);
                        }
                    }).catch(error => {
                        console.error('showEditFolderDialog错误:', error);
                    });
                });
            }

            // 删除按钮
            const deleteBtn = newFolderCard.querySelector('.folder-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.uiManager.showCompactConfirmDialog) {
                        this.uiManager.showCompactConfirmDialog('删除文件夹', `确定要删除文件夹"${folder.name}"吗？此操作不可恢复。`, {
                            confirmText: '删除',
                            cancelText: '取消',
                            confirmClass: 'bg-red-600 hover:bg-red-700'
                        }).then(confirmed => {
                            if (confirmed) {
                                this.deleteFolder(folder.id, folder.name);
                            }
                        }).catch(error => {
                            console.error('删除确认对话框错误:', error);
                        });
                    } else if (this.uiManager.showConfirmDialog) {
                        // 降级到原来的方法
                        this.uiManager.showConfirmDialog('确定要删除该文件夹吗？', `确定要删除文件夹"${folder.name}"吗？此操作不可恢复。`, {
                            confirmText: '删除',
                            cancelText: '取消',
                            confirmClass: 'bg-red-600 hover:bg-red-700'
                        }).then(confirmed => {
                            if (confirmed) {
                                this.deleteFolder(folder.id, folder.name);
                            }
                        }).catch(error => {
                            console.error('删除确认对话框错误:', error);
                        });
                    } else {
                        console.error('没有可用的确认对话框方法');
                    }
                });
            }

            // 添加拖拽事件监听器
            this.addFolderDropEventListeners(newFolderCard, folder);
        }

        // 添加文件夹拖拽事件监听器
        addFolderDropEventListeners(folderCard, folder) {
            // 拖拽进入
            folderCard.addEventListener('dragenter', (e) => {
                e.preventDefault();
                e.stopPropagation();
                folderCard.classList.add('drag-over');
            });

            // 拖拽悬停
            folderCard.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'move';
            });

            // 拖拽离开
            folderCard.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // 只有当鼠标真正离开文件夹卡片时才移除样式
                if (!folderCard.contains(e.relatedTarget)) {
                    folderCard.classList.remove('drag-over');
                }
            });

            // 拖拽放置
            folderCard.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                folderCard.classList.remove('drag-over');

                const fileId = e.dataTransfer.getData('text/plain');
                if (fileId && fileId.startsWith('file-')) {
                    const actualFileId = fileId.replace('file-', '');
                    await this.moveFileToFolder(actualFileId, folder.id, folder.name);
                }
            });
        }

        // 移动文件到文件夹
        async moveFileToFolder(fileId, folderId, folderName) {
            try {
                // 检查文件类型，决定调用哪个API
                const fileCard = document.querySelector(`[data-file-id="${fileId}"]`);
                const isUrlFile = fileCard && fileCard.getAttribute('data-type') === 'url';
                
                let result;
                if (isUrlFile) {
                    result = await this.uiManager.api.urlFiles.moveUrlFile(fileId, folderId);
                } else {
                    result = await this.uiManager.api.files.moveFile(fileId, folderId);
                }
                
                if (result.success) {
                    // 立即更新文件夹文件数量（在显示消息之前）
                    this.updateFolderFileCountImmediately(folderId, 1);
                    
                    // 显示成功消息
                    if (window.MessageBox && window.MessageBox.show) {
                        window.MessageBox.show({
                            message: `文件已成功移动到文件夹"${folderName}"`,
                            type: 'success',
                            duration: 3000
                        });
                    } else if (this.uiManager.showMessage) {
                        this.uiManager.showMessage(`文件已成功移动到文件夹"${folderName}"`, 'success');
                    }
                    
                    // 从当前文件列表中移除该文件
                    if (fileCard) {
                        fileCard.style.opacity = '0';
                        fileCard.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            fileCard.remove();
                        }, 300);
                    }
                    
                    // 更新文件计数
                    if (this.uiManager.updateFileCount) {
                        const currentFiles = document.querySelectorAll('.file-card:not(.hidden)');
                        this.uiManager.updateFileCount(currentFiles.length - 1);
                    }
                } else {
                    // 显示错误消息
                    if (window.MessageBox && window.MessageBox.show) {
                        window.MessageBox.show({
                            message: result.error || '文件移动失败',
                            type: 'error',
                            duration: 4000
                        });
                    } else if (this.uiManager.showMessage) {
                        this.uiManager.showMessage(result.error || '文件移动失败', 'error');
                    }
                }
            } catch (error) {
                console.error('移动文件失败:', error);
                if (window.MessageBox && window.MessageBox.show) {
                    window.MessageBox.show({
                        message: '文件移动失败',
                        type: 'error',
                        duration: 4000
                    });
                } else if (this.uiManager.showMessage) {
                    this.uiManager.showMessage('文件移动失败', 'error');
                }
            }
        }

        // 刷新文件夹文件数量
        async refreshFolderFileCount(folderId) {
            try {
                const folderCard = document.querySelector(`[data-folder-id="${folderId}"]`);
                if (folderCard) {
                    await this.updateFolderCardFileCount(folderCard, folderId);
                }
            } catch (error) {
                console.error('刷新文件夹文件数量失败:', error);
            }
        }

        // 立即更新文件夹文件数量（不等待API调用）
        updateFolderFileCountImmediately(folderId, increment = 1) {
            try {
                const folderCard = document.querySelector(`[data-folder-id="${folderId}"]`);
                if (folderCard) {
                    // 查找文件数量元素
                    let countElement = folderCard.querySelector('.file-count');
                    
                    if (countElement) {
                        const currentText = countElement.textContent;
                        const currentCount = parseInt(currentText.match(/\d+/)[0]) || 0;
                        const newCount = Math.max(0, currentCount + increment);
                        
                        // 根据元素类型设置不同的文本格式
                        if (countElement.classList.contains('text-cyan-400')) {
                            // 新格式：只显示数字
                            countElement.textContent = `${newCount}`;
                        } else {
                            // 旧格式：显示完整文本
                            countElement.textContent = `${newCount} 个文件`;
                        }
                    } else {
                        console.warn('未找到文件数量元素，文件夹ID:', folderId);
                    }
                }
            } catch (error) {
                console.error('立即更新文件夹文件数量失败:', error);
            }
        }

        // 显示文件夹内容
        async showFolderFiles(folderId, folderName) {
            try {
                // 设置当前文件夹ID
                this.uiManager.currentFolderId = folderId;
                
                // 获取文件夹中的文件（包括普通文件和URL文件）
                const [files, urlFiles] = await Promise.all([
                    this.uiManager.api.files.getFiles(folderId),
                    this.uiManager.api.urlFiles.getUrlFiles(folderId)
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
                const folders = await this.uiManager.api.folders.getFolders();
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
            // 获取现有的面包屑容器
            const breadcrumbContainer = document.getElementById('breadcrumb-container');
            if (!breadcrumbContainer) {
                return;
            }
            
            // 显示面包屑容器
            breadcrumbContainer.classList.remove('hidden');
            
            // 更新面包屑内容
            breadcrumbContainer.innerHTML = `
                <div class="flex items-center justify-between">
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
                </div>
            `;
            
            // 绑定返回按钮事件
            const backBtn = breadcrumbContainer.querySelector('.breadcrumb-back-btn');
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
                    this.uiManager.api.files.getFiles(),
                    this.uiManager.api.urlFiles.getUrlFiles()
                ]);
                this.uiManager.allFiles = [...files, ...urlFiles]; // 更新缓存
                
                // 清空外站文档内容
                const externalDocsEmptyState = document.querySelector('#files-grid .col-span-full');
                if (externalDocsEmptyState) {
                    externalDocsEmptyState.remove();
                }
                
                // 重新渲染文件列表（包括普通文件和URL文件）
                const allFiles = [...files, ...urlFiles];
                this.uiManager.renderFileList(allFiles);
                
                // 如果当前有分类过滤，重新应用过滤
                if (this.uiManager.currentCategory && this.uiManager.currentCategory !== 'all') {
                    this.uiManager.filterFiles(this.uiManager.currentCategory);
                }
                
                // 隐藏面包屑导航
                this.hideBreadcrumb();
                
                // 启用分类按钮
                this.enableCategoryButtons();
                
                // 根据当前分类决定是否显示文件夹区域
                if (this.uiManager.currentCategory && this.uiManager.currentCategory !== 'all') {
                    this.showFolderSection();
                    // 重新渲染文件夹列表
                    const folders = await this.uiManager.api.folders.getFolders();
                    await this.renderFolderList(folders);
                } else {
                    // 全部文件分类时隐藏文件夹区域
                    this.hideFolderSection();
                }
                
                // 隐藏返回按钮
                this.hideBackButton();
                
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
                breadcrumbContainer.classList.add('hidden');
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

        // 更新文件夹名称
        async updateFolderName(folderId, newName) {
            try {
                // 检查是否存在同名文件夹（排除当前文件夹）
                const currentFolder = this.uiManager.folders.find(f => f.id === folderId);
                if (currentFolder) {
                    const existingFolders = this.uiManager.folders.filter(folder => 
                        folder.category === currentFolder.category && folder.id !== folderId
                    );
                    const duplicateFolder = existingFolders.find(folder => 
                        folder.name.toLowerCase() === newName.toLowerCase()
                    );
                    
                    if (duplicateFolder) {
                        if (this.uiManager.showMessage) {
                            this.uiManager.showMessage(`该分类下已存在名为"${newName}"的文件夹，请使用其他名称`, 'error');
                        }
                        return;
                    }
                }
                
                // 获取当前文件夹的分类信息
                const category = currentFolder ? currentFolder.category : null;
                
                const result = await this.uiManager.api.folders.updateFolder(folderId, newName, category);
                if (result.success) {
                    if (window.MessageBox && window.MessageBox.show) {
                        window.MessageBox.show({
                            message: '文件夹重命名成功',
                            type: 'success',
                            duration: 3000
                        });
                    } else if (this.uiManager.showMessage) {
                        this.uiManager.showMessage('文件夹重命名成功', 'success');
                    }
                    // 刷新文件夹列表
                    if (this.uiManager.refreshFolders) {
                        this.uiManager.refreshFolders();
                    }
                } else {
                    if (window.MessageBox && window.MessageBox.show) {
                        window.MessageBox.show({
                            message: result.error || '重命名失败',
                            type: 'error',
                            duration: 4000
                        });
                    } else if (this.uiManager.showMessage) {
                        this.uiManager.showMessage(result.error || '重命名失败', 'error');
                    }
                }
            } catch (error) {
                if (window.MessageBox && window.MessageBox.show) {
                    window.MessageBox.show({
                        message: '重命名失败',
                        type: 'error',
                        duration: 4000
                    });
                } else if (this.uiManager.showMessage) {
                    this.uiManager.showMessage('重命名失败', 'error');
                }
            }
        }

        // 编辑文件夹（保留原方法以兼容）
        async editFolder(folderId, currentName) {
            try {
                const newName = await this.showEditFolderDialog({ id: folderId, name: currentName });
                if (newName && newName !== currentName) {
                    await this.updateFolderName(folderId, newName);
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
                const result = await this.uiManager.api.folders.deleteFolder(folderId);
                if (result.success) {
                if (window.MessageBox && window.MessageBox.show) {
                    window.MessageBox.show({
                        message: '文件夹删除成功',
                        type: 'success',
                        duration: 3000
                    });
                } else if (this.uiManager.showMessage) {
                    this.uiManager.showMessage('文件夹删除成功', 'success');
                }
                // 刷新文件夹列表
                if (this.uiManager.refreshFolders) {
                    this.uiManager.refreshFolders();
                    }
                } else {
                    if (window.MessageBox && window.MessageBox.show) {
                        window.MessageBox.show({
                            message: result.error || '删除失败',
                            type: 'error',
                            duration: 4000
                        });
                    } else if (this.uiManager.showMessage) {
                        this.uiManager.showMessage(result.error || '删除失败', 'error');
                    }
                }
            } catch (error) {
                if (window.MessageBox && window.MessageBox.show) {
                    window.MessageBox.show({
                        message: '删除失败',
                        type: 'error',
                        duration: 4000
                    });
                } else if (this.uiManager.showMessage) {
                    this.uiManager.showMessage('删除失败', 'error');
                }
            }
        }

        // 显示编辑文件夹对话框
        showEditFolderDialog(folder) {
            const promise = this.uiManager.modalManager.showInputDialog('重命名分组', [
                {
                    id: 'folder-name-input',
                    label: '分组名称',
                    type: 'text',
                    placeholder: '请输入分组名称',
                    value: folder.name,
                    required: true,
                    maxlength: 20
                }
            ], {
                width: 320,
                confirmText: '确认',
                cancelText: '取消'
            });
            
            return promise.then(result => {
                if (result && result['folder-name-input']) {
                    return result['folder-name-input'].trim();
                }
                return null;
            }).catch(error => {
                console.error('showInputDialog错误:', error);
                throw error;
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
}

// 暴露到全局作用域
window.UIFolderManager = UIFolderManager; 