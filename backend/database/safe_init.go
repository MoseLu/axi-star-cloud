package database

import (
	"database/sql"
	"fmt"
	"log"

	"backend/config"

	"gorm.io/gorm"
)

// SafeDatabaseInitializer 安全的数据库初始化器
type SafeDatabaseInitializer struct {
	db     *sql.DB
	gormDB *gorm.DB
}

// NewSafeDatabaseInitializer 创建新的安全数据库初始化器
func NewSafeDatabaseInitializer() *SafeDatabaseInitializer {
	return &SafeDatabaseInitializer{}
}

// Initialize 安全初始化数据库
func (s *SafeDatabaseInitializer) Initialize() error {
	log.Println("🔒 开始安全数据库初始化...")

	// 1. 连接数据库
	if err := s.ConnectDatabase(); err != nil {
		return fmt.Errorf("数据库连接失败: %v", err)
	}

	// 2. 严格的只读检测 - 检查数据库是否正常
	if err := s.PerformReadOnlyCheck(); err != nil {
		log.Printf("⚠️ 数据库检测到异常: %v", err)
		log.Println("🔧 开始执行增量更新...")

		// 只有在检测到异常时才执行增量更新
		if err := s.PerformIncrementalUpdate(); err != nil {
			return fmt.Errorf("增量更新失败: %v", err)
		}
	} else {
		log.Println("✅ 数据库状态正常，无需进行任何修改")
	}

	// 3. 最终验证数据库完整性
	if err := s.validateDatabaseIntegrity(); err != nil {
		return fmt.Errorf("数据库完整性验证失败: %v", err)
	}

	log.Println("✅ 安全数据库初始化完成")
	return nil
}

// ConnectDatabase 连接数据库
func (s *SafeDatabaseInitializer) ConnectDatabase() error {
	log.Println("🔧 连接数据库...")

	// 连接原生数据库
	db, err := config.InitDB(nil)
	if err != nil {
		return fmt.Errorf("原生数据库连接失败: %v", err)
	}
	s.db = db

	// 连接GORM数据库
	gormDB, err := config.InitGORM(nil)
	if err != nil {
		return fmt.Errorf("GORM数据库连接失败: %v", err)
	}
	s.gormDB = gormDB

	log.Println("✅ 数据库连接成功")
	return nil
}

// safeCreateTables 安全创建表（只创建不存在的表）
func (s *SafeDatabaseInitializer) safeCreateTables() error {
	log.Println("🔧 安全创建表...")

	// 获取现有表
	existingTables, err := s.getExistingTables()
	if err != nil {
		return fmt.Errorf("获取现有表失败: %v", err)
	}

	// 定义必需的表
	requiredTables := map[string]string{
		"user": `
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
		"files": `
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
		"folders": `
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
		"documents": `
			CREATE TABLE IF NOT EXISTS documents (
				id INT AUTO_INCREMENT PRIMARY KEY,
				title VARCHAR(255) NOT NULL,
				category VARCHAR(100) NOT NULL,
				doc_order INT DEFAULT 0,
				filename VARCHAR(255) NOT NULL,
				path VARCHAR(500) NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				INDEX idx_category (category),
				INDEX idx_order (doc_order)
			)`,
		"update_logs": `
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
		"url_files": `
			CREATE TABLE IF NOT EXISTS url_files (
				id INT AUTO_INCREMENT PRIMARY KEY,
				title VARCHAR(255) NOT NULL,
				url VARCHAR(500) NOT NULL,
				description TEXT,
				user_id VARCHAR(50) NOT NULL,
				folder_id INT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				INDEX idx_user_id (user_id),
				INDEX idx_folder_id (folder_id)
			)`,
	}

	// 只创建不存在的表
	for tableName, createSQL := range requiredTables {
		if !existingTables[tableName] {
			log.Printf("🔧 创建表: %s", tableName)
			if _, err := s.db.Exec(createSQL); err != nil {
				return fmt.Errorf("创建表 %s 失败: %v", tableName, err)
			}
			log.Printf("✅ 表 %s 创建成功", tableName)
		} else {
			log.Printf("✅ 表 %s 已存在", tableName)
		}
	}

	return nil
}

