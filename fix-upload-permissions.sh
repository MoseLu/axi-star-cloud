#!/bin/bash

# 修复上传目录权限脚本

echo "🔧 开始修复上传目录权限..."

# 设置项目路径
PROJECT_PATH="/www/wwwroot/axi-star-cloud"

# 创建上传目录
echo "📁 创建上传目录..."
mkdir -p $PROJECT_PATH/front/uploads/avatars
mkdir -p $PROJECT_PATH/front/uploads/image
mkdir -p $PROJECT_PATH/front/uploads/video
mkdir -p $PROJECT_PATH/front/uploads/audio
mkdir -p $PROJECT_PATH/front/uploads/document
mkdir -p $PROJECT_PATH/front/uploads/other

# 设置目录权限
echo "🔐 设置目录权限..."
chmod -R 755 $PROJECT_PATH/front/uploads/
chown -R root:root $PROJECT_PATH/front/uploads/

# 检查目录是否存在
echo "✅ 检查目录状态..."
ls -la $PROJECT_PATH/front/uploads/

# 测试写入权限
echo "🧪 测试写入权限..."
touch $PROJECT_PATH/front/uploads/avatars/test.txt
if [ $? -eq 0 ]; then
    echo "✅ 写入权限正常"
    rm $PROJECT_PATH/front/uploads/avatars/test.txt
else
    echo "❌ 写入权限有问题"
fi

echo "🎉 权限修复完成！" 