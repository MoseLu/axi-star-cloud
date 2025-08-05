# 部署故障排除指南

## 服务启动失败问题

### 问题描述
服务启动时出现 `exit-code` 错误，服务无法正常启动。

### 常见原因
1. **配置文件问题**：生产环境配置文件不存在或配置错误
2. **数据库连接问题**：数据库服务未启动或连接参数错误
3. **文件权限问题**：二进制文件或目录权限不正确
4. **依赖问题**：缺少必要的系统依赖

### 解决方案

#### 1. 使用诊断脚本
```bash
# 运行诊断脚本
chmod +x debug-service.sh
./debug-service.sh
```

#### 2. 使用修复脚本
```bash
# 运行修复脚本
chmod +x fix-service.sh
./fix-service.sh
```

#### 3. 手动检查步骤

##### 检查服务状态
```bash
sudo systemctl status star-cloud.service
```

##### 查看详细日志
```bash
sudo journalctl -u star-cloud.service -f
```

##### 检查配置文件
```bash
# 检查配置文件是否存在
ls -la /srv/apps/axi-star-cloud/backend/config/

# 检查配置文件内容
cat /srv/apps/axi-star-cloud/backend/config/config-prod.yaml
```

##### 检查数据库连接
```bash
# 测试数据库连接
mysql -h 127.0.0.1 -P 3306 -u root -p123456 -e "SELECT 1;"

# 检查数据库是否存在
mysql -h 127.0.0.1 -P 3306 -u root -p123456 -e "SHOW DATABASES;"
```

##### 检查文件权限
```bash
# 检查二进制文件权限
ls -la /srv/apps/axi-star-cloud/star-cloud-linux

# 修复权限
sudo chown -R deploy:deploy /srv/apps/axi-star-cloud
sudo chmod +x /srv/apps/axi-star-cloud/star-cloud-linux
```

##### 手动测试运行
```bash
# 切换到应用目录
cd /srv/apps/axi-star-cloud

# 设置环境变量
export GIN_MODE=release

# 手动运行（观察输出）
./star-cloud-linux
```

### 常见错误及解决方案

#### 1. 配置文件找不到
**错误信息**：`找不到配置文件`
**解决方案**：
```bash
# 确保配置文件存在
sudo cp /srv/apps/axi-star-cloud/backend/config/config.yaml /srv/apps/axi-star-cloud/backend/config/config-prod.yaml
```

#### 2. 数据库连接失败
**错误信息**：`数据库连接测试失败`
**解决方案**：
```bash
# 启动 MySQL 服务
sudo systemctl start mysql

# 创建数据库
mysql -h 127.0.0.1 -P 3306 -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS docs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

#### 3. 端口被占用
**错误信息**：`address already in use`
**解决方案**：
```bash
# 检查端口占用
netstat -tlnp | grep :8080

# 杀死占用进程
sudo kill -9 <PID>
```

#### 4. 权限不足
**错误信息**：`permission denied`
**解决方案**：
```bash
# 修复权限
sudo chown -R deploy:deploy /srv/apps/axi-star-cloud
sudo chmod +x /srv/apps/axi-star-cloud/star-cloud-linux
```

### 预防措施

1. **部署前检查**：
   - 确保 MySQL 服务正在运行
   - 确保配置文件存在且正确
   - 确保目标目录有足够权限

2. **监控服务**：
   - 定期检查服务状态
   - 监控日志文件
   - 设置告警机制

3. **备份配置**：
   - 备份重要配置文件
   - 记录部署步骤
   - 保存故障排除记录

### 联系支持

如果问题仍然存在，请提供以下信息：
1. 完整的错误日志
2. 系统环境信息
3. 配置文件内容（脱敏）
4. 数据库连接测试结果 