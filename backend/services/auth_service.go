/**
 * 认证服务层
 *
 * 负责处理用户认证相关的核心业务逻辑，包括：
 * - 用户注册
 * - 用户登录
 * - 用户登出
 * - 用户验证
 * - 存储限制管理
 *
 * 该服务层将业务逻辑与HTTP处理分离，提高代码的可维护性和可测试性
 */

package services

import (
	"fmt"
	"strings"
	"time"

	"backend/database"
	"backend/models"
	"backend/utils"

	"github.com/google/uuid"
)

// AuthService 认证服务
type AuthService struct {
	userRepo      database.UserRepositoryInterface
	fileRepo      database.FileRepositoryInterface
	urlFileRepo   database.UrlFileRepositoryInterface
	tokenManager  *utils.TokenManager
	cookieManager *utils.CookieManager
}

// NewAuthService 创建认证服务实例
func NewAuthService(userRepo database.UserRepositoryInterface, fileRepo database.FileRepositoryInterface, urlFileRepo database.UrlFileRepositoryInterface) *AuthService {
	return &AuthService{
		userRepo:      userRepo,
		fileRepo:      fileRepo,
		urlFileRepo:   urlFileRepo,
		tokenManager:  utils.NewTokenManager(),
		cookieManager: utils.NewCookieManager(),
	}
}

