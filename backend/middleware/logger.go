/**
 * 请求日志中间件
 * 
 * 负责记录HTTP请求的详细信息，包括：
 * - 请求方法和路径
 * - 请求头信息
 * - 响应状态码
 * - 请求处理时间
 * - 客户端IP地址
 * - 用户代理信息
 * 
 * 该中间件提供详细的请求追踪和性能监控
 */

package middleware

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger 请求日志中间件
func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// 自定义日志格式
		return fmt.Sprintf("[GIN] %v | %3d | %13v | %15s | %-7s %s\n%s",
			param.TimeStamp.Format("2006/01/02 - 15:04:05"),
			param.StatusCode,
			param.Latency,
			param.ClientIP,
			param.Method,
			param.Path,
			param.ErrorMessage,
		)
	})
}

// DetailedLogger 详细日志中间件
func DetailedLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开始时间
		start := time.Now()
		
		// 获取客户端IP
		clientIP := c.ClientIP()
		if forwardedFor := c.GetHeader("X-Forwarded-For"); forwardedFor != "" {
			clientIP = forwardedFor
		}
		
		// 获取用户代理
		userAgent := c.GetHeader("User-Agent")
		
		// 记录请求开始
		log.Printf("[REQUEST] %s %s | IP: %s | User-Agent: %s",
			c.Request.Method,
			c.Request.URL.Path,
			clientIP,
			userAgent,
		)
		
		// 处理请求
		c.Next()
		
		// 计算处理时间
		latency := time.Since(start)
		
		// 记录响应信息
		statusCode := c.Writer.Status()
		statusText := http.StatusText(statusCode)
		
		log.Printf("[RESPONSE] %s %s | Status: %d %s | Latency: %v | Size: %d bytes",
			c.Request.Method,
			c.Request.URL.Path,
			statusCode,
			statusText,
			latency,
			c.Writer.Size(),
		)
		
		// 记录错误信息
		if len(c.Errors) > 0 {
			for _, err := range c.Errors {
				log.Printf("[ERROR] %s %s | Error: %v",
					c.Request.Method,
					c.Request.URL.Path,
					err.Error(),
				)
			}
		}
	}
}

// PerformanceLogger 性能监控中间件
func PerformanceLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		
		// 处理请求
		c.Next()
		
		latency := time.Since(start)
		
		// 记录慢请求（超过1秒的请求）
		if latency > time.Second {
			log.Printf("[SLOW_REQUEST] %s %s | Latency: %v | Status: %d",
				c.Request.Method,
				c.Request.URL.Path,
				latency,
				c.Writer.Status(),
			)
		}
		
		// 记录超时请求（超过5秒的请求）
		if latency > 5*time.Second {
			log.Printf("[TIMEOUT_REQUEST] %s %s | Latency: %v | Status: %d",
				c.Request.Method,
				c.Request.URL.Path,
				latency,
				c.Writer.Status(),
			)
		}
	}
}

// SecurityLogger 安全日志中间件
func SecurityLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查可疑请求
		path := c.Request.URL.Path
		userAgent := c.GetHeader("User-Agent")
		
		// 记录可疑的User-Agent
		if userAgent == "" || len(userAgent) < 10 {
			log.Printf("[SECURITY] Empty or suspicious User-Agent: %s | IP: %s | Path: %s",
				userAgent,
				c.ClientIP(),
				path,
			)
		}
		
		// 记录访问敏感路径的请求
		sensitivePaths := []string{"/admin", "/api/admin", "/config", "/.env"}
		for _, sensitivePath := range sensitivePaths {
			if path == sensitivePath {
				log.Printf("[SECURITY] Access to sensitive path: %s | IP: %s | User-Agent: %s",
					path,
					c.ClientIP(),
					userAgent,
				)
				break
			}
		}
		
		c.Next()
	}
} 