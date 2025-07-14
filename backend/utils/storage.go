package utils

import (
	"fmt"
	"math"
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

// ValidateFileSize 验证文件大小是否超过限制
func ValidateFileSize(fileSize, storageLimit, usedSpace int64) bool {
	return usedSpace+fileSize <= storageLimit
}
