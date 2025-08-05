#!/bin/bash

echo "🚀 AXI Star Cloud 快速修复脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DEPLOY_PATH="/srv/apps/axi-star-cloud"
BINARY_PATH="$DEPLOY_PATH/star-cloud-linux"

echo ""
echo "🔍 1. 检查后端服务状态..."
if systemctl is-active --quiet star-cloud.service; then
    echo -e "${GREEN}✅ 后端服务正在运行${NC}"
else
    echo -e "${RED}❌ 后端服务未运行，正在启动...${NC}"
    sudo systemctl restart star-cloud.service
    sleep 5
    
    if systemctl is-active --quiet star-cloud.service; then
        echo -e "${GREEN}✅ 后端服务启动成功${NC}"
    else
        echo -e "${RED}❌ 后端服务启动失败${NC}"
        echo "服务日志:"
        sudo journalctl -u star-cloud.service --no-pager --lines 5
    fi
fi

echo ""
echo "🌐 2. 检查端口监听..."
if netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
    echo -e "${GREEN}✅ 8080 端口正在监听${NC}"
else
    echo -e "${RED}❌ 8080 端口未监听${NC}"
fi

echo ""
echo "💚 3. 测试后端健康检查..."
if curl -f -s http://127.0.0.1:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端健康检查通过${NC}"
else
    echo -e "${RED}❌ 后端健康检查失败${NC}"
fi

echo ""
echo "🌐 4. 检查 Nginx 配置..."
if nginx -t > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx 配置语法正确${NC}"
    sudo systemctl reload nginx
else
    echo -e "${RED}❌ Nginx 配置语法错误${NC}"
    nginx -t
fi

echo ""
echo "🔐 5. 检查文件权限..."
if [ -d "$DEPLOY_PATH" ]; then
    echo "修复文件权限..."
    sudo chown -R deploy:deploy "$DEPLOY_PATH"
    sudo chmod +x "$BINARY_PATH"
    echo -e "${GREEN}✅ 文件权限已修复${NC}"
else
    echo -e "${RED}❌ 部署目录不存在${NC}"
fi

echo ""
echo "🌐 6. 最终测试..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://redamancy.com.cn/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 网站访问正常 (HTTP $HTTP_STATUS)${NC}"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${YELLOW}⚠️  网站返回 403，检查 Nginx 错误日志...${NC}"
    echo "Nginx 错误日志:"
    sudo tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "无法读取错误日志"
else
    echo -e "${RED}❌ 网站无法访问 (HTTP $HTTP_STATUS)${NC}"
fi

echo ""
echo "🔧 快速修复完成"
echo "================================" 