package database

import (
	"database/sql"
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
	query := `INSERT INTO user (uuid, username, password, email, storage_limit, created_at, updated_at)
			  VALUES (?, ?, ?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, user.UUID, user.Username, user.Password, user.Email, user.StorageLimit, user.CreatedAt, user.UpdatedAt)
	return err
}

// GetUserByUsername 根据用户名获取用户
func (r *UserRepository) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	var email, bio, avatar sql.NullString
	query := `SELECT uuid, username, password, email, bio, avatar, storage_limit, created_at, updated_at 
			  FROM user WHERE username = ?`

	err := r.db.QueryRow(query, username).Scan(
		&user.UUID, &user.Username, &user.Password,
		&email, &bio, &avatar,
		&user.StorageLimit, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
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
	query := `SELECT uuid, username, password, email, bio, avatar, storage_limit, created_at, updated_at 
			  FROM user WHERE uuid = ?`

	err := r.db.QueryRow(query, uuid).Scan(
		&user.UUID, &user.Username, &user.Password,
		&email, &bio, &avatar,
		&user.StorageLimit, &user.CreatedAt, &user.UpdatedAt)

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
	query := `SELECT uuid, username, email, bio, avatar, storage_limit, created_at, updated_at 
			  FROM user 
			  ORDER BY CASE WHEN username = 'Mose' THEN 0 ELSE 1 END, created_at DESC`

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
			&user.StorageLimit, &user.CreatedAt, &user.UpdatedAt)

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
	// 获取总数
	var total int
	countQuery := `SELECT COUNT(*) FROM user`
	err := r.db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 获取用户列表 - 管理员（Mose）永远在最上面，其他用户按创建时间倒序
	query := `SELECT uuid, username, email, bio, avatar, storage_limit, created_at, updated_at 
			  FROM user 
			  ORDER BY CASE WHEN username = 'Mose' THEN 0 ELSE 1 END, created_at DESC
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
			&user.StorageLimit, &user.CreatedAt, &user.UpdatedAt)

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
func (r *UserRepository) GetUserStorageInfo(userUUID string) (*models.StorageInfo, error) {
	// 获取用户存储限制
	var storageLimit int64
	query := `SELECT storage_limit FROM user WHERE uuid = ?`
	err := r.db.QueryRow(query, userUUID).Scan(&storageLimit)
	if err != nil {
		return nil, err
	}

	// 注意：已使用空间现在由 StorageHandler 通过 FileRepository 计算
	// 这里只返回存储限制，已使用空间会在 StorageHandler 中更新
	usedSpace := int64(0)

	return &models.StorageInfo{
		TotalSpace: storageLimit,
		UsedSpace:  usedSpace,
	}, nil
}
