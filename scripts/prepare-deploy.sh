#!/bin/bash

# axi-star-cloud 部署配置准备脚本
# 生成base64编码的部署配置

echo "🚀 准备 axi-star-cloud 部署配置..."

# 检查deploy-config.json是否存在
if [ ! -f "deploy-config.json" ]; then
    echo "❌ deploy-config.json 文件不存在"
    exit 1
fi

echo "📋 读取部署配置..."

# 生成base64编码的配置
BASE64_CONFIG=$(cat deploy-config.json | base64 -w 0)

if [ $? -eq 0 ]; then
    echo "✅ 配置编码成功"
    echo ""
    echo "📋 部署参数:"
    echo "项目名称: axi-star-cloud"
    echo "源仓库: MoseLu/axi-star-cloud"
    echo "部署类型: backend"
    echo ""
    echo "📋 base64编码的部署配置:"
    echo "$BASE64_CONFIG"
    echo ""
    echo "📋 使用说明:"
    echo "1. 复制上面的base64编码配置"
    echo "2. 访问 https://github.com/MoseLu/axi-deploy/actions"
    echo "3. 手动触发 'Main Deployment' 工作流"
    echo "4. 输入以下参数:"
    echo "   - project: axi-star-cloud"
    echo "   - source_repo: MoseLu/axi-star-cloud"
    echo "   - run_id: 最新的构建运行ID"
    echo "   - deploy_type: backend"
    echo "   - deploy_secrets: 您的服务器密钥"
    echo "   - deploy_config: 粘贴上面的base64编码配置"
    echo ""
    echo "🎉 配置准备完成！"
else
    echo "❌ 配置编码失败"
    exit 1
fi
