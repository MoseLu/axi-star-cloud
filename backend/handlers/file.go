package handlers

import (
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"backend/config"
	"backend/database"
	"backend/models"
	"backend/utils"

	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// ProgressReader 进度跟踪读取器
type ProgressReader struct {
	Reader     io.Reader
	TotalSize  int64
	OnProgress func(progress int)
	read       int64
}

// Read 实现 io.Reader 接口
func (pr *ProgressReader) Read(p []byte) (n int, err error) {
	n, err = pr.Reader.Read(p)
	if n > 0 {
		pr.read += int64(n)
		progress := int((pr.read * 100) / pr.TotalSize)
		if pr.OnProgress != nil {
			pr.OnProgress(progress)
		}
	}
	return n, err
}

// RateLimitedReader 速率限制读取器
type RateLimitedReader struct {
	Reader io.Reader
	Rate   int64 // 字节/秒
	last   time.Time
	bytes  int64
}

// 全局上传计数器，用于限制并发上传
var (
	uploadCounter int64
)

// Read 实现 io.Reader 接口
func (rlr *RateLimitedReader) Read(p []byte) (n int, err error) {
	n, err = rlr.Reader.Read(p)
	if n > 0 {
		rlr.bytes += int64(n)
		now := time.Now()

		// 计算应该等待的时间
		expectedTime := time.Duration(rlr.bytes) * time.Second / time.Duration(rlr.Rate)
		elapsed := now.Sub(rlr.last)

		if elapsed < expectedTime {
			time.Sleep(expectedTime - elapsed)
		}

		rlr.last = now
	}
	return n, err
}

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

	if userID == "" {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件列表失败"})
		return
	}

	// 确保files不为nil，如果为nil则初始化为空数组
	if files == nil {
		files = []models.File{}
	}

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

	// 添加调试日志
	// 下载请求

	if userID == "" {
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
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		}
		return
	}

	// 构建绝对路径 - 使用统一的路径处理
	absolutePath := utils.GetFileAbsolutePath(file.Path)

	// 检查文件是否存在
	if _, err := os.Stat(absolutePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		return
	}

	// 获取文件实际大小
	fileInfo, err := os.Stat(absolutePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		return
	}

	// 不设置Content-Disposition，让浏览器使用默认下载行为
	// disposition := "attachment; filename*=UTF-8''" + url.QueryEscape(file.Name)
	contentType := "application/octet-stream"

	// c.Header("Content-Disposition", disposition) // 注释掉这行
	c.Header("Content-Type", contentType)
	c.Header("Content-Length", strconv.FormatInt(fileInfo.Size(), 10))

	// 如果是HEAD请求，只返回响应头，不返回文件内容
	if c.Request.Method == "HEAD" {
		c.Status(http.StatusOK)
		return
	}

	// 打开文件
	fileHandle, err := os.Open(absolutePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "打开文件失败"})
		return
	}
	defer fileHandle.Close()

	// 发送文件
	_, err = io.Copy(c.Writer, fileHandle)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "发送文件失败"})
		return
	}
}

