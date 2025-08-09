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
        
        // 初始化时清理可能存在的错误缓存
        this.cleanupCorruptedAvatarCache();

        
        this.setupAvatarUpload();
        this.setupProfileForm();
        this.bindProfileEvents();
        
        // 延迟绑定欢迎模块事件，确保DOM已加载
        setTimeout(() => {
            this.bindWelcomeAvatarEvents();
        }, 500);
        
        // 延迟绑定模态框事件，确保所有模态框相关的事件都能正确绑定
        setTimeout(() => {
            this.bindModalEvents();
        }, 1000);
        
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
     * 绑定模态框特定事件（避免重复绑定全局事件）
     */
    bindModalEvents() {
        
        // 绑定模态框内的保存按钮事件
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            // 移除旧的事件监听器
            saveBtn.removeEventListener('click', this._modalSaveProfileHandler);
            this._modalSaveProfileHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveProfile();
            };
            saveBtn.addEventListener('click', this._modalSaveProfileHandler);
        }

        // 绑定模态框内的取消按钮事件
        const cancelBtn = document.getElementById('cancel-profile-btn');
        if (cancelBtn) {
            // 移除旧的事件监听器
            cancelBtn.removeEventListener('click', this._modalCancelProfileHandler);
            this._modalCancelProfileHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideProfileModal();
            };
            cancelBtn.addEventListener('click', this._modalCancelProfileHandler);
        }

        // 绑定模态框内的关闭按钮事件
        const closeBtn = document.getElementById('close-profile-btn');
        if (closeBtn) {
            // 移除旧的事件监听器
            closeBtn.removeEventListener('click', this._modalCloseProfileHandler);
            this._modalCloseProfileHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideProfileModal();
            };
            closeBtn.addEventListener('click', this._modalCloseProfileHandler);
        }

        // 绑定模态框内的头像上传事件
        const avatarFileInput = document.getElementById('avatar-file-input');
        if (avatarFileInput) {
            // 移除旧的事件监听器
            avatarFileInput.removeEventListener('change', this._modalAvatarFileInputHandler);
            this._modalAvatarFileInputHandler = (e) => {
                this.handleAvatarUpload(e);
            };
            avatarFileInput.addEventListener('change', this._modalAvatarFileInputHandler);
        }

        // 绑定模态框内的头像上传按钮事件
        const avatarUploadBtn = document.getElementById('avatar-upload-btn');
        if (avatarUploadBtn) {
            // 移除旧的事件监听器
            avatarUploadBtn.removeEventListener('click', this._modalAvatarUploadBtnHandler);
            this._modalAvatarUploadBtnHandler = (e) => {
                e.stopPropagation();
                this.triggerAvatarUpload();
            };
            avatarUploadBtn.addEventListener('click', this._modalAvatarUploadBtnHandler);
        }

        // 绑定模态框内的头像预览事件
        const profileAvatarPreview = document.getElementById('profile-avatar-preview');
        if (profileAvatarPreview) {
            // 移除旧的事件监听器
            profileAvatarPreview.removeEventListener('click', this._modalAvatarPreviewHandler);
            this._modalAvatarPreviewHandler = (e) => {
                // 如果点击的是编辑按钮，不触发预览
                if (e.target.closest('#avatar-upload-btn')) {
                    return;
                }
                this.showAvatarPreviewModal();
            };
            profileAvatarPreview.addEventListener('click', this._modalAvatarPreviewHandler);
        }

        // 绑定模态框背景点击关闭事件
        const modal = document.querySelector('.fixed[data-modal="profile"]');
        if (modal) {
            // 移除旧的事件监听器
            modal.removeEventListener('click', this._modalBackgroundClickHandler);
            this._modalBackgroundClickHandler = (e) => {
                if (e.target === modal) {
                    this.hideProfileModal();
                }
            };
            modal.addEventListener('click', this._modalBackgroundClickHandler);
        }

        // 绑定ESC键关闭事件
        this._escHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideProfileModal();
                document.removeEventListener('keydown', this._escHandler);
            }
        };
        document.addEventListener('keydown', this._escHandler);
    }

    /**
     * 绑定个人资料相关事件
     */
    bindProfileEvents() {
        // 注意：欢迎模块的头像和编辑图标事件由 bindWelcomeAvatarEvents 方法单独处理
        // 这里只处理其他个人资料相关事件，避免冲突
        
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
        // 检查新的存储管理器中的用户数据
        let currentUser = null;
        if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
            currentUser = window.StorageManager.getUser();
        } else {
            // 如果 StorageManager 未加载，直接使用新的键结构
            const userData = localStorage.getItem('userInfo');
            if (userData) {
                try {
                    currentUser = JSON.parse(userData);
                } catch (error) {
                    console.warn('解析用户信息失败:', error);
                }
            }
        }
        
        if (userData) {
            this.currentUser = userData;
            // 页面刷新时，只恢复缓存的头像，不重新构建URL
            this.updateProfileDisplayFromCache(userData);
        } else if (currentUser) {
            try {
                this.currentUser = currentUser;
                
                // 优先从缓存恢复头像信息（缓存的是完整URL，但我们需要原始文件名）
                let cachedAvatar = null;
                if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                    cachedAvatar = window.StorageManager.getAvatar();
                } else {
                    // 如果 StorageManager 未加载，使用 localStorage 作为备用
                    cachedAvatar = localStorage.getItem('cachedAvatar');
                }
                if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
                    // 从完整URL中提取文件名
                    const avatarFileName = cachedAvatar.split('/').pop();
                    if (avatarFileName && avatarFileName !== 'null' && avatarFileName !== 'undefined') {
                        currentUser.avatarUrl = cachedAvatar; // 存储完整的URL
                    }
                }
                
                // 页面刷新时，只恢复缓存的头像，不重新构建URL
                this.updateProfileDisplayFromCache(currentUser);
            } catch (error) {
                console.error('🖼️ 解析存储管理器用户数据失败:', error);
            }
        }
        
        // 显示最后登录时间
        this.updateLastLogin();
    }

    /**
     * 更新个人资料显示（从缓存恢复，不重新构建URL）
     * @param {Object} userData - 用户数据
     */
    updateProfileDisplayFromCache(userData) {
        if (!userData) {
            return;
        }

        // 更新用户信息
        this.updateUserInfo(userData);

        // 更新存储信息
        this.updateStorageInfo(userData.storageInfo);

        // 更新最后登录时间
        this.updateLastLogin(userData.lastLogin);
        
        // 只使用本地缓存，不重新构建URL
        this.updateAvatarFromCacheOnly(userData.avatarUrl);
        
        // 延迟确保头像显示稳定
        setTimeout(() => {
            this.ensureAvatarDisplayStability();
        }, 50);
    }
    
    /**
     * 确保头像显示稳定
     */
    ensureAvatarDisplayStability() {
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
            
            if (avatarUrl && avatarUrl !== 'null' && avatarUrl !== 'undefined' && !avatarUrl.includes('docs.png')) {
                // 确保所有头像元素正确显示
                const avatarElements = [
                    document.getElementById('user-avatar'),
                    document.getElementById('avatar-image'),
                    document.getElementById('avatar-icon')
                ];
                
                avatarElements.forEach(element => {
                    if (element) {
                        element.src = avatarUrl;
                        element.style.display = 'block';
                        element.style.visibility = 'visible';
                        element.style.opacity = '1';
                        element.classList.remove('hidden');
                    }
                });
            }
        } catch (error) {
            console.error('确保头像显示稳定失败:', error);
        }
    }

    /**
     * 更新个人资料显示
     * @param {Object} userData - 用户数据
     */
    updateProfileDisplay(userData) {
        if (!userData) {
            return;
        }
        // 更新头像显示
        if (userData.avatarUrl) {
            this.updateAvatarFromCacheOnly(userData.avatarUrl);
        }
        
        // 更新其他个人资料信息
        this.updateUserInfo(userData);
    }

    /**
     * 从缓存更新头像显示
     * @param {string} avatarUrl - 头像URL
     */
    updateAvatarFromCacheOnly(avatarUrl) {
        // 优先从新的存储管理器获取头像
        let cachedAvatar = null;
        if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
            cachedAvatar = window.StorageManager.getAvatar();
        }
        
        let finalAvatarUrl = null;
        
        if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined') {
            finalAvatarUrl = cachedAvatar;
        } else if (avatarUrl && avatarUrl !== 'null' && avatarUrl !== 'undefined') {
            finalAvatarUrl = avatarUrl;
        }
        
        // 如果URL已经是完整URL，直接使用，不需要再次构建
        if (finalAvatarUrl && (finalAvatarUrl.startsWith('http://') || finalAvatarUrl.startsWith('https://'))) {
            this.updateAvatar(finalAvatarUrl);
        } else if (finalAvatarUrl) {
            // 如果是相对路径，需要构建完整URL
            const fullUrl = this.buildFullAvatarUrl(finalAvatarUrl);
            this.updateAvatar(fullUrl);
        }
    }

    /**
     * 更新头像显示
     * @param {string} avatarUrl - 头像URL
     */
    updateAvatar(avatarUrl) {
        // 确保头像URL包含正确的路径
        let finalUrl = avatarUrl;
        let hasValidAvatar = true;
        
        if (!finalUrl || finalUrl === 'null' || finalUrl === 'undefined') {
            hasValidAvatar = false;
        } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/static/') && finalUrl !== '/static/public/docs.png') {
            // 不构建URL，避免localhost错误
            hasValidAvatar = false;
        }
        
        // 只有在有有效头像时才缓存，避免缓存无效头像
        if (hasValidAvatar && avatarUrl && avatarUrl !== 'null' && avatarUrl !== 'undefined' && avatarUrl !== '/static/public/docs.png') {
            // 延迟缓存，等待头像加载成功后再缓存
            const cacheAvatarOnSuccess = () => {
                // 缓存完整的URL，而不是原始文件名
                if (window.StorageManager && typeof window.StorageManager.setAvatar === 'function') {
                    window.StorageManager.setAvatar(finalUrl);
                } else {
                    // 如果 StorageManager 未加载，直接更新 userInfo 中的头像URL
                    const userData = localStorage.getItem('userInfo');
                    if (userData) {
                        try {
                            const userInfo = JSON.parse(userData);
                            userInfo.avatarUrl = finalUrl;
                            localStorage.setItem('userInfo', JSON.stringify(userInfo));
                        } catch (error) {
                            console.warn('更新头像URL失败:', error);
                        }
                    }
                }
                
                // 同时更新用户数据中的头像信息
                let userData = null;
                if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
                    userData = window.StorageManager.getUser();
                } else {
                    const userDataStr = localStorage.getItem('userInfo');
                    if (userDataStr) {
                        try {
                            userData = JSON.parse(userDataStr);
                        } catch (error) {
                            console.error('🖼️ 解析用户数据失败:', error);
                        }
                    }
                }
                
                if (userData) {
                    try {
                        userData.avatarUrl = avatarUrl; // 保存头像URL
                        if (window.StorageManager && typeof window.StorageManager.setUser === 'function') {
                            window.StorageManager.setUser(userData);
                        } else {
                            // 如果 StorageManager 未加载，直接使用新的键结构
                            localStorage.setItem('userInfo', JSON.stringify(userData));
                        }
                    } catch (error) {
                        console.error('🖼️ 更新用户数据失败:', error);
                    }
                }
            };
            
            // 将缓存函数保存到实例中，供onload事件调用
            this.cacheAvatarOnSuccess = cacheAvatarOnSuccess;
        }
        
        // 先显示loading状态，避免闪烁
        this.showAvatarLoading();
        
        // 更新所有头像元素
        const avatarElements = document.querySelectorAll('.user-avatar, .avatar-img, #user-avatar, #profile-avatar');
        
        avatarElements.forEach((avatar, index) => {
            if (avatar.tagName === 'IMG') {
                if (hasValidAvatar) {
                    // 设置加载事件
                    avatar.onload = () => {
                        this.hideAvatarLoading();
                        // 头像加载成功时缓存
                        if (this.cacheAvatarOnSuccess) {
                            this.cacheAvatarOnSuccess();
                        }
                    };
                    avatar.onerror = () => {
                        // 加载失败时隐藏头像，显示默认图标
                        avatar.style.display = 'none';
                        this.hideAvatarLoading();
                    };
                    avatar.src = finalUrl;
                    avatar.alt = '用户头像';
                    avatar.classList.remove('hidden');
                    // 强制设置样式确保显示
                    avatar.style.display = 'block';
                    avatar.style.visibility = 'visible';
                    avatar.style.opacity = '1';
                } else {
                    // 没有有效头像时隐藏图片元素，不设置src避免请求
                    avatar.style.display = 'none';
                    avatar.src = ''; // 清空src避免请求
                    this.hideAvatarLoading();
                }
            } else {
                // 对于profile-avatar，需要特殊处理
                if (avatar.id === 'profile-avatar') {
                    const avatarImage = avatar.querySelector('#avatar-image');
                    const avatarIcon = avatar.querySelector('#avatar-icon');
                    if (avatarImage && avatarIcon) {
                        if (hasValidAvatar) {
                            // 设置加载事件
                            avatarImage.onload = () => {
                                this.hideAvatarLoading();
                                // 头像加载成功时缓存
                                if (this.cacheAvatarOnSuccess) {
                                    this.cacheAvatarOnSuccess();
                                }
                            };
                            avatarImage.onerror = () => {
                                // 加载失败时显示默认图标
                                avatarImage.classList.add('hidden');
                                avatarIcon.classList.remove('hidden');
                                avatarImage.style.display = 'none';
                                avatarIcon.style.display = 'block';
                                this.hideAvatarLoading();
                            };
                            avatarImage.src = finalUrl;
                            avatarImage.classList.remove('hidden');
                            avatarIcon.classList.add('hidden');
                            // 强制设置样式确保显示
                            avatarImage.style.display = 'block';
                            avatarImage.style.visibility = 'visible';
                            avatarImage.style.opacity = '1';
                            avatarIcon.style.display = 'none';
                        } else {
                            // 没有有效头像时显示默认图标，不设置src避免请求
                            avatarImage.classList.add('hidden');
                            avatarIcon.classList.remove('hidden');
                            avatarImage.style.display = 'none';
                            avatarIcon.style.display = 'block';
                            avatarImage.src = ''; // 清空src避免请求
                            this.hideAvatarLoading();
                        }
                    }
                } else {
                    if (hasValidAvatar) {
                        avatar.style.backgroundImage = `url(${finalUrl})`;
                    }
                    this.hideAvatarLoading();
                }
            }
        });
        
        // 直接更新欢迎模块的头像元素
        const welcomeAvatarImage = document.getElementById('avatar-image');
        const welcomeAvatarIcon = document.getElementById('avatar-icon');
        if (welcomeAvatarImage && welcomeAvatarIcon) {
            if (hasValidAvatar) {
                // 设置加载事件
                welcomeAvatarImage.onload = () => {
                    this.hideAvatarLoading();
                    // 头像加载成功时缓存
                    if (this.cacheAvatarOnSuccess) {
                        this.cacheAvatarOnSuccess();
                    }
                };
                welcomeAvatarImage.onerror = () => {
                    // 加载失败时显示默认图标
                    welcomeAvatarImage.classList.add('hidden');
                    welcomeAvatarIcon.classList.remove('hidden');
                    welcomeAvatarImage.style.display = 'none';
                    welcomeAvatarIcon.style.display = 'block';
                    this.hideAvatarLoading();
                };
                welcomeAvatarImage.src = finalUrl;
                welcomeAvatarImage.classList.remove('hidden');
                welcomeAvatarIcon.classList.add('hidden');
                // 强制设置样式确保显示
                welcomeAvatarImage.style.display = 'block';
                welcomeAvatarImage.style.visibility = 'visible';
                welcomeAvatarImage.style.opacity = '1';
                welcomeAvatarIcon.style.display = 'none';
            } else {
                // 没有有效头像时显示默认图标，不设置src避免请求
                welcomeAvatarImage.classList.add('hidden');
                welcomeAvatarIcon.classList.remove('hidden');
                welcomeAvatarImage.style.display = 'none';
                welcomeAvatarIcon.style.display = 'block';
                welcomeAvatarImage.src = ''; // 清空src避免请求
                this.hideAvatarLoading();
            }
        } else {
            // 备用方案：通过profile-avatar容器查找
            const profileAvatar = document.getElementById('profile-avatar');
            if (profileAvatar) {
                const avatarImage = profileAvatar.querySelector('#avatar-image');
                const avatarIcon = profileAvatar.querySelector('#avatar-icon');
                if (avatarImage && avatarIcon) {
                    if (hasValidAvatar) {
                        // 设置加载事件
                        avatarImage.onload = () => {
                            this.hideAvatarLoading();
                            // 头像加载成功时缓存
                            if (this.cacheAvatarOnSuccess) {
                                this.cacheAvatarOnSuccess();
                            }
                        };
                        avatarImage.onerror = () => {
                            // 加载失败时显示默认图标
                            avatarImage.classList.add('hidden');
                            avatarIcon.classList.remove('hidden');
                            avatarImage.style.display = 'none';
                            avatarIcon.style.display = 'block';
                            this.hideAvatarLoading();
                        };
                        avatarImage.src = finalUrl;
                        avatarImage.classList.remove('hidden');
                        avatarIcon.classList.add('hidden');
                        // 强制设置样式确保显示
                        avatarImage.style.display = 'block';
                        avatarImage.style.visibility = 'visible';
                        avatarImage.style.opacity = '1';
                        avatarIcon.style.display = 'none';
                    } else {
                        // 没有有效头像时显示默认图标，不设置src避免请求
                        avatarImage.classList.add('hidden');
                        avatarIcon.classList.remove('hidden');
                        avatarImage.style.display = 'none';
                        avatarIcon.style.display = 'block';
                        avatarImage.src = ''; // 清空src避免请求
                        this.hideAvatarLoading();
                    }
                }
            }
        }

        // 更新顶栏头像
        const topbarAvatar = document.getElementById('user-avatar');
        if (topbarAvatar) {
            if (hasValidAvatar) {
                // 设置加载事件
                topbarAvatar.onload = () => {
                    this.hideAvatarLoading();
                    // 头像加载成功时缓存
                    if (this.cacheAvatarOnSuccess) {
                        this.cacheAvatarOnSuccess();
                    }
                };
                topbarAvatar.onerror = () => {
                    // 加载失败时隐藏头像
                    topbarAvatar.style.display = 'none';
                    this.hideAvatarLoading();
                };
                topbarAvatar.src = finalUrl;
                topbarAvatar.alt = '用户头像';
                topbarAvatar.classList.remove('hidden');
                // 强制设置样式确保显示
                topbarAvatar.style.display = 'block';
                topbarAvatar.style.visibility = 'visible';
                topbarAvatar.style.opacity = '1';
            } else {
                // 没有有效头像时隐藏图片元素，不设置src避免请求
                topbarAvatar.style.display = 'none';
                topbarAvatar.src = ''; // 清空src避免请求
                this.hideAvatarLoading();
            }
        }
        
        // 同时更新个人资料弹窗中的头像
        this.updateProfileModalAvatar(finalUrl);
    }
    
    /**
     * 显示头像加载状态
     */
    showAvatarLoading() {
        // 为头像元素添加loading样式
        const avatarElements = document.querySelectorAll('#avatar-image, #user-avatar');
        avatarElements.forEach(element => {
            element.style.opacity = '0.5';
            element.style.transition = 'opacity 0.3s ease';
        });
    }
    
    /**
     * 隐藏头像加载状态
     */
    hideAvatarLoading() {
        // 移除loading样式
        const avatarElements = document.querySelectorAll('#avatar-image, #user-avatar');
        avatarElements.forEach(element => {
            element.style.opacity = '1';
        });
    }

    /**
     * 清理已损坏的头像缓存
     */
    cleanupCorruptedAvatarCache() {
        try {
            // 清理localStorage中的错误缓存
            const cachedAvatar = localStorage.getItem('cachedAvatar');
            if (cachedAvatar && (
                cachedAvatar.includes('/uploads/avatars//uploads/avatars/') ||
                cachedAvatar.includes('//uploads/avatars/') ||
                cachedAvatar.includes('///') ||
                cachedAvatar === 'null' ||
                cachedAvatar === 'undefined'
            )) {
                localStorage.removeItem('cachedAvatar');
            }
            
            // 清理StorageManager中的错误缓存
            if (window.StorageManager && typeof window.StorageManager.getAvatar === 'function') {
                const storedAvatar = window.StorageManager.getAvatar();
                if (storedAvatar && (
                    storedAvatar.includes('/uploads/avatars//uploads/avatars/') ||
                    storedAvatar.includes('//uploads/avatars/') ||
                    storedAvatar.includes('///') ||
                    storedAvatar === 'null' ||
                    storedAvatar === 'undefined'
                )) {
                    window.StorageManager.setAvatar(null);
                }
            }
            
            // 清理userInfo中的错误avatarUrl
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                try {
                    const userData = JSON.parse(userInfo);
                    if (userData.avatarUrl && (
                        userData.avatarUrl.includes('/uploads/avatars//uploads/avatars/') ||
                        userData.avatarUrl.includes('//uploads/avatars/') ||
                        userData.avatarUrl.includes('///') ||
                        userData.avatarUrl === 'null' ||
                        userData.avatarUrl === 'undefined'
                    )) {
                        // 尝试从错误URL中提取正确的文件名
                        let cleanFileName = userData.avatarUrl;
                        if (cleanFileName.includes('/uploads/avatars/')) {
                            cleanFileName = cleanFileName.split('/uploads/avatars/').pop();
                        }
                        userData.avatarUrl = cleanFileName;
                        localStorage.setItem('userInfo', JSON.stringify(userData));
                    }
                } catch (error) {
                    console.warn('清理userInfo头像URL失败:', error);
                }
            }
        } catch (error) {
            console.warn('清理头像缓存失败:', error);
        }
    }

    /**
     * 强制刷新头像显示 - 防止被其他模块覆盖
     * @param {string} avatarUrl - 头像URL（应该是完整URL）
     */
    forceRefreshAvatarDisplay(avatarUrl) {
        if (!avatarUrl || avatarUrl === 'null' || avatarUrl === 'undefined') {
            return;
        }

        // 清理可能重复的路径和URL
        let cleanUrl = avatarUrl;
        
        // 清理重复的路径
        while (cleanUrl.includes('/uploads/avatars//uploads/avatars/')) {
            cleanUrl = cleanUrl.replace('/uploads/avatars//uploads/avatars/', '/uploads/avatars/');
        }
        
        // 清理重复的域名
        while (cleanUrl.includes('//uploads/avatars/')) {
            cleanUrl = cleanUrl.replace('//uploads/avatars/', '/uploads/avatars/');
        }
        
        // 清理可能的三重斜杠
        while (cleanUrl.includes('///')) {
            cleanUrl = cleanUrl.replace('///', '/');
        }

        // 强制更新顶栏头像
        const topbarAvatar = document.getElementById('user-avatar');
        if (topbarAvatar) {
            topbarAvatar.src = cleanUrl;
            topbarAvatar.style.display = 'block';
            topbarAvatar.style.visibility = 'visible';
            topbarAvatar.style.opacity = '1';
            topbarAvatar.classList.remove('hidden');
        }

        // 强制更新欢迎页面头像
        const welcomeAvatarImage = document.getElementById('avatar-image');
        const welcomeAvatarIcon = document.getElementById('avatar-icon');
        if (welcomeAvatarImage && welcomeAvatarIcon) {
            welcomeAvatarImage.src = cleanUrl;
            welcomeAvatarImage.classList.remove('hidden');
            welcomeAvatarIcon.classList.add('hidden');
            welcomeAvatarImage.style.display = 'block';
            welcomeAvatarImage.style.visibility = 'visible';
            welcomeAvatarImage.style.opacity = '1';
            welcomeAvatarIcon.style.display = 'none';
        }

        // 强制更新profile-avatar容器中的头像
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            const avatarImage = profileAvatar.querySelector('#avatar-image');
            const avatarIcon = profileAvatar.querySelector('#avatar-icon');
            if (avatarImage && avatarIcon) {
                avatarImage.src = cleanUrl;
                avatarImage.classList.remove('hidden');
                avatarIcon.classList.add('hidden');
                avatarImage.style.display = 'block';
                avatarImage.style.visibility = 'visible';
                avatarImage.style.opacity = '1';
                avatarIcon.style.display = 'none';
            }
        }

        // 强制更新所有可能的头像元素
        const allAvatarElements = document.querySelectorAll('.user-avatar, .avatar-img, img[alt*="头像"], img[alt*="avatar"]');
        allAvatarElements.forEach(element => {
            if (element.tagName === 'IMG') {
                element.src = cleanUrl;
                element.style.display = 'block';
                element.style.visibility = 'visible';
                element.style.opacity = '1';
                element.classList.remove('hidden');
            }
        });

        // 更新缓存，确保下次加载时使用最新头像
        if (window.StorageManager && typeof window.StorageManager.setAvatar === 'function') {
            window.StorageManager.setAvatar(cleanUrl);
        } else {
            localStorage.setItem('cachedAvatar', cleanUrl);
        }

        // 同步更新用户信息中的头像URL - 只保存文件名
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const userData = JSON.parse(userInfo);
                // 从完整URL中提取文件名
                let fileName = cleanUrl;
                if (fileName.includes('/uploads/avatars/')) {
                    fileName = fileName.split('/uploads/avatars/').pop();
                }
                userData.avatarUrl = fileName;
                localStorage.setItem('userInfo', JSON.stringify(userData));
            } catch (error) {
                console.warn('更新用户信息中的头像URL失败:', error);
            }
        }
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

            // 立即更新显示 - 确保所有UI元素都被更新
            this.updateAvatar(avatarUrl);

            // 强制刷新所有头像相关的UI元素，防止被其他模块覆盖
            setTimeout(() => {
                this.forceRefreshAvatarDisplay(avatarUrl);
            }, 100);

            // 再次延迟确保更新生效
            setTimeout(() => {
                this.forceRefreshAvatarDisplay(avatarUrl);
            }, 500);

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
                profileAvatarImage.style.display = 'block';
                profileAvatarIcon.style.display = 'none';
            }
            
            // 更新欢迎模块的头像
            const welcomeAvatarImage = document.getElementById('avatar-image');
            const welcomeAvatarIcon = document.getElementById('avatar-icon');
            
            if (welcomeAvatarImage && welcomeAvatarIcon) {
                welcomeAvatarImage.src = previewUrl;
                welcomeAvatarImage.classList.remove('hidden');
                welcomeAvatarIcon.classList.add('hidden');
                welcomeAvatarImage.style.display = 'block';
                welcomeAvatarIcon.style.display = 'none';
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
                        avatarImage.style.display = 'block';
                        avatarIcon.style.display = 'none';
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

        // 获取当前用户ID - 使用多种可靠的方式
        let userId = null;
        
        // 方式1: 从API系统获取（最可靠）
        if (window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
            userId = window.apiSystem.getCurrentUserId();
        }
        
        // 方式2: 从localStorage获取userInfo（与登录系统一致）
        if (!userId) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    userId = user.uuid || user.id;
                } catch (e) {
                    console.warn('解析userInfo失败:', e);
                }
            }
        }
        
        // 方式3: 从认证系统获取
        if (!userId && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
            const currentUser = window.authSystem.getCurrentUser();
            userId = currentUser?.uuid || currentUser?.id;
        }
        
        // 方式4: 从当前用户数据获取
        if (!userId) {
            const userData = this.getCurrentUser();
            if (userData?.uuid) {
                userId = userData.uuid;
            } else if (userData?.id) {
                userId = userData.id;
            }
        }
        
        // 方式5: 从localStorage获取currentUser（兼容旧版本）
        if (!userId) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    userId = parsedUser.uuid || parsedUser.id;
                } catch (e) {
                    console.warn('解析currentUser失败:', e);
                }
            }
        }

        if (!userId) {
            console.error('无法获取用户ID，尝试的所有方式都失败了');
            throw new Error('无法获取用户ID');
        }

        const response = await window.apiGateway.upload(`/api/profile/avatar?user_id=${userId}`, formData);

        if (!response.ok) {
            let errorMessage = '上传失败';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                console.error('解析错误响应失败:', e);
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            console.error('头像上传失败详情:', {
                status: response.status,
                statusText: response.statusText,
                errorMessage: errorMessage
            });
            throw new Error(errorMessage);
        }

        const result = await response.json();
        const avatarFileName = result.avatar_url || result.avatarUrl;
        
        // 构建完整的头像URL并更新缓存
        if (avatarFileName) {
            let fullAvatarUrl;
            let cleanFileName;
            
            // 检查后端返回的是什么格式
            if (avatarFileName.startsWith('http://') || avatarFileName.startsWith('https://')) {
                // 如果后端返回完整URL，直接使用
                fullAvatarUrl = avatarFileName;
                // 从URL中提取文件名
                cleanFileName = avatarFileName.split('/').pop();
            } else if (avatarFileName.startsWith('/uploads/avatars/')) {
                // 如果后端返回相对路径，构建完整URL
                cleanFileName = avatarFileName.replace('/uploads/avatars/', '');
                fullAvatarUrl = window.apiGateway?.buildUrl(avatarFileName) || avatarFileName;
            } else {
                // 如果后端只返回文件名，构建完整URL
                cleanFileName = avatarFileName;
                fullAvatarUrl = window.apiGateway?.buildUrl('/uploads/avatars/' + cleanFileName) || ('/uploads/avatars/' + cleanFileName);
            }
            
            // 清理已经错误的缓存
            this.cleanupCorruptedAvatarCache();
            
            // 更新缓存 - 缓存完整URL
            if (window.StorageManager && typeof window.StorageManager.setAvatar === 'function') {
                window.StorageManager.setAvatar(fullAvatarUrl);
            } else {
                localStorage.setItem('cachedAvatar', fullAvatarUrl);
            }
            
            // 更新用户数据 - 只保存文件名
            const userDataStr = localStorage.getItem('userInfo');
            if (userDataStr) {
                try {
                    const userData = JSON.parse(userDataStr);
                    userData.avatarUrl = cleanFileName; // 只保存文件名
                    localStorage.setItem('userInfo', JSON.stringify(userData));
                } catch (error) {
                    console.error('更新用户数据失败:', error);
                }
            }
            
            return fullAvatarUrl;
        }
        
        return avatarFileName;
    }

    /**
     * 切换编辑模式
     */
    toggleEditMode() {
        if (this.isEditing) {
            // 如果正在保存中，不重复调用
            if (!this._isSavingProfile) {
                this.saveProfile();
            }
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
        // 防重复提交
        if (this._isSavingProfile) {
            return;
        }
        this._isSavingProfile = true;
        
        // 验证表单
        if (!this.validateProfileForm()) {
            this._isSavingProfile = false;
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
        } finally {
            this._isSavingProfile = false;
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
        
        try {
            const response = await window.apiGateway.put(`/api/profile?user_id=${userId}`, profileData);

            if (!response.ok) {
                let errorMessage = '更新失败';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    console.error('解析错误响应失败:', e);
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            // 更新当前用户数据
            this.currentUser = { ...this.currentUser, ...result };
            
            // 更新显示
            this.updateProfileDisplay(this.currentUser);
            
            // 更新本地存储
            if (window.StorageManager && typeof window.StorageManager.setUser === 'function') {
                window.StorageManager.setUser(this.currentUser);
            } else {
                // 降级到localStorage
                localStorage.setItem('userInfo', JSON.stringify(this.currentUser));
            }
            
            return result;
        } catch (error) {
            console.error('更新个人资料失败:', error);
            throw error;
        }
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
        
        if (diffInMinutes < 60) {
            // 1小时以内显示"xx分钟前"
            if (diffInMinutes < 1) {
                return '刚刚';
            } else {
                return `${diffInMinutes}分钟前`;
            }
        } else {
            // 1小时以外显示具体时间，使用 yyyy-mm-dd hh:mm 格式
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    }

    /**
     * 构建完整的头像URL
     * @param {string} avatarPath - 头像路径
     * @returns {string} 完整的头像URL
     */
    buildFullAvatarUrl(avatarPath) {
        
        if (!avatarPath) return '';
        
        // 如果已经是完整URL，直接返回
        if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
            return avatarPath;
        }
        
        // 如果已经包含/uploads/avatars/路径，需要检查是否为完整URL
        if (avatarPath.includes('/uploads/avatars/')) {
            // 如果包含域名，说明是完整URL，直接返回
            if (avatarPath.includes('://')) {
                return avatarPath;
            }
            // 如果只是相对路径，需要构建完整URL
        }
        
        // 确保路径以/uploads/avatars/开头
        // 先清理可能重复的路径
        let cleanPath = avatarPath;
        if (cleanPath.startsWith('/uploads/avatars/')) {
            cleanPath = cleanPath.replace('/uploads/avatars/', '');
        }
        cleanPath = '/uploads/avatars/' + cleanPath;
        
        // 尝试多种方式构建完整URL
        let fullUrl = cleanPath;
        
        // 方式1: 使用apiGateway
        if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
            fullUrl = window.apiGateway.buildUrl(cleanPath);
            return fullUrl;
        }
        
        // 方式2: 使用ENV_MANAGER
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.buildResourceUrl === 'function') {
            fullUrl = window.ENV_MANAGER.buildResourceUrl(cleanPath);
            return fullUrl;
        }
        
        // 方式3: 使用APP_UTILS
        if (window.APP_UTILS && typeof window.APP_UTILS.buildResourceUrl === 'function') {
            fullUrl = window.APP_UTILS.buildResourceUrl(cleanPath);
            return fullUrl;
        }
        
        // 方式4: 手动构建（降级处理）
        let baseUrl = '';
        
        // 尝试从ENV_MANAGER获取baseUrl
        if (window.ENV_MANAGER && window.ENV_MANAGER.config && window.ENV_MANAGER.config.apiBaseUrl) {
            baseUrl = window.ENV_MANAGER.config.apiBaseUrl;
        } else if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
            baseUrl = window.APP_CONFIG.API_BASE_URL;
        } else {
            // 根据当前域名判断环境
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
                baseUrl = 'http://localhost:8080';
            } else if (hostname.includes('redamancy.com.cn')) {
                baseUrl = 'https://redamancy.com.cn';
            } else {
                // 默认使用当前页面的协议和域名
                baseUrl = window.location.protocol + '//' + window.location.host;
            }
        }
        
        fullUrl = baseUrl + cleanPath;
        return fullUrl;
    }

    /**
     * 获取当前用户
     * @returns {Object|null} 当前用户信息
     */
    getCurrentUser() {
        // 如果实例中没有用户数据，尝试从多个来源获取
        if (!this.currentUser) {
            // 方式1: 从StorageManager获取
            if (window.StorageManager && typeof window.StorageManager.getUser === 'function') {
                this.currentUser = window.StorageManager.getUser();
            }
            
            // 方式2: 从localStorage获取userInfo
            if (!this.currentUser) {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    try {
                        this.currentUser = JSON.parse(userInfo);
                    } catch (error) {
                        console.warn('解析userInfo失败:', error);
                    }
                }
            }
            
            // 方式3: 从localStorage获取currentUser（兼容旧版本）
            if (!this.currentUser) {
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    try {
                        this.currentUser = JSON.parse(storedUser);
                    } catch (error) {
                        console.warn('解析currentUser失败:', error);
                    }
                }
            }
            
            // 方式4: 从认证系统获取
            if (!this.currentUser && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
                this.currentUser = window.authSystem.getCurrentUser();
            }
            
            // 方式5: 从API系统获取
            if (!this.currentUser && window.apiSystem && typeof window.apiSystem.getCurrentUser === 'function') {
                this.currentUser = window.apiSystem.getCurrentUser();
            }
        }
        
        // 兜底：确保avatarUrl始终为完整URL
        if (this.currentUser && this.currentUser.avatarUrl) {
            if (!this.currentUser.avatarUrl.startsWith('/uploads/avatars/') &&
                !this.currentUser.avatarUrl.startsWith('http')) {
                this.currentUser.avatarUrl = '/uploads/avatars/' + this.currentUser.avatarUrl;
            }
            
            // 确保avatarUrl包含完整的前缀
            if (this.currentUser.avatarUrl.startsWith('/uploads/avatars/') && !this.currentUser.avatarUrl.startsWith('http://') && !this.currentUser.avatarUrl.startsWith('https://')) {
                this.currentUser.avatarUrl = this.buildFullAvatarUrl(this.currentUser.avatarUrl);
            }
        }
        
        return this.currentUser;
    }

    /**
     * 显示个人资料模态框
     */
    async showProfileModal() {
        
        // 先隐藏任何已存在的个人资料模态框
        this.hideProfileModal();
        
        // 获取当前用户数据
        const userData = this.getCurrentUser();
        
        // 动态创建模态框，直接使用获取到的数据填充
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60';
        modal.setAttribute('data-modal', 'profile');
        
        // 准备头像URL - 优先使用缓存
        let avatarUrl = '/static/public/docs.png';
        const cachedAvatar = localStorage.getItem('cachedAvatar');
        
        if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined' && cachedAvatar !== '') {
            // 直接使用缓存的完整URL
            avatarUrl = cachedAvatar;
        } else if (userData && userData.avatarUrl && userData.avatarUrl !== 'null' && userData.avatarUrl !== 'undefined' && userData.avatarUrl !== '') {
            // 检查是否已经是完整URL或包含完整路径
            if (userData.avatarUrl.startsWith('http://') || userData.avatarUrl.startsWith('https://') || 
                userData.avatarUrl.startsWith('/uploads/avatars/') || userData.avatarUrl.includes('/uploads/avatars/')) {
                // 如果已经是完整URL或包含完整路径，直接使用
                avatarUrl = userData.avatarUrl;
            } else {
                // 构建头像URL
                if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                    avatarUrl = window.apiGateway.buildUrl('/uploads/avatars/' + userData.avatarUrl);
                } else {
                    avatarUrl = '/uploads/avatars/' + userData.avatarUrl;
                }
            }
        } else {
            // 检查页面上是否有可见的头像，如果有则获取其URL
            const welcomeAvatarImage = document.getElementById('avatar-image');
            const topbarAvatar = document.getElementById('user-avatar');
            
            if (welcomeAvatarImage && !welcomeAvatarImage.classList.contains('hidden') && welcomeAvatarImage.style.display !== 'none' && welcomeAvatarImage.src) {
                avatarUrl = welcomeAvatarImage.src;
            } else if (topbarAvatar && topbarAvatar.style.display !== 'none' && topbarAvatar.src) {
                avatarUrl = topbarAvatar.src;
            }
        }

        // 确保头像URL有效
        const hasValidAvatar = avatarUrl && avatarUrl !== '/static/public/docs.png' && avatarUrl !== '/uploads/avatars/null' && avatarUrl !== '/uploads/avatars/undefined';

        // 获取用户信息，确保有默认值
        const username = userData ? (userData.username || '') : '';
        const email = userData ? (userData.email || '') : '';
        const bio = userData ? (userData.bio || userData.description || '') : '';



        modal.innerHTML = `
            <div class="bg-dark-light rounded-xl p-6 w-full max-w-md max-h-[80vh] shadow-2xl border border-purple-400/30 overflow-hidden">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-purple-300">编辑个人资料</h3>
                    <button id="close-profile-btn" class="text-gray-400 hover:text-white transition-colors">
                        <i class="fa fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <!-- 头像上传区域 -->
                    <div class="flex flex-col items-center space-y-3">
                        <div class="relative group">
                            <div class="w-20 h-20 bg-gradient-to-br from-purple-light to-blue-light rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300" id="profile-avatar-preview">
                                <i class="fa fa-user-circle text-3xl" id="profile-avatar-icon" ${hasValidAvatar ? 'style="display: none;"' : ''}></i>
                                <img id="profile-avatar-image" class="w-full h-full rounded-full object-cover ${hasValidAvatar ? '' : 'hidden'}" src="${avatarUrl}" alt="头像" ${hasValidAvatar ? 'style="display: block;"' : 'style="display: none;"'}>
                            </div>
                            <!-- 悬停时显示的预览遮罩 -->
                            <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                <i class="fa fa-eye text-sm"></i>
                            </div>
                            <!-- 点击编辑按钮 -->
                            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg" id="avatar-upload-btn" title="更换头像">
                                <i class="fa fa-pencil text-xs"></i>
                            </div>
                        </div>
                        <input type="file" id="avatar-file-input" class="hidden" accept="image/*">
                        <p class="text-xs text-gray-400 text-center">点击头像预览，点击编辑按钮更换头像</p>
                    </div>
                    
                    <!-- 用户名输入 -->
                    <div>
                        <label for="profile-username-input" class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
                        <input type="text" id="profile-username-input" class="w-full px-3 py-2 bg-dark-light/50 border border-gray-600/50 rounded-lg placeholder-gray-400 focus:border-purple-light/50 focus:outline-none transition-colors text-sm" placeholder="请输入用户名" value="${username}">
                    </div>
                    
                    <!-- 邮箱输入 -->
                    <div>
                        <label for="profile-email-input" class="block text-sm font-medium text-gray-300 mb-2">邮箱</label>
                        <input type="email" id="profile-email-input" class="w-full px-3 py-2 bg-dark-light/50 border border-gray-600/50 rounded-lg placeholder-gray-400 focus:border-purple-light/50 focus:outline-none transition-colors text-sm" placeholder="请输入邮箱" value="${email}">
                    </div>
                    
                    <!-- 个人简介 -->
                    <div>
                        <label for="profile-bio-input" class="block text-sm font-medium text-gray-300 mb-2">个人简介</label>
                        <textarea id="profile-bio-input" rows="3" class="w-full px-3 py-2 bg-dark-light/50 border border-gray-600/50 rounded-lg placeholder-gray-400 focus:border-purple-light/50 focus:outline-none transition-colors resize-none text-sm" placeholder="请输入个人简介（可选）">${bio}</textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-purple-light/20">
                    <button id="cancel-profile-btn" class="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                        取消
                    </button>
                    <button id="save-profile-btn" class="px-4 py-2 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 rounded-lg shadow-md transition-all duration-300 transform hover:scale-[1.03] text-sm">
                        <i class="fa fa-save mr-1"></i> 保存资料
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
            
        // 只绑定模态框特定的事件，避免重复绑定全局事件
        this.bindModalEvents();
        
        // 确保头像正确显示 - 延迟执行以确保DOM已完全渲染
        setTimeout(() => {
            if (hasValidAvatar) {
                // 直接传递已构建的完整URL，避免重复构建
                this.updateProfileModalAvatar(avatarUrl);
            }
        }, 50);
        
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

            const response = await window.apiGateway.get(`/api/profile?user_id=${userId}`);

            if (response.ok) {
                const result = await response.json();
                
                // 正确解析API返回的数据结构
                let userData = null;
                if (result.success && result.profile) {
                    userData = result.profile;
                } else if (result.data) {
                    userData = result.data;
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
                
                // 确保模态框中的头像也更新 - 只在有有效头像时才更新
                setTimeout(() => {
                    if (userData && userData.avatarUrl && userData.avatarUrl !== 'null' && userData.avatarUrl !== 'undefined' && userData.avatarUrl !== '') {
                        this.updateProfileModalAvatar(userData.avatarUrl);
                    } else {
                        // 如果没有有效头像，不调用updateProfileModalAvatar，避免错误
                    }
                }, 100);
                
            } else {
                // API请求失败，回退到localStorage
                this.loadProfileFromLocalStorage();
            }
        } catch (error) {
            console.error('加载个人资料数据失败:', error);
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
                
                // 只在有有效头像时才更新模态框头像
                if (userData && userData.avatarUrl && userData.avatarUrl !== 'null' && userData.avatarUrl !== 'undefined' && userData.avatarUrl !== '') {
                    setTimeout(() => {
                        this.updateProfileModalAvatar(userData.avatarUrl);
                    }, 100);
                }
            }
        } catch (error) {
            console.error('从localStorage加载用户数据失败:', error);
        }
    }

    /**
     * 获取当前用户ID
     */
    getCurrentUserId() {
        // 方式1: 从API系统获取（最可靠）
        if (window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
            const userId = window.apiSystem.getCurrentUserId();
            if (userId) {
                return userId;
            }
        }
        
        // 方式2: 从localStorage获取userInfo（与登录系统一致）
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsedUser = JSON.parse(userInfo);
                const userId = parsedUser.uuid || parsedUser.id;
                if (userId) {
                    return userId;
                }
            } catch (e) {
                console.warn('解析userInfo失败:', e);
            }
        }
        
        // 方式3: 从认证系统获取
        if (window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
            const currentUser = window.authSystem.getCurrentUser();
            const userId = currentUser?.uuid || currentUser?.id;
            if (userId) {
                return userId;
            }
        }
        
        // 方式4: 从localStorage获取currentUser（兼容旧版本）
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const parsedCurrentUser = JSON.parse(currentUser);
                const userId = parsedCurrentUser.uuid || parsedCurrentUser.id;
                if (userId) {
                    return userId;
                }
            } catch (e) {
                console.warn('解析currentUser失败:', e);
            }
        }
        
        // 方式5: 从当前用户数据获取
        if (this.currentUser) {
            const userId = this.currentUser.uuid || this.currentUser.id;
            if (userId) {
                return userId;
            }
        }
        
        // 方式6: 尝试从URL参数获取
        const urlParams = new URLSearchParams(window.location.search);
        const userIdFromUrl = urlParams.get('user_id');
        if (userIdFromUrl) {
            return userIdFromUrl;
        }
        
        // 方式7: 尝试从页面元素获取
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
        
        // 头像 - 优先使用缓存
        this.updateProfileModalAvatar(userData.avatarUrl);
    }

    updateProfileModalAvatar(avatarUrl) {
        // 查找头像显示元素（可能在动态创建的模态框中）
        const profileAvatarImage = document.getElementById('profile-avatar-image');
        const profileAvatarIcon = document.getElementById('profile-avatar-icon');
        
        if (profileAvatarImage && profileAvatarIcon) {
            // 优先从缓存恢复头像信息
            const cachedAvatar = localStorage.getItem('cachedAvatar');
            let fullAvatarUrl = null;
            
            if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined' && cachedAvatar !== '') {
                // 直接使用缓存的完整URL
                fullAvatarUrl = cachedAvatar;
            } else if (avatarUrl && avatarUrl !== 'null' && avatarUrl !== 'undefined' && avatarUrl !== '') {
                // 检查传入的avatarUrl是否已经是完整URL或相对完整路径
                if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || 
                    avatarUrl.startsWith('/uploads/avatars/') || avatarUrl.includes('/uploads/avatars/')) {
                    // 如果已经是完整URL或包含完整路径，直接使用
                    fullAvatarUrl = avatarUrl;
                } else if (avatarUrl.includes('http://') || avatarUrl.includes('https://') || avatarUrl.includes('localhost:8080')) {
                    // 如果URL中包含协议或localhost，说明已经是完整URL，直接使用
                    fullAvatarUrl = avatarUrl;
                } else {
                    // 如果只是文件名，构建完整URL
                    if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                        fullAvatarUrl = window.apiGateway.buildUrl('/uploads/avatars/' + avatarUrl);
                    } else {
                        fullAvatarUrl = '/uploads/avatars/' + avatarUrl;
                    }
                }
            }
            
            // 确保URL有效且不是默认图片
            const isValidAvatar = fullAvatarUrl && 
                                fullAvatarUrl !== '/uploads/avatars/null' && 
                                fullAvatarUrl !== '/uploads/avatars/undefined' &&
                                fullAvatarUrl !== '/static/public/docs.png';
            


            if (isValidAvatar) {
                // 有头像时显示图片
                profileAvatarImage.src = fullAvatarUrl;
                profileAvatarImage.classList.remove('hidden');
                profileAvatarIcon.classList.add('hidden');
                profileAvatarImage.style.display = 'block';
                profileAvatarIcon.style.display = 'none';
                
                // 确保图片加载完成后显示
                profileAvatarImage.onload = () => {
                    profileAvatarImage.style.display = 'block';
                    profileAvatarIcon.style.display = 'none';
                };
                
                profileAvatarImage.onerror = () => {
                    // 如果图片加载失败，显示默认图标
                    profileAvatarImage.style.display = 'none';
                    profileAvatarIcon.style.display = 'block';
                };
            } else {
                // 没有头像时显示默认图标，不设置src避免请求
                profileAvatarImage.classList.add('hidden');
                profileAvatarIcon.classList.remove('hidden');
                profileAvatarImage.src = ''; // 清空src避免请求
                profileAvatarImage.style.display = 'none';
                profileAvatarIcon.style.display = 'block';
            }
        } else {
            // 未找到模态框头像元素
        }
    }
    handleProfileAvatarUpload(e) {
        // 可根据实际需要补充头像上传逻辑
    }

    hideProfileModal() {
        
        // 查找所有个人资料模态框
        const modals = document.querySelectorAll('.fixed[data-modal="profile"]');
        
        modals.forEach((modal, index) => {
            
            // 清理模态框内的事件监听器
            const saveBtn = modal.querySelector('#save-profile-btn');
            const cancelBtn = modal.querySelector('#cancel-profile-btn');
            const closeBtn = modal.querySelector('#close-profile-btn');
            const avatarFileInput = modal.querySelector('#avatar-file-input');
            const avatarUploadBtn = modal.querySelector('#avatar-upload-btn');
            const profileAvatarPreview = modal.querySelector('#profile-avatar-preview');
            
            // 移除事件监听器
            if (saveBtn && this._modalSaveProfileHandler) {
                saveBtn.removeEventListener('click', this._modalSaveProfileHandler);
            }
            if (cancelBtn && this._modalCancelProfileHandler) {
                cancelBtn.removeEventListener('click', this._modalCancelProfileHandler);
            }
            if (closeBtn && this._modalCloseProfileHandler) {
                closeBtn.removeEventListener('click', this._modalCloseProfileHandler);
            }
            if (avatarFileInput && this._modalAvatarFileInputHandler) {
                avatarFileInput.removeEventListener('change', this._modalAvatarFileInputHandler);
            }
            if (avatarUploadBtn && this._modalAvatarUploadBtnHandler) {
                avatarUploadBtn.removeEventListener('click', this._modalAvatarUploadBtnHandler);
            }
            if (profileAvatarPreview && this._modalAvatarPreviewHandler) {
                profileAvatarPreview.removeEventListener('click', this._modalAvatarPreviewHandler);
            }
            if (modal && this._modalBackgroundClickHandler) {
                modal.removeEventListener('click', this._modalBackgroundClickHandler);
            }
            
            // 移除模态框
            modal.remove();
        });
        
        // 清理ESC键事件监听器
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
        }
        
        // 重置编辑状态
        this.isEditing = false;
        this.originalData = null;
    }

    /**
     * 绑定欢迎模块头像事件
     */
    bindWelcomeAvatarEvents() {
        
        // 延迟绑定，确保DOM已加载
        setTimeout(() => {
            // 绑定欢迎模块头像点击事件 - 显示头像预览
            const welcomeAvatar = document.getElementById('profile-avatar');
            if (welcomeAvatar) {
                // 移除可能存在的旧事件监听器
                if (this.welcomeAvatarClickHandler) {
                    welcomeAvatar.removeEventListener('click', this.welcomeAvatarClickHandler);
                }
                this.welcomeAvatarClickHandler = (e) => {
                    // 如果点击的是编辑图标，不触发头像预览
                    if (e.target.closest('.edit-icon')) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    this.showAvatarPreviewModal();
                };
                welcomeAvatar.addEventListener('click', this.welcomeAvatarClickHandler);
            } else {
                // 未找到欢迎模块头像元素
            }

            // 绑定编辑图标点击事件 - 触发文件选择
            const editIcons = document.querySelectorAll('.edit-icon');
            
            editIcons.forEach((editIcon, index) => {
                // 移除可能存在的旧事件监听器
                if (this.editIconClickHandler) {
                    editIcon.removeEventListener('click', this.editIconClickHandler);
                }
                this.editIconClickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.triggerAvatarUpload();
                };
                editIcon.addEventListener('click', this.editIconClickHandler);
            });
            
            // 绑定头像图片点击事件 - 显示头像预览
            const avatarImage = document.getElementById('avatar-image');
            if (avatarImage) {
                // 移除可能存在的旧事件监听器
                if (this.avatarImageClickHandler) {
                    avatarImage.removeEventListener('click', this.avatarImageClickHandler);
                }
                this.avatarImageClickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showAvatarPreviewModal();
                };
                avatarImage.addEventListener('click', this.avatarImageClickHandler);
            }
            
            // 绑定头像图标点击事件 - 显示头像预览
            const avatarIcon = document.getElementById('avatar-icon');
            if (avatarIcon) {
                // 移除可能存在的旧事件监听器
                if (this.avatarIconClickHandler) {
                    avatarIcon.removeEventListener('click', this.avatarIconClickHandler);
                }
                this.avatarIconClickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showAvatarPreviewModal();
                };
                avatarIcon.addEventListener('click', this.avatarIconClickHandler);
            }
            

        }, 100);
    }

    /**
     * 显示头像预览模态框
     */
    showAvatarPreviewModal() {
        
        // 获取当前头像URL
        let avatarUrl = null;
        const cachedAvatar = localStorage.getItem('cachedAvatar');
        
        if (cachedAvatar && cachedAvatar !== 'null' && cachedAvatar !== 'undefined' && cachedAvatar !== '') {
            avatarUrl = cachedAvatar;
        } else {
            // 如果没有缓存，尝试从当前用户数据获取
            const userData = this.getCurrentUser();
            if (userData && userData.avatarUrl && userData.avatarUrl !== 'null' && userData.avatarUrl !== 'undefined' && userData.avatarUrl !== '') {
                // 检查userData.avatarUrl是否已经是完整URL
                if (userData.avatarUrl.startsWith('http://') || userData.avatarUrl.startsWith('https://')) {
                    avatarUrl = userData.avatarUrl;
                } else {
                    // 确保userData.avatarUrl是纯文件名，不包含路径
                    let fileName = userData.avatarUrl;
                    if (fileName.startsWith('/uploads/avatars/')) {
                        fileName = fileName.replace('/uploads/avatars/', '');
                    }
                    
                    if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                        avatarUrl = window.apiGateway.buildUrl('/uploads/avatars/' + fileName);
                    } else {
                        avatarUrl = '/uploads/avatars/' + fileName;
                    }

                }
            }
        }

        // 检查头像是否真实存在（通过检查当前页面上的头像元素）
        const welcomeAvatarImage = document.getElementById('avatar-image');
        const topbarAvatar = document.getElementById('user-avatar');
        
        // 如果页面上有可见的头像，说明头像确实存在
        const hasVisibleAvatar = (welcomeAvatarImage && !welcomeAvatarImage.classList.contains('hidden') && welcomeAvatarImage.style.display !== 'none') ||
                                (topbarAvatar && topbarAvatar.style.display !== 'none');

        // 如果没有头像URL且页面上也没有可见的头像，才显示提示
        if (!avatarUrl && !hasVisibleAvatar) {
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '暂无头像，请先上传头像',
                    type: 'info',
                    duration: 3000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('暂无头像，请先上传头像', 'info');
            } else if (window.showMessage) {
                window.showMessage('暂无头像，请先上传头像', 'info');
            }
            return;
        }

        // 如果页面上有可见的头像但URL为空，尝试从页面元素获取URL
        if (!avatarUrl && hasVisibleAvatar) {
            if (welcomeAvatarImage && welcomeAvatarImage.src) {
                avatarUrl = welcomeAvatarImage.src;
            } else if (topbarAvatar && topbarAvatar.src) {
                avatarUrl = topbarAvatar.src;
            }
        }
        
        // 清理URL，避免重复拼接路径
        if (avatarUrl) {
            // 如果URL包含重复的/uploads/avatars/路径，清理掉重复部分
            if (avatarUrl.includes('/uploads/avatars/uploads/avatars/')) {
                avatarUrl = avatarUrl.replace('/uploads/avatars/uploads/avatars/', '/uploads/avatars/');
            }
            // 如果URL包含重复的域名，清理掉重复部分
            if (avatarUrl.includes('http://localhost:8080/http://localhost:8080/')) {
                avatarUrl = avatarUrl.replace('http://localhost:8080/http://localhost:8080/', 'http://localhost:8080/');
            }
        }

        // 如果仍然没有URL，显示提示
        if (!avatarUrl) {
            if (window.MessageBox && window.MessageBox.show) {
                window.MessageBox.show({
                    message: '暂无头像，请先上传头像',
                    type: 'info',
                    duration: 3000
                });
            } else if (window.$utils && window.$utils.showMessage) {
                window.$utils.showMessage('暂无头像，请先上传头像', 'info');
            } else if (window.showMessage) {
                window.showMessage('暂无头像，请先上传头像', 'info');
            }
            return;
        }

        // 创建预览模态框
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center';
        modal.setAttribute('data-modal', 'avatar-preview');
        
        modal.innerHTML = `
            <div class="relative w-full h-full flex items-center justify-center p-4">
                <!-- 关闭按钮 -->
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 transition-colors" onclick="this.closest('.fixed').remove()">
                    <i class="fa fa-times"></i>
                </button>
                
                <!-- 头像预览 -->
                <div class="relative max-w-4xl max-h-full">
                    <img src="${avatarUrl}" alt="头像预览" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="hidden flex items-center justify-center w-full h-full min-h-[300px] bg-gray-800/50 rounded-lg">
                        <div class="text-center text-white">
                            <i class="fa fa-image text-6xl mb-4 opacity-50"></i>
                            <p class="text-lg">头像加载失败</p>
                            <p class="text-sm opacity-75">文件可能不存在或格式不支持</p>
                        </div>
                    </div>
                </div>
                
                <!-- 底部操作按钮 -->
                <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button class="px-4 py-2 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 rounded-lg text-white transition-all duration-300 transform hover:scale-105" 
                            onclick="if(window.uiManager && window.uiManager.profileManager) { window.uiManager.profileManager.triggerAvatarUpload(); } this.closest('.fixed').remove();">
                        <i class="fa fa-upload mr-2"></i>更换头像
                    </button>
                    <button class="px-4 py-2 bg-gray-600/80 hover:bg-gray-600 rounded-lg text-white transition-all duration-300" 
                            onclick="this.closest('.fixed').remove();">
                        关闭
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 点击背景关闭模态框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', function closeOnEsc(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeOnEsc);
            }
        });
    }
}

// 全局暴露
window.UIProfileManager = UIProfileManager; 