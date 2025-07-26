/**
 * 文档管理API
 * 负责文档的创建、删除、查询等功能
 */
class Documents {
    constructor(core) {
        this.core = core;
    }

    // 获取所有文档
    async getDocuments() {
        const userId = this.core.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.core.baseUrl}/api/documents?user_id=${userId}`);
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
        const userId = this.core.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.core.baseUrl}/api/documents?user_id=${userId}`, {
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
        const userId = this.core.getCurrentUserId();
        if (!userId) throw new Error('请先登录');

        try {
            const response = await fetch(`${this.core.baseUrl}/api/documents/${docId}?user_id=${userId}`, {
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
}

// 导出Documents类到全局作用域
window.Documents = Documents; 