// UploadFile 上传文件（优化版本）
func (h *FileHandler) UploadFile(c *gin.Context) {
	defer func() {
		if r := recover(); r != nil {
			debug.PrintStack()
			c.JSON(500, gin.H{"error": "UploadFile panic", "detail": fmt.Sprintf("%+v", r)})
		}
	}()

	// 获取上传配置
	uploadConfig := config.GetUploadConfig()

	// 检查并发上传数量
	currentUploads := atomic.LoadInt64(&uploadCounter)
	if currentUploads >= uploadConfig.MaxConcurrentUploads {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "服务器繁忙，请稍后重试"})
		return
	}

	// 增加上传计数器
	atomic.AddInt64(&uploadCounter, 1)
	defer atomic.AddInt64(&uploadCounter, -1)

	// 解析所有POST表单数据
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "解析表单失败"})
		return
	}

	userID := c.PostForm("user_id")
	folderIDStr := c.PostForm("folder_id")
	confirmReplace := c.PostForm("confirm_replace") // 新增：确认替换参数

	// 获取缩略图数据（如果有的话）
	thumbnailData := c.PostForm("thumbnail")

	// 验证用户ID
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	// 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择要上传的文件"})
		return
	}
	defer file.Close()

	// 检查文件大小
	if header.Size == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件不能为空"})
		return
	}

	// 检查文件类型和大小限制
	fileType := utils.GetFileType(header.Filename)

	if fileType == "video" && header.Size > uploadConfig.MaxVideoSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("视频文件大小不能超过%.0fMB，当前文件大小: %.2fMB",
			float64(uploadConfig.MaxVideoSize)/1024/1024, float64(header.Size)/1024/1024)})
		return
	}

	if header.Size > uploadConfig.MaxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("文件大小不能超过%.0fMB，当前文件大小: %.2fMB",
			float64(uploadConfig.MaxFileSize)/1024/1024, float64(header.Size)/1024/1024)})
		return
	}

	// 检查同名文件
	existingFile, err := h.fileRepo.GetFileByNameAndUser(header.Filename, userID)
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查文件失败"})
		return
	}

	// 如果存在同名文件
	if existingFile != nil {
		sizeDiff := abs(existingFile.Size - header.Size)

		// 如果大小相同或差异小于1K，禁止上传
		if sizeDiff <= 1024 {
			c.JSON(http.StatusOK, gin.H{
				"success":       false,
				"error":         "文件已存在",
				"message":       "检测到同名同大小文件，不允许上传",
				"existing_file": existingFile,
				"conflict_type": "duplicate_same_size",
			})
			return
		}

		// 如果大小差异大于1K，需要确认替换
		if confirmReplace != "true" {
			c.JSON(http.StatusOK, gin.H{
				"success":               false,
				"error":                 "需要确认替换",
				"message":               "检测到同名但大小不同的文件，是否替换原有文件？",
				"existing_file":         existingFile,
				"new_file_size":         header.Size,
				"size_difference":       sizeDiff,
				"requires_confirmation": true,
				"conflict_type":         "duplicate_different_size",
			})
			return
		}

		// 用户确认替换，删除原文件
		// 删除原文件的物理文件
		absolutePath := utils.GetFileAbsolutePath(existingFile.Path)
		if err := os.Remove(absolutePath); err != nil && !os.IsNotExist(err) {
			// 继续执行，不因为删除失败而中断上传
		}

		// 删除数据库记录
		if err := h.fileRepo.DeleteFile(existingFile.ID, userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "删除原文件失败"})
			return
		}
	}

	// 获取用户存储信息
	storageInfo, err := h.userRepo.GetUserStorageInfo(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取存储信息失败"})
		return
	}

	// 检查存储空间
	if !utils.ValidateFileSize(header.Size, storageInfo.TotalSpace, storageInfo.UsedSpace) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储空间不足"})
		return
	}

	// 确定文件类型和路径
	uploadPath := utils.GetUploadPath(header.Filename, fileType)

	// 创建上传目录
	uploadDir := utils.GetFileUploadDir(fileType)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建上传目录失败"})
		return
	}

	// 生成唯一文件名（避免重名）
	fileName := header.Filename
	ext := filepath.Ext(fileName)
	nameWithoutExt := strings.TrimSuffix(fileName, ext)

	// 检查文件是否已存在，如果存在则添加数字后缀
	counter := 1
	originalFileName := fileName
	for {
		filePath := filepath.Join(uploadDir, fileName)
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			break
		}
		fileName = fmt.Sprintf("%s_%d%s", nameWithoutExt, counter, ext)
		counter++
		if counter > 1000 { // 防止无限循环
			c.JSON(http.StatusInternalServerError, gin.H{"error": "无法生成唯一文件名"})
			return
		}
	}

	// 保存文件（使用缓冲写入，提高性能）
	filePath := filepath.Join(uploadDir, fileName)
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}
	defer dst.Close()

	// 使用缓冲写入，提高大文件上传性能
	buffer := make([]byte, 32*1024) // 32KB buffer

	// 添加合理的速率限制，防止服务器过载
	var reader io.Reader = file
	if uploadConfig.MaxUploadRate > 0 {
		rateLimitedReader := &RateLimitedReader{
			Reader: file,
			Rate:   uploadConfig.MaxUploadRate,
			last:   time.Now(),
		}
		reader = rateLimitedReader
	}
	written, err := io.CopyBuffer(dst, reader, buffer)
	if err != nil {
		// 删除部分写入的文件
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	// 验证写入的文件大小
	if written != header.Size {
		// 删除不完整的文件
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "文件写入不完整"})
		return
	}

	// 创建文件记录
	newFile := &models.File{
		Name:     originalFileName, // 保存原始文件名
		Size:     written,
		Type:     fileType,
		Path:     uploadPath,
		UserID:   userID,
		FolderID: nil,
	}

	// 如果是视频文件且有缩略图数据，保存到thumbnail_data字段
	if fileType == "video" && thumbnailData != "" {
		newFile.ThumbnailData = &thumbnailData
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
		// 删除已保存的文件
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "保存文件记录失败",
			"detail": err.Error(),
		})
		return
	}

	// 注意：已使用的存储空间通过计算文件大小动态获取，不需要更新数据库
	// 存储限制只能通过管理员设置接口修改

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "文件上传成功",
		"file":    newFile,
	})
}

