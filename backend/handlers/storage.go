package handlers

import (
	"net/http"

	"backend/database"
	"backend/models"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

// StorageHandler 存储处理器
type StorageHandler struct {
	userRepo    *database.UserRepository
	fileRepo    *database.FileRepository
	urlFileRepo *database.UrlFileRepository
}

// NewStorageHandler 创建存储处理器实例
func NewStorageHandler(userRepo *database.UserRepository, fileRepo *database.FileRepository, urlFileRepo *database.UrlFileRepository) *StorageHandler {
	return &StorageHandler{userRepo: userRepo, fileRepo: fileRepo, urlFileRepo: urlFileRepo}
}

// GetStorageInfo 获取存储信息
func (h *StorageHandler) GetStorageInfo(c *gin.Context) {
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	// 获取用户存储限制
	storageInfo, err := h.userRepo.GetUserStorageInfo(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取存储信息失败"})
		return
	}

	// 获取用户实际使用的存储空间（普通文件）
	fileUsedSpace, err := h.fileRepo.GetUserTotalStorage(userID)
	if err != nil {
		// 如果获取已使用空间失败，使用默认值0
		fileUsedSpace = 0
	}

	// 获取用户URL文件数量（URL文件不占用实际存储空间，但计入总数）
	urlFileCount, err := h.urlFileRepo.GetUserTotalUrlFileCount(userID)
	if err != nil {
		// 如果获取URL文件数量失败，使用默认值0
		urlFileCount = 0
	}

	// 计算总使用空间（普通文件大小 + URL文件计数）
	// 这里我们将每个URL文件计为1字节，以便在存储计算中体现
	urlFileSpace := int64(urlFileCount) // 每个URL文件计为1字节
	totalUsedSpace := fileUsedSpace + urlFileSpace

	// 更新已使用空间
	storageInfo.UsedSpace = totalUsedSpace

	// 防御性处理，只在真正异常时才重置
	if storageInfo.UsedSpace < 0 {
		storageInfo.UsedSpace = 0
	}
	if storageInfo.TotalSpace < 0 {
		storageInfo.TotalSpace = 0
	}

	// 格式化存储大小
	storageInfo.UsedSpaceStr = utils.FormatStorageSize(storageInfo.UsedSpace)
	storageInfo.TotalSpaceStr = utils.FormatStorageSize(storageInfo.TotalSpace)

	response := models.StorageInfoResponse{
		Success: true,
		Storage: *storageInfo,
	}
	c.JSON(http.StatusOK, response)
}

// UpdateStorageLimit 更新存储限制
func (h *StorageHandler) UpdateStorageLimit(c *gin.Context) {
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	// 检查用户是否为管理员（基于用户名）
	user, err := h.userRepo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户信息失败"})
		return
	}

	if user.Username != "Mose" {
		c.JSON(http.StatusForbidden, gin.H{"error": "只有管理员才能修改存储设置"})
		return
	}

	var updateRequest models.UpdateStorageRequest
	if err := c.ShouldBindJSON(&updateRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 验证存储限制
	if updateRequest.StorageLimit <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储限制必须大于0"})
		return
	}

	// 获取当前存储信息
	currentStorage, err := h.userRepo.GetUserStorageInfo(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取存储信息失败"})
		return
	}

	// 检查新限制是否小于已使用空间
	if updateRequest.StorageLimit < currentStorage.UsedSpace {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储限制不能小于已使用空间"})
		return
	}

	// 更新存储限制
	if err := h.userRepo.UpdateUserStorage(userID, updateRequest.StorageLimit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新存储限制失败"})
		return
	}

	response := models.UpdateStorageResponse{
		Success: true,
		Message: "存储限制更新成功",
	}
	c.JSON(http.StatusOK, response)
}
