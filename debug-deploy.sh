#!/bin/bash

# 部署诊断脚本
set -e

echo "🔍 开始诊断部署问题..."

# 定义变量
DEPLOY_PATH="/srv/apps/axi-star-cloud"

echo "📁 检查部署目录结构..."
if [ -d "$DEPLOY_PATH" ]; then
    echo "✅ 部署目录存在"
    ls -la "$DEPLOY_PATH"
else
    echo "❌ 部署目录不存在"
    exit 1
fi

echo ""
echo "📋 检查配置文件..."
if [ -f "$DEPLOY_PATH/config.yaml" ]; then
    echo "✅ 根目录配置文件存在"
    echo "📄 配置文件内容预览:"
    head -20 "$DEPLOY_PATH/config.yaml"
else
    echo "❌ 根目录配置文件不存在"
fi

if [ -f "$DEPLOY_PATH/backend/config/config.yaml" ]; then
    echo "✅ backend/config/config.yaml 存在"
else
    echo "❌ backend/config/config.yaml 不存在"
fi

echo ""
echo "🔍 检查二进制文件..."
if [ -f "$DEPLOY_PATH/star-cloud-linux" ]; then
    echo "✅ 二进制文件存在"
    ls -la "$DEPLOY_PATH/star-cloud-linux"
    
    # 检查文件类型
    file "$DEPLOY_PATH/star-cloud-linux"
    
    # 检查依赖
    echo "📦 检查二进制文件依赖..."
    ldd "$DEPLOY_PATH/star-cloud-linux" 2>/dev/null || echo "⚠️ 无法检查依赖"
else
    echo "❌ 二进制文件不存在"
fi

echo ""
echo "🔍 检查服务状态..."
if systemctl is-active --quiet star-cloud.service; then
    echo "✅ 服务正在运行"
else
    echo "❌ 服务未运行"
fi

echo ""
echo "📋 检查服务日志..."
journalctl -u star-cloud.service --no-pager -n 10

echo ""
echo "🔍 检查端口占用..."
netstat -tlnp | grep :8080 || echo "端口 8080 未被占用"

echo ""
echo "🔍 检查数据库连接..."
if command -v mysql &> /dev/null; then
    if mysql -u root -p123456 -e "SELECT 1;" 2>/dev/null; then
        echo "✅ MySQL 连接成功"
        mysql -u root -p123456 -e "SHOW DATABASES LIKE 'docs';" 2>/dev/null || echo "⚠️ docs 数据库不存在"
    else
        echo "❌ MySQL 连接失败"
    fi
else
    echo "⚠️ MySQL 客户端未安装"
fi

echo ""
echo "🔍 测试手动运行..."
cd "$DEPLOY_PATH"
echo "📁 当前工作目录: $(pwd)"
echo "📄 配置文件列表:"
ls -la *.yaml 2>/dev/null || echo "没有找到 yaml 配置文件"

echo ""
echo "🧪 尝试手动运行（5秒超时）..."
timeout 5s ./star-cloud-linux 2>&1 || echo "手动运行测试完成"

echo ""
echo "🔍 检查环境变量..."
echo "GIN_MODE: $GIN_MODE"
echo "CONFIG_PATH: $CONFIG_PATH"

echo ""
echo "📊 诊断完成" 