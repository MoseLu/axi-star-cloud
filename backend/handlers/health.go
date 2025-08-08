/**
 * 健康检查处理器
 *
 * 负责提供系统健康状态检查，包括：
 * - 数据库连接状态
 * - 系统资源使用情况
 * - 服务运行状态
 * - 性能指标
 *
 * 该处理器提供系统监控和运维支持
 */

package handlers

import (
	"database/sql"
	"net/http"
	"runtime"
	"time"

	"backend/database"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HealthHandler 健康检查处理器
type HealthHandler struct {
	db     *sql.DB
	gormDB *gorm.DB
}

// NewHealthHandler 创建健康检查处理器实例
func NewHealthHandler(db *sql.DB, gormDB *gorm.DB) *HealthHandler {
	return &HealthHandler{db: db, gormDB: gormDB}
}

// HealthCheck 健康检查
func (h *HealthHandler) HealthCheck(c *gin.Context) {
	// 检查数据库连接
	dbStatus := "healthy"
	dbLatency := time.Duration(0)

	start := time.Now()
	err := h.db.Ping()
	dbLatency = time.Since(start)

	if err != nil {
		dbStatus = "unhealthy"
	}

	// 获取系统信息
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// 构建健康状态响应
	healthStatus := gin.H{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"services": gin.H{
			"database": gin.H{
				"status":  dbStatus,
				"latency": dbLatency.String(),
			},
		},
		"system": gin.H{
			"goroutines": runtime.NumGoroutine(),
			"memory": gin.H{
				"alloc":       m.Alloc,
				"total_alloc": m.TotalAlloc,
				"sys":         m.Sys,
				"num_gc":      m.NumGC,
			},
		},
	}

	// 如果数据库不健康，返回503状态码
	if dbStatus == "unhealthy" {
		healthStatus["status"] = "degraded"
		c.JSON(http.StatusServiceUnavailable, healthStatus)
		return
	}

	c.JSON(http.StatusOK, healthStatus)
}

// ReadinessCheck 就绪检查
func (h *HealthHandler) ReadinessCheck(c *gin.Context) {
	// 检查数据库连接
	err := h.db.Ping()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "not_ready",
			"error":  "数据库连接失败",
		})
		return
	}

	// 检查数据库表状态
	tableInfo, err := database.GetTableInfoGORM(h.gormDB)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "not_ready",
			"error":   "数据库表检查失败",
			"details": err.Error(),
		})
		return
	}

	// 检查所有必需的表是否存在
	requiredTables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}
	missingTables := []string{}

	for _, tableName := range requiredTables {
		if tableInfo[tableName] == nil {
			missingTables = append(missingTables, tableName)
			continue
		}

		tableData := tableInfo[tableName].(map[string]interface{})
		if !tableData["exists"].(bool) {
			missingTables = append(missingTables, tableName)
		}
	}

	if len(missingTables) > 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":         "not_ready",
			"error":          "缺少必需的数据库表",
			"missing_tables": missingTables,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
		"tables": tableInfo,
	})
}

// LivenessCheck 存活检查
func (h *HealthHandler) LivenessCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "alive",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// Metrics 系统指标
func (h *HealthHandler) Metrics(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	metrics := gin.H{
		"timestamp":  time.Now().Unix(),
		"goroutines": runtime.NumGoroutine(),
		"memory": gin.H{
			"alloc":         m.Alloc,
			"total_alloc":   m.TotalAlloc,
			"sys":           m.Sys,
			"heap_alloc":    m.HeapAlloc,
			"heap_sys":      m.HeapSys,
			"heap_idle":     m.HeapIdle,
			"heap_inuse":    m.HeapInuse,
			"heap_released": m.HeapReleased,
			"heap_objects":  m.HeapObjects,
		},
		"gc": gin.H{
			"num_gc":         m.NumGC,
			"pause_total_ns": m.PauseTotalNs,
		},
	}

	c.JSON(http.StatusOK, metrics)
}

// DatabaseStatus 数据库状态检查
func (h *HealthHandler) DatabaseStatus(c *gin.Context) {
	// 检查数据库连接
	err := h.db.Ping()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "error",
			"error":   "数据库连接失败",
			"details": err.Error(),
		})
		return
	}

	// 获取表信息
	tableInfo, err := database.GetTableInfoGORM(h.gormDB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"error":   "获取表信息失败",
			"details": err.Error(),
		})
		return
	}

	// 检查必需的表
	requiredTables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}
	missingTables := []string{}
	existingTables := []string{}

	for _, tableName := range requiredTables {
		if tableInfo[tableName] == nil {
			missingTables = append(missingTables, tableName)
			continue
		}

		tableData := tableInfo[tableName].(map[string]interface{})
		if tableData["exists"].(bool) {
			existingTables = append(existingTables, tableName)
		} else {
			missingTables = append(missingTables, tableName)
		}
	}

	status := "healthy"
	if len(missingTables) > 0 {
		status = "degraded"
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     status,
		"connection": "healthy",
		"tables": gin.H{
			"existing": existingTables,
			"missing":  missingTables,
			"details":  tableInfo,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
