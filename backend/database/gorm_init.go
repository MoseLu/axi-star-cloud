package database

import (
	"fmt"
	"log"

	"backend/config"
	"backend/models"

	"gorm.io/gorm"
)

// InitializeGORM 使用GORM初始化数据库
func InitializeGORM() (*gorm.DB, error) {
	log.Println("开始使用GORM初始化数据库...")

	// 1. 连接GORM
	gormDB, err := config.InitGORM(nil)
	if err != nil {
		return nil, err
	}
	log.Println("✓ GORM连接正常")

	// 2. 严格的只读检测
	if err := performGORMReadOnlyCheck(gormDB); err != nil {
		log.Printf("⚠️ GORM检测到异常: %v", err)
		log.Println("🔧 开始执行GORM增量更新...")

		// 只有在检测到异常时才执行增量更新
		if err := performGORMIncrementalUpdate(gormDB); err != nil {
			return nil, err
		}
	} else {
		log.Println("✅ GORM数据库状态正常，无需进行任何修改")
	}

	// 3. 最终验证表结构
	if err := validateTablesGORM(gormDB); err != nil {
		return nil, err
	}

	log.Println("✓ GORM数据库初始化完成")
	return gormDB, nil
}

// performGORMReadOnlyCheck 执行GORM严格的只读检测
func performGORMReadOnlyCheck(db *gorm.DB) error {
	log.Println("🔍 执行GORM严格的只读检测...")

	// 1. 检测必需的表是否存在
	tables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}

	missingTables := []string{}
	for _, tableName := range tables {
		if !db.Migrator().HasTable(tableName) {
			missingTables = append(missingTables, tableName)
		}
	}

	if len(missingTables) > 0 {
		return fmt.Errorf("检测到缺失的表: %v", missingTables)
	}

	// 2. 检测表是否可以正常查询（只读测试）
	for _, tableName := range tables {
		var count int64
		if err := db.Table(tableName).Count(&count).Error; err != nil {
			return fmt.Errorf("表 %s 无法正常查询: %v", tableName, err)
		}
		log.Printf("✅ GORM表 %s 查询正常", tableName)
	}

	// 3. 检测是否有管理员用户
	var userCount int64
	if err := db.Model(&models.User{}).Count(&userCount).Error; err != nil {
		return fmt.Errorf("无法检查用户表数据: %v", err)
	}

	if userCount == 0 {
		return fmt.Errorf("用户表为空，需要初始化管理员用户")
	}

	log.Println("✅ 所有GORM只读检测通过，数据库状态正常")
	return nil
}

// performGORMIncrementalUpdate 执行GORM增量更新（仅在检测到异常时调用）
func performGORMIncrementalUpdate(db *gorm.DB) error {
	log.Println("🔧 开始执行GORM增量更新...")

	// 1. 自动迁移表结构
	if err := autoMigrateTables(db); err != nil {
		return err
	}

	// 2. 插入初始数据
	if err := insertInitialDataGORM(db); err != nil {
		return err
	}

	log.Println("✅ GORM增量更新完成")
	return nil
}

// autoMigrateTables 自动迁移表结构（安全版本）
func autoMigrateTables(db *gorm.DB) error {
	log.Println("执行GORM安全自动迁移...")

	// 检查表是否存在，只对不存在的表进行迁移
	tables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}

	for _, tableName := range tables {
		if !db.Migrator().HasTable(tableName) {
			log.Printf("🔧 迁移表: %s", tableName)

			// 只对不存在的表进行迁移
			switch tableName {
			case "user":
				if err := db.AutoMigrate(&models.User{}); err != nil {
					log.Printf("⚠️ 迁移user表失败: %v", err)
				}
			case "files":
				if err := db.AutoMigrate(&models.File{}); err != nil {
					log.Printf("⚠️ 迁移files表失败: %v", err)
				}
			case "folders":
				if err := db.AutoMigrate(&models.Folder{}); err != nil {
					log.Printf("⚠️ 迁移folders表失败: %v", err)
				}
			case "documents":
				if err := db.AutoMigrate(&models.Document{}); err != nil {
					log.Printf("⚠️ 迁移documents表失败: %v", err)
				}
			case "update_logs":
				if err := db.AutoMigrate(&models.UpdateLog{}); err != nil {
					log.Printf("⚠️ 迁移update_logs表失败: %v", err)
				}
			case "url_files":
				if err := db.AutoMigrate(&models.UrlFile{}); err != nil {
					log.Printf("⚠️ 迁移url_files表失败: %v", err)
				}
			}
		} else {
			log.Printf("✅ 表 %s 已存在，跳过迁移", tableName)
		}
	}

	log.Println("✓ 安全表结构迁移完成")
	return nil
}

// insertInitialDataGORM 使用GORM插入初始数据
func insertInitialDataGORM(db *gorm.DB) error {
	log.Println("检查并插入初始数据...")

	// 检查是否已有用户数据
	var count int64
	db.Model(&models.User{}).Count(&count)

	if count == 0 {
		log.Println("插入管理员用户...")

		adminUser := &models.User{
			UUID:         "550e8400-e29b-41d4-a716-446655440000",
			Username:     "Mose",
			Password:     "123456",
			Email:        "admin@example.com",
			Bio:          "系统管理员",
			StorageLimit: 5368709120, // 5GB
		}

		if err := db.Create(adminUser).Error; err != nil {
			return err
		}

		log.Println("✓ 管理员用户创建成功")
	} else {
		log.Printf("✓ 用户表已有 %d 条数据，跳过初始数据插入", count)
	}

	return nil
}

// validateTablesGORM 验证GORM表结构
func validateTablesGORM(db *gorm.DB) error {
	log.Println("验证表结构...")

	tables := []string{"user", "files", "folders", "documents", "update_logs", "url_files"}

	for _, tableName := range tables {
		if !db.Migrator().HasTable(tableName) {
			return fmt.Errorf("表 %s 不存在", tableName)
		}
		log.Printf("✓ 表 %s 验证通过", tableName)
	}

	return nil
}

// GetTableInfoGORM 使用GORM获取表信息
func GetTableInfoGORM(db *gorm.DB) (map[string]interface{}, error) {
	info := make(map[string]interface{})

	// 检查各个表
	tables := []struct {
		name  string
		model interface{}
	}{
		{"user", &models.User{}},
		{"files", &models.File{}},
		{"folders", &models.Folder{}},
		{"documents", &models.Document{}},
		{"update_logs", &models.UpdateLog{}},
		{"url_files", &models.UrlFile{}},
	}

	for _, table := range tables {
		var count int64
		db.Model(table.model).Count(&count)

		tableInfo := map[string]interface{}{
			"exists":    true,
			"row_count": count,
		}

		info[table.name] = tableInfo
	}

	return info, nil
}
