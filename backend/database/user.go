package database

import (
	"database/sql"
	"log"
	"strings"
	"time"

	"backend/models"
)

// UserRepository 用户数据仓库
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository 创建用户仓库实例
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser 创建新用户
func (r *UserRepository) CreateUser(user *models.User) error {
	query := `INSERT INTO user (uuid, username, password, email, bio, avatar, storage_limit, created_at, updated_at)
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, user.UUID, user.Username, user.Password, user.Email, user.Bio, user.Avatar, user.StorageLimit, user.CreatedAt, user.UpdatedAt)
	return err
}

// GetUserByUsername 根据用户名获取用户
func (r *UserRepository) GetUserByUsername(username string) (*models.User, error) {
	query := `SELECT uuid, username, password, email, bio, avatar, storage_limit, last_login_time, is_online, created_at, updated_at
			  FROM user WHERE username = ?`

	var user models.User
	var lastLoginTime sql.NullTime
	var email, bio, avatar sql.NullString

	err := r.db.QueryRow(query, username).Scan(
		&user.UUID, &user.Username, &user.Password, &email, &bio, &avatar,
		&user.StorageLimit, &lastLoginTime, &user.IsOnline,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		// 自愈：先进行严格的只读检测，只有在确实异常时才进行初始化
		if strings.Contains(err.Error(), "Error 1146") || strings.Contains(strings.ToLower(err.Error()), "doesn't exist") {
			log.Printf("⚠️ 检测到可能的表不存在错误，进行严格的只读检测...")

			// 使用安全的数据库初始化器进行只读检测
			initializer := NewSafeDatabaseInitializer()

			// 先连接数据库
			if connectErr := initializer.ConnectDatabase(); connectErr != nil {
				log.Printf("❌ 数据库连接失败: %v", connectErr)
				return nil, err
			}

			// 执行严格的只读检测
			if checkErr := initializer.PerformReadOnlyCheck(); checkErr != nil {
				log.Printf("⚠️ 只读检测发现异常: %v", checkErr)
				log.Println("🔧 开始执行安全初始化...")

				// 只有在检测到异常时才执行初始化
				if initErr := initializer.PerformIncrementalUpdate(); initErr != nil {
					log.Printf("❌ 安全初始化失败: %v", initErr)
					return nil, err
				}

				// 重试一次查询
				retryErr := r.db.QueryRow(query, username).Scan(
					&user.UUID, &user.Username, &user.Password, &email, &bio, &avatar,
					&user.StorageLimit, &lastLoginTime, &user.IsOnline,
					&user.CreatedAt, &user.UpdatedAt,
				)
				if retryErr == nil {
					if email.Valid {
						user.Email = email.String
					}
					if bio.Valid {
						user.Bio = bio.String
					}
					if avatar.Valid {
						user.Avatar = avatar.String
					}
					if lastLoginTime.Valid {
						user.LastLoginTime = &lastLoginTime.Time
					}
					log.Printf("✅ 数据库安全初始化成功，用户查询重试成功")
					return &user, nil
				} else {
					log.Printf("⚠️ 数据库初始化后重试查询仍然失败: %v", retryErr)
				}
			} else {
				log.Printf("✅ 只读检测通过，数据库状态正常，原始错误可能是其他原因")
			}
		}
		return nil, err
	}

	// 处理可能为NULL的字段
	if email.Valid {
		user.Email = email.String
	}
	if bio.Valid {
		user.Bio = bio.String
	}
	if avatar.Valid {
		user.Avatar = avatar.String
	}
	if lastLoginTime.Valid {
		user.LastLoginTime = &lastLoginTime.Time
	}

	return &user, nil
}

// GetUserByUUID 根据UUID获取用户
func (r *UserRepository) GetUserByUUID(uuid string) (*models.User, error) {
	query := `SELECT uuid, username, password, email, bio, avatar, storage_limit, last_login_time, is_online, created_at, updated_at
			  FROM user WHERE uuid = ?`

	var user models.User
	var lastLoginTime sql.NullTime
	var email, bio, avatar sql.NullString

	err := r.db.QueryRow(query, uuid).Scan(
		&user.UUID, &user.Username, &user.Password, &email, &bio, &avatar,
		&user.StorageLimit, &lastLoginTime, &user.IsOnline,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// 处理可能为NULL的字段
	if email.Valid {
		user.Email = email.String
	}
	if bio.Valid {
		user.Bio = bio.String
	}
	if avatar.Valid {
		user.Avatar = avatar.String
	}
	if lastLoginTime.Valid {
		user.LastLoginTime = &lastLoginTime.Time
	}

	return &user, nil
}

// GetUserByID 根据ID获取用户（别名方法）
func (r *UserRepository) GetUserByID(id string) (*models.User, error) {
	return r.GetUserByUUID(id)
}

// GetAllUsers 获取所有用户（管理员功能）
func (r *UserRepository) GetAllUsers() ([]*models.User, error) {
	query := `SELECT uuid, username, email, bio, avatar, storage_limit, last_login_time, is_online, created_at, updated_at
			  FROM user 
			  ORDER BY 
			    CASE WHEN username = 'Mose' THEN 0 ELSE 1 END,
			    created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		var user models.User
		var lastLoginTime sql.NullTime
		var email, bio, avatar sql.NullString

		err := rows.Scan(
			&user.UUID, &user.Username, &email, &bio, &avatar,
			&user.StorageLimit, &lastLoginTime, &user.IsOnline,
			&user.CreatedAt, &user.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		// 处理可能为NULL的字段
		if email.Valid {
			user.Email = email.String
		}
		if bio.Valid {
			user.Bio = bio.String
		}
		if avatar.Valid {
			user.Avatar = avatar.String
		}
		if lastLoginTime.Valid {
			user.LastLoginTime = &lastLoginTime.Time
		}

		users = append(users, &user)
	}

	return users, nil
}

