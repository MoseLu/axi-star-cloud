package models

import (
	"database/sql"
	"encoding/json"
	"time"
)

// UpdateLog 更新日志模型
type UpdateLog struct {
	ID          int       `json:"id"`
	Version     string    `json:"version"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	ReleaseDate time.Time `json:"release_date"`
	Features    []string  `json:"features"`
	KnownIssues []string  `json:"known_issues"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// GetUpdateLogs 获取所有更新日志
func GetUpdateLogs(db *sql.DB) ([]UpdateLog, error) {
	query := `
		SELECT id, version, title, description, release_date, features, known_issues, created_at, updated_at
		FROM update_logs
		ORDER BY release_date DESC
	`
	
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []UpdateLog
	for rows.Next() {
		var log UpdateLog
		var featuresJSON, issuesJSON []byte
		
		err := rows.Scan(
			&log.ID,
			&log.Version,
			&log.Title,
			&log.Description,
			&log.ReleaseDate,
			&featuresJSON,
			&issuesJSON,
			&log.CreatedAt,
			&log.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// 解析JSON字段
		if len(featuresJSON) > 0 {
			json.Unmarshal(featuresJSON, &log.Features)
		}
		if len(issuesJSON) > 0 {
			json.Unmarshal(issuesJSON, &log.KnownIssues)
		}

		logs = append(logs, log)
	}

	return logs, nil
}

// InsertUpdateLog 插入更新日志
func InsertUpdateLog(db *sql.DB, log *UpdateLog) error {
	featuresJSON, _ := json.Marshal(log.Features)
	issuesJSON, _ := json.Marshal(log.KnownIssues)

	query := `
		INSERT INTO update_logs (version, title, description, release_date, features, known_issues)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	
	_, err := db.Exec(query, log.Version, log.Title, log.Description, log.ReleaseDate, featuresJSON, issuesJSON)
	return err
}

// InsertInitialUpdateLogs 插入初始更新日志数据
func InsertInitialUpdateLogs(db *sql.DB) error {
	logs := []UpdateLog{
		{
			Version:     "v1.1.0",
			Title:       "文件夹操作增强版",
			Description: "新增文件拖拽功能、面包屑导航、文档子分类等增强功能",
			ReleaseDate: time.Now(),
			Features: []string{
				"文件拖拽到文件夹",
				"文件从文件夹移出",
				"面包屑导航",
				"文档分类子类型",
				"文件夹文件数量实时更新",
				"拖拽操作成功提示",
				"文件夹图标状态指示",
			},
			KnownIssues: []string{
				"拖拽操作在某些老旧浏览器中可能不支持",
			},
		},
		{
			Version:     "v1.0.0",
			Title:       "基础版本",
			Description: "系统基础功能发布",
			ReleaseDate: time.Now().AddDate(0, 0, -7), // 7天前
			Features: []string{
				"支持多种文件格式上传",
				"实时文件预览",
				"智能文件分类",
				"文件夹管理",
				"存储空间监控",
				"用户权限管理",
				"响应式界面设计",
				"拖拽上传功能",
			},
			KnownIssues: []string{
				"某些特殊字符的文件名可能显示异常",
				"超大文件上传可能需要较长时间",
				"移动端某些功能可能受限",
			},
		},
	}

	for _, log := range logs {
		if err := InsertUpdateLog(db, &log); err != nil {
			return err
		}
	}

	return nil
} 