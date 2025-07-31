/**
 * 用户管理模块
 * 负责管理员用户管理功能，包括用户列表显示、存储空间管理等
 */
class UIUserManager {
    constructor(uiManager = null) {
        this.uiManager = uiManager;
        this.api = window.apiSystem || window.apiManager;
        this.adminApi = this.api?.admin || window.api?.admin || (window.apiSystem && window.apiSystem.admin);
        this.currentPage = 1;
        this.pageSize = 5;
        this.currentUsers = [];
        this.onlineStatusInterval = null;
        
        // 确保API系统已初始化
        if (!this.adminApi) {
            console.warn('管理员API未初始化，将在init中重试');
        }
        
        this.init();
    }

    /**
     * 初始化用户管理器
     */
    init() {
        this.bindEvents();
        
        // 确保API系统已初始化
        if (!this.adminApi) {
            this.api = window.apiSystem || window.apiManager;
            this.adminApi = this.api?.admin || window.api?.admin || (window.apiSystem && window.apiSystem.admin);
        }
        
        // 只有在用户已登录且是管理员时才启动在线状态更新
        this.checkAndStartOnlineStatusUpdates();
    }

    /**
     * 检查并启动在线状态更新
     */
    checkAndStartOnlineStatusUpdates() {
        try {
            // 检查认证系统是否可用
            const authSystem = window.authSystem || window.AuthSystem;
            if (authSystem && typeof authSystem.isLoggedIn === 'function') {
                const isLoggedIn = authSystem.isLoggedIn();
                if (isLoggedIn) {
                    // 用户已登录，启动在线状态更新
                    this.startOnlineStatusUpdates();
                }
            } else {
                // 如果认证系统不可用，检查本地存储
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    try {
                        const user = JSON.parse(userInfo);
                        if (user && user.username) {
                            // 有用户信息，启动在线状态更新
                            this.startOnlineStatusUpdates();
                        }
                    } catch (error) {
                        console.warn('解析用户信息失败:', error);
                    }
                }
            }
        } catch (error) {
            console.warn('检查登录状态失败:', error);
        }
    }

    /**
     * 开始定期更新在线状态
     */
    startOnlineStatusUpdates() {
        // 每30秒更新一次在线状态 - 优化：减少更新频率，避免频繁重新渲染
        this.onlineStatusInterval = setInterval(() => {
            this.updateOnlineStatus();
        }, 60000); // 改为60秒，减少更新频率
    }

    /**
     * 更新在线状态
     */
    async updateOnlineStatus() {
        try {
            // 检查用户是否为管理员
            const currentUser = this.getCurrentUser();
            if (!currentUser || !this.isAdminUser(currentUser)) {
                console.log('用户未登录或不是管理员，跳过在线状态更新');
                return;
            }
            
            // 优化：只在模态框打开时才更新，避免不必要的重新渲染
            const modal = document.querySelector('.fixed.inset-0.z-50[data-modal="user-management"]');
            if (!modal) {
                return; // 如果模态框未打开，不更新
            }
            
            // 优化：减少更新频率，避免频繁重新渲染导致滚动条闪烁
            // 只在用户列表为空或长时间未更新时才重新加载
            const usersListContainer = document.getElementById('users-list');
            if (!usersListContainer || usersListContainer.children.length === 0) {
                await this.loadUsersList();
            } else {
                // 只更新在线状态，不重新渲染整个列表
                this.updateOnlineStatusOnly();
            }
        } catch (error) {
            console.error('更新在线状态失败:', error);
        }
    }

    /**
     * 只更新在线状态，不重新渲染整个列表
     */
    updateOnlineStatusOnly() {
        const usersListContainer = document.getElementById('users-list');
        if (!usersListContainer) return;

        // 获取当前用户列表的在线状态
        this.currentUsers.forEach(user => {
            const userCard = usersListContainer.querySelector(`[data-user-uuid="${user.uuid}"]`);
            if (userCard) {
                const onlineStatusElement = userCard.querySelector('.online-status');
                if (onlineStatusElement) {
                    const isOnline = user.is_online;
                    const onlineStatusColor = isOnline ? 'green' : 'gray';
                    const onlineStatusText = isOnline ? '在线' : '离线';
                    const onlineStatusIcon = isOnline ? 'fa-circle' : 'fa-circle-o';
                    
                    onlineStatusElement.innerHTML = `
                        <i class="fa ${onlineStatusIcon} text-${onlineStatusColor}-400 mr-1"></i>
                        <span class="text-${onlineStatusColor}-400">${onlineStatusText}</span>
                    `;
                }
            }
        });
    }

    /**
     * 停止在线状态更新
     */
    stopOnlineStatusUpdates() {
        if (this.onlineStatusInterval) {
            clearInterval(this.onlineStatusInterval);
            this.onlineStatusInterval = null;
        }
    }

    /**
     * 检查管理员菜单显示状态
     */
    checkAdminMenuVisibility() {
        const adminMenu = document.getElementById('admin-menu');
        const adminUsersBtn = document.getElementById('admin-users-btn');
        
        if (adminMenu) {
            // 删除所有console.log调试语句
        }
        
        if (adminUsersBtn) {
            // 删除所有console.log调试语句
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 用户管理按钮
        const adminUsersBtn = document.getElementById('admin-users-btn');
        if (adminUsersBtn) {
            // 先移除可能存在的旧事件监听器
            adminUsersBtn.removeEventListener('click', this.handleAdminUsersClick);
            // 绑定新的事件监听器
            adminUsersBtn.addEventListener('click', this.handleAdminUsersClick);
        } else {
            // 监听组件加载完成事件，重新尝试绑定
            document.addEventListener('componentsLoaded', () => {
                setTimeout(() => {
                    this.retryBindEvents();
                }, 100);
            });
        }
    }

    /**
     * 处理用户管理按钮点击事件
     */
    handleAdminUsersClick = (e) => {
        e.preventDefault();
        this.showAdminUsersModal();
    };

    /**
     * 重试绑定事件
     */
    retryBindEvents() {
        const adminUsersBtn = document.getElementById('admin-users-btn');
        if (adminUsersBtn) {
            // 先移除可能存在的旧事件监听器
            adminUsersBtn.removeEventListener('click', this.handleAdminUsersClick);
            // 绑定新的事件监听器
            adminUsersBtn.addEventListener('click', this.handleAdminUsersClick);
        } else {
            // 删除所有console.log调试语句
        }
    }

    /**
     * 显示管理员用户管理界面
     */
    async showAdminUsersModal() {
        try {
            // 直接显示用户管理界面，权限验证交给后端API处理
            const modal = this.createAdminUsersModal();
            // 将模态框添加到DOM
            document.body.appendChild(modal);
            // 等待DOM渲染完成
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 检查是否已有用户数据
            if (this.currentUsers && this.currentUsers.length > 0) {
                // 已有数据，直接渲染
                this.renderUsersList(this.currentUsers);
            } else {
                // 没有数据，重新加载
                await this.loadUsersList();
            }
        } catch (error) {
            console.error('显示用户管理界面失败:', error);
            this.showMessage('显示用户管理界面失败', 'error');
        }
    }

    /**
     * 创建管理员用户管理模态框
     */
    createAdminUsersModal() {
        // 检查是否已经存在用户管理模态框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="user-management"]');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm';
        modal.setAttribute('data-modal', 'user-management');
        
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl p-8 max-w-4xl mx-4 max-h-[90vh] shadow-2xl border border-blue-400/20 backdrop-blur-xl flex flex-col">
                <!-- 模态框头部 -->
                <div class="flex items-center justify-between mb-8 flex-wrap gap-4 flex-shrink-0">
                    <div class="flex items-center space-x-4 flex-1 min-w-0">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i class="fa fa-users text-white text-xl"></i>
                        </div>
                        <div class="min-w-0">
                            <h3 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent break-words">用户管理</h3>
                            <p class="text-gray-400 text-sm mt-1 break-words">管理系统用户和存储空间</p>
                        </div>
                    </div>
                    <button class="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50 flex-shrink-0" id="close-user-management">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- 搜索和过滤区域 -->
                <div class="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex-shrink-0">
                    <div class="flex items-center space-x-4 flex-wrap gap-4">
                        <div class="flex-1 relative min-w-0">
                            <i class="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="text" id="user-search" placeholder="搜索用户..." 
                                   class="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg placeholder-gray-400 focus:border-blue-400/50 focus:outline-none transition-all duration-300 text-white">
                        </div>
                        <select id="role-filter" class="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-blue-400/50 focus:outline-none transition-all duration-300 flex-shrink-0">
                            <option value="">所有角色</option>
                            <option value="admin">管理员</option>
                            <option value="user">普通用户</option>
                            <option value="guest">访客</option>
                        </select>
                        <button id="refresh-users" class="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-300 hover:scale-105 flex-shrink-0">
                            <i class="fa fa-refresh mr-2"></i>刷新
                        </button>
                    </div>
                </div>
                
                <!-- 统计信息 -->
                <div class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                    <div class="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-xl border border-blue-400/30">
                        <div class="flex items-center justify-between">
                            <div class="min-w-0">
                                <p class="text-blue-400 text-sm font-medium">总用户数</p>
                                <p class="text-2xl font-bold text-white break-words" id="total-users">-</p>
                            </div>
                            <i class="fa fa-users text-blue-400 text-xl flex-shrink-0"></i>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-green-500/20 to-green-600/20 p-4 rounded-xl border border-green-400/30">
                        <div class="flex items-center justify-between">
                            <div class="min-w-0">
                                <p class="text-green-400 text-sm font-medium">活跃用户</p>
                                <p class="text-2xl font-bold text-white break-words" id="active-users">-</p>
                            </div>
                            <i class="fa fa-user-check text-green-400 text-xl flex-shrink-0"></i>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-xl border border-purple-400/30">
                        <div class="flex items-center justify-between">
                            <div class="min-w-0">
                                <p class="text-purple-400 text-sm font-medium">总存储</p>
                                <p class="text-2xl font-bold text-white break-words" id="total-storage">-</p>
                            </div>
                            <i class="fa fa-database text-purple-400 text-xl flex-shrink-0"></i>
                        </div>
                    </div>
                    <div class="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-4 rounded-xl border border-orange-400/30">
                        <div class="flex items-center justify-between">
                            <div class="min-w-0">
                                <p class="text-orange-400 text-sm font-medium">已使用</p>
                                <p class="text-2xl font-bold text-white break-words" id="used-storage">-</p>
                            </div>
                            <i class="fa fa-hdd text-orange-400 text-xl flex-shrink-0"></i>
                        </div>
                    </div>
                </div>
                
                <!-- 用户列表容器 - 修复滚动条闪烁问题 -->
                <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style="overflow-y: scroll !important;">
                    <div id="users-list" class="space-y-4">
                        <div class="text-center py-12 text-gray-400">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                            <p class="text-lg">加载用户数据中...</p>
                            <p class="text-sm text-gray-500 mt-2">请稍候</p>
                        </div>
                    </div>
                    
                    <!-- 分页控件 -->
                    <div id="pagination-controls" class="flex items-center justify-between mt-6 pt-6 border-t border-gray-700/50 hidden flex-wrap gap-4">
                        <button id="prev-page-btn" class="flex items-center px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex-shrink-0">
                            <i class="fa fa-chevron-left mr-2"></i>上一页
                        </button>
                        <span id="page-info" class="text-gray-400 text-sm break-words"></span>
                        <button id="next-page-btn" class="flex items-center px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex-shrink-0">
                            下一页<i class="fa fa-chevron-right ml-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 优化：立即应用滚动条样式，防止闪烁
        setTimeout(() => {
            const scrollContainer = modal.querySelector('.flex-1.min-h-0.overflow-y-auto');
            if (scrollContainer) {
                // 强制应用滚动条样式
                scrollContainer.style.overflowY = 'scroll';
                // 移除scrollbar-gutter，避免在内容较少时预留滚动条空间
                scrollContainer.style.scrollbarWidth = 'thin';
                scrollContainer.style.scrollbarColor = 'rgba(156, 163, 175, 0.5) transparent';
                
                // 确保Webkit浏览器的滚动条样式
                if (scrollContainer.style.webkitScrollbar === undefined) {
                    scrollContainer.style.setProperty('--scrollbar-width', '8px');
                    scrollContainer.style.setProperty('--scrollbar-thumb-color', 'rgba(156, 163, 175, 0.6)');
                    scrollContainer.style.setProperty('--scrollbar-track-color', 'transparent');
                }
            }
        }, 0);

        // 绑定关闭事件
        const closeBtn = modal.querySelector('#close-user-management');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
                this.stopOnlineStatusUpdates();
            });
        }

        // 绑定搜索事件
        const searchInput = modal.querySelector('#user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }

        // 绑定角色过滤事件
        const roleFilter = modal.querySelector('#role-filter');
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filterUsersByRole(e.target.value);
            });
        }

        // 绑定刷新事件
        const refreshBtn = modal.querySelector('#refresh-users');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadUsersList();
            });
        }

        // 启动在线状态更新
        this.startOnlineStatusUpdates();
        
        // 返回创建的模态框元素
        return modal;
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 用户信息
     */
    getCurrentUser() {
        if (window.StorageManager && typeof window.StorageManager.getUserInfo === 'function') {
            return window.StorageManager.getUserInfo();
        } else {
            const userData = localStorage.getItem('userInfo');
            return userData ? JSON.parse(userData) : null;
        }
    }

    /**
     * 检查用户是否为管理员
     * @param {Object} user 用户信息
     * @returns {boolean} 是否为管理员
     */
    isAdminUser(user) {
        if (!user) return false;
        
        // 检查用户名是否为管理员
        const adminUsernames = ['Mose', 'admin', 'administrator'];
        if (adminUsernames.includes(user.username)) {
            return true;
        }
        
        // 检查用户角色
        if (user.role === 'admin' || user.role === 'administrator') {
            return true;
        }
        
        // 检查是否有管理员权限标志
        if (user.isAdmin === true || user.is_admin === true) {
            return true;
        }
        
        return false;
    }

    /**
     * 加载用户列表
     */
    async loadUsersList(page = 1) {
        try {
            // 检查用户是否为管理员
            const currentUser = this.getCurrentUser();
            if (!currentUser || !this.isAdminUser(currentUser)) {
                console.log('用户未登录或不是管理员，跳过加载用户列表');
                return;
            }

            if (!this.adminApi) {
                console.error('管理员API未初始化');
                return;
            }

            const result = await this.adminApi.getAllUsers(page, this.pageSize);
            
            if (result && result.success) {
                this.currentUsers = result.users || [];
                
                // 检查用户管理模态框是否显示
                const userManagementModal = document.querySelector('.fixed.inset-0.z-50[data-modal="user-management"]');
                if (userManagementModal) {
                    // 模态框已显示，可以渲染用户列表
                    this.renderUsersList(this.currentUsers, result);
                    this.updatePaginationControls(result, page);
                }
                // 模态框未显示时，只保存数据，不渲染
            } else {
                console.error('获取用户列表失败:', result?.message || '未知错误');
            }
        } catch (error) {
            console.error('加载用户列表时发生错误:', error);
        }
    }

    /**
     * 更新分页控件
     */
    updatePaginationControls(result, currentPage) {
        const paginationControls = document.getElementById('pagination-controls');
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const pageInfo = document.getElementById('page-info');

        if (!paginationControls || !prevBtn || !nextBtn || !pageInfo) return;

        // 如果用户总数超过页面大小且有分页信息，显示分页控件
        if (result.total > this.pageSize && result.page_size) {
            paginationControls.classList.remove('hidden');
            
            const totalPages = Math.ceil(result.total / result.page_size);
            pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页 (共 ${result.total} 个用户)`;
            
            // 更新按钮状态
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= totalPages;
            
            // 绑定分页事件
            prevBtn.onclick = () => {
                if (currentPage > 1) {
                    this.loadUsersList(currentPage - 1);
                }
            };
            
            nextBtn.onclick = () => {
                if (currentPage < totalPages) {
                    this.loadUsersList(currentPage + 1);
                }
            };
        } else {
            paginationControls.classList.add('hidden');
        }
    }

    /**
     * 渲染用户列表
     */
    renderUsersList(users, result = null) {
        const usersListContainer = document.getElementById('users-list');
        if (!usersListContainer) {
            console.error('找不到用户列表容器，尝试重新查找...');
            // 优化：减少重试延迟，避免长时间等待
            setTimeout(() => {
                const retryContainer = document.getElementById('users-list');
                if (retryContainer) {
                    console.log('重新找到用户列表容器，重新渲染...');
                    this.renderUsersList(users, result);
                } else {
                    console.error('仍然找不到用户列表容器，渲染失败');
                }
            }, 100); // 从200ms减少到100ms
            return;
        }

        // 修正头像URL
        users = users.map(user => {
            // 构建完整的头像URL
            if (user.avatar || user.avatarUrl) {
                let avatarPath = user.avatar || user.avatarUrl;
                
                // 如果已经是完整URL，直接使用
                if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
                    user.avatarUrl = avatarPath;
                } else {
                    // 确保路径以/uploads/avatars/开头
                    if (!avatarPath.startsWith('/uploads/avatars/')) {
                        avatarPath = '/uploads/avatars/' + avatarPath;
                    }
                    
                    // 尝试构建完整URL
                    if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                        user.avatarUrl = window.apiGateway.buildUrl(avatarPath);
                    } else {
                        user.avatarUrl = avatarPath;
                    }
                }
            }
            return user;
        });

        // 更新统计信息
        this.updateUserStats(users);

        // 生成用户列表HTML
        const usersHTML = users.map((user, index) => {
            const storagePercentage = user.storage_limit ? (user.used_space / user.storage_limit) * 100 : 0;
            const storageColor = storagePercentage > 80 ? 'red' : storagePercentage > 60 ? 'orange' : 'green';
            
            // 判断是否为管理员
            const isAdmin = this.isAdminUser(user);
            const adminClass = isAdmin ? 'admin-user-card' : '';
            
            // 在线状态
            const isOnline = user.is_online;
            const onlineStatusColor = isOnline ? 'green' : 'gray';
            const onlineStatusText = isOnline ? '在线' : '离线';
            const onlineStatusIcon = isOnline ? 'fa-circle' : 'fa-circle-o';
            
            return `
                <div class="user-management-card ${adminClass}" style="animation-delay: ${index * 50}ms" data-user-uuid="${user.uuid}">
                    ${isAdmin ? '<div class="crown-decoration">👑</div>' : ''}
                    <!-- 卡片主体：左右布局 - 优化响应式 -->
                    <div class="flex items-start gap-4 lg:gap-6 flex-wrap">
                        <!-- 左侧：用户基本信息 - 垂直布局 -->
                        <div class="flex flex-col items-center gap-3 flex-1 min-w-0">
                            <!-- 第一行：用户头像 -->
                            <div class="flex justify-center">
                                ${user.avatarUrl ? 
                                    `<img src="${user.avatarUrl}" alt="${user.username || '用户头像'}" class="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-gray-600/30" onerror="this.style.display='none';" />` : 
                                    `<div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        <i class="fa fa-user"></i>
                                    </div>`
                                }
                            </div>
                            
                            <!-- 第二行：用户名和身份铭牌在同一排 -->
                            <div class="flex items-center gap-2 flex-wrap justify-center">
                                <h4 class="text-white font-semibold text-lg break-words text-center">${user.username || '未知用户'}</h4>
                                <span class="px-3 py-1 ${isAdmin ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'} text-xs rounded-full font-medium flex-shrink-0">
                                    ${isAdmin ? '管理员' : '用户'}
                                </span>
                            </div>
                            
                            <!-- 第三行：邮箱 - 减小图标和文字距离 -->
                            <div class="text-center max-w-full">
                                <p class="text-gray-400 text-sm break-words px-2">
                                    <i class="fa fa-envelope mr-1"></i>${user.email || '无邮箱'}
                                </p>
                            </div>
                            
                            <!-- 第四行：在线状态和最近活跃时间 -->
                            <div class="flex items-center justify-center gap-2 lg:gap-4 text-xs flex-wrap">
                                <span class="flex items-center online-status">
                                    <i class="fa ${onlineStatusIcon} text-${onlineStatusColor}-400 mr-1"></i>
                                    <span class="text-${onlineStatusColor}-400">${onlineStatusText}</span>
                                </span>
                                <span class="text-gray-400">
                                    <i class="fa fa-clock mr-1"></i>${this.formatDate(user.last_login_time || user.created_at)}
                                </span>
                            </div>
                        </div>
                        
                        <!-- 右侧：存储信息框 - 四行布局 -->
                        <div class="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 w-full lg:w-auto lg:min-w-[280px] flex-shrink-0">
                            <!-- 第一行：存储使用情况文字、百分比、编辑按钮 -->
                            <div class="flex items-center justify-between mb-3 w-full">
                                <div class="flex items-center gap-3">
                                    <h5 class="text-white font-medium text-sm whitespace-nowrap">存储使用情况</h5>
                                    <span class="text-${storageColor}-400 font-medium text-sm whitespace-nowrap">${storagePercentage.toFixed(1)}%</span>
                                </div>
                                <!-- 编辑按钮 - 无背景色，与滚动条右对齐 -->
                                <button class="storage-edit-btn w-8 h-8 text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
                                        data-uuid="${user.uuid}" 
                                        data-current="${user.storage_limit || 0}"
                                        title="编辑存储限制">
                                    <i class="fa fa-edit text-sm group-hover:rotate-12 transition-transform"></i>
                                </button>
                            </div>
                            
                            <!-- 第二行：滚动条 -->
                            <div class="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-4">
                                <div class="h-full bg-gradient-to-r from-${storageColor}-500 to-${storageColor}-600 rounded-full transition-all duration-300" 
                                     style="width: ${Math.min(storagePercentage, 100)}%"></div>
                            </div>
                            
                            <!-- 第三行：存储限制和已使用标签 -->
                            <div class="flex justify-between mb-2">
                                <div class="text-gray-400 text-xs font-medium">存储限制</div>
                                <div class="text-gray-400 text-xs font-medium">已使用</div>
                            </div>
                            
                            <!-- 第四行：对应的数值 -->
                            <div class="flex justify-between">
                                <div class="text-white text-sm break-words">${this.formatStorageSize(user.storage_limit || 0)}</div>
                                <div class="text-white text-sm break-words">${this.formatStorageSize(user.used_space || 0)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 更新用户列表内容
        usersListContainer.innerHTML = usersHTML;

        // 绑定编辑存储按钮事件
        usersListContainer.querySelectorAll('.storage-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uuid = e.target.closest('button').dataset.uuid;
                const currentLimit = parseInt(e.target.closest('button').dataset.current);
                this.showStorageEditDialog(uuid, currentLimit);
            });
        });


    }

    /**
     * 更新用户统计信息
     */
    updateUserStats(users) {
        const totalUsers = users.length;
        const activeUsers = users.filter(user => user.last_login_time && 
            new Date(user.last_login_time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
        const totalStorage = users.reduce((sum, user) => sum + (user.storage_limit || 0), 0);
        const usedStorage = users.reduce((sum, user) => sum + (user.used_space || 0), 0);

        // 更新统计卡片
        const totalUsersEl = document.getElementById('total-users');
        const activeUsersEl = document.getElementById('active-users');
        const totalStorageEl = document.getElementById('total-storage');
        const usedStorageEl = document.getElementById('used-storage');

        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (activeUsersEl) activeUsersEl.textContent = activeUsers;
        if (totalStorageEl) totalStorageEl.textContent = this.formatStorageSize(totalStorage);
        if (usedStorageEl) usedStorageEl.textContent = this.formatStorageSize(usedStorage);
    }

    /**
     * 过滤用户
     */
    filterUsers(searchTerm) {
        const usersListContainer = document.getElementById('users-list');
        if (!usersListContainer) {
            console.warn('过滤用户时找不到用户列表容器');
            return;
        }

        const userCards = usersListContainer.querySelectorAll('.user-management-card');
        const searchLower = searchTerm.toLowerCase();

        userCards.forEach(card => {
            const userName = card.querySelector('h4')?.textContent?.toLowerCase() || '';
            const userEmail = card.querySelector('p')?.textContent?.toLowerCase() || '';
            
            const matches = userName.includes(searchLower) || userEmail.includes(searchLower);
            
            if (matches) {
                card.style.display = 'block';
                card.style.animation = 'cardFadeIn 0.3s ease-out';
            } else {
                card.style.display = 'none';
            }
        });

        // 更新搜索结果统计
        this.updateSearchResults(searchTerm);
    }

    /**
     * 按角色过滤用户
     */
    filterUsersByRole(role) {
        const usersListContainer = document.getElementById('users-list');
        if (!usersListContainer) {
            console.warn('按角色过滤用户时找不到用户列表容器');
            return;
        }

        const userCards = usersListContainer.querySelectorAll('.user-management-card');
        
        userCards.forEach(card => {
            const roleBadge = card.querySelector('.px-2.py-1.bg-blue-500\\/20');
            const userRole = roleBadge?.textContent?.toLowerCase() || '';
            
            if (!role || userRole.includes(role.toLowerCase())) {
                card.style.display = 'block';
                card.style.animation = 'cardFadeIn 0.3s ease-out';
            } else {
                card.style.display = 'none';
            }
        });

        // 更新过滤结果统计
        this.updateFilterResults(role);
    }

    /**
     * 更新搜索结果统计
     */
    updateSearchResults(searchTerm) {
        const usersListContainer = document.getElementById('users-list');
        if (!usersListContainer) {
            console.warn('更新搜索结果统计时找不到用户列表容器');
            return;
        }

        const visibleCards = usersListContainer.querySelectorAll('.user-management-card[style*="display: block"], .user-management-card:not([style*="display: none"])');
        const totalCards = usersListContainer.querySelectorAll('.user-management-card').length;
        
        // 可以在这里添加搜索结果提示
        if (searchTerm && visibleCards.length !== totalCards) {
            console.log(`搜索 "${searchTerm}" 找到 ${visibleCards.length} 个用户`);
        }
    }

    /**
     * 更新过滤结果统计
     */
    updateFilterResults(role) {
        const usersListContainer = document.getElementById('users-list');
        if (!usersListContainer) {
            console.warn('更新过滤结果统计时找不到用户列表容器');
            return;
        }

        const visibleCards = usersListContainer.querySelectorAll('.user-management-card[style*="display: block"], .user-management-card:not([style*="display: none"])');
        const totalCards = usersListContainer.querySelectorAll('.user-management-card').length;
        
        if (role && visibleCards.length !== totalCards) {
            console.log(`角色过滤 "${role}" 找到 ${visibleCards.length} 个用户`);
        }
    }

    /**
     * 清除所有过滤器
     */
    clearFilters() {
        const searchInput = document.getElementById('user-search');
        const roleFilter = document.getElementById('role-filter');
        
        if (searchInput) searchInput.value = '';
        if (roleFilter) roleFilter.value = '';
        
        // 显示所有用户卡片
        const usersListContainer = document.getElementById('users-list');
        if (usersListContainer) {
            const userCards = usersListContainer.querySelectorAll('.user-management-card');
            userCards.forEach(card => {
                card.style.display = 'block';
                card.style.animation = 'cardFadeIn 0.3s ease-out';
            });
        }
    }



    /**
     * 显示存储编辑对话框
     */
    async showStorageEditDialog(uuid, currentLimit) {
        // 检查是否已经存在存储编辑对话框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="storage-edit"]');
        if (existingModal) {
            existingModal.remove();
        }

        const currentLimitGB = Math.round(currentLimit / (1024 * 1024 * 1024));

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm';
        modal.setAttribute('data-modal', 'storage-edit');
        
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-900/95 to-gray-800/95 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-purple-400/20 backdrop-blur-xl">
                <!-- 模态框头部 -->
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <i class="fa fa-database text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">编辑存储限制</h3>
                            <p class="text-gray-400 text-sm mt-1">调整用户存储空间配额</p>
                        </div>
                    </div>
                    <button class="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 p-2 rounded-lg hover:bg-gray-700/50" onclick="this.closest('.fixed').remove()">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- 当前存储信息 -->
                <div class="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-gray-300 font-medium">当前限制</span>
                        <span class="text-purple-400 font-bold text-lg" id="user-storage-slider-value">${currentLimitGB} GB</span>
                    </div>
                    <div class="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style="width: 100%"></div>
                    </div>
                </div>
                
                <!-- 存储设置表单 -->
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-3">新的存储限制</label>
                        
                        <!-- 滑动条 -->
                        <div class="mb-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-gray-400 text-sm">1 GB</span>
                                <span class="text-purple-400 font-bold text-lg" id="user-storage-slider-value">${currentLimitGB} GB</span>
                                <span class="text-gray-400 text-sm">50 GB</span>
                            </div>
                            <input type="range" id="user-storage-slider" 
                                   class="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider" 
                                   min="1" max="50" value="${currentLimitGB}" 
                                   style="background: linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(currentLimitGB - 1) / 49 * 100}%, #374151 ${(currentLimitGB - 1) / 49 * 100}%, #374151 100%);">
                        </div>
                        
                        <!-- 数字输入框 -->
                        <div class="relative">
                            <input type="number" id="user-storage-limit-input" 
                                   class="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300 text-white text-lg font-medium" 
                                   min="1" max="50" value="${currentLimitGB}" placeholder="输入存储限制 (GB)">
                            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">GB</div>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">建议范围: 1-50 GB</p>
                    </div>
                    
                    <!-- 预设选项 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-3">快速设置</label>
                        <div class="grid grid-cols-3 gap-3">
                            <button class="preset-btn px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-300 border border-gray-600/50 hover:border-purple-400/50" data-value="5">
                                5 GB
                            </button>
                            <button class="preset-btn px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-300 border border-gray-600/50 hover:border-purple-400/50" data-value="10">
                                10 GB
                            </button>
                            <button class="preset-btn px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-300 border border-gray-600/50 hover:border-purple-400/50" data-value="20">
                                20 GB
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="flex justify-end space-x-4 mt-8">
                    <button class="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-600/50 transition-all duration-300 hover:scale-105 border border-gray-600/50 hover:border-gray-500/50" 
                            id="storage-edit-cancel">
                        <i class="fa fa-times mr-2"></i>取消
                    </button>
                    <button class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25" 
                            id="storage-edit-save">
                        <i class="fa fa-save mr-2"></i>保存更改
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定预设按钮事件
        modal.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = parseInt(e.target.dataset.value);
                modal.querySelector('#user-storage-limit-input').value = value;
                modal.querySelector('#user-storage-slider').value = value; // 同时更新滑动条
                modal.querySelector('#user-storage-slider-value').textContent = `${value} GB`; // 更新显示值
                
                // 更新滑动条的背景颜色
                const gradient = `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((value - 1) / 49) * 100}%, #374151 ${((value - 1) / 49) * 100}%, #374151 100%)`;
                modal.querySelector('#user-storage-slider').style.background = gradient;
                
                // 更新按钮状态
                modal.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('bg-purple-500/20', 'text-purple-400', 'border-purple-400/50'));
                e.target.classList.add('bg-purple-500/20', 'text-purple-400', 'border-purple-400/50');
            });
        });

        // 绑定滑动条事件
        const slider = modal.querySelector('#user-storage-slider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                modal.querySelector('#user-storage-limit-input').value = value;
                modal.querySelector('#user-storage-slider-value').textContent = `${value} GB`;
                // 更新滑动条的背景颜色
                const gradient = `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((value - 1) / 49) * 100}%, #374151 ${((value - 1) / 49) * 100}%, #374151 100%)`;
                slider.style.background = gradient;
            });
        }

        // 绑定输入框事件
        const input = modal.querySelector('#user-storage-limit-input');
        if (input) {
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 1;
                const clampedValue = Math.max(1, Math.min(50, value));
                e.target.value = clampedValue;
                modal.querySelector('#user-storage-slider').value = clampedValue;
                modal.querySelector('#user-storage-slider-value').textContent = `${clampedValue} GB`;
                // 更新滑动条的背景颜色
                const gradient = `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((clampedValue - 1) / 49) * 100}%, #374151 ${((clampedValue - 1) / 49) * 100}%, #374151 100%)`;
                modal.querySelector('#user-storage-slider').style.background = gradient;
            });
        }
        
        // 绑定存储编辑事件
        this.bindStorageEditEvents(modal, uuid);
    }

    /**
     * 绑定存储编辑事件
     */
    bindStorageEditEvents(modal, uuid) {
        const cancelBtn = modal.querySelector('#storage-edit-cancel');
        const saveBtn = modal.querySelector('#storage-edit-save');
        const input = modal.querySelector('#user-storage-limit-input');
        const slider = modal.querySelector('#user-storage-slider');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                if (!input) {
                    this.showMessage('找不到输入框', 'error');
                    return;
                }

                const newLimitGB = parseInt(input.value);
                if (!newLimitGB || newLimitGB < 1 || newLimitGB > 50) { // 调整最大值为50
                    this.showMessage('请输入有效的存储限制 (1-50 GB)', 'error');
                    return;
                }

                const newLimitBytes = newLimitGB * 1024 * 1024 * 1024;

                try {
                    if (!this.adminApi) {
                        this.showMessage('管理员API未初始化', 'error');
                        return;
                    }
                    
                    const result = await this.adminApi.updateUserStorage(uuid, newLimitBytes);
                    
                    if (result.success) {
                        // 关闭存储编辑对话框
                        modal.remove();
                        
                        // 显示成功消息
                        this.showMessage('存储限制更新成功', 'success');
                        
                        // 重新加载用户列表
                        this.loadUsersList();
                        
                        // 立即刷新所有存储空间显示
                        await this.refreshAllStorageDisplays();
                    } else {
                        this.showMessage(result.error || '更新失败', 'error');
                    }
                } catch (error) {
                    console.error('更新用户存储失败:', error);
                    this.showMessage('更新失败: ' + error.message, 'error');
                }
            });
        }
    }

    /**
     * 刷新所有存储空间显示
     */
    async refreshAllStorageDisplays() {
        try {
            // 获取最新的存储信息
            const api = window.apiSystem || window.apiManager;
            if (!api || !api.storage || !api.storage.getStorageInfo) {
                return;
            }
            
            const storageInfo = await api.storage.getStorageInfo();
            
            if (storageInfo && storageInfo.used_space !== undefined && storageInfo.total_space !== undefined) {
                // 调用主页的统一同步方法
                const uiManager = window.uiManager || window.UIManager || 
                                 (window.app && window.app.uiManager) ||
                                 (window.apiSystem && window.apiSystem.uiManager);
                
                if (uiManager && typeof uiManager.syncStorageDisplay === 'function') {
                    await uiManager.syncStorageDisplay(storageInfo);
                }
            }
        } catch (error) {
            console.error('刷新存储空间显示失败:', error);
        }
    }

    /**
     * 更新存储显示（供外部调用）
     */
    updateStorageDisplay(storageInfo) {
        // 用户管理页面不需要更新存储显示，因为它显示的是用户列表
        // 这个方法主要用于接收存储信息更新，避免循环调用
        if (storageInfo && this.uiManager && typeof this.uiManager.updateStorageDisplay === 'function') {
            this.uiManager.updateStorageDisplay(storageInfo);
        }
    }

    /**
     * 格式化日期
     */
    formatDate(dateString) {
        if (!dateString) return '未知';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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
     * 显示消息
     */
    showMessage(message, type = 'info') {
        // 优先使用UI管理器的消息系统
        if (this.uiManager && typeof this.uiManager.showMessage === 'function') {
            this.uiManager.showMessage(message, type);
            return;
        }
        
        // 其次使用MessageBox
        if (window.MessageBox && window.MessageBox.show) {
            window.MessageBox.show({
                message: message,
                type: type,
                duration: type === 'success' ? 2000 : 3000
            });
            return;
        }
        
        // 最后使用$utils
        if (window.$utils && window.$utils.showMessage) {
            window.$utils.showMessage(message, type);
            return;
        }
        
        // 降级处理：如果其他消息系统不可用，静默处理
    }

    /**
     * 在用户登录后启动管理员功能
     */
    startAdminFeatures() {
        const currentUser = this.getCurrentUser();
        if (currentUser && this.isAdminUser(currentUser)) {
            this.startOnlineStatusUpdates();
        }
    }

    /**
     * 销毁模块
     */
    destroy() {
        // 清理事件监听器
        const adminUsersBtn = document.getElementById('admin-users-btn');
        if (adminUsersBtn) {
            adminUsersBtn.removeEventListener('click', this.handleAdminUsersClick);
        }
        this.stopOnlineStatusUpdates(); // 停止在线状态更新
    }
}

// 导出模块
window.UIUserManager = UIUserManager;