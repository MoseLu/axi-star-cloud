package utils

import (
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strings"
)

// FormatStorageSize 格式化存储大小
func FormatStorageSize(bytes int64) string {
	if bytes == 0 {
		return "0 B"
	}

	const unit = 1024
	exp := int(math.Log(float64(bytes)) / math.Log(unit))
	sizes := []string{"B", "KB", "MB", "GB", "TB", "PB"}

	if exp >= len(sizes) {
		exp = len(sizes) - 1
	}

	value := float64(bytes) / math.Pow(unit, float64(exp))
	return fmt.Sprintf("%.1f %s", value, sizes[exp])
}

// GetFileType 根据文件扩展名获取文件类型
func GetFileType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))

	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp":
		return "image"
	case ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm":
		return "video"
	case ".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma":
		return "audio"
	case ".pdf":
		return "pdf"
	case ".txt", ".md", ".rtf":
		return "document"
	case ".doc", ".docx":
		return "word"
	case ".xls", ".xlsx":
		return "excel"
	case ".ppt", ".pptx":
		return "powerpoint"
	case ".zip", ".rar", ".7z", ".tar", ".gz":
		return "other"
	default:
		return "other"
	}
}

// GetUploadPath 根据文件类型生成上传路径
func GetUploadPath(filename, fileType string) string {
	return fmt.Sprintf("/uploads/%s/%s", fileType, filename)
}

// GetUploadDir 获取上传目录的绝对路径
func GetUploadDir() string {
	// 获取当前工作目录
	currentDir, err := os.Getwd()
	if err != nil {
		// 如果获取失败，使用默认路径
		return "../uploads"
	}

	// 在云端服务器上，优先使用绝对路径
	// 尝试多个可能的绝对路径
	absolutePaths := []string{
		"/www/wwwroot/axi-star-cloud/uploads",
		"/www/wwwroot/redamancy.com.cn/uploads",
		"/www/wwwroot/axi-star-cloud/front/uploads",
		"/www/wwwroot/redamancy.com.cn/front/uploads",
	}

	for _, absPath := range absolutePaths {
		if _, err := os.Stat(absPath); err == nil {
			return absPath
		}
	}

	// 如果绝对路径都找不到，尝试相对路径
	// 检查是否在backend目录中
	if strings.HasSuffix(currentDir, "backend") {
		relativePath := filepath.Join(currentDir, "../uploads")
		return relativePath
	}

	// 如果在项目根目录，直接使用相对路径
	return "uploads"
}

// GetAbsoluteUploadDir 获取绝对路径的上传目录
func GetAbsoluteUploadDir() string {
	// 尝试多个可能的路径
	possiblePaths := []string{
		"uploads",
		"../uploads",
		"front/uploads",
		"../front/uploads",
		"./uploads",
		"./front/uploads",
		"/www/wwwroot/axi-star-cloud/uploads", // 宝塔面板路径
	}

	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			absPath, err := filepath.Abs(path)
			if err == nil {
				return absPath
			}
		}
	}

	// 如果都找不到，返回默认路径
	return "uploads"
}

// GetAvatarUploadDir 获取头像上传目录的绝对路径
func GetAvatarUploadDir() string {
	// 获取当前工作目录
	currentDir, err := os.Getwd()
	if err != nil {
		// 如果获取失败，使用默认路径
		return "uploads/avatars"
	}

	// 检查是否在backend目录中
	if strings.HasSuffix(currentDir, "backend") {
		// 如果在backend目录，返回项目根目录下的uploads/avatars
		return "../uploads/avatars"
	}

	// 如果在项目根目录，直接使用相对路径
	return "uploads/avatars"
}

// GetFileUploadDir 获取文件上传目录的绝对路径
func GetFileUploadDir(fileType string) string {
	uploadDir := GetUploadDir()
	return filepath.Join(uploadDir, fileType)
}

// GetFileAbsolutePath 根据相对路径获取文件的绝对路径
func GetFileAbsolutePath(relativePath string) string {
	// 移除开头的 /uploads/
	cleanPath := strings.TrimPrefix(relativePath, "/uploads/")
	uploadDir := GetUploadDir()
	return filepath.Join(uploadDir, cleanPath)
}

// ValidateFileSize 验证文件大小是否超过限制
func ValidateFileSize(fileSize, storageLimit, usedSpace int64) bool {
	return usedSpace+fileSize <= storageLimit
}
