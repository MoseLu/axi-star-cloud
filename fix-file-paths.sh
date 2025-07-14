#!/bin/bash

# 修复文件路径问题
echo "🔧 修复文件路径问题..."

# 检查文件是否存在
echo "📋 检查文件是否存在..."
FILE_NAME="Logo具体含义.md"
POSSIBLE_PATHS=(
    "/www/wwwroot/axi-star-cloud/uploads/document/$FILE_NAME"
    "/www/wwwroot/redamancy.com.cn/uploads/document/$FILE_NAME"
    "/www/wwwroot/axi-star-cloud/front/uploads/document/$FILE_NAME"
    "/www/wwwroot/redamancy.com.cn/front/uploads/document/$FILE_NAME"
    "./uploads/document/$FILE_NAME"
    "../uploads/document/$FILE_NAME"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo "✅ 文件存在: $path"
        ls -la "$path"
    else
        echo "❌ 文件不存在: $path"
    fi
done

# 创建正确的目录结构
echo ""
echo "📂 创建目录结构..."
mkdir -p /www/wwwroot/axi-star-cloud/uploads/document
mkdir -p /www/wwwroot/redamancy.com.cn/uploads/document
mkdir -p /www/wwwroot/axi-star-cloud/front/uploads/document
mkdir -p /www/wwwroot/redamancy.com.cn/front/uploads/document

# 设置权限
chmod 755 /www/wwwroot/axi-star-cloud/uploads/document
chmod 755 /www/wwwroot/redamancy.com.cn/uploads/document
chmod 755 /www/wwwroot/axi-star-cloud/front/uploads/document
chmod 755 /www/wwwroot/redamancy.com.cn/front/uploads/document

# 创建示例MD文件
echo ""
echo "📝 创建示例MD文件..."
cat > "/www/wwwroot/axi-star-cloud/uploads/document/$FILE_NAME" << 'EOF'
# Logo具体含义

## 设计理念

这个Logo代表了我们的核心价值观和使命。

## 颜色含义

- **蓝色**: 代表信任和专业
- **绿色**: 代表成长和希望
- **橙色**: 代表创新和活力

## 形状含义

- **圆形**: 代表完整和和谐
- **方形**: 代表稳定和可靠
- **三角形**: 代表进步和方向

## 总结

这个Logo体现了我们追求卓越、服务用户的核心理念。
EOF

# 复制到其他目录
cp "/www/wwwroot/axi-star-cloud/uploads/document/$FILE_NAME" "/www/wwwroot/redamancy.com.cn/uploads/document/"
cp "/www/wwwroot/axi-star-cloud/uploads/document/$FILE_NAME" "/www/wwwroot/axi-star-cloud/front/uploads/document/"
cp "/www/wwwroot/axi-star-cloud/uploads/document/$FILE_NAME" "/www/wwwroot/redamancy.com.cn/front/uploads/document/"

echo "📋 文件复制完成"

# 检查Go服务状态
echo ""
echo "🔍 检查Go服务状态..."
if systemctl is-active --quiet star-cloud; then
    echo "✅ Go服务正在运行"
    echo "📊 Go服务日志:"
    journalctl -u star-cloud --no-pager -n 20 | grep -E "(uploads|document|Static)"
else
    echo "❌ Go服务未运行"
fi

# 检查端口监听
echo ""
echo "🔍 检查端口监听..."
if netstat -tlnp | grep -q ":8080"; then
    echo "✅ 端口8080正在监听"
    netstat -tlnp | grep ":8080"
else
    echo "❌ 端口8080未监听"
fi

# 测试HTTP请求
echo ""
echo "🔍 测试HTTP请求..."
# 测试本地Go服务
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/uploads/document/$FILE_NAME"; then
    echo "✅ 本地Go服务可以访问文件"
else
    echo "❌ 本地Go服务无法访问文件"
fi

# 显示目录结构
echo ""
echo "📂 目录结构:"
echo "  /www/wwwroot/axi-star-cloud/uploads/document/"
ls -la "/www/wwwroot/axi-star-cloud/uploads/document/" | head -5
echo ""
echo "  /www/wwwroot/redamancy.com.cn/uploads/document/"
ls -la "/www/wwwroot/redamancy.com.cn/uploads/document/" | head -5

echo ""
echo "🎉 文件路径修复完成！"
echo ""
echo "📝 下一步操作:"
echo "1. 重启Go服务: systemctl restart star-cloud"
echo "2. 重启Nginx: systemctl reload nginx"
echo "3. 测试文件访问: https://redamancy.com.cn/uploads/document/$FILE_NAME" 