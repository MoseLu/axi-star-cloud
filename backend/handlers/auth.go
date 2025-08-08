/**
 * 认证处理器（重构版本）
 * 
 * 这是重构后的认证处理器，使用分层架构：
 * - 控制器层：处理HTTP请求和响应
 * - 服务层：处理业务逻辑
 * - 中间件层：处理权限验证
 * - 工具层：提供辅助功能
 * 
 * 该文件现在主要作为兼容性层，实际功能已迁移到新的架构中
 */

package handlers

import (
	"backend/controllers"
	"backend/database"
	"backend/middleware"
	"backend/services"

	"github.com/gin-gonic/gin"
)

// AuthHandler 认证处理器（重构版本）
type AuthHandler struct {
	authController *controllers.AuthController
	authMiddleware *middleware.AuthMiddleware
	userRepo       database.UserRepositoryInterface
}

// NewAuthHandler 创建认证处理器实例
func NewAuthHandler(userRepo database.UserRepositoryInterface, fileRepo database.FileRepositoryInterface, urlFileRepo database.UrlFileRepositoryInterface) *AuthHandler {
	// 创建服务层
	authService := services.NewAuthService(userRepo, fileRepo, urlFileRepo)

	// 创建控制器
	authController := controllers.NewAuthController(authService)
	// 创建中间件
	authMiddleware := middleware.NewAuthMiddleware(userRepo)

	return &AuthHandler{
		authController: authController,
		authMiddleware: authMiddleware,
		userRepo:       userRepo,
	}
}

// Register 处理注册请求（委托给控制器）
func (h *AuthHandler) Register(c *gin.Context) {
	h.authController.Register(c)
}

// Login 处理登录请求（委托给控制器）
func (h *AuthHandler) Login(c *gin.Context) {
	h.authController.Login(c)
}

// Logout 处理退出登录请求（委托给控制器）
func (h *AuthHandler) Logout(c *gin.Context) {
	h.authController.Logout(c)
}

// RefreshToken 刷新普通用户token（委托给控制器）
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	h.authController.RefreshToken(c)
}

// RefreshAdminToken 刷新管理员token（委托给控制器）
func (h *AuthHandler) RefreshAdminToken(c *gin.Context) {
	h.authController.RefreshAdminToken(c)
}

// ValidateToken 验证普通用户token（委托给控制器）
func (h *AuthHandler) ValidateToken(c *gin.Context) {
	h.authController.ValidateToken(c)
}

// ValidateAdminToken 验证管理员token（委托给控制器）
func (h *AuthHandler) ValidateAdminToken(c *gin.Context) {
	h.authController.ValidateAdminToken(c)
}

// CheckAdminPermission 检查管理员权限的中间件（委托给中间件）
func (h *AuthHandler) CheckAdminPermission() gin.HandlerFunc {
	return h.authMiddleware.CheckAdminPermission()
}

// CheckUserPermission 检查普通用户权限的中间件（委托给中间件）
func (h *AuthHandler) CheckUserPermission() gin.HandlerFunc {
	return h.authMiddleware.CheckUserPermission()
}

// GetAllUsers 获取所有用户（管理员功能）（委托给控制器）
func (h *AuthHandler) GetAllUsers(c *gin.Context) {
	h.authController.GetAllUsers(c)
}

// UpdateUserStorage 更新用户存储限制（管理员功能）（委托给控制器）
func (h *AuthHandler) UpdateUserStorage(c *gin.Context) {
	h.authController.UpdateUserStorage(c)
}

// VerifyAdmin 验证管理员权限（前端权限检查）
func (h *AuthHandler) VerifyAdmin(c *gin.Context) {
	h.authController.VerifyAdmin(c)
}

// GetUserRepo 获取用户仓库
func (h *AuthHandler) GetUserRepo() database.UserRepositoryInterface {
	return h.userRepo
}
