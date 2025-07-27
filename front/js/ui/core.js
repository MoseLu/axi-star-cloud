/**
 * UI核心模块
 * 处理基础初始化、事件监听和核心功能
 */
class UICore {
    constructor() {
        this.uiManager = null; // 将在UIManager中设置
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
            if (this.uiManager) {
                this.uiManager.initializeFileTypeButtons();
            }
            
            // 强制设置新建分组按钮初始状态
            if (this.uiManager) {
                this.uiManager.forceUpdateCreateFolderButton();
            }
            
            // 登录状态检测由App统一处理，避免重复调用
            
            // 初始化用户头像显示
            if (this.uiManager) {
                await this.uiManager.initUserProfile();
            }
            
            // 初始化上传区域提示信息
            if (this.uiManager) {
                this.uiManager.updateUploadAreaHint();
            }
            
            // 绑定管理员功能事件
            if (this.uiManager) {
                this.uiManager.bindAdminEvents();
            }
            
            // 绑定同步文档事件
            if (this.uiManager) {
                this.uiManager.bindSyncDocsEvents();
            }
            
            // 检查并显示管理员菜单
            if (this.uiManager) {
                this.uiManager.checkAndShowAdminMenu().catch(error => {
                    console.error('检查管理员权限失败:', error);
                });
            }
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

    // 设置事件监听器
    setupEventListeners() {
        // 移除重复的登录成功事件监听，由App统一处理
        // window.addEventListener('loginSuccess', (event) => {
        //     this.onLoginSuccess(event.detail);
        // });

        // 上传按钮事件（已由index.js统一绑定弹窗上传，移除此处绑定）
        // document.getElementById('upload-btn')?.addEventListener('click', () => {
        //     const fileInput = document.getElementById('file-input');
        //     if (fileInput) {
        //         fileInput.click();
        //     }
        // });
        
        // 空状态上传按钮事件
        document.getElementById('empty-upload-btn')?.addEventListener('click', () => {
            if (this.uiManager) {
                this.uiManager.showUploadArea();
            }
        });

        // 同步文档按钮事件 - 由docs-sync模块处理，避免重复绑定
        // document.getElementById('sync-docs-btn')?.addEventListener('click', () => {
        //     if (this.uiManager) {
        //         this.uiManager.showSyncDocsModal();
        //     }
        // });

        // 关闭上传区域按钮
        document.getElementById('close-upload-btn')?.addEventListener('click', () => {
            if (this.uiManager) {
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
            if (this.uiManager && this.uiManager.uploadManager) {
                this.uiManager.uploadManager.handleFileSelect(e);
            }
        });
        
        // 动态设置文件输入框的multiple属性
        if (this.uiManager) {
            this.uiManager.updateFileInputMultiple();
        }
        
        // 添加文件输入框点击事件，动态设置multiple属性
        document.getElementById('file-input')?.addEventListener('click', () => {
            if (this.uiManager) {
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
                if (this.uiManager) {
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
                    if (this.uiManager) {
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
                    if (this.uiManager) {
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
        document.getElementById('profile-btn')?.addEventListener('click', (e) => {
            e.preventDefault(); // 阻止默认行为
            if (this.uiManager) {
                this.uiManager.showProfileModal();
            }
        });

        // 设置按钮
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            // 设置按钮只有管理员才能看到，所以不需要再次检查权限
            if (this.uiManager) {
                this.uiManager.showSettingsModal();
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
            if (this.uiManager) {
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
            const [files, urlFiles, folders] = await Promise.all([
                this.api.files.getFiles(),
                this.api.urlFiles.getUrlFiles(),
                this.api.folders.getFolders()
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

            // 获取并更新存储信息
            const storageInfo = await this.api.storage.getStorageInfo();
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
}

// 暴露到全局作用域
window.UICore = UICore; 