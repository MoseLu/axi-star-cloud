# 🚀 自动部署配置指南

本指南将帮助你配置自动部署系统，实现本地推送代码后云端自动更新和重启。

## 📋 配置步骤

### 1. **配置GitHub Secrets**

在GitHub仓库中配置以下Secrets：

1. 进入你的GitHub仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret` 添加以下密钥：

#### 必需的Secrets：

- **`HOST`**: 你的服务器IP地址
- **`USERNAME`**: SSH用户名（通常是root）
- **`SSH_KEY`**: 你的SSH私钥内容
- **`PORT`**: SSH端口（通常是22）

#### 获取SSH私钥：

```bash
# 在本地生成SSH密钥对（如果还没有）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看公钥（添加到服务器的~/.ssh/authorized_keys）
cat ~/.ssh/id_rsa.pub

# 查看私钥（复制到GitHub Secrets的SSH_KEY）
cat ~/.ssh/id_rsa
```

#### 在服务器上配置SSH密钥：

```bash
# 在服务器上创建SSH目录
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 添加公钥到authorized_keys
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 2. **服务器端配置**

#### 安装必要工具：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y git curl wget

# 安装Go环境（如果还没有）
wget https://go.dev/dl/go1.23.4.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

#### 克隆项目：

```bash
# 创建项目目录
mkdir -p /www/wwwroot
cd /www/wwwroot

# 克隆项目
git clone https://github.com/你的用户名/axi-star-cloud.git
cd axi-star-cloud

# 设置脚本权限
chmod +x *.sh
```

### 3. **测试自动部署**

#### 手动触发部署：

1. 在GitHub仓库页面
2. 点击 `Actions` 标签
3. 选择 `自动部署到云端` 工作流
4. 点击 `Run workflow` 手动触发

#### 推送代码触发部署：

```bash
# 在本地修改代码后
git add .
git commit -m "测试自动部署"
git push origin main
```

推送后会自动触发部署流程。

## 🔧 服务管理

### 使用服务管理脚本：

```bash
# 进入项目目录
cd /www/wwwroot/axi-star-cloud

# 查看帮助
./service-manager.sh help

# 启动服务
./service-manager.sh start

# 查看状态
./service-manager.sh status

# 查看日志
./service-manager.sh logs

# 停止服务
./service-manager.sh stop

# 重启服务
./service-manager.sh restart

# 手动部署更新
./service-manager.sh deploy
```

### 使用自动部署脚本：

```bash
# 运行自动部署
./auto-deploy.sh
```

## 📊 监控和日志

### 查看服务状态：

```bash
# 查看进程
ps aux | grep main

# 查看端口占用
netstat -tlnp | grep 8080

# 查看服务日志
tail -f logs/app.log
```

### 健康检查：

```bash
# 检查服务健康状态
curl http://localhost:8080/health
```

## 🛠️ 故障排除

### 常见问题：

#### 1. **SSH连接失败**
```bash
# 检查SSH服务状态
systemctl status ssh

# 检查防火墙
ufw status
```

#### 2. **权限问题**
```bash
# 运行权限修复脚本
./fix-permissions.sh

# 手动设置权限
chmod -R 755 front/uploads
chown -R www-data:www-data front/uploads
```

#### 3. **Go编译失败**
```bash
# 检查Go环境
go version

# 清理模块缓存
go clean -modcache

# 重新下载依赖
go mod download
```

#### 4. **服务启动失败**
```bash
# 查看详细日志
tail -f logs/app.log

# 检查端口占用
lsof -i :8080

# 检查配置文件
cat backend/config/database.go
```

## 🔄 工作流程

### 自动部署流程：

1. **代码推送** → 触发GitHub Actions
2. **构建程序** → 在GitHub Actions中编译Go程序
3. **SSH连接** → 连接到服务器
4. **备份当前版本** → 保存当前运行的程序
5. **拉取最新代码** → 从GitHub获取最新代码
6. **修复权限** → 运行权限修复脚本
7. **停止旧服务** → 停止当前运行的服务
8. **部署新程序** → 替换程序文件
9. **启动新服务** → 启动新的服务
10. **健康检查** → 验证服务是否正常启动
11. **回滚机制** → 如果失败自动回滚到备份版本

### 手动部署流程：

```bash
# 1. 停止服务
./service-manager.sh stop

# 2. 拉取最新代码
git pull origin main

# 3. 修复权限
./fix-permissions.sh

# 4. 重新编译
./service-manager.sh build

# 5. 启动服务
./service-manager.sh start

# 6. 检查状态
./service-manager.sh status
```

## 📈 性能优化

### 系统优化：

```bash
# 设置文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
sysctl -p
```

### 监控脚本：

```bash
# 创建监控脚本
cat > /www/wwwroot/axi-star-cloud/monitor.sh << 'EOF'
#!/bin/bash
while true; do
    if ! curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "$(date): 服务异常，重启中..."
        cd /www/wwwroot/axi-star-cloud
        ./service-manager.sh restart
    fi
    sleep 30
done
EOF

chmod +x /www/wwwroot/axi-star-cloud/monitor.sh
```

## 🎉 完成！

配置完成后，你只需要：

1. **本地开发** → 修改代码
2. **推送代码** → `git push origin main`
3. **自动部署** → GitHub Actions自动部署到云端
4. **服务重启** → 云端自动重启服务

整个过程完全自动化，无需手动操作！

---

**注意**: 请确保服务器有足够的权限和资源来运行自动部署流程。 