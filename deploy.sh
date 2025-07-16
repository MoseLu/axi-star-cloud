#!/bin/bash

# 星际云盘部署脚本
# 用于在宝塔面板服务器上正确部署项目

echo "🚀 开始部署星际云盘..."

# 设置项目路径
PROJECT_PATH="/www/wwwroot/axi-star-cloud"
BACKEND_PATH="$PROJECT_PATH/backend"
UPLOADS_PATH="$PROJECT_PATH/uploads"

echo "📁 项目路径: $PROJECT_PATH"
echo "📁 后端路径: $BACKEND_PATH"
echo "📁 上传路径: $UPLOADS_PATH"

# 1. 进入项目目录
cd $PROJECT_PATH

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 3. 创建uploads目录结构
echo "📁 创建uploads目录结构..."
mkdir -p $UPLOADS_PATH/{image,avatars,video,audio,document,md,other}

# 4. 设置目录权限
echo "🔐 设置目录权限..."
chmod -R 755 $UPLOADS_PATH
chown -R www:www $UPLOADS_PATH

# 5. 编译后端
echo "🔨 编译后端..."
cd $BACKEND_PATH
go build -o star-cloud main.go

# 6. 检查编译结果
if [ -f "star-cloud" ]; then
    echo "✅ 后端编译成功"
else
    echo "❌ 后端编译失败"
    exit 1
fi

# 7. 创建测试文件
echo "📝 创建测试文件..."
echo "这是一个测试文件，用于验证uploads路径访问" > $UPLOADS_PATH/image/test.txt
echo "测试图片" > $UPLOADS_PATH/image/test.jpg

# 8. 检查文件是否创建成功
if [ -f "$UPLOADS_PATH/image/test.txt" ]; then
    echo "✅ 测试文件创建成功"
else
    echo "❌ 测试文件创建失败"
fi

# 9. 显示目录结构
echo "📂 当前uploads目录结构:"
ls -la $UPLOADS_PATH
echo "📂 image目录内容:"
ls -la $UPLOADS_PATH/image

# 10. 重启服务提示
echo ""
echo "🎉 部署完成！"
echo "📋 下一步操作:"
echo "1. 在宝塔面板中重启您的服务"
echo "2. 测试健康检查: https://redamancy.com.cn/health"
echo "3. 测试uploads路径: https://redamancy.com.cn/uploads/image/test.txt"
echo "4. 测试静态文件: https://redamancy.com.cn/static/public/favicon.ico"
echo ""
echo "🔧 如果uploads路径仍然无法访问，请检查:"
echo "- 宝塔面板反向代理配置"
echo "- 服务器防火墙设置"
echo "- 文件权限是否正确" 