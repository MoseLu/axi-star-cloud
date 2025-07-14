package database

import (
	"database/sql"
	"log"
)

// MigrateDatabase 执行数据库迁移
func MigrateDatabase(db *sql.DB) error {
	log.Println("开始执行数据库迁移...")

	// 检查email字段是否存在
	var emailExists bool
	err := db.QueryRow("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME = 'user' AND COLUMN_NAME = 'email'").Scan(&emailExists)
	if err != nil {
		log.Printf("检查email字段失败: %v", err)
	}

	if !emailExists {
		log.Println("添加email字段...")
		_, err = db.Exec("ALTER TABLE user ADD COLUMN email VARCHAR(100)")
		if err != nil {
			log.Printf("添加email字段失败: %v", err)
			return err
		}
		log.Println("email字段添加成功")
	}

	// 检查bio字段是否存在
	var bioExists bool
	err = db.QueryRow("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME = 'user' AND COLUMN_NAME = 'bio'").Scan(&bioExists)
	if err != nil {
		log.Printf("检查bio字段失败: %v", err)
	}

	if !bioExists {
		log.Println("添加bio字段...")
		_, err = db.Exec("ALTER TABLE user ADD COLUMN bio TEXT")
		if err != nil {
			log.Printf("添加bio字段失败: %v", err)
			return err
		}
		log.Println("bio字段添加成功")
	}

	// 检查avatar字段是否存在
	var avatarExists bool
	err = db.QueryRow("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_NAME = 'user' AND COLUMN_NAME = 'avatar'").Scan(&avatarExists)
	if err != nil {
		log.Printf("检查avatar字段失败: %v", err)
	}

	if !avatarExists {
		log.Println("添加avatar字段...")
		_, err = db.Exec("ALTER TABLE user ADD COLUMN avatar VARCHAR(500)")
		if err != nil {
			log.Printf("添加avatar字段失败: %v", err)
			return err
		}
		log.Println("avatar字段添加成功")
	}

	log.Println("数据库迁移完成")
	return nil
}
