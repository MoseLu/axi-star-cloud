package main

import (
	"log"

	"backend/config"
	"backend/database"
	"backend/handlers"
	"backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化数据库连接池
	db, err := config.InitDB(nil)
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer db.Close()

	// 创建数据库表
	if err := database.CreateTables(db); err != nil {
		log.Fatalf("创建数据库表失败: %v", err)
	}

	// 执行数据库迁移
	if err := database.MigrateDatabase(db); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	// 插入初始数据
	if err := database.InsertInitialData(db); err != nil {
		log.Fatalf("插入初始数据失败: %v", err)
	}

	// 初始化数据访问层
	userRepo := database.NewUserRepository(db)
	fileRepo := database.NewFileRepository(db)
	folderRepo := database.NewFolderRepository(db)

	// 初始化处理器层
	authHandler := handlers.NewAuthHandler(userRepo)
	fileHandler := handlers.NewFileHandler(fileRepo, userRepo, folderRepo)
	folderHandler := handlers.NewFolderHandler(folderRepo)
	storageHandler := handlers.NewStorageHandler(userRepo)
	profileHandler := handlers.NewProfileHandler(userRepo)

	// 创建Gin引擎
	router := gin.Default()

	// 初始化路由器
	routerManager := routes.NewRouter(router)

	// 设置所有路由
	routerManager.SetupRoutes(authHandler, fileHandler, folderHandler, storageHandler, profileHandler)

	// 打印注册的路由信息
	log.Println("=== 已注册的路由 ===")
	registeredRoutes := routerManager.GetRegisteredRoutes()
	for groupName, routes := range registeredRoutes {
		log.Printf("路由组: %s", groupName)
		for _, route := range routes {
			log.Printf("  %s %s - %s", route.Method, route.Path, route.Description)
		}
	}
	log.Println("==================")

	// 启动服务器
	log.Println("服务器启动在 http://localhost:8080")
	log.Println("健康检查: http://localhost:8080/health")

	if err := router.Run(":8080"); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
