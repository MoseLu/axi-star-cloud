#!/bin/bash

# 宝塔面板自动部署脚本
# 项目名称
PROJECT_NAME="axi-star-cloud"
# 项目路径
PROJECT_PATH="/www/wwwroot/axi-star-cloud"
# 端口
PORT=8080

echo "开始部署 $PROJECT_NAME..."

# 进入项目目录
cd $PROJECT_PATH

# 停止现有容器
echo "停止现有容器..."
docker-compose down

# 拉取最新代码
echo "拉取最新代码..."
git pull origin main

# 构建新镜像
echo "构建Docker镜像..."
docker-compose build --no-cache

# 启动新容器
echo "启动新容器..."
docker-compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 检查服务状态
if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ 部署成功！服务运行在 http://localhost:$PORT"
else
    echo "❌ 部署失败，请检查日志"
    docker-compose logs
    exit 1
fi

# 清理旧镜像
echo "清理旧镜像..."
docker image prune -f

echo "部署完成！" 