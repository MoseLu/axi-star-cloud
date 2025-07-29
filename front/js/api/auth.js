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
            const response = await window.apiGateway.post('/api/auth/login', {
                username: username,
                password: password
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '登录失败');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }

    // 注册
    async register(username, password, email = '') {
        try {
            const response = await window.apiGateway.post('/api/auth/register', {
                username: username,
                password: password,
                email: email
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '注册失败');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    }

    // 退出登录
    logout() {
        this.core.clearUserData();
        return { success: true, message: '已退出登录' };
    }
}

// 导出Auth类到全局作用域
window.Auth = Auth; 