package database

import (
	"backend/models"
)

// ===== Repository 接口定义 =====

// UserRepositoryInterface 用户仓库接口
type UserRepositoryInterface interface {
	CreateUser(user *models.User) error
	GetUserByUsername(username string) (*models.User, error)
	GetUserByUUID(uuid string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetAllUsers() ([]*models.User, error)
	GetUsersWithPagination(page, pageSize int) ([]*models.User, int, error)
	UpdateUser(user *models.User) error
	DeleteUser(uuid string) error
	CheckUsernameExists(username string) (bool, error)
	GetUserStorageInfo(userID string) (int64, int64, error)
	UpdateUserStorage(userID string, storageLimit int64) error
	UpdateLastLoginTime(uuid string) error
	SetUserOffline(uuid string) error
}

// FileRepositoryInterface 文件仓库接口
type FileRepositoryInterface interface {
	GetFilesByUserID(userID string, folderID *uint) ([]models.File, error)
	GetFileByID(fileID uint, userID string) (*models.File, error)
	GetFileByName(fileName, userID string) (*models.File, error)
	GetFileByNameAndUser(fileName, userID string) (*models.File, error)
	CreateFile(file *models.File) error
	DeleteFile(fileID uint, userID string) error
	MoveFile(fileID uint, userID string, folderID *uint) error
	GetUserTotalStorage(userID string) (int64, error)
	GetUserFileCount(userID string) (int, error)
	GetUserTotalFileCount(userID string) (int, error)
	GetTotalFileCount() (int, error)
	SearchFilesByUserID(userID, query string, folderID *uint) ([]models.File, error)
}

// FolderRepositoryInterface 文件夹仓库接口
type FolderRepositoryInterface interface {
	GetFoldersByUserID(userID string) ([]models.Folder, error)
	GetFolderByID(folderID uint, userID string) (*models.Folder, error)
	CreateFolder(folder *models.Folder) error
	UpdateFolder(folderID uint, userID, name, category string) error
	DeleteFolder(folderID uint, userID string) error
	CheckFolderExists(folderID uint, userID string) (bool, error)
	CheckFolderNameExists(userID, name, category string, excludeID uint) (bool, error)
	GetFolderFileCount(folderID uint, userID string) (int, error)
	GetFolderUrlFileCount(folderID uint, userID string) (int, error)
}

// DocumentRepositoryInterface 文档仓库接口
type DocumentRepositoryInterface interface {
	CreateDocument(doc *models.Document) error
	GetDocumentsByCategory(category string) ([]models.Document, error)
	GetDocuments() ([]models.Document, error)
	GetDocumentByID(id uint) (*models.Document, error)
	UpdateDocument(doc *models.Document) error
	DeleteDocument(id uint) error
}

// UrlFileRepositoryInterface URL文件仓库接口
type UrlFileRepositoryInterface interface {
	GetUrlFilesByUserID(userID string, folderID *uint) ([]models.UrlFile, error)
	GetUrlFileByID(fileID uint, userID string) (*models.UrlFile, error)
	CreateUrlFile(file *models.UrlFile) error
	DeleteUrlFile(fileID uint, userID string) error
	MoveUrlFile(fileID uint, userID string, folderID *uint) error
	GetUserTotalUrlFileCount(userID string) (int, error)
	GetFolderUrlFileCount(folderID uint, userID string) (int, error)
}
