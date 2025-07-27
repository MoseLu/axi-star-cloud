#!/bin/bash

# 生产环境部署脚本
echo "🚀 部署到生产环境..."

# 设置环境变量
export ENV=production

# 编译Go程序
echo "📦 编译程序..."
cd backend
go build -o star-cloud main.go

# 设置权限
chmod +x star-cloud

# 创建必要的目录
mkdir -p uploads/{image,video,document,pdf,excel,powerpoint,word,md}

# 启动服务
echo "🔄 启动生产环境服务..."
./star-cloud &

echo "✅ 生产环境部署完成！"
echo "📊 上传限制配置："
echo "   - 最大并发上传：10"
echo "   - 最大上传速率：5MB/s"
echo "   - 最大文件大小：20MB"
echo "   - 最大视频大小：50MB"
echo ""
echo "🌐 服务运行在: http://localhost:8080" 