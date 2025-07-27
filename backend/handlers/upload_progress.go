package handlers

import (
	"net/http"

	"backend/utils"

	"github.com/gin-gonic/gin"
)

// UploadProgressHandler 上传进度处理器
type UploadProgressHandler struct {
	queueManager *utils.UploadQueueManager
}

// NewUploadProgressHandler 创建上传进度处理器实例
func NewUploadProgressHandler(queueManager *utils.UploadQueueManager) *UploadProgressHandler {
	return &UploadProgressHandler{
		queueManager: queueManager,
	}
}

// GetUploadTask 获取上传任务状态
func (h *UploadProgressHandler) GetUploadTask(c *gin.Context) {
	taskID := c.Param("task_id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少任务ID"})
		return
	}

	task := h.queueManager.GetTask(taskID)
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "任务不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"task":    task,
	})
}

// GetUserUploadTasks 获取用户的所有上传任务
func (h *UploadProgressHandler) GetUserUploadTasks(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	tasks := h.queueManager.GetUserTasks(userID)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"tasks":   tasks,
	})
}

// GetQueueStats 获取队列统计信息
func (h *UploadProgressHandler) GetQueueStats(c *gin.Context) {
	stats := h.queueManager.GetQueueStats()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats":   stats,
	})
}

// CancelUploadTask 取消上传任务
func (h *UploadProgressHandler) CancelUploadTask(c *gin.Context) {
	taskID := c.Param("task_id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少任务ID"})
		return
	}

	task := h.queueManager.GetTask(taskID)
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "任务不存在"})
		return
	}

	// 只能取消pending状态的任务
	if task.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "只能取消等待中的任务"})
		return
	}

	h.queueManager.UpdateTaskStatus(taskID, "cancelled")
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "任务已取消",
	})
}

// CleanupOldTasks 清理旧任务（管理员功能）
func (h *UploadProgressHandler) CleanupOldTasks(c *gin.Context) {
	// 这里可以添加管理员权限检查
	h.queueManager.CleanupOldTasks()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "旧任务已清理",
	})
}
