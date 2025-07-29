/**
<<<<<<< HEAD
 * 管理员管理器
 * 处理管理员权限验证、管理员功能显示/隐藏、管理员数据加载等
 */
class UIAdminManager {
    constructor() {
        this.isAdmin = false;
        this.adminData = null;
        this.currentView = 'dashboard';
        this.updateLogsData = null;
        this.updateLogsSyncStatus = null;
        this.updateLogsStats = null;
    }

    async init() {
        try {
            this.hideSyncDocsButton();
            await this.checkAdminPermissions();
            this.setupAdminMenu();
            // 修复头像下拉菜单交互
            this.fixAvatarDropdownInteraction();
            // 延迟绑定事件，确保DOM完全加载
            setTimeout(() => {
                this.bindAdminEvents();
            }, 500);
            this.loadSystemStats();
            if (this.isAdmin) {
                await this.ensureAdminDataLoaded();
            }
            setTimeout(() => {
                this.delayedInitCheck();
            }, 2000);
            window.addEventListener('forceRefreshComplete', (event) => {
                setTimeout(() => {
                    this.restoreAdminPermissionsAfterForceRefresh();
                }, 500);
            });
            window.addEventListener('environmentChanged', (event) => {
                setTimeout(() => {
                    this.restoreAdminPermissionsAfterForceRefresh();
                }, 300);
            });
        } catch (error) {
            console.error('❌ 管理员管理器初始化失败:', error);
        }
    }

    /**
     * 延迟初始化检查
     */
    async delayedInitCheck() {
        // 使用统一的管理员功能管理方法
        this.manageAdminFeatures();
        
        // 如果是管理员，确保管理员数据已加载
        if (this.isAdmin) {
            const userInfo = this.getCurrentUser();
            
            // 强制更新头像显示
            this.forceUpdateAvatarDisplay(userInfo);
            
            // 确保管理员数据已加载
            await this.ensureAdminDataLoaded();
            
            // 强制更新头像下拉菜单
            this.updateAvatarAdminMenu();
        } else {
            // 非管理员：确保隐藏所有管理员按钮
            this.forceHideAllAdminFeatures();
            
            // 更新头像下拉菜单，确保隐藏管理员按钮
            this.updateAvatarAdminMenu();
        }
    }

    /**
     * 确保管理员数据已加载
     */
    async ensureAdminDataLoaded() {
        try {
            // 确保文件列表已加载
            if (window.uiManager && window.uiManager.allFiles) {
                // 重新渲染文件列表
                window.uiManager.renderFileList(window.uiManager.allFiles);
                
                // 更新文件统计
                const totalFiles = window.uiManager.allFiles.length;
                window.uiManager.updateFileCount(totalFiles, totalFiles);
                
                // 更新欢迎模块的文件统计
                const fileCountElement = document.getElementById('file-count');
                if (fileCountElement) {
                    fileCountElement.textContent = totalFiles;
                }
            }
            
            // 确保用户信息已正确显示
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                // 更新欢迎模块的用户名
                const welcomeMessage = document.getElementById('welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.textContent = `欢迎回来，${currentUser.username}`;
                }
=======
 * 管理员模块
 * 处理管理员权限检查、系统设置、用户管理等功能
 */
if (typeof UIAdminManager === 'undefined') {
    class UIAdminManager {
        constructor() {
            this.isAdmin = false;
            this.adminMenu = null;
            this.userList = [];
            this.systemStats = null;
            this.adminSettings = {};
            this.currentView = 'dashboard';
        }

        /**
         * 初始化管理员模块
         */
        async init() {
            // 立即隐藏同步文档按钮，避免页面刷新时短暂显示
            this.hideSyncDocsButton();
            
            await this.checkAdminPermissions();
            this.setupAdminMenu();
            this.bindAdminEvents();
            this.loadSystemStats();
            
            // 如果是管理员，确保加载所有必要的数据
            if (this.isAdmin) {
                await this.ensureAdminDataLoaded();
            }
            
            // 延迟检查，确保登录后能够正确显示
            setTimeout(() => {
                this.delayedInitCheck();
            }, 2000);
        }

        /**
         * 延迟初始化检查
         */
        async delayedInitCheck() {
            console.log('执行延迟初始化检查');
            
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.username === 'Mose') {
                console.log('延迟检查发现管理员用户，强制更新显示');
                this.isAdmin = true;
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
                
                // 强制更新头像显示
                this.forceUpdateAvatarDisplay(currentUser);
                
<<<<<<< HEAD
                // 更新头像显示
                if (window.uiManager && window.uiManager.profileManager) {
                    window.uiManager.profileManager.updateProfileDisplay(currentUser);
                }
            }
            
            // 确保存储信息已显示
            if (window.uiManager && window.uiManager.storageInfo) {
                window.uiManager.updateStorageDisplay(window.uiManager.storageInfo);
            }
            
            // 强制显示管理员相关元素
            this.forceShowAdminElements();
            
            // 确保管理员数据已加载
            await this.loadAdminData();
            
            // 移除自动验证，验证功能应该只在点击按钮时执行
            // this.validateUpdateLogIntegrity();
        } catch (error) {
            console.error('加载管理员数据失败:', error);
        }
    }

    /**
     * 强制更新头像显示
     */
    forceUpdateAvatarDisplay(userData) {
        if (!userData) return;
        
        try {
            // 获取缓存的头像URL
            let avatarUrl = null;
            if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                avatarUrl = window.StorageManager.getAvatar();
            } else {
                const cachedAvatar = localStorage.getItem('cachedAvatar');
                if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                    avatarUrl = cachedAvatar;
                }
            }
            
            // 如果没有缓存的头像，使用用户数据中的头像
            if (!avatarUrl && userData.avatarUrl) {
                avatarUrl = userData.avatarUrl;
            }
            
            const avatarElements = [
                document.getElementById('user-avatar'),
                document.getElementById('avatar-image'),
                document.getElementById('avatar-icon')
            ];
            
            avatarElements.forEach(element => {
                if (element) {
                    if (avatarUrl && avatarUrl !== 'null' && avatarUrl !== 'undefined' && !avatarUrl.includes('docs.png')) {
                        element.src = avatarUrl;
                        element.style.display = 'block';
                        element.style.visibility = 'visible';
                        element.style.opacity = '1';
                        element.classList.remove('hidden');
                    } else {
                        // 使用默认头像
                        element.style.display = 'none';
                        element.classList.add('hidden');
                    }
                }
            });
        } catch (error) {
            console.error('强制更新头像显示失败:', error);
        }
    }

    /**
     * 更新所有头像元素
     */
    updateAllAvatarElements(avatarUrl) {
        const avatarElements = [
            document.getElementById('user-avatar'),
            document.getElementById('avatar-image'),
            document.getElementById('avatar-icon')
        ];
        
        avatarElements.forEach(element => {
            if (element) {
                if (avatarUrl) {
                    element.src = avatarUrl;
                    element.style.display = 'block';
                    element.classList.remove('hidden');
                } else {
                    element.style.display = 'none';
                    element.classList.add('hidden');
                }
            }
        });
    }

    /**
     * 强制显示管理员元素
     */
    forceShowAdminElements() {
        // 强制显示管理员相关元素
        this.retryShowAdminElements();
    }

    /**
     * 重试显示管理员元素
     */
    retryShowAdminElements() {
        if (!this.isAdmin) { return; }
        
        // 强制显示所有管理员相关DOM元素
        this.forceShowAllAdminElements();
    }

    /**
     * 强制显示所有管理员相关DOM元素
     */
    forceShowAllAdminElements() {
        if (!this.isAdmin) { return; }
        
        // 注意：同步文档按钮不在这里强制显示，因为它只在管理员用户且在外站文档分类时才显示
        // 同步文档按钮的显示逻辑由categories.js模块管理
        
        // 强制显示设置按钮
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.style.display = 'block !important';
            settingsBtn.style.visibility = 'visible';
            settingsBtn.classList.remove('hidden');
            settingsBtn.removeAttribute('hidden');
        }
        
        // 强制显示管理员菜单
        const adminMenu = document.getElementById('admin-menu');
        if (adminMenu) {
            adminMenu.style.display = 'block !important';
            adminMenu.style.visibility = 'visible';
            adminMenu.classList.remove('hidden');
            adminMenu.removeAttribute('hidden');
        }
        
