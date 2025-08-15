/**
 * 主题管理器
 * 负责管理明亮/黑暗主题切换、本地存储和动态样式加载
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // 默认暗色主题
        this.themeKey = 'axi-star-cloud-theme';
        this.isHydrated = false; // 水合状态标记
        this.init();
    }

    /**
     * 初始化主题管理器
     */
    init() {
        try {
            // 立即应用默认主题，避免水合问题
            this.applyInitialTheme();
            
            // 从本地存储加载主题设置
            this.loadThemeFromStorage();
            
            // 应用当前主题
            this.applyTheme(this.currentTheme);
            
            // 标记为已水合
            this.isHydrated = true;
            document.documentElement.setAttribute('data-hydrated', 'true');
            
            // 设置全局主题切换事件
            this.setupGlobalThemeToggle();
        } catch (error) {
            console.error('主题管理器初始化失败:', error);
        }
    }

    /**
     * 立即应用初始主题，避免水合问题
     */
    applyInitialTheme() {
        try {
            // 立即移除所有可能的主题类，避免冲突
            document.documentElement.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
            document.body.classList.remove('theme-light', 'theme-dark', 'bg-white', 'bg-dark', 'text-gray-900', 'text-white');
            
            // 应用默认暗色主题
            document.documentElement.classList.add('dark');
            document.body.classList.add('theme-dark', 'bg-dark', 'text-white');
            
            // 设置data属性
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.setAttribute('data-hydrated', 'false');
        } catch (error) {
            console.warn('应用初始主题失败:', error);
        }
    }

    /**
     * 从本地存储加载主题设置
     */
    loadThemeFromStorage() {
        try {
            // 检查 StorageManager 是否已加载
            if (window.StorageManager && typeof window.StorageManager.getTheme === 'function') {
                const savedTheme = window.StorageManager.getTheme();
                if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                    this.currentTheme = savedTheme;
                } else {
                    // 如果没有保存的主题设置，检查当前页面状态
                    const body = document.body;
                    if (body && body.classList.contains('theme-light')) {
                        this.currentTheme = 'light';
                    } else if (body && body.classList.contains('theme-dark')) {
                        this.currentTheme = 'dark';
                    } else {
                        // 如果页面没有任何主题类，使用系统偏好或默认暗色主题
                        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                        this.currentTheme = prefersDark ? 'dark' : 'light';
                    }
                }
            } else {
                // 如果 StorageManager 未加载，使用 localStorage 作为备用
                const savedTheme = localStorage.getItem('theme') || localStorage.getItem('currentTheme');
                if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                    this.currentTheme = savedTheme;
                } else {
                    // 如果没有保存的主题设置，检查当前页面状态
                    const body = document.body;
                    if (body && body.classList.contains('theme-light')) {
                        this.currentTheme = 'light';
                    } else if (body && body.classList.contains('theme-dark')) {
                        this.currentTheme = 'dark';
                    } else {
                        // 如果页面没有任何主题类，使用系统偏好或默认暗色主题
                        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                        this.currentTheme = prefersDark ? 'dark' : 'light';
                    }
                }
            }
        } catch (error) {
            console.error('加载主题设置失败:', error);
            // 出错时使用系统偏好或默认暗色主题
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
    }

    /**
     * 保存主题设置到本地存储
     */
    saveThemeToStorage(theme) {
        try {
            // 检查 StorageManager 是否已加载
            if (window.StorageManager && typeof window.StorageManager.setTheme === 'function') {
                window.StorageManager.setTheme(theme);
            } else {
                // 如果 StorageManager 未加载，使用 localStorage 作为备用
                localStorage.setItem('theme', theme);
            }
        } catch (error) {
            console.error('保存主题设置失败:', error);
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * 设置主题
     * @param {string} theme - 主题名称 ('light' 或 'dark')
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.error('无效的主题:', theme);
            return;
        }

        // 创建圆弧扩散动画
        this.createThemeTransitionAnimation(theme);
    }

    /**
     * 创建主题切换圆弧扩散动画
     * @param {string} theme - 目标主题
     */
    createThemeTransitionAnimation(theme) {
        // 获取按钮位置作为动画起点
        const themeBtn = document.getElementById('theme-toggle-btn');
        
        if (themeBtn) {
            // 给按钮添加动画类
            themeBtn.classList.add('animating');
        }

        // 给body添加动画类
        document.body.classList.add('theme-transitioning');

        // 立即应用新主题
        this.currentTheme = theme;
        this.saveThemeToStorage(theme);
        this.applyTheme(theme);
        this.dispatchThemeChangeEvent(theme);

        // 动画完成后清理状态
        setTimeout(() => {
            if (themeBtn) {
                themeBtn.classList.remove('animating');
            }
            document.body.classList.remove('theme-transitioning');
        }, 800);
    }

    /**
     * 应用主题
     * @param {string} theme - 主题名称
     */
    applyTheme(theme) {
        // 移除现有的主题样式
        this.removeThemeStyles();
        
        // 添加新主题样式
        this.loadThemeStyles(theme);
        
        // 更新body类名
        this.updateBodyClass(theme);
        
        // 更新主题切换按钮状态
        this.updateThemeToggleButton(theme);
        
        // 确保水合状态正确
        if (this.isHydrated) {
            document.documentElement.setAttribute('data-hydrated', 'true');
        }
    }

    /**
     * 移除现有的主题样式
     */
    removeThemeStyles() {
        try {
            // 移除现有的主题CSS链接
            const existingThemeLinks = document.querySelectorAll('link[data-theme]');
            existingThemeLinks.forEach(link => {
                if (link && link.parentNode) {
                    link.remove();
                }
            });
        } catch (error) {
            console.warn('移除主题样式失败:', error);
        }
    }

    /**
     * 加载主题样式
     * @param {string} theme - 主题名称
     */
    loadThemeStyles(theme) {
        try {
            if (!document.head) {
                console.warn('document.head不存在');
                return;
            }
            
            // 加载主题特定的CSS文件
            const themeFiles = [
                'custom.css',
                'file-cards.css',
                'modal-manager.css',
                'notifications.css',
                'preview-modal.css',
                'profile-manager.css',
                'settings-manager.css',
                'admin-manager.css',
                'upload-manager.css',
                'url-manager.css',
                'mobile-enhancement.css',
                'welcome-mobile.css',
                'help-manager.css',
                'docs-sync.css',
                'file-filters.css',
                'file-operations.css',
                'breadcrumb.css',
                'scrollbar.css',
                'utilities.css',
                'storage-overview.css',
                'file-list.css',
                'upload-area.css',
                'header.css'
            ];

            let loadedFiles = 0;
            const totalFiles = themeFiles.length;

            themeFiles.forEach(file => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `/static/css/${theme}/${file}`;
                link.setAttribute('data-theme', theme);
                
                // 添加错误处理
                link.onerror = () => {
                    console.warn(`主题样式文件加载失败: ${theme}/${file}`);
                    loadedFiles++;
                    if (loadedFiles === totalFiles) {
                        this.applyWelcomeAndStorageStyles();
                    }
                };
                
                link.onload = () => {
                    loadedFiles++;
                    if (loadedFiles === totalFiles) {
                        this.applyWelcomeAndStorageStyles();
                    }
                };
                
                document.head.appendChild(link);
            });
        } catch (error) {
            console.warn('加载主题样式失败:', error);
        }
    }

    /**
     * 强制应用欢迎模块和存储概览的背景色
     */
    applyWelcomeAndStorageStyles() {
        // 移除动态样式设置，让CSS文件自己处理
        // 这样可以避免主题切换时的背景滞留问题
    }

    /**
     * 更新body类名
     * @param {string} theme - 主题名称
     */
    updateBodyClass(theme) {
        try {
            const body = document.body;
            const html = document.documentElement;
            
            if (!body) {
                console.warn('body元素不存在');
                return;
            }
            
            // 移除所有可能的主题类，确保没有冲突
            body.classList.remove('theme-dark', 'theme-light', 'bg-white', 'bg-dark', 'text-gray-900', 'text-white');
            html.classList.remove('light', 'dark', 'theme-light', 'theme-dark');
            
            // 添加新主题类
            body.classList.add(`theme-${theme}`);
            
            // 更新背景色 - 保持Tailwind类完整
            if (theme === 'dark') {
                body.classList.add('bg-dark', 'text-white');
                html.classList.add('dark');
            } else {
                body.classList.add('bg-white', 'text-gray-900');
                html.classList.add('light');
            }
            
            // 更新data属性
            html.setAttribute('data-theme', theme);
        } catch (error) {
            console.warn('更新body类名失败:', error);
        }
    }

    /**
     * 更新主题切换按钮状态
     * @param {string} theme - 主题名称
     */
    updateThemeToggleButton(theme) {
        try {
            // 更新主应用的主题切换按钮
            const themeToggleBtn = document.getElementById('theme-toggle-btn');
            if (themeToggleBtn) {
                const switchContainer = themeToggleBtn.querySelector('.w-11');
                const switchSlider = themeToggleBtn.querySelector('.absolute.left-0\\.5');
                const sunIcon = themeToggleBtn.querySelector('.text-yellow-500');
                const moonIcon = themeToggleBtn.querySelector('.text-gray-600');
                const themeLabel = themeToggleBtn.querySelector('span');
                
                if (theme === 'dark') {
                    // 暗色主题状态
                    switchContainer.classList.remove('bg-blue-500');
                    switchContainer.classList.add('bg-gray-200');
                    switchSlider.classList.remove('translate-x-5');
                    switchSlider.classList.add('translate-x-0');
                    sunIcon.classList.remove('opacity-0');
                    sunIcon.classList.add('opacity-100');
                    moonIcon.classList.remove('opacity-100');
                    moonIcon.classList.add('opacity-0');
                    themeLabel.textContent = '暗色';
                    themeToggleBtn.title = '切换到明亮主题';
                    themeToggleBtn.setAttribute('aria-checked', 'true');
                } else {
                    // 亮色主题状态
                    switchContainer.classList.remove('bg-gray-200');
                    switchContainer.classList.add('bg-blue-500');
                    switchSlider.classList.remove('translate-x-0');
                    switchSlider.classList.add('translate-x-5');
                    sunIcon.classList.remove('opacity-100');
                    sunIcon.classList.add('opacity-0');
                    moonIcon.classList.remove('opacity-0');
                    moonIcon.classList.add('opacity-100');
                    themeLabel.textContent = '亮色';
                    themeToggleBtn.title = '切换到黑暗主题';
                    themeToggleBtn.setAttribute('aria-checked', 'false');
                }
            }

            // 更新登录页面的主题切换按钮
            const loginThemeToggleBtn = document.getElementById('login-theme-toggle-btn');
            if (loginThemeToggleBtn) {
                const icon = loginThemeToggleBtn.querySelector('.icon');
                
                if (theme === 'dark') {
                    // 暗色主题状态 - 显示太阳图标
                    if (icon) {
                        icon.className = 'fa fa-sun-o icon';
                        icon.style.color = '#F59E0B'; // 金色
                    }
                    loginThemeToggleBtn.title = '切换到明亮主题';
                    loginThemeToggleBtn.setAttribute('aria-checked', 'true');
                } else {
                    // 亮色主题状态 - 显示月亮图标
                    if (icon) {
                        icon.className = 'fa fa-moon-o icon';
                        icon.style.color = '#6B7280'; // 灰色
                    }
                    loginThemeToggleBtn.title = '切换到黑暗主题';
                    loginThemeToggleBtn.setAttribute('aria-checked', 'false');
                }
            }
        } catch (error) {
            console.warn('更新主题切换按钮失败:', error);
        }
    }

    /**
     * 设置全局主题切换事件
     */
    setupGlobalThemeToggle() {
        // 监听主题切换按钮点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('#theme-toggle-btn') || e.target.closest('#login-theme-toggle-btn')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // 监听键盘快捷键 (Ctrl/Cmd + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * 触发主题切换事件
     * @param {string} theme - 主题名称
     */
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themeChanged', {
            detail: { theme: theme }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前主题
     * @returns {string} 当前主题名称
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * 检查是否为暗色主题
     * @returns {boolean} 是否为暗色主题
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * 检查是否为亮色主题
     * @returns {boolean} 是否为亮色主题
     */
    isLightTheme() {
        return this.currentTheme === 'light';
    }
}

// 创建全局主题管理器实例
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
} 