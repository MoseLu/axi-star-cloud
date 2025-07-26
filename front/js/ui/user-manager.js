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
        
        // 确保API系统已初始化
        if (!this.adminApi) {
            console.warn('管理员API未初始化，将在init中重试');
        }
        
        this.init();
    }

    init() {
        // 确保API系统已初始化
        if (!this.adminApi) {
            this.api = window.apiSystem || window.apiManager;
            this.adminApi = this.api?.admin || window.api?.admin || (window.apiSystem && window.apiSystem.admin);
        }
        
        this.bindEvents();
        
        // 检查管理员菜单显示状态
        setTimeout(() => {
            this.checkAdminMenuVisibility();
        }, 500);
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
            this.createAdminUsersModal();
            this.loadUsersList();
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
        
        // 绑定关闭按钮事件
        const closeBtn = modal.querySelector('#close-user-management');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // 点击背景关闭模态框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // 按ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
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
     * 加载用户列表
     */
    async loadUsersList(page = 1) {
        try {
            if (!this.adminApi) {
                this.showMessage('管理员API未初始化', 'error');
                return;
            }
            
            // 确保API调用包含正确的认证信息
            const result = await this.adminApi.getAllUsers(page, this.pageSize);
            
            if (result.success) {
                this.renderUsersList(result.users, result);
                this.updatePaginationControls(result, page);
            } else {
                this.showMessage(result.error || '获取用户列表失败', 'error');
            }
        } catch (error) {
            this.showMessage('加载用户列表失败', 'error');
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
        const usersList = document.getElementById('users-list');
        if (!usersList) return;

        if (users.length === 0) {
            usersList.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fa fa-users text-4xl mb-4"></i>
                    <p>暂无用户</p>
                </div>
            `;
            return;
        }

        // 添加用户统计信息
        let headerHtml = '';
        if (result && result.total !== undefined) {
            headerHtml = `
                <div class="mb-4 p-3 bg-blue-900/20 border border-blue-400/30 rounded-lg">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-blue-300">用户统计</span>
                        <span class="text-gray-300">共 ${result.total} 个用户</span>
                    </div>
                </div>
            `;
        }

        usersList.innerHTML = headerHtml + users.map(user => `
            <div class="bg-dark border border-gray-700 rounded-lg p-4 hover:border-blue-400/50 transition-colors ${user.username === 'Mose' ? 'border-red-400/50 bg-red-900/10' : ''}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center ${user.username === 'Mose' ? 'from-red-500/20 to-orange-500/20' : ''}">
                            <i class="fa fa-user text-blue-400 text-xl ${user.username === 'Mose' ? 'text-red-400' : ''}"></i>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <h4 class="font-semibold">${user.username}</h4>
                                ${user.username === 'Mose' ? '<span class="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">管理员</span>' : ''}
                            </div>
                            <p class="text-gray-400 text-sm">${user.email || '未设置邮箱'}</p>
                            <p class="text-gray-500 text-xs">创建于 ${this.formatDate(user.created_at)}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <div class="text-right">
                            <p class="text-sm text-gray-400">存储空间</p>
                            <p class="font-semibold">${this.formatStorageSize(user.storage_limit)}</p>
                        </div>
                        
                        <div class="flex space-x-2">
                            <button class="storage-edit-btn bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm transition-colors" 
                                    data-uuid="${user.uuid}" data-current="${user.storage_limit}">
                                <i class="fa fa-edit mr-1"></i>编辑存储
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定编辑存储按钮事件
        usersList.querySelectorAll('.storage-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uuid = e.target.closest('button').dataset.uuid;
                const currentLimit = parseInt(e.target.closest('button').dataset.current);
                this.showStorageEditDialog(uuid, currentLimit);
            });
        });
    }

    /**
     * 显示存储编辑对话框
     */
    showStorageEditDialog(uuid, currentLimit) {
        // 检查是否已经存在存储编辑对话框
        const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="storage-edit"]');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'storage-edit');
        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-md shadow-2xl border border-blue-400/30">
                <h3 class="text-lg font-bold text-blue-300 mb-4">编辑存储限制</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">当前限制</label>
                        <p class="font-semibold">${this.formatStorageSize(currentLimit)}</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">新限制 (GB)</label>
                        <input type="number" id="new-storage-limit" min="1" max="1000" 
                               class="w-full p-3 bg-dark border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                               value="${Math.round(currentLimit / (1024 * 1024 * 1024))}" />
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors" 
                            id="storage-edit-cancel">取消</button>
                    <button class="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                            id="storage-edit-save" data-uuid="${uuid}">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件监听器
        const cancelBtn = modal.querySelector('#storage-edit-cancel');
        const saveBtn = modal.querySelector('#storage-edit-save');
        
        // 防止重复绑定事件
        const cancelHandler = () => {
            modal.remove();
        };
        
        const saveHandler = () => {
            // 立即移除事件监听器，防止重复点击
            saveBtn.removeEventListener('click', saveHandler);
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';
            this.updateUserStorage(uuid, modal);
        };
        
        cancelBtn.addEventListener('click', cancelHandler);
        saveBtn.addEventListener('click', saveHandler);
        
        // 点击背景关闭对话框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * 更新用户存储限制
     */
    async updateUserStorage(uuid, modal = null) {
        const newLimitInput = document.getElementById('new-storage-limit');
        if (!newLimitInput) {
            this.showMessage('找不到输入框', 'error');
            return;
        }

        const newLimitGB = parseInt(newLimitInput.value);
        if (!newLimitGB || newLimitGB < 1 || newLimitGB > 1000) {
            this.showMessage('请输入有效的存储限制 (1-1000 GB)', 'error');
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
                if (modal) {
                    modal.remove();
                } else {
                    const existingModal = document.querySelector('.fixed.inset-0.z-50[data-modal="storage-edit"]');
                    if (existingModal) {
                        existingModal.remove();
                    }
                }
                
                // 关闭用户管理模态框
                const userManagementModal = document.querySelector('.fixed[data-modal="user-management"]');
                if (userManagementModal) {
                    userManagementModal.remove();
                }
                
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
     * 销毁模块
     */
    destroy() {
        // 清理事件监听器
        const adminUsersBtn = document.getElementById('admin-users-btn');
        if (adminUsersBtn) {
            adminUsersBtn.removeEventListener('click', this.handleAdminUsersClick);
        }
    }
}

// 导出模块
window.UIUserManager = UIUserManager; 