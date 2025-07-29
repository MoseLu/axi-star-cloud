/**
 * API系统主入口
 * 整合所有API相关模块，提供统一的API管理接口
 */
class ApiSystem {
    constructor() {
        this.core = null;
        this.auth = null;
        this.files = null;
        this.folders = null;
        this.storage = null;
        this.profile = null;
        this.admin = null;
        this.urlFiles = null;
        this.documents = null;
        this.utils = null;
        this.isInitialized = false;
        
        // 立即初始化，确保API系统立即可用
        this.init();
    }

    // 初始化API系统
    init() {
        if (this.isInitialized) {
            return;
        }

        try {
            // 初始化各个模块
            this.initCore();
            this.initAuth();
            this.initFiles();
            this.initFolders();
            this.initStorage();
            this.initProfile();
            this.initAdmin();
            this.initUrlFiles();
            this.initDocuments();
            this.initUtils();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('ApiSystem initialization failed:', error);
        }
    }

    // 初始化核心模块
    initCore() {
        if (typeof Core !== 'undefined') {
            this.core = new Core();
        } else {
            console.error('Core class not found');
        }
    }

    // 初始化认证模块
    initAuth() {
        if (typeof Auth !== 'undefined' && this.core) {
            this.auth = new Auth(this.core);
        } else {
            console.error('Auth class not found or core not initialized');
        }
    }

    // 初始化文件模块
    initFiles() {
        if (typeof Files !== 'undefined' && this.core) {
            this.files = new Files(this.core);
        } else {
            console.error('Files class not found or core not initialized');
        }
    }

    // 初始化文件夹模块
    initFolders() {
        if (typeof Folders !== 'undefined' && this.core) {
            this.folders = new Folders(this.core);
        } else {
            console.error('Folders class not found or core not initialized');
        }
    }

    // 初始化存储模块
    initStorage() {
        if (typeof Storage !== 'undefined' && this.core) {
            this.storage = new Storage(this.core);
        } else {
            console.error('Storage class not found or core not initialized');
        }
    }

    // 初始化个人资料模块
    initProfile() {
        if (typeof Profile !== 'undefined' && this.core) {
            this.profile = new Profile(this.core);
        } else {
            console.error('Profile class not found or core not initialized');
        }
    }

    // 初始化管理员模块
    initAdmin() {
        if (typeof Admin !== 'undefined' && this.core) {
            this.admin = new Admin(this.core);
        } else {
            console.error('Admin class not found or core not initialized');
        }
    }

    // 初始化URL文件模块
    initUrlFiles() {
        if (typeof UrlFiles !== 'undefined' && this.core) {
            this.urlFiles = new UrlFiles(this.core);
        } else {
            console.error('UrlFiles class not found or core not initialized');
        }
    }

    // 初始化文档模块
    initDocuments() {
        if (typeof Documents !== 'undefined' && this.core) {
            this.documents = new Documents(this.core);
        } else {
            console.error('Documents class not found or core not initialized');
        }
    }

    // 初始化工具模块
    initUtils() {
        if (typeof ApiUtils !== 'undefined') {
            this.utils = new ApiUtils();
        } else {
            console.error('ApiUtils class not found');
        }
    }

    // 获取核心模块
    getCore() {
        return this.core;
    }

    // 获取认证模块
    getAuth() {
        return this.auth;
    }

    // 获取文件模块
    getFiles() {
        return this.files;
    }

    // 获取文件夹模块
    getFolders() {
        return this.folders;
    }

    // 获取存储模块
    getStorage() {
        return this.storage;
    }

    // 获取个人资料模块
    getProfile() {
        return this.profile;
    }

    // 获取管理员模块
    getAdmin() {
        return this.admin;
    }

    // 获取URL文件模块
    getUrlFiles() {
        return this.urlFiles;
    }

    // 获取文档模块
    getDocuments() {
        return this.documents;
    }

    // 获取工具模块
    getUtils() {
        return this.utils;
    }

