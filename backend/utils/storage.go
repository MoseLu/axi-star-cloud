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
	case ".pdf", ".doc", ".docx", ".txt", ".md", ".rtf":
		return "document"
	case ".zip", ".rar", ".7z", ".tar", ".gz":
		return "archive"
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
		return "../front/uploads"
	}

	// 检查是否在backend目录中
	if strings.HasSuffix(currentDir, "backend") {
		return filepath.Join(currentDir, "../front/uploads")
	}

	// 如果在项目根目录，直接使用相对路径
	return "front/uploads"
}

// GetAvatarUploadDir 获取头像上传目录的绝对路径
func GetAvatarUploadDir() string {
	uploadDir := GetUploadDir()
	return filepath.Join(uploadDir, "avatars")
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
