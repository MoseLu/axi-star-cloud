# 宝塔面板部署指南

## 前置要求

1. **宝塔面板**：已安装宝塔面板
2. **Docker**：在宝塔面板中安装Docker管理器
3. **域名**：准备一个域名用于访问
4. **SSL证书**：在宝塔面板中申请SSL证书

## 部署步骤

### 1. 在宝塔面板中创建网站

1. 登录宝塔面板
2. 进入"网站" → "添加站点"
3. 填写域名：`your-domain.com`（替换为您的域名）
4. 选择PHP版本：纯静态
5. 创建完成后，记录网站根目录路径

### 2. 上传项目文件

1. 进入网站根目录
2. 删除默认的index.html文件
3. 上传项目文件到根目录
4. 确保文件结构如下：
   ```
   /www/wwwroot/your-domain.com/
   ├── Dockerfile
   ├── docker-compose.yml
   ├── deploy.sh
   ├── nginx.conf
   ├── backend/
   ├── front/
   └── index.html
   ```

### 3. 配置Docker

1. 在宝塔面板中安装"Docker管理器"插件
2. 确保Docker服务正常运行

### 4. 配置Nginx

1. 进入"网站" → 找到您的站点 → "设置"
2. 点击"配置文件"
3. 将`nginx.conf`的内容复制到配置文件中
4. 修改域名：将`your-domain.com`替换为您的实际域名
5. 保存配置

### 5. 配置SSL证书

1. 在网站设置中点击"SSL"
2. 申请Let's Encrypt免费证书
3. 开启"强制HTTPS"

### 6. 设置自动部署

#### 方法一：使用宝塔面板的Git自动部署

1. 在网站设置中点击"Git"
2. 开启"Git自动部署"
3. 填写Git仓库地址：`https://github.com/MoseLu/axi-star-cloud.git`
4. 设置部署脚本：
   ```bash
   #!/bin/bash
   cd /www/wwwroot/your-domain.com
   git pull origin main
   chmod +x deploy.sh
   ./deploy.sh
   ```

#### 方法二：使用Webhook自动部署

1. 在GitHub仓库设置中添加Webhook
2. Webhook URL：`https://your-domain.com/webhook`
3. 在宝塔面板中创建webhook处理脚本

### 7. 首次部署

1. SSH连接到服务器
2. 进入网站目录：
   ```bash
   cd /www/wwwroot/your-domain.com
   ```
3. 给部署脚本执行权限：
   ```bash
   chmod +x deploy.sh
   ```
4. 运行部署脚本：
   ```bash
   ./deploy.sh
   ```

### 8. 验证部署

1. 访问您的域名：`https://your-domain.com`
2. 检查健康状态：`https://your-domain.com/health`
3. 测试文件上传功能

## 环境变量配置

在`docker-compose.yml`中可以添加环境变量：

```yaml
environment:
  - GIN_MODE=release
  - DB_HOST=your-database-host
  - DB_PORT=3306
  - DB_USER=your-db-user
  - DB_PASSWORD=your-db-password
  - DB_NAME=your-db-name
```

## 数据库配置

### 使用MySQL（推荐）

1. 在宝塔面板中安装MySQL
2. 创建数据库和用户
3. 修改`backend/config/config.yaml`中的数据库配置

### 使用SQLite（开发环境）

默认使用SQLite，无需额外配置。

## 文件存储配置

上传的文件会保存在`front/uploads/`目录下，该目录已通过Docker卷映射到宿主机。

## 监控和维护

### 查看日志
```bash
docker-compose logs -f axi-star-cloud
```

### 重启服务
```bash
docker-compose restart
```

### 更新代码
```bash
git pull origin main
./deploy.sh
```

### 备份数据
```bash
# 备份上传的文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz front/uploads/

# 备份数据库（如果使用MySQL）
mysqldump -u username -p database_name > database_backup_$(date +%Y%m%d).sql
```

## 故障排除

### 1. 容器启动失败
```bash
docker-compose logs
```

### 2. 端口冲突
修改`docker-compose.yml`中的端口映射：
```yaml
ports:
  - "8081:8080"  # 改为其他端口
```

### 3. 权限问题
```bash
chmod -R 755 /www/wwwroot/your-domain.com
chown -R www:www /www/wwwroot/your-domain.com
```

### 4. 内存不足
在`docker-compose.yml`中添加内存限制：
```yaml
services:
  axi-star-cloud:
    deploy:
      resources:
        limits:
          memory: 512M
```

## 安全建议

1. **定期更新**：保持系统和Docker镜像更新
2. **备份数据**：定期备份上传的文件和数据库
3. **监控日志**：关注应用日志，及时发现异常
4. **访问控制**：配置防火墙，限制不必要的端口访问
5. **SSL证书**：确保证书有效，定期更新

## 性能优化

1. **启用Gzip压缩**：在Nginx配置中启用gzip
2. **静态文件缓存**：配置适当的缓存策略
3. **CDN加速**：使用CDN加速静态文件访问
4. **数据库优化**：定期优化数据库性能

---

部署完成后，您的星际云盘就可以通过域名访问了！ 