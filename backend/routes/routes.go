package routes

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	documentHandler *handlers.DocumentHandler,
	urlFileHandler *handlers.UrlFileHandler,
) {
	// 注册API路由组
	apiGroup := r.RegisterGroup("api", "/api")

	// 认证相关路由
	apiGroup.AddRoute("POST", "/login", authHandler.Login, "用户登录")
	apiGroup.AddRoute("POST", "/register", authHandler.Register, "用户注册")

	// 管理员相关路由（需要管理员权限）
	adminGroup := r.RegisterGroup("admin", "/api/admin", authHandler.CheckAdminPermission())
	adminGroup.AddRoute("GET", "/users", authHandler.GetAllUsers, "获取所有用户列表")
	adminGroup.AddRoute("PUT", "/users/storage", authHandler.UpdateUserStorage, "更新用户存储限制")

	// 文件相关路由
	apiGroup.AddRoute("GET", "/files", fileHandler.GetFiles, "获取文件列表")
	apiGroup.AddRoute("GET", "/files/count", fileHandler.GetTotalFileCount, "获取用户所有文件总数")
	apiGroup.AddRoute("GET", "/files/:id", fileHandler.GetFile, "获取单个文件信息")
	apiGroup.AddRoute("GET", "/files/:id/download", fileHandler.DownloadFile, "下载文件")
	apiGroup.AddRoute("GET", "/download", fileHandler.DownloadFileRedirect, "下载文件重定向（优化版本）")
	apiGroup.AddRoute("POST", "/upload", fileHandler.UploadFile, "上传文件")
	apiGroup.AddRoute("DELETE", "/files/:id", fileHandler.DeleteFile, "删除文件")
	apiGroup.AddRoute("PUT", "/files/:id/move", fileHandler.MoveFile, "移动文件")

	// URL文件相关路由
	apiGroup.AddRoute("GET", "/url-files", urlFileHandler.GetUrlFiles, "获取URL文件列表")
	apiGroup.AddRoute("GET", "/url-files/count", urlFileHandler.GetTotalUrlFileCount, "获取用户所有URL文件总数")
	apiGroup.AddRoute("GET", "/url-files/:id", urlFileHandler.GetUrlFile, "获取单个URL文件信息")
	apiGroup.AddRoute("POST", "/url-files", urlFileHandler.CreateUrlFile, "创建URL文件")
	apiGroup.AddRoute("DELETE", "/url-files/:id", urlFileHandler.DeleteUrlFile, "删除URL文件")
	apiGroup.AddRoute("PUT", "/url-files/:id/move", urlFileHandler.MoveUrlFile, "移动URL文件")

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

	// 文档相关路由（需要管理员权限）
	docGroup := r.RegisterGroup("documents", "/api/documents", authHandler.CheckAdminPermission())
	docGroup.AddRoute("GET", "", documentHandler.GetDocuments, "获取所有文档")
	docGroup.AddRoute("POST", "", documentHandler.CreateDocument, "创建文档")
	docGroup.AddRoute("GET", "/:id", documentHandler.GetDocument, "获取单个文档")
	docGroup.AddRoute("DELETE", "/:id", documentHandler.DeleteDocument, "删除文档")

	// 注册静态文件路由
	r.registerStaticRoutes()

	// 注册页面路由
	r.registerPageRoutes()

	// 注册健康检查路由
	r.registerHealthRoutes()

	// 注册文件路径测试路由
	r.registerTestRoutes()

	// 注册静态文件列表路由
	// r.registerStaticFilesRoutes()

	// 应用所有路由组
	r.applyGroups()
}

