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
            const response = await fetch(this.buildApiUrl('/api/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                this.setCurrentUser({
                    uuid: data.user.uuid,
                    username: data.user.username,
                    isAdmin: data.user.is_admin
                });
            }
            return data;
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, error: '网络错误' };
        }
    }

    // 注册
    async register(username, password, email = '') {
        try {
            const response = await fetch(this.buildApiUrl('/api/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email })
            });

            return await response.json();
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, error: '网络错误' };
        }
    }

    // 获取所有用户（管理员功能）
    async getAllUsers(page = 1, pageSize = 5) {
        if (!this.isAdmin()) {
            return { success: false, error: '权限不足' };
        }

        try {
            // 修复URL构建问题 - 在云端环境中API_BASE_URL为空字符串
            let apiUrl;
            if (this.baseUrl) {
                // 本地环境：使用完整URL
                const url = new URL(`${this.baseUrl}/api/admin/users`);
                url.searchParams.set('page', page.toString());
                url.searchParams.set('page_size', pageSize.toString());
                apiUrl = url.toString();
            } else {
                // 云端环境：使用相对路径
                apiUrl = `/api/admin/users?page=${page}&page_size=${pageSize}`;
            }

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'User-UUID': this.getCurrentUserId(),
                    'Content-Type': 'application/json',
                }
            });

            return await response.json();
        } catch (error) {
            console.error('获取用户列表失败:', error);
            return { success: false, error: '网络错误' };
        }
    }

    // 更新用户存储限制（管理员功能）
    async updateUserStorage(uuid, storageLimit) {
        if (!this.isAdmin()) {
            return { success: false, error: '权限不足' };
        }

        try {
            // 修复URL构建问题
            const apiUrl = this.baseUrl ? `${this.baseUrl}/api/admin/users/storage` : '/api/admin/users/storage';
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'User-UUID': this.getCurrentUserId(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uuid, storage_limit: storageLimit })
            });

            return await response.json();
        } catch (error) {
            console.error('更新用户存储限制失败:', error);
            return { success: false, error: '网络错误' };
        }
    }

    // 获取文件列表
    async getFiles(folderId = null) {
        const userId = this.getCurrentUserId();
        if (!userId) return [];

        let url = this.buildApiUrl(`/api/files?user_id=${userId}`);
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
                        previewUrl: file.path, // 使用后端返回的路径
                        folder_id: file.folder_id // 添加文件夹ID字段
                    };
                });
                return files;
            } else {
                return [];
            }
        } catch (error) {
            console.error('获取文件列表失败:', error);
            return [];
        }
    }

    // 获取单个文件详细信息
    async getFile(fileId) {
        const userId = this.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(this.buildApiUrl(`/api/files/${fileId}?user_id=${userId}`));
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
        const userId = this.getCurrentUserId();
        if (!userId) return { success: false, error: '请先登录' };

        try {
            // 先获取文件信息，获取静态路径
            const file = await this.getFile(fileId);
            if (!file || !file.path) {
                throw new Error('文件不存在');
            }
            
            // 直接使用文件的静态路径进行下载
            const downloadUrl = this.buildApiUrl(file.path);
            
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

    // 创建文件夹
    async createFolder(name, category) {
        const userId = this.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await fetch(`${this.baseUrl}/api/folders?user_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    category: category
                })
            });

            return await response.json();
        } catch (error) {

            return { success: false, error: '创建失败' };
        }
    }

    // 更新文件夹
    async updateFolder(folderId, name) {
        const userId = this.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await fetch(`${this.baseUrl}/api/folders/${folderId}?user_id=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name })
            });

            return await response.json();
        } catch (error) {

            return { success: false, error: '更新失败' };
        }
    }

    // 删除文件夹
    async deleteFolder(folderId) {
        const userId = this.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

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
	async getTotalFileCount() {
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
		if (!userId) throw new Error('请先登录');

		try {
			const response = await fetch(`${this.baseUrl}/api/documents?user_id=${userId}`);
			const data = await response.json();
			
			if (response.ok && data.success) {
				return data.documents;
			} else {
				// 如果是401错误，说明权限不足
				if (response.status === 401) {
					throw new Error('权限不足，需要管理员权限');
				}
				// 其他错误
				throw new Error(data.error || '获取文档失败');
			}
		} catch (error) {
			throw error;
		}
	}

	// 创建文档
	async createDocument(formData) {
		const userId = this.getCurrentUserId();
		if (!userId) throw new Error('请先登录');

		try {
			const response = await fetch(`${this.baseUrl}/api/documents?user_id=${userId}`, {
				method: 'POST',
				body: formData
			});

			const data = await response.json();
			
			if (response.ok && data.success) {
				return data;
			} else {
				// 如果是401错误，说明权限不足
				if (response.status === 401) {
					throw new Error('权限不足，需要管理员权限');
				}
				// 其他错误
				throw new Error(data.error || '创建文档失败');
			}
		} catch (error) {
			throw error;
		}
	}

	// 删除文档
	async deleteDocument(docId) {
		const userId = this.getCurrentUserId();
		if (!userId) throw new Error('请先登录');

		try {
			const response = await fetch(`${this.baseUrl}/api/documents/${docId}?user_id=${userId}`, {
				method: 'DELETE'
			});

			const data = await response.json();
			
			if (response.ok && data.success) {
				return data;
			} else {
				// 如果是401错误，说明权限不足
				if (response.status === 401) {
					throw new Error('权限不足，需要管理员权限');
				}
				// 其他错误
				throw new Error(data.error || '删除文档失败');
			}
		} catch (error) {
			throw error;
		}
	}

    // 移动文件
    async moveFile(fileId, folderId) {
        const userId = this.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await fetch(`${this.baseUrl}/api/files/${fileId}/move?user_id=${userId}`, {
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
        if (!userId) return { success: false, error: '未登录' };

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
        if (!userId) return { success: false, error: '未登录' };

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`${this.baseUrl}/api/profile/avatar?user_id=${userId}`, {
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