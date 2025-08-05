#!/bin/bash

echo "🔍 AXI Star Cloud 部署诊断脚本"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_status() {
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "检查 $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 正常${NC}"
        return 0
    else
        echo -e "${RED}❌ 异常${NC}"
        if [ "$expected" != "" ]; then
            echo "  期望: $expected"
        fi
        return 1
    fi
}

# 1. 检查部署目录
echo ""
echo "📁 1. 检查部署目录"
DEPLOY_PATH="/srv/apps/axi-star-cloud"
if [ -d "$DEPLOY_PATH" ]; then
    echo -e "${GREEN}✅ 部署目录存在: $DEPLOY_PATH${NC}"
    echo "目录内容:"
    ls -la "$DEPLOY_PATH" | head -10
else
    echo -e "${RED}❌ 部署目录不存在: $DEPLOY_PATH${NC}"
fi

# 2. 检查可执行文件
echo ""
echo "🔧 2. 检查可执行文件"
BINARY_PATH="$DEPLOY_PATH/star-cloud-linux"
if [ -f "$BINARY_PATH" ]; then
    echo -e "${GREEN}✅ 可执行文件存在${NC}"
    echo "文件权限: $(ls -la "$BINARY_PATH")"
    echo "文件类型: $(file "$BINARY_PATH")"
else
    echo -e "${RED}❌ 可执行文件不存在: $BINARY_PATH${NC}"
fi

# 3. 检查服务文件
echo ""
echo "⚙️  3. 检查服务文件"
SERVICE_FILE="$DEPLOY_PATH/star-cloud.service"
if [ -f "$SERVICE_FILE" ]; then
    echo -e "${GREEN}✅ 服务文件存在${NC}"
    echo "服务文件内容:"
    cat "$SERVICE_FILE"
else
    echo -e "${RED}❌ 服务文件不存在: $SERVICE_FILE${NC}"
fi

# 4. 检查 systemd 服务状态
echo ""
echo "🔄 4. 检查 systemd 服务状态"
if systemctl is-active --quiet star-cloud.service; then
    echo -e "${GREEN}✅ 服务正在运行${NC}"
else
    echo -e "${RED}❌ 服务未运行${NC}"
    echo "服务状态:"
    systemctl status star-cloud.service --no-pager --lines 5
fi

# 5. 检查端口监听
echo ""
echo "🌐 5. 检查端口监听"
if netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
    echo -e "${GREEN}✅ 8080 端口正在监听${NC}"
    netstat -tlnp | grep ":8080 "
else
    echo -e "${RED}❌ 8080 端口未监听${NC}"
fi

# 6. 检查健康检查端点
echo ""
echo "💚 6. 检查健康检查端点"
if curl -f -s http://127.0.0.1:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
    echo "健康检查响应:"
    curl -s http://127.0.0.1:8080/health
else
    echo -e "${RED}❌ 健康检查失败${NC}"
fi

# 7. 检查 Nginx 配置
echo ""
echo "🌐 7. 检查 Nginx 配置"
if nginx -t > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx 配置语法正确${NC}"
else
    echo -e "${RED}❌ Nginx 配置语法错误${NC}"
    nginx -t
fi

# 8. 检查 Nginx 服务状态
echo ""
echo "🔄 8. 检查 Nginx 服务状态"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx 服务正在运行${NC}"
else
    echo -e "${RED}❌ Nginx 服务未运行${NC}"
fi

# 9. 检查文件权限
echo ""
echo "🔐 9. 检查文件权限"
if [ -d "$DEPLOY_PATH" ]; then
    echo "部署目录权限:"
    ls -ld "$DEPLOY_PATH"
    echo "可执行文件权限:"
    if [ -f "$BINARY_PATH" ]; then
        ls -la "$BINARY_PATH"
    fi
fi

# 10. 检查日志
echo ""
echo "📋 10. 检查服务日志"
echo "最近的服务日志:"
journalctl -u star-cloud.service --no-pager --lines 10

echo ""
echo "📋 Nginx 错误日志:"
tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "无法读取 Nginx 错误日志"

# 11. 测试网站访问
echo ""
echo "🌐 11. 测试网站访问"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://redamancy.com.cn/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 网站可访问 (HTTP $HTTP_STATUS)${NC}"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${RED}❌ 网站返回 403 Forbidden${NC}"
    echo "可能的原因:"
    echo "  - 文件权限问题"
    echo "  - Nginx 配置问题"
    echo "  - 后端服务未启动"
elif [ "$HTTP_STATUS" = "404" ]; then
    echo -e "${YELLOW}⚠️  网站返回 404 Not Found${NC}"
else
    echo -e "${RED}❌ 网站无法访问 (HTTP $HTTP_STATUS)${NC}"
fi

echo ""
echo "🔍 诊断完成"
echo "=================================="

# 提供修复建议
echo ""
echo "🔧 常见修复命令:"
echo "1. 修复文件权限:"
echo "   sudo chown -R deploy:deploy $DEPLOY_PATH"
echo "   sudo chmod +x $BINARY_PATH"
echo ""
echo "2. 重启服务:"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl restart star-cloud.service"
echo ""
echo "3. 重载 Nginx:"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "4. 手动启动服务测试:"
echo "   cd $DEPLOY_PATH && ./star-cloud-linux" 