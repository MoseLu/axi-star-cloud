#!/bin/bash

# 修复云端服务器路径问题
echo "🔧 修复云端服务器路径问题..."

# 获取当前工作目录
CURRENT_DIR=$(pwd)
echo "📁 当前工作目录: $CURRENT_DIR"

# 创建正确的目录结构
echo "📂 创建目录结构..."
mkdir -p /www/wwwroot/axi-star-cloud/uploads/avatars
mkdir -p /www/wwwroot/redamancy.com.cn/uploads/avatars
mkdir -p /www/wwwroot/axi-star-cloud/front/uploads/avatars
mkdir -p /www/wwwroot/redamancy.com.cn/front/uploads/avatars

# 设置权限
chmod 755 /www/wwwroot/axi-star-cloud/uploads/avatars
chmod 755 /www/wwwroot/redamancy.com.cn/uploads/avatars
chmod 755 /www/wwwroot/axi-star-cloud/front/uploads/avatars
chmod 755 /www/wwwroot/redamancy.com.cn/front/uploads/avatars

# 创建示例头像文件
AVATAR_FILE="550e8400-e29b-41d4-a716-446655440000_3e7aed8d-7354-4bf1-bc2f-72de8c7f3078.jpg"

echo "🖼️  创建示例头像文件..."
# 下载示例头像
curl -o "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE" \
     "https://picsum.photos/200/200?random=1" \
     --silent --fail

if [ $? -eq 0 ]; then
    echo "✅ 示例头像下载成功"
else
    echo "⚠️  下载失败，创建占位符文件"
    # 创建一个1x1像素的透明PNG
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE"
fi

# 复制到其他目录
cp "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE" "/www/wwwroot/redamancy.com.cn/uploads/avatars/"
cp "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE" "/www/wwwroot/axi-star-cloud/front/uploads/avatars/"
cp "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE" "/www/wwwroot/redamancy.com.cn/front/uploads/avatars/"

echo "📋 文件复制完成"

# 检查Go服务的工作目录
echo ""
echo "🔍 检查Go服务配置..."
if [ -f "/etc/systemd/system/star-cloud.service" ]; then
    echo "📄 Go服务配置文件:"
    cat "/etc/systemd/system/star-cloud.service"
    
    # 检查WorkingDirectory设置
    if grep -q "WorkingDirectory" "/etc/systemd/system/star-cloud.service"; then
        echo "✅ 服务配置了工作目录"
    else
        echo "⚠️  服务未配置工作目录，建议添加:"
        echo "WorkingDirectory=/www/wwwroot/axi-star-cloud"
    fi
else
    echo "❌ 未找到Go服务配置文件"
fi

# 检查Nginx配置
echo ""
echo "🔍 检查Nginx配置..."
NGINX_CONF="/etc/nginx/sites-available/redamancy.com.cn"
if [ -f "$NGINX_CONF" ]; then
    echo "📄 Nginx配置文件:"
    cat "$NGINX_CONF"
    
    # 检查/uploads配置
    if grep -q "location /uploads" "$NGINX_CONF"; then
        echo "✅ Nginx配置了/uploads路径"
    else
        echo "❌ Nginx未配置/uploads路径"
        echo ""
        echo "💡 建议添加以下配置到Nginx:"
        echo "location /uploads {"
        echo "    alias /www/wwwroot/axi-star-cloud/uploads;"
        echo "    expires 30d;"
        echo "    add_header Cache-Control \"public, immutable\";"
        echo "}"
    fi
else
    echo "❌ 未找到Nginx配置文件"
fi

# 显示目录结构
echo ""
echo "📂 目录结构:"
echo "  /www/wwwroot/axi-star-cloud/uploads/avatars/"
ls -la "/www/wwwroot/axi-star-cloud/uploads/avatars/" | head -5
echo ""
echo "  /www/wwwroot/redamancy.com.cn/uploads/avatars/"
ls -la "/www/wwwroot/redamancy.com.cn/uploads/avatars/" | head -5

echo ""
echo "🎉 路径修复完成！"
echo ""
echo "📝 下一步操作:"
echo "1. 重启Go服务: systemctl restart star-cloud"
echo "2. 重启Nginx: systemctl reload nginx"
echo "3. 测试头像访问: https://redamancy.com.cn/uploads/avatars/$AVATAR_FILE" 