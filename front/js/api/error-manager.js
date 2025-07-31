/**
 * HTTP状态码常量定义
 */
const HTTP_STATUS = {
    // 成功状态码
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    
    // 重定向状态码
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    TEMPORARY_REDIRECT: 307,
    PERMANENT_REDIRECT: 308,
    
    // 客户端错误状态码
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    
    // 服务器错误状态码
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};

/**
 * 错误类型定义
 */
const ERROR_TYPES = {
    // 网络错误
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    
    // 认证错误
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    
    // 请求错误
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_REQUEST: 'INVALID_REQUEST',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    
    // 服务器错误
    SERVER_ERROR: 'SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    
    // 业务错误
    BUSINESS_ERROR: 'BUSINESS_ERROR',
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
    SEARCH_ERROR: 'SEARCH_ERROR'
};

/**
 * 错误消息映射
 */
const ERROR_MESSAGES = {
    [HTTP_STATUS.BAD_REQUEST]: '请求参数错误',
    [HTTP_STATUS.UNAUTHORIZED]: '未授权访问',
    [HTTP_STATUS.FORBIDDEN]: '访问被拒绝',
    [HTTP_STATUS.NOT_FOUND]: '资源不存在',
    [HTTP_STATUS.CONFLICT]: '资源冲突',
    [HTTP_STATUS.TOO_MANY_REQUESTS]: '请求过于频繁',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: '服务器内部错误',
    [HTTP_STATUS.SERVICE_UNAVAILABLE]: '服务暂时不可用',
    
    // 自定义错误消息
    'NETWORK_ERROR': '网络连接失败',
    'TIMEOUT_ERROR': '请求超时',
    'AUTHENTICATION_ERROR': '认证失败',
    'TOKEN_EXPIRED': '登录已过期，请重新登录',
    'VALIDATION_ERROR': '数据验证失败',
    'RESOURCE_NOT_FOUND': '请求的资源不存在',
    'CONFLICT_ERROR': '操作冲突',
    'BUSINESS_ERROR': '业务操作失败',
    'FILE_UPLOAD_ERROR': '文件上传失败',
    'SEARCH_ERROR': '搜索失败'
};

/**
 * API错误类
 */
class ApiError extends Error {
    constructor(status, message, type = null, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.type = type;
        this.details = details;
        this.timestamp = new Date();
    }
    
    /**
     * 获取用户友好的错误消息
     */
    getUserMessage() {
        if (this.message) {
            return this.message;
        }
        
        // 根据状态码获取默认消息
        if (this.status && ERROR_MESSAGES[this.status]) {
            return ERROR_MESSAGES[this.status];
        }
        
        // 根据错误类型获取默认消息
        if (this.type && ERROR_MESSAGES[this.type]) {
            return ERROR_MESSAGES[this.type];
        }
        
        return '操作失败，请稍后重试';
    }
    
    /**
     * 转换为JSON格式
     */
    toJSON() {
        return {
            name: this.name,
            status: this.status,
            type: this.type,
            message: this.message,
            userMessage: this.getUserMessage(),
            details: this.details,
            timestamp: this.timestamp
        };
    }
}

/**
 * 错误管理器
 */
class ErrorManager {
    constructor() {
        this.errorHandlers = new Map();
        this.setupDefaultHandlers();
    }
    
    /**
     * 设置默认错误处理器
     */
    setupDefaultHandlers() {
        // 401错误处理器
        this.registerHandler(HTTP_STATUS.UNAUTHORIZED, async (error) => {
            console.warn('收到401错误，尝试刷新token...');
            
            if (window.tokenManager && typeof window.tokenManager.refreshTokens === 'function') {
                try {
                    await window.tokenManager.refreshTokens();
                    return { retry: true };
                } catch (refreshError) {
                    console.warn('刷新token失败，但不清除用户数据，让用户继续使用:', refreshError);
                    // 不清除用户数据，给用户更多机会
                    throw new ApiError(
                        HTTP_STATUS.UNAUTHORIZED,
                        '登录状态可能已过期，但您可以继续使用',
                        ERROR_TYPES.TOKEN_EXPIRED
                    );
                }
            } else {
                console.warn('tokenManager未找到，不清除用户数据');
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    '认证失败，但您可以继续使用',
                    ERROR_TYPES.AUTHENTICATION_ERROR
                );
            }
        });
        
        // 409错误处理器
        this.registerHandler(HTTP_STATUS.CONFLICT, async (error) => {
            throw new ApiError(
                HTTP_STATUS.CONFLICT,
                error.message || '操作冲突',
                ERROR_TYPES.CONFLICT_ERROR,
                error.details
            );
        });
        
        // 404错误处理器
        this.registerHandler(HTTP_STATUS.NOT_FOUND, async (error) => {
            throw new ApiError(
                HTTP_STATUS.NOT_FOUND,
                '请求的资源不存在',
                ERROR_TYPES.RESOURCE_NOT_FOUND
            );
        });
        
        // 500错误处理器
        this.registerHandler(HTTP_STATUS.INTERNAL_SERVER_ERROR, async (error) => {
            throw new ApiError(
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                '服务器内部错误',
                ERROR_TYPES.SERVER_ERROR
            );
        });
    }
    
    /**
     * 注册错误处理器
     */
    registerHandler(status, handler) {
        this.errorHandlers.set(status, handler);
    }
    
    /**
     * 处理错误
     */
    async handleError(error) {
        const status = error.status || 0;
        const handler = this.errorHandlers.get(status);
        
        if (handler) {
            return await handler(error);
        }
        
        // 默认错误处理
        throw error;
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
     * 创建错误对象
     */
    createError(status, message, type = null, details = null) {
        return new ApiError(status, message, type, details);
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
}

// 创建全局错误管理器实例
window.errorManager = new ErrorManager();

// 导出常量和类，供其他模块使用
window.HTTP_STATUS = HTTP_STATUS;
window.ERROR_TYPES = ERROR_TYPES;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.ApiError = ApiError; 