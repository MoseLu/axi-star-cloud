/**
 * URL文件管理API
 * 负责URL文件的创建、删除、查询、移动等功能
 */
class UrlFiles {
    constructor(core) {
        this.core = core;
    }

    // 获取URL文件列表
    async getUrlFiles(folderId = null) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return [];

        let url = `/api/url-files?user_id=${userId}`;
        if (folderId) {
            url += `&folder_id=${folderId}`;
        }

        try {
            const response = await window.apiGateway.get(url);
            if (!response.ok) {
                throw new Error(`获取URL文件列表失败: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.files) {
                // 转换后端数据格式为前端格式
                const files = data.files.map(file => {
                    return {
                        id: file.id,
                        name: file.title, // URL文件使用title作为显示名称
                        size: 0, // URL文件没有实际大小
                        date: (() => {
                            const date = new Date(file.created_at);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })(),
                        type: 'url',
                        icon: 'fa-link', // URL文件使用链接图标
                        iconColor: 'text-blue-500',
                        url: file.url,
                        description: file.description,
                        folder_id: file.folder_id
                    };
                });
                return files;
            } else {
                return [];
            }
        } catch (error) {
            console.error('获取URL文件列表失败:', error);
            return [];
        }
    }

    // 删除URL文件
    async deleteUrlFile(fileId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '用户未登录' };

        try {
            const response = await window.apiGateway.delete(`/api/url-files/${fileId}?user_id=${userId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除URL文件失败');
            }

            return await response.json();
        } catch (error) {
            console.error('删除URL文件失败:', error);
            return { success: false, error: error.message || '网络错误' };
        }
    }

    // 创建URL文件
    async createUrlFile(urlData) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '用户未登录' };

        try {
            const response = await window.apiGateway.post('/api/url-files', {
                title: urlData.title,
                url: urlData.url,
                description: urlData.description || '',
                user_id: userId
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '创建URL文件失败');
            }

            return await response.json();
        } catch (error) {
            console.error('创建URL文件失败:', error);
            return { success: false, error: error.message || '网络错误' };
        }
    }

    // 移动URL文件
    async moveUrlFile(fileId, folderId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await window.apiGateway.put(`/api/url-files/${fileId}/move?user_id=${userId}`, {
                folder_id: folderId
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '移动URL文件失败');
            }

            return await response.json();
        } catch (error) {
            console.error('移动URL文件失败:', error);
            return { success: false, error: error.message || '移动失败' };
        }
    }
}

// 导出UrlFiles类到全局作用域
window.UrlFiles = UrlFiles; 