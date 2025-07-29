/**
 * 帮助文档管理器
 * 提供完整的用户帮助文档和常见问题解答
 */
class UIHelpManager {
    constructor() {
        this.helpContent = this.getHelpContent();
        this.init();
    }

    init() {
        this.bindHelpButton();
        this.createHelpModal();
    }

    /**
     * 绑定帮助按钮事件
     */
    bindHelpButton() {
        // 监听帮助按钮点击事件
        document.addEventListener('click', (e) => {
            if (e.target.id === 'help-btn' || e.target.closest('#help-btn')) {
                this.showHelpModal();
            }
        });
<<<<<<< HEAD

        // 添加下拉菜单的JavaScript控制
        this.bindDropdownMenu();
    }

    /**
     * 绑定下拉菜单事件
     */
    bindDropdownMenu() {
        const userButton = document.querySelector('.relative.group button');
        const dropdownMenu = document.querySelector('.relative.group .absolute');
        
        if (userButton && dropdownMenu) {
            // 鼠标进入显示菜单
            userButton.addEventListener('mouseenter', () => {
                dropdownMenu.style.opacity = '1';
                dropdownMenu.style.visibility = 'visible';
            });

            // 鼠标离开隐藏菜单
            userButton.addEventListener('mouseleave', () => {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
            });

            // 鼠标进入菜单保持显示
            dropdownMenu.addEventListener('mouseenter', () => {
                dropdownMenu.style.opacity = '1';
                dropdownMenu.style.visibility = 'visible';
            });

            // 鼠标离开菜单隐藏
            dropdownMenu.addEventListener('mouseleave', () => {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
            });
        }
=======
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
    }

    /**
     * 显示帮助模态框
     */
    showHelpModal() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.classList.remove('hidden');
<<<<<<< HEAD
=======
    
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
        } else {
            console.error('❌ Help modal not found');
        }
    }

    /**
     * 隐藏帮助模态框
     */
    hideHelpModal() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * 创建帮助模态框
     */
    createHelpModal() {
        // 检查是否已存在
        if (document.getElementById('help-modal')) {
            return;
        }

        // 创建模态框HTML
        const modalHTML = `
            <div id="help-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 hidden">
                <div id="help-modal-content" class="bg-dark-light rounded-xl p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl border border-purple-400/30 overflow-hidden transition-all duration-300">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-purple-300">帮助文档</h3>
                        <div class="flex items-center space-x-2">
                            <button id="help-close-btn" class="text-gray-400 hover:text-white transition-colors" title="关闭">
                                <i class="fa fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
                        <div id="help-content" class="prose prose-invert max-w-none">
                            <!-- 帮助文档内容将通过JavaScript动态加载 -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
<<<<<<< HEAD
        // 绑定关闭按钮事件
=======
        // 移除全屏按钮事件绑定
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
        this.bindCloseButton(); // 绑定关闭按钮事件
        this.bindKeyboardEvents(); // 绑定键盘事件
        
        // 渲染内容
        this.renderHelpContent();
    }

    /**
     * 绑定关闭按钮事件
     */
    bindCloseButton() {
        const closeBtn = document.getElementById('help-close-btn');
        if (closeBtn) {
<<<<<<< HEAD
            closeBtn.removeEventListener('click', this.hideHelpModal);
=======
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
            closeBtn.addEventListener('click', () => {
                this.hideHelpModal();
            });
        }
    }

    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('help-modal');
            if (!modal || modal.classList.contains('hidden')) return;
            
            if (e.key === 'Escape') {
                const modalContent = document.getElementById('help-modal-content');
                if (modalContent && modalContent.classList.contains('fullscreen')) {
                    // 如果处于全屏状态，先退出全屏
                    // this.exitFullscreen(); // 移除此方法
                } else {
                    // 否则关闭模态框
                    this.hideHelpModal();
                }
            }
        });
    }

    /**
     * 渲染帮助内容
     */
    renderHelpContent() {
        const content = document.getElementById('help-content');
        if (content && window.marked) {
            // 使用marked.js渲染Markdown
            content.innerHTML = marked.parse(this.helpContent);
            
            // 添加自定义样式
            this.addHelpStyles();
            
            // 添加目录跳转功能
            this.addTableOfContents();
<<<<<<< HEAD
        } else if (content) {
            // 降级处理：直接显示原始内容
            content.innerHTML = this.helpContent;
=======
            
            // 动态加载更新日志
            this.loadUpdateLogs();
    
        } else if (content) {
            // 降级处理：直接显示原始内容
            content.innerHTML = this.helpContent;
    
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
        }
    }

    /**
     * 添加目录跳转功能
     */
    addTableOfContents() {
        const content = document.getElementById('help-content');
        if (!content) return;

        // 为所有标题添加ID
        const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
            const text = heading.textContent.trim();
            // 移除emoji和特殊字符，生成干净的ID
            const cleanText = text.replace(/[📖🚀📁📂📊⚙️❓🔧🏷️]/g, '').trim();
            const id = `heading-${index}-${cleanText.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            heading.id = id;
        });

        // 动态生成目录链接
        this.updateTableOfContentsLinks();

        // 为目录链接添加点击事件
        const tocLinks = content.querySelectorAll('a[href^="#"]');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                let targetId = link.getAttribute('href').substring(1);
                
                // 解码URL编码的ID
                targetId = decodeURIComponent(targetId);
                
                const targetElement = document.getElementById(targetId);
                
