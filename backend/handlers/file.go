package handlers

import (
	"database/sql"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"

	"backend/database"
	"backend/models"
	"backend/utils"

	"github.com/gin-gonic/gin"
)

// FileHandler 文件处理器
type FileHandler struct {
	fileRepo   *database.FileRepository
	userRepo   *database.UserRepository
	folderRepo *database.FolderRepository
}

// NewFileHandler 创建文件处理器实例
func NewFileHandler(fileRepo *database.FileRepository, userRepo *database.UserRepository, folderRepo *database.FolderRepository) *FileHandler {
	return &FileHandler{
		fileRepo:   fileRepo,
		userRepo:   userRepo,
		folderRepo: folderRepo,
	}
}

// GetFiles 获取用户文件列表
func (h *FileHandler) GetFiles(c *gin.Context) {
	userID := c.Query("user_id")
	folderIDStr := c.Query("folder_id")

	log.Printf("获取文件列表请求: userID=%s, folderID=%s", userID, folderIDStr)

	if userID == "" {
		log.Printf("未提供用户ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	var folderID *int
	if folderIDStr != "" {
		if id, err := strconv.Atoi(folderIDStr); err == nil {
			folderID = &id
		}
	}

	files, err := h.fileRepo.GetFilesByUserID(userID, folderID)
	if err != nil {
		log.Printf("查询文件列表错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件列表失败"})
		return
	}

	for _, file := range files {
		log.Printf("找到文件: ID=%d, 名称=%s, 类型=%s, 路径=%s, 文件夹ID=%v",
			file.ID, file.Name, file.Type, file.Path, file.FolderID)
	}

	log.Printf("用户 %s 在文件夹 %s 的文件总数: %d", userID, folderIDStr, len(files))

	response := models.FileListResponse{
		Success: true,
		Files:   files,
	}
	c.JSON(http.StatusOK, response)
}

// GetFile 获取单个文件信息
func (h *FileHandler) GetFile(c *gin.Context) {
	fileIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件ID"})
		return
	}

	file, err := h.fileRepo.GetFileByID(fileID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		} else {
			log.Printf("查询文件信息错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		}
		return
	}

	response := models.FileResponse{
		Success: true,
		File:    *file,
	}
	c.JSON(http.StatusOK, response)
}

// DownloadFile 下载文件
func (h *FileHandler) DownloadFile(c *gin.Context) {
	fileIDStr := c.Param("id")
	userID := c.Query("user_id")

	log.Printf("下载请求: fileID=%s, userID=%s", fileIDStr, userID)

	if userID == "" {
		log.Printf("未提供用户ID")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件ID"})
		return
	}

	// 查询文件信息
	file, err := h.fileRepo.GetFileByID(fileID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("文件不存在: fileID=%s, userID=%s", fileIDStr, userID)
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		} else {
			log.Printf("查询文件信息错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		}
		return
	}

	log.Printf("找到文件: %s, 路径: %s", file.Name, file.Path)

	// 构建绝对路径 - 使用统一的路径处理
	absolutePath := utils.GetFileAbsolutePath(file.Path)
	log.Printf("文件绝对路径: %s", absolutePath)

	// 检查文件是否存在
	if _, err := os.Stat(absolutePath); os.IsNotExist(err) {
		log.Printf("文件不存在: %s", absolutePath)
		c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		return
	}

	// 获取文件实际大小
	fileInfo, err := os.Stat(absolutePath)
	if err != nil {
		log.Printf("获取文件信息错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		return
	}

	// 设置响应头 - 正确处理文件名编码
	disposition := "attachment; filename*=UTF-8''" + url.QueryEscape(file.Name)
	c.Header("Content-Disposition", disposition)
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Length", strconv.FormatInt(fileInfo.Size(), 10))

	// 打开文件
	fileHandle, err := os.Open(absolutePath)
	if err != nil {
		log.Printf("打开文件错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "打开文件失败"})
		return
	}
	defer fileHandle.Close()

	// 发送文件
	_, err = io.Copy(c.Writer, fileHandle)
	if err != nil {
		log.Printf("发送文件错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发送文件失败"})
		return
	}

	log.Printf("文件下载成功: %s", file.Name)
}

// UploadFile 上传文件
func (h *FileHandler) UploadFile(c *gin.Context) {
	userID := c.PostForm("user_id")
	folderIDStr := c.PostForm("folder_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	// 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		log.Printf("获取上传文件错误: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择要上传的文件"})
		return
	}
	defer file.Close()

	// 检查文件大小
	if header.Size == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件不能为空"})
		return
	}

	// 获取用户存储信息
	storageInfo, err := h.userRepo.GetUserStorageInfo(userID)
	if err != nil {
		log.Printf("获取用户存储信息错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取存储信息失败"})
		return
	}

	// 检查存储空间
	if !utils.ValidateFileSize(header.Size, storageInfo.TotalSpace, storageInfo.UsedSpace) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储空间不足"})
		return
	}

	// 确定文件类型和路径
	fileType := utils.GetFileType(header.Filename)
	uploadPath := utils.GetUploadPath(header.Filename, fileType)

	// 创建上传目录 - 使用统一的路径处理
	uploadDir := utils.GetFileUploadDir(fileType)
	log.Printf("文件上传目录: %s", uploadDir)

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("创建上传目录错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建上传目录失败"})
		return
	}

	// 保存文件
	filePath := filepath.Join(uploadDir, header.Filename)
	log.Printf("文件保存路径: %s", filePath)
	dst, err := os.Create(filePath)
	if err != nil {
		log.Printf("创建文件错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}
	defer dst.Close()

	// 复制文件内容
	_, err = io.Copy(dst, file)
	if err != nil {
		log.Printf("保存文件错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	// 获取实际文件大小
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		log.Printf("获取文件信息错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		return
	}

	actualSize := fileInfo.Size()
	log.Printf("文件上传: %s, 请求头大小: %d, 实际大小: %d", header.Filename, header.Size, actualSize)

	// 创建文件记录
	newFile := &models.File{
		Name:     header.Filename,
		Size:     actualSize, // 使用实际文件大小
		Type:     fileType,
		Path:     uploadPath,
		UserID:   userID,
		FolderID: nil,
	}

	// 如果指定了文件夹ID
	if folderIDStr != "" {
		if folderID, err := strconv.Atoi(folderIDStr); err == nil {
			// 检查文件夹是否存在
			if exists, _ := h.folderRepo.CheckFolderExists(folderID, userID); exists {
				newFile.FolderID = &folderID
			}
		}
	}

	// 保存到数据库
	if err := h.fileRepo.CreateFile(newFile); err != nil {
		log.Printf("保存文件记录错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件记录失败"})
		return
	}

	log.Printf("文件上传成功: %s, 大小: %d bytes", header.Filename, header.Size)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "文件上传成功",
		"file":    newFile,
	})
}

