/**
 * 配置热重载机制
 *
 * 提供配置文件的实时监控和热重载功能，包括：
 * - 文件监控
 * - 配置验证
 * - 安全重载
 * - 变更通知
 * - 回滚机制
 *
 * 该模块支持运行时配置更新，无需重启服务
 */

package config

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

// ConfigChangeCallback 配置变更回调函数
type ConfigChangeCallback func(oldConfig, newConfig *Config) error

// HotReloadManager 热重载管理器
type HotReloadManager struct {
	configPath    string
	currentConfig *Config
	callbacks     []ConfigChangeCallback
	mutex         sync.RWMutex
	stopChan      chan bool
	isRunning     bool
	lastModTime   time.Time
	checkInterval time.Duration
	backupConfig  *Config
}

// NewHotReloadManager 创建热重载管理器
func NewHotReloadManager(configPath string) *HotReloadManager {
	return &HotReloadManager{
		configPath:    configPath,
		callbacks:     make([]ConfigChangeCallback, 0),
		stopChan:      make(chan bool),
		checkInterval: 5 * time.Second, // 每5秒检查一次
	}
}

// Start 启动配置监控
func (hrm *HotReloadManager) Start() error {
	hrm.mutex.Lock()
	defer hrm.mutex.Unlock()

	if hrm.isRunning {
		return fmt.Errorf("配置监控已在运行")
	}

	// 加载初始配置
	if err := hrm.loadConfig(); err != nil {
		return fmt.Errorf("加载初始配置失败: %v", err)
	}

	hrm.isRunning = true

	// 启动监控goroutine
	go hrm.monitorConfig()

	log.Printf("✅ 配置热重载监控已启动，监控文件: %s", hrm.configPath)
	return nil
}

// Stop 停止配置监控
func (hrm *HotReloadManager) Stop() {
	hrm.mutex.Lock()
	defer hrm.mutex.Unlock()

	if !hrm.isRunning {
		return
	}

	close(hrm.stopChan)
	hrm.isRunning = false
	log.Println("🛑 配置热重载监控已停止")
}

// AddCallback 添加配置变更回调
func (hrm *HotReloadManager) AddCallback(callback ConfigChangeCallback) {
	hrm.mutex.Lock()
	defer hrm.mutex.Unlock()

	hrm.callbacks = append(hrm.callbacks, callback)
}

// GetCurrentConfig 获取当前配置
func (hrm *HotReloadManager) GetCurrentConfig() *Config {
	hrm.mutex.RLock()
	defer hrm.mutex.RUnlock()

	return hrm.currentConfig
}

// monitorConfig 监控配置文件
func (hrm *HotReloadManager) monitorConfig() {
	ticker := time.NewTicker(hrm.checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := hrm.checkConfigChange(); err != nil {
				log.Printf("⚠️ 检查配置变更时出错: %v", err)
			}
		case <-hrm.stopChan:
			return
		}
	}
}

// checkConfigChange 检查配置变更
func (hrm *HotReloadManager) checkConfigChange() error {
	// 检查文件是否存在
	if _, err := os.Stat(hrm.configPath); os.IsNotExist(err) {
		return fmt.Errorf("配置文件不存在: %s", hrm.configPath)
	}

	// 检查文件修改时间
	fileInfo, err := os.Stat(hrm.configPath)
	if err != nil {
		return fmt.Errorf("获取文件信息失败: %v", err)
	}

	modTime := fileInfo.ModTime()
	if modTime.Equal(hrm.lastModTime) {
		return nil // 文件未修改
	}

	log.Printf("📝 检测到配置文件变更: %s", hrm.configPath)

	// 备份当前配置
	hrm.backupConfig = hrm.currentConfig

	// 尝试加载新配置
	newConfig, err := hrm.loadConfigFromFile()
	if err != nil {
		log.Printf("❌ 加载新配置失败: %v", err)
		return err
	}

	// 验证新配置
	if err := hrm.validateConfig(newConfig); err != nil {
		log.Printf("❌ 新配置验证失败: %v", err)
		return err
	}

	// 应用新配置
	if err := hrm.applyConfigChange(newConfig); err != nil {
		log.Printf("❌ 应用新配置失败: %v", err)
		// 回滚到备份配置
		hrm.rollbackConfig()
		return err
	}

	hrm.lastModTime = modTime
	log.Printf("✅ 配置热重载成功")

	return nil
}

