/**
 * 管理员模块
 * 处理用户管理、存储管理、系统设置和管理员权限控制功能
 */
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
            console.log('检查管理员权限，当前用户:', currentUser);
            
            if (currentUser && currentUser.username === 'Mose') {
                this.isAdmin = true;
                console.log('设置为管理员用户');
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
                console.log('显示管理员悬浮按钮');
                this.showAdminFloatingButtons();
            } else {
                console.log('隐藏管理员悬浮按钮');
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
     * 延迟检查管理员权限（用于登录后确保用户信息已保存）
     */
    async delayedCheckAdminPermissions() {
        // 等待一段时间确保用户信息已保存到localStorage
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 重新检查管理员权限
        return await this.checkAdminPermissions();
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
        
        console.log('更新头像管理员菜单，isAdmin:', this.isAdmin);
        console.log('找到的元素:', { adminMenu, settingsBtn, syncDocsBtn, storageSettingsBtn });
        
        // 生产环境特殊处理：确保管理员状态正确
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            // 重新验证管理员状态
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.username === 'Mose') {
                this.isAdmin = true;
                console.log('生产环境重新设置为管理员用户');
            }
        }
        
        if (adminMenu && settingsBtn) {
            if (this.isAdmin) {
                // 管理员：显示设置按钮、同步文档按钮、管理存储空间按钮和管理员菜单
                console.log('显示管理员相关元素');
                settingsBtn.style.display = 'block';
                settingsBtn.classList.remove('hidden');
                adminMenu.classList.remove('hidden');
                if (syncDocsBtn) {
                    syncDocsBtn.classList.remove('hidden');
                }
                if (storageSettingsBtn) {
                    storageSettingsBtn.style.display = 'block';
                }

            } else {
                // 非管理员：隐藏设置按钮、管理员菜单、同步文档按钮和管理存储空间按钮
                console.log('隐藏管理员相关元素');
                settingsBtn.style.display = 'none';
                settingsBtn.classList.add('hidden');
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
                console.log('生产环境延迟重试更新管理员菜单');
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
            syncDocsBtn.classList.remove('hidden');
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