package routes

import (
	"net/http"
	"os"
	"path/filepath"
	"sort"
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
	uploadProgressHandler *handlers.UploadProgressHandler,
	updateLogHandler *handlers.UpdateLogHandler,
) {
	// 注册API路由组
	apiGroup := r.RegisterGroup("api", "/api")

	// 认证相关路由
	apiGroup.AddRoute("POST", "/login", authHandler.Login, "用户登录")
	apiGroup.AddRoute("POST", "/register", authHandler.Register, "用户注册")
	apiGroup.AddRoute("POST", "/logout", authHandler.Logout, "用户退出登录")
	apiGroup.AddRoute("POST", "/refresh-token", authHandler.RefreshToken, "刷新普通用户token")
	apiGroup.AddRoute("POST", "/refresh-admin-token", authHandler.RefreshAdminToken, "刷新管理员token")
	apiGroup.AddRoute("POST", "/validate-token", authHandler.ValidateToken, "验证普通用户token")
	apiGroup.AddRoute("POST", "/validate-admin-token", authHandler.ValidateAdminToken, "验证管理员token")

	// 管理员相关路由（需要管理员权限）
	adminGroup := r.RegisterGroup("admin", "/api/admin", authHandler.CheckAdminPermission())
	adminGroup.AddRoute("GET", "/users", authHandler.GetAllUsers, "获取所有用户列表")
	adminGroup.AddRoute("PUT", "/users/storage", authHandler.UpdateUserStorage, "更新用户存储限制")

	// 用户相关路由（需要用户权限）
	userGroup := r.RegisterGroup("user", "/api", authHandler.CheckUserPermission())

	// 文件相关路由（需要用户权限）
	userGroup.AddRoute("GET", "/files", fileHandler.GetFiles, "获取文件列表")
	userGroup.AddRoute("GET", "/files/count", fileHandler.GetTotalFileCount, "获取用户所有文件总数")
	userGroup.AddRoute("GET", "/files/search", fileHandler.SearchFiles, "搜索文件")
	userGroup.AddRoute("GET", "/files/:id", fileHandler.GetFile, "获取单个文件信息")
	userGroup.AddRoute("GET", "/files/:id/download", fileHandler.DownloadFile, "下载文件")
	userGroup.AddRoute("GET", "/download", fileHandler.DownloadFileRedirect, "下载文件重定向（优化版本）")
	userGroup.AddRoute("POST", "/upload", fileHandler.UploadFile, "上传文件")
	userGroup.AddRoute("POST", "/upload/batch", fileHandler.UploadFiles, "批量上传文件")
	userGroup.AddRoute("DELETE", "/files/:id", fileHandler.DeleteFile, "删除文件")
	userGroup.AddRoute("PUT", "/files/:id/move", fileHandler.MoveFile, "移动文件")

	// URL文件相关路由（需要用户权限）
	userGroup.AddRoute("GET", "/url-files", urlFileHandler.GetUrlFiles, "获取URL文件列表")
	userGroup.AddRoute("GET", "/url-files/count", urlFileHandler.GetTotalUrlFileCount, "获取用户所有URL文件总数")
	userGroup.AddRoute("GET", "/url-files/:id", urlFileHandler.GetUrlFile, "获取单个URL文件信息")
	userGroup.AddRoute("POST", "/url-files", urlFileHandler.CreateUrlFile, "创建URL文件")
	userGroup.AddRoute("DELETE", "/url-files/:id", urlFileHandler.DeleteUrlFile, "删除URL文件")
	userGroup.AddRoute("PUT", "/url-files/:id/move", urlFileHandler.MoveUrlFile, "移动URL文件")

	// 上传进度相关路由（需要用户权限）
	userGroup.AddRoute("GET", "/upload/task/:task_id", uploadProgressHandler.GetUploadTask, "获取上传任务状态")
	userGroup.AddRoute("GET", "/upload/tasks", uploadProgressHandler.GetUserUploadTasks, "获取用户上传任务列表")
	userGroup.AddRoute("GET", "/upload/stats", uploadProgressHandler.GetQueueStats, "获取上传队列统计")
	userGroup.AddRoute("DELETE", "/upload/task/:task_id", uploadProgressHandler.CancelUploadTask, "取消上传任务")

	// 文件夹相关路由（需要用户权限）
	userGroup.AddRoute("GET", "/folders", folderHandler.GetFolders, "获取文件夹列表")
	userGroup.AddRoute("POST", "/folders", folderHandler.CreateFolder, "创建文件夹")
	userGroup.AddRoute("PUT", "/folders/:id", folderHandler.UpdateFolder, "更新文件夹")
	userGroup.AddRoute("DELETE", "/folders/:id", folderHandler.DeleteFolder, "删除文件夹")
	userGroup.AddRoute("GET", "/folders/:id/count", folderHandler.GetFolderFileCount, "获取文件夹文件数量")

	// 存储相关路由（需要用户权限）
	userGroup.AddRoute("GET", "/storage", storageHandler.GetStorageInfo, "获取存储信息")
	userGroup.AddRoute("PUT", "/storage", storageHandler.UpdateStorageLimit, "更新存储限制")

	// 个人资料相关路由（需要用户权限）
	userGroup.AddRoute("GET", "/profile", profileHandler.GetProfile, "获取个人资料")
	userGroup.AddRoute("PUT", "/profile", profileHandler.UpdateProfile, "更新个人资料")
	userGroup.AddRoute("POST", "/profile/avatar", profileHandler.UploadAvatar, "上传头像")

	// 临时测试路由（公开，用于调试）
	apiGroup.AddRoute("POST", "/test/avatar", profileHandler.UploadAvatar, "测试头像上传")

	// 文档相关路由（需要管理员权限）
	docGroup := r.RegisterGroup("documents", "/api/documents", authHandler.CheckAdminPermission())
	docGroup.AddRoute("GET", "", documentHandler.GetDocuments, "获取所有文档")
	docGroup.AddRoute("POST", "", documentHandler.CreateDocument, "创建文档")
	docGroup.AddRoute("GET", "/:id", documentHandler.GetDocument, "获取单个文档")
	docGroup.AddRoute("DELETE", "/:id", documentHandler.DeleteDocument, "删除文档")

	// 更新日志相关路由（公开）
	apiGroup.AddRoute("GET", "/update-logs", updateLogHandler.GetUpdateLogs, "获取更新日志")
	apiGroup.AddRoute("POST", "/update-logs/sync", updateLogHandler.SyncUpdateLogs, "同步更新日志")
	apiGroup.AddRoute("GET", "/update-logs/stats", updateLogHandler.GetUpdateLogStats, "获取更新日志统计")
	apiGroup.AddRoute("POST", "/update-logs/validate", updateLogHandler.ValidateUpdateLogs, "验证更新日志数据完整性")

	// 管理员清理任务路由
	adminGroup.AddRoute("POST", "/upload/cleanup", uploadProgressHandler.CleanupOldTasks, "清理旧上传任务")

	// 注册静态文件列表路由
	r.registerStaticFilesRoutes()

	// 注册文档路由
	r.registerDocRoutes()

	// 注册静态文件路由
	r.registerStaticRoutes()

	// 注册页面路由
	r.registerPageRoutes()

	// 注册健康检查路由
	r.registerHealthRoutes()

	// 注册测试路由
	r.registerTestRoutes()

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

	// 获取 backend 的绝对路径
	backendDir, _ := os.Getwd()
	projectRoot := filepath.Dir(backendDir)
	uploadsPath := filepath.Join(projectRoot, "uploads")
	r.engine.Static("/uploads", uploadsPath)
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
	r.engine.GET("/api/static/list", func(c *gin.Context) {
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

// registerDocRoutes 注册文档路由
func (r *Router) registerDocRoutes() {
	// 处理根目录的文档文件（README.md 和 LICENSE）
	r.engine.GET("/:filename", func(c *gin.Context) {
		filename := c.Param("filename")

		// 只允许访问特定文件
		allowedFiles := []string{"README.md", "LICENSE"}
		isAllowed := false
		for _, allowed := range allowedFiles {
			if filename == allowed {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.Next() // 继续到下一个路由
			return
		}

		// 尝试多个可能的根目录路径
		possiblePaths := []string{
			".",
			"..",
			"./",
			"../",
			"/www/wwwroot/axi-star-cloud",
			"/www/wwwroot/redamancy.com.cn",
		}

		var filePath string
		for _, dir := range possiblePaths {
			path := filepath.Join(dir, filename)
			if _, err := os.Stat(path); err == nil {
				filePath = path
				break
			}
		}

		if filePath == "" {
			c.JSON(http.StatusNotFound, gin.H{"error": "文档文件不存在"})
			return
		}

		// 读取文件内容
		content, err := os.ReadFile(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "读取文件失败"})
			return
		}

		// 设置响应头
		c.Header("Content-Type", "text/markdown; charset=utf-8")
		c.Data(http.StatusOK, "text/markdown; charset=utf-8", content)
	})

	// 处理docs目录的文档文件
	r.engine.GET("/docs/:filename", func(c *gin.Context) {
		filename := c.Param("filename")

		// 安全检查：只允许.md文件
		if filepath.Ext(filename) != ".md" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "只允许访问.md文件"})
			return
		}

		// 尝试多个可能的docs目录路径
		possiblePaths := []string{
			"docs",
			"./docs",
			"../docs",
			"/www/wwwroot/axi-star-cloud/docs",
			"/www/wwwroot/redamancy.com.cn/docs",
		}

		var filePath string
		for _, dir := range possiblePaths {
			path := filepath.Join(dir, filename)
			if _, err := os.Stat(path); err == nil {
				filePath = path
				break
			}
		}

		if filePath == "" {
			c.JSON(http.StatusNotFound, gin.H{"error": "文档文件不存在"})
			return
		}

		// 读取文件内容
		content, err := os.ReadFile(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "读取文件失败"})
			return
		}

		// 设置响应头
		c.Header("Content-Type", "text/markdown; charset=utf-8")
		c.Data(http.StatusOK, "text/markdown; charset=utf-8", content)
	})

	// 新增：动态扫描所有文档的API端点
	r.engine.GET("/api/docs/list", func(c *gin.Context) {
		var docs []map[string]interface{}

		// 1. 首先添加根目录的文档（README.md 和 LICENSE）
		rootFiles := []string{"README.md", "LICENSE"}
		rootPaths := []string{
			".",
			"..",
			"./",
			"../",
			"/www/wwwroot/axi-star-cloud",
			"/www/wwwroot/redamancy.com.cn",
		}

		for _, filename := range rootFiles {
			var filePath string
			for _, dir := range rootPaths {
				path := filepath.Join(dir, filename)
				if _, err := os.Stat(path); err == nil {
					filePath = path
					break
				}
			}

			if filePath != "" {
				// 为根目录文件生成标题和图标
				title := generateRootDocTitle(filename)
				icon := generateRootDocIcon(filename)

				docs = append(docs, map[string]interface{}{
					"id":    filename,
					"title": title,
					"icon":  icon,
				})
			}
		}

		// 2. 然后添加docs目录的文档
		docsPaths := []string{
			"docs",
			"./docs",
			"../docs",
			"/www/wwwroot/axi-star-cloud/docs",
			"/www/wwwroot/redamancy.com.cn/docs",
		}

		var docsDir string
		for _, dir := range docsPaths {
			if _, err := os.Stat(dir); err == nil {
				docsDir = dir
				break
			}
		}

		if docsDir != "" {
			// 扫描docs目录中的所有.md文件
			files, err := os.ReadDir(docsDir)
			if err == nil {
				for _, file := range files {
					if !file.IsDir() && filepath.Ext(file.Name()) == ".md" {
						// 跳过INDEX.md，因为它应该作为隐藏的索引文件
						if file.Name() == "INDEX.md" {
							continue
						}

						// 从文件名生成标题和图标
						title := generateDocTitle(file.Name())
						icon := generateDocIcon(file.Name())

						docs = append(docs, map[string]interface{}{
							"id":    file.Name(),
							"title": title,
							"icon":  icon,
						})
					}
				}
			}
		}

		// 3. 按优先级排序：README.md第一，LICENSE第二，其他按字母顺序
		sort.Slice(docs, func(i, j int) bool {
			id1 := docs[i]["id"].(string)
			id2 := docs[j]["id"].(string)

			// README.md 排第一
			if id1 == "README.md" {
				return true
			}
			if id2 == "README.md" {
				return false
			}

			// LICENSE 排第二
			if id1 == "LICENSE" {
				return true
			}
			if id2 == "LICENSE" {
				return false
			}

			// 其他按字母顺序
			return id1 < id2
		})

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"docs":    docs,
		})
	})
}

