package database

import (
	"database/sql"
	"strings"
)

// MigrateDatabase 执行数据库迁移
func MigrateDatabase(db *sql.DB) error {
	// 添加 is_admin 字段（如果不存在）
	if err := addAdminField(db); err != nil {
		return err
	}

	// 确保Mose用户具有管理员权限
	if err := ensureMoseAdmin(db); err != nil {
		return err
	}

	// 修复头像路径格式
	if err := fixAvatarPaths(db); err != nil {
		return err
	}

	// 清理不存在的头像数据
	if err := cleanInvalidAvatars(db); err != nil {
		return err
	}

	return nil
}

// addAdminField 添加管理员字段
func addAdminField(db *sql.DB) error {
	// 检查 is_admin 字段是否存在
	var columnExists int
	err := db.QueryRow(`
		SELECT COUNT(*) 
		FROM information_schema.columns 
		WHERE table_name = 'user' AND column_name = 'is_admin'
	`).Scan(&columnExists)

	if err != nil {
		return err
	}

	if columnExists == 0 {
		_, err := db.Exec("ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT FALSE")
		if err != nil {
			return err
		}
	}

	return nil
}

// fixAvatarPaths 修复头像路径格式
func fixAvatarPaths(db *sql.DB) error {
	// 查询所有有头像的用户
	rows, err := db.Query("SELECT uuid, avatar FROM user WHERE avatar IS NOT NULL AND avatar != ''")
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var uuid, avatar string
		if err := rows.Scan(&uuid, &avatar); err != nil {
			continue
		}

		// 如果头像路径是完整路径，提取文件名
		if strings.HasPrefix(avatar, "/uploads/avatars/") {
			fileName := strings.TrimPrefix(avatar, "/uploads/avatars/")

			// 更新数据库中的路径为只存储文件名
			_, err := db.Exec("UPDATE user SET avatar = ? WHERE uuid = ?", fileName, uuid)
			if err != nil {
				continue
			}
		}
	}

	return nil
}

// SetDefaultStorageLimitsIfNeeded 只在需要时设置默认存储限制
func SetDefaultStorageLimitsIfNeeded(db *sql.DB) error {
	// 检查是否有用户的存储限制为0或NULL
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM user WHERE storage_limit IS NULL OR storage_limit = 0").Scan(&count)
	if err != nil {
		return err
	}

	// 只有在有用户没有设置存储限制时才设置默认值
	if count > 0 {
		// 更新管理员用户的存储限制为5GB
		_, err := db.Exec("UPDATE user SET storage_limit = ? WHERE username = 'Mose' AND (storage_limit IS NULL OR storage_limit = 0)", 5*1024*1024*1024)
		if err != nil {
			return err
		}

		// 更新其他用户的存储限制为1GB
		_, err = db.Exec("UPDATE user SET storage_limit = ? WHERE username != 'Mose' AND (storage_limit IS NULL OR storage_limit = 0)", 1024*1024*1024)
		if err != nil {
			return err
		}
	}

	return nil
}

// cleanInvalidAvatars 清理不存在的头像数据
func cleanInvalidAvatars(db *sql.DB) error {
	// 查询所有有头像的用户
	rows, err := db.Query("SELECT uuid, avatar FROM user WHERE avatar IS NOT NULL AND avatar != ''")
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var uuid, avatar string
		if err := rows.Scan(&uuid, &avatar); err != nil {
			continue
		}

		// 检查是否为默认头像或已知不存在的头像
		if avatar == "avatar.jpg" || avatar == "550e8400-e29b-41d4-a716-446655440000_1589165e-2f57-4986-9a68-c4da532bd507.jpg" {
			// 将这些头像设置为null
			_, err := db.Exec("UPDATE user SET avatar = NULL WHERE uuid = ?", uuid)
			if err != nil {
				continue
			}
		}
	}

	return nil
}

// ensureMoseAdmin 确保Mose用户具有管理员权限
func ensureMoseAdmin(db *sql.DB) error {
	// 检查Mose用户是否存在
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM user WHERE username = 'Mose'").Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		// Mose用户不存在，创建管理员用户
		_, err := db.Exec(`
			INSERT INTO user (uuid, username, password, email, bio, is_admin, storage_limit) VALUES 
			('550e8400-e29b-41d4-a716-446655440000', 'Mose', '123456', 'mose@example.com', '系统管理员', TRUE, ?)
		`, 5*1024*1024*1024) // 5GB存储空间
		if err != nil {
			return err
		}
	} else {
		// Mose用户存在，确保具有管理员权限
		_, err := db.Exec("UPDATE user SET is_admin = TRUE, storage_limit = ? WHERE username = 'Mose'", 5*1024*1024*1024)
		if err != nil {
			return err
		}
	}

	return nil
}
