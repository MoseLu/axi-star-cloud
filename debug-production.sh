#!/bin/bash

# 生产环境诊断脚本
# 用于检查 axi-star-cloud 项目的部署状态

echo "🔍 开始生产环境诊断..."
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. 检查系统基本信息
echo -e "${BLUE}📋 系统信息${NC}"
echo "主机名: $(hostname)"
echo "系统版本: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "当前时间: $(date)"
echo ""

# 2. 检查后端服务状态
echo -e "${BLUE}🔧 后端服务状态${NC}"
if systemctl is-active --quiet star-cloud.service; then
    echo -e "${GREEN}✅ star-cloud.service 正在运行${NC}"
else
    echo -e "${RED}❌ star-cloud.service 未运行${NC}"
fi

echo "服务状态详情:"
systemctl status star-cloud.service --no-pager -l | head -20
echo ""

# 3. 检查端口占用
echo -e "${BLUE}🔌 端口占用情况${NC}"
echo "8080端口占用:"
netstat -tlnp | grep :8080 || echo "8080端口未被占用"
echo ""

# 4. 检查后端服务日志
echo -e "${BLUE}📝 后端服务日志 (最近20行)${NC}"
echo "启动日志:"
journalctl -u star-cloud.service --no-pager -n 20 | grep -E "(error|Error|ERROR|panic|Panic|PANIC|auth|Auth|AUTH|login|Login|LOGIN)" || echo "没有找到相关日志"
echo ""

# 5. 检查Nginx状态
echo -e "${BLUE}🌐 Nginx状态${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx 正在运行${NC}"
else
    echo -e "${RED}❌ Nginx 未运行${NC}"
fi

echo "Nginx配置语法检查:"
nginx -t 2>&1
echo ""

# 6. 检查Nginx配置文件
echo -e "${BLUE}📄 Nginx配置文件${NC}"
echo "主配置文件:"
if [ -f "/www/server/nginx/conf/vhost/redamancy.com.cn.conf" ]; then
    cat /www/server/nginx/conf/vhost/redamancy.com.cn.conf
else
    echo "主配置文件不存在"
fi
echo ""

echo "路由配置文件:"
if [ -f "/www/server/nginx/conf/conf.d/redamancy/route-axi-star-cloud.conf" ]; then
    cat /www/server/nginx/conf/conf.d/redamancy/route-axi-star-cloud.conf
else
    echo "路由配置文件不存在"
fi
echo ""

# 7. 检查部署目录
echo -e "${BLUE}📁 部署目录检查${NC}"
echo "检查 /srv/apps/axi-star-cloud/ 目录:"
if [ -d "/srv/apps/axi-star-cloud" ]; then
    echo -e "${GREEN}✅ 部署目录存在${NC}"
    ls -la /srv/apps/axi-star-cloud/
else
    echo -e "${RED}❌ 部署目录不存在${NC}"
fi
echo ""

# 8. 检查后端可执行文件
echo -e "${BLUE}🔧 后端可执行文件${NC}"
if [ -f "/srv/apps/axi-star-cloud/star-cloud-linux" ]; then
    echo -e "${GREEN}✅ 后端可执行文件存在${NC}"
    ls -la /srv/apps/axi-star-cloud/star-cloud-linux
else
    echo -e "${RED}❌ 后端可执行文件不存在${NC}"
fi
echo ""

# 9. 测试本地API端点
echo -e "${BLUE}🧪 本地API测试${NC}"
echo "测试健康检查端点:"
curl -s http://127.0.0.1:8080/health || echo "本地健康检查失败"
echo ""

echo "测试认证测试端点:"
curl -s http://127.0.0.1:8080/api/auth/test || echo "本地认证测试失败"
echo ""

echo "测试登录端点:"
curl -s -X POST http://127.0.0.1:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' || echo "本地登录测试失败"
echo ""

# 10. 测试生产API端点
echo -e "${BLUE}🌐 生产API测试${NC}"
echo "测试生产健康检查:"
curl -s https://redamancy.com.cn/health || echo "生产健康检查失败"
echo ""

echo "测试生产认证测试:"
curl -s https://redamancy.com.cn/api/auth/test || echo "生产认证测试失败"
echo ""

echo "测试生产登录端点:"
curl -s -X POST https://redamancy.com.cn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' || echo "生产登录测试失败"
echo ""

# 11. 检查防火墙
echo -e "${BLUE}🔥 防火墙检查${NC}"
if command -v firewall-cmd &> /dev/null; then
    echo "防火墙状态:"
    firewall-cmd --state
    echo "开放的端口:"
    firewall-cmd --list-ports
    echo "开放的服务:"
    firewall-cmd --list-services
else
    echo "firewall-cmd 不可用"
fi
echo ""

# 12. 检查系统资源
echo -e "${BLUE}💾 系统资源${NC}"
echo "内存使用:"
free -h
echo "磁盘使用:"
df -h /srv/apps/axi-star-cloud/
echo "CPU使用:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
echo ""

# 13. 生成修复建议
echo -e "${BLUE}🔧 修复建议${NC}"
echo "如果发现问题，请执行以下命令:"
echo ""
echo "1. 重启后端服务:"
echo "   sudo systemctl restart star-cloud.service"
echo ""
echo "2. 重新加载Nginx配置:"
echo "   sudo nginx -s reload"
echo ""
echo "3. 检查后端服务日志:"
echo "   sudo journalctl -u star-cloud.service -f"
echo ""
echo "4. 检查Nginx错误日志:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""

echo "=================================="
echo "🔍 诊断完成"
