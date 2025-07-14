# 宝塔面板Go项目部署指南

## 🚀 快速部署步骤

### 1. 安装Go环境

1. **登录宝塔面板**
2. **进入"软件商店"**
3. **搜索"Go"并安装**
4. **等待安装完成**

### 2. 创建网站

1. **进入"网站" → "添加站点"**
2. **填写信息**：
   - 域名：`your-domain.com`（替换为您的域名）
   - PHP版本：纯静态
   - 点击"提交"

### 3. 运行一键部署脚本

在宝塔面板终端中执行：

```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/MoseLu/axi-star-cloud/main/bt-go-deploy.sh

# 给脚本执行权限
chmod +x bt-go-deploy.sh

# 运行部署脚本
./bt-go-deploy.sh
```

### 4. 配置Nginx反向代理

1. **进入网站设置**
   - 找到您的站点 → 点击"设置"

2. **配置反向代理**
   - 点击"反向代理"
   - 点击"添加反向代理"
   - 填写信息：
     - 代理名称：`axi-star-cloud`
     - 目标URL：`http://127.0.0.1:8080`
     - 发送域名：`$host`

3. **或者直接修改配置文件**
   - 点击"配置文件"
   - 将`nginx-go.conf`的内容复制到配置文件中
   - 修改域名：将`your-domain.com`替换为您的实际域名
   - 保存配置

### 5. 配置SSL证书

1. **在网站设置中点击"SSL"**
2. **申请Let's Encrypt免费证书**
3. **开启"强制HTTPS"**

## 📋 服务管理命令

### 查看服务状态
```bash
systemctl status axi-star-cloud
```

### 查看实时日志
```bash
journalctl -u axi-star-cloud -f
```

### 重启服务
```bash
systemctl restart axi-star-cloud
```

### 停止服务
```bash
systemctl stop axi-star-cloud
```

### 启动服务
```bash
systemctl start axi-star-cloud
```

## 🔧 故障排除

### 1. 服务启动失败

检查日志：
```bash
journalctl -u axi-star-cloud --no-pager -l
```

常见问题：
- Go环境未安装：在宝塔面板中安装Go
- 端口被占用：检查8080端口是否被占用
- 权限问题：确保脚本以root用户运行

### 2. 网络连接问题

检查防火墙：
```bash
# 检查8080端口是否开放
netstat -tlnp | grep 8080

# 开放端口（如果需要）
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --reload
```

### 3. 文件权限问题

```bash
# 确保项目目录权限正确
chown -R root:root /www/wwwroot/axi-star-cloud
chmod -R 755 /www/wwwroot/axi-star-cloud
```

## 📊 性能优化

### 1. 系统优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
sysctl -p
```

### 2. Nginx优化

在nginx配置中添加：
```nginx
# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# 静态文件缓存
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔒 安全建议

1. **定期更新系统**
2. **配置防火墙规则**
3. **使用强密码**
4. **定期备份数据**
5. **监控系统资源**

## 📞 技术支持

如果遇到问题，请检查：
1. 服务状态：`systemctl status axi-star-cloud`
2. 系统日志：`journalctl -u axi-star-cloud -f`
3. 网络连接：`curl http://localhost:8080/health`

---

**Go项目部署** - 简单、高效、稳定！ 