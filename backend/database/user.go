package database

import (
	"database/sql"
	"time"

	"backend/models"
)

// UserRepository 用户数据访问层
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository 创建用户仓库实例
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// CreateUser 创建新用户
func (r *UserRepository) CreateUser(user *models.User) error {
	query := `INSERT INTO user (uuid, username, password, email, storage_limit, is_admin, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query, user.UUID, user.Username, user.Password, user.Email, user.StorageLimit, user.IsAdmin, user.CreatedAt, user.UpdatedAt)
	return err
}

// GetUserByUsername 根据用户名获取用户
func (r *UserRepository) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	var email, bio, avatar sql.NullString
	query := `SELECT uuid, username, password, email, bio, avatar, storage_limit, is_admin, created_at, updated_at 
			  FROM user WHERE username = ?`

	err := r.db.QueryRow(query, username).Scan(
		&user.UUID, &user.Username, &user.Password,
		&email, &bio, &avatar,
		&user.StorageLimit, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			// 用户不存在，返回nil而不是错误
			return nil, nil
		}
		return nil, err
	}

	// 处理NULL值
	user.Email = email.String
	user.Bio = bio.String
	user.Avatar = avatar.String

	return &user, nil
}

// GetUserByUUID 根据UUID获取用户
func (r *UserRepository) GetUserByUUID(uuid string) (*models.User, error) {
	var user models.User
	var email, bio, avatar sql.NullString
	query := `SELECT uuid, username, password, email, bio, avatar, storage_limit, is_admin, created_at, updated_at 
			  FROM user WHERE uuid = ?`

	err := r.db.QueryRow(query, uuid).Scan(
		&user.UUID, &user.Username, &user.Password,
		&email, &bio, &avatar,
		&user.StorageLimit, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, err
	}

	// 处理NULL值
	user.Email = email.String
	user.Bio = bio.String
	user.Avatar = avatar.String

	return &user, nil
}

// GetUserByID 根据ID获取用户（别名方法）
func (r *UserRepository) GetUserByID(id string) (*models.User, error) {
	return r.GetUserByUUID(id)
}

// GetAllUsers 获取所有用户（管理员功能）
func (r *UserRepository) GetAllUsers() ([]models.User, error) {
	// 先获取管理员用户，再获取普通用户，管理员始终在最前面
	query := `SELECT uuid, username, email, bio, avatar, storage_limit, is_admin, created_at, updated_at 
			  FROM user 
			  ORDER BY is_admin DESC, created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		var email, bio, avatar sql.NullString

		err := rows.Scan(
			&user.UUID, &user.Username,
			&email, &bio, &avatar,
			&user.StorageLimit, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

		if err != nil {
			return nil, err
		}

		// 处理NULL值
		user.Email = email.String
		user.Bio = bio.String
		user.Avatar = avatar.String

		// 不返回密码
		user.Password = ""

		users = append(users, user)
	}

	return users, nil
}

// GetUsersWithPagination 获取用户列表（带分页）
func (r *UserRepository) GetUsersWithPagination(page, pageSize int) ([]models.User, int, error) {
	// 获取总用户数
	var total int
	err := r.db.QueryRow("SELECT COUNT(*) FROM user").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 获取分页用户数据，管理员始终在最前面
	query := `SELECT uuid, username, email, bio, avatar, storage_limit, is_admin, created_at, updated_at 
			  FROM user 
			  ORDER BY is_admin DESC, created_at DESC
			  LIMIT ? OFFSET ?`

	rows, err := r.db.Query(query, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		var email, bio, avatar sql.NullString

		err := rows.Scan(
			&user.UUID, &user.Username,
			&email, &bio, &avatar,
			&user.StorageLimit, &user.IsAdmin, &user.CreatedAt, &user.UpdatedAt)

		if err != nil {
			return nil, 0, err
		}

		// 处理NULL值
		user.Email = email.String
		user.Bio = bio.String
		user.Avatar = avatar.String

		// 不返回密码
		user.Password = ""

		users = append(users, user)
	}

	return users, total, nil
}

// GetUserCount 获取用户总数
func (r *UserRepository) GetUserCount() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM user").Scan(&count)
	return count, err
}

// UpdateUser 更新用户信息
func (r *UserRepository) UpdateUser(user *models.User) error {
	query := `UPDATE user SET username = ?, email = ?, bio = ?, avatar = ?, updated_at = ? WHERE uuid = ?`

	// 处理空字符串为NULL
	var email, bio, avatar interface{}
	if user.Email == "" {
		email = nil
	} else {
		email = user.Email
	}
	if user.Bio == "" {
		bio = nil
	} else {
		bio = user.Bio
	}
	if user.Avatar == "" {
		avatar = nil
	} else {
		avatar = user.Avatar
	}

	_, err := r.db.Exec(query, user.Username, email, bio, avatar, time.Now(), user.UUID)
	return err
}

// UpdateStorageLimit 更新用户存储限制
func (r *UserRepository) UpdateStorageLimit(uuid string, storageLimit int64) error {
	query := `UPDATE user SET storage_limit = ?, updated_at = ? WHERE uuid = ?`
	_, err := r.db.Exec(query, storageLimit, time.Now(), uuid)
	return err
}

// GetUserStorageInfo 获取用户存储信息
func (r *UserRepository) GetUserStorageInfo(uuid string) (*models.StorageInfo, error) {
	// 获取用户存储限制
	var storageLimit int64
	err := r.db.QueryRow("SELECT storage_limit FROM user WHERE uuid = ?", uuid).Scan(&storageLimit)
	if err != nil {
		return nil, err
	}

	// 获取已使用空间
	var usedSpace int64
	err = r.db.QueryRow("SELECT COALESCE(SUM(size), 0) FROM files WHERE user_id = ?", uuid).Scan(&usedSpace)
	if err != nil {
		return nil, err
	}

	storageInfo := &models.StorageInfo{
		UsedSpace:  usedSpace,
		TotalSpace: storageLimit,
	}

	// 计算使用百分比
	if storageLimit > 0 {
		storageInfo.UsagePercent = int((usedSpace * 100) / storageLimit)
	}

	return storageInfo, nil
}

// CheckUsernameExists 检查用户名是否已存在
func (r *UserRepository) CheckUsernameExists(username string) (bool, error) {
	var exists int
	query := `SELECT COUNT(*) FROM user WHERE username = ?`

	err := r.db.QueryRow(query, username).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists > 0, nil
}
