#!/bin/bash

set -e

echo "🚀 启动 axi-star-cloud 项目 (简化版)..."

# 检查并修复目录结构
echo "🔍 检查目录结构..."

# 查找可执行文件
EXECUTABLE_PATH=$(find . -name "star-cloud-linux" -type f 2>/dev/null | head -1)

if [ -n "$EXECUTABLE_PATH" ]; then
    echo "✅ 找到可执行文件: $EXECUTABLE_PATH"
    
    # 获取可执行文件所在的目录
    EXEC_DIR=$(dirname "$EXECUTABLE_PATH")
    
    if [ "$EXEC_DIR" != "." ]; then
        echo "🔧 修复目录结构..."
        echo "📁 移动 $EXEC_DIR 目录下的所有文件到当前目录..."
        
        # 移动可执行文件所在目录下的所有文件到当前目录
        mv "$EXEC_DIR"/* . 2>/dev/null || true
        mv "$EXEC_DIR"/.* . 2>/dev/null || true
        
        # 删除空的目录
        rmdir "$EXEC_DIR" 2>/dev/null || true
        
        echo "✅ 目录结构修复完成"
        echo "📁 修复后的目录内容:"
        ls -la
    fi
else
    echo "❌ 未找到 star-cloud-linux 可执行文件"
    echo "📁 当前目录内容:"
    ls -la
    exit 1
fi

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}

# 动态端口配置
# 1. 优先使用环境变量 SERVICE_PORT
# 2. 其次从动态端口配置文件读取
# 3. 最后使用默认端口 8080
if [ -n "$SERVICE_PORT" ]; then
    echo "🔧 使用环境变量端口: $SERVICE_PORT"
    export PORT="$SERVICE_PORT"
elif [ -f "/srv/port-config.yml" ]; then
    echo "🔧 从动态端口配置文件读取端口..."
    DYNAMIC_PORT=$(grep -A 1 "^  axi-star-cloud:" /srv/port-config.yml | grep "port:" | awk '{print $2}' 2>/dev/null || echo "")
    if [ -n "$DYNAMIC_PORT" ]; then
        echo "✅ 使用动态分配端口: $DYNAMIC_PORT"
        export PORT="$DYNAMIC_PORT"
    else
        echo "⚠️ 未找到动态端口，使用默认端口 8080"
        export PORT="8080"
    fi
else
    echo "⚠️ 动态端口配置文件不存在，使用默认端口 8080"
    export PORT="8080"
fi

# 数据库配置
export MYSQL_HOST=${MYSQL_HOST:-127.0.0.1}
export MYSQL_PORT=${MYSQL_PORT:-3306}
export MYSQL_USER=${MYSQL_USER:-root}
export MYSQL_PASSWORD=${MYSQL_PASSWORD:-123456}
export MYSQL_DATABASE=${MYSQL_DATABASE:-docs}
export SKIP_DB_INIT=${SKIP_DB_INIT:-false}

echo "📋 环境配置:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- MYSQL_HOST: $MYSQL_HOST"
echo "- MYSQL_PORT: $MYSQL_PORT"
echo "- MYSQL_DATABASE: $MYSQL_DATABASE"
echo "- SKIP_DB_INIT: $SKIP_DB_INIT"

# 检查可执行文件权限
echo "🔧 设置可执行文件权限..."
chmod +x star-cloud-linux

# 停止现有服务
echo "🛑 停止现有服务..."
pkill -f "star-cloud-linux" 2>/dev/null || echo "停止进程失败（可能不存在）"

# 初始化数据库（如果需要）
if [ "$SKIP_DB_INIT" != "true" ]; then
    echo "🔧 初始化数据库..."
    if [ -f "backend/scripts/init-database.sh" ]; then
        chmod +x backend/scripts/init-database.sh
        ./backend/scripts/init-database.sh
    else
        echo "⚠️ 数据库初始化脚本不存在，跳过"
    fi
fi

# 启动服务
echo "🚀 启动服务..."
echo "📋 启动命令: ./star-cloud-linux"
echo "📋 服务端口: $PORT"

# 在后台启动服务
nohup ./star-cloud-linux > app.log 2>&1 &
SERVICE_PID=$!

echo "✅ 服务启动命令执行完成，PID: $SERVICE_PID"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if ps -p $SERVICE_PID > /dev/null; then
    echo "✅ 服务进程正在运行 (PID: $SERVICE_PID)"
else
    echo "❌ 服务进程未运行"
    echo "📋 查看启动日志:"
    tail -20 app.log || echo "无法读取日志文件"
    exit 1
fi

# 检查端口监听
echo "🔍 检查端口监听..."
if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo "✅ 端口 $PORT 正在监听"
else
    echo "❌ 端口 $PORT 未监听"
    echo "📋 查看启动日志:"
    tail -20 app.log || echo "无法读取日志文件"
    exit 1
fi

# 测试健康检查
echo "🔍 测试健康检查..."
HEALTH_URL="http://localhost:$PORT/health"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" --connect-timeout 5 --max-time 10 2>/dev/null || echo "connection_failed")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ 健康检查通过: $HEALTH_URL"
else
    echo "⚠️ 健康检查失败: $HEALTH_URL (状态码: $HEALTH_RESPONSE)"
    echo "📋 查看启动日志:"
    tail -20 app.log || echo "无法读取日志文件"
fi

echo "🎉 axi-star-cloud 启动完成！"
echo "📊 服务信息:"
echo "- 服务地址: http://localhost:$PORT"
echo "- 健康检查: http://localhost:$PORT/health"
echo "- 进程PID: $SERVICE_PID"
echo "- 日志文件: app.log"

# 显示当前端口使用情况
echo "📊 当前端口使用情况:"
netstat -tlnp 2>/dev/null | grep -E ":(808[0-9]|809[0-9]|81[0-9][0-9]|82[0-9][0-9]|83[0-9][0-9]|84[0-9][0-9]|85[0-9][0-9]|86[0-9][0-9]|87[0-9][0-9]|88[0-9][0-9]|89[0-9][0-9]|9[0-9][0-9][0-9]) " | head -10 || echo "无法获取端口信息"
