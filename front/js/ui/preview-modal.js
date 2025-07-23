/**
 * 文件预览模态框管理器
 * 提供文件预览、图片查看、文档阅读等功能
 */
class UIPreviewModal {
    constructor() {
        this.modal = null;
        this.currentFile = null;
        this.previewContainer = null;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        // 创建模态框HTML结构
        const modalHTML = `
            <div id="preview-modal" class="preview-modal-overlay hidden">
                <div class="preview-modal-container">
                    <div class="preview-modal-header">
                        <div class="preview-modal-title">
                            <i class="fa fa-file-o"></i>
                            <span id="preview-file-name">文件预览</span>
                        </div>
                        <div class="preview-modal-actions">
                            <button class="preview-modal-btn preview-modal-btn-download" title="下载">
                                <i class="fa fa-download"></i>
                            </button>
                            <button class="preview-modal-btn preview-modal-btn-close" title="关闭">
                                <i class="fa fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="preview-modal-content">
                        <div id="preview-loading" class="preview-loading">
                            <div class="preview-loading-spinner"></div>
                            <div class="preview-loading-text">正在加载预览...</div>
                        </div>
                        <div id="preview-container" class="preview-container hidden"></div>
                        <div id="preview-error" class="preview-error hidden">
                            <i class="fa fa-exclamation-triangle"></i>
                            <div class="preview-error-text">无法预览此文件类型</div>
                        </div>
                    </div>
                    <div class="preview-modal-footer">
                        <div class="preview-file-info">
                            <span id="preview-file-size"></span>
                            <span id="preview-file-type"></span>
                        </div>
                        <div class="preview-navigation">
                            <button class="preview-nav-btn preview-nav-prev" title="上一个">
                                <i class="fa fa-chevron-left"></i>
                            </button>
                            <span class="preview-nav-counter">
                                <span id="preview-current-index">1</span> / <span id="preview-total-count">1</span>
                            </span>
                            <button class="preview-nav-btn preview-nav-next" title="下一个">
                                <i class="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('preview-modal');
        this.previewContainer = document.getElementById('preview-container');
    }

    bindEvents() {
        // 关闭按钮事件
        const closeBtn = this.modal.querySelector('.preview-modal-btn-close');
        closeBtn.addEventListener('click', () => this.close());

        // 下载按钮事件
        const downloadBtn = this.modal.querySelector('.preview-modal-btn-download');
        downloadBtn.addEventListener('click', () => this.downloadFile());

        // 导航按钮事件
        const prevBtn = this.modal.querySelector('.preview-nav-prev');
        const nextBtn = this.modal.querySelector('.preview-nav-next');
        prevBtn.addEventListener('click', () => this.navigate('prev'));
        nextBtn.addEventListener('click', () => this.navigate('next'));

        // 点击遮罩层关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('hidden')) {
                switch (e.key) {
                    case 'Escape':
                        this.close();
                        break;
                    case 'ArrowLeft':
                        this.navigate('prev');
                        break;
                    case 'ArrowRight':
                        this.navigate('next');
                        break;
                }
            }
        });
    }

    show(file, fileList = []) {
        if (!file) return;

        this.currentFile = file;
        this.fileList = fileList;
        this.currentIndex = fileList.findIndex(f => f.id === file.id);

        // 更新模态框信息
        this.updateModalInfo();
        
        // 显示模态框
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // 加载预览内容
        this.loadPreview();
    }

    close() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.clearPreview();
    }

    updateModalInfo() {
        const fileName = this.modal.querySelector('#preview-file-name');
        const fileSize = this.modal.querySelector('#preview-file-size');
        const fileType = this.modal.querySelector('#preview-file-type');
        const currentIndex = this.modal.querySelector('#preview-current-index');
        const totalCount = this.modal.querySelector('#preview-total-count');

        fileName.textContent = this.currentFile.name;
        fileSize.textContent = this.formatFileSize(this.currentFile.size);
        fileType.textContent = this.currentFile.type || '未知类型';
        currentIndex.textContent = this.currentIndex + 1;
        totalCount.textContent = this.fileList.length;

        // 更新导航按钮状态
        const prevBtn = this.modal.querySelector('.preview-nav-prev');
        const nextBtn = this.modal.querySelector('.preview-nav-next');
        prevBtn.disabled = this.currentIndex <= 0;
        nextBtn.disabled = this.currentIndex >= this.fileList.length - 1;
    }

    async loadPreview() {
        const loading = document.getElementById('preview-loading');
        const error = document.getElementById('preview-error');
        const container = this.previewContainer;

        // 显示加载状态
        loading.classList.remove('hidden');
        container.classList.add('hidden');
        error.classList.add('hidden');

        try {
            const fileType = this.getFileType(this.currentFile.name);
            
            switch (fileType) {
                case 'image':
                    await this.loadImagePreview();
                    break;
                case 'pdf':
                    await this.loadPDFPreview();
                    break;
                case 'text':
                    await this.loadTextPreview();
                    break;
                case 'video':
                    await this.loadVideoPreview();
                    break;
                case 'audio':
                    await this.loadAudioPreview();
                    break;
                default:
                    throw new Error('不支持的文件类型');
            }
        } catch (error) {
            console.error('预览加载失败:', error);
            this.showError();
        }
    }

    async loadImagePreview() {
        const response = await window.apiGateway.download(`/api/files/${this.currentFile.id}/download`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        this.previewContainer.innerHTML = `
            <img src="${url}" alt="${this.currentFile.name}" class="preview-image">
        `;

        this.showPreview();
    }

    async loadPDFPreview() {
        // 获取用户ID
        const userId = window.apiSystem?.getCurrentUserId();
        if (!userId) {
            throw new Error('未检测到用户ID，请重新登录');
        }
        
        const response = await window.apiGateway.download(`/api/files/${this.currentFile.id}/download?user_id=${userId}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        this.previewContainer.innerHTML = `
            <iframe src="${url}" class="preview-pdf" frameborder="0"></iframe>
        `;

        this.showPreview();
    }

