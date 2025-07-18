package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// 连接数据库
	db, err := sql.Open("mysql", "root:123456@tcp(localhost:3306)/docs?charset=utf8mb4&parseTime=True&loc=Local")
	if err != nil {
		log.Fatal("连接数据库失败:", err)
	}
	defer db.Close()

	// 测试连接
	if err := db.Ping(); err != nil {
		log.Fatal("数据库连接测试失败:", err)
	}

	fmt.Println("✅ 数据库连接成功")

	// 检查用户表
	var userCount int
	err = db.QueryRow("SELECT COUNT(*) FROM user").Scan(&userCount)
	if err != nil {
		log.Fatal("查询用户表失败:", err)
	}
	fmt.Printf("👥 用户总数: %d\n", userCount)

	// 检查文件表
	var fileCount int
	err = db.QueryRow("SELECT COUNT(*) FROM files").Scan(&fileCount)
	if err != nil {
		log.Fatal("查询文件表失败:", err)
	}
	fmt.Printf("📁 文件总数: %d\n", fileCount)

	// 检查URL文件表
	var urlFileCount int
	err = db.QueryRow("SELECT COUNT(*) FROM url_files").Scan(&urlFileCount)
	if err != nil {
		log.Fatal("查询URL文件表失败:", err)
	}
	fmt.Printf("🔗 URL文件总数: %d\n", urlFileCount)

	// 查询特定用户的文件
	userID := "550e8400-e29b-41d4-a716-446655440000"

	var userFileCount int
	err = db.QueryRow("SELECT COUNT(*) FROM files WHERE user_id = ?", userID).Scan(&userFileCount)
	if err != nil {
		log.Fatal("查询用户文件失败:", err)
	}
	fmt.Printf("📂 用户 %s 的文件数: %d\n", userID, userFileCount)

	var userUrlFileCount int
	err = db.QueryRow("SELECT COUNT(*) FROM url_files WHERE user_id = ?", userID).Scan(&userUrlFileCount)
	if err != nil {
		log.Fatal("查询用户URL文件失败:", err)
	}
	fmt.Printf("🔗 用户 %s 的URL文件数: %d\n", userID, userUrlFileCount)

	// 显示具体的文件数据
	rows, err := db.Query("SELECT id, name, type, size FROM files WHERE user_id = ? LIMIT 5", userID)
	if err != nil {
		log.Fatal("查询文件详情失败:", err)
	}
	defer rows.Close()

	fmt.Println("\n📄 用户文件详情:")
	for rows.Next() {
		var id int
		var name, fileType string
		var size int64
		err := rows.Scan(&id, &name, &fileType, &size)
		if err != nil {
			log.Printf("读取文件行失败: %v", err)
			continue
		}
		fmt.Printf("  - ID: %d, 名称: %s, 类型: %s, 大小: %d\n", id, name, fileType, size)
	}

	// 显示具体的URL文件数据
	urlRows, err := db.Query("SELECT id, title, url FROM url_files WHERE user_id = ? LIMIT 5", userID)
	if err != nil {
		log.Fatal("查询URL文件详情失败:", err)
	}
	defer urlRows.Close()

	fmt.Println("\n🔗 用户URL文件详情:")
	for urlRows.Next() {
		var id int
		var title, url string
		err := urlRows.Scan(&id, &title, &url)
		if err != nil {
			log.Printf("读取URL文件行失败: %v", err)
			continue
		}
		fmt.Printf("  - ID: %d, 标题: %s, URL: %s\n", id, title, url)
	}
}
