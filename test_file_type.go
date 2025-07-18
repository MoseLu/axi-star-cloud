package main

import (
	"fmt"
	"path/filepath"
	"strings"
)

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
	case ".xls", ".xlsx":
		return "spreadsheet"
	case ".ppt", ".pptx":
		return "presentation"
	case ".zip", ".rar", ".7z", ".tar", ".gz":
		return "other"
	default:
		return "other"
	}
}

func main() {
	testFiles := []string{
		"test.xlsx",
		"document.xls",
		"presentation.pptx",
		"slide.ppt",
		"document.pdf",
		"image.jpg",
		"video.mp4",
		"audio.mp3",
		"archive.zip",
		"unknown.xyz",
	}

	fmt.Println("文件类型识别测试:")
	fmt.Println("==================")

	for _, filename := range testFiles {
		fileType := GetFileType(filename)
		fmt.Printf("%-15s -> %s\n", filename, fileType)
	}
}
