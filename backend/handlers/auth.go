package handlers

import (
	"log"
	"net/http"

	"backend/database"
	"backend/models"

	"github.com/gin-gonic/gin"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	userRepo *database.UserRepository
}

// NewAuthHandler 创建认证处理器实例
func NewAuthHandler(userRepo *database.UserRepository) *AuthHandler {
	return &AuthHandler{userRepo: userRepo}
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

	c.JSON(http.StatusOK, response)
}
