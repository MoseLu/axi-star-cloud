/**
 * 文件预览模块
 * 处理各种文件类型的预览功能
 */
class UIFilePreview {
    constructor(uiManager) {
        this.uiManager = uiManager;
    }

    init() {
        // 初始化文件预览管理器
        // 可以在这里添加初始化逻辑
    }

    /**
     * 构建文件URL
     * @param {Object} file - 文件对象
     * @returns {string} 完整的文件URL
     */
    buildFileUrl(file) {
        let fileUrl = file.path || file.previewUrl;
        
        // 如果没有完整URL，通过API网关构建
        if (!fileUrl || (!fileUrl.startsWith('http') && !fileUrl.startsWith('https'))) {
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                fileUrl = window.apiGateway.buildUrl(`/uploads/${file.type}/${file.name}`);
            } else {
                fileUrl = `/uploads/${file.type}/${file.name}`;
            }
        }
        
        return fileUrl;
    }

    // 显示文件预览
    showFilePreview(file) {
        // 根据文件类型实现不同的预览方式
        switch (file.type) {
            case 'image':
                this.previewImage(file);
                break;
            case 'video':
                this.previewVideo(file);
                break;
            case 'audio':
                this.previewAudio(file);
                break;
            case 'document':
                this.previewDocument(file);
                break;
            case 'word':
                this.previewWord(file);
                break;
            case 'excel':
                this.previewExcel(file);
                break;
            case 'powerpoint':
                this.previewPowerPoint(file);
                break;
            case 'pdf':
                this.previewPDF(file);
                break;
            case 'url':
                this.previewUrl(file);
                break;
            default:
                if (this.uiManager.showMessage) {
                    this.uiManager.showMessage('不支持预览此类型的文件', 'warning');
                }
        }
    }

    // 预览图片
    previewImage(file) {
        this.hideScrollbars();
        // 获取当前图片文件列表和当前索引
        const imageFiles = (this.uiManager.getCurrentImageFiles && this.uiManager.getCurrentImageFiles()) || [];
        let currentIndex = imageFiles.findIndex(f => f.id === file.id);
        if (currentIndex === -1) {
            // 兜底：只预览当前图片
            imageFiles.push(file);
            currentIndex = imageFiles.length - 1;
        }

        const showImage = (index) => {
            const f = imageFiles[index];
            let imgUrl = f.path || f.previewUrl;
            
            // 如果没有完整URL，通过API网关构建
            if (!imgUrl || (!imgUrl.startsWith('http') && !imgUrl.startsWith('https'))) {
                if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                    imgUrl = window.apiGateway.buildUrl(`/uploads/${f.type}/${f.name}`);
                } else {
                    imgUrl = `/uploads/${f.type}/${f.name}`;
                }
            }
            
            modal.querySelector('.preview-img').src = imgUrl;
            modal.querySelector('.preview-img').alt = f.name;
            modal.querySelector('.preview-file-name').textContent = f.name;
            modal.querySelector('.preview-file-info').textContent = `${f.size ? this.uiManager.fileRenderer.formatStorageSize(f.size) : ''}`;
            modal.querySelector('.preview-index').textContent = `${index + 1} / ${imageFiles.length}`;
        };

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        modal.innerHTML = `
            <div class="relative w-full h-full flex items-center justify-center" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" title="关闭" tabindex="1" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <button class="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/30 hover:bg-black/60 rounded-full w-12 h-12 flex items-center justify-center z-20 preview-prev-btn" title="上一张" tabindex="2">
                    <i class="fa fa-chevron-left"></i>
                </button>
                <button class="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/30 hover:bg-black/60 rounded-full w-12 h-12 flex items-center justify-center z-20 preview-next-btn" title="下一张" tabindex="3">
                    <i class="fa fa-chevron-right"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10">
                    <h3 class="text-xl font-semibold preview-file-name"></h3>
                    <p class="text-gray-300 text-sm preview-file-info"></p>
                    <span class="preview-index text-xs text-gray-400"></span>
                </div>
                <div class="relative w-full h-full flex items-center justify-center preview-image-container" style="overflow: hidden;">
                    <img class="preview-img max-w-full max-h-full object-contain rounded-lg" src="" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="hidden flex items-center justify-center w-full h-full">
                        <div class="text-center text-white">
                            <i class="fa fa-image text-6xl mb-4 opacity-50"></i>
                            <p class="text-lg">图片加载失败</p>
                            <p class="text-sm opacity-75">文件可能不存在或格式不支持</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        showImage(currentIndex);
        this.addModalEventListeners(modal);

        // 关闭按钮
        modal.querySelector('.preview-close-btn').onclick = () => {
            this.closeModal(modal);
        };
        // 上一张
        modal.querySelector('.preview-prev-btn').onclick = (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + imageFiles.length) % imageFiles.length;
            showImage(currentIndex);
        };
        // 下一张
        modal.querySelector('.preview-next-btn').onclick = (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % imageFiles.length;
            showImage(currentIndex);
        };
        // 键盘左右键切换
        const handleKey = (e) => {
            if (e.key === 'ArrowLeft') {
                currentIndex = (currentIndex - 1 + imageFiles.length) % imageFiles.length;
                showImage(currentIndex);
            } else if (e.key === 'ArrowRight') {
                currentIndex = (currentIndex + 1) % imageFiles.length;
                showImage(currentIndex);
            } else if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', handleKey);
            }
        };
        document.addEventListener('keydown', handleKey);
        // 模态框移除时恢复滚动条和解绑事件
        modal.addEventListener('remove', () => {
            this.restoreScrollbars();
            document.removeEventListener('keydown', handleKey);
        });
    }

    // 预览视频
    previewVideo(file) {
        this.hideScrollbars();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        let videoUrl = file.path || file.previewUrl;
        
        // 如果没有完整URL，通过API网关构建
        if (!videoUrl || (!videoUrl.startsWith('http') && !videoUrl.startsWith('https'))) {
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                videoUrl = window.apiGateway.buildUrl(`/uploads/video/${file.name}`);
            } else {
                videoUrl = `/uploads/video/${file.name}`;
            }
        }
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                <div class="relative w-full h-full flex items-center justify-center preview-video-container" style="overflow: hidden;">
                    <video controls class="max-w-full max-h-full rounded-lg" autoplay>
                        <source src="${videoUrl}" type="video/mp4">
                        您的浏览器不支持视频播放
                    </video>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addModalEventListeners(modal);
    }

    // 预览音频
    previewAudio(file) {
        this.hideScrollbars();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        let audioUrl = file.path || file.previewUrl;
        
        // 如果没有完整URL，通过API网关构建
        if (!audioUrl || (!audioUrl.startsWith('http') && !audioUrl.startsWith('https'))) {
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                audioUrl = window.apiGateway.buildUrl(`/uploads/audio/${file.name}`);
            } else {
                audioUrl = `/uploads/audio/${file.name}`;
            }
        }
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                <div class="text-center max-w-2xl preview-audio-container">
                    <div class="w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <i class="fa fa-music text-8xl text-cyan-400"></i>
                    </div>
                    <audio controls class="w-full max-w-lg mx-auto" autoplay>
                        <source src="${audioUrl}" type="audio/mpeg">
                        您的浏览器不支持音频播放
                    </audio>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addModalEventListeners(modal);
    }

    // 预览PDF文档
    previewPDF(file) {
        this.hideScrollbars();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                <div class="relative w-full h-full preview-pdf-container" style="overflow: hidden;">
                    <iframe id="pdf-iframe" class="w-full h-full" frameborder="0" style="border: none;"></iframe>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 获取用户ID
        let userId = null;
        if (localStorage.getItem('currentUser')) {
            try {
                const cu = JSON.parse(localStorage.getItem('currentUser'));
                if (cu && cu.uuid) userId = cu.uuid;
            } catch(e) {}
        }
        if (!userId && localStorage.getItem('user_id')) userId = localStorage.getItem('user_id');
        if (!userId && window.userId) userId = window.userId;
        
        if (!userId) {
            console.error('未检测到用户ID');
            return;
        }
        
        // 构建PDF URL
        let pdfUrl = window.apiGateway.buildUrl(`/api/files/${file.id}/download?user_id=${userId}`);
        
        // 加载PDF
        setTimeout(async () => {
            try {
                const response = await fetch(pdfUrl);
                if (!response.ok) {
                    throw new Error('PDF下载失败');
                }
                
                const blob = new Blob([await response.arrayBuffer()], { 
                    type: 'application/pdf' 
                });
                const blobUrl = URL.createObjectURL(blob);
                
                const iframe = modal.querySelector('#pdf-iframe');
                if (iframe) {
                    iframe.src = blobUrl;
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
                }
            } catch (error) {
                console.error('PDF预览失败:', error);
                window.open(pdfUrl, '_blank');
            }
        }, 100);
        
        this.addModalEventListeners(modal);
    }

    // 预览文档
    previewDocument(file) {
        // 检查是否为Markdown文件
        if (file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown')) {
            this.previewMarkdown(file);
            return;
        }
        
        // 检查是否为txt文件
        if (file.name.toLowerCase().endsWith('.txt')) {
            this.previewTextFile(file);
            return;
        }
        
        // 检查是否为PDF文件
        if (file.name.toLowerCase().endsWith('.pdf')) {
            this.previewPDF(file);
            return;
        }
        
        // 对于其他文档，提供下载链接或在新窗口打开
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="relative max-w-md p-6 bg-dark-light rounded-xl border border-purple-light/20">
                <button class="absolute top-2 right-2 text-gray-400 hover:text-white" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fa fa-file-text-o text-4xl text-orange-400"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2">${file.name}</h3>
                    <p class="text-gray-300 mb-6">${file.size} • ${file.type}</p>
                    <div class="space-y-3">
                        <button onclick="window.open('${this.buildFileUrl(file)}', '_blank')" class="w-full bg-gradient-to-r from-orange-500/80 to-amber-500/80 hover:from-orange-500 hover:to-amber-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-external-link mr-2"></i>在新窗口打开
                        </button>
                        <button class="download-doc-btn w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-download mr-2"></i>下载文件
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定下载按钮事件
        const downloadBtn = modal.querySelector('.download-doc-btn');
        downloadBtn.addEventListener('click', () => {
            this.closeModal(modal);
            if (this.uiManager.downloadFile) {
                this.uiManager.downloadFile(file);
            }
        });
        
        this.addModalEventListeners(modal);
    }

    // 预览Word文档
    previewWord(file) {
        this.hideScrollbars();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        let fileUrl = this.buildFileUrl(file);
        
        // 确保是完整URL
        if (!fileUrl.startsWith('http')) {
            fileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
            fileUrl = window.location.origin + fileUrl;
        }
        
        const fullFileUrl = fileUrl;
        const encodedFileUrl = encodeURIComponent(fullFileUrl);
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedFileUrl}`;
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • Word文档</p>
                </div>
                <div class="relative w-full h-full preview-word-container" style="overflow: hidden;">
                    <div class="word-viewer w-full h-full">
                        <iframe id="word-iframe" class="w-full h-full border-0" style="background: white;" src="${officeViewerUrl}"></iframe>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addModalEventListeners(modal);
    }

    // 预览Excel文档
    previewExcel(file) {
        this.hideScrollbars();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        let fileUrl = this.buildFileUrl(file);
        
        // 确保是完整URL
        if (!fileUrl.startsWith('http')) {
            fileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
            fileUrl = window.location.origin + fileUrl;
        }
        
        const fullFileUrl = fileUrl;
        const encodedFileUrl = encodeURIComponent(fullFileUrl);
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedFileUrl}`;
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • Excel文件</p>
                </div>
                <div class="relative w-full h-full preview-excel-container" style="overflow: hidden;">
                    <div class="excel-viewer w-full h-full">
                        <iframe id="excel-iframe" class="w-full h-full border-0" style="background: white;" src="${officeViewerUrl}"></iframe>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addModalEventListeners(modal);
    }

    // 预览PowerPoint文档
    previewPowerPoint(file) {
        this.hideScrollbars();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        let fileUrl = this.buildFileUrl(file);
        
        // 确保是完整URL
        if (!fileUrl.startsWith('http')) {
            fileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
            fileUrl = window.location.origin + fileUrl;
        }
        
        const fullFileUrl = fileUrl;
        const encodedFileUrl = encodeURIComponent(fullFileUrl);
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedFileUrl}`;
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • PowerPoint演示文稿</p>
                </div>
                <div class="relative w-full h-full preview-powerpoint-container" style="overflow: hidden;">
                    <div class="powerpoint-viewer w-full h-full">
                        <iframe id="powerpoint-iframe" class="w-full h-full border-0" style="background: white;" src="${officeViewerUrl}"></iframe>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.addModalEventListeners(modal);
    }

    // 预览URL链接
    previewUrl(file) {
        this.hideScrollbars();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        // 只对确实有严格CSP限制的网站进行预检测
        const strictCspRestrictedDomains = [
            'mp.weixin.qq.com',
            'work.weixin.qq.com',
            'paypal.com',
            'alipay.com',
            'wechat.com',
            'qq.com'
        ];
        
        const urlDomain = new URL(file.url).hostname;
        const isStrictCspRestricted = strictCspRestrictedDomains.some(domain => 
            urlDomain.includes(domain)
        );
        
        if (isStrictCspRestricted) {
            // 只对确实有CSP限制的网站直接显示安全限制提示
            this.showBlockedMessage(modal, file);
            document.body.appendChild(modal);
            this.addModalEventListeners(modal);
            return;
        }
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-20">
                    <h3 class="text-lg font-semibold">${file.title || 'URL链接'}</h3>
                    <p class="text-sm text-gray-300">${file.url}</p>
                    <div id="loading-status" class="text-xs text-blue-300 mt-1">正在检测网站兼容性...</div>
                </div>
                <iframe id="url-preview-iframe" src="${file.url}" class="w-full h-full" style="border: none;"></iframe>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 监听iframe加载状态
        const iframe = modal.querySelector('#url-preview-iframe');
        let hasShownBlockedMessage = false;
        let loadTimeout;
        let loadStartTime = Date.now();
        let contentLoaded = false;
        let iframeLoadAttempted = false;
        let retryCount = 0;
        const maxRetries = 2;
        
        // 设置更长的超时时间，给网站充分加载时间
        loadTimeout = setTimeout(() => {
            if (!hasShownBlockedMessage && !contentLoaded && iframeLoadAttempted && retryCount >= maxRetries) {
                hasShownBlockedMessage = true;
                this.showBlockedMessage(modal, file);
            }
        }, 45000); // 延长到45秒，给更多时间
        
        // 监听iframe加载开始
        iframe.onloadstart = () => {
            iframeLoadAttempted = true;
        };
        
        // 监听iframe加载完成
        iframe.onload = () => {
            clearTimeout(loadTimeout);
            
            // 给iframe更多时间完全加载内容
            setTimeout(() => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    
                    // 检查是否能访问iframe文档
                    if (!iframeDoc) {
                        // 无法访问iframe文档，可能是CSP限制，但也可能是正常的跨域限制
                        // 不要立即显示安全限制，而是让用户继续浏览
                        if (retryCount >= maxRetries) {
                            // 只有在多次重试后仍然无法访问时才考虑显示提示
                            
                            // 更新状态提示
                            const loadingStatus = modal.querySelector('#loading-status');
                            if (loadingStatus) {
                                loadingStatus.textContent = '网站已加载，可能存在跨域限制';
                                loadingStatus.className = 'text-xs text-yellow-300 mt-1';
                            }
                        } else if (retryCount < maxRetries) {
                            retryCount++;
                            // 重试一次
                            setTimeout(() => {
                                iframe.onload();
                            }, 3000);
                        }
                        return;
                    }
                    
                    // 更精确的内容检测 - 检查页面是否有实际内容
                    const bodyContent = iframeDoc.body ? iframeDoc.body.innerHTML : '';
                    const title = iframeDoc.title || '';
                    const hasContent = bodyContent.length > 100 || title.length > 0;
                    
                    // 检查是否有明确的错误页面内容（更精确的关键词）
                    const errorKeywords = [
                        'access denied',
                        'forbidden',
                        'blocked by frame-ancestors',
                        'x-frame-options',
                        'content security policy',
                        'refused to display',
                        'clickjacking protection'
                    ];
                    const pageText = iframeDoc.body ? iframeDoc.body.textContent.toLowerCase() : '';
                    const hasErrorContent = errorKeywords.some(keyword => pageText.includes(keyword));
                    
                    // 检查页面是否为空或只有错误信息
                    const isEmptyPage = bodyContent.length < 50 && title.length === 0;
                    
                    // 检查是否有正常的HTML结构（更智能的检测）
                    const hasNormalStructure = iframeDoc.body && 
                        (iframeDoc.body.children.length > 0 || 
                         iframeDoc.body.innerHTML.includes('<div') || 
                         iframeDoc.body.innerHTML.includes('<p') || 
                         iframeDoc.body.innerHTML.includes('<span'));
                    
                    if (hasErrorContent) {
                        // 发现明确的错误内容，显示安全限制提示
                        if (!hasShownBlockedMessage && !contentLoaded) {
                            hasShownBlockedMessage = true;
                            this.showBlockedMessage(modal, file);
                        }
                    } else if (hasContent || hasNormalStructure) {
                        // 有实际内容或正常HTML结构，认为加载成功
                        contentLoaded = true;
                        clearTimeout(loadTimeout);
                        
                        // 更新状态提示
                        const loadingStatus = modal.querySelector('#loading-status');
                        if (loadingStatus) {
                            loadingStatus.textContent = '网站加载成功';
                            loadingStatus.className = 'text-xs text-green-300 mt-1';
                        }
                    } else if (isEmptyPage && retryCount >= maxRetries) {
                        // 空页面且重试次数已用完，但不一定是安全限制
                        // 让用户继续浏览，可能页面正在加载中
                        
                        // 更新状态提示
                        const loadingStatus = modal.querySelector('#loading-status');
                        if (loadingStatus) {
                            loadingStatus.textContent = '网站已加载，内容较少';
                            loadingStatus.className = 'text-xs text-yellow-300 mt-1';
                        }
                    } else if (retryCount < maxRetries) {
                        // 内容不够明确，重试一次
                        retryCount++;
                        
                        // 更新状态提示
                        const loadingStatus = modal.querySelector('#loading-status');
                        if (loadingStatus) {
                            loadingStatus.textContent = `正在重试检测... (${retryCount}/${maxRetries})`;
                            loadingStatus.className = 'text-xs text-yellow-300 mt-1';
                        }
                        
                        setTimeout(() => {
                            iframe.onload();
                        }, 3000);
                    }
                } catch (error) {
                    // 检查是否是跨域访问限制（更精确的错误类型）
                    const isCrossOriginError = error.name === 'SecurityError' || 
                        error.message.includes('blocked by frame-ancestors') ||
                        error.message.includes('X-Frame-Options') ||
                        error.message.includes('Refused to frame') ||
                        error.message.includes('cross-origin frame');
                    
                    if (isCrossOriginError && retryCount >= maxRetries) {
                        // 跨域错误，但不一定是安全限制，让用户继续浏览
                        
                        // 更新状态提示
                        const loadingStatus = modal.querySelector('#loading-status');
                        if (loadingStatus) {
                            loadingStatus.textContent = '网站已加载，存在跨域限制';
                            loadingStatus.className = 'text-xs text-yellow-300 mt-1';
                        }
                    } else if (retryCount < maxRetries) {
                        // 其他错误可能是临时网络问题，重试一次
                        retryCount++;
                        
                        // 更新状态提示
                        const loadingStatus = modal.querySelector('#loading-status');
                        if (loadingStatus) {
                            loadingStatus.textContent = `检测遇到问题，正在重试... (${retryCount}/${maxRetries})`;
                            loadingStatus.className = 'text-xs text-yellow-300 mt-1';
                        }
                        
                        setTimeout(() => {
                            iframe.onload();
                        }, 2000);
                    } else {
                        // 其他错误（如网络错误等）不显示安全限制提示
                        
                        // 更新状态提示
                        const loadingStatus = modal.querySelector('#loading-status');
                        if (loadingStatus) {
                            loadingStatus.textContent = '网站加载完成';
                            loadingStatus.className = 'text-xs text-green-300 mt-1';
                        }
                    }
                }
            }, 8000); // 增加到8秒，给网站更多加载时间
        };
        
        // 监听iframe加载错误
        iframe.onerror = () => {
            // 网络错误不显示安全限制提示，让用户正常浏览
        };
        
        // 监听iframe加载超时
        iframe.ontimeout = () => {
            if (!hasShownBlockedMessage && !contentLoaded && retryCount >= maxRetries) {
                hasShownBlockedMessage = true;
                this.showBlockedMessage(modal, file);
            }
        };
        
        this.addModalEventListeners(modal);
    }

    // 显示被阻止的提示
    showBlockedMessage(modal, file) {
        // 检查不同类型的网站
        const urlDomain = new URL(file.url).hostname;
        const isWechatDomain = urlDomain.includes('weixin.qq.com') || urlDomain.includes('wechat.com');
        const isPayment = urlDomain.includes('paypal.com') || urlDomain.includes('alipay.com');
        
        let title, description;
        
        if (isWechatDomain) {
            title = '微信安全限制';
            description = '微信公众平台设置了严格的安全策略，不允许在框架中显示。这是微信的安全保护机制。';
        } else if (isPayment) {
            title = '支付平台安全限制';
            description = '该支付平台设置了严格的安全策略，不允许在框架中显示。这是支付安全保护机制。';
        } else {
            title = '安全限制';
            description = '该网站设置了安全策略，不允许在框架中显示。为了您的安全，我们需要跳转到新页面。';
        }
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-20">
                    <h3 class="text-lg font-semibold">${file.title || 'URL链接'}</h3>
                    <p class="text-sm text-gray-300">${file.url}</p>
                </div>
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl border border-white/20">
                        <div class="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <span style="font-size: 3em; color: white;">🛡️</span>
                        </div>
                        <h3 class="text-2xl font-bold mb-3 text-gray-800">${title}</h3>
                        <p class="text-gray-600 mb-8 leading-relaxed">${description}</p>
                        
                        <div class="space-y-4">
                            <button class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg" onclick="window.open('${file.url}', '_blank')">
                                <span style="margin-right: 12px; display: inline-block;">🔗</span>在新标签页打开
                            </button>
                            <button class="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg copy-url-btn" data-url="${file.url}">
                                <span style="margin-right: 12px; display: inline-block;">📋</span>复制链接
                            </button>
                        </div>
                        
                        <div class="mt-6 pt-4 border-t border-gray-200">
                            <p class="text-xs text-gray-500">这是网站的安全保护机制，确保您的浏览安全</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加复制按钮事件监听器
        const copyBtn = modal.querySelector('.copy-url-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async function() {
                const url = this.getAttribute('data-url');
                try {
                    await navigator.clipboard.writeText(url);
                    if (window.uiManager && window.uiManager.showMessage) {
                        window.uiManager.showMessage('链接已复制到剪贴板', 'success');
                    }
                    window.uiManager.filePreview.closeModal(modal);
                } catch (error) {
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    if (window.uiManager && window.uiManager.showMessage) {
                        window.uiManager.showMessage('链接已复制到剪贴板', 'success');
                    }
                    window.uiManager.filePreview.closeModal(modal);
                }
            });
        }
    }

    // 预览文本文件
    async previewTextFile(file) {
        try {
            // 获取用户ID - 使用多种可靠的方式
            let userId = null;
            
            // 方式1: 从API系统获取（最可靠）
            if (window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
                userId = window.apiSystem.getCurrentUserId();
            }
            
            // 方式2: 从API管理器获取
            if (!userId && window.apiManager && typeof window.apiManager.getCurrentUserId === 'function') {
                userId = window.apiManager.getCurrentUserId();
            }
            
            // 方式3: 从localStorage获取userInfo（与登录系统一致）
            if (!userId) {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    try {
                        const user = JSON.parse(userInfo);
                        userId = user.uuid || user.id;
                    } catch (e) {
                        console.warn('解析userInfo失败:', e);
                    }
                }
            }
            
            // 方式4: 从认证系统获取
            if (!userId && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
                const currentUser = window.authSystem.getCurrentUser();
                userId = currentUser?.uuid || currentUser?.id;
            }
            
            // 方式5: 从localStorage获取currentUser（兼容旧版本）
            if (!userId) {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    try {
                        const user = JSON.parse(currentUser);
                        userId = user.uuid || user.id;
                    } catch (e) {
                        console.warn('解析currentUser失败:', e);
                    }
                }
            }
            
            if (!userId) {
                throw new Error('未检测到用户ID，请重新登录');
            }
            
            console.log('文本文件预览时使用的用户ID:', userId);
            
            // 通过API下载文件
            const response = await window.apiGateway.download(`/api/files/${file.id}/download?user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const textContent = await response.text();
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
            modal.style.overflow = 'hidden';
            modal.innerHTML = `
                <div class="relative w-full h-full" style="overflow: hidden;">
                    <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                        <i class="fa fa-times"></i>
                    </button>
                    
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                        <h3 class="text-xl font-semibold">${file.name}</h3>
                        <p class="text-gray-300 text-sm">${file.size} • 文本文件</p>
                    </div>
                    
                    <div class="bg-white w-full h-full preview-content modal-scrollbar" style="overflow: auto;">
                        <div class="p-8">
                            <pre class="whitespace-pre-wrap font-mono text-sm leading-relaxed">${textContent}</pre>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.addModalEventListeners(modal);
            
        } catch (error) {
            if (this.uiManager.showMessage) {
                this.uiManager.showMessage('无法加载文本文件: ' + error.message, 'error');
            }
        }
    }

    // 预览Markdown文件
    async previewMarkdown(file) {
        try {
            // 获取用户ID - 使用多种可靠的方式
            let userId = null;
            
            // 方式1: 从API系统获取（最可靠）
            if (window.apiSystem && typeof window.apiSystem.getCurrentUserId === 'function') {
                userId = window.apiSystem.getCurrentUserId();
            }
            
            // 方式2: 从API管理器获取
            if (!userId && window.apiManager && typeof window.apiManager.getCurrentUserId === 'function') {
                userId = window.apiManager.getCurrentUserId();
            }
            
            // 方式3: 从localStorage获取userInfo（与登录系统一致）
            if (!userId) {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    try {
                        const user = JSON.parse(userInfo);
                        userId = user.uuid || user.id;
                    } catch (e) {
                        console.warn('解析userInfo失败:', e);
                    }
                }
            }
            
            // 方式4: 从认证系统获取
            if (!userId && window.authSystem && typeof window.authSystem.getCurrentUser === 'function') {
                const currentUser = window.authSystem.getCurrentUser();
                userId = currentUser?.uuid || currentUser?.id;
            }
            
            // 方式5: 从localStorage获取currentUser（兼容旧版本）
            if (!userId) {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    try {
                        const user = JSON.parse(currentUser);
                        userId = user.uuid || user.id;
                    } catch (e) {
                        console.warn('解析currentUser失败:', e);
                    }
                }
            }
            
            if (!userId) {
                throw new Error('未检测到用户ID，请重新登录');
            }
            
            console.log('Markdown文件预览时使用的用户ID:', userId);
            
            // 通过API下载文件
            const response = await window.apiGateway.download(`/api/files/${file.id}/download?user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const markdownContent = await response.text();
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
            modal.style.overflow = 'hidden';
            modal.innerHTML = `
                <div class="relative w-full h-full" style="overflow: hidden;">
                    <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="window.uiManager.filePreview.closeModal(this.parentElement.parentElement)">
                        <i class="fa fa-times"></i>
                    </button>
                    
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                        <h3 class="text-xl font-semibold">${file.name}</h3>
                        <p class="text-sm text-gray-300">${file.size} • Markdown文档</p>
                    </div>
                    
                    <div class="bg-white w-full h-full preview-content modal-scrollbar" style="overflow: auto;">
                        <div class="p-8">
                            <div class="prose prose-lg max-w-none">
                                <div class="markdown-content">${this.renderMarkdown(markdownContent)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.addModalEventListeners(modal);
            
        } catch (error) {
            if (this.uiManager.showMessage) {
                this.uiManager.showMessage('无法加载Markdown文件: ' + error.message, 'error');
            }
        }
    }

    // 简单的Markdown渲染函数
    renderMarkdown(text) {
        return text
            // 标题
            .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold text-gray-900 mb-4">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold text-gray-900 mb-4">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold text-gray-900 mb-4">$1</h1>')
            // 粗体和斜体
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            // 代码块
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>')
            // 列表
            .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
            // 段落
            .replace(/\n\n/g, '</p><p class="mb-4">')
            .replace(/^(?!<[h|p|li|pre|ul|ol]).*/gim, '<p class="mb-4">$&')
            // 清理多余的标签
            .replace(/<p class="mb-4"><\/p>/g, '')
            .replace(/<p class="mb-4">\s*<\/p>/g, '')
            // 确保段落正确闭合
            .replace(/<p class="mb-4">([^<]*(?:<[^p][^>]*>[^<]*<\/[^p][^>]*>[^<]*)*)<\/p>/g, '<p class="mb-4">$1</p>');
    }

    // 隐藏滚动条
    hideScrollbars() {
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
    }

    // 恢复滚动条
    restoreScrollbars() {
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
    }

    // 关闭模态框的统一方法
    closeModal(modal) {
        if (modal && modal.parentNode) {
            modal.remove();
            this.restoreScrollbars();
        }
    }

    // 添加模态框事件监听器
    addModalEventListeners(modal) {
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // 模态框移除时恢复滚动条
        modal.addEventListener('remove', () => {
            this.restoreScrollbars();
        });
    }
}

// 暴露到全局作用域
window.UIFilePreview = UIFilePreview; 