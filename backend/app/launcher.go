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
