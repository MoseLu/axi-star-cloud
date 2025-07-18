package main

import (
	"fmt"
	"log"
	"net/http"

	"backend/config"
	"backend/database"
	"backend/handlers"
	"backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg, err := config.LoadConfig("")
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

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

	// 迁移archive类型文件为other类型
	if err := database.MigrateArchiveToOther(db); err != nil {
		log.Printf("迁移archive文件类型失败: %v", err)
	}

	// 迁移文件类型分类
	if err := database.MigrateFileTypes(db); err != nil {
		log.Printf("迁移文件类型分类失败: %v", err)
	}

	// 创建URL文件表
	if err := database.MigrateUrlFiles(db); err != nil {
		log.Fatalf("创建URL文件表失败: %v", err)
	}

	// 只在第一次启动时设置默认存储限制
	if err := database.SetDefaultStorageLimitsIfNeeded(db); err != nil {
		// 静默处理，不打印错误
	}

	// 插入初始数据
	if err := database.InsertInitialData(db); err != nil {
		log.Fatalf("插入初始数据失败: %v", err)
	}

	// 初始化数据访问层
	userRepo := database.NewUserRepository(db)
	fileRepo := database.NewFileRepository(db)
	folderRepo := database.NewFolderRepository(db)
	docRepo := database.NewDocumentRepository(db)
	urlFileRepo := database.NewUrlFileRepository(db)

	// 初始化处理器层
	authHandler := handlers.NewAuthHandler(userRepo)
	fileHandler := handlers.NewFileHandler(fileRepo, userRepo, folderRepo)
	folderHandler := handlers.NewFolderHandler(folderRepo)
	storageHandler := handlers.NewStorageHandler(userRepo)
	profileHandler := handlers.NewProfileHandler(userRepo)
	documentHandler := handlers.NewDocumentHandler(docRepo)
	urlFileHandler := handlers.NewUrlFileHandler(urlFileRepo, userRepo, folderRepo)

	// 创建Gin引擎
	router := gin.Default()

	// 添加CORS中间件
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Access-Control-Allow-Credentials", "true")

		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	// 初始化路由器
	routerManager := routes.NewRouter(router)

	// 设置所有路由
	routerManager.SetupRoutes(authHandler, fileHandler, folderHandler, storageHandler, profileHandler, documentHandler, urlFileHandler)

	// 构建服务器地址
	host := cfg.Server.Host
	if host == "" {
		host = "0.0.0.0" // 默认值
	}
	serverAddr := fmt.Sprintf("%s:%s", host, cfg.Server.Port)

	// 启动服务器
	log.Printf("服务器启动在: %s", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
