/**
 * Cookie管理器
 *
 * 负责处理HTTP cookie的设置和清除，包括：
 * - 设置认证cookie
 * - 清除认证cookie
 * - 设置管理员cookie
 * - 清除管理员cookie
 *
 * 该管理器统一管理所有cookie操作，确保cookie设置的一致性
 */

package utils

import (
	"net/http"
	"time"

	"backend/models"
	"os"
)

// CookieManager cookie管理器
type CookieManager struct {
	domain   string
	secure   bool
	sameSite http.SameSite
}

// NewCookieManager 创建cookie管理器
func NewCookieManager() *CookieManager {
	// 根据环境动态设置secure标志
	secure := false
	if os.Getenv("ENV") == "production" || os.Getenv("ENV") == "prod" {
		secure = true
	}

	return &CookieManager{
		domain:   "", // 空域名表示当前域名
		secure:   secure,
		sameSite: http.SameSiteLaxMode, // 改为Lax模式，更宽松
	}
}

// SetUserTokens 设置用户token cookie
func (cm *CookieManager) SetUserTokens(w http.ResponseWriter, tokens models.TokenPair) {
	// 设置访问token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokens.AccessToken,
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  tokens.ExpiresAt,
		MaxAge:   int(tokens.ExpiresAt.Sub(time.Now()).Seconds()), // 添加MaxAge
	})

	// 设置刷新token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  time.Now().Add(7 * 24 * time.Hour), // 7天
		MaxAge:   7 * 24 * 60 * 60,                   // 7天的秒数
	})
}

// SetAdminTokens 设置管理员token cookie
func (cm *CookieManager) SetAdminTokens(w http.ResponseWriter, adminTokens models.AdminTokenPair) {
	// 设置管理员访问token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_access_token",
		Value:    adminTokens.AdminAccessToken,
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  adminTokens.AdminExpiresAt,
	})

	// 设置管理员刷新token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_refresh_token",
		Value:    adminTokens.AdminRefreshToken,
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  time.Now().Add(24 * time.Hour), // 24小时
	})
}

// ClearAllTokens 清除所有token cookie
func (cm *CookieManager) ClearAllTokens(w http.ResponseWriter) {
	// 清除用户token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  time.Now().Add(-1 * time.Hour), // 立即过期
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  time.Now().Add(-1 * time.Hour), // 立即过期
	})

	// 清除管理员token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_access_token",
		Value:    "",
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  time.Now().Add(-1 * time.Hour), // 立即过期
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "admin_refresh_token",
		Value:    "",
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  time.Now().Add(-1 * time.Hour), // 立即过期
	})
}

// SetNewUserTokens 设置新的用户token cookie（用于token刷新）
func (cm *CookieManager) SetNewUserTokens(w http.ResponseWriter, tokens models.TokenPair) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokens.AccessToken,
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  tokens.ExpiresAt,
	})
}

// SetNewAdminTokens 设置新的管理员token cookie（用于token刷新）
func (cm *CookieManager) SetNewAdminTokens(w http.ResponseWriter, adminTokens models.AdminTokenPair) {
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_access_token",
		Value:    adminTokens.AdminAccessToken,
		Path:     "/",
		Domain:   cm.domain,
		HttpOnly: true,
		Secure:   cm.secure,
		SameSite: cm.sameSite,
		Expires:  adminTokens.AdminExpiresAt,
	})
}
