#!/bin/bash

# 服务管理脚本
# 用于管理星际云盘服务的启动、停止、重启等操作

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

# 项目配置
PROJECT_PATH="/www/wwwroot/axi-star-cloud"
BACKEND_PATH="$PROJECT_PATH/backend"
LOGS_PATH="$PROJECT_PATH/logs"
PID_FILE="$PROJECT_PATH/pid.txt"

# 创建必要的目录
mkdir -p "$LOGS_PATH"

# 获取服务状态
get_status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "running"
            return 0
        else
            echo "stopped"
            return 1
        fi
    else
        echo "stopped"
        return 1
    fi
}

# 启动服务
start_service() {
    log_info "启动服务..."
    
    # 检查是否已经运行
    if get_status > /dev/null; then
        log_warn "服务已经在运行中"
        return 0
    fi
    
    # 检查程序文件
    if [ ! -f "$BACKEND_PATH/main" ]; then
        log_error "程序文件不存在，请先编译"
        return 1
    fi
    
    # 启动服务
    cd "$BACKEND_PATH"
    nohup ./main > "$LOGS_PATH/app.log" 2>&1 &
    NEW_PID=$!
    echo "$NEW_PID" > "$PID_FILE"
    
    # 等待启动
    sleep 3
    
    # 检查启动状态
    if get_status > /dev/null; then
        log_info "✅ 服务启动成功，PID: $NEW_PID"
    else
        log_error "❌ 服务启动失败"
        return 1
    fi
}

# 停止服务
stop_service() {
    log_info "停止服务..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            kill "$PID"
            log_info "已发送停止信号到进程: $PID"
            
            # 等待进程停止
            for i in {1..10}; do
                if ! ps -p "$PID" > /dev/null 2>&1; then
                    log_info "✅ 服务已停止"
                    rm -f "$PID_FILE"
                    return 0
                fi
                sleep 1
            done
            
            # 强制杀死进程
            log_warn "强制停止进程..."
            kill -9 "$PID" 2>/dev/null || true
            rm -f "$PID_FILE"
            log_info "✅ 服务已强制停止"
        else
            log_warn "服务未在运行"
            rm -f "$PID_FILE"
        fi
    else
        log_warn "PID文件不存在，服务可能未在运行"
    fi
}

# 重启服务
restart_service() {
    log_info "重启服务..."
    stop_service
    sleep 2
    start_service
}

# 查看状态
status_service() {
    STATUS=$(get_status)
    if [ "$STATUS" = "running" ]; then
        PID=$(cat "$PID_FILE")
        log_info "✅ 服务正在运行，PID: $PID"
        
        # 显示服务信息
        echo ""
        echo "📊 服务信息:"
        echo "  进程ID: $PID"
        echo "  运行时间: $(ps -o etime= -p "$PID" 2>/dev/null || echo '未知')"
        echo "  内存使用: $(ps -o rss= -p "$PID" 2>/dev/null | awk '{print $1/1024 " MB"}' || echo '未知')"
        echo "  日志文件: $LOGS_PATH/app.log"
        
        # 检查健康状态
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            echo "  健康状态: ✅ 正常"
        else
            echo "  健康状态: ❌ 异常"
        fi
    else
        log_warn "❌ 服务未运行"
    fi
}

# 查看日志
logs_service() {
    if [ -f "$LOGS_PATH/app.log" ]; then
        echo "📋 服务日志 (最后50行):"
        echo "----------------------------------------"
        tail -n 50 "$LOGS_PATH/app.log"
        echo "----------------------------------------"
    else
        log_warn "日志文件不存在"
    fi
}

# 编译程序
build_service() {
    log_info "编译程序..."
    
    if [ ! -d "$BACKEND_PATH" ]; then
        log_error "后端目录不存在"
        return 1
    fi
    
    cd "$BACKEND_PATH"
    
    # 下载依赖
    log_info "下载Go依赖..."
    go mod download
    
    # 编译程序
    log_info "编译Go程序..."
    go build -o main main.go
    chmod +x main
    
    log_info "✅ 编译完成"
}

# 部署更新
deploy_service() {
    log_info "部署更新..."
    
    # 停止服务
    stop_service
    
    # 拉取最新代码
    cd "$PROJECT_PATH"
    git fetch origin
    git reset --hard origin/main
    
    # 修复权限
    if [ -f "fix-permissions.sh" ]; then
        chmod +x fix-permissions.sh
        ./fix-permissions.sh
    fi
    
    # 重新编译
    build_service
    
    # 启动服务
    start_service
    
    log_info "✅ 部署完成"
}

# 显示帮助信息
show_help() {
    echo "星际云盘服务管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start    启动服务"
    echo "  stop     停止服务"
    echo "  restart  重启服务"
    echo "  status   查看服务状态"
    echo "  logs     查看服务日志"
    echo "  build    编译程序"
    echo "  deploy   部署更新"
    echo "  help     显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动服务"
    echo "  $0 status   # 查看状态"
    echo "  $0 logs     # 查看日志"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        status)
            status_service
            ;;
        logs)
            logs_service
            ;;
        build)
            build_service
            ;;
        deploy)
            deploy_service
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 