/**
 * 个人资料管理模块
 * 处理用户头像、个人资料编辑和用户信息显示功能
 */
class UIProfileManager {
    constructor() {
        this.currentUser = null;
        this.avatarUploadInput = null;
        this.profileForm = null;
        this.avatarPreview = null;
        this.isEditing = false;
        this.originalData = null;
    }

    /**
     * 初始化个人资料管理器
     */
    init() {
        this.setupAvatarUpload();
        this.setupProfileForm();
        this.bindProfileEvents();
    }

    /**
     * 设置头像上传功能
     */
    setupAvatarUpload() {
        // 创建隐藏的文件输入框
        this.avatarUploadInput = document.createElement('input');
        this.avatarUploadInput.type = 'file';
        this.avatarUploadInput.accept = 'image/*';
        this.avatarUploadInput.style.display = 'none';
        document.body.appendChild(this.avatarUploadInput);

        // 监听文件选择
        this.avatarUploadInput.addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });
    }

    /**
     * 设置个人资料表单
     */
    setupProfileForm() {
        this.profileForm = document.querySelector('#profileForm');
        if (this.profileForm) {
            this.setupFormValidation();
        }
    }

    /**
     * 绑定个人资料相关事件
     */
    bindProfileEvents() {
        // 头像点击上传
        const avatarElements = document.querySelectorAll('.user-avatar, .avatar-upload');
        avatarElements.forEach(avatar => {
            avatar.addEventListener('click', () => {
                this.triggerAvatarUpload();
            });
        });

        // 编辑按钮
        const editButtons = document.querySelectorAll('.edit-profile-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        });

        // 保存按钮
        const saveButtons = document.querySelectorAll('.save-profile-btn');
        saveButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.saveProfile();
            });
        });

        // 取消按钮
        const cancelButtons = document.querySelectorAll('.cancel-profile-btn');
        cancelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.cancelEdit();
            });
        });
    }

    /**
     * 初始化用户个人资料
     * @param {Object} userData - 用户数据
     */
    initUserProfile(userData) {
        this.currentUser = userData;
        this.updateProfileDisplay(userData);
        this.setupProfileForm();
    }

    /**
     * 更新个人资料显示
     * @param {Object} userData - 用户数据
     */
    updateProfileDisplay(userData) {
        if (!userData) return;

        // 更新头像
        this.updateAvatar(userData.avatar || '/static/public/default-avatar.png');

        // 更新用户信息
        this.updateUserInfo(userData);

        // 更新存储信息
        this.updateStorageInfo(userData.storageInfo);

        // 更新最后登录时间
        this.updateLastLogin(userData.lastLogin);
    }

    /**
     * 更新头像显示
     * @param {string} avatarUrl - 头像URL
     */
    updateAvatar(avatarUrl) {
        const avatarElements = document.querySelectorAll('.user-avatar, .avatar-img');
        avatarElements.forEach(avatar => {
            if (avatar.tagName === 'IMG') {
                avatar.src = avatarUrl;
                avatar.alt = '用户头像';
            } else {
                avatar.style.backgroundImage = `url(${avatarUrl})`;
            }
        });
    }

    /**
     * 更新用户信息显示
     * @param {Object} userData - 用户数据
     */
    updateUserInfo(userData) {
        const usernameElements = document.querySelectorAll('.username, .user-name');
        const emailElements = document.querySelectorAll('.user-email');
        const roleElements = document.querySelectorAll('.user-role');

        usernameElements.forEach(element => {
            element.textContent = userData.username || '未知用户';
        });

        emailElements.forEach(element => {
            element.textContent = userData.email || '';
        });

        roleElements.forEach(element => {
            element.textContent = this.getRoleDisplayName(userData.role);
        });
    }

    /**
     * 更新存储信息显示
     * @param {Object} storageInfo - 存储信息
     */
    updateStorageInfo(storageInfo) {
        if (!storageInfo) return;

        const usedElements = document.querySelectorAll('.storage-used');
        const totalElements = document.querySelectorAll('.storage-total');
        const percentageElements = document.querySelectorAll('.storage-percentage');
        const progressElements = document.querySelectorAll('.storage-progress');

        const usedSize = this.formatStorageSize(storageInfo.used);
        const totalSize = this.formatStorageSize(storageInfo.total);
        const percentage = Math.round((storageInfo.used / storageInfo.total) * 100);

        usedElements.forEach(element => {
            element.textContent = usedSize;
        });

        totalElements.forEach(element => {
            element.textContent = totalSize;
        });

        percentageElements.forEach(element => {
            element.textContent = `${percentage}%`;
        });

        progressElements.forEach(element => {
            element.style.width = `${percentage}%`;
            element.className = `storage-progress ${this.getStorageColorClass(percentage)}`;
        });
    }

    /**
     * 更新最后登录时间
     * @param {string} lastLogin - 最后登录时间
     */
    updateLastLogin(lastLogin) {
        if (!lastLogin) return;

        const lastLoginElements = document.querySelectorAll('.last-login');
        const formattedDate = this.formatDate(lastLogin);

        lastLoginElements.forEach(element => {
            element.textContent = `最后登录: ${formattedDate}`;
        });
    }

    /**
     * 触发头像上传
     */
    triggerAvatarUpload() {
        if (this.avatarUploadInput) {
            this.avatarUploadInput.click();
        }
    }

    /**
     * 处理头像上传
     * @param {Event} event - 文件选择事件
     */
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 验证文件类型和大小
        if (!this.validateAvatarFile(file)) {
            return;
        }

        try {
            // 显示预览
            this.showAvatarPreview(file);

            // 上传头像
            const avatarUrl = await this.uploadAvatar(file);

            // 更新显示
            this.updateAvatar(avatarUrl);

            // 显示成功消息
            if (window.showMessage) {
                window.showMessage('头像上传成功', 'success');
            }

        } catch (error) {
            console.error('头像上传失败:', error);
            if (window.showMessage) {
                window.showMessage('头像上传失败: ' + error.message, 'error');
            }
        }

        // 清空文件输入框
        event.target.value = '';
    }

    /**
     * 验证头像文件
     * @param {File} file - 文件对象
     * @returns {boolean} 是否有效
     */
    validateAvatarFile(file) {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            if (window.showMessage) {
                window.showMessage('请选择图片文件', 'error');
            }
            return false;
        }

        // 检查文件大小 (最大2MB)
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            if (window.showMessage) {
                window.showMessage('图片大小不能超过2MB', 'error');
            }
            return false;
        }

        return true;
    }

    /**
     * 显示头像预览
     * @param {File} file - 文件对象
     */
    showAvatarPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewUrl = e.target.result;
            this.updateAvatar(previewUrl);
        };
        reader.readAsDataURL(file);
    }

    /**
     * 上传头像
     * @param {File} file - 文件对象
     * @returns {Promise<string>} 头像URL
     */
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('上传失败');
        }

        const result = await response.json();
        return result.avatarUrl;
    }

    /**
     * 切换编辑模式
     */
    toggleEditMode() {
        if (this.isEditing) {
            this.saveProfile();
        } else {
            this.startEditMode();
        }
    }

    /**
     * 开始编辑模式
     */
    startEditMode() {
        this.isEditing = true;
        this.originalData = this.getFormData();

        // 显示编辑表单
        this.showEditForm();

        // 更新按钮状态
        this.updateEditButtons(true);

        // 聚焦第一个输入框
        const firstInput = this.profileForm?.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    /**
     * 保存个人资料
     */
    async saveProfile() {
        if (!this.profileForm) return;

        // 验证表单
        if (!this.validateProfileForm()) {
            return;
        }

        try {
            const formData = this.getFormData();
            await this.updateProfile(formData);

            this.isEditing = false;
            this.hideEditForm();
            this.updateEditButtons(false);

            if (window.showMessage) {
                window.showMessage('个人资料更新成功', 'success');
            }

        } catch (error) {
            console.error('更新个人资料失败:', error);
            if (window.showMessage) {
                window.showMessage('更新失败: ' + error.message, 'error');
            }
        }
    }

    /**
     * 取消编辑
     */
    cancelEdit() {
        this.isEditing = false;

        // 恢复原始数据
        if (this.originalData) {
            this.setFormData(this.originalData);
        }

        this.hideEditForm();
        this.updateEditButtons(false);
    }

    /**
     * 显示编辑表单
     */
    showEditForm() {
        const formElements = document.querySelectorAll('.profile-form, .edit-form');
        formElements.forEach(form => {
            form.style.display = 'block';
        });

        const viewElements = document.querySelectorAll('.profile-view, .view-mode');
        viewElements.forEach(view => {
            view.style.display = 'none';
        });
    }

    /**
     * 隐藏编辑表单
     */
    hideEditForm() {
        const formElements = document.querySelectorAll('.profile-form, .edit-form');
        formElements.forEach(form => {
            form.style.display = 'none';
        });

        const viewElements = document.querySelectorAll('.profile-view, .view-mode');
        viewElements.forEach(view => {
            view.style.display = 'block';
        });
    }

    /**
     * 更新编辑按钮状态
     * @param {boolean} isEditing - 是否处于编辑模式
     */
    updateEditButtons(isEditing) {
        const editButtons = document.querySelectorAll('.edit-profile-btn');
        const saveButtons = document.querySelectorAll('.save-profile-btn');
        const cancelButtons = document.querySelectorAll('.cancel-profile-btn');

        editButtons.forEach(btn => {
            btn.style.display = isEditing ? 'none' : 'inline-block';
        });

        saveButtons.forEach(btn => {
            btn.style.display = isEditing ? 'inline-block' : 'none';
        });

        cancelButtons.forEach(btn => {
            btn.style.display = isEditing ? 'inline-block' : 'none';
        });
    }

    /**
     * 获取表单数据
     * @returns {Object} 表单数据
     */
    getFormData() {
        if (!this.profileForm) return {};

        const formData = {};
        const inputs = this.profileForm.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value;
            }
        });

        return formData;
    }

    /**
     * 设置表单数据
     * @param {Object} data - 表单数据
     */
    setFormData(data) {
        if (!this.profileForm) return;

        Object.keys(data).forEach(key => {
            const input = this.profileForm.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key];
            }
        });
    }

    /**
     * 验证个人资料表单
     * @returns {boolean} 是否有效
     */
    validateProfileForm() {
        if (!this.profileForm) return true;

        const requiredFields = this.profileForm.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });

        // 验证邮箱格式
        const emailField = this.profileForm.querySelector('input[type="email"]');
        if (emailField && emailField.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailField.value)) {
                emailField.classList.add('error');
                isValid = false;
            }
        }

        if (!isValid && window.showMessage) {
            window.showMessage('请填写所有必填字段', 'error');
        }

        return isValid;
    }

    /**
     * 更新个人资料
     * @param {Object} profileData - 个人资料数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateProfile(profileData) {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error('更新失败');
        }

        const result = await response.json();
        this.currentUser = { ...this.currentUser, ...result };
        return result;
    }

    /**
     * 设置表单验证
     */
    setupFormValidation() {
        if (!this.profileForm) return;

        const inputs = this.profileForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateField(input);
                }
            });
        });
    }

    /**
     * 验证单个字段
     * @param {HTMLElement} field - 字段元素
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        // 必填字段验证
        if (field.hasAttribute('required') && !value) {
            isValid = false;
        }

        // 邮箱格式验证
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
            }
        }

        // 长度验证
        if (field.hasAttribute('minlength')) {
            const minLength = parseInt(field.getAttribute('minlength'));
            if (value.length < minLength) {
                isValid = false;
            }
        }

        if (field.hasAttribute('maxlength')) {
            const maxLength = parseInt(field.getAttribute('maxlength'));
            if (value.length > maxLength) {
                isValid = false;
            }
        }

        if (isValid) {
            field.classList.remove('error');
        } else {
            field.classList.add('error');
        }
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
     * 获取存储颜色类
     * @param {number} percentage - 使用百分比
     * @returns {string} 颜色类名
     */
    getStorageColorClass(percentage) {
        if (percentage >= 90) return 'storage-danger';
        if (percentage >= 70) return 'storage-warning';
        return 'storage-normal';
    }

    /**
     * 格式化日期
     * @param {string} dateString - 日期字符串
     * @returns {string} 格式化的日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 用户信息
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 检查是否为管理员
     * @returns {boolean} 是否为管理员
     */
    isAdmin() {
        return this.currentUser?.role === 'admin';
    }

    /**
     * 刷新用户信息
     */
    async refreshUserInfo() {
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData;
                this.updateProfileDisplay(userData);
            }
        } catch (error) {
            console.error('刷新用户信息失败:', error);
        }
    }
}

// 全局暴露
window.UIProfileManager = UIProfileManager; 