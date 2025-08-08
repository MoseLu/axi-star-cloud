package main

import (
	"os"

	"backend/app"
	"backend/utils"
)

func main() {
	// 检查命令行参数
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "--reset-db":
			if err := utils.ResetUpdateLogsTable(); err != nil {
				os.Exit(1)
			}
			return
		case "--reset-all":
			if err := utils.ResetDatabase(); err != nil {
				os.Exit(1)
			}
			return
		}
	}

	// 启动应用
	launcher := app.NewLauncher()
	launcher.StartWithErrorHandling()
}