<<<<<<< HEAD
=======

                
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
                if (targetElement) {
                    // 获取模态框的滚动容器
                    const modal = document.getElementById('help-modal');
                    const scrollContainer = modal ? modal.querySelector('.overflow-y-auto') : null;
                    
                    if (scrollContainer) {
                        // 计算目标元素相对于滚动容器的位置
                        const containerRect = scrollContainer.getBoundingClientRect();
                        const targetRect = targetElement.getBoundingClientRect();
                        const scrollTop = scrollContainer.scrollTop;
                        const targetTop = targetRect.top - containerRect.top + scrollTop - 20; // 20px 偏移
                        
<<<<<<< HEAD
=======

                        
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
                        // 平滑滚动到目标位置
                        scrollContainer.scrollTo({
                            top: targetTop,
                            behavior: 'smooth'
                        });
                    } else {
                        // 降级方案：使用默认滚动
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                    
                    // 添加高亮效果
                    targetElement.classList.add('bg-purple-500/20', 'border-l-4', 'border-purple-400', 'pl-4', 'py-2');
                    setTimeout(() => {
                        targetElement.classList.remove('bg-purple-500/20', 'border-l-4', 'border-purple-400', 'pl-4', 'py-2');
                    }, 3000);
                }
            });
        });
    }

    /**
     * 更新目录链接
     */
    updateTableOfContentsLinks() {
        const content = document.getElementById('help-content');
        if (!content) return;

        // 找到目录区域
        const tocSection = content.querySelector('h2');
        if (!tocSection || !tocSection.textContent.includes('目录')) return;

        // 只获取h2标题（一级标题）
        const headings = content.querySelectorAll('h2');
        const mainHeadings = [];
        
        headings.forEach((heading, index) => {
            const text = heading.textContent.trim();
            // 跳过目录标题
            if (text.includes('目录')) return;
            
            // 使用实际的ID，而不是重新生成
            const actualId = heading.id;
            // 移除所有表情符号和特殊字符，只保留中文、英文、数字
            let cleanText = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1FAB0}-\u{1FABF}]|[\u{1FAC0}-\u{1FAFF}]|[\u{1FAD0}-\u{1FAFF}]|[\u{1FAE0}-\u{1FAFF}]|[\u{1FAF0}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]/gu, '').replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ').replace(/\s+/g, ' ').trim();
            