// DeleteFile 删除文件
func (h *FileHandler) DeleteFile(c *gin.Context) {
	fileIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件ID"})
		return
	}

	// 获取文件信息
	file, err := h.fileRepo.GetFileByID(fileID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		} else {
			log.Printf("查询文件信息错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		}
		return
	}

	// 删除物理文件
	absolutePath := utils.GetFileAbsolutePath(file.Path)
	if err := os.Remove(absolutePath); err != nil && !os.IsNotExist(err) {
		log.Printf("删除物理文件错误: %v", err)
	}

	// 删除数据库记录
	if err := h.fileRepo.DeleteFile(fileID, userID); err != nil {
		log.Printf("删除文件记录错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文件失败"})
		return
	}

	log.Printf("文件删除成功: %s", file.Name)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "文件删除成功",
	})
}

// MoveFile 移动文件
func (h *FileHandler) MoveFile(c *gin.Context) {
	fileIDStr := c.Param("id")
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权访问"})
		return
	}

	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件ID"})
		return
	}

	var moveRequest models.MoveFileRequest
	if err := c.ShouldBindJSON(&moveRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 检查文件是否存在
	_, err = h.fileRepo.GetFileByID(fileID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		} else {
			log.Printf("查询文件信息错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		}
		return
	}

	// 检查目标文件夹是否存在
	if moveRequest.FolderID > 0 {
		exists, err := h.folderRepo.CheckFolderExists(moveRequest.FolderID, userID)
		if err != nil {
			log.Printf("检查文件夹错误: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "检查文件夹失败"})
			return
		}
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "目标文件夹不存在"})
			return
		}
	}

	// 移动文件
	var folderID *int
	if moveRequest.FolderID > 0 {
		folderID = &moveRequest.FolderID
	}

	if err := h.fileRepo.MoveFile(fileID, userID, folderID); err != nil {
		log.Printf("移动文件错误: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "移动文件失败"})
		return
	}

	log.Printf("文件移动成功: fileID=%d, folderID=%v", fileID, folderID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "文件移动成功",
	})
}
