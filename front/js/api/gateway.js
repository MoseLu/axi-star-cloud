/**
 * 统一API网关
 * 所有前端API请求都必须通过此网关，确保环境切换统一生效
 */
class ApiGateway {
    constructor() {
        this.baseUrl = '';
        this.isInitialized = false;
        this.init();
    }

    init() {
        // 延迟初始化，确保环境配置已准备好
        setTimeout(() => {
            this.updateBaseUrl();
            this.isInitialized = true;
        }, 100);
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
            this.baseUrl = '';
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

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = this.buildUrl(endpoint);
        
        // 设置默认headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // 添加认证token（如果存在）
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            // 处理404错误（环境切换时可能出现）
            if (response.status === 404) {
                console.warn(`API网关404错误: ${url}`);
                // 可以在这里添加404处理逻辑
            }
            
            return response;
        } catch (error) {
            console.error(`API网关请求失败: ${url}`, error);
            throw error;
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
    isAdmin() {
        const currentUser = window.apiSystem?.getCurrentUser();
        return currentUser?.isAdmin === true;
    }
}

// 创建全局API网关实例
window.apiGateway = new ApiGateway(); 