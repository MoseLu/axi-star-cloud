/**
 * 缓存系统模块
 *
 * 提供统一的缓存接口，支持：
 * - 内存缓存（适用于单机部署）
 * - Redis缓存（适用于分布式部署）
 * - 缓存策略配置
 * - 缓存统计和监控
 *
 * 该模块提供高性能的缓存解决方案
 */

package cache

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// CacheInterface 缓存接口
type CacheInterface interface {
	Get(key string) (interface{}, bool)
	Set(key string, value interface{}, ttl time.Duration) error
	Delete(key string) error
	Clear() error
	GetStats() CacheStats
}

// CacheStats 缓存统计
type CacheStats struct {
	Hits   int64 `json:"hits"`
	Misses int64 `json:"misses"`
	Size   int   `json:"size"`
}

// MemoryCache 内存缓存实现
type MemoryCache struct {
	data  map[string]cacheItem
	mutex sync.RWMutex
	stats CacheStats
}

type cacheItem struct {
	Value      interface{}
	ExpireTime time.Time
}

// NewMemoryCache 创建内存缓存实例
func NewMemoryCache() *MemoryCache {
	cache := &MemoryCache{
		data: make(map[string]cacheItem),
	}

	// 启动清理过期数据的goroutine
	go cache.cleanupExpired()

	return cache
}

// Get 获取缓存值
func (mc *MemoryCache) Get(key string) (interface{}, bool) {
	mc.mutex.RLock()
	defer mc.mutex.RUnlock()

	item, exists := mc.data[key]
	if !exists {
		mc.stats.Misses++
		return nil, false
	}

	// 检查是否过期
	if !item.ExpireTime.IsZero() && time.Now().After(item.ExpireTime) {
		delete(mc.data, key)
		mc.stats.Misses++
		return nil, false
	}

	mc.stats.Hits++
	return item.Value, true
}

// Set 设置缓存值
func (mc *MemoryCache) Set(key string, value interface{}, ttl time.Duration) error {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()

	var expireTime time.Time
	if ttl > 0 {
		expireTime = time.Now().Add(ttl)
	}

	mc.data[key] = cacheItem{
		Value:      value,
		ExpireTime: expireTime,
	}

	mc.stats.Size = len(mc.data)
	return nil
}

// Delete 删除缓存
func (mc *MemoryCache) Delete(key string) error {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()

	delete(mc.data, key)
	mc.stats.Size = len(mc.data)
	return nil
}

// Clear 清空缓存
func (mc *MemoryCache) Clear() error {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()

	mc.data = make(map[string]cacheItem)
	mc.stats.Size = 0
	return nil
}

// GetStats 获取缓存统计
func (mc *MemoryCache) GetStats() CacheStats {
	mc.mutex.RLock()
	defer mc.mutex.RUnlock()

	return mc.stats
}

// cleanupExpired 清理过期数据
func (mc *MemoryCache) cleanupExpired() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		mc.mutex.Lock()
		now := time.Now()
		for key, item := range mc.data {
			if !item.ExpireTime.IsZero() && now.After(item.ExpireTime) {
				delete(mc.data, key)
			}
		}
		mc.stats.Size = len(mc.data)
		mc.mutex.Unlock()
	}
}

// RedisCache Redis缓存实现（需要安装redis依赖）
// 使用前需要运行: go get github.com/go-redis/redis/v8
type RedisCache struct {
	// 暂时注释掉Redis实现，需要安装依赖
	// client *redis.Client
	ctx   context.Context
	stats CacheStats
	mutex sync.RWMutex
}

// NewRedisCache 创建Redis缓存实例
func NewRedisCache(addr, password string, db int) (*RedisCache, error) {
	// 暂时返回错误，需要安装Redis依赖
	return nil, fmt.Errorf("Redis缓存需要安装依赖: go get github.com/go-redis/redis/v8")

	/*
		client := redis.NewClient(&redis.Options{
			Addr:     addr,
			Password: password,
			DB:       db,
		})

		ctx := context.Background()

		// 测试连接
		if err := client.Ping(ctx).Err(); err != nil {
			return nil, fmt.Errorf("Redis连接失败: %v", err)
		}

		return &RedisCache{
			client: client,
			ctx:    ctx,
		}, nil
	*/
}

// Get 获取缓存值
func (rc *RedisCache) Get(key string) (interface{}, bool) {
	// 暂时返回未实现
	return nil, false
}

// Set 设置缓存值
func (rc *RedisCache) Set(key string, value interface{}, ttl time.Duration) error {
	// 暂时返回未实现
	return fmt.Errorf("Redis缓存未实现")
}

// Delete 删除缓存
func (rc *RedisCache) Delete(key string) error {
	// 暂时返回未实现
	return fmt.Errorf("Redis缓存未实现")
}

// Clear 清空缓存
func (rc *RedisCache) Clear() error {
	// 暂时返回未实现
	return fmt.Errorf("Redis缓存未实现")
}

// GetStats 获取缓存统计
func (rc *RedisCache) GetStats() CacheStats {
	rc.mutex.RLock()
	defer rc.mutex.RUnlock()

	return rc.stats
}

// Close 关闭Redis连接
func (rc *RedisCache) Close() error {
	// 暂时返回未实现
	return nil
}

// CacheManager 缓存管理器
type CacheManager struct {
	cache CacheInterface
}

// NewCacheManager 创建缓存管理器
func NewCacheManager(cacheType string, config map[string]interface{}) (*CacheManager, error) {
	var cache CacheInterface
	var err error

	switch cacheType {
	case "memory":
		cache = NewMemoryCache()
	case "redis":
		addr := config["addr"].(string)
		password := config["password"].(string)
		db := config["db"].(int)
		cache, err = NewRedisCache(addr, password, db)
		if err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("不支持的缓存类型: %s", cacheType)
	}

	return &CacheManager{cache: cache}, nil
}

// Get 获取缓存
func (cm *CacheManager) Get(key string) (interface{}, bool) {
	return cm.cache.Get(key)
}

// Set 设置缓存
func (cm *CacheManager) Set(key string, value interface{}, ttl time.Duration) error {
	return cm.cache.Set(key, value, ttl)
}

// Delete 删除缓存
func (cm *CacheManager) Delete(key string) error {
	return cm.cache.Delete(key)
}

// Clear 清空缓存
func (cm *CacheManager) Clear() error {
	return cm.cache.Clear()
}

// GetStats 获取缓存统计
func (cm *CacheManager) GetStats() CacheStats {
	return cm.cache.GetStats()
}

// Close 关闭缓存连接
func (cm *CacheManager) Close() error {
	if redisCache, ok := cm.cache.(*RedisCache); ok {
		return redisCache.Close()
	}
	return nil
}