    async loadTextPreview() {
        const response = await window.apiGateway.download(`/api/files/${this.currentFile.id}/download`);
        const text = await response.text();

        this.previewContainer.innerHTML = `
            <pre class="preview-text">${this.escapeHtml(text)}</pre>
        `;

        this.showPreview();
    }

    async loadVideoPreview() {
        // 获取用户ID
        const userId = window.apiSystem?.getCurrentUserId();
        if (!userId) {
            throw new Error('未检测到用户ID，请重新登录');
        }
        
        const response = await window.apiGateway.download(`/api/files/${this.currentFile.id}/download?user_id=${userId}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        this.previewContainer.innerHTML = `
            <video controls class="preview-video">
                <source src="${url}" type="${this.currentFile.type}">
                您的浏览器不支持视频播放
            </video>
        `;

        this.showPreview();
    }

    async loadAudioPreview() {
        const response = await window.apiGateway.download(`/api/files/${this.currentFile.id}/download`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        this.previewContainer.innerHTML = `
            <audio controls class="preview-audio">
                <source src="${url}" type="${this.currentFile.type}">
                您的浏览器不支持音频播放
            </audio>
        `;

        this.showPreview();
    }

    showPreview() {
        const loading = document.getElementById('preview-loading');
        const container = this.previewContainer;

        loading.classList.add('hidden');
        container.classList.remove('hidden');
    }

    showError() {
        const loading = document.getElementById('preview-loading');
        const error = document.getElementById('preview-error');
        const container = this.previewContainer;

        loading.classList.add('hidden');
        container.classList.add('hidden');
        error.classList.remove('hidden');
    }

    clearPreview() {
        // 清理预览内容
        this.previewContainer.innerHTML = '';
        
        // 清理URL对象
        const images = this.previewContainer.querySelectorAll('img');
        const iframes = this.previewContainer.querySelectorAll('iframe');
        const videos = this.previewContainer.querySelectorAll('video');
        const audios = this.previewContainer.querySelectorAll('audio');

        [...images, ...iframes, ...videos, ...audios].forEach(element => {
            if (element.src && element.src.startsWith('blob:')) {
                URL.revokeObjectURL(element.src);
            }
        });
    }

    navigate(direction) {
        if (direction === 'prev' && this.currentIndex > 0) {
            this.currentIndex--;
        } else if (direction === 'next' && this.currentIndex < this.fileList.length - 1) {
            this.currentIndex++;
        } else {
            return;
        }

        this.currentFile = this.fileList[this.currentIndex];
        this.updateModalInfo();
        this.loadPreview();
    }

    async downloadFile() {
        if (!this.currentFile) return;

        try {
            // 获取用户ID
            const userId = window.apiSystem?.getCurrentUserId();
            if (!userId) {
                throw new Error('未检测到用户ID，请重新登录');
            }
            
            const response = await window.apiGateway.download(`/api/files/${this.currentFile.id}/download?user_id=${userId}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('下载失败:', error);
            // 显示错误提示
            if (window.notify) {
                window.notify.error('下载失败，请重试');
            }
        }
    }

    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
        const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
        const textExts = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'h'];
        
        if (imageExts.includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (videoExts.includes(ext)) return 'video';
        if (audioExts.includes(ext)) return 'audio';
        if (textExts.includes(ext)) return 'text';
        
        return 'unknown';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 导出到全局
window.UIPreviewModal = UIPreviewModal; 