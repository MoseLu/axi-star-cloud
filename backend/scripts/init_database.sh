#!/bin/bash

# 数据库初始化脚本
# 用于云端部署时确保数据库表结构正确

echo "开始数据库初始化..."

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

# 创建数据库（如果不存在）
echo "检查数据库是否存在..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [ $? -eq 0 ]; then
    echo "✓ 数据库检查/创建成功"
else
    echo "✗ 数据库检查/创建失败"
    exit 1
fi

# 运行应用进行数据库初始化
echo "启动应用进行数据库初始化..."
cd /app/backend
./star-cloud --init-db

if [ $? -eq 0 ]; then
    echo "✓ 数据库初始化成功"
else
    echo "✗ 数据库初始化失败"
    exit 1
fi

echo "数据库初始化完成！"
