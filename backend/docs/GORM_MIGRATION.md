# GORM 框架迁移说明

## 概述

已将 axi-star-cloud 后端从原生 SQL 迁移到 GORM 框架，简化了数据库操作并提高了开发效率。

## 已完成的工作

### 1. 依赖添加
- 添加了 `gorm.io/gorm v1.25.7`
- 添加了 `gorm.io/driver/mysql v1.5.4`

### 2. 模型更新
所有模型都已添加 GORM 标签：

#### User 模型
```go
type User struct {
    UUID         string     `gorm:"primaryKey;type:varchar(36)" json:"uuid"`
    Username     string     `gorm:"uniqueIndex;type:varchar(50);not null" json:"username"`
    Password     string     `gorm:"type:varchar(255);not null" json:"password"`
    Email        string     `gorm:"type:varchar(100)" json:"email"`
    Bio          string     `gorm:"type:text" json:"bio"`
    Avatar       string     `gorm:"type:varchar(255)" json:"avatar"`
    StorageLimit int64      `gorm:"type:bigint;default:1073741824" json:"storage_limit"`
    LastLoginTime *time.Time `gorm:"type:timestamp;null" json:"last_login_time,omitempty"`
    IsOnline     bool       `gorm:"type:boolean;default:false" json:"is_online"`
    CreatedAt    time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
    UpdatedAt    time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" json:"updated_at"`
}
```

#### File 模型
```go
type File struct {
    ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
    Name          string    `gorm:"type:varchar(255);not null" json:"name"`
    Size          int64     `gorm:"type:bigint;not null" json:"size"`
    Type          string    `gorm:"type:varchar(50);not null" json:"type"`
    Path          string    `gorm:"type:varchar(500);not null" json:"path"`
    UserID        string    `gorm:"type:varchar(50);not null;index" json:"user_id"`
    FolderID      *uint     `gorm:"index" json:"folder_id"`
    ThumbnailData string    `gorm:"type:longtext" json:"thumbnail_data,omitempty"`
    CreatedAt     time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
    UpdatedAt     time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" json:"updated_at"`
}
```

### 3. GORM 初始化功能

#### 数据库连接
```go
// InitGORM 初始化GORM连接
func InitGORM(configPath interface{}) (*gorm.DB, error) {
    // 配置GORM
    gormConfig := &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info), // 开发环境显示SQL
        NowFunc: func() time.Time {
            return time.Now()
        },
    }
    
    // 连接GORM
    gormDB, err := gorm.Open(mysql.Open(dbConfig.DSN), gormConfig)
    // ...
}
```

#### 自动迁移
```go
// InitializeGORM 使用GORM初始化数据库
func InitializeGORM() (*gorm.DB, error) {
    // 自动迁移所有模型
    err := db.AutoMigrate(
        &models.User{},
        &models.File{},
        &models.Folder{},
        &models.Document{},
        &models.UpdateLog{},
        &models.UrlFile{},
    )
    // ...
}
```

### 4. GORM Repository 实现

#### 用户仓库
```go
type GORMUserRepository struct {
    db *gorm.DB
}

func (r *GORMUserRepository) GetUserByUsername(username string) (*models.User, error) {
    var user models.User
    err := r.db.Where("username = ?", username).First(&user).Error
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, nil
        }
        return nil, err
    }
    return &user, nil
}
```

#### 文件仓库
```go
type GORMFileRepository struct {
    db *gorm.DB
}

func (r *GORMFileRepository) GetFilesByUserID(userID string, folderID *uint) ([]models.File, error) {
    var files []models.File
    query := r.db.Where("user_id = ?", userID)
    
    if folderID != nil {
        query = query.Where("folder_id = ?", *folderID)
    } else {
        query = query.Where("folder_id IS NULL")
    }
    
    err := query.Find(&files).Error
    return files, err
}
```

## 优势

### 1. 代码简化
- 自动处理 SQL 查询
- 自动处理类型转换
- 自动处理 NULL 值

### 2. 开发效率
- 减少样板代码
- 自动生成 SQL
- 更好的错误处理

### 3. 类型安全
- 编译时类型检查
- 自动字段映射
- 防止 SQL 注入

### 4. 功能丰富
- 自动迁移
- 关联查询
- 事务支持
- 钩子函数

## 使用方法

### 1. 初始化数据库
```go
gormDB, err := database.InitializeGORM()
if err != nil {
    log.Fatal(err)
}
```

### 2. 创建仓库
```go
userRepo := database.NewGORMUserRepository(gormDB)
fileRepo := database.NewGORMFileRepository(gormDB)
```

### 3. 执行操作
```go
// 创建用户
user := &models.User{
    UUID:     "550e8400-e29b-41d4-a716-446655440000",
    Username: "admin",
    Password: "123456",
}
err := userRepo.CreateUser(user)

// 查询用户
user, err := userRepo.GetUserByUsername("admin")

// 查询文件
files, err := fileRepo.GetFilesByUserID("user-uuid", nil)
```

## 注意事项

### 1. 类型兼容性
- 将 `int` 改为 `uint` 用于 ID 字段
- 将 `*string` 改为 `string` 用于可选字段
- 更新了所有相关的类型转换

### 2. 性能考虑
- GORM 在简单查询上性能良好
- 复杂查询仍可使用原生 SQL
- 连接池配置已优化

### 3. 迁移策略
- 保持向后兼容
- 渐进式迁移
- 可回滚到原生 SQL

## 下一步

1. **完成类型修复** - 修复剩余的类型错误
2. **更新处理器** - 使用 GORM Repository
3. **测试验证** - 确保功能正常
4. **性能优化** - 优化查询性能
5. **文档完善** - 更新 API 文档

## 总结

GORM 框架的集成大大简化了数据库操作，提高了开发效率，同时保持了代码的可读性和类型安全性。虽然还有一些类型错误需要修复，但整体架构已经完成，可以开始使用 GORM 进行开发。
