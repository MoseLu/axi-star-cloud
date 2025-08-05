# AXI Star Cloud 部署 403 错误修复指南

## 问题概述

axi-star-cloud 在使用 axi-deploy 统一部署时出现 403 错误，主要原因是：

1. **路径配置不一致**：服务文件中的路径与部署路径不匹配
2. **文件权限问题**：部署后的文件权限不正确
3. **服务启动失败**：后端服务未正常启动
4. **Nginx 配置问题**：静态文件路径或代理配置错误

## 已修复的问题

### 1. 服务文件路径配置

**问题**：`star-cloud.service` 中的路径配置为 `/www/wwwroot/axi-star-cloud`，但实际部署路径是 `/srv/apps/axi-star-cloud`

**修复**：已更新服务文件中的路径配置
```ini
WorkingDirectory=/srv/apps/axi-star-cloud
ExecStart=/srv/apps/axi-star-cloud/star-cloud-linux
User=deploy
Group=deploy
```

### 2. 工作流配置优化

**问题**：Nginx 配置中缺少静态文件路径配置

**修复**：已添加静态文件路径配置
```nginx
location /static/ {
    alias /srv/apps/axi-star-cloud/front/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 部署流程

### 1. 自动部署

当前工作流 `axi-star-cloud_deploy.yml` 已正确配置：

1. **构建阶段**：编译 Go 应用并打包
2. **触发部署**：调用 axi-deploy 的 universal_deploy.yml
3. **服务器部署**：自动解压、配置权限、启动服务

### 2. 部署后检查

部署完成后，运行诊断脚本检查状态：

```bash
# 在服务器上运行
chmod +x deploy-diagnostic.sh
./deploy-diagnostic.sh
```

### 3. 自动修复

如果发现问题，运行自动修复脚本：

```bash
# 在服务器上运行
chmod +x deploy-fix.sh
./deploy-fix.sh
```

## 常见问题及解决方案

### 问题 1: 403 Forbidden 错误

**症状**：网站返回 403 错误
**原因**：文件权限、路径配置或服务未启动

**解决方案**：
```bash
# 1. 修复文件权限
sudo chown -R deploy:deploy /srv/apps/axi-star-cloud
sudo chmod +x /srv/apps/axi-star-cloud/star-cloud-linux

# 2. 重启服务
sudo systemctl daemon-reload
sudo systemctl restart star-cloud.service

# 3. 重载 Nginx
sudo nginx -t && sudo systemctl reload nginx
```

### 问题 2: 服务启动失败

**症状**：systemd 服务状态为 failed
**原因**：路径不匹配、权限问题、配置文件错误

**解决方案**：
```bash
# 1. 检查服务状态
sudo systemctl status star-cloud.service

# 2. 查看服务日志
sudo journalctl -u star-cloud.service -f

# 3. 手动启动测试
cd /srv/apps/axi-star-cloud
./star-cloud-linux
```

### 问题 3: 端口未监听

**症状**：8080 端口未监听
**原因**：服务未启动、配置文件错误

**解决方案**：
```bash
# 1. 检查端口监听
netstat -tlnp | grep :8080

# 2. 检查配置文件
cat /srv/apps/axi-star-cloud/backend/config/config.yaml

# 3. 手动启动测试
cd /srv/apps/axi-star-cloud
./star-cloud-linux
```

### 问题 4: 健康检查失败

**症状**：`/health` 端点无响应
**原因**：服务未启动、端口未监听

**解决方案**：
```bash
# 1. 测试健康检查
curl http://127.0.0.1:8080/health

# 2. 检查服务状态
sudo systemctl status star-cloud.service

# 3. 重启服务
sudo systemctl restart star-cloud.service
```

## 部署验证清单

### 部署前检查
- [ ] Go 应用编译成功
- [ ] 配置文件存在且正确
- [ ] systemd 服务文件路径正确

### 部署后检查
- [ ] 文件解压到正确位置 (`/srv/apps/axi-star-cloud`)
- [ ] 可执行文件权限正确 (`chmod +x`)
- [ ] systemd 服务启动成功
- [ ] 8080 端口监听正常
- [ ] 健康检查端点响应正常
- [ ] Nginx 配置正确
- [ ] 静态文件可访问
- [ ] API 代理工作正常

### 最终验证
- [ ] 网站首页可访问 (https://redamancy.com.cn/)
- [ ] 登录功能正常
- [ ] 文件上传功能正常
- [ ] API 接口响应正常

## 自动化脚本

### 诊断脚本 (`deploy-diagnostic.sh`)
- 检查部署目录和文件
- 验证服务状态和端口监听
- 测试健康检查和网站访问
- 提供详细的诊断报告

### 修复脚本 (`deploy-fix.sh`)
- 自动修复文件权限
- 创建必要目录
- 重启服务和 Nginx
- 验证修复结果

## 部署命令

### 触发部署
```bash
# 推送代码到 main 分支自动触发
git push origin main

# 或手动触发工作流
# 在 GitHub 仓库页面 -> Actions -> 选择工作流 -> Run workflow
```

### 服务器端修复
```bash
# 上传脚本到服务器
scp deploy-diagnostic.sh deploy-fix.sh user@server:/path/to/axi-star-cloud/

# 运行诊断
./deploy-diagnostic.sh

# 运行修复
./deploy-fix.sh
```

## 监控和维护

### 定期检查
1. **服务状态**：`sudo systemctl status star-cloud.service`
2. **端口监听**：`netstat -tlnp | grep :8080`
3. **健康检查**：`curl http://127.0.0.1:8080/health`
4. **网站访问**：`curl -I https://redamancy.com.cn/`

### 日志监控
1. **服务日志**：`sudo journalctl -u star-cloud.service -f`
2. **Nginx 错误日志**：`sudo tail -f /var/log/nginx/error.log`
3. **Nginx 访问日志**：`sudo tail -f /var/log/nginx/access.log`

## 联系支持

如果问题仍然存在，请提供以下信息：

1. 部署日志输出
2. 诊断脚本输出
3. systemd 服务状态
4. Nginx 错误日志
5. 健康检查响应
6. 端口监听状态

这些信息将帮助快速定位和解决问题。 