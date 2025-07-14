#!/bin/bash

# 权限修复脚本
# 解决头像上传和文件权限问题

set -e

echo "🔧 开始修复权限问题..."

# 项目配置
PROJECT_PATH="/www/wwwroot/axi-star-cloud"
BACKEND_PATH="$PROJECT_PATH/backend"
FRONTEND_PATH="$PROJECT_PATH/front"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查项目目录
if [ ! -d "$PROJECT_PATH" ]; then
    log_error "项目目录不存在: $PROJECT_PATH"
    exit 1
fi

# 修复上传目录权限
log_info "修复上传目录权限..."
mkdir -p "$FRONTEND_PATH/uploads/avatars"
mkdir -p "$FRONTEND_PATH/uploads/image"
mkdir -p "$FRONTEND_PATH/uploads/document"
mkdir -p "$FRONTEND_PATH/uploads/audio"
mkdir -p "$FRONTEND_PATH/uploads/video"
mkdir -p "$FRONTEND_PATH/uploads/other"

# 设置目录权限
chmod -R 755 "$FRONTEND_PATH/uploads"
chown -R www:www "$FRONTEND_PATH/uploads" 2>/dev/null || true

# 创建默认头像（如果不存在）
if [ ! -f "$FRONTEND_PATH/uploads/avatars/default.jpg" ]; then
    log_info "创建默认头像文件..."
    # 创建一个简单的默认头像
    echo -n -e '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\x27 ,#\x1c\x1c(7),01444\x1f\x27=9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9' > "$FRONTEND_PATH/uploads/avatars/default.jpg"
    chmod 644 "$FRONTEND_PATH/uploads/avatars/default.jpg"
    chown www:www "$FRONTEND_PATH/uploads/avatars/default.jpg" 2>/dev/null || true
fi

# 修复可执行文件权限
if [ -f "$BACKEND_PATH/main" ]; then
    log_info "修复可执行文件权限..."
    chmod +x "$BACKEND_PATH/main"
    chown www:www "$BACKEND_PATH/main" 2>/dev/null || true
fi

# 修复数据库文件权限
if [ -f "$BACKEND_PATH/cloud.db" ]; then
    log_info "修复数据库文件权限..."
    chmod 644 "$BACKEND_PATH/cloud.db"
    chown www:www "$BACKEND_PATH/cloud.db" 2>/dev/null || true
fi

# 修复整个项目目录权限
log_info "修复项目目录权限..."
chmod -R 755 "$PROJECT_PATH"
chown -R www:www "$PROJECT_PATH" 2>/dev/null || true

# 检查SELinux状态（如果存在）
if command -v sestatus &> /dev/null; then
    if sestatus | grep -q "enabled"; then
        log_warn "检测到SELinux已启用，可能需要额外配置"
        log_info "如果遇到权限问题，请运行: setsebool -P httpd_can_network_connect 1"
    fi
fi

log_info "✅ 权限修复完成！"
log_info ""
log_info "📋 下一步操作:"
log_info "1. 重新编译Go程序: cd $BACKEND_PATH && go build -o main main.go"
log_info "2. 启动服务: $PROJECT_PATH/start.sh"
log_info "3. 检查状态: $PROJECT_PATH/status.sh"
log_info ""
log_info "�� 访问地址: http://你的域名" 