// safeFieldMigration 安全字段迁移（只添加字段，不删除）
func (s *SafeDatabaseInitializer) safeFieldMigration() error {
	log.Println("🔧 安全字段迁移...")

	// 定义需要添加的字段
	fieldMigrations := []struct {
		tableName  string
		columnName string
		sql        string
	}{
		{
			tableName:  "user",
			columnName: "last_login_time",
			sql:        "ALTER TABLE user ADD COLUMN IF NOT EXISTS last_login_time TIMESTAMP NULL",
		},
		{
			tableName:  "user",
			columnName: "is_online",
			sql:        "ALTER TABLE user ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE",
		},
		{
			tableName:  "files",
			columnName: "thumbnail_data",
			sql:        "ALTER TABLE files ADD COLUMN IF NOT EXISTS thumbnail_data LONGTEXT",
		},
	}

	// 安全添加字段
	for _, migration := range fieldMigrations {
		if !s.columnExists(migration.tableName, migration.columnName) {
			log.Printf("🔧 添加字段: %s.%s", migration.tableName, migration.columnName)
			if _, err := s.db.Exec(migration.sql); err != nil {
				// 记录错误但不中断，因为字段可能已经存在
				log.Printf("⚠️ 添加字段 %s.%s 失败（可能已存在）: %v", migration.tableName, migration.columnName, err)
			} else {
				log.Printf("✅ 字段 %s.%s 添加成功", migration.tableName, migration.columnName)
			}
		} else {
			log.Printf("✅ 字段 %s.%s 已存在", migration.tableName, migration.columnName)
		}
	}

	return nil
}

// safeInsertInitialData 安全插入初始数据
func (s *SafeDatabaseInitializer) safeInsertInitialData() error {
	log.Println("🔧 安全插入初始数据...")

	// 检查user表是否有数据
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM user").Scan(&count)
	if err != nil {
		return fmt.Errorf("检查user表数据失败: %v", err)
	}

	if count == 0 {
		log.Println("🔧 user表为空，插入管理员用户...")

		// 使用INSERT IGNORE避免重复插入
		insertSQL := `
			INSERT IGNORE INTO user (uuid, username, password, email, bio, storage_limit, created_at, updated_at) 
			VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Mose', '123456', 'admin@example.com', '系统管理员', 5368709120, NOW(), NOW())
		`

		if _, err := s.db.Exec(insertSQL); err != nil {
			return fmt.Errorf("插入管理员用户失败: %v", err)
		}

		log.Println("✅ 管理员用户创建成功")
	} else {
		log.Printf("✅ user表已有 %d 条数据，跳过初始数据插入", count)
	}

	return nil
}

// validateDatabaseIntegrity 验证数据库完整性
func (s *SafeDatabaseInitializer) validateDatabaseIntegrity() error {
	log.Println("🔧 验证数据库完整性...")

	// 验证所有必需的表都存在
	requiredTables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}
	existingTables, err := s.getExistingTables()
	if err != nil {
		return fmt.Errorf("获取现有表失败: %v", err)
	}

	for _, tableName := range requiredTables {
		if !existingTables[tableName] {
			return fmt.Errorf("必需的表 %s 不存在", tableName)
		}
		log.Printf("✅ 表 %s 验证通过", tableName)
	}

	// 验证关键字段存在
	requiredFields := []struct {
		tableName  string
		columnName string
	}{
		{"user", "uuid"},
		{"user", "username"},
		{"user", "password"},
		{"files", "id"},
		{"files", "name"},
		{"files", "user_id"},
	}

	for _, field := range requiredFields {
		if !s.columnExists(field.tableName, field.columnName) {
			return fmt.Errorf("必需的字段 %s.%s 不存在", field.tableName, field.columnName)
		}
		log.Printf("✅ 字段 %s.%s 验证通过", field.tableName, field.columnName)
	}

	log.Println("✅ 数据库完整性验证通过")
	return nil
}

