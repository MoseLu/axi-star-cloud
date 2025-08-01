/**
 * 文件渲染模块
 * 处理文件列表渲染、文件卡片创建、缩略图生成等功能
 */
class UIFileRenderer {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.layoutMode = 'card'; // 默认卡片模式
        this.sortMode = 'name'; // 默认按文件名排序
        // 延迟绑定事件，确保DOM已加载
        setTimeout(() => {
            this.bindLayoutSwitchEvent();
            this.bindSortSwitchEvent();
        }, 500);
    }

    bindLayoutSwitchEvent() {
        // 延迟绑定，确保DOM已加载
        setTimeout(() => {
            const btn = document.getElementById('layout-switch-btn');
            if (btn) {
                // 确保按钮可以被点击
                btn.style.pointerEvents = 'auto';
                btn.disabled = false;
                
                // 移除可能存在的旧事件监听器
                btn.removeEventListener('click', this.layoutClickHandler);
                
                // 创建新的事件处理函数
                this.layoutClickHandler = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleLayoutMode();
                }.bind(this);
                
                // 绑定新的事件监听器
                btn.addEventListener('click', this.layoutClickHandler);
            }
        }, 100);
    }

    bindSortSwitchEvent() {
        // 延迟绑定，确保DOM已加载
        setTimeout(() => {
            const btn = document.getElementById('sort-switch-btn');
            if (btn) {
                // 确保按钮可以被点击
                btn.style.pointerEvents = 'auto';
                btn.disabled = false;
                
                // 移除可能存在的旧事件监听器
                btn.removeEventListener('click', this.sortClickHandler);
                
                // 创建新的事件处理函数
                this.sortClickHandler = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleSortMode();
                }.bind(this);
                
                // 绑定新的事件监听器
                btn.addEventListener('click', this.sortClickHandler);
            }
        }, 100);
    }

    init() {
        // 初始化文件渲染器
        // 可以在这里添加初始化逻辑
    }

    // 渲染文件列表
    renderFileList(files, layoutMode) {
        layoutMode = layoutMode || this.layoutMode || 'card';
        
        // 强制转换为数组
        files = Array.from(files);
        
        // 对文件进行排序
        files = this.sortFiles(files);
        
        // 缓存当前文件列表，便于图片预览切换
        if (this.uiManager) {
            this.uiManager.files = files;
        }
        
        const fileGrid = document.getElementById('files-grid');
        const emptyState = document.getElementById('empty-state');
        const uploadArea = document.getElementById('upload-area');
        
        // 检查必要的DOM元素是否存在
        if (!fileGrid) {
            return;
        }
        
        // 清空容器内容
        fileGrid.innerHTML = '';
        
        if (layoutMode === 'list') {
            // 列表模式 - 对所有文件类型都可用
            // 设置容器为列表布局样式，使用更具体的选择器覆盖CSS
            fileGrid.className = 'files-grid list-layout';
            fileGrid.style.cssText = `
                display: flex !important;
                flex-direction: column !important;
                width: 100% !important;
                gap: 8px !important;
                grid-template-columns: none !important;
                align-items: stretch !important;
                justify-items: stretch !important;
                justify-content: flex-start !important;
            `;
            
            // 根据当前分类过滤文件
            let filteredFiles = files;
            if (this.uiManager && this.uiManager.currentCategory && this.uiManager.currentCategory !== 'all') {
                if (this.uiManager.currentCategory === 'document') {
                    // 文档分类包含多个子类型
                    filteredFiles = files.filter(file => ['document', 'word', 'excel', 'powerpoint', 'pdf'].includes(file.type));
                } else {
                    filteredFiles = files.filter(file => file.type === this.uiManager.currentCategory);
                }
            }
            
            // 更新文件计数
            if (this.uiManager && this.uiManager.updateFileCount) {
                this.uiManager.updateFileCount(filteredFiles.length, files.length);
            }
            
            // 处理空状态 - 外站文档分类由docs-sync模块处理
            if (this.uiManager && this.uiManager.toggleEmptyState && this.uiManager.currentCategory !== 'external-docs') {
                this.uiManager.toggleEmptyState(filteredFiles.length);
            }
            
            fileGrid.appendChild(this.renderFileListTable(filteredFiles));
            
            // 如果过滤后没有文件，显示空状态
            if (filteredFiles.length === 0) {
                const emptyState = document.getElementById('empty-state');
                if (emptyState) {
                    emptyState.classList.remove('hidden');
                }
                if (fileGrid) {
                    fileGrid.classList.add('hidden');
                }
            } else {
                // 有文件时显示文件网格，隐藏空状态
                if (fileGrid) {
                    fileGrid.classList.remove('hidden');
                }
                const emptyState = document.getElementById('empty-state');
                if (emptyState) {
                    emptyState.classList.add('hidden');
                }
            }
        } else {
            // 卡片模式
            // 恢复卡片布局样式
            fileGrid.className = 'files-grid';
            fileGrid.style.cssText = '';
            
            // 根据当前分类过滤文件
            let filteredFiles = files;
            if (this.uiManager && this.uiManager.currentCategory && this.uiManager.currentCategory !== 'all') {
                if (this.uiManager.currentCategory === 'document') {
                    // 文档分类包含多个子类型
                    filteredFiles = files.filter(file => ['document', 'word', 'excel', 'powerpoint', 'pdf'].includes(file.type));
                } else {
                    filteredFiles = files.filter(file => file.type === this.uiManager.currentCategory);
                }
            }
            
            // 渲染卡片
            for (let i = 0; i < filteredFiles.length; i++) {
                const file = filteredFiles[i];
                const fileCard = this.createFileCard(file);
                if (fileCard) fileGrid.appendChild(fileCard);
            }
            
            // 更新文件计数
            if (this.uiManager && this.uiManager.updateFileCount) {
                this.uiManager.updateFileCount(filteredFiles.length, files.length);
            }
            
            // 处理空状态 - 外站文档分类由docs-sync模块处理
            if (this.uiManager && this.uiManager.toggleEmptyState && this.uiManager.currentCategory !== 'external-docs') {
                this.uiManager.toggleEmptyState(filteredFiles.length);
            }
            
            // 如果过滤后没有文件，显示空状态
            if (filteredFiles.length === 0) {
                const emptyState = document.getElementById('empty-state');
                if (emptyState) {
                    emptyState.classList.remove('hidden');
                }
                if (fileGrid) {
                    fileGrid.classList.add('hidden');
                }
            } else {
                // 有文件时显示文件网格，隐藏空状态
                if (fileGrid) {
                    fileGrid.classList.remove('hidden');
                }
                const emptyState = document.getElementById('empty-state');
                if (emptyState) {
                    emptyState.classList.add('hidden');
                }
            }
        }
        
        // 更新文件数量显示 - 使用过滤后的文件数量
        if (layoutMode === 'list') {
            // 列表模式：使用过滤后的文件数量
            let filteredFiles = files;
            if (this.uiManager && this.uiManager.currentCategory && this.uiManager.currentCategory !== 'all') {
                if (this.uiManager.currentCategory === 'document') {
                    filteredFiles = files.filter(file => ['document', 'word', 'excel', 'powerpoint', 'pdf'].includes(file.type));
                } else {
                    filteredFiles = files.filter(file => file.type === this.uiManager.currentCategory);
                }
            }
            this.updateFileCount(filteredFiles.length);
        } else {
            // 卡片模式：使用过滤后的文件数量
            let filteredFiles = files;
            if (this.uiManager && this.uiManager.currentCategory && this.uiManager.currentCategory !== 'all') {
                if (this.uiManager.currentCategory === 'document') {
                    filteredFiles = files.filter(file => ['document', 'word', 'excel', 'powerpoint', 'pdf'].includes(file.type));
                } else {
                    filteredFiles = files.filter(file => file.type === this.uiManager.currentCategory);
                }
            }
            this.updateFileCount(filteredFiles.length);
        }
    }

    // 渲染文件列表模式（类似Windows资源管理器的列表视图）
    renderFileListTable(files) {
        const container = document.createElement('div');
        container.className = 'w-full space-y-1';
        container.style.cssText = `
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
        `;
        
        files.forEach(file => {
            const fileRow = document.createElement('div');
            fileRow.className = 'flex items-center px-4 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300 cursor-pointer group rounded-xl border border-purple-400/30 shadow-lg backdrop-blur-sm';
            fileRow.setAttribute('data-file-id', file.id);
            
            // 文件图标/缩略图（小尺寸）
            const iconCell = document.createElement('div');
            iconCell.className = 'w-12 h-10 mr-4 flex-shrink-0 flex items-center justify-center';
            
            if (file.type === 'image') {
                // 图片显示小缩略图
                let imgUrl;
                if (file.thumbnailUrl) {
                    imgUrl = file.thumbnailUrl;
                } else if (file.previewUrl) {
                    imgUrl = file.previewUrl;
                } else {
                    // 使用API网关构建正确的URL
                    if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                        imgUrl = window.apiGateway.buildUrl('/uploads/image/' + encodeURIComponent(file.name));
                    } else if (window.APP_UTILS && typeof window.APP_UTILS.buildResourceUrl === 'function') {
                        imgUrl = window.APP_UTILS.buildResourceUrl('/uploads/image/' + encodeURIComponent(file.name));
                    } else {
                        imgUrl = '/uploads/image/' + encodeURIComponent(file.name);
                    }
                }
                
                iconCell.innerHTML = `
                    <img src="${imgUrl}" 
                         alt="${file.name}" 
                         class="w-10 h-10 object-cover rounded-lg shadow" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <i class="fa fa-image text-purple-300 text-lg" style="display:none;"></i>
                `;
            } else if (file.type === 'video') {
                // 视频文件显示缩略图
                let thumbnail = null;
                let hasThumbnail = false;
                
                // 首先检查后端返回的缩略图数据
                if (file.thumbnail_data) {
                    thumbnail = file.thumbnail_data;
                    hasThumbnail = true;
                } else if (file.hasVideoThumbnail && file.thumbnail) {
                    // 检查文件数据中是否有缩略图（当前会话）
                    thumbnail = file.thumbnail;
                    hasThumbnail = true;
                } else {
                    // 从localStorage中查找缩略图
                    const thumbnailKey = `video_thumbnail_${file.name}`;
                    const cachedThumbnail = localStorage.getItem(thumbnailKey);
                    if (cachedThumbnail) {
                        thumbnail = cachedThumbnail;
                        hasThumbnail = true;
                    }
                }
                
                if (hasThumbnail && thumbnail) {
                    // 使用上传时生成的缩略图
                    iconCell.innerHTML = `
                        <img src="${thumbnail}" 
                             alt="${file.name}" 
                             class="w-10 h-10 object-cover rounded-lg shadow" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <i class="fa fa-video-camera text-purple-300 text-lg" style="display:none;"></i>
                    `;
                } else {
                    // 使用默认视频图标
                    iconCell.innerHTML = `
                        <div class="w-10 h-10 rounded-lg border-2 border-purple-400/50 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shadow-lg">
                            <i class="fa fa-video-camera text-purple-300 text-lg"></i>
                        </div>
                    `;
                }
            } else {
                // 其他文件类型显示图标，添加高亮外边框保持与缩略图一致的大小
                const iconClass = this.getFileTypeIcon(file.type);
                iconCell.innerHTML = `
                    <div class="w-10 h-10 rounded-lg border-2 border-purple-400/50 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shadow-lg">
                        <i class="${iconClass} text-purple-300 text-lg"></i>
                    </div>
                `;
            }
            
            // 文件名 - 列表模式显示更多字符
            const nameCell = document.createElement('div');
            nameCell.className = 'w-64 flex-shrink-0 mr-6';
            nameCell.innerHTML = `
                <div class="text-purple-200 font-medium truncate group-hover:underline text-sm" title="${file.name}">
                    ${this.getListFileName(file.name)}
                </div>
            `;
            
            // 文件类型
            const typeCell = document.createElement('div');
            typeCell.className = 'w-28 flex-shrink-0 mr-6';
            typeCell.innerHTML = `
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getCategoryBadgeBg(file.type)} ${this.getCategoryBadgeColor(file.type)}">
                    ${this.getCategoryLabel(file.type)}
                </span>
            `;
            
            // 文件大小
            const sizeCell = document.createElement('div');
            sizeCell.className = 'w-32 flex-shrink-0 mr-6';
            sizeCell.innerHTML = `
                <div class="flex items-center space-x-1">
                    <i class="fa ${file.type === 'url' ? 'fa-link' : 'fa-hdd-o'} text-blue-400 text-xs"></i>
                    <span class="text-blue-300 text-xs">${file.type === 'url' ? 'URL链接' : this.formatStorageSize(file.size)}</span>
                </div>
            `;
            
            // 上传时间
            const timeCell = document.createElement('div');
            timeCell.className = 'w-32 flex-shrink-0 mr-6';
            timeCell.innerHTML = `
                <div class="flex items-center space-x-1">
                    <i class="fa fa-calendar text-green-400 text-xs"></i>
                    <span class="text-xs" style="color: #86efac;">${file.date ? file.date.split(' ')[0] : ''}</span>
                </div>
            `;
            
            // 操作按钮
            const actionCell = document.createElement('div');
            actionCell.className = 'w-36 flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0';
            actionCell.innerHTML = `
                <button class="file-preview-btn text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10" title="预览">
                    <i class="fa fa-eye text-sm"></i>
                </button>
                <button class="file-download-btn text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/10" title="下载">
                    <i class="fa fa-download text-sm"></i>
                </button>
                <button class="file-delete-btn text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="删除">
                    <i class="fa fa-trash text-sm"></i>
                </button>
            `;
            
            // 组装行
            fileRow.appendChild(iconCell);
            fileRow.appendChild(nameCell);
            fileRow.appendChild(typeCell);
            fileRow.appendChild(sizeCell);
            fileRow.appendChild(timeCell);
            fileRow.appendChild(actionCell);
            
            // 行点击预览
            fileRow.addEventListener('click', (e) => {
                // 避免点击操作按钮时触发预览
                if (e.target.closest('button')) return;
                if (this.uiManager && this.uiManager.showFilePreview) {
                    this.uiManager.showFilePreview(file);
                }
            });
            
            // 绑定操作按钮事件
            const previewBtn = fileRow.querySelector('.file-preview-btn');
            const downloadBtn = fileRow.querySelector('.file-download-btn');
            const deleteBtn = fileRow.querySelector('.file-delete-btn');
            
            if (previewBtn) {
                previewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.uiManager && this.uiManager.showFilePreview) {
                        this.uiManager.showFilePreview(file);
                    }
                });
            }
            
            if (downloadBtn) {
                downloadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.uiManager && this.uiManager.downloadFile) {
                        this.uiManager.downloadFile(file);
                    }
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.uiManager && this.uiManager.deleteFile) {
                        this.uiManager.deleteFile(file);
                    }
                });
            }
            
            container.appendChild(fileRow);
        });
        
        return container;
    }

    // 创建文件卡片
    createFileCard(file) {
        try {
            const fileCard = document.createElement('div');
            fileCard.className = 'rounded-xl p-2 transition-all duration-300 cursor-pointer group file-card relative hover:shadow-lg hover:shadow-purple-500/10 min-h-[140px] w-full max-w-[200px]';
            fileCard.setAttribute('data-type', file.type);
            fileCard.setAttribute('data-file-id', file.id);
            fileCard.setAttribute('draggable', 'true');

            // 格式化日期为 yyyy-mm-dd 格式
            const date = new Date(file.date || file.created_at || Date.now());
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            // 获取文件大小 - URL文件不显示大小
            const fileSize = file.type === 'url' ? 'URL链接' : (file.size ? this.formatStorageSize(file.size) : '0 B');

            // 生成缩略图或图标
            const thumbnailContent = this.generateThumbnailContent(file);

            // 检查文件是否在文件夹中，并获取文件夹名称
            let folderIndicator = '';
            if (file.folder_id) {
                // 从缓存的文件夹列表中查找文件夹名称
                const folder = this.uiManager.folders ? this.uiManager.folders.find(f => f.id === file.folder_id) : null;
                const folderName = folder ? folder.name : '文件夹';
                
                // 检查当前是否在文件夹内部
                const currentFolderId = this.uiManager ? this.uiManager.currentFolderId : null;
                const isInFolder = currentFolderId === file.folder_id;
                
                // 根据是否在文件夹内部决定图标颜色和提示文本
                // 使用更浅的蓝色背景以在暗色模式下更清晰可见
                const bgColor = isInFolder ? 'from-red-400 to-red-500' : 'from-blue-400 to-blue-500';
                const borderColor = isInFolder ? 'border-red-300/40' : 'border-blue-300/40';
                const tooltipText = isInFolder ? 
                    `点击移出文件夹：${folderName}` : 
                    `点击查看文件夹：${folderName}`;
                
                folderIndicator = `
                    <div class="absolute top-2 right-2 bg-gradient-to-r ${bgColor} text-white text-xs px-1.5 py-1 rounded-full z-10 shadow-lg border ${borderColor} cursor-pointer" 
                         data-folder-id="${file.folder_id}" 
                         title="${tooltipText}">
                        <i class="fa fa-folder text-xs"></i>
                    </div>
                `;
            }

            fileCard.innerHTML = `
                ${folderIndicator}
                <div class="card-content flex flex-col h-full">
                    <!-- 第一排：缩略图/图标和文件名 -->
                    <div class="file-icon-container flex flex-col items-center justify-center mb-2">
                        <div class="w-12 h-12 bg-gradient-to-br ${thumbnailContent.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0 overflow-hidden mb-2 border border-purple-400/30">
                            ${thumbnailContent.html}
                        </div>
                        <div class="text-center w-full">
                            <div class="flex items-center justify-center gap-1">
                                <h4 class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 text-xs leading-tight truncate max-w-[100px]" title="${file.name}">${this.truncateFileName(file.name)}</h4>
                                <span class="text-xs px-1.5 py-0.5 rounded-full ${this.getCategoryBadgeColor(file.type)} ${this.getCategoryBadgeBg(file.type)} font-medium flex-shrink-0">
                                    ${this.getCategoryLabel(file.type)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 针对外站文档增加额外间距 -->
                    ${file.type === 'external-docs' ? '<div style="height:8px;"></div>' : ''}
                    
                    <!-- 第二排：文件大小 -->
                    <div class="file-size-info flex items-center justify-center mb-1 text-xs h-5">
                        <div class="flex items-center space-x-1 flex-shrink-0">
                            <i class="fa ${file.type === 'url' ? 'fa-link' : 'fa-hdd-o'} text-blue-400 flex-shrink-0 text-xs"></i>
                            <span class="font-medium text-blue-400" title="${fileSize}">${fileSize}</span>
                        </div>
                    </div>
                    
                    <!-- 第三排：文件创建日期 -->
                    <div class="file-date-info flex items-center justify-center mb-2 text-xs h-5">
                        <div class="flex items-center space-x-1 flex-shrink-0">
                            <i class="fa fa-calendar flex-shrink-0 text-xs" style="color: #86efac;"></i>
                            <span class="font-medium" style="color: #86efac;" title="${formattedDate}">${formattedDate}</span>
                        </div>
                    </div>
                    
                    <!-- 第三排：操作按钮 -->
                    <div class="file-actions flex items-center justify-center mt-auto space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button class="file-preview-btn text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10" title="预览">
                            <i class="fa fa-eye text-sm"></i>
                        </button>
                        ${file.type === 'url' ? 
                            `<button class="file-copy-btn text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/10" title="复制链接">
                                <i class="fa fa-copy text-sm"></i>
                            </button>` : 
                            `<button class="file-download-btn text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/10" title="下载">
                                <i class="fa fa-download text-sm"></i>
                            </button>`
                        }
                        <button class="file-delete-btn text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="删除">
                            <i class="fa fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
            `;

            // 添加事件监听器
            this.addFileCardEventListeners(fileCard, file);

            return fileCard;
        } catch (err) {
            return null;
        }
    }

    // 生成缩略图内容
    generateThumbnailContent(file) {
        // 根据文件类型设置图标和颜色
        let iconClass, iconColor, bgColor;
        
        switch (file.type) {
            case 'image':
                iconClass = 'fa-file-image-o';
                iconColor = 'text-emerald-400';
                bgColor = 'from-emerald-500/20 to-teal-500/20';
                break;
            case 'video':
                iconClass = 'fa-file-video-o';
                iconColor = 'text-pink-400';
                bgColor = 'from-pink-500/20 to-rose-500/20';
                break;
            case 'audio':
                iconClass = 'fa-file-audio-o';
                iconColor = 'text-cyan-400';
                bgColor = 'from-cyan-500/20 to-blue-500/20';
                break;
            case 'document':
                iconClass = 'fa-file-text-o';
                iconColor = 'text-orange-400';
                bgColor = 'from-orange-500/20 to-amber-500/20';
                break;
            case 'pdf':
                iconClass = 'fa-file-pdf-o';
                iconColor = 'text-red-400';
                bgColor = 'from-red-500/20 to-pink-500/20';
                break;
            case 'word':
                iconClass = 'fa-file-word-o';
                iconColor = 'text-blue-500';
                bgColor = 'from-blue-500/20 to-indigo-500/20';
                break;
            case 'excel':
                iconClass = 'fa-file-excel-o';
                iconColor = 'text-green-500';
                bgColor = 'from-green-500/20 to-emerald-500/20';
                break;
            case 'powerpoint':
                iconClass = 'fa-file-powerpoint-o';
                iconColor = 'text-orange-500';
                bgColor = 'from-orange-500/20 to-red-500/20';
                break;
            case 'url':
                iconClass = 'fa-link';
                iconColor = 'text-blue-400';
                bgColor = 'from-blue-500/20 to-indigo-500/20';
                break;
            default:
                iconClass = 'fa-file-o';
                iconColor = 'text-slate-400';
                bgColor = 'from-slate-500/20 to-gray-500/20';
        }

        // 对于视频文件，优先使用上传时生成的缩略图
        if (file.type === 'video') {
            let thumbnail = null;
            let hasThumbnail = false;
            
            // 首先检查后端返回的缩略图数据
            if (file.thumbnail_data) {
                thumbnail = file.thumbnail_data;
                hasThumbnail = true;
            } else if (file.hasVideoThumbnail && file.thumbnail) {
                // 检查文件数据中是否有缩略图（当前会话）
                thumbnail = file.thumbnail;
                hasThumbnail = true;
            } else {
                // 从localStorage中查找缩略图
                const thumbnailKey = `video_thumbnail_${file.name}`;
                const cachedThumbnail = localStorage.getItem(thumbnailKey);
                if (cachedThumbnail) {
                    thumbnail = cachedThumbnail;
                    hasThumbnail = true;
                }
            }
            
            if (hasThumbnail && thumbnail) {
                return {
                    html: `<div class="relative w-full h-full">
                             <img src="${thumbnail}" alt="${file.name}" class="w-full h-full object-cover rounded-xl" 
                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                             <i class="fa ${iconClass} text-4xl ${iconColor} absolute inset-0 flex items-center justify-center bg-gradient-to-br ${bgColor} rounded-xl" 
                                style="display: none;"></i>
                           </div>`,
                    bgColor: bgColor
                };
            }
        }

        // 对于图片和视频文件，尝试显示缩略图
        if (file.type === 'image' || file.type === 'video') {
            const thumbnailUrl = this.getThumbnailUrl(file);
    
            if (thumbnailUrl) {
                return {
                    html: `<div class="relative w-full h-full">
                             <img src="${thumbnailUrl}" alt="${file.name}" class="w-full h-full object-cover rounded-xl" 
                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                             <i class="fa ${iconClass} text-4xl ${iconColor} absolute inset-0 flex items-center justify-center bg-gradient-to-br ${bgColor} rounded-xl" 
                                style="display: none;"></i>
                           </div>`,
                    bgColor: bgColor
                };
            } else {
                // 缩略图加载失败，使用默认图标
            }
        }

        // 默认显示图标
        return {
            html: `<i class="fa ${iconClass} text-3xl ${iconColor}"></i>`,
            bgColor: bgColor
        };
    }

    // 获取缩略图URL
    getThumbnailUrl(file) {
        // 使用默认的静态文件列表
        const staticImages = ['docs.png'];
        
        if (file && file.name && staticImages.includes(file.name)) {
            return `/static/public/${file.name}`;
        }
        
        // 用户上传图片 - 添加错误处理
        if (file && file.name) {
            // 检查文件扩展名，如果是图片文件才返回路径
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            
            if (imageExtensions.includes(fileExtension)) {
                // 使用文件的实际路径，如果后端返回了路径的话
                if (file.previewUrl) {
                    return file.previewUrl;
                }
                // 使用API网关构建正确的URL
                if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                    return window.apiGateway.buildUrl('/uploads/image/' + encodeURIComponent(file.name));
                } else if (window.APP_UTILS && typeof window.APP_UTILS.buildResourceUrl === 'function') {
                    return window.APP_UTILS.buildResourceUrl('/uploads/image/' + encodeURIComponent(file.name));
                } else {
                    return '/uploads/image/' + encodeURIComponent(file.name);
                }
            } else {
                // 非图片文件使用默认图标
                return `/static/public/docs.png`;
            }
        }
        
        return null;
    }

    // 添加文件卡片事件监听器
    addFileCardEventListeners(fileCard, file) {
        // 预览按钮
        fileCard.querySelector('.file-preview-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.uiManager.showFilePreview) {
                this.uiManager.showFilePreview(file);
            }
        });

        // 下载按钮
        fileCard.querySelector('.file-download-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.uiManager.downloadFile) {
                this.uiManager.downloadFile(file);
            }
        });
        
        // 复制按钮（URL类型）
        fileCard.querySelector('.file-copy-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.uiManager.copyUrl) {
                this.uiManager.copyUrl(file);
            }
        });

        // 删除按钮
        fileCard.querySelector('.file-delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.uiManager && this.uiManager.deleteFile) {
                this.uiManager.deleteFile(file);
            }
        });

        // 文件夹图标点击事件
        const folderIcon = fileCard.querySelector('[data-folder-id]');
        if (folderIcon && file.folder_id) {
            folderIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                // 检查当前是否在文件夹内部
                const currentFolderId = this.uiManager ? this.uiManager.currentFolderId : null;
                
                if (currentFolderId === file.folder_id) {
                    // 在文件夹内部点击红色图标 → 将文件从文件夹中移除
                    if (this.uiManager && this.uiManager.api) {
                        try {
                            // 检查文件类型，决定调用哪个API
                            const isUrlFile = file.type === 'url';
                            let result;
                            
                            if (isUrlFile) {
                                result = await this.uiManager.api.urlFiles.moveUrlFile(file.id, null);
                            } else {
                                result = await this.uiManager.api.files.moveFile(file.id, null);
                            }
                            
                            if (result.success) {
                                // 显示成功消息
                                if (window.MessageBox && window.MessageBox.show) {
                                    window.MessageBox.show({
                                        message: '文件已从文件夹中移除',
                                        type: 'success',
                                        duration: 3000
                                    });
                                }
                                
                                // 立即从当前文件夹列表中移除文件卡片（带动画）
                                const fileCard = document.querySelector(`[data-file-id="${file.id}"]`);
                                if (fileCard) {
                                    fileCard.style.opacity = '0';
                                    fileCard.style.transform = 'scale(0.8)';
                                    setTimeout(() => { fileCard.remove(); }, 300);
                                }
                                
                                // 立即更新文件夹文件计数
                                if (this.uiManager.folderManager && this.uiManager.folderManager.updateFolderFileCountImmediately) {
                                    this.uiManager.folderManager.updateFolderFileCountImmediately(currentFolderId, -1);
                                }
                                
                                // 更新面包屑中的文件计数
                                if (this.uiManager.folderManager && this.uiManager.folderManager.updateFolderFileCount) {
                                    const currentFiles = document.querySelectorAll('.file-card:not(.hidden)');
                                    this.uiManager.folderManager.updateFolderFileCount(currentFiles.length - 1);
                                }
                                
                                // 更新全局文件计数
                                if (this.uiManager.updateFileCount) {
                                    const currentFiles = document.querySelectorAll('.file-card:not(.hidden)');
                                    this.uiManager.updateFileCount(currentFiles.length - 1);
                                }
                            } else {
                                if (window.MessageBox && window.MessageBox.show) {
                                    window.MessageBox.show({
                                        message: result.error || '移除文件失败',
                                        type: 'error',
                                        duration: 4000
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('移除文件失败:', error);
                            if (window.MessageBox && window.MessageBox.show) {
                                window.MessageBox.show({
                                    message: '移除文件失败',
                                    type: 'error',
                                    duration: 4000
                                });
                            }
                        }
                    }
                } else {
                    // 在文件夹外部点击蓝色图标 → 进入文件夹
                    if (this.uiManager && this.uiManager.showFolderFromFile) {
                        await this.uiManager.showFolderFromFile(file.folder_id);
                    }
                }
            });
        }

        // 添加拖拽事件监听器
        this.addFileDragEventListeners(fileCard, file);
    }

    // 添加文件拖拽事件监听器
    addFileDragEventListeners(fileCard, file) {
        // 开始拖拽
        fileCard.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', `file-${file.id}`);
            e.dataTransfer.effectAllowed = 'move';
            
            // 添加拖拽时的视觉反馈
            fileCard.style.opacity = '0.5';
        });

        // 结束拖拽
        fileCard.addEventListener('dragend', (e) => {
            fileCard.style.opacity = '';
        });
    }

    // 更新文件计数
    updateFileCount(count) {
        // 调用UIManager的updateFileCount方法，只显示当前文件数量
        if (this.uiManager && this.uiManager.updateFileCount) {
            this.uiManager.updateFileCount(count);
        } else {
            // 回退到简单更新
            const countElement = document.getElementById('file-count');
            if (countElement) {
                countElement.textContent = count;
            }
        }
    }

    // 切换空状态显示
    toggleEmptyState(visibleCount = null) {
        const fileGrid = document.getElementById('files-grid');
        const emptyState = document.getElementById('empty-state');
        const uploadArea = document.getElementById('upload-area');

        if (!fileGrid || !emptyState) {
            return;
        }

        // 如果没有传入visibleCount，则计算当前可见文件数量
        if (visibleCount === null) {
            const visibleFiles = fileGrid.querySelectorAll('.file-card:not(.hidden)');
            visibleCount = visibleFiles.length;
        }

        if (visibleCount === 0) {
            // 没有可见文件，显示空状态，隐藏文件网格和上传区域
            fileGrid.style.opacity = '0';
            setTimeout(() => {
                fileGrid.classList.add('hidden');
                fileGrid.style.opacity = '';
            }, 200);
            
            // 外站文档分类特殊处理：外站文档的空状态由docs-sync模块处理，这里只隐藏默认空状态
            if (this.uiManager.currentCategory === 'external-docs') {
                // 隐藏默认空状态，外站文档的空状态由docs-sync模块处理
                emptyState.classList.add('hidden');
                return;
            }
            
            // URL类型特殊处理：只更新提示文本
            if (this.uiManager.currentCategory === 'url') {
    
                
                // 更新图标
                const emptyStateIcon = emptyState.querySelector('.fa');
                if (emptyStateIcon) {
                    emptyStateIcon.className = 'fa fa-link text-2xl md:text-4xl text-purple-light/70';
                }
                
                // 更新标题
                const emptyStateTitle = emptyState.querySelector('h2');
                if (emptyStateTitle) {
                    emptyStateTitle.textContent = '暂无链接';
                }
                
                // 更新描述文本
                const emptyStateText = emptyState.querySelector('p');
                if (emptyStateText) {
                    emptyStateText.textContent = '还没有添加任何链接，点击上方按钮添加第一个链接';
                }
            } else {
    
                
                // 恢复默认图标
                const emptyStateIcon = emptyState.querySelector('.fa');
                if (emptyStateIcon) {
                    emptyStateIcon.className = 'fa fa-folder-open-o text-2xl md:text-4xl text-purple-light/70';
                }
                
                // 恢复默认标题
                const emptyStateTitle = emptyState.querySelector('h2');
                if (emptyStateTitle) {
                    emptyStateTitle.textContent = '暂无文件';
                }
                
                // 恢复默认描述文本
                const emptyStateText = emptyState.querySelector('p');
                if (emptyStateText) {
                    emptyStateText.textContent = '你的云盘是空的。点击上传按钮添加文件，或拖放文件到此处。';
                }
            }
            
            // 显示空状态，隐藏上传区域
            emptyState.classList.remove('hidden');
            if (uploadArea) {
                uploadArea.classList.add('hidden');
            }
        } else {
            // 有可见文件，隐藏空状态，显示文件网格
            emptyState.classList.add('hidden');
            fileGrid.classList.remove('hidden');
            fileGrid.style.opacity = '1';
        }
    }

    // 工具方法：获取分类标签颜色
    getCategoryBadgeColor(category) {
        const colors = {
            'image': 'text-emerald-400',
            'video': 'text-pink-400',
            'audio': 'text-cyan-400',
            'document': 'text-orange-400',
            'pdf': 'text-red-400',
            'word': 'text-blue-400',
            'excel': 'text-green-400',
            'powerpoint': 'text-orange-400',
            'url': 'text-blue-400',
            'other': 'text-slate-400'
        };
        return colors[category] || 'text-slate-400';
    }

    // 工具方法：获取分类标签背景
    getCategoryBadgeBg(category) {
        const backgrounds = {
            'image': 'bg-emerald-400/10',
            'video': 'bg-pink-400/10',
            'audio': 'bg-cyan-400/10',
            'document': 'bg-orange-400/10',
            'pdf': 'bg-red-400/10',
            'word': 'bg-blue-400/10',
            'excel': 'bg-green-400/10',
            'powerpoint': 'bg-orange-400/10',
            'url': 'bg-blue-400/10',
            'other': 'bg-slate-400/10'
        };
        return backgrounds[category] || 'bg-slate-400/10';
    }

    // 工具方法：获取分类标签文本
    getCategoryLabel(category) {
        const labels = {
            'image': '图片',
            'video': '视频',
            'audio': '音频',
            'document': '文档',
            'pdf': 'PDF',
            'word': 'Word',
            'excel': 'Excel',
            'powerpoint': 'PPT',
            'url': 'URL',
            'other': '其他'
        };
        return labels[category] || '其他';
    }

    // 截断文件名显示
    truncateFileName(fileName) {
        // 分离文件名和扩展名
        const lastDotIndex = fileName.lastIndexOf('.');
        let name = fileName;
        let extension = '';
        
        if (lastDotIndex !== -1) {
            name = fileName.substring(0, lastDotIndex);
            extension = fileName.substring(lastDotIndex);
        }
        
        // 检查是否为中文文件名
        const isChinese = /[\u4e00-\u9fff]/.test(name);
        
        let maxLength;
        if (isChinese) {
            // 中文文件名最多显示6个字符
            maxLength = 6;
        } else {
            // 英文文件名最多显示8个字符
            maxLength = 8;
        }
        
        // 如果文件名超过限制，截断并添加省略号
        if (name.length > maxLength) {
            name = name.substring(0, maxLength) + '...';
        }
        
        return name + extension;
    }

    // 格式化存储大小
    formatStorageSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 处理图片错误
    handleImageError(imgElement, fallbackSrc = '/static/public/docs.png') {
        imgElement.onerror = function() {
            this.src = fallbackSrc;
        };
    }

    toggleLayoutMode() {
        this.layoutMode = this.layoutMode === 'card' ? 'list' : 'card';
        
        // 切换按钮图标
        const btn = document.getElementById('layout-switch-btn');
        if (btn) {
            const iconCard = btn.querySelector('.fa-th-large');
            const iconList = btn.querySelector('.fa-list');
            if (iconCard && iconList) {
                if (this.layoutMode === 'card') {
                    iconCard.classList.remove('hidden');
                    iconList.classList.add('hidden');
                } else {
                    iconCard.classList.add('hidden');
                    iconList.classList.remove('hidden');
                }
            }
        }
        
        // 重新渲染文件列表 - 外站文档分类由docs-sync模块处理
        if (this.uiManager && this.uiManager.allFiles && this.uiManager.currentCategory !== 'external-docs') {
            // 强制清空容器并重新渲染
            const fileGrid = document.getElementById('files-grid');
            if (fileGrid) {
                fileGrid.innerHTML = '';
            }
            this.renderFileList(this.uiManager.allFiles, this.layoutMode);
        }
    }

    // 获取文件类型图标
    getFileTypeIcon(fileType) {
        const iconMap = {
            'image': 'fa fa-image',
            'video': 'fa fa-video-camera',
            'audio': 'fa fa-music',
            'document': 'fa fa-file-text-o',
            'pdf': 'fa fa-file-pdf-o',
            'word': 'fa fa-file-word-o',
            'excel': 'fa fa-file-excel-o',
            'powerpoint': 'fa fa-file-powerpoint-o',
            'url': 'fa fa-link',
            'other': 'fa fa-file-o'
        };
        return iconMap[fileType] || 'fa fa-file-o';
    }

    // 获取列表模式下的文件名
    getListFileName(fileName) {
        const lastDotIndex = fileName.lastIndexOf('.');
        let name = fileName;
        let extension = '';
        
        if (lastDotIndex !== -1) {
            name = fileName.substring(0, lastDotIndex);
            extension = fileName.substring(lastDotIndex);
        }
        
        // 检查是否为中文文件名
        const isChinese = /[\u4e00-\u9fff]/.test(name);
        
        let maxLength;
        if (isChinese) {
            // 中文文件名最多显示20个字符（大幅增加）
            maxLength = 20;
        } else {
            // 英文文件名最多显示35个字符（大幅增加）
            maxLength = 35;
        }
        
        // 如果文件名超过限制，截断并添加省略号
        if (name.length > maxLength) {
            name = name.substring(0, maxLength) + '...';
        }
        
        return name + extension;
    }

    toggleSortMode() {
        // 切换排序模式：name -> time -> type -> name
        const sortModes = ['name', 'time', 'type'];
        const currentIndex = sortModes.indexOf(this.sortMode);
        const nextIndex = (currentIndex + 1) % sortModes.length;
        this.sortMode = sortModes[nextIndex];
        
        // 切换按钮图标
        const nameIcon = document.getElementById('sort-name-icon');
        const timeIcon = document.getElementById('sort-time-icon');
        const typeIcon = document.getElementById('sort-type-icon');
        
        if (nameIcon && timeIcon && typeIcon) {
            // 隐藏所有图标
            nameIcon.classList.add('hidden');
            timeIcon.classList.add('hidden');
            typeIcon.classList.add('hidden');
            
            // 显示当前排序模式的图标
            switch (this.sortMode) {
                case 'name':
                    nameIcon.classList.remove('hidden');
                    break;
                case 'time':
                    timeIcon.classList.remove('hidden');
                    break;
                case 'type':
                    typeIcon.classList.remove('hidden');
                    break;
            }
        }
        
        // 重新渲染文件列表 - 外站文档分类由docs-sync模块处理
        if (this.uiManager && this.uiManager.allFiles && this.uiManager.currentCategory !== 'external-docs') {
            // 强制清空容器并重新渲染
            const fileGrid = document.getElementById('files-grid');
            if (fileGrid) {
                fileGrid.innerHTML = '';
            }
            this.renderFileList(this.uiManager.allFiles, this.layoutMode);
        }
    }

    // 排序文件列表
    sortFiles(files) {
        if (!files || files.length === 0) return files;
        
        const sortedFiles = [...files];
        
        switch (this.sortMode) {
            case 'name':
                // 按文件名排序（支持自然排序，数字按数值排序）
                sortedFiles.sort((a, b) => {
                    const nameA = a.name || '';
                    const nameB = b.name || '';
                    return this.naturalCompare(nameA, nameB);
                });
                break;
                
            case 'time':
                // 按上传时间排序（最新的在前）
                sortedFiles.sort((a, b) => {
                    const timeA = new Date(a.created_at || a.upload_time || 0);
                    const timeB = new Date(b.created_at || b.upload_time || 0);
                    return timeB - timeA; // 降序，最新的在前
                });
                break;
                
            case 'type':
                // 按文件类型排序
                sortedFiles.sort((a, b) => {
                    const typeA = (a.type || '').toLowerCase();
                    const typeB = (b.type || '').toLowerCase();
                    return typeA.localeCompare(typeB);
                });
                break;
        }
        
        return sortedFiles;
    }

    // 自然排序比较函数（支持数字按数值排序）
    naturalCompare(a, b) {
        // 将字符串分割为数字和非数字部分
        const splitA = this.splitString(a);
        const splitB = this.splitString(b);
        
        const maxLength = Math.max(splitA.length, splitB.length);
        
        for (let i = 0; i < maxLength; i++) {
            const partA = splitA[i] || '';
            const partB = splitB[i] || '';
            
            // 如果两个部分都是数字，按数值比较
            if (this.isNumeric(partA) && this.isNumeric(partB)) {
                const numA = parseInt(partA, 10);
                const numB = parseInt(partB, 10);
                if (numA !== numB) {
                    return numA - numB;
                }
            } else {
                // 否则按字符串比较（忽略大小写）
                const compareResult = partA.toLowerCase().localeCompare(partB.toLowerCase());
                if (compareResult !== 0) {
                    return compareResult;
                }
            }
        }
        
        return 0;
    }

    // 将字符串分割为数字和非数字部分
    splitString(str) {
        const result = [];
        let current = '';
        let isDigit = false;
        
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const charIsDigit = /\d/.test(char);
            
            if (charIsDigit !== isDigit && current !== '') {
                result.push(current);
                current = '';
            }
            
            current += char;
            isDigit = charIsDigit;
        }
        
        if (current !== '') {
            result.push(current);
        }
        
        return result;
    }

    // 检查字符串是否为纯数字
    isNumeric(str) {
        return /^\d+$/.test(str);
    }
}

// 暴露到全局作用域
window.UIFileRenderer = UIFileRenderer; 