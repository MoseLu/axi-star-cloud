package database

import (
	"database/sql"
	"fmt"
	"log"
)

// TableDefinition 表定义结构
type TableDefinition struct {
	Name    string
	SQL     string
	Indexes []string
}

// 所有表的定义
var tableDefinitions = []TableDefinition{
	{
		Name: "user",
		SQL: `
		CREATE TABLE IF NOT EXISTS user (
			uuid VARCHAR(36) PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			email VARCHAR(100),
			bio TEXT,
			avatar VARCHAR(255),
			storage_limit BIGINT DEFAULT 1073741824,
			last_login_time TIMESTAMP NULL,
			is_online BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)`,
		Indexes: []string{
			"CREATE INDEX IF NOT EXISTS idx_user_username ON user(username)",
			"CREATE INDEX IF NOT EXISTS idx_user_email ON user(email)",
		},
	},
	{
		Name: "files",
		SQL: `
		CREATE TABLE IF NOT EXISTS files (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			size BIGINT NOT NULL,
			type VARCHAR(50) NOT NULL,
			path VARCHAR(500) NOT NULL,
			user_id VARCHAR(50) NOT NULL,
			folder_id INT,
			thumbnail_data LONGTEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_user_id (user_id),
			INDEX idx_created_at (created_at)
		)`,
		Indexes: []string{
			"CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)",
			"CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)",
			"CREATE INDEX IF NOT EXISTS idx_files_type ON files(type)",
		},
	},
	{
		Name: "folders",
		SQL: `
		CREATE TABLE IF NOT EXISTS folders (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			user_id VARCHAR(50) NOT NULL,
			category VARCHAR(50) DEFAULT 'all',
			parent_id INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_user_id (user_id),
			INDEX idx_parent_id (parent_id),
			INDEX idx_category (category)
		)`,
		Indexes: []string{
			"CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id)",
			"CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id)",
			"CREATE INDEX IF NOT EXISTS idx_folders_category ON folders(category)",
		},
	},
	{
		Name: "documents",
		SQL: `
		CREATE TABLE IF NOT EXISTS documents (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			category VARCHAR(100) NOT NULL,
			` + "`order`" + ` INT DEFAULT 0,
			filename VARCHAR(255) NOT NULL,
			path VARCHAR(500) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_category (category),
			INDEX idx_order (` + "`order`" + `)
		)`,
		Indexes: []string{
			"CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)",
			"CREATE INDEX IF NOT EXISTS idx_documents_order ON documents(`order`)",
		},
	},
	{
		Name: "update_logs",
		SQL: `
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
		)`,
		Indexes: []string{
			"CREATE INDEX IF NOT EXISTS idx_update_logs_version ON update_logs(version)",
			"CREATE INDEX IF NOT EXISTS idx_update_logs_release_date ON update_logs(release_date)",
		},
	},
	{
		Name: "url_files",
		SQL: `
		CREATE TABLE IF NOT EXISTS url_files (
			id INTEGER AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			url TEXT NOT NULL,
			description TEXT,
			user_id VARCHAR(50) NOT NULL,
			folder_id INTEGER,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			FOREIGN KEY (user_id) REFERENCES user(uuid) ON DELETE CASCADE,
			FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
		)`,
		Indexes: []string{
			"CREATE INDEX IF NOT EXISTS idx_url_files_user_id ON url_files(user_id)",
			"CREATE INDEX IF NOT EXISTS idx_url_files_folder_id ON url_files(folder_id)",
			"CREATE INDEX IF NOT EXISTS idx_url_files_created_at ON url_files(created_at)",
		},
	},
}

// InitializeDatabase 初始化数据库
func InitializeDatabase(db *sql.DB) error {
	log.Println("🔧 开始初始化数据库...")

	// 1. 检查数据库连接
	if err := db.Ping(); err != nil {
		return fmt.Errorf("数据库连接失败: %v", err)
	}
	log.Println("✅ 数据库连接正常")

	// 2. 获取现有表
	existingTables, err := getExistingTables(db)
	if err != nil {
		return fmt.Errorf("获取现有表失败: %v", err)
	}
	log.Printf("📋 发现现有表: %v", existingTables)

	// 3. 检查所有必需的表
	requiredTables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}
	missingTables := []string{}

	for _, tableName := range requiredTables {
		if !existingTables[tableName] {
			missingTables = append(missingTables, tableName)
		}
	}

	if len(missingTables) > 0 {
		log.Printf("⚠️ 发现缺失的表: %v", missingTables)
		// 创建缺失的表
		if err := createMissingTables(db, existingTables); err != nil {
			return fmt.Errorf("创建缺失表失败: %v", err)
		}
		log.Println("✅ 缺失的表已创建")
		
		// 重新获取表列表以验证创建结果
		existingTables, err = getExistingTables(db)
		if err != nil {
			return fmt.Errorf("重新获取表列表失败: %v", err)
		}
		log.Printf("📋 重新获取现有表: %v", existingTables)
	} else {
		log.Println("✅ 所有必需的表都已存在")
	}

	// 4. 验证所有表都可以正常查询
	if err := validateAllTables(db); err != nil {
		return fmt.Errorf("表验证失败: %v", err)
	}

	// 5. 检查并添加必要的字段
	if err := checkAndAddFields(db); err != nil {
		return fmt.Errorf("字段检查失败: %v", err)
	}

	// 6. 插入初始数据（如果需要）
	if err := insertInitialDataIfNeeded(db); err != nil {
		return fmt.Errorf("初始数据插入失败: %v", err)
	}

	log.Println("✅ 数据库初始化完成")
	return nil
}

