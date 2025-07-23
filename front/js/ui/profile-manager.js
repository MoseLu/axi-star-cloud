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
        this.initialized = false; // 新增：用于防止重复初始化
    }

    /**
     * 初始化个人资料管理器
     */
    init() {
        
        // 防止重复初始化
        if (this.initialized) {
            return;
        }
        
        this.setupAvatarUpload();
        this.setupProfileForm();
        this.bindProfileEvents();
        
        // 延迟绑定欢迎模块事件，确保DOM已加载
        setTimeout(() => {
            this.bindWelcomeAvatarEvents();
        }, 500);
        
        this.initialized = true;
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
        // 先移除所有已存在的事件监听器，避免重复绑定
        const welcomeAvatar = document.getElementById('profile-avatar');
        if (welcomeAvatar) {
            welcomeAvatar.removeEventListener('click', this._welcomeAvatarClickHandler);
            this._welcomeAvatarClickHandler = () => {
                this.showProfileModal();
            };
            welcomeAvatar.addEventListener('click', this._welcomeAvatarClickHandler);
        }

        const editIcon = document.querySelector('.edit-icon');
        if (editIcon) {
            editIcon.removeEventListener('click', this._editIconClickHandler);
            this._editIconClickHandler = (e) => {
                e.stopPropagation();
                this.showProfileModal();
            };
            editIcon.addEventListener('click', this._editIconClickHandler);
        }

        // 绑定头像点击事件 - 排除欢迎模块的头像和编辑图标
        const avatarElements = document.querySelectorAll('[data-avatar-upload], #profile-avatar-upload');
        
        avatarElements.forEach(avatar => {
            avatar.removeEventListener('click', this._avatarUploadHandler);
            this._avatarUploadHandler = () => {
                this.triggerAvatarUpload();
            };
            avatar.addEventListener('click', this._avatarUploadHandler);
        });

        // 绑定头像文件输入事件
        const avatarFileInput = document.getElementById('avatar-file-input');
        if (avatarFileInput) {
            avatarFileInput.removeEventListener('change', this._avatarFileInputHandler);
            this._avatarFileInputHandler = (e) => {
                this.handleAvatarUpload(e);
            };
            avatarFileInput.addEventListener('change', this._avatarFileInputHandler);
        }

        // 绑定保存按钮事件
        const saveButtons = document.querySelectorAll('[data-save-profile], #save-profile-btn');
        
        saveButtons.forEach((btn, index) => {
            btn.removeEventListener('click', this._saveProfileHandler);
            this._saveProfileHandler = (e) => {
                e.preventDefault();
                this.saveProfile();
            };
            btn.addEventListener('click', this._saveProfileHandler);
        });

        // 绑定取消按钮事件
        const cancelButtons = document.querySelectorAll('.cancel-profile-btn, #cancel-profile-btn');
        
        cancelButtons.forEach((btn, index) => {
            btn.removeEventListener('click', this._cancelProfileHandler);
            this._cancelProfileHandler = (e) => {
                e.preventDefault();
                this.hideProfileModal();
            };
            btn.addEventListener('click', this._cancelProfileHandler);
        });

        // 绑定关闭按钮事件
        const closeBtn = document.getElementById('close-profile-btn');
        if (closeBtn) {
            closeBtn.removeEventListener('click', this._closeProfileHandler);
            this._closeProfileHandler = (e) => {
                e.preventDefault();
                this.hideProfileModal();
            };
            closeBtn.addEventListener('click', this._closeProfileHandler);
        }

        // 绑定编辑按钮事件
        const editButtons = document.querySelectorAll('.edit-profile-btn');
        
        editButtons.forEach((btn, index) => {
            btn.removeEventListener('click', this._editProfileHandler);
            this._editProfileHandler = (e) => {
                e.preventDefault();
                this.toggleEditMode();
            };
            btn.addEventListener('click', this._editProfileHandler);
            });
    }

    /**
     * 初始化用户个人资料
     * @param {Object} userData - 用户数据
     */
    initUserProfile(userData) {
        if (userData) {
        this.currentUser = userData;
        this.updateProfileDisplay(userData);
        }
        
        // 显示最后登录时间
        this.updateLastLogin();
    }

    /**
     * 更新个人资料显示
     * @param {Object} userData - 用户数据
     */
    updateProfileDisplay(userData) {
        if (!userData) return;

        // 更新头像
        this.updateAvatar(userData.avatar || '/static/public/docs.png');

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
        
        // 确保头像URL包含正确的路径
        let finalUrl = avatarUrl;
        if (!finalUrl || finalUrl === 'null' || finalUrl === 'undefined') {
            finalUrl = '/static/public/docs.png';
        } else if (!finalUrl.startsWith('http') && !finalUrl.startsWith('/uploads/') && finalUrl !== '/static/public/docs.png') {
            finalUrl = `/uploads/avatars/${finalUrl}`;
        }
        
        // 更新所有头像元素
        const avatarElements = document.querySelectorAll('.user-avatar, .avatar-img, #user-avatar, #profile-avatar');
        
        avatarElements.forEach(avatar => {
            if (avatar.tagName === 'IMG') {
                avatar.src = finalUrl;
                avatar.alt = '用户头像';
                avatar.classList.remove('hidden');
            } else {
                // 对于profile-avatar，需要特殊处理
                if (avatar.id === 'profile-avatar') {
                    const avatarImage = avatar.querySelector('#avatar-image');
                    const avatarIcon = avatar.querySelector('#avatar-icon');
                    if (avatarImage && avatarIcon) {
                        if (finalUrl && finalUrl !== '/static/public/docs.png') {
                            avatarImage.src = finalUrl;
                            avatarImage.classList.remove('hidden');
                            avatarIcon.classList.add('hidden');
                        } else {
                            avatarImage.classList.add('hidden');
                            avatarIcon.classList.remove('hidden');
                        }
                    }
                } else {
                    avatar.style.backgroundImage = `url(${finalUrl})`;
                }
            }
        });
        
        // 直接更新欢迎模块的头像元素
        const welcomeAvatarImage = document.getElementById('avatar-image');
        const welcomeAvatarIcon = document.getElementById('avatar-icon');
        if (welcomeAvatarImage && welcomeAvatarIcon) {
            if (finalUrl && finalUrl !== '/static/public/docs.png') {
                welcomeAvatarImage.src = finalUrl;
                welcomeAvatarImage.classList.remove('hidden');
                welcomeAvatarIcon.classList.add('hidden');
            } else {
                welcomeAvatarImage.classList.add('hidden');
                welcomeAvatarIcon.classList.remove('hidden');
            }
        }

        // 更新顶栏头像
        const topbarAvatar = document.getElementById('user-avatar');
        if (topbarAvatar) {
            topbarAvatar.src = finalUrl;
            topbarAvatar.alt = '用户头像';
            topbarAvatar.classList.remove('hidden');
        }
        
        // 同时更新个人资料弹窗中的头像
        this.updateProfileModalAvatar(finalUrl);
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
        // 如果没有提供lastLogin，从localStorage获取
        if (!lastLogin) {
            const savedLastLogin = localStorage.getItem('lastLoginTime');
            if (savedLastLogin) {
                lastLogin = savedLastLogin;
            } else {
                // 如果localStorage中也没有，使用当前时间
                lastLogin = new Date().toISOString();
            }
        }

        const formattedDate = this.formatDate(lastLogin);

        // 更新带有.last-login类的元素
        const lastLoginElements = document.querySelectorAll('.last-login');
        lastLoginElements.forEach(element => {
            element.textContent = `最后登录: ${formattedDate}`;
        });

        // 更新ID为last-login的元素（欢迎页面）
        const lastLoginById = document.getElementById('last-login');
        if (lastLoginById) {
            lastLoginById.textContent = formattedDate;
        }
    }

    /**
     * 触发头像上传
     */
    triggerAvatarUpload() {
        // 直接创建临时文件输入框，避免模态框问题
        const tempFileInput = document.createElement('input');
        tempFileInput.type = 'file';
        tempFileInput.accept = 'image/*';
        tempFileInput.style.display = 'none';
        document.body.appendChild(tempFileInput);
        
        // 监听文件选择
        tempFileInput.addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
            // 清理临时文件输入框
            document.body.removeChild(tempFileInput);
        });
        
        tempFileInput.click();
    }

    /**
     * 处理头像上传
     * @param {Event} event - 文件选择事件
     */
    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

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
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '头像上传成功',
                    type: 'success',
                    duration: 3000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('头像上传成功', 'success');
            } else if (window.showMessage) {
                window.showMessage('头像上传成功', 'success');
            }

        } catch (error) {
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '头像上传失败: ' + error.message,
                    type: 'error',
                    duration: 4000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('头像上传失败: ' + error.message, 'error');
            } else if (window.showMessage) {
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
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '请选择图片文件',
                    type: 'error',
                    duration: 3000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('请选择图片文件', 'error');
            } else if (window.showMessage) {
                window.showMessage('请选择图片文件', 'error');
            }
            return false;
        }

        // 检查文件大小
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '图片大小不能超过2MB',
                    type: 'error',
                    duration: 3000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('图片大小不能超过2MB', 'error');
            } else if (window.showMessage) {
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
            
            // 更新模态框中的头像
            const profileAvatarImage = document.getElementById('profile-avatar-image');
            const profileAvatarIcon = document.getElementById('profile-avatar-icon');
            
            if (profileAvatarImage && profileAvatarIcon) {
                profileAvatarImage.src = previewUrl;
                profileAvatarImage.classList.remove('hidden');
                profileAvatarIcon.classList.add('hidden');
            }
            
            // 更新欢迎模块的头像
            const welcomeAvatarImage = document.getElementById('avatar-image');
            const welcomeAvatarIcon = document.getElementById('avatar-icon');
            
            if (welcomeAvatarImage && welcomeAvatarIcon) {
                welcomeAvatarImage.src = previewUrl;
                welcomeAvatarImage.classList.remove('hidden');
                welcomeAvatarIcon.classList.add('hidden');
            } else {
                // 尝试通过profile-avatar查找
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) {
                    const avatarImage = profileAvatar.querySelector('#avatar-image');
                    const avatarIcon = profileAvatar.querySelector('#avatar-icon');
                    if (avatarImage && avatarIcon) {
                        avatarImage.src = previewUrl;
                        avatarImage.classList.remove('hidden');
                        avatarIcon.classList.add('hidden');
                    }
                }
            }
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

        // 获取当前用户ID - 从localStorage或当前用户数据中获取
        let userId = null;
        const userData = this.getCurrentUser();
        if (userData?.uuid) {
            userId = userData.uuid;
        } else if (userData?.id) {
            userId = userData.id;
        } else {
            // 从localStorage中获取用户ID
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    userId = parsedUser.uuid || parsedUser.id;
                } catch (e) {
                }
            }
        }

        if (!userId) {
            throw new Error('无法获取用户ID');
        }
        
        const response = await window.apiGateway.upload(`/api/profile/avatar?user_id=${userId}`, formData);

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || '上传失败';
            throw new Error(errorMessage);
        }

        const result = await response.json();
        const avatarFileName = result.avatar_url || result.avatarUrl;
        
        // 构建完整的头像URL
        if (avatarFileName) {
            return `/uploads/avatars/${avatarFileName}`;
        }
        
        return avatarFileName;
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
        
        // 验证表单
        if (!this.validateProfileForm()) {
            return;
        }

        try {
            const formData = this.getFormData();
            
            await this.updateProfile(formData);

            this.isEditing = false;
            this.hideProfileModal(); // 关闭整个模态框
            this.updateEditButtons(false);

            // 显示成功消息
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '个人资料保存成功',
                    type: 'success',
                    duration: 3000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('个人资料保存成功', 'success');
            } else if (window.showMessage) {
                window.showMessage('个人资料保存成功', 'success');
            }

        } catch (error) {
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '更新失败: ' + error.message,
                    type: 'error',
                    duration: 4000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('更新失败: ' + error.message, 'error');
            } else if (window.showMessage) {
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
        
        const formData = {};
        
        // 获取用户名
        const usernameInput = document.getElementById('profile-username-input');
        if (usernameInput) {
            formData.username = usernameInput.value.trim();
        }
        
        // 获取邮箱
        const emailInput = document.getElementById('profile-email-input');
        if (emailInput) {
            formData.email = emailInput.value.trim();
        }
        
        // 获取个人简介
        const bioInput = document.getElementById('profile-bio-input');
        if (bioInput) {
            formData.bio = bioInput.value.trim();
        }
        
        return formData;
    }

    /**
     * 设置表单数据
     * @param {Object} data - 表单数据
     */
    setFormData(data) {
        
        // 设置用户名
        const usernameInput = document.getElementById('profile-username-input');
        if (usernameInput && data.username) {
            usernameInput.value = data.username;
        }
        
        // 设置邮箱
        const emailInput = document.getElementById('profile-email-input');
        if (emailInput && data.email) {
            emailInput.value = data.email;
        }
        
        // 设置个人简介
        const bioInput = document.getElementById('profile-bio-input');
        if (bioInput && data.bio) {
            bioInput.value = data.bio;
        }
        
    }

    /**
     * 验证个人资料表单
     * @returns {boolean} 是否有效
     */
    validateProfileForm() {
        let isValid = true;

        // 验证用户名
        const usernameInput = document.getElementById('profile-username-input');
        if (usernameInput) {
            const username = usernameInput.value.trim();
            if (!username) {
                usernameInput.classList.add('error');
                isValid = false;
            } else {
                usernameInput.classList.remove('error');
            }
        }

        // 验证邮箱
        const emailInput = document.getElementById('profile-email-input');
        if (emailInput) {
            const email = emailInput.value.trim();
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    emailInput.classList.add('error');
                    isValid = false;
                } else {
                    emailInput.classList.remove('error');
                }
            } else {
                emailInput.classList.remove('error');
            }
        }

        // 验证个人简介（可选字段）
        const bioInput = document.getElementById('profile-bio-input');
        if (bioInput) {
            const bio = bioInput.value.trim();
            if (bio && bio.length > 500) {
                bioInput.classList.add('error');
                isValid = false;
            } else {
                bioInput.classList.remove('error');
            }
        }

        if (!isValid) {
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '请检查表单字段',
                    type: 'error',
                    duration: 3000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('请检查表单字段', 'error');
            } else if (window.showMessage) {
                window.showMessage('请检查表单字段', 'error');
            }
        }

        return isValid;
    }

    /**
     * 更新个人资料
     * @param {Object} profileData - 个人资料数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateProfile(profileData) {
        
        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('无法获取用户ID');
        }
        
        const response = await fetch(`/api/profile?user_id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profileData)
        });

        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '更新失败');
        }

        const result = await response.json();
        
        // 更新当前用户数据
        this.currentUser = { ...this.currentUser, ...result };
        
        // 更新显示
        this.updateProfileDisplay(this.currentUser);
        
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
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) {
            return '刚刚';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}分钟前`;
        } else if (diffInMinutes < 1440) { // 24小时
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}小时前`;
        } else {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        }
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 用户信息
     */
    getCurrentUser() {
        // 如果实例中没有用户数据，尝试从localStorage获取
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    this.currentUser = JSON.parse(savedUser);
                } catch (error) {
                    this.currentUser = null;
                }
            }
        }
        return this.currentUser;
    }

    /**
     * 检查是否为管理员
     * @returns {boolean} 是否为管理员
     */
    isAdmin() {
        const currentUser = this.getCurrentUser();
        // 只检查 isAdmin 字段
        const isAdmin = currentUser?.isAdmin === true;
        return isAdmin;
    }

    /**
     * 刷新用户信息
     */
    async refreshUserInfo() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                return;
            }
            
            const response = await fetch(`/api/profile?user_id=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const userData = result.success && result.profile ? result.profile : result;
                this.currentUser = userData;
                this.updateProfileDisplay(userData);
            }
        } catch (error) {
        }
    }

    async showProfileModal() {
        // 移除所有包含 profile-username-input 的弹窗
        document.querySelectorAll('#profile-username-input').forEach(input => {
            const modal = input.closest('.fixed, .modal, .profile-modal, [data-modal]');
            if (modal) modal.remove();
        });

        // 先获取用户数据
        let userData = null;
        
        // 优先使用本地数据
        if (this.currentUser) {
            userData = this.currentUser;
        } else {
            const cached = localStorage.getItem('user_profile');
            if (cached) {
                userData = JSON.parse(cached);
            }
        }

        // 如果本地没有数据，尝试从API获取
        if (!userData) {
            try {
                const userId = this.getCurrentUserId();
                if (userId) {
                    const response = await fetch(`/api/profile?user_id=${userId}`, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.profile) {
                            userData = result.profile;
                        }
                    }
                }
            } catch (error) {
                console.error('获取用户数据失败:', error);
            }
        }

        // 确保所有必要字段都存在
        if (userData) {
            userData.username = userData.username || '';
            userData.email = userData.email || '';
            userData.bio = userData.bio || userData.description || '';
            userData.avatar = userData.avatar || '';
        }

        // 动态创建模态框，直接使用获取到的数据填充
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'profile');
        
        // 准备头像URL
        let avatarUrl = '/static/public/docs.png';
        if (userData && userData.avatar) {
            if (!userData.avatar.startsWith('http') && !userData.avatar.startsWith('/uploads/')) {
                avatarUrl = `/uploads/avatars/${userData.avatar}`;
            } else {
                avatarUrl = userData.avatar;
            }
        }

        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-md max-h-[80vh] shadow-2xl border border-purple-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-purple-300">编辑个人资料</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" onclick="this.closest('.fixed').remove()">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <!-- 头像上传区域 -->
                    <div class="flex flex-col items-center space-y-3">
                        <div class="relative group">
                            <div class="w-20 h-20 bg-gradient-to-br from-purple-light to-blue-light rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300" id="profile-avatar-upload">
                                <i class="fa fa-user-circle text-3xl text-white" id="profile-avatar-icon" ${avatarUrl !== '/static/public/docs.png' ? 'style="display: none;"' : ''}></i>
                                <img id="profile-avatar-image" class="w-full h-full rounded-full object-cover ${avatarUrl === '/static/public/docs.png' ? 'hidden' : ''}" src="${avatarUrl}" alt="头像">
                            </div>
                            <!-- 悬停时显示的编辑遮罩 -->
                            <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <i class="fa fa-camera text-white text-sm"></i>
                            </div>
                            <!-- 点击上传按钮 -->
                            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg" id="avatar-upload-btn" title="更换头像">
                                <i class="fa fa-pencil text-white text-xs"></i>
                            </div>
                        </div>
                        <input type="file" id="avatar-file-input" class="hidden" accept="image/*">
                        <p class="text-xs text-gray-400 text-center">悬停头像或点击编辑按钮更换头像</p>
                    </div>
                    
                    <!-- 用户名输入 -->
                    <div>
                        <label for="profile-username-input" class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
                        <input type="text" id="profile-username-input" class="w-full px-3 py-2 bg-dark-light/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-light/50 focus:outline-none transition-colors text-sm" placeholder="请输入用户名" value="${userData ? (userData.username || '') : ''}">
                    </div>
                    
                    <!-- 邮箱输入 -->
                    <div>
                        <label for="profile-email-input" class="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
                        <input type="email" id="profile-email-input" class="w-full px-3 py-2 bg-dark-light/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-light/50 focus:outline-none transition-colors text-sm" placeholder="请输入邮箱" value="${userData ? (userData.email || '') : ''}">
                    </div>
                    
                    <!-- 个人简介 -->
                    <div>
                        <label for="profile-bio-input" class="block text-sm font-medium text-gray-300 mb-2">个人简介</label>
                        <textarea id="profile-bio-input" rows="3" class="w-full px-3 py-2 bg-dark-light/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-purple-light/50 focus:outline-none transition-colors resize-none text-sm" placeholder="请输入个人简介（可选）">${userData ? (userData.bio || userData.description || '') : ''}</textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-purple-light/20">
                    <button id="cancel-profile-btn" class="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                        取消
                    </button>
                    <button id="save-profile-btn" class="px-4 py-2 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg shadow-md transition-all duration-300 transform hover:scale-[1.03] text-sm">
                        <i class="fa fa-save mr-1"></i> 保存资料
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
            
        // 绑定事件
            this.bindProfileEvents();
            
        // 异步刷新最新数据（不影响用户体验）
        setTimeout(async () => {
            // 延迟更长时间，确保初始填充完成
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.loadProfileData();
        }, 100);
    }
    async loadProfileData() {
        try {
            // 从API获取最新的用户数据
            const userId = this.getCurrentUserId();
            
            if (!userId) {
                // 如果获取不到用户ID，尝试从localStorage加载数据
                this.loadProfileFromLocalStorage();
                return;
            }

            const response = await fetch(`/api/profile?user_id=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                // 正确解析API返回的数据结构
                let userData = null;
                if (result.success && result.profile) {
                    userData = result.profile;
                } else {
                    // API返回数据异常，回退到localStorage
                    this.loadProfileFromLocalStorage();
                    return;
                }
                
                // 更新当前用户数据
                this.currentUser = userData;
                
                // 检查数据是否有变化，只在有变化时才更新表单
                const currentUsername = document.getElementById('profile-username-input')?.value || '';
                const currentEmail = document.getElementById('profile-email-input')?.value || '';
                const currentBio = document.getElementById('profile-bio-input')?.value || '';
                
                const newUsername = userData.username || '';
                const newEmail = userData.email || '';
                const newBio = userData.bio || userData.description || '';
                
                // 只有当数据有实际变化且用户没有正在编辑时才更新表单
                const hasDataChanged = currentUsername !== newUsername || 
                                     currentEmail !== newEmail || 
                                     currentBio !== newBio;
                
                // 检查是否有输入框正在被编辑
                const activeElement = document.activeElement;
                const isEditing = activeElement && (
                    activeElement.id === 'profile-username-input' ||
                    activeElement.id === 'profile-email-input' ||
                    activeElement.id === 'profile-bio-input'
                );
                
                if (hasDataChanged && !isEditing) {
                this.fillProfileForm(userData);
                }
                
                // 确保模态框中的头像也更新
                setTimeout(() => {
                    if (userData.avatar) {
                        this.updateProfileModalAvatar(userData.avatar);
                    } else {
                        this.updateProfileModalAvatar(null);
                    }
                }, 100);
                
            } else {
                // API请求失败，回退到localStorage
                this.loadProfileFromLocalStorage();
            }
        } catch (error) {
            // 发生异常，回退到localStorage
            this.loadProfileFromLocalStorage();
        }
    }

    /**
     * 从localStorage加载用户数据并填充表单
     */
    loadProfileFromLocalStorage() {
        try {
            const storedUser = localStorage.getItem('userData');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                this.fillProfileForm(userData);
            }
        } catch (error) {
            console.error('从localStorage加载用户数据失败:', error);
        }
    }



    /**
     * 获取当前用户ID
     */
    getCurrentUserId() {
        
        // 从localStorage获取用户ID - 使用userData键（与ui.js一致）
        const storedUser = localStorage.getItem('userData');
        
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                
                const userId = parsedUser.uuid || parsedUser.id;
                if (userId) {
                    return userId;
                }
            } catch (e) {
            }
        }
        
        // 备用：从currentUser获取
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const parsedCurrentUser = JSON.parse(currentUser);
                
                const userId = parsedCurrentUser.uuid || parsedCurrentUser.id;
                if (userId) {
                    return userId;
                }
            } catch (e) {
            }
        }
        
        // 从当前用户数据获取
        if (this.currentUser) {
            const userId = this.currentUser.uuid || this.currentUser.id;
            if (userId) {
                return userId;
            }
        }
        
        // 尝试从URL参数获取
        const urlParams = new URLSearchParams(window.location.search);
        const userIdFromUrl = urlParams.get('user_id');
        if (userIdFromUrl) {
            return userIdFromUrl;
        }
        
        // 尝试从页面元素获取
        const userElements = document.querySelectorAll('[data-user-id]');
        if (userElements.length > 0) {
            const userIdFromElement = userElements[0].getAttribute('data-user-id');
            if (userIdFromElement) {
                return userIdFromElement;
            }
        }
        
        return null;
    }

    /**
     * 填充个人资料表单
     * @param {Object} userData - 用户数据
     */
    fillProfileForm(userData) {
        
        // 检查所有输入框是否存在
        const allInputs = document.querySelectorAll('#profile-username-input, #profile-email-input, #profile-bio-input');
        
        // 用户名
        const usernameInput = document.getElementById('profile-username-input');
        if (usernameInput) {
            usernameInput.value = userData.username || '';
        }
        
        // 邮箱
        const emailInput = document.getElementById('profile-email-input');
        if (emailInput) {
            emailInput.value = userData.email || '';
        }
        
        // 个人简介
        const bioInput = document.getElementById('profile-bio-input');
        if (bioInput) {
            bioInput.value = userData.bio || userData.description || '';
        }
        
        // 头像
        if (userData.avatar) {
            // 确保头像URL包含正确的路径
            let avatarUrl = userData.avatar;
            if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/uploads/')) {
                avatarUrl = `/uploads/avatars/${avatarUrl}`;
            }
            this.updateProfileModalAvatar(avatarUrl);
        } else {
            this.updateProfileModalAvatar(null);
        }
        
    }

    updateProfileModalAvatar(avatarUrl) {
        // 查找头像显示元素（可能在动态创建的模态框中）
        const profileAvatarImage = document.getElementById('profile-avatar-image');
        const profileAvatarIcon = document.getElementById('profile-avatar-icon');
        
        if (profileAvatarImage && profileAvatarIcon) {
            if (avatarUrl && avatarUrl !== '/static/public/docs.png' && avatarUrl !== 'null' && avatarUrl !== 'undefined') {
                // 确保头像URL包含正确的路径
                let fullAvatarUrl = avatarUrl;
                if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/uploads/')) {
                    fullAvatarUrl = `/uploads/avatars/${avatarUrl}`;
                } else if (avatarUrl.startsWith('/uploads/')) {
                    fullAvatarUrl = avatarUrl;
                }
                
                // 有头像时显示图片
                profileAvatarImage.src = fullAvatarUrl;
                profileAvatarImage.classList.remove('hidden');
                profileAvatarIcon.classList.add('hidden');
            } else {
                // 没有头像时显示默认图标
                profileAvatarImage.classList.add('hidden');
                profileAvatarIcon.classList.remove('hidden');
            }
        }
    }
    handleProfileAvatarUpload(e) {
        // 可根据实际需要补充头像上传逻辑
    }

    hideProfileModal() {
        const modal = document.querySelector('.fixed[data-modal="profile"]');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * 绑定欢迎模块头像事件
     */
    bindWelcomeAvatarEvents() {
        // 延迟绑定，确保DOM已加载
        setTimeout(() => {
            // 绑定欢迎模块头像点击事件 - 直接触发头像上传
            const welcomeAvatar = document.getElementById('profile-avatar');
            if (welcomeAvatar) {
                // 移除可能存在的旧事件监听器
                if (this.welcomeAvatarClickHandler) {
                    welcomeAvatar.removeEventListener('click', this.welcomeAvatarClickHandler);
                }
                welcomeAvatar.addEventListener('click', this.welcomeAvatarClickHandler = () => {
                    this.triggerAvatarUpload();
                });
            }

            // 绑定编辑图标点击事件 - 直接触发头像上传
            const editIcons = document.querySelectorAll('.edit-icon');
            
            editIcons.forEach((editIcon, index) => {
                // 移除可能存在的旧事件监听器
                if (this.editIconClickHandler) {
                    editIcon.removeEventListener('click', this.editIconClickHandler);
                }
                editIcon.addEventListener('click', this.editIconClickHandler = (e) => {
                    e.stopPropagation();
                    this.triggerAvatarUpload();
                });
            });
        }, 100);
    }
}

// 全局暴露
window.UIProfileManager = UIProfileManager; 