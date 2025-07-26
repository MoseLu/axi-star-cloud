package main

import (
	"fmt"
	"os"

	"backend/app"
	"backend/utils"
)

func main() {
	// 检查命令行参数
	if len(os.Args) > 1 && os.Args[1] == "--reset-db" {
		if err := utils.ResetUpdateLogsTable(); err != nil {
			fmt.Printf("❌ 重置数据库失败: %v\n", err)
			os.Exit(1)
		}
		return
	}

	// 启动应用
	launcher := app.NewLauncher()
	launcher.StartWithErrorHandling()
}