    // 重新初始化（用于动态内容更新后）
    reinit() {
        this.isInitialized = false;
        this.init();
    }

    // 清理所有资源
    cleanup() {
        this.isInitialized = false;
    }

    // 代理方法：登录
    async login(username, password) {
        return this.auth ? this.auth.login(username, password) : { success: false, error: 'Auth module not initialized' };
    }

    // 代理方法：注册
    async register(username, password, email = '') {
        return this.auth ? this.auth.register(username, password, email) : { success: false, error: 'Auth module not initialized' };
    }

    // 代理方法：退出登录
    logout() {
        return this.auth ? this.auth.logout() : { success: false, error: 'Auth module not initialized' };
    }

    // 代理方法：获取文件列表
    async getFiles(folderId = null) {
        return this.files ? this.files.getFiles(folderId) : [];
    }

    // 代理方法：获取URL文件列表
    async getUrlFiles(folderId = null) {
        return this.urlFiles ? this.urlFiles.getUrlFiles(folderId) : [];
    }

    // 代理方法：获取文件夹列表
    async getFolders(category = null) {
        return this.folders ? this.folders.getFolders(category) : [];
    }

    // 代理方法：获取存储信息
    async getStorageInfo() {
        return this.storage ? this.storage.getStorageInfo() : null;
    }

    // 代理方法：更新存储限制
    async updateStorageLimit(storageBytes) {
        return this.storage ? this.storage.updateStorageLimit(storageBytes) : { success: false, error: 'Storage module not initialized' };
    }

    // 代理方法：获取总文件数
    async getTotalFileCount() {
        return this.storage ? this.storage.getTotalFileCount() : 0;
    }

    // 代理方法：获取个人资料
    async getProfile() {
        return this.profile ? this.profile.getProfile() : null;
    }

    // 代理方法：更新个人资料
    async updateProfile(profileData) {
        return this.profile ? this.profile.updateProfile(profileData) : { success: false, error: 'Profile module not initialized' };
    }

    // 代理方法：上传头像
    async uploadAvatar(file) {
        return this.profile ? this.profile.uploadAvatar(file) : { success: false, error: 'Profile module not initialized' };
    }

    // 代理方法：获取所有用户（管理员）
    async getAllUsers(page = 1, pageSize = 5) {
        return this.admin ? this.admin.getAllUsers(page, pageSize) : { success: false, error: 'Admin module not initialized' };
    }

    // 代理方法：更新用户存储限制（管理员）
    async updateUserStorage(uuid, storageLimit) {
        return this.admin ? this.admin.updateUserStorage(uuid, storageLimit) : { success: false, error: 'Admin module not initialized' };
    }

    // 代理方法：格式化文件大小
    formatFileSize(bytes) {
        return this.utils ? this.utils.formatFileSize(bytes) : '0 Bytes';
    }

    // 代理方法：获取文件图标
    getFileIcon(type) {
        return this.utils ? this.utils.getFileIcon(type) : 'fa-file-o';
    }

    // 代理方法：获取文件图标颜色
    getFileIconColor(type) {
        return this.utils ? this.utils.getFileIconColor(type) : 'text-gray-400';
    }

    // 代理方法：设置当前用户
    setCurrentUser(userData) {
        return this.core ? this.core.setCurrentUser(userData) : null;
    }

    // 代理方法：获取当前用户
    getCurrentUser() {
        return this.core ? this.core.getCurrentUser() : null;
    }

    // 代理方法：获取当前用户ID
    getCurrentUserId() {
        return this.core ? this.core.getCurrentUserId() : null;
    }

    // 代理方法：检查是否为管理员
    isAdmin() {
        return this.core ? this.core.isAdmin() : false;
    }

    // 代理方法：检查是否已登录
    isLoggedIn() {
        return this.core ? this.core.isLoggedIn() : false;
    }
}

// 创建全局API系统实例
window.apiSystem = new ApiSystem();

// 为了向后兼容，保留原来的ApiManager类名
window.ApiManager = ApiSystem; 