package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"backend/database"
	"backend/models"

	"github.com/gin-gonic/gin"
)

// FolderHandler 文件夹处理器
type FolderHandler struct {
	folderRepo database.FolderRepositoryInterface
}

// NewFolderHandler 创建文件夹处理器实例
func NewFolderHandler(folderRepo database.FolderRepositoryInterface) *FolderHandler {
	return &FolderHandler{folderRepo: folderRepo}
}

// GetFolders 获取用户文件夹列表
func (h *FolderHandler) GetFolders(c *gin.Context) {
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	folders, err := h.folderRepo.GetFoldersByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件夹列表失败"})
		return
	}

	response := models.FolderListResponse{
		Success: true,
		Folders: folders,
	}
	c.JSON(http.StatusOK, response)
}

// CreateFolder 创建文件夹
func (h *FolderHandler) CreateFolder(c *gin.Context) {
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	var createRequest models.CreateFolderRequest
	if err := c.ShouldBindJSON(&createRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 设置默认分类
	if createRequest.Category == "" {
		createRequest.Category = "all"
	}

	// 检查是否存在同名文件夹
	exists, err := h.folderRepo.CheckFolderNameExists(userID, createRequest.Name, createRequest.Category, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查文件夹名称失败"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "该分类下已存在同名文件夹"})
		return
	}

	// 转换 ParentID 类型
	var parentID *uint
	if createRequest.ParentID != nil {
		parentIDUint := uint(*createRequest.ParentID)
		parentID = &parentIDUint
	}

	// 创建文件夹记录
	folder := &models.Folder{
		Name:     createRequest.Name,
		UserID:   userID,
		Category: createRequest.Category,
		ParentID: parentID,
	}

	if err := h.folderRepo.CreateFolder(folder); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建文件夹失败"})
		return
	}

	response := models.FolderResponse{
		Success: true,
		Folder:  *folder,
	}
	c.JSON(http.StatusOK, response)
}

// UpdateFolder 更新文件夹
func (h *FolderHandler) UpdateFolder(c *gin.Context) {
	folderIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	folderIDInt, err := strconv.Atoi(folderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件夹ID"})
		return
	}
	folderID := uint(folderIDInt)

	var updateRequest models.UpdateFolderRequest
	if err := c.ShouldBindJSON(&updateRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 检查文件夹是否存在
	_, err = h.folderRepo.GetFolderByID(folderID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "文件夹不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件夹信息失败"})
		}
		return
	}

	// 检查是否存在同名文件夹（排除当前文件夹）
	exists, err := h.folderRepo.CheckFolderNameExists(userID, updateRequest.Name, updateRequest.Category, folderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查文件夹名称失败"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "该分类下已存在同名文件夹"})
		return
	}

	// 更新文件夹
	if err := h.folderRepo.UpdateFolder(folderID, userID, updateRequest.Name, updateRequest.Category); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新文件夹失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "文件夹更新成功",
	})
}

// DeleteFolder 删除文件夹
func (h *FolderHandler) DeleteFolder(c *gin.Context) {
	folderIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	folderIDInt, err := strconv.Atoi(folderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件夹ID"})
		return
	}
	folderID := uint(folderIDInt)

	// 检查文件夹是否存在
	_, err = h.folderRepo.GetFolderByID(folderID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "文件夹不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件夹信息失败"})
		}
		return
	}

	// 删除文件夹（包括其中的文件）
	if err := h.folderRepo.DeleteFolder(folderID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文件夹失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "文件夹删除成功",
	})
}

// GetFolderFileCount 获取文件夹中的文件数量
func (h *FolderHandler) GetFolderFileCount(c *gin.Context) {
	folderIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	folderIDInt, err := strconv.Atoi(folderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件夹ID"})
		return
	}
	folderID := uint(folderIDInt)

	count, err := h.folderRepo.GetFolderFileCount(folderID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件夹文件数量失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   count,
	})
}
