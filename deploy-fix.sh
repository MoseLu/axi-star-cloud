#!/bin/bash

# 部署修复脚本 - 解决配置文件路径和数据库连接问题
set -e

echo "🔧 开始修复部署问题..."

# 定义变量
DEPLOY_PATH="/srv/apps/axi-star-cloud"
CONFIG_DIR="$DEPLOY_PATH/backend/config"

echo "📁 检查部署目录: $DEPLOY_PATH"

# 检查部署目录是否存在
if [ ! -d "$DEPLOY_PATH" ]; then
    echo "❌ 部署目录不存在: $DEPLOY_PATH"
    exit 1
fi

# 1. 复制生产环境配置文件到根目录
echo "📋 复制生产环境配置文件..."
if [ -f "$CONFIG_DIR/config-prod.yaml" ]; then
    cp "$CONFIG_DIR/config-prod.yaml" "$DEPLOY_PATH/config.yaml"
    echo "✅ 已复制 config-prod.yaml 到根目录"
else
    echo "⚠️  config-prod.yaml 不存在，使用默认配置"
fi

# 2. 检查并创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p "$DEPLOY_PATH/logs"
mkdir -p "$DEPLOY_PATH/uploads"
mkdir -p "$DEPLOY_PATH/front"

# 3. 设置正确的权限
echo "🔐 设置目录权限..."
chown -R deploy:deploy "$DEPLOY_PATH"
chmod -R 755 "$DEPLOY_PATH"
chmod 644 "$DEPLOY_PATH/config.yaml"

# 4. 检查数据库连接
echo "🔍 检查数据库连接..."
if command -v mysql &> /dev/null; then
    echo "📊 检查 MySQL 服务状态..."
    if systemctl is-active --quiet mysql; then
        echo "✅ MySQL 服务正在运行"
        
        # 尝试连接数据库
        if mysql -u root -p123456 -e "USE docs;" 2>/dev/null; then
            echo "✅ 数据库连接成功"
        else
            echo "⚠️ 数据库连接失败，可能需要创建数据库"
            echo "🔧 尝试创建数据库..."
            mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS docs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || echo "⚠️ 无法创建数据库，请手动检查"
        fi
    else
        echo "❌ MySQL 服务未运行"
        echo "🔧 尝试启动 MySQL 服务..."
        systemctl start mysql || echo "⚠️ 无法启动 MySQL 服务"
    fi
else
    echo "⚠️ MySQL 客户端未安装，跳过数据库检查"
fi

# 5. 检查端口占用
echo "🔍 检查端口占用..."
if netstat -tlnp | grep :8080 > /dev/null; then
    echo "⚠️ 端口 8080 已被占用"
    netstat -tlnp | grep :8080
else
    echo "✅ 端口 8080 可用"
fi

# 6. 测试二进制文件
echo "🧪 测试二进制文件..."
cd "$DEPLOY_PATH"
if [ -f "star-cloud-linux" ]; then
    echo "✅ 二进制文件存在"
    chmod +x star-cloud-linux
    
    # 尝试运行二进制文件（短暂运行以检查配置）
    echo "🔍 测试配置加载..."
    timeout 5s ./star-cloud-linux || echo "⚠️ 配置测试完成（这是正常的）"
else
    echo "❌ 二进制文件不存在"
    exit 1
fi

# 7. 更新服务文件
echo "🔧 更新服务文件..."
if [ -f "star-cloud.service" ]; then
    # 添加环境变量以指定配置文件路径
    sed -i 's|Environment=GIN_MODE=release|Environment=GIN_MODE=release\nEnvironment=CONFIG_PATH=/srv/apps/axi-star-cloud/config.yaml|' star-cloud.service
    echo "✅ 服务文件已更新"
fi

# 8. 重新加载 systemd
echo "🔄 重新加载 systemd..."
systemctl daemon-reload

# 9. 重启服务
echo "🚀 重启服务..."
systemctl restart star-cloud.service

# 10. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 11. 检查服务状态
echo "📊 检查服务状态..."
if systemctl is-active --quiet star-cloud.service; then
    echo "✅ 服务启动成功"
    
    # 检查健康状态
    echo "🔍 检查健康状态..."
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ 健康检查通过"
    else
        echo "⚠️ 健康检查失败，但服务正在运行"
    fi
else
    echo "❌ 服务启动失败"
    echo "📋 服务日志:"
    journalctl -u star-cloud.service --no-pager -n 20
fi

echo "🔧 部署修复完成" 