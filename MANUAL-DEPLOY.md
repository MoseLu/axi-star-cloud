# 🚀 手动部署指南 - 解决网络连接问题

由于服务器无法访问GitHub，我们提供了多种手动部署方案。

## 📋 部署方案

### 方案1: 网络修复后自动部署

#### 1. **运行网络修复脚本**
```bash
# 在服务器上执行
cd /www/wwwroot/axi-star-cloud
chmod +x network-fix.sh
./network-fix.sh
```

#### 2. **配置Git代理**
```bash
# 使用国内镜像
git config --global url."https://ghproxy.com/https://github.com".insteadOf "https://github.com"

# 或者使用SSH
git remote set-url origin git@github.com:MoseLu/axi-star-cloud.git
```

#### 3. **测试连接**
```bash
# 测试GitHub连接
git ls-remote https://github.com/MoseLu/axi-star-cloud.git

# 或者测试SSH连接
ssh -T git@github.com
```

### 方案2: 离线部署（推荐）

#### 1. **使用离线部署脚本**
```bash
# 在服务器上执行
cd /www/wwwroot/axi-star-cloud
chmod +x offline-deploy.sh
./offline-deploy.sh
```

#### 2. **手动离线部署步骤**
```bash
# 1. 进入项目目录
cd /www/wwwroot/axi-star-cloud

# 2. 备份当前版本
cp backend/main backend/main.backup.$(date +%Y%m%d_%H%M%S)

# 3. 停止服务
pkill -f "backend/main" || true

# 4. 重新编译
cd backend
export GOPROXY=https://goproxy.cn,direct
go mod download
go build -o main main.go
chmod +x main

# 5. 修复权限
cd ..
chmod +x fix-permissions.sh
./fix-permissions.sh

# 6. 启动服务
cd backend
nohup ./main > ../logs/app.log 2>&1 &
echo $! > ../pid.txt

# 7. 检查状态
sleep 5
curl http://localhost:8080/health
```

### 方案3: 本地编译后上传

#### 1. **在本地编译**
```bash
# 在本地项目目录
cd backend
go build -o main main.go
```

#### 2. **上传到服务器**
```bash
# 使用scp上传
scp backend/main root@你的服务器IP:/www/wwwroot/axi-star-cloud/backend/

# 或者使用其他工具上传
```

#### 3. **在服务器上部署**
```bash
# 在服务器上执行
cd /www/wwwroot/axi-star-cloud
chmod +x service-manager.sh
./service-manager.sh restart
```

## 🔧 网络问题解决方案

### 1. **DNS问题**
```bash
# 更换DNS服务器
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 114.114.114.114" >> /etc/resolv.conf
```

### 2. **防火墙问题**
```bash
# 检查防火墙
ufw status

# 临时关闭防火墙（测试用）
ufw disable

# 或者开放必要端口
ufw allow 22
ufw allow 80
ufw allow 443
```

### 3. **代理设置**
```bash
# 设置HTTP代理
export http_proxy=http://proxy.example.com:8080
export https_proxy=https://proxy.example.com:8080

# 设置Git代理
git config --global http.proxy http://proxy.example.com:8080
git config --global https.proxy https://proxy.example.com:8080
```

### 4. **使用国内镜像**
```bash
# 配置Go代理
export GOPROXY=https://goproxy.cn,direct

# 配置Git镜像
git config --global url."https://ghproxy.com/https://github.com".insteadOf "https://github.com"
```

## 📊 监控和日志

### 查看服务状态
```bash
# 查看进程
ps aux | grep main

# 查看端口
netstat -tlnp | grep 8080

# 查看日志
tail -f logs/app.log
```

### 健康检查
```bash
# 检查服务健康状态
curl http://localhost:8080/health

# 检查服务响应
curl http://localhost:8080/
```

## 🛠️ 故障排除

### 常见问题：

#### 1. **编译失败**
```bash
# 清理模块缓存
go clean -modcache

# 重新下载依赖
go mod download

# 检查Go版本
go version
```

#### 2. **权限问题**
```bash
# 运行权限修复脚本
./fix-permissions.sh

# 手动设置权限
chmod -R 755 front/uploads
chown -R www-data:www-data front/uploads
```

#### 3. **端口占用**
```bash
# 查看端口占用
lsof -i :8080

# 杀死占用进程
kill -9 $(lsof -t -i:8080)
```

#### 4. **内存不足**
```bash
# 查看内存使用
free -h

# 清理内存
sync && echo 3 > /proc/sys/vm/drop_caches
```

## 🎯 推荐部署流程

### 日常部署（推荐）：
```bash
# 1. 使用离线部署脚本
./offline-deploy.sh

# 2. 检查服务状态
./service-manager.sh status

# 3. 查看日志
./service-manager.sh logs
```

### 紧急修复：
```bash
# 1. 停止服务
./service-manager.sh stop

# 2. 重新编译
./service-manager.sh build

# 3. 启动服务
./service-manager.sh start
```

## 📞 技术支持

如果遇到问题，请检查：

1. **网络连接**: `ping github.com`
2. **DNS解析**: `nslookup github.com`
3. **端口连接**: `telnet github.com 443`
4. **服务状态**: `./service-manager.sh status`
5. **错误日志**: `tail -f logs/app.log`

---

**注意**: 离线部署是最可靠的方案，不依赖外部网络连接。 