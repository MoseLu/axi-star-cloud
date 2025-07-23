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
            let imgUrl = f.path || f.previewUrl || `/uploads/${f.type}/${f.name}`;
            if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
                imgUrl = `/uploads/${f.type}/${f.name}`;
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
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" title="关闭" tabindex="1">
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
            modal.remove();
            this.restoreScrollbars();
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
                modal.remove();
                this.restoreScrollbars();
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
        
        let videoUrl = file.path || file.previewUrl || `/uploads/video/${file.name}`;
        if (videoUrl && !videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
            videoUrl = `/uploads/video/${file.name}`;
        }
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
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
        
        let audioUrl = file.path || file.previewUrl || `/uploads/audio/${file.name}`;
        if (audioUrl && !audioUrl.startsWith('http') && !audioUrl.startsWith('/')) {
            audioUrl = `/uploads/audio/${file.name}`;
        }
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
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
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • ${file.type}</p>
                </div>
                <div class="relative w-full h-full flex items-center justify-center preview-pdf-container" style="overflow: hidden;">
                    <iframe id="pdf-iframe" class="w-full h-full rounded-lg" frameborder="0"></iframe>
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
                <button class="absolute top-2 right-2 text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fa fa-file-text-o text-4xl text-orange-400"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2">${file.name}</h3>
                    <p class="text-gray-300 mb-6">${file.size} • ${file.type}</p>
                    <div class="space-y-3">
                        <button onclick="window.open('${file.path || `/uploads/${file.type}/${file.name}`}', '_blank')" class="w-full bg-gradient-to-r from-orange-500/80 to-amber-500/80 hover:from-orange-500 hover:to-amber-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
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
            modal.remove();
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
        
        let fileUrl = file.path || `/uploads/${file.type}/${file.name}`;
        if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('/')) {
            fileUrl = `/uploads/${file.type}/${file.name}`;
        }
        
        if (fileUrl && !fileUrl.startsWith('http')) {
            fileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        }
        
        const fullFileUrl = window.location.origin + fileUrl;
        const encodedFileUrl = encodeURIComponent(fullFileUrl);
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedFileUrl}`;
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
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
    async previewExcel(file) {
        try {
            let fileUrl = file.path || `/uploads/${file.type}/${file.name}`;
            
            const possibleUrls = [
                fileUrl,
                file.path,
                `/uploads/${file.type}/${file.name}`,
                `/static/uploads/${file.type}/${file.name}`
            ];
            
            let response = null;
            let successfulUrl = null;
            
            for (const url of possibleUrls) {
                if (!url) continue;
                
                try {
                    response = await fetch(url);
                    if (response.ok) {
                        successfulUrl = url;
                        break;
                    }
                } catch (e) {
                    // 静默处理错误
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'Failed to fetch'}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // 检查是否加载了SheetJS库
            if (typeof XLSX === 'undefined') {
                this.showExcelDownloadOptions(file);
                return;
            }
            
            // 使用SheetJS解析Excel文件
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 显示表格预览
            this.showExcelTablePreview(file, jsonData, workbook.SheetNames);
            
        } catch (error) {
            console.error('Excel预览失败:', error);
            this.showExcelDownloadOptions(file);
        }
    }

    // 预览PowerPoint文档
    previewPowerPoint(file) {
        this.hideScrollbars();
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        let fileUrl = file.path || `/uploads/${file.type}/${file.name}`;
        if (fileUrl && !fileUrl.startsWith('http') && !fileUrl.startsWith('/')) {
            fileUrl = `/uploads/${file.type}/${file.name}`;
        }
        
        if (fileUrl && !fileUrl.startsWith('http')) {
            fileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        }
        
        const fullFileUrl = window.location.origin + fileUrl;
        const encodedFileUrl = encodeURIComponent(fullFileUrl);
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedFileUrl}`;
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
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
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-20">
                    <h3 class="text-lg font-semibold">${file.title || 'URL链接'}</h3>
                    <p class="text-sm text-gray-300">${file.url}</p>
                </div>
                <iframe id="url-preview-iframe" src="${file.url}" class="w-full h-full" style="border: none;"></iframe>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 监听iframe加载错误
        const iframe = modal.querySelector('#url-preview-iframe');
        let hasShownBlockedMessage = false;
        let loadTimeout;
        
        loadTimeout = setTimeout(() => {
            if (!hasShownBlockedMessage) {
                hasShownBlockedMessage = true;
                this.showBlockedMessage(modal, file);
            }
        }, 3000);
        
        iframe.onload = () => {
            clearTimeout(loadTimeout);
            setTimeout(() => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!iframeDoc || iframeDoc.body.innerHTML === '') {
                        if (!hasShownBlockedMessage) {
                            hasShownBlockedMessage = true;
                            this.showBlockedMessage(modal, file);
                        }
                    }
                } catch (error) {
                    if (!hasShownBlockedMessage) {
                        hasShownBlockedMessage = true;
                        this.showBlockedMessage(modal, file);
                    }
                }
            }, 1000);
        };
        
        iframe.onerror = () => {
            clearTimeout(loadTimeout);
            if (!hasShownBlockedMessage) {
                hasShownBlockedMessage = true;
                this.showBlockedMessage(modal, file);
            }
        };
        
        this.addModalEventListeners(modal);
    }

    // 显示被阻止的提示
    showBlockedMessage(modal, file) {
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-20">
                    <h3 class="text-lg font-semibold">${file.title || 'URL链接'}</h3>
                    <p class="text-sm text-gray-300">${file.url}</p>
                </div>
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div class="bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl border border-white/20">
                        <div class="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <i class="fa fa-shield-alt text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-3 text-gray-800">安全限制</h3>
                        <p class="text-gray-600 mb-8 leading-relaxed">该网站设置了安全策略，不允许在框架中显示。为了您的安全，我们需要跳转到新页面。</p>
                        
                        <div class="space-y-4">
                            <button class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg" onclick="window.open('${file.url}', '_blank')">
                                <i class="fa fa-external-link mr-3"></i>在新标签页打开
                            </button>
                            <button class="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg copy-url-btn" data-url="${file.url}">
                                <i class="fa fa-copy mr-3"></i>复制链接
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
                    modal.remove();
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
                    modal.remove();
                }
            });
        }
    }

    // 预览文本文件
    async previewTextFile(file) {
        try {
            let fileUrl;
            if (file.path && file.path.startsWith('/uploads/')) {
                fileUrl = file.path;
            } else {
                fileUrl = `/uploads/${file.type}/${file.name}`;
            }
            
            const possibleUrls = [
                fileUrl,
                file.path,
                `/uploads/${file.type}/${file.name}`,
                `/static/uploads/${file.type}/${file.name}`
            ];
            
            let response = null;
            let successfulUrl = null;
            
            for (const url of possibleUrls) {
                if (!url) continue;
                
                try {
                    response = await fetch(url);
                    if (response.ok) {
                        successfulUrl = url;
                        break;
                    }
                } catch (e) {
                    // 静默处理错误
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'Failed to fetch'}`);
            }
            
            const textContent = await response.text();
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
            modal.style.overflow = 'hidden';
            modal.innerHTML = `
                <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                    <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                        <i class="fa fa-times"></i>
                    </button>
                    
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                        <h3 class="text-xl font-semibold">${file.name}</h3>
                        <p class="text-gray-300 text-sm">${file.size} • 文本文件</p>
                    </div>
                    
                    <div class="bg-white rounded-lg w-full h-full max-w-4xl max-h-[90vh] preview-content modal-scrollbar" style="overflow: auto;">
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
            let fileUrl = file.path || `/uploads/${file.type}/${file.name}`;
            
            const possibleUrls = [
                fileUrl,
                file.path,
                `/uploads/${file.type}/${file.name}`,
                `/static/uploads/${file.type}/${file.name}`
            ];
            
            let response = null;
            let successfulUrl = null;
            
            for (const url of possibleUrls) {
                if (!url) continue;
                
                try {
                    response = await fetch(url);
                    if (response.ok) {
                        successfulUrl = url;
                        break;
                    }
                } catch (e) {
                    // 静默处理错误
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`HTTP ${response?.status || 'unknown'}: ${response?.statusText || 'Failed to fetch'}`);
            }
            
            const markdownContent = await response.text();
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
            modal.style.overflow = 'hidden';
            modal.innerHTML = `
                <div class="relative w-full h-full flex flex-col items-center justify-center p-4" style="overflow: hidden;">
                    <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                        <i class="fa fa-times"></i>
                    </button>
                    
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                        <h3 class="text-xl font-semibold">${file.name}</h3>
                        <p class="text-gray-300 text-sm">${file.size} • Markdown文档</p>
                    </div>
                    
                    <div class="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] preview-content modal-scrollbar" style="overflow: auto;">
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

    // 显示Excel下载选项
    showExcelDownloadOptions(file) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="relative max-w-md p-6 bg-dark-light rounded-xl border border-purple-light/20">
                <button class="absolute top-2 right-2 text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="text-center">
                    <div class="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fa fa-file-excel-o text-4xl text-green-400"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2">${file.name}</h3>
                    <p class="text-gray-300 mb-6">${file.size} • Excel文件</p>
                    <div class="space-y-3">
                        <button onclick="window.open('${file.path || `/uploads/${file.type}/${file.name}`}', '_blank')" class="w-full bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-external-link mr-2"></i>在新窗口打开
                        </button>
                        <button class="download-excel-btn w-full bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg transition-all duration-300">
                            <i class="fa fa-download mr-2"></i>下载文件
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定下载按钮事件
        const downloadBtn = modal.querySelector('.download-excel-btn');
        downloadBtn.addEventListener('click', () => {
            modal.remove();
            if (this.uiManager.downloadFile) {
                this.uiManager.downloadFile(file);
            }
        });
        
        this.addModalEventListeners(modal);
    }

    // 显示Excel表格预览
    showExcelTablePreview(file, data, sheetNames) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center';
        modal.style.overflow = 'hidden';
        
        // 保存数据到全局变量，供分页更新使用
        window.currentExcelData = data;
        
        // 分页配置
        const paginationConfig = {
            currentPage: 1,
            pageSize: 20,
            totalRows: data.length - 1, // 减去表头
            totalPages: Math.ceil((data.length - 1) / 20)
        };
        
        // 生成分页后的表格HTML
        const tableHTML = this.generatePaginatedTableHTML(data, paginationConfig);
        
        modal.innerHTML = `
            <div class="relative w-full h-full" style="overflow: hidden;">
                <button class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20 preview-close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fa fa-times"></i>
                </button>
                <div class="absolute top-4 left-1/2 transform -translate-x-1/2 text-center text-white z-10 preview-file-info">
                    <h3 class="text-xl font-semibold">${file.name}</h3>
                    <p class="text-gray-300 text-sm">${file.size} • Excel表格预览</p>
                </div>
                <div class="relative w-full h-full preview-excel-container" style="overflow: hidden;">
                    <div class="excel-viewer w-full h-full bg-white rounded-lg overflow-hidden">
                        <div class="p-4">
                            <div class="mb-4">
                                <h4 class="text-lg font-semibold text-gray-800 mb-2">工作表: ${sheetNames.join(', ')}</h4>
                                <p class="text-sm text-gray-600">共 ${data.length} 行数据</p>
                            </div>
                            <div class="overflow-auto max-h-[calc(100vh-200px)]">
                                ${tableHTML}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 初始化分页控件
        this.initializePaginationControls(modal, data, paginationConfig);
        
        this.addModalEventListeners(modal);
    }

    // 生成分页表格HTML
    generatePaginatedTableHTML(data, config) {
        const startIndex = (config.currentPage - 1) * config.pageSize;
        const endIndex = Math.min(startIndex + config.pageSize, data.length);
        const pageData = data.slice(startIndex, endIndex);
        
        return this.generateTableHTML(pageData);
    }

    // 生成表格HTML
    generateTableHTML(data) {
        if (!data || data.length === 0) {
            return '<div class="text-center text-gray-500 py-8">暂无数据</div>';
        }
        
        const headers = data[0];
        const rows = data.slice(1);
        
        let tableHTML = '<table class="min-w-full border border-gray-200">';
        
        // 表头
        tableHTML += '<thead class="bg-gray-50">';
        tableHTML += '<tr>';
        headers.forEach(header => {
            tableHTML += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">${header || ''}</th>`;
        });
        tableHTML += '</tr>';
        tableHTML += '</thead>';
        
        // 表格内容
        tableHTML += '<tbody class="bg-white divide-y divide-gray-200">';
        rows.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach((header, index) => {
                const cellValue = row[index] || '';
                tableHTML += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">${cellValue}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody>';
        tableHTML += '</table>';
        
        return tableHTML;
    }

    // 初始化分页控件
    initializePaginationControls(modal, data, config) {
        const updatePagination = (newConfig) => {
            const tableContainer = modal.querySelector('.excel-viewer .overflow-auto');
            if (tableContainer) {
                const newTableHTML = this.generatePaginatedTableHTML(data, newConfig);
                tableContainer.innerHTML = newTableHTML;
                this.updatePageNumbers(modal, newConfig);
            }
        };
        
        // 创建分页控件
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200';
        paginationContainer.innerHTML = `
            <div class="flex items-center space-x-2">
                <button class="prev-page-btn px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    上一页
                </button>
                <span class="page-info text-sm text-gray-700"></span>
                <button class="next-page-btn px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    下一页
                </button>
            </div>
            <div class="text-sm text-gray-500">
                每页 ${config.pageSize} 行
            </div>
        `;
        
        modal.querySelector('.excel-viewer').appendChild(paginationContainer);
        
        // 更新页码显示
        this.updatePageNumbers(modal, config);
        
        // 绑定分页按钮事件
        const prevBtn = paginationContainer.querySelector('.prev-page-btn');
        const nextBtn = paginationContainer.querySelector('.next-page-btn');
        
        prevBtn.addEventListener('click', () => {
            if (config.currentPage > 1) {
                config.currentPage--;
                updatePagination(config);
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (config.currentPage < config.totalPages) {
                config.currentPage++;
                updatePagination(config);
            }
        });
    }

    // 更新页码显示
    updatePageNumbers(modal, config) {
        const pageInfo = modal.querySelector('.page-info');
        const prevBtn = modal.querySelector('.prev-page-btn');
        const nextBtn = modal.querySelector('.next-page-btn');
        
        if (pageInfo) {
            pageInfo.textContent = `第 ${config.currentPage} 页，共 ${config.totalPages} 页`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = config.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = config.currentPage >= config.totalPages;
        }
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

    // 添加模态框事件监听器
    addModalEventListeners(modal) {
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                this.restoreScrollbars();
            }
        });
        
        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                this.restoreScrollbars();
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