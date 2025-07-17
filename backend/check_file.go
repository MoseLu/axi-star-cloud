package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"backend/config"
	"backend/utils"
)

func main() {
	// 初始化数据库
	db, err := config.InitDB(nil)
	if err != nil {
		log.Fatal("数据库初始化失败:", err)
	}
	defer db.Close()

	// 查询ID为15的文件
	rows, err := db.Query("SELECT id, name, path, user_id, type FROM files WHERE id = 15")
	if err != nil {
		log.Fatal("查询失败:", err)
	}
	defer rows.Close()

	found := false
	for rows.Next() {
		var id int
		var name, path, userID, fileType string
		err := rows.Scan(&id, &name, &path, &userID, &fileType)
		if err != nil {
			log.Fatal("扫描数据失败:", err)
		}
		fmt.Printf("✅ 找到文件:\n")
		fmt.Printf("  ID: %d\n", id)
		fmt.Printf("  名称: %s\n", name)
		fmt.Printf("  路径: %s\n", path)
		fmt.Printf("  用户ID: %s\n", userID)
		fmt.Printf("  文件类型: %s\n", fileType)

		// 测试路径处理
		absolutePath := utils.GetFileAbsolutePath(path)
		fmt.Printf("  绝对路径: %s\n", absolutePath)

		// 检查文件是否实际存在
		if _, err := os.Stat(absolutePath); os.IsNotExist(err) {
			fmt.Printf("❌ 文件不存在于绝对路径: %s\n", absolutePath)

			// 尝试其他可能的路径
			possiblePaths := []string{
				filepath.Join("uploads", "other", name),
				filepath.Join("..", "uploads", "other", name),
				filepath.Join("front", "uploads", "other", name),
				filepath.Join("..", "front", "uploads", "other", name),
			}

			for _, testPath := range possiblePaths {
				if _, err := os.Stat(testPath); err == nil {
					fmt.Printf("✅ 文件存在于路径: %s\n", testPath)
					break
				}
			}
		} else {
			fmt.Printf("✅ 文件存在于绝对路径: %s\n", absolutePath)
		}
		found = true
	}

	if !found {
		fmt.Printf("❌ 未找到ID为15的文件\n")
	}

	// 显示当前工作目录
	currentDir, _ := os.Getwd()
	fmt.Printf("\n📁 当前工作目录: %s\n", currentDir)

	// 显示uploads目录
	fmt.Printf("📁 uploads目录内容:\n")
	if _, err := os.Stat("uploads"); err == nil {
		entries, _ := os.ReadDir("uploads")
		for _, entry := range entries {
			fmt.Printf("  %s\n", entry.Name())
		}
	} else {
		fmt.Printf("  uploads目录不存在\n")
	}
}
