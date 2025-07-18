// UI模块 - 处理界面渲染和交互
class UIManager {
    constructor() {
        // 使用全局的ApiManager实例，而不是创建新的
        this.api = window.apiManager || new ApiManager();
        this.currentFolderId = null;
        this.folders = [];
        this.currentCategory = 'all'; // 新增：记录当前分类
        this.allFiles = []; // 缓存所有文件数据
        this.isLoading = false; // 防抖标志
        this.isSubmittingDoc = false; // 防重复提交标志
        this.init();
    }

    init() {
        // 确保移除外站文档分类CSS类
        document.body.classList.remove('external-docs-category');
        
        // 确保页面滚动条正常显示
        this.ensureScrollbarVisibility();
        
        // 延迟设置事件监听器，确保DOM元素已加载
        setTimeout(async () => {
            this.setupEventListeners();
            this.setupLoginForm();
            
            // 初始化文件类型标签
            this.initializeFileTypeButtons();
            
            // 强制设置新建分组按钮初始状态
            this.forceUpdateCreateFolderButton();
            
            // 登录状态检测由App统一处理，避免重复调用
    
            
            // 初始化用户头像显示
            await this.initUserProfile();
            
            // 初始化上传区域提示信息
            this.updateUploadAreaHint();
            
            // 绑定管理员功能事件
            this.bindAdminEvents();
            
            // 绑定同步文档事件
            this.bindSyncDocsEvents();
            
            // 检查并显示管理员菜单
            this.checkAndShowAdminMenu();
    
        }, 100);
        
        // 页面加载完成后再次确保滚动条可见
        window.addEventListener('load', () => {
            this.ensureScrollbarVisibility();
        });
    }

    // 确保滚动条可见
    ensureScrollbarVisibility() {
        // 确保body和html的overflow设置正确
        document.body.style.overflow = '';
        document.body.style.overflowY = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.overflowY = '';
        
        // 移除可能影响滚动条的CSS类
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        
        // 确保主内容区域可以正常滚动
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.style.overflow = '';
            mainElement.style.overflowY = '';
        }
        
