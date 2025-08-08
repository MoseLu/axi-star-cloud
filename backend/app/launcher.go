package app

import (
	"os"
)

// Launcher 应用启动器
type Launcher struct {
	app *App
}

// NewLauncher 创建新的启动器实例
func NewLauncher() *Launcher {
	return &Launcher{
		app: NewApp(),
	}
}

// InitDatabaseOnly 只初始化数据库
func (l *Launcher) InitDatabaseOnly() error {
	// 只初始化数据库部分
	db, err := l.app.InitializeDatabase()
	if err != nil {
		return err
	}
	l.app.DB = db
	return nil
}

// StartWithErrorHandling 启动应用并处理错误
func (l *Launcher) StartWithErrorHandling() {
	// 初始化应用
	if err := l.app.Initialize(); err != nil {
		os.Exit(1)
	}
	defer l.app.Close()

	// 启动应用
	if err := l.app.Run(); err != nil {
		os.Exit(1)
	}
}
