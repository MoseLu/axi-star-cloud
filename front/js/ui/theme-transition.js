/**
 * 主题切换圆弧扩散动画管理器
 * 从右上角开始，通过圆弧扩散实现主题切换
 */

class ThemeTransitionManager {
    constructor() {
        this.isTransitioning = false;
        this.currentTheme = 'dark';
        this.overlay = null;
        this.animationId = null;
        this.startTime = 0;
        this.duration = 800; // 动画持续时间（毫秒）
        this.init();
    }

    init() {
        // 创建圆弧扩散覆盖层
        this.createOverlay();
        // 获取当前主题
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        // 初始化主题切换按钮
        this.initThemeToggle();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'theme-transition-overlay';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.right = '0';
        this.overlay.style.width = '0';
        this.overlay.style.height = '0';
        this.overlay.style.zIndex = '9999';
        this.overlay.style.borderRadius = '50%';
        this.overlay.style.transform = 'translate(50%, -50%)';
        this.overlay.style.transition = 'none';
        this.overlay.style.opacity = '0';
        document.body.appendChild(this.overlay);
    }

    initThemeToggle() {
        // 查找现有的主题切换按钮
        const existingBtn = document.getElementById('theme-toggle-btn');
        if (existingBtn) {
            this.replaceThemeToggle(existingBtn);
        } else {
            // 如果没有找到，等待DOM加载完成后再次尝试
            setTimeout(() => {
                const btn = document.getElementById('theme-toggle-btn');
                if (btn) {
                    this.replaceThemeToggle(btn);
                }
            }, 100);
        }
    }

    replaceThemeToggle(oldBtn) {
        // 创建新的主题切换按钮
        const newBtn = this.createThemeToggleButton();
        
        // 替换旧的按钮
        if (oldBtn.parentNode) {
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        }
        
        // 更新按钮状态
        this.updateButtonState();
    }

    createThemeToggleButton() {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle-btn';
        btn.className = 'theme-toggle-btn';
        btn.title = '切换主题';
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-label', '主题切换按钮');
        
        // 添加图标
        btn.innerHTML = `
            <i class="fas fa-sun icon sun-icon" aria-hidden="true"></i>
            <i class="fas fa-moon icon moon-icon" aria-hidden="true"></i>
        `;
        
        // 添加点击事件
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleTheme();
        });
        
        return btn;
    }

    updateButtonState() {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;
        
        // 移除所有主题类
        btn.classList.remove('light', 'dark');
        
        // 添加当前主题类
        btn.classList.add(this.currentTheme);
        
        // 更新ARIA属性
        btn.setAttribute('aria-label', this.currentTheme === 'light' ? '切换到暗色主题' : '切换到亮色主题');
    }

    async toggleTheme() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        // 获取当前主题
        const currentTheme = this.currentTheme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // 开始动画
        await this.startTransition(newTheme);
        
        // 切换主题
        this.switchTheme(newTheme);
        
        // 结束动画
        await this.endTransition();
        
        this.isTransitioning = false;
    }

    async startTransition(newTheme) {
        return new Promise((resolve) => {
            // 获取视口尺寸
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // 计算最大半径（从右上角到左下角的距离）
            const maxRadius = Math.sqrt(viewportWidth * viewportWidth + viewportHeight * viewportHeight);
            
            // 设置覆盖层样式
            this.overlay.className = `theme-transition-overlay ${newTheme}`;
            this.overlay.style.background = newTheme === 'light' ? '#FFFFFF' : '#0F172A';
            this.overlay.style.opacity = '1';
            
            // 开始动画
            this.startTime = performance.now();
            this.animateTransition(maxRadius, resolve);
        });
    }

    animateTransition(maxRadius, resolve) {
        const animate = (currentTime) => {
            const elapsed = currentTime - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            // 使用缓动函数
            const easeProgress = this.easeInOutCubic(progress);
            
            // 计算当前半径
            const currentRadius = easeProgress * maxRadius;
            
            // 更新覆盖层尺寸
            this.overlay.style.width = `${currentRadius * 2}px`;
            this.overlay.style.height = `${currentRadius * 2}px`;
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                resolve();
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    switchTheme(newTheme) {
        // 更新当前主题
        this.currentTheme = newTheme;
        
        // 保存到本地存储
        localStorage.setItem('theme', newTheme);
        
        // 更新按钮状态
        this.updateButtonState();
        
        // 触发主题切换事件
        this.triggerThemeChange(newTheme);
    }

    async endTransition() {
        return new Promise((resolve) => {
            // 停止动画
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            // 重置覆盖层
            setTimeout(() => {
                this.overlay.style.opacity = '0';
                this.overlay.style.width = '0';
                this.overlay.style.height = '0';
                this.overlay.className = 'theme-transition-overlay';
                
                resolve();
            }, 100);
        });
    }

    triggerThemeChange(newTheme) {
        // 创建自定义事件
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: newTheme,
                previousTheme: this.currentTheme
            }
        });
        
        // 触发事件
        document.dispatchEvent(event);
        
        // 调用现有的主题管理器
        if (window.themeManager && typeof window.themeManager.switchTheme === 'function') {
            window.themeManager.switchTheme(newTheme);
        }
    }

    // 公共方法：手动切换主题
    switchToTheme(theme) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        
        this.startTransition(theme).then(() => {
            this.switchTheme(theme);
            return this.endTransition();
        }).then(() => {
            this.isTransitioning = false;
        });
    }

    // 销毁方法
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// 创建全局实例
window.themeTransitionManager = new ThemeTransitionManager();

// 导出类（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeTransitionManager;
} 