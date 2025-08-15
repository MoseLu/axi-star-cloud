#!/bin/bash

set -e

echo "🔧 开始初始化 axi-star-cloud 数据库..."

# 设置数据库配置
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="123456"
DB_NAME="docs"

echo "📋 数据库配置:"
echo "- 主机: $DB_HOST"
echo "- 端口: $DB_PORT"
echo "- 用户: $DB_USER"
echo "- 数据库: $DB_NAME"

# 检查 MySQL 是否运行
echo "🔍 检查 MySQL 服务状态..."
if ! systemctl is-active --quiet mysql; then
    echo "❌ MySQL 服务未运行，尝试启动..."
    sudo systemctl start mysql
    sleep 3
fi

if systemctl is-active --quiet mysql; then
    echo "✅ MySQL 服务运行正常"
else
    echo "❌ MySQL 服务启动失败"
    exit 1
fi

# 连接到 MySQL 并创建数据库（如果不存在）
echo "🔧 检查并创建数据库..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
" 2>/dev/null || {
    echo "❌ 数据库创建失败，尝试使用默认连接..."
    mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
" || {
        echo "❌ 数据库创建失败"
        exit 1
    }
}

echo "✅ 数据库 $DB_NAME 已准备就绪"

# 运行数据库初始化程序
echo "🔧 运行数据库初始化程序..."
cd /srv/apps/axi-star-cloud

# 检查可执行文件是否存在
if [ -f "star-cloud-linux" ]; then
    echo "✅ 找到 star-cloud-linux 可执行文件"
    
    # 设置环境变量
    export MYSQL_HOST="$DB_HOST"
    export MYSQL_PORT="$DB_PORT"
    export MYSQL_USER="$DB_USER"
    export MYSQL_PASSWORD="$DB_PASSWORD"
    export MYSQL_DATABASE="$DB_NAME"
    
    # 运行数据库初始化（使用 --init-db 参数）
    echo "🔧 执行数据库初始化..."
    ./star-cloud-linux --init-db 2>&1 || {
        echo "⚠️ 数据库初始化程序执行失败，尝试使用重置参数..."
        ./star-cloud-linux --reset-all 2>&1 || {
            echo "❌ 数据库初始化失败"
            exit 1
        }
    }
    
    echo "✅ 数据库初始化完成"
else
    echo "❌ star-cloud-linux 可执行文件不存在"
    exit 1
fi

# 验证数据库表
echo "🔍 验证数据库表..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SHOW TABLES;
" 2>/dev/null || mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SHOW TABLES;
" || {
    echo "❌ 无法连接到数据库进行验证"
    exit 1
}

echo "✅ 数据库初始化验证完成"
echo "🎉 axi-star-cloud 数据库初始化成功！"
