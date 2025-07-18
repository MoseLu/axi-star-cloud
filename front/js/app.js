// 主应用模块 - 初始化所有模块并协调它们的工作
class App {
    constructor() {
        this.authManager = null;
        this.apiManager = null;
        this.uiManager = null;
        this.init();
    }

    async init() {
        try {
    
            
            // 先初始化API管理器，确保AuthManager可以访问
            this.apiManager = new ApiManager();
            window.apiManager = this.apiManager;

            
            // 使用已存在的AuthManager实例，避免重复初始化
            this.authManager = window.authManager || new AuthManager();
            window.authManager = this.authManager;
            
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
        console.log('App.checkLoginStatus 开始检查登录状态');
        
        // 从localStorage获取用户信息
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                console.log('找到已保存的用户信息:', userData.username);
                
                // 确保API管理器存在并设置用户信息
                if (this.apiManager) {
                    console.log('设置API管理器用户信息:', userData.username);
                    this.apiManager.setCurrentUser(userData);
                    
                    // 验证用户信息是否正确设置
                    const currentUser = this.apiManager.getCurrentUser();
                    const userId = this.apiManager.getCurrentUserId();
                    console.log('API管理器当前用户:', currentUser);
                    console.log('API管理器用户ID:', userId);
                } else {
                    console.error('API管理器不存在');
                    return;
                }
                
                // 显示主界面
                this.showMainInterface();
                this.updateUserDisplay(userData);
                
                // 检查并显示管理员菜单
                if (this.uiManager) {
                    this.uiManager.checkAndShowAdminMenu();
                }
                
                // 延迟加载用户数据，确保UI管理器已初始化
                setTimeout(async () => {
                    if (this.uiManager) {
                        console.log('开始加载用户数据...');
                        try {
                            await this.uiManager.onLoginSuccess(userData);
                            console.log('用户数据加载完成');
                        } catch (error) {
                            console.error('加载用户数据失败:', error);
                        }
                    } else {
                        console.error('UI管理器不存在');
                    }
                }, 300); // 增加延迟时间，确保所有组件都已初始化
                
            } catch (error) {
                console.error('解析用户信息失败:', error);
                localStorage.removeItem('currentUser');
                this.showLoginInterface();
            }
        } else {
            console.log('没有找到已保存的用户信息');
            this.showLoginInterface();
        }
    }

    // 加载用户数据
    async loadUserData(userData) {
        try {

            
            // 并行加载文件列表、文件夹列表和总文件数
            const [files, folders, totalFileCount] = await Promise.all([
                this.apiManager.getFiles(),
                this.apiManager.getFolders(),
                this.apiManager.getTotalFileCount()
            ]);
            

            
            // 更新UI管理器的数据
            if (this.uiManager) {
                this.uiManager.allFiles = files;
                this.uiManager.folders = folders;
                this.uiManager.totalFileCount = totalFileCount; // 保存总文件数
                
                // 更新文件列表显示
                this.uiManager.updateFileCount(files.length);
                this.uiManager.renderFileList(files);
                
                // 更新文件夹列表显示
                this.uiManager.renderFolderList(folders);
                
                // 更新存储信息
                const storageInfo = await this.apiManager.getStorageInfo();
                this.uiManager.updateStorageDisplay(storageInfo);
            }
            

            
        } catch (error) {

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
    }

    // 登录成功处理
    async onLoginSuccess(userData) {
        console.log('App.onLoginSuccess 开始处理登录成功');
        
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
        
        // 只调用UIManager的onLoginSuccess方法，避免重复加载数据
        if (this.uiManager) {
            await this.uiManager.onLoginSuccess(userData);
        }
        
        console.log('App.onLoginSuccess 处理完成');
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