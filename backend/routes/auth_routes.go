/**
 * 认证路由
 * 
 * 负责定义认证相关的API路由，包括：
 * - 用户注册路由
 * - 用户登录路由
 * - 用户登出路由
 * - Token验证路由
 * - Token刷新路由
 * - 管理员功能路由
 * 
 * 该路由文件将路由定义与业务逻辑分离，提供清晰的路由结构
 */

package routes

import (
	"backend/controllers"
	"backend/database"
	"backend/middleware"
	"backend/services"

	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes 设置认证路由
func SetupAuthRoutes(router *gin.Engine, userRepo interface{}) {
	// 创建服务层和控制器
	authService := services.NewAuthService(userRepo.(*database.UserRepository))
	authController := controllers.NewAuthController(authService)
	authMiddleware := middleware.NewAuthMiddleware(userRepo.(*database.UserRepository))

	// 认证路由组
	auth := router.Group("/api/auth")
	{
		// 公开路由（无需认证）
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
		auth.POST("/logout", authController.Logout)
		auth.POST("/refresh", authController.RefreshToken)
		auth.POST("/refresh-admin", authController.RefreshAdminToken)
		auth.POST("/validate", authController.ValidateToken)
		auth.POST("/validate-admin", authController.ValidateAdminToken)

		// 需要用户认证的路由
		userAuth := auth.Group("/user")
		userAuth.Use(authMiddleware.CheckUserPermission())
		{
			// 这里可以添加需要用户认证的路由
			// 例如：用户资料更新、密码修改等
		}

		// 需要管理员认证的路由
		adminAuth := auth.Group("/admin")
		adminAuth.Use(authMiddleware.CheckAdminPermission())
		{
			adminAuth.GET("/users", authController.GetAllUsers)
			adminAuth.PUT("/users/storage", authController.UpdateUserStorage)
		}
	}
} 