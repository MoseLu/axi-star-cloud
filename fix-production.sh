#!/bin/bash

# 生产环境快速修复脚本
# 用于重启服务和重新加载配置

echo "🔧 开始生产环境修复..."
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 检查并重启后端服务
echo -e "${BLUE}🔧 重启后端服务${NC}"
echo "停止后端服务..."
sudo systemctl stop star-cloud.service

echo "等待服务完全停止..."
sleep 3

echo "启动后端服务..."
sudo systemctl start star-cloud.service

echo "检查服务状态..."
if systemctl is-active --quiet star-cloud.service; then
    echo -e "${GREEN}✅ 后端服务启动成功${NC}"
else
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    echo "查看服务状态:"
    sudo systemctl status star-cloud.service --no-pager -l
fi
echo ""

# 2. 重新加载Nginx配置
echo -e "${BLUE}🌐 重新加载Nginx配置${NC}"
echo "检查Nginx配置语法..."
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx配置语法正确${NC}"
    echo "重新加载Nginx配置..."
    sudo nginx -s reload
    echo -e "${GREEN}✅ Nginx配置重新加载完成${NC}"
else
    echo -e "${RED}❌ Nginx配置语法错误${NC}"
    echo "Nginx配置错误详情:"
    sudo nginx -t 2>&1
fi
echo ""

# 3. 检查端口占用
echo -e "${BLUE}🔌 检查端口占用${NC}"
echo "8080端口占用情况:"
netstat -tlnp | grep :8080 || echo "8080端口未被占用"
echo ""

# 4. 测试API端点
echo -e "${BLUE}🧪 测试API端点${NC}"
echo "等待服务完全启动..."
sleep 5

echo "测试健康检查端点:"
if curl -s http://127.0.0.1:8080/health > /dev/null; then
    echo -e "${GREEN}✅ 本地健康检查成功${NC}"
else
    echo -e "${RED}❌ 本地健康检查失败${NC}"
fi

echo "测试认证测试端点:"
if curl -s http://127.0.0.1:8080/api/auth/test > /dev/null; then
    echo -e "${GREEN}✅ 本地认证测试成功${NC}"
else
    echo -e "${RED}❌ 本地认证测试失败${NC}"
fi

echo "测试生产健康检查:"
if curl -s https://redamancy.com.cn/health > /dev/null; then
    echo -e "${GREEN}✅ 生产健康检查成功${NC}"
else
    echo -e "${RED}❌ 生产健康检查失败${NC}"
fi

echo "测试生产认证测试:"
if curl -s https://redamancy.com.cn/api/auth/test > /dev/null; then
    echo -e "${GREEN}✅ 生产认证测试成功${NC}"
else
    echo -e "${RED}❌ 生产认证测试失败${NC}"
fi
echo ""

# 5. 显示服务日志
echo -e "${BLUE}📝 后端服务日志 (最近10行)${NC}"
sudo journalctl -u star-cloud.service --no-pager -n 10
echo ""

# 6. 显示Nginx错误日志
echo -e "${BLUE}📝 Nginx错误日志 (最近10行)${NC}"
sudo tail -n 10 /var/log/nginx/error.log 2>/dev/null || echo "无法读取Nginx错误日志"
echo ""

echo "=================================="
echo "🔧 修复完成"
echo ""
echo "如果问题仍然存在，请运行诊断脚本:"
echo "bash debug-production.sh"