        const containerElement = document.querySelector('.container');
        if (containerElement) {
            containerElement.style.overflow = '';
            containerElement.style.overflowY = '';
        }
    }

    // 清理外站文档样式
    cleanupExternalDocsStyles() {
        // 移除外站文档CSS类
        document.body.classList.remove('external-docs-category');
        
        // 移除外站文档空状态
        const externalDocsEmptyState = document.querySelector('#files-grid .external-docs-empty-state');
        if (externalDocsEmptyState) {
            externalDocsEmptyState.remove();
        }
        
        // 移除外站文档卡片
        const externalDocsCards = document.querySelectorAll('#files-grid [data-doc-id]');
        externalDocsCards.forEach(card => {
            card.remove();
        });
        
        // 恢复所有被隐藏的文件卡片显示
        const hiddenCards = document.querySelectorAll('#files-grid div[style*="display: none"]');
        hiddenCards.forEach(card => {
            card.style.display = '';
        });
        
        // 恢复默认空状态容器的可用性
        const defaultEmptyState = document.getElementById('empty-state');
        if (defaultEmptyState) {
            defaultEmptyState.classList.remove('hidden');
        }
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
            
            // 确保上传按钮显示（默认是全部文件分类）
            const uploadBtn = document.getElementById('upload-btn');
            if (uploadBtn) {
                uploadBtn.style.display = 'flex';
            }
    
        } else {
            // 未找到全部文件按钮
        }
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
        this.currentCategory = type;
        
        // 过滤文件
        this.filterFiles(type);
        
        // 更新上传按钮显示状态
        this.forceUpdateCreateFolderButton();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 移除重复的登录成功事件监听，由App统一处理
        // window.addEventListener('loginSuccess', (event) => {
        //     this.onLoginSuccess(event.detail);
        // });

        // 上传按钮事件
        document.getElementById('upload-btn')?.addEventListener('click', () => {
            this.showUploadArea();
        });

        // 同步文档按钮事件
        document.getElementById('sync-docs-btn')?.addEventListener('click', () => {
            this.showSyncDocsModal();
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

        // 可展开标签双击事件
        document.querySelectorAll('.expandable').forEach(btn => {
            btn.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleExpandableCategory(btn);
            });
        });

        // 子分类按钮点击事件
        document.querySelectorAll('.sub-file-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleSubFileTypeFilter(btn);
            });
        });

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
                    // 清理外站文档样式
                    this.cleanupExternalDocsStyles();
                    
                    if (type === 'all') {
                        this.currentCategory = 'all';
                        this.currentFolderId = null;
                        
                        // 如果有缓存的数据，直接使用
                        if (this.allFiles.length > 0) {
                            // 立即隐藏所有文件卡片，避免残留显示
                            const fileCards = document.querySelectorAll('#files-grid > div');
                            fileCards.forEach(card => {
                                card.style.transition = 'opacity 0.2s ease-in-out';
                                card.style.opacity = '0';
                            });
                            
                            // 短暂延迟后显示所有文件
                            setTimeout(() => {
                                let visibleCount = 0;
                                fileCards.forEach(card => {
                                    card.classList.remove('hidden');
                                    card.style.opacity = '1';
                                    visibleCount++;
                                });
                                this.updateFileCount(visibleCount);
                                this.toggleEmptyState(visibleCount);
                            }, 200);
                        } else {
                            // 如果没有缓存，才请求数据
                            const files = await this.api.getFiles();
                            this.allFiles = files; // 缓存数据
                            this.renderFileList(files);
                        }
                        
                        // 显示上传按钮（全部文件分类）
                        const uploadBtn = document.getElementById('upload-btn');
                        if (uploadBtn) {
                            uploadBtn.style.display = 'flex';
                        }
                        
                        // 更新新建分组按钮状态
                        this.forceUpdateCreateFolderButton();
                        // 重新渲染文件夹列表（隐藏所有文件夹）
                        await this.renderFolderList(this.folders || []);
                        // 更新上传区域提示信息
                        this.updateUploadAreaHint();
                    } else if (type === 'external-docs') {
                        this.currentCategory = 'external-docs';
                        this.currentFolderId = null;
                        
                        // 添加外站文档分类CSS类
                        document.body.classList.add('external-docs-category');
                        
                        // 隐藏文件夹区域
                        this.hideFolderSection();
                        
                        // 隐藏上传按钮（外站文档分类下不允许上传）
                        const uploadBtn = document.getElementById('upload-btn');
                        if (uploadBtn) {
                            uploadBtn.style.display = 'none';
                        }
                        
                        // 隐藏默认空状态容器（如果存在）
                        const defaultEmptyState = document.getElementById('empty-state');
                        if (defaultEmptyState) {
                            defaultEmptyState.classList.add('hidden');
                        }
                        
                        // 加载外站文档
                        await this.loadExternalDocs();
                        
                        // 更新上传区域提示信息
                        this.updateUploadAreaHint();
                    } else {
                        this.currentCategory = type;
                        this.filterFiles(type);
                        
                        // 显示上传按钮（非外站文档分类）
                        const uploadBtn = document.getElementById('upload-btn');
                        if (uploadBtn) {
                            uploadBtn.style.display = 'flex';
                        }
                        
                        // 重新渲染文件夹列表（只显示当前分类的文件夹）
                        await this.renderFolderList(this.folders || []);
                        // 更新上传区域提示信息
                        this.updateUploadAreaHint();
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

        // 存储管理按钮
        document.getElementById('storage-settings-btn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });

        // 退出登录按钮事件由App统一处理，避免重复绑定
        // document.getElementById('logout-btn')?.addEventListener('click', () => {
        //     this.logout();
        // });

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
        // 登录表单事件由 AuthManager 处理，避免重复绑定
        // 移除这里的登录处理逻辑
    }

    // 登录成功回调
    async onLoginSuccess(userData) {

        try {
            // 首先更新用户显示（使用登录时获取的基本信息）
            this.updateProfileDisplay(userData);
            
            // 从后端获取完整的用户信息（包括头像等）
            try {
                const profile = await this.api.getProfile();
                if (profile) {
                    // 合并用户信息
                    const completeUserData = {
                        ...userData,
                        username: profile.username || userData.username,
                        email: profile.email || '',
                        bio: profile.bio || '',
                        avatar: profile.avatar || null
                    };
                    
                    // 更新localStorage中的用户数据
                    localStorage.setItem('userData', JSON.stringify(completeUserData));
                    
                    // 更新页面显示
                    this.updateProfileDisplay(completeUserData);
                }
            } catch (error) {

                // 如果获取失败，继续使用登录时的基本信息
            }
            
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

        // 获取文件大小
        const fileSize = file.size ? this.formatStorageSize(file.size) : '0 B';

        // 生成缩略图或图标
        const thumbnailContent = this.generateThumbnailContent(file);

        // 检查文件是否在文件夹中，并获取文件夹名称
        let folderIndicator = '';
        if (file.folder_id) {
            // 从缓存的文件夹列表中查找文件夹名称
            const folder = this.folders ? this.folders.find(f => f.id === file.folder_id) : null;
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
                        <i class="fa fa-hdd-o text-blue-400 flex-shrink-0 text-xs"></i>
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
                    <button class="file-download-btn text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/10" title="下载">
                        <i class="fa fa-download text-sm"></i>
                    </button>
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
                return `/uploads/image/${file.name}`;
            } else {
                // 非图片文件使用默认图标
                return `/static/public/docs.png`;
            }
        }
        
        // 默认返回文档图标
        return `/static/public/docs.png`;
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

        // 文件夹图标点击事件
        const folderIcon = fileCard.querySelector('[data-folder-id]');
        if (folderIcon && file.folder_id) {
            folderIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.showFolderFromFile(file.folder_id);
            });
        }
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
                        <h4 class="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 truncate text-sm" title="${folder.name}">${this.truncateFileName(folder.name)}</h4>
                        <span class="text-xs px-1.5 py-0.5 rounded-full ${this.getCategoryBadgeColor(folder.category)} ${this.getCategoryBadgeBg(folder.category)} font-medium flex-shrink-0">
                                ${this.getCategoryLabel(folder.category)}
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
            case 'word':
                this.previewWord(file);
                break;
            case 'excel':
                this.previewExcel(file);
                break;
            case 'powerpoint':
                this.previewPowerPoint(file);
                break;
            case 'pdf':
                this.previewPDF(file);
                break;
            default:
                this.showMessage('不支持预览此类型的文件', 'warning');
        }
    }

    // 预览图片
    previewImage(file) {
        // 强制隐藏html和body滚动条
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        // 优先使用file.path
        let imgUrl = file.path || file.previewUrl || `/uploads/${file.type}/${file.name}`;
        if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
            imgUrl = `/uploads/${file.type}/${file.name}`;
        }
        modal.innerHTML = `
            <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                <div class="relative w-full h-full flex items-center justify-center preview-image-container" style="overflow: hidden;">
                    <img src="${imgUrl}" alt="${file.name}" class="max-w-full max-h-full object-contain rounded-lg" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="hidden flex items-center justify-center w-full h-full">
                        <div class="text-center text-white">
                            <i class="fa fa-image text-6xl mb-4 opacity-50"></i>
                            <p class="text-lg">图片加载失败</p>
                            <p class="text-sm opacity-75">文件可能不存在或格式不支持</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 预览视频
    previewVideo(file) {
        // document.body.classList.add('modal-open'); // 删除
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        let videoUrl = file.path || file.previewUrl || `/uploads/video/${file.name}`;
        if (videoUrl && !videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
            videoUrl = `/uploads/video/${file.name}`;
        }
        modal.innerHTML = `
            <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                <div class="relative w-full h-full flex items-center justify-center preview-video-container" style="overflow: hidden;">
                    <video controls class="max-w-full max-h-full rounded-lg" autoplay>
                        <source src="${videoUrl}" type="video/mp4">
                        您的浏览器不支持视频播放
                    </video>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 预览音频
    previewAudio(file) {
        // document.body.classList.add('modal-open'); // 删除
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        let audioUrl = file.path || file.previewUrl || `/uploads/audio/${file.name}`;
        if (audioUrl && !audioUrl.startsWith('http') && !audioUrl.startsWith('/')) {
            audioUrl = `/uploads/audio/${file.name}`;
        }
        modal.innerHTML = `
            <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                <div class="text-center max-w-2xl preview-audio-container">
                    <div class="w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <i class="fa fa-music text-8xl text-cyan-400"></i>
                    </div>
                    <audio controls class="w-full max-w-lg mx-auto" autoplay>
                        <source src="${audioUrl}" type="audio/mpeg">
                        您的浏览器不支持音频播放
                    </audio>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 预览PDF文档
    previewPDF(file) {
        // 强制隐藏html和body滚动条
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        // 构建PDF文件URL
        let pdfUrl = file.path || file.previewUrl || `/uploads/${file.type}/${file.name}`;
        if (pdfUrl && !pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
            pdfUrl = `/uploads/${file.type}/${file.name}`;
        }
        
        // 确保URL是绝对路径
        if (pdfUrl && !pdfUrl.startsWith('http')) {
            pdfUrl = pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`;
        }
        
        modal.innerHTML = `
            <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • PDF文档</p>
                </div>
                <div class="relative w-full h-full flex items-center justify-center preview-pdf-container" style="overflow: hidden;">
                    <div class="flex items-center justify-center w-full h-full">
                        <div class="text-center text-white max-w-md">
                            <div class="w-24 h-24 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i class="fa fa-file-pdf-o text-4xl text-red-400"></i>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">${file.name}</h3>
                            <p class="text-gray-300 mb-6">${file.size} • PDF文档</p>
                            <p class="text-sm text-gray-400 mb-6">请选择预览方式：</p>
                            <div class="space-y-3">
                                <button onclick="window.open('${pdfUrl}', '_blank')" class="w-full bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                                    <i class="fa fa-external-link mr-2"></i>在新窗口打开
                                </button>
                                <button class="preview-pdf-btn w-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                                    <i class="fa fa-eye mr-2"></i>直接预览
                                </button>
                                <button class="download-pdf-btn w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                                    <i class="fa fa-download mr-2"></i>下载文件
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定下载按钮事件
        const downloadBtn = modal.querySelector('.download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                modal.remove();
                this.downloadFile(file);
            });
        }
        
        // 绑定PDF预览按钮事件
        const previewBtn = modal.querySelector('.preview-pdf-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', async () => {
                try {
                    // 使用fetch下载PDF内容
                    const response = await fetch(pdfUrl);
                    if (!response.ok) {
                        throw new Error('PDF下载失败');
                    }
                    
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    
                    // 在新窗口打开PDF
                    const newWindow = window.open(url, '_blank');
                    if (!newWindow) {
                        // 如果弹窗被阻止，直接下载
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = file.name;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                    
                    // 清理URL对象
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (error) {
                    console.error('PDF预览失败:', error);
                    // 如果预览失败，直接在新窗口打开原始URL
                    window.open(pdfUrl, '_blank');
                }
            });
        }
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 预览文档（普通文件）
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
        
        // 检查是否为PDF文件
        if (file.name.toLowerCase().endsWith('.pdf')) {
            this.previewPDF(file);
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
                        <button onclick="window.open('${file.path || `/uploads/${file.type}/${file.name}`}', '_blank')" class="w-full bg-gradient-to-r from-orange-500/80 to-amber-500/80 hover:from-orange-500 hover:to-amber-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
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
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 预览Word文档
    previewWord(file) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="relative max-w-md p-6 bg-dark-light rounded-xl border border-purple-light/20">
                <button class="absolute top-2 right-2 text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fa fa-file-word-o text-4xl text-blue-400"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-2">${file.name}</h3>
                    <p class="text-gray-300 mb-6">${file.size} • Word文档</p>
                    <div class="space-y-3">
                        <button onclick="window.open('${file.path || `/uploads/${file.type}/${file.name}`}', '_blank')" class="w-full bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-external-link mr-2"></i>在新窗口打开
                        </button>
                        <button class="download-word-btn w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-download mr-2"></i>下载文件
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 绑定下载按钮事件
        const downloadBtn = modal.querySelector('.download-word-btn');
        downloadBtn.addEventListener('click', () => {
            modal.remove();
            this.downloadFile(file);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 预览Excel文档
    async previewExcel(file) {
        try {
            // 构建文件URL
            let fileUrl = file.path || `/uploads/${file.type}/${file.name}`;
            
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
                    response = await fetch(url);
                    if (response.ok) {
                        successfulUrl = url;
                        break;
                    }
                } catch (e) {
                    // 静默处理错误
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'Failed to fetch'}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // 检查是否加载了SheetJS库
            if (typeof XLSX === 'undefined') {
                // 如果没有SheetJS库，显示下载选项
                this.showExcelDownloadOptions(file);
                return;
            }
            
            // 使用SheetJS解析Excel文件
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 转换为JSON数据
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 显示表格预览
            this.showExcelTablePreview(file, jsonData, workbook.SheetNames);
            
        } catch (error) {
            console.error('Excel预览失败:', error);
            // 如果预览失败，显示下载选项
            this.showExcelDownloadOptions(file);
        }
    }

    // 显示Excel表格预览
    showExcelTablePreview(file, data, sheetNames) {
        // document.body.classList.add('modal-open'); // 删除
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        // 保存数据到全局变量，供分页更新使用
        window.currentExcelData = data;
        
        // 分页配置
        const paginationConfig = {
            currentPage: 1,
            pageSize: 20,
            totalRows: data.length - 1, // 减去表头
            totalPages: Math.ceil((data.length - 1) / 20)
        };
        
        // 生成分页后的表格HTML
        const tableHTML = this.generatePaginatedTableHTML(data, paginationConfig);
        
        modal.innerHTML = `
            <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                <!-- 关闭按钮 -->
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn transition-all duration-300 hover:scale-110" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                
                <!-- 文件信息 -->
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <i class="fa fa-file-excel-o text-green-400"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-semibold">${file.name}</h3>
                            <p class="text-gray-300 text-sm">Excel表格 • ${sheetNames.length} 个工作表</p>
                        </div>
                    </div>
                </div>
                
                <!-- 表格内容容器 -->
                <div class="bg-white rounded-xl w-full h-full max-w-7xl max-h-[90vh] preview-content modal-scrollbar shadow-2xl border border-gray-200" style="overflow: auto;">
                    <div class="p-6">
                        <!-- 表格标题 -->
                        <div class="text-center mb-6">
                            <h4 class="text-2xl font-bold text-gray-800 mb-2">工作表: ${sheetNames[0]}</h4>
                        </div>
                        
                        <!-- 表格容器 -->
                        <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            ${tableHTML}
                        </div>
                        
                        <!-- 分页控制栏 - 参考主流组件库布局 -->
                        <div class="flex items-center justify-between mt-6">
                            <!-- 左侧：总数信息 -->
                            <div class="text-sm text-gray-600">
                                共 <span class="font-semibold text-gray-800">${data.length - 1}</span> 条数据
                            </div>
                            
                            <!-- 右侧：分页控件和每页显示 -->
                            <div class="flex items-center space-x-4">
                                <!-- 每页显示数量控制 -->
                                <div class="flex items-center space-x-2">
                                    <span class="text-sm text-gray-600">每页</span>
                                    <select id="page-size-select" class="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-16">
                                        <option value="10" class="text-gray-700">10</option>
                                        <option value="20" selected class="text-gray-700">20</option>
                                        <option value="50" class="text-gray-700">50</option>
                                        <option value="100" class="text-gray-700">100</option>
                                    </select>
                                    <span class="text-sm text-gray-600">条</span>
                                </div>
                                
                                <!-- 分页控件 -->
                                <div class="flex items-center space-x-2" id="pagination-controls">
                                    <!-- 上一页按钮 -->
                                    <button class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm" id="prev-page" disabled>
                                        <i class="fa fa-chevron-left mr-1"></i>上一页
                                    </button>
                                    
                                    <!-- 页码按钮 -->
                                    <div class="flex items-center space-x-1" id="page-numbers">
                                        <!-- 页码将通过JavaScript动态生成 -->
                                    </div>
                                    
                                    <!-- 下一页按钮 -->
                                    <button class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm" id="next-page">
                                        下一页<i class="fa fa-chevron-right ml-1"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 初始化分页控制
        this.initializePaginationControls(modal, data, paginationConfig);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 初始化分页控制
    initializePaginationControls(modal, data, config) {
        const pageSizeSelect = modal.querySelector('#page-size-select');
        const prevPageBtn = modal.querySelector('#prev-page');
        const nextPageBtn = modal.querySelector('#next-page');
        const pageNumbers = modal.querySelector('#page-numbers');
        
        // 保存配置到模态框，供分页更新使用
        modal.paginationConfig = config;
        
        // 更新分页配置
        const updatePagination = (newConfig) => {
            modal.paginationConfig = { ...modal.paginationConfig, ...newConfig };
            modal.paginationConfig.totalPages = Math.ceil(modal.paginationConfig.totalRows / modal.paginationConfig.pageSize);
            
            // 更新表格内容
            const tableContainer = modal.querySelector('.overflow-x-auto');
            tableContainer.innerHTML = this.generatePaginatedTableHTML(data, modal.paginationConfig);
            
            // 更新页码显示
            this.updatePageNumbers(pageNumbers, modal.paginationConfig);
            
            // 更新按钮状态
            prevPageBtn.disabled = modal.paginationConfig.currentPage === 1;
            nextPageBtn.disabled = modal.paginationConfig.currentPage === modal.paginationConfig.totalPages;
        };
        
        // 每页显示数量变化事件
        pageSizeSelect.addEventListener('change', (e) => {
            const newPageSize = parseInt(e.target.value);
            updatePagination({
                pageSize: newPageSize,
                currentPage: 1
            });
        });
        
        // 上一页按钮事件
        prevPageBtn.addEventListener('click', () => {
            if (config.currentPage > 1) {
                updatePagination({ currentPage: config.currentPage - 1 });
            }
        });
        
        // 下一页按钮事件
        nextPageBtn.addEventListener('click', () => {
            if (config.currentPage < config.totalPages) {
                updatePagination({ currentPage: config.currentPage + 1 });
            }
        });
        
        // 初始化页码显示
        this.updatePageNumbers(pageNumbers, config);
    }

    // 更新页码显示
    updatePageNumbers(container, config) {
        container.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, config.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(config.totalPages, startPage + maxVisiblePages - 1);
        
        // 调整起始页
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // 添加第一页
        if (startPage > 1) {
            const firstPageBtn = document.createElement('button');
            firstPageBtn.className = 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm min-w-[40px]';
            firstPageBtn.textContent = '1';
            firstPageBtn.addEventListener('click', () => {
                this.updatePagination(config, 1);
            });
            container.appendChild(firstPageBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-3 text-gray-400 font-medium';
                ellipsis.textContent = '...';
                container.appendChild(ellipsis);
            }
        }
        
        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `px-4 py-2 text-sm font-medium border rounded-lg transition-all duration-200 shadow-sm min-w-[40px] ${
                i === config.currentPage 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.updatePagination(config, i);
            });
            container.appendChild(pageBtn);
        }
        
        // 添加最后一页
        if (endPage < config.totalPages) {
            if (endPage < config.totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-3 text-gray-400 font-medium';
                ellipsis.textContent = '...';
                container.appendChild(ellipsis);
            }
            
            const lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm min-w-[40px]';
            lastPageBtn.textContent = config.totalPages;
            lastPageBtn.addEventListener('click', () => {
                this.updatePagination(config, config.totalPages);
            });
            container.appendChild(lastPageBtn);
        }
    }

    // 更新分页
    updatePagination(config, newPage) {
        // 查找当前打开的Excel预览模态框
        const modal = document.querySelector('.fixed.inset-0.bg-black\\/95');
        if (modal && window.currentExcelData && modal.paginationConfig) {
            // 更新配置
            modal.paginationConfig.currentPage = newPage;
            
            const tableContainer = modal.querySelector('.overflow-x-auto');
            const pageNumbers = modal.querySelector('#page-numbers');
            const prevPageBtn = modal.querySelector('#prev-page');
            const nextPageBtn = modal.querySelector('#next-page');
            
            // 更新表格内容
            tableContainer.innerHTML = this.generatePaginatedTableHTML(window.currentExcelData, modal.paginationConfig);
            
            // 更新页码显示
            this.updatePageNumbers(pageNumbers, modal.paginationConfig);
            
            // 更新按钮状态
            prevPageBtn.disabled = modal.paginationConfig.currentPage === 1;
            nextPageBtn.disabled = modal.paginationConfig.currentPage === modal.paginationConfig.totalPages;
        }
    }

    // 生成分页表格HTML
    generatePaginatedTableHTML(data, config) {
        if (!data || data.length === 0) {
            return '<div class="text-center text-gray-500 py-8">表格为空</div>';
        }
        
        // 计算当前页的数据范围
        const startIndex = (config.currentPage - 1) * config.pageSize + 1; // +1 跳过表头
        const endIndex = Math.min(startIndex + config.pageSize - 1, data.length - 1);
        
        let tableHTML = '<table class="min-w-full bg-white mx-auto rounded-lg overflow-hidden shadow-sm">';
        
        // 添加表头
        if (data.length > 0) {
            tableHTML += '<thead class="bg-gradient-to-r from-blue-50 to-indigo-50">';
            tableHTML += '<tr>';
            const headers = data[0];
            headers.forEach((header, index) => {
                tableHTML += `<th class="px-6 py-4 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">${header || `列${index + 1}`}</th>`;
            });
            tableHTML += '</tr>';
            tableHTML += '</thead>';
        }
        
        // 添加数据行
        tableHTML += '<tbody>';
        for (let i = startIndex; i <= endIndex; i++) {
            const row = data[i];
            if (row) {
                tableHTML += '<tr class="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100">';
                row.forEach((cell, index) => {
                    const cellValue = cell !== undefined && cell !== null ? cell.toString() : '';
                    tableHTML += `<td class="px-6 py-4 text-sm text-gray-900 text-center">${cellValue}</td>`;
                });
                tableHTML += '</tr>';
            }
        }
        tableHTML += '</tbody>';
        tableHTML += '</table>';
        
        return tableHTML;
    }

    // 清理模态框滚动状态
    cleanupModalScroll() {
        // 检查是否还有其他模态框存在
        const remainingModals = document.querySelectorAll('.fixed.inset-0.bg-black\\/95, .fixed.inset-0.bg-black\\/80, .fixed.inset-0.bg-black\\/70');
        if (remainingModals.length === 0) {
            // 没有其他模态框时，恢复页面滚动
            document.body.classList.remove('modal-open');
            document.documentElement.classList.remove('modal-open');
            // 确保body和html可以滚动
            document.body.style.overflow = '';
            document.body.style.overflowY = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.overflowY = '';
            
            // 确保主内容区域可以正常滚动
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.style.overflow = '';
                mainElement.style.overflowY = '';
            }
            
            const containerElement = document.querySelector('.container');
            if (containerElement) {
                containerElement.style.overflow = '';
                containerElement.style.overflowY = '';
            }
        }
    }

    // 生成表格HTML
    generateTableHTML(data) {
        if (!data || data.length === 0) {
            return '<div class="text-center text-gray-500 py-8">表格为空</div>';
        }
        
        let tableHTML = '<table class="min-w-full border border-gray-300 bg-white">';
        
        // 添加表头
        if (data.length > 0) {
            tableHTML += '<thead class="bg-gray-50">';
            tableHTML += '<tr>';
            const headers = data[0];
            headers.forEach((header, index) => {
                tableHTML += `<th class="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-300">${header || `列${index + 1}`}</th>`;
            });
            tableHTML += '</tr>';
            tableHTML += '</thead>';
        }
        
        // 添加数据行
        tableHTML += '<tbody>';
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            tableHTML += '<tr class="hover:bg-gray-50">';
            row.forEach((cell, index) => {
                const cellValue = cell !== undefined && cell !== null ? cell.toString() : '';
                tableHTML += `<td class="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">${cellValue}</td>`;
            });
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody>';
        tableHTML += '</table>';
        
        return tableHTML;
    }

    // 显示Excel下载选项（当无法预览时）
    showExcelDownloadOptions(file) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="relative max-w-md p-6 bg-dark-light rounded-xl border border-purple-light/20">
                <button class="absolute top-2 right-2 text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fa fa-file-excel-o text-4xl text-green-400"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-2">${file.name}</h3>
                    <p class="text-gray-300 mb-6">${file.size} • Excel表格</p>
                    <div class="space-y-3">
                        <button onclick="window.open('${file.path || `/uploads/${file.type}/${file.name}`}', '_blank')" class="w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-external-link mr-2"></i>在新窗口打开
                        </button>
                        <button class="download-excel-btn w-full bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-download mr-2"></i>下载文件
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 绑定下载按钮事件
        const downloadBtn = modal.querySelector('.download-excel-btn');
        downloadBtn.addEventListener('click', () => {
            modal.remove();
            this.downloadFile(file);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 预览PowerPoint文档
    previewPowerPoint(file) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="relative max-w-md p-6 bg-dark-light rounded-xl border border-purple-light/20">
                <button class="absolute top-2 right-2 text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fa fa-file-powerpoint-o text-4xl text-orange-400"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-white mb-2">${file.name}</h3>
                    <p class="text-gray-300 mb-6">${file.size} • PowerPoint演示文稿</p>
                    <div class="space-y-3">
                        <button onclick="window.open('${file.path || `/uploads/${file.type}/${file.name}`}', '_blank')" class="w-full bg-gradient-to-r from-orange-500/80 to-red-500/80 hover:from-orange-500 hover:to-red-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-external-link mr-2"></i>在新窗口打开
                        </button>
                        <button class="download-powerpoint-btn w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-download mr-2"></i>下载文件
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 绑定下载按钮事件
        const downloadBtn = modal.querySelector('.download-powerpoint-btn');
        downloadBtn.addEventListener('click', () => {
            modal.remove();
            this.downloadFile(file);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                // 恢复html和body滚动条
                document.body.style.overflow = '';
                document.body.style.height = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.height = '';
            }
        });
    }

    // 预览外站文档
    async previewExternalDocument(doc) {
        try {
            // 获取文档内容
            const response = await fetch(`${doc.path}`);
            if (!response.ok) {
                throw new Error('无法加载文档内容');
            }
            
            const content = await response.text();
            
            // 显示完整文档内容，包括frontmatter
            const fullContent = content;
            
            // 给body添加类防止滚动
            // document.body.classList.add('modal-open'); // 删除
            
            // 创建预览模态框
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
            modal.style.overflow = 'hidden';
            modal.innerHTML = `
                <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                    <!-- 关闭按钮 -->
                    <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                        <i class="fa fa-times"></i>
                    </button>
                    
                    <!-- 文档信息 - 显示在顶部 -->
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                <i class="fa fa-book text-emerald-400"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold">${doc.title}</h3>
                                <p class="text-gray-300 text-sm">${doc.category} • 外站文档</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 文档内容容器 -->
                    <div class="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] preview-content modal-scrollbar" style="overflow: auto;">
                        <div class="p-8">
                            <div class="prose prose-lg max-w-none">
                                <div class="markdown-content">${this.renderMarkdown(fullContent)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // 点击背景关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    // 恢复html和body滚动条
                    document.body.style.overflow = '';
                    document.body.style.height = '';
                    document.documentElement.style.overflow = '';
                    document.documentElement.style.height = '';
                }
            });
            
            // ESC键关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    // 恢复html和body滚动条
                    document.body.style.overflow = '';
                    document.body.style.height = '';
                    document.documentElement.style.overflow = '';
                    document.documentElement.style.height = '';
                }
            });
            
        } catch (error) {
            this.showMessage('无法加载文档内容: ' + error.message, 'error');
        }
    }

    // 简单的Markdown渲染函数
    renderMarkdown(text) {
        return text
            // 标题
            .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold text-gray-900 mb-4">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold text-gray-900 mb-4">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold text-gray-900 mb-4">$1</h1>')
            // 粗体和斜体
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            // 代码块
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>')
            // 列表
            .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
            // 段落
            .replace(/\n\n/g, '</p><p class="mb-4">')
            .replace(/^(?!<[h|p|li|pre|ul|ol]).*/gim, '<p class="mb-4">$&')
            // 清理多余的标签
            .replace(/<p class="mb-4"><\/p>/g, '')
            .replace(/<p class="mb-4">\s*<\/p>/g, '')
            // 确保段落正确闭合
            .replace(/<p class="mb-4">([^<]*(?:<[^p][^>]*>[^<]*<\/[^p][^>]*>[^<]*)*)<\/p>/g, '<p class="mb-4">$1</p>');
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
                    response = await fetch(url);
                    if (response.ok) {
                        successfulUrl = url;
                        break;
                    }
                } catch (e) {
                    // 静默处理错误
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'Failed to fetch'}`);
            }
            
            const textContent = await response.text();
            
            // 给body添加类防止滚动
            // document.body.classList.add('modal-open'); // 删除
            
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
                    // 恢复html和body滚动条
                    document.body.style.overflow = '';
                    document.body.style.height = '';
                    document.documentElement.style.overflow = '';
                    document.documentElement.style.height = '';
                }
            });
            
            // ESC键关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    // 恢复html和body滚动条
                    document.body.style.overflow = '';
                    document.body.style.height = '';
                    document.documentElement.style.overflow = '';
                    document.documentElement.style.height = '';
                }
            });
            
        } catch (error) {
            this.showMessage('无法加载文本文件内容', 'error');
        }
    }

    // 预览Markdown文档
    async previewMarkdown(file) {
        try {
            // 先通过API获取文件的完整信息
            const fileDetails = await this.api.getFile(file.id);
            
            // 构建正确的文件URL
            let fileUrl;
            if (fileDetails.path && fileDetails.path.startsWith('/uploads/')) {
                // 如果路径已经是正确的格式
                fileUrl = fileDetails.path;
            } else {
                // 根据文件类型构建路径
                fileUrl = `/uploads/${file.type}/${file.name}`;
            }
            
            // 尝试多种路径格式 - 优先使用/uploads路径
            const possibleUrls = [
                fileUrl,
                fileDetails.path,
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
                    response = await fetch(url);
                    
                    if (response.ok) {
                        successfulUrl = url;
                        break;
                    }
                } catch (e) {
                    // 静默处理错误
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
                // document.body.classList.add('modal-open'); // 删除
                
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
                        // 恢复html和body滚动条
                        document.body.style.overflow = '';
                        document.body.style.height = '';
                        document.documentElement.style.overflow = '';
                        document.documentElement.style.height = '';
                    }
                });
                
                // ESC键关闭
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        modal.remove();
                        // 恢复html和body滚动条
                        document.body.style.overflow = '';
                        document.body.style.height = '';
                        document.documentElement.style.overflow = '';
                        document.documentElement.style.height = '';
                    }
                });
            } else {
                throw new Error('Marked.js library not loaded');
            }
            
        } catch (error) {
            // 静默处理错误
            this.showMessage(`无法加载Markdown文件内容: ${error.message}`, 'error');
        }
    }

    // 下载文件
    async downloadFile(file) {
        try {
            // 使用重定向下载API，更高效
            const downloadUrl = this.api.buildApiUrl(`/api/download?id=${file.id}&user_id=${this.api.getCurrentUserId()}`);
            
            // 先获取重定向URL
            const response = await fetch(downloadUrl, { method: 'HEAD' });
            if (response.redirected) {
                // 获取重定向后的URL
                const finalUrl = response.url;
                
                // 使用fetch下载文件到内存，然后通过Blob强制下载
                const fileResponse = await fetch(finalUrl);
                if (fileResponse.ok) {
                    const blob = await fileResponse.blob();
                    const url = URL.createObjectURL(blob);
                    
                    // 创建下载链接并强制下载
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // 清理URL对象
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                } else {
                    throw new Error('文件下载失败');
                }
            } else {
                // 如果没有重定向，直接使用原URL
                const fileResponse = await fetch(downloadUrl);
                if (fileResponse.ok) {
                    const blob = await fileResponse.blob();
                    const url = URL.createObjectURL(blob);
                    
                    // 创建下载链接并强制下载
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // 清理URL对象
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                } else {
                    throw new Error('文件下载失败');
                }
            }
            
            this.showMessage('文件下载已开始', 'success');
        } catch (error) {
            console.error('下载错误:', error);
            this.showMessage(`下载失败: ${error.message}`, 'error');
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
            
            // 根据当前类别过滤文件
            if (this.currentCategory && this.currentCategory !== 'all') {
                const filteredFiles = files.filter(file => file.type === this.currentCategory);
                this.updateFileCount(filteredFiles.length);
                this.renderFileList(filteredFiles);
            } else {
                // 全部文件类别，显示所有文件
                this.updateFileCount(files.length);
                this.renderFileList(files);
            }
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

    // 从文件跳转到对应文件夹
    async showFolderFromFile(folderId) {
        try {
            // 获取文件夹信息
            const folders = await this.api.getFolders();
            const folder = folders.find(f => f.id === folderId);
            
            if (folder) {
                await this.showFolderFiles(folderId, folder.name);
            } else {
                this.showMessage('文件夹不存在', 'error');
            }
        } catch (error) {
            this.showMessage('跳转到文件夹失败', 'error');
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
            
            // 清理外站文档样式
            this.cleanupExternalDocsStyles();
            
            // 重新获取根目录的文件（不传folderId，获取根目录文件）
            const files = await this.api.getFiles();
                this.allFiles = files; // 更新缓存
            
            // 清空外站文档内容
            const externalDocsEmptyState = document.querySelector('#files-grid .col-span-full');
            if (externalDocsEmptyState) {
                externalDocsEmptyState.remove();
            }
            
            // 重新渲染文件列表
            this.renderFileList(files);
            
            // 如果当前有分类过滤，重新应用过滤
            if (this.currentCategory && this.currentCategory !== 'all') {
                this.filterFiles(this.currentCategory);
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
        
        // 更新上传提示信息
        this.updateUploadAreaHint();
        
        // 滚动到上传区域
        if (uploadArea) {
            uploadArea.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // 更新上传区域提示信息
    updateUploadAreaHint() {
        const dropAreaFileTypes = document.getElementById('drop-area-file-types');
        if (!dropAreaFileTypes) return;

        let supportedFormats = '';
        
        // 根据当前类别显示不同的支持格式
        switch (this.currentCategory) {
            case 'image':
                supportedFormats = 'JPG, PNG, GIF, BMP, WEBP, SVG, ICO';
                break;
            case 'video':
                supportedFormats = 'MP4, AVI, MOV, MKV, WEBM, WMV, FLV, 3GP';
                break;
            case 'audio':
                supportedFormats = 'MP3, WAV, OGG, FLAC, AAC, WMA, M4A';
                break;
            case 'document':
                supportedFormats = 'PDF, DOC, DOCX, XLS, XLSX, TXT, MD, RTF, CSV';
                break;
            case 'presentation':
                supportedFormats = 'PPT, PPTX';
                break;
            case 'other':
                supportedFormats = 'ZIP, RAR, 7Z, TAR, GZ, ISO, EXE, APK';
                break;
            default:
                // 全部文件类别显示所有格式
                supportedFormats = 'JPG, PNG, GIF, MP4, AVI, MP3, WAV, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD, ZIP, RAR 等';
                break;
        }
        
        dropAreaFileTypes.textContent = `支持的格式: ${supportedFormats}`;
    }

    // 格式化日期为 yyyy-mm-dd 格式
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
        
        // 清理外站文档样式
        this.cleanupExternalDocsStyles();
        
        const fileCards = document.querySelectorAll('#files-grid > div');
        let visibleCount = 0;

        // 如果是切换到非外站文档分类，清空外站文档内容
        if (type !== 'external-docs') {
            // 检查是否有外站文档的空状态内容，如果有则清空
            const externalDocsEmptyState = document.querySelector('#files-grid .col-span-full');
            if (externalDocsEmptyState) {
                externalDocsEmptyState.remove();
            }
        }

        // 立即隐藏所有文件卡片，避免残留显示
        fileCards.forEach(card => {
            card.style.transition = 'opacity 0.2s ease-in-out';
            card.style.opacity = '0';
        });

        // 短暂延迟后重新显示匹配的文件
        setTimeout(async () => {
            // 如果缓存为空且是全部文件分类，重新获取数据
            if (type === 'all' && this.allFiles.length === 0) {
                try {
                    const files = await this.api.getFiles();
                    this.allFiles = files; // 更新缓存
                    this.renderFileList(files);
                    return;
                } catch (error) {
                    console.error('重新获取文件数据失败:', error);
                }
            }
            
            fileCards.forEach(card => {
                const fileData = card.getAttribute('data-type');
                
                // 特殊处理：PDF文件在document分类下也应该显示
                let shouldShow = false;
                if (type === 'document') {
                    // document分类显示所有文档类型：document, word, excel, powerpoint, pdf
                    shouldShow = ['document', 'word', 'excel', 'powerpoint', 'pdf'].includes(fileData);
                } else {
                    shouldShow = fileData === type;
                }
                
                if (shouldShow) {
                    // 显示匹配的文件卡片
                    card.classList.remove('hidden');
                    card.style.opacity = '1';
                    visibleCount++;
                } else {
                    // 隐藏不匹配的文件卡片
                    card.classList.add('hidden');
                    card.style.opacity = '0';
                }
            });

            // 更新计数和状态
            this.updateFileCount(visibleCount);
            this.toggleEmptyState(visibleCount);
        }, 200);
        
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
        
        // 如果不是外站文档分类，确保清理外站文档样式
        if (this.currentCategory !== 'external-docs') {
            this.cleanupExternalDocsStyles();
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
            if (this.currentCategory === 'external-docs') {
                // 外站文档分类下，空状态由renderExternalDocs方法处理
                return;
            }
            
            // 确保移除外站文档分类CSS类
            document.body.classList.remove('external-docs-category');
            
            emptyState.style.opacity = '0';
            emptyState.classList.remove('hidden');
            emptyState.style.transition = 'opacity 0.2s ease-in-out';
            setTimeout(() => {
                emptyState.style.opacity = '1';
            }, 10);
            
            if (uploadArea) {
                uploadArea.classList.add('hidden');
            }
        } else {
            // 有可见文件，显示文件网格，隐藏空状态和上传区域
            emptyState.style.transition = 'opacity 0.2s ease-in-out';
            emptyState.style.opacity = '0';
            setTimeout(() => {
                emptyState.classList.add('hidden');
                emptyState.style.opacity = '';
            }, 200);
            
            fileGrid.style.opacity = '0';
            fileGrid.classList.remove('hidden');
            fileGrid.style.transition = 'opacity 0.2s ease-in-out';
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
            // 如果是"全部文件"分类，使用总文件数（包括文件夹中的文件）
            if (this.currentCategory === 'all' || !this.currentCategory) {
                const totalCount = this.totalFileCount || count;
                fileCountElement.textContent = totalCount;
            } else {
            fileCountElement.textContent = count;
            }
        }

        // 更新文件列表区域的文件数量（右上角）
        const fileCountDisplay = document.getElementById('file-count-display');
        const fileCountDesc = document.getElementById('file-count-desc');
        if (fileCountDisplay && fileCountDesc) {
            let displayCount = count;
            let desc = '文件';
            
            // 外站文档分类特殊处理
            if (this.currentCategory === 'external-docs') {
                displayCount = count;
                desc = '文档';
            } else if (this.currentCategory && this.currentCategory !== 'all') {
                const fileCards = document.querySelectorAll('#files-grid > div');
                displayCount = 0;
                fileCards.forEach(card => {
                    if (!card.classList.contains('hidden') && card.getAttribute('data-type') === this.currentCategory) {
                        displayCount++;
                    }
                });
            } else if (this.currentCategory === 'all' || !this.currentCategory) {
                // 全部文件分类，使用总文件数
                displayCount = this.totalFileCount || count;
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
            // 检查是否为管理员
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
            if (currentUser && currentUser.isAdmin) {
                // 管理员可以修改存储设置
                modal.classList.remove('invisible', 'opacity-0');
                this.loadStorageSettings();
            } else {
                // 非管理员用户显示权限提示
                this.showMessage('只有管理员才能修改存储设置', 'warning');
            }
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
                        const files = await this.api.getFiles(this.currentFolderId);
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
            'text/plain', 'text/markdown', 'text/x-markdown', 'application/x-markdown',
            // 电子表格
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            // 演示文稿
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // 压缩文件
            'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
            'application/x-7z-compressed', 'application/x-tar', 'application/gzip'
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
                               fileName.endsWith('.csv') ||
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
                               fileName.endsWith('.wma') ||
                               fileName.endsWith('.zip') ||
                               fileName.endsWith('.rar') ||
                               fileName.endsWith('.7z') ||
                               fileName.endsWith('.tar') ||
                               fileName.endsWith('.gz');
            
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
                // 重新加载文件列表和总文件数
                const [files, totalFileCount] = await Promise.all([
                    this.api.getFiles(this.currentFolderId),
                    this.api.getTotalFileCount()
                ]);
                
                // 更新缓存
                this.allFiles = files;
                this.totalFileCount = totalFileCount;
                
                // 根据当前类别过滤文件
                if (this.currentCategory && this.currentCategory !== 'all') {
                    const filteredFiles = files.filter(file => file.type === this.currentCategory);
                    this.updateFileCount(filteredFiles.length);
                    this.renderFileList(filteredFiles);
                } else {
                    // 全部文件类别，显示所有文件
                    this.updateFileCount(files.length);
                    this.renderFileList(files);
                }
                
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
            'pdf': 'text-red-400',
            'word': 'text-blue-400',
            'excel': 'text-green-400',
            'powerpoint': 'text-orange-400',
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
            'powerpoint': 'PowerPoint',
            'other': '其他'
        };
        return labels[category] || '其他';
    }

    // 新增：获取分类色彩
    getCategoryColor(category) {
        const map = { 
            image: 'emerald', 
            video: 'pink', 
            audio: 'cyan', 
            document: 'orange', 
            pdf: 'red',
            word: 'blue',
            excel: 'green',
            powerpoint: 'orange',
            other: 'slate' 
        };
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
        
        // 使用全局工具函数构建头像URL
        const getAvatarUrl = (avatarPath) => {
            return window.APP_UTILS.buildAvatarUrl(avatarPath);
        };

        const fullAvatarUrl = getAvatarUrl(avatarUrl);
        
        if (fullAvatarUrl) {
            // 有头像，显示图片
            avatarImage.src = fullAvatarUrl;
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
            // 获取当前登录用户信息
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
            
            if (currentUser) {
                // 使用当前登录用户信息
                const userData = {
                    username: currentUser.username || '用户',
                    avatar: null // 新用户默认没有头像
                };
                
                // 更新页面显示
                this.updateProfileDisplay(userData);
                
                // 从后端获取最新的用户信息
                try {
                    const profile = await this.api.getProfile();
                    if (profile) {
                        // 更新localStorage中的用户数据
                        const updatedUserData = {
                            username: profile.username || currentUser.username || '用户',
                            email: profile.email || '',
                            bio: profile.bio || '',
                            avatar: profile.avatar || null
                        };
                        localStorage.setItem('userData', JSON.stringify(updatedUserData));
                        
                        // 更新页面显示
                        this.updateProfileDisplay(updatedUserData);
                    }
                } catch (error) {
    
                    // 如果获取失败，继续使用当前用户信息
                }
            } else {

            }
        } catch (error) {

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

        // 构建头像URL
        let avatarUrl = null;
        if (userData.avatar) {
            // 使用全局工具函数构建头像URL
            if (window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                avatarUrl = window.APP_UTILS.buildAvatarUrl(userData.avatar);
            } else {
                // 备用方案：直接构建URL
                        if (userData.avatar === 'avatar.png') {
                    // 默认头像
            avatarUrl = `/static/public/avatar.png`;
                } else if (userData.avatar.startsWith('/uploads/avatars/')) {
                    // 处理旧格式的完整路径
                    const fileName = userData.avatar.replace('/uploads/avatars/', '');
                    avatarUrl = `/uploads/avatars/${fileName}`;
                } else {
                    // 如果只是文件名，添加完整路径
                    avatarUrl = `/uploads/avatars/${userData.avatar}`;
                }
            }
        }

        // 更新主内容区域头像
        const mainAvatarIcon = document.getElementById('avatar-icon');
        const mainAvatarImage = document.getElementById('avatar-image');
        
        if (avatarUrl) {
            mainAvatarImage.src = avatarUrl;
            mainAvatarImage.classList.remove('hidden');
            mainAvatarIcon.classList.add('hidden');
        } else {
            mainAvatarImage.classList.add('hidden');
            mainAvatarIcon.classList.remove('hidden');
        }

        // 更新header中的头像
        const headerAvatar = document.getElementById('user-avatar');
        if (headerAvatar) {
            if (avatarUrl) {
                headerAvatar.src = avatarUrl;
            } else {
                // 如果没有头像，不设置src，避免404错误
                // headerAvatar.src = '/static/public/avatar.png'; // 注释掉这行
                // 保持默认的占位符图片
            }
        }
    }

    // 显示管理员用户管理界面
    showAdminUsersModal() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        
        if (!currentUser || !currentUser.isAdmin) {
            this.showMessage('权限不足，需要管理员权限', 'error');
            return;
        }

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-8 w-full max-w-4xl max-h-[80vh] shadow-2xl border border-blue-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-blue-300">用户管理</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" onclick="this.closest('.fixed').remove()">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="overflow-y-auto max-h-[60vh]">
                    <div id="users-list" class="space-y-4">
                        <div class="flex items-center justify-center py-8">
                            <i class="fa fa-spinner fa-spin text-blue-400 text-2xl"></i>
                            <span class="ml-2 text-gray-300">加载中...</span>
                        </div>
                    </div>
                    
                    <!-- 美化的分页控件 -->
                    <div id="pagination-controls" class="mt-8 flex flex-col items-center justify-center space-y-4 hidden">
                        <!-- 分页信息 -->
                        <div class="text-sm text-gray-300 bg-dark-light/50 rounded-lg px-4 py-2 border border-blue-400/30">
                            <span id="page-info" class="font-medium"></span>
                        </div>
                        
                        <!-- 分页按钮 -->
                        <div class="flex items-center justify-center space-x-3">
                            <button id="prev-page-btn" class="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-dark-light border border-blue-400/30 rounded-lg hover:bg-blue-600/20 hover:border-blue-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                <i class="fa fa-chevron-left mr-2"></i>上一页
                            </button>
                            
                            <button id="next-page-btn" class="flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-dark-light border border-blue-400/30 rounded-lg hover:bg-blue-600/20 hover:border-blue-400/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                                下一页<i class="fa fa-chevron-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 加载用户列表
        this.loadUsersList();
    }

    // 加载用户列表
    async loadUsersList(page = 1) {
        try {
            const result = await this.api.getAllUsers(page, 5);
            
            if (result.success) {
                this.renderUsersList(result.users, result);
                this.updatePaginationControls(result, page);
            } else {
                this.showMessage(result.error || '获取用户列表失败', 'error');
            }
        } catch (error) {

            this.showMessage('加载用户列表失败', 'error');
        }
    }

    // 更新分页控件
    updatePaginationControls(result, currentPage) {
        const paginationControls = document.getElementById('pagination-controls');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const pageInfo = document.getElementById('page-info');

        if (!paginationControls || !prevBtn || !nextBtn || !pageInfo) return;

        // 如果用户总数超过5个且有分页信息，显示分页控件
        if (result.total > 5 && result.page_size) {
            paginationControls.classList.remove('hidden');
            
            const totalPages = Math.ceil(result.total / result.page_size);
            pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页 (共 ${result.total} 个用户)`;
            
            // 更新按钮状态
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= totalPages;
            
            // 绑定分页事件
            prevBtn.onclick = () => {
                if (currentPage > 1) {
                    this.loadUsersList(currentPage - 1);
                }
            };
            
            nextBtn.onclick = () => {
                if (currentPage < totalPages) {
                    this.loadUsersList(currentPage + 1);
                }
            };
        } else {
            paginationControls.classList.add('hidden');
        }
    }

    // 渲染用户列表
    renderUsersList(users, result = null) {
        const usersList = document.getElementById('users-list');
        if (!usersList) return;

        if (users.length === 0) {
            usersList.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fa fa-users text-4xl mb-4"></i>
                    <p>暂无用户</p>
                </div>
            `;
            return;
        }

        // 添加用户统计信息
        let headerHtml = '';
        if (result && result.total !== undefined) {
            headerHtml = `
                <div class="mb-4 p-3 bg-blue-900/20 border border-blue-400/30 rounded-lg">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-blue-300">用户统计</span>
                        <span class="text-gray-300">共 ${result.total} 个用户</span>
                    </div>
                </div>
            `;
        }

        usersList.innerHTML = headerHtml + users.map(user => `
            <div class="bg-dark border border-gray-700 rounded-lg p-4 hover:border-blue-400/50 transition-colors ${user.is_admin ? 'border-red-400/50 bg-red-900/10' : ''}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center ${user.is_admin ? 'from-red-500/20 to-orange-500/20' : ''}">
                            <i class="fa fa-user text-blue-400 text-xl ${user.is_admin ? 'text-red-400' : ''}"></i>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <h4 class="text-white font-semibold">${user.username}</h4>
                                ${user.is_admin ? '<span class="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">管理员</span>' : ''}
                            </div>
                            <p class="text-gray-400 text-sm">${user.email || '未设置邮箱'}</p>
                            <p class="text-gray-500 text-xs">创建于 ${this.formatDate(user.created_at)}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <div class="text-right">
                            <p class="text-sm text-gray-400">存储空间</p>
                            <p class="text-white font-semibold">${this.formatStorageSize(user.storage_limit)}</p>
                        </div>
                        
                        <div class="flex space-x-2">
                            <button class="storage-edit-btn bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm transition-colors" 
                                    data-uuid="${user.uuid}" data-current="${user.storage_limit}">
                                <i class="fa fa-edit mr-1"></i>编辑存储
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定编辑存储按钮事件
        usersList.querySelectorAll('.storage-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uuid = e.target.closest('button').dataset.uuid;
                const currentLimit = parseInt(e.target.closest('button').dataset.current);
                this.showStorageEditDialog(uuid, currentLimit);
            });
        });
    }

    // 显示存储编辑对话框
    showStorageEditDialog(uuid, currentLimit) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-md shadow-2xl border border-blue-400/30">
                <h3 class="text-lg font-bold text-blue-300 mb-4">编辑存储限制</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">当前限制</label>
                        <p class="text-white font-semibold">${this.formatStorageSize(currentLimit)}</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">新限制 (GB)</label>
                        <input type="number" id="new-storage-limit" min="1" max="1000" 
                               class="w-full p-3 bg-dark border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-400 outline-none"
                               value="${Math.round(currentLimit / (1024 * 1024 * 1024))}" />
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors" 
                            onclick="this.closest('.fixed').remove()">取消</button>
                    <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            onclick="window.uiManager.updateUserStorage('${uuid}')">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // 更新用户存储限制
    async updateUserStorage(uuid) {
        const newLimitInput = document.getElementById('new-storage-limit');
        if (!newLimitInput) return;

        const newLimitGB = parseInt(newLimitInput.value);
        if (!newLimitGB || newLimitGB < 1 || newLimitGB > 1000) {
            this.showMessage('请输入有效的存储限制 (1-1000 GB)', 'error');
            return;
        }

        const newLimitBytes = newLimitGB * 1024 * 1024 * 1024;

        try {
            const result = await this.api.updateUserStorage(uuid, newLimitBytes);
            
            if (result.success) {
                this.showMessage('存储限制更新成功', 'success');
                // 关闭对话框
                document.querySelector('.fixed').remove();
                // 重新加载用户列表
                this.loadUsersList();
            } else {
                this.showMessage(result.error || '更新失败', 'error');
            }
        } catch (error) {

            this.showMessage('更新失败', 'error');
        }
    }

    // 显示管理员存储管理界面
    showAdminStorageModal() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser || !currentUser.isAdmin) {
            this.showMessage('权限不足，需要管理员权限', 'error');
            return;
        }

        this.showMessage('存储管理功能开发中...', 'info');
    }

    // 检查并显示管理员菜单
    checkAndShowAdminMenu() {
        const adminMenu = document.getElementById('admin-menu');
        const settingsBtn = document.getElementById('settings-btn');
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        
        if (adminMenu && settingsBtn) {
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
            
            if (currentUser && currentUser.isAdmin) {
                // 管理员：显示设置按钮、管理员菜单和同步文档按钮
                settingsBtn.style.display = 'block';
                adminMenu.classList.remove('hidden');
                if (syncDocsBtn) {
                    syncDocsBtn.classList.remove('hidden');
                }
            } else {
                // 非管理员：隐藏设置按钮、管理员菜单和同步文档按钮
                settingsBtn.style.display = 'none';
                adminMenu.classList.add('hidden');
                if (syncDocsBtn) {
                    syncDocsBtn.classList.add('hidden');
                }
            }
        }
    }

    // 绑定管理员功能事件
    bindAdminEvents() {
        // 用户管理按钮
        const adminUsersBtn = document.getElementById('admin-users-btn');
        if (adminUsersBtn) {
            adminUsersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAdminUsersModal();
            });
        }
    }

    // 绑定同步文档事件
    bindSyncDocsEvents() {
        // 关闭同步文档模态框
        document.getElementById('close-sync-docs-btn')?.addEventListener('click', () => {
            this.hideSyncDocsModal();
        });

        // 取消同步文档
        document.getElementById('cancel-sync-docs-btn')?.addEventListener('click', () => {
            this.hideSyncDocsModal();
        });

        // 提交同步文档
        document.getElementById('submit-sync-docs-btn')?.addEventListener('click', () => {
            this.submitSyncDocs();
        });

        // 文档文件选择
        document.getElementById('doc-file-input')?.addEventListener('change', (e) => {
            this.handleDocFileSelect(e);
        });

        // 文档拖拽区域
        const docDropArea = document.getElementById('doc-drop-area');
        if (docDropArea) {
            docDropArea.addEventListener('click', () => {
                document.getElementById('doc-file-input')?.click();
            });

            docDropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                docDropArea.classList.add('border-emerald-light/60');
            });

            docDropArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                docDropArea.classList.remove('border-emerald-light/60');
            });

            docDropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                docDropArea.classList.remove('border-emerald-light/60');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleDocFileDrop(files[0]);
                }
            });
        }

        // 移除文档文件
        document.getElementById('doc-remove-file')?.addEventListener('click', () => {
            this.removeDocFile();
        });
    }

    // 显示同步文档模态框
    showSyncDocsModal() {
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
        if (!currentUser || !currentUser.isAdmin) {
            this.showMessage('权限不足，需要管理员权限', 'error');
            return;
        }

        const modal = document.getElementById('sync-docs-modal');
        if (modal) {
            modal.classList.remove('opacity-0', 'invisible');
            modal.classList.add('opacity-100', 'visible');
            modal.querySelector('.glass-effect').classList.remove('scale-95');
            modal.querySelector('.glass-effect').classList.add('scale-100');
        }
    }

    // 隐藏同步文档模态框
    hideSyncDocsModal() {
        const modal = document.getElementById('sync-docs-modal');
        if (modal) {
            modal.classList.add('opacity-0', 'invisible');
            modal.classList.remove('opacity-100', 'visible');
            modal.querySelector('.glass-effect').classList.add('scale-95');
            modal.querySelector('.glass-effect').classList.remove('scale-100');
            
            // 重置表单
            this.resetSyncDocsForm();
        }
    }

    // 重置同步文档表单
    resetSyncDocsForm() {
        document.getElementById('doc-title').value = '';
        document.getElementById('doc-category').value = '';
        document.getElementById('doc-order').value = '';
        document.getElementById('doc-file-input').value = '';
        document.getElementById('doc-file-info').classList.add('hidden');
        document.getElementById('doc-file-name').textContent = '';
    }

    // 处理文档文件选择
    handleDocFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleDocFile(file);
        }
    }

    // 处理文档文件拖放
    handleDocFileDrop(file) {
        this.handleDocFile(file);
    }

    // 处理文档文件
    handleDocFile(file) {
        if (!file.name.toLowerCase().endsWith('.md')) {
            this.showMessage('只支持上传.md格式的文件', 'error');
            return;
        }

        const fileInfo = document.getElementById('doc-file-info');
        const fileName = document.getElementById('doc-file-name');
        
        fileName.textContent = file.name;
        fileInfo.classList.remove('hidden');
        
        // 存储文件对象
        this.selectedDocFile = file;
    }

    // 移除文档文件
    removeDocFile() {
        document.getElementById('doc-file-info').classList.add('hidden');
        document.getElementById('doc-file-name').textContent = '';
        document.getElementById('doc-file-input').value = '';
        this.selectedDocFile = null;
    }

    // 提交同步文档
    async submitSyncDocs() {
        // 防止重复提交
        if (this.isSubmittingDoc) {
            return;
        }
        
        this.isSubmittingDoc = true;
        
        const title = document.getElementById('doc-title').value.trim();
        const category = document.getElementById('doc-category').value.trim();
        const order = document.getElementById('doc-order').value.trim();

        // 验证必填字段
        if (!title) {
            this.showMessage('请输入文档标题', 'error');
            this.isSubmittingDoc = false;
            return;
        }

        if (!category) {
            this.showMessage('请输入文档分类', 'error');
            this.isSubmittingDoc = false;
            return;
        }

        if (!this.selectedDocFile) {
            this.showMessage('请选择要上传的Markdown文件', 'error');
            this.isSubmittingDoc = false;
            return;
        }

        // 验证order字段
        let orderNum = 0;
        if (order) {
            orderNum = parseInt(order);
            if (isNaN(orderNum) || orderNum < 0) {
                this.showMessage('排序序号必须是数字且不能小于0', 'error');
                this.isSubmittingDoc = false;
                return;
            }
        }

        // 获取提交按钮和原始文本
        const submitBtn = document.getElementById('submit-sync-docs-btn');
        const originalText = submitBtn.innerHTML;

        try {
            // 创建FormData
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('order', orderNum.toString());
            formData.append('file', this.selectedDocFile);

            // 显示加载状态
            submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-1"></i> 同步中...';
            submitBtn.disabled = true;

            // 提交请求
            const result = await this.api.createDocument(formData);
            
            if (result.success) {
                this.showMessage('文档同步成功', 'success');
                this.hideSyncDocsModal();
                
                // 如果当前在外站文档分类，刷新文件列表
                if (this.currentCategory === 'external-docs') {
                    await this.loadExternalDocs();
                }
            } else {
                this.showMessage(result.error || '同步失败', 'error');
            }
        } catch (error) {
            this.showMessage('同步失败: ' + error.message, 'error');
        } finally {
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            this.isSubmittingDoc = false;
        }
    }

    // 加载外站文档
    async loadExternalDocs() {
        try {
            const documents = await this.api.getDocuments();
            this.renderExternalDocs(documents);
        } catch (error) {
            console.error('加载外站文档失败:', error);
            // 如果是权限问题，显示特殊提示
            if (error.message && error.message.includes('权限')) {
                this.showMessage('需要管理员权限才能访问外站文档', 'warning');
            } else {
                this.showMessage('加载外站文档失败', 'error');
            }
        }
    }

    // 渲染外站文档
    renderExternalDocs(documents) {
        const filesGrid = document.getElementById('files-grid');
        if (!filesGrid) return;

        // 确保documents是数组
        if (!documents || !Array.isArray(documents)) {
            documents = [];
        }

        // 隐藏默认空状态容器
        const defaultEmptyState = document.getElementById('empty-state');
        if (defaultEmptyState) {
            defaultEmptyState.classList.add('hidden');
        }

        // 隐藏所有非外站文档的文件卡片
        const existingFileCards = filesGrid.querySelectorAll('div:not([data-doc-id]):not(.external-docs-empty-state)');
        existingFileCards.forEach(card => {
            card.style.display = 'none';
        });

        // 移除外站文档空状态（如果存在）
        const existingExternalEmptyState = filesGrid.querySelector('.external-docs-empty-state');
        if (existingExternalEmptyState) {
            existingExternalEmptyState.remove();
        }

        // 移除现有的外站文档卡片
        const existingDocCards = filesGrid.querySelectorAll('[data-doc-id]');
        existingDocCards.forEach(card => {
            card.remove();
        });

        if (documents.length === 0) {
            // 添加外站文档空状态
            const emptyStateDiv = document.createElement('div');
            emptyStateDiv.className = 'col-span-full py-16 external-docs-empty-state';
            emptyStateDiv.style.minHeight = '400px';
            emptyStateDiv.innerHTML = `
                <div class="text-center max-w-md mx-auto">
                    <div class="w-24 h-24 mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse-slow mx-auto">
                        <i class="fa fa-book text-4xl text-emerald-500/70"></i>
                    </div>
                    <h2 class="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 mb-2">暂无外站文档</h2>
                    <p class="text-gray-400 mb-6">还没有同步任何文档。请点击顶栏的<span class="text-emerald-300 font-medium">同步文档</span>按钮来添加外站文档。</p>
                    <div class="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <i class="fa fa-info-circle"></i>
                        <span>只有管理员可以添加外站文档</span>
                    </div>
                </div>
            `;
            filesGrid.appendChild(emptyStateDiv);
            this.updateFileCount(0);
            return;
        }

        // 按order排序
        documents.sort((a, b) => a.order - b.order);

        // 添加外站文档卡片
        documents.forEach(doc => {
            const docCard = document.createElement('div');
            docCard.innerHTML = this.createDocumentCard(doc);
            const cardElement = docCard.firstElementChild;
            filesGrid.appendChild(cardElement);
            
            // 添加事件监听器
            this.addDocumentCardEventListeners(cardElement, doc);
        });

        this.updateFileCount(documents.length);
    }

    // 创建文档卡片
    createDocumentCard(doc) {
        return `
            <div class="file-card bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 rounded-xl p-4 border border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg backdrop-blur-sm cursor-pointer group" data-doc-id="${doc.id}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-lg flex items-center justify-center">
                            <i class="fa fa-book text-emerald-400 text-xl"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-white font-semibold truncate" title="${doc.title}">${doc.title}</h4>
                            <p class="text-emerald-300 text-sm">分类：${doc.category}</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <div class="flex items-center space-x-1">
                        <i class="fa fa-clock-o text-emerald-400"></i>
                    </div>
                    <span class="text-emerald-300 font-medium">${this.formatDate(doc.created_at)}</span>
                </div>
                
                <!-- 操作按钮 -->
                <div class="doc-actions flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button class="doc-preview-btn text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-500/10" title="预览">
                        <i class="fa fa-eye text-sm"></i>
                    </button>
                    <button class="doc-download-btn text-green-400 hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-500/10" title="下载">
                        <i class="fa fa-download text-sm"></i>
                    </button>
                    <button class="doc-delete-btn text-red-400 hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="删除">
                        <i class="fa fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // 添加文档卡片事件监听器
    addDocumentCardEventListeners(card, doc) {
        // 预览按钮
        card.querySelector('.doc-preview-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.previewExternalDocument(doc);
        });

        // 下载按钮
        card.querySelector('.doc-download-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadDocument(doc);
        });

        // 删除按钮
        card.querySelector('.doc-delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteDocument(doc);
        });
    }

    // 预览文档
    previewDocument(doc) {
        // 在新窗口打开文档
        const docUrl = `${doc.path}`;
        window.open(docUrl, '_blank');
    }

    // 下载文档
    downloadDocument(doc) {
        // 显示下载选项对话框
        const showDownloadOptions = () => {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
                modal.innerHTML = `
                    <div class="bg-dark-light rounded-xl p-6 w-full max-w-md shadow-2xl border border-emerald-400/30">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <i class="fa fa-download text-emerald-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-emerald-300">下载文档</h3>
                                <p class="text-gray-400 text-sm">选择下载格式</p>
                            </div>
                        </div>
                        
                        <div class="space-y-3 mb-6">
                            <button class="w-full p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-lg hover:bg-emerald-500/30 transition-colors text-left" 
                                    onclick="window.uiManager.downloadDocumentConfirm('complete')">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="text-emerald-300 font-medium">完整文档</div>
                                        <div class="text-gray-400 text-sm">包含元数据的完整Markdown文件</div>
                                    </div>
                                    <i class="fa fa-file-text-o text-emerald-400"></i>
                                </div>
                            </button>
                            
                            <button class="w-full p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-colors text-left"
                                    onclick="window.uiManager.downloadDocumentConfirm('content')">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="text-blue-300 font-medium">仅内容</div>
                                        <div class="text-gray-400 text-sm">仅文档内容，不包含元数据</div>
                                    </div>
                                    <i class="fa fa-file-o text-blue-400"></i>
                                </div>
                            </button>
                        </div>
                        
                        <div class="flex justify-end">
                            <button class="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors" 
                                    onclick="window.uiManager.downloadDocumentConfirm('cancel')">
                                取消
                            </button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // 绑定确认方法
                window.uiManager.downloadDocumentConfirm = (type) => {
                    modal.remove();
                    resolve(type);
                };
            });
        };

        // 显示选项并处理下载
        showDownloadOptions().then(async (type) => {
            if (type === 'cancel') return;
            
            if (type === 'complete') {
                // 下载完整文件（确保包含标准YAML frontmatter格式）
                try {
                    const response = await fetch(`${doc.path}`);
                    const content = await response.text();
                    
                    // 检查是否已经有完整的YAML frontmatter格式
                    const hasCompleteFrontmatter = /^---\s*\n[\s\S]*?\n---\s*\n/.test(content);
                    
                    let completeContent;
                    if (hasCompleteFrontmatter) {
                        // 如果已经有完整的frontmatter，直接使用原始内容
                        completeContent = content;
                    } else {
                        // 如果没有完整的frontmatter，生成标准的YAML frontmatter格式
                        const frontmatter = this.generateFrontmatter(doc.title, doc.category, doc.order);
                        const contentWithoutFrontmatter = this.removeFrontmatter(content);
                        completeContent = frontmatter + '\n' + contentWithoutFrontmatter;
                    }
                    
                    // 创建下载链接
                    const blob = new Blob([completeContent], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = doc.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    this.showMessage('下载失败: ' + error.message, 'error');
                }
            } else if (type === 'content') {
                // 下载仅内容版本
                try {
                    const response = await fetch(`${doc.path}`);
                    const content = await response.text();
                    
                    // 移除frontmatter
                    const contentOnly = this.removeFrontmatter(content);
                    
                    // 创建下载链接
                    const blob = new Blob([contentOnly], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = doc.filename.replace('.md', '_content.md');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    this.showMessage('下载失败: ' + error.message, 'error');
                }
            }
        });
    }

    // 移除frontmatter
    removeFrontmatter(content) {
        // 匹配frontmatter格式 (---开头和结尾)
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        return content.replace(frontmatterRegex, '');
    }

    // 生成完整的YAML frontmatter格式
    generateFrontmatter(title, category, order) {
        return `---
title: ${title}
category: ${category}
order: ${order}
---`;
    }

    // 删除文档
    async deleteDocument(doc) {
        const confirmDelete = () => {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
                modal.innerHTML = `
                    <div class="bg-dark-light rounded-xl p-6 w-full max-w-md shadow-2xl border border-red-400/30">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                <i class="fa fa-exclamation-triangle text-red-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-red-300">删除文档</h3>
                                <p class="text-gray-400 text-sm">此操作不可撤销</p>
                            </div>
                        </div>
                        
                        <p class="text-gray-300 mb-6">确定要删除文档 <strong class="text-white">${doc.title}</strong> 吗？</p>
                        
                        <div class="flex justify-end space-x-3">
                            <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors" 
                                    onclick="this.closest('.fixed').remove(); window.uiManager.deleteDocumentConfirm(false)">
                                取消
                            </button>
                            <button class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    onclick="window.uiManager.deleteDocumentConfirm(true)">
                                删除
                            </button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // 存储当前文档信息
                window.uiManager.currentDeleteDoc = doc;
                
                // 绑定确认删除方法
                window.uiManager.deleteDocumentConfirm = (confirmed) => {
                    modal.remove();
                    resolve(confirmed);
                };
            });
        };

        const confirmed = await confirmDelete();
        if (!confirmed) return;

        try {
            const result = await this.api.deleteDocument(doc.id);
            
            if (result.success) {
                this.showMessage('文档删除成功', 'success');
                
                // 重新加载外站文档
                await this.loadExternalDocs();
            } else {
                this.showMessage(result.error || '删除失败', 'error');
            }
        } catch (error) {
            this.showMessage('删除失败: ' + error.message, 'error');
        }
    }

    // 处理图片加载错误
    handleImageError(imgElement, fallbackSrc = '/static/public/docs.png') {
        imgElement.onerror = function() {
            this.src = fallbackSrc;
            this.onerror = null; // 防止无限循环
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
                return `/uploads/image/${file.name}`;
            } else {
                // 非图片文件使用默认图标
                return `/static/public/docs.png`;
            }
        }
        
        // 默认返回文档图标
        return `/static/public/docs.png`;
    }
}

// 导出UI管理器
window.UIManager = UIManager; 
