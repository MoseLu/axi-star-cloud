package routes

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"backend/handlers"

	"github.com/gin-gonic/gin"
)

// Route 路由结构体
type Route struct {
	Method      string
	Path        string
	Handler     gin.HandlerFunc
	Description string
}

// RouteGroup 路由组结构体
type RouteGroup struct {
	Prefix   string
	Routes   []Route
	Handlers []gin.HandlerFunc
}

// Router 路由器
type Router struct {
	engine *gin.Engine
	groups map[string]*RouteGroup
}

// NewRouter 创建路由器实例
func NewRouter(engine *gin.Engine) *Router {
	return &Router{
		engine: engine,
		groups: make(map[string]*RouteGroup),
	}
}

// RegisterGroup 注册路由组
func (r *Router) RegisterGroup(name, prefix string, handlers ...gin.HandlerFunc) *RouteGroup {
	group := &RouteGroup{
		Prefix:   prefix,
		Routes:   []Route{},
		Handlers: handlers,
	}
	r.groups[name] = group
	return group
}

// AddRoute 添加路由到组
func (g *RouteGroup) AddRoute(method, path string, handler gin.HandlerFunc, description string) {
	g.Routes = append(g.Routes, Route{
		Method:      method,
		Path:        path,
		Handler:     handler,
		Description: description,
	})
}

// SetupRoutes 设置所有路由
func (r *Router) SetupRoutes(
	authHandler *handlers.AuthHandler,
	fileHandler *handlers.FileHandler,
	folderHandler *handlers.FolderHandler,
	storageHandler *handlers.StorageHandler,
	profileHandler *handlers.ProfileHandler,
) {
	// 注册API路由组
	apiGroup := r.RegisterGroup("api", "/api")

	// 认证相关路由
	apiGroup.AddRoute("POST", "/login", authHandler.Login, "用户登录")

	// 文件相关路由
	apiGroup.AddRoute("GET", "/files", fileHandler.GetFiles, "获取文件列表")
	apiGroup.AddRoute("GET", "/files/:id", fileHandler.GetFile, "获取单个文件信息")
	apiGroup.AddRoute("GET", "/files/:id/download", fileHandler.DownloadFile, "下载文件")
	apiGroup.AddRoute("POST", "/upload", fileHandler.UploadFile, "上传文件")
	apiGroup.AddRoute("DELETE", "/files/:id", fileHandler.DeleteFile, "删除文件")
	apiGroup.AddRoute("PUT", "/files/:id/move", fileHandler.MoveFile, "移动文件")

	// 文件夹相关路由
	apiGroup.AddRoute("GET", "/folders", folderHandler.GetFolders, "获取文件夹列表")
	apiGroup.AddRoute("POST", "/folders", folderHandler.CreateFolder, "创建文件夹")
	apiGroup.AddRoute("PUT", "/folders/:id", folderHandler.UpdateFolder, "更新文件夹")
	apiGroup.AddRoute("DELETE", "/folders/:id", folderHandler.DeleteFolder, "删除文件夹")
	apiGroup.AddRoute("GET", "/folders/:id/count", folderHandler.GetFolderFileCount, "获取文件夹文件数量")

	// 存储相关路由
	apiGroup.AddRoute("GET", "/storage", storageHandler.GetStorageInfo, "获取存储信息")
	apiGroup.AddRoute("PUT", "/storage", storageHandler.UpdateStorageLimit, "更新存储限制")

	// 个人资料相关路由
	apiGroup.AddRoute("GET", "/profile", profileHandler.GetProfile, "获取个人资料")
	apiGroup.AddRoute("PUT", "/profile", profileHandler.UpdateProfile, "更新个人资料")
	apiGroup.AddRoute("POST", "/profile/avatar", profileHandler.UploadAvatar, "上传头像")

	// 注册静态文件路由
	r.registerStaticRoutes()

	// 注册页面路由
	r.registerPageRoutes()

	// 注册健康检查路由
	r.registerHealthRoutes()

	// 应用所有路由组
	r.applyGroups()
}

// registerStaticRoutes 注册静态文件路由
func (r *Router) registerStaticRoutes() {
	r.engine.Static("/static", "../front")          // 指向根目录下front
	r.engine.Static("/uploads", "../front/uploads") // 指向front/uploads目录
}

// registerPageRoutes 注册页面路由
func (r *Router) registerPageRoutes() {
	absPath, err := filepath.Abs("../index.html")
	if err != nil {
		log.Fatalf("获取index.html绝对路径失败: %v", err)
	}
	if _, err := os.Stat(absPath); err != nil {
		log.Fatalf("index.html not found at %s: %v", absPath, err)
	}
	r.engine.StaticFile("/", absPath)
}

// registerHealthRoutes 注册健康检查路由
func (r *Router) registerHealthRoutes() {
	r.engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "服务器运行正常",
		})
	})
}

// applyGroups 应用所有路由组
func (r *Router) applyGroups() {
	for name, group := range r.groups {
		log.Printf("注册路由组: %s (前缀: %s)", name, group.Prefix)

		ginGroup := r.engine.Group(group.Prefix, group.Handlers...)

		for _, route := range group.Routes {
			log.Printf("  %s %s - %s", route.Method, route.Path, route.Description)

			switch route.Method {
			case "GET":
				ginGroup.GET(route.Path, route.Handler)
			case "POST":
				ginGroup.POST(route.Path, route.Handler)
			case "PUT":
				ginGroup.PUT(route.Path, route.Handler)
			case "DELETE":
				ginGroup.DELETE(route.Path, route.Handler)
			case "PATCH":
				ginGroup.PATCH(route.Path, route.Handler)
			case "HEAD":
				ginGroup.HEAD(route.Path, route.Handler)
			case "OPTIONS":
				ginGroup.OPTIONS(route.Path, route.Handler)
			}
		}
	}
}

// GetRegisteredRoutes 获取已注册的路由信息
func (r *Router) GetRegisteredRoutes() map[string][]Route {
	result := make(map[string][]Route)
	for name, group := range r.groups {
		result[name] = group.Routes
	}
	return result
}
