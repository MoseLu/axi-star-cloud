/**
 * 全局错误处理中间件
 * 
 * 负责统一处理应用中的错误，包括：
 * - 数据库错误处理
 * - 文件操作错误处理
 * - 认证错误处理
 * - 业务逻辑错误处理
 * - 系统错误处理
 * 
 * 该中间件提供统一的错误响应格式和日志记录
 */

package middleware

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// ErrorResponse 统一错误响应格式
type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    int    `json:"code,omitempty"`
	Detail  string `json:"detail,omitempty"`
}

// ErrorHandler 全局错误处理中间件
func ErrorHandler() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		// 记录错误日志
		log.Printf("Panic recovered: %v\n%s", recovered, debug.Stack())
		
		// 返回统一的错误响应
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   "服务器内部错误",
			Code:    500,
			Detail:  fmt.Sprintf("%v", recovered),
		})
	})
}

// DatabaseErrorHandler 数据库错误处理
func DatabaseErrorHandler(err error) (int, ErrorResponse) {
	if err == nil {
		return http.StatusOK, ErrorResponse{Success: true}
	}
	
	// 根据错误类型返回不同的状态码
	switch {
	case err.Error() == "sql: no rows in result set":
		return http.StatusNotFound, ErrorResponse{
			Success: false,
			Error:   "数据不存在",
			Code:    404,
		}
	default:
		log.Printf("数据库错误: %v", err)
		return http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   "数据库操作失败",
			Code:    500,
		}
	}
}

// FileErrorHandler 文件操作错误处理
func FileErrorHandler(err error) (int, ErrorResponse) {
	if err == nil {
		return http.StatusOK, ErrorResponse{Success: true}
	}
	
	switch {
	case err.Error() == "file not found":
		return http.StatusNotFound, ErrorResponse{
			Success: false,
			Error:   "文件不存在",
			Code:    404,
		}
	case err.Error() == "permission denied":
		return http.StatusForbidden, ErrorResponse{
			Success: false,
			Error:   "权限不足",
			Code:    403,
		}
	default:
		log.Printf("文件操作错误: %v", err)
		return http.StatusInternalServerError, ErrorResponse{
			Success: false,
			Error:   "文件操作失败",
			Code:    500,
		}
	}
}

// ValidationErrorHandler 验证错误处理
func ValidationErrorHandler(err error) (int, ErrorResponse) {
	return http.StatusBadRequest, ErrorResponse{
		Success: false,
		Error:   "参数验证失败",
		Code:    400,
		Detail:  err.Error(),
	}
}

// AuthErrorHandler 认证错误处理
func AuthErrorHandler(err error) (int, ErrorResponse) {
	switch {
	case err.Error() == "invalid token":
		return http.StatusUnauthorized, ErrorResponse{
			Success: false,
			Error:   "无效的认证令牌",
			Code:    401,
		}
	case err.Error() == "token expired":
		return http.StatusUnauthorized, ErrorResponse{
			Success: false,
			Error:   "认证令牌已过期",
			Code:    401,
		}
	default:
		return http.StatusUnauthorized, ErrorResponse{
			Success: false,
			Error:   "认证失败",
			Code:    401,
		}
	}
} 