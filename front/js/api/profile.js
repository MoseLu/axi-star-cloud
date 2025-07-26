/**
 * 个人资料API
 * 负责个人资料查询、更新、头像上传等功能
 */
class Profile {
    constructor(core) {
        this.core = core;
    }

    // 获取个人资料
    async getProfile() {
        const userId = this.core.getCurrentUserId();
        if (!userId) return null;

        try {
            const response = await window.apiGateway.get(`/api/profile?user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`获取个人资料失败: ${response.status}`);
            }
            const data = await response.json();
            return data.profile || data;
        } catch (error) {
            console.error('获取个人资料失败:', error);
            return null;
        }
    }

    // 更新个人资料
    async updateProfile(profileData) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await window.apiGateway.put(`/api/profile?user_id=${userId}`, profileData);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '更新个人资料失败');
            }

            return await response.json();
        } catch (error) {
            console.error('更新个人资料失败:', error);
            return { success: false, error: error.message || '更新失败' };
        }
    }

    // 上传头像
    async uploadAvatar(file) {
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await window.apiGateway.upload(`/api/profile/avatar?user_id=${userId}`, formData);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '头像上传失败');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('头像上传失败:', error);
            return { success: false, error: error.message || '上传失败' };
        }
    }
}

// 导出Profile类到全局作用域
window.Profile = Profile; 