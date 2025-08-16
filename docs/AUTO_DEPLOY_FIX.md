# 自动部署修复502错误指南

## 🎯 目标

通过重新部署 `axi-star-cloud` 项目来自动修复502错误，无需手动执行脚本。

## 📋 部署配置

### 部署参数

使用以下参数通过 `axi-deploy` 重新部署：

- **项目名称**: `axi-star-cloud`
- **源仓库**: `MoseLu/axi-star-cloud`
- **部署类型**: `backend`
- **部署配置**: 使用 `deploy-config.json` 中的配置

### 部署配置详情

```json
{
  "nginx_config": "完整的Nginx配置，包含API代理到端口8124",
  "start_cmd": "systemctl restart star-cloud",
  "service_port": "8124",
  "test_url": "https://redamancy.com.cn/health",
  "mysql_config": "",
  "skip_init": false
}
```

## 🚀 部署步骤

### 1. 准备部署配置

将 `deploy-config.json` 的内容进行 base64 编码：

```bash
# 在本地执行
cat deploy-config.json | base64 -w 0
```

### 2. 通过GitHub Actions部署

访问 `axi-deploy` 仓库的 Actions 页面，手动触发 `Main Deployment` 工作流：

**输入参数**：
- `project`: `axi-star-cloud`
- `source_repo`: `MoseLu/axi-star-cloud`
- `run_id`: 最新的构建运行ID
- `deploy_type`: `backend`
- `deploy_secrets`: 您的服务器密钥（JSON格式）
- `deploy_config`: base64编码的配置（从步骤1获得）

### 3. 部署流程

部署过程将自动执行以下步骤：

1. **验证构建产物** - 检查构建是否成功
2. **解析配置** - 解析部署配置和密钥
3. **服务器初始化** - 确保服务器环境正确
4. **动态端口分配** - 分配端口8124
5. **部署项目** - 上传和部署项目文件
6. **配置Nginx** - 应用正确的Nginx配置
7. **启动服务** - 重启star-cloud服务
8. **测试网站** - 验证部署是否成功

## 🔧 修复内容

### Nginx配置修复

部署将自动应用以下Nginx配置：

```nginx
# API 路由 - 代理到后端服务 (端口8124)
location /api/ {
    proxy_pass http://127.0.0.1:8124;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS 支持
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization, User-UUID";
    add_header Access-Control-Allow-Credentials true;
}
```

### 服务启动修复

```bash
# 自动重启服务
systemctl restart star-cloud
```

### 端口配置修复

确保服务运行在正确的端口：
- **后端端口**: 8124
- **前端访问**: https://redamancy.com.cn

## 📊 预期结果

### 部署前
- ❌ API请求返回502错误
- ❌ Nginx配置缺失或错误
- ❌ 端口代理配置不正确

### 部署后
- ✅ API请求正常响应
- ✅ Nginx正确代理到端口8124
- ✅ CORS问题解决
- ✅ 服务自动重启
- ✅ 健康检查通过

## 🔍 验证步骤

部署完成后，可以通过以下方式验证：

### 1. 健康检查
```bash
curl -I https://redamancy.com.cn/health
```

### 2. API测试
```bash
curl -I https://redamancy.com.cn/api/auth/validate
```

### 3. 前端访问
访问 https://redamancy.com.cn 检查是否正常加载

### 4. 浏览器开发者工具
检查Network标签页，确认API请求不再返回502错误

## 🛠️ 故障排除

### 如果部署失败

1. **检查构建状态**
   - 确保 `axi-star-cloud` 项目构建成功
   - 获取正确的 `run_id`

2. **检查服务器连接**
   - 确保服务器密钥正确
   - 检查服务器网络连接

3. **检查端口冲突**
   - 确保端口8124未被其他服务占用
   - 检查防火墙设置

### 如果部署成功但仍有问题

1. **检查服务状态**
   ```bash
   systemctl status star-cloud
   ```

2. **检查端口监听**
   ```bash
   netstat -tlnp | grep 8124
   ```

3. **检查Nginx配置**
   ```bash
   nginx -t
   systemctl status nginx
   ```

4. **查看日志**
   ```bash
   journalctl -u star-cloud -f
   tail -f /var/log/nginx/error.log
   ```

## 📝 优势

### 自动化部署的优势

1. **一键修复** - 无需手动执行脚本
2. **配置统一** - 所有配置集中管理
3. **版本控制** - 配置变更可追踪
4. **回滚支持** - 可以快速回滚到之前版本
5. **环境一致** - 确保所有环境配置一致

### 与传统修复的对比

| 方式 | 自动化部署 | 手动脚本 |
|------|------------|----------|
| 操作复杂度 | 简单 | 中等 |
| 配置管理 | 集中化 | 分散化 |
| 版本控制 | 支持 | 不支持 |
| 回滚能力 | 强 | 弱 |
| 环境一致性 | 高 | 低 |

## 🎉 总结

通过重新部署 `axi-star-cloud` 项目，可以自动修复502错误问题。这种方式更加规范、可靠，并且支持版本控制和回滚。

部署完成后，您的网站应该能够正常访问，API请求不再返回502错误。
