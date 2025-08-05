#!/bin/bash

echo "🔧 AXI Star Cloud 自动修复脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY_PATH="/srv/apps/axi-star-cloud"
BINARY_PATH="$DEPLOY_PATH/star-cloud-linux"
SOURCE_PATH="/root/axi-star-cloud"

echo ""
echo "🔍 1. 检查源代码目录..."
if [ -d "$SOURCE_PATH" ]; then
    echo -e "${GREEN}✅ 源代码目录存在: $SOURCE_PATH${NC}"
    cd "$SOURCE_PATH"
else
    echo -e "${RED}❌ 源代码目录不存在: $SOURCE_PATH${NC}"
    echo "尝试查找源代码..."
    SOURCE_PATH=$(find /root -name "axi-star-cloud" -type d 2>/dev/null | head -1)
    if [ -n "$SOURCE_PATH" ]; then
        echo -e "${GREEN}✅ 找到源代码目录: $SOURCE_PATH${NC}"
        cd "$SOURCE_PATH"
    else
        echo -e "${RED}❌ 未找到源代码目录${NC}"
        exit 1
    fi
fi

echo ""
echo "🔧 2. 检查Go环境..."
if command -v go >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Go已安装${NC}"
    echo "Go版本: $(go version)"
else
    echo -e "${RED}❌ Go未安装${NC}"
    echo "安装Go..."
    sudo yum install -y golang || sudo apt-get install -y golang-go
fi

echo ""
echo "📦 3. 构建项目..."
echo "当前目录: $(pwd)"
if [ -f "go.mod" ]; then
    echo -e "${GREEN}✅ 找到go.mod文件${NC}"
    echo "构建项目..."
    go mod tidy
    go build -o star-cloud-linux .
    
    if [ -f "star-cloud-linux" ]; then
        echo -e "${GREEN}✅ 构建成功${NC}"
        ls -la star-cloud-linux
    else
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ 未找到go.mod文件${NC}"
    exit 1
fi

echo ""
echo "📁 4. 创建部署目录..."
sudo mkdir -p "$DEPLOY_PATH"
sudo chown deploy:deploy "$DEPLOY_PATH"

echo ""
echo "📋 5. 复制文件到部署目录..."
sudo cp star-cloud-linux "$DEPLOY_PATH/"
sudo cp star-cloud.service "$DEPLOY_PATH/"
sudo chown deploy:deploy "$DEPLOY_PATH/star-cloud-linux"
sudo chmod +x "$DEPLOY_PATH/star-cloud-linux"

echo ""
echo "📁 6. 创建必要目录..."
sudo mkdir -p "$DEPLOY_PATH/uploads"
sudo mkdir -p "$DEPLOY_PATH/logs"
sudo chown -R deploy:deploy "$DEPLOY_PATH/uploads" "$DEPLOY_PATH/logs"

echo ""
echo "⚙️  7. 配置服务..."
sudo cp "$DEPLOY_PATH/star-cloud.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable star-cloud.service

echo ""
echo "🔄 8. 启动服务..."
sudo systemctl restart star-cloud.service
sleep 5

echo ""
echo "🔍 9. 检查服务状态..."
if systemctl is-active --quiet star-cloud.service; then
    echo -e "${GREEN}✅ 服务启动成功${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo "服务日志:"
    sudo journalctl -u star-cloud.service --no-pager --lines 10
fi

echo ""
echo "🌐 10. 检查端口监听..."
if netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
    echo -e "${GREEN}✅ 8080 端口正在监听${NC}"
    netstat -tlnp | grep ":8080 "
else
    echo -e "${RED}❌ 8080 端口未监听${NC}"
fi

echo ""
echo "💚 11. 测试健康检查..."
if curl -f -s http://127.0.0.1:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
    echo "健康检查响应:"
    curl -s http://127.0.0.1:8080/health
else
    echo -e "${RED}❌ 健康检查失败${NC}"
fi

echo ""
echo "🌐 12. 重载Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "🌐 13. 最终测试..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://redamancy.com.cn/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 网站访问正常 (HTTP $HTTP_STATUS)${NC}"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${YELLOW}⚠️  网站返回 403，可能需要进一步检查${NC}"
else
    echo -e "${RED}❌ 网站无法访问 (HTTP $HTTP_STATUS)${NC}"
fi

echo ""
echo "🔧 自动修复完成"
echo "================================" 