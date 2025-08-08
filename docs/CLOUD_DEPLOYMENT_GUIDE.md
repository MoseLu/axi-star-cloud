# 云端部署指南

## 概述

本指南将帮助您在云端正确部署星际云盘系统，使用GORM自动迁移确保数据库正确初始化。

## 部署前准备

### 1. 环境要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+)
- **数据库**: MySQL 8.0+
- **Go版本**: 1.19+
- **内存**: 至少 2GB
- **存储**: 至少 10GB

### 2. 数据库准备
确保MySQL服务正在运行，并创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS `docs` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 部署步骤

### 1. 上传代码
将项目代码上传到服务器：

```bash
# 克隆项目
git clone https://github.com/MoseLu/axi-star-cloud.git
cd axi-star-cloud
```

### 2. 配置环境
创建配置文件 `backend/config/config-prod.yaml`：

```yaml
server:
  port: '8080'
  host: '0.0.0.0'
  
database:
  host: '127.0.0.1'  # 或您的数据库主机
  port: '3306'
  user: 'root'        # 您的数据库用户名
  password: 'your_password'  # 您的数据库密码
  name: 'docs'
```

### 3. 编译应用
```bash
cd backend
go mod tidy
go build -o star-cloud
```

### 4. 启动应用（自动初始化数据库）
**GORM会自动处理数据库初始化**，直接启动应用即可：

```bash
# 启动应用（GORM会自动创建表）
./star-cloud

# 或后台运行
nohup ./star-cloud > app.log 2>&1 &
```

## 常见问题解决

### 问题1: "Table 'docs.user' doesn't exist"
**原因**: 数据库表未正确创建

**解决方案**:
1. 确保数据库存在：
```sql
CREATE DATABASE IF NOT EXISTS `docs`;
```

2. 重新启动应用（GORM会自动创建表）：
```bash
./star-cloud
```

3. 如果仍有问题，检查数据库连接配置

### 问题2: 数据库连接失败
**原因**: 数据库配置错误或服务未启动

**解决方案**:
1. 检查MySQL服务状态：
```bash
sudo systemctl status mysql
```

2. 检查数据库连接：
```bash
mysql -u root -p -h 127.0.0.1
```

3. 验证配置文件中的数据库连接信息

### 问题3: 权限问题
**原因**: 数据库用户权限不足

**解决方案**:
```sql
-- 为数据库用户授予权限
GRANT ALL PRIVILEGES ON docs.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## 部署检查清单

### 部署前检查
- [ ] MySQL服务正在运行
- [ ] 数据库 `docs` 已创建
- [ ] 数据库用户有足够权限
- [ ] 配置文件正确设置

### 部署后检查
- [ ] 应用成功启动（监听8080端口）
- [ ] 健康检查通过：`curl http://localhost:8080/health`
- [ ] 数据库状态正常：`curl http://localhost:8080/db-status`

## 监控和维护

### 1. 日志监控
```bash
# 查看应用日志
tail -f app.log

# 查看系统日志
sudo journalctl -u mysql
```

### 2. 数据库备份
```bash
# 备份数据库
mysqldump -u root -p docs > backup_$(date +%Y%m%d).sql
```

### 3. 性能监控
```bash
# 检查应用状态
curl http://localhost:8080/metrics

# 检查数据库连接
mysql -u root -p -e "SHOW PROCESSLIST;"
```

## 故障排除

### 1. 应用无法启动
检查错误日志：
```bash
tail -f app.log
```

常见原因：
- 配置文件路径错误
- 数据库连接失败
- 端口被占用

### 2. 数据库表缺失
GORM会自动处理，重新启动应用即可：
```bash
./star-cloud
```

### 3. 性能问题
- 检查数据库连接池配置
- 监控内存使用情况
- 优化查询性能

## 安全建议

1. **数据库安全**:
   - 使用强密码
   - 限制数据库访问IP
   - 定期更新MySQL

2. **应用安全**:
   - 使用HTTPS
   - 配置防火墙
   - 定期备份数据

3. **系统安全**:
   - 更新系统补丁
   - 监控系统资源
   - 设置日志轮转

## 联系支持

如果遇到问题，请：
1. 检查本文档的故障排除部分
2. 查看应用日志和系统日志
3. 提供详细的错误信息和环境信息