// buildAvatarUrl 构建完整的头像URL
func (s *AuthService) buildAvatarUrl(avatarFileName string) string {
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

// Register 处理用户注册
func (s *AuthService) Register(registerData models.RegisterRequest) (*models.RegisterResponse, error) {
	// 检查用户名是否已存在
	exists, err := s.userRepo.CheckUsernameExists(registerData.Username)
	if err != nil {
		return nil, fmt.Errorf("检查用户名失败: %w", err)
	}

	if exists {
		return nil, fmt.Errorf("用户名已存在")
	}

	// 创建新用户
	user := &models.User{
		UUID:         uuid.New().String(),
		Username:     registerData.Username,
		Password:     registerData.Password, // 实际应用中应该哈希密码
		Email:        registerData.Email,
		StorageLimit: s.calculateStorageLimit(registerData.Username),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// 保存用户到数据库
	err = s.userRepo.CreateUser(user)
	if err != nil {
		return nil, fmt.Errorf("创建用户失败: %w", err)
	}

	// 构建响应
	response := &models.RegisterResponse{
		Success: true,
		Message: "注册成功",
		User: models.UserResponse{
			UUID:      user.UUID,
			Username:  user.Username,
			Email:     user.Email,
			Bio:       user.Bio,
			AvatarUrl: s.buildAvatarUrl(user.Avatar),
		},
	}

	return response, nil
}

// Login 处理用户登录
func (s *AuthService) Login(loginData models.LoginRequest) (*models.LoginResponse, error) {
	// 获取用户信息
	user, err := s.userRepo.GetUserByUsername(loginData.Username)
	if err != nil {
		return nil, fmt.Errorf("获取用户信息失败: %w", err)
	}

	// 明确区分用户不存在与密码错误，便于前端展示对应的提示
	if user == nil {
		return nil, fmt.Errorf("用户不存在")
	}

	// 验证密码（实际应用中应该使用哈希比较）
	if user.Password != loginData.Password {
		return nil, fmt.Errorf("密码错误")
	}

	// 更新最后登录时间和在线状态
	err = s.userRepo.UpdateLastLoginTime(user.UUID)
	if err != nil {
		// 记录错误但不影响登录流程
		fmt.Printf("更新用户登录时间失败: %v\n", err)
	}

	// 生成普通用户token
	tokens, err := s.tokenManager.GenerateTokenPair(user.UUID, user.Username)
	if err != nil {
		return nil, fmt.Errorf("生成token失败: %w", err)
	}

	// 构建响应
	response := &models.LoginResponse{
		Success: true,
		Message: "登录成功",
		User: models.UserResponse{
			UUID:      user.UUID,
			Username:  user.Username,
			Email:     user.Email,
			Bio:       user.Bio,
			AvatarUrl: s.buildAvatarUrl(user.Avatar),
			IsOnline:  true,
		},
		Tokens: *tokens,
	}

	// 如果是管理员用户（Mose），生成管理员token
	if user.Username == "Mose" {
		adminTokens, err := s.tokenManager.GenerateAdminTokenPair(user.UUID, user.Username)
		if err != nil {
			return nil, fmt.Errorf("生成管理员token失败: %w", err)
		}
		response.AdminTokens = *adminTokens
	}

	return response, nil
}

// Logout 处理用户登出
func (s *AuthService) Logout(userID string) (*models.LogoutResponse, error) {
	// 设置用户离线状态
	err := s.userRepo.SetUserOffline(userID)
	if err != nil {
		// 记录错误但不影响登出流程
		fmt.Printf("设置用户离线状态失败: %v\n", err)
	}

	// 这里可以添加登出日志记录、token黑名单等逻辑
	response := &models.LogoutResponse{
		Success: true,
		Message: "退出登录成功",
	}

	return response, nil
}

// ValidateUserToken 验证普通用户token
func (s *AuthService) ValidateUserToken(accessToken string) (*models.TokenValidationResponse, error) {
	// 验证访问token
	claims, err := s.tokenManager.ValidateAccessToken(accessToken)
	if err != nil {
		return &models.TokenValidationResponse{
			Success: false,
			Valid:   false,
			Message: "无效的token",
		}, nil
	}

	// 获取用户信息
	user, err := s.userRepo.GetUserByUUID(claims.UserUUID)
	if err != nil || user == nil {
		return &models.TokenValidationResponse{
			Success: false,
			Valid:   false,
			Message: "用户不存在",
		}, nil
	}

	response := &models.TokenValidationResponse{
		Success: true,
		Valid:   true,
		User: models.UserResponse{
			UUID:      user.UUID,
			Username:  user.Username,
			Email:     user.Email,
			Bio:       user.Bio,
			AvatarUrl: s.buildAvatarUrl(user.Avatar),
		},
		Message: "token有效",
	}

	return response, nil
}

// ValidateAdminToken 验证管理员token
func (s *AuthService) ValidateAdminToken(adminAccessToken string) (*models.AdminTokenValidationResponse, error) {
	// 验证管理员访问token
	claims, err := s.tokenManager.ValidateAdminAccessToken(adminAccessToken)
	if err != nil {
		return &models.AdminTokenValidationResponse{
			Success: false,
			Valid:   false,
			Message: "无效的管理员token",
		}, nil
	}

	// 获取用户信息
	user, err := s.userRepo.GetUserByUUID(claims.UserUUID)
	if err != nil || user == nil {
		return &models.AdminTokenValidationResponse{
			Success: false,
			Valid:   false,
			Message: "用户不存在",
		}, nil
	}

	// 检查是否为管理员用户（Mose）
	if user.Username != "Mose" {
		return &models.AdminTokenValidationResponse{
			Success: false,
			Valid:   false,
			Message: "权限不足，需要管理员权限",
		}, nil
	}

	response := &models.AdminTokenValidationResponse{
		Success: true,
		Valid:   true,
		User: models.UserResponse{
			UUID:      user.UUID,
			Username:  user.Username,
			Email:     user.Email,
			Bio:       user.Bio,
			AvatarUrl: s.buildAvatarUrl(user.Avatar),
		},
		Message: "管理员token有效",
	}

	return response, nil
}

// RefreshUserToken 刷新普通用户token
func (s *AuthService) RefreshUserToken(refreshToken string) (*models.TokenRefreshResponse, error) {
	// 验证刷新token
	claims, err := s.tokenManager.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("无效的刷新token")
	}

	// 生成新的token对
	tokens, err := s.tokenManager.GenerateTokenPair(claims.UserUUID, claims.Username)
	if err != nil {
		return nil, fmt.Errorf("生成新token失败: %w", err)
	}

	response := &models.TokenRefreshResponse{
		Success: true,
		Message: "token刷新成功",
		Tokens:  *tokens,
	}

	return response, nil
}

// RefreshAdminToken 刷新管理员token
func (s *AuthService) RefreshAdminToken(adminRefreshToken string) (*models.AdminTokenRefreshResponse, error) {
	// 验证管理员刷新token
	claims, err := s.tokenManager.ValidateAdminRefreshToken(adminRefreshToken)
	if err != nil {
		return nil, fmt.Errorf("无效的管理员刷新token")
	}

	// 生成新的管理员token对
	adminTokens, err := s.tokenManager.GenerateAdminTokenPair(claims.UserUUID, claims.Username)
	if err != nil {
		return nil, fmt.Errorf("生成新管理员token失败: %w", err)
	}

	response := &models.AdminTokenRefreshResponse{
		Success:     true,
		Message:     "管理员token刷新成功",
		AdminTokens: *adminTokens,
	}

	return response, nil
}

// GetAllUsers 获取所有用户（管理员功能）
func (s *AuthService) GetAllUsers(page, pageSize int) (*models.UserListResponse, error) {
	// 获取用户列表（带分页）
	users, totalCount, err := s.userRepo.GetUsersWithPagination(page, pageSize)
	if err != nil {
		return nil, fmt.Errorf("获取用户列表失败: %w", err)
	}

	// 将User转换为UserResponse，并处理头像URL和存储信息
	userResponses := make([]models.UserResponse, 0, len(users))
	for _, user := range users {
		// 获取用户已使用的存储空间
		fileUsedSpace, err := s.fileRepo.GetUserTotalStorage(user.UUID)
		if err != nil {
			// 如果获取失败，使用默认值0
			fileUsedSpace = 0
		}

		// 获取用户URL文件数量（URL文件不占用实际存储空间，但计入总数）
		urlFileCount, err := s.urlFileRepo.GetUserTotalUrlFileCount(user.UUID)
		if err != nil {
			// 如果获取失败，使用默认值0
			urlFileCount = 0
		}

		// 计算总使用空间（普通文件大小 + URL文件计数）
		// 这里我们将每个URL文件计为1字节，以便在存储计算中体现
		urlFileSpace := int64(urlFileCount) // 每个URL文件计为1字节
		totalUsedSpace := fileUsedSpace + urlFileSpace

		// 防御性处理，确保数值有效
		if totalUsedSpace < 0 {
			totalUsedSpace = 0
		}

		userResponses = append(userResponses, models.UserResponse{
			UUID:          user.UUID,
			Username:      user.Username,
			Email:         user.Email,
			Bio:           user.Bio,
			AvatarUrl:     s.buildAvatarUrl(user.Avatar),
			StorageLimit:  user.StorageLimit,
			UsedSpace:     totalUsedSpace,
			LastLoginTime: user.LastLoginTime,
			IsOnline:      user.IsOnline,
			CreatedAt:     user.CreatedAt,
		})
	}

	response := &models.UserListResponse{
		Success:  true,
		Users:    userResponses,
		Total:    totalCount,
		Page:     page,
		PageSize: pageSize,
		HasMore:  page*pageSize < totalCount,
	}

	return response, nil
}

// UpdateUserStorage 更新用户存储限制（管理员功能）
func (s *AuthService) UpdateUserStorage(uuid string, storageLimit int64) error {
	// 更新用户存储限制
	err := s.userRepo.UpdateUserStorage(uuid, storageLimit)
	if err != nil {
		return fmt.Errorf("更新存储限制失败: %w", err)
	}

	return nil
}

// calculateStorageLimit 计算用户存储限制
func (s *AuthService) calculateStorageLimit(username string) int64 {
	// 管理员用户设置更大的存储空间（5GB），普通用户设置较小的存储空间（1GB）
	if username == "Mose" {
		return 5 * 1024 * 1024 * 1024 // 5GB
	}
	return 1024 * 1024 * 1024 // 1GB
}
