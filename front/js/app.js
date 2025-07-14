// 主应用模块 - 初始化所有模块并协调它们的工作
class App {
    constructor() {
        this.authManager = null;
        this.apiManager = null;
        this.uiManager = null;
        this.init();
    }

    async init() {
        try {
    
            
            // 初始化各个模块
            this.authManager = new AuthManager();
            this.apiManager = new ApiManager();
            this.uiManager = new UIManager();

            // 设置全局引用
            window.authManager = this.authManager;
            window.apiManager = this.apiManager;
            window.uiManager = this.uiManager;

            // 初始化日期显示
            this.initDateDisplay();

            // 设置登录表单事件
            this.setupLoginForm();

            // 设置其他事件监听器
            this.setupEventListeners();

    
        } catch (error) {
            // 应用初始化失败
        }
    }

    // 初始化日期显示
    initDateDisplay() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('zh-CN', options);
        }
    }

    // 设置登录表单 - 由 UIManager 处理
    setupLoginForm() {
        // 登录表单事件由 UIManager 处理，避免重复绑定
    }

    // 设置事件监听器
    setupEventListeners() {
        // 登录成功事件监听 - 由UIManager处理，避免重复
        // window.addEventListener('loginSuccess', async (event) => {
        //     await this.onLoginSuccess(event.detail);
        // });

        // 上传按钮事件 - 由 UIManager 处理
        // 避免重复绑定事件监听器

        // 设置按钮和退出登录按钮 - 由 UIManager 处理
        // 避免重复绑定事件监听器

        // 搜索功能 - 由 UIManager 处理
        // 避免重复绑定事件监听器

        // 文件类型标签点击事件 - 由 UIManager 处理
        // 避免重复绑定事件监听器
    }

    // 退出登录
    logout() {
        this.authManager.clearLoginData();
        this.authManager.showLoginPage();
        Notify.show({ message: '已退出登录', type: 'info' });
    }
}

// 应用初始化由index-new.html中的模板加载完成后调用 