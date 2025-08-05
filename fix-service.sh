#!/bin/bash

echo "🔧 修复 star-cloud 服务启动问题..."

# 停止服务
echo "🛑 停止服务..."
sudo systemctl stop star-cloud.service

# 检查并修复权限
echo "🔧 修复文件权限..."
sudo chown -R deploy:deploy /srv/apps/axi-star-cloud
sudo chmod +x /srv/apps/axi-star-cloud/star-cloud-linux

# 创建必要的目录
echo "📁 创建必要的目录..."
sudo mkdir -p /srv/apps/axi-star-cloud/logs
sudo mkdir -p /srv/apps/axi-star-cloud/uploads
sudo chown -R deploy:deploy /srv/apps/axi-star-cloud/logs
sudo chown -R deploy:deploy /srv/apps/axi-star-cloud/uploads

# 检查配置文件
echo "🔍 检查配置文件..."
if [ ! -f "/srv/apps/axi-star-cloud/backend/config/config-prod.yaml" ]; then
    echo "❌ 生产配置文件不存在，复制默认配置..."
    sudo cp /srv/apps/axi-star-cloud/backend/config/config.yaml /srv/apps/axi-star-cloud/backend/config/config-prod.yaml
fi

# 检查数据库
echo "🔍 检查数据库..."
if command -v mysql &> /dev/null; then
    echo "尝试创建数据库..."
    mysql -h 127.0.0.1 -P 3306 -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS docs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ 数据库检查/创建成功"
    else
        echo "⚠️  数据库连接失败，但继续尝试启动服务"
    fi
fi

# 重新加载 systemd
echo "🔄 重新加载 systemd..."
sudo systemctl daemon-reload

# 启用服务
echo "✅ 启用服务..."
sudo systemctl enable star-cloud.service

# 启动服务
echo "🚀 启动服务..."
sudo systemctl start star-cloud.service

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "📊 检查服务状态:"
sudo systemctl status star-cloud.service --no-pager

# 检查端口
echo "🔍 检查端口 8080:"
netstat -tlnp | grep :8080 || echo "端口 8080 未被占用"

# 检查日志
echo "📋 最新日志:"
sudo journalctl -u star-cloud.service --no-pager -n 10

echo "✅ 修复完成" 