<<<<<<< HEAD
=======

            
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
            mainHeadings.push({
                text: cleanText,
                id: actualId,
                index: index
            });
        });

        // 生成目录HTML
        let tocHTML = '';
        mainHeadings.forEach(heading => {
            tocHTML += `<li class="text-left pl-0"><a href="#${heading.id}" class="text-purple-300 hover:text-purple-100 transition-colors block text-left pl-0">${heading.text}</a></li>`;
        });

        // 替换目录内容
        const tocList = content.querySelector('.toc-list');
        if (tocList) {
            tocList.innerHTML = tocHTML;
            // 确保目录列表左对齐
            tocList.classList.add('text-left', 'list-none', 'pl-0');
        }
    }

    /**
     * 添加帮助文档样式
     */
    addHelpStyles() {
        const content = document.getElementById('help-content');
        if (content) {
            // 添加自定义样式类
            content.classList.add('help-content');
            
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
            
            // 为表格添加样式
            const tables = content.querySelectorAll('table');
            tables.forEach(table => {
                table.classList.add('w-full', 'border-collapse', 'border', 'border-gray-600', 'mb-4');
            });
            
            // 为表格单元格添加样式
            const cells = content.querySelectorAll('th, td');
            cells.forEach(cell => {
                cell.classList.add('border', 'border-gray-600', 'px-4', 'py-2', 'text-gray-300');
            });
            
            // 为表格头部添加样式
            const headers = content.querySelectorAll('th');
            headers.forEach(header => {
                header.classList.add('bg-dark-light', 'text-purple-300', 'font-bold');
            });
            
            // 添加亮色主题适配样式
            this.addLightThemeStyles();
        }
    }
    
    /**
     * 添加亮色主题适配样式
     */
    addLightThemeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 亮色主题下的帮助文档样式 */
            body.theme-light #help-modal .bg-dark-light {
                background: #ffffff;
                border: 1px solid rgba(139, 92, 246, 0.2);
                box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
            }
            
            body.theme-light #help-modal .text-purple-300 {
                color: #8b5cf6 !important;
            }
            
            body.theme-light #help-modal .text-gray-300 {
                color: #374151 !important;
            }
            
            body.theme-light #help-modal .text-gray-400 {
                color: #6b7280 !important;
            }
            
            body.theme-light #help-modal .text-gray-400:hover {
                color: #374151 !important;
            }
            
            body.theme-light #help-modal .bg-dark-light.text-green-300 {
                background: rgba(139, 92, 246, 0.1) !important;
                color: #8b5cf6 !important;
            }
            
            body.theme-light #help-modal .text-blue-400 {
                color: #8b5cf6 !important;
            }
            
            body.theme-light #help-modal .text-blue-400:hover {
                color: #7c3aed !important;
            }
            
            body.theme-light #help-modal .border-gray-600 {
                border-color: rgba(139, 92, 246, 0.3) !important;
            }
            
            body.theme-light #help-modal .bg-dark-light.text-purple-300 {
                background: rgba(139, 92, 246, 0.1) !important;
                color: #8b5cf6 !important;
            }
            
            /* 亮色主题下的标题样式 */
            body.theme-light #help-modal h1,
            body.theme-light #help-modal h2,
            body.theme-light #help-modal h3,
            body.theme-light #help-modal h4,
            body.theme-light #help-modal h5,
            body.theme-light #help-modal h6 {
                color: #111827 !important;
            }
            
            /* 亮色主题下的段落样式 */
            body.theme-light #help-modal p {
                color: #374151 !important;
            }
            
            /* 亮色主题下的列表样式 */
            body.theme-light #help-modal ul,
            body.theme-light #help-modal ol {
                color: #374151 !important;
            }
            
            /* 亮色主题下的代码块样式 */
            body.theme-light #help-modal pre {
                background: rgba(249, 250, 251, 0.95) !important;
                border: 1px solid rgba(139, 92, 246, 0.2) !important;
                color: #374151 !important;
            }
            
            /* 亮色主题下的引用块样式 */
            body.theme-light #help-modal blockquote {
                border-left: 4px solid #8b5cf6 !important;
                color: #6b7280 !important;
                background: rgba(139, 92, 246, 0.05) !important;
                padding: 12px 16px !important;
                margin: 16px 0 !important;
                border-radius: 0 4px 4px 0 !important;
            }
            
            /* 亮色主题下的表格样式 */
            body.theme-light #help-modal table {
                border-color: rgba(139, 92, 246, 0.3) !important;
            }
            
            body.theme-light #help-modal th,
            body.theme-light #help-modal td {
                border-color: rgba(139, 92, 246, 0.3) !important;
                color: #374151 !important;
            }
            
            body.theme-light #help-modal th {
                background: rgba(139, 92, 246, 0.1) !important;
                color: #8b5cf6 !important;
            }
            
            /* 亮色主题下的滚动条样式 */
            body.theme-light #help-modal ::-webkit-scrollbar {
                width: 8px;
            }
            
            body.theme-light #help-modal ::-webkit-scrollbar-track {
                background: rgba(249, 250, 251, 0.5);
                border-radius: 4px;
            }
            
            body.theme-light #help-modal ::-webkit-scrollbar-thumb {
                background: rgba(139, 92, 246, 0.3);
                border-radius: 4px;
            }
            
            body.theme-light #help-modal ::-webkit-scrollbar-thumb:hover {
                background: rgba(139, 92, 246, 0.5);
            }
            
            /* 亮色主题下的版本信息容器样式 */
            body.theme-light #help-modal .version-info-container {
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%) !important;
                border: 1px solid rgba(139, 92, 246, 0.2) !important;
            }
            
            body.theme-light #help-modal .version-info-container .text-gray-300 {
                color: #374151 !important;
            }
            
            body.theme-light #help-modal .version-info-container .text-gray-400 {
                color: #6b7280 !important;
            }
            
            body.theme-light #help-modal .version-info-container .text-purple-400 {
                color: #8b5cf6 !important;
            }
            
            body.theme-light #help-modal .version-info-container .text-blue-400 {
                color: #3b82f6 !important;
            }
            
            body.theme-light #help-modal .version-info-container .text-red-400 {
                color: #ef4444 !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
