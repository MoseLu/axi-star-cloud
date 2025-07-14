#!/bin/bash

# 网络修复脚本 - 解决GitHub连接问题

echo "🔧 开始修复网络连接问题..."

# 检查网络连接
echo "📡 检查网络连接..."
ping -c 3 github.com

# 检查DNS解析
echo "🌐 检查DNS解析..."
nslookup github.com

# 检查443端口连接
echo "🔌 检查443端口连接..."
telnet github.com 443

# 设置Git代理（如果需要）
echo "⚙️  配置Git代理..."

# 方法1: 使用国内镜像
git config --global url."https://ghproxy.com/https://github.com".insteadOf "https://github.com"

# 方法2: 设置HTTP代理（如果有的话）
# git config --global http.proxy http://proxy.example.com:8080
# git config --global https.proxy https://proxy.example.com:8080

# 方法3: 使用SSH替代HTTPS
echo "🔑 配置SSH连接..."
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "生成SSH密钥..."
    ssh-keygen -t rsa -b 4096 -C "deploy@server" -f ~/.ssh/id_rsa -N ""
fi

# 显示公钥
echo "📋 SSH公钥（请添加到GitHub）："
cat ~/.ssh/id_rsa.pub

# 测试SSH连接
echo "🔍 测试SSH连接..."
ssh -T git@github.com

echo "✅ 网络修复完成！"
echo ""
echo "📝 如果仍有问题，请尝试以下方法："
echo "1. 检查防火墙设置"
echo "2. 联系网络管理员"
echo "3. 使用VPN或代理"
echo "4. 更换DNS服务器" 