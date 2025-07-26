/**
 * 存储管理API
 * 负责存储信息查询、限制更新等功能
 */
class Storage {
    constructor(core) {
        this.core = core;
    }

    // 获取存储信息
    async getStorageInfo() {
        const userId = this.core.getCurrentUserId();
        if (!userId) {
            console.warn('用户未登录，无法获取存储信息');
            return null;
        }

        try {
            const response = await window.apiGateway.get(`/api/storage?user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`获取存储信息失败: ${response.status}`);
            }
            const data = await response.json();
            
            // 返回存储信息对象，而不是完整的响应
            if (data.success && data.storage) {
                return data.storage;
            } else {
                console.error('存储信息格式错误:', data);
                return null;
            }
        } catch (error) {
            console.error('获取存储信息失败:', error);
            return null;
        }
    }

    // 更新存储限制
    async updateStorageLimit(storageBytes) {
        const userId = this.core.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await window.apiGateway.put(`/api/storage?user_id=${userId}`, {
                storage_limit: storageBytes
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '更新存储限制失败');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('更新存储限制失败:', error);
            throw error;
        }
    }

    // 获取用户所有文件总数（包括普通文件和URL文件）
    async getTotalFileCount() {
        const userId = this.core.getCurrentUserId();
        if (!userId) return 0;

        try {
            const [filesResponse, urlFilesResponse] = await Promise.all([
                window.apiGateway.get(`/api/files/count?user_id=${userId}`),
                window.apiGateway.get(`/api/url-files/count?user_id=${userId}`)
            ]);
            
            const filesData = await filesResponse.json();
            const urlFilesData = await urlFilesResponse.json();
            
            const filesCount = filesData.success ? filesData.count : 0;
            const urlFilesCount = urlFilesData.success ? urlFilesData.count : 0;
            
            const totalCount = filesCount + urlFilesCount;

            return totalCount;
        } catch (error) {
            console.error('获取文件总数失败:', error);
            return 0;
        }
    }
}

// 导出Storage类到全局作用域
window.Storage = Storage; 