// registerStaticRoutes 注册静态文件路由
func (r *Router) registerStaticRoutes() {

	// 尝试多个可能的路径
	staticPaths := []string{
		"../front",
		"front",
		"./front",
		"static",
		"./static",
		// 云端服务器路径 - 项目在axi-star-cloud目录
		"/www/wwwroot/axi-star-cloud/front",
		"/www/wwwroot/redamancy.com.cn/front",
	}

	uploadsPaths := []string{
		// 优先使用backend目录下的 uploads（头像文件实际保存位置）
		"uploads",
		"./uploads",
		// 备用路径
		"../uploads",
		"../front/uploads",
		"front/uploads",
		"./front/uploads",
	}

	// 设置静态文件路由
	staticFound := false
	for _, path := range staticPaths {
		if _, err := os.Stat(path); err == nil {
			r.engine.Static("/static", path)
			staticFound = true
			break
		}
	}

	// 如果静态文件路径都失败，尝试绝对路径
	if !staticFound {
		absoluteStaticPaths := []string{
			"/www/wwwroot/axi-star-cloud/front",
			"/www/wwwroot/redamancy.com.cn/front",
		}

		for _, absPath := range absoluteStaticPaths {
			if _, err := os.Stat(absPath); err == nil {
				r.engine.Static("/static", absPath)
				staticFound = true
				break
			}
		}
	}

	// 设置上传文件路由
	uploadsFound := false
	for _, path := range uploadsPaths {
		if _, err := os.Stat(path); err == nil {
			// 使用自定义的静态文件处理器，添加下载响应头

			// 创建通用的文件处理函数
			fileHandler := func(c *gin.Context) {
				filepathParam := c.Param("filepath")

				// 获取绝对路径，确保路径正确
				absPath, err := filepath.Abs(path)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "路径错误"})
					return
				}

				fullPath := filepath.Join(absPath, filepathParam)

				// 检查文件是否存在
				if _, err := os.Stat(fullPath); os.IsNotExist(err) {
					// 如果是头像文件，返回默认头像
					if strings.Contains(filepathParam, "avatars/") {
						// 尝试返回默认头像
						defaultAvatarPath := filepath.Join(absPath, "..", "..", "front", "public", "avatar.png")
						if _, err := os.Stat(defaultAvatarPath); err == nil {
							c.File(defaultAvatarPath)
							return
						}
					}
					c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
					return
				}

				// 设置响应头，但不强制attachment，让前端完全控制下载行为
				c.Header("Content-Type", "application/octet-stream") // 关键：强制二进制流
				c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
				c.Header("Pragma", "no-cache")
				c.Header("Expires", "0")
				c.Header("X-Content-Type-Options", "nosniff")

				// 提供文件
				c.File(fullPath)
			}

			// 注册GET和HEAD路由
			r.engine.GET("/uploads/*filepath", fileHandler)
			r.engine.HEAD("/uploads/*filepath", fileHandler)
			uploadsFound = true
			break
		}
	}

	// 如果相对路径都失败，尝试绝对路径
	if !uploadsFound {
		absolutePaths := []string{
			"/www/wwwroot/axi-star-cloud/backend/uploads",
			"/www/wwwroot/axi-star-cloud/uploads",
			"/www/wwwroot/redamancy.com.cn/backend/uploads",
			"/www/wwwroot/redamancy.com.cn/uploads",
			"/www/wwwroot/axi-star-cloud/front/uploads",
			"/www/wwwroot/redamancy.com.cn/front/uploads",
		}

		for _, absPath := range absolutePaths {
			if _, err := os.Stat(absPath); err == nil {
				// 使用自定义的静态文件处理器，添加下载响应头

				// 创建通用的文件处理函数
				fileHandler := func(c *gin.Context) {
					filepathParam := c.Param("filepath")
					fullPath := filepath.Join(absPath, filepathParam)

					// 检查文件是否存在
					if _, err := os.Stat(fullPath); os.IsNotExist(err) {
						// 如果是头像文件，返回默认头像
						if strings.Contains(filepathParam, "avatars/") {
							// 尝试返回默认头像
							defaultAvatarPath := filepath.Join(absPath, "..", "..", "front", "public", "avatar.png")
							if _, err := os.Stat(defaultAvatarPath); err == nil {
								c.File(defaultAvatarPath)
								return
							}
						}
						c.JSON(http.StatusNotFound, gin.H{"error": "文件不存在"})
						return
					}

					// 设置响应头，但不强制attachment，让前端完全控制下载行为
					c.Header("Content-Type", "application/octet-stream") // 关键：强制二进制流
					c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
					c.Header("Pragma", "no-cache")
					c.Header("Expires", "0")
					c.Header("X-Content-Type-Options", "nosniff")

					// 提供文件
					c.File(fullPath)
				}

				// 注册GET和HEAD路由
				r.engine.GET("/uploads/*filepath", fileHandler)
				r.engine.HEAD("/uploads/*filepath", fileHandler)
				uploadsFound = true
				break
			}
		}
	}

	// 如果所有路径都失败，打印警告
	if !uploadsFound {
		// 未找到uploads路径，文件访问可能失败
	}
}

