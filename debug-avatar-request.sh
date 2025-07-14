#!/bin/bash

# 调试头像请求处理方式
echo "🔍 调试头像请求处理方式..."

AVATAR_FILE="550e8400-e29b-41d4-a716-446655440000_143f7e08-9c83-402a-8982-35b2a325898c.jpg"

echo "📋 检查文件是否存在..."
POSSIBLE_PATHS=(
    "/www/wwwroot/axi-star-cloud/uploads/avatars/$AVATAR_FILE"
    "/www/wwwroot/redamancy.com.cn/uploads/avatars/$AVATAR_FILE"
    "/www/wwwroot/axi-star-cloud/front/uploads/avatars/$AVATAR_FILE"
    "/www/wwwroot/redamancy.com.cn/front/uploads/avatars/$AVATAR_FILE"
    "./uploads/avatars/$AVATAR_FILE"
    "../uploads/avatars/$AVATAR_FILE"
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
echo "🔍 检查Nginx配置..."
NGINX_CONF="/etc/nginx/sites-available/redamancy.com.cn"
if [ -f "$NGINX_CONF" ]; then
    echo "📄 Nginx配置文件: $NGINX_CONF"
    if grep -q "location /uploads" "$NGINX_CONF"; then
        echo "✅ Nginx配置了/uploads路径"
        grep -A 5 "location /uploads" "$NGINX_CONF"
    else
        echo "❌ Nginx未配置/uploads路径"
    fi
else
    echo "❌ 未找到Nginx配置文件"
fi

echo ""
echo "🔍 检查Go服务状态..."
if systemctl is-active --quiet star-cloud; then
    echo "✅ Go服务正在运行"
    echo "📊 Go服务日志:"
    journalctl -u star-cloud --no-pager -n 20 | grep -E "(uploads|avatar|Static)"
else
    echo "❌ Go服务未运行"
fi

echo ""
echo "🔍 测试本地文件访问..."
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo "📁 测试路径: $path"
        # 检查文件权限
        ls -la "$path"
        # 检查文件内容
        file "$path"
        break
    fi
done

echo ""
echo "🔍 检查端口监听..."
if netstat -tlnp | grep -q ":8080"; then
    echo "✅ 端口8080正在监听"
    netstat -tlnp | grep ":8080"
else
    echo "❌ 端口8080未监听"
fi

echo ""
echo "🔍 测试HTTP请求..."
# 测试本地Go服务
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/uploads/avatars/$AVATAR_FILE; then
    echo "✅ 本地Go服务可以访问头像"
else
    echo "❌ 本地Go服务无法访问头像"
fi

echo ""
echo "📝 建议操作:"
echo "1. 确保文件存在于正确位置"
echo "2. 检查Nginx配置是否正确"
echo "3. 重启Go服务: systemctl restart star-cloud"
echo "4. 重启Nginx: systemctl reload nginx"
echo "5. 检查防火墙设置" 