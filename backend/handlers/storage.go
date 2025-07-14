package handlers

import (
	"log"
	"net/http"

	"backend/database"
	"backend/models"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

// StorageHandler 存储处理器
type StorageHandler struct {
	userRepo *database.UserRepository
}

// NewStorageHandler 创建存储处理器实例
func NewStorageHandler(userRepo *database.UserRepository) *StorageHandler {
	return &StorageHandler{userRepo: userRepo}
}

// GetStorageInfo 获取存储信息
func (h *StorageHandler) GetStorageInfo(c *gin.Context) {
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	storageInfo, err := h.userRepo.GetUserStorageInfo(userID)
	if err != nil {
		log.Printf("获取存储信息错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取存储信息失败"})
		return
	}

	// 防御性处理，确保为数字
	if storageInfo.UsedSpace < 0 || storageInfo.UsedSpace == 0 {
		storageInfo.UsedSpace = 0
	}
	if storageInfo.TotalSpace < 0 || storageInfo.TotalSpace == 0 {
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

	var updateRequest models.UpdateStorageRequest
	if err := c.ShouldBindJSON(&updateRequest); err != nil {
		log.Printf("请求参数绑定错误: %v", err)
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
		log.Printf("获取当前存储信息错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取存储信息失败"})
		return
	}

	// 检查新限制是否小于已使用空间
	if updateRequest.StorageLimit < currentStorage.UsedSpace {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储限制不能小于已使用空间"})
		return
	}

	// 更新存储限制
	if err := h.userRepo.UpdateStorageLimit(userID, updateRequest.StorageLimit); err != nil {
		log.Printf("更新存储限制错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新存储限制失败"})
		return
	}

	log.Printf("存储限制更新成功: userID=%s, newLimit=%d", userID, updateRequest.StorageLimit)

	response := models.UpdateStorageResponse{
		Success: true,
		Message: "存储限制更新成功",
	}
	c.JSON(http.StatusOK, response)
}
