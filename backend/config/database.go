package config

import (
	"database/sql"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"strings"

	_ "github.com/go-sql-driver/mysql"
	"gopkg.in/yaml.v3"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Config 完整配置结构体
type Config struct {
	Server struct {
		Port        string   `yaml:"port"`
		Host        string   `yaml:"host"`
		CorsOrigins []string `yaml:"cors_origins"`
	} `yaml:"server"`

	Database struct {
		Host     string `yaml:"host"`
		Port     string `yaml:"port"`
		User     string `yaml:"user"`
		Password string `yaml:"password"`
		Name     string `yaml:"name"`
	} `yaml:"database"`

	LogsDatabase struct {
		Host     string `yaml:"host"`
		Port     string `yaml:"port"`
		User     string `yaml:"user"`
		Password string `yaml:"password"`
		Name     string `yaml:"name"`
	} `yaml:"logs_database"`

	JWT struct {
		Secret string `yaml:"secret"`
	} `yaml:"jwt"`

	Deployment struct {
		Type       string `yaml:"type"`
		Domain     string `yaml:"domain"`
		StaticPath string `yaml:"static_path"`
		UploadPath string `yaml:"upload_path"`
	} `yaml:"deployment"`
}

// DBConfig 数据库配置结构体（保持向后兼容）
type DBConfig struct {
	Driver string `yaml:"driver"`
	DSN    string `yaml:"dsn"`
}

// 可能的配置文件路径
var configPaths = []string{
	"config/config-prod.yaml", // 优先使用生产环境配置
	"backend/config/config-prod.yaml",
	"./config/config-prod.yaml",
	"./backend/config/config-prod.yaml",
	"../config/config-prod.yaml",
	"../backend/config/config-prod.yaml",
	"config/config.yaml", // 备用配置
	"backend/config/config.yaml",
	"./config/config.yaml",
	"./backend/config/config.yaml",
	"../config/config.yaml",
	"../backend/config/config.yaml",
}

// findConfigFile 查找配置文件
func findConfigFile() (string, error) {
	for _, path := range configPaths {
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
	}
	return "", errors.New("找不到配置文件")
}

// LoadConfig 读取完整配置
func LoadConfig(path string) (*Config, error) {
	if path == "" {
		var err error
		path, err = findConfigFile()
		if err != nil {
			return nil, err
		}
	}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	
	// 尝试从动态端口配置文件读取端口
	if dynamicPort := getDynamicPort(); dynamicPort != "" {
		cfg.Server.Port = dynamicPort
		fmt.Printf("🔧 使用动态分配的端口: %s\n", dynamicPort)
	}
	
	return &cfg, nil
}

// getDynamicPort 从动态端口配置文件读取端口
func getDynamicPort() string {
	// 首先检查环境变量
	if envPort := os.Getenv("SERVICE_PORT"); envPort != "" {
		return envPort
	}
	
	// 检查动态端口配置文件
	configFile := "/srv/port-config.yml"
	if _, err := os.Stat(configFile); err == nil {
		data, err := ioutil.ReadFile(configFile)
		if err == nil {
			var portConfig struct {
				Projects map[string]struct {
					Port string `yaml:"port"`
				} `yaml:"projects"`
			}
			if err := yaml.Unmarshal(data, &portConfig); err == nil {
				// 查找当前项目的端口（通过项目名称或默认）
				for projectName, project := range portConfig.Projects {
					if projectName == "axi-star-cloud" || projectName == "star-cloud" {
						if project.Port != "" {
							return project.Port
						}
					}
				}
			}
		}
	}
	
	return ""
}

// LoadDBConfig 读取数据库配置（保持向后兼容）
func LoadDBConfig(path string) (*DBConfig, error) {
	cfg, err := LoadConfig(path)
	if err != nil {
		return nil, err
	}

	// 构建DSN
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
	)

	return &DBConfig{
		Driver: "mysql",
		DSN:    dsn,
	}, nil
}

