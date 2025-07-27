/**
 * Token管理器
 * 负责处理双token机制，包括token刷新、验证和自动续期
 */
class TokenManager {
    constructor() {
        this.baseUrl = window.APP_CONFIG?.API_BASE_URL || '';
        this.isRefreshing = false;
        this.refreshPromise = null;
        
        // 设置自动刷新定时器
        this.setupAutoRefresh();
    }

    // 构建API URL
    buildApiUrl(endpoint) {
        if (!endpoint) return '';
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        return this.baseUrl ? this.baseUrl + endpoint : endpoint;
    }

    // 获取token信息
    getTokens() {
        if (window.StorageManager && typeof window.StorageManager.getSystemInfo === 'function') {
            const systemInfo = window.StorageManager.getSystemInfo() || {};
            return systemInfo.tokens || null;
        } else {
            const tokensStr = localStorage.getItem('tokens');
            return tokensStr ? JSON.parse(tokensStr) : null;
        }
    }

    // 获取管理员token信息
    getAdminTokens() {
        if (window.StorageManager && typeof window.StorageManager.getSystemInfo === 'function') {
            const systemInfo = window.StorageManager.getSystemInfo() || {};
            return systemInfo.adminTokens || null;
        } else {
            const adminTokensStr = localStorage.getItem('adminTokens');
            return adminTokensStr ? JSON.parse(adminTokensStr) : null;
        }
    }

    // 检查token是否过期
    isTokenExpired(tokenInfo) {
        if (!tokenInfo || !tokenInfo.expiresAt) return true;
        const expiresAt = new Date(tokenInfo.expiresAt);
        const now = new Date();
        // 提前5分钟刷新
        return now.getTime() > (expiresAt.getTime() - 5 * 60 * 1000);
    }

    // 检查管理员token是否过期
    isAdminTokenExpired(adminTokenInfo) {
        if (!adminTokenInfo || !adminTokenInfo.adminExpiresAt) return true;
        const expiresAt = new Date(adminTokenInfo.adminExpiresAt);
        const now = new Date();
        // 提前5分钟刷新
        return now.getTime() > (expiresAt.getTime() - 5 * 60 * 1000);
    }

    // 刷新普通用户token
    async refreshTokens() {
        if (this.isRefreshing) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this._doRefreshTokens();
        
        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    // 刷新管理员token
    async refreshAdminTokens() {
        if (this.isRefreshing) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this._doRefreshAdminTokens();
        
        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    // 执行刷新普通用户token
    async _doRefreshTokens() {
        const tokens = this.getTokens();
        if (!tokens || !tokens.refreshToken) {
            throw new Error('没有可用的刷新token');
        }

        try {
            const response = await fetch(this.buildApiUrl('/api/refresh-token'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: tokens.refreshToken
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                // 保存新的token
                const newTokenInfo = {
                    accessToken: data.tokens.access_token,
                    refreshToken: data.tokens.refresh_token,
                    expiresAt: data.tokens.expires_at
                };

                if (window.StorageManager && typeof window.StorageManager.setSystemInfo === 'function') {
                    const systemInfo = window.StorageManager.getSystemInfo() || {};
                    systemInfo.tokens = newTokenInfo;
                    window.StorageManager.setSystemInfo(systemInfo);
                } else {
                    localStorage.setItem('tokens', JSON.stringify(newTokenInfo));
                }

                return newTokenInfo;
            } else {
                throw new Error(data.error || '刷新token失败');
            }
        } catch (error) {
            console.error('刷新token失败:', error);
            // 刷新失败，清除token并跳转到登录页
            this.clearTokens();
            window.location.href = '/';
            throw error;
        }
    }

    // 执行刷新管理员token
    async _doRefreshAdminTokens() {
        const adminTokens = this.getAdminTokens();
        if (!adminTokens || !adminTokens.adminRefreshToken) {
            throw new Error('没有可用的管理员刷新token');
        }

        try {
            const response = await fetch(this.buildApiUrl('/api/refresh-admin-token'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admin_refresh_token: adminTokens.adminRefreshToken
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                // 保存新的管理员token
                const newAdminTokenInfo = {
                    adminAccessToken: data.admin_tokens.admin_access_token,
                    adminRefreshToken: data.admin_tokens.admin_refresh_token,
                    adminExpiresAt: data.admin_tokens.admin_expires_at
                };

                if (window.StorageManager && typeof window.StorageManager.setSystemInfo === 'function') {
                    const systemInfo = window.StorageManager.getSystemInfo() || {};
                    systemInfo.adminTokens = newAdminTokenInfo;
                    window.StorageManager.setSystemInfo(systemInfo);
                } else {
                    localStorage.setItem('adminTokens', JSON.stringify(newAdminTokenInfo));
                }

                return newAdminTokenInfo;
            } else {
                throw new Error(data.error || '刷新管理员token失败');
            }
        } catch (error) {
            console.error('刷新管理员token失败:', error);
            // 刷新失败，清除管理员token
            this.clearAdminTokens();
            throw error;
        }
    }

    // 验证普通用户token
    async validateTokens() {
        const tokens = this.getTokens();
        if (!tokens || !tokens.accessToken) {
            return false;
        }

        try {
            const response = await fetch(this.buildApiUrl('/api/validate-token'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: tokens.accessToken
                }),
                credentials: 'include'
            });

            const data = await response.json();
            return data.success && data.valid;
        } catch (error) {
            console.error('验证token失败:', error);
            return false;
        }
    }

    // 验证管理员token
    async validateAdminTokens() {
        const adminTokens = this.getAdminTokens();
        if (!adminTokens || !adminTokens.adminAccessToken) {
            return false;
        }

        try {
            const response = await fetch(this.buildApiUrl('/api/validate-admin-token'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    admin_access_token: adminTokens.adminAccessToken
                }),
                credentials: 'include'
            });

            const data = await response.json();
            return data.success && data.valid;
        } catch (error) {
            console.error('验证管理员token失败:', error);
            return false;
        }
    }