// generateRootDocTitle 为根目录文档生成标题
func generateRootDocTitle(filename string) string {
	switch filename {
	case "README.md":
		return "项目概述"
	case "LICENSE":
		return "通行证"
	default:
		return filename
	}
}

// generateRootDocIcon 为根目录文档生成图标
func generateRootDocIcon(filename string) string {
	switch filename {
	case "README.md":
		return "📖"
	case "LICENSE":
		return "⚖️"
	default:
		return "📄"
	}
}

// generateDocTitle 根据文件名生成文档标题
func generateDocTitle(filename string) string {
	// 移除.md扩展名
	name := strings.TrimSuffix(filename, ".md")

	// 尝试从文档的front matter中读取标题
	title := extractTitleFromFrontMatter(filename)
	if title != "" {
		return title
	}

	// 预定义的标题映射（作为后备）
	titleMap := map[string]string{
		"INDEX":                         "文档索引",
		"README":                        "项目概述",
		"UPLOAD_LIMITS":                 "上传限制",
		"LICENSE":                       "许可证信息",
		"ENV_USAGE_EXAMPLES":            "环境使用示例",
		"CSS_README":                    "CSS样式文档",
		"HTML_README":                   "HTML文档",
		"API_README":                    "API接口文档",
		"AUTH_SYSTEM":                   "认证系统文档",
		"BACKEND_OPTIMIZATION":          "后端优化文档",
		"BACKEND_FURTHER_OPTIMIZATION":  "后端进一步优化",
		"FRONTEND_FURTHER_OPTIMIZATION": "前端进一步优化",
		"MAIN_SIMPLIFICATION":           "主要简化文档",
		"IS_ADMIN_REMOVAL_SUMMARY":      "is_admin移除总结",
		// 新增合并后的文档
		"BACKEND_OPTIMIZATION_GUIDE":  "后端优化完整指南",
		"FRONTEND_DEVELOPMENT_GUIDE":  "前端开发完整指南",
		"API_AND_AUTH_GUIDE":          "API和认证系统完整指南",
		"DEPLOYMENT_AND_CONFIG_GUIDE": "部署和配置完整指南",
		// 新增登录相关文档
		"LOGIN_DEBUG_GUIDE":     "登录调试指南",
		"LOGIN_DISPLAY_FIX":     "登录显示修复",
		"LOGIN_PERSISTENCE_FIX": "登录持久化修复",
		// 新增其他文档
		"JAVASCRIPT_STRUCTURE_GUIDE": "JavaScript目录结构指南",
		"UPDATE_LOG_SYSTEM_GUIDE":    "更新日志系统指南",
	}

	if title, exists := titleMap[name]; exists {
		return title
	}

	// 如果没有预定义标题，将下划线替换为空格并首字母大写
	title = strings.ReplaceAll(name, "_", " ")
	title = strings.Title(strings.ToLower(title))
	return title
}

