/**
 * 认证管理模块
 * 负责登录状态管理、用户认证和界面切换
 */
class AppAuthManager {
    constructor(appCore) {
        this.appCore = appCore;
        this.authManager = appCore.authManager;
        this.apiManager = appCore.apiManager;
        this.uiManager = appCore.uiManager;
        this.init();
    }

    /**
     * 初始化认证管理
     */
    init() {
        this.setupLoginForm();
        this.setupEventListeners();
        this.setupVisibilityChangeListener();
        // 异步检查登录状态
        this.checkLoginStatus().catch(error => {
            console.error('检查登录状态失败:', error);
        });
    }

    /**
     * 设置登录表单
     */
    setupLoginForm() {
        // 登录表单事件由 UIManager 处理，避免重复绑定
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 先移除已存在的事件监听器，避免重复绑定
        if (this.handleLoginSuccess) {
            document.removeEventListener('loginSuccess', this.handleLoginSuccess);
        }
        
        // 登录成功事件监听
        this.handleLoginSuccess = async (event) => {
            await this.onLoginSuccess(event.detail);
        };
        
        document.addEventListener('loginSuccess', this.handleLoginSuccess);

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

    /**
     * 设置页面可见性变化监听器
     */
    setupVisibilityChangeListener() {
        // 监听页面可见性变化，当页面重新获得焦点时恢复用户信息
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // 页面重新可见时，检查并恢复用户信息
                setTimeout(() => {
                    this.checkAndRestoreUserInfo();
                }, 100);
            }
        });
    }

    /**
     * 检查并恢复用户信息
     */
    async checkAndRestoreUserInfo() {
        try {
            // 检查是否有用户信息但界面显示异常
            const userData = this.getUserFromStorage();
            if (userData && userData.username) {
                // 检查用户名是否显示
                const userName = document.getElementById('user-name');
                if (userName && userName.textContent !== userData.username) {
                    console.log('检测到用户信息显示异常，正在恢复...');
                    this.updateUserDisplayImmediately();
                    
                    // 如果是管理员，恢复管理员权限
                    if (userData.username === 'Mose' && this.uiManager) {
                        await this.uiManager.restoreAdminMenuAfterForceRefresh();
                    }
                }
                
                // 检查欢迎模块是否显示正确
                const welcomeMessage = document.getElementById('welcome-message');
                if (welcomeMessage && !welcomeMessage.textContent.includes(userData.username)) {
                    console.log('检测到欢迎模块显示异常，正在恢复...');
                    welcomeMessage.textContent = `欢迎回来，${userData.username}`;
                }
                
                // 检查文件统计是否显示
                const fileCountElement = document.getElementById('file-count');
                if (fileCountElement && fileCountElement.textContent === '0' && this.uiManager && this.uiManager.allFiles) {
                    console.log('检测到文件统计显示异常，正在恢复...');
                    fileCountElement.textContent = this.uiManager.allFiles.length;
                }
            }
        } catch (error) {
            console.error('检查并恢复用户信息失败:', error);
        }
    }

    /**
     * 调试登录状态
     */
    debugLoginStatus() {
        console.log('=== 登录状态调试信息 ===');
        
        // 检查用户信息
        const userData = this.getUserFromStorage();
        console.log('用户信息:', userData);
        
        // 检查token状态
        if (window.tokenManager && typeof window.tokenManager.debugCookies === 'function') {
            const cookieStatus = window.tokenManager.debugCookies();
            console.log('Cookie状态:', cookieStatus);
        }
        
        // 检查UI管理器状态
        if (this.uiManager) {
            console.log('UI管理器状态:', {
                allFiles: this.uiManager.allFiles?.length || 0,
                folders: this.uiManager.folders?.length || 0,
                profile: this.uiManager.profile,
                storageInfo: this.uiManager.storageInfo,
                adminManager: this.uiManager.adminManager ? '已初始化' : '未初始化'
            });
            
            // 检查管理员状态
            if (this.uiManager.adminManager) {
                console.log('管理员状态:', {
                    isAdmin: this.uiManager.adminManager.isAdmin,
                    currentUser: this.uiManager.adminManager.getCurrentUser()
                });
            }
        }
        
        // 检查API管理器状态
        if (this.apiManager) {
            console.log('API管理器状态:', {
                currentUser: this.apiManager.currentUser,
                baseUrl: this.apiManager.baseUrl
            });
        }
        
        // 检查DOM元素状态
        const domStatus = {
            loginPage: !!document.getElementById('login-page'),
            app: !!document.getElementById('app'),
            welcomeMessage: !!document.getElementById('welcome-message'),
            fileCount: !!document.getElementById('file-count'),
            userAvatar: !!document.getElementById('user-avatar'),
            userName: !!document.getElementById('user-name'),
            adminMenu: !!document.getElementById('admin-menu'),
            settingsBtn: !!document.getElementById('settings-btn'),
            syncDocsBtn: !!document.getElementById('sync-docs-btn'),
            storageSettingsBtn: !!document.getElementById('storage-settings-btn')
        };
        console.log('DOM元素状态:', domStatus);
        
        console.log('=== 调试信息结束 ===');
    }

    /**
     * 检查登录状态
     */
    async checkLoginStatus() {
        try {
            // 检查是否有有效的token
            let isTokenValid = false;
            if (window.tokenManager && typeof window.tokenManager.validateTokens === 'function') {
                isTokenValid = await window.tokenManager.validateTokens();
            }
            
            if (isTokenValid) {
                // Token有效，尝试获取用户信息
                const userInfo = await this.getUserInfoFromToken();
                if (userInfo) {
                    // 保存用户信息到本地存储
                    this.saveUserInfo(userInfo);
                    
                    // 更新API管理器的用户信息
                    if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
                        this.apiManager.setCurrentUser(userInfo);
                    }
                    
                    // 立即显示主界面，避免闪烁
                    this.showMainInterface();
                    
                    // 立即更新用户信息显示
                    this.updateUserDisplayImmediately();
                    
                    // 立即检查并显示管理员菜单
                    if (this.uiManager) {
                        this.uiManager.checkAndShowAdminMenu().catch(error => {
                            console.error('检查管理员权限失败:', error);
                        });
                    }
                    
                    // 页面刷新时，只使用本地缓存，不重新获取数据
                    this.loadUserDataFromCache(userInfo);
                    
                    // 延迟再次检查管理员权限，确保用户信息已完全加载
                    setTimeout(async () => {
                        if (this.uiManager) {
                            await this.uiManager.delayedCheckAndShowAdminMenu().catch(error => {
                                console.error('延迟检查管理员权限失败:', error);
                            });
                        }
                    }, 1000);
                    
                    return true;
                }
            }
            
            // 检查本地存储的用户信息
            const savedUser = this.getUserFromStorage();
            
            if (savedUser) {
                try {
                    const userData = savedUser;

                    // 验证用户数据完整性
                    // 兼容 id 和 uuid 字段
                    const userId = userData.uuid || userData.id;
                    if (!userId || !userData.username) {
                        console.error('用户数据不完整，清除登录状态');
                        this.clearUserData();
                        this.showLoginInterface();
                        return false;
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
                    
                    // 立即显示主界面，避免闪烁
                    this.showMainInterface();
                    
                    // 立即更新用户信息显示
                    this.updateUserDisplayImmediately();
                    
                    // 立即检查并显示管理员菜单
                    if (this.uiManager) {
                        this.uiManager.checkAndShowAdminMenu().catch(error => {
                            console.error('检查管理员权限失败:', error);
                        });
                    }
                    
                    // 页面刷新时，只使用本地缓存，不重新获取数据
                    this.loadUserDataFromCache(userData);
                    
                    // 延迟再次检查管理员权限，确保用户信息已完全加载
                    setTimeout(async () => {
                        if (this.uiManager) {
                            await this.uiManager.delayedCheckAndShowAdminMenu().catch(error => {
                                console.error('延迟检查管理员权限失败:', error);
                            });
                        }
                    }, 1000);
                    
                    return true;
                } catch (error) {
                    console.error('处理本地用户数据失败:', error);
                    this.clearUserData();
                    this.showLoginInterface();
                    return false;
                }
            }
            
            // 没有有效的登录状态，显示登录界面
            this.showLoginInterface();
            return false;
            
        } catch (error) {
            console.error('检查登录状态失败:', error);
            this.showLoginInterface();
            return false;
        }
    }

    /**
     * 强制刷新后恢复用户信息
     */
    async restoreUserInfoAfterForceRefresh() {
        try {
            // 从localStorage获取用户信息
            const userData = this.getUserFromStorage();
            if (!userData || !userData.username) {
                return false;
            }

            // 更新API管理器的用户信息
            if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
                this.apiManager.setCurrentUser(userData);
            }

            // 立即更新用户信息显示
            this.updateUserDisplayImmediately();

            // 强制检查管理员权限
            if (this.uiManager) {
                // 如果是管理员用户，强制设置状态
                if (userData.username === 'Mose') {
                    if (this.uiManager.adminManager) {
                        this.uiManager.adminManager.isAdmin = true;
                    }
                    this.forceShowAdminElements();
                }
                
                // 使用专门的恢复方法
                await this.uiManager.restoreAdminMenuAfterForceRefresh().catch(error => {
                    console.error('强制刷新后恢复管理员菜单失败:', error);
                });
            }

            // 从缓存加载用户数据
            this.loadUserDataFromCache(userData);

            return true;
        } catch (error) {
            console.error('强制刷新后恢复用户信息失败:', error);
            return false;
        }
    }

    /**
     * 从token获取用户信息
     */
    async getUserInfoFromToken() {
        try {
            if (!this.apiManager) {
                return null;
            }
            
            // 使用API管理器获取用户信息
            const userInfo = await this.apiManager.getProfile();
            if (userInfo) {
                return userInfo;
            }
            
            return null;
        } catch (error) {
            console.error('从token获取用户信息失败:', error);
            return null;
        }
    }

    /**
     * 保存用户信息到本地存储
     */
    saveUserInfo(userInfo) {
        try {
            // 优先使用StorageManager
            if (window.StorageManager && typeof window.StorageManager.setUser === 'function') {
                window.StorageManager.setUser(userInfo);
            } else {
                // 如果 StorageManager 未加载，直接使用新的键结构
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
            }
            
            // 如果是管理员，确保立即更新显示
            if (userInfo && userInfo.username === 'Mose') {
                // 立即更新用户信息显示
                this.updateUserDisplayImmediately();
                
                // 强制显示管理员相关元素
                this.forceShowAdminElements();
            }
        } catch (error) {
            console.error('保存用户信息失败:', error);
        }
    }

    /**
     * 清除用户数据
     */
    clearUserData() {
        try {
            // 清除StorageManager中的数据
            if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
                window.StorageManager.clearUser();
            }
            
            // 清除localStorage中的数据
            localStorage.removeItem('userInfo');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userData');
            localStorage.removeItem('cachedAvatar');
            localStorage.removeItem('lastLoginTime');
            
            // 清除API管理器的用户信息
            if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
                this.apiManager.setCurrentUser(null);
            }
            
            // 隐藏管理员相关元素
            if (this.uiManager && this.uiManager.adminManager) {
                this.uiManager.adminManager.hideAdminFloatingButtons();
            }
            
        } catch (error) {
            console.error('清除用户数据失败:', error);
        }
    }

    /**
     * 从缓存加载用户数据（页面刷新时使用）
     */
    loadUserDataFromCache(userData) {
        try {
            if (!this.uiManager) {
                return;
            }
            
            // 更新UIManager缓存
            if (userData) {
                this.uiManager.profile = userData;
            }
            
            // 从缓存获取文件列表
            const cachedFiles = this.getCachedFiles();
            if (cachedFiles && cachedFiles.length > 0) {
                this.uiManager.allFiles = cachedFiles;
                this.uiManager.renderFileList(cachedFiles);
                this.uiManager.updateFileCount(cachedFiles.length, cachedFiles.length);
            }
            
            // 从缓存获取文件夹列表
            const cachedFolders = this.getCachedFolders();
            if (cachedFolders && cachedFolders.length > 0) {
                this.uiManager.folders = cachedFolders;
                this.uiManager.renderFolderList(cachedFolders);
            }
            
            // 从缓存获取存储信息
            const cachedStorageInfo = this.getCachedStorageInfo();
            if (cachedStorageInfo) {
                this.uiManager.storageInfo = cachedStorageInfo;
                this.uiManager.updateStorageDisplay(cachedStorageInfo);
            }
            
            // 更新用户信息显示
            if (userData) {
                this.updateUserDisplay(userData);
                this.uiManager.updateProfileDisplay(userData);
            }
            
            // 如果是管理员，确保所有数据都已正确加载
            if (userData && userData.username === 'Mose' && this.uiManager && this.uiManager.adminManager) {
                this.uiManager.adminManager.ensureAdminDataLoaded();
            }
            
        } catch (error) {
            console.error('从缓存加载用户数据失败:', error);
        }
    }

    /**
     * 登录成功处理
     */
    async onLoginSuccess(user) {
        try {
            // 立即保存用户信息到本地存储
            this.saveUserInfo(user);
            
            // 更新API管理器的用户信息
            if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
                this.apiManager.setCurrentUser(user);
            }
            
            // 立即显示主界面，不等待数据加载
            this.showMainInterface()
            
            // 立即更新用户信息显示
            this.updateUserDisplayImmediately();
            
            // 立即检查并显示管理员菜单和悬浮按钮
            if (this.uiManager) {
                // 强制设置管理员状态
                if (user.username === 'Mose') {
                    if (this.uiManager.adminManager) {
                        this.uiManager.adminManager.isAdmin = true;
                        console.log('设置管理员状态为true');
                    }
                    
                    // 强制显示管理员元素
                    this.forceShowAdminElements();
                    
                    // 强制更新头像显示
                    if (this.uiManager.adminManager) {
                        this.uiManager.adminManager.forceUpdateAvatarDisplay(user);
                    }
                }
                
                await this.uiManager.checkAndShowAdminMenu().catch(error => {
                    console.error('检查管理员权限失败:', error);
                });
            }
            
            // 延迟验证token，确保cookie已经设置完成
            setTimeout(async () => {
                try {
                    // 调试cookie状态
                    if (window.tokenManager && typeof window.tokenManager.debugCookies === 'function') {
                        const cookieStatus = window.tokenManager.debugCookies();
                        console.log('登录后cookie状态:', cookieStatus);
                        
                        // 如果cookie没有正确设置，尝试重新获取
                        if (!cookieStatus.hasAccessToken || !cookieStatus.hasRefreshToken) {
                            console.warn('登录后cookie未正确设置，尝试重新获取...');
                            
                            // 等待更长时间后再次检查
                            setTimeout(async () => {
                                const retryStatus = window.tokenManager.debugCookies();
                                console.log('重试后cookie状态:', retryStatus);
                                
                                if (!retryStatus.hasAccessToken || !retryStatus.hasRefreshToken) {
                                    console.error('登录后cookie设置失败，可能需要重新登录');
                                }
                            }, 2000);
                        }
                    }
                } catch (error) {
                    console.warn('调试cookie状态失败:', error);
                }
            }, 1000);
            
            // 立即加载用户数据，不等待token验证
            await this.loadUserData(user);
            
            // 如果是管理员，确保所有数据都已正确加载
            if (user.username === 'Mose' && this.uiManager && this.uiManager.adminManager) {
                await this.uiManager.adminManager.ensureAdminDataLoaded();
                
                // 再次强制更新头像显示
                this.uiManager.adminManager.forceUpdateAvatarDisplay(user);
                
                // 再次强制显示管理员元素
                this.forceShowAdminElements();
            }
            
        } catch (error) {
            console.error('登录成功处理失败:', error);
        }
    }
    
    /**
     * 强制显示管理员相关元素
     */
    forceShowAdminElements() {
        // 显示同步文档按钮
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        if (syncDocsBtn) {
            syncDocsBtn.style.display = 'flex !important';
            syncDocsBtn.style.visibility = 'visible';
            syncDocsBtn.classList.remove('hidden');
            syncDocsBtn.removeAttribute('hidden');
        }
        
        // 显示管理存储空间按钮
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        if (storageSettingsBtn) {
            storageSettingsBtn.style.display = 'block !important';
            storageSettingsBtn.style.visibility = 'visible';
            storageSettingsBtn.classList.remove('hidden');
            storageSettingsBtn.removeAttribute('hidden');
        }
        
        // 显示设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.style.display = 'block !important';
            settingsBtn.style.visibility = 'visible';
            settingsBtn.classList.remove('hidden');
            settingsBtn.removeAttribute('hidden');
        }
        
        // 显示管理员菜单
        const adminMenu = document.getElementById('admin-menu');
        if (adminMenu) {
            adminMenu.style.display = 'block !important';
            adminMenu.style.visibility = 'visible';
            adminMenu.classList.remove('hidden');
            adminMenu.removeAttribute('hidden');
        }
        
        // 显示环境切换器（如果存在）
        if (window.envSwitcher && typeof window.envSwitcher.show === 'function') {
            try {
                window.envSwitcher.show();
            } catch (error) {
                console.warn('显示环境切换器失败:', error);
            }
        }
    }

    /**
     * 退出登录
     */
    async logout() {
        // 获取当前用户ID
        let currentUser = null;
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            currentUser = window.StorageManager.getUser();
        } else {
            // 如果 StorageManager 未加载，使用 localStorage 作为备用
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                } catch (error) {
                    console.error('解析用户数据失败:', error);
                }
            }
        }
        
        let userId = null;
        if (currentUser) {
            try {
                userId = currentUser.uuid;
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

    /**
     * 显示主界面
     */
    showMainInterface() {
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage) {
            loginPage.classList.add('hidden');
            loginPage.style.display = 'none';
        }
        
        if (app) {
            app.classList.remove('hidden');
            app.style.display = 'block';
        }
        
        // 确保欢迎模块正确显示
        const welcomeSection = document.getElementById('welcome-section-card');
        if (welcomeSection) {
            welcomeSection.style.display = 'block';
            welcomeSection.classList.remove('hidden');
        }
        
        // 确保文件列表区域正确显示
        const fileListContainer = document.getElementById('file-list-container');
        if (fileListContainer) {
            fileListContainer.style.display = 'block';
            fileListContainer.classList.remove('hidden');
        }
        
        // 确保存储概览区域正确显示
        const storageOverview = document.getElementById('storage-overview-card');
        if (storageOverview) {
            storageOverview.style.display = 'block';
            storageOverview.classList.remove('hidden');
        }
    }
    
    /**
     * 立即更新用户信息显示（不等待组件加载）
     */
    updateUserDisplayImmediately() {
        try {
            // 获取用户信息
            let user = null;
            if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
                user = window.StorageManager.getUser();
            } else {
                const userData = localStorage.getItem('userInfo');
                if (userData) {
                    try {
                        user = JSON.parse(userData);
                    } catch (error) {
                        console.warn('解析用户信息失败:', error);
                    }
                }
            }
            
            if (!user) {
                console.warn('没有找到用户信息');
                return;
            }
            
            console.log('立即更新用户显示:', user);
            
            // 更新顶栏用户名
            const userName = document.getElementById('user-name');
            if (userName) {
                userName.textContent = user.username;
                // 确保金色渐变样式保持
                userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
                console.log('更新顶栏用户名:', user.username);
            }
            
            // 更新顶栏头像
            const userAvatar = document.getElementById('user-avatar');
            if (userAvatar) {
                // 优先从新的存储管理器获取头像
                let cachedAvatar = null;
                if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                    cachedAvatar = window.StorageManager.getAvatar();
                } else {
                    // 如果 StorageManager 未加载，直接使用新的键结构
                    const userData = localStorage.getItem('userInfo');
                    if (userData) {
                        try {
                            const userInfo = JSON.parse(userData);
                            cachedAvatar = userInfo.avatarUrl;
                        } catch (error) {
                            console.warn('解析用户信息失败:', error);
                        }
                    }
                }
                
                let avatarUrl = null;
                
                if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                    // 直接使用缓存的完整URL
                    avatarUrl = cachedAvatar;
                    console.log('使用缓存头像URL:', avatarUrl);
                } else if (user.avatar && window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                    // 如果没有缓存，使用原始文件名构建URL
                    avatarUrl = window.APP_UTILS.buildAvatarUrl(user.avatar);
                    console.log('构建头像URL:', avatarUrl);
                } else if (user.avatar) {
                    // 备用方案：直接构建URL
                    avatarUrl = `/api/avatars/${user.avatar}`;
                    console.log('使用备用头像URL:', avatarUrl);
                }
                
                if (avatarUrl) {
                    userAvatar.src = avatarUrl;
                    userAvatar.style.display = 'block';
                    userAvatar.style.visibility = 'visible';
                    userAvatar.style.opacity = '1';
                    console.log('更新顶栏头像成功:', avatarUrl);
                } else {
                    userAvatar.style.display = 'none';
                    console.log('隐藏顶栏头像');
                }
            }
            
            // 更新欢迎模块的用户名
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `欢迎回来，${user.username}`;
                console.log('更新欢迎模块用户名:', user.username);
            }
            
            // 更新欢迎模块的头像
            const welcomeAvatarImage = document.getElementById('avatar-image');
            const welcomeAvatarIcon = document.getElementById('avatar-icon');
            
            if (welcomeAvatarImage && welcomeAvatarIcon) {
                // 优先从新的存储管理器获取头像
                let cachedAvatar = null;
                if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                    cachedAvatar = window.StorageManager.getAvatar();
                } else {
                    // 如果 StorageManager 未加载，直接使用新的键结构
                    const userData = localStorage.getItem('userInfo');
                    if (userData) {
                        try {
                            const userInfo = JSON.parse(userData);
                            cachedAvatar = userInfo.avatarUrl;
                        } catch (error) {
                            console.warn('解析用户信息失败:', error);
                        }
                    }
                }
                
                let avatarUrl = null;
                
                if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                    // 直接使用缓存的完整URL
                    avatarUrl = cachedAvatar;
                    console.log('欢迎模块使用缓存头像URL:', avatarUrl);
                } else if (user.avatar && window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                    // 如果没有缓存，使用原始文件名构建URL
                    avatarUrl = window.APP_UTILS.buildAvatarUrl(user.avatar);
                    console.log('欢迎模块构建头像URL:', avatarUrl);
                } else if (user.avatar) {
                    // 备用方案：直接构建URL
                    avatarUrl = `/api/avatars/${user.avatar}`;
                    console.log('欢迎模块使用备用头像URL:', avatarUrl);
                }
                
                if (avatarUrl) {
                    welcomeAvatarImage.src = avatarUrl;
                    welcomeAvatarImage.classList.remove('hidden');
                    welcomeAvatarIcon.classList.add('hidden');
                    welcomeAvatarImage.style.display = 'block';
                    welcomeAvatarImage.style.visibility = 'visible';
                    welcomeAvatarImage.style.opacity = '1';
                    welcomeAvatarIcon.style.display = 'none';
                    console.log('更新欢迎模块头像成功:', avatarUrl);
                } else {
                    welcomeAvatarImage.classList.add('hidden');
                    welcomeAvatarIcon.classList.remove('hidden');
                    welcomeAvatarImage.style.display = 'none';
                    welcomeAvatarIcon.style.display = 'block';
                    welcomeAvatarImage.src = ''; // 清空src避免请求
                    console.log('显示欢迎模块默认图标');
                }
            }
            
            // 确保当前日期显示
            const currentDateElement = document.getElementById('current-date');
            if (currentDateElement) {
                const today = new Date();
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                currentDateElement.textContent = today.toLocaleDateString('zh-CN', options);
                console.log('更新当前日期');
            }
            
            // 如果是管理员，确保所有管理员相关元素都显示
            if (user.username === 'Mose') {
                console.log('检测到管理员用户，显示管理员功能');
                // 强制显示管理员相关元素
                if (this.uiManager && this.uiManager.adminManager) {
                    this.uiManager.adminManager.forceShowAdminElements();
                }
            }
            
        } catch (error) {
            console.warn('立即更新用户显示失败:', error);
        }
    }

    /**
     * 显示登录界面
     */
    showLoginInterface() {
        const loginPage = document.getElementById('login-page');
        const app = document.getElementById('app');
        
        if (loginPage) {
            loginPage.classList.remove('hidden');
            loginPage.style.display = 'block';
        }
        
        if (app) {
            app.classList.add('hidden');
            app.style.display = 'none';
        }
        
        // 隐藏所有管理员相关元素
        if (this.uiManager && this.uiManager.adminManager) {
            this.uiManager.adminManager.hideAdminFloatingButtons();
        }
    }

    /**
     * 从缓存更新用户显示
     */
    updateUserDisplayFromCache(userData) {
        try {
            if (!userData) {
                return;
            }
            
            // 更新顶栏用户名
            const userName = document.getElementById('user-name');
            if (userName) {
                userName.textContent = userData.username;
                // 确保金色渐变样式保持
                userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
            }
            
            // 更新顶栏头像
            const userAvatar = document.getElementById('user-avatar');
            if (userAvatar) {
                // 优先从新的存储管理器获取头像
                let cachedAvatar = null;
                if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                    cachedAvatar = window.StorageManager.getAvatar();
                } else {
                    // 如果 StorageManager 未加载，直接使用新的键结构
                    const userInfo = localStorage.getItem('userInfo');
                    if (userInfo) {
                        try {
                            const parsedUserInfo = JSON.parse(userInfo);
                            cachedAvatar = parsedUserInfo.avatarUrl;
                        } catch (error) {
                            console.warn('解析用户信息失败:', error);
                        }
                    }
                }
                
                let avatarUrl = null;
                
                if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                    // 直接使用缓存的完整URL
                    avatarUrl = cachedAvatar;
                } else if (userData.avatar && window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                    // 如果没有缓存，使用原始文件名构建URL
                    avatarUrl = window.APP_UTILS.buildAvatarUrl(userData.avatar);
                }
                
                if (avatarUrl) {
                    userAvatar.src = avatarUrl;
                    userAvatar.style.display = 'block';
                } else {
                    userAvatar.style.display = 'none';
                }
            }
            
            // 更新欢迎模块的用户名
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `欢迎回来，${userData.username}`;
            }
            
            // 更新欢迎模块的头像
            const welcomeAvatarImage = document.getElementById('avatar-image');
            const welcomeAvatarIcon = document.getElementById('avatar-icon');
            
            if (welcomeAvatarImage && welcomeAvatarIcon) {
                // 优先从新的存储管理器获取头像
                let cachedAvatar = null;
                if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                    cachedAvatar = window.StorageManager.getAvatar();
                } else {
                    // 如果 StorageManager 未加载，直接使用新的键结构
                    const userInfo = localStorage.getItem('userInfo');
                    if (userInfo) {
                        try {
                            const parsedUserInfo = JSON.parse(userInfo);
                            cachedAvatar = parsedUserInfo.avatarUrl;
                        } catch (error) {
                            console.warn('解析用户信息失败:', error);
                        }
                    }
                }
                
                let avatarUrl = null;
                
                if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                    // 直接使用缓存的完整URL
                    avatarUrl = cachedAvatar;
                } else if (userData.avatar && window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                    // 如果没有缓存，使用原始文件名构建URL
                    avatarUrl = window.APP_UTILS.buildAvatarUrl(userData.avatar);
                }
                
                if (avatarUrl) {
                    welcomeAvatarImage.src = avatarUrl;
                    welcomeAvatarImage.classList.remove('hidden');
                    welcomeAvatarIcon.classList.add('hidden');
                    welcomeAvatarImage.style.display = 'block';
                    welcomeAvatarImage.style.visibility = 'visible';
                    welcomeAvatarImage.style.opacity = '1';
                    welcomeAvatarIcon.style.display = 'none';
                } else {
                    welcomeAvatarImage.classList.add('hidden');
                    welcomeAvatarIcon.classList.remove('hidden');
                    welcomeAvatarImage.style.display = 'none';
                    welcomeAvatarIcon.style.display = 'block';
                    welcomeAvatarImage.src = ''; // 清空src避免请求
                }
            }
            
            // 确保当前日期显示
            const currentDateElement = document.getElementById('current-date');
            if (currentDateElement) {
                const today = new Date();
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                currentDateElement.textContent = today.toLocaleDateString('zh-CN', options);
            }
            
            // 如果是管理员，确保所有管理员相关元素都显示
            if (userData.username === 'Mose') {
                // 强制显示管理员相关元素
                if (this.uiManager && this.uiManager.adminManager) {
                    this.uiManager.adminManager.forceShowAdminElements();
                }
            }
            
        } catch (error) {
            console.warn('从缓存更新用户显示失败:', error);
        }
    }

    /**
     * 更新用户显示
     */
    updateUserDisplay(user) {
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) {
            userName.textContent = user.username;
            // 确保金色渐变样式保持
            userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
        }
        
        if (userAvatar) {
            // 优先从新的存储管理器获取头像
            let cachedAvatar = null;
            if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                cachedAvatar = window.StorageManager.getAvatar();
            } else {
                // 如果 StorageManager 未加载，直接使用新的键结构
                const userData = localStorage.getItem('userInfo');
                if (userData) {
                    try {
                        const userInfo = JSON.parse(userData);
                        cachedAvatar = userInfo.avatarUrl;
                    } catch (error) {
                        console.warn('解析用户信息失败:', error);
                    }
                }
            }
            
            let avatarUrl = null;
            
            if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                // 直接使用缓存的完整URL
                avatarUrl = cachedAvatar;
            } else if (user.avatar && window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                // 如果没有缓存，使用原始文件名构建URL
                avatarUrl = window.APP_UTILS.buildAvatarUrl(user.avatar);
            }
            
            if (avatarUrl) {
                userAvatar.src = avatarUrl;
                userAvatar.style.display = 'block';
            } else {
                userAvatar.style.display = 'none';
            }
        }
        
        // 更新欢迎模块的用户名
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `欢迎回来，${user.username}`;
        }
        
        // 更新欢迎模块的头像
        const welcomeAvatarImage = document.getElementById('avatar-image');
        const welcomeAvatarIcon = document.getElementById('avatar-icon');
        
        if (welcomeAvatarImage && welcomeAvatarIcon) {
            // 优先从新的存储管理器获取头像
            let cachedAvatar = null;
            if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                cachedAvatar = window.StorageManager.getAvatar();
            } else {
                // 如果 StorageManager 未加载，直接使用新的键结构
                const userData = localStorage.getItem('userInfo');
                if (userData) {
                    try {
                        const userInfo = JSON.parse(userData);
                        cachedAvatar = userInfo.avatarUrl;
                    } catch (error) {
                        console.warn('解析用户信息失败:', error);
                    }
                }
            }
            
            let avatarUrl = null;
            
            if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                // 直接使用缓存的完整URL
                avatarUrl = cachedAvatar;
            } else if (user.avatar && window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                // 如果没有缓存，使用原始文件名构建URL
                avatarUrl = window.APP_UTILS.buildAvatarUrl(user.avatar);
            }
            
            if (avatarUrl) {
                welcomeAvatarImage.src = avatarUrl;
                welcomeAvatarImage.classList.remove('hidden');
                welcomeAvatarIcon.classList.add('hidden');
                welcomeAvatarImage.style.display = 'block';
                welcomeAvatarImage.style.visibility = 'visible';
                welcomeAvatarImage.style.opacity = '1';
                welcomeAvatarIcon.style.display = 'none';
            } else {
                welcomeAvatarImage.classList.add('hidden');
                welcomeAvatarIcon.classList.remove('hidden');
                welcomeAvatarImage.style.display = 'none';
                welcomeAvatarIcon.style.display = 'block';
                welcomeAvatarImage.src = ''; // 清空src避免请求
            }
        }
        
        // 确保当前日期显示
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            const today = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            currentDateElement.textContent = today.toLocaleDateString('zh-CN', options);
        }
        
        // 如果是管理员，确保所有管理员相关元素都显示
        if (user.username === 'Mose') {
            // 强制显示管理员相关元素
            if (this.uiManager && this.uiManager.adminManager) {
                this.uiManager.adminManager.forceShowAdminElements();
            }
        }
    }

    /**
     * 更新存储状态（等待组件加载完成）
     */
    updateStorageAfterComponentsLoad(storageInfo) {
        // 如果组件已加载，直接更新
        if (document.getElementById('welcome-storage-status')) {
            if (this.uiManager) {
                this.uiManager.updateStorageDisplay(storageInfo);
            }
            return;
        }
        
        // 否则等待组件加载完成
        const handleComponentsLoaded = () => {
            if (this.uiManager) {
                this.uiManager.updateStorageDisplay(storageInfo);
            }
            document.removeEventListener('componentsLoaded', handleComponentsLoaded);
        };
        
        document.addEventListener('componentsLoaded', handleComponentsLoaded);
        
        // 设置超时，避免无限等待
        setTimeout(() => {
            if (this.uiManager) {
                this.uiManager.updateStorageDisplay(storageInfo);
            }
            document.removeEventListener('componentsLoaded', handleComponentsLoaded);
        }, 5000);
    }

    /**
     * 加载用户数据
     */
    async loadUserData(userData) {
        try {
            if (!this.uiManager || !this.apiManager) {
                console.warn('UI管理器或API管理器未初始化');
                return;
            }

            // 拉取所有数据，使用Promise.allSettled避免单个API失败影响整体
            const results = await Promise.allSettled([
                this.apiManager.getFiles(),
                this.apiManager.getUrlFiles(),
                this.apiManager.getFolders(),
                this.apiManager.getStorageInfo(),
                this.apiManager.getProfile(),
                this.apiManager.getTotalFileCount()
            ]);
            
            // 处理API调用结果
            const [filesResult, urlFilesResult, foldersResult, storageInfoResult, profileResult, totalFileCountResult] = results;
            
            const files = filesResult.status === 'fulfilled' ? filesResult.value : [];
            const urlFiles = urlFilesResult.status === 'fulfilled' ? urlFilesResult.value : [];
            const folders = foldersResult.status === 'fulfilled' ? foldersResult.value : [];
            const storageInfo = storageInfoResult.status === 'fulfilled' ? storageInfoResult.value : null;
            const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
            const totalFileCount = totalFileCountResult.status === 'fulfilled' ? totalFileCountResult.value : 0;
            
            // 记录失败的API调用
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const apiNames = ['Files', 'UrlFiles', 'Folders', 'StorageInfo', 'Profile', 'TotalFileCount'];
                    console.warn(`API调用失败: ${apiNames[index]}`, result.reason);
                }
            });
            
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
                await this.uiManager.renderFolderList(folders);
            }
            
            // 等待组件加载完成后再更新用户资料显示
            const waitForComponents = () => {
                return new Promise((resolve) => {
                    const checkComponents = () => {
                        const welcomeSection = document.getElementById('welcome-section-card');
                        const storageOverview = document.getElementById('storage-overview-card');
                        if (welcomeSection && storageOverview) {
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
            if (profile) {
                this.updateUserDisplay(profile);
                this.uiManager.updateProfileDisplay(profile);
            } else {
                // 如果API调用失败，尝试从localStorage获取用户信息
                const userData = localStorage.getItem('userInfo');
                if (userData) {
                    try {
                        const localUserData = JSON.parse(userData);
                        this.updateUserDisplay(localUserData);
                        this.uiManager.updateProfileDisplay(localUserData);
                    } catch (error) {
                        console.warn('从localStorage获取用户数据失败:', error);
                    }
                }
            }
            
            // 更新文件统计（在组件加载完成后）
            this.uiManager.updateFileCount(this.uiManager.allFiles.length, this.uiManager.totalFileCount);
            
            // 更新存储空间显示（等待组件加载完成）
            this.updateStorageAfterComponentsLoad(storageInfo);
            
            // 在组件加载完成后渲染文件夹列表
            if (this.uiManager && this.uiManager.folders) {
                await this.uiManager.renderFolderList(this.uiManager.folders);
            }
            
            // 如果是管理员，确保所有数据都已正确加载
            if (userData && userData.username === 'Mose' && this.uiManager && this.uiManager.adminManager) {
                await this.uiManager.adminManager.ensureAdminDataLoaded();
            }
            
        } catch (error) {
            console.error('❌ 加载用户数据失败:', error);
        }
    }

    /**
     * 登录时加载用户数据并缓存头像
     */
    async loadUserDataAndCacheAvatar(userData) {
        try {
            if (!this.uiManager || !this.apiManager) {
                return;
            }
            
            // 拉取所有数据，使用Promise.allSettled避免单个API失败影响整体
            const results = await Promise.allSettled([
                this.apiManager.getFiles(),
                this.apiManager.getUrlFiles(),
                this.apiManager.getFolders(),
                this.apiManager.getStorageInfo(),
                this.apiManager.getProfile(),
                this.apiManager.getTotalFileCount()
            ]);
            
            // 处理API调用结果
            const [filesResult, urlFilesResult, foldersResult, storageInfoResult, profileResult, totalFileCountResult] = results;
            
            const files = filesResult.status === 'fulfilled' ? filesResult.value : [];
            const urlFiles = urlFilesResult.status === 'fulfilled' ? urlFilesResult.value : [];
            const folders = foldersResult.status === 'fulfilled' ? foldersResult.value : [];
            const storageInfo = storageInfoResult.status === 'fulfilled' ? storageInfoResult.value : null;
            const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
            const totalFileCount = totalFileCountResult.status === 'fulfilled' ? totalFileCountResult.value : 0;
            
            // 记录失败的API调用
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const apiNames = ['Files', 'UrlFiles', 'Folders', 'StorageInfo', 'Profile', 'TotalFileCount'];
                    console.warn(`API调用失败: ${apiNames[index]}`, result.reason);
                }
            });
            
            // 更新UIManager缓存
            this.uiManager.allFiles = [...files, ...urlFiles];
            this.uiManager.folders = folders;
            this.uiManager.totalFileCount = totalFileCount;
            this.uiManager.storageInfo = storageInfo;
            this.uiManager.profile = profile;
            
            // 登录时缓存头像
            if (profile && profile.avatar) {
                // 构建完整的头像URL
                const avatarUrl = window.apiGateway?.buildUrl('/uploads/avatars/' + profile.avatar);
                if (avatarUrl) {
                    // 更新用户信息，包含头像URL
                    const updatedUserInfo = {
                        ...profile,
                        avatarUrl: avatarUrl
                    };
                    
                    if (window.StorageManager && typeof window.StorageManager.setUserInfo === 'function') {
                        window.StorageManager.setUserInfo(updatedUserInfo);
                    } else if (window.StorageManager && typeof window.StorageManager.setUser === 'function') {
                        window.StorageManager.setUser(updatedUserInfo);
                    } else {
                        // 如果 StorageManager 未加载，直接使用新的键结构
                        const userInfo = {
                            ...profile,
                            avatarUrl: avatarUrl
                        };
                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                    }
                }
            }
            
            // 登录时缓存存储信息
            if (storageInfo) {
                window.StorageManager.setStorageInfo(storageInfo);
            }
            
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
                await this.uiManager.renderFolderList(folders);
            }
            
            // 等待组件加载完成后再更新用户资料显示
            const waitForComponents = () => {
                return new Promise((resolve) => {
                    const checkComponents = () => {
                        const welcomeSection = document.getElementById('welcome-section-card');
                        const storageOverview = document.getElementById('storage-overview-card');
                        if (welcomeSection && storageOverview) {
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
            if (profile) {
                this.updateUserDisplay(profile);
                this.uiManager.updateProfileDisplay(profile);
            } else {
                // 如果API调用失败，尝试从localStorage获取用户信息
                const userData = localStorage.getItem('userData');
                if (userData) {
                    try {
                        const localUserData = JSON.parse(userData);
                        this.updateUserDisplay(localUserData);
                        this.uiManager.updateProfileDisplay(localUserData);
                    } catch (error) {
                        console.warn('从localStorage获取用户数据失败:', error);
                    }
                }
            }
            
            // 更新文件统计（在组件加载完成后）
            this.uiManager.updateFileCount(this.uiManager.allFiles.length, this.uiManager.totalFileCount);
            
            // 更新存储空间显示（等待组件加载完成）
            this.updateStorageAfterComponentsLoad(storageInfo);
            
            // 在组件加载完成后渲染文件夹列表
            if (this.uiManager && this.uiManager.folders) {
                await this.uiManager.renderFolderList(this.uiManager.folders);
            }
            
        } catch (error) {
            console.error('❌ 加载用户数据失败:', error);
        }
    }

    /**
     * 从存储中获取用户信息
     */
    getUserFromStorage() {
        let userData = null;
        
        // 优先从StorageManager获取
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            userData = window.StorageManager.getUser();
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
            const userDataStr = localStorage.getItem('userInfo');
            if (userDataStr) {
                try {
                    userData = JSON.parse(userDataStr);
                } catch (error) {
                    console.warn('解析用户信息失败:', error);
                }
            }
        }
        
        return userData;
    }

    /**
     * 获取缓存的文件列表
     */
    getCachedFiles() {
        try {
            if (window.StorageManager && typeof window.StorageManager.getFiles === 'function') {
                return window.StorageManager.getFiles();
            } else {
                const filesData = localStorage.getItem('cachedFiles');
                if (filesData) {
                    return JSON.parse(filesData);
                }
            }
        } catch (error) {
            console.warn('获取缓存文件列表失败:', error);
        }
        return [];
    }

    /**
     * 获取缓存的文件夹列表
     */
    getCachedFolders() {
        try {
            if (window.StorageManager && typeof window.StorageManager.getFolders === 'function') {
                return window.StorageManager.getFolders();
            } else {
                const foldersData = localStorage.getItem('cachedFolders');
                if (foldersData) {
                    return JSON.parse(foldersData);
                }
            }
        } catch (error) {
            console.warn('获取缓存文件夹列表失败:', error);
        }
        return [];
    }

    /**
     * 获取缓存的存储信息
     */
    getCachedStorageInfo() {
        try {
            if (window.StorageManager && typeof window.StorageManager.getStorageInfo === 'function') {
                return window.StorageManager.getStorageInfo();
            } else {
                const systemData = localStorage.getItem('systemInfo');
                if (systemData) {
                    const systemInfo = JSON.parse(systemData);
                    return systemInfo.storageInfo || null;
                }
            }
        } catch (error) {
            console.warn('获取缓存存储信息失败:', error);
        }
        return null;
    }
}

// 导出AppAuthManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppAuthManager;
} 

// 添加全局调试工具
window.DEBUG_TOOLS = {
    // 调试登录状态
    debugLogin: () => {
        if (window.appAuthManager) {
            window.appAuthManager.debugLoginStatus();
        }
    },
    
    // 检查环境配置
    debugEnvironment: () => {
        // 环境配置调试
    },
    
    // 检查cookie状态
    debugCookies: () => {
        // Cookie调试
    },
    
    // 检查localStorage
    debugStorage: () => {
        // localStorage调试
    },
    
    // 完整调试
    debugAll: () => {
        window.DEBUG_TOOLS.debugEnvironment();
        window.DEBUG_TOOLS.debugCookies();
        window.DEBUG_TOOLS.debugStorage();
        window.DEBUG_TOOLS.debugLogin();
    },
    
    // 生产环境管理员权限调试
    debugAdminPermissions: () => {
        console.log('=== 管理员权限调试 ===');
        
        // 检查当前用户
        const currentUser = localStorage.getItem('userInfo');
        console.log('当前用户信息:', currentUser);
        
        // 检查管理员状态
        if (window.uiManager && window.uiManager.adminManager) {
            console.log('AdminManager isAdmin:', window.uiManager.adminManager.isAdmin);
        }
        
        // 检查相关元素
        const adminMenu = document.getElementById('admin-menu');
        const settingsBtn = document.getElementById('settings-btn');
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        
        console.log('管理员相关元素:', {
            adminMenu: !!adminMenu,
            settingsBtn: !!settingsBtn,
            syncDocsBtn: !!syncDocsBtn,
            storageSettingsBtn: !!storageSettingsBtn
        });
        
        // 检查元素显示状态
        if (settingsBtn) {
            console.log('设置按钮显示状态:', {
                display: settingsBtn.style.display,
                hidden: settingsBtn.classList.contains('hidden')
            });
        }
        
        if (adminMenu) {
            console.log('管理员菜单显示状态:', {
                hidden: adminMenu.classList.contains('hidden')
            });
        }
        
        // 强制重新检查管理员权限
        if (window.uiManager && window.uiManager.adminManager) {
            window.uiManager.adminManager.checkAdminPermissions().then(() => {
                console.log('重新检查管理员权限完成');
                window.uiManager.adminManager.updateAvatarAdminMenu();
            }).catch(error => {
                console.error('重新检查管理员权限失败:', error);
            });
        }
        
        // 强制修复管理员显示
        if (window.uiManager && window.uiManager.adminManager) {
            const user = JSON.parse(currentUser || '{}');
            if (user.username === 'Mose') {
                console.log('强制设置管理员状态');
                window.uiManager.adminManager.isAdmin = true;
                window.uiManager.adminManager.updateAvatarAdminMenu();
                
                // 强制显示所有管理员元素
                if (settingsBtn) {
                    settingsBtn.style.display = 'block';
                    settingsBtn.classList.remove('hidden');
                }
                if (adminMenu) {
                    adminMenu.classList.remove('hidden');
                }
                if (syncDocsBtn) {
                    syncDocsBtn.classList.remove('hidden');
                }
                if (storageSettingsBtn) {
                    storageSettingsBtn.style.display = 'block';
                }
            }
        }
    },
    
    // 强制修复管理员权限
    forceFixAdminPermissions: () => {
        console.log('=== 强制修复管理员权限 ===');
        
        const currentUser = localStorage.getItem('userInfo');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                if (user.username === 'Mose') {
                    console.log('检测到管理员用户，强制修复权限');
                    
                    // 强制设置管理员状态
                    if (window.uiManager && window.uiManager.adminManager) {
                        window.uiManager.adminManager.isAdmin = true;
                        window.uiManager.adminManager.updateAvatarAdminMenu();
                        window.uiManager.adminManager.showAdminFloatingButtons();
                    }
                    
                    // 强制显示所有管理员元素
                    const adminMenu = document.getElementById('admin-menu');
                    const settingsBtn = document.getElementById('settings-btn');
                    const syncDocsBtn = document.getElementById('sync-docs-btn');
                    const storageSettingsBtn = document.getElementById('storage-settings-btn');
                    
                    if (adminMenu) adminMenu.classList.remove('hidden');
                    if (settingsBtn) {
                        settingsBtn.style.display = 'block';
                        settingsBtn.classList.remove('hidden');
                    }
                    if (syncDocsBtn) syncDocsBtn.classList.remove('hidden');
                    if (storageSettingsBtn) storageSettingsBtn.style.display = 'block';
                    
                    console.log('强制修复完成');
                }
            } catch (error) {
                console.error('解析用户信息失败:', error);
            }
        }
    }
}; 