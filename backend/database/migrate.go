package database

import (
	"database/sql"
	"fmt"
)

// MigrateDatabase 执行数据库迁移
func MigrateDatabase(db *sql.DB) error {
	// 检查并删除不需要的字段
	if err := removeUnusedColumns(db); err != nil {
		return fmt.Errorf("删除不需要的字段失败: %v", err)
	}

	// 检查并添加thumbnail_data字段
	if err := addThumbnailDataColumn(db); err != nil {
		return fmt.Errorf("添加thumbnail_data字段失败: %v", err)
	}

	// 检查并添加last_login_time字段
	if err := addLastLoginTimeColumn(db); err != nil {
		return fmt.Errorf("添加last_login_time字段失败: %v", err)
	}

	// 检查并添加is_online字段
	if err := addIsOnlineColumn(db); err != nil {
		return fmt.Errorf("添加is_online字段失败: %v", err)
	}

	return nil
}

// removeUnusedColumns 删除不需要的字段
func removeUnusedColumns(db *sql.DB) error {
	// 检查并删除title字段
	if columnExists(db, "files", "title") {
		_, err := db.Exec("ALTER TABLE files DROP COLUMN title")
		if err != nil {
			return fmt.Errorf("删除title字段失败: %v", err)
		}
		fmt.Println("已删除title字段")
	}

	// 检查并删除url字段
	if columnExists(db, "files", "url") {
		_, err := db.Exec("ALTER TABLE files DROP COLUMN url")
		if err != nil {
			return fmt.Errorf("删除url字段失败: %v", err)
		}
		fmt.Println("已删除url字段")
	}

	// 检查并删除description字段
	if columnExists(db, "files", "description") {
		_, err := db.Exec("ALTER TABLE files DROP COLUMN description")
		if err != nil {
			return fmt.Errorf("删除description字段失败: %v", err)
		}
		fmt.Println("已删除description字段")
	}

	return nil
}

// addThumbnailDataColumn 添加thumbnail_data字段
func addThumbnailDataColumn(db *sql.DB) error {
	if !columnExists(db, "files", "thumbnail_data") {
		_, err := db.Exec("ALTER TABLE files ADD COLUMN thumbnail_data LONGTEXT")
		if err != nil {
			return fmt.Errorf("添加thumbnail_data字段失败: %v", err)
		}
		fmt.Println("已添加thumbnail_data字段")
	} else {
		// 检查字段类型，如果不是LONGTEXT类型，则修改
		query := `
			SELECT DATA_TYPE 
			FROM information_schema.columns 
			WHERE table_schema = DATABASE() 
			AND table_name = 'files' 
			AND column_name = 'thumbnail_data'
		`
		var dataType string
		err := db.QueryRow(query).Scan(&dataType)
		if err != nil {
			return fmt.Errorf("查询字段类型失败: %v", err)
		}

		if dataType != "longtext" {
			_, err = db.Exec("ALTER TABLE files MODIFY COLUMN thumbnail_data LONGTEXT")
			if err != nil {
				return fmt.Errorf("修改thumbnail_data字段类型失败: %v", err)
			}
			fmt.Println("已修改thumbnail_data字段类型为LONGTEXT")
		} else {
			fmt.Println("thumbnail_data字段已存在且类型正确")
		}
	}

	return nil
}

// columnExists 检查字段是否存在
func columnExists(db *sql.DB, tableName, columnName string) bool {
	query := `
		SELECT COUNT(*) 
		FROM information_schema.columns 
		WHERE table_schema = DATABASE() 
		AND table_name = ? 
		AND column_name = ?
	`

	var count int
	err := db.QueryRow(query, tableName, columnName).Scan(&count)
	if err != nil {
		return false
	}

	return count > 0
}

// addLastLoginTimeColumn 添加last_login_time字段
func addLastLoginTimeColumn(db *sql.DB) error {
	if !columnExists(db, "user", "last_login_time") {
		_, err := db.Exec("ALTER TABLE user ADD COLUMN last_login_time TIMESTAMP NULL")
		if err != nil {
			return fmt.Errorf("添加last_login_time字段失败: %v", err)
		}
		fmt.Println("已添加last_login_time字段")
	} else {
		fmt.Println("last_login_time字段已存在")
	}

	return nil
}

// addIsOnlineColumn 添加is_online字段
func addIsOnlineColumn(db *sql.DB) error {
	if !columnExists(db, "user", "is_online") {
		_, err := db.Exec("ALTER TABLE user ADD COLUMN is_online BOOLEAN DEFAULT FALSE")
		if err != nil {
			return fmt.Errorf("添加is_online字段失败: %v", err)
		}
		fmt.Println("已添加is_online字段")
	} else {
		fmt.Println("is_online字段已存在")
	}

	return nil
}
