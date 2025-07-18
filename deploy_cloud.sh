#!/bin/bash

# 星际云盘云端部署脚本
# 用于更新云端服务器的CORS配置

echo "🚀 开始部署星际云盘到云端..."

# 设置变量
REMOTE_HOST="redamancy.com.cn"
REMOTE_USER="root"
PROJECT_DIR="/www/wwwroot/axi-star-cloud"
SERVICE_NAME="star-cloud"

echo "📋 部署信息:"
echo "  远程主机: $REMOTE_HOST"
echo "  项目目录: $PROJECT_DIR"
echo "  服务名称: $SERVICE_NAME"

# 1. 停止现有服务
echo "🛑 停止现有服务..."
ssh $REMOTE_USER@$REMOTE_HOST "systemctl stop $SERVICE_NAME"

# 2. 备份当前版本
echo "💾 备份当前版本..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $PROJECT_DIR && cp -r backend backend_backup_$(date +%Y%m%d_%H%M%S)"

# 3. 拉取最新代码
echo "📥 拉取最新代码..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $PROJECT_DIR && git pull origin main"

# 4. 重新编译后端
echo "🔨 重新编译后端..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $PROJECT_DIR/backend && go build -o star-cloud main.go"

# 5. 设置文件权限
echo "🔐 设置文件权限..."
ssh $REMOTE_USER@$REMOTE_HOST "chmod +x $PROJECT_DIR/backend/star-cloud"
ssh $REMOTE_USER@$REMOTE_HOST "chown -R www:www $PROJECT_DIR"

# 6. 启动服务
echo "▶️ 启动服务..."
ssh $REMOTE_USER@$REMOTE_HOST "systemctl start $SERVICE_NAME"

# 7. 检查服务状态
echo "🔍 检查服务状态..."
ssh $REMOTE_USER@$REMOTE_HOST "systemctl status $SERVICE_NAME --no-pager -l"

# 8. 测试健康检查
echo "🏥 测试健康检查..."
sleep 3
curl -s "https://$REMOTE_HOST/health" || echo "❌ 健康检查失败"

echo "✅ 部署完成！"
echo "🌐 访问地址: https://$REMOTE_HOST"
echo "📊 服务状态: systemctl status $SERVICE_NAME" 