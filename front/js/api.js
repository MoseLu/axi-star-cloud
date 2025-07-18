// API模块 - 处理所有后端接口调用
class ApiManager {
    constructor() {
        // 从环境配置获取baseUrl
        this.baseUrl = window.APP_CONFIG?.API_BASE_URL || '';
        this.currentUser = this.getCurrentUser();
    }

    // 构建API URL的通用方法
    buildApiUrl(endpoint) {
        if (!endpoint) return '';
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        return this.baseUrl ? this.baseUrl + endpoint : endpoint;
    }

    // 获取当前用户信息
    getCurrentUser() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                // 同步到实例变量
                this.currentUser = user;
                return user;
            } catch (error) {
                localStorage.removeItem('currentUser');
                this.currentUser = null;
                return null;
            }
        }
        this.currentUser = null;
        return null;
    }

    // 设置当前用户信息
    setCurrentUser(userData) {
        this.currentUser = userData;
        if (userData) {
            localStorage.setItem('currentUser', JSON.stringify(userData));
        } else {
            localStorage.removeItem('currentUser');
        }
    }

    // 获取当前用户UUID
    getCurrentUserId() {
        return this.currentUser?.uuid;
    }

    // 检查是否为管理员
    isAdmin() {
        return this.currentUser?.isAdmin === true;
    }

    // 登录
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '登录失败');
            }
            return data;
        } catch (error) {
            throw new Error(error.message || '登录失败');
        }
    }

    // 注册
    async register(username, password, email) {
        try {
            const response = await fetch(`${this.baseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '注册失败');
            }
            return data;
        } catch (error) {
            throw new Error(error.message || '注册失败');
        }
    }

    // 获取所有用户（管理员功能）
    async getAllUsers(page = 1, limit = 10) {
        try {
            const response = await fetch(`${this.baseUrl}/api/admin/users?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '获取用户列表失败');
            }
            return data;
        } catch (error) {
            throw new Error(error.message || '获取用户列表失败');
        }
    }

    // 更新用户存储限制（管理员功能）
    async updateUserStorage(uuid, storageLimit) {
        try {
            const response = await fetch(`${this.baseUrl}/api/admin/users/storage`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uuid, storage_limit: storageLimit }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '更新用户存储限制失败');
            }
            return data;
        } catch (error) {
            throw new Error(error.message || '更新用户存储限制失败');
        }
    }

    // 获取文件列表
    async getFiles(folderId = null) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                throw new Error('用户未登录');
            }

            let url = `${this.baseUrl}/api/files?user_id=${userId}`;
            if (folderId) {
                url += `&folder_id=${folderId}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '获取文件列表失败');
            }
            
            // 检查响应格式
            if (!data.success) {
                throw new Error(data.error || '获取文件列表失败');
            }
            
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
                    previewUrl: file.path, // 使用后端返回的路径
                    folder_id: file.folder_id // 添加文件夹ID字段
                };
            });
            return files;
        } catch (error) {
            throw new Error(error.message || '获取文件列表失败');
        }
    }

    // 获取单个文件信息
    async getFile(fileId) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                throw new Error('用户未登录');
            }

            const response = await fetch(`${this.baseUrl}/api/files/${fileId}?user_id=${userId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || '获取文件信息失败');
            }
            return data.file;
        } catch (error) {
            throw new Error(error.message || '获取文件信息失败');
        }
    }

    // 获取文件夹列表
    async getFolders(category = null) {
        const userId = this.getCurrentUserId();
        if (!userId) return [];

        let url = `${this.baseUrl}/api/folders?user_id=${userId}`;
        if (category && category !== 'all') {
            url += `&category=${category}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                return data.folders;
            } else {
                console.error('获取文件夹失败:', data.error);
                return [];
            }
        } catch (error) {
            console.error('获取文件夹请求失败:', error);
            return [];
        }
    }

    // 获取存储信息
    async getStorageInfo() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;

        try {
            const response = await fetch(`${this.baseUrl}/api/storage?user_id=${userId}`);
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

        const response = await fetch(`${this.baseUrl}/api/storage?user_id=${userId}`, {
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
        if (!userId) return { success: false, error: '未登录' };

        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        if (folderId) {
            formData.append('folder_id', folderId);
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/upload`, {
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

                const response = await fetch(`${this.baseUrl}/api/upload`, {
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

        try {
            const response = await fetch(`${this.baseUrl}/api/files/${fileId}?user_id=${userId}`, {
                method: 'DELETE'
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '删除失败' };
        }
    }

    // 下载文件
    async downloadFile(fileId) {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) {
                throw new Error('用户未登录');
            }

            const response = await fetch(`${this.baseUrl}/api/files/${fileId}/download?user_id=${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '下载失败');
            }

            // 获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'download';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            // 创建下载链接
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            throw new Error(error.message || '下载失败');
        }
    }

    // 创建文件夹
    async createFolder(name, category) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.baseUrl}/api/folders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, category, user_id: userId })
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '创建失败' };
        }
    }

    // 更新文件夹
    async updateFolder(folderId, name) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.baseUrl}/api/folders/${folderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, user_id: userId })
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '更新失败' };
        }
    }

    // 删除文件夹
    async deleteFolder(folderId) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.baseUrl}/api/folders/${folderId}?user_id=${userId}`, {
                method: 'DELETE'
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '删除失败' };
        }
    }

    // 获取文件夹文件数量
    async getFolderFileCount(folderId) {
        const userId = this.getCurrentUserId();
        if (!userId) return 0;

        try {
            const response = await fetch(`${this.baseUrl}/api/folders/${folderId}/count?user_id=${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.count;
            } else {
                return 0;
            }
        } catch (error) {
            return 0;
        }
    }

    // 获取用户所有文件总数（包括文件夹中的文件）
    async getUserTotalFileCount() {
        const userId = this.getCurrentUserId();
        if (!userId) return 0;

        try {
            const response = await fetch(`${this.baseUrl}/api/files/count?user_id=${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.count;
            } else {
                return 0;
            }
        } catch (error) {
            return 0;
        }
    }

    // 获取所有文档
    async getDocuments() {
        const userId = this.getCurrentUserId();
        if (!userId) {
            throw new Error('未提供用户信息');
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/documents?user_id=${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.documents;
            } else {
                throw new Error(data.error || '获取文档失败');
            }
        } catch (error) {
            throw error;
        }
    }

    // 创建文档
    async createDocument(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/api/documents`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || '创建文档失败');
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    // 删除文档
    async deleteDocument(docId) {
        try {
            const response = await fetch(`${this.baseUrl}/api/documents/${docId}`);
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || '删除文档失败');
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    // 移动文件
    async moveFile(fileId, folderId) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.baseUrl}/api/files/${fileId}/move`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ folder_id: folderId, user_id: userId })
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '移动失败' };
        }
    }

    // 工具方法：格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 文件类型图标映射
    getFileIcon(type) {
        const iconMap = {
            'image': 'fa-image',
            'video': 'fa-video-camera',
            'audio': 'fa-music',
            'document': 'fa-file-text-o',
            'other': 'fa-file-o'
        };
        return iconMap[type] || 'fa-file-o';
    }

    // 文件类型颜色映射
    getFileIconColor(type) {
        const colorMap = {
            'image': 'text-blue-400',
            'video': 'text-purple-400',
            'audio': 'text-green-400',
            'document': 'text-yellow-400',
            'other': 'text-gray-400'
        };
        return colorMap[type] || 'text-gray-400';
    }

    // 获取个人资料
    async getProfile() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;

        try {
            const response = await fetch(`${this.baseUrl}/api/profile?user_id=${userId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.profile;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    // 更新个人资料
    async updateProfile(profileData) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.baseUrl}/api/profile?user_id=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '更新失败' };
        }
    }

    // 上传头像
    async uploadAvatar(file) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('user_id', userId);

        try {
            const response = await fetch(`${this.baseUrl}/api/profile/avatar`, {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '上传失败' };
        }
    }
}

// 导出API管理器
window.ApiManager = ApiManager; 