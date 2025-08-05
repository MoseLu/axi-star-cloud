#!/bin/bash

echo "🔍 诊断 star-cloud 服务启动问题..."

# 检查服务状态
echo "📊 当前服务状态:"
sudo systemctl status star-cloud.service --no-pager

# 检查服务日志
echo "📋 最近的服务日志:"
sudo journalctl -u star-cloud.service --no-pager -n 50

# 检查二进制文件
echo "🔍 检查二进制文件:"
if [ -f "/srv/apps/axi-star-cloud/star-cloud-linux" ]; then
    echo "✅ 二进制文件存在"
    ls -la /srv/apps/axi-star-cloud/star-cloud-linux
    echo "🔍 文件权限:"
    file /srv/apps/axi-star-cloud/star-cloud-linux
else
    echo "❌ 二进制文件不存在"
fi

# 检查配置文件
echo "🔍 检查配置文件:"
if [ -f "/srv/apps/axi-star-cloud/backend/config/config-prod.yaml" ]; then
    echo "✅ 生产配置文件存在"
    echo "📋 配置文件内容预览:"
    head -20 /srv/apps/axi-star-cloud/backend/config/config-prod.yaml
else
    echo "❌ 生产配置文件不存在"
fi

# 检查数据库连接
echo "🔍 检查数据库连接:"
if command -v mysql &> /dev/null; then
    echo "尝试连接数据库..."
    mysql -h 127.0.0.1 -P 3306 -u root -p123456 -e "SELECT 1;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ 数据库连接成功"
    else
        echo "❌ 数据库连接失败"
    fi
else
    echo "⚠️  mysql 客户端未安装"
fi

# 检查端口占用
echo "🔍 检查端口占用:"
netstat -tlnp | grep :8080 || echo "端口 8080 未被占用"

# 尝试手动运行二进制文件
echo "🔍 尝试手动运行二进制文件:"
cd /srv/apps/axi-star-cloud
echo "当前工作目录: $(pwd)"
echo "目录内容:"
ls -la

echo "🔍 尝试运行二进制文件 (5秒超时):"
timeout 5s ./star-cloud-linux || echo "❌ 二进制文件运行失败或超时"

echo "🔍 检查环境变量:"
echo "GIN_MODE: $GIN_MODE"
echo "PATH: $PATH"

echo "🔍 检查系统资源:"
echo "内存使用:"
free -h
echo "磁盘使用:"
df -h /srv/apps/axi-star-cloud

echo "✅ 诊断完成" 