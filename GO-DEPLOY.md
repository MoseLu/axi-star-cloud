# 星际云盘 - Go项目部署指南

## 📋 部署前准备

### 1. 宝塔面板环境要求
- 宝塔面板 7.0 或更高版本
- 已安装 Nginx
- 已安装 Go 环境（推荐 Go 1.23.4+）

### 2. 安装Go环境
在宝塔面板中：
1. 进入 **软件商店**
2. 搜索 **Go**
3. 点击安装
4. 等待安装完成

## 🚀 快速部署

### 方法一：使用部署脚本（推荐）

1. **创建网站**
   - 在宝塔面板中创建网站
   - 域名：你的域名
   - 根目录：`/www/wwwroot/axi-star-cloud`

2. **下载项目代码**
   ```bash
   cd /www/wwwroot/axi-star-cloud
   git clone https://github.com/MoseLu/axi-star-cloud.git .
   ```

3. **运行部署脚本**
   ```bash
   chmod +x bt-go-deploy.sh
   ./bt-go-deploy.sh
   ```

4. **启动服务**
   ```bash
   ./start.sh
   ```

### 方法二：手动部署

1. **编译Go程序**
   ```bash
   cd /www/wwwroot/axi-star-cloud/backend
   go mod download
   go build -o main main.go
   ```

2. **修复权限**
   ```bash
   chmod +x main
   chmod -R 755 ../front/uploads
   chown -R www:www ../front/uploads
   ```

3. **启动服务**
   ```bash
   nohup ./main > ../logs/app.log 2>&1 &
   ```

## ⚙️ Nginx配置

### 1. 配置反向代理

在宝塔面板中：
1. 进入 **网站** → 你的网站 → **设置**
2. 点击 **反向代理**
3. 添加反向代理：
   - **代理名称**：`api`
   - **目标URL**：`http://127.0.0.1:8080`
   - **发送域名**：`$host`

### 2. 配置静态文件

在 **配置文件** 中添加：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 静态文件
    location /static/ {
        alias /www/wwwroot/axi-star-cloud/front/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 上传文件
    location /uploads/ {
        alias /www/wwwroot/axi-star-cloud/front/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 主页面
    location / {
        try_files $uri $uri/ /index.html;
        root /www/wwwroot/axi-star-cloud;
        index index.html;
    }
}
```

## 🔧 常见问题解决

### 1. 编译失败

**问题**：`go build` 失败
**解决**：
```bash
# 设置Go代理
export GOPROXY=https://goproxy.cn,direct
export GOSUMDB=sum.golang.google.cn

# 清理并重新下载依赖
go clean -modcache
go mod download
go build -o main main.go
```

### 2. 权限问题

**问题**：头像上传失败，返回500错误
**解决**：
```bash
# 运行权限修复脚本
chmod +x fix-permissions.sh
./fix-permissions.sh
```

### 3. 端口被占用

**问题**：`address already in use`
**解决**：
```bash
# 查找占用端口的进程
lsof -i :8080

# 停止进程
kill -9 <PID>

# 或者使用停止脚本
./stop.sh
```

### 4. 数据库问题

**问题**：数据库连接失败
**解决**：
```bash
# 检查数据库文件权限
ls -la /www/wwwroot/axi-star-cloud/backend/cloud.db

# 修复权限
chmod 644 /www/wwwroot/axi-star-cloud/backend/cloud.db
chown www:www /www/wwwroot/axi-star-cloud/backend/cloud.db
```

## 📊 服务管理

### 启动服务
```bash
./start.sh
```

### 停止服务
```bash
./stop.sh
```

### 重启服务
```bash
./restart.sh
```

### 查看状态
```bash
./status.sh
```

### 查看日志
```bash
tail -f logs/app.log
```

## 🔒 安全配置

### 1. 防火墙设置
```bash
# 开放8080端口（如果需要直接访问）
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload
```

### 2. SSL证书
在宝塔面板中：
1. 进入 **网站** → 你的网站 → **SSL**
2. 申请或上传SSL证书
3. 开启 **强制HTTPS**

### 3. 安全组设置
如果使用云服务器，确保安全组开放了80和443端口。

## 📈 性能优化

### 1. Nginx优化
```nginx
# 在nginx.conf中添加
worker_processes auto;
worker_connections 1024;

# 开启gzip压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Go程序优化
```bash
# 编译时优化
go build -ldflags="-s -w" -o main main.go
```

### 3. 数据库优化
```sql
-- 在SQLite中创建索引
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
```

## 🐛 故障排除

### 1. 服务无法启动
```bash
# 检查Go程序是否存在
ls -la /www/wwwroot/axi-star-cloud/backend/main

# 检查端口是否被占用
netstat -tlnp | grep :8080

# 查看详细错误日志
cd /www/wwwroot/axi-star-cloud/backend
./main
```

### 2. 头像上传失败
```bash
# 检查上传目录权限
ls -la /www/wwwroot/axi-star-cloud/front/uploads/avatars/

# 检查磁盘空间
df -h

# 检查SELinux状态
sestatus
```

### 3. 静态文件无法访问
```bash
# 检查Nginx配置
nginx -t

# 检查文件权限
ls -la /www/wwwroot/axi-star-cloud/front/

# 重启Nginx
systemctl restart nginx
```

## 📞 技术支持

如果遇到问题，请：

1. **查看日志**：
   ```bash
   tail -f /www/wwwroot/axi-star-cloud/logs/app.log
   ```

2. **检查状态**：
   ```bash
   ./status.sh
   ```

3. **提交Issue**：
   - 在GitHub上提交Issue
   - 附上详细的错误日志
   - 说明操作系统和版本信息

## 🎉 部署完成

部署成功后，你可以：

1. **访问网站**：`http://你的域名`
2. **默认登录**：
   - 用户名：`admin`
   - 密码：`admin123`
3. **上传文件**：支持拖拽上传
4. **管理文件**：创建文件夹、移动文件等

---

**星际云盘** - 让文件管理更简单、更安全、更高效！ 