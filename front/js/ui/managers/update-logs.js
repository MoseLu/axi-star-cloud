/**
 * 更新日志管理器
 */
class UpdateLogsManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.bindUpdateLogsButton();
    }

    /**
     * 绑定更新日志按钮事件
     */
    bindUpdateLogsButton() {
        const updateLogsBtn = document.getElementById('update-logs-btn');
        if (updateLogsBtn) {
            updateLogsBtn.addEventListener('click', () => {
                this.showUpdateLogsModal();
            });
        }
    }

    /**
     * 显示更新日志模态框
     */
    showUpdateLogsModal() {
        this.createUpdateLogsModal();
        
        const modal = document.getElementById('update-logs-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadUpdateLogs();
        }
    }

    /**
     * 隐藏更新日志模态框
     */
    hideUpdateLogsModal() {
        const modal = document.getElementById('update-logs-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * 创建更新日志模态框
     */
    createUpdateLogsModal() {
        // 检查是否已存在
        if (document.getElementById('update-logs-modal')) {
            return;
        }

        const modalHTML = `
            <div id="update-logs-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 hidden">
                <div id="update-logs-modal-content" class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-green-400/30 overflow-hidden transition-all duration-300">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-green-300">更新日志</h3>
                        <div class="flex items-center space-x-2">
                            <button id="update-logs-close-btn" class="text-gray-400 hover:text-white transition-colors" title="关闭">
                                <i class="fa fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
                        <div id="update-logs-content" class="prose prose-invert max-w-none">
                            <!-- 更新日志内容将通过JavaScript动态加载 -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.bindUpdateLogsCloseButton();
        this.bindUpdateLogsKeyboardEvents();
    }

    /**
     * 绑定更新日志关闭按钮事件
     */
    bindUpdateLogsCloseButton() {
        const closeBtn = document.getElementById('update-logs-close-btn');
        if (closeBtn) {
            closeBtn.removeEventListener('click', this.hideUpdateLogsModal);
            closeBtn.addEventListener('click', () => {
                this.hideUpdateLogsModal();
            });
        }
    }

    /**
     * 绑定更新日志键盘事件
     */
    bindUpdateLogsKeyboardEvents() {
        if (this.handleUpdateLogsKeydown) {
            document.removeEventListener('keydown', this.handleUpdateLogsKeydown);
        }
        
        this.handleUpdateLogsKeydown = (e) => {
            const modal = document.getElementById('update-logs-modal');
            if (modal && !modal.classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    this.hideUpdateLogsModal();
                }
            }
        };
        
        document.addEventListener('keydown', this.handleUpdateLogsKeydown);
    }

    /**
     * 加载更新日志
     */
    async loadUpdateLogs() {
        try {
            let apiUrl = '/api/update-logs';
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                apiUrl = window.apiGateway.buildUrl('/api/update-logs');
            } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                apiUrl = window.APP_UTILS.buildApiUrl('/api/update-logs');
            }
            
            const response = await fetch(apiUrl);
            const result = await response.json();
            
            if (result.success && result.data) {
                this.renderUpdateLogs(result.data);
            } else {
                console.error('获取更新日志失败:', result.message || '未知错误');
                this.renderUpdateLogs([]);
            }
        } catch (error) {
            console.error('获取更新日志出错:', error);
            this.renderUpdateLogs([]);
        }
    }

    /**
     * 渲染更新日志
     */
    renderUpdateLogs(logs) {
        const container = document.getElementById('update-logs-content');
        if (!container) {
            console.error('更新日志容器未找到');
            return;
        }

        if (!logs || logs.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">暂无更新日志</p>';
            return;
        }

        // 构建更新日志内容
        let html = '';
        
        logs.forEach((log, index) => {
            if (!log.version || !log.title) {
                return;
            }
            
            const releaseDate = log.release_date ? 
                (window.dayjs ? dayjs(log.release_date).format('YYYY年MM月DD日') : new Date(log.release_date).toLocaleDateString('zh-CN')) : 
                '未知日期';
            
            html += `### ${log.version} (${releaseDate}) - ${log.title}\n`;
            
            // 渲染功能列表
            if (log.features && log.features.length > 0) {
                html += `#### 新增功能\n`;
                log.features.forEach(feature => {
                    html += `- ✅ **${feature}**\n`;
                });
                html += `\n`;
            }

            // 渲染功能详情
            if (log.description) {
                html += `#### 功能详情\n`;
                html += `- **${log.description}**\n\n`;
            }

            // 渲染已知问题
            if (log.known_issues && log.known_issues.length > 0) {
                html += `#### 已知问题\n`;
                log.known_issues.forEach(issue => {
                    html += `- ${issue}\n`;
                });
                html += `\n`;
            }

            // 添加分隔线（除了最后一个）
            if (index < logs.length - 1) {
                html += `---\n\n`;
            }
        });

        // 使用marked.js渲染Markdown
        if (window.marked) {
            container.innerHTML = marked.parse(html);
        } else {
            container.innerHTML = html;
        }
        
        this.addUpdateLogsStyles();
    }

    /**
     * 添加更新日志样式
     */
    addUpdateLogsStyles() {
        const container = document.getElementById('update-logs-content');
        if (!container) return;

        const style = document.createElement('style');
        style.textContent = `
            #update-logs-content h3 {
                color: #10b981;
                font-size: 1.875rem;
                font-weight: 700;
                margin-bottom: 1rem;
            }
            
            #update-logs-content h4 {
                color: #34d399;
                font-size: 1.5rem;
                font-weight: 600;
                margin-top: 2rem;
                margin-bottom: 1rem;
            }
            
            #update-logs-content ul {
                margin-left: 1.5rem;
                margin-bottom: 1rem;
            }
            
            #update-logs-content li {
                margin-bottom: 0.5rem;
                color: #d1d5db;
            }
            
            #update-logs-content p {
                margin-bottom: 1rem;
                color: #d1d5db;
                line-height: 1.6;
            }
            
            #update-logs-content strong {
                color: #fbbf24;
                font-weight: 600;
            }
            
            #update-logs-content hr {
                border-color: #374151;
                margin: 2rem 0;
            }
        `;
        
        if (!document.getElementById('update-logs-styles')) {
            style.id = 'update-logs-styles';
            document.head.appendChild(style);
        }
    }
}

// 创建全局实例
window.updateLogsManager = new UpdateLogsManager();