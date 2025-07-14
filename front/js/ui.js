// UI模块 - 处理界面渲染和交互
class UIManager {
    constructor() {
        this.api = new ApiManager();
        this.currentFolderId = null;
        this.folders = [];
        this.currentCategory = 'all'; // 新增：记录当前分类
        this.allFiles = []; // 缓存所有文件数据
        this.isLoading = false; // 防抖标志
        this.init();
    }

    init() {

        
        // 延迟设置事件监听器，确保DOM元素已加载
        setTimeout(async () => {
            this.setupEventListeners();
            this.setupLoginForm();
            
            // 初始化文件类型标签
            this.initializeFileTypeButtons();
            
            // 强制设置新建分组按钮初始状态
            this.forceUpdateCreateFolderButton();
            
            // 主动检测登录状态，确保刷新后文件列表加载
            if (window.authManager && window.authManager.isLoggedIn()) {
                this.onLoginSuccess(window.authManager.getCurrentUser());
            }
            
            // 初始化用户头像显示
            await this.initUserProfile();
            
    
        }, 100);
    }

    // 强制更新新建分组按钮状态
    forceUpdateCreateFolderButton() {
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        const folderSection = document.getElementById('folder-section');
        

        
        if (createFolderBtn && folderSection) {
            if (this.currentCategory && this.currentCategory !== 'all') {
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
            
    
        } else {
            // 未找到全部文件按钮
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 登录成功事件监听
        window.addEventListener('loginSuccess', (event) => {
            this.onLoginSuccess(event.detail);
        });

        // 上传按钮事件
        document.getElementById('upload-btn')?.addEventListener('click', () => {
            this.showUploadArea();
        });

        // 空状态上传按钮
        document.getElementById('empty-upload-btn')?.addEventListener('click', () => {
            this.showUploadArea();
        });

        // 关闭上传区域按钮
        document.getElementById('close-upload-btn')?.addEventListener('click', () => {
            this.hideUploadArea();
        });

        // 文件选择按钮
        document.getElementById('browse-btn')?.addEventListener('click', () => {
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.click();
            }
        });

        // 文件输入变化事件
        document.getElementById('file-input')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // 拖拽区域事件
        const dropArea = document.getElementById('drop-area');
        if (dropArea) {
            dropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropArea.classList.add('border-purple-light/60');
            });

            dropArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropArea.classList.remove('border-purple-light/60');
            });

            dropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                dropArea.classList.remove('border-purple-light/60');
                const files = e.dataTransfer.files;
                this.handleFileUpload(files);
            });

            // 移除拖拽区域的点击事件，避免重复触发文件选择
            // dropArea.addEventListener('click', () => {
            //     const fileInput = document.getElementById('file-input');
            //     if (fileInput) {
            //         fileInput.click();
            //     }
            // });
        }

        // 文件类型标签点击事件
        document.querySelectorAll('.file-type-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // 防抖：如果正在加载，忽略点击
                if (this.isLoading) {
                    return;
                }

                const type = e.target.getAttribute('data-type');
                
                // 如果点击的是当前激活的按钮，不做任何操作
                if (type === this.currentCategory) {
                    return;
                }

                // 设置加载状态
                this.isLoading = true;

                // 先重置所有按钮的激活状态
                document.querySelectorAll('.file-type-btn').forEach(b => {
                    b.classList.remove('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
                    b.classList.add('bg-dark-light', 'hover:bg-dark-light/70', 'text-white');
                });
                // 设置当前按钮为激活
                e.target.classList.add('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
                e.target.classList.remove('bg-dark-light', 'hover:bg-dark-light/70');

                try {
                    if (type === 'all') {
                        this.currentCategory = 'all';
                        this.currentFolderId = null;
                        
                        // 如果有缓存的数据，直接使用
                        if (this.allFiles.length > 0) {
                            // 显示所有文件，不重新渲染
                            const fileCards = document.querySelectorAll('#files-grid > div');
                            let visibleCount = 0;
                            fileCards.forEach(card => {
                                card.classList.remove('hidden');
                                visibleCount++;
                            });
                            this.updateFileCount(visibleCount);
                            this.toggleEmptyState(visibleCount);
                        } else {
                            // 如果没有缓存，才请求数据
                            const files = await this.api.getFiles();
                            this.allFiles = files; // 缓存数据
                            this.renderFileList(files);
                        }
                        
                        // 更新新建分组按钮状态
                        this.forceUpdateCreateFolderButton();
                        // 重新渲染文件夹列表（隐藏所有文件夹）
                        await this.renderFolderList(this.folders || []);
                    } else {
                        this.currentCategory = type;
                        this.filterFiles(type);
                        // 重新渲染文件夹列表（只显示当前分类的文件夹）
                        await this.renderFolderList(this.folders || []);
                    }
                        } catch (error) {
            // 切换文件类型时出错
        } finally {
                    // 重置加载状态
                    setTimeout(() => {
                        this.isLoading = false;
                    }, 300); // 300ms防抖
                }
            });
        });

        // 设置按钮
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });

        // 退出登录按钮
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.logout();
        });

        // 搜索功能
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // 新建分组按钮
        document.getElementById('create-folder-main-btn')?.addEventListener('click', () => {
            this.showCreateFolderModal();
        });

        // 关闭新建分组模态框
        document.getElementById('close-create-folder-btn')?.addEventListener('click', () => {
            this.hideCreateFolderModal();
        });

        // 取消新建分组
        document.getElementById('cancel-create-folder-btn')?.addEventListener('click', () => {
            this.hideCreateFolderModal();
        });

        // 确认新建分组
        document.getElementById('confirm-create-folder-btn')?.addEventListener('click', () => {
            this.createFolder();
        });

        // 设置相关事件监听器
        document.getElementById('close-settings-btn')?.addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('cancel-settings-btn')?.addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            this.saveStorageSettings();
        });

        // 存储设置滑块和输入框同步
        document.getElementById('storage-slider')?.addEventListener('input', (e) => {
            const input = document.getElementById('storage-input');
            if (input) {
                input.value = e.target.value;
            }
        });

        document.getElementById('storage-input')?.addEventListener('input', (e) => {
            const slider = document.getElementById('storage-slider');
            if (slider) {
                slider.value = e.target.value;
            }
        });

        // 个人资料相关事件监听器
        document.getElementById('profile-edit-btn')?.addEventListener('click', () => {
            this.showProfileModal();
        });

        const profileAvatar = document.getElementById('profile-avatar');
        profileAvatar?.addEventListener('click', () => {
            this.showProfileModal();
        });

        document.getElementById('close-profile-btn')?.addEventListener('click', () => {
            this.hideProfileModal();
        });

        document.getElementById('cancel-profile-btn')?.addEventListener('click', () => {
            this.hideProfileModal();
        });

        document.getElementById('save-profile-btn')?.addEventListener('click', () => {
            this.saveProfile();
        });

        // 头像上传相关事件
        document.getElementById('avatar-upload-btn')?.addEventListener('click', () => {
            const fileInput = document.getElementById('avatar-file-input');
            if (fileInput) {
                fileInput.click();
            }
        });

        // 点击头像本身也可以触发上传
        document.getElementById('profile-avatar-upload')?.addEventListener('click', () => {
            const fileInput = document.getElementById('avatar-file-input');
            if (fileInput) {
                fileInput.click();
            }
        });

        document.getElementById('avatar-file-input')?.addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });

        // 个人资料模态框点击遮罩关闭
        document.getElementById('profile-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'profile-modal') {
                this.hideProfileModal();
            }
        });

        // 头部个人资料链接事件
        const headerProfileLink = document.querySelector('header a[href="#"]');
        if (headerProfileLink && headerProfileLink.textContent.includes('个人资料')) {
            headerProfileLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfileModal();
            });
        }
    }

    // 设置登录表单
    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;

        // 密码小眼睛切换
        const passwordInput = document.getElementById('password');
        const togglePasswordBtn = document.getElementById('toggle-password');
        const togglePasswordIcon = document.getElementById('toggle-password-icon');
        if (togglePasswordBtn && passwordInput && togglePasswordIcon) {
            togglePasswordBtn.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                togglePasswordIcon.classList.toggle('fa-eye');
                togglePasswordIcon.classList.toggle('fa-eye-slash');
            });
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });
    }

    // 处理登录
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');

        // 验证输入
        if (!username || !password) {
            this.showMessage('请输入用户名和密码', 'error');
            return;
        }

        // 显示加载状态
        const originalText = loginBtn.innerHTML;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>登录中...';

        try {
            const data = await this.api.login(username, password);
            
            if (data.success) {
                // 保存登录状态
                window.authManager.saveLoginData(data.user);
                // 登录成功只允许Notify，不允许MessageBox
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            // 恢复按钮状态
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
        }
    }

    // 登录成功回调
    async onLoginSuccess(userData) {
        try {
            // 初始化用户头像显示
            await this.initUserProfile();
            
            // 从后端获取数据
            const [files, folders] = await Promise.all([
                this.api.getFiles(), // 不传folderId，获取所有文件
                this.api.getFolders()
            ]);

            

            // 保存文件夹数据
            this.folders = folders;
            
            // 缓存所有文件数据
            this.allFiles = files;

            // 更新界面
            this.updateFileCount(files.length);
            this.renderFileList(files);
            await this.renderFolderList(folders);

            // 获取并更新存储信息
            const storageInfo = await this.api.getStorageInfo();
    
            this.updateStorageDisplay(storageInfo);

            // 初始化拖拽功能
            this.setupDragAndDrop();

    
        } catch (error) {
            this.showMessage('数据加载失败', 'error');
        }
    }

    // 渲染文件列表
    renderFileList(files) {
        const fileGrid = document.getElementById('files-grid');
        const emptyState = document.getElementById('empty-state');
        const uploadArea = document.getElementById('upload-area');
        
        if (!fileGrid) {
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
        fileCard.className = 'glass-effect rounded-xl p-4 border border-purple-light/20 hover:border-purple-light/40 transition-all duration-300 cursor-pointer group file-card relative hover:shadow-lg hover:shadow-purple-500/10 min-h-[180px] w-full';
        fileCard.setAttribute('data-type', file.type);
        fileCard.setAttribute('data-file-id', file.id);
        fileCard.setAttribute('draggable', 'true');

        // 格式化日期
        const date = new Date(file.date || file.created_at || Date.now());
        const formattedDate = date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });

        // 获取文件大小
        const fileSize = file.size ? this.formatStorageSize(file.size) : '0 B';

        // 生成缩略图或图标
        const thumbnailContent = this.generateThumbnailContent(file);

        fileCard.innerHTML = `
            <div class="card-content flex flex-col h-full">
                <!-- 第一排：缩略图/图标和文件名 -->
                <div class="file-icon-container flex flex-col items-center justify-center mb-4">
                    <div class="w-16 h-16 bg-gradient-to-br ${thumbnailContent.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0 overflow-hidden mb-3">
                        ${thumbnailContent.html}
                    </div>
                    <div class="text-center w-full">
                        <div class="flex items-center justify-center gap-2">
                            <h4 class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 text-sm leading-tight truncate max-w-[120px]" title="${file.name}">${this.truncateFileName(file.name)}</h4>
                            <span class="text-xs px-2 py-1 rounded-full ${this.getCategoryBadgeColor(file.type)} ${this.getCategoryBadgeBg(file.type)} font-medium flex-shrink-0">
                                ${this.getCategoryLabel(file.type)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- 第二排：文件大小和日期（带图标） -->
                <div class="file-info flex items-center justify-center space-x-4 mb-4 text-xs text-gray-400">
                    <div class="flex items-center space-x-1 flex-shrink-0">
                        <i class="fa fa-hdd-o text-blue-400 flex-shrink-0"></i>
                        <span class="bg-gray-800/50 px-1.5 py-0.5 rounded-full font-medium truncate max-w-[80px] text-blue-300" title="${fileSize}">${fileSize}</span>
                    </div>
                    <div class="flex items-center space-x-1 flex-shrink-0">
                        <i class="fa fa-calendar text-green-400 flex-shrink-0"></i>
                        <span class="bg-gray-800/50 px-1.5 py-0.5 rounded-full font-medium text-green-300 truncate max-w-[60px]" title="${formattedDate}">${formattedDate}</span>
                    </div>
                </div>
                
                <!-- 第三排：操作按钮 -->
                <div class="file-actions flex items-center justify-center mt-auto space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button class="file-preview-btn text-blue-400 hover:text-blue-300 transition-colors p-3 rounded-lg hover:bg-blue-500/10" title="预览">
                        <i class="fa fa-eye text-lg"></i>
                    </button>
                    <button class="file-download-btn text-green-400 hover:text-green-300 transition-colors p-3 rounded-lg hover:bg-green-500/10" title="下载">
                        <i class="fa fa-download text-lg"></i>
                    </button>
                    <button class="file-delete-btn text-red-400 hover:text-red-300 transition-colors p-3 rounded-lg hover:bg-red-500/10" title="删除">
                        <i class="fa fa-trash text-lg"></i>
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

        
        // 对于图片文件，尝试显示缩略图
        if (file.type === 'image' && file.previewUrl) {

            
            // 构建完整的图片URL
            let fullUrl;
            if (file.previewUrl.startsWith('/')) {
                fullUrl = `http://localhost:8080${file.previewUrl}`;
            } else if (file.previewUrl.startsWith('http')) {
                fullUrl = file.previewUrl;
            } else {
                fullUrl = `http://localhost:8080/uploads/${file.type}/${file.name}`;
            }
            

            return fullUrl;
        }
        
        // 对于视频文件，暂时使用默认图标
        // 未来可以添加视频缩略图生成功能
        if (file.type === 'video') {

            return null;
        }


        return null;
    }

    // 添加文件卡片事件监听器
    addFileCardEventListeners(fileCard, file) {
        // 预览按钮
        fileCard.querySelector('.file-preview-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showFilePreview(file);
        });

        // 下载按钮
        fileCard.querySelector('.file-download-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadFile(file);
        });

        // 删除按钮
        fileCard.querySelector('.file-delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFile(file);
        });
    }

    // 渲染文件夹列表
    async renderFolderList(folders) {
        if (!Array.isArray(folders)) folders = [];
        
        const foldersGrid = document.getElementById('folders-grid');
        if (!foldersGrid) return;

        foldersGrid.innerHTML = '';

        // 只渲染当前分类下的分组
        const category = this.currentCategory;
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        

        
        if (category && category !== 'all') {
            // 强制显示新建分组按钮
            if (createFolderBtn) {
                createFolderBtn.style.display = 'flex';
    
            }
            
            const categoryFolders = folders.filter(f => f.category === category);

            
            if (categoryFolders.length > 0) {
                // 直接平铺，不再分多组
                for (const folder of categoryFolders) {
                    const folderHTML = await this.createFolderCardHTML(folder, {
                        name: '', icon: 'fa-folder', color: this.getCategoryColor(category)
                    });
                    foldersGrid.insertAdjacentHTML('beforeend', folderHTML);
                }
                // 绑定事件
                foldersGrid.querySelectorAll('[data-folder-id]').forEach(card => {
                    const folderId = card.getAttribute('data-folder-id');
                    const folder = categoryFolders.find(f => f.id == folderId);
                    if (folder) this.addFolderCardEventListeners(card, folder);
                });
            } else {
                // 没有分组时显示空状态提示
                foldersGrid.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <i class="fa fa-folder-open text-2xl text-blue-400"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-white mb-2">暂无分组</h3>
                        <p class="text-gray-400 text-sm">点击"新建分组"按钮创建第一个分组</p>
                    </div>
                `;
            }
        } else {
            // 在"全部文件"页面隐藏新建分组按钮
            if (createFolderBtn) {
                createFolderBtn.style.display = 'none';
            }
        }
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
            fileCount = await this.api.getFolderFileCount(folder.id);
        } catch (error) {
            // 获取文件夹文件数量失败
        }

        return `
            <div class="glass-effect rounded-xl p-6 border border-blue-400/40 hover:border-blue-400/80 transition-all duration-300 cursor-pointer group drop-zone relative min-h-[120px] w-full max-w-xs flex flex-col justify-between items-center bg-gradient-to-br from-blue-900/60 to-dark/80 shadow-lg" data-folder-id="${folder.id}" title="点击查看文件夹内容">
                <h4 class="font-semibold text-blue-300 truncate text-sm mb-2 w-full text-center tracking-wider" title="${folder.name}">
                    ${folder.name.length > 7 ? folder.name.slice(0, 7) + '…' : folder.name}
                </h4>
                <div class="flex flex-col items-center justify-center w-full mb-2 space-y-1">
                    <div class="flex items-center justify-center">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-lg flex items-center justify-center mr-2">
                            <i class="fa fa-folder text-xl text-blue-300"></i>
                        </div>
                        <span class="text-xs font-medium text-blue-200 drop-shadow-sm">文件数：</span>
                        <span class="text-xs font-bold text-cyan-400 ml-1">${fileCount}</span>
                    </div>
                    <div class="folder-info flex items-center justify-center space-x-2 mb-4">
                        <i class="fa fa-calendar text-xs text-gray-400"></i>
                        <span class="text-xs text-gray-400">创建于 ${new Date(folder.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                </div>
                <div class="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2 w-full">
                    <button class="folder-edit-btn text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-400/10" title="重命名">
                        <i class="fa fa-edit text-sm"></i>
                    </button>
                    <button class="folder-delete-btn text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-400/10" title="删除">
                        <i class="fa fa-trash text-sm"></i>
                    </button>
                </div>
                <div class="absolute inset-0 bg-blue-500/5 border-2 border-dashed border-blue-400/30 rounded-xl opacity-0 transition-opacity duration-300 flex items-center justify-center pointer-events-none drag-hint">
                    <div class="text-center">
                        <i class="fa fa-arrow-down text-2xl text-blue-400 mb-2"></i>
                        <p class="text-sm text-blue-400 font-medium">拖拽文件到这里</p>
                    </div>
                </div>
            </div>
        `;
    }

    // 创建文件夹卡片
    createFolderCard(folder) {
        const folderCard = document.createElement('div');
        folderCard.className = 'glass-effect rounded-xl p-6 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 cursor-pointer group folder-card drop-zone relative min-h-[180px] w-full';
        folderCard.setAttribute('data-folder-id', folder.id);

        folderCard.innerHTML = `
            <!-- 主要内容区域 -->
            <div class="card-content flex flex-col h-full" data-folder-id="${folder.id}" title="点击查看文件夹内容">
                <!-- 顶部：图标和标题 -->
                <div class="folder-icon-container flex flex-col items-center justify-center mb-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0 mb-3">
                        <i class="fa fa-folder text-3xl text-blue-400"></i>
                    </div>
                    <div class="text-center w-full">
                        <div class="flex items-center justify-center gap-2">
                            <h4 class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 truncate text-sm max-w-[120px]" title="${folder.name}">${this.truncateFileName(folder.name)}</h4>
                            <span class="text-xs px-3 py-1 rounded-full ${this.getCategoryBadgeColor(folder.category)} ${this.getCategoryBadgeBg(folder.category)} font-medium flex-shrink-0">
                                ${this.getCategoryLabel(folder.category)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- 中间：创建时间 -->
                <div class="folder-info flex items-center justify-center space-x-2 mb-4">
                    <i class="fa fa-calendar text-xs text-gray-400"></i>
                    <span class="text-xs text-gray-400">创建于 ${new Date(folder.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                
                <!-- 底部：操作按钮区域 -->
                <div class="folder-actions mt-auto pt-4 border-t border-blue-400/10">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <i class="fa fa-file-o text-xs text-gray-400"></i>
                            <span class="text-xs text-gray-400">0 个文件</span>
                        </div>
                        <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button class="folder-edit-btn text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-400/10" title="重命名">
                                <i class="fa fa-edit text-sm"></i>
                            </button>
                            <button class="folder-delete-btn text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-400/10" title="删除">
                                <i class="fa fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
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
            this.showConfirmDialog('确定要删除该文件夹吗？').then(confirmed => {
                if (confirmed) {
                    this.deleteFolder(folder.id, folder.name);
                }
            });
        });
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
                        <button id="edit-folder-cancel" class="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition">取消</button>
                        <button id="edit-folder-confirm" class="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:from-blue-600 hover:to-purple-600 transition">确定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            const input = modal.querySelector('#edit-folder-input');
            input.focus();
            // 事件绑定
            modal.querySelector('#edit-folder-cancel').onclick = () => {
                document.body.removeChild(modal);
                resolve(null);
            };
            modal.querySelector('#edit-folder-confirm').onclick = () => {
                const newName = input.value.trim();
                document.body.removeChild(modal);
                resolve(newName);
            };
            // ESC关闭
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    document.body.removeChild(modal);
                    resolve(null);
                }
            });
            // 点击遮罩关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(null);
                }
            });
        });
    }

    // 显示文件预览
    showFilePreview(file) {

        
        // 根据文件类型实现不同的预览方式
        switch (file.type) {
            case 'image':
                this.previewImage(file);
                break;
            case 'video':
                this.previewVideo(file);
                break;
            case 'audio':
                this.previewAudio(file);
                break;
            case 'document':
                this.previewDocument(file);
                break;
            default:
                this.showMessage('不支持预览此类型的文件', 'warning');
        }
    }

    // 预览图片
    previewImage(file) {
        // 给body添加类防止滚动
        document.body.classList.add('modal-open');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        modal.innerHTML = `
            <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                <!-- 关闭按钮 -->
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                
                <!-- 文件信息 - 显示在顶部 -->
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                
                <!-- 图片容器 -->
                <div class="relative w-full h-full flex items-center justify-center preview-image-container" style="overflow: hidden;">
                    <img src="${file.path || `/static/uploads/${file.type}/${file.name}`}" alt="${file.name}" class="max-w-full max-h-full object-contain rounded-lg">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }

    // 预览视频
    previewVideo(file) {
        // 给body添加类防止滚动
        document.body.classList.add('modal-open');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        modal.innerHTML = `
            <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                <!-- 关闭按钮 -->
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                
                <!-- 文件信息 - 显示在顶部 -->
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                
                <!-- 视频容器 -->
                <div class="relative w-full h-full flex items-center justify-center preview-video-container" style="overflow: hidden;">
                    <video controls class="max-w-full max-h-full rounded-lg" autoplay>
                        <source src="${file.path || `/static/uploads/${file.type}/${file.name}`}" type="video/mp4">
                        您的浏览器不支持视频播放
                    </video>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }

    // 预览音频
    previewAudio(file) {
        // 给body添加类防止滚动
        document.body.classList.add('modal-open');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        modal.innerHTML = `
            <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                <!-- 关闭按钮 -->
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                
                <!-- 文件信息 - 显示在顶部 -->
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                
                <!-- 音频播放器容器 -->
                <div class="text-center max-w-2xl preview-audio-container">
                    <div class="w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <i class="fa fa-music text-8xl text-cyan-400"></i>
                    </div>
                    <audio controls class="w-full max-w-lg mx-auto" autoplay>
                        <source src="${file.path || `/static/uploads/${file.type}/${file.name}`}" type="audio/mpeg">
                        您的浏览器不支持音频播放
                    </audio>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        });
    }

    // 预览文档
    previewDocument(file) {
        // 检查是否为Markdown文件
        if (file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown')) {
            this.previewMarkdown(file);
            return;
        }
        
        // 检查是否为txt文件
        if (file.name.toLowerCase().endsWith('.txt')) {
            this.previewTextFile(file);
            return;
        }
        
        // 对于其他文档，我们提供下载链接或在新窗口打开
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="relative max-w-md p-6 bg-dark-light rounded-xl border border-purple-light/20">
                <button class="absolute top-2 right-2 text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fa fa-file-text-o text-4xl text-orange-400"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2">${file.name}</h3>
                    <p class="text-gray-300 mb-6">${file.size} • ${file.type}</p>
                    <div class="space-y-3">
                        <button onclick="window.open('${file.path || `/static/uploads/${file.type}/${file.name}`}', '_blank')" class="w-full bg-gradient-to-r from-orange-500/80 to-amber-500/80 hover:from-orange-500 hover:to-amber-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-external-link mr-2"></i>在新窗口打开
                        </button>
                        <button class="download-doc-btn w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-download mr-2"></i>下载文件
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 绑定下载按钮事件
        const downloadBtn = modal.querySelector('.download-doc-btn');
        downloadBtn.addEventListener('click', () => {
            modal.remove();
            this.downloadFile(file);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    // 预览文本文件
    async previewTextFile(file) {
        try {
            // 构建正确的文件URL
            let fileUrl;
            if (file.path && file.path.startsWith('/uploads/')) {
                // 如果路径已经是正确的格式
                fileUrl = file.path;
            } else {
                // 根据文件类型构建路径
                fileUrl = `/uploads/${file.type}/${file.name}`;
            }
            
            console.log('Loading text file from:', fileUrl);
            console.log('File object:', file);
            
            // 尝试多种路径格式
            const possibleUrls = [
                fileUrl,
                file.path,
                `/uploads/${file.type}/${file.name}`,
                `/static/uploads/${file.type}/${file.name}`
            ];
            
            let response = null;
            let successfulUrl = null;
            
            for (const url of possibleUrls) {
                if (!url) continue;
                
                try {
                    console.log('Trying URL:', url);
                    response = await fetch(url);
                    if (response.ok) {
                        successfulUrl = url;
                        break;
                    }
                } catch (e) {
                    console.log('Failed to fetch:', url, e);
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'Failed to fetch'}`);
            }
            
            const textContent = await response.text();
            
            // 给body添加类防止滚动
            document.body.classList.add('modal-open');
            
            // 创建预览模态框
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
            modal.style.overflow = 'hidden';
            modal.innerHTML = `
                <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                    <!-- 关闭按钮 - 使用深色背景确保对比度 -->
                    <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                        <i class="fa fa-times"></i>
                    </button>
                    
                    <!-- 文件信息 - 显示在顶部 -->
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                        <h3 class="text-xl font-semibold">${file.name}</h3>
                        <p class="text-gray-300 text-sm">${file.size} • 文本文件</p>
                    </div>
                    
                    <!-- 文本内容容器 - 只有这个容器可以滚动 -->
                    <div class="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] preview-content modal-scrollbar" style="overflow: auto;">
                        <div class="p-8">
                            <pre class="text-lg font-mono text-gray-800 whitespace-pre-wrap break-words leading-relaxed">${textContent}</pre>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // 点击背景关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    document.body.classList.remove('modal-open');
                }
            });
            
            // ESC键关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.body.classList.remove('modal-open');
                }
            });
            
        } catch (error) {
            this.showMessage('无法加载文本文件内容', 'error');
        }
    }

    // 预览Markdown文档
    async previewMarkdown(file) {
        try {
            // 加载marked.js库
            if (typeof marked === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
                script.onload = () => this.loadAndRenderMarkdown(file);
                document.head.appendChild(script);
            } else {
                this.loadAndRenderMarkdown(file);
            }
        } catch (error) {
            this.showMessage('无法加载Markdown预览功能', 'error');
        }
    }

    // 加载并渲染Markdown内容
    async loadAndRenderMarkdown(file) {
        try {
            // 构建正确的文件URL
            let fileUrl;
            if (file.path && file.path.startsWith('/uploads/')) {
                // 如果路径已经是正确的格式
                fileUrl = file.path;
            } else {
                // 根据文件类型构建路径
                fileUrl = `/uploads/${file.type}/${file.name}`;
            }
            
            console.log('Loading markdown from:', fileUrl);
            console.log('File object:', file);
            console.log('File path:', file.path);
            console.log('File type:', file.type);
            console.log('File name:', file.name);
            
            // 尝试多种路径格式 - 优先使用/uploads路径
            const possibleUrls = [
                fileUrl,
                file.path,
                `/uploads/${file.type}/${file.name}`,
                `/static/uploads/${file.type}/${file.name}`,
                `/static/${file.type}/${file.name}`
            ];
            
            let response = null;
            let successfulUrl = null;
            
            for (const url of possibleUrls) {
                if (!url) continue;
                
                try {
                    console.log('Trying URL:', url);
                    response = await fetch(url);
                    console.log('Response status:', response.status);
                    console.log('Response headers:', response.headers);
                    
                    if (response.ok) {
                        successfulUrl = url;
                        console.log('Successfully loaded from:', url);
                        break;
                    } else {
                        console.log('Failed with status:', response.status, response.statusText);
                    }
                } catch (e) {
                    console.log('Failed to fetch:', url, e);
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'Failed to fetch'}`);
            }
            
            const markdownText = await response.text();
            
            // 配置marked选项
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false
                });
                
                // 渲染Markdown
                const htmlContent = marked.parse(markdownText);
                
                // 给body添加类防止滚动
                document.body.classList.add('modal-open');
                
                // 创建预览模态框
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
                modal.style.overflow = 'hidden';
                modal.innerHTML = `
                    <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                        <!-- 关闭按钮 - 使用深色背景确保对比度 -->
                        <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                            <i class="fa fa-times"></i>
                        </button>
                        
                        <!-- 文件信息 - 显示在顶部 -->
                        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                            <h3 class="text-xl font-semibold">${file.name}</h3>
                            <p class="text-gray-300 text-sm">${file.size} • Markdown文档</p>
                        </div>
                        
                        <!-- Markdown内容容器 - 只有这个容器可以滚动 -->
                        <div class="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] preview-content modal-scrollbar" style="overflow: auto;">
                            <div class="p-8 prose prose-xl max-w-none">
                                ${htmlContent}
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                // 点击背景关闭
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                        document.body.classList.remove('modal-open');
                    }
                });
                
                // ESC键关闭
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        modal.remove();
                        document.body.classList.remove('modal-open');
                    }
                });
            } else {
                throw new Error('Marked.js library not loaded');
            }
            
        } catch (error) {
            console.error('Markdown preview error:', error);
            this.showMessage(`无法加载Markdown文件内容: ${error.message}`, 'error');
        }
    }

    // 下载文件
    async downloadFile(file) {
        try {
            const response = await this.api.downloadFile(file.id);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            this.showMessage('文件下载成功', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 删除文件
    async deleteFile(file) {
        // 使用自定义确认对话框
        const confirmDelete = () => {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
                modal.innerHTML = `
                    <div class="relative max-w-md p-6 bg-dark-light rounded-xl border border-red-400/20">
                        <div class="text-center">
                            <div class="w-20 h-20 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i class="fa fa-exclamation-triangle text-3xl text-red-400"></i>
                            </div>
                            <h3 class="text-xl font-semibold text-white mb-3">确认删除</h3>
                            <p class="text-gray-300 mb-6">确定要删除文件 "${file.name}" 吗？此操作无法撤销。</p>
                            <div class="flex space-x-3">
                                <button class="cancel-delete-btn flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                                    取消
                                </button>
                                <button class="confirm-delete-btn flex-1 px-4 py-2 bg-gradient-to-r from-red-500/80 to-rose-500/80 hover:from-red-500 hover:to-rose-500 text-white rounded-lg transition-all duration-300">
                                    确认删除
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                // 绑定按钮事件
                modal.querySelector('.cancel-delete-btn').addEventListener('click', () => {
                    modal.remove();
                    resolve(false);
                });
                
                modal.querySelector('.confirm-delete-btn').addEventListener('click', () => {
                    modal.remove();
                    resolve(true);
                });
                
                // 点击背景关闭
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                        resolve(false);
                    }
                });
            });
        };

        const confirmed = await confirmDelete();
        if (!confirmed) return;

        try {
            await this.api.deleteFile(file.id);
            this.showMessage('文件删除成功', 'success');
            // 重新加载文件列表
            const files = await this.api.getFiles(this.currentFolderId);
            
            // 更新缓存
            this.allFiles = files;
            
            this.updateFileCount(files.length);
            this.renderFileList(files);
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 显示文件夹内容
    async showFolderFiles(folderId, folderName) {
        try {
    
            
            // 设置当前文件夹ID
            this.currentFolderId = folderId;
            
            // 获取文件夹中的文件
            const files = await this.api.getFiles(folderId);
            
            // 渲染文件列表
            this.renderFileList(files);
            
            // 显示面包屑导航
            this.showBreadcrumb(folderName);
            
            // 更新面包屑中的文件数量
            this.updateFolderFileCount(files.length);
            
            // 更新文件类型标签状态 - 在文件夹中时禁用分类切换
            this.disableCategoryButtons();
            
            // 隐藏文件夹区域
            this.hideFolderSection();
            
            // 显示返回按钮
            this.showBackButton();
            
    
            
        } catch (error) {
            this.showMessage('获取文件夹内容失败', 'error');
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

    // 返回所有文件视图
    async goBackToAllFiles() {
        try {
            // 重置当前文件夹ID
            this.currentFolderId = null;
            
            // 使用缓存的文件数据，如果没有缓存则重新获取
            let files = this.allFiles;
            if (!files || files.length === 0) {
                files = await this.api.getFiles();
                this.allFiles = files; // 更新缓存
            }
            
            // 重新渲染文件列表
            this.renderFileList(files);
            
            // 隐藏面包屑导航
            this.hideBreadcrumb();
            
            // 启用分类按钮
            this.enableCategoryButtons();
            
            // 显示文件夹区域
            this.showFolderSection();
            
            // 隐藏返回按钮
            this.hideBackButton();
            
            // 重新渲染文件夹列表
            const folders = await this.api.getFolders();
            await this.renderFolderList(folders);
            
    
            
        } catch (error) {
            this.showMessage('返回失败', 'error');
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
        const fileCountElement = document.getElementById('folder-file-count');
        if (fileCountElement) {
            fileCountElement.textContent = count;
        }
    }

    // 编辑文件夹
    async editFolder(folderId, currentName) {
        const newName = prompt('请输入新的文件夹名称:', currentName);
        if (!newName || newName.trim() === '') return;

        try {
            await this.api.updateFolder(folderId, newName.trim());
            this.showMessage('文件夹重命名成功', 'success');
            // 重新加载文件夹列表
            const folders = await this.api.getFolders();
            await this.renderFolderList(folders);
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 删除文件夹
    async deleteFolder(folderId, folderName) {
        try {
            await this.api.deleteFolder(folderId);
            this.showMessage('文件夹删除成功', 'success');
            // 重新加载文件夹列表
            const folders = await this.api.getFolders();
            this.folders = folders;
            await this.renderFolderList(folders);
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 显示上传区域
    showUploadArea() {
        const uploadArea = document.getElementById('upload-area');
        const emptyState = document.getElementById('empty-state');
        const fileGrid = document.getElementById('files-grid');
        
        if (uploadArea) {
            uploadArea.classList.remove('hidden');
        }
        
        // 隐藏空状态和文件网格
        if (emptyState) {
            emptyState.classList.add('hidden');
        }
        if (fileGrid) {
            fileGrid.classList.add('hidden');
        }
        
        // 滚动到上传区域
        if (uploadArea) {
            uploadArea.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // 隐藏上传区域
    hideUploadArea() {
        const uploadArea = document.getElementById('upload-area');
        const emptyState = document.getElementById('empty-state');
        const fileGrid = document.getElementById('files-grid');
        
        if (uploadArea) {
            uploadArea.classList.add('hidden');
        }
        
        // 检查是否有文件，决定显示什么
        const files = document.querySelectorAll('#files-grid > div:not(.hidden)');
        if (files.length === 0) {
            // 没有文件，显示空状态
            if (emptyState) {
                emptyState.classList.remove('hidden');
            }
            if (fileGrid) {
                fileGrid.classList.add('hidden');
            }
        } else {
            // 有文件，显示文件网格
            if (fileGrid) {
                fileGrid.classList.remove('hidden');
            }
            if (emptyState) {
                emptyState.classList.add('hidden');
            }
        }
    }

    // 处理文件类型过滤
    handleFileTypeFilter(event) {

        
        // 移除所有标签的活动状态
        document.querySelectorAll('.file-type-btn').forEach(b => {
            b.classList.remove('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
            b.classList.add('bg-dark-light', 'hover:bg-dark-light/70', 'text-white');
        });

        // 添加当前标签的活动状态
        event.target.classList.add('active', 'bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-md', 'shadow-primary/20');
        event.target.classList.remove('bg-dark-light', 'hover:bg-dark-light/70');

        // 过滤文件
        const type = event.target.getAttribute('data-type');
        this.currentCategory = type; // 新增：记录当前分类
        
        // 先过滤文件，确保文件显示正确
        this.filterFiles(type);

        // 控制分组区域显示/隐藏
        const folderSection = document.getElementById('folder-section');
        const createFolderBtn = document.getElementById('create-folder-main-btn');
        

        
        if (folderSection) {
            if (type === 'all') {
                folderSection.classList.add('hidden');
                // 在"全部文件"页面隐藏新建分组按钮
                if (createFolderBtn) {
                    createFolderBtn.style.display = 'none';
        
                }
            } else {
                folderSection.classList.remove('hidden');
                // 在分类页面显示新建分组按钮
                if (createFolderBtn) {
                    createFolderBtn.style.display = 'flex';
        
                }
            }
        }

        // 延迟刷新分组，确保文件过滤完成后再刷新分组
        setTimeout(() => {
            this.refreshFolders();
        }, 100);
    }

    // 过滤文件
    filterFiles(type) {

        
        // 设置当前分类
        this.currentCategory = type;
        
        const fileCards = document.querySelectorAll('#files-grid > div');

        
        let visibleCount = 0;

        // 添加淡入淡出效果
        fileCards.forEach((card, index) => {
            const fileData = card.getAttribute('data-type');

            
            if (fileData === type) {
                // 显示匹配的文件卡片
                card.style.opacity = '0';
                card.classList.remove('hidden');
                card.style.transition = 'opacity 0.3s ease-in-out';
                setTimeout(() => {
                    card.style.opacity = '1';
                }, 10);
                visibleCount++;
            } else {
                // 隐藏不匹配的文件卡片
                card.style.transition = 'opacity 0.3s ease-in-out';
                card.style.opacity = '0';
                setTimeout(() => {
                    card.classList.add('hidden');
                    card.style.opacity = '';
                }, 300);
            }
        });



        // 延迟更新计数，等待动画完成
        setTimeout(() => {
            this.updateFileCount(visibleCount);
            this.toggleEmptyState(visibleCount);
        }, 350);
        
        // 更新新建分组按钮状态
        this.forceUpdateCreateFolderButton();
    }

    // 处理搜索
    handleSearch(searchTerm) {
        const fileCards = document.querySelectorAll('#files-grid > div');
        let visibleCount = 0;

        fileCards.forEach(card => {
            const fileName = card.querySelector('h4').textContent.toLowerCase();
            if (fileName.includes(searchTerm.toLowerCase())) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        this.toggleEmptyState(visibleCount);
    }

    // 切换空状态显示
    toggleEmptyState(visibleCount = null) {
        const fileGrid = document.getElementById('files-grid');
        const emptyState = document.getElementById('empty-state');
        const uploadArea = document.getElementById('upload-area');
        
        if (!fileGrid || !emptyState) {
            return;
        }

        const files = document.querySelectorAll('#files-grid > div:not(.hidden)');
        const count = visibleCount !== null ? visibleCount : files.length;



        if (count === 0) {
            // 没有可见文件，显示空状态，隐藏文件网格和上传区域
            fileGrid.style.transition = 'opacity 0.3s ease-in-out';
            fileGrid.style.opacity = '0';
            setTimeout(() => {
                fileGrid.classList.add('hidden');
                fileGrid.style.opacity = '';
            }, 300);
            
            emptyState.style.opacity = '0';
            emptyState.classList.remove('hidden');
            emptyState.style.transition = 'opacity 0.3s ease-in-out';
            setTimeout(() => {
                emptyState.style.opacity = '1';
            }, 10);
            
            if (uploadArea) {
                uploadArea.classList.add('hidden');
            }
        } else {
            // 有可见文件，显示文件网格，隐藏空状态和上传区域
            emptyState.style.transition = 'opacity 0.3s ease-in-out';
            emptyState.style.opacity = '0';
            setTimeout(() => {
                emptyState.classList.add('hidden');
                emptyState.style.opacity = '';
            }, 300);
            
            fileGrid.style.opacity = '0';
            fileGrid.classList.remove('hidden');
            fileGrid.style.transition = 'opacity 0.3s ease-in-out';
            setTimeout(() => {
                fileGrid.style.opacity = '1';
            }, 10);
            
            if (uploadArea) {
                uploadArea.classList.add('hidden');
            }
        }
    }

    // 更新文件数量
    updateFileCount(count) {
        // 更新欢迎区域的文件数量
        const fileCountElement = document.getElementById('file-count');
        if (fileCountElement) {
            fileCountElement.textContent = count;
        }

        // 更新文件列表区域的文件数量（右上角）
        const fileCountDisplay = document.getElementById('file-count-display');
        const fileCountDesc = document.getElementById('file-count-desc');
        if (fileCountDisplay && fileCountDesc) {
            let displayCount = count;
            let desc = '文件';
            if (this.currentCategory && this.currentCategory !== 'all') {
                const fileCards = document.querySelectorAll('#files-grid > div');
                displayCount = 0;
                fileCards.forEach(card => {
                    if (!card.classList.contains('hidden') && card.getAttribute('data-type') === this.currentCategory) {
                        displayCount++;
                    }
                });
            }
            fileCountDisplay.textContent = displayCount;
            fileCountDesc.innerHTML = `共 <span id="file-count-display" class="text-purple-300 font-bold">${displayCount}</span> 个${desc}`;
        }
    }

    // 更新存储显示
    updateStorageDisplay(storageInfo) {
        if (!storageInfo) {
            return;
        }



        const totalElement = document.getElementById('total-storage');
        const usedElement = document.getElementById('used-storage');
        const percentageElement = document.getElementById('usage-percentage');
        const progressBar = document.getElementById('storage-progress-bar');
        const progressText = document.getElementById('storage-progress-text');

        // 计算百分比
        const percentage = storageInfo.total_space > 0 ? (storageInfo.used_space / storageInfo.total_space) * 100 : 0;
        const clampedPercentage = Math.min(percentage, 100);

        if (totalElement) {
            const totalFormatted = this.formatStorageSize(storageInfo.total_space);
            totalElement.textContent = totalFormatted;
    
        }
        if (usedElement) {
            const usedFormatted = this.formatStorageSize(storageInfo.used_space);
            usedElement.textContent = usedFormatted;
    
        }
        if (percentageElement) {
            percentageElement.textContent = `${clampedPercentage.toFixed(2)}%`;
    
        }
        if (progressBar) {
            progressBar.style.width = `${clampedPercentage}%`;
    
        }
        if (progressText) {
            progressText.textContent = `${clampedPercentage.toFixed(2)}% 已使用`;
    
        }
    }

    // 格式化存储大小
    formatStorageSize(bytes) {
        // 处理各种可能的输入类型
        let size = 0;
        if (typeof bytes === 'number') {
            size = bytes;
        } else if (typeof bytes === 'string') {
            // 如果字符串包含单位，需要解析
            const match = bytes.match(/^([\d.]+)\s*([KMGT]?B)$/i);
            if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2].toUpperCase();
                switch (unit) {
                    case 'KB':
                        size = value * 1024;
                        break;
                    case 'MB':
                        size = value * 1024 * 1024;
                        break;
                    case 'GB':
                        size = value * 1024 * 1024 * 1024;
                        break;
                    case 'TB':
                        size = value * 1024 * 1024 * 1024 * 1024;
                        break;
                    default:
                        size = value;
                }
            } else {
                size = parseInt(bytes) || 0;
            }
        } else if (bytes && typeof bytes === 'object' && bytes.toString) {
            size = parseInt(bytes.toString()) || 0;
        }
        
        if (size === 0) return '0 B';
        
        const KB = 1024;
        const MB = 1024 * KB;
        const GB = 1024 * MB;
        const TB = 1024 * GB;

        let result;
        if (size < KB) {
            result = `${size} B`;
        } else if (size < MB) {
            // 对于KB，保留2位小数，确保完整显示
            const kbValue = (size / KB);
            result = `${kbValue.toFixed(2)} KB`;
        } else if (size < GB) {
            // 对于MB，保留2位小数
            const mbValue = (size / MB);
            result = `${mbValue.toFixed(2)} MB`;
        } else if (size < TB) {
            // 对于GB，保留2位小数
            const gbValue = (size / GB);
            result = `${gbValue.toFixed(2)} GB`;
        } else {
            // 对于TB，保留2位小数
            const tbValue = (size / TB);
            result = `${tbValue.toFixed(2)} TB`;
        }
        
        return result;
    }

    // 显示设置模态框
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('invisible', 'opacity-0');
            this.loadStorageSettings();
        }
    }

    // 隐藏设置模态框
    hideSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('invisible', 'opacity-0');
        }
    }

    // 加载存储设置
    async loadStorageSettings() {
        try {
            const storageInfo = await this.api.getStorageInfo();
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
                usagePercentage.textContent = `${percentage.toFixed(1)}%`;
            }
        } catch (error) {
            // 加载存储设置失败
        }
    }

    // 保存存储设置
    async saveStorageSettings() {
        try {
            const input = document.getElementById('storage-input');
            if (!input) return;

            const limitGB = parseInt(input.value);
            if (limitGB < 1 || limitGB > 20) {
                this.showMessage('存储空间限制必须在1-20GB之间', 'error');
                return;
            }

            const limitBytes = limitGB * 1024 * 1024 * 1024;
            await this.api.updateStorageLimit(limitBytes);
            
            this.showMessage('存储空间设置已保存', 'success');
            this.hideSettingsModal();
            
            // 重新加载存储信息
            const storageInfo = await this.api.getStorageInfo();
            this.updateStorageDisplay(storageInfo);
        } catch (error) {
            this.showMessage(error.message || '保存设置失败', 'error');
        }
    }

    // 退出登录
    logout() {
        window.authManager.clearLoginData();
        window.authManager.showLoginPage();
        if (window.Notify) {
            window.Notify.show({ message: '已退出登录', type: 'info' });
        }
    }

    // 设置拖拽功能
    setupDragAndDrop() {

        
        // 为文件卡片添加拖拽功能
        this.setupFileDragAndDrop();
        
        // 为文件夹添加拖拽接收功能
        this.setupFolderDropZones();
    }

    // 设置文件拖拽功能
    setupFileDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            const fileCard = e.target.closest('.file-card');
            if (fileCard) {
                const fileId = fileCard.getAttribute('data-file-id');
                e.dataTransfer.setData('text/plain', fileId);
                e.dataTransfer.effectAllowed = 'move';
                fileCard.classList.add('opacity-50');
            }
        });

        document.addEventListener('dragend', (e) => {
            const fileCard = e.target.closest('.file-card');
            if (fileCard) {
                fileCard.classList.remove('opacity-50');
            }
        });
    }

    // 设置文件夹拖拽接收区域
    setupFolderDropZones() {
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.drop-zone');
            if (dropZone) {
                e.dataTransfer.dropEffect = 'move';
                dropZone.querySelector('.drag-hint')?.classList.remove('opacity-0');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.drop-zone');
            if (dropZone && !dropZone.contains(e.relatedTarget)) {
                dropZone.querySelector('.drag-hint')?.classList.add('opacity-0');
            }
        });

        document.addEventListener('drop', async (e) => {
            e.preventDefault();
            const dropZone = e.target.closest('.drop-zone');
            if (dropZone) {
                const fileId = e.dataTransfer.getData('text/plain');
                const folderId = dropZone.getAttribute('data-folder-id');
                
                if (fileId && folderId) {
                    try {
                
                        await this.api.moveFile(fileId, parseInt(folderId));
                        this.showMessage('文件移动成功', 'success');
                        
                        // 重新加载文件列表，保持当前分类状态
                        const files = await this.api.getFiles();
                        this.updateFileCount(files.length);
                        this.renderFileList(files);
                        
                        // 重新加载文件夹列表以更新文件数量
                        const folders = await this.api.getFolders();
                        this.folders = folders;
                        await this.renderFolderList(folders);
                        
                        // 如果当前在分类页面，重新应用过滤
                        if (this.currentCategory && this.currentCategory !== 'all') {
                            this.filterFiles(this.currentCategory);
                        }
                    } catch (error) {
                        this.showMessage(error.message, 'error');
                    }
                }
                
                dropZone.querySelector('.drag-hint')?.classList.add('opacity-0');
            }
        });
    }

    // 处理文件上传
    async handleFileUpload(files) {
        if (!files || files.length === 0) return;



        // 验证文件类型
        const allowedTypes = [
            // 图片
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
            // 视频
            'video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/wmv', 'video/flv',
            // 音频
            'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/wma',
            // 文档
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/markdown', 'text/x-markdown', 'application/x-markdown'
        ];

        const invalidFiles = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.toLowerCase();
            
            // 检查文件类型
            const isValidType = allowedTypes.includes(file.type) || 
                               fileName.endsWith('.md') || 
                               fileName.endsWith('.markdown') ||
                               fileName.endsWith('.txt') ||
                               fileName.endsWith('.pdf') ||
                               fileName.endsWith('.doc') ||
                               fileName.endsWith('.docx') ||
                               fileName.endsWith('.xls') ||
                               fileName.endsWith('.xlsx') ||
                               fileName.endsWith('.ppt') ||
                               fileName.endsWith('.pptx') ||
                               fileName.endsWith('.jpg') ||
                               fileName.endsWith('.jpeg') ||
                               fileName.endsWith('.png') ||
                               fileName.endsWith('.gif') ||
                               fileName.endsWith('.bmp') ||
                               fileName.endsWith('.webp') ||
                               fileName.endsWith('.mp4') ||
                               fileName.endsWith('.avi') ||
                               fileName.endsWith('.mov') ||
                               fileName.endsWith('.mkv') ||
                               fileName.endsWith('.webm') ||
                               fileName.endsWith('.wmv') ||
                               fileName.endsWith('.flv') ||
                               fileName.endsWith('.mp3') ||
                               fileName.endsWith('.wav') ||
                               fileName.endsWith('.ogg') ||
                               fileName.endsWith('.flac') ||
                               fileName.endsWith('.aac') ||
                               fileName.endsWith('.wma');
            
            if (!isValidType) {
                invalidFiles.push(file.name);
            }
        }

        if (invalidFiles.length > 0) {
            this.showMessage(`不支持的文件类型: ${invalidFiles.join(', ')}`, 'error');
            return;
        }

        const uploadArea = document.getElementById('upload-area');
        const emptyState = document.getElementById('empty-state');
        
        if (uploadArea) {
            uploadArea.classList.add('hidden');
        }
        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        try {
            const folderId = this.currentFolderId || null; // 当前文件夹ID
            const uploadedFiles = await this.api.uploadFiles(files, folderId);

            if (uploadedFiles.success) {
                this.showMessage(uploadedFiles.message, 'success');
                // 重新加载文件列表
                const files = await this.api.getFiles(this.currentFolderId);
                
                // 更新缓存
                this.allFiles = files;
                
                this.updateFileCount(files.length);
                this.renderFileList(files);
                
                // 更新存储信息
                const storageInfo = await this.api.getStorageInfo();
                this.updateStorageDisplay(storageInfo);
                
                // 确保上传区域隐藏，文件列表显示
                if (uploadArea) {
                    uploadArea.classList.add('hidden');
                }
                if (files.length > 0) {
                    const fileGrid = document.getElementById('files-grid');
                    if (fileGrid) {
                        fileGrid.classList.remove('hidden');
                    }
                }
            } else {
                this.showMessage(uploadedFiles.message || '文件上传失败', 'error');
            }
        } catch (error) {
            this.showMessage(error.message || '文件上传失败', 'error');
        }
    }

    // 处理文件选择
    handleFileSelect(event) {
        const files = event.target.files;
        if (files && files.length > 0) {
            
            this.handleFileUpload(files);
        } else {
    
        }
        event.target.value = ''; // 清空文件输入框
    }

    // 工具方法：获取分类标签颜色
    getCategoryBadgeColor(category) {
        const colors = {
            'image': 'text-emerald-400',
            'video': 'text-pink-400',
            'audio': 'text-cyan-400',
            'document': 'text-orange-400',
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
            'other': '其他'
        };
        return labels[category] || '其他';
    }

    // 新增：获取分类色彩
    getCategoryColor(category) {
        const map = { image: 'emerald', video: 'pink', audio: 'cyan', document: 'orange', other: 'slate' };
        return map[category] || 'emerald';
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

    // 显示消息 - 改为只使用Notify
    showMessage(message, type = 'info') {
        Notify.show({ message, type });
    }

    // 显示通知（保持向后兼容）
    showNotification(message, type = 'info') {
        Notify.show({ message, type });
    }

    // 显示确认对话框
    showConfirmDialog(message) {
        return new Promise((resolve) => {
            // 创建确认对话框HTML
            const confirmHTML = `
                <div id="confirm-modal" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div class="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-95 opacity-0">
                        <div class="text-center">
                            <div class="mb-6">
                                <i class="fa fa-question-circle text-4xl text-blue-400 mb-4"></i>
                                <h3 class="text-xl font-semibold text-white mb-2">确认操作</h3>
                                <p class="text-slate-300 text-sm leading-relaxed">${message}</p>
                            </div>
                            <div class="flex gap-3">
                                <button id="confirm-cancel-btn" class="flex-1 px-6 py-3 bg-slate-600/80 hover:bg-slate-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105">
                                    取消
                                </button>
                                <button id="confirm-ok-btn" class="flex-1 px-6 py-3 bg-gradient-to-r from-red-500/80 to-rose-500/80 hover:from-red-500 hover:to-rose-500 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                                    确认
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到页面
            document.body.insertAdjacentHTML('beforeend', confirmHTML);
            
            const modal = document.getElementById('confirm-modal');
            const container = modal.querySelector('div');
            const cancelBtn = document.getElementById('confirm-cancel-btn');
            const okBtn = document.getElementById('confirm-ok-btn');
            
            // 显示动画
            requestAnimationFrame(() => {
                container.classList.remove('scale-95', 'opacity-0');
                container.classList.add('scale-100', 'opacity-100');
            });
            
            // 关闭函数
            const closeModal = (result) => {
                container.classList.remove('scale-100', 'opacity-100');
                container.classList.add('scale-95', 'opacity-0');
                
                setTimeout(() => {
                    modal.remove();
                    resolve(result);
                }, 300);
            };
            
            // 绑定事件
            cancelBtn.addEventListener('click', () => closeModal(false));
            okBtn.addEventListener('click', () => closeModal(true));
            
            // 点击背景关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(false);
                }
            });
            
            // ESC键关闭
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    closeModal(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    // 显示新建分组模态框
    showCreateFolderModal() {
        const modal = document.getElementById('create-folder-modal');
        const input = document.getElementById('folder-name-input');
        
        if (modal && input) {
            input.value = ''; // 清空输入框
            modal.classList.remove('opacity-0', 'invisible');
            input.focus(); // 聚焦到输入框
        }
    }

    // 隐藏新建分组模态框
    hideCreateFolderModal() {
        const modal = document.getElementById('create-folder-modal');
        if (modal) {
            modal.classList.add('opacity-0', 'invisible');
        }
    }

    // 创建分组
    async createFolder() {
        const input = document.getElementById('folder-name-input');
        const folderName = input?.value?.trim();
        const category = this.currentCategory;
        if (!folderName) {
            this.showMessage('请输入分组名称', 'error');
            return;
        }
        if (!category || category === 'all') {
            this.showMessage('请选择具体分类后再新建分组', 'error');
            return;
        }
        try {
            const result = await this.api.createFolder(folderName, category);
            
            if (result.success) {
                this.showMessage('分组创建成功', 'success');
                this.hideCreateFolderModal();
                this.refreshFolders();
            } else {
                this.showMessage(result.message || '分组创建失败', 'error');
            }
        } catch (error) {
            this.showMessage(error.message || '分组创建失败', 'error');
        }
    }

    async refreshFolders() {
        // 获取所有分组
        const allFolders = await this.api.getFolders();
        this.folders = allFolders;
        await this.renderFolderList(allFolders);
    }

    // 显示个人资料模态框
    showProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            // 加载当前用户信息
            this.loadCurrentProfile();
            modal.classList.remove('opacity-0', 'invisible');
        }
    }

    // 隐藏个人资料模态框
    hideProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.classList.add('opacity-0', 'invisible');
        }
    }

    // 加载当前用户信息
    loadCurrentProfile() {
        // 从localStorage获取用户信息
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // 填充表单
        const usernameInput = document.getElementById('profile-username-input');
        const emailInput = document.getElementById('profile-email-input');
        const bioInput = document.getElementById('profile-bio-input');
        
        if (usernameInput) usernameInput.value = userData.username || '';
        if (emailInput) emailInput.value = userData.email || '';
        if (bioInput) bioInput.value = userData.bio || '';
        
        // 加载头像
        this.loadProfileAvatar(userData.avatar);
    }

    // 加载头像
    loadProfileAvatar(avatarUrl) {
        const avatarIcon = document.getElementById('profile-avatar-icon');
        const avatarImage = document.getElementById('profile-avatar-image');
        
        if (avatarUrl) {
            // 有头像，显示图片
            avatarImage.src = avatarUrl;
            avatarImage.classList.remove('hidden');
            avatarIcon.classList.add('hidden');
        } else {
            // 没有头像，显示默认图标
            avatarImage.classList.add('hidden');
            avatarIcon.classList.remove('hidden');
        }
    }

    // 处理头像上传
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            this.showMessage('请选择图片文件', 'error');
            return;
        }

        // 验证文件大小（限制为2MB）
        if (file.size > 2 * 1024 * 1024) {
            this.showMessage('头像文件大小不能超过2MB', 'error');
            return;
        }

        // 预览头像
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarIcon = document.getElementById('profile-avatar-icon');
            const avatarImage = document.getElementById('profile-avatar-image');
            
            avatarImage.src = e.target.result;
            avatarImage.classList.remove('hidden');
            avatarIcon.classList.add('hidden');
        };
        reader.readAsDataURL(file);

        // 保存文件到临时变量
        this.tempAvatarFile = file;
    }

    // 保存个人资料
    async saveProfile() {
        const username = document.getElementById('profile-username-input')?.value?.trim();
        const email = document.getElementById('profile-email-input')?.value?.trim();
        const bio = document.getElementById('profile-bio-input')?.value?.trim();

        if (!username) {
            this.showMessage('请输入用户名', 'error');
            return;
        }

        try {
            // 构建更新数据
            const updateData = {
                username: username,
                email: email,
                bio: bio
            };

            // 如果有新头像，先上传头像
            if (this.tempAvatarFile) {
                const avatarUrl = await this.uploadAvatar(this.tempAvatarFile);
                updateData.avatar = avatarUrl;
            }

            // 调用API更新用户信息
            const result = await this.api.updateProfile(updateData);
            
            if (result.success) {
                // 更新本地存储的用户信息
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const updatedUserData = { ...userData, ...updateData };
                localStorage.setItem('userData', JSON.stringify(updatedUserData));

                // 更新页面显示
                this.updateProfileDisplay(updatedUserData);
                
                this.showMessage('个人资料更新成功', 'success');
                this.hideProfileModal();
            } else {
                this.showMessage(result.message || '更新失败', 'error');
            }
        } catch (error) {
            this.showMessage(error.message || '保存失败', 'error');
        }
    }

    // 上传头像
    async uploadAvatar(file) {
        try {
            const result = await this.api.uploadAvatar(file);
            return result.avatar_url;
        } catch (error) {
            throw new Error('头像上传失败');
        }
    }

    // 初始化用户头像显示
    async initUserProfile() {
        try {
            // 从localStorage获取用户信息
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const loginData = JSON.parse(localStorage.getItem('loginData') || '{}');
            
            // 先使用本地数据更新显示
            const mergedUserData = {
                username: userData.username || loginData.username || '用户',
                avatar: userData.avatar || null
            };
            this.updateProfileDisplay(mergedUserData);
            
            // 从后端获取最新的用户信息
            if (window.authManager && window.authManager.isLoggedIn()) {
                try {
                    const profile = await this.api.getProfile();
                    if (profile) {
                        // 更新localStorage中的用户数据
                        const updatedUserData = {
                            username: profile.username || userData.username || loginData.username || '用户',
                            email: profile.email || userData.email || '',
                            bio: profile.bio || userData.bio || '',
                            avatar: profile.avatar || userData.avatar || null
                        };
                        localStorage.setItem('userData', JSON.stringify(updatedUserData));
                        
                        // 更新页面显示
                        this.updateProfileDisplay(updatedUserData);
                    }
                } catch (error) {
                    // 如果获取失败，继续使用本地数据
                }
            }
        } catch (error) {
            // 初始化用户头像失败
        }
    }

    // 更新页面显示的个人资料
    updateProfileDisplay(userData) {
        // 更新欢迎信息
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `欢迎回来，${userData.username || '用户'}`;
        }

        // 更新用户名
        const userName = document.getElementById('user-name');
        if (userName) {
            userName.textContent = userData.username || '用户';
            // 确保金色渐变样式保持
            userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
        }

        // 更新主内容区域头像
        const mainAvatarIcon = document.getElementById('avatar-icon');
        const mainAvatarImage = document.getElementById('avatar-image');
        
        if (userData.avatar) {
            mainAvatarImage.src = userData.avatar;
            mainAvatarImage.classList.remove('hidden');
            mainAvatarIcon.classList.add('hidden');
        } else {
            mainAvatarImage.classList.add('hidden');
            mainAvatarIcon.classList.remove('hidden');
        }

        // 更新header中的头像
        const headerAvatar = document.getElementById('user-avatar');
        if (headerAvatar) {
            if (userData.avatar) {
                headerAvatar.src = userData.avatar;
            } else {
                // 如果没有头像，使用默认头像
                headerAvatar.src = 'https://picsum.photos/200/200?random=1';
            }
        }
    }
}

// 导出UI管理器
window.UIManager = UIManager; 