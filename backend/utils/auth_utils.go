/**
 * 认证工具函数
 * 
 * 提供认证相关的辅助功能，包括：
 * - 密码验证
 * - 用户名验证
 * - 邮箱验证
 * - 权限检查
 * - 用户信息格式化
 * 
 * 该工具文件提供可复用的认证相关功能
 */

package utils

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"backend/models"
)

// PasswordValidator 密码验证器
type PasswordValidator struct {
	minLength        int
	maxLength        int
	requireUppercase bool
	requireLowercase bool
	requireNumber    bool
	requireSpecial   bool
}

// NewPasswordValidator 创建密码验证器
func NewPasswordValidator() *PasswordValidator {
	return &PasswordValidator{
		minLength:        8,
		maxLength:        128,
		requireUppercase: true,
		requireLowercase: true,
		requireNumber:    true,
		requireSpecial:   false,
	}
}

// ValidatePassword 验证密码强度
func (pv *PasswordValidator) ValidatePassword(password string) error {
	if len(password) < pv.minLength {
		return fmt.Errorf("密码长度不能少于%d个字符", pv.minLength)
	}

	if len(password) > pv.maxLength {
		return fmt.Errorf("密码长度不能超过%d个字符", pv.maxLength)
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if pv.requireUppercase && !hasUpper {
		return fmt.Errorf("密码必须包含大写字母")
	}

	if pv.requireLowercase && !hasLower {
		return fmt.Errorf("密码必须包含小写字母")
	}

	if pv.requireNumber && !hasNumber {
		return fmt.Errorf("密码必须包含数字")
	}

	if pv.requireSpecial && !hasSpecial {
		return fmt.Errorf("密码必须包含特殊字符")
	}

	return nil
}

// UsernameValidator 用户名验证器
type UsernameValidator struct {
	minLength    int
	maxLength    int
	allowedChars *regexp.Regexp
}

// NewUsernameValidator 创建用户名验证器
func NewUsernameValidator() *UsernameValidator {
	return &UsernameValidator{
		minLength:    3,
		maxLength:    20,
		allowedChars: regexp.MustCompile(`^[a-zA-Z0-9_-]+$`),
	}
}

// ValidateUsername 验证用户名格式
func (uv *UsernameValidator) ValidateUsername(username string) error {
	if len(username) < uv.minLength {
		return fmt.Errorf("用户名长度不能少于%d个字符", uv.minLength)
	}

	if len(username) > uv.maxLength {
		return fmt.Errorf("用户名长度不能超过%d个字符", uv.maxLength)
	}

	if !uv.allowedChars.MatchString(username) {
		return fmt.Errorf("用户名只能包含字母、数字、下划线和连字符")
	}

	return nil
}

// EmailValidator 邮箱验证器
type EmailValidator struct {
	emailRegex *regexp.Regexp
}

// NewEmailValidator 创建邮箱验证器
func NewEmailValidator() *EmailValidator {
	return &EmailValidator{
		emailRegex: regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`),
	}
}

// ValidateEmail 验证邮箱格式
func (ev *EmailValidator) ValidateEmail(email string) error {
	if email == "" {
		return nil // 邮箱是可选的
	}

	if !ev.emailRegex.MatchString(email) {
		return fmt.Errorf("邮箱格式不正确")
	}

	return nil
}

// HashPassword 哈希密码
func HashPassword(password string) string {
	hash := md5.Sum([]byte(password))
	return hex.EncodeToString(hash[:])
}

// VerifyPassword 验证密码
func VerifyPassword(password, hashedPassword string) bool {
	return HashPassword(password) == hashedPassword
}

// IsAdminUser 检查是否为管理员用户
func IsAdminUser(username string) bool {
	return username == "Mose"
}

// buildAvatarUrl 构建完整的头像URL
func buildAvatarUrl(avatarFileName string) string {
	if avatarFileName == "" || avatarFileName == "null" || avatarFileName == "undefined" {
		return ""
	}

	// 如果已经是完整URL，直接返回
	if strings.HasPrefix(avatarFileName, "http://") || strings.HasPrefix(avatarFileName, "https://") {
		return avatarFileName
	}

	// 构建完整的头像URL
	return "/uploads/avatars/" + avatarFileName
}

func FormatUserResponse(user *models.User) models.UserResponse {
	return models.UserResponse{
		UUID:      user.UUID,
		Username:  user.Username,
		Email:     user.Email,
		Bio:       user.Bio,
		AvatarUrl: buildAvatarUrl(user.Avatar),
		CreatedAt: user.CreatedAt,
	}
}

// SanitizeUsername 清理用户名
func SanitizeUsername(username string) string {
	// 移除首尾空格
	username = strings.TrimSpace(username)

	// 转换为小写
	username = strings.ToLower(username)

	// 移除特殊字符
	username = regexp.MustCompile(`[^a-zA-Z0-9_-]`).ReplaceAllString(username, "")
	return username
}

// GenerateDisplayName 生成显示名称
func GenerateDisplayName(username string) string {
	// 将用户名转换为首字母大写的格式
	if len(username) == 0 {
		return username
	}
	return strings.ToUpper(string(username[0])) + strings.ToLower(username[1:])
}

// ValidateStorageLimit 验证存储限制
func ValidateStorageLimit(storageLimit int64) error {
	if storageLimit <= 0 {
		return fmt.Errorf("存储限制必须大于0")
	}
	// 最大存储限制为100GB
	maxStorage := int64(100 * 1024 * 1024 * 1024)
	if storageLimit > maxStorage {
		return fmt.Errorf("存储限制不能超过100GB")
	}

	return nil
}