// PerformReadOnlyCheck 执行严格的只读检测
func (s *SafeDatabaseInitializer) PerformReadOnlyCheck() error {
	log.Println("🔍 执行严格的只读检测...")

	// 1. 检测数据库连接是否正常
	if err := s.db.Ping(); err != nil {
		return fmt.Errorf("数据库连接异常: %v", err)
	}

	// 2. 检测必需的表是否存在
	requiredTables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}
	existingTables, err := s.getExistingTables()
	if err != nil {
		return fmt.Errorf("无法获取表信息: %v", err)
	}

	missingTables := []string{}
	for _, tableName := range requiredTables {
		if !existingTables[tableName] {
			missingTables = append(missingTables, tableName)
		}
	}

	if len(missingTables) > 0 {
		return fmt.Errorf("检测到缺失的表: %v", missingTables)
	}

	// 3. 检测必需的关键字段是否存在
	requiredFields := []struct {
		tableName   string
		columnName  string
		description string
	}{
		{"user", "uuid", "用户UUID字段"},
		{"user", "username", "用户名字段"},
		{"user", "password", "密码字段"},
		{"files", "id", "文件ID字段"},
		{"files", "name", "文件名字段"},
		{"files", "user_id", "文件用户ID字段"},
		{"folders", "id", "文件夹ID字段"},
		{"folders", "name", "文件夹名字段"},
		{"folders", "user_id", "文件夹用户ID字段"},
	}

	missingFields := []string{}
	for _, field := range requiredFields {
		if !s.columnExists(field.tableName, field.columnName) {
			missingFields = append(missingFields, fmt.Sprintf("%s.%s (%s)", field.tableName, field.columnName, field.description))
		}
	}

	if len(missingFields) > 0 {
		return fmt.Errorf("检测到缺失的字段: %v", missingFields)
	}

	// 4. 检测表是否可以正常查询（只读测试）
	for _, tableName := range requiredTables {
		var count int
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s LIMIT 1", tableName)
		if err := s.db.QueryRow(query).Scan(&count); err != nil {
			return fmt.Errorf("表 %s 无法正常查询: %v", tableName, err)
		}
		log.Printf("✅ 表 %s 查询正常", tableName)
	}

	// 5. 检测是否有管理员用户（如果user表为空，需要初始化）
	var userCount int
	if err := s.db.QueryRow("SELECT COUNT(*) FROM user").Scan(&userCount); err != nil {
		return fmt.Errorf("无法检查用户表数据: %v", err)
	}

	if userCount == 0 {
		return fmt.Errorf("用户表为空，需要初始化管理员用户")
	}

	log.Println("✅ 所有只读检测通过，数据库状态正常")
	return nil
}

// PerformIncrementalUpdate 执行增量更新（仅在检测到异常时调用）
func (s *SafeDatabaseInitializer) PerformIncrementalUpdate() error {
	log.Println("🔧 开始执行增量更新...")

	// 1. 安全检查和创建表
	if err := s.safeCreateTables(); err != nil {
		return fmt.Errorf("安全创建表失败: %v", err)
	}

	// 2. 安全字段迁移（只添加，不删除）
	if err := s.safeFieldMigration(); err != nil {
		return fmt.Errorf("安全字段迁移失败: %v", err)
	}

	// 3. 安全插入初始数据
	if err := s.safeInsertInitialData(); err != nil {
		return fmt.Errorf("安全插入初始数据失败: %v", err)
	}

	log.Println("✅ 增量更新完成")
	return nil
}

// getExistingTables 获取现有表
func (s *SafeDatabaseInitializer) getExistingTables() (map[string]bool, error) {
	query := `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = DATABASE()
	`

	rows, err := s.db.Query(query)
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

// columnExists 检查字段是否存在
func (s *SafeDatabaseInitializer) columnExists(tableName, columnName string) bool {
	query := `
		SELECT COUNT(*) 
		FROM information_schema.columns 
		WHERE table_schema = DATABASE() 
		AND table_name = ? 
		AND column_name = ?
	`

	var count int
	err := s.db.QueryRow(query, tableName, columnName).Scan(&count)
	if err != nil {
		return false
	}

	return count > 0
}

// GetDatabaseInfo 获取数据库信息
func (s *SafeDatabaseInitializer) GetDatabaseInfo() (map[string]interface{}, error) {
	info := make(map[string]interface{})

	// 获取表信息
	existingTables, err := s.getExistingTables()
	if err != nil {
		return nil, err
	}

	tableInfo := make(map[string]interface{})
	for tableName := range existingTables {
		var count int
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)
		if err := s.db.QueryRow(query).Scan(&count); err == nil {
			tableInfo[tableName] = map[string]interface{}{
				"exists":    true,
				"row_count": count,
			}
		}
	}

	info["tables"] = tableInfo
	info["total_tables"] = len(existingTables)

	return info, nil
}

// GetDB 获取原生数据库连接
func (s *SafeDatabaseInitializer) GetDB() *sql.DB {
	return s.db
}

// GetGormDB 获取GORM数据库连接
func (s *SafeDatabaseInitializer) GetGormDB() *gorm.DB {
	return s.gormDB
}

// Close 关闭数据库连接
func (s *SafeDatabaseInitializer) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}
