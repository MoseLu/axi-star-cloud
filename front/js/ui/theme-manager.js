/**
 * 主题管理器
 * 负责管理明亮/黑暗主题切换、本地存储和动态样式加载
 */
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // 默认暗色主题
        this.themeKey = 'axi-star-cloud-theme';
        this.init();
    }

    /**
     * 初始化主题管理器
     */
    init() {
        try {
            console.log('主题管理器初始化开始...');
            
            // 从本地存储加载主题设置
            this.loadThemeFromStorage();
            console.log('当前主题:', this.currentTheme);
            
            // 应用当前主题
            this.applyTheme(this.currentTheme);
            
            // 设置全局主题切换事件
            this.setupGlobalThemeToggle();
            
            console.log('主题管理器初始化完成');
        } catch (error) {
            console.error('主题管理器初始化失败:', error);
        }
    }

    /**
     * 从本地存储加载主题设置
     */
    loadThemeFromStorage() {
        try {
            const savedTheme = localStorage.getItem(this.themeKey);
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                this.currentTheme = savedTheme;
            }
        } catch (error) {
            console.error('加载主题设置失败:', error);
        }
    }

    /**
     * 保存主题设置到本地存储
     */
    saveThemeToStorage(theme) {
        try {
            localStorage.setItem(this.themeKey, theme);
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

        this.currentTheme = theme;
        this.saveThemeToStorage(theme);
        this.applyTheme(theme);
        
        // 触发主题切换事件
        this.dispatchThemeChangeEvent(theme);
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
                'utilities.css'
            ];

            themeFiles.forEach(file => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `/static/css/${theme}/${file}`;
                link.setAttribute('data-theme', theme);
                
                // 添加错误处理
                link.onerror = () => {
                    console.warn(`主题样式文件加载失败: ${theme}/${file}`);
                };
                
                link.onload = () => {
                    console.log(`主题样式文件加载成功: ${theme}/${file}`);
                };
                
                document.head.appendChild(link);
            });
        } catch (error) {
            console.warn('加载主题样式失败:', error);
        }
    }

    /**
     * 更新body类名
     * @param {string} theme - 主题名称
     */
    updateBodyClass(theme) {
        try {
            const body = document.body;
            if (!body) {
                console.warn('body元素不存在');
                return;
            }
            
            // 移除现有的主题类
            body.classList.remove('theme-dark', 'theme-light');
            
            // 添加新主题类
            body.classList.add(`theme-${theme}`);
            
            // 更新背景色 - 保持Tailwind类完整
            if (theme === 'dark') {
                body.classList.remove('bg-white', 'text-gray-900');
                body.classList.add('bg-dark', 'text-white');
            } else {
                body.classList.remove('bg-dark', 'text-white');
                body.classList.add('bg-white', 'text-gray-900');
            }
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
            if (e.target.closest('#theme-toggle-btn')) {
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