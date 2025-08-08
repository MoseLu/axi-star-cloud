package models

import (
	"database/sql"
	"encoding/json"
	"time"
)

// UpdateLog 更新日志模型
type UpdateLog struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Version     string    `gorm:"type:varchar(20);not null;index" json:"version"`
	Title       string    `gorm:"type:varchar(255);not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	ReleaseDate time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP;index" json:"release_date"`
	Features    string    `gorm:"type:json" json:"features"`
	KnownIssues string    `gorm:"type:json" json:"known_issues"`
	CreatedAt   time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName 指定表名
func (UpdateLog) TableName() string {
	return "update_logs"
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

 