// extractTitleFromFrontMatter 从文档的front matter中提取标题
func extractTitleFromFrontMatter(filename string) string {
	// 尝试多个可能的docs目录路径
	possiblePaths := []string{
		"docs",
		"./docs",
		"../docs",
		"/www/wwwroot/axi-star-cloud/docs",
		"/www/wwwroot/redamancy.com.cn/docs",
	}

	var filePath string
	for _, dir := range possiblePaths {
		path := filepath.Join(dir, filename)
		if _, err := os.Stat(path); err == nil {
			filePath = path
			break
		}
	}

	if filePath == "" {
		return ""
	}

	// 读取文件内容
	content, err := os.ReadFile(filePath)
	if err != nil {
		return ""
	}

	contentStr := string(content)

	// 查找front matter的开始和结束
	lines := strings.Split(contentStr, "\n")
	if len(lines) < 3 {
		return ""
	}

	// 检查第一行是否为front matter开始
	if strings.TrimSpace(lines[0]) != "---" {
		return ""
	}

	// 查找front matter结束
	frontMatterEnd := -1
	for i := 1; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) == "---" {
			frontMatterEnd = i
			break
		}
	}

	if frontMatterEnd == -1 {
		return ""
	}

	// 提取front matter内容
	frontMatterLines := lines[1:frontMatterEnd]

	// 查找title字段
	for _, line := range frontMatterLines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "title:") {
			title := strings.TrimSpace(strings.TrimPrefix(line, "title:"))
			return title
		}
	}

	return ""
}