// InitDB 初始化数据库连接池，参数可为nil或配置文件路径
func InitDB(configPath interface{}) (*sql.DB, error) {
	var dbConfig *DBConfig
	var err error
	if configPath == nil {
		dbConfig, err = LoadDBConfig("")
	} else if path, ok := configPath.(string); ok {
		dbConfig, err = LoadDBConfig(path)
	} else {
		return nil, errors.New("无效的数据库配置参数")
	}
	if err != nil {
		return nil, err
	}

	// 获取配置信息
	cfg, err := LoadConfig("")
	if err != nil {
		return nil, fmt.Errorf("加载配置失败: %v", err)
	}

	// 构建服务器连接DSN（不包含数据库名）
	serverDSN := fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
	)

	// 连接到MySQL服务器
	serverDB, err := sql.Open("mysql", serverDSN)
	if err != nil {
		return nil, fmt.Errorf("连接MySQL服务器失败: %v", err)
	}
	defer serverDB.Close()

	// 测试服务器连接
	if err := serverDB.Ping(); err != nil {
		return nil, fmt.Errorf("MySQL服务器连接测试失败: %v", err)
	}

	// 检查数据库是否存在
	var exists int
	err = serverDB.QueryRow("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = ?", cfg.Database.Name).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("检查数据库存在性失败: %v", err)
	}

	// 如果数据库不存在，创建它
	if exists == 0 {
		fmt.Printf("数据库 %s 不存在，正在创建...\n", cfg.Database.Name)
		_, err = serverDB.Exec(fmt.Sprintf("CREATE DATABASE `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", cfg.Database.Name))
		if err != nil {
			return nil, fmt.Errorf("创建数据库失败: %v", err)
		}
		fmt.Printf("数据库 %s 创建成功\n", cfg.Database.Name)
	}

	// 连接到指定数据库
	db, err := sql.Open(dbConfig.Driver, dbConfig.DSN)
	if err != nil {
		return nil, err
	}

	// 配置连接池参数
	db.SetMaxOpenConns(25)                 // 最大连接数
	db.SetMaxIdleConns(10)                 // 最大空闲连接数
	db.SetConnMaxLifetime(5 * time.Minute) // 连接最大生命周期
	db.SetConnMaxIdleTime(3 * time.Minute) // 空闲连接最大生命周期

	// 测试连接（容错：若报 Unknown database，则尝试创建后重连）
	if err := db.Ping(); err != nil {
		db.Close()
		// 捕获“Unknown database”错误并自愈
		if strings.Contains(strings.ToLower(err.Error()), "unknown database") {
			// 使用服务器连接再次尝试创建数据库
			serverDB2, err2 := sql.Open("mysql", serverDSN)
			if err2 == nil {
				defer serverDB2.Close()
				if pingErr := serverDB2.Ping(); pingErr == nil {
					_, _ = serverDB2.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", cfg.Database.Name))
				}
			}
			// 重连数据库
			db, err = sql.Open(dbConfig.Driver, dbConfig.DSN)
			if err != nil {
				return nil, fmt.Errorf("数据库连接测试失败: %v", err)
			}
			if ping2 := db.Ping(); ping2 != nil {
				db.Close()
				return nil, fmt.Errorf("数据库连接测试失败: %v", ping2)
			}
		} else {
			return nil, fmt.Errorf("数据库连接测试失败: %v", err)
		}
	}

	return db, nil
}

// InitGORM 初始化GORM连接
func InitGORM(configPath interface{}) (*gorm.DB, error) {
	var dbConfig *DBConfig
	var err error
	if configPath == nil {
		dbConfig, err = LoadDBConfig("")
	} else if path, ok := configPath.(string); ok {
		dbConfig, err = LoadDBConfig(path)
	} else {
		return nil, errors.New("无效的数据库配置参数")
	}
	if err != nil {
		return nil, err
	}

	// 配置GORM
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // 开发环境显示SQL
		NowFunc: func() time.Time {
			return time.Now()
		},
	}

	// 连接GORM
	gormDB, err := gorm.Open(mysql.Open(dbConfig.DSN), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("GORM连接失败: %v", err)
	}

	// 获取底层的sql.DB进行连接池配置
	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, fmt.Errorf("获取底层数据库连接失败: %v", err)
	}

	// 配置连接池参数
	sqlDB.SetMaxOpenConns(25)                 // 最大连接数
	sqlDB.SetMaxIdleConns(10)                 // 最大空闲连接数
	sqlDB.SetConnMaxLifetime(5 * time.Minute) // 连接最大生命周期
	sqlDB.SetConnMaxIdleTime(3 * time.Minute) // 空闲连接最大生命周期

	// 测试连接
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("GORM连接测试失败: %v", err)
	}

	return gormDB, nil
}
