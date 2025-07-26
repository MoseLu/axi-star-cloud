/**
 * 速率限制中间件
 * 
 * 负责限制API请求频率，防止滥用，包括：
 * - 基于IP的速率限制
 * - 基于用户的速率限制
 * - 基于端点的速率限制
 * - 可配置的限制策略
 * 
 * 该中间件提供API保护和DDoS防护
 */

package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter 速率限制器
type RateLimiter struct {
	requests map[string][]time.Time
	mutex    sync.RWMutex
	limit    int
	window   time.Duration
}

// NewRateLimiter 创建速率限制器
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
}

// RateLimit 速率限制中间件
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	
	return func(c *gin.Context) {
		// 获取客户端标识（IP地址）
		clientID := c.ClientIP()
		
		// 检查速率限制
		if !limiter.Allow(clientID) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "请求过于频繁，请稍后再试",
				"retry_after": int(window.Seconds()),
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// Allow 检查是否允许请求
func (rl *RateLimiter) Allow(clientID string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()
	
	now := time.Now()
	windowStart := now.Add(-rl.window)
	
	// 获取客户端请求历史
	requests, exists := rl.requests[clientID]
	if !exists {
		requests = []time.Time{}
	}
	
	// 清理过期的请求记录
	var validRequests []time.Time
	for _, reqTime := range requests {
		if reqTime.After(windowStart) {
			validRequests = append(validRequests, reqTime)
		}
	}
	
	// 检查是否超过限制
	if len(validRequests) >= rl.limit {
		return false
	}
	
	// 添加当前请求
	validRequests = append(validRequests, now)
	rl.requests[clientID] = validRequests
	
	return true
}

// UserRateLimit 基于用户的速率限制
func UserRateLimit(limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	
	return func(c *gin.Context) {
		// 从上下文中获取用户ID
		userID, exists := c.Get("currentUser")
		if !exists {
			// 如果没有用户信息，使用IP地址
			clientID := c.ClientIP()
			if !limiter.Allow(clientID) {
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error": "请求过于频繁，请稍后再试",
				})
				c.Abort()
				return
			}
			c.Next()
			return
		}
		
		// 使用用户ID作为标识
		userIDStr := fmt.Sprintf("user_%v", userID)
		if !limiter.Allow(userIDStr) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "请求过于频繁，请稍后再试",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// EndpointRateLimit 基于端点的速率限制
func EndpointRateLimit(endpoint string, limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	
	return func(c *gin.Context) {
		clientID := c.ClientIP()
		endpointID := fmt.Sprintf("%s_%s", clientID, endpoint)
		
		if !limiter.Allow(endpointID) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": fmt.Sprintf("访问 %s 过于频繁，请稍后再试", endpoint),
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// BurstRateLimit 突发流量限制
func BurstRateLimit(limit int, burst int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window)
	burstLimiter := NewRateLimiter(burst, time.Second) // 1秒内的突发限制
	
	return func(c *gin.Context) {
		clientID := c.ClientIP()
		
		// 检查突发限制
		if !burstLimiter.Allow(clientID) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "请求过于频繁，请稍后再试",
			})
			c.Abort()
			return
		}
		
		// 检查常规限制
		if !limiter.Allow(clientID) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "请求过于频繁，请稍后再试",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
} 