// abs 计算绝对值
func abs(x int64) int64 {
	if x < 0 {
		return -x
	}
	return x
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		}
		return
	}

	// 删除物理文件
	absolutePath := utils.GetFileAbsolutePath(file.Path)
	if err := os.Remove(absolutePath); err != nil && !os.IsNotExist(err) {
		// 静默处理删除错误
	}

	// 删除数据库记录
	if err := h.fileRepo.DeleteFile(fileID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除文件失败"})
		return
	}

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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		}
		return
	}

	// 检查目标文件夹是否存在
	if moveRequest.FolderID > 0 {
		exists, err := h.folderRepo.CheckFolderExists(moveRequest.FolderID, userID)
		if err != nil {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "移动文件失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "文件移动成功",
	})
}

// GetTotalFileCount 获取用户所有文件总数
func (h *FileHandler) GetTotalFileCount(c *gin.Context) {
	userID := c.Query("user_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	count, err := h.fileRepo.GetUserTotalFileCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件总数失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   count,
	})
}

// DownloadFileRedirect 下载文件重定向（优化版本）
func (h *FileHandler) DownloadFileRedirect(c *gin.Context) {
	fileIDStr := c.Query("id")
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

	// 查询文件信息
	file, err := h.fileRepo.GetFileByID(fileID, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取文件信息失败"})
		}
		return
	}

	// 构建静态文件URL - 修复重复路径问题
	staticURL := file.Path

	// 生成一次性token（简化版本，实际可以使用JWT）
	token := fmt.Sprintf("token_%d_%s", fileID, userID)

	// 重定向到静态文件URL
	redirectURL := fmt.Sprintf("%s?token=%s", staticURL, token)
	c.Redirect(http.StatusFound, redirectURL)
}

// SearchFiles 搜索文件
func (h *FileHandler) SearchFiles(c *gin.Context) {
	userID := c.Query("user_id")
	query := c.Query("q")
	folderIDStr := c.Query("folder_id")

	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少搜索关键词"})
		return
	}

	var folderID *int
	if folderIDStr != "" {
		if id, err := strconv.Atoi(folderIDStr); err == nil {
			folderID = &id
		}
	}

	files, err := h.fileRepo.SearchFilesByUserID(userID, query, folderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "搜索文件失败"})
		return
	}

	// 确保files不为nil，如果为nil则初始化为空数组
	if files == nil {
		files = []models.File{}
	}

	response := models.FileListResponse{
		Success: true,
		Files:   files,
	}
	c.JSON(http.StatusOK, response)
}

