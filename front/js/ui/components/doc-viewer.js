/**
 * 文档查看器组件
 * 用于显示系统文档的模态框
 */

class DocViewer {
    constructor() {
        this.currentDoc = 'INDEX.md';
        this.docs = []; // 动态加载文档列表
        this.modal = null;
    }

    async init() {
        await this.loadDocsList(); // 动态加载文档列表
        this.createModal();
        this.addStyles();
        this.bindEvents();
    }

    // 动态加载文档列表
    async loadDocsList() {
        try {
            const response = await fetch('/api/docs/list');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success && data.docs) {
                this.docs = data.docs;
                
                // 如果模态框已存在，重新渲染文档列表
                if (this.modal) {
                    this.renderDocsList();
                }
            } else {
                // 如果API失败，使用默认文档列表作为后备
                this.docs = [
                    { id: 'INDEX.md', title: '文档目录', icon: '📚' },
                    { id: 'README.md', title: '项目概述', icon: '📖' },
                    { id: 'UPLOAD_LIMITS.md', title: '上传限制', icon: '📋' },
                    { id: 'LICENSE.md', title: '许可证', icon: '⚖️' },
                    { id: 'ENV_USAGE_EXAMPLES.md', title: '环境使用示例', icon: '⚙️' },
                    { id: 'CSS_README.md', title: 'CSS样式文档', icon: '🎨' },
                    { id: 'HTML_README.md', title: 'HTML文档', icon: '🌐' },
                    { id: 'API_README.md', title: 'API接口文档', icon: '🔌' },
                    { id: 'AUTH_SYSTEM.md', title: '认证系统文档', icon: '🔐' },
                    { id: 'BACKEND_OPTIMIZATION.md', title: '后端优化文档', icon: '⚡' },
                    { id: 'BACKEND_FURTHER_OPTIMIZATION.md', title: '后端进一步优化', icon: '🚀' },
                    { id: 'FRONTEND_FURTHER_OPTIMIZATION.md', title: '前端进一步优化', icon: '🎯' },
                    { id: 'MAIN_SIMPLIFICATION.md', title: '主要简化文档', icon: '📝' },
                    { id: 'IS_ADMIN_REMOVAL_SUMMARY.md', title: 'is_admin移除总结', icon: '🗑️' }
                ];
                
                // 如果模态框已存在，重新渲染文档列表
                if (this.modal) {
                    this.renderDocsList();
                }
            }
        } catch (error) {
            console.error('加载文档列表失败:', error);
            // 使用默认文档列表作为后备
            this.docs = [
                { id: 'INDEX.md', title: '文档目录', icon: '📚' },
                { id: 'README.md', title: '项目概述', icon: '📖' },
                { id: 'UPLOAD_LIMITS.md', title: '上传限制', icon: '📋' },
                { id: 'LICENSE.md', title: '许可证', icon: '⚖️' },
                { id: 'ENV_USAGE_EXAMPLES.md', title: '环境使用示例', icon: '⚙️' },
                { id: 'CSS_README.md', title: 'CSS样式文档', icon: '🎨' },
                { id: 'HTML_README.md', title: 'HTML文档', icon: '🌐' },
                { id: 'API_README.md', title: 'API接口文档', icon: '🔌' },
                { id: 'AUTH_SYSTEM.md', title: '认证系统文档', icon: '🔐' },
                { id: 'BACKEND_OPTIMIZATION.md', title: '后端优化文档', icon: '⚡' },
                { id: 'BACKEND_FURTHER_OPTIMIZATION.md', title: '后端进一步优化', icon: '🚀' },
                { id: 'FRONTEND_FURTHER_OPTIMIZATION.md', title: '前端进一步优化', icon: '🎯' },
                { id: 'MAIN_SIMPLIFICATION.md', title: '主要简化文档', icon: '📝' },
                { id: 'IS_ADMIN_REMOVAL_SUMMARY.md', title: 'is_admin移除总结', icon: '🗑️' }
            ];
            
            // 如果模态框已存在，重新渲染文档列表
            if (this.modal) {
                this.renderDocsList();
            }
        }
    }

    // 重新渲染文档列表
    renderDocsList() {
        const docNav = this.modal.querySelector('.doc-nav');
        if (docNav) {
            docNav.innerHTML = this.docs.map(doc => `
                <div class="doc-nav-item ${doc.id === this.currentDoc ? 'active' : ''}" data-doc="${doc.id}">
                    <span class="doc-nav-icon">${doc.icon}</span>
                    <span class="doc-nav-title">${doc.title}</span>
                </div>
            `).join('');
            
            // 重新绑定事件
            this.bindDocNavEvents();
        }
    }

    // 绑定文档导航事件
    bindDocNavEvents() {
        this.modal.querySelectorAll('.doc-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const docId = item.dataset.doc;
                this.switchDocument(docId);
            });
        });
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'doc-viewer-modal';
        modal.className = 'doc-viewer-modal';
        modal.innerHTML = `
            <div class="doc-viewer-content">
                <div class="doc-viewer-header">
                    <h3 class="doc-viewer-title">系统文档</h3>
                    <div class="doc-viewer-controls">
                        <button class="doc-viewer-refresh" title="刷新文档列表">
                            <i class="fa fa-refresh"></i>
                        </button>
                        <button class="doc-viewer-fullscreen" title="全屏">
                            <i class="fa fa-expand"></i>
                        </button>
                        <button class="doc-viewer-close" title="关闭">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="doc-viewer-body">
                    <div class="doc-sidebar">
                        <div class="doc-nav">
                            ${this.docs.map(doc => `
                                <div class="doc-nav-item ${doc.id === this.currentDoc ? 'active' : ''}" data-doc="${doc.id}">
                                    <span class="doc-nav-icon">${doc.icon}</span>
                                    <span class="doc-nav-title">${doc.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="doc-content">
                        <div class="doc-loading">
                            <i class="fa fa-spinner fa-spin"></i>
                            <span>加载中...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
        this.loadDocument(this.currentDoc);
    }

    bindEvents() {
        // 关闭按钮
        this.modal.querySelector('.doc-viewer-close').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hide();
        });

        // 全屏按钮
        this.modal.querySelector('.doc-viewer-fullscreen').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // 刷新按钮
        this.modal.querySelector('.doc-viewer-refresh').addEventListener('click', async () => {
            // 显示刷新状态
            const refreshBtn = this.modal.querySelector('.doc-viewer-refresh i');
            const originalClass = refreshBtn.className;
            refreshBtn.className = 'fa fa-spinner fa-spin';
            
            try {
                await this.loadDocsList();
                // 显示成功提示
                this.showRefreshSuccess();
            } catch (error) {
                console.error('刷新文档列表失败:', error);
                // 显示错误提示
                this.showRefreshError();
            } finally {
                // 恢复原始图标
                refreshBtn.className = originalClass;
            }
        });

        // 点击模态框外部关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // 绑定文档导航事件
        this.bindDocNavEvents();

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                const content = this.modal.querySelector('.doc-viewer-content');
                if (content && content.classList.contains('fullscreen')) {
                    // 如果处于全屏状态，先退出全屏
                    this.exitFullscreen();
                } else {
                    // 否则关闭模态框
                    this.hide();
                }
            }
        });
    }

    // 显示刷新成功提示
    showRefreshSuccess() {
        const content = this.modal.querySelector('.doc-content');
        const originalContent = content.innerHTML;
        
        content.innerHTML = `
            <div class="doc-refresh-success">
                <i class="fa fa-check-circle"></i>
                <h4>刷新成功</h4>
                <p>文档列表已更新，共 ${this.docs.length} 个文档</p>
            </div>
        `;
        
        // 3秒后恢复原始内容
        setTimeout(() => {
            content.innerHTML = originalContent;
        }, 3000);
    }

    // 显示刷新错误提示
    showRefreshError() {
        const content = this.modal.querySelector('.doc-content');
        const originalContent = content.innerHTML;
        
        content.innerHTML = `
            <div class="doc-refresh-error">
                <i class="fa fa-exclamation-triangle"></i>
                <h4>刷新失败</h4>
                <p>无法加载最新的文档列表，使用默认列表</p>
            </div>
        `;
        
        // 3秒后恢复原始内容
        setTimeout(() => {
            content.innerHTML = originalContent;
        }, 3000);
    }

    switchDocument(docId) {
        this.currentDoc = docId;
        
        // 更新导航状态
        this.modal.querySelectorAll('.doc-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.doc === docId);
        });

        // 加载文档
        this.loadDocument(docId);
    }

    async loadDocument(docId) {
        const contentDiv = this.modal.querySelector('.doc-content');
        contentDiv.innerHTML = `
            <div class="doc-loading">
                <i class="fa fa-spinner fa-spin"></i>
                <span>加载中...</span>
            </div>
        `;

        try {
            const response = await fetch(`/docs/${docId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const markdown = await response.text();
            const html = this.convertMarkdownToHtml(markdown);
            
            contentDiv.innerHTML = `
                <div class="doc-markdown">
                    ${html}
                </div>
            `;
        } catch (error) {
            console.error('加载文档失败:', error);
            contentDiv.innerHTML = `
                <div class="doc-error">
                    <i class="fa fa-exclamation-triangle"></i>
                    <h4>加载失败</h4>
                    <p>无法加载文档: ${docId}</p>
                    <p class="doc-error-details">${error.message}</p>
                </div>
            `;
        }
    }

    convertMarkdownToHtml(markdown) {
        // 移除front matter（YAML注释）
        let content = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
        
        // 简单的Markdown转HTML转换
        let html = content
            // 代码块（先处理，避免被其他规则影响）
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // 标题
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体和斜体
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // 处理列表
        const lines = html.split('\n');
        let inList = false;
        let listType = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // 检测列表开始
            if (trimmedLine.match(/^[\*\-] /)) {
                if (!inList) {
                    inList = true;
                    listType = 'ul';
                    lines[i] = '<ul><li>' + trimmedLine.substring(2) + '</li>';
                } else {
                    lines[i] = '<li>' + trimmedLine.substring(2) + '</li>';
                }
            } else if (trimmedLine.match(/^\d+\. /)) {
                if (!inList) {
                    inList = true;
                    listType = 'ol';
                    lines[i] = '<ol><li>' + trimmedLine.replace(/^\d+\. /, '') + '</li>';
                } else {
                    lines[i] = '<li>' + trimmedLine.replace(/^\d+\. /, '') + '</li>';
                }
            } else {
                // 列表结束
                if (inList && trimmedLine !== '') {
                    lines[i] = '</' + listType + '>' + line;
                    inList = false;
                    listType = '';
                }
            }
        }
        
        // 如果列表在文件末尾，需要关闭标签
        if (inList) {
            lines.push('</' + listType + '>');
        }
        
        html = lines.join('\n');
        
        // 处理段落
        html = html
            .replace(/\n\n/g, '</p><p>')
            .replace(/^([^<].*)/gm, '<p>$1</p>');

        // 清理多余的p标签和空行
        html = html
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1')
            .replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1')
            .replace(/<p>(<ol>.*?<\/ol>)<\/p>/g, '$1')
            .replace(/<p>(<pre>.*?<\/pre>)<\/p>/g, '$1');
        
        return html;
    }

    show() {
        if (!this.modal) {
            console.warn('DocViewer modal not initialized yet, creating it now...');
            this.createModal();
        }
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hide() {
        // 如果处于全屏状态，先退出全屏
        const content = this.modal.querySelector('.doc-viewer-content');
        if (content && content.classList.contains('fullscreen')) {
            this.exitFullscreen();
        }
        
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    /**
     * 切换全屏状态
     */
    toggleFullscreen() {
        const content = this.modal.querySelector('.doc-viewer-content');
        if (!content) return;
        
        const isFullscreen = content.classList.contains('fullscreen');
        
        if (isFullscreen) {
            // 退出全屏
            this.exitFullscreen();
        } else {
            // 进入全屏
            this.enterFullscreen();
        }
    }

    /**
     * 进入全屏模式
     */
    enterFullscreen() {
        const content = this.modal.querySelector('.doc-viewer-content');
        const fullscreenBtn = this.modal.querySelector('.doc-viewer-fullscreen');
        
        if (!content || !fullscreenBtn) return;
        
        // 隐藏body滚动条并设置全屏样式
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // 添加全屏样式到模态框和内容
        this.modal.classList.add('fullscreen');
        content.classList.add('fullscreen');
        
        // 更新按钮图标和标题
        const icon = fullscreenBtn.querySelector('i');
        if (icon) {
            icon.className = 'fa fa-window-minimize';
        }
        fullscreenBtn.title = '最小化';
    }

    /**
     * 退出全屏模式
     */
    exitFullscreen() {
        const content = this.modal.querySelector('.doc-viewer-content');
        const fullscreenBtn = this.modal.querySelector('.doc-viewer-fullscreen');
        
        if (!content || !fullscreenBtn) return;
        
        // 恢复body滚动条
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        
        // 移除全屏样式
        this.modal.classList.remove('fullscreen');
        content.classList.remove('fullscreen');
        
        // 更新按钮图标和标题
        const icon = fullscreenBtn.querySelector('i');
        if (icon) {
            icon.className = 'fa fa-expand';
        }
        fullscreenBtn.title = '全屏';
    }

    isVisible() {
        return this.modal.style.display === 'flex';
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .doc-viewer-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            /* 全屏模态框样式 */
            .doc-viewer-modal.fullscreen {
                background: rgba(0, 0, 0, 0.95) !important;
                justify-content: flex-start !important;
                align-items: flex-start !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 10000 !important;
            }

            .doc-viewer-content {
                background: #1a1a1a;
                border-radius: 12px;
                width: 90%;
                max-width: 1200px;
                height: 80%;
                max-height: 800px;
                display: flex;
                flex-direction: column;
                border: 1px solid #333;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* 全屏样式 */
            .doc-viewer-content.fullscreen {
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                max-height: none !important;
                border-radius: 0 !important;
                border: none !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 10001 !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                display: flex !important;
                align-items: stretch !important;
                justify-content: stretch !important;
            }

            /* 明亮主题适配 */
            body.theme-light .doc-viewer-content {
                background: #ffffff;
                border: 1px solid rgba(139, 92, 246, 0.2);
                box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
            }

            body.theme-light .doc-viewer-content.fullscreen {
                border: none;
            }

            .doc-viewer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #333;
                background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
                border-radius: 12px 12px 0 0;
                position: relative;
                z-index: 10002;
            }

            /* 全屏时头部样式 */
            .doc-viewer-content.fullscreen .doc-viewer-header {
                border-radius: 0;
            }

            body.theme-light .doc-viewer-header {
                border-bottom: 1px solid rgba(139, 92, 246, 0.2);
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(255, 255, 255, 0.95) 100%);
            }

            .doc-viewer-title {
                color: #fff;
                font-size: 18px;
                font-weight: 600;
                margin: 0;
            }

            body.theme-light .doc-viewer-title {
                color: #374151;
            }

            .doc-viewer-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .doc-viewer-refresh,
            .doc-viewer-fullscreen,
            .doc-viewer-close {
                background: none;
                border: none;
                color: #888;
                font-size: 20px;
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.3s ease;
                position: relative;
                z-index: 10002;
            }

            .doc-viewer-refresh:hover,
            .doc-viewer-fullscreen:hover,
            .doc-viewer-close:hover {
                color: #fff;
                background: rgba(255, 255, 255, 0.1);
            }

            body.theme-light .doc-viewer-refresh,
            body.theme-light .doc-viewer-fullscreen,
            body.theme-light .doc-viewer-close {
                color: #6b7280;
            }

            body.theme-light .doc-viewer-refresh:hover,
            body.theme-light .doc-viewer-fullscreen:hover,
            body.theme-light .doc-viewer-close:hover {
                color: #374151;
                background: rgba(139, 92, 246, 0.1);
            }

            .doc-viewer-body {
                display: flex;
                flex: 1;
                overflow: hidden;
            }

            .doc-sidebar {
                width: 250px;
                background: #222;
                border-right: 1px solid #333;
                overflow-y: auto;
            }

            body.theme-light .doc-sidebar {
                background: rgba(249, 250, 251, 0.95);
                border-right: 1px solid rgba(139, 92, 246, 0.2);
            }

            .doc-nav {
                padding: 16px 0;
            }

            .doc-nav-item {
                display: flex;
                align-items: center;
                padding: 12px 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #ccc;
                border-left: 3px solid transparent;
            }

            .doc-nav-item:hover {
                background: rgba(255, 255, 255, 0.05);
                color: #fff;
            }

            .doc-nav-item.active {
                background: rgba(139, 92, 246, 0.1);
                color: #8b5cf6;
                border-left-color: #8b5cf6;
            }

            body.theme-light .doc-nav-item {
                color: #6b7280;
            }

            body.theme-light .doc-nav-item:hover {
                background: rgba(139, 92, 246, 0.1);
                color: #8b5cf6;
            }

            body.theme-light .doc-nav-item.active {
                background: rgba(139, 92, 246, 0.15);
                color: #8b5cf6;
                border-left-color: #8b5cf6;
            }

            .doc-nav-icon {
                margin-right: 12px;
                font-size: 16px;
            }

            .doc-nav-title {
                font-size: 14px;
                font-weight: 500;
            }

            .doc-content {
                flex: 1;
                padding: 24px;
                overflow-y: auto;
                background: #1a1a1a;
            }

            body.theme-light .doc-content {
                background: #ffffff;
            }

            .doc-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #888;
                font-size: 16px;
            }

            body.theme-light .doc-loading {
                color: #6b7280;
            }

            .doc-loading i {
                font-size: 24px;
                margin-bottom: 12px;
            }

            .doc-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #ef4444;
                text-align: center;
            }

            body.theme-light .doc-error {
                color: #dc2626;
            }

            .doc-error i {
                font-size: 48px;
                margin-bottom: 16px;
            }

            .doc-error h4 {
                margin: 0 0 8px 0;
                font-size: 18px;
            }

            .doc-error p {
                margin: 0 0 8px 0;
                color: #888;
            }

            .doc-error-details {
                font-size: 12px;
                color: #666;
            }

            body.theme-light .doc-error p {
                color: #6b7280;
            }

            body.theme-light .doc-error-details {
                color: #9ca3af;
            }

            /* 刷新成功提示样式 */
            .doc-refresh-success {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #10b981;
                text-align: center;
            }

            body.theme-light .doc-refresh-success {
                color: #059669;
            }

            .doc-refresh-success i {
                font-size: 48px;
                margin-bottom: 16px;
            }

            .doc-refresh-success h4 {
                margin: 0 0 8px 0;
                font-size: 18px;
            }

            .doc-refresh-success p {
                margin: 0;
                color: #888;
            }

            body.theme-light .doc-refresh-success p {
                color: #6b7280;
            }

            /* 刷新错误提示样式 */
            .doc-refresh-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #ef4444;
                text-align: center;
            }

            body.theme-light .doc-refresh-error {
                color: #dc2626;
            }

            .doc-refresh-error i {
                font-size: 48px;
                margin-bottom: 16px;
            }

            .doc-refresh-error h4 {
                margin: 0 0 8px 0;
                font-size: 18px;
            }

            .doc-refresh-error p {
                margin: 0;
                color: #888;
            }

            body.theme-light .doc-refresh-error p {
                color: #6b7280;
            }

            .doc-markdown {
                color: #e5e5e5;
                line-height: 1.6;
            }

            .doc-markdown h1,
            .doc-markdown h2,
            .doc-markdown h3 {
                color: #fff;
                margin: 24px 0 16px 0;
                font-weight: 600;
            }

            body.theme-light .doc-markdown {
                color: #374151;
            }

            body.theme-light .doc-markdown h1,
            body.theme-light .doc-markdown h2,
            body.theme-light .doc-markdown h3 {
                color: #111827;
            }

            .doc-markdown h1 {
                font-size: 24px;
                border-bottom: 2px solid #333;
                padding-bottom: 8px;
            }

            .doc-markdown h2 {
                font-size: 20px;
                border-bottom: 1px solid #333;
                padding-bottom: 6px;
            }

            body.theme-light .doc-markdown h1 {
                border-bottom: 2px solid rgba(139, 92, 246, 0.3);
            }

            body.theme-light .doc-markdown h2 {
                border-bottom: 1px solid rgba(139, 92, 246, 0.3);
            }

            .doc-markdown h3 {
                font-size: 18px;
            }

            .doc-markdown p {
                margin: 0 0 16px 0;
            }

            .doc-markdown ul,
            .doc-markdown ol {
                margin: 0 0 16px 0;
                padding-left: 24px;
            }

            .doc-markdown li {
                margin: 0 0 8px 0;
            }

            .doc-markdown code {
                background: #333;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
            }

            .doc-markdown pre {
                background: #222;
                padding: 16px;
                border-radius: 8px;
                overflow-x: auto;
                margin: 16px 0;
                border: 1px solid #333;
            }

            .doc-markdown pre code {
                background: none;
                padding: 0;
                color: #e5e5e5;
            }

            body.theme-light .doc-markdown code {
                background: rgba(139, 92, 246, 0.1);
                color: #8b5cf6;
            }

            body.theme-light .doc-markdown pre {
                background: rgba(249, 250, 251, 0.95);
                border: 1px solid rgba(139, 92, 246, 0.2);
            }

            body.theme-light .doc-markdown pre code {
                color: #374151;
            }

            .doc-markdown a {
                color: #8b5cf6;
                text-decoration: none;
                border-bottom: 1px solid transparent;
                transition: border-color 0.3s ease;
            }

            .doc-markdown a:hover {
                border-bottom-color: #8b5cf6;
            }

            .doc-markdown blockquote {
                border-left: 4px solid #8b5cf6;
                margin: 16px 0;
                padding: 0 16px;
                color: #ccc;
                font-style: italic;
            }

            body.theme-light .doc-markdown blockquote {
                color: #6b7280;
            }

            @media (max-width: 768px) {
                .doc-viewer-content {
                    width: 95%;
                    height: 90%;
                }

                .doc-viewer-content.fullscreen {
                    width: 100vw !important;
                    height: 100vh !important;
                    max-width: none !important;
                    max-height: none !important;
                    border-radius: 0 !important;
                    border: none !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    z-index: 10001 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    display: flex !important;
                    align-items: stretch !important;
                    justify-content: stretch !important;
                }

                .doc-sidebar {
                    width: 200px;
                }

                .doc-nav-title {
                    font-size: 12px;
                }
            }
        `

        document.head.appendChild(style);
    }
}

// 全局暴露
window.DocViewer = DocViewer;