// loadConfig 加载配置
func (hrm *HotReloadManager) loadConfig() error {
	config, err := hrm.loadConfigFromFile()
	if err != nil {
		return err
	}

	hrm.currentConfig = config
	hrm.lastModTime = time.Now()

	return nil
}

// loadConfigFromFile 从文件加载配置
func (hrm *HotReloadManager) loadConfigFromFile() (*Config, error) {
	data, err := ioutil.ReadFile(hrm.configPath)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %v", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %v", err)
	}

	return &config, nil
}

// validateConfig 验证配置
func (hrm *HotReloadManager) validateConfig(config *Config) error {
	// 验证服务器配置
	if config.Server.Port == "" {
		return fmt.Errorf("服务器端口不能为空")
	}

	// 验证数据库配置
	if config.Database.Host == "" || config.Database.Port == "" {
		return fmt.Errorf("数据库配置不完整")
	}

	// 验证JWT配置
	if config.JWT.Secret == "" {
		return fmt.Errorf("JWT密钥不能为空")
	}

	return nil
}

// applyConfigChange 应用配置变更
func (hrm *HotReloadManager) applyConfigChange(newConfig *Config) error {
	hrm.mutex.Lock()
	defer hrm.mutex.Unlock()

	oldConfig := hrm.currentConfig

	// 调用所有回调函数
	for _, callback := range hrm.callbacks {
		if err := callback(oldConfig, newConfig); err != nil {
			return fmt.Errorf("配置变更回调执行失败: %v", err)
		}
	}

	// 更新当前配置
	hrm.currentConfig = newConfig

	return nil
}

// rollbackConfig 回滚配置
func (hrm *HotReloadManager) rollbackConfig() {
	if hrm.backupConfig != nil {
		hrm.mutex.Lock()
		hrm.currentConfig = hrm.backupConfig
		hrm.mutex.Unlock()
		log.Println("🔄 配置已回滚到备份版本")
	}
}

// SetCheckInterval 设置检查间隔
func (hrm *HotReloadManager) SetCheckInterval(interval time.Duration) {
	hrm.checkInterval = interval
}

// GetStats 获取监控统计信息
func (hrm *HotReloadManager) GetStats() map[string]interface{} {
	hrm.mutex.RLock()
	defer hrm.mutex.RUnlock()

	return map[string]interface{}{
		"is_running":     hrm.isRunning,
		"config_path":    hrm.configPath,
		"check_interval": hrm.checkInterval,
		"last_mod_time":  hrm.lastModTime,
		"callback_count": len(hrm.callbacks),
		"has_backup":     hrm.backupConfig != nil,
	}
}

// ExportConfig 导出当前配置
func (hrm *HotReloadManager) ExportConfig() ([]byte, error) {
	hrm.mutex.RLock()
	defer hrm.mutex.RUnlock()

	if hrm.currentConfig == nil {
		return nil, fmt.Errorf("当前配置为空")
	}

	return yaml.Marshal(hrm.currentConfig)
}

// ExportConfigAsJSON 导出配置为JSON
func (hrm *HotReloadManager) ExportConfigAsJSON() ([]byte, error) {
	hrm.mutex.RLock()
	defer hrm.mutex.RUnlock()

	if hrm.currentConfig == nil {
		return nil, fmt.Errorf("当前配置为空")
	}

	return json.MarshalIndent(hrm.currentConfig, "", "  ")
}

// CreateBackup 创建配置备份
func (hrm *HotReloadManager) CreateBackup() error {
	hrm.mutex.Lock()
	defer hrm.mutex.Unlock()

	if hrm.currentConfig == nil {
		return fmt.Errorf("当前配置为空")
	}

	backupPath := hrm.configPath + ".backup." + time.Now().Format("20060102_150405")

	data, err := yaml.Marshal(hrm.currentConfig)
	if err != nil {
		return fmt.Errorf("序列化配置失败: %v", err)
	}

	if err := ioutil.WriteFile(backupPath, data, 0644); err != nil {
		return fmt.Errorf("写入备份文件失败: %v", err)
	}

	log.Printf("✅ 配置备份已创建: %s", backupPath)
	return nil
}