        // 强制显示管理存储空间按钮
        this.forceShowStorageSettingsButton();
    }

    /**
     * 强制显示管理存储空间按钮
     */
    forceShowStorageSettingsButton() {
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        if (storageSettingsBtn) {
            storageSettingsBtn.style.display = 'inline-block !important';
            storageSettingsBtn.style.visibility = 'visible';
            storageSettingsBtn.classList.remove('hidden');
            storageSettingsBtn.removeAttribute('hidden');
            storageSettingsBtn.style.opacity = '1';
            storageSettingsBtn.style.pointerEvents = 'auto';
        }
    }

    /**
     * 检查管理员权限
     */
    async checkAdminPermissions() {
        try {
            // 检查 cookie 是否有 admin_token
            const isAdmin = this.hasAdminToken();
            this.isAdmin = isAdmin;

            if (isAdmin) {
                this.showAdminMenu();
                this.showAdminFloatingButtons();
                this.forceShowStorageSettingsButton();
            } else {
                this.hideAdminMenu();
                this.hideAdminFloatingButtons();
                this.hideStorageSettingsButton();
            }

        } catch (error) {
            console.error('❌ 检查管理员权限失败:', error);
            this.isAdmin = false;
        }
    }

    /**
     * 强制刷新后恢复管理员权限
     */
    async restoreAdminPermissionsAfterForceRefresh() {
        try {
            // 重新检查管理员权限
            await this.checkAdminPermissions();
            
            // 如果是管理员，确保管理员数据已加载
            if (this.isAdmin) {
                await this.ensureAdminDataLoaded();
                
                // 强制更新头像显示
                const userInfo = this.getCurrentUser();
                if (userInfo) {
                    this.forceUpdateAvatarDisplay(userInfo);
                }
                
                // 强制更新头像下拉菜单
                this.updateAvatarAdminMenu();
            }
        } catch (error) {
            console.error('恢复管理员权限失败:', error);
        }
    }

    /**
     * 延迟检查管理员权限
     */
    async delayedCheckAdminPermissions() {
        try {
            await this.checkAdminPermissions();
            
            if (this.isAdmin) {
                await this.ensureAdminDataLoaded();
            }
        } catch (error) {
            console.error('延迟检查管理员权限失败:', error);
        }
    }

    /**
     * 获取当前用户信息
     */
    getCurrentUser() {
        try {
            // 尝试从多个来源获取用户信息
            let userInfo = null;
            
            // 方法1: 从localStorage获取
            const storedUserInfo = localStorage.getItem('userInfo');
            if (storedUserInfo) {
                try {
                    userInfo = JSON.parse(storedUserInfo);
                } catch (error) {
                    console.warn('⚠️ 解析localStorage中的用户信息失败:', error);
                }
            }
            
            // 方法2: 从window对象获取
            if (!userInfo && window.currentUser) {
                userInfo = window.currentUser;
            }
            
            // 方法3: 从StorageManager获取
            if (!userInfo && window.StorageManager && typeof window.StorageManager.getUser === 'function') {
                userInfo = window.StorageManager.getUser();
            }
            
            // 方法4: 从authManager获取
            if (!userInfo && window.authManager && typeof window.authManager.getCurrentUser === 'function') {
                userInfo = window.authManager.getCurrentUser();
            }
            
            if (userInfo) {
                return userInfo;
            } else {
                console.warn('⚠️ 未找到用户信息');
                return null;
            }
            
        } catch (error) {
            console.error('❌ 获取当前用户信息失败:', error);
            return null;
        }
    }

    /**
     * 隐藏同步文档按钮
     */
    hideSyncDocsButton() {
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        if (syncDocsBtn) {
            syncDocsBtn.style.display = 'none';
            syncDocsBtn.classList.add('hidden');
            syncDocsBtn.setAttribute('hidden', '');
        }
    }

    /**
     * 隐藏管理存储空间按钮
     */
    hideStorageSettingsButton() {
        const storageSettingsBtn = document.getElementById('storage-settings-btn');
        if (storageSettingsBtn) {
            storageSettingsBtn.style.display = 'none';
            storageSettingsBtn.classList.add('hidden');
            storageSettingsBtn.setAttribute('hidden', '');
        }
    }

    /**
     * 更新头像下拉菜单中的管理员菜单显示
     */
    updateAvatarAdminMenu() {
        // 使用统一的管理员功能管理方法
        this.manageAdminFeatures();
        
        // 生产环境：如果元素不存在，延迟重试
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            const adminMenu = document.getElementById('admin-menu');
            const settingsBtn = document.getElementById('settings-btn');
            if (!adminMenu || !settingsBtn) {
                setTimeout(() => {
                    this.updateAvatarAdminMenu();
                }, 500);
            }
        }
    }

    /**
     * 显示管理员悬浮按钮
     */
    showAdminFloatingButtons() {
        // 首先检查用户权限
        if (!this.isAdminUser()) {
            return;
        }
        
        // 注意：同步文档按钮不在这里强制显示，因为它只在管理员用户且在外站文档分类时才显示
        // 同步文档按钮的显示逻辑由categories.js模块管理
    }

    /**
     * 隐藏管理员悬浮按钮
     */
    hideAdminFloatingButtons() {
        const syncDocsBtn = document.getElementById('sync-docs-btn');
        if (syncDocsBtn) {
            syncDocsBtn.style.display = 'none';
            syncDocsBtn.classList.add('hidden');
            syncDocsBtn.setAttribute('hidden', '');
        }
    }

    /**
     * 设置管理员菜单
     */
    setupAdminMenu() {
        // 检查管理员菜单是否存在
        const adminMenu = document.getElementById('admin-menu');
        if (!adminMenu) {
            console.error('❌ 管理员菜单元素未找到');
            return;
        }
        
        // 确保管理员菜单可见
        adminMenu.style.display = 'block';
        adminMenu.classList.remove('hidden');
        adminMenu.removeAttribute('hidden');
        adminMenu.style.visibility = 'visible';
        adminMenu.style.opacity = '1';
        adminMenu.style.position = 'static';
        adminMenu.style.width = 'auto';
        adminMenu.style.height = 'auto';
        adminMenu.style.background = 'transparent';
        adminMenu.style.boxShadow = 'none';
        adminMenu.style.transform = 'none';
        adminMenu.style.overflow = 'visible';
        adminMenu.style.zIndex = 'auto';
        
    }

    /**
     * 创建管理员菜单
     */
    createAdminMenu() {
        // 管理员菜单已经在HTML中定义，这里只需要确保正确显示
        const adminMenu = document.getElementById('admin-menu');
        const settingsBtn = document.getElementById('settings-btn');
        
        if (adminMenu && settingsBtn) {
            if (this.isAdmin) {
                // 管理员：显示设置按钮和管理员菜单
                settingsBtn.style.display = 'block';
                settingsBtn.classList.remove('hidden');
                settingsBtn.removeAttribute('hidden');
                
                adminMenu.style.display = 'block';
                adminMenu.classList.remove('hidden');
                adminMenu.removeAttribute('hidden');
            } else {
                // 非管理员：隐藏设置按钮和管理员菜单
                settingsBtn.style.display = 'none';
                settingsBtn.classList.add('hidden');
                settingsBtn.setAttribute('hidden', '');
                
                adminMenu.style.display = 'none';
                adminMenu.classList.add('hidden');
                adminMenu.setAttribute('hidden', '');
            }
        }
    }

    /**
     * 绑定管理员事件
     */
    bindAdminEvents() {
        try {
            // 绑定管理员菜单事件
            const adminUsersBtn = document.getElementById('admin-users-btn');
            const adminUpdateLogsBtn = document.getElementById('admin-update-logs-btn');
            const updateLogsBtn = document.getElementById('update-logs-btn'); // 普通用户的更新日志按钮
            const settingsBtn = document.getElementById('settings-btn');
            const storageSettingsBtn = document.getElementById('storage-settings-btn');
            const syncDocsBtn = document.getElementById('sync-docs-btn');
            
            // 用户管理按钮事件
            if (adminUsersBtn) {
                adminUsersBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchAdminView('users');
                });
            }
            
            // 管理员更新日志管理按钮事件
            if (adminUpdateLogsBtn) {
                adminUpdateLogsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchAdminView('update-logs');
                });
            } else {
                console.error('❌ 管理员更新日志管理按钮未找到');
            }
            
            // 普通用户更新日志按钮事件
            if (updateLogsBtn) {
                updateLogsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 如果是管理员，显示管理界面；否则显示普通用户界面
                    if (this.isAdmin) {
                        this.switchAdminView('update-logs');
                    } else {
                        // 显示普通用户的更新日志界面
                        this.showUpdateLogsModal();
                    }
                });
            } else {
                console.error('❌ 普通用户更新日志按钮未找到');
            }
            
            // 设置按钮事件
            if (settingsBtn) {
                settingsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchAdminView('settings');
                });
            }
            
            // 管理存储空间按钮事件
            if (storageSettingsBtn) {
                storageSettingsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchAdminView('storage');
                });
            }
            
            // 同步文档按钮事件
            if (syncDocsBtn) {
                syncDocsBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // 调用正确的同步文档模态框方法
                    if (window.uiManager && window.uiManager.docsSync && window.uiManager.docsSync.showSyncDocsModal) {
                        window.uiManager.docsSync.showSyncDocsModal();
                    } else if (window.docsSync && window.docsSync.showSyncDocsModal) {
                        window.docsSync.showSyncDocsModal();
                    } else {
                        console.error('同步文档模态框方法未找到');
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ 绑定管理员事件失败:', error);
        }
    }

    /**
     * 显示管理员菜单
     */
    showAdminMenu() {
        const adminMenu = document.getElementById('admin-menu');
        if (adminMenu) {
            adminMenu.style.display = 'block';
            adminMenu.classList.remove('hidden');
            adminMenu.removeAttribute('hidden');
            adminMenu.style.visibility = 'visible';
            adminMenu.style.opacity = '1';
            adminMenu.style.position = 'static';
            adminMenu.style.width = 'auto';
            adminMenu.style.height = 'auto';
            adminMenu.style.background = 'transparent';
            adminMenu.style.boxShadow = 'none';
            adminMenu.style.transform = 'none';
            adminMenu.style.overflow = 'visible';
            adminMenu.style.zIndex = 'auto';
        } else {
            console.error('管理员菜单元素未找到');
        }
    }

    /**
     * 隐藏管理员菜单
     */
    hideAdminMenu() {
        const adminMenu = document.getElementById('admin-menu');
        if (adminMenu) {
            adminMenu.style.display = 'none';
            adminMenu.classList.add('hidden');
            adminMenu.setAttribute('hidden', '');
        }
    }

    /**
     * 切换管理员视图
     */
    switchAdminView(view) {
        this.currentView = view;
        
        // 加载视图数据
        this.loadViewData(view);
        
        // 根据视图类型显示相应的模态框或界面
        switch (view) {
            case 'users':
                this.showUserManagementModal();
                break;
            case 'update-logs':
                this.showUpdateLogsModal();
                break;
            case 'settings':
                this.showSystemSettingsModal();
                break;
            case 'storage':
                this.showStorageManagementModal();
                break;
            case 'dashboard':
                this.showDashboardModal();
                break;
            case 'logs':
                this.showSystemLogsModal();
                break;
            default:
                console.warn('未知的管理员视图:', view);
        }
    }

    /**
     * 加载视图数据
     */
    loadViewData(view) {
        switch (view) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'users':
                this.loadUserList();
                break;
            case 'storage':
                this.loadStorageData();
                break;
            case 'settings':
                this.loadSystemSettings();
                break;
            case 'logs':
                this.loadSystemLogs();
                break;
            case 'update-logs':
                this.loadUpdateLogs();
                break;
        }
    }

    /**
     * 加载管理员数据
     */
    async loadAdminData() {
        try {
            // 加载系统统计信息
            await this.loadSystemStats();
            
            // 加载用户列表
            await this.loadUserList();
            
            // 加载存储数据
            await this.loadStorageData();
            
            // 加载系统设置
            await this.loadSystemSettings();
            
            // 加载系统日志
            await this.loadSystemLogs();
            
            // 加载更新日志
            await this.loadUpdateLogs();
            
        } catch (error) {
            console.error('加载管理员数据失败:', error);
        }
    }

    /**
     * 加载系统统计信息
     */
    async loadSystemStats() {
        try {
            // 这里可以加载真实的系统统计信息
            const stats = this.getSystemStats();
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('加载系统统计信息失败:', error);
        }
    }

    /**
     * 更新统计信息显示
     */
    updateStatsDisplay(stats) {
        // 更新统计信息显示
    }

    /**
     * 加载仪表板数据
     */
    async loadDashboardData() {
        try {
            // 加载仪表板数据
        } catch (error) {
            console.error('加载仪表板数据失败:', error);
        }
    }

    /**
     * 加载用户列表
     */
    async loadUserList() {
        try {
            // 这里可以加载真实的用户列表
            const users = this.getMockUserList();
            this.renderUserList(users);
        } catch (error) {
            console.error('加载用户列表失败:', error);
        }
    }

    /**
     * 渲染用户列表
     */
    renderUserList(users) {
        // 渲染用户列表
    }

    /**
     * 过滤用户
     */
    filterUsers(searchTerm) {
        // 过滤用户列表
    }

    /**
     * 按角色过滤用户
     */
    filterUsersByRole(role) {
        // 按角色过滤用户
    }

    /**
     * 加载存储数据
     */
    async loadStorageData() {
        try {
            // 这里可以加载真实的存储数据
            const storageData = {
                total: 5368709120, // 5GB
                used: 1288490188,  // 1.2GB
                available: 4080218932,
                usage_percent: 24
            };
            this.updateStorageDisplay(storageData);
        } catch (error) {
            console.error('加载存储数据失败:', error);
        }
    }

    /**
     * 更新存储显示
     */
    updateStorageDisplay(storageData) {
        // 更新存储信息显示
    }

    /**
     * 加载系统设置
     */
    async loadSystemSettings() {
        try {
            // 加载系统设置
            const settings = this.getAdminSettings();
            this.updateSettingsForm(settings);
        } catch (error) {
            console.error('加载系统设置失败:', error);
        }
    }

    /**
     * 更新设置表单
     */
    updateSettingsForm(settings) {
        // 更新设置表单
    }

    /**
     * 保存系统设置
     */
    async saveSystemSettings() {
        try {
            // 保存系统设置
        } catch (error) {
            console.error('保存系统设置失败:', error);
        }
    }

    /**
     * 加载系统日志
     */
    async loadSystemLogs() {
        try {
            // 这里可以加载真实的系统日志
            const logs = this.getMockSystemLogs();
            this.renderSystemLogs(logs);
        } catch (error) {
            console.error('加载系统日志失败:', error);
        }
    }

    /**
     * 渲染系统日志
     */
    renderSystemLogs(logs) {
        // 渲染系统日志
    }

    /**
     * 获取角色显示名称
     */
    getRoleDisplayName(role) {
        const roleNames = {
            'admin': '管理员',
            'user': '普通用户',
            'guest': '访客'
        };
        return roleNames[role] || role;
    }

    /**
     * 格式化存储大小
     */
    formatStorageSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleString('zh-CN');
    }

    /**
     * 获取模拟用户列表
     */
    getMockUserList() {
        return [
            {
                id: 1,
                username: 'Mose',
                email: 'mose@example.com',
                role: 'admin',
                status: 'active',
                created_at: '2024-01-01T00:00:00Z',
                last_login: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                username: 'user1',
                email: 'user1@example.com',
                role: 'user',
                status: 'active',
                created_at: '2024-01-02T00:00:00Z',
                last_login: '2024-01-14T15:20:00Z'
            },
            {
                id: 3,
                username: 'user2',
                email: 'user2@example.com',
                role: 'user',
                status: 'inactive',
                created_at: '2024-01-03T00:00:00Z',
                last_login: '2024-01-10T09:15:00Z'
            }
        ];
    }

    /**
     * 获取模拟系统日志
     */
    getMockSystemLogs() {
        return [
            {
                id: 1,
                level: 'info',
                message: '系统启动成功',
                timestamp: '2024-01-15T10:00:00Z',
                user: 'system'
            },
            {
                id: 2,
                level: 'warning',
                message: '存储空间使用率超过80%',
                timestamp: '2024-01-15T09:30:00Z',
                user: 'system'
            },
            {
                id: 3,
                level: 'error',
                message: '数据库连接失败',
                timestamp: '2024-01-15T09:00:00Z',
                user: 'system'
            }
        ];
    }

    /**
     * 编辑用户
     */
    editUser(userId) {
        // 编辑用户逻辑
    }

    /**
     * 切换用户状态
     */
    toggleUserStatus(userId) {
        // 切换用户状态逻辑
    }

    /**
     * 删除用户
     */
    deleteUser(userId) {
        // 删除用户逻辑
    }

    /**
     * 刷新日志
     */
    refreshLogs() {
        // 刷新日志逻辑
    }

    /**
     * 检查是否为管理员（基于cookie中的管理员token）
     */
    isAdminUser() {
        try {
            // 检查cookie中是否有管理员token
            const cookies = document.cookie.split(';');
            const adminAccessToken = cookies.find(cookie => cookie.trim().startsWith('admin_access_token='));
            const adminRefreshToken = cookies.find(cookie => cookie.trim().startsWith('admin_refresh_token='));
            
            // 只有同时存在管理员访问token和刷新token才认为是管理员
            return !!(adminAccessToken && adminRefreshToken);
        } catch (error) {
            console.error('检查管理员权限失败:', error);
            return false;
        }
    }

    /**
     * 统一管理所有管理员功能显示/隐藏
     */
    manageAdminFeatures() {
        const isAdmin = this.isAdminUser();
        
        // 管理员功能列表（移除sync-docs-btn，因为它只在管理员用户且在外站文档分类时才显示）
        const adminFeatures = [
            { id: 'settings-btn', type: 'block' },
            { id: 'admin-menu', type: 'block' },
            { id: 'storage-settings-btn', type: 'inline-block' },
            { id: 'admin-users-btn', type: 'block' },
            { id: 'admin-update-logs-btn', type: 'block' }
        ];
        
        // 外站文档按钮（需要特殊处理，因为它没有固定的id）
        const externalDocsBtn = document.querySelector('.file-type-btn[data-type="external-docs"]');
        
        if (isAdmin) {
            // 管理员：显示所有管理员功能
            this.isAdmin = true;
            adminFeatures.forEach(feature => {
                const element = document.getElementById(feature.id);
                if (element) {
                    element.style.display = `${feature.type} !important`;
                    element.style.visibility = 'visible';
                    element.classList.remove('hidden');
                    element.removeAttribute('hidden');
                    
                    // 特殊处理管理员菜单，确保在用户下拉菜单中正确显示
                    if (feature.id === 'admin-menu') {
                        element.style.position = 'static';
                        element.style.width = 'auto';
                        element.style.height = 'auto';
                        element.style.background = 'transparent';
                        element.style.boxShadow = 'none';
                        element.style.transform = 'none';
                        element.style.overflow = 'visible';
                        element.style.zIndex = 'auto';
                        element.style.opacity = '1';
                    }
                }
            });
            
            // 显示外站文档按钮，确保图标垂直居中
            if (externalDocsBtn) {
                externalDocsBtn.style.display = 'inline-flex';
                externalDocsBtn.style.alignItems = 'center';
                externalDocsBtn.style.justifyContent = 'center';
                externalDocsBtn.classList.remove('hidden');
                externalDocsBtn.removeAttribute('hidden');
                
                // 确保按钮内的图标和文字垂直居中
                const icon = externalDocsBtn.querySelector('i');
                const text = externalDocsBtn.querySelector('span');
                if (icon) {
                    icon.style.display = 'inline-block';
                    icon.style.verticalAlign = 'middle';
                }
                if (text) {
                    text.style.display = 'inline-block';
                    text.style.verticalAlign = 'middle';
                }
            }
            
            // 显示管理员悬浮按钮
            this.showAdminFloatingButtons();
            
        } else {
            // 非管理员：隐藏所有管理员功能
            this.isAdmin = false;
            adminFeatures.forEach(feature => {
                const element = document.getElementById(feature.id);
                if (element) {
                    element.style.display = 'none';
                    element.classList.add('hidden');
                    element.setAttribute('hidden', '');
                }
            });
            
            // 隐藏外站文档按钮
            if (externalDocsBtn) {
                externalDocsBtn.style.display = 'none';
                externalDocsBtn.classList.add('hidden');
                externalDocsBtn.setAttribute('hidden', '');
            }
            
            // 隐藏管理员悬浮按钮
            this.hideAdminFloatingButtons();
        }
    }

    /**
     * 强制隐藏所有管理员功能
     */
    forceHideAllAdminFeatures() {
        // 管理员功能列表（移除sync-docs-btn，因为它的显示逻辑由categories.js模块管理）
        const adminFeatures = [
            { id: 'settings-btn', type: 'block' },
            { id: 'admin-menu', type: 'block' },
            { id: 'storage-settings-btn', type: 'inline-block' },
            { id: 'admin-users-btn', type: 'block' },
            { id: 'admin-update-logs-btn', type: 'block' }
        ];
        
        adminFeatures.forEach(feature => {
            const element = document.getElementById(feature.id);
            if (element) {
                element.style.display = 'none';
                element.classList.add('hidden');
                element.setAttribute('hidden', '');
            }
        });
        
        // 隐藏外站文档按钮，保持正确的样式
        const externalDocsBtn = document.querySelector('.file-type-btn[data-type="external-docs"]');
        if (externalDocsBtn) {
            externalDocsBtn.style.display = 'none';
            externalDocsBtn.classList.add('hidden');
            externalDocsBtn.setAttribute('hidden', '');
            
            // 重置按钮样式，确保下次显示时正确
            externalDocsBtn.style.alignItems = '';
            externalDocsBtn.style.justifyContent = '';
            
            // 重置图标和文字样式
            const icon = externalDocsBtn.querySelector('i');
            const text = externalDocsBtn.querySelector('span');
            if (icon) {
                icon.style.display = '';
                icon.style.verticalAlign = '';
            }
            if (text) {
                text.style.display = '';
                text.style.verticalAlign = '';
            }
        }
    }

    /**
     * 获取管理员设置
     */
    getAdminSettings() {
        return {
            system_name: '星际云盘',
            max_file_size: 100 * 1024 * 1024, // 100MB
            allowed_file_types: ['jpg', 'png', 'pdf', 'doc', 'xlsx'],
            storage_limit: 5 * 1024 * 1024 * 1024 // 5GB
        };
    }

    /**
     * 获取系统统计信息
     */
    getSystemStats() {
        return {
            total_users: 150,
            active_users: 120,
            total_files: 2500,
            total_storage: '1.2 GB',
            system_uptime: '15天'
        };
    }

    /**
     * 加载更新日志
     */
    async loadUpdateLogs() {
        try {
            // 加载更新日志数据
            await this.loadUpdateLogsData();
            
            // 加载同步状态
            await this.loadUpdateLogsSyncStatus();
            
            // 加载统计信息
            await this.loadUpdateLogsStats();
            
            // 只有在模态框存在时才渲染内容
            const contentContainer = document.getElementById('update-logs-content');
            if (contentContainer) {
                this.renderUpdateLogsContent();
            }
            
        } catch (error) {
            console.error('❌ 加载更新日志失败:', error);
        }
    }

    /**
     * 渲染更新日志内容
     */
    renderUpdateLogsContent() {
        const contentContainer = document.getElementById('update-logs-content');
        if (!contentContainer) {
            console.error('❌ 更新日志内容容器未找到');
            return;
        }

        if (!this.updateLogsData || !this.updateLogsData.logs) {
            console.warn('⚠️ 暂无更新日志数据');
            contentContainer.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fa fa-exclamation-triangle text-2xl mb-4"></i>
                    <p>暂无更新日志数据</p>
                </div>
            `;
            return;
        }

        const logs = this.updateLogsData.logs;
        let html = '';

        // 添加统计信息
        if (this.updateLogsStats) {
            html += `
                <div class="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/20 rounded-lg p-4 mb-6">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-300">${this.updateLogsStats.total_logs}</div>
                            <div class="text-sm text-gray-400">总日志数</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-300">${this.updateLogsStats.latest_version || 'N/A'}</div>
                            <div class="text-sm text-gray-400">最新版本</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-300">${this.updateLogsStats.total_features}</div>
                            <div class="text-sm text-gray-400">功能总数</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-300">${this.updateLogsStats.total_issues}</div>
                            <div class="text-sm text-gray-400">问题总数</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 添加同步状态
        if (this.updateLogsSyncStatus) {
            const lastSync = this.updateLogsSyncStatus.last_sync ? 
                new Date(this.updateLogsSyncStatus.last_sync).toLocaleString() : '从未同步';
            const syncStatus = this.updateLogsSyncStatus.sync_status;
            const statusColor = syncStatus === 'success' ? 'text-green-400' : 
                               syncStatus === 'error' ? 'text-red-400' : 'text-yellow-400';
            
            html += `
                <div class="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg p-4 mb-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-sm text-gray-400">同步状态</div>
                            <div class="text-lg font-semibold ${statusColor}">${syncStatus === 'success' ? '同步成功' : syncStatus === 'error' ? '同步失败' : '同步中'}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm text-gray-400">最后同步</div>
                            <div class="text-sm text-gray-300">${lastSync}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 添加操作按钮
        html += `
            <div class="flex space-x-4 mb-6">
                <button id="confirm-sync-btn" class="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <i class="fa fa-check"></i>
                    <span>确认同步</span>
                </button>
                <button id="sync-update-logs-btn" class="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <i class="fa fa-sync"></i>
                    <span>同步更新日志</span>
                </button>
                <button id="force-sync-update-logs-btn" class="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <i class="fa fa-download"></i>
                    <span>强制同步</span>
                </button>
                <button id="validate-update-logs-btn" class="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <i class="fa fa-check-circle"></i>
                    <span>验证完整性</span>
                </button>
            </div>
        `;

        // 添加更新日志列表
        html += `
            <div class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-gray-300">更新日志列表</h4>
                    <div class="flex items-center space-x-4 text-xs">
                        <div class="flex items-center space-x-2">
                            <span class="w-3 h-3 rounded-full bg-orange-400/20 border border-orange-400/30"></span>
                            <span class="text-gray-400">待确认</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/30"></span>
                            <span class="text-gray-400">待同步</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/30"></span>
                            <span class="text-gray-400">已同步</span>
                        </div>
                    </div>
                </div>
        `;

        logs.forEach((log, index) => {
            // 根据同步状态设置不同的标签和颜色
            let statusText, statusColor, bgColor;
            
            switch (log.status) {
                case 'pending_confirm':
                    // 1. 待确认：已经更新到json文件，但是既没有同步到后端，又没有同步到更新日志页面
                    statusText = '待确认';
                    statusColor = 'text-orange-400';
                    bgColor = 'bg-orange-400/20';
                    break;
                case 'pending_sync':
                    // 2. 待同步：已经更新json文件，后端已经同步到数据库了，但是没有同步到更新日志页面
                    statusText = '待同步';
                    statusColor = 'text-yellow-400';
                    bgColor = 'bg-yellow-400/20';
                    break;
                case 'synced':
                    // 3. 已同步：已经更新json文件，后端已经同步数据库，也同步到更新日志页面
                    statusText = '已同步';
                    statusColor = 'text-green-400';
                    bgColor = 'bg-green-400/20';
                    break;
                default:
                    // 默认状态为已同步
                    statusText = '已同步';
                    statusColor = 'text-green-400';
                    bgColor = 'bg-green-400/20';
                    break;
            }
            
            // 格式化日期
            const releaseDate = log.release_date ? 
                (window.dayjs ? dayjs(log.release_date).format('YYYY年MM月DD日') : new Date(log.release_date).toLocaleDateString('zh-CN')) : 
                '未知日期';
            
            html += `
                <div class="bg-dark-light border border-gray-600 rounded-lg p-4 hover:border-green-400/30 transition-colors">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <span class="text-lg font-bold text-green-300">${log.version}</span>
                                <span class="px-2 py-1 text-xs rounded-full ${statusColor} ${bgColor} border border-current/30">${statusText}</span>
                                <span class="text-sm text-gray-400">${releaseDate}</span>
                            </div>
                            <h5 class="text-lg font-semibold text-white mb-2">${log.title}</h5>
                            <p class="text-gray-300">${log.description || ''}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        contentContainer.innerHTML = html;

        // 绑定操作按钮事件
        this.bindUpdateLogsEvents();
    }

    /**
     * 绑定更新日志操作事件
     */
    bindUpdateLogsEvents() {
        const confirmSyncBtn = document.getElementById('confirm-sync-btn');
        const syncBtn = document.getElementById('sync-update-logs-btn');
        const forceSyncBtn = document.getElementById('force-sync-update-logs-btn');
        const validateBtn = document.getElementById('validate-update-logs-btn');

        if (confirmSyncBtn) {
            confirmSyncBtn.addEventListener('click', () => {
                this.confirmPendingLogs();
            });
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                this.syncPendingLogs();
            });
        }

        if (forceSyncBtn) {
            forceSyncBtn.addEventListener('click', () => {
                this.showForceSyncConfirmation();
            });
        }

        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                this.validateUpdateLogIntegrity();
            });
        }
    }

    /**
     * 创建更新日志视图
     */
    createUpdateLogsView() {
        // 创建更新日志视图
    }

    /**
     * 加载更新日志数据
     */
    async loadUpdateLogsData() {
        try {
            // 构建API URL
            let apiUrl = '/api/update-logs';
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                apiUrl = window.apiGateway.buildUrl('/api/update-logs');
            } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                apiUrl = window.APP_UTILS.buildApiUrl('/api/update-logs');
            }
            
            const response = await fetch(apiUrl);
            const result = await response.json();
            
            if (result.success && result.data) {
                this.updateLogsData = {
                    logs: result.data
                };
            } else {
                console.error('❌ 获取更新日志失败:', result.message || '未知错误');
                // 如果API失败，使用默认数据
                this.updateLogsData = {
                    logs: [
                        {
                            id: 1,
                            version: '1.0.0',
                            title: '初始版本发布',
                            description: '星际云盘初始版本发布，包含基础文件管理功能',
                            release_date: '2024-01-01T00:00:00Z',
                            status: 'synced'
                        },
                        {
                            id: 2,
                            version: '1.1.0',
                            title: '新增用户管理功能',
                            description: '新增用户管理、权限控制等功能',
                            release_date: '2024-01-15T00:00:00Z',
                            status: 'synced'
                        }
                    ]
                };
            }
        } catch (error) {
            console.error('❌ 加载更新日志数据失败:', error);
            // 如果网络错误，使用默认数据
            this.updateLogsData = {
                logs: [
                    {
                        id: 1,
                        version: '1.0.0',
                        title: '初始版本发布',
                        description: '星际云盘初始版本发布，包含基础文件管理功能',
                        release_date: '2024-01-01T00:00:00Z',
                        status: 'synced'
                    },
                    {
                        id: 2,
                        version: '1.1.0',
                        title: '新增用户管理功能',
                        description: '新增用户管理、权限控制等功能',
                        release_date: '2024-01-15T00:00:00Z',
                        status: 'synced'
                    }
                ]
            };
        }
    }

    /**
     * 加载更新日志同步状态
     */
    async loadUpdateLogsSyncStatus() {
        try {
            // 构建API URL - 使用现有的stats端点
            let apiUrl = '/api/update-logs/stats';
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                apiUrl = window.apiGateway.buildUrl('/api/update-logs/stats');
            } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                apiUrl = window.APP_UTILS.buildApiUrl('/api/update-logs/stats');
            }
            
            const response = await fetch(apiUrl);
            
            // 检查响应状态
            if (!response.ok) {
                // API不存在或返回错误，使用默认数据
                this.updateLogsSyncStatus = {
                    last_sync: new Date().toISOString(),
                    sync_status: 'unknown',
                    pending_changes: 0
                };
                return;
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                // 从stats数据中构建同步状态信息
                this.updateLogsSyncStatus = {
                    last_sync: result.data.last_updated || new Date().toISOString(),
                    sync_status: 'success', // 假设如果API成功返回，则同步成功
                    pending_changes: 0 // 暂时设为0，因为没有pending_changes字段
                };
            } else {
                // 如果API失败，使用默认数据
                this.updateLogsSyncStatus = {
                    last_sync: new Date().toISOString(),
                    sync_status: 'unknown',
                    pending_changes: 0
                };
            }
        } catch (error) {
            // 如果网络错误，使用默认数据
            this.updateLogsSyncStatus = {
                last_sync: new Date().toISOString(),
                sync_status: 'error',
                pending_changes: 0
            };
        }
    }

    /**
     * 加载更新日志统计信息
     */
    async loadUpdateLogsStats() {
        try {
            // 构建API URL
            let apiUrl = '/api/update-logs/stats';
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                apiUrl = window.apiGateway.buildUrl('/api/update-logs/stats');
            } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                apiUrl = window.APP_UTILS.buildApiUrl('/api/update-logs/stats');
            }
            
            const response = await fetch(apiUrl);
            
            // 检查响应状态
            if (!response.ok) {
                // API不存在或返回错误，使用默认数据
                this.updateLogsStats = {
                    total_logs: this.updateLogsData?.logs?.length || 0,
                    latest_version: '',
                    total_features: 0,
                    total_issues: 0,
                    last_updated: new Date().toISOString()
                };
                return;
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                // 将后端数据格式转换为前端期望的格式
                this.updateLogsStats = {
                    total_logs: result.data.total_logs || 0,
                    latest_version: result.data.latest_version || '',
                    total_features: result.data.total_features || 0,
                    total_issues: result.data.total_issues || 0,
                    last_updated: result.data.last_updated || new Date().toISOString()
                };
            } else {
                // 如果API失败，使用默认数据
                this.updateLogsStats = {
                    total_logs: this.updateLogsData?.logs?.length || 0,
                    latest_version: '',
                    total_features: 0,
                    total_issues: 0,
                    last_updated: new Date().toISOString()
                };
            }
        } catch (error) {
            // 如果网络错误，使用默认数据
            this.updateLogsStats = {
                total_logs: this.updateLogsData?.logs?.length || 0,
                latest_version: '',
                total_features: 0,
                total_issues: 0,
                last_updated: new Date().toISOString()
            };
        }
    }

    /**
     * 确认待确认的日志（将待确认状态改为待同步）
     */
    async confirmPendingLogs() {
        try {
            if (!this.updateLogsData || !this.updateLogsData.logs) {
                this.showUpdateLogsMessage('暂无更新日志数据', 'error');
                return;
            }

            const pendingConfirmLogs = this.updateLogsData.logs.filter(log => log.status === 'pending_confirm');
            
            if (pendingConfirmLogs.length === 0) {
                this.showUpdateLogsMessage('没有待确认的日志', 'info');
                return;
            }

            // 更新状态为待同步
            pendingConfirmLogs.forEach(log => {
                log.status = 'pending_sync';
            });

            // 更新本地数据
            localStorage.setItem('updateLogsData', JSON.stringify(this.updateLogsData));
            
            // 重新渲染
            this.renderUpdateLogsContent();
            
            this.showUpdateLogsMessage(`成功确认 ${pendingConfirmLogs.length} 条日志，状态已更新为待同步`, 'success');
            
        } catch (error) {
            console.error('确认日志失败:', error);
            this.showUpdateLogsMessage('确认日志失败: ' + error.message, 'error');
        }
    }

    /**
     * 同步待同步的日志（将待同步状态改为已同步）
     */
    async syncPendingLogs() {
        try {
            if (!this.updateLogsData || !this.updateLogsData.logs) {
                this.showUpdateLogsMessage('暂无更新日志数据', 'error');
                return;
            }

            const pendingSyncLogs = this.updateLogsData.logs.filter(log => log.status === 'pending_sync');
            
            if (pendingSyncLogs.length === 0) {
                this.showUpdateLogsMessage('没有待同步的日志', 'info');
                return;
            }

            // 更新状态为已同步
            pendingSyncLogs.forEach(log => {
                log.status = 'synced';
            });

            // 更新本地数据
            localStorage.setItem('updateLogsData', JSON.stringify(this.updateLogsData));
            
            // 重新渲染
            this.renderUpdateLogsContent();
            
            this.showUpdateLogsMessage(`成功同步 ${pendingSyncLogs.length} 条日志，状态已更新为已同步`, 'success');
            
        } catch (error) {
            console.error('同步日志失败:', error);
            this.showUpdateLogsMessage('同步日志失败: ' + error.message, 'error');
        }
    }

    /**
     * 显示强制同步确认对话框
     */
    showForceSyncConfirmation() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-md shadow-2xl border border-red-400/30">
                <div class="flex items-center space-x-3 mb-4">
                    <i class="fa fa-exclamation-triangle text-red-400 text-xl"></i>
                    <h3 class="text-lg font-bold text-red-300">强制同步确认</h3>
                </div>
                <p class="text-gray-300 mb-6">
                    此操作将使用前端JSON数据完全替换数据库中的所有更新日志内容。
                    <br><br>
                    <strong class="text-red-400">警告：此操作不可逆，请谨慎操作！</strong>
                </p>
                <div class="flex space-x-3">
                    <button id="confirm-force-sync" class="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                        确认强制同步
                    </button>
                    <button id="cancel-force-sync" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                        取消
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        const confirmBtn = modal.querySelector('#confirm-force-sync');
        const cancelBtn = modal.querySelector('#cancel-force-sync');
        
        confirmBtn.addEventListener('click', () => {
            modal.remove();
            this.forceSyncUpdateLogs();
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 强制同步（使用前端JSON数据替换数据库内容）
     */
    async forceSyncUpdateLogs() {
        try {
            this.showUpdateLogsMessage('正在强制同步...', 'info');
            
            // 构建API URL
            let apiUrl = '/api/update-logs/sync';
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                apiUrl = window.apiGateway.buildUrl('/api/update-logs/sync');
            } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                apiUrl = window.APP_UTILS.buildApiUrl('/api/update-logs/sync');
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logs: this.updateLogsData.logs,
                    source: 'frontend',
                    timestamp: new Date().toISOString(),
                    force: true
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showUpdateLogsMessage('强制同步成功！', 'success');
                // 重新加载数据
                await this.loadUpdateLogsData();
                this.renderUpdateLogsContent();
            } else {
                this.showUpdateLogsMessage('强制同步失败: ' + (result.message || '未知错误'), 'error');
            }
            
        } catch (error) {
            console.error('强制同步失败:', error);
            this.showUpdateLogsMessage('强制同步失败: ' + error.message, 'error');
        }
    }

    /**
     * 验证更新日志完整性
     */
    async validateUpdateLogIntegrity() {
        try {
            if (!this.updateLogsData || !this.updateLogsData.logs) {
                this.showUpdateLogsMessage('暂无更新日志数据', 'error');
                return;
            }

            const logs = this.updateLogsData.logs;
            const errors = [];
            const warnings = [];

            // 检查每个日志的必需字段
            logs.forEach((log, index) => {
                // 检查必需字段
                if (!log.version) {
                    errors.push(`第${index + 1}条日志缺少版本号`);
                }
                if (!log.title) {
                    errors.push(`第${index + 1}条日志缺少标题`);
                }
                if (!log.description) {
                    errors.push(`第${index + 1}条日志缺少描述`);
                }
                if (!log.release_date) {
                    errors.push(`第${index + 1}条日志缺少发布日期`);
                }
                if (!log.status) {
                    warnings.push(`第${index + 1}条日志缺少状态字段，将使用默认状态`);
                }

                // 检查版本号格式（移除可能的v前缀）
                if (log.version) {
                    const cleanVersion = log.version.replace(/^v/, ''); // 移除v前缀
                    if (!/^\d+\.\d+\.\d+$/.test(cleanVersion)) {
                        errors.push(`第${index + 1}条日志版本号格式不正确: ${log.version}`);
                    }
                }

                // 检查日期格式
                if (log.release_date) {
                    const date = new Date(log.release_date);
                    if (isNaN(date.getTime())) {
                        errors.push(`第${index + 1}条日志日期格式不正确: ${log.release_date}`);
                    }
                }
            });

            // 检查版本号递进（按时间顺序，最新的在前面）
            for (let i = 1; i < logs.length; i++) {
                const prevVersion = logs[i - 1].version;
                const currVersion = logs[i].version;
                
                if (prevVersion && currVersion) {
                    const prevCleanVersion = prevVersion.replace(/^v/, '');
                    const currCleanVersion = currVersion.replace(/^v/, '');
                    const prevParts = prevCleanVersion.split('.').map(Number);
                    const currParts = currCleanVersion.split('.').map(Number);
                    
                    // 由于日志按时间倒序排列（最新的在前面），所以前面的版本号应该大于后面的
                    if (currParts[0] > prevParts[0] || 
                        (currParts[0] === prevParts[0] && currParts[1] > prevParts[1]) ||
                        (currParts[0] === prevParts[0] && currParts[1] === prevParts[1] && currParts[2] >= prevParts[2])) {
                        errors.push(`版本号递进错误: ${prevVersion} -> ${currVersion} (新版本应该大于旧版本)`);
                    }
                }
            }

            // 检查日期递增（按时间顺序，最新的在前面）
            for (let i = 1; i < logs.length; i++) {
                const prevDate = new Date(logs[i - 1].release_date);
                const currDate = new Date(logs[i].release_date);
                
                if (!isNaN(prevDate.getTime()) && !isNaN(currDate.getTime())) {
                    // 由于日志按时间倒序排列，前面的日期应该晚于后面的日期
                    if (currDate >= prevDate) {
                        errors.push(`发布日期递增错误: ${logs[i - 1].release_date} -> ${logs[i].release_date} (新版本日期应该晚于旧版本)`);
                    }
                }
            }

            // 显示验证结果
            if (errors.length === 0 && warnings.length === 0) {
                this.showUpdateLogsMessage('✅ 当前所有日志均完整有效，可以进行同步！', 'success');
            } else {
                let message = '';
                if (errors.length > 0) {
                    message += `❌ 发现 ${errors.length} 个错误:\n${errors.join('\n')}`;
                }
                if (warnings.length > 0) {
                    message += `\n⚠️ 发现 ${warnings.length} 个警告:\n${warnings.join('\n')}`;
                }
                this.showUpdateLogsMessage(message, 'error');
            }
            
        } catch (error) {
            console.error('验证完整性失败:', error);
            this.showUpdateLogsMessage('验证完整性失败: ' + error.message, 'error');
        }
    }

    /**
     * 检查并同步更新日志
     */
    async checkAndSyncUpdateLogs() {
        try {
            // 检查并同步更新日志
        } catch (error) {
            console.error('检查并同步更新日志失败:', error);
        }
    }

    /**
     * 显示更新日志统计信息
     */
    async showUpdateLogsStats() {
        try {
            // 显示更新日志统计信息
        } catch (error) {
            console.error('显示更新日志统计信息失败:', error);
        }
    }

    /**
     * 显示更新日志消息
     */
    showUpdateLogsMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        
        messageEl.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fa ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' :
                    'fa-info-circle'
                }"></i>
                <span class="whitespace-pre-line">${message}</span>
            </div>
        `;
        
        document.body.appendChild(messageEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    /**
     * 显示更新日志错误
     */
    showUpdateLogsError(message) {
        // 显示更新日志错误
        console.error('更新日志错误:', message);
    }

    /**
     * 显示更新日志管理
     */
    showUpdateLogManagement() {
        // 显示更新日志管理
    }

    /**
     * 加载更新日志管理数据
     */
    async loadUpdateLogManagementData() {
        try {
            // 加载更新日志管理数据
        } catch (error) {
            console.error('加载更新日志管理数据失败:', error);
        }
    }

    /**
     * 显示用户管理模态框
     */
    showUserManagementModal() {
        // 检查是否已经存在用户管理模态框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="user-management"]');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'user-management');
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-blue-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-blue-300">用户管理</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" id="close-user-management">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
                    <!-- 用户列表容器 -->
                    <div id="users-list" class="space-y-4">
                        <div class="text-center py-8 text-gray-400">
                            <i class="fa fa-spinner fa-spin text-2xl mb-4"></i>
                            <p>加载中...</p>
                        </div>
                    </div>
                    
                    <!-- 分页控件 -->
                    <div id="pagination-controls" class="flex items-center justify-between mt-6 pt-4 border-t border-gray-700 hidden">
                        <button id="prev-page-btn" class="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fa fa-chevron-left mr-1"></i>上一页
                        </button>
                        <span id="page-info" class="text-gray-400 text-sm"></span>
                        <button id="next-page-btn" class="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            下一页<i class="fa fa-chevron-right ml-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('#close-user-management');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // 加载用户数据
        this.loadUserList();
    }

    /**
     * 显示更新日志模态框
     */
    showUpdateLogsModal() {
        // 检查是否已经存在更新日志模态框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="update-logs"]');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'update-logs');
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-green-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-green-300">更新日志管理</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" id="close-update-logs">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div id="update-logs-content" class="space-y-4">
                        <div class="text-center py-8 text-gray-400">
                            <i class="fa fa-spinner fa-spin text-2xl mb-4"></i>
                            <p>加载中...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('#close-update-logs');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // 模态框创建完成后再加载更新日志数据
        this.loadUpdateLogs();
    }

    /**
     * 显示系统设置模态框
     */
    showSystemSettingsModal() {
        // 检查是否已经存在系统设置模态框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="system-settings"]');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'system-settings');
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-purple-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-purple-300">系统设置</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" id="close-system-settings">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div id="system-settings-content" class="space-y-4">
                        <div class="text-center py-8 text-gray-400">
                            <i class="fa fa-spinner fa-spin text-2xl mb-4"></i>
                            <p>加载中...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('#close-system-settings');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // 加载系统设置数据
        this.loadSystemSettings();
    }

    /**
     * 显示存储管理模态框
     */
    showStorageManagementModal() {
        // 检查是否已经存在存储管理模态框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="storage-management"]');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'storage-management');
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-orange-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-orange-300">存储管理</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" id="close-storage-management">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div id="storage-management-content" class="space-y-4">
                        <div class="text-center py-8 text-gray-400">
                            <i class="fa fa-spinner fa-spin text-2xl mb-4"></i>
                            <p>加载中...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('#close-storage-management');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // 加载存储数据
        this.loadStorageData();
    }

    /**
     * 显示仪表板模态框
     */
    showDashboardModal() {
        // 检查是否已经存在仪表板模态框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="dashboard"]');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'dashboard');
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-blue-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-blue-300">系统仪表板</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" id="close-dashboard">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div id="dashboard-content" class="space-y-4">
                        <div class="text-center py-8 text-gray-400">
                            <i class="fa fa-spinner fa-spin text-2xl mb-4"></i>
                            <p>加载中...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('#close-dashboard');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // 加载仪表板数据
        this.loadDashboardData();
    }

    /**
     * 显示系统日志模态框
     */
    showSystemLogsModal() {
        // 检查是否已经存在系统日志模态框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="system-logs"]');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'system-logs');
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-red-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-red-300">系统日志</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" id="close-system-logs">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div id="system-logs-content" class="space-y-4">
                        <div class="text-center py-8 text-gray-400">
                            <i class="fa fa-spinner fa-spin text-2xl mb-4"></i>
                            <p>加载中...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('#close-system-logs');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // 加载系统日志数据
        this.loadSystemLogs();
    }

    /**
     * 检查是否有管理员token
     */
    hasAdminToken() {
        return document.cookie.split(';').some(item => item.trim().startsWith('admin_access_token='));
    }

    /**
     * 修复头像下拉菜单的交互问题
     */
    fixAvatarDropdownInteraction() {
        const avatarButton = document.querySelector('.relative.group button');
        const dropdownMenu = document.querySelector('.relative.group .absolute');
        
        if (avatarButton && dropdownMenu) {
            
            // 添加点击事件来控制下拉菜单的显示/隐藏
            avatarButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isVisible = dropdownMenu.classList.contains('opacity-100') && 
                                dropdownMenu.classList.contains('visible');
                
                if (isVisible) {
                    // 隐藏下拉菜单
                    dropdownMenu.classList.remove('opacity-100', 'visible');
                    dropdownMenu.classList.add('opacity-0', 'invisible');
                } else {
                    // 显示下拉菜单
                    dropdownMenu.classList.remove('opacity-0', 'invisible');
                    dropdownMenu.classList.add('opacity-100', 'visible');
                }
                
            });
            
            // 点击其他地方时隐藏下拉菜单
            document.addEventListener('click', (e) => {
                if (!avatarButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                    dropdownMenu.classList.remove('opacity-100', 'visible');
                    dropdownMenu.classList.add('opacity-0', 'invisible');
                }
            });
            
        } else {
            console.error('❌ 未找到头像下拉菜单元素');
=======
                // 强制显示管理员元素
                this.forceShowAdminElements();
                
                // 确保管理员数据已加载
                await this.ensureAdminDataLoaded();
            }
        }

        /**
         * 确保管理员数据已加载
         */
        async ensureAdminDataLoaded() {
            try {
                // 确保文件列表已加载
                if (window.uiManager && window.uiManager.allFiles) {
                    // 重新渲染文件列表
                    window.uiManager.renderFileList(window.uiManager.allFiles);
                    
                    // 更新文件统计
                    const totalFiles = window.uiManager.allFiles.length;
                    window.uiManager.updateFileCount(totalFiles, totalFiles);
                    
                    // 更新欢迎模块的文件统计
                    const fileCountElement = document.getElementById('file-count');
                    if (fileCountElement) {
                        fileCountElement.textContent = totalFiles;
                    }
                }
                
                // 确保用户信息已正确显示
                const currentUser = this.getCurrentUser();
                if (currentUser) {
                    // 更新欢迎模块的用户名
                    const welcomeMessage = document.getElementById('welcome-message');
                    if (welcomeMessage) {
                        welcomeMessage.textContent = `欢迎回来，${currentUser.username}`;
                    }
                    
                    // 强制更新头像显示
                    this.forceUpdateAvatarDisplay(currentUser);
                    
                    // 更新头像显示
                    if (window.uiManager && window.uiManager.profileManager) {
                        window.uiManager.profileManager.updateProfileDisplay(currentUser);
                    }
                }
                
                // 确保存储信息已显示
                if (window.uiManager && window.uiManager.storageInfo) {
                    window.uiManager.updateStorageDisplay(window.uiManager.storageInfo);
                }
                
                // 强制显示管理员相关元素
                this.forceShowAdminElements();
                
            } catch (error) {
                console.error('确保管理员数据加载失败:', error);
            }
        }

        /**
         * 强制更新头像显示
         */
        forceUpdateAvatarDisplay(userData) {
            if (!userData) return;
            
            console.log('强制更新头像显示:', userData);
            
            // 构建头像URL
            let avatarUrl = null;
            
            // 1. 优先从缓存获取
            if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                const cachedAvatar = window.StorageManager.getAvatar();
                if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                    avatarUrl = cachedAvatar;
                    console.log('从StorageManager获取头像:', avatarUrl);
                }
            }
            
            // 2. 如果没有缓存，从用户数据构建URL
            if (!avatarUrl && userData.avatar) {
                if (window.APP_UTILS && window.APP_UTILS.buildAvatarUrl) {
                    avatarUrl = window.APP_UTILS.buildAvatarUrl(userData.avatar);
                    console.log('构建头像URL:', avatarUrl);
                } else {
                    // 备用方案：直接构建URL
                    avatarUrl = `/api/avatars/${userData.avatar}`;
                    console.log('使用备用头像URL:', avatarUrl);
                }
            }
            
            // 更新所有头像元素
            this.updateAllAvatarElements(avatarUrl);
        }

        /**
         * 更新所有头像元素
         */
        updateAllAvatarElements(avatarUrl) {
            // 更新顶栏头像
            const userAvatar = document.getElementById('user-avatar');
            if (userAvatar) {
                if (avatarUrl) {
                    userAvatar.src = avatarUrl;
                    userAvatar.style.display = 'block';
                    userAvatar.style.visibility = 'visible';
                    userAvatar.style.opacity = '1';
                    console.log('更新顶栏头像:', avatarUrl);
                } else {
                    userAvatar.style.display = 'none';
                    console.log('隐藏顶栏头像');
                }
            }
            
            // 更新欢迎模块头像
            const welcomeAvatarImage = document.getElementById('avatar-image');
            const welcomeAvatarIcon = document.getElementById('avatar-icon');
            
            if (welcomeAvatarImage && welcomeAvatarIcon) {
                if (avatarUrl) {
                    welcomeAvatarImage.src = avatarUrl;
                    welcomeAvatarImage.classList.remove('hidden');
                    welcomeAvatarIcon.classList.add('hidden');
                    welcomeAvatarImage.style.display = 'block';
                    welcomeAvatarImage.style.visibility = 'visible';
                    welcomeAvatarImage.style.opacity = '1';
                    welcomeAvatarIcon.style.display = 'none';
                    console.log('更新欢迎模块头像:', avatarUrl);
                } else {
                    welcomeAvatarImage.classList.add('hidden');
                    welcomeAvatarIcon.classList.remove('hidden');
                    welcomeAvatarImage.style.display = 'none';
                    welcomeAvatarIcon.style.display = 'block';
                    welcomeAvatarImage.src = '';
                    console.log('显示欢迎模块默认图标');
                }
            }
            
            // 更新其他可能的头像元素
            const allAvatarElements = document.querySelectorAll('.user-avatar, .avatar-img, #profile-avatar img');
            allAvatarElements.forEach((avatar, index) => {
                if (avatar.tagName === 'IMG') {
                    if (avatarUrl) {
                        avatar.src = avatarUrl;
                        avatar.style.display = 'block';
                        avatar.style.visibility = 'visible';
                        avatar.style.opacity = '1';
                        console.log(`更新头像元素 ${index}:`, avatarUrl);
                    } else {
                        avatar.style.display = 'none';
                        avatar.src = '';
                        console.log(`隐藏头像元素 ${index}`);
                    }
                }
            });
        }

        /**
         * 强制显示管理员相关元素
         */
        forceShowAdminElements() {
            console.log('强制显示管理员相关元素');
            
            // 显示同步文档按钮
            const syncDocsBtn = document.getElementById('sync-docs-btn');
            if (syncDocsBtn) {
                syncDocsBtn.style.display = 'flex !important';
                syncDocsBtn.style.visibility = 'visible';
                syncDocsBtn.classList.remove('hidden');
                syncDocsBtn.removeAttribute('hidden');
                console.log('显示同步文档按钮');
            } else {
                console.warn('同步文档按钮元素未找到');
            }
            
            // 显示管理存储空间按钮
            const storageSettingsBtn = document.getElementById('storage-settings-btn');
            if (storageSettingsBtn) {
                storageSettingsBtn.style.display = 'block !important';
                storageSettingsBtn.style.visibility = 'visible';
                storageSettingsBtn.classList.remove('hidden');
                storageSettingsBtn.removeAttribute('hidden');
                console.log('显示管理存储空间按钮');
            } else {
                console.warn('管理存储空间按钮元素未找到');
            }
            
            // 显示设置按钮
            const settingsBtn = document.getElementById('settings-btn');
            if (settingsBtn) {
                settingsBtn.style.display = 'block !important';
                settingsBtn.style.visibility = 'visible';
                settingsBtn.classList.remove('hidden');
                settingsBtn.removeAttribute('hidden');
                console.log('显示设置按钮');
            } else {
                console.warn('设置按钮元素未找到');
            }
            
            // 显示管理员菜单
            const adminMenu = document.getElementById('admin-menu');
            if (adminMenu) {
                adminMenu.style.display = 'block !important';
                adminMenu.style.visibility = 'visible';
                adminMenu.classList.remove('hidden');
                adminMenu.removeAttribute('hidden');
                console.log('显示管理员菜单');
            } else {
                console.warn('管理员菜单元素未找到');
            }
            
            // 显示环境切换器（如果存在）
            if (window.envSwitcher && typeof window.envSwitcher.show === 'function') {
                try {
                    window.envSwitcher.show();
                    console.log('显示环境切换器');
                } catch (error) {
                    console.warn('显示环境切换器失败:', error);
                }
            }
            
            // 延迟重试，确保元素已加载
            setTimeout(() => {
                this.retryShowAdminElements();
            }, 500);
        }

        /**
         * 重试显示管理员元素
         */
        retryShowAdminElements() {
            console.log('重试显示管理员元素');
            
            // 再次尝试显示所有管理员元素
            const elements = [
                { id: 'sync-docs-btn', type: '同步文档按钮' },
                { id: 'storage-settings-btn', type: '管理存储空间按钮' },
                { id: 'settings-btn', type: '设置按钮' },
                { id: 'admin-menu', type: '管理员菜单' }
            ];
            
            elements.forEach(({ id, type }) => {
                const element = document.getElementById(id);
                if (element) {
                    element.style.display = element.id === 'sync-docs-btn' ? 'flex !important' : 'block !important';
                    element.style.visibility = 'visible';
                    element.classList.remove('hidden');
                    element.removeAttribute('hidden');
                    console.log(`重试显示${type}成功`);
                } else {
                    console.warn(`重试显示${type}失败：元素未找到`);
                }
            });
        }

        /**
         * 检查管理员权限
         */
        async checkAdminPermissions() {
            // 首先隐藏管理员相关按钮，避免页面刷新时短暂显示
            this.hideSyncDocsButton();
            this.hideStorageSettingsButton();
            
            try {
                // 优先检查当前用户是否为管理员用户（Mose）
                const currentUser = this.getCurrentUser();
                
                if (currentUser && currentUser.username === 'Mose') {
                    this.isAdmin = true;
                } else {
                    // 使用token验证管理员权限
                    if (window.tokenManager && typeof window.tokenManager.validateAdminTokens === 'function') {
                        this.isAdmin = await window.tokenManager.validateAdminTokens();
                    } else {
                        this.isAdmin = false;
                    }
                }
                
                // 立即更新UI显示
                this.updateAvatarAdminMenu();
                
                // 如果是管理员，显示悬浮按钮
                if (this.isAdmin) {
                    this.showAdminFloatingButtons();
                    // 确保管理员数据已加载
                    await this.ensureAdminDataLoaded();
                } else {
                    this.hideAdminFloatingButtons();
                }

            } catch (error) {
                console.error('验证管理员权限失败:', error);
                this.isAdmin = false;
                this.hideAdminFloatingButtons();
            }
            
            // 处理头像下拉菜单中的管理员菜单显示
            this.updateAvatarAdminMenu();
            
            // 不自动显示管理员菜单，只在需要时显示
            if (!this.isAdmin) {
                this.hideAdminMenu();
            }
            
            return this.isAdmin;
        }

        /**
         * 强制刷新后恢复管理员权限
         */
        async restoreAdminPermissionsAfterForceRefresh() {
            try {
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.username === 'Mose') {
                    console.log('强制刷新后恢复管理员权限: Mose');
                    this.isAdmin = true;
                    
                    // 立即更新头像下拉菜单
                    this.updateAvatarAdminMenu();
                    
                    // 显示管理员悬浮按钮
                    this.showAdminFloatingButtons();
                    
                    // 强制显示所有管理员相关元素
                    this.forceShowAdminElements();
                    
                    // 确保管理员数据已加载
                    await this.ensureAdminDataLoaded();
                    
                    return true;
                }
                return false;
            } catch (error) {
                console.error('强制刷新后恢复管理员权限失败:', error);
                return false;
            }
        }

        /**
         * 延迟检查管理员权限（用于登录后确保用户信息已保存）
         */
        async delayedCheckAdminPermissions() {
            // 等待一段时间确保用户信息已保存到localStorage
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 重新检查管理员权限
            const result = await this.checkAdminPermissions();
            
            // 如果是管理员，确保数据已加载
            if (result) {
                await this.ensureAdminDataLoaded();
            }
            
            return result;
        }

        /**
         * 获取当前用户信息（增强版）
         */
        getCurrentUser() {
            // 尝试多种方式获取用户信息
            let userData = null;
            
            // 1. 优先从StorageManager获取
            if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
                userData = window.StorageManager.getUser();
            }
            
            // 2. 如果StorageManager不可用，从localStorage获取
            if (!userData) {
                const userDataStr = localStorage.getItem('userInfo');
                if (userDataStr) {
                    try {
                        userData = JSON.parse(userDataStr);
                    } catch (error) {
                        console.warn('解析用户信息失败:', error);
                    }
                }
            }
            
            // 3. 如果还是获取不到，尝试从API管理器获取
            if (!userData && window.apiManager && window.apiManager.currentUser) {
                userData = window.apiManager.currentUser;
            }
            
            // 4. 生产环境特殊处理：如果用户信息不完整，尝试重新获取
            if (userData && (!userData.username || !userData.uuid) && 
                window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                console.warn('用户信息不完整，尝试重新获取');
                // 清除不完整的数据
                localStorage.removeItem('userInfo');
                if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
                    window.StorageManager.clearUser();
                }
                return null;
            }
            
            return userData;
        }

        /**
         * 隐藏同步文档按钮（初始化时调用）
         */
        hideSyncDocsButton() {
            const syncDocsBtn = document.getElementById('sync-docs-btn');
            if (syncDocsBtn) {
                syncDocsBtn.classList.add('hidden');
            } else {
                // 如果元素还没有加载，延迟重试
                setTimeout(() => {
                    this.hideSyncDocsButton();
                }, 100);
            }
        }

        /**
         * 隐藏管理存储空间按钮（初始化时调用）
         */
        hideStorageSettingsButton() {
            const storageSettingsBtn = document.getElementById('storage-settings-btn');
            if (storageSettingsBtn) {
                storageSettingsBtn.style.display = 'none';
            } else {
                // 如果元素还没有加载，延迟重试
                setTimeout(() => {
                    this.hideStorageSettingsButton();
                }, 100);
            }
        }

        /**
         * 更新头像下拉菜单中的管理员菜单显示
         */
        updateAvatarAdminMenu() {
            const adminMenu = document.getElementById('admin-menu');
            const settingsBtn = document.getElementById('settings-btn');
            const syncDocsBtn = document.getElementById('sync-docs-btn');
            const storageSettingsBtn = document.getElementById('storage-settings-btn');
            
            // 生产环境特殊处理：确保管理员状态正确
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                // 重新验证管理员状态
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.username === 'Mose') {
                    this.isAdmin = true;
                }
            }
            
            if (adminMenu && settingsBtn) {
                if (this.isAdmin) {
                    // 管理员：显示设置按钮、同步文档按钮、管理存储空间按钮和管理员菜单
                    // 使用更强力的显示方式，确保CSS不会覆盖
                    settingsBtn.style.display = 'block !important';
                    settingsBtn.style.visibility = 'visible';
                    settingsBtn.classList.remove('hidden');
                    settingsBtn.removeAttribute('hidden');
                    
                    adminMenu.style.display = 'block !important';
                    adminMenu.style.visibility = 'visible';
                    adminMenu.classList.remove('hidden');
                    adminMenu.removeAttribute('hidden');
                    
                    if (syncDocsBtn) {
                        syncDocsBtn.style.display = 'block !important';
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

                } else {
                    // 非管理员：隐藏设置按钮、管理员菜单、同步文档按钮和管理存储空间按钮
                    settingsBtn.style.display = 'none';
                    settingsBtn.classList.add('hidden');
                    adminMenu.style.display = 'none';
                    adminMenu.classList.add('hidden');
                    if (syncDocsBtn) {
                        syncDocsBtn.classList.add('hidden');
                    }
                    if (storageSettingsBtn) {
                        storageSettingsBtn.style.display = 'none';
                    }
                }
            } else {
                console.warn('管理员菜单元素未找到:', { adminMenu, settingsBtn });
            }
            
            // 生产环境：如果元素不存在，延迟重试
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                if (!adminMenu || !settingsBtn) {
                    setTimeout(() => {
                        this.updateAvatarAdminMenu();
                    }, 500);
                }
            }
        }

        /**
         * 显示管理员悬浮按钮
         */
        showAdminFloatingButtons() {
            // 显示同步文档按钮
            const syncDocsBtn = document.getElementById('sync-docs-btn');
            if (syncDocsBtn) {
                syncDocsBtn.style.display = 'flex !important';
                syncDocsBtn.style.visibility = 'visible';
                syncDocsBtn.classList.remove('hidden');
                syncDocsBtn.removeAttribute('hidden');
            }
            
            // 显示环境切换器（如果存在）
            if (window.envSwitcher && typeof window.envSwitcher.show === 'function') {
                try {
                    window.envSwitcher.show();
                } catch (error) {
                    console.warn('显示环境切换器失败:', error);
                    // 不抛出错误，避免影响其他功能
                }
            }
        }
        
        /**
         * 隐藏管理员悬浮按钮
         */
        hideAdminFloatingButtons() {
            // 隐藏同步文档按钮
            const syncDocsBtn = document.getElementById('sync-docs-btn');
            if (syncDocsBtn) {
                syncDocsBtn.classList.add('hidden');
            }
            
            // 隐藏环境切换器（如果存在）
            if (window.envSwitcher && typeof window.envSwitcher.hide === 'function') {
                try {
                    window.envSwitcher.hide();
                } catch (error) {
                    console.warn('隐藏环境切换器失败:', error);
                    // 不抛出错误，避免影响其他功能
                }
            }
        }

        /**
         * 设置管理员菜单
         */
        setupAdminMenu() {
            this.adminMenu = document.getElementById('admin-menu');
            if (!this.adminMenu) {
                this.createAdminMenu();
            }
        }

        /**
         * 创建管理员菜单
         */
        createAdminMenu() {
            // 检查是否已经存在管理员菜单
            if (document.getElementById('admin-menu')) {
                this.adminMenu = document.getElementById('admin-menu');
                return;
            }

            // 如果header中已经有admin-menu，就不需要创建新的
            const existingAdminMenu = document.getElementById('admin-menu');
            if (existingAdminMenu) {
                this.adminMenu = existingAdminMenu;
                return;
            }

            // 创建新的管理员菜单（如果需要的话）
            const menuHTML = `
                <div class="admin-menu" style="display: none; position: fixed; top: 0; right: 0; width: 400px; height: 100vh; background: white; box-shadow: -2px 0 10px rgba(0,0,0,0.1); z-index: 1000; overflow-y: auto;">
                    <div class="admin-menu-header" style="padding: 1rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">管理员面板</h3>
                        <button class="admin-menu-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <div class="admin-menu-content" style="padding: 1rem;">
                        <div class="admin-nav" style="margin-bottom: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button class="admin-nav-item active" data-view="dashboard" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">仪表板</button>
                            <button class="admin-nav-item" data-view="users" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">用户管理</button>
                            <button class="admin-nav-item" data-view="storage" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">存储管理</button>
                            <button class="admin-nav-item" data-view="settings" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">系统设置</button>
                            <button class="admin-nav-item" data-view="logs" style="padding: 0.5rem 1rem; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">系统日志</button>
                        </div>
                        <div class="admin-content">
                            <div id="admin-dashboard" class="admin-view active">
                                <h4>系统概览</h4>
                                <div class="stats-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="stat-card" style="padding: 1rem; border: 1px solid #eee; border-radius: 4px; text-align: center;">
                                        <div class="stat-number" id="totalUsers" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                        <div class="stat-label">总用户数</div>
                                    </div>
                                    <div class="stat-card" style="padding: 1rem; border: 1px solid #eee; border-radius: 4px; text-align: center;">
                                        <div class="stat-number" id="totalFiles" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                        <div class="stat-label">总文件数</div>
                                    </div>
                                    <div class="stat-card" style="padding: 1rem; border: 1px solid #eee; border-radius: 4px; text-align: center;">
                                        <div class="stat-number" id="totalStorage" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                        <div class="stat-label">总存储量</div>
                                    </div>
                                    <div class="stat-card" style="padding: 1rem; border: 1px solid #eee; border-radius: 4px; text-align: center;">
                                        <div class="stat-number" id="activeUsers" style="font-size: 1.5rem; font-weight: bold;">0</div>
                                        <div class="stat-label">活跃用户</div>
                                    </div>
                                </div>
                            </div>
                            <div id="admin-users" class="admin-view" style="display: none;">
                                <h4>用户管理</h4>
                                <div class="user-management">
                                    <div class="user-filters" style="margin-bottom: 1rem;">
                                        <input type="text" placeholder="搜索用户..." id="userSearch" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem;">
                                        <select id="userRoleFilter" style="width: 100%; padding: 0.5rem;">
                                            <option value="">所有角色</option>
                                            <option value="admin">管理员</option>
                                            <option value="user">普通用户</option>
                                            <option value="guest">访客</option>
                                        </select>
                                    </div>
                                    <div class="user-list" id="userList"></div>
                                </div>
                            </div>
                            <div id="admin-storage" class="admin-view" style="display: none;">
                                <h4>存储管理</h4>
                                <div class="storage-management">
                                    <div class="storage-overview">
                                        <div class="storage-details">
                                            <div class="storage-item" style="margin-bottom: 0.5rem;">
                                                <span class="storage-label">总存储空间:</span>
                                                <span class="storage-value" id="totalStorageSpace">0 GB</span>
                                            </div>
                                            <div class="storage-item" style="margin-bottom: 0.5rem;">
                                                <span class="storage-label">已使用:</span>
                                                <span class="storage-value" id="usedStorage">0 GB</span>
                                            </div>
                                            <div class="storage-item" style="margin-bottom: 0.5rem;">
                                                <span class="storage-label">可用空间:</span>
                                                <span class="storage-value" id="availableStorage">0 GB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="admin-settings" class="admin-view" style="display: none;">
                                <h4>系统设置</h4>
                                <div class="settings-form">
                                    <div class="setting-group" style="margin-bottom: 1rem;">
                                        <label>最大文件大小 (MB)</label>
                                        <input type="number" id="maxFileSize" min="1" max="1000" style="width: 100%; padding: 0.5rem;">
                                    </div>
                                    <div class="setting-group" style="margin-bottom: 1rem;">
                                        <label>允许的文件类型</label>
                                        <input type="text" id="allowedFileTypes" placeholder="jpg,png,pdf,doc" style="width: 100%; padding: 0.5rem;">
                                    </div>
                                    <div class="setting-group" style="margin-bottom: 1rem;">
                                        <label>用户注册</label>
                                        <select id="userRegistration" style="width: 100%; padding: 0.5rem;">
                                            <option value="enabled">启用</option>
                                            <option value="disabled">禁用</option>
                                        </select>
                                    </div>
                                    <div class="setting-group" style="margin-bottom: 1rem;">
                                        <label>系统维护模式</label>
                                        <select id="maintenanceMode" style="width: 100%; padding: 0.5rem;">
                                            <option value="disabled">禁用</option>
                                            <option value="enabled">启用</option>
                                        </select>
                                    </div>
                                    <button class="btn btn-primary" onclick="saveSystemSettings()" style="width: 100%; padding: 0.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">保存设置</button>
                                </div>
                            </div>
                            <div id="admin-logs" class="admin-view" style="display: none;">
                                <h4>系统日志</h4>
                                <div class="log-management">
                                    <div class="log-filters" style="margin-bottom: 1rem;">
                                        <select id="logLevel" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem;">
                                            <option value="">所有级别</option>
                                            <option value="error">错误</option>
                                            <option value="warning">警告</option>
                                            <option value="info">信息</option>
                                        </select>
                                        <input type="date" id="logDate" style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem;">
                                        <button class="btn btn-secondary" onclick="refreshLogs()" style="width: 100%; padding: 0.5rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">刷新</button>
                                    </div>
                                    <div class="log-list" id="logList"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 将菜单添加到页面
            document.body.insertAdjacentHTML('beforeend', menuHTML);
            this.adminMenu = document.querySelector('.admin-menu');
        }

        /**
         * 绑定管理员事件
         */
        bindAdminEvents() {
            if (!this.adminMenu) return;

            // 关闭按钮
            const closeBtn = this.adminMenu.querySelector('.admin-menu-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideAdminMenu();
                });
            }

            // 导航切换
            const navItems = this.adminMenu.querySelectorAll('.admin-nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const view = e.target.dataset.view;
                    this.switchAdminView(view);
                });
            });

            // 用户搜索
            const userSearch = document.getElementById('userSearch');
            if (userSearch) {
                userSearch.addEventListener('input', (e) => {
                    this.filterUsers(e.target.value);
                });
            }

            // 角色过滤
            const roleFilter = document.getElementById('userRoleFilter');
            if (roleFilter) {
                roleFilter.addEventListener('change', (e) => {
                    this.filterUsersByRole(e.target.value);
                });
            }
        }

        /**
         * 显示管理员菜单
         */
        showAdminMenu() {
            if (this.adminMenu) {
                this.adminMenu.style.display = 'block';
                this.loadAdminData();
            }
        }

        /**
         * 隐藏管理员菜单
         */
        hideAdminMenu() {
            if (this.adminMenu) {
                this.adminMenu.style.display = 'none';
            }
        }

        /**
         * 切换管理员视图
         * @param {string} view - 视图名称
         */
        switchAdminView(view) {
            if (!this.adminMenu) return;

            // 更新导航状态
            const navItems = this.adminMenu.querySelectorAll('.admin-nav-item');
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.dataset.view === view) {
                    item.classList.add('active');
                }
            });

            // 更新内容视图
            const views = this.adminMenu.querySelectorAll('.admin-view');
            views.forEach(v => {
                v.style.display = 'none';
                if (v.id === `admin-${view}`) {
                    v.style.display = 'block';
                }
            });

            this.currentView = view;
            this.loadViewData(view);
        }

        /**
         * 加载视图数据
         * @param {string} view - 视图名称
         */
        loadViewData(view) {
            switch (view) {
                case 'dashboard':
                    this.loadDashboardData();
                    break;
                case 'users':
                    this.loadUserList();
                    break;
                case 'storage':
                    this.loadStorageData();
                    break;
                case 'settings':
                    this.loadSystemSettings();
                    break;
                case 'logs':
                    this.loadSystemLogs();
                    break;
            }
        }

        /**
         * 加载管理员数据
         */
        async loadAdminData() {
            try {
                await this.loadSystemStats();
                this.loadDashboardData();
            } catch (error) {
                console.error('加载管理员数据失败:', error);
            }
        }

        /**
         * 加载系统统计信息
         */
        async loadSystemStats() {
            try {
                // 由于后端没有实现 /api/admin/stats 端点，直接使用模拟数据
                this.systemStats = {
                    totalUsers: 1250,
                    totalFiles: 15680,
                    totalStorage: '2.5 GB',
                    activeUsers: 89
                };
                this.updateStatsDisplay();
            } catch (error) {
                console.error('加载系统统计失败:', error);
                // 使用模拟数据
                this.systemStats = {
                    totalUsers: 1250,
                    totalFiles: 15680,
                    totalStorage: '2.5 GB',
                    activeUsers: 89
                };
                this.updateStatsDisplay();
            }
        }

        /**
         * 更新统计显示
         */
        updateStatsDisplay() {
            if (!this.systemStats) return;

            const elements = {
                totalUsers: document.getElementById('totalUsers'),
                totalFiles: document.getElementById('totalFiles'),
                totalStorage: document.getElementById('totalStorage'),
                activeUsers: document.getElementById('activeUsers')
            };

            if (elements.totalUsers) {
                elements.totalUsers.textContent = this.systemStats.totalUsers.toLocaleString();
            }
            if (elements.totalFiles) {
                elements.totalFiles.textContent = this.systemStats.totalFiles.toLocaleString();
            }
            if (elements.totalStorage) {
                elements.totalStorage.textContent = this.systemStats.totalStorage;
            }
            if (elements.activeUsers) {
                elements.activeUsers.textContent = this.systemStats.activeUsers;
            }
        }

        /**
         * 加载仪表板数据
         */
        async loadDashboardData() {
            // 这里可以加载更多仪表板数据
        }

        /**
         * 加载用户列表
         */
        async loadUserList() {
            try {
                // 使用API网关构建正确的URL
                let apiUrl;
                if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                    apiUrl = window.apiGateway.buildUrl('/api/admin/users');
                } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                    apiUrl = window.APP_UTILS.buildApiUrl('/api/admin/users');
                } else {
                    apiUrl = '/api/admin/users';
                }
                
                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    credentials: 'include' // 确保发送cookies
                });

                if (response.ok) {
                    this.userList = await response.json();
                    this.renderUserList();
                }
            } catch (error) {
                console.error('加载用户列表失败:', error);
                // 使用模拟数据
                this.userList = this.getMockUserList();
                this.renderUserList();
            }
        }

        /**
         * 渲染用户列表
         */
        renderUserList() {
            const userListContainer = document.getElementById('userList');
            if (!userListContainer) return;

            const userHTML = this.userList.map(user => `
                <div class="user-item" data-user-id="${user.id}">
                    <div class="user-info">
                        <div class="user-avatar">
                            <img src="${user.avatar || '/static/public/docs.png'}" alt="${user.username}">
                        </div>
                        <div class="user-details">
                            <div class="user-name">${user.username}</div>
                            <div class="user-email">${user.email}</div>
                            <div class="user-role ${user.role}">${this.getRoleDisplayName(user.role)}</div>
                        </div>
                    </div>
                    <div class="user-stats">
                        <div class="user-files">${user.fileCount} 文件</div>
                        <div class="user-storage">${user.storageUsed}</div>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-sm btn-primary" onclick="editUser('${user.id}')">编辑</button>
                        <button class="btn btn-sm btn-warning" onclick="toggleUserStatus('${user.id}')">
                            ${user.status === 'active' ? '禁用' : '启用'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">删除</button>
                    </div>
                </div>
            `).join('');

            userListContainer.innerHTML = userHTML;
        }

        /**
         * 过滤用户
         * @param {string} searchTerm - 搜索词
         */
        filterUsers(searchTerm) {
            const userItems = document.querySelectorAll('.user-item');
            userItems.forEach(item => {
                const userName = item.querySelector('.user-name').textContent.toLowerCase();
                const userEmail = item.querySelector('.user-email').textContent.toLowerCase();
                const matches = userName.includes(searchTerm.toLowerCase()) || 
                              userEmail.includes(searchTerm.toLowerCase());
                item.style.display = matches ? 'flex' : 'none';
            });
        }

        /**
         * 按角色过滤用户
         * @param {string} role - 角色
         */
        filterUsersByRole(role) {
            const userItems = document.querySelectorAll('.user-item');
            userItems.forEach(item => {
                const userRole = item.querySelector('.user-role').classList[1];
                const matches = !role || userRole === role;
                item.style.display = matches ? 'flex' : 'none';
            });
        }

        /**
         * 加载存储数据
         */
        async loadStorageData() {
            try {
                // 由于后端没有实现 /api/admin/storage 端点，直接使用模拟数据
                const mockStorageData = {
                    total: 10 * 1024 * 1024 * 1024, // 10GB
                    used: 2.5 * 1024 * 1024 * 1024, // 2.5GB
                    available: 7.5 * 1024 * 1024 * 1024 // 7.5GB
                };
                this.updateStorageDisplay(mockStorageData);
            } catch (error) {
                console.error('加载存储数据失败:', error);
                // 使用模拟数据
                const mockStorageData = {
                    total: 10 * 1024 * 1024 * 1024, // 10GB
                    used: 2.5 * 1024 * 1024 * 1024, // 2.5GB
                    available: 7.5 * 1024 * 1024 * 1024 // 7.5GB
                };
                this.updateStorageDisplay(mockStorageData);
            }
        }

        /**
         * 更新存储显示
         * @param {Object} storageData - 存储数据
         */
        updateStorageDisplay(storageData) {
            const totalElement = document.getElementById('totalStorageSpace');
            const usedElement = document.getElementById('usedStorage');
            const availableElement = document.getElementById('availableStorage');

            if (totalElement) {
                totalElement.textContent = this.formatStorageSize(storageData.total);
            }
            if (usedElement) {
                usedElement.textContent = this.formatStorageSize(storageData.used);
            }
            if (availableElement) {
                availableElement.textContent = this.formatStorageSize(storageData.available);
            }
        }

        /**
         * 加载系统设置
         */
        async loadSystemSettings() {
            try {
                // 由于后端没有实现 /api/admin/settings 端点，直接使用默认设置
                this.adminSettings = {
                    maxFileSize: 50,
                    allowedFileTypes: 'jpg,png,pdf,doc,docx,xls,xlsx,ppt,pptx',
                    userRegistration: 'enabled',
                    maintenanceMode: 'disabled'
                };
                this.updateSettingsForm();
            } catch (error) {
                console.error('加载系统设置失败:', error);
                // 使用默认设置
                this.adminSettings = {
                    maxFileSize: 50,
                    allowedFileTypes: 'jpg,png,pdf,doc,docx,xls,xlsx,ppt,pptx',
                    userRegistration: 'enabled',
                    maintenanceMode: 'disabled'
                };
                this.updateSettingsForm();
            }
        }

        /**
         * 更新设置表单
         */
        updateSettingsForm() {
            const maxFileSize = document.getElementById('maxFileSize');
            const allowedFileTypes = document.getElementById('allowedFileTypes');
            const userRegistration = document.getElementById('userRegistration');
            const maintenanceMode = document.getElementById('maintenanceMode');

            if (maxFileSize) maxFileSize.value = this.adminSettings.maxFileSize || 50;
            if (allowedFileTypes) allowedFileTypes.value = this.adminSettings.allowedFileTypes || '';
            if (userRegistration) userRegistration.value = this.adminSettings.userRegistration || 'enabled';
            if (maintenanceMode) maintenanceMode.value = this.adminSettings.maintenanceMode || 'disabled';
        }

        /**
         * 保存系统设置
         */
        async saveSystemSettings() {
            const settings = {
                maxFileSize: parseInt(document.getElementById('maxFileSize').value),
                allowedFileTypes: document.getElementById('allowedFileTypes').value,
                userRegistration: document.getElementById('userRegistration').value,
                maintenanceMode: document.getElementById('maintenanceMode').value
            };

            try {
                // 由于后端没有实现 /api/admin/settings 端点，直接保存到本地
                this.adminSettings = settings;
                localStorage.setItem('adminSettings', JSON.stringify(settings));
                
                if (window.showMessage) {
                    window.showMessage('系统设置保存成功', 'success');
                }
            } catch (error) {
                console.error('保存系统设置失败:', error);
                if (window.showMessage) {
                    window.showMessage('保存设置失败', 'error');
                }
            }
        }

        /**
         * 加载系统日志
         */
        async loadSystemLogs() {
            try {
                // 由于后端没有实现 /api/admin/logs 端点，直接使用模拟日志
                const mockLogs = this.getMockSystemLogs();
                this.renderSystemLogs(mockLogs);
            } catch (error) {
                console.error('加载系统日志失败:', error);
                // 使用模拟日志
                const mockLogs = this.getMockSystemLogs();
                this.renderSystemLogs(mockLogs);
            }
        }

        /**
         * 渲染系统日志
         * @param {Array} logs - 日志数组
         */
        renderSystemLogs(logs) {
            const logList = document.getElementById('logList');
            if (!logList) return;

            const logHTML = logs.map(log => `
                <div class="log-item log-${log.level}">
                    <div class="log-time">${this.formatDate(log.timestamp)}</div>
                    <div class="log-level">${log.level.toUpperCase()}</div>
                    <div class="log-message">${log.message}</div>
                    <div class="log-user">${log.user || 'System'}</div>
                </div>
            `).join('');

            logList.innerHTML = logHTML;
        }

        /**
         * 获取角色显示名称
         * @param {string} role - 角色代码
         * @returns {string} 显示名称
         */
        getRoleDisplayName(role) {
            const roleMap = {
                'admin': '管理员',
                'user': '普通用户',
                'guest': '访客'
            };
            return roleMap[role] || role;
        }

        /**
         * 格式化存储大小
         * @param {number} bytes - 字节数
         * @returns {string} 格式化的大小
         */
        formatStorageSize(bytes) {
            if (bytes === 0) return '0 B';
            
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        /**
         * 格式化日期
         * @param {string} dateString - 日期字符串
         * @returns {string} 格式化的日期
         */
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN');
        }

        /**
         * 获取模拟用户列表
         * @returns {Array} 用户列表
         */
        getMockUserList() {
            return [
                {
                    id: '1',
                    username: '管理员',
                    email: 'admin@example.com',
                    role: 'admin',
                    avatar: '/static/public/docs.png',
                    fileCount: 156,
                    storageUsed: '2.1 GB',
                    status: 'active'
                },
                {
                    id: '2',
                    username: '测试用户',
                    email: 'test@example.com',
                    role: 'user',
                    avatar: '/static/public/docs.png',
                    fileCount: 89,
                    storageUsed: '1.2 GB',
                    status: 'active'
                },
                {
                    id: '3',
                    username: '访客用户',
                    email: 'guest@example.com',
                    role: 'guest',
                    avatar: '/static/public/docs.png',
                    fileCount: 23,
                    storageUsed: '450 MB',
                    status: 'inactive'
                }
            ];
        }

        /**
         * 获取模拟系统日志
         * @returns {Array} 日志数组
         */
        getMockSystemLogs() {
            return [
                {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: '系统启动完成',
                    user: 'System'
                },
                {
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    level: 'warning',
                    message: '存储空间使用率超过80%',
                    user: 'System'
                },
                {
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    level: 'error',
                    message: '文件上传失败: 权限不足',
                    user: 'test@example.com'
                }
            ];
        }

        /**
         * 编辑用户
         * @param {string} userId - 用户ID
         */
        editUser(userId) {
            // 实现用户编辑功能
        }

        /**
         * 切换用户状态
         * @param {string} userId - 用户ID
         */
        toggleUserStatus(userId) {
            // 实现用户状态切换功能
        }

        /**
         * 删除用户
         * @param {string} userId - 用户ID
         */
        deleteUser(userId) {
            // 实现用户删除功能
        }

        /**
         * 刷新日志
         */
        refreshLogs() {
            this.loadSystemLogs();
        }

        /**
         * 检查是否为管理员
         * @returns {boolean} 是否为管理员
         */
        isAdminUser() {
            return this.isAdmin;
        }

        /**
         * 获取管理员设置
         * @returns {Object} 管理员设置
         */
        getAdminSettings() {
            return this.adminSettings;
        }

        /**
         * 获取系统统计
         * @returns {Object} 系统统计
         */
        getSystemStats() {
            return this.systemStats;
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
        }
    }
}

