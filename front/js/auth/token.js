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

    // 获取token信息（从cookie）
    getTokens() {
        // 从cookie中获取token
        const cookies = document.cookie.split(';');
        const accessToken = cookies.find(cookie => cookie.trim().startsWith('access_token='));
        const refreshToken = cookies.find(cookie => cookie.trim().startsWith('refresh_token='));
        
        if (accessToken && refreshToken) {
            const accessTokenValue = accessToken.split('=')[1];
            const refreshTokenValue = refreshToken.split('=')[1];
            
            // 从本地存储获取过期时间（可选）
            let tokens = null;
            let expiresAt = null;
            if (window.StorageManager && typeof window.StorageManager.getSystemInfo === 'function') {
                const systemInfo = window.StorageManager.getSystemInfo() || {};
                tokens = systemInfo.tokens || null;
                expiresAt = tokens ? tokens.expiresAt : null;
            } else {
                const tokensStr = localStorage.getItem('tokens');
                tokens = tokensStr ? JSON.parse(tokensStr) : null;
                expiresAt = tokens ? tokens.expiresAt : null;
            }
            
            return {
                accessToken: accessTokenValue,
                refreshToken: refreshTokenValue,
                expiresAt: expiresAt
            };
        }
        
        return null;
    }

    // 获取管理员token信息（从cookie）
    getAdminTokens() {
        // 从cookie中获取管理员token
        const cookies = document.cookie.split(';');
        const adminAccessToken = cookies.find(cookie => cookie.trim().startsWith('admin_access_token='));
        const adminRefreshToken = cookies.find(cookie => cookie.trim().startsWith('admin_refresh_token='));
        
        if (adminAccessToken && adminRefreshToken) {
            const adminAccessTokenValue = adminAccessToken.split('=')[1];
            const adminRefreshTokenValue = adminRefreshToken.split('=')[1];
            
            // 从本地存储获取过期时间（可选）
            let adminTokens = null;
            let adminExpiresAt = null;
            if (window.StorageManager && typeof window.StorageManager.getSystemInfo === 'function') {
                const systemInfo = window.StorageManager.getSystemInfo() || {};
                adminTokens = systemInfo.adminTokens || null;
                adminExpiresAt = adminTokens ? adminTokens.adminExpiresAt : null;
            } else {
                const adminTokensStr = localStorage.getItem('adminTokens');
                adminTokens = adminTokensStr ? JSON.parse(adminTokensStr) : null;
                adminExpiresAt = adminTokens ? adminTokens.adminExpiresAt : null;
            }
            
            return {
                adminAccessToken: adminAccessTokenValue,
                adminRefreshToken: adminRefreshTokenValue,
                adminExpiresAt: adminExpiresAt
            };
        }
        
        return null;
    }

    // 检查token是否过期
    isTokenExpired(tokenInfo) {
        if (!tokenInfo || !tokenInfo.expiresAt) return true;
        const expiresAt = new Date(tokenInfo.expiresAt);
        const now = new Date();
        // 提前1分钟刷新（从5分钟改为1分钟）
        return now.getTime() >= (expiresAt.getTime() - 1 * 60 * 1000);
    }

    // 调试方法：检查cookie状态
    debugTokens() {
        // 检查所有cookie
        const allCookies = document.cookie;
        
        // 获取各种token
        const accessToken = allCookies.split(';').find(cookie => cookie.trim().startsWith('access_token='));
        const refreshToken = allCookies.split(';').find(cookie => cookie.trim().startsWith('refresh_token='));
        const adminAccessToken = allCookies.split(';').find(cookie => cookie.trim().startsWith('admin_access_token='));
        const adminRefreshToken = allCookies.split(';').find(cookie => cookie.trim().startsWith('admin_refresh_token='));
        
        // 检查是否为本地环境
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.startsWith('192.168.') ||
                           window.location.hostname.startsWith('10.');
        
        // 获取localStorage中的用户信息
        const userInfo = localStorage.getItem('userInfo');
        
        // 获取token信息
        const tokens = this.getTokens();
        const adminTokens = this.getAdminTokens();
        
        return {
            allCookies,
            accessToken: accessToken ? accessToken.split('=')[1] : null,
            refreshToken: refreshToken ? refreshToken.split('=')[1] : null,
            adminAccessToken: adminAccessToken ? adminAccessToken.split('=')[1] : null,
            adminRefreshToken: adminRefreshToken ? adminRefreshToken.split('=')[1] : null,
            isLocalhost,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            userInfo: userInfo ? JSON.parse(userInfo) : null,
            tokens,
            adminTokens
        };
    }

    // 检查管理员token是否过期
    isAdminTokenExpired(adminTokenInfo) {
        if (!adminTokenInfo || !adminTokenInfo.adminExpiresAt) return true;
        const expiresAt = new Date(adminTokenInfo.adminExpiresAt);
        const now = new Date();
        // 提前1分钟刷新（从5分钟改为1分钟）
        return now.getTime() > (expiresAt.getTime() - 1 * 60 * 1000);
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
        // 清除localStorage中的token
    }

    // 清除管理员token
    clearAdminTokens() {
        // 清除localStorage中的管理员token
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
            return null;
        }

        if (this.isTokenExpired(tokens)) {
            try {
                const newTokens = await this.refreshTokens();
                return newTokens.accessToken;
            } catch (error) {
                console.warn('刷新token失败:', error);
                return null;
            }
        }

        return tokens.accessToken;
    }

    // 获取有效的管理员访问token（自动刷新）
    async getValidAdminAccessToken() {
        const adminTokens = this.getAdminTokens();
        if (!adminTokens) {
            return null;
        }

        if (this.isAdminTokenExpired(adminTokens)) {
            try {
                const newAdminTokens = await this.refreshAdminTokens();
                return newAdminTokens.adminAccessToken;
            } catch (error) {
                console.warn('刷新管理员token失败:', error);
                return null;
            }
        }

        return adminTokens.adminAccessToken;
    }
}

// 导出TokenManager类到全局作用域
window.TokenManager = TokenManager;

// 创建全局token管理器实例
window.tokenManager = new TokenManager(); 