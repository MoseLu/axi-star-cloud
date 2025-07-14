# 自动部署指导文档

## 🚀 自动部署流程

### 1. 准备工作

#### 1.1 配置GitHub Secrets
在GitHub仓库中配置以下Secrets：
- `SERVER_HOST`: 服务器IP地址
- `SERVER_USER`: 服务器用户名 (通常是root)
- `SERVER_KEY`: 服务器SSH私钥内容

#### 1.2 配置服务器SSH密钥
```bash
# 在服务器上生成SSH密钥
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 将公钥添加到GitHub账户
cat ~/.ssh/id_rsa.pub
# 复制公钥内容到GitHub Settings -> SSH and GPG keys

# 将私钥内容复制到GitHub Secrets的SERVER_KEY
cat ~/.ssh/id_rsa
```

### 2. 触发自动部署

#### 2.1 推送代码触发部署
```bash
# 修改代码后推送到GitHub
git add .
git commit -m "更新代码"
git push origin main
```

#### 2.2 手动触发部署
1. 进入GitHub仓库页面
2. 点击 "Actions" 标签
3. 选择 "deploy" 工作流
4. 点击 "Run workflow" 按钮

### 3. 部署流程

自动部署会执行以下步骤：
1. 连接到服务器
2. 拉取最新代码
3. 编译Go程序
4. 重启服务
5. 验证部署状态

### 4. 验证部署

#### 4.1 检查服务状态
```bash
# 在服务器上检查服务状态
systemctl status star-cloud
```

#### 4.2 访问应用
- 网站地址: `http://your-domain.com`
- 健康检查: `http://your-domain.com/health`

### 5. 故障排除

#### 5.1 查看部署日志
1. 进入GitHub Actions页面
2. 点击最新的部署记录
3. 查看详细日志

#### 5.2 手动部署
如果自动部署失败，可以手动执行：
```bash
# 在服务器上执行
cd /www/wwwroot/your-domain.com
git pull origin main
cd backend
go build -o star-cloud main.go
systemctl restart star-cloud
```

### 6. 配置说明

#### 6.1 服务器要求
- 操作系统: CentOS 7+ / Ubuntu 18+
- Go版本: 1.23.4+
- 内存: 至少1GB
- 磁盘: 至少10GB可用空间

#### 6.2 端口配置
- 应用端口: 8080
- Nginx端口: 80/443
- SSH端口: 22

#### 6.3 目录结构
```
/www/wwwroot/your-domain.com/
├── backend/          # Go后端代码
├── front/           # 前端静态文件
├── index.html       # 主页面
└── star-cloud      # 编译后的可执行文件
```

### 7. 安全注意事项

1. **SSH密钥安全**: 定期更换SSH密钥
2. **防火墙配置**: 只开放必要端口
3. **定期备份**: 备份重要数据和配置文件
4. **日志监控**: 定期检查应用日志

### 8. 联系支持

如果遇到部署问题，请：
1. 检查GitHub Actions日志
2. 查看服务器系统日志
3. 确认网络连接正常
4. 验证SSH密钥配置

---

**注意**: 首次部署前请确保服务器已正确配置Go环境和Nginx反向代理。 