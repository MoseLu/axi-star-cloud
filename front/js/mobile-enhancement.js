/**
 * 移动端增强功能
 * 提供更好的移动端交互体验
 */

class MobileEnhancement {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTouchDevice = this.detectTouchDevice();
        this.init();
    }

    /**
     * 检测是否为移动设备
     */
    detectMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * 检测是否为触摸设备
     */
    detectTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * 初始化移动端增强功能
     */
    init() {
        this.setupTouchOptimizations();
        this.setupScrollOptimizations();
        this.setupFileTypeFilterOptimizations();
        this.setupFileCardOptimizations();
        this.setupResponsiveAdjustments();
        this.setupPerformanceOptimizations();
    }

    /**
     * 设置触摸优化
     */
    setupTouchOptimizations() {
        if (!this.isTouchDevice) return;

        // 增大触摸目标
        const touchTargets = document.querySelectorAll('.file-card, .folder-card, .file-type-btn, .sub-file-type-btn');
        touchTargets.forEach(target => {
            target.style.minHeight = '44px';
            target.style.minWidth = '44px';
            target.style.webkitTapHighlightColor = 'transparent';
            target.style.userSelect = 'none';
        });

        // 添加触摸反馈
        touchTargets.forEach(target => {
            target.addEventListener('touchstart', this.handleTouchStart.bind(this));
            target.addEventListener('touchend', this.handleTouchEnd.bind(this));
        });
    }

    /**
     * 处理触摸开始事件
     */
    handleTouchStart(event) {
        const target = event.currentTarget;
        target.style.transform = 'scale(0.95)';
        target.style.transition = 'transform 0.1s ease';
    }

    /**
     * 处理触摸结束事件
     */
    handleTouchEnd(event) {
        const target = event.currentTarget;
        setTimeout(() => {
            target.style.transform = '';
            target.style.transition = '';
        }, 100);
    }

    /**
     * 设置滚动优化
     */
    setupScrollOptimizations() {
        if (!this.isTouchDevice) return;

        // 优化文件类型过滤器的滚动
        const fileTypeContainer = document.getElementById('file-type-container');
        if (fileTypeContainer) {
            fileTypeContainer.style.webkitOverflowScrolling = 'touch';
            fileTypeContainer.style.scrollBehavior = 'smooth';
        }

        // 优化主内容区域的滚动
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.webkitOverflowScrolling = 'touch';
        }
    }

    /**
     * 设置文件类型过滤器优化
     */
    setupFileTypeFilterOptimizations() {
        if (!this.isMobile) return;

        // 监听文件类型过滤器的滚动
        const fileTypeContainer = document.getElementById('file-type-container');
        if (fileTypeContainer) {
            this.optimizeFileTypeFilterScroll(fileTypeContainer);
        }

        // 优化子分类展开动画
        this.optimizeSubCategoriesAnimation();
    }

    /**
     * 优化文件类型过滤器滚动
     */
    optimizeFileTypeFilterScroll(container) {
        let isScrolling = false;
        let startX = 0;
        let scrollLeft = 0;

        container.addEventListener('touchstart', (e) => {
            isScrolling = true;
            startX = e.touches[0].pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.touches[0].pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });

        container.addEventListener('touchend', () => {
            isScrolling = false;
        });
    }

    /**
     * 优化子分类展开动画
     */
    optimizeSubCategoriesAnimation() {
        const expandableButtons = document.querySelectorAll('.expandable');
        expandableButtons.forEach(button => {
            // 移除可能存在的旧事件监听器
            button.removeEventListener('click', this.handleExpandableClick);
            
            // 添加新的事件监听器，但不阻止事件冒泡
            button.addEventListener('click', this.handleExpandableClick.bind(this));
        });
    }

    /**
     * 处理可展开按钮的点击事件
     */
    handleExpandableClick(e) {
        // 只在移动端应用优化，且不阻止事件冒泡
        if (this.isMobile) {
            // 在移动端使用更快的动画
            const subContainer = document.getElementById('sub-categories-container');
            if (subContainer) {
                subContainer.style.transition = 'all 0.2s ease';
            }
        }
        // 不调用 preventDefault 或 stopPropagation，让事件继续冒泡到双击处理器
    }

    /**
     * 设置文件卡片优化
     */
    setupFileCardOptimizations() {
        if (!this.isMobile) return;

        // 优化文件卡片的触摸体验
        this.optimizeFileCardTouch();
        
        // 优化文件卡片的加载状态
        this.optimizeFileCardLoading();
    }

    /**
     * 优化文件卡片触摸体验
     */
    optimizeFileCardTouch() {
        const fileCards = document.querySelectorAll('.file-card, .folder-card');
        fileCards.forEach(card => {
            // 防止双击缩放
            card.style.touchAction = 'manipulation';
            
            // 添加长按菜单支持
            let longPressTimer = null;
            
            card.addEventListener('touchstart', (e) => {
                longPressTimer = setTimeout(() => {
                    this.showContextMenu(e, card);
                }, 500);
            });

            card.addEventListener('touchend', () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });

            card.addEventListener('touchmove', () => {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });
        });
    }

    /**
     * 显示上下文菜单
     */
    showContextMenu(event, card) {
        event.preventDefault();
        
        // 创建简单的上下文菜单
        const menu = document.createElement('div');
        menu.className = 'mobile-context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${event.touches[0].clientY}px;
            left: ${event.touches[0].clientX}px;
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        const actions = [
            { text: '预览', icon: 'fa-eye' },
            { text: '下载', icon: 'fa-download' },
            { text: '删除', icon: 'fa-trash' }
        ];

        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'mobile-context-menu-item';
            button.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: none;
                border: none;
                color: white;
                font-size: 14px;
                cursor: pointer;
                border-radius: 4px;
                width: 100%;
                text-align: left;
            `;
            button.innerHTML = `<i class="fa ${action.icon}"></i>${action.text}`;
            
            button.addEventListener('click', () => {
                document.body.removeChild(menu);
                // 这里可以添加具体的操作逻辑
            });
            
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'transparent';
            });
            
            menu.appendChild(button);
        });

        document.body.appendChild(menu);

        // 点击其他地方关闭菜单
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('touchstart', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
            document.addEventListener('touchstart', closeMenu);
        }, 100);
    }

    /**
     * 优化文件卡片加载状态
     */
    optimizeFileCardLoading() {
        // 监听文件加载状态
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('loading')) {
                        target.style.opacity = '0.7';
                        target.style.pointerEvents = 'none';
                    } else {
                        target.style.opacity = '';
                        target.style.pointerEvents = '';
                    }
                }
            });
        });

        const fileCards = document.querySelectorAll('.file-card, .folder-card');
        fileCards.forEach(card => {
            observer.observe(card, { attributes: true });
        });
    }

    /**
     * 设置响应式调整
     */
    setupResponsiveAdjustments() {
        // 监听窗口大小变化
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 初始调整
        this.handleResize();
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const newIsMobile = this.detectMobile();
        
        if (newIsMobile !== this.isMobile) {
            this.isMobile = newIsMobile;
            this.updateLayoutForScreenSize();
        }
    }

    /**
     * 根据屏幕大小更新布局
     */
    updateLayoutForScreenSize() {
        if (this.isMobile) {
            this.applyMobileLayout();
        } else {
            this.applyDesktopLayout();
        }
    }

    /**
     * 应用移动端布局
     */
    applyMobileLayout() {
        // 调整文件网格布局
        const filesGrid = document.getElementById('files-grid');
        const foldersGrid = document.getElementById('folders-grid');
        
        if (filesGrid) {
            filesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
            filesGrid.style.gap = '0.75rem';
            filesGrid.style.padding = '0.5rem';
        }
        
        if (foldersGrid) {
            foldersGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
            foldersGrid.style.gap = '0.75rem';
            foldersGrid.style.padding = '0.5rem';
        }

        // 调整文件类型过滤器
        const fileTypeContainer = document.getElementById('file-type-container');
        if (fileTypeContainer) {
            fileTypeContainer.style.gap = '0.5rem';
            fileTypeContainer.style.paddingBottom = '0.5rem';
        }
    }

    /**
     * 应用桌面端布局
     */
    applyDesktopLayout() {
        // 恢复桌面端布局
        const filesGrid = document.getElementById('files-grid');
        const foldersGrid = document.getElementById('folders-grid');
        
        if (filesGrid) {
            filesGrid.style.gridTemplateColumns = '';
            filesGrid.style.gap = '';
            filesGrid.style.padding = '';
        }
        
        if (foldersGrid) {
            foldersGrid.style.gridTemplateColumns = '';
            foldersGrid.style.gap = '';
            foldersGrid.style.padding = '';
        }

        // 恢复文件类型过滤器
        const fileTypeContainer = document.getElementById('file-type-container');
        if (fileTypeContainer) {
            fileTypeContainer.style.gap = '';
            fileTypeContainer.style.paddingBottom = '';
        }
    }

    /**
     * 设置性能优化
     */
    setupPerformanceOptimizations() {
        // 使用 Intersection Observer 优化图片加载
        this.setupLazyLoading();
        
        // 优化动画性能
        this.optimizeAnimations();
    }

    /**
     * 设置懒加载
     */
    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });

        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => observer.observe(img));
    }

    /**
     * 优化动画性能
     */
    optimizeAnimations() {
        const animatedElements = document.querySelectorAll('.file-card, .folder-card, .file-type-btn, .sub-file-type-btn');
        animatedElements.forEach(element => {
            element.style.willChange = 'transform';
            element.style.backfaceVisibility = 'hidden';
            element.style.transform = 'translateZ(0)';
        });
    }

    /**
     * 获取设备信息
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTouchDevice: this.isTouchDevice,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio
        };
    }
}

// 在页面加载完成后初始化移动端增强功能
document.addEventListener('DOMContentLoaded', () => {
    window.mobileEnhancement = new MobileEnhancement();
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileEnhancement;
} 