package handlers

import (
	"backend/models"
	"database/sql"
	"net/http"

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
