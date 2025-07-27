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
     * 调试登录状态
     */
    debugLoginStatus() {
        // 检查cookie
        const cookies = document.cookie.split(';');
        const accessToken = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        const refreshToken = cookies.find(cookie => cookie.trim().startsWith('refresh_token='));
        
        // 检查localStorage
        const userInfo = localStorage.getItem('userInfo');
        
        // 检查tokenManager
        // 检查API网关
        // 检查环境配置
    }

    /**
     * 检查登录状态
     */
    async checkLoginStatus() {
        // 减少延迟，从1000ms优化到300ms
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 首先尝试从cookie中获取token并验证
        if (window.tokenManager && typeof window.tokenManager.validateTokens === 'function') {
            try {
                const isTokenValid = await window.tokenManager.validateTokens();
                
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
                        }, 1000); // 1秒后再次检查
                        
                        // 如果有本地用户数据但token无效，尝试静默刷新token
                        if (window.tokenManager && typeof window.tokenManager.refreshTokens === 'function') {
                            setTimeout(async () => {
                                try {
                                    await window.tokenManager.refreshTokens();
                                } catch (refreshError) {
                                    console.warn('静默刷新token失败，但用户仍可继续使用:', refreshError);
                                }
                            }, 1000); // 减少延迟到1秒
                        }
                        
                        return;
                    } else {
                        // 无法获取用户信息
                    }
                } else {
                    // Token无效
                }
            } catch (error) {
                console.warn('Token验证失败:', error);
            }
        } else {
            // TokenManager不可用
        }
        
        // 如果token验证失败，尝试从本地存储获取用户信息
        let savedUser = null;
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            savedUser = window.StorageManager.getUser();
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
            const userData = localStorage.getItem('userInfo');
            if (userData) {
                try {
                    savedUser = JSON.parse(userData);
                } catch (error) {
                    console.warn('解析用户信息失败:', error);
                }
            }
        }
        
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
                
                // 立即显示主界面，避免闪烁
                this.showMainInterface();
                
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
                }, 1000); // 1秒后再次检查
                
            } catch (error) {
                console.error('解析用户数据失败:', error);
                this.clearUserData();
                this.showLoginInterface();
            }
        } else {
            this.showLoginInterface();
        }
    }

    /**
     * 从token获取用户信息
     */
    async getUserInfoFromToken() {
        try {
            if (window.tokenManager && typeof window.tokenManager.getValidAccessToken === 'function') {
                const accessToken = await window.tokenManager.getValidAccessToken();
                if (accessToken) {
                    // 调用token验证API获取用户信息
                    const response = await fetch('/api/validate-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            access_token: accessToken
                        }),
                        credentials: 'include'
                    });

                    const data = await response.json();
                    if (data.success && data.valid && data.user) {
                        return data.user;
                    }
                }
            }
        } catch (error) {
            // 如果没有token或token无效，这是正常情况，不需要报错
        }
        return null;
    }

    /**
     * 保存用户信息
     */
    saveUserInfo(userInfo) {
        if (window.StorageManager && typeof window.StorageManager.setUser === 'function') {
            window.StorageManager.setUser(userInfo);
        } else {
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
    }

    /**
     * 清除用户数据
     */
    clearUserData() {
        if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
            window.StorageManager.clearUser();
        } else {
            localStorage.removeItem('userInfo');
        }
    }

    /**
     * 从缓存加载用户数据
     */
    loadUserDataFromCache(userData) {
        let userDataFromStorage = null;
        let storageInfoFromStorage = null;
        
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            userDataFromStorage = window.StorageManager.getUser();
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
            const userData = localStorage.getItem('userInfo');
            if (userData) {
                try {
                    userDataFromStorage = JSON.parse(userData);
                } catch (error) {
                    console.warn('解析用户数据失败:', error);
                }
            }
        }
        
        if (window.StorageManager && typeof window.StorageManager.getStorageInfo === 'function') {
            storageInfoFromStorage = window.StorageManager.getStorageInfo();
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
            const systemData = localStorage.getItem('systemInfo');
            if (systemData) {
                try {
                    const systemInfo = JSON.parse(systemData);
                    storageInfoFromStorage = systemInfo.storageInfo || null;
                } catch (error) {
                    console.warn('解析系统信息失败:', error);
                }
            }
        }
        
        if (userDataFromStorage) {
            try {
                const localUserData = userDataFromStorage;
                
                // 只使用本地缓存，不重新获取
                this.updateUserDisplayFromCache(localUserData);
                if (this.uiManager) {
                    this.uiManager.updateProfileDisplayFromCache(localUserData);
                }
                
                // 如果有缓存的存储信息，也更新存储显示
                if (storageInfoFromStorage) {
                    try {
                        const cachedStorageInfo = storageInfoFromStorage;
                        this.updateStorageAfterComponentsLoad(cachedStorageInfo);
                    } catch (error) {
                        console.warn('从存储管理器获取存储信息失败:', error);
                    }
                }
                
                // 延迟检查存储组件是否已加载
                setTimeout(() => {
                    if (document.getElementById('welcome-storage-status')) {
                        if (storageInfoFromStorage) {
                            try {
                                const cachedStorageInfo = JSON.parse(storageInfoFromStorage);
                                this.uiManager.updateStorageDisplay(cachedStorageInfo);
                            } catch (error) {
                                console.warn('延迟更新存储信息失败:', error);
                            }
                        }
                    }
                }, 500);
            } catch (error) {
                console.warn('从localStorage获取用户数据失败:', error);
            }
        } else {
            // 如果没有userData，只更新基本用户信息
            this.updateUserDisplayFromCache(userData);
        }
        
        // 页面刷新时重新加载用户数据，确保文件列表正确显示
        this.loadUserData(userData);
    }

    /**
     * 登录成功处理
     */
    async onLoginSuccess(userData) {
        // 从事件详情中获取用户数据
        const user = userData.user || userData;
        
        // 立即保存用户信息到本地存储，确保状态持久化
        this.saveUserInfo(user);
        
        // 同步用户信息到API管理器
        if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
            this.apiManager.setCurrentUser(user);
        }
        
        // 立即显示主界面，不等待数据加载
        this.showMainInterface();
        
        // 立即检查并显示管理员菜单和悬浮按钮
        if (this.uiManager) {
            // 强制设置管理员状态
            if (user.username === 'Mose') {
                if (this.uiManager.adminManager) {
                    this.uiManager.adminManager.isAdmin = true;
                }
                
                // 强制显示管理员元素
                this.forceShowAdminElements();
            }
            
            await this.uiManager.checkAndShowAdminMenu().catch(error => {
                console.error('检查管理员权限失败:', error);
            });
        }
        
        // 延迟再次检查管理员权限，确保用户信息已完全保存
        setTimeout(async () => {
            if (this.uiManager) {
                // 再次强制检查管理员状态
                if (user.username === 'Mose' && this.uiManager.adminManager) {
                    this.uiManager.adminManager.isAdmin = true;
                    // 再次强制显示管理员元素
                    this.forceShowAdminElements();
                }
                
                await this.uiManager.delayedCheckAndShowAdminMenu().catch(error => {
                    console.error('延迟检查管理员权限失败:', error);
                });
            }
        }, 1000); // 1秒后再次检查
        
        // 生产环境特殊处理：确保管理员权限检查在数据加载完成后再次执行
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // 生产环境：等待更长时间确保所有组件加载完成
            setTimeout(async () => {
                if (this.uiManager && this.uiManager.adminManager) {
                    try {
                        // 强制重新检查管理员权限
                        if (user.username === 'Mose') {
                            this.uiManager.adminManager.isAdmin = true;
                            // 再次强制显示管理员元素
                            this.forceShowAdminElements();
                        }
                        
                        await this.uiManager.adminManager.checkAdminPermissions();
                        // 再次更新UI显示
                        this.uiManager.adminManager.updateAvatarAdminMenu();
                        
                        // 如果是管理员，确保显示所有管理员相关元素
                        if (this.uiManager.adminManager.isAdmin) {
                            this.uiManager.adminManager.showAdminFloatingButtons();
                            // 强制显示管理员菜单按钮
                            this.forceShowAdminElements();
                        }
                    } catch (error) {
                        console.error('生产环境管理员权限检查失败:', error);
                    }
                }
            }, 3000); // 生产环境等待3秒
        }
        
        // 设置日期显示
        this.appCore.initDateDisplay();
        
        // 显示登录成功消息
        if (window.Notify) {
            window.Notify.show({ message: '登录成功', type: 'success' });
        }
    }
    
    /**
     * 强制显示管理员元素
     */
    forceShowAdminElements() {
        const adminMenu = document.getElementById('admin-menu');
        const settingsBtn = document.getElementById('settings-btn');
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        
        if (settingsBtn) {
            settingsBtn.style.display = 'block !important';
            settingsBtn.style.visibility = 'visible';
            settingsBtn.classList.remove('hidden');
            settingsBtn.removeAttribute('hidden');
        }
        
        if (adminMenu) {
            adminMenu.style.display = 'block !important';
            adminMenu.style.visibility = 'visible';
            adminMenu.classList.remove('hidden');
            adminMenu.removeAttribute('hidden');
        }
        
        if (syncDocsBtn) {
            syncDocsBtn.style.display = 'flex !important';
            syncDocsBtn.style.visibility = 'visible';
            syncDocsBtn.classList.remove('hidden');
            syncDocsBtn.removeAttribute('hidden');
        }
        
        if (storageSettingsBtn) {
            storageSettingsBtn.style.display = 'block !important';
            storageSettingsBtn.style.visibility = 'visible';
            storageSettingsBtn.classList.remove('hidden');
            storageSettingsBtn.removeAttribute('hidden');
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
    }

    /**
     * 更新用户显示（从缓存）
     */
    updateUserDisplayFromCache(user) {
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) {
            userName.textContent = user.username;
            // 确保金色渐变样式保持
            userName.className = 'text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500';
        }
        
        if (userAvatar) {
            // 只使用本地缓存，不重新构建URL
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
            
            if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                // 直接使用缓存的完整URL
                userAvatar.src = cachedAvatar;
            } else {
                // 没有缓存时显示默认图标，不设置src避免请求
                userAvatar.style.display = 'none';
            }
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
            }
            // 如果avatarUrl为null，不设置src，避免404错误
        }
    }

    /**
     * 更新存储状态（等待组件加载完成）
     */
    updateStorageAfterComponentsLoad(storageInfo) {
        // 如果组件已加载，直接更新
        if (document.getElementById('welcome-storage-status')) {
            this.uiManager.updateStorageDisplay(storageInfo);
            return;
        }
        
        // 否则等待组件加载完成
        const handleComponentsLoaded = () => {
            this.uiManager.updateStorageDisplay(storageInfo);
            document.removeEventListener('componentsLoaded', handleComponentsLoaded);
        };
        
        document.addEventListener('componentsLoaded', handleComponentsLoaded);
        
        // 设置超时，避免无限等待
        setTimeout(() => {
            document.removeEventListener('componentsLoaded', handleComponentsLoaded);
            console.warn('⚠️ 组件加载超时，尝试直接更新存储状态');
            this.uiManager.updateStorageDisplay(storageInfo);
        }, 5000);
        
        // 立即尝试更新，以防组件已经加载
        setTimeout(() => {
            if (document.getElementById('welcome-storage-status')) {
                this.uiManager.updateStorageDisplay(storageInfo);
            }
        }, 100);
    }

    /**
     * 加载用户数据（只从接口拉取，全部同步到UIManager缓存）
     */
    async loadUserData(userData) {
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
            if (profile) {
                // 确保缓存头像URL到用户信息中
                if (profile.avatar) {
                    const avatarUrl = window.apiGateway?.buildUrl('/uploads/avatars/' + profile.avatar);
                    if (avatarUrl) {
                        // 更新用户信息中的头像URL
                        if (window.StorageManager && typeof window.StorageManager.setAvatar === 'function') {
                            window.StorageManager.setAvatar(avatarUrl);
                        } else {
                            // 如果 StorageManager 未加载，直接更新 userInfo
                            const userData = localStorage.getItem('userInfo');
                            if (userData) {
                                try {
                                    const userInfo = JSON.parse(userData);
                                    userInfo.avatarUrl = avatarUrl;
                                    localStorage.setItem('userInfo', JSON.stringify(userInfo));
                                } catch (error) {
                                    console.warn('更新头像URL失败:', error);
                                }
                            }
                        }
                    }
                }
                this.uiManager.updateProfileDisplay(profile);
            } else {
                // 如果API调用失败，尝试从localStorage获取用户信息
                const userData = localStorage.getItem('userInfo');
                if (userData) {
                    try {
                        const localUserData = JSON.parse(userData);
                        
                        // 从用户信息中获取头像URL
                        if (localUserData.avatarUrl) {
                            // 从完整URL中提取文件名
                            const avatarFileName = localUserData.avatarUrl.split('/').pop();
                            if (avatarFileName && avatarFileName !== 'null' && avatarFileName !== 'undefined') {
                                localUserData.avatar = avatarFileName;
                            }
                        }
                        
                        this.uiManager.updateProfileDisplayFromCache(localUserData);
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