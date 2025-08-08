package database

import (
	"backend/models"
	"time"

	"gorm.io/gorm"
)

// ===== GORM Repository 实现 =====

// GORMUserRepository GORM 用户仓库
type GORMUserRepository struct {
	db *gorm.DB
}

// GORMFileRepository GORM 文件仓库
type GORMFileRepository struct {
	db *gorm.DB
}

// GORMFolderRepository GORM 文件夹仓库
type GORMFolderRepository struct {
	db *gorm.DB
}

// GORMDocumentRepository GORM 文档仓库
type GORMDocumentRepository struct {
	db *gorm.DB
}

// GORMUrlFileRepository GORM URL文件仓库
type GORMUrlFileRepository struct {
	db *gorm.DB
}

// ===== GORM User Repository 方法 =====

func (r *GORMUserRepository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *GORMUserRepository) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *GORMUserRepository) GetUserByUUID(uuid string) (*models.User, error) {
	var user models.User
	err := r.db.Where("uuid = ?", uuid).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *GORMUserRepository) GetUserByID(id string) (*models.User, error) {
	var user models.User
	err := r.db.Where("uuid = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *GORMUserRepository) GetAllUsers() ([]*models.User, error) {
	var users []*models.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *GORMUserRepository) UpdateUser(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *GORMUserRepository) DeleteUser(uuid string) error {
	return r.db.Where("uuid = ?", uuid).Delete(&models.User{}).Error
}

func (r *GORMUserRepository) CheckUsernameExists(username string) (bool, error) {
	var count int64
	err := r.db.Model(&models.User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}

func (r *GORMUserRepository) GetUserStorageInfo(userID string) (int64, int64, error) {
	var user models.User
	err := r.db.Where("uuid = ?", userID).First(&user).Error
	if err != nil {
		return 0, 0, err
	}
	
	// 获取用户已使用的存储空间
	var usedStorage int64
	err = r.db.Model(&models.File{}).Where("user_id = ?", userID).Select("COALESCE(SUM(size), 0)").Scan(&usedStorage).Error
	if err != nil {
		return 0, user.StorageLimit, err
	}
	
	return usedStorage, user.StorageLimit, nil
}

func (r *GORMUserRepository) UpdateUserStorage(userID string, storageLimit int64) error {
	return r.db.Model(&models.User{}).Where("uuid = ?", userID).Update("storage_limit", storageLimit).Error
}

func (r *GORMUserRepository) UpdateLastLoginTime(uuid string) error {
	return r.db.Model(&models.User{}).Where("uuid = ?", uuid).Updates(map[string]interface{}{
		"last_login_time": time.Now(),
		"is_online":       true,
		"updated_at":      time.Now(),
	}).Error
}

func (r *GORMUserRepository) SetUserOffline(uuid string) error {
	return r.db.Model(&models.User{}).Where("uuid = ?", uuid).Updates(map[string]interface{}{
		"is_online":  false,
		"updated_at": time.Now(),
	}).Error
}

func (r *GORMUserRepository) GetUsersWithPagination(page, pageSize int) ([]*models.User, int, error) {
	var users []*models.User
	var totalCount int64

	// 获取总数
	err := r.db.Model(&models.User{}).Count(&totalCount).Error
	if err != nil {
		return nil, 0, err
	}

	// 获取分页数据
	offset := (page - 1) * pageSize
	err = r.db.Offset(offset).Limit(pageSize).Find(&users).Error
	if err != nil {
		return nil, 0, err
	}

	return users, int(totalCount), nil
}

// ===== GORM File Repository 方法 =====

func (r *GORMFileRepository) GetFilesByUserID(userID string, folderID *uint) ([]models.File, error) {
	var files []models.File
	query := r.db.Where("user_id = ?", userID)
	if folderID != nil {
		query = query.Where("folder_id = ?", *folderID)
	} else {
		query = query.Where("folder_id IS NULL")
	}
	err := query.Find(&files).Error
	return files, err
}

func (r *GORMFileRepository) GetFileByID(fileID uint, userID string) (*models.File, error) {
	var file models.File
	err := r.db.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *GORMFileRepository) GetFileByName(fileName, userID string) (*models.File, error) {
	var file models.File
	err := r.db.Where("name = ? AND user_id = ?", fileName, userID).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *GORMFileRepository) GetFileByNameAndUser(fileName, userID string) (*models.File, error) {
	var file models.File
	err := r.db.Where("name = ? AND user_id = ?", fileName, userID).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *GORMFileRepository) CreateFile(file *models.File) error {
	return r.db.Create(file).Error
}

func (r *GORMFileRepository) DeleteFile(fileID uint, userID string) error {
	return r.db.Where("id = ? AND user_id = ?", fileID, userID).Delete(&models.File{}).Error
}

func (r *GORMFileRepository) MoveFile(fileID uint, userID string, folderID *uint) error {
	updates := map[string]interface{}{}
	if folderID != nil {
		updates["folder_id"] = *folderID
	} else {
		updates["folder_id"] = nil
	}
	return r.db.Model(&models.File{}).Where("id = ? AND user_id = ?", fileID, userID).Updates(updates).Error
}

func (r *GORMFileRepository) GetUserTotalStorage(userID string) (int64, error) {
	var totalSize int64
	err := r.db.Model(&models.File{}).Where("user_id = ?", userID).Select("COALESCE(SUM(size), 0)").Scan(&totalSize).Error
	return totalSize, err
}

func (r *GORMFileRepository) GetUserFileCount(userID string) (int, error) {
	var count int64
	err := r.db.Model(&models.File{}).Where("user_id = ?", userID).Count(&count).Error
	return int(count), err
}

func (r *GORMFileRepository) GetUserTotalFileCount(userID string) (int, error) {
	var count int64
	err := r.db.Model(&models.File{}).Where("user_id = ?", userID).Count(&count).Error
	return int(count), err
}

func (r *GORMFileRepository) GetTotalFileCount() (int, error) {
	var count int64
	err := r.db.Model(&models.File{}).Count(&count).Error
	return int(count), err
}

func (r *GORMFileRepository) SearchFilesByUserID(userID, query string, folderID *uint) ([]models.File, error) {
	var files []models.File
	dbQuery := r.db.Where("user_id = ? AND name LIKE ?", userID, "%"+query+"%")
	if folderID != nil {
		dbQuery = dbQuery.Where("folder_id = ?", *folderID)
	} else {
		dbQuery = dbQuery.Where("folder_id IS NULL")
	}
	err := dbQuery.Find(&files).Error
	return files, err
}

// ===== GORM Folder Repository 方法 =====

func (r *GORMFolderRepository) GetFoldersByUserID(userID string) ([]models.Folder, error) {
	var folders []models.Folder
	err := r.db.Where("user_id = ?", userID).Find(&folders).Error
	return folders, err
}

func (r *GORMFolderRepository) GetFolderByID(folderID uint, userID string) (*models.Folder, error) {
	var folder models.Folder
	err := r.db.Where("id = ? AND user_id = ?", folderID, userID).First(&folder).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

func (r *GORMFolderRepository) CreateFolder(folder *models.Folder) error {
	return r.db.Create(folder).Error
}

func (r *GORMFolderRepository) UpdateFolder(folderID uint, userID, name, category string) error {
	return r.db.Model(&models.Folder{}).Where("id = ? AND user_id = ?", folderID, userID).Updates(map[string]interface{}{
		"name":     name,
		"category": category,
	}).Error
}

func (r *GORMFolderRepository) DeleteFolder(folderID uint, userID string) error {
	return r.db.Where("id = ? AND user_id = ?", folderID, userID).Delete(&models.Folder{}).Error
}

func (r *GORMFolderRepository) CheckFolderExists(folderID uint, userID string) (bool, error) {
	var count int64
	err := r.db.Model(&models.Folder{}).Where("id = ? AND user_id = ?", folderID, userID).Count(&count).Error
	return count > 0, err
}

func (r *GORMFolderRepository) CheckFolderNameExists(userID, name, category string, excludeID uint) (bool, error) {
	var count int64
	query := r.db.Model(&models.Folder{}).Where("user_id = ? AND name = ? AND category = ?", userID, name, category)
	if excludeID > 0 {
		query = query.Where("id != ?", excludeID)
	}
	err := query.Count(&count).Error
	return count > 0, err
}

func (r *GORMFolderRepository) GetFolderFileCount(folderID uint, userID string) (int, error) {
	var count int64
	err := r.db.Model(&models.File{}).Where("folder_id = ? AND user_id = ?", folderID, userID).Count(&count).Error
	return int(count), err
}

func (r *GORMFolderRepository) GetFolderUrlFileCount(folderID uint, userID string) (int, error) {
	var count int64
	err := r.db.Model(&models.UrlFile{}).Where("folder_id = ? AND user_id = ?", folderID, userID).Count(&count).Error
	return int(count), err
}

// ===== GORM Document Repository 方法 =====

func (r *GORMDocumentRepository) CreateDocument(doc *models.Document) error {
	return r.db.Create(doc).Error
}

func (r *GORMDocumentRepository) GetDocumentsByCategory(category string) ([]models.Document, error) {
	var docs []models.Document
	err := r.db.Where("category = ?", category).Order("`order` ASC").Find(&docs).Error
	return docs, err
}

func (r *GORMDocumentRepository) GetDocuments() ([]models.Document, error) {
	var docs []models.Document
	err := r.db.Order("`order` ASC").Find(&docs).Error
	return docs, err
}

func (r *GORMDocumentRepository) GetDocumentByID(id uint) (*models.Document, error) {
	var doc models.Document
	err := r.db.Where("id = ?", id).First(&doc).Error
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *GORMDocumentRepository) UpdateDocument(doc *models.Document) error {
	return r.db.Save(doc).Error
}

func (r *GORMDocumentRepository) DeleteDocument(id uint) error {
	return r.db.Where("id = ?", id).Delete(&models.Document{}).Error
}

// ===== GORM UrlFile Repository 方法 =====

func (r *GORMUrlFileRepository) GetUrlFilesByUserID(userID string, folderID *uint) ([]models.UrlFile, error) {
	var files []models.UrlFile
	query := r.db.Where("user_id = ?", userID)
	if folderID != nil {
		query = query.Where("folder_id = ?", *folderID)
	} else {
		query = query.Where("folder_id IS NULL")
	}
	err := query.Find(&files).Error
	return files, err
}

func (r *GORMUrlFileRepository) GetUrlFileByID(fileID uint, userID string) (*models.UrlFile, error) {
	var file models.UrlFile
	err := r.db.Where("id = ? AND user_id = ?", fileID, userID).First(&file).Error
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *GORMUrlFileRepository) CreateUrlFile(file *models.UrlFile) error {
	return r.db.Create(file).Error
}

func (r *GORMUrlFileRepository) DeleteUrlFile(fileID uint, userID string) error {
	return r.db.Where("id = ? AND user_id = ?", fileID, userID).Delete(&models.UrlFile{}).Error
}

func (r *GORMUrlFileRepository) MoveUrlFile(fileID uint, userID string, folderID *uint) error {
	updates := map[string]interface{}{}
	if folderID != nil {
		updates["folder_id"] = *folderID
	} else {
		updates["folder_id"] = nil
	}
	return r.db.Model(&models.UrlFile{}).Where("id = ? AND user_id = ?", fileID, userID).Updates(updates).Error
}

func (r *GORMUrlFileRepository) GetUserTotalUrlFileCount(userID string) (int, error) {
	var count int64
	err := r.db.Model(&models.UrlFile{}).Where("user_id = ?", userID).Count(&count).Error
	return int(count), err
}

func (r *GORMUrlFileRepository) GetFolderUrlFileCount(folderID uint, userID string) (int, error) {
	var count int64
	err := r.db.Model(&models.UrlFile{}).Where("folder_id = ? AND user_id = ?", folderID, userID).Count(&count).Error
	return int(count), err
}

// ===== GORM Repository 构造函数 =====

// NewGORMUserRepository 创建 GORM 用户仓库
func NewGORMUserRepository(db *gorm.DB) *GORMUserRepository {
	return &GORMUserRepository{db: db}
}

// NewGORMFileRepository 创建 GORM 文件仓库
func NewGORMFileRepository(db *gorm.DB) *GORMFileRepository {
	return &GORMFileRepository{db: db}
}

// NewGORMFolderRepository 创建 GORM 文件夹仓库
func NewGORMFolderRepository(db *gorm.DB) *GORMFolderRepository {
	return &GORMFolderRepository{db: db}
}

// NewGORMDocumentRepository 创建 GORM 文档仓库
func NewGORMDocumentRepository(db *gorm.DB) *GORMDocumentRepository {
	return &GORMDocumentRepository{db: db}
}

// NewGORMUrlFileRepository 创建 GORM URL文件仓库
func NewGORMUrlFileRepository(db *gorm.DB) *GORMUrlFileRepository {
	return &GORMUrlFileRepository{db: db}
}

