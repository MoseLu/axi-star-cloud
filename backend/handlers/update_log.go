package handlers

import (
	"backend/models"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// UpdateLogHandler 更新日志处理器
type UpdateLogHandler struct {
	db *sql.DB
}

// NewUpdateLogHandler 创建更新日志处理器实例
func NewUpdateLogHandler(db *sql.DB) *UpdateLogHandler {
	return &UpdateLogHandler{db: db}
}

// GetUpdateLogs 获取更新日志
func (h *UpdateLogHandler) GetUpdateLogs(c *gin.Context) {
	// 获取更新日志
	logs, err := models.GetUpdateLogs(h.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取更新日志失败",
		})
		return
	}

	// 返回JSON响应
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    logs,
	})
}

// SyncUpdateLogs 同步更新日志
func (h *UpdateLogHandler) SyncUpdateLogs(c *gin.Context) {
	// 解析请求数据
	var syncRequest struct {
		Logs      []models.UpdateLog `json:"logs"`
		Source    string             `json:"source"`
		Timestamp string             `json:"timestamp"`
	}

	if err := c.ShouldBindJSON(&syncRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "请求数据格式错误",
		})
		return
	}

	// 验证来源
	if syncRequest.Source != "frontend" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "无效的数据来源",
		})
		return
	}

	// 验证日志数据
	if len(syncRequest.Logs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "没有需要同步的日志数据",
		})
		return
	}

	// 获取现有的更新日志
	existingLogs, err := models.GetUpdateLogs(h.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取现有更新日志失败",
		})
		return
	}

	// 创建现有版本的映射
	existingVersions := make(map[string]bool)
	for _, log := range existingLogs {
		existingVersions[log.Version] = true
	}

	// 过滤出需要插入的新版本
	var newLogs []models.UpdateLog
	for _, log := range syncRequest.Logs {
		if !existingVersions[log.Version] {
			// 设置创建时间
			log.CreatedAt = time.Now()
			log.UpdatedAt = time.Now()
			newLogs = append(newLogs, log)
		}
	}

	// 如果没有新版本需要插入
	if len(newLogs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success":      true,
			"message":      "所有版本已存在，无需同步",
			"synced_count": 0,
		})
		return
	}

	// 批量插入新版本
	insertedCount := 0
	for _, log := range newLogs {
		if err := models.InsertUpdateLog(h.db, &log); err != nil {
			// 记录错误但继续处理其他日志
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "插入更新日志失败: " + err.Error(),
			})
			return
		}
		insertedCount++
	}

	// 返回成功响应
	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "更新日志同步成功",
		"synced_count": insertedCount,
		"total_logs":   len(existingLogs) + insertedCount,
	})
}

// GetUpdateLogStats 获取更新日志统计信息
func (h *UpdateLogHandler) GetUpdateLogStats(c *gin.Context) {
	// 获取更新日志
	logs, err := models.GetUpdateLogs(h.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取更新日志统计失败",
		})
		return
	}

	// 计算统计信息
	var latestVersion string
	var totalFeatures int
	var totalIssues int

	if len(logs) > 0 {
		latestVersion = logs[0].Version
		for _, log := range logs {
			totalFeatures += len(log.Features)
			totalIssues += len(log.KnownIssues)
		}
	}

	// 返回统计信息
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_logs":     len(logs),
			"latest_version": latestVersion,
			"total_features": totalFeatures,
			"total_issues":   totalIssues,
			"last_updated":   time.Now().Format("2006-01-02 15:04:05"),
		},
	})
}

// ValidateUpdateLogs 验证更新日志数据完整性
func (h *UpdateLogHandler) ValidateUpdateLogs(c *gin.Context) {
	// 获取数据库中的更新日志
	dbLogs, err := models.GetUpdateLogs(h.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "获取数据库更新日志失败",
		})
		return
	}

	// 解析请求中的前端日志数据
	var frontendLogs []models.UpdateLog
	if err := c.ShouldBindJSON(&frontendLogs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "请求数据格式错误",
		})
		return
	}

	// 比较数据
	dbVersions := make(map[string]models.UpdateLog)
	for _, log := range dbLogs {
		dbVersions[log.Version] = log
	}

	frontendVersions := make(map[string]models.UpdateLog)
	for _, log := range frontendLogs {
		frontendVersions[log.Version] = log
	}

	// 检查数据一致性
	var missingInDB []string
	var missingInFrontend []string
	var inconsistentVersions []string

	// 检查前端有但数据库没有的版本
	for version := range frontendVersions {
		if _, exists := dbVersions[version]; !exists {
			missingInDB = append(missingInDB, version)
		}
	}

	// 检查数据库有但前端没有的版本
	for version := range dbVersions {
		if _, exists := frontendVersions[version]; !exists {
			missingInFrontend = append(missingInFrontend, version)
		}
	}

	// 检查版本内容是否一致
	for version, frontendLog := range frontendVersions {
		if dbLog, exists := dbVersions[version]; exists {
			// 简单比较标题和描述
			if frontendLog.Title != dbLog.Title || frontendLog.Description != dbLog.Description {
				inconsistentVersions = append(inconsistentVersions, version)
			}
		}
	}

	// 返回验证结果
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"is_consistent":         len(missingInDB) == 0 && len(missingInFrontend) == 0 && len(inconsistentVersions) == 0,
			"missing_in_db":         missingInDB,
			"missing_in_frontend":   missingInFrontend,
			"inconsistent_versions": inconsistentVersions,
			"db_log_count":          len(dbLogs),
			"frontend_log_count":    len(frontendLogs),
		},
	})
}
