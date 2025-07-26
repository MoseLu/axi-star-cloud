package app

import (
	"fmt"

	"backend/config"
)

// ResetDatabase 重置数据库
func ResetDatabase() error {
	fmt.Println("🔄 开始重置更新日志表...")

	// 初始化数据库连接
	db, err := config.InitDB(nil)
	if err != nil {
		return fmt.Errorf("数据库连接失败: %v", err)
	}
	defer db.Close()

	// 只删除更新日志表
	fmt.Println("🗑️ 删除更新日志表...")
	_, err = db.Exec("DROP TABLE IF EXISTS update_logs")
	if err != nil {
		fmt.Printf("⚠️ 删除update_logs表失败: %v\n", err)
	} else {
		fmt.Printf("✅ 已删除表: update_logs\n")
	}

	// 重新创建更新日志表
	fmt.Println("🏗️ 重新创建更新日志表...")
	createUpdateLogsTable := `
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

	_, err = db.Exec(createUpdateLogsTable)
	if err != nil {
		return fmt.Errorf("创建update_logs表失败: %v", err)
	}
	fmt.Println("✅ 更新日志表创建完成")

	fmt.Println("🎉 更新日志表重置完成！")
	fmt.Println("✅ 其他数据（文件、文件夹、用户等）已保留")
	fmt.Println("🚀 现在可以启动后端服务了")

	return nil
} 