#!/bin/bash

# 强制数据库初始化脚本
# 用于云端部署时确保数据库表结构正确

set -e  # 遇到错误立即退出

echo "=== 强制数据库初始化开始 ==="

# 检查环境变量
if [ -z "$DB_HOST" ]; then
    DB_HOST="127.0.0.1"
fi

if [ -z "$DB_PORT" ]; then
    DB_PORT="3306"
fi

if [ -z "$DB_USER" ]; then
    DB_USER="root"
fi

if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD="123456"
fi

if [ -z "$DB_NAME" ]; then
    DB_NAME="docs"
fi

echo "数据库配置:"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  用户: $DB_USER"
echo "  数据库: $DB_NAME"

# 1. 检查MySQL连接
echo "检查MySQL连接..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "✗ MySQL连接失败"
    exit 1
fi
echo "✓ MySQL连接成功"

# 2. 创建数据库（如果不存在）
echo "创建数据库..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "✓ 数据库检查/创建成功"

# 3. 强制创建所有表
echo "强制创建所有表..."

# 创建user表
echo "创建user表..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DROP TABLE IF EXISTS user;
CREATE TABLE user (
    uuid VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    bio TEXT,
    avatar VARCHAR(255),
    storage_limit BIGINT DEFAULT 1073741824,
    last_login_time TIMESTAMP NULL,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_username ON user(username);
CREATE INDEX idx_user_email ON user(email);
"

# 创建files表
echo "创建files表..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DROP TABLE IF EXISTS files;
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    path VARCHAR(500) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    folder_id INT,
    thumbnail_data LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_type ON files(type);
"

# 创建folders表
echo "创建folders表..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DROP TABLE IF EXISTS folders;
CREATE TABLE folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    category VARCHAR(50) DEFAULT 'all',
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_category (category)
);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_category ON folders(category);
"

# 创建documents表
echo "创建documents表..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DROP TABLE IF EXISTS documents;
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    \`order\` INT DEFAULT 0,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_order (\`order\`)
);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_order ON documents(\`order\`);
"

# 创建update_logs表
echo "创建update_logs表..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DROP TABLE IF EXISTS update_logs;
CREATE TABLE update_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    features JSON,
    known_issues JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_version (version),
    INDEX idx_release_date (release_date)
);
CREATE INDEX idx_update_logs_version ON update_logs(version);
CREATE INDEX idx_update_logs_release_date ON update_logs(release_date);
"

# 创建url_files表
echo "创建url_files表..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
DROP TABLE IF EXISTS url_files;
CREATE TABLE url_files (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    user_id VARCHAR(50) NOT NULL,
    folder_id INTEGER,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(uuid) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
CREATE INDEX idx_url_files_user_id ON url_files(user_id);
CREATE INDEX idx_url_files_folder_id ON url_files(folder_id);
CREATE INDEX idx_url_files_created_at ON url_files(created_at);
"

echo "✓ 所有表创建完成"

# 4. 插入初始数据
echo "插入初始数据..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
INSERT INTO user (uuid, username, password, email, bio, storage_limit) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Mose', '123456', 'admin@example.com', '系统管理员', 5368709120)
ON DUPLICATE KEY UPDATE username=username;
"

echo "✓ 初始数据插入完成"

# 5. 验证表结构
echo "验证表结构..."
TABLES=("user" "files" "folders" "documents" "update_logs" "url_files")

for table in "${TABLES[@]}"; do
    echo "检查表: $table"
    count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM $table;" -s -N)
    echo "✓ 表 $table 存在，行数: $count"
done

echo "=== 强制数据库初始化完成 ==="
echo "✓ 所有表已成功创建并验证通过"
