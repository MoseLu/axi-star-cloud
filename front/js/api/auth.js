/**
 * 认证相关API
 * 负责用户登录、注册等认证功能
 */
class Auth {
    constructor(core) {
        this.core = core;
    }

    // 登录
    async login(username, password) {
        try {
            const response = await fetch(this.core.buildApiUrl('/api/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                this.core.setCurrentUser({
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
            const response = await fetch(this.core.buildApiUrl('/api/register'), {
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

    // 退出登录
    logout() {
        this.core.clearUserData();
        return { success: true, message: '已退出登录' };
    }
} 