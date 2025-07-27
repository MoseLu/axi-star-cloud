/**
 * 管理员功能API
 * 负责用户管理、存储管理等管理员功能
 */
class Admin {
    constructor(core) {
        this.core = core;
    }

    // 获取所有用户（管理员功能）
    async getAllUsers(page = 1, pageSize = 5) {
        
        // 移除前端权限检查，让后端API处理鉴权
        // 用户能看到管理员面板就说明已经通过了鉴权

        try {
            // 修复URL构建问题 - 在云端环境中API_BASE_URL为空字符串
            let apiUrl;
            if (this.core.baseUrl) {
                // 本地环境：使用完整URL
                const url = new URL(`${this.core.baseUrl}/api/admin/users`);
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
                    'User-UUID': this.core.getCurrentUserId(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // 确保发送cookies
            });

            return await response.json();
        } catch (error) {
            console.error('获取用户列表失败:', error);
            return { success: false, error: '网络错误' };
        }
    }

    // 更新用户存储限制（管理员功能）
    async updateUserStorage(uuid, storageLimit) {
        // 移除前端权限检查，让后端API处理鉴权
        // 用户能看到管理员面板就说明已经通过了鉴权

        try {
            // 修复URL构建问题
            const apiUrl = this.core.baseUrl ? `${this.core.baseUrl}/api/admin/users/storage` : '/api/admin/users/storage';
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'User-UUID': this.core.getCurrentUserId(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // 确保发送cookies
                body: JSON.stringify({ uuid, storage_limit: storageLimit })
            });

            return await response.json();
        } catch (error) {
            console.error('更新用户存储限制失败:', error);
            return { success: false, error: '网络错误' };
        }
    }
}

// 导出Admin类到全局作用域
window.Admin = Admin; 