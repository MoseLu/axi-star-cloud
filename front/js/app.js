// 主应用模块 - 初始化所有模块并协调它们的工作
class App {
    constructor() {
        this.authManager = null;
        this.apiManager = null;
        this.uiManager = null;
        this.isInitialized = false;
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
        

    }

    async init() {
        try {
            // 等待API系统初始化
            await this.waitForApiSystem();
            
            // 使用新的API系统，确保向后兼容
            this.apiManager = window.apiSystem || window.apiManager;
            if (!this.apiManager) {
        
                return;
            }

            // 使用已存在的认证系统实例，避免重复初始化
            this.authManager = window.authSystem || window.authManager;
            if (!this.authManager) {
        
                return;
            }
            
            this.uiManager = new UIManager();
            window.uiManager = this.uiManager;
            // 绑定上传按钮弹窗事件
            this.uiManager.bindUploadBtn();

            // 设置全局showMessage函数
            window.showMessage = (message, type = 'info') => {
                if (window.Notify && typeof window.Notify.show === 'function') {
                    window.Notify.show({ message, type });
                        } else {
            // 降级处理：如果其他消息系统不可用，静默处理
        }
            };

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

                // 验证用户数据完整性
                if (!userData.uuid || !userData.username) {
                    console.error('用户数据不完整，清除登录状态');
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('userData');
                    this.showLoginInterface();
                    return;
                }

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
                
                // 显示主界面（静默登录，不显示消息）
                this.showMainInterface();
                this.updateUserDisplay(userData);
                
                // 检查并显示管理员菜单
                if (this.uiManager) {
                    this.uiManager.checkAndShowAdminMenu();
                }
                
                // 加载用户数据（静默加载，不显示登录成功消息）
                this.loadUserData(userData);
            } catch (error) {
                console.error('解析用户数据失败:', error);
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userData');
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
    
                return;
            }
            
            // 拉取所有数据
            const [files, urlFiles, folders, storageInfo, profile, totalFileCount] = await Promise.all([
                this.apiManager.getFiles(),
                this.apiManager.getUrlFiles(),
                this.apiManager.getFolders(),
                this.apiManager.getStorageInfo(),
                this.apiManager.getProfile(),
                this.apiManager.getTotalFileCount()
            ]);
            
            // 更新UIManager缓存
            this.uiManager.allFiles = [...files, ...urlFiles];
            this.uiManager.folders = folders;
            this.uiManager.totalFileCount = totalFileCount;
            this.uiManager.storageInfo = storageInfo;
            this.uiManager.profile = profile;
            
            // 等待组件加载完成后再渲染文件列表
            const waitForFileListComponent = () => {
                return new Promise((resolve) => {
                    const checkFileListComponent = () => {
                        const fileListContainer = document.getElementById('file-list-container');
                        const filesGrid = document.getElementById('files-grid');
                        if (fileListContainer && fileListContainer.children.length > 0 && filesGrid) {
                            resolve();
                        } else {
                            setTimeout(checkFileListComponent, 100);
                        }
                    };
                    checkFileListComponent();
                });
            };
            
            // 等待文件列表组件加载完成
            await waitForFileListComponent();
            
            // 渲染文件列表和统计
            this.uiManager.renderFileList(this.uiManager.allFiles);
            
            // 渲染文件夹 - 确保folders是数组
            if (folders && Array.isArray(folders)) {
                this.uiManager.folders = folders; // 保存到uiManager中
            } else {
                this.uiManager.folders = [];
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
            
            // 在组件加载完成后渲染文件夹列表
            if (this.uiManager && this.uiManager.folders) {
                await this.uiManager.renderFolderList(this.uiManager.folders);
            }
            
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
        // 先移除已存在的事件监听器，避免重复绑定
        if (this.handleLoginSuccess) {
            window.removeEventListener('loginSuccess', this.handleLoginSuccess);
        }
        
        // 登录成功事件监听
        this.handleLoginSuccess = async (event) => {
            await this.onLoginSuccess(event.detail);
        };
        
        window.addEventListener('loginSuccess', this.handleLoginSuccess);

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
        
        // 显示登录成功消息
        if (window.Notify) {
            window.Notify.show({ message: '登录成功', type: 'success' });
        }
    }

    // 退出登录
    async logout() {
        // 获取当前用户ID
        const currentUser = localStorage.getItem('currentUser');
        let userId = null;
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                userId = user.uuid;
            } catch (error) {
                console.error('解析用户数据失败:', error);
            }
        }
        
        // 调用退出登录API更新最后登录时间
        if (userId) {
            try {
                await window.apiGateway.post(`/api/logout?user_id=${userId}`);
            } catch (error) {
                console.error('调用退出登录API失败:', error);
            }
        }
        
        // 调用AuthManager的清除方法
        if (this.authManager) {
            this.authManager.clearLoginData();
        }
        
        // 清除API管理器的用户信息
        if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
            this.apiManager.setCurrentUser(null);
        } else {
            // 静默处理错误
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