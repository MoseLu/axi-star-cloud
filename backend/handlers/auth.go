package handlers

import (
	"net/http"
	"strconv"
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 检查用户名是否已存在
	exists, err := h.userRepo.CheckUsernameExists(registerData.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}

	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "用户名已存在"})
		return
	}

	// 创建新用户
	user := &models.User{
		UUID:     uuid.New().String(),
		Username: registerData.Username,
		Password: registerData.Password, // 实际应用中应该哈希密码
		Email:    registerData.Email,
		StorageLimit: func() int64 {
			// 管理员用户设置更大的存储空间（5GB），普通用户设置较小的存储空间（1GB）
			if registerData.Username == "Mose" {
				return 5 * 1024 * 1024 * 1024 // 5GB
			}
			return 1024 * 1024 * 1024 // 1GB
		}(),
		IsAdmin:   registerData.Username == "Mose", // 只有Mose用户才能是管理员
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存用户到数据库
	err = h.userRepo.CreateUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
		return
	}

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
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 查询用户
	user, err := h.userRepo.GetUserByUsername(loginData.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "服务器内部错误"})
		return
	}

	// 检查用户是否存在
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	// 验证密码
	// 注意：实际应用中应该使用密码哈希验证
	if user.Password != loginData.Password {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

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
			userUUID = c.Query("user_id") // 兼容前端发送的user_id参数
		}

		if userUUID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未提供用户信息"})
			c.Abort()
			return
		}

		// 查询用户信息
		user, err := h.userRepo.GetUserByUUID(userUUID)
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

	// 获取用户总数
	total, err := h.userRepo.GetUserCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
		return
	}

	// 如果用户总数超过5个，使用分页
	if total > 5 {
		users, totalCount, err := h.userRepo.GetUsersWithPagination(page, pageSize)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
			return
		}

		response := models.UserListResponse{
			Success:  true,
			Users:    users,
			Total:    totalCount,
			Page:     page,
			PageSize: pageSize,
			HasMore:  page*pageSize < totalCount,
		}

		c.JSON(http.StatusOK, response)
	} else {
		// 用户总数不超过5个，返回所有用户
		users, err := h.userRepo.GetAllUsers()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
			return
		}

		response := models.UserListResponse{
			Success: true,
			Users:   users,
			Total:   total,
		}

		c.JSON(http.StatusOK, response)
	}
}

// UpdateUserStorage 更新用户存储限制（管理员功能）
func (h *AuthHandler) UpdateUserStorage(c *gin.Context) {
	var updateData models.UpdateUserStorageRequest

	// 绑定请求数据
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 更新用户存储限制
	err := h.userRepo.UpdateStorageLimit(updateData.UUID, updateData.StorageLimit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新存储限制失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "存储限制更新成功",
	})
}