// registerPageRoutes 注册页面路由
func (r *Router) registerPageRoutes() {
	// 尝试多个可能的index.html路径
	indexPaths := []string{
		"../index.html",
		"index.html",
		"./index.html",
		"front/index.html",
		"../front/index.html",
		"./front/index.html",
	}

	indexFound := false
	for _, path := range indexPaths {
		if _, err := os.Stat(path); err == nil {
			absPath, err := filepath.Abs(path)
			if err == nil {
				r.engine.StaticFile("/", absPath)
				indexFound = true
				break
			}
		}
	}

	// 如果相对路径都失败，尝试绝对路径
	if !indexFound {
		absoluteIndexPaths := []string{
			"/www/wwwroot/axi-star-cloud/index.html",
			"/www/wwwroot/redamancy.com.cn/index.html",
		}

		for _, absPath := range absoluteIndexPaths {
			if _, err := os.Stat(absPath); err == nil {
				r.engine.StaticFile("/", absPath)
				indexFound = true
				break
			}
		}
	}

	// 如果找不到index.html，创建一个简单的首页
	if !indexFound {
		r.engine.GET("/", func(c *gin.Context) {
			c.HTML(http.StatusOK, "index.html", gin.H{
				"title": "星际云盘",
			})
		})
	}
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

// registerTestRoutes 注册测试路由
func (r *Router) registerTestRoutes() {
	r.engine.GET("/test/uploads", func(c *gin.Context) {
		// 测试uploads目录是否存在
		possiblePaths := []string{
			"../uploads",
			"uploads",
			"./uploads",
			"/www/wwwroot/axi-star-cloud/uploads",
			"/www/wwwroot/redamancy.com.cn/uploads",
		}

		result := gin.H{
			"message": "uploads路径测试",
			"paths":   []gin.H{},
		}

		for _, path := range possiblePaths {
			if info, err := os.Stat(path); err == nil {
				result["paths"] = append(result["paths"].([]gin.H), gin.H{
					"path":    path,
					"exists":  true,
					"isDir":   info.IsDir(),
					"size":    info.Size(),
					"modTime": info.ModTime(),
				})
			} else {
				result["paths"] = append(result["paths"].([]gin.H), gin.H{
					"path":   path,
					"exists": false,
					"error":  err.Error(),
				})
			}
		}

		c.JSON(http.StatusOK, result)
	})
}

// registerStaticFilesRoutes 注册静态文件列表路由
func (r *Router) registerStaticFilesRoutes() {
	r.engine.GET("/static/list", func(c *gin.Context) {
		// 尝试多个可能的public目录路径
		possiblePaths := []string{
			"../front/public",
			"front/public",
			"./front/public",
			"public",
			"./public",
			"/www/wwwroot/axi-star-cloud/front/public",
			"/www/wwwroot/redamancy.com.cn/front/public",
		}

		var files []string
		for _, dir := range possiblePaths {
			if fileInfos, err := os.ReadDir(dir); err == nil {
				for _, f := range fileInfos {
					if !f.IsDir() {
						files = append(files, f.Name())
					}
				}
				break // 找到第一个有效的目录就停止
			}
		}

		if len(files) == 0 {
			// 如果都找不到，返回默认列表
			files = []string{"cloud.png", "docs.png", "favicon.png", "avatar.png"}
		}

		c.JSON(http.StatusOK, gin.H{"files": files})
	})
}

// applyGroups 应用所有路由组
func (r *Router) applyGroups() {
	for _, group := range r.groups {
		ginGroup := r.engine.Group(group.Prefix, group.Handlers...)

		for _, route := range group.Routes {
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
