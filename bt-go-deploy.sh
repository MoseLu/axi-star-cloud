#!/bin/bash

# 宝塔面板Go项目部署脚本
# 适用于星际云盘项目

set -e

echo "🚀 开始部署星际云盘项目..."

# 项目配置
PROJECT_NAME="axi-star-cloud"
PROJECT_PATH="/www/wwwroot/$PROJECT_NAME"
BACKEND_PATH="$PROJECT_PATH/backend"
FRONTEND_PATH="$PROJECT_PATH/front"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Go环境
check_go() {
    log_info "检查Go环境..."
    if ! command -v go &> /dev/null; then
        log_error "Go环境未安装，请在宝塔面板中安装Go环境"
        exit 1
    fi
    
    go_version=$(go version | awk '{print $3}')
    log_info "Go版本: $go_version"
}

# 编译Go程序
build_go() {
    log_info "编译Go程序..."
    cd "$BACKEND_PATH"
    
    # 设置Go代理（国内用户）
    export GOPROXY=https://goproxy.cn,direct
    export GOSUMDB=sum.golang.google.cn
    
    # 下载依赖
    log_info "下载Go依赖..."
    go mod download
    
    # 编译程序
    log_info "编译程序..."
    go build -o main main.go
    
    if [ ! -f "main" ]; then
        log_error "编译失败，请检查Go代码"
        exit 1
    fi
    
    log_info "编译成功: $BACKEND_PATH/main"
}

# 创建必要的目录和文件
create_directories() {
    log_info "创建必要的目录和文件..."
    
    # 创建上传目录
    mkdir -p "$FRONTEND_PATH/uploads/avatars"
    mkdir -p "$FRONTEND_PATH/uploads/image"
    mkdir -p "$FRONTEND_PATH/uploads/document"
    mkdir -p "$FRONTEND_PATH/uploads/audio"
    mkdir -p "$FRONTEND_PATH/uploads/video"
    mkdir -p "$FRONTEND_PATH/uploads/other"
    
    # 创建默认头像
    if [ ! -f "$FRONTEND_PATH/uploads/avatars/default.jpg" ]; then
        log_info "创建默认头像文件..."
        # 创建一个简单的默认头像（1x1像素的透明图片）
        echo -n -e '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\x27 ,#\x1c\x1c(7),01444\x1f\x27=9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9' > "$FRONTEND_PATH/uploads/avatars/default.jpg"
    fi
    
    # 设置目录权限
    chmod -R 755 "$FRONTEND_PATH/uploads"
    chown -R www:www "$FRONTEND_PATH/uploads" 2>/dev/null || true
}

# 修复权限
fix_permissions() {
    log_info "修复文件权限..."
    
    # 设置可执行权限
    chmod +x "$BACKEND_PATH/main"
    
    # 设置上传目录权限
    chmod -R 755 "$FRONTEND_PATH/uploads"
    chown -R www:www "$FRONTEND_PATH/uploads" 2>/dev/null || true
    
    # 设置数据库文件权限
    if [ -f "$BACKEND_PATH/cloud.db" ]; then
        chmod 644 "$BACKEND_PATH/cloud.db"
        chown www:www "$BACKEND_PATH/cloud.db" 2>/dev/null || true
    fi
    
    log_info "权限修复完成"
}

# 创建启动脚本
create_startup_script() {
    log_info "创建启动脚本..."
    
    cat > "$PROJECT_PATH/start.sh" << 'EOF'
#!/bin/bash

# 星际云盘启动脚本
PROJECT_PATH="/www/wwwroot/axi-star-cloud"
BACKEND_PATH="$PROJECT_PATH/backend"
LOG_PATH="$PROJECT_PATH/logs"

# 创建日志目录
mkdir -p "$LOG_PATH"

# 检查程序是否存在
if [ ! -f "$BACKEND_PATH/main" ]; then
    echo "错误: 可执行文件不存在，请先编译程序"
    exit 1
fi

# 停止现有进程
pkill -f "main" || true

# 启动程序
cd "$BACKEND_PATH"
nohup ./main > "$LOG_PATH/app.log" 2>&1 &

# 等待启动
sleep 2

# 检查进程
if pgrep -f "main" > /dev/null; then
    echo "✅ 程序启动成功，PID: $(pgrep -f 'main')"
    echo "📝 日志文件: $LOG_PATH/app.log"
    echo "🌐 访问地址: http://127.0.0.1:8080"
else
    echo "❌ 程序启动失败，请检查日志: $LOG_PATH/app.log"
    exit 1
fi
EOF

    chmod +x "$PROJECT_PATH/start.sh"
    log_info "启动脚本创建完成: $PROJECT_PATH/start.sh"
}

