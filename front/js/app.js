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
            // 等待API系统准备就绪
            await this.waitForApiSystem();
            
            // 使用新的API系统，确保向后兼容
            this.apiManager = window.apiSystem || window.apiManager;
            if (!this.apiManager) {
                console.warn('API管理器未找到');
                return;
            }

            // 使用已存在的认证系统实例，避免重复初始化
            this.authManager = window.authSystem || window.authManager;
            if (!this.authManager) {
                console.warn('认证管理器未找到');
                return;
            }
            
            // 初始化UI管理器
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
            
            // 设置环境切换事件监听
            this.setupEnvironmentChangeListener();
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
        }
    }

    // 设置环境切换事件监听
    setupEnvironmentChangeListener() {
        window.addEventListener('environmentChanged', async (event) => {
            try {
                console.log('🔄 环境切换事件触发');
                
                // 更新API网关的baseUrl
                if (window.apiGateway && typeof window.apiGateway.updateBaseUrl === 'function') {
                    window.apiGateway.updateBaseUrl();
                }
                
                // 更新认证管理器的baseUrl
                if (window.authManager && typeof window.authManager.updateBaseUrl === 'function') {
                    window.authManager.updateBaseUrl();
                }
                
                // 环境切换时重新获取头像信息
                if (this.uiManager) {
                    const userDataFromStorage = localStorage.getItem('userInfo');
                    
                    if (userDataFromStorage) {
                        try {
                            const userData = JSON.parse(userDataFromStorage);
                            
                            // 重新获取用户资料，更新头像缓存
                            const userId = userData.uuid || userData.id;
                            if (userId) {
                                const response = await window.apiGateway.get(`/api/profile?user_id=${userId}`);
                                if (response.ok) {
                                    const result = await response.json();
                                    if (result.success && result.profile && result.profile.avatar) {
                                        // 构建新环境的头像URL
                                                                                   const newAvatarUrl = window.apiGateway?.buildUrl('/uploads/avatars/' + result.profile.avatar);
                                           if (newAvatarUrl) {
                                               // 更新用户信息，包含新的头像URL
                                               const updatedUserInfo = {
                                                   ...userData,
                                                   ...result.profile,
                                                   avatarUrl: newAvatarUrl
                                               };
                                               
                                               if (window.StorageManager && typeof window.StorageManager.setUserInfo === 'function') {
                                                   window.StorageManager.setUserInfo(updatedUserInfo);
                                               } else if (window.StorageManager && typeof window.StorageManager.setUser === 'function') {
                                                   window.StorageManager.setUser(updatedUserInfo);
                                               } else {
                                                   // 如果 StorageManager 未加载，直接使用新的键结构
                                                   const userInfo = {
                                                       ...userData,
                                                       ...result.profile,
                                                       avatarUrl: newAvatarUrl
                                                   };
                                                   localStorage.setItem('userInfo', JSON.stringify(userInfo));
                                               }
                                               
                                               // 更新显示
                                               this.uiManager.updateProfileDisplay(updatedUserInfo);
                                           }
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('🔄 环境切换时获取新头像失败:', error);
                            // 如果获取失败，清除旧缓存，显示默认图标
                            if (window.StorageManager && typeof window.StorageManager.setAvatar === 'function') {
                                window.StorageManager.setAvatar(null);
                            } else {
                                // 如果 StorageManager 未加载，清除新的键结构中的头像URL
                                const userData = localStorage.getItem('userInfo');
                                if (userData) {
                                    try {
                                        const userInfo = JSON.parse(userData);
                                        delete userInfo.avatarUrl;
                                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                                    } catch (error) {
                                        console.warn('清除头像URL失败:', error);
                                    }
                                }
                            }
                            if (this.uiManager) {
                                this.uiManager.updateProfileDisplayFromCache(userData);
                            }
                        }
                    }
                }
                
                console.log('🔄 环境切换事件处理完成');
                
            } catch (error) {
                console.error('❌ 环境切换后数据重新加载失败:', error);
            }
        });
    }

    // 检查登录状态
    checkLoginStatus() {
        // 从新的存储管理器获取用户信息
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
                    if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
                        window.StorageManager.clearUser();
                    } else {
                        localStorage.removeItem('userInfo');
                    }
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
                
                // 检查并显示管理员菜单
                if (this.uiManager) {
                    this.uiManager.checkAndShowAdminMenu().catch(error => {
                        console.error('检查管理员权限失败:', error);
                    });
                }
                
                // 页面刷新时，只使用本地缓存，不重新获取数据
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
            } catch (error) {
                console.error('解析用户数据失败:', error);
                if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
                    window.StorageManager.clearUser();
                } else {
                    localStorage.removeItem('userInfo');
                }
                this.showLoginInterface();
            }
        } else {
            this.showLoginInterface();
        }
    }

    // 登录时加载用户数据并缓存头像
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

    // 加载用户数据（只从接口拉取，全部同步到UIManager缓存）
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

    // 更新用户显示（从缓存）
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

    // 更新用户显示
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

    // 更新存储状态（等待组件加载完成）
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

    // 设置事件监听器
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

        // 监听组件加载完成事件
        document.addEventListener('componentsLoaded', (event) => {
            this.initDateDisplay();
        });
    }

    // 登录成功处理
    async onLoginSuccess(userData) {
        // 从事件详情中获取用户数据
        const user = userData.user || userData;
        
        // 同步用户信息到API管理器
        if (this.apiManager && typeof this.apiManager.setCurrentUser === 'function') {
            this.apiManager.setCurrentUser(user);
        }
        
        // 立即显示主界面，不等待数据加载
        this.showMainInterface();
        
        // 检查并显示管理员菜单
        if (this.uiManager) {
            this.uiManager.checkAndShowAdminMenu().catch(error => {
                console.error('检查管理员权限失败:', error);
            });
        }
        
        // 设置日期显示
        this.initDateDisplay();
        
        // 显示登录成功消息
        if (window.Notify) {
            window.Notify.show({ message: '登录成功', type: 'success' });
        }
        
        // 异步加载用户数据，不阻塞界面切换
        this.loadUserDataAndCacheAvatar(user).catch(error => {
            console.error('加载用户数据失败:', error);
        });
    }

    // 退出登录
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
}

