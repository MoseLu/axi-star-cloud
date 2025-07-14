#!/bin/bash

# 权限修复脚本 - 修复上传目录权限问题

echo "🔧 开始修复上传目录权限..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPLOAD_DIR="$SCRIPT_DIR/front/uploads"

echo "📁 上传目录: $UPLOAD_DIR"

# 创建上传目录结构
mkdir -p "$UPLOAD_DIR/avatars"
mkdir -p "$UPLOAD_DIR/image"
mkdir -p "$UPLOAD_DIR/video"
mkdir -p "$UPLOAD_DIR/audio"
mkdir -p "$UPLOAD_DIR/document"
mkdir -p "$UPLOAD_DIR/other"

echo "✅ 创建目录结构完成"

# 设置目录权限
chmod -R 755 "$UPLOAD_DIR"
chown -R www-data:www-data "$UPLOAD_DIR" 2>/dev/null || chown -R nginx:nginx "$UPLOAD_DIR" 2>/dev/null || echo "⚠️  无法设置所有者，但权限已设置"

echo "✅ 设置目录权限完成"

# 检查目录权限
echo "🔍 检查目录权限:"
ls -la "$UPLOAD_DIR"

echo "✅ 权限修复完成！"
echo ""
echo "📝 如果仍有问题，请手动执行以下命令："
echo "sudo chmod -R 755 $UPLOAD_DIR"
echo "sudo chown -R www-data:www-data $UPLOAD_DIR"
echo "" 