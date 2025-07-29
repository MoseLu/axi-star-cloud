/**
 * 文件夹管理API
 * 负责文件夹的创建、删除、更新、查询等功能
 */
class Folders {
    constructor(core) {
        this.core = core;
    }

    // 获取文件夹列表
    async getFolders(category = null) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return [];

        let url = `/api/folders?user_id=${userId}`;
        if (category && category !== 'all') {
            url += `&category=${category}`;
        }

        try {
            const response = await window.apiGateway.get(url);
            if (!response.ok) {
                throw new Error(`获取文件夹列表失败: ${response.status}`);
            }
            const data = await response.json();
            return data.folders || [];
        } catch (error) {
            console.error('获取文件夹列表失败:', error);
            return [];
        }
    }

    // 创建文件夹
    async createFolder(name, category) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await window.apiGateway.post(`/api/folders?user_id=${userId}`, {
                name: name,
                category: category
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '创建文件夹失败');
            }

            return await response.json();
        } catch (error) {
            console.error('创建文件夹失败:', error);
            return { success: false, error: error.message || '创建失败' };
        }
    }

    // 更新文件夹
    async updateFolder(folderId, name, category = null) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const requestBody = { name: name };
            if (category) {
                requestBody.category = category;
            }

            const response = await window.apiGateway.put(`/api/folders/${folderId}?user_id=${userId}`, requestBody);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '更新文件夹失败');
            }

            return await response.json();
        } catch (error) {
            console.error('更新文件夹失败:', error);
            return { success: false, error: error.message || '更新失败' };
        }
    }

    // 删除文件夹
    async deleteFolder(folderId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await window.apiGateway.delete(`/api/folders/${folderId}?user_id=${userId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除文件夹失败');
            }

            return await response.json();
        } catch (error) {
            console.error('删除文件夹失败:', error);
            return { success: false, error: error.message || '删除失败' };
        }
    }

    // 获取文件夹文件数量（包括普通文件和URL文件）
    async getFolderFileCount(folderId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return 0;

        try {
            // 获取普通文件数量
            const [filesResponse, urlFilesResponse] = await Promise.all([
                window.apiGateway.get(`/api/folders/${folderId}/count?user_id=${userId}`),
                window.apiGateway.get(`/api/url-files/count?user_id=${userId}&folder_id=${folderId}`)
            ]);
            
            const filesData = await filesResponse.json();
            const urlFilesData = await urlFilesResponse.json();
            
            const filesCount = filesData.success ? filesData.count : 0;
            const urlFilesCount = urlFilesData.success ? urlFilesData.count : 0;
            
            return filesCount + urlFilesCount;
        } catch (error) {
            return 0;
        }
    }
}

// 导出Folders类到全局作用域
window.Folders = Folders; 