#!/bin/bash

# 宝塔面板Docker专用部署脚本
# 使用方法：在宝塔面板终端中运行此脚本

set -e

echo "🐳 开始宝塔面板Docker部署..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root用户运行此脚本"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "📦 请先在宝塔面板中安装Docker管理器"
    exit 1
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

# 停止并删除现有容器
echo "🛑 停止现有容器..."
docker stop $PROJECT_NAME 2>/dev/null || true
docker rm $PROJECT_NAME 2>/dev/null || true

# 删除旧镜像
echo "🗑️ 删除旧镜像..."
docker rmi $PROJECT_NAME:latest 2>/dev/null || true

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 构建新镜像
echo "🔨 构建Docker镜像..."
docker build -t $PROJECT_NAME:latest .

# 启动新容器
echo "🚀 启动新容器..."
docker run -d \
  --name $PROJECT_NAME \
  --restart unless-stopped \
  -p $PORT:8080 \
  -v $PROJECT_PATH/front/uploads:/root/front/uploads \
  -v $PROJECT_PATH/backend/config:/root/config \
  $PROJECT_NAME:latest

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ 部署成功！"
    echo "🌐 服务地址: http://localhost:$PORT"
    echo "🔗 健康检查: http://localhost:$PORT/health"
    echo ""
    echo "📋 后续操作："
    echo "1. 在宝塔面板中配置网站反向代理"
    echo "2. 申请SSL证书"
    echo "3. 配置域名访问"
else
    echo "❌ 部署失败，查看日志..."
    docker logs $PROJECT_NAME
    exit 1
fi

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

echo ""
echo "🎉 Docker部署完成！"
echo "📖 详细说明请查看 DEPLOY.md 文件" 