<<<<<<< HEAD
=======
     * 动态加载更新日志
     */
    async loadUpdateLogs() {
        try {
            const response = await window.apiGateway.get('/api/update-logs');
            const result = await response.json();
            
            if (result.success && result.data) {
                this.renderUpdateLogs(result.data);
                // 更新最后更新时间和版本信息
                this.updateLastUpdateInfo(result.data);
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
     * 更新最后更新时间和版本信息
     */
    updateLastUpdateInfo(logs) {
        if (logs && logs.length > 0) {
            // 获取最新版本信息
            const latestLog = logs[0]; // 按时间倒序，第一个是最新的
            const latestVersion = latestLog.version;
            const latestDate = window.dayjs ? dayjs(latestLog.release_date).format('YYYY年MM月DD日') : new Date(latestLog.release_date).toLocaleDateString('zh-CN');
            
            // 更新页面中的版本信息
            const versionElements = document.querySelectorAll('.help-version-info');
            versionElements.forEach(element => {
                if (element.textContent.includes('版本:')) {
                    element.textContent = `版本: ${latestVersion}`;
                }
                if (element.textContent.includes('最后更新:')) {
                    element.textContent = `最后更新: ${latestDate}`;
                }
            });
            
            // 添加一些动画效果
            const container = document.querySelector('.version-info-container');
            if (container) {
                container.classList.add('animate-pulse');
                setTimeout(() => {
                    container.classList.remove('animate-pulse');
                }, 1000);
            }
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
        
        // 重新应用样式
        this.addHelpStyles();
    }



    /**
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
     * 获取帮助文档内容
     */
    getHelpContent() {
        // 使用day.js获取当前时间
        const currentDate = window.dayjs ? dayjs().format('YYYY年MM月DD日') : new Date().getFullYear() + '年' + (new Date().getMonth() + 1) + '月' + new Date().getDate() + '日';
        
        return `
# 星际云盘 - 用户帮助文档

## 📖 目录
<ul class="toc-list space-y-2">
<!-- 目录将通过JavaScript动态生成 -->
</ul>

---

## 🚀 快速开始

### 登录系统
1. 在登录页面输入用户名和密码
2. 点击"登录"按钮
3. 登录成功后会自动跳转到主界面

### 主界面概览
- **顶部导航栏**: 用户头像、帮助按钮、设置按钮、退出登录
- **欢迎区域**: 显示用户信息和最后登录时间
- **存储概览**: 显示存储空间使用情况
- **文件分类**: 按类型分类浏览文件
- **文件列表**: 显示当前分类的文件
- **文件夹区域**: 管理文件夹（仅在特定分类下显示）
- **面包屑导航**: 显示当前文件夹路径

---

## 📁 文件管理

### 上传文件
1. **拖拽上传**: 直接将文件拖拽到上传区域
2. **点击上传**: 点击上传按钮选择文件
3. **批量上传**: 支持同时选择多个文件

### 支持的文件类型
- **图片**: JPG, PNG, GIF, BMP, WebP
- **视频**: MP4, AVI, MOV, WMV, FLV, MKV, WebM
- **音频**: MP3, WAV, FLAC, AAC, OGG, WMA
- **文档**: PDF, Word, Excel, PowerPoint
- **文本**: TXT, MD, RTF
- **压缩包**: ZIP, RAR, 7Z, TAR, GZ

### 文件大小限制
- **普通文件**: 最大 20MB
- **视频文件**: 最大 50MB

### 文件操作
- **下载文件**: 点击文件卡片上的下载按钮
- **预览文件**: 点击文件卡片查看预览
- **删除文件**: 点击文件卡片上的删除按钮
- **移动文件**: 拖拽文件到文件夹或点击文件右上角图标

### 文件预览
- **图片**: 直接预览
- **视频**: 在线播放
- **音频**: 在线播放
- **PDF**: 在线预览
- **文档**: 下载后查看
- **文本**: 在线查看

---

## 📂 文件夹管理

### 创建文件夹
1. 点击"新建分组"按钮
2. 输入文件夹名称
3. 点击"创建"按钮

### 文件夹操作
- **重命名**: 点击文件夹卡片上的编辑按钮
- **删除**: 点击文件夹卡片上的删除按钮
- **查看内容**: 点击文件夹卡片进入文件夹
- **返回上级**: 点击面包屑导航或"返回全部文件"按钮

### 文件夹分类
- 文件夹可以按文件类型分类管理
- 在不同分类下创建文件夹会自动归类
- 文件夹会显示当前包含的文件数量

### 文件拖拽到文件夹
- **拖拽操作**: 直接将文件拖拽到文件夹卡片上
- **自动移动**: 文件会自动移动到目标文件夹
- **实时反馈**: 文件夹文件数量会立即更新
- **成功提示**: 移动成功后会显示提示信息

### 文件从文件夹移出
- **移出操作**: 在文件夹内点击文件右上角的红色文件夹图标
- **自动移出**: 文件会自动移出当前文件夹
- **实时更新**: 文件夹文件数量会立即更新
- **文件消失**: 移出的文件会从当前文件夹视图中消失

---

## 🏷️ 文件分类

### 分类说明
- **全部文件**: 显示所有文件（包括文件夹中的文件）
- **图片**: 仅显示图片文件
- **视频**: 仅显示视频文件
- **音频**: 仅显示音频文件
- **文档**: 显示所有文档类型（Word、Excel、PDF等）
- **URL**: 显示链接文件
- **其他**: 显示其他类型文件
- **外站文档**: 同步的外部文档

### 分类切换
- **单击分类**: 点击分类按钮切换到对应分类
- **文档分类**: 单击显示所有文档类型，双击展开子分类
- **子分类**: 包括Word、Excel、PDF、PPT等具体文档类型

### 文档分类子类型
- **所有文档**: 显示所有文档类型
- **Word**: 仅显示Word文档（.doc, .docx）
- **Excel**: 仅显示Excel表格（.xls, .xlsx）
- **PDF**: 仅显示PDF文件
- **PPT**: 仅显示PowerPoint文件（.ppt, .pptx）

---

## 💾 存储管理

### 存储空间
- 系统会显示您的存储空间使用情况
- 包括已使用空间、总空间、使用率
- 存储状态会根据使用率显示不同颜色

### 存储限制
- 默认存储限制为 5GB
- 管理员可以调整存储限制
- 超过限制时无法上传新文件

### 存储优化
- 定期清理不需要的文件
- 使用压缩文件减少存储占用
- 删除重复文件

---

## ⚙️ 用户设置

### 个人资料
1. 点击顶部头像打开个人资料
2. 可以修改用户名、邮箱、个人简介
3. 可以上传新的头像

### 存储设置
1. 点击设置按钮打开存储设置
2. 可以调整存储空间限制（仅管理员）
3. 查看详细的存储使用情况

### 界面设置
- **布局切换**: 在文件列表区域切换卡片/列表视图
- **排序方式**: 按名称、时间、类型排序
- **搜索功能**: 在文件列表中搜索文件

---

## ❓ 常见问题

### Q: 上传文件失败怎么办？
**A:** 可能的原因和解决方法：
1. **文件过大**: 检查文件大小是否超过限制
2. **网络问题**: 检查网络连接，稍后重试
3. **存储空间不足**: 清理一些文件释放空间
4. **文件类型不支持**: 检查文件类型是否在支持列表中

### Q: 无法下载文件？
**A:** 解决方法：
1. 检查网络连接
2. 刷新页面重试
3. 联系管理员检查文件状态

### Q: 文件预览不显示？
**A:** 可能的原因：
1. 文件格式不支持预览
2. 文件损坏
3. 浏览器不支持该格式预览

### Q: 忘记密码怎么办？
**A:** 请联系系统管理员重置密码

### Q: 存储空间不够用？
**A:** 解决方法：
1. 删除不需要的文件
2. 压缩大文件
3. 联系管理员增加存储限制

### Q: 如何批量操作文件？
**A:** 目前系统支持：
1. 批量上传多个文件
2. 逐个删除文件
3. 逐个移动文件

### Q: 如何将文件移动到文件夹？
**A:** 操作方法：
1. **拖拽方式**: 直接将文件拖拽到文件夹卡片上
2. **图标方式**: 点击文件右上角的蓝色文件夹图标
3. **成功提示**: 移动成功后会显示提示信息

### Q: 如何从文件夹中移出文件？
**A:** 操作方法：
1. 进入目标文件夹
2. 点击文件右上角的红色文件夹图标
3. 文件会自动移出当前文件夹

### Q: 文档分类的子类型如何使用？
**A:** 使用方法：
1. **单击文档按钮**: 显示所有文档类型
2. **双击文档按钮**: 展开子分类列表
3. **点击子分类**: 选择具体的文档类型（Word、Excel、PDF、PPT）

---

## 🔧 故障排除

### 页面无法加载
1. 检查网络连接
2. 刷新浏览器页面
3. 清除浏览器缓存
4. 尝试使用其他浏览器

### 上传进度卡住
1. 检查网络连接
2. 取消上传重新开始
3. 尝试上传较小的文件
4. 联系管理员检查服务器状态

### 文件显示异常
1. 刷新页面
2. 重新登录系统
3. 检查文件是否被删除
4. 联系管理员

### 界面显示问题
1. 刷新浏览器页面
2. 清除浏览器缓存
3. 检查浏览器是否支持现代特性
4. 尝试使用其他浏览器

### 登录问题
1. 检查用户名和密码是否正确
2. 确认键盘大小写状态
3. 刷新登录页面
4. 联系管理员

### 拖拽操作问题
1. 确保浏览器支持HTML5拖拽API
2. 检查文件是否正在上传中
3. 刷新页面重试
4. 尝试使用图标方式移动文件

---

## 📞 技术支持

### 联系管理员
- 如遇到系统问题，请联系系统管理员
- 提供详细的错误信息和操作步骤

### 系统要求
- **浏览器**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **网络**: 稳定的网络连接
- **JavaScript**: 浏览器需要启用JavaScript

### 最佳实践
1. **定期备份**: 重要文件建议本地备份
2. **文件命名**: 使用有意义的文件名
3. **分类管理**: 合理使用文件夹分类
4. **存储监控**: 定期检查存储使用情况
5. **拖拽操作**: 使用拖拽功能快速整理文件
6. **文档分类**: 利用文档子分类快速找到特定类型文件

---

<<<<<<< HEAD
=======
## 📝 更新日志

<div id="update-logs-content">
<!-- 更新日志将通过API动态加载 -->
</div>

---

>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
<div class="version-info-container bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-lg p-4 mt-8">
    <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
                <i class="fa fa-calendar text-purple-400"></i>
                <span class="help-version-info text-gray-300 font-medium">最后更新: ${currentDate}</span>
            </div>
            <div class="flex items-center space-x-2">
                <i class="fa fa-tag text-blue-400"></i>
                <span class="help-version-info text-gray-300 font-medium">版本: 1.1.0</span>
            </div>
        </div>
        <div class="flex items-center space-x-2">
            <i class="fa fa-heart text-red-400 animate-pulse"></i>
            <span class="text-gray-400 text-sm">星际云盘</span>
        </div>
    </div>
</div>
        `;
    }
}

// 创建全局实例
<<<<<<< HEAD
window.helpManager = new UIHelpManager();

// 全局暴露
window.UIHelpManager = UIHelpManager; 
=======
window.helpManager = new UIHelpManager(); 
>>>>>>> feb71399497cd53628e1508aad8d419667cd5f89
