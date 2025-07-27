/**
 * 优雅关闭机制
 *
 * 提供应用优雅关闭功能，包括：
 * - 信号处理
 * - 连接池关闭
 * - 缓存清理
 * - 任务队列处理
 * - 资源释放
 *
 * 该模块确保应用在关闭时能够正确处理所有资源
 */

package app

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/async"
	"backend/cache"
)

// GracefulShutdown 优雅关闭管理器
type GracefulShutdown struct {
	server       *http.Server
	cacheManager *cache.CacheManager
	taskManager  *async.TaskManager
	shutdownChan chan os.Signal
	doneChan     chan bool
	timeout      time.Duration
}

// NewGracefulShutdown 创建优雅关闭管理器
func NewGracefulShutdown(server *http.Server, cacheManager *cache.CacheManager, taskManager *async.TaskManager) *GracefulShutdown {
	return &GracefulShutdown{
		server:       server,
		cacheManager: cacheManager,
		taskManager:  taskManager,
		shutdownChan: make(chan os.Signal, 1),
		doneChan:     make(chan bool, 1),
		timeout:      30 * time.Second, // 30秒超时
	}
}

// Start 启动优雅关闭监听
func (gs *GracefulShutdown) Start() {
	// 监听系统信号
	signal.Notify(gs.shutdownChan, syscall.SIGINT, syscall.SIGTERM)

	go gs.handleShutdown()
}

// handleShutdown 处理关闭信号
func (gs *GracefulShutdown) handleShutdown() {
	<-gs.shutdownChan
	log.Println("🔄 收到关闭信号，开始优雅关闭...")

	// 创建超时上下文
	ctx, cancel := context.WithTimeout(context.Background(), gs.timeout)
	defer cancel()

	// 1. 停止接受新连接
	log.Println("📝 停止接受新连接...")
	if err := gs.server.Shutdown(ctx); err != nil {
		log.Printf("⚠️ 服务器关闭时出错: %v", err)
	}

	// 2. 等待任务队列处理完成
	if gs.taskManager != nil {
		log.Println("⏳ 等待任务队列处理完成...")
		gs.taskManager.Stop()
	}

	// 3. 清理缓存
	if gs.cacheManager != nil {
		log.Println("🗑️ 清理缓存...")
		if err := gs.cacheManager.Clear(); err != nil {
			log.Printf("⚠️ 清理缓存时出错: %v", err)
		}
	}

	// 4. 关闭缓存连接
	if gs.cacheManager != nil {
		log.Println("🔌 关闭缓存连接...")
		if err := gs.cacheManager.Close(); err != nil {
			log.Printf("⚠️ 关闭缓存连接时出错: %v", err)
		}
	}

	log.Println("✅ 优雅关闭完成")
	gs.doneChan <- true
}

// Wait 等待关闭完成
func (gs *GracefulShutdown) Wait() {
	<-gs.doneChan
}

// SetTimeout 设置关闭超时时间
func (gs *GracefulShutdown) SetTimeout(timeout time.Duration) {
	gs.timeout = timeout
}

// ShutdownStats 关闭统计信息
type ShutdownStats struct {
	StartTime    time.Time     `json:"start_time"`
	EndTime      time.Time     `json:"end_time"`
	Duration     time.Duration `json:"duration"`
	ServerClosed bool          `json:"server_closed"`
	CacheCleared bool          `json:"cache_cleared"`
	TasksStopped bool          `json:"tasks_stopped"`
	Errors       []string      `json:"errors"`
}

// GracefulShutdownWithStats 带统计信息的优雅关闭
func (gs *GracefulShutdown) GracefulShutdownWithStats() *ShutdownStats {
	stats := &ShutdownStats{
		StartTime: time.Now(),
		Errors:    make([]string, 0),
	}

	// 监听关闭信号
	<-gs.shutdownChan
	log.Println("🔄 收到关闭信号，开始优雅关闭...")

	// 创建超时上下文
	ctx, cancel := context.WithTimeout(context.Background(), gs.timeout)
	defer cancel()

	// 1. 停止服务器
	log.Println("📝 停止HTTP服务器...")
	if err := gs.server.Shutdown(ctx); err != nil {
		stats.Errors = append(stats.Errors, fmt.Sprintf("服务器关闭错误: %v", err))
		log.Printf("⚠️ 服务器关闭时出错: %v", err)
	} else {
		stats.ServerClosed = true
	}

	// 2. 停止任务管理器
	if gs.taskManager != nil {
		log.Println("⏳ 停止任务管理器...")
		gs.taskManager.Stop()
		stats.TasksStopped = true
	}

	// 3. 清理缓存
	if gs.cacheManager != nil {
		log.Println("🗑️ 清理缓存...")
		if err := gs.cacheManager.Clear(); err != nil {
			stats.Errors = append(stats.Errors, fmt.Sprintf("缓存清理错误: %v", err))
			log.Printf("⚠️ 清理缓存时出错: %v", err)
		} else {
			stats.CacheCleared = true
		}
	}

	// 4. 关闭缓存连接
	if gs.cacheManager != nil {
		log.Println("🔌 关闭缓存连接...")
		if err := gs.cacheManager.Close(); err != nil {
			stats.Errors = append(stats.Errors, fmt.Sprintf("缓存连接关闭错误: %v", err))
			log.Printf("⚠️ 关闭缓存连接时出错: %v", err)
		}
	}

	stats.EndTime = time.Now()
	stats.Duration = stats.EndTime.Sub(stats.StartTime)

	log.Printf("✅ 优雅关闭完成，耗时: %v", stats.Duration)
	if len(stats.Errors) > 0 {
		log.Printf("⚠️ 关闭过程中出现 %d 个错误", len(stats.Errors))
	}

	return stats
}

// HealthCheck 健康检查（用于优雅关闭期间）
func (gs *GracefulShutdown) HealthCheck() bool {
	// 检查是否正在关闭
	select {
	case <-gs.shutdownChan:
		return false
	default:
		return true
	}
}

// IsShuttingDown 检查是否正在关闭
func (gs *GracefulShutdown) IsShuttingDown() bool {
	select {
	case <-gs.shutdownChan:
		return true
	default:
		return false
	}
}