// getExistingTables 获取数据库中现有的表
func getExistingTables(db *sql.DB) (map[string]bool, error) {
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = DATABASE()
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tables := make(map[string]bool)
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			return nil, err
		}
		tables[tableName] = true
	}

	return tables, nil
}

// createMissingTables 创建缺失的表
func createMissingTables(db *sql.DB, existingTables map[string]bool) error {
	for _, tableDef := range tableDefinitions {
		if !existingTables[tableDef.Name] {
			log.Printf("🔧 创建表: %s", tableDef.Name)

			// 创建表
			if _, err := db.Exec(tableDef.SQL); err != nil {
				return fmt.Errorf("创建表 %s 失败: %v", tableDef.Name, err)
			}
			log.Printf("✅ 表 %s 创建成功", tableDef.Name)

			// 创建索引
			for _, indexSQL := range tableDef.Indexes {
				if _, err := db.Exec(indexSQL); err != nil {
					// 索引创建失败通常是已存在，记录但不中断
					log.Printf("⚠️ 创建索引失败 (可能已存在): %s", indexSQL)
				} else {
					log.Printf("✅ 索引创建成功: %s", indexSQL)
				}
			}
		}
	}

	return nil
}

// validateAllTables 验证所有必需的表都存在
func validateAllTables(db *sql.DB) error {
	requiredTables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}

	for _, tableName := range requiredTables {
		if !tableExists(db, tableName) {
			return fmt.Errorf("必需的表 %s 不存在", tableName)
		}
		log.Printf("✅ 表 %s 验证通过", tableName)
	}

	return nil
}

// tableExists 检查表是否存在
func tableExists(db *sql.DB, tableName string) bool {
	query := `
		SELECT COUNT(*) 
		FROM information_schema.tables 
		WHERE table_schema = DATABASE() 
		AND table_name = ?
	`

	var count int
	if err := db.QueryRow(query, tableName).Scan(&count); err != nil {
		return false
	}

	return count > 0
}

// GetTableInfo 获取表信息
func GetTableInfo(db *sql.DB) (map[string]interface{}, error) {
	info := make(map[string]interface{})

	for _, tableDef := range tableDefinitions {
		tableInfo := map[string]interface{}{
			"exists": tableExists(db, tableDef.Name),
		}

		if tableInfo["exists"].(bool) {
			// 获取表的行数
			var count int
			query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableDef.Name)
			if err := db.QueryRow(query).Scan(&count); err == nil {
				tableInfo["row_count"] = count
			}
		}

		info[tableDef.Name] = tableInfo
	}

	return info, nil
}

// insertInitialDataIfNeeded 只在user表为空时插入初始数据
func insertInitialDataIfNeeded(db *sql.DB) error {
	// 检查user表是否有数据
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM user").Scan(&count)
	if err != nil {
		return fmt.Errorf("检查user表数据失败: %v", err)
	}

	if count == 0 {
		log.Println("🔧 user表为空，插入初始数据...")
		if err := InsertInitialData(db); err != nil {
			return fmt.Errorf("插入初始数据失败: %v", err)
		}
		log.Println("✅ 初始数据插入完成")
		return nil
	} else {
		log.Printf("✅ user表已有 %d 条数据，跳过初始数据插入", count)
		return nil
	}
}

// checkAndAddFields 检查并添加必要的字段
func checkAndAddFields(db *sql.DB) error {
	log.Println("检查并添加必要的字段...")

	// 检查user表的thumbnail_data字段
	if !columnExists(db, "user", "thumbnail_data") {
		log.Println("添加thumbnail_data字段到user表...")
		_, err := db.Exec("ALTER TABLE user ADD COLUMN thumbnail_data LONGTEXT")
		if err != nil {
			log.Printf("添加thumbnail_data字段失败: %v", err)
		} else {
			log.Println("✓ thumbnail_data字段已添加")
		}
	} else {
		log.Println("thumbnail_data字段已存在且类型正确")
	}

	// 检查user表的last_login_time字段
	if !columnExists(db, "user", "last_login_time") {
		log.Println("添加last_login_time字段到user表...")
		_, err := db.Exec("ALTER TABLE user ADD COLUMN last_login_time TIMESTAMP NULL")
		if err != nil {
			log.Printf("添加last_login_time字段失败: %v", err)
		} else {
			log.Println("✓ last_login_time字段已添加")
		}
	} else {
		log.Println("last_login_time字段已存在")
	}

	// 检查user表的is_online字段
	if !columnExists(db, "user", "is_online") {
		log.Println("添加is_online字段到user表...")
		_, err := db.Exec("ALTER TABLE user ADD COLUMN is_online BOOLEAN DEFAULT FALSE")
		if err != nil {
			log.Printf("添加is_online字段失败: %v", err)
		} else {
			log.Println("✓ is_online字段已添加")
		}
	} else {
		log.Println("is_online字段已存在")
	}

	return nil
}


