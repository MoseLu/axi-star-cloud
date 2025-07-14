#!/bin/bash

# 宝塔面板一键部署脚本
# 使用方法：在宝塔面板终端中运行此脚本

set -e

echo "🚀 开始宝塔面板一键部署..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root用户运行此脚本"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "📦 安装Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 设置项目路径
PROJECT_PATH="/www/wwwroot/axi-star-cloud"
PROJECT_NAME="axi-star-cloud"
PORT=8080

echo "📁 创建项目目录..."
mkdir -p $PROJECT_PATH
cd $PROJECT_PATH

# 克隆项目（如果目录为空）
if [ ! "$(ls -A)" ]; then
    echo "📥 克隆项目代码..."
    git clone https://github.com/MoseLu/axi-star-cloud.git .
fi

# 给部署脚本执行权限
chmod +x deploy.sh

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null || true

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 构建新镜像
echo "🔨 构建Docker镜像..."
docker-compose build --no-cache

# 启动新容器
echo "🚀 启动新容器..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ 部署成功！"
    echo "🌐 服务地址: http://localhost:$PORT"
    echo "🔗 健康检查: http://localhost:$PORT/health"
else
    echo "❌ 部署失败，查看日志..."
    docker-compose logs
    exit 1
fi

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

# 设置自动重启
echo "🔄 设置自动重启..."
systemctl enable docker

echo ""
echo "🎉 部署完成！"
echo "📋 后续操作："
echo "1. 在宝塔面板中配置域名和SSL证书"
echo "2. 修改nginx.conf中的域名配置"
echo "3. 设置Git自动部署（可选）"
echo ""
echo "📖 详细说明请查看 DEPLOY.md 文件" 