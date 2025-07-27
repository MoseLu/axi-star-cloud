package utils

import (
	"fmt"
	"sync"
	"time"
)

// UploadTask 上传任务
type UploadTask struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	FileName  string    `json:"file_name"`
	FileSize  int64     `json:"file_size"`
	Progress  int       `json:"progress"`
	Status    string    `json:"status"` // pending, uploading, completed, failed
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Error     string    `json:"error,omitempty"`
}

// UploadQueueManager 上传队列管理器
type UploadQueueManager struct {
	tasks map[string]*UploadTask
	mutex sync.RWMutex
}

// NewUploadQueueManager 创建上传队列管理器
func NewUploadQueueManager() *UploadQueueManager {
	return &UploadQueueManager{
		tasks: make(map[string]*UploadTask),
	}
}

// CreateTask 创建上传任务
func (q *UploadQueueManager) CreateTask(userID, fileName string, fileSize int64) *UploadTask {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	taskID := fmt.Sprintf("%s_%d", userID, time.Now().UnixNano())
	task := &UploadTask{
		ID:        taskID,
		UserID:    userID,
		FileName:  fileName,
		FileSize:  fileSize,
		Progress:  0,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	q.tasks[taskID] = task
	return task
}

// GetTask 获取任务
func (q *UploadQueueManager) GetTask(taskID string) *UploadTask {
	q.mutex.RLock()
	defer q.mutex.RUnlock()

	return q.tasks[taskID]
}

// UpdateTaskProgress 更新任务进度
func (q *UploadQueueManager) UpdateTaskProgress(taskID string, progress int) {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	if task, exists := q.tasks[taskID]; exists {
		task.Progress = progress
		task.UpdatedAt = time.Now()
	}
}

// UpdateTaskStatus 更新任务状态
func (q *UploadQueueManager) UpdateTaskStatus(taskID, status string) {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	if task, exists := q.tasks[taskID]; exists {
		task.Status = status
		task.UpdatedAt = time.Now()
	}
}

// UpdateTaskError 更新任务错误
func (q *UploadQueueManager) UpdateTaskError(taskID, error string) {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	if task, exists := q.tasks[taskID]; exists {
		task.Error = error
		task.Status = "failed"
		task.UpdatedAt = time.Now()
	}
}

// GetUserTasks 获取用户的所有任务
func (q *UploadQueueManager) GetUserTasks(userID string) []*UploadTask {
	q.mutex.RLock()
	defer q.mutex.RUnlock()

	var userTasks []*UploadTask
	for _, task := range q.tasks {
		if task.UserID == userID {
			userTasks = append(userTasks, task)
		}
	}
	return userTasks
}

// CleanupOldTasks 清理旧任务（超过1小时的任务）
func (q *UploadQueueManager) CleanupOldTasks() {
	q.mutex.Lock()
	defer q.mutex.Unlock()

	cutoff := time.Now().Add(-time.Hour)
	for taskID, task := range q.tasks {
		if task.UpdatedAt.Before(cutoff) {
			delete(q.tasks, taskID)
		}
	}
}

// GetQueueStats 获取队列统计信息
func (q *UploadQueueManager) GetQueueStats() map[string]interface{} {
	q.mutex.RLock()
	defer q.mutex.RUnlock()

	stats := map[string]interface{}{
		"total_tasks":     len(q.tasks),
		"pending_tasks":   0,
		"uploading_tasks": 0,
		"completed_tasks": 0,
		"failed_tasks":    0,
	}

	for _, task := range q.tasks {
		switch task.Status {
		case "pending":
			stats["pending_tasks"] = stats["pending_tasks"].(int) + 1
		case "uploading":
			stats["uploading_tasks"] = stats["uploading_tasks"].(int) + 1
		case "completed":
			stats["completed_tasks"] = stats["completed_tasks"].(int) + 1
		case "failed":
			stats["failed_tasks"] = stats["failed_tasks"].(int) + 1
		}
	}

	return stats
}
