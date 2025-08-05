# 部署问题排查指南

## 问题分析

根据日志分析，部署流程已经成功完成文件上传和解压，但服务启动失败。主要问题包括：

1. **配置文件路径不匹配** - 程序无法找到正确的配置文件
2. **数据库连接问题** - 可能数据库不存在或连接失败
3. **部署路径与配置不一致** - 配置文件中的路径指向旧环境

## 解决方案

### 1. 立即修复步骤

在服务器上执行以下命令：

```bash
# 进入部署目录
cd /srv/apps/axi-star-cloud

# 复制配置文件到根目录
cp backend/config/config.yaml ./config.yaml

# 创建必要的目录
mkdir -p logs uploads front

# 设置权限
chown -R deploy:deploy .
chmod +x star-cloud-linux

# 检查数据库
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS docs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 重启服务
systemctl restart star-cloud.service
```

### 2. 使用修复脚本

运行提供的修复脚本：

```bash
# 给脚本执行权限
chmod +x deploy-fix.sh

# 运行修复脚本
./deploy-fix.sh
```

### 3. 诊断问题

运行诊断脚本：

```bash
# 给脚本执行权限
chmod +x debug-deploy.sh

# 运行诊断脚本
./debug-deploy.sh
```

## 常见问题及解决方案

### 问题1: 配置文件找不到

**症状**: 程序启动时立即退出，日志显示配置加载失败

**解决方案**:
```bash
# 确保配置文件在正确位置
ls -la /srv/apps/axi-star-cloud/config.yaml
ls -la /srv/apps/axi-star-cloud/backend/config/config.yaml

# 如果不存在，复制配置文件
cp backend/config/config.yaml ./config.yaml
```

### 问题2: 数据库连接失败

**症状**: 程序启动时数据库连接错误

**解决方案**:
```bash
# 检查 MySQL 服务状态
systemctl status mysql

# 启动 MySQL 服务
systemctl start mysql

# 创建数据库
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS docs;"

# 检查数据库连接
mysql -u root -p123456 -e "USE docs; SELECT 1;"
```

### 问题3: 端口被占用

**症状**: 程序无法绑定到端口 8080

**解决方案**:
```bash
# 检查端口占用
netstat -tlnp | grep :8080

# 停止占用端口的进程
sudo kill -9 <PID>

# 或者修改配置文件中的端口
sed -i 's/port: .8080./port: .8081./' config.yaml
```

### 问题4: 权限问题

**症状**: 程序无法访问文件或目录

**解决方案**:
```bash
# 设置正确的权限
chown -R deploy:deploy /srv/apps/axi-star-cloud
chmod -R 755 /srv/apps/axi-star-cloud
chmod 644 /srv/apps/axi-star-cloud/config.yaml
chmod +x /srv/apps/axi-star-cloud/star-cloud-linux
```

## 手动测试步骤

1. **测试配置文件加载**:
```bash
cd /srv/apps/axi-star-cloud
timeout 5s ./star-cloud-linux
```

2. **检查服务日志**:
```bash
journalctl -u star-cloud.service -f
```

3. **测试健康检查**:
```bash
curl http://localhost:8080/health
```

## 配置文件说明

主要配置文件路径：
- `/srv/apps/axi-star-cloud/config.yaml` - 根目录配置（推荐）
- `/srv/apps/axi-star-cloud/backend/config/config.yaml` - 备用配置

关键配置项：
```yaml
deployment:
  type: 'prod'
  static_path: '/srv/apps/axi-star-cloud/front'
  upload_path: '/srv/apps/axi-star-cloud/uploads'

database:
  host: '127.0.0.1'
  port: '3306'
  user: 'root'
  password: '123456'
  name: 'docs'
```

## 服务文件配置

确保 `star-cloud.service` 文件包含正确的环境变量：

```ini
[Service]
Environment=GIN_MODE=release
Environment=CONFIG_PATH=/srv/apps/axi-star-cloud/config.yaml
```

## 成功标志

服务成功启动的标志：
1. `systemctl is-active star-cloud.service` 返回 `active`
2. `curl http://localhost:8080/health` 返回成功响应
3. 服务日志中没有错误信息

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 运行 `debug-deploy.sh` 的完整输出
2. `journalctl -u star-cloud.service --no-pager` 的完整日志
3. 服务器环境信息（操作系统、MySQL版本等） 