// API模块 - 处理所有后端接口调用
class ApiManager {
    constructor() {
        this.baseUrl = '/api';
    }

    // 获取当前用户ID
    getCurrentUserId() {
        const loginData = localStorage.getItem('loginData');
        if (!loginData) return null;
        
        try {
            const userData = JSON.parse(loginData);
            return userData.uuid || '550e8400-e29b-41d4-a716-446655440000';
        } catch (e) {
            return null;
        }
    }

    // 登录
    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '登录失败');
        }

        return await response.json();
    }

    // 获取文件列表
    async getFiles(folderId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) return [];

        let url = `${this.baseUrl}/files?user_id=${userId}`;
        if (folderId) {
            url += `&folder_id=${folderId}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                // 转换后端数据格式为前端格式
                const files = data.files.map(file => {
                    return {
                        id: file.id,
                        name: file.name,
                        size: file.size, // 保持原始数字，让UI层处理格式化
                        date: (() => {
                            const date = new Date(file.created_at);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })(),
                        type: file.type,
                        icon: this.getFileIcon(file.type),
                        iconColor: this.getFileIconColor(file.type),
                        previewUrl: file.path // 使用后端返回的路径
                    };
                });
                return files;
            } else {
                return [];
            }
        } catch (error) {
            return [];
        }
    }

    // 获取单个文件详细信息
    async getFile(fileId) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.baseUrl}/files/${fileId}?user_id=${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.file;
            } else {
                throw new Error(data.error || '获取文件信息失败');
            }
        } catch (error) {
            throw new Error('获取文件信息失败');
        }
    }

    // 获取文件夹列表
    async getFolders(category = null) {
        const userId = this.getCurrentUserId();
        if (!userId) return [];

        let url = `${this.baseUrl}/folders?user_id=${userId}`;
        if (category && category !== 'all') {
            url += `&category=${category}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                return data.folders;
            } else {
                return [];
            }
        } catch (error) {
            return [];
        }
    }

    // 获取存储信息
    async getStorageInfo() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;

        try {
            const response = await fetch(`${this.baseUrl}/storage?user_id=${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.storage;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    // 更新存储限制
    async updateStorageLimit(storageBytes) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/storage?user_id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ storage_limit: storageBytes })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '更新存储限制失败');
        }

        return data;
    }

    // 上传文件
    async uploadFile(file, folderId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        if (folderId) {
            formData.append('folder_id', folderId);
        }

        const response = await fetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '文件上传失败');
        }

        return data;
    }

    // 批量上传文件
    async uploadFiles(files, folderId = null) {
        const userId = this.getCurrentUserId();
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

                const response = await fetch(`${this.baseUrl}/upload`, {
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
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/files/${fileId}?user_id=${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '删除文件失败');
        }

        return data;
    }

    // 下载文件
    async downloadFile(fileId) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/files/${fileId}/download?user_id=${userId}`);
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '下载文件失败');
        }

        return response;
    }

    // 创建文件夹
    async createFolder(name, category) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/folders?user_id=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, category })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '创建文件夹失败');
        }

        return data;
    }

    // 更新文件夹
    async updateFolder(folderId, name) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/folders/${folderId}?user_id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '更新文件夹失败');
        }

        return data;
    }

    // 删除文件夹
    async deleteFolder(folderId) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/folders/${folderId}?user_id=${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '删除文件夹失败');
        }

        return data;
    }

    // 获取文件夹文件数量
    async getFolderFileCount(folderId) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/folders/${folderId}/count?user_id=${userId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '获取文件夹文件数量失败');
        }

        return data.count;
    }

    // 移动文件
    async moveFile(fileId, folderId) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');



        const requestBody = {
            folder_id: folderId === null ? null : parseInt(folderId)
        };



        const response = await fetch(`${this.baseUrl}/files/${fileId}/move?user_id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        
        if (!data.success) {
            throw new Error(data.error || '移动文件失败');
        }

        return data;
    }

    // 工具方法：格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 工具方法：获取文件图标
    getFileIcon(type) {
        const icons = {
            'image': 'fa-file-image-o',
            'video': 'fa-file-video-o',
            'audio': 'fa-file-audio-o',
            'document': 'fa-file-text-o',
            'other': 'fa-file-o'
        };
        return icons[type] || 'fa-file-o';
    }

    // 工具方法：获取文件图标颜色
    getFileIconColor(type) {
        const colors = {
            'image': 'text-emerald-400',
            'video': 'text-pink-400',
            'audio': 'text-cyan-400',
            'document': 'text-orange-400',
            'other': 'text-slate-400'
        };
        return colors[type] || 'text-slate-400';
    }

    // 获取用户个人资料
    async getProfile() {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/profile?user_id=${userId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '获取个人资料失败');
        }

        return data.profile;
    }

    // 更新用户个人资料
    async updateProfile(profileData) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const response = await fetch(`${this.baseUrl}/profile?user_id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '更新个人资料失败');
        }

        return data;
    }

    // 上传头像
    async uploadAvatar(file) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('user_id', userId);

        const response = await fetch(`${this.baseUrl}/profile/avatar?user_id=${userId}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '头像上传失败');
        }

        return data;
    }
}

// 导出API管理器
window.ApiManager = ApiManager; 