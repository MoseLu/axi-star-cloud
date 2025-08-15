package app

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"backend/config"
	"backend/database"
	"backend/handlers"
	"backend/middleware"
	"backend/routes"
	"backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// App 应用结构体
type App struct {
	Router *gin.Engine
	Config *config.Config
	DB     *sql.DB
	GormDB *gorm.DB
}

// NewApp 创建新的应用实例
func NewApp() *App {
	return &App{}
}

// Initialize 初始化应用
func (app *App) Initialize() error {
	// 加载配置 - 尝试多个可能的配置文件路径
	configPaths := []string{
		"config/config-prod.yaml", // 优先使用生产环境配置
		"backend/config/config-prod.yaml",
		"./config/config-prod.yaml",
		"./backend/config/config-prod.yaml",
		"config/config.yaml", // 备用配置
		"backend/config/config.yaml",
		"./config/config.yaml",
		"./backend/config/config.yaml",
	}

	var cfg *config.Config
	var err error

	for _, path := range configPaths {
		cfg, err = config.LoadConfig(path)
		if err == nil {
			break
		}
	}

	if err != nil {
		return fmt.Errorf("加载配置失败，尝试了以下路径: %v, 错误: %v", configPaths, err)
	}
	app.Config = cfg

	// 初始化数据库
	db, err := app.InitializeDatabase()
	if err != nil {
		return fmt.Errorf("初始化数据库失败: %v", err)
	}
	app.DB = db

	// 初始化GORM数据库
	gormDB, err := app.initializeGORM()
	if err != nil {
		return fmt.Errorf("初始化GORM数据库失败: %v", err)
	}
	app.GormDB = gormDB

	// 初始化路由
	app.Router = app.initializeRouter()

	// 初始化处理器
	handlers, userRepo, fileRepo, urlFileRepo := app.initializeHandlers(db, gormDB)

	// 设置路由
	app.setupRoutes(handlers, userRepo, fileRepo, urlFileRepo)

	return nil
}

// InitializeDatabase 初始化数据库
func (app *App) InitializeDatabase() (*sql.DB, error) {
	fmt.Println("🔧 开始初始化数据库...")
	
	db, err := config.InitDB(nil)
	if err != nil {
		return nil, fmt.Errorf("数据库连接失败: %v", err)
	}
	fmt.Println("✅ 数据库连接成功")

	// 测试数据库连接
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("数据库连接测试失败: %v", err)
	}
	fmt.Println("✅ 数据库连接测试通过")

	// 使用新的完整初始化函数
	fmt.Println("🔧 开始执行数据库初始化...")
	if err := database.InitializeDatabase(db); err != nil {
		return nil, fmt.Errorf("数据库初始化失败: %v", err)
	}
	fmt.Println("✅ 数据库初始化完成")

	return db, nil
}

// initializeGORM 初始化GORM数据库
func (app *App) initializeGORM() (*gorm.DB, error) {
	fmt.Println("🔧 开始初始化GORM数据库...")
	
	// 使用GORM初始化数据库
	gormDB, err := database.InitializeGORM()
	if err != nil {
		return nil, fmt.Errorf("GORM数据库初始化失败: %v", err)
	}
	fmt.Println("✅ GORM数据库初始化完成")

	return gormDB, nil
}

// initializeRouter 初始化路由
func (app *App) initializeRouter() *gin.Engine {
	router := gin.New()

	// 添加中间件
	router.Use(middleware.ErrorHandler())      // 全局错误处理
	router.Use(middleware.Logger())            // 请求日志
	router.Use(middleware.PerformanceLogger()) // 性能监控
	router.Use(middleware.SecurityLogger())    // 安全日志

	// 设置文件上传大小限制
	router.MaxMultipartMemory = 10 << 20 // 10MB

	// 添加CORS中间件
	router.Use(app.corsMiddleware())

	return router
}

