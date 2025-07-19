// 主应用模块 - 初始化所有模块并协调它们的工作
class App {
    constructor() {
        this.authManager = null;
        this.apiManager = null;
        this.uiManager = null;
        this.init();
    }

    // 等待API系统初始化
    async waitForApiSystem() {
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒
        
        while (attempts < maxAttempts) {
            if (window.apiSystem && window.apiSystem.isInitialized) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('API system initialization timeout');
    }

    async init() {
        try {
            // 等待API系统初始化
            await this.waitForApiSystem();
            
            // 使用新的API系统，确保向后兼容
            this.apiManager = window.apiSystem || window.apiManager;
            if (!this.apiManager) {
                console.error('API system not initialized');
                return;
            }

            // 使用已存在的认证系统实例，避免重复初始化
            this.authManager = window.authSystem || window.authManager;
            if (!this.authManager) {
                console.error('Auth system not initialized');
                return;
            }
            
            this.uiManager = new UIManager();
            window.uiManager = this.uiManager;



            // 初始化日期显示
            this.initDateDisplay();

            // 设置登录表单事件
            this.setupLoginForm();

            // 设置其他事件监听器
            this.setupEventListeners();

            // 检查登录状态
            this.checkLoginStatus();

        } catch (error) {

        }
    }

    // 检查登录状态
    checkLoginStatus() {
        
        
        // 从localStorage获取用户信息
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
    
                
                // 更新API管理器的用户信息
                if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
                    this.apiManager.setCurrentUser(userData);
    
                } else {

                    // 延迟重试
                    setTimeout(() => {
                        if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
                            this.apiManager.setCurrentUser(userData);
        
                        }
                    }, 100);
                }
                
                // 显示主界面
            this.showMainInterface();
                this.updateUserDisplay(userData);
                
                // 检查并显示管理员菜单
                if (this.uiManager) {
                    this.uiManager.checkAndShowAdminMenu();
                }
                
