/**
 * 认证配置文件
 * 
 * 集中管理认证相关的配置参数，包括：
 * - Token配置
 * - 密码策略配置
 * - 用户验证配置
 * - 安全配置
 * 
 * 该配置文件提供统一的认证参数管理
 */

package config

import (
	"time"
)

// AuthConfig 认证配置
type AuthConfig struct {
	// Token配置
	TokenConfig TokenConfig `yaml:"token"`
	
	// 密码策略配置
	PasswordConfig PasswordConfig `yaml:"password"`
	
	// 用户验证配置
	UserValidationConfig UserValidationConfig `yaml:"user_validation"`
	
	// 安全配置
	SecurityConfig SecurityConfig `yaml:"security"`
}

// TokenConfig Token配置
type TokenConfig struct {
	// 普通用户访问token过期时间
	AccessTokenTTL time.Duration `yaml:"access_token_ttl" default:"15m"`
	
	// 普通用户刷新token过期时间
	RefreshTokenTTL time.Duration `yaml:"refresh_token_ttl" default:"168h"` // 7天
	
	// 管理员访问token过期时间
	AdminAccessTokenTTL time.Duration `yaml:"admin_access_token_ttl" default:"30m"`
	
	// 管理员刷新token过期时间
	AdminRefreshTokenTTL time.Duration `yaml:"admin_refresh_token_ttl" default:"24h"`
	
	// 密钥配置
	SecretKey      string `yaml:"secret_key" default:"your-secret-key-change-in-production"`
	AdminSecretKey string `yaml:"admin_secret_key" default:"your-admin-secret-key-change-in-production"`
}

// PasswordConfig 密码策略配置
type PasswordConfig struct {
	// 最小长度
	MinLength int `yaml:"min_length" default:"8"`
	
	// 最大长度
	MaxLength int `yaml:"max_length" default:"128"`
	
	// 是否要求大写字母
	RequireUppercase bool `yaml:"require_uppercase" default:"true"`
	
	// 是否要求小写字母
	RequireLowercase bool `yaml:"require_lowercase" default:"true"`
	
	// 是否要求数字
	RequireNumber bool `yaml:"require_number" default:"true"`
	
	// 是否要求特殊字符
	RequireSpecial bool `yaml:"require_special" default:"false"`
}

// UserValidationConfig 用户验证配置
type UserValidationConfig struct {
	// 用户名最小长度
	UsernameMinLength int `yaml:"username_min_length" default:"3"`
	
	// 用户名最大长度
	UsernameMaxLength int `yaml:"username_max_length" default:"20"`
	
	// 是否允许邮箱为空
	AllowEmptyEmail bool `yaml:"allow_empty_email" default:"true"`
	
	// 是否验证邮箱格式
	ValidateEmail bool `yaml:"validate_email" default:"true"`
}

// SecurityConfig 安全配置
type SecurityConfig struct {
	// Cookie配置
	CookieDomain   string `yaml:"cookie_domain" default:""`
	CookieSecure   bool   `yaml:"cookie_secure" default:"false"`
	CookieSameSite string `yaml:"cookie_same_site" default:"StrictMode"`
	
	// 是否启用密码哈希
	EnablePasswordHashing bool `yaml:"enable_password_hashing" default:"true"`
	
	// 密码哈希算法
	PasswordHashAlgorithm string `yaml:"password_hash_algorithm" default:"md5"`
	
	// 是否启用登录尝试限制
	EnableLoginAttemptLimit bool `yaml:"enable_login_attempt_limit" default:"false"`
	
	// 最大登录尝试次数
	MaxLoginAttempts int `yaml:"max_login_attempts" default:"5"`
	
	// 登录锁定时间
	LoginLockoutDuration time.Duration `yaml:"login_lockout_duration" default:"15m"`
}

// DefaultAuthConfig 获取默认认证配置
func DefaultAuthConfig() *AuthConfig {
	return &AuthConfig{
		TokenConfig: TokenConfig{
			AccessTokenTTL:        15 * time.Minute,
			RefreshTokenTTL:       7 * 24 * time.Hour,
			AdminAccessTokenTTL:   30 * time.Minute,
			AdminRefreshTokenTTL:  24 * time.Hour,
			SecretKey:             "your-secret-key-change-in-production",
			AdminSecretKey:        "your-admin-secret-key-change-in-production",
		},
		PasswordConfig: PasswordConfig{
			MinLength:        8,
			MaxLength:        128,
			RequireUppercase: true,
			RequireLowercase: true,
			RequireNumber:    true,
			RequireSpecial:   false,
		},
		UserValidationConfig: UserValidationConfig{
			UsernameMinLength: 3,
			UsernameMaxLength: 20,
			AllowEmptyEmail:   true,
			ValidateEmail:     true,
		},
		SecurityConfig: SecurityConfig{
			CookieDomain:           "",
			CookieSecure:           false,
			CookieSameSite:         "StrictMode",
			EnablePasswordHashing:  true,
			PasswordHashAlgorithm:  "md5",
			EnableLoginAttemptLimit: false,
			MaxLoginAttempts:       5,
			LoginLockoutDuration:   15 * time.Minute,
		},
	}
}

// GetAuthConfig 获取认证配置（从配置文件或使用默认值）
func GetAuthConfig() *AuthConfig {
	// 这里可以从配置文件读取，暂时使用默认配置
	return DefaultAuthConfig()
} 