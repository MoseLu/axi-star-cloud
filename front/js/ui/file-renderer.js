/**
 * 文件渲染模块
 * 处理文件列表渲染、文件卡片创建、缩略图生成等功能
 */
class UIFileRenderer {
    constructor(uiManager) {
        this.uiManager = uiManager;
    }

    // 渲染文件列表
    renderFileList(files) {
        const fileGrid = document.getElementById('files-grid');
        const emptyState = document.getElementById('empty-state');
        const uploadArea = document.getElementById('upload-area');
        
        if (!fileGrid) {
            // 等待组件加载完成后再重试
            setTimeout(() => {
                this.renderFileList(files);
            }, 500);
            return;
        }

        fileGrid.innerHTML = '';

        if (files && files.length > 0) {
            files.forEach(file => {
                const fileCard = this.createFileCard(file);
                fileGrid.appendChild(fileCard);
            });
            
            // 显示文件网格，隐藏空状态和上传区域
            fileGrid.classList.remove('hidden');
            if (emptyState) {
                emptyState.classList.add('hidden');
            }
            if (uploadArea) {
                uploadArea.classList.add('hidden');
            }
        } else {
            // 隐藏文件网格，显示空状态，隐藏上传区域
            fileGrid.classList.add('hidden');
            if (emptyState) {
                emptyState.classList.remove('hidden');
            }
            if (uploadArea) {
                uploadArea.classList.add('hidden');
            }
        }

        // 更新文件数量显示
        this.updateFileCount(files.length);
    }

    // 创建文件卡片
    createFileCard(file) {
        const fileCard = document.createElement('div');
        fileCard.className = 'glass-effect rounded-xl p-2 border border-purple-light/20 hover:border-purple-light/40 transition-all duration-300 cursor-pointer group file-card relative hover:shadow-lg hover:shadow-purple-500/10 min-h-[140px] w-full max-w-[200px]';
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
            
            folderIndicator = `
                <div class="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-1.5 py-1 rounded-full z-10 shadow-lg border border-blue-400/30 cursor-pointer" 
                     data-folder-id="${file.folder_id}" 
                     title="点击查看文件夹：${folderName}">
                    <i class="fa fa-folder text-xs"></i>
                </div>
            `;
        }

        fileCard.innerHTML = `
            ${folderIndicator}
            <div class="card-content flex flex-col h-full">
                <!-- 第一排：缩略图/图标和文件名 -->
                <div class="file-icon-container flex flex-col items-center justify-center mb-2">
                    <div class="w-12 h-12 bg-gradient-to-br ${thumbnailContent.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0 overflow-hidden mb-2">
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
                
                <!-- 第二排：文件大小和日期（带图标） -->
                <div class="file-info flex items-center justify-center space-x-1 mb-2 text-xs text-gray-400">
                    <div class="flex items-center space-x-1 flex-shrink-0">
                        <i class="fa ${file.type === 'url' ? 'fa-link' : 'fa-hdd-o'} text-blue-400 flex-shrink-0 text-xs"></i>
                        <span class="bg-gray-800/50 px-1 py-0.5 rounded-full font-medium truncate max-w-[60px] text-blue-300" title="${fileSize}">${fileSize}</span>
                    </div>
                    <div class="flex items-center space-x-1 flex-shrink-0">
                        <i class="fa fa-calendar text-green-400 flex-shrink-0 text-xs"></i>
                        <span class="bg-gray-800/50 px-1 py-0.5 rounded-full font-medium text-green-300 truncate max-w-[50px]" title="${formattedDate}">${formattedDate}</span>
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
        const staticImages = ['cloud.png', 'docs.png', 'favicon.png', 'avatar.png'];
        
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
                // 否则使用默认的图片路径
                return `/uploads/image/${file.name}`;
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
            if (this.uiManager.deleteFile) {
                this.uiManager.deleteFile(file);
            }
        });

        // 文件夹图标点击事件
        const folderIcon = fileCard.querySelector('[data-folder-id]');
        if (folderIcon && file.folder_id) {
            folderIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (this.uiManager.showFolderFromFile) {
                    await this.uiManager.showFolderFromFile(file.folder_id);
                }
            });
        }
    }

    // 更新文件计数
    updateFileCount(count) {
        // 调用UIManager的updateFileCount方法，确保使用正确的格式
        if (this.uiManager && this.uiManager.updateFileCount) {
            this.uiManager.updateFileCount(count, this.uiManager.totalFileCount);
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
        
        // 如果不是外站文档分类，确保清理外站文档样式
        if (this.uiManager.currentCategory !== 'external-docs') {
            if (this.uiManager.cleanupExternalDocsStyles) {
                this.uiManager.cleanupExternalDocsStyles();
            }
        }

        const files = document.querySelectorAll('#files-grid > div:not(.hidden)');
        const count = visibleCount !== null ? visibleCount : files.length;

        if (count === 0) {
            // 没有可见文件，显示空状态，隐藏文件网格和上传区域
            fileGrid.style.transition = 'opacity 0.2s ease-in-out';
            fileGrid.style.opacity = '0';
            setTimeout(() => {
                fileGrid.classList.add('hidden');
                fileGrid.style.opacity = '';
            }, 200);
            
            // 外站文档分类特殊处理：不显示默认空状态
            if (this.uiManager.currentCategory === 'external-docs') {
                // 外站文档分类下，空状态由renderExternalDocs方法处理
                return;
            }
            
            // URL类型特殊处理：更新空状态按钮和提示
            if (this.uiManager.currentCategory === 'url') {
                const emptyUploadBtn = document.getElementById('empty-upload-btn');
                const emptyStateText = emptyState.querySelector('p');
                
                if (emptyUploadBtn) {
                    emptyUploadBtn.innerHTML = '<i class="fa fa-link mr-2"></i>添加链接';
                }
                
                if (emptyStateText) {
                    emptyStateText.textContent = '还没有添加任何链接，点击上方按钮添加第一个链接';
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
}

// 暴露到全局作用域
window.UIFileRenderer = UIFileRenderer; 