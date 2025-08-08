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

	// 2. 自动迁移表结构
	if err := autoMigrateTables(gormDB); err != nil {
		return nil, err
	}

	// 3. 插入初始数据
	if err := insertInitialDataGORM(gormDB); err != nil {
		return nil, err
	}

	// 4. 验证表结构
	if err := validateTablesGORM(gormDB); err != nil {
		return nil, err
	}

	log.Println("✓ GORM数据库初始化完成")
	return gormDB, nil
}

// autoMigrateTables 自动迁移表结构
func autoMigrateTables(db *gorm.DB) error {
	log.Println("执行GORM自动迁移...")

	// 自动迁移所有模型
	err := db.AutoMigrate(
		&models.User{},
		&models.File{},
		&models.Folder{},
		&models.Document{},
		&models.UpdateLog{},
		&models.UrlFile{},
	)

	if err != nil {
		return err
	}

	log.Println("✓ 表结构迁移完成")
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
