package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend/database"
	"backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ProfileHandler 个人资料处理器
type ProfileHandler struct {
	userRepo *database.UserRepository
}

// NewProfileHandler 创建个人资料处理器实例
func NewProfileHandler(userRepo *database.UserRepository) *ProfileHandler {
	return &ProfileHandler{
		userRepo: userRepo,
	}
}

// GetProfile 获取用户个人资料
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "缺少用户ID",
		})
		return
	}

	// 从数据库获取用户信息
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "获取用户信息失败",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "用户不存在",
		})
		return
	}

	// 构建个人资料响应
	profile := gin.H{
		"id":         user.UUID,
		"username":   user.Username,
		"email":      user.Email,
		"bio":        user.Bio,
		"avatar":     user.Avatar,
		"created_at": user.CreatedAt,
		"updated_at": user.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"profile": profile,
	})
}

// UpdateProfile 更新用户个人资料
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "缺少用户ID",
		})
		return
	}

	// 解析请求体
	var updateData struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Bio      string `json:"bio"`
		Avatar   string `json:"avatar"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "请求数据格式错误",
		})
		return
	}

	// 验证用户名
	if updateData.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "用户名不能为空",
		})
		return
	}

	// 检查用户名是否已被其他用户使用（排除当前用户）
	existingUser, err := h.userRepo.GetUserByUsername(updateData.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "检查用户名失败",
		})
		return
	}

	if existingUser != nil && existingUser.UUID != userID {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "用户名已被使用",
		})
		return
	}

	// 更新用户信息
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "获取用户信息失败",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "用户不存在",
		})
		return
	}

	// 更新字段
	user.Username = updateData.Username
	user.Email = updateData.Email
	user.Bio = updateData.Bio
	if updateData.Avatar != "" {
		user.Avatar = updateData.Avatar
	}
	user.UpdatedAt = time.Now()

	// 保存到数据库
	if err := h.userRepo.UpdateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "更新用户信息失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "个人资料更新成功",
		"profile": gin.H{
			"id":         user.UUID,
			"username":   user.Username,
			"email":      user.Email,
			"bio":        user.Bio,
			"avatar":     user.Avatar,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		},
	})
}

// UploadAvatar 上传头像
func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "缺少用户ID",
		})
		return
	}

	// 获取上传的文件
	file, err := c.FormFile("avatar")
	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "获取上传文件失败",
		})
		return
	}

	// 验证文件类型
	allowedTypes := []string{"image/jpeg", "image/jpg", "image/png", "image/gif"}
	isValidType := false
	for _, allowedType := range allowedTypes {
		if file.Header.Get("Content-Type") == allowedType {
			isValidType = true
			break
		}
	}

	if !isValidType {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "只支持 JPG、PNG、GIF 格式的图片",
		})
		return
	}

	// 验证文件大小（限制为2MB）
	if file.Size > 2*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "头像文件大小不能超过2MB",
		})
		return
	}

	// 创建上传目录
	uploadDir := utils.GetAvatarUploadDir()

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "创建上传目录失败",
		})
		return
	}

	// 生成唯一文件名
	fileExt := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("%s_%s%s", userID, uuid.New().String(), fileExt)
	filePath := filepath.Join(uploadDir, fileName)

	// 保存文件
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "保存头像文件失败",
		})
		return
	}

	// 验证文件是否保存成功
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "文件保存失败",
		})
		return
	}

	// 生成访问URL - 只保存文件名，不包含路径
	avatarURL := fileName

	// 更新用户头像
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "获取用户信息失败",
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "用户不存在",
		})
		return
	}

	// 删除旧头像文件（如果存在）
	if user.Avatar != "" {
		// 处理旧的头像路径格式（可能是完整路径或只是文件名）
		oldAvatarPath := user.Avatar
		if strings.HasPrefix(oldAvatarPath, "/uploads/avatars/") {
			oldAvatarPath = strings.TrimPrefix(oldAvatarPath, "/uploads/avatars/")
		}

		if oldAvatarPath != "" && oldAvatarPath != fileName {
			oldFilePath := filepath.Join(uploadDir, oldAvatarPath)
			if _, err := os.Stat(oldFilePath); err == nil {
				os.Remove(oldFilePath)
			}
		}
	}

	// 更新用户头像 - 只存储文件名
	user.Avatar = avatarURL
	user.UpdatedAt = time.Now()

	if err := h.userRepo.UpdateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "更新用户头像失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "头像上传成功",
		"avatar_url": avatarURL,
	})
}
