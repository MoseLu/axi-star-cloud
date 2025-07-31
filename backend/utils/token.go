package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"backend/models"

	"github.com/golang-jwt/jwt/v5"
)

// TokenManager token管理器
type TokenManager struct {
	secretKey       []byte
	adminSecretKey  []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
	adminTokenTTL   time.Duration
	adminRefreshTTL time.Duration
}

// NewTokenManager 创建token管理器
func NewTokenManager() *TokenManager {
	return &TokenManager{
		secretKey:       []byte("your-secret-key-change-in-production"),
		adminSecretKey:  []byte("your-admin-secret-key-change-in-production"),
		accessTokenTTL:  2 * time.Hour,      // 普通用户访问token 2小时（从15分钟改为2小时）
		refreshTokenTTL: 7 * 24 * time.Hour, // 普通用户刷新token 7天
		adminTokenTTL:   4 * time.Hour,      // 管理员访问token 4小时（从30分钟改为4小时）
		adminRefreshTTL: 24 * time.Hour,     // 管理员刷新token 24小时
	}
}

// Claims 普通用户token声明
type Claims struct {
	UserUUID string `json:"user_uuid"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// AdminClaims 管理员token声明
type AdminClaims struct {
	UserUUID string `json:"user_uuid"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// GenerateTokenPair 生成普通用户双token
func (tm *TokenManager) GenerateTokenPair(userUUID, username string) (*models.TokenPair, error) {
	// 生成访问token
	accessToken, err := tm.generateAccessToken(userUUID, username)
	if err != nil {
		return nil, err
	}

	// 生成刷新token
	refreshToken, err := tm.generateRefreshToken(userUUID, username)
	if err != nil {
		return nil, err
	}

	return &models.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(tm.accessTokenTTL),
	}, nil
}

// GenerateAdminTokenPair 生成管理员双token
func (tm *TokenManager) GenerateAdminTokenPair(userUUID, username string) (*models.AdminTokenPair, error) {
	// 生成管理员访问token
	adminAccessToken, err := tm.generateAdminAccessToken(userUUID, username)
	if err != nil {
		return nil, err
	}

	// 生成管理员刷新token
	adminRefreshToken, err := tm.generateAdminRefreshToken(userUUID, username)
	if err != nil {
		return nil, err
	}

	return &models.AdminTokenPair{
		AdminAccessToken:  adminAccessToken,
		AdminRefreshToken: adminRefreshToken,
		AdminExpiresAt:    time.Now().Add(tm.adminTokenTTL),
	}, nil
}

// generateAccessToken 生成访问token
func (tm *TokenManager) generateAccessToken(userUUID, username string) (string, error) {
	claims := Claims{
		UserUUID: userUUID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tm.accessTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "star-cloud",
			Subject:   userUUID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(tm.secretKey)
}

// generateRefreshToken 生成刷新token
func (tm *TokenManager) generateRefreshToken(userUUID, username string) (string, error) {
	claims := Claims{
		UserUUID: userUUID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tm.refreshTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "star-cloud",
			Subject:   userUUID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(tm.secretKey)
}

// generateAdminAccessToken 生成管理员访问token
func (tm *TokenManager) generateAdminAccessToken(userUUID, username string) (string, error) {
	claims := AdminClaims{
		UserUUID: userUUID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tm.adminTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "star-cloud-admin",
			Subject:   userUUID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(tm.adminSecretKey)
}

// generateAdminRefreshToken 生成管理员刷新token
func (tm *TokenManager) generateAdminRefreshToken(userUUID, username string) (string, error) {
	claims := AdminClaims{
		UserUUID: userUUID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tm.adminRefreshTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "star-cloud-admin",
			Subject:   userUUID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(tm.adminSecretKey)
}

// ValidateAccessToken 验证访问token
func (tm *TokenManager) ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return tm.secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ValidateAdminAccessToken 验证管理员访问token
func (tm *TokenManager) ValidateAdminAccessToken(tokenString string) (*AdminClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return tm.adminSecretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*AdminClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid admin token")
}

// ValidateRefreshToken 验证刷新token
func (tm *TokenManager) ValidateRefreshToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return tm.secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid refresh token")
}

// ValidateAdminRefreshToken 验证管理员刷新token
func (tm *TokenManager) ValidateAdminRefreshToken(tokenString string) (*AdminClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return tm.adminSecretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*AdminClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid admin refresh token")
}

// GenerateRandomToken 生成随机token（用于刷新token）
func (tm *TokenManager) GenerateRandomToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