// GetUsersWithPagination 获取用户列表（带分页）
func (r *UserRepository) GetUsersWithPagination(page, pageSize int) ([]*models.User, int, error) {
	// 获取总数
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM user`
	err := r.db.QueryRow(countQuery).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 获取用户列表，Mose管理员永远排在最上面
	query := `SELECT uuid, username, email, bio, avatar, storage_limit, last_login_time, is_online, created_at, updated_at
			  FROM user 
			  ORDER BY 
			    CASE WHEN username = 'Mose' THEN 0 ELSE 1 END,
			    created_at DESC
			  LIMIT ? OFFSET ?`

	rows, err := r.db.Query(query, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		var user models.User
		var lastLoginTime sql.NullTime
		var email, bio, avatar sql.NullString

		err := rows.Scan(
			&user.UUID, &user.Username, &email, &bio, &avatar,
			&user.StorageLimit, &lastLoginTime, &user.IsOnline,
			&user.CreatedAt, &user.UpdatedAt,
		)

		if err != nil {
			return nil, 0, err
		}

		// 处理可能为NULL的字段
		if email.Valid {
			user.Email = email.String
		}
		if bio.Valid {
			user.Bio = bio.String
		}
		if avatar.Valid {
			user.Avatar = avatar.String
		}
		if lastLoginTime.Valid {
			user.LastLoginTime = &lastLoginTime.Time
		}

		if err != nil {
			return nil, 0, err
		}

		if lastLoginTime.Valid {
			user.LastLoginTime = &lastLoginTime.Time
		}

		users = append(users, &user)
	}

	return users, totalCount, nil
}

// UpdateUser 更新用户信息
func (r *UserRepository) UpdateUser(user *models.User) error {
	query := `UPDATE user SET username = ?, email = ?, bio = ?, avatar = ?, updated_at = ? 
			  WHERE uuid = ?`
	_, err := r.db.Exec(query, user.Username, user.Email, user.Bio, user.Avatar, user.UpdatedAt, user.UUID)
	return err
}

// UpdateUserStorage 更新用户存储限制
func (r *UserRepository) UpdateUserStorage(uuid string, storageLimit int64) error {
	query := `UPDATE user SET storage_limit = ?, updated_at = ? WHERE uuid = ?`
	_, err := r.db.Exec(query, storageLimit, time.Now(), uuid)
	return err
}

// UpdateUserOnlineStatus 更新用户在线状态
func (r *UserRepository) UpdateUserOnlineStatus(uuid string, isOnline bool) error {
	query := `UPDATE user SET is_online = ?, updated_at = ? WHERE uuid = ?`
	_, err := r.db.Exec(query, isOnline, time.Now(), uuid)
	return err
}

// UpdateLastLoginTime 更新用户最后登录时间
func (r *UserRepository) UpdateLastLoginTime(uuid string) error {
	query := `UPDATE user SET last_login_time = ?, is_online = TRUE, updated_at = ? WHERE uuid = ?`
	_, err := r.db.Exec(query, time.Now(), time.Now(), uuid)
	return err
}

// SetUserOffline 设置用户离线
func (r *UserRepository) SetUserOffline(uuid string) error {
	query := `UPDATE user SET is_online = FALSE, updated_at = ? WHERE uuid = ?`
	_, err := r.db.Exec(query, time.Now(), uuid)
	return err
}

// DeleteUser 删除用户
func (r *UserRepository) DeleteUser(uuid string) error {
	query := `DELETE FROM user WHERE uuid = ?`
	_, err := r.db.Exec(query, uuid)
	return err
}

// CheckUsernameExists 检查用户名是否已存在
func (r *UserRepository) CheckUsernameExists(username string) (bool, error) {
	var exists int
	query := `SELECT COUNT(*) FROM user WHERE username = ?`
	err := r.db.QueryRow(query, username).Scan(&exists)
	return exists > 0, err
}

// GetUserStorageInfo 获取用户存储信息
func (r *UserRepository) GetUserStorageInfo(userUUID string) (int64, int64, error) {
	// 获取用户存储限制
	var storageLimit int64
	query := `SELECT storage_limit FROM user WHERE uuid = ?`
	err := r.db.QueryRow(query, userUUID).Scan(&storageLimit)
	if err != nil {
		return 0, 0, err
	}

	// 获取用户已使用的存储空间
	var usedSpace int64
	query = `SELECT COALESCE(SUM(size), 0) FROM files WHERE user_id = ?`
	err = r.db.QueryRow(query, userUUID).Scan(&usedSpace)
	if err != nil {
		return 0, storageLimit, err
	}

	return usedSpace, storageLimit, nil
}
