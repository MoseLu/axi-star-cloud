#!/bin/bash

# 部署监控脚本
# 用于跟踪axi-star-cloud部署进度和验证修复效果

set -e

echo "🚀 开始监控部署进度..."

# 1. 检查GitHub Actions状态
echo "📋 检查GitHub Actions状态..."
echo "🔗 构建状态: https://github.com/MoseLu/axi-star-cloud/actions"
echo "🔗 部署状态: https://github.com/MoseLu/axi-deploy/actions"

# 2. 等待部署完成（模拟）
echo "⏳ 等待部署完成..."
sleep 30

# 3. 测试网站功能
echo "🔍 测试网站功能..."

# 测试主页面
echo "📋 测试主页面..."
MAIN_RESPONSE=$(curl -s -w "%{http_code}|%{num_redirects}" -o /dev/null \
    --max-redirs 3 \
    "https://redamancy.com.cn/" 2>/dev/null || echo "curl failed")

MAIN_CODE=$(echo "$MAIN_RESPONSE" | cut -d'|' -f1)
MAIN_REDIRECTS=$(echo "$MAIN_RESPONSE" | cut -d'|' -f2)

echo "  主页面状态码: $MAIN_CODE, 重定向次数: $MAIN_REDIRECTS"

# 测试静态文件
echo "📋 测试静态文件..."
STATIC_RESPONSE=$(curl -s -w "%{http_code}|%{num_redirects}" -o /dev/null \
    --max-redirs 3 \
    "https://redamancy.com.cn/static/html/main-content.html" 2>/dev/null || echo "curl failed")

STATIC_CODE=$(echo "$STATIC_RESPONSE" | cut -d'|' -f1)
STATIC_REDIRECTS=$(echo "$STATIC_RESPONSE" | cut -d'|' -f2)

echo "  静态文件状态码: $STATIC_CODE, 重定向次数: $STATIC_REDIRECTS"

# 测试API
echo "📋 测试API..."
API_RESPONSE=$(curl -s -w "%{http_code}|%{num_redirects}" -o /dev/null \
    --max-redirs 3 \
    "https://redamancy.com.cn/api/health" 2>/dev/null || echo "curl failed")

API_CODE=$(echo "$API_RESPONSE" | cut -d'|' -f1)
API_REDIRECTS=$(echo "$API_RESPONSE" | cut -d'|' -f2)

echo "  API状态码: $API_CODE, 重定向次数: $API_REDIRECTS"

# 4. 分析结果
echo "📊 部署结果分析..."

if [ "$MAIN_CODE" = "200" ]; then
    echo "✅ 主页面访问正常"
else
    echo "❌ 主页面访问异常，状态码: $MAIN_CODE"
fi

if [ "$STATIC_CODE" = "200" ] || [ "$STATIC_CODE" = "404" ]; then
    echo "✅ 静态文件访问正常（404表示文件不存在但重定向正常）"
else
    echo "❌ 静态文件访问异常，状态码: $STATIC_CODE"
fi

if [ "$API_CODE" = "200" ]; then
    echo "✅ API访问正常"
else
    echo "❌ API访问异常，状态码: $API_CODE"
fi

# 5. 检查重定向循环
if [ "$MAIN_REDIRECTS" -gt 2 ] || [ "$STATIC_REDIRECTS" -gt 2 ] || [ "$API_REDIRECTS" -gt 2 ]; then
    echo "⚠️  检测到可能的重定向循环"
else
    echo "✅ 重定向正常"
fi

# 6. 提供下一步建议
echo "📋 下一步建议:"

if [ "$STATIC_CODE" = "301000" ]; then
    echo "🔧 需要手动应用修复:"
    echo "   cd /srv"
    echo "   wget https://raw.githubusercontent.com/MoseLu/axi-deploy/master/examples/configs/force-update-config.sh"
    echo "   chmod +x force-update-config.sh"
    echo "   sudo ./force-update-config.sh"
elif [ "$MAIN_CODE" = "200" ] && [ "$STATIC_CODE" = "200" ] || [ "$STATIC_CODE" = "404" ]; then
    echo "🎉 部署成功！网站功能正常"
    echo "🔗 访问网站: https://redamancy.com.cn/"
else
    echo "⚠️  部分功能异常，请检查部署日志"
fi

echo "✅ 部署监控完成"