// 全局暴露
window.UIAdminManager = UIAdminManager;

// 全局函数
window.saveSystemSettings = function() {
    if (window.uiManager && window.uiManager.adminManager) {
        window.uiManager.adminManager.saveSystemSettings();
    }
};

window.editUser = function(userId) {
    if (window.uiManager && window.uiManager.adminManager) {
        window.uiManager.adminManager.editUser(userId);
    }
};

window.toggleUserStatus = function(userId) {
    if (window.uiManager && window.uiManager.adminManager) {
        window.uiManager.adminManager.toggleUserStatus(userId);
    }
};

window.deleteUser = function(userId) {
    if (window.uiManager && window.uiManager.adminManager) {
        window.uiManager.adminManager.deleteUser(userId);
    }
};

window.refreshLogs = function() {
    if (window.uiManager && window.uiManager.adminManager) {
        window.uiManager.adminManager.refreshLogs();
    }
};

// 调试函数
window.debugAdminStatus = function() {
<<<<<<< HEAD
    // 调试管理员状态
    if (window.uiManager && window.uiManager.adminManager) {
        // 调试逻辑
    }
=======
    console.log('=== 管理员状态调试 ===');
    
    // 检查用户信息
    const userInfo = localStorage.getItem('userInfo');
    console.log('用户信息:', userInfo ? JSON.parse(userInfo) : 'null');
    
    // 检查头像缓存
    const cachedAvatar = localStorage.getItem('cachedAvatar');
    console.log('头像缓存:', cachedAvatar);
    
    // 检查管理员状态
    if (window.uiManager && window.uiManager.adminManager) {
        console.log('管理员状态:', window.uiManager.adminManager.isAdmin);
    }
    
    // 检查DOM元素
    const elements = [
        'user-avatar',
        'avatar-image', 
        'avatar-icon',
        'sync-docs-btn',
        'settings-btn',
        'admin-menu',
        'welcome-message'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`${id}:`, {
                display: element.style.display,
                visibility: element.style.visibility,
                hidden: element.classList.contains('hidden'),
                src: element.src || 'N/A'
            });
        } else {
            console.log(`${id}: 元素未找到`);
        }
    });
    
    console.log('=== 调试结束 ===');
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
};

// 测试头像显示函数
window.testAvatarDisplay = function() {
<<<<<<< HEAD
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const user = JSON.parse(userInfo);
=======
    console.log('=== 测试头像显示 ===');
    
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        console.log('测试用户:', user);
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
        
        if (window.uiManager && window.uiManager.adminManager) {
            window.uiManager.adminManager.forceUpdateAvatarDisplay(user);
        }
<<<<<<< HEAD
    }
};
=======
    } else {
        console.log('没有找到用户信息');
    }
    
    console.log('=== 测试结束 ===');
};

// 测试管理员功能显示函数
window.testAdminDisplay = function() {
    console.log('=== 测试管理员功能显示 ===');
    
    if (window.uiManager && window.uiManager.adminManager) {
        window.uiManager.adminManager.forceShowAdminElements();
    } else {
        console.log('管理员管理器未找到');
    }
    
    console.log('=== 测试结束 ===');
}; 
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
