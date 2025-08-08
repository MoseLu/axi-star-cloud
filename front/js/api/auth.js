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
                // 不把401包装成通用错误，让上层显示后端具体信息
                let message = '登录失败';
                try {
                    const errorData = await response.json();
                    message = errorData.error || errorData.message || message;
                } catch (_) {}
                throw new Error(message);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('登录失败:', error);
            // 如果是ApiError，提取错误信息
            if (error instanceof window.ApiError) {
                throw new Error(error.message);
            }
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
            // 如果是ApiError，提取错误信息
            if (error instanceof window.ApiError) {
                throw new Error(error.message);
            }
            throw error;
        }
    }

    // 退出登录
    async logout() {
        try {
            // 调用后端API设置离线状态
            const response = await window.apiGateway.post('/api/auth/logout');
            
            // 无论后端响应如何，都清除本地数据
            this.core.clearUserData();
            
            if (response.ok) {
                return { success: true, message: '已退出登录' };
            } else {
                console.warn('后端登出失败，但已清除本地数据');
                return { success: true, message: '已退出登录' };
            }
        } catch (error) {
            console.error('登出失败:', error);
            // 即使API调用失败，也清除本地数据
            this.core.clearUserData();
            return { success: true, message: '已退出登录' };
        }
    }
}

// 导出Auth类到全局作用域
window.Auth = Auth; 