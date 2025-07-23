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

        let url = `${this.core.baseUrl}/api/folders?user_id=${userId}`;
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

    // 创建文件夹
    async createFolder(name, category) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await fetch(`${this.core.baseUrl}/api/folders?user_id=${userId}`, {
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
    async updateFolder(folderId, name, category = null) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const requestBody = { name: name };
            if (category) {
                requestBody.category = category;
            }

            const response = await fetch(`${this.core.baseUrl}/api/folders/${folderId}?user_id=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '更新失败' };
        }
    }

    // 删除文件夹
    async deleteFolder(folderId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await fetch(`${this.core.baseUrl}/api/folders/${folderId}?user_id=${userId}`, {
                method: 'DELETE'
            });

            return await response.json();
        } catch (error) {
            return { success: false, error: '删除失败' };
        }
    }

    // 获取文件夹文件数量（包括普通文件和URL文件）
    async getFolderFileCount(folderId) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return 0;

        try {
            // 获取普通文件数量
            const [filesResponse, urlFilesResponse] = await Promise.all([
                fetch(`${this.core.baseUrl}/api/folders/${folderId}/count?user_id=${userId}`),
                fetch(`${this.core.baseUrl}/api/url-files/count?user_id=${userId}&folder_id=${folderId}`)
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