// generateDocIcon 根据文件名生成文档图标
func generateDocIcon(filename string) string {
	// 移除.md扩展名
	name := strings.TrimSuffix(filename, ".md")

	// 预定义的图标映射
	iconMap := map[string]string{
		"INDEX":                         "📚",
		"README":                        "📖",
		"UPLOAD_LIMITS":                 "📋",
		"LICENSE":                       "⚖️",
		"ENV_USAGE_EXAMPLES":            "⚙️",
		"CSS_README":                    "🎨",
		"HTML_README":                   "🌐",
		"API_README":                    "🔌",
		"AUTH_SYSTEM":                   "🔐",
		"BACKEND_OPTIMIZATION":          "⚡",
		"BACKEND_FURTHER_OPTIMIZATION":  "🚀",
		"FRONTEND_FURTHER_OPTIMIZATION": "🎯",
		"MAIN_SIMPLIFICATION":           "📝",
		"IS_ADMIN_REMOVAL_SUMMARY":      "🗑️",
		// 新增合并后的文档
		"BACKEND_OPTIMIZATION_GUIDE":  "⚡",
		"FRONTEND_DEVELOPMENT_GUIDE":  "🎨",
		"API_AND_AUTH_GUIDE":          "🔌",
		"DEPLOYMENT_AND_CONFIG_GUIDE": "🚀",
	}

	if icon, exists := iconMap[name]; exists {
		return icon
	}

	// 默认图标
	return "📄"
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
