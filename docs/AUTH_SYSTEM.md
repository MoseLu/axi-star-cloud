# 认证系统重构文档

## 概述

本次重构将原来的单一 `auth.go` 文件拆分为多个专门的文件，采用分层架构设计，提高了代码的可维护性、可测试性和可扩展性。

## 架构设计

### 分层架构

```
┌─────────────────┐
│   控制器层       │  Controllers
│  (Controllers)  │  处理HTTP请求和响应
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   服务层         │  Services
│   (Services)    │  处理业务逻辑
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   中间件层       │  Middleware
│  (Middleware)   │  处理权限验证
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   工具层         │  Utils
│    (Utils)      │  提供辅助功能
└─────────────────┘
```

### 文件结构

```
backend/
├── controllers/
│   └── auth_controller.go      # 认证控制器
├── services/
│   └── auth_service.go         # 认证服务层
├── middleware/
│   └── auth_middleware.go      # 认证中间件
├── utils/
│   ├── auth_utils.go           # 认证工具函数
│   ├── auth_logger.go          # 认证日志记录器
│   └── cookie.go               # Cookie管理器
├── config/
│   └── auth_config.go          # 认证配置文件
├── routes/
│   └── auth_routes.go          # 认证路由
└── handlers/
    └── auth.go                 # 兼容性处理器
```

## 核心组件

### 1. 认证服务层 (AuthService)

**文件**: `backend/services/auth_service.go`

**职责**:
- 处理用户注册业务逻辑
- 处理用户登录业务逻辑
- 处理Token验证和刷新
- 处理管理员功能

**主要方法**:
```go
func (s *AuthService) Register(registerData models.RegisterRequest) (*models.RegisterResponse, error)
func (s *AuthService) Login(loginData models.LoginRequest) (*models.LoginResponse, error)
func (s *AuthService) ValidateUserToken(accessToken string) (*models.TokenValidationResponse, error)
func (s *AuthService) RefreshUserToken(refreshToken string) (*models.TokenRefreshResponse, error)
```

### 2. 认证控制器 (AuthController)

**文件**: `backend/controllers/auth_controller.go`

**职责**:
- 处理HTTP请求和响应
- 调用服务层处理业务逻辑
- 设置和清除Cookie
- 格式化响应数据

**主要方法**:
```go
func (ac *AuthController) Register(c *gin.Context)
func (ac *AuthController) Login(c *gin.Context)
func (ac *AuthController) Logout(c *gin.Context)
func (ac *AuthController) RefreshToken(c *gin.Context)
```

### 3. 认证中间件 (AuthMiddleware)

**文件**: `backend/middleware/auth_middleware.go`

**职责**:
- 验证用户权限
- 验证管理员权限
- 注入用户信息到上下文
- 提供可选的认证中间件

**主要方法**:
```go
func (am *AuthMiddleware) CheckUserPermission() gin.HandlerFunc
func (am *AuthMiddleware) CheckAdminPermission() gin.HandlerFunc
func (am *AuthMiddleware) OptionalAuth() gin.HandlerFunc
```

### 4. Cookie管理器 (CookieManager)

**文件**: `backend/utils/cookie.go`

**职责**:
- 统一管理Cookie设置
- 设置用户Token Cookie
- 设置管理员Token Cookie
- 清除所有Token Cookie

**主要方法**:
```go
func (cm *CookieManager) SetUserTokens(w http.ResponseWriter, tokens models.TokenPair)
func (cm *CookieManager) SetAdminTokens(w http.ResponseWriter, adminTokens models.AdminTokenPair)
func (cm *CookieManager) ClearAllTokens(w http.ResponseWriter)
```

### 5. 认证工具函数 (AuthUtils)

**文件**: `backend/utils/auth_utils.go`

**职责**:
- 密码验证和哈希
- 用户名验证
- 邮箱验证
- 权限检查
- 用户信息格式化

**主要功能**:
```go
func (pv *PasswordValidator) ValidatePassword(password string) error
func (uv *UsernameValidator) ValidateUsername(username string) error
func (ev *EmailValidator) ValidateEmail(email string) error
func HashPassword(password string) string
func IsAdminUser(username string) bool
```

### 6. 认证日志记录器 (AuthLogger)

**文件**: `backend/utils/auth_logger.go`

**职责**:
- 记录用户登录/注册/登出日志
- 记录Token验证和刷新日志
- 记录权限检查日志
- 记录安全事件日志
- 记录管理员操作日志

**主要方法**:
```go
func (al *AuthLogger) LogUserLogin(username, userUUID string, success bool, ipAddress string)
func (al *AuthLogger) LogTokenValidation(userUUID, tokenType string, success bool, ipAddress string)
func (al *AuthLogger) LogSecurityEvent(eventType, username, userUUID, details string, ipAddress string)
```

### 7. 认证配置文件 (AuthConfig)

**文件**: `backend/config/auth_config.go`

**职责**:
- 管理Token配置
- 管理密码策略配置
- 管理用户验证配置
- 管理安全配置

**配置项**:
```go
type AuthConfig struct {
    TokenConfig           TokenConfig           `yaml:"token"`
    PasswordConfig        PasswordConfig        `yaml:"password"`
    UserValidationConfig  UserValidationConfig  `yaml:"user_validation"`
    SecurityConfig        SecurityConfig        `yaml:"security"`
}
```

## 使用示例

### 1. 在路由中使用

