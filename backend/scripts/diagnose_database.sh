#!/bin/bash

# 数据库诊断脚本
# 用于快速定位云端部署问题

echo "=== 数据库诊断开始 ==="

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

# 1. 检查MySQL服务
echo "1. 检查MySQL服务..."
if command -v mysql &> /dev/null; then
    echo "✓ MySQL客户端已安装"
else
    echo "✗ MySQL客户端未安装"
    exit 1
fi

# 2. 检查数据库连接
echo "2. 检查数据库连接..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ 数据库连接成功"
else
    echo "✗ 数据库连接失败"
    echo "请检查："
    echo "  - MySQL服务是否运行"
    echo "  - 数据库配置是否正确"
    echo "  - 用户权限是否足够"
    exit 1
fi

# 3. 检查数据库是否存在
echo "3. 检查数据库是否存在..."
if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE \`$DB_NAME\`;" > /dev/null 2>&1; then
    echo "✓ 数据库 '$DB_NAME' 存在"
else
    echo "✗ 数据库 '$DB_NAME' 不存在"
    echo "创建数据库..."
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "✓ 数据库已创建"
fi

# 4. 检查表结构
echo "4. 检查表结构..."
TABLES=("user" "files" "folders" "documents" "update_logs" "url_files")
MISSING_TABLES=()

for table in "${TABLES[@]}"; do
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE $table;" > /dev/null 2>&1; then
        count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT COUNT(*) FROM $table;" -s -N)
        echo "✓ 表 '$table' 存在，行数: $count"
    else
        echo "✗ 表 '$table' 不存在"
        MISSING_TABLES+=("$table")
    fi
done

# 5. 如果有缺失的表，提供解决方案
if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo ""
    echo "发现缺失的表: ${MISSING_TABLES[*]}"
    echo ""
    echo "解决方案:"
    echo "1. 运行应用初始化:"
    echo "   ./star-cloud --init-db"
    echo ""
    echo "2. 或运行强制初始化:"
    echo "   ./scripts/force_init_database.sh"
    echo ""
    echo "3. 或手动创建表:"
    for table in "${MISSING_TABLES[@]}"; do
        echo "   - 表 '$table'"
    done
else
    echo "✓ 所有必需的表都存在"
fi

# 6. 检查应用配置
echo ""
echo "5. 检查应用配置..."
if [ -f "config/config-prod.yaml" ]; then
    echo "✓ 配置文件存在"
    echo "数据库配置:"
    grep -A 5 "database:" config/config-prod.yaml || echo "未找到数据库配置"
else
    echo "✗ 配置文件不存在"
    echo "请创建 config/config-prod.yaml 文件"
fi

# 7. 检查应用可执行文件
echo ""
echo "6. 检查应用文件..."
if [ -f "star-cloud" ]; then
    echo "✓ 应用可执行文件存在"
    echo "文件大小: $(ls -lh star-cloud | awk '{print $5}')"
else
    echo "✗ 应用可执行文件不存在"
    echo "请运行: go build -o star-cloud"
fi

echo ""
echo "=== 诊断完成 ==="

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo "❌ 发现问题: 缺少表 ${MISSING_TABLES[*]}"
    echo "请运行数据库初始化脚本"
    exit 1
else
    echo "✅ 所有检查通过"
    echo "可以启动应用: ./star-cloud"
fi
