package config

import (
	"database/sql"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"gopkg.in/yaml.v3"
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
	return &cfg, nil
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

	// 连接数据库
	db, err := sql.Open(dbConfig.Driver, dbConfig.DSN)
	if err != nil {
		return nil, err
	}

	// 配置连接池参数
	db.SetMaxOpenConns(25)                 // 最大连接数
	db.SetMaxIdleConns(10)                 // 最大空闲连接数
	db.SetConnMaxLifetime(5 * time.Minute) // 连接最大生命周期
	db.SetConnMaxIdleTime(3 * time.Minute) // 空闲连接最大生命周期

	// 测试连接
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("数据库连接测试失败: %v", err)
	}

	return db, nil
}
