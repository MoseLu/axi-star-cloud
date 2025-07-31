/**
 * 更新日志管理器
 * 提供独立的更新日志显示功能
 */
class UIUpdateLogsManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindUpdateLogsButton();
        this.createUpdateLogsModal();
    }

    /**
     * 绑定更新日志按钮事件
     */
    bindUpdateLogsButton() {
        // 监听更新日志按钮点击事件
        document.addEventListener('click', (e) => {
            if (e.target.id === 'update-logs-btn' || e.target.closest('#update-logs-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.showUpdateLogsModal();
            }
        });
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
     * 显示更新日志模态框
     */
    showUpdateLogsModal() {
        const modal = document.getElementById('update-logs-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // 加载更新日志
            this.loadUpdateLogs();
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

        // 创建模态框HTML
        const modalHTML = `
            <div id="update-logs-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 hidden">
                <div id="update-logs-modal-content" class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-purple-400/30 overflow-hidden transition-all duration-300">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-purple-300">更新日志</h3>
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

        // 添加到body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 绑定关闭按钮事件
        this.bindCloseButton();
        this.bindKeyboardEvents();
    }

    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // ESC键关闭更新日志模态框
            if (e.key === 'Escape') {
                this.hideUpdateLogsModal();
            }
        });
    }

    /**
     * 绑定关闭按钮事件
     */
    bindCloseButton() {
        const closeBtn = document.getElementById('update-logs-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideUpdateLogsModal();
            });
        }
    }

    /**
     * 动态加载更新日志
     */
    async loadUpdateLogs() {
        try {
            const response = await window.apiGateway.get('/api/update-logs');
            const result = await response.json();
            
            if (result.success && result.data) {
                this.renderUpdateLogs(result.data);
            } else {
                const errorMessage = result.message || result.error || '未知错误';
                console.error('❌ 获取更新日志失败:', errorMessage);
                this.renderUpdateLogs([]);
            }
        } catch (error) {
            const errorMessage = error.message || error.toString() || '网络请求失败';
            console.error('❌ 获取更新日志出错:', errorMessage);
            this.renderUpdateLogs([]);
        }
    }

    /**
     * 渲染更新日志
     */
    renderUpdateLogs(logs) {
        const container = document.getElementById('update-logs-content');
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-4">暂无更新日志</p>';
            return;
        }

        // 构建更新日志内容
        let html = '';
        
        logs.forEach((log, index) => {
            const releaseDate = window.dayjs ? dayjs(log.release_date).format('YYYY年MM月DD日') : new Date(log.release_date).toLocaleDateString('zh-CN');
            
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
        
        // 添加样式
        this.addUpdateLogsStyles();
    }

    /**
     * 添加更新日志样式
     */
    addUpdateLogsStyles() {
        const content = document.getElementById('update-logs-content');
        if (content) {
            // 添加自定义样式类
            content.classList.add('update-logs-content');
            
            // 为标题添加样式
            const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(heading => {
                heading.classList.add('text-purple-300', 'font-bold', 'mb-4', 'mt-6');
            });
            
            // 为段落添加样式
            const paragraphs = content.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.classList.add('text-gray-300', 'mb-3', 'leading-relaxed');
            });
            
            // 为列表添加样式
            const lists = content.querySelectorAll('ul, ol');
            lists.forEach(list => {
                list.classList.add('text-gray-300', 'mb-4', 'pl-6');
            });
            
            // 为列表项添加样式
            const listItems = content.querySelectorAll('li');
            listItems.forEach(li => {
                li.classList.add('mb-2');
            });
            
            // 为代码块添加样式
            const codeBlocks = content.querySelectorAll('code');
            codeBlocks.forEach(code => {
                code.classList.add('bg-dark-light', 'text-green-300', 'px-2', 'py-1', 'rounded', 'text-sm');
            });
            
            // 为链接添加样式
            const links = content.querySelectorAll('a');
            links.forEach(link => {
                link.classList.add('text-blue-400', 'hover:text-blue-300', 'underline');
            });
            
            // 添加主题适配样式
            this.addThemeStyles();
        }
    }
    
    /**
     * 添加主题适配样式
     */
    addThemeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 暗色主题下的更新日志样式 */
            body:not(.theme-light) #update-logs-modal .bg-dark-light {
                background: #1e293b;
                border: 1px solid rgba(139, 92, 246, 0.3);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }
            
            body:not(.theme-light) #update-logs-modal .text-purple-300 {
                color: #c4b5fd !important;
            }
            
            body:not(.theme-light) #update-logs-modal .text-gray-300 {
                color: #d1d5db !important;
            }
            
            body:not(.theme-light) #update-logs-modal .text-gray-400 {
                color: #9ca3af !important;
            }
            
            body:not(.theme-light) #update-logs-modal .text-gray-400:hover {
                color: #d1d5db !important;
            }
            
            body:not(.theme-light) #update-logs-modal .bg-dark-light.text-green-300 {
                background: rgba(34, 197, 94, 0.1) !important;
                color: #86efac !important;
            }
            
            body:not(.theme-light) #update-logs-modal .text-blue-400 {
                color: #60a5fa !important;
            }
            
            body:not(.theme-light) #update-logs-modal .text-blue-400:hover {
                color: #93c5fd !important;
            }
            
            /* 暗色主题下的标题样式 */
            body:not(.theme-light) #update-logs-modal h1,
            body:not(.theme-light) #update-logs-modal h2,
            body:not(.theme-light) #update-logs-modal h3,
            body:not(.theme-light) #update-logs-modal h4,
            body:not(.theme-light) #update-logs-modal h5,
            body:not(.theme-light) #update-logs-modal h6 {
                color: #c4b5fd !important;
            }
            
            /* 暗色主题下的段落样式 */
            body:not(.theme-light) #update-logs-modal p {
                color: #d1d5db !important;
            }
            
            /* 暗色主题下的列表样式 */
            body:not(.theme-light) #update-logs-modal ul,
            body:not(.theme-light) #update-logs-modal ol {
                color: #d1d5db !important;
            }
            
            /* 暗色主题下的代码块样式 */
            body:not(.theme-light) #update-logs-modal pre {
                background: rgba(30, 41, 59, 0.95) !important;
                border: 1px solid rgba(139, 92, 246, 0.3) !important;
                color: #d1d5db !important;
            }
            
            /* 暗色主题下的引用块样式 */
            body:not(.theme-light) #update-logs-modal blockquote {
                border-left: 4px solid #8b5cf6 !important;
                color: #9ca3af !important;
                background: rgba(139, 92, 246, 0.1) !important;
                padding: 12px 16px !important;
                margin: 16px 0 !important;
                border-radius: 0 4px 4px 0 !important;
            }
            
            /* 暗色主题下的滚动条样式 */
            body:not(.theme-light) #update-logs-modal ::-webkit-scrollbar {
                width: 8px;
            }
            
            body:not(.theme-light) #update-logs-modal ::-webkit-scrollbar-track {
                background: rgba(30, 41, 59, 0.5);
                border-radius: 4px;
            }
            
            body:not(.theme-light) #update-logs-modal ::-webkit-scrollbar-thumb {
                background: rgba(139, 92, 246, 0.3);
                border-radius: 4px;
            }
            
            body:not(.theme-light) #update-logs-modal ::-webkit-scrollbar-thumb:hover {
                background: rgba(139, 92, 246, 0.5);
            }
            
            /* 暗色主题下的状态标签样式 */
            body:not(.theme-light) #update-logs-modal .text-orange-300 {
                color: #fdba74 !important;
            }
            
            body:not(.theme-light) #update-logs-modal .text-yellow-300 {
                color: #fde047 !important;
            }
            
            body:not(.theme-light) #update-logs-modal .text-green-300 {
                color: #86efac !important;
            }
            
            body:not(.theme-light) #update-logs-modal .bg-orange-500\/40 {
                background-color: rgba(249, 115, 22, 0.4) !important;
            }
            
            body:not(.theme-light) #update-logs-modal .bg-yellow-500\/40 {
                background-color: rgba(234, 179, 8, 0.4) !important;
            }
            
            body:not(.theme-light) #update-logs-modal .bg-green-500\/40 {
                background-color: rgba(34, 197, 94, 0.4) !important;
            }
            
            body:not(.theme-light) #update-logs-modal .border-orange-400 {
                border-color: #fb923c !important;
            }
            
            body:not(.theme-light) #update-logs-modal .border-yellow-400 {
                border-color: #facc15 !important;
            }
            
            body:not(.theme-light) #update-logs-modal .border-green-400 {
                border-color: #4ade80 !important;
            }
            
            /* 亮色主题下的更新日志样式 */
            body.theme-light #update-logs-modal .bg-dark-light {
                background: #ffffff;
                border: 1px solid rgba(139, 92, 246, 0.2);
                box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
            }
            
            body.theme-light #update-logs-modal .text-purple-300 {
                color: #8b5cf6 !important;
            }
            
            body.theme-light #update-logs-modal .text-gray-300 {
                color: #374151 !important;
            }
            
            body.theme-light #update-logs-modal .text-gray-400 {
                color: #6b7280 !important;
            }
            
            body.theme-light #update-logs-modal .text-gray-400:hover {
                color: #374151 !important;
            }
            
            body.theme-light #update-logs-modal .bg-dark-light.text-green-300 {
                background: rgba(139, 92, 246, 0.1) !important;
                color: #8b5cf6 !important;
            }
            
            body.theme-light #update-logs-modal .text-blue-400 {
                color: #8b5cf6 !important;
            }
            
            body.theme-light #update-logs-modal .text-blue-400:hover {
                color: #7c3aed !important;
            }
            
            /* 亮色主题下的标题样式 */
            body.theme-light #update-logs-modal h1,
            body.theme-light #update-logs-modal h2,
            body.theme-light #update-logs-modal h3,
            body.theme-light #update-logs-modal h4,
            body.theme-light #update-logs-modal h5,
            body.theme-light #update-logs-modal h6 {
                color: #111827 !important;
            }
            
            /* 亮色主题下的段落样式 */
            body.theme-light #update-logs-modal p {
                color: #374151 !important;
            }
            
            /* 亮色主题下的列表样式 */
            body.theme-light #update-logs-modal ul,
            body.theme-light #update-logs-modal ol {
                color: #374151 !important;
            }
            
            /* 亮色主题下的代码块样式 */
            body.theme-light #update-logs-modal pre {
                background: rgba(249, 250, 251, 0.95) !important;
                border: 1px solid rgba(139, 92, 246, 0.2) !important;
                color: #374151 !important;
            }
            
            /* 亮色主题下的引用块样式 */
            body.theme-light #update-logs-modal blockquote {
                border-left: 4px solid #8b5cf6 !important;
                color: #6b7280 !important;
                background: rgba(139, 92, 246, 0.05) !important;
                padding: 12px 16px !important;
                margin: 16px 0 !important;
                border-radius: 0 4px 4px 0 !important;
            }
            
            /* 亮色主题下的滚动条样式 */
            body.theme-light #update-logs-modal ::-webkit-scrollbar {
                width: 8px;
            }
            
            body.theme-light #update-logs-modal ::-webkit-scrollbar-track {
                background: rgba(249, 250, 251, 0.5);
                border-radius: 4px;
            }
            
            body.theme-light #update-logs-modal ::-webkit-scrollbar-thumb {
                background: rgba(139, 92, 246, 0.3);
                border-radius: 4px;
            }
            
            body.theme-light #update-logs-modal ::-webkit-scrollbar-thumb:hover {
                background: rgba(139, 92, 246, 0.5);
            }
            
            /* 亮色主题下的状态标签样式 */
            body.theme-light #update-logs-modal .text-orange-300 {
                color: #ea580c !important;
            }
            
            body.theme-light #update-logs-modal .text-yellow-300 {
                color: #ca8a04 !important;
            }
            
            body.theme-light #update-logs-modal .text-green-300 {
                color: #16a34a !important;
            }
            
            body.theme-light #update-logs-modal .bg-orange-500\/40 {
                background-color: rgba(249, 115, 22, 0.4) !important;
            }
            
            body.theme-light #update-logs-modal .bg-yellow-500\/40 {
                background-color: rgba(234, 179, 8, 0.4) !important;
            }
            
            body.theme-light #update-logs-modal .bg-green-500\/40 {
                background-color: rgba(34, 197, 94, 0.4) !important;
            }
            
            body.theme-light #update-logs-modal .border-orange-400 {
                border-color: #fb923c !important;
            }
            
            body.theme-light #update-logs-modal .border-yellow-400 {
                border-color: #facc15 !important;
            }
            
            body.theme-light #update-logs-modal .border-green-400 {
                border-color: #4ade80 !important;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 创建全局实例
window.updateLogsManager = new UIUpdateLogsManager();

// 全局暴露
window.UIUpdateLogsManager = UIUpdateLogsManager;