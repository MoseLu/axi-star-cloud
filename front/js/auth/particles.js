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
        
        this.isInitialized = true;
    }

    // 设置粒子背景
    setupParticles() {
        // 检查是否在登录页面
        const loginPage = document.getElementById('login-page');
        if (!loginPage || loginPage.classList.contains('hidden')) {
            return;
        }

        const particlesContainer = document.getElementById('particles-js');
        if (!particlesContainer) {
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

        // 检查容器是否有内容
        if (particlesContainer.children.length > 0) {
            return;
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

        } catch (error) {
            // 如果初始化失败，延迟重试
            setTimeout(() => {
                this.setupParticles();
            }, 300);
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
        setTimeout(() => {
            this.setupParticles();
        }, 100);
    }
}

// 导出Particles类
window.ParticlesManager = Particles; 