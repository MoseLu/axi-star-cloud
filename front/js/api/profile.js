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
            const response = await fetch(`${this.core.baseUrl}/api/profile?user_id=${userId}`);
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
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        try {
            const response = await fetch(`${this.core.baseUrl}/api/profile?user_id=${userId}`, {
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
        const userId = this.core.getCurrentUserId();
        if (!userId) return { success: false, error: '未登录' };

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`${this.core.baseUrl}/api/profile/avatar?user_id=${userId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            return result;
        } catch (error) {
            console.error('❌ 头像上传失败:', error);
            return { success: false, error: '上传失败' };
        }
    }
} 