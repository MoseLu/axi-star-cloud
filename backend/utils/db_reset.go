package utils

import (
	"backend/config"
)

// ResetUpdateLogsTable 重置update_logs表
func ResetUpdateLogsTable() error {
	db, err := config.InitDB(nil)
	if err != nil {
		return err
	}
	defer db.Close()

	// 删除update_logs表
	_, err = db.Exec("DROP TABLE IF EXISTS update_logs")
	if err != nil {
		return err
	}

	return nil
}
