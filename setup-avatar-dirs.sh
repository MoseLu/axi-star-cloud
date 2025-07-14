#!/bin/bash

# 设置头像目录结构脚本
# 在云端服务器上运行此脚本来创建正确的目录结构

echo "🚀 开始设置头像目录结构..."

# 定义可能的目录路径
DIRS=(
    "/www/wwwroot/axi-star-cloud/uploads/avatars"
    "/www/wwwroot/redamancy.com.cn/uploads/avatars"
    "/www/wwwroot/axi-star-cloud/front/uploads/avatars"
    "/www/wwwroot/redamancy.com.cn/front/uploads/avatars"
    "./uploads/avatars"
    "../uploads/avatars"
)

# 创建目录
for dir in "${DIRS[@]}"; do
    echo "📁 创建目录: $dir"
    mkdir -p "$dir"
    
    # 设置权限
    chmod 755 "$dir"
    echo "✅ 目录创建成功: $dir"
done

# 创建示例头像文件（如果不存在）
AVATAR_FILE="550e8400-e29b-41d4-a716-446655440000_87e9e1da-7d55-444f-bd81-c1d6b89a2af0.jpg"

# 检查文件是否已存在
if [ ! -f "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE" ]; then
    echo "🖼️  创建示例头像文件..."
    
    # 使用curl下载一个示例头像
    curl -o "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE" \
         "https://picsum.photos/200/200?random=1" \
         --silent --fail
    
    if [ $? -eq 0 ]; then
        echo "✅ 示例头像文件创建成功"
    else
        echo "⚠️  无法下载示例头像，创建空白文件"
        # 创建一个1x1像素的透明PNG作为占位符
        echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE"
    fi
    
    # 复制到其他目录
    for dir in "${DIRS[@]}"; do
        if [ "$dir" != "/www/wwwroot/axi-star-cloud/uploads/avatars" ]; then
            cp "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE" "$dir/"
            echo "📋 复制到: $dir"
        fi
    done
else
    echo "✅ 示例头像文件已存在"
fi

# 显示目录结构
echo ""
echo "📂 目录结构:"
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  $dir"
        ls -la "$dir" | head -5
        echo ""
    fi
done

echo "🎉 头像目录设置完成！"
echo ""
echo "📝 下一步:"
echo "1. 重启Go服务: systemctl restart star-cloud"
echo "2. 检查Nginx配置是否正确代理/uploads路径"
echo "3. 测试头像访问: https://redamancy.com.cn/uploads/avatars/$AVATAR_FILE" 