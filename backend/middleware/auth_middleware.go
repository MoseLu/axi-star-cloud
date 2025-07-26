/**
 * 认证中间件
 * 
 * 负责处理用户权限验证和token检查，包括：
 * - 普通用户权限验证
 * - 管理员权限验证
 * - Token有效性检查
 * - 用户信息注入到上下文
 * 
 * 该中间件将认证逻辑与业务逻辑分离，提供统一的权限控制
 */

package middleware

import (
	"fmt"
	"net/http"

	"backend/database"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware 认证中间件
type AuthMiddleware struct {
	userRepo     *database.UserRepository
	tokenManager *utils.TokenManager
}

// NewAuthMiddleware 创建认证中间件
func NewAuthMiddleware(userRepo *database.UserRepository) *AuthMiddleware {
	return &AuthMiddleware{
		userRepo:     userRepo,
		tokenManager: utils.NewTokenManager(),
	}
}

// CheckUserPermission 检查普通用户权限的中间件
func (am *AuthMiddleware) CheckUserPermission() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从cookie中获取访问token
		accessToken, err := c.Cookie("access_token")
		if err != nil {
			fmt.Printf("认证失败：未提供用户token，错误: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供用户token"})
			c.Abort()
			return
		}

		// 验证访问token
		claims, err := am.tokenManager.ValidateAccessToken(accessToken)
		if err != nil {
			fmt.Printf("认证失败：无效的用户token，错误: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的用户token"})
			c.Abort()
			return
		}

		// 获取用户信息
		user, err := am.userRepo.GetUserByUUID(claims.UserUUID)
		if err != nil {
			fmt.Printf("认证失败：获取用户信息失败，错误: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
			c.Abort()
			return
		}

		if user == nil {
			fmt.Printf("认证失败：用户不存在，UUID: %s\n", claims.UserUUID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户不存在"})
			c.Abort()
			return
		}

		// 将用户信息存储到上下文中
		c.Set("currentUser", user)
		c.Next()
	}
}

// CheckAdminPermission 检查管理员权限的中间件
func (am *AuthMiddleware) CheckAdminPermission() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("检查管理员权限 - 路径: %s\n", c.Request.URL.Path)

		// 从cookie中获取管理员访问token
		adminAccessToken, err := c.Cookie("admin_access_token")
		if err != nil {
			fmt.Printf("未找到管理员token cookie: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供管理员token"})
			c.Abort()
			return
		}

		fmt.Printf("找到管理员token: %s\n", adminAccessToken[:10]+"...")

		// 验证管理员访问token
		claims, err := am.tokenManager.ValidateAdminAccessToken(adminAccessToken)
		if err != nil {
			fmt.Printf("管理员token验证失败: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的管理员token"})
			c.Abort()
			return
		}

		fmt.Printf("管理员token验证成功，用户UUID: %s\n", claims.UserUUID)

		// 获取用户信息
		user, err := am.userRepo.GetUserByUUID(claims.UserUUID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
			c.Abort()
			return
		}

		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户不存在"})
			c.Abort()
			return
		}

		// 检查是否为管理员用户（Mose）
		fmt.Printf("检查用户是否为管理员: %s\n", user.Username)
		if user.Username != "Mose" {
			fmt.Printf("用户 %s 不是管理员，拒绝访问\n", user.Username)
			c.JSON(http.StatusForbidden, gin.H{"error": "权限不足，需要管理员权限"})
			c.Abort()
			return
		}

		fmt.Printf("用户 %s 管理员权限验证通过\n", user.Username)

		// 将用户信息存储到上下文中
		c.Set("currentUser", user)
		c.Next()
	}
}

// OptionalAuth 可选的认证中间件（不强制要求认证）
func (am *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 尝试从cookie中获取访问token
		accessToken, err := c.Cookie("access_token")
		if err != nil {
			// 如果没有token，继续执行，不中断请求
			c.Next()
			return
		}

		// 验证访问token
		claims, err := am.tokenManager.ValidateAccessToken(accessToken)
		if err != nil {
			// 如果token无效，继续执行，不中断请求
			c.Next()
			return
		}

		// 获取用户信息
		user, err := am.userRepo.GetUserByUUID(claims.UserUUID)
		if err != nil || user == nil {
			// 如果用户不存在，继续执行，不中断请求
			c.Next()
			return
		}

		// 将用户信息存储到上下文中
		c.Set("currentUser", user)
		c.Next()
	}
} 