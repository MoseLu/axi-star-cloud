/**
 * 文件管理API
 * 负责文件上传、下载、删除、移动等功能
 */
class Files {
    constructor(core) {
        this.core = core;
    }

    // 获取文件列表
    async getFiles(folderId = null) {
        const userId = this.core.getCurrentUserId();
        if (!userId) {
            console.warn('用户未登录，无法获取文件列表');
            return [];
        }

        let url = `/api/files?user_id=${userId}`;
        if (folderId) {
            url += `&folder_id=${folderId}`;
        }

        try {
            const response = await window.apiGateway.get(url);
            if (!response.ok) {
                throw new Error(`获取文件列表失败: ${response.status}`);
            }
            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('获取文件列表失败:', error);
            return [];
        }
    }

    // 获取单个文件详细信息
    async getFile(fileId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(this.core.buildApiUrl(`/api/files/${fileId}?user_id=${userId}`));
            const data = await response.json();
            
            if (data.success) {
                return data.file;
            } else {
                throw new Error(data.error || '获取文件信息失败');
            }
        } catch (error) {
            console.error('获取文件信息失败:', error);
            throw new Error('获取文件信息失败');
        }
    }

    // 上传文件
    async uploadFile(file, folderId = null) {
        const userId = this.core.getCurrentUserId();
        
        if (!userId) {
            return { success: false, error: '未登录' };
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        if (folderId) {
            formData.append('folder_id', folderId);
        }

        try {
            const response = await fetch(`${this.core.baseUrl}/api/upload`, {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '上传失败' };
        }
    }

    // 批量上传文件
    async uploadFiles(files, folderId = null) {
        const userId = this.core.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const results = [];
        const errors = [];

        // 逐个上传文件
        for (let i = 0; i < files.length; i++) {
            try {
                const formData = new FormData();
                formData.append('file', files[i]);
                formData.append('user_id', userId);
                if (folderId) {
                    formData.append('folder_id', folderId);
                }

                const response = await fetch(`${this.core.baseUrl}/api/upload`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    results.push(data.file);
                } else {
                    errors.push({
                        file: files[i].name,
                        error: data.error || '上传失败'
                    });
                }
            } catch (error) {
                errors.push({
                    file: files[i].name,
                    error: error.message || '上传失败'
                });
            }
        }

        // 返回结果
        if (errors.length > 0) {
            const errorMessage = errors.map(e => `${e.file}: ${e.error}`).join('; ');
            throw new Error(errorMessage);
        }

        return {
            success: true,
            message: `成功上传 ${results.length} 个文件`,
            files: results
        };
    }

    // 删除文件
    async deleteFile(fileId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.core.baseUrl}/api/files/${fileId}?user_id=${userId}`, {
                method: 'DELETE'
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '删除失败' };
        }
    }

    // 下载文件
    async downloadFile(fileId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '请先登录' };

        try {
            // 先获取文件信息，获取静态路径
            const file = await this.getFile(fileId);
            if (!file || !file.path) {
                throw new Error('文件不存在');
            }
            
            // 使用带user_id的下载URL
            const downloadUrl = `${this.core.buildApiUrl(`/api/files/${fileId}/download`)}?user_id=${userId}`;
            
            // 创建隐藏的下载链接并触发下载
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.name || ''; // 使用文件名
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return { success: true };
        } catch (error) {
            console.error('下载失败:', error);
            return { success: false, error: '下载失败' };
        }
    }

    // 移动文件
    async moveFile(fileId, folderId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await fetch(`${this.core.baseUrl}/api/files/${fileId}/move?user_id=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ folder_id: folderId })
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '移动失败' };
        }
    }

    // 文件类型图标映射
    getFileIcon(type) {
        const iconMap = {
            'image': 'fa-file-image-o',
            'video': 'fa-file-video-o',
            'audio': 'fa-file-audio-o',
            'document': 'fa-file-text-o',
            'word': 'fa-file-word-o',
            'excel': 'fa-file-excel-o',
            'powerpoint': 'fa-file-powerpoint-o',
            'other': 'fa-file-o'
        };
        return iconMap[type] || 'fa-file-o';
    }

    // 文件类型颜色映射
    getFileIconColor(type) {
        const colorMap = {
            'image': 'text-green-400',
            'video': 'text-red-400',
            'audio': 'text-purple-400',
            'document': 'text-blue-400',
            'word': 'text-blue-500',
            'excel': 'text-green-500',
            'powerpoint': 'text-orange-500',
            'other': 'text-gray-400'
        };
        return colorMap[type] || 'text-gray-400';
    }
} 
window.Files = Files; 