#!/bin/bash

# Nginx配置检查脚本
echo "🔍 检查Nginx配置..."

# 查找Nginx配置文件
NGINX_CONF="/etc/nginx/sites-available/redamancy.com.cn"
if [ ! -f "$NGINX_CONF" ]; then
    NGINX_CONF="/etc/nginx/sites-available/default"
fi

echo "📄 Nginx配置文件: $NGINX_CONF"

if [ -f "$NGINX_CONF" ]; then
    echo ""
    echo "📋 当前Nginx配置:"
    cat "$NGINX_CONF"
    
    echo ""
    echo "🔍 检查/uploads路径配置..."
    
    # 检查是否包含/uploads路径配置
    if grep -q "location /uploads" "$NGINX_CONF"; then
        echo "✅ 找到/uploads路径配置"
    else
        echo "❌ 未找到/uploads路径配置"
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

echo ""
echo "🔍 检查文件是否存在..."
AVATAR_FILE="550e8400-e29b-41d4-a716-446655440000_87e9e1da-7d55-444f-bd81-c1d6b89a2af0.jpg"

POSSIBLE_PATHS=(
    "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE"
    "/www/wwwroot/redamancy.com.cn/uploads/avatars/$AVATAR_FILE"
    "/www/wwwroot/axi-star-cloud/front/uploads/avatars/$AVATAR_FILE"
    "/www/wwwroot/redamancy.com.cn/front/uploads/avatars/$AVATAR_FILE"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo "✅ 文件存在: $path"
        ls -la "$path"
    else
        echo "❌ 文件不存在: $path"
    fi
done

echo ""
echo "🔍 检查Go服务状态..."
if systemctl is-active --quiet star-cloud; then
    echo "✅ Go服务正在运行"
else
    echo "❌ Go服务未运行"
    echo "启动服务: systemctl start star-cloud"
fi

echo ""
echo "🔍 检查端口8080是否监听..."
if netstat -tlnp | grep -q ":8080"; then
    echo "✅ 端口8080正在监听"
else
    echo "❌ 端口8080未监听"
fi

echo ""
echo "📝 建议操作:"
echo "1. 运行 setup-avatar-dirs.sh 创建目录和文件"
echo "2. 检查并更新Nginx配置"
echo "3. 重启Nginx: systemctl reload nginx"
echo "4. 重启Go服务: systemctl restart star-cloud" 