// corsMiddleware CORS中间件
func (app *App) corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// 允许的域名列表
		allowedOrigins := []string{
			"http://localhost:8080",
			"http://localhost:8081",
			"http://127.0.0.1:8080",
			"http://127.0.0.1:8081",
			"https://redamancy.com.cn",
			"https://www.redamancy.com.cn",
		}

		// 检查Origin是否在允许列表中
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				allowed = true
				break
			}
		}

		// 设置CORS头
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		} else {
			// 如果是开发环境，允许所有本地域名
			if origin != "" && (strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1")) {
				c.Header("Access-Control-Allow-Origin", origin)
			}
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, User-UUID")
		c.Header("Access-Control-Expose-Headers", "Content-Length")
		c.Header("Access-Control-Allow-Credentials", "true")

		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// initializeHandlers 初始化处理器
func (app *App) initializeHandlers(db *sql.DB, gormDB *gorm.DB) (*Handlers, database.UserRepositoryInterface, database.FileRepositoryInterface, database.UrlFileRepositoryInterface) {
	// 初始化 GORM 数据访问层
	userRepo := database.NewGORMUserRepository(gormDB)
	fileRepo := database.NewGORMFileRepository(gormDB)
	folderRepo := database.NewGORMFolderRepository(gormDB)
	docRepo := database.NewGORMDocumentRepository(gormDB)
	urlFileRepo := database.NewGORMUrlFileRepository(gormDB)

	// 初始化上传队列管理器
	uploadQueueManager := utils.NewUploadQueueManager()

	// 初始化处理器层
	handlers := &Handlers{
		Auth:           handlers.NewAuthHandler(userRepo, fileRepo, urlFileRepo),
		File:           handlers.NewFileHandler(fileRepo, userRepo, folderRepo),
		Folder:         handlers.NewFolderHandler(folderRepo),
		Storage:        handlers.NewStorageHandler(userRepo, fileRepo, urlFileRepo),
		Profile:        handlers.NewProfileHandler(userRepo),
		Document:       handlers.NewDocumentHandler(docRepo),
		UrlFile:        handlers.NewUrlFileHandler(urlFileRepo, userRepo, folderRepo),
		UploadProgress: handlers.NewUploadProgressHandler(uploadQueueManager),
		UpdateLog:      handlers.NewUpdateLogHandler(db),
		Health:         handlers.NewHealthHandler(db, gormDB),
	}

	return handlers, userRepo, fileRepo, urlFileRepo
}

// setupRoutes 设置路由
func (app *App) setupRoutes(handlers *Handlers, userRepo database.UserRepositoryInterface, fileRepo database.FileRepositoryInterface, urlFileRepo database.UrlFileRepositoryInterface) {
	// 初始化路由器
	routerManager := routes.NewRouter(app.Router)

	// 设置所有路由
	routerManager.SetupRoutes(
		handlers.Auth,
		handlers.File,
		handlers.Folder,
		handlers.Storage,
		handlers.Profile,
		handlers.Document,
		handlers.UrlFile,
		handlers.UploadProgress,
		handlers.UpdateLog,
	)

	// 设置认证路由（/api/auth/*）
	routes.SetupAuthRoutes(app.Router, userRepo, fileRepo, urlFileRepo)

	// 添加额外的健康检查路由（避免与routes.go中的重复）
	app.Router.GET("/ready", handlers.Health.ReadinessCheck)
	app.Router.GET("/live", handlers.Health.LivenessCheck)
	app.Router.GET("/metrics", handlers.Health.Metrics)
	app.Router.GET("/db-status", handlers.Health.DatabaseStatus)
}

// Handlers 处理器集合
type Handlers struct {
	Auth           *handlers.AuthHandler
	File           *handlers.FileHandler
	Folder         *handlers.FolderHandler
	Storage        *handlers.StorageHandler
	Profile        *handlers.ProfileHandler
	Document       *handlers.DocumentHandler
	UrlFile        *handlers.UrlFileHandler
	UploadProgress *handlers.UploadProgressHandler
	UpdateLog      *handlers.UpdateLogHandler
	Health         *handlers.HealthHandler
}

// Run 启动应用
func (app *App) Run() error {
	// 构建服务器地址
	host := app.Config.Server.Host
	if host == "" {
		host = "0.0.0.0" // 默认值
	}
	serverAddr := fmt.Sprintf("%s:%s", host, app.Config.Server.Port)

	// 启动服务器
	return app.Router.Run(serverAddr)
}

// Close 关闭应用
func (app *App) Close() error {
	if app.DB != nil {
		return app.DB.Close()
	}
	return nil
}
