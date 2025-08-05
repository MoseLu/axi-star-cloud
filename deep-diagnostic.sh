#!/bin/bash

echo "🔍 AXI Star Cloud 深度诊断脚本"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY_PATH="/srv/apps/axi-star-cloud"
BINARY_PATH="$DEPLOY_PATH/star-cloud-linux"

echo ""
echo "📁 1. 检查部署目录结构..."
if [ -d "$DEPLOY_PATH" ]; then
    echo -e "${GREEN}✅ 部署目录存在: $DEPLOY_PATH${NC}"
    echo "目录内容:"
    ls -la "$DEPLOY_PATH"
else
    echo -e "${RED}❌ 部署目录不存在: $DEPLOY_PATH${NC}"
    echo "创建部署目录..."
    sudo mkdir -p "$DEPLOY_PATH"
fi

echo ""
echo "🔧 2. 检查可执行文件..."
if [ -f "$BINARY_PATH" ]; then
    echo -e "${GREEN}✅ 可执行文件存在${NC}"
    echo "文件信息:"
    ls -la "$BINARY_PATH"
    echo "文件类型: $(file "$BINARY_PATH")"
else
    echo -e "${RED}❌ 可执行文件不存在: $BINARY_PATH${NC}"
    echo "查找可能的二进制文件..."
    find "$DEPLOY_PATH" -name "*.exe" -o -name "*linux*" -o -name "*cloud*" 2>/dev/null || echo "未找到相关文件"
fi

echo ""
echo "📦 3. 检查部署包..."
echo "查找部署包文件..."
find /tmp -name "*axi-star-cloud*" -o -name "*star-cloud*" 2>/dev/null | head -5
find /home -name "*axi-star-cloud*" -o -name "*star-cloud*" 2>/dev/null | head -5

echo ""
echo "🔍 4. 检查服务文件..."
SERVICE_FILE="$DEPLOY_PATH/star-cloud.service"
if [ -f "$SERVICE_FILE" ]; then
    echo -e "${GREEN}✅ 服务文件存在${NC}"
    echo "服务文件内容:"
    cat "$SERVICE_FILE"
else
    echo -e "${RED}❌ 服务文件不存在${NC}"
fi

echo ""
echo "📋 5. 检查系统服务状态..."
if systemctl list-unit-files | grep -q star-cloud; then
    echo -e "${GREEN}✅ 系统服务已注册${NC}"
    systemctl status star-cloud.service --no-pager --lines 3
else
    echo -e "${RED}❌ 系统服务未注册${NC}"
fi

echo ""
echo "🔐 6. 检查用户和权限..."
echo "当前用户: $(whoami)"
echo "部署目录所有者: $(ls -ld "$DEPLOY_PATH" 2>/dev/null | awk '{print $3":"$4}' || echo "无法获取")"
echo "deploy用户是否存在: $(id deploy 2>/dev/null && echo "是" || echo "否")"

echo ""
echo "📦 7. 检查可能的部署位置..."
POSSIBLE_PATHS=(
    "/srv/apps/axi-star-cloud"
    "/opt/axi-star-cloud"
    "/home/deploy/axi-star-cloud"
    "/var/www/axi-star-cloud"
    "/usr/local/axi-star-cloud"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo -e "${BLUE}📁 发现目录: $path${NC}"
        ls -la "$path" | head -5
        if [ -f "$path/star-cloud-linux" ]; then
            echo -e "${GREEN}✅ 找到可执行文件: $path/star-cloud-linux${NC}"
        fi
    fi
done

echo ""
echo "🔧 8. 修复建议..."
echo "如果可执行文件不存在，请执行以下步骤："
echo "1. 重新构建项目:"
echo "   cd /path/to/axi-star-cloud"
echo "   go build -o star-cloud-linux"
echo ""
echo "2. 复制到部署目录:"
echo "   sudo cp star-cloud-linux $DEPLOY_PATH/"
echo "   sudo chown deploy:deploy $DEPLOY_PATH/star-cloud-linux"
echo "   sudo chmod +x $DEPLOY_PATH/star-cloud-linux"
echo ""
echo "3. 重启服务:"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl restart star-cloud.service"

echo ""
echo "🔍 深度诊断完成"
echo "================================" 