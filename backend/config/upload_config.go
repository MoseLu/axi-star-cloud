package config

import "os"

// UploadConfig 上传配置
type UploadConfig struct {
	// 速率限制 (字节/秒)
	MaxUploadRate int64

	// 并发限制
	MaxConcurrentUploads int64

	// 文件大小限制 (字节)
	MaxFileSize  int64
	MaxVideoSize int64

	// 环境配置
	Environment string
}

// GetUploadConfig 获取上传配置
func GetUploadConfig() *UploadConfig {
	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}

	config := &UploadConfig{
		Environment: env,
	}

	// 根据环境设置不同的限制
	switch env {
	case "production":
		config.MaxUploadRate = 5 * 1024 * 1024 // 5MB/s
		config.MaxConcurrentUploads = 10       // 10个并发上传
		config.MaxFileSize = 20 * 1024 * 1024  // 20MB
		config.MaxVideoSize = 50 * 1024 * 1024 // 50MB
	case "staging":
		config.MaxUploadRate = 10 * 1024 * 1024 // 10MB/s
		config.MaxConcurrentUploads = 20        // 20个并发上传
		config.MaxFileSize = 20 * 1024 * 1024   // 20MB
		config.MaxVideoSize = 50 * 1024 * 1024  // 50MB
	default: // development
		config.MaxUploadRate = 0                // 无限制
		config.MaxConcurrentUploads = 50        // 50个并发上传
		config.MaxFileSize = 20 * 1024 * 1024   // 20MB
		config.MaxVideoSize = 50 * 1024 * 1024  // 50MB
	}

	return config
}

// IsProduction 是否为生产环境
func (c *UploadConfig) IsProduction() bool {
	return c.Environment == "production"
}

// IsDevelopment 是否为开发环境
func (c *UploadConfig) IsDevelopment() bool {
	return c.Environment == "development"
}
