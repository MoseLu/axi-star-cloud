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

 