# 创建停止脚本
create_stop_script() {
    log_info "创建停止脚本..."
    
    cat > "$PROJECT_PATH/stop.sh" << 'EOF'
#!/bin/bash

# 星际云盘停止脚本
echo "🛑 停止星际云盘服务..."

# 查找并停止进程
PID=$(pgrep -f "main")
if [ ! -z "$PID" ]; then
    echo "找到进程 PID: $PID"
    kill $PID
    sleep 2
    
    # 强制停止（如果还在运行）
    if kill -0 $PID 2>/dev/null; then
        echo "强制停止进程..."
        kill -9 $PID
    fi
    
    echo "✅ 服务已停止"
else
    echo "⚠️  未找到运行中的服务"
fi
EOF

    chmod +x "$PROJECT_PATH/stop.sh"
    log_info "停止脚本创建完成: $PROJECT_PATH/stop.sh"
}

# 创建重启脚本
create_restart_script() {
    log_info "创建重启脚本..."
    
    cat > "$PROJECT_PATH/restart.sh" << 'EOF'
#!/bin/bash

# 星际云盘重启脚本
PROJECT_PATH="/www/wwwroot/axi-star-cloud"

echo "🔄 重启星际云盘服务..."

# 停止服务
$PROJECT_PATH/stop.sh

# 等待停止
sleep 2

# 启动服务
$PROJECT_PATH/start.sh
EOF

    chmod +x "$PROJECT_PATH/restart.sh"
    log_info "重启脚本创建完成: $PROJECT_PATH/restart.sh"
}

# 创建状态检查脚本
create_status_script() {
    log_info "创建状态检查脚本..."
    
    cat > "$PROJECT_PATH/status.sh" << 'EOF'
#!/bin/bash

# 星际云盘状态检查脚本
echo "📊 星际云盘服务状态"

# 检查进程
PID=$(pgrep -f "main")
if [ ! -z "$PID" ]; then
    echo "✅ 服务运行中，PID: $PID"
    echo "📝 进程信息:"
    ps -p $PID -o pid,ppid,cmd,etime
else
    echo "❌ 服务未运行"
fi

# 检查端口
if netstat -tlnp 2>/dev/null | grep ":8080" > /dev/null; then
    echo "✅ 端口8080正在监听"
else
    echo "❌ 端口8080未监听"
fi

# 检查日志
LOG_PATH="/www/wwwroot/axi-star-cloud/logs/app.log"
if [ -f "$LOG_PATH" ]; then
    echo "📝 最新日志 (最后10行):"
    tail -10 "$LOG_PATH"
else
    echo "⚠️  日志文件不存在"
fi
EOF

    chmod +x "$PROJECT_PATH/status.sh"
    log_info "状态检查脚本创建完成: $PROJECT_PATH/status.sh"
}

# 主函数
main() {
    log_info "开始部署星际云盘项目..."
    
    # 检查项目目录
    if [ ! -d "$PROJECT_PATH" ]; then
        log_error "项目目录不存在: $PROJECT_PATH"
        log_info "请先在宝塔面板中创建网站，然后下载项目代码"
        exit 1
    fi
    
    # 检查后端目录
    if [ ! -d "$BACKEND_PATH" ]; then
        log_error "后端目录不存在: $BACKEND_PATH"
        exit 1
    fi
    
    # 检查前端目录
    if [ ! -d "$FRONTEND_PATH" ]; then
        log_error "前端目录不存在: $FRONTEND_PATH"
        exit 1
    fi
    
    # 执行部署步骤
    check_go
    build_go
    create_directories
    fix_permissions
    create_startup_script
    create_stop_script
    create_restart_script
    create_status_script
    
    log_info "🎉 部署完成！"
    log_info ""
    log_info "📋 使用说明:"
    log_info "  启动服务: $PROJECT_PATH/start.sh"
    log_info "  停止服务: $PROJECT_PATH/stop.sh"
    log_info "  重启服务: $PROJECT_PATH/restart.sh"
    log_info "  查看状态: $PROJECT_PATH/status.sh"
    log_info ""
    log_info "🌐 访问地址: http://你的域名:8080"
    log_info "📝 日志文件: $PROJECT_PATH/logs/app.log"
    log_info ""
    log_info "⚠️  重要提醒:"
    log_info "  1. 确保在宝塔面板中配置了Nginx反向代理"
    log_info "  2. 目标URL设置为: http://127.0.0.1:8080"
    log_info "  3. 如果遇到权限问题，请运行: chown -R www:www $PROJECT_PATH"
}

# 执行主函数
main "$@" 