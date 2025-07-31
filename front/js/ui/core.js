/**
 * UI核心模块
 * 处理基础初始化、事件监听和核心功能
 */
if (typeof UICore === 'undefined') {
    class UICore {
        constructor() {
            this.uiManager = null; // 将在UIManager中设置
            this.api = window.apiSystem || window.apiManager; // 获取API引用
        }

        /**
         * 初始化UI核心模块
         */
        init() {
            try {
                // 设置全局工具
                this.setupGlobalUtils();
                
                // 绑定事件
                this.setupEventListeners();
                
                // 上传按钮事件现在由UIManager统一处理，移除此处调用
                // this.bindUploadBtn();
                
            } catch (error) {
                console.error('❌ UI核心模块初始化失败:', error);
            }
        }

        /**
         * 设置全局工具函数
         */
        setupGlobalUtils() {
            // 设置全局工具函数
            window.showMessage = (message, type = 'info') => {
                if (this.uiManager) {
                    this.uiManager.showMessage(message, type);
                }
            };

            window.showLoading = (show = true) => {
                if (this.uiManager) {
                    this.uiManager.showLoading(show);
                }
            };

            // 设置全局API引用
            window.api = this.api;
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

        // 设置事件监听器
        setupEventListeners() {
            // 空状态上传按钮事件
            document.getElementById('empty-upload-btn')?.addEventListener('click', () => {
                if (this.uiManager && typeof this.uiManager.showUploadArea === 'function') {
                    this.uiManager.showUploadArea();
                }
            });

            // 关闭上传区域按钮
            document.getElementById('close-upload-btn')?.addEventListener('click', () => {
                if (this.uiManager && typeof this.uiManager.hideUploadArea === 'function') {
                    this.uiManager.hideUploadArea();
                }
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
                if (this.uiManager && this.uiManager.uploadManager && typeof this.uiManager.uploadManager.handleFileSelect === 'function') {
                    this.uiManager.uploadManager.handleFileSelect(e);
                }
            });
            
            // 动态设置文件输入框的multiple属性
            if (this.uiManager && typeof this.uiManager.updateFileInputMultiple === 'function') {
                this.uiManager.updateFileInputMultiple();
            }
            
            // 添加文件输入框点击事件，动态设置multiple属性
            document.getElementById('file-input')?.addEventListener('click', () => {
                if (this.uiManager && typeof this.uiManager.updateFileInputMultiple === 'function') {
                    this.uiManager.updateFileInputMultiple();
                }
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
                    if (this.uiManager && this.uiManager.uploadManager && typeof this.uiManager.uploadManager.addFilesToQueue === 'function') {
                        // 只添加到队列，不自动上传
                        this.uiManager.uploadManager.addFilesToQueue(Array.from(files));
                    }
                });
            }

            // 搜索功能
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        if (this.uiManager && typeof this.uiManager.handleSearch === 'function') {
                            this.uiManager.handleSearch(e.target.value);
                        }
                    }, 500);
                });

                // 清空按钮功能
                const clearButton = document.getElementById('search-clear-btn');
                if (clearButton) {
                    clearButton.addEventListener('click', () => {
                        searchInput.value = '';
                        clearButton.classList.add('hidden');
                        if (this.uiManager && typeof this.uiManager.handleSearch === 'function') {
                            this.uiManager.handleSearch('');
                        }
                    });

                    // 监听输入事件来控制清空按钮的显示
                    searchInput.addEventListener('input', (e) => {
                        if (e.target.value.trim().length > 0) {
                            clearButton.classList.remove('hidden');
                        } else {
                            clearButton.classList.add('hidden');
                        }
                    });
                }
            }

            // 文件类型过滤按钮事件由categories.js统一处理
            // 避免重复绑定事件

            // 新建文件夹按钮事件由categories.js统一处理，避免重复绑定
            // document.getElementById('create-folder-main-btn')?.addEventListener('click', () => {
            //     if (this.uiManager) {
            //         this.uiManager.showCreateFolderModal();
            //     }
            // });

            // 个人资料按钮
            const profileBtn = document.getElementById('profile-btn');
            profileBtn?.addEventListener('click', (e) => {
                e.preventDefault(); // 阻止默认行为
                if (this.uiManager && typeof this.uiManager.showProfileModal === 'function') {
                    this.uiManager.showProfileModal();
                } else {
                    console.error('❌ UICore - showProfileModal方法未找到');
                }
            });

            // 设置按钮
            const settingsBtn = document.getElementById('settings-btn');
            settingsBtn?.addEventListener('click', () => {
                // 设置按钮只有管理员才能看到，所以不需要再次检查权限
                if (this.uiManager && typeof this.uiManager.showSettingsModal === 'function') {
                    this.uiManager.showSettingsModal();
                } else {
                    console.error('❌ UICore - showSettingsModal方法未找到');
                }
            });

            // 管理员更新日志管理按钮
            const adminUpdateLogsBtn = document.getElementById('admin-update-logs-btn');
            adminUpdateLogsBtn?.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.uiManager && this.uiManager.adminManager && typeof this.uiManager.adminManager.switchAdminView === 'function') {
                    this.uiManager.adminManager.switchAdminView('update-logs');
                } else {
                    console.error('❌ UICore - adminManager.switchAdminView方法未找到');
                }
            });

            // 登出按钮事件由App统一处理，避免重复绑定
            // document.getElementById('logout-btn')?.addEventListener('click', () => {
            //     if (this.uiManager) {
            //         this.uiManager.logout();
            //     }
            // });

            // 返回按钮
            document.getElementById('back-btn')?.addEventListener('click', () => {
                if (this.uiManager && typeof this.uiManager.goBackToAllFiles === 'function') {
                    this.uiManager.goBackToAllFiles();
                }
            });
        }

        // 设置登录表单
        setupLoginForm() {
            // 登录表单事件由其他模块处理
        }

        // 加载用户数据
        async loadUserData(userData) {
            try {
                // 初始化用户个人资料（包括头像显示）
                if (this.uiManager) {
                    this.uiManager.initUserProfile(userData);
                }
                
                // 从后端获取所有数据（不传递folderId，获取所有文件）
                const [files, urlFiles, folders, storageInfo] = await Promise.all([
                    this.api.files.getFiles(),
                    this.api.urlFiles.getUrlFiles(),
                    this.api.folders.getFolders(),
                    this.api.storage.getStorageInfo()
                ]);

                // 保存文件夹数据
                this.folders = folders;
                
                // 合并普通文件和URL文件，并缓存所有文件数据
                this.allFiles = [...files, ...urlFiles];

                // 直接使用API返回的所有文件
                const allDisplayFiles = [...files, ...urlFiles];

                // 更新界面
                this.updateFileCount(allDisplayFiles.length);
                this.renderFileList(allDisplayFiles);
                // 文件夹列表由app.js统一处理，避免重复渲染

                // 保存存储信息到本地缓存
                if (storageInfo && window.StorageManager && typeof window.StorageManager.setStorageInfo === 'function') {
                    window.StorageManager.setStorageInfo(storageInfo);
                }

                // 更新存储空间显示
                this.updateStorageDisplay(storageInfo);

                // 初始化拖拽功能
                this.setupDragAndDrop();

            } catch (error) {
                this.showMessage('数据加载失败', 'error');
            }
        }

        // 显示主界面
        showMainInterface() {
            const loginPage = document.getElementById('login-page');
            const app = document.getElementById('app');
            
            if (loginPage) loginPage.classList.add('hidden');
            if (app) app.classList.remove('hidden');
        }

        // 显示登录界面
        showLoginInterface() {
            const loginPage = document.getElementById('login-page');
            const app = document.getElementById('app');
            
            if (loginPage) loginPage.classList.remove('hidden');
            if (app) app.classList.add('hidden');
        }

        /**
         * 绑定上传按钮事件
         */
        bindUploadBtn() {
            const uploadBtn = document.getElementById('upload-btn');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', (event) => {
                    // 阻止默认行为，确保不会触发任何文件选择
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // 调用UIManager的showUploadModal方法
                    if (this.uiManager && typeof this.uiManager.showUploadModal === 'function') {
                        this.uiManager.showUploadModal();
                    }
                });
            }
        }

        /**
         * 检查并显示管理员菜单
         */
        checkAndShowAdminMenu() {
            // 检查是否有管理员管理器
            if (window.uiManager && window.uiManager.adminManager) {
                window.uiManager.adminManager.checkAdminPermissions();
            }
        }
        /**
         * 更新文件数量显示
         */
        updateFileCount(count) {
            const fileCountElement = document.getElementById('file-count');
            if (fileCountElement) {
                fileCountElement.textContent = count;
            }
        }

        /**
         * 渲染文件列表
         */
        renderFileList(files) {
            if (this.uiManager) {
                this.uiManager.renderFileList(files);
            }
        }

        /**
         * 更新存储信息显示
         */
        updateStorageDisplay(storageInfo) {
            if (this.uiManager) {
                this.uiManager.updateStorageDisplay(storageInfo);
            }
        }

        /**
         * 设置拖拽功能
         */
        setupDragAndDrop() {
            // 拖拽功能已经在其他地方实现，这里不需要重复设置
            // if (this.uiManager) {
            //     this.uiManager.setupDragAndDrop();
            // }
        }

        /**
         * 显示消息
         */
        showMessage(message, type = 'info') {
            if (this.uiManager) {
                this.uiManager.showMessage(message, type);
            }
        }
    }

    // 暴露到全局作用域
    window.UICore = UICore;
} 
