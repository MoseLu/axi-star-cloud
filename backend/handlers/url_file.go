package handlers

import (
	"net/http"
	"strconv"

	"backend/database"
	"backend/models"

	"github.com/gin-gonic/gin"
)

// UrlFileHandler URL文件处理器
type UrlFileHandler struct {
	urlFileRepo database.UrlFileRepositoryInterface
	userRepo    database.UserRepositoryInterface
	folderRepo  database.FolderRepositoryInterface
}

// NewUrlFileHandler 创建URL文件处理器实例
func NewUrlFileHandler(urlFileRepo database.UrlFileRepositoryInterface, userRepo database.UserRepositoryInterface, folderRepo database.FolderRepositoryInterface) *UrlFileHandler {
	return &UrlFileHandler{
		urlFileRepo: urlFileRepo,
		userRepo:    userRepo,
		folderRepo:  folderRepo,
	}
}

// GetUrlFiles 获取用户URL文件列表
func (h *UrlFileHandler) GetUrlFiles(c *gin.Context) {
	userID := c.Query("user_id")
	folderIDStr := c.Query("folder_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	var folderID *uint
	if folderIDStr != "" {
		if id, err := strconv.Atoi(folderIDStr); err == nil {
			folderIDUint := uint(id)
			folderID = &folderIDUint
		}
	}

	files, err := h.urlFileRepo.GetUrlFilesByUserID(userID, folderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取URL文件列表失败"})
		return
	}

	// 确保files不为nil，如果为nil则初始化为空数组
	if files == nil {
		files = []models.UrlFile{}
	}

	response := models.UrlFileListResponse{
		Success: true,
		Files:   files,
	}
	c.JSON(http.StatusOK, response)
}

// GetUrlFile 获取单个URL文件信息
func (h *UrlFileHandler) GetUrlFile(c *gin.Context) {
	fileIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	fileIDInt, err := strconv.Atoi(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件ID"})
		return
	}
	fileID := uint(fileIDInt)

	file, err := h.urlFileRepo.GetUrlFileByID(fileID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL文件不存在"})
		return
	}

	response := models.UrlFileResponse{
		Success: true,
		File:    *file,
	}
	c.JSON(http.StatusOK, response)
}

// CreateUrlFile 创建URL文件
func (h *UrlFileHandler) CreateUrlFile(c *gin.Context) {
	var request models.CreateUrlRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误"})
		return
	}

	if request.Title == "" || request.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "标题和URL不能为空"})
		return
	}

	// 创建URL文件记录
	urlFile := &models.UrlFile{
		Title:       request.Title,
		URL:         request.URL,
		Description: request.Description,
		UserID:      request.UserID,
	}

	if err := h.urlFileRepo.CreateUrlFile(urlFile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建URL文件失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "URL文件创建成功",
		"file":    urlFile,
	})
}

// DeleteUrlFile 删除URL文件
func (h *UrlFileHandler) DeleteUrlFile(c *gin.Context) {
	fileIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	fileIDInt, err := strconv.Atoi(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件ID"})
		return
	}
	fileID := uint(fileIDInt)

	if err := h.urlFileRepo.DeleteUrlFile(fileID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除URL文件失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "URL文件删除成功",
	})
}

// MoveUrlFile 移动URL文件
func (h *UrlFileHandler) MoveUrlFile(c *gin.Context) {
	fileIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	fileIDInt, err := strconv.Atoi(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件ID"})
		return
	}
	fileID := uint(fileIDInt)

	var request struct {
		FolderID int `json:"folder_id"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求数据格式错误"})
		return
	}

	var folderID *uint
	if request.FolderID > 0 {
		folderIDUint := uint(request.FolderID)
		folderID = &folderIDUint
	}

	if err := h.urlFileRepo.MoveUrlFile(fileID, userID, folderID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "移动URL文件失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "URL文件移动成功",
	})
}

// GetTotalUrlFileCount 获取用户所有URL文件总数（支持按文件夹ID过滤）
func (h *UrlFileHandler) GetTotalUrlFileCount(c *gin.Context) {
	userID := c.Query("user_id")
	folderIDStr := c.Query("folder_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	var count int
	var err error

	if folderIDStr != "" {
		// 如果提供了文件夹ID，则获取该文件夹中的URL文件数量
		folderIDInt, err := strconv.Atoi(folderIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件夹ID"})
			return
		}
		folderID := uint(folderIDInt)
		count, err = h.urlFileRepo.GetFolderUrlFileCount(folderID, userID)
	} else {
		// 否则获取用户所有URL文件数量
		count, err = h.urlFileRepo.GetUserTotalUrlFileCount(userID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取URL文件数量失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   count,
	})
}