// UploadFiles 批量上传文件
func (h *FileHandler) UploadFiles(c *gin.Context) {
	defer func() {
		if r := recover(); r != nil {
			debug.PrintStack()
			c.JSON(500, gin.H{"error": "UploadFiles panic", "detail": fmt.Sprintf("%+v", r)})
		}
	}()

	// 获取上传配置
	uploadConfig := config.GetUploadConfig()

	// 检查并发上传数量
	currentUploads := atomic.LoadInt64(&uploadCounter)
	if currentUploads >= uploadConfig.MaxConcurrentUploads {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "服务器繁忙，请稍后重试"})
		return
	}

	// 增加上传计数器
	atomic.AddInt64(&uploadCounter, 1)
	defer atomic.AddInt64(&uploadCounter, -1)

	// 解析所有POST表单数据
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "解析表单失败"})
		return
	}

	userID := c.PostForm("user_id")
	folderIDStr := c.PostForm("folder_id")

	// 验证用户ID
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户ID"})
		return
	}

	// 获取所有上传的文件
	form := c.Request.MultipartForm
	if form == nil || form.File == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有找到上传的文件"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择要上传的文件"})
		return
	}

	// 获取用户存储信息
	storageInfo, err := h.userRepo.GetUserStorageInfo(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取存储信息失败"})
		return
	}

	// 计算所有文件的总大小
	var totalSize int64
	for _, file := range files {
		if file.Size == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "文件不能为空"})
			return
		}
		totalSize += file.Size
	}

	// 检查存储空间
	if !utils.ValidateFileSize(totalSize, storageInfo.TotalSpace, storageInfo.UsedSpace) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储空间不足"})
		return
	}

	// 批量处理结果
	var results []gin.H
	var totalUploadedSize int64
	var successCount int
	var failedCount int

	// 处理每个文件
	for _, file := range files {
		fileResult := gin.H{
			"filename": file.Filename,
			"success":  false,
		}

		// 检查文件类型和大小限制
		fileType := utils.GetFileType(file.Filename)

		if fileType == "video" && file.Size > uploadConfig.MaxVideoSize {
			fileResult["error"] = fmt.Sprintf("视频文件大小不能超过%.0fMB", float64(uploadConfig.MaxVideoSize)/1024/1024)
			failedCount++
			results = append(results, fileResult)
			continue
		}

		if file.Size > uploadConfig.MaxFileSize {
			fileResult["error"] = fmt.Sprintf("文件大小不能超过%.0fMB", float64(uploadConfig.MaxFileSize)/1024/1024)
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 检查同名文件
		existingFile, err := h.fileRepo.GetFileByNameAndUser(file.Filename, userID)
		if err != nil && err != sql.ErrNoRows {
			fileResult["error"] = "检查文件失败"
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 如果存在同名文件
		if existingFile != nil {
			sizeDiff := abs(existingFile.Size - file.Size)

			// 如果大小相同或差异小于1K，跳过该文件
			if sizeDiff <= 1024 {
				fileResult["error"] = "文件已存在（同名同大小）"
				failedCount++
				results = append(results, fileResult)
				continue
			}

			// 如果大小差异大于1K，跳过该文件（批量上传不支持替换）
			fileResult["error"] = "文件已存在（同名但大小不同，批量上传不支持替换）"
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 确定文件类型和路径
		uploadPath := utils.GetUploadPath(file.Filename, fileType)

		// 创建上传目录
		uploadDir := utils.GetFileUploadDir(fileType)
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			fileResult["error"] = "创建上传目录失败"
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 生成唯一文件名（避免重名）
		fileName := file.Filename
		ext := filepath.Ext(fileName)
		nameWithoutExt := strings.TrimSuffix(fileName, ext)

		// 检查文件是否已存在，如果存在则添加数字后缀
		counter := 1
		originalFileName := fileName
		for {
			filePath := filepath.Join(uploadDir, fileName)
			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				break
			}
			fileName = fmt.Sprintf("%s_%d%s", nameWithoutExt, counter, ext)
			counter++
			if counter > 1000 { // 防止无限循环
				fileResult["error"] = "无法生成唯一文件名"
				failedCount++
				results = append(results, fileResult)
				continue
			}
		}

		// 保存文件
		filePath := filepath.Join(uploadDir, fileName)
		dst, err := os.Create(filePath)
		if err != nil {
			fileResult["error"] = "保存文件失败"
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 打开源文件
		src, err := file.Open()
		if err != nil {
			dst.Close()
			fileResult["error"] = "打开文件失败"
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 使用缓冲写入，提高性能
		buffer := make([]byte, 32*1024) // 32KB buffer
		written, err := io.CopyBuffer(dst, src, buffer)
		src.Close()
		dst.Close()

		if err != nil {
			// 删除部分写入的文件
			os.Remove(filePath)
			fileResult["error"] = "保存文件失败"
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 验证写入的文件大小
		if written != file.Size {
			// 删除不完整的文件
			os.Remove(filePath)
			fileResult["error"] = "文件写入不完整"
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 创建文件记录
		newFile := &models.File{
			Name:     originalFileName, // 保存原始文件名
			Size:     written,
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
			// 删除已保存的文件
			os.Remove(filePath)
			fileResult["error"] = "保存文件记录失败"
			failedCount++
			results = append(results, fileResult)
			continue
		}

		// 更新统计信息
		totalUploadedSize += written
		successCount++

		// 设置成功结果
		fileResult["success"] = true
		fileResult["file"] = newFile
		results = append(results, fileResult)
	}

	// 注意：已使用的存储空间通过计算文件大小动态获取，不需要更新数据库
	// 存储限制只能通过管理员设置接口修改

	// 返回批量上传结果
	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"message":       fmt.Sprintf("批量上传完成！成功: %d 个，失败: %d 个", successCount, failedCount),
		"total_files":   len(files),
		"success_count": successCount,
		"failed_count":  failedCount,
		"results":       results,
	})
}
