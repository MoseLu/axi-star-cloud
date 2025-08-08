package utils

import (
	"database/sql"
	"fmt"
	"log"

	"backend/config"
	"backend/database"
)

// ResetDatabase 完全重置数据库
func ResetDatabase() error {
	log.Println("开始重置数据库...")

	// 1. 连接数据库
	db, err := config.InitDB(nil)
	if err != nil {
		return fmt.Errorf("连接数据库失败: %v", err)
	}
	defer db.Close()

	// 2. 删除所有表
	if err := dropAllTables(db); err != nil {
		return fmt.Errorf("删除表失败: %v", err)
	}

	// 3. 重新初始化数据库
	if err := database.InitializeDatabase(db); err != nil {
		return fmt.Errorf("重新初始化数据库失败: %v", err)
	}

	log.Println("✓ 数据库重置完成")
	return nil
}

// dropAllTables 删除所有表
func dropAllTables(db *sql.DB) error {
	// 获取所有表名
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = DATABASE()
	`
	
	rows, err := db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			return err
		}
		tables = append(tables, tableName)
	}

	// 禁用外键检查
	_, err = db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	if err != nil {
		return fmt.Errorf("禁用外键检查失败: %v", err)
	}

	// 删除所有表
	for _, tableName := range tables {
		log.Printf("删除表: %s", tableName)
		_, err := db.Exec(fmt.Sprintf("DROP TABLE IF EXISTS `%s`", tableName))
		if err != nil {
			return fmt.Errorf("删除表 %s 失败: %v", tableName, err)
		}
	}

	// 重新启用外键检查
	_, err = db.Exec("SET FOREIGN_KEY_CHECKS = 1")
	if err != nil {
		return fmt.Errorf("启用外键检查失败: %v", err)
	}

	log.Printf("✓ 已删除 %d 个表", len(tables))
	return nil
}

// ResetUpdateLogsTable 重置更新日志表（保持向后兼容）
func ResetUpdateLogsTable() error {
	log.Println("重置更新日志表...")

	db, err := config.InitDB(nil)
	if err != nil {
		return fmt.Errorf("连接数据库失败: %v", err)
	}
	defer db.Close()

	// 删除更新日志表
	_, err = db.Exec("DROP TABLE IF EXISTS update_logs")
	if err != nil {
		return fmt.Errorf("删除update_logs表失败: %v", err)
	}

	// 重新创建更新日志表
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS update_logs (
		id INT AUTO_INCREMENT PRIMARY KEY,
		version VARCHAR(20) NOT NULL,
		title VARCHAR(255) NOT NULL,
		description TEXT,
		release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		features JSON,
		known_issues JSON,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_version (version),
		INDEX idx_release_date (release_date)
	)`

	_, err = db.Exec(createTableQuery)
	if err != nil {
		return fmt.Errorf("重新创建update_logs表失败: %v", err)
	}

	log.Println("✓ 更新日志表重置完成")
	return nil
}
