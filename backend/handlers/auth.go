package handlers

import (
	"log"
	"net/http"
	"time"

	"backend/database"
	"backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	userRepo *database.UserRepository
}

// NewAuthHandler 创建认证处理器实例
func NewAuthHandler(userRepo *database.UserRepository) *AuthHandler {
	return &AuthHandler{userRepo: userRepo}
}

// Register 处理注册请求
func (h *AuthHandler) Register(c *gin.Context) {
	var registerData models.RegisterRequest

	// 绑定请求数据
	if err := c.ShouldBindJSON(&registerData); err != nil {
		log.Printf("注册请求参数绑定错误: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	log.Printf("注册请求: 用户名=%s", registerData.Username)

	// 检查用户名是否已存在
	exists, err := h.userRepo.CheckUsernameExists(registerData.Username)
	if err != nil {
		log.Printf("检查用户名存在性错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}

	if exists {
		log.Printf("用户名已存在: %s", registerData.Username)
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
		return
	}

	// 创建新用户
	user := &models.User{
		UUID:         uuid.New().String(),
		Username:     registerData.Username,
		Password:     registerData.Password, // 实际应用中应该哈希密码
		Email:        registerData.Email,
		StorageLimit: 1024 * 1024 * 1024, // 1GB 默认存储空间
		IsAdmin:      false,              // 新用户默认为非管理员
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// 保存用户到数据库
	err = h.userRepo.CreateUser(user)
	if err != nil {
		log.Printf("创建用户错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
		return
	}

	log.Printf("用户注册成功: %s", user.Username)

	// 注册成功响应
	response := models.RegisterResponse{
		Success: true,
		Message: "注册成功",
	}
	response.User.UUID = user.UUID
	response.User.Username = user.Username
	response.User.IsAdmin = user.IsAdmin

	c.JSON(http.StatusOK, response)
}

// Login 处理登录请求
func (h *AuthHandler) Login(c *gin.Context) {
	var loginData models.LoginRequest

	// 绑定请求数据
	if err := c.ShouldBindJSON(&loginData); err != nil {
		log.Printf("请求参数绑定错误: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	log.Printf("登录请求: 用户名=%s", loginData.Username)

	// 查询用户
	user, err := h.userRepo.GetUserByUsername(loginData.Username)
	if err != nil {
		log.Printf("数据库查询错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}

	// 检查用户是否存在
	if user == nil {
		log.Printf("用户不存在: %s", loginData.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	log.Printf("用户查询成功: %s", user.Username)

	// 验证密码
	// 注意：实际应用中应该使用密码哈希验证
	log.Printf("密码验证: 输入=%s, 数据库=%s", loginData.Password, user.Password)
	if user.Password != loginData.Password {
		log.Printf("密码不匹配")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	log.Printf("登录成功: %s", user.Username)

	// 登录成功
	response := models.LoginResponse{
		Success: true,
		Message: "登录成功",
	}
	response.User.UUID = user.UUID
	response.User.Username = user.Username
	response.User.IsAdmin = user.IsAdmin

	c.JSON(http.StatusOK, response)
}

// CheckAdminPermission 检查管理员权限的中间件
func (h *AuthHandler) CheckAdminPermission() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头或查询参数获取用户UUID
		userUUID := c.GetHeader("User-UUID")
		if userUUID == "" {
			userUUID = c.Query("user_uuid")
		}

		if userUUID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供用户信息"})
			c.Abort()
			return
		}

		// 查询用户信息
		user, err := h.userRepo.GetUserByUUID(userUUID)
		if err != nil {
			log.Printf("查询用户信息错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
			c.Abort()
			return
		}

		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "用户不存在"})
			c.Abort()
			return
		}

		// 检查是否为管理员
		if !user.IsAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "权限不足，需要管理员权限"})
			c.Abort()
			return
		}

		// 将用户信息存储到上下文中
		c.Set("currentUser", user)
		c.Next()
	}
}

// GetAllUsers 获取所有用户（管理员功能）
func (h *AuthHandler) GetAllUsers(c *gin.Context) {
	users, err := h.userRepo.GetAllUsers()
	if err != nil {
		log.Printf("获取用户列表错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
		return
	}

	response := models.UserListResponse{
		Success: true,
		Users:   users,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUserStorage 更新用户存储限制（管理员功能）
func (h *AuthHandler) UpdateUserStorage(c *gin.Context) {
	var updateData models.UpdateUserStorageRequest

	// 绑定请求数据
	if err := c.ShouldBindJSON(&updateData); err != nil {
		log.Printf("更新存储限制请求参数绑定错误: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 更新用户存储限制
	err := h.userRepo.UpdateStorageLimit(updateData.UUID, updateData.StorageLimit)
	if err != nil {
		log.Printf("更新用户存储限制错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新存储限制失败"})
		return
	}

	log.Printf("用户存储限制更新成功: UUID=%s, 新限制=%d", updateData.UUID, updateData.StorageLimit)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "存储限制更新成功",
	})
}
