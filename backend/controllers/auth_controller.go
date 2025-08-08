/**
 * 认证控制器
 *
 * 负责处理认证相关的HTTP请求和响应，包括：
 * - 用户注册接口
 * - 用户登录接口
 * - 用户登出接口
 * - Token验证接口
 * - Token刷新接口
 * - 管理员功能接口
 *
 * 该控制器将HTTP处理与业务逻辑分离，专注于请求处理和响应格式化
 */

package controllers

import (
	"net/http"
	"strconv"
	"time"

	"backend/models"
	"backend/services"
	"backend/utils"

	"github.com/gin-gonic/gin"
    "strings"
)

// AuthController 认证控制器
type AuthController struct {
	authService   *services.AuthService
	cookieManager *utils.CookieManager
}

// NewAuthController 创建认证控制器
func NewAuthController(authService *services.AuthService) *AuthController {
	return &AuthController{
		authService:   authService,
		cookieManager: utils.NewCookieManager(),
	}
}

// Register 处理注册请求
func (ac *AuthController) Register(c *gin.Context) {
	var registerData models.RegisterRequest

	// 绑定请求数据
	if err := c.ShouldBindJSON(&registerData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 调用服务层处理注册
	response, err := ac.authService.Register(registerData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Login 处理登录请求
func (ac *AuthController) Login(c *gin.Context) {
	var loginData models.LoginRequest

	// 绑定请求数据
	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

    // 调用服务层处理登录
    response, err := ac.authService.Login(loginData)
    if err != nil {
        // 明确区分业务错误与系统错误
        msg := err.Error()
        if strings.Contains(msg, "用户不存在") || strings.Contains(msg, "密码错误") {
            // 认证失败：保持401并返回可读信息，供前端展示具体文案
            c.JSON(http.StatusUnauthorized, gin.H{"error": msg})
            return
        }
        // 系统级错误（数据库连接、超时等）：返回友好提示，状态码500
        c.JSON(http.StatusInternalServerError, gin.H{"error": "服务暂不可用，请稍后再试"})
        return
    }

	// 设置用户token cookie
	ac.cookieManager.SetUserTokens(c.Writer, response.Tokens)

	// 如果是管理员用户，设置管理员token cookie
	if response.AdminTokens.AdminAccessToken != "" {
		ac.cookieManager.SetAdminTokens(c.Writer, response.AdminTokens)
	}

	c.JSON(http.StatusOK, response)
}

// Logout 处理退出登录请求
func (ac *AuthController) Logout(c *gin.Context) {
	// 从cookie中获取访问token
	accessToken, err := c.Cookie("access_token")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "未提供用户token"})
		return
	}

	// 验证访问token并获取用户ID
	tokenManager := utils.NewTokenManager()
	claims, err := tokenManager.ValidateAccessToken(accessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "无效的用户token"})
		return
	}

	userID := claims.UserUUID

	// 调用服务层处理登出
	response, err := ac.authService.Logout(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 清除所有cookie
	ac.cookieManager.ClearAllTokens(c.Writer)

	c.JSON(http.StatusOK, response)
}

// RefreshToken 刷新普通用户token
func (ac *AuthController) RefreshToken(c *gin.Context) {
	var req models.TokenRefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 调用服务层处理token刷新
	response, err := ac.authService.RefreshUserToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 设置新的cookie
	ac.cookieManager.SetNewUserTokens(c.Writer, response.Tokens)

	c.JSON(http.StatusOK, response)
}

// RefreshAdminToken 刷新管理员token
func (ac *AuthController) RefreshAdminToken(c *gin.Context) {
	var req models.AdminTokenRefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 调用服务层处理管理员token刷新
	response, err := ac.authService.RefreshAdminToken(req.AdminRefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// 设置新的管理员cookie
	ac.cookieManager.SetNewAdminTokens(c.Writer, response.AdminTokens)

	c.JSON(http.StatusOK, response)
}

// ValidateToken 验证普通用户token
func (ac *AuthController) ValidateToken(c *gin.Context) {
	var req models.TokenValidationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 调用服务层验证token
	response, err := ac.authService.ValidateUserToken(req.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !response.Valid {
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	c.JSON(http.StatusOK, response)
}

// ValidateAdminToken 验证管理员token
func (ac *AuthController) ValidateAdminToken(c *gin.Context) {
	var req models.AdminTokenValidationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 调用服务层验证管理员token
	response, err := ac.authService.ValidateAdminToken(req.AdminAccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !response.Valid {
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetAllUsers 获取所有用户（管理员功能）
func (ac *AuthController) GetAllUsers(c *gin.Context) {
	// 获取分页参数
	page := 1
	pageSize := 5 // 每页显示5个用户

	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 {
			pageSize = ps
		}
	}

	// 调用服务层获取用户列表
	response, err := ac.authService.GetAllUsers(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserStorage 更新用户存储限制（管理员功能）
func (ac *AuthController) UpdateUserStorage(c *gin.Context) {
	var updateData models.UpdateUserStorageRequest

	// 绑定请求数据
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 调用服务层更新用户存储限制
	err := ac.authService.UpdateUserStorage(updateData.UUID, updateData.StorageLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "存储限制更新成功",
	})
}

// VerifyAdmin 验证管理员权限（前端权限检查）
func (ac *AuthController) VerifyAdmin(c *gin.Context) {
	// 从cookie中获取管理员访问token
	adminAccessToken, err := c.Cookie("admin_access_token")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"isAdmin": false})
		return
	}

	// 验证管理员token
	tokenManager := utils.NewTokenManager()
	adminClaims, err := tokenManager.ValidateAdminAccessToken(adminAccessToken)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"isAdmin": false})
		return
	}

	// 检查token是否过期
	if adminClaims.ExpiresAt != nil && adminClaims.ExpiresAt.Time.Before(time.Now()) {
		c.JSON(http.StatusOK, gin.H{"isAdmin": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"isAdmin": true})
}
