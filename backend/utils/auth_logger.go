/**
 * 认证日志记录器
 *
 * 负责记录认证相关的操作日志，包括：
 * - 用户登录日志
 * - 用户注册日志
 * - 用户登出日志
 * - Token验证日志
 * - 权限检查日志
 * - 安全事件日志
 *
 * 该日志记录器提供详细的认证操作追踪
 */

package utils

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// AuthLogger 认证日志记录器
type AuthLogger struct {
	logger *log.Logger
}

// NewAuthLogger 创建认证日志记录器
func NewAuthLogger() *AuthLogger {
	return &AuthLogger{
		logger: log.New(log.Writer(), "[AUTH] ", log.LstdFlags|log.Lshortfile),
	}
}

// LogUserLogin 记录用户登录日志
func (al *AuthLogger) LogUserLogin(username, userUUID string, success bool, ipAddress string) {
	status := "失败"
	if success {
		status = "成功"
	}

	al.logger.Printf("用户登录 - 用户名: %s, UUID: %s, 状态: %s, IP: %s, 时间: %s",
		username, userUUID, status, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogUserRegister 记录用户注册日志
func (al *AuthLogger) LogUserRegister(username, userUUID string, success bool, ipAddress string) {
	status := "失败"
	if success {
		status = "成功"
	}

	al.logger.Printf("用户注册 - 用户名: %s, UUID: %s, 状态: %s, IP: %s, 时间: %s",
		username, userUUID, status, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogUserLogout 记录用户登出日志
func (al *AuthLogger) LogUserLogout(username, userUUID string, ipAddress string) {
	al.logger.Printf("用户登出 - 用户名: %s, UUID: %s, IP: %s, 时间: %s",
		username, userUUID, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogTokenValidation 记录Token验证日志
func (al *AuthLogger) LogTokenValidation(userUUID, tokenType string, success bool, ipAddress string) {
	status := "失败"
	if success {
		status = "成功"
	}

	al.logger.Printf("Token验证 - UUID: %s, 类型: %s, 状态: %s, IP: %s, 时间: %s",
		userUUID, tokenType, status, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogTokenRefresh 记录Token刷新日志
func (al *AuthLogger) LogTokenRefresh(userUUID, tokenType string, success bool, ipAddress string) {
	status := "失败"
	if success {
		status = "成功"
	}

	al.logger.Printf("Token刷新 - UUID: %s, 类型: %s, 状态: %s, IP: %s, 时间: %s",
		userUUID, tokenType, status, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogPermissionCheck 记录权限检查日志
func (al *AuthLogger) LogPermissionCheck(username, userUUID, permissionType string, success bool, ipAddress string) {
	status := "失败"
	if success {
		status = "成功"
	}

	al.logger.Printf("权限检查 - 用户名: %s, UUID: %s, 权限类型: %s, 状态: %s, IP: %s, 时间: %s",
		username, userUUID, permissionType, status, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogSecurityEvent 记录安全事件日志
func (al *AuthLogger) LogSecurityEvent(eventType, username, userUUID, details string, ipAddress string) {
	al.logger.Printf("安全事件 - 类型: %s, 用户名: %s, UUID: %s, 详情: %s, IP: %s, 时间: %s",
		eventType, username, userUUID, details, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogAdminAction 记录管理员操作日志
func (al *AuthLogger) LogAdminAction(adminUsername, action, targetUserUUID string, success bool, ipAddress string) {
	status := "失败"
	if success {
		status = "成功"
	}

	al.logger.Printf("管理员操作 - 管理员: %s, 操作: %s, 目标用户: %s, 状态: %s, IP: %s, 时间: %s",
		adminUsername, action, targetUserUUID, status, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogFailedLoginAttempt 记录失败的登录尝试
func (al *AuthLogger) LogFailedLoginAttempt(username, reason, ipAddress string) {
	al.logger.Printf("登录失败 - 用户名: %s, 原因: %s, IP: %s, 时间: %s",
		username, reason, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogUserStorageUpdate 记录用户存储限制更新日志
func (al *AuthLogger) LogUserStorageUpdate(adminUsername, targetUserUUID string, oldLimit, newLimit int64, success bool, ipAddress string) {
	status := "失败"
	if success {
		status = "成功"
	}

	al.logger.Printf("存储限制更新 - 管理员: %s, 目标用户: %s, 旧限制: %d, 新限制: %d, 状态: %s, IP: %s, 时间: %s",
		adminUsername, targetUserUUID, oldLimit, newLimit, status, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// LogUserListAccess 记录用户列表访问日志
func (al *AuthLogger) LogUserListAccess(adminUsername string, page, pageSize int, success bool, ipAddress string) {
	status := "失败"
	if success {
		status = "成功"
	}

	al.logger.Printf("用户列表访问 - 管理员: %s, 页码: %d, 页大小: %d, 状态: %s, IP: %s, 时间: %s",
		adminUsername, page, pageSize, status, ipAddress, time.Now().Format("2006-01-02 15:04:05"))
}

// GetClientIP 获取客户端IP地址
func GetClientIP(c *gin.Context) string {
	// 尝试从不同的头部获取真实IP
	if ip := c.GetHeader("X-Real-IP"); ip != "" {
		return ip
	}
	if ip := c.GetHeader("X-Forwarded-For"); ip != "" {
		return ip
	}
	return c.ClientIP()
}

// FormatAuthLogMessage 格式化认证日志消息
func FormatAuthLogMessage(action, username, userUUID string, success bool) string {
	status := "失败"
	if success {
		status = "成功"
	}

	return fmt.Sprintf("%s - 用户名: %s, UUID: %s, 状态: %s", action, username, userUUID, status)
}
