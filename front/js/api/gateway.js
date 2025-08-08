/**
 * 统一API网关
 * 所有前端API请求都必须通过此网关，确保环境切换统一生效
 */

/**
 * 统一API网关
 * 所有前端API请求都必须通过此网关，确保环境切换统一生效
 */
class ApiGateway {
    constructor() {
        this.baseUrl = '';
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1秒
        this.init();
    }

    init() {
        // 立即尝试初始化，如果环境配置已准备好
        this.updateBaseUrl();
        
        // 如果baseUrl为空，延迟重试
        if (!this.baseUrl) {
            setTimeout(() => {
                this.updateBaseUrl();
                this.isInitialized = true;
            }, 500); // 增加延迟到500ms，确保环境配置已加载
        } else {
            this.isInitialized = true;
        }
        
        // 再次检查，如果仍然为空，继续重试
        if (!this.baseUrl) {
            setTimeout(() => {
                this.updateBaseUrl();
                if (!this.baseUrl) {
                    console.warn('⚠️ API网关baseUrl仍然为空，使用默认配置');
                    this.baseUrl = 'http://localhost:8080'; // 默认开发环境
                }
                this.isInitialized = true;
            }, 1000);
        }
    }

    // 更新baseUrl（用于环境切换）
    updateBaseUrl() {
        // 确保从最新的环境配置获取baseUrl
        if (window.ENV_MANAGER && typeof window.ENV_MANAGER.getCurrentEnvironment === 'function') {
            const currentConfig = window.ENV_MANAGER.getCurrentEnvironment();
            this.baseUrl = currentConfig.apiBaseUrl || '';
        } else if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
            this.baseUrl = window.APP_CONFIG.API_BASE_URL;
        } else {
            // 备用方案：根据当前域名自动设置
            const hostname = window.location.hostname;
            const port = window.location.port;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                this.baseUrl = `http://localhost:${port || '8080'}`;
            } else if (hostname.includes('redamancy.com.cn')) {
                this.baseUrl = 'https://redamancy.com.cn';
            } else {
                this.baseUrl = `http://${hostname}:${port || '8080'}`;
            }
        }
        
        // 验证更新是否成功
        if (!this.baseUrl) {
            console.warn('⚠️ API网关baseUrl为空，请检查环境配置');
        }
    }

    // 构建完整的API URL
    buildUrl(endpoint) {
        if (!endpoint) return '';
        
        // 如果已经是完整URL，直接返回
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        
        // 确保endpoint以/开头
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        return this.baseUrl ? this.baseUrl + endpoint : endpoint;
    }

    /**
     * 处理HTTP响应状态码
     */
    handleResponseStatus(response, endpoint) {
        const status = response.status;
        
        // 成功状态码
        if (status >= 200 && status < 300) {
            return response;
        }
        
        // 特殊状态码处理
        switch (status) {
            case window.HTTP_STATUS.UNAUTHORIZED:
                // 登录端点的401不应触发刷新token逻辑，直接返回给上层处理
                if (endpoint && (endpoint.endsWith('/api/auth/login') || endpoint.includes('/api/auth/login'))) {
                    return response;
                }
                return this.handleUnauthorized(response, endpoint);
                
            case window.HTTP_STATUS.NOT_FOUND:
                throw new window.ApiError(
                    status,
                    `API端点不存在: ${endpoint}`,
                    window.ERROR_TYPES.RESOURCE_NOT_FOUND
                );
                
            case window.HTTP_STATUS.CONFLICT:
                return this.handleConflict(response);
                
            case window.HTTP_STATUS.BAD_REQUEST:
                return this.handleBadRequest(response);
                
            case window.HTTP_STATUS.TOO_MANY_REQUESTS:
                throw new window.ApiError(
                    status,
                    '请求过于频繁，请稍后重试',
                    window.ERROR_TYPES.BUSINESS_ERROR
                );
                
            case window.HTTP_STATUS.INTERNAL_SERVER_ERROR:
                throw new window.ApiError(
                    status,
                    '服务器内部错误',
                    window.ERROR_TYPES.SERVER_ERROR
                );
                
            case window.HTTP_STATUS.SERVICE_UNAVAILABLE:
                throw new window.ApiError(
                    status,
                    '服务暂时不可用',
                    window.ERROR_TYPES.SERVICE_UNAVAILABLE
                );
                
            default:
                // 其他错误状态码
                throw new window.ApiError(
                    status,
                    `HTTP ${status}: ${response.statusText}`,
                    window.ERROR_TYPES.BUSINESS_ERROR
                );
        }
    }

    /**
     * 处理401未授权错误
     */
    async handleUnauthorized(response, endpoint) {
        console.warn('收到401错误，尝试刷新token...');
        
        // 尝试刷新token
        if (window.tokenManager && typeof window.tokenManager.refreshTokens === 'function') {
            try {
                await window.tokenManager.refreshTokens();
                // 重新发送请求
                return await this.request(endpoint);
            } catch (refreshError) {
                console.error('刷新token失败:', refreshError);
                // 不清除认证数据，给用户更多机会
                throw new window.ApiError(
                    window.HTTP_STATUS.UNAUTHORIZED,
                    '登录状态可能已过期，但您可以继续使用',
                    window.ERROR_TYPES.TOKEN_EXPIRED
                );
            }
        } else {
            console.error('tokenManager未找到或refreshTokens方法不存在');
            // 不清除认证数据，给用户更多机会
            throw new window.ApiError(
                window.HTTP_STATUS.UNAUTHORIZED,
                '认证失败，但您可以继续使用',
                window.ERROR_TYPES.AUTHENTICATION_ERROR
            );
        }
    }

    /**
     * 处理409冲突错误
     */
    async handleConflict(response) {
        try {
            const errorData = await response.json();
            const message = errorData.error || errorData.message || '操作冲突';
            throw new window.ApiError(
                window.HTTP_STATUS.CONFLICT,
                message,
                window.ERROR_TYPES.CONFLICT_ERROR,
                errorData
            );
        } catch (parseError) {
            throw new window.ApiError(
                window.HTTP_STATUS.CONFLICT,
                '操作冲突',
                window.ERROR_TYPES.CONFLICT_ERROR
            );
        }
    }

    /**
     * 处理400错误请求
     */
    async handleBadRequest(response) {
        try {
            const errorData = await response.json();
            const message = errorData.error || errorData.message || '请求参数错误';
            throw new window.ApiError(
                window.HTTP_STATUS.BAD_REQUEST,
                message,
                window.ERROR_TYPES.BUSINESS_ERROR,
                errorData
            );
        } catch (parseError) {
            // 如果无法解析JSON，使用默认错误信息
            throw new window.ApiError(
                window.HTTP_STATUS.BAD_REQUEST,
                '请求参数错误',
                window.ERROR_TYPES.BUSINESS_ERROR
            );
        }
    }

    /**
     * 清除认证数据
     */
    clearAuthData() {
        if (window.StorageManager && typeof window.StorageManager.clearUser === 'function') {
            window.StorageManager.clearUser();
        } else {
            localStorage.removeItem('userInfo');
        }
        if (window.tokenManager && typeof window.tokenManager.clearTokens === 'function') {
            window.tokenManager.clearTokens();
        } else {
            localStorage.removeItem('tokens');
        }
        window.location.href = '/';
    }

    /**
     * 解析错误响应
     */
    async parseErrorResponse(response) {
        try {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: errorText };
            }
            return errorData;
        } catch (e) {
            return { error: '解析错误响应失败' };
        }
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        // 等待API网关初始化完成
        if (!this.isInitialized) {
            await new Promise((resolve) => {
                const checkInit = () => {
                    if (this.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkInit, 50); // 减少检查间隔到50ms
                    }
                };
                checkInit();
            });
        }
        
        // 确保baseUrl已更新
        this.updateBaseUrl();
        
        const url = this.buildUrl(endpoint);
        
        // 设置默认headers（对于非文件上传请求）
        const headers = {};
        if (!options.body || !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        Object.assign(headers, options.headers);

        // 设置默认配置
        const config = {
            ...options,
            headers,
            credentials: 'include' // 包含cookie
        };

        try {
            const response = await fetch(url, config);
            
            // 处理响应状态码
            const processedResponse = await this.handleResponseStatus(response, endpoint);
            
            // 如果响应不成功，抛出错误
            if (!processedResponse.ok) {
                const errorData = await this.parseErrorResponse(processedResponse);
                throw new window.ApiError(
                    processedResponse.status,
                    errorData.error || errorData.message || `HTTP ${processedResponse.status}`,
                    window.ERROR_TYPES.BUSINESS_ERROR,
                    errorData
                );
            }
            
            return processedResponse;
        } catch (error) {
            // 如果是ApiError，直接抛出
            if (error instanceof window.ApiError) {
                throw error;
            }
            
            // 网络错误
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new window.ApiError(
                    0,
                    '网络连接失败',
                    window.ERROR_TYPES.NETWORK_ERROR
                );
            }
            
            // 超时错误
            if (error.name === 'AbortError') {
                throw new window.ApiError(
                    0,
                    '请求超时',
                    window.ERROR_TYPES.TIMEOUT_ERROR
                );
            }
            
            // 其他错误
            console.error(`API请求失败 (${endpoint}):`, error);
            throw new window.ApiError(
                0,
                error.message || '请求失败',
                window.ERROR_TYPES.BUSINESS_ERROR
            );
        }
    }

    // GET请求
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    // POST请求
    async post(endpoint, data = null, options = {}) {
        const config = {
            method: 'POST',
            ...options
        };
        
        if (data) {
            config.body = typeof data === 'string' ? data : JSON.stringify(data);
        }
        
        return this.request(endpoint, config);
    }

    // PUT请求
    async put(endpoint, data = null, options = {}) {
        const config = {
            method: 'PUT',
            ...options
        };
        
        if (data) {
            config.body = typeof data === 'string' ? data : JSON.stringify(data);
        }
        
        return this.request(endpoint, config);
    }

    // DELETE请求
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    // PATCH请求
    async patch(endpoint, data = null, options = {}) {
        const config = {
            method: 'PATCH',
            ...options
        };
        
        if (data) {
            config.body = typeof data === 'string' ? data : JSON.stringify(data);
        }
        
        return this.request(endpoint, config);
    }

    // 文件上传请求
    async upload(endpoint, formData, options = {}) {
        const config = {
            method: 'POST',
            body: formData,
            ...options
        };
        
        // 移除Content-Type，让浏览器自动设置multipart/form-data
        delete config.headers?.['Content-Type'];
        
        // 确保不设置任何Content-Type头，让浏览器自动处理
        if (config.headers) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }
        
        return this.request(endpoint, config);
    }

    // 下载文件
    async download(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    // 获取当前用户ID
    getCurrentUserId() {
        const currentUser = window.apiSystem?.getCurrentUser();
        return currentUser?.uuid;
    }

    // 检查是否为管理员
    async isAdmin() {
        try {
            // 优先检查当前用户是否为管理员用户（Mose）
            const currentUser = window.apiSystem?.getCurrentUser();
            if (currentUser && currentUser.username === 'Mose') {
                return true;
            }
            
            // 使用token验证管理员权限
            if (window.tokenManager && typeof window.tokenManager.validateAdminTokens === 'function') {
                return await window.tokenManager.validateAdminTokens();
            } else {
                return false;
            }
        } catch (error) {
            console.error('验证管理员权限失败:', error);
            return false;
        }
    }
}

// 创建全局API网关实例
window.apiGateway = new ApiGateway();

// 导出常量和类，供其他模块使用
window.HTTP_STATUS = HTTP_STATUS;
window.ERROR_TYPES = ERROR_TYPES;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.ApiError = ApiError; 