    // 清除token
    clearTokens() {
        if (window.StorageManager && typeof window.StorageManager.setSystemInfo === 'function') {
            const systemInfo = window.StorageManager.getSystemInfo() || {};
            delete systemInfo.tokens;
            window.StorageManager.setSystemInfo(systemInfo);
        } else {
            localStorage.removeItem('tokens');
        }
    }

    // 清除管理员token
    clearAdminTokens() {
        if (window.StorageManager && typeof window.StorageManager.setSystemInfo === 'function') {
            const systemInfo = window.StorageManager.getSystemInfo() || {};
            delete systemInfo.adminTokens;
            window.StorageManager.setSystemInfo(systemInfo);
        } else {
            localStorage.removeItem('adminTokens');
        }
    }

    // 设置自动刷新
    setupAutoRefresh() {
        // 每分钟检查一次token状态
        setInterval(() => {
            this.checkAndRefreshTokens();
        }, 60 * 1000);
    }

    // 检查并刷新token
    async checkAndRefreshTokens() {
        try {
            // 检查普通用户token
            const tokens = this.getTokens();
            if (tokens && this.isTokenExpired(tokens)) {
                await this.refreshTokens();
            }

            // 检查管理员token
            const adminTokens = this.getAdminTokens();
            if (adminTokens && this.isAdminTokenExpired(adminTokens)) {
                await this.refreshAdminTokens();
            }
        } catch (error) {
            console.error('自动刷新token失败:', error);
        }
    }

    // 获取有效的访问token（自动刷新）
    async getValidAccessToken() {
        const tokens = this.getTokens();
        if (!tokens) {
            throw new Error('没有可用的token');
        }

        if (this.isTokenExpired(tokens)) {
            const newTokens = await this.refreshTokens();
            return newTokens.accessToken;
        }

        return tokens.accessToken;
    }

    // 获取有效的管理员访问token（自动刷新）
    async getValidAdminAccessToken() {
        const adminTokens = this.getAdminTokens();
        if (!adminTokens) {
            throw new Error('没有可用的管理员token');
        }

        if (this.isAdminTokenExpired(adminTokens)) {
            const newAdminTokens = await this.refreshAdminTokens();
            return newAdminTokens.adminAccessToken;
        }

        return adminTokens.adminAccessToken;
    }
}

// 导出TokenManager类到全局作用域
window.TokenManager = TokenManager;

// 创建全局token管理器实例
window.tokenManager = new TokenManager(); 