// 应用初始化由index.html中的模板加载完成后调用 

function renderStorageFromCache() {
    let storageInfo = null;
    if (window.StorageManager && typeof window.StorageManager.getStorageInfo === 'function') {
        storageInfo = window.StorageManager.getStorageInfo();
    } else {
        // 如果 StorageManager 未加载，直接使用新的键结构
        const systemData = localStorage.getItem('systemInfo');
        if (systemData) {
            try {
                const systemInfo = JSON.parse(systemData);
                storageInfo = systemInfo.storageInfo || null;
            } catch (e) {
                console.warn('解析系统信息失败:', e);
            }
        }
    }
    
    // 检查主存储空间的关键DOM元素是否已加载
    const totalStorageEl = document.getElementById('total-storage');
    if (
        storageInfo &&
        window.uiManager &&
        typeof window.uiManager.updateStorageDisplay === 'function' &&
        totalStorageEl // 只有主存储区元素存在才渲染
    ) {
        try {
            window.uiManager.updateStorageDisplay(storageInfo);
            // 同步欢迎模块存储状态
            if (typeof window.uiManager.updateWelcomeStorageStatus === 'function') {
                const storageData = storageInfo.storage || storageInfo;
                const used = storageData.used_space || storageData.used_bytes || 0;
                const total = storageData.total_space || storageData.limit_bytes || 1073741824;
                const percent = total > 0 ? (used / total) * 100 : 0;
                window.uiManager.updateWelcomeStorageStatus(percent);
            }
        } catch (e) {
            // 忽略解析错误
        }
        return true;
    }
    return false;
}

function renderUserFromCache() {
    let userData = null;
    if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
        userData = window.StorageManager.getUser();
    } else {
        // 如果 StorageManager 未加载，直接使用新的键结构
        const userDataStr = localStorage.getItem('userInfo');
        if (userDataStr) {
            try {
                userData = JSON.parse(userDataStr);
            } catch (e) {
                console.warn('解析用户数据失败:', e);
            }
        }
    }
    
    const welcomeMessage = document.getElementById('welcome-message');
    if (
        userData &&
        window.uiManager &&
        typeof window.uiManager.updateProfileDisplayFromCache === 'function' &&
        welcomeMessage // 只有欢迎消息元素存在才渲染
    ) {
        try {
            window.uiManager.updateProfileDisplayFromCache(userData);
        } catch (e) {
            // 忽略解析错误
        }
        return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', function () {
    // 轮询直到 uiManager 挂载并渲染缓存数据
    let tryCount = 0;
    (function waitForUIManager() {
        const storageRendered = renderStorageFromCache();
        const userRendered = renderUserFromCache();
        
        if (!storageRendered || !userRendered) {
            tryCount++;
            if (tryCount < 50) { // 最多尝试5秒
                setTimeout(waitForUIManager, 100);
            }
        }
    })();
}); 