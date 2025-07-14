#!/bin/bash

# 自动部署脚本 - 服务器端
# 用于接收GitHub Actions的自动部署

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 项目配置
PROJECT_PATH="/www/wwwroot/axi-star-cloud"
BACKEND_PATH="$PROJECT_PATH/backend"
LOGS_PATH="$PROJECT_PATH/logs"
PID_FILE="$PROJECT_PATH/pid.txt"

# 创建日志目录
mkdir -p "$LOGS_PATH"

log_step "开始自动部署..."

# 检查项目目录
if [ ! -d "$PROJECT_PATH" ]; then
    log_error "项目目录不存在: $PROJECT_PATH"
    exit 1
fi

cd "$PROJECT_PATH"

# 备份当前版本
log_step "备份当前版本..."
if [ -f "$BACKEND_PATH/main" ]; then
    BACKUP_NAME="main.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$BACKEND_PATH/main" "$BACKEND_PATH/$BACKUP_NAME"
    log_info "已备份到: $BACKUP_NAME"
fi

# 拉取最新代码
log_step "拉取最新代码..."
git fetch origin
git reset --hard origin/main
log_info "代码更新完成"

# 运行权限修复脚本
log_step "修复权限..."
if [ -f "fix-permissions.sh" ]; then
    chmod +x fix-permissions.sh
    ./fix-permissions.sh
    log_info "权限修复完成"
fi

# 重新编译Go程序
log_step "编译Go程序..."
cd "$BACKEND_PATH"
go mod download
go build -o main main.go
chmod +x main
log_info "编译完成"

# 停止当前服务
log_step "停止当前服务..."
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID"
        log_info "已停止进程: $PID"
    fi
fi

# 等待进程完全停止
sleep 3

# 启动新服务
log_step "启动新服务..."
cd "$BACKEND_PATH"
nohup ./main > "$LOGS_PATH/app.log" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
log_info "新服务已启动，PID: $NEW_PID"

# 等待服务启动
log_step "等待服务启动..."
sleep 5

# 检查服务状态
log_step "检查服务状态..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    log_info "✅ 部署成功！服务已启动"
    
    # 清理旧备份（保留最近3个）
    cd "$BACKEND_PATH"
    ls -t main.backup.* 2>/dev/null | tail -n +4 | xargs -r rm
    log_info "已清理旧备份文件"
    
else
    log_error "❌ 部署失败，服务启动失败"
    
    # 回滚到备份版本
    log_step "回滚到备份版本..."
    cd "$BACKEND_PATH"
    if ls main.backup.* > /dev/null 2>&1; then
        LATEST_BACKUP=$(ls -t main.backup.* | head -1)
        mv "$LATEST_BACKUP" main
        chmod +x main
        
        # 重新启动服务
        nohup ./main > "$LOGS_PATH/app.log" 2>&1 &
        NEW_PID=$!
        echo "$NEW_PID" > "$PID_FILE"
        log_info "已回滚并重新启动服务，PID: $NEW_PID"
    else
        log_error "没有可用的备份版本"
    fi
fi

log_step "部署完成！"
log_info "服务日志: $LOGS_PATH/app.log"
log_info "进程ID: $(cat "$PID_FILE" 2>/dev/null || echo '未找到')" 