                // 加载用户数据
                this.loadUserData(userData);
                
            } catch (error) {
    
                localStorage.removeItem('currentUser');
                this.showLoginInterface();
            }
        } else {

            this.showLoginInterface();
        }
    }

    // 加载用户数据（只从接口拉取，全部同步到UIManager缓存）
    async loadUserData(userData) {
        try {
            if (!this.uiManager || !this.apiManager) {
                console.error('❌ UI管理器或API管理器未初始化');
                return;
            }
            
            console.log('🔄 开始加载用户数据...');
            
            // 拉取所有数据
            const [files, urlFiles, folders, storageInfo, profile, totalFileCount] = await Promise.all([
                this.apiManager.getFiles(),
                this.apiManager.getUrlFiles(),
                this.apiManager.getFolders(),
                this.apiManager.getStorageInfo(),
                this.apiManager.getProfile(),
                this.apiManager.getTotalFileCount()
            ]);
            
            console.log('📊 数据加载完成:', {
                files: files.length,
                urlFiles: urlFiles.length,
                folders: folders.length,
                storageInfo,
                profile,
                totalFileCount
            });
            
            // 更新UIManager缓存
            this.uiManager.allFiles = [...files, ...urlFiles];
            this.uiManager.folders = folders;
            this.uiManager.totalFileCount = totalFileCount;
            this.uiManager.storageInfo = storageInfo;
            this.uiManager.profile = profile;
            
            console.log('💾 缓存更新完成:', {
                allFiles: this.uiManager.allFiles.length,
                totalFileCount: this.uiManager.totalFileCount,
                storageInfo: this.uiManager.storageInfo
            });
            
            // 渲染文件列表和统计
            this.uiManager.renderFileList(this.uiManager.allFiles);
            
            // 渲染文件夹 - 确保folders是数组
            if (folders && Array.isArray(folders)) {
                console.log('📁 渲染文件夹列表，数量:', folders.length);
                this.uiManager.renderFolderList(folders);
            } else {
                console.warn('⚠️ 文件夹数据格式异常:', folders);
                this.uiManager.renderFolderList([]);
            }
            
            // 等待组件加载完成后再更新存储空间显示
            const waitForComponents = () => {
                return new Promise((resolve) => {
                    const checkComponents = () => {
                        const storageContainer = document.getElementById('storage-overview-container');
                        const welcomeContainer = document.getElementById('welcome-section-container');
                        const fileTypeContainer = document.getElementById('file-type-filters-container');
                        if (storageContainer && storageContainer.children.length > 0 && 
                            welcomeContainer && welcomeContainer.children.length > 0 &&
                            fileTypeContainer && fileTypeContainer.children.length > 0) {
                            resolve();
                        } else {
                            setTimeout(checkComponents, 100);
                        }
                    };
                    checkComponents();
                });
            };
            
            // 等待组件加载完成
            await waitForComponents();
            
            // 更新头像和用户名（在组件加载完成后）
            this.uiManager.updateProfileDisplay(profile);
            
            // 更新文件统计（在组件加载完成后）
            this.uiManager.updateFileCount(this.uiManager.allFiles.length, this.uiManager.totalFileCount);
            
            // 更新存储空间显示
            this.uiManager.updateStorageDisplay(storageInfo);
            
            // 在组件加载完成后再次渲染文件夹列表
            if (this.uiManager && this.uiManager.folders) {
                console.log('🔄 组件加载完成，强制渲染文件夹列表');
                await this.uiManager.renderFolderList(this.uiManager.folders);
            }
            
            console.log('✅ 用户数据加载和渲染完成');
        } catch (error) {
            console.error('❌ 加载用户数据失败:', error);
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

    // 更新用户显示
    updateUserDisplay(user) {
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) {
            userName.textContent = user.username;
            // 确保金色渐变样式保持
            userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
        }
        
        if (userAvatar && user.avatar) {
            // 构建头像URL
            let avatarUrl = null;
            if (window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                avatarUrl = window.APP_UTILS.buildAvatarUrl(user.avatar);
            }
            
            if (avatarUrl) {
                userAvatar.src = avatarUrl;
            }
            // 如果avatarUrl为null，不设置src，避免404错误
        }
    }

    // 初始化日期显示
    initDateDisplay() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('zh-CN', options);
        } else {
            // 如果元素不存在，延迟重试
            setTimeout(() => {
                this.initDateDisplay();
            }, 100);
        }
    }

    // 设置登录表单 - 由 UIManager 处理
    setupLoginForm() {
        // 登录表单事件由 UIManager 处理，避免重复绑定
    }

    // 设置事件监听器
    setupEventListeners() {
        // 登录成功事件监听
        
        window.addEventListener('loginSuccess', async (event) => {

            await this.onLoginSuccess(event.detail);
        });

        // 退出登录事件
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // 设置按钮事件
        document.getElementById('settings-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.uiManager) {
                this.uiManager.showSettingsModal();
            }
        });

        // 监听组件加载完成事件
        document.addEventListener('componentsLoaded', (event) => {
            this.initDateDisplay();
        });
    }

    // 登录成功处理
    async onLoginSuccess(userData) {
        // 同步用户信息到API管理器
        if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
            this.apiManager.setCurrentUser(userData);
        }
        // 更新用户显示
        this.updateUserDisplay(userData);
        // 显示主界面
        this.showMainInterface();
        // 检查并显示管理员菜单
        if (this.uiManager) {
            this.uiManager.checkAndShowAdminMenu();
        }
        // 拉取所有数据并同步到UIManager缓存
        await this.loadUserData(userData);
        // 设置日期显示
        this.initDateDisplay();
        console.log('✅ 登录成功处理完成');
    }

    // 退出登录
    logout() {
        
        
        // 调用AuthManager的清除方法
        if (this.authManager) {
            this.authManager.clearLoginData();
        }
        
        // 清除API管理器的用户信息
        if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
            this.apiManager.setCurrentUser(null);

        } else {
            
        }
        
        // 清除UI管理器的数据
        if (this.uiManager) {
            this.uiManager.allFiles = [];
            this.uiManager.folders = [];
            this.uiManager.renderFileList([]);
            this.uiManager.renderFolderList([]);
            this.uiManager.updateFileCount(0);
        }
        
        // 显示登录界面
        this.showLoginInterface();
        
        // 显示退出通知
        if (window.Notify) {
            window.Notify.show({ message: '已退出登录', type: 'info' });
        }
        
        
    }
}

// 应用初始化由index.html中的模板加载完成后调用 