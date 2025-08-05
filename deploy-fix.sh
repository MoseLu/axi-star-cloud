#!/bin/bash

echo "🔧 AXI Star Cloud 部署自动修复脚本"
echo "===================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DEPLOY_PATH="/srv/apps/axi-star-cloud"
BINARY_PATH="$DEPLOY_PATH/star-cloud-linux"

# 修复函数
fix_step() {
    local step="$1"
    local command="$2"
    local description="$3"
    
    echo -n "🔧 $step... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 成功${NC}"
        if [ "$description" != "" ]; then
            echo "   $description"
        fi
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        return 1
    fi
}

echo ""
echo "📋 开始自动修复..."

# 1. 创建部署目录（如果不存在）
fix_step "创建部署目录" \
    "sudo mkdir -p $DEPLOY_PATH" \
    "确保部署目录存在"

# 2. 修复文件权限
fix_step "修复文件权限" \
    "sudo chown -R deploy:deploy $DEPLOY_PATH" \
    "设置正确的文件所有者"

fix_step "设置可执行权限" \
    "sudo chmod +x $BINARY_PATH" \
    "确保二进制文件可执行"

# 3. 创建必要目录
fix_step "创建上传目录" \
    "sudo mkdir -p $DEPLOY_PATH/uploads/{image,document,audio,video,other,avatars}" \
    "创建文件上传目录"

fix_step "创建日志目录" \
    "sudo mkdir -p $DEPLOY_PATH/logs" \
    "创建日志目录"

fix_step "设置目录权限" \
    "sudo chown -R deploy:deploy $DEPLOY_PATH/uploads $DEPLOY_PATH/logs" \
    "设置目录权限"

# 4. 检查并修复服务文件
echo ""
echo "⚙️  检查服务文件..."
if [ -f "$DEPLOY_PATH/star-cloud.service" ]; then
    echo "✅ 服务文件存在"
    
    # 检查服务文件中的路径是否正确
    if grep -q "WorkingDirectory=/srv/apps/axi-star-cloud" "$DEPLOY_PATH/star-cloud.service"; then
        echo "✅ 服务文件路径配置正确"
    else
        echo "⚠️  修复服务文件路径..."
        sudo sed -i 's|WorkingDirectory=.*|WorkingDirectory=/srv/apps/axi-star-cloud|g' "$DEPLOY_PATH/star-cloud.service"
        sudo sed -i 's|ExecStart=.*|ExecStart=/srv/apps/axi-star-cloud/star-cloud-linux|g' "$DEPLOY_PATH/star-cloud.service"
        sudo sed -i 's|User=.*|User=deploy|g' "$DEPLOY_PATH/star-cloud.service"
        sudo sed -i 's|Group=.*|Group=deploy|g' "$DEPLOY_PATH/star-cloud.service"
        echo "✅ 服务文件已修复"
    fi
else
    echo "❌ 服务文件不存在，请检查部署包"
fi

# 5. 重新加载 systemd
fix_step "重新加载 systemd" \
    "sudo systemctl daemon-reload" \
    "重新加载服务配置"

# 6. 启用服务
fix_step "启用服务" \
    "sudo systemctl enable star-cloud.service" \
    "设置服务开机自启"

# 7. 重启服务
fix_step "重启服务" \
    "sudo systemctl restart star-cloud.service" \
    "重启后端服务"

# 8. 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 10

# 9. 检查服务状态
echo ""
echo "🔍 检查服务状态..."
if systemctl is-active --quiet star-cloud.service; then
    echo -e "${GREEN}✅ 服务启动成功${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo "服务状态:"
    sudo systemctl status star-cloud.service --no-pager --lines 10
    echo ""
    echo "服务日志:"
    sudo journalctl -u star-cloud.service --no-pager --lines 10
fi

# 10. 检查端口监听
echo ""
echo "🌐 检查端口监听..."
if netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
    echo -e "${GREEN}✅ 8080 端口正在监听${NC}"
    netstat -tlnp | grep ":8080 "
else
    echo -e "${RED}❌ 8080 端口未监听${NC}"
fi

# 11. 测试健康检查
echo ""
echo "💚 测试健康检查..."
if curl -f -s http://127.0.0.1:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
    echo "健康检查响应:"
    curl -s http://127.0.0.1:8080/health
else
    echo -e "${RED}❌ 健康检查失败${NC}"
fi

# 12. 检查 Nginx 配置
echo ""
echo "🌐 检查 Nginx 配置..."
if nginx -t > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx 配置语法正确${NC}"
    
    # 重载 Nginx
    fix_step "重载 Nginx" \
        "sudo systemctl reload nginx" \
        "应用 Nginx 配置更改"
else
    echo -e "${RED}❌ Nginx 配置语法错误${NC}"
    nginx -t
fi

# 13. 最终测试
echo ""
echo "🌐 最终测试..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://redamancy.com.cn/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 网站访问正常 (HTTP $HTTP_STATUS)${NC}"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${YELLOW}⚠️  网站返回 403，可能需要进一步检查${NC}"
    echo "建议检查:"
    echo "  - Nginx 配置文件路径"
    echo "  - 静态文件路径"
    echo "  - 后端服务状态"
else
    echo -e "${RED}❌ 网站无法访问 (HTTP $HTTP_STATUS)${NC}"
fi

echo ""
echo "🔧 自动修复完成"
echo "===================================="

# 提供手动检查命令
echo ""
echo "🔍 如需进一步诊断，请运行:"
echo "   ./deploy-diagnostic.sh"
echo ""
echo "📋 常见手动修复命令:"
echo "1. 手动启动服务测试:"
echo "   cd $DEPLOY_PATH && ./star-cloud-linux"
echo ""
echo "2. 检查 Nginx 错误日志:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
echo "3. 检查服务日志:"
echo "   sudo journalctl -u star-cloud.service -f" 