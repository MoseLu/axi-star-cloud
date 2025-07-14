#!/bin/bash

# 宝塔面板Go项目简化部署脚本
# 自动配置SQLite数据库，无需MySQL

set -e

echo "🚀 开始宝塔面板Go项目简化部署..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root用户运行此脚本"
    exit 1
fi

# 检查Go是否安装
if ! command -v go &> /dev/null; then
    echo "📦 请先在宝塔面板中安装Go环境"
    exit 1
fi

# 设置项目路径
PROJECT_PATH="/www/wwwroot/axi-star-cloud"
PROJECT_NAME="axi-star-cloud"
PORT=8080

echo "📁 创建项目目录..."
mkdir -p $PROJECT_PATH
cd $PROJECT_PATH

# 克隆项目（如果目录为空）
if [ ! "$(ls -A)" ]; then
    echo "📥 克隆项目代码..."
    git clone https://github.com/MoseLu/axi-star-cloud.git .
fi

# 停止现有进程
echo "🛑 停止现有进程..."
pkill -f "axi-star-cloud" 2>/dev/null || true

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 设置Go代理
export GOPROXY=https://goproxy.cn,direct
export GOSUMDB=sum.golang.google.cn

# 进入后端目录
cd backend

# 下载依赖
echo "📦 下载Go依赖..."
go mod download

# 确保SQLite配置正确
echo "🔧 配置SQLite数据库..."
if [ -f "config/config.yaml" ]; then
    # 备份原配置
    cp config/config.yaml config/config.yaml.backup
    
    # 更新为SQLite配置
    cat > config/config.yaml << EOF
driver: sqlite3
dsn: ./docs.db
EOF
    echo "✅ SQLite配置已更新"
else
    echo "❌ 配置文件不存在"
    exit 1
fi

# 构建应用
echo "🔨 构建Go应用..."
CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main .

# 返回项目根目录
cd ..

# 创建启动脚本
echo "📝 创建启动脚本..."
cat > start.sh << 'EOF'
#!/bin/bash
cd /www/wwwroot/axi-star-cloud/backend
./main
EOF

chmod +x start.sh

# 创建systemd服务文件
echo "🔧 创建系统服务..."
cat > /etc/systemd/system/axi-star-cloud.service << EOF
[Unit]
Description=Axi Star Cloud Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/www/wwwroot/axi-star-cloud/backend
ExecStart=/www/wwwroot/axi-star-cloud/backend/main
Restart=always
RestartSec=5
Environment=GIN_MODE=release

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd
systemctl daemon-reload

# 启用并启动服务
echo "🚀 启动服务..."
systemctl enable axi-star-cloud
systemctl start axi-star-cloud

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if systemctl is-active --quiet axi-star-cloud; then
    echo "✅ 部署成功！服务运行在 http://localhost:$PORT"
    echo "📊 服务状态："
    systemctl status axi-star-cloud --no-pager -l
else
    echo "❌ 部署失败，请检查日志"
    journalctl -u axi-star-cloud --no-pager -l
    exit 1
fi

echo "🎉 部署完成！"
echo "📋 常用命令："
echo "  查看状态: systemctl status axi-star-cloud"
echo "  查看日志: journalctl -u axi-star-cloud -f"
echo "  重启服务: systemctl restart axi-star-cloud"
echo "  停止服务: systemctl stop axi-star-cloud"
echo ""
echo "💡 数据库文件位置: /www/wwwroot/axi-star-cloud/backend/docs.db" 