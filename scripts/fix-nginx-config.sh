#!/bin/bash

# axi-star-cloud Nginx配置修复脚本
# 解决502错误问题

echo "🔧 开始修复 axi-star-cloud Nginx配置..."

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请以root权限运行此脚本"
    echo "使用方法: sudo bash scripts/fix-nginx-config.sh"
    exit 1
fi

# 定义变量
NGINX_CONF_DIR="/www/server/nginx/conf/conf.d/redamancy"
STAR_CLOUD_CONF="$NGINX_CONF_DIR/star-cloud.conf"
BACKUP_DIR="$NGINX_CONF_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📋 配置信息:"
echo "- Nginx配置目录: $NGINX_CONF_DIR"
echo "- 配置文件: $STAR_CLOUD_CONF"
echo "- 备份目录: $BACKUP_DIR"

# 创建备份目录
echo "📁 创建备份目录..."
mkdir -p "$BACKUP_DIR"

# 备份现有配置
if [ -f "$STAR_CLOUD_CONF" ]; then
    echo "📋 备份现有配置文件..."
    cp "$STAR_CLOUD_CONF" "$BACKUP_DIR/star-cloud.conf.backup.$TIMESTAMP"
    echo "✅ 配置文件已备份到: $BACKUP_DIR/star-cloud.conf.backup.$TIMESTAMP"
else
    echo "📋 没有找到现有配置文件，将创建新文件"
fi

# 复制新的配置文件
echo "📋 复制新的Nginx配置文件..."
cp "nginx-star-cloud.conf" "$STAR_CLOUD_CONF"

if [ $? -eq 0 ]; then
    echo "✅ 配置文件复制成功"
else
    echo "❌ 配置文件复制失败"
    exit 1
fi

# 设置正确的权限
echo "🔐 设置文件权限..."
chmod 644 "$STAR_CLOUD_CONF"
chown nginx:nginx "$STAR_CLOUD_CONF" 2>/dev/null || chown www-data:www-data "$STAR_CLOUD_CONF" 2>/dev/null || echo "⚠️ 无法设置所有者，但继续执行"

# 检查Nginx配置语法
echo "🔍 检查Nginx配置语法..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx配置语法正确"
else
    echo "❌ Nginx配置语法错误，请检查配置文件"
    echo "📋 错误详情:"
    nginx -t 2>&1
    exit 1
fi

# 检查后端服务状态
echo "🔍 检查后端服务状态..."
if systemctl is-active --quiet star-cloud; then
    echo "✅ star-cloud 服务正在运行"
else
    echo "⚠️ star-cloud 服务未运行，尝试启动..."
    systemctl start star-cloud
    sleep 3
    
    if systemctl is-active --quiet star-cloud; then
        echo "✅ star-cloud 服务启动成功"
    else
        echo "❌ star-cloud 服务启动失败"
        echo "📋 服务状态:"
        systemctl status star-cloud --no-pager -l
    fi
fi

# 检查端口监听
echo "🔍 检查端口监听状态..."
if netstat -tlnp 2>/dev/null | grep -q ":8124"; then
    echo "✅ 端口8124正在监听"
else
    echo "❌ 端口8124未监听"
    echo "📋 当前监听的端口:"
    netstat -tlnp 2>/dev/null | grep LISTEN | head -10
fi

# 测试本地连接
echo "🔍 测试本地API连接..."
if curl -f http://localhost:8124/health > /dev/null 2>&1; then
    echo "✅ 本地API连接正常"
else
    echo "❌ 本地API连接失败"
    echo "📋 尝试获取错误信息:"
    curl -v http://localhost:8124/health 2>&1 | head -10
fi

# 重载Nginx配置
echo "🔄 重载Nginx配置..."
systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx配置重载成功"
else
    echo "❌ Nginx配置重载失败"
    echo "📋 尝试重启Nginx..."
    systemctl restart nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx重启成功"
    else
        echo "❌ Nginx重启失败"
        echo "📋 Nginx状态:"
        systemctl status nginx --no-pager -l
        exit 1
    fi
fi

# 等待服务稳定
echo "⏳ 等待服务稳定..."
sleep 5

# 测试外部访问
echo "🔍 测试外部API访问..."
if curl -f https://redamancy.com.cn/api/auth/validate > /dev/null 2>&1; then
    echo "✅ 外部API访问正常"
else
    echo "⚠️ 外部API访问失败，但可能是正常的（需要登录）"
    echo "📋 尝试访问健康检查端点:"
    curl -I https://redamancy.com.cn/health 2>/dev/null || echo "健康检查端点访问失败"
fi

# 检查防火墙设置
echo "🔍 检查防火墙设置..."
if command -v ufw > /dev/null 2>&1; then
    echo "📋 UFW防火墙状态:"
    ufw status
elif command -v firewall-cmd > /dev/null 2>&1; then
    echo "📋 firewalld状态:"
    firewall-cmd --state
else
    echo "📋 未检测到常见防火墙，检查iptables:"
    iptables -L | head -10
fi

# 显示最终状态
echo ""
echo "🎉 Nginx配置修复完成！"
echo ""
echo "📋 修复总结:"
echo "- ✅ Nginx配置文件已更新"
echo "- ✅ 配置文件语法检查通过"
echo "- ✅ Nginx服务已重载"
echo "- ✅ 后端服务状态已检查"
echo "- ✅ 端口监听状态已检查"
echo ""
echo "📋 重要信息:"
echo "- 配置文件位置: $STAR_CLOUD_CONF"
echo "- 备份文件位置: $BACKUP_DIR"
echo "- 后端服务端口: 8124"
echo "- 前端访问地址: https://redamancy.com.cn"
echo ""
echo "🔧 如果仍有问题，请检查:"
echo "1. 后端服务是否正常运行: systemctl status star-cloud"
echo "2. 端口是否监听: netstat -tlnp | grep 8124"
echo "3. 本地API测试: curl http://localhost:8124/health"
echo "4. Nginx错误日志: tail -f /var/log/nginx/error.log"
echo "5. 后端服务日志: journalctl -u star-cloud -f"
