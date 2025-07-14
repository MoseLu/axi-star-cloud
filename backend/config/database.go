package config

import (
	"database/sql"
	"errors"
	"io/ioutil"

	_ "github.com/go-sql-driver/mysql"
	"gopkg.in/yaml.v3"
)

// DBConfig 数据库配置结构体
type DBConfig struct {
	Driver string `yaml:"driver"`
	DSN    string `yaml:"dsn"`
}

var defaultConfigPath = "config/config.yaml"

// LoadDBConfig 读取数据库配置
func LoadDBConfig(path string) (*DBConfig, error) {
	if path == "" {
		path = defaultConfigPath
	}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg DBConfig
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
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
	return sql.Open(dbConfig.Driver, dbConfig.DSN)
}
