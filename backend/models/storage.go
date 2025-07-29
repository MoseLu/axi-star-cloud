package models

// StorageInfo 存储信息结构体
type StorageInfo struct {
	UsedSpace     int64  `json:"used_space"`
	TotalSpace    int64  `json:"total_space"`
	UsedSpaceStr  string `json:"used_space_str"`
	TotalSpaceStr string `json:"total_space_str"`
	UsagePercent  int    `json:"usage_percent"`
}

// StorageInfoResponse 存储信息响应结构体
type StorageInfoResponse struct {
	Success bool        `json:"success"`
	Storage StorageInfo `json:"storage"`
}

// UpdateStorageRequest 更新存储限制请求结构体
type UpdateStorageRequest struct {
	StorageLimit int64 `json:"storage_limit" binding:"required"`
}

// UpdateStorageResponse 更新存储限制响应结构体
type UpdateStorageResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