```go
// 在 main.go 或路由文件中
func setupRoutes(router *gin.Engine, userRepo *database.UserRepository) {
    // 创建认证服务
    authService := services.NewAuthService(userRepo)
    
    // 创建认证控制器
    authController := controllers.NewAuthController(authService)
    
    // 创建认证中间件
    authMiddleware := middleware.NewAuthMiddleware(userRepo)
    
    // 设置路由
    auth := router.Group("/api/auth")
    {
        // 公开路由
        auth.POST("/register", authController.Register)
        auth.POST("/login", authController.Login)
        auth.POST("/logout", authController.Logout)
        
        // 需要用户认证的路由
        userAuth := auth.Group("/user")
        userAuth.Use(authMiddleware.CheckUserPermission())
        {
            // 用户相关路由
        }
        
        // 需要管理员认证的路由
        adminAuth := auth.Group("/admin")
        adminAuth.Use(authMiddleware.CheckAdminPermission())
        {
            adminAuth.GET("/users", authController.GetAllUsers)
            adminAuth.PUT("/users/storage", authController.UpdateUserStorage)
        }
    }
}
```

### 2. 使用认证工具函数

```go
// 密码验证
passwordValidator := utils.NewPasswordValidator()
err := passwordValidator.ValidatePassword("MyPassword123")

// 用户名验证
usernameValidator := utils.NewUsernameValidator()
err := usernameValidator.ValidateUsername("john_doe")

// 邮箱验证
emailValidator := utils.NewEmailValidator()
err := emailValidator.ValidateEmail("john@example.com")

// 密码哈希
hashedPassword := utils.HashPassword("MyPassword123")

// 权限检查
isAdmin := utils.IsAdminUser("Mose")
```

### 3. 使用认证日志记录器

```go
// 创建日志记录器
authLogger := utils.NewAuthLogger()

// 记录用户登录
authLogger.LogUserLogin("john_doe", "user-uuid", true, "192.168.1.1")

// 记录Token验证
authLogger.LogTokenValidation("user-uuid", "access_token", true, "192.168.1.1")

// 记录安全事件
authLogger.LogSecurityEvent("failed_login", "john_doe", "user-uuid", "Invalid password", "192.168.1.1")
```

## 配置说明

### Token配置

```yaml
token:
  access_token_ttl: "15m"           # 普通用户访问token过期时间
  refresh_token_ttl: "168h"         # 普通用户刷新token过期时间 (7天)
  admin_access_token_ttl: "30m"     # 管理员访问token过期时间
  admin_refresh_token_ttl: "24h"    # 管理员刷新token过期时间
  secret_key: "your-secret-key"     # 普通用户token密钥
  admin_secret_key: "admin-secret"  # 管理员token密钥
```

### 密码策略配置

```yaml
password:
  min_length: 8              # 最小长度
  max_length: 128            # 最大长度
  require_uppercase: true    # 要求大写字母
  require_lowercase: true    # 要求小写字母
  require_number: true       # 要求数字
  require_special: false     # 要求特殊字符
```

### 用户验证配置

```yaml
user_validation:
  username_min_length: 3     # 用户名最小长度
  username_max_length: 20    # 用户名最大长度
  allow_empty_email: true    # 允许邮箱为空
  validate_email: true       # 验证邮箱格式
```

### 安全配置

```yaml
security:
  cookie_domain: ""          # Cookie域名
  cookie_secure: false       # Cookie安全标志
  cookie_same_site: "StrictMode"  # Cookie SameSite设置
  enable_password_hashing: true    # 启用密码哈希
  password_hash_algorithm: "md5"   # 密码哈希算法
  enable_login_attempt_limit: false # 启用登录尝试限制
  max_login_attempts: 5      # 最大登录尝试次数
  login_lockout_duration: "15m"    # 登录锁定时间
```

## 迁移指南

### 从旧版本迁移

1. **更新导入路径**:
   ```go
   // 旧版本
   import "backend/handlers"
   
   // 新版本
   import (
       "backend/controllers"
       "backend/services"
       "backend/middleware"
   )
   ```

2. **更新处理器创建**:
   ```go
   // 旧版本
   authHandler := handlers.NewAuthHandler(userRepo)
   
   // 新版本
   authService := services.NewAuthService(userRepo)
   authController := controllers.NewAuthController(authService)
   authMiddleware := middleware.NewAuthMiddleware(userRepo)
   ```

3. **更新中间件使用**:
   ```go
   // 旧版本
   router.Use(authHandler.CheckUserPermission())
   
   // 新版本
   router.Use(authMiddleware.CheckUserPermission())
   ```

## 优势

### 1. 代码组织
- **单一职责**: 每个文件都有明确的职责
- **高内聚低耦合**: 组件之间依赖关系清晰
- **易于维护**: 修改某个功能只需要修改对应的文件

### 2. 可测试性
- **单元测试**: 每个组件都可以独立测试
- **模拟测试**: 可以轻松模拟依赖组件
- **集成测试**: 可以测试组件间的交互

### 3. 可扩展性
- **新功能**: 可以轻松添加新的认证功能
- **新验证器**: 可以添加新的密码或用户名验证器
- **新日志**: 可以添加新的日志记录功能

### 4. 配置管理
- **集中配置**: 所有认证相关配置都在一个地方
- **环境适配**: 可以为不同环境设置不同配置
- **动态配置**: 支持运行时配置更新

## 注意事项

1. **向后兼容**: 保留了原有的 `handlers/auth.go` 作为兼容性层
2. **性能考虑**: 新增的日志记录功能在生产环境中应该考虑性能影响
3. **安全考虑**: 密码哈希算法应该使用更安全的算法（如bcrypt）
4. **配置管理**: 生产环境中应该从配置文件读取配置，而不是硬编码

## 未来改进

1. **密码安全**: 实现更安全的密码哈希算法
2. **会话管理**: 添加会话管理和黑名单功能
3. **审计日志**: 实现更详细的审计日志系统
4. **配置热更新**: 支持配置的热更新功能
5. **监控指标**: 添加认证相关的监控指标 