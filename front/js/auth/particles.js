/**
 * 粒子效果管理器
 * 负责登录页面的背景粒子动画效果
 */
class Particles {
    constructor() {
        this.isInitialized = false;
        this.particlesRetryCount = 0;
        this.maxRetries = 3;
    }

    // 初始化粒子效果
    init() {
        if (this.isInitialized) {
            return;
        }

        // 立即尝试初始化粒子效果
        this.setupParticles();
        
        // 延迟再次尝试初始化粒子效果，确保库已加载
        setTimeout(() => {
            this.setupParticles();
        }, 100);
        
        // 再次延迟尝试，确保DOM完全准备好
        setTimeout(() => {
            this.setupParticles();
        }, 500);
        
        // 监听环境变化事件，重新初始化粒子特效
        this.setupEnvironmentChangeListener();
        
        this.isInitialized = true;
    }

    // 设置环境变化监听器
    setupEnvironmentChangeListener() {
        // 监听环境变化事件
        window.addEventListener('environmentChanged', (event) => {
            // 延迟重新初始化粒子特效，确保环境切换完成
            setTimeout(() => {
                this.reinit();
            }, 200);
        });

        // 监听环境重置事件
        window.addEventListener('environmentReset', () => {
            // 延迟重新初始化粒子特效，确保环境重置完成
            setTimeout(() => {
                this.reinit();
            }, 200);
        });

        // 监听强制刷新完成事件
        window.addEventListener('forceRefreshComplete', () => {
            // 延迟重新初始化粒子特效
            setTimeout(() => {
                this.reinit();
            }, 300);
        });
    }

    // 设置粒子背景
    setupParticles() {
        // 检查是否在登录页面
        const loginPage = document.getElementById('login-page');
        if (!loginPage || loginPage.classList.contains('hidden')) {
            // 如果不在登录页面，延迟重试
            if (this.particlesRetryCount < this.maxRetries) {
                this.particlesRetryCount++;
                setTimeout(() => {
                    this.setupParticles();
                }, 500);
            }
            return;
        }

        const particlesContainer = document.getElementById('particles-js');
        if (!particlesContainer) {
            // 如果容器不存在，延迟重试
            if (this.particlesRetryCount < this.maxRetries) {
                this.particlesRetryCount++;
                setTimeout(() => {
                    this.setupParticles();
                }, 200);
            }
            return;
        }

        // 检查particlesJS库是否已加载
        if (typeof particlesJS === 'undefined') {
            // 如果库未加载，延迟重试（最多重试3次）
            if (this.particlesRetryCount < this.maxRetries) {
                this.particlesRetryCount++;
                setTimeout(() => {
                    this.setupParticles();
                }, 200);
            }
            return;
        }

        // 检查容器是否有内容，如果有内容但需要重新初始化，先清空
        if (particlesContainer.children.length > 0) {
            // 如果已经有粒子效果，检查是否需要重新初始化
            const canvas = particlesContainer.querySelector('canvas');
            if (canvas && canvas.width > 0 && canvas.height > 0) {
                // 如果画布正常，不需要重新初始化
                return;
            } else {
                // 如果画布异常，清空容器重新初始化
                particlesContainer.innerHTML = '';
            }
        }

        try {
            // 先设置容器的基本样式，确保立即可见
            particlesContainer.style.position = 'fixed';
            particlesContainer.style.top = '0';
            particlesContainer.style.left = '0';
            particlesContainer.style.width = '100%';
            particlesContainer.style.height = '100%';
            particlesContainer.style.zIndex = '0';
            particlesContainer.style.pointerEvents = 'none';
            
            particlesJS('particles-js', {
                particles: {
                    number: {
                        value: 80,
                        density: {
                            enable: true,
                            value_area: 800
                        }
                    },
                    color: {
                        value: '#ffffff'
                    },
                    shape: {
                        type: 'circle',
                        stroke: {
                            width: 0,
                            color: '#000000'
                        }
                    },
                    opacity: {
                        value: 0.5,
                        random: false,
                        anim: {
                            enable: false,
                            speed: 1,
                            opacity_min: 0.1,
                            sync: false
                        }
                    },
                    size: {
                        value: 3,
                        random: true,
                        anim: {
                            enable: false,
                            speed: 40,
                            size_min: 0.1,
                            sync: false
                        }
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: '#ffffff',
                        opacity: 0.4,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 6,
                        direction: 'none',
                        random: false,
                        straight: false,
                        out_mode: 'out',
                        bounce: false,
                        attract: {
                            enable: false,
                            rotateX: 600,
                            rotateY: 1200
                        }
                    }
                },
                interactivity: {
                    detect_on: 'canvas',
                    events: {
                        onhover: {
                            enable: true,
                            mode: 'repulse'
                        },
                        onclick: {
                            enable: true,
                            mode: 'push'
                        },
                        resize: true
                    },
                    modes: {
                        grab: {
                            distance: 400,
                            line_linked: {
                                opacity: 1
                            }
                        },
                        bubble: {
                            distance: 400,
                            size: 40,
                            duration: 2,
                            opacity: 8,
                            speed: 3
                        },
                        repulse: {
                            distance: 200,
                            duration: 0.4
                        },
                        push: {
                            particles_nb: 4
                        },
                        remove: {
                            particles_nb: 2
                        }
                    }
                },
                retina_detect: true
            });

            // 重置重试计数
            this.particlesRetryCount = 0;

        } catch (error) {
            console.error('粒子特效初始化失败:', error);
            // 如果初始化失败，延迟重试
            if (this.particlesRetryCount < this.maxRetries) {
                this.particlesRetryCount++;
                setTimeout(() => {
                    this.setupParticles();
                }, 300);
            }
        }
    }

    // 销毁粒子效果
    destroy() {
        const particlesContainer = document.getElementById('particles-js');
        if (particlesContainer) {
            particlesContainer.innerHTML = '';
        }
    }

    // 重新初始化粒子效果
    reinit() {
        this.destroy();
        this.particlesRetryCount = 0;
        this.isInitialized = false;
        
        // 延迟重新初始化，确保清理完成
        setTimeout(() => {
            this.init();
        }, 100);
    }

    // 强制重新初始化粒子效果（用于环境切换等场景）
    forceReinit() {
        this.destroy();
        this.particlesRetryCount = 0;
        this.isInitialized = false;
        
        // 延迟重新初始化，确保清理完成
        setTimeout(() => {
            this.setupParticles();
        }, 200);
    }
}

// 导出Particles类
window.ParticlesManager = Particles; 