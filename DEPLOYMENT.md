# 宝塔面板部署指南

## 项目信息
- **域名**: redamancy.com.cn
- **项目路径**: /www/wwwroot/axi-star-cloud
- **项目类型**: Go + 前端静态文件

## 部署步骤

### 1. 宝塔面板配置

#### 1.1 创建网站
1. 在宝塔面板中创建新网站
2. **域名**: redamancy.com.cn
3. **根目录**: /www/wwwroot/axi-star-cloud
4. **PHP版本**: 纯静态（不需要PHP）

#### 1.2 配置反向代理
由于Go后端需要运行在8080端口，需要配置反向代理：

1. 在网站设置中找到"反向代理"
2. 添加反向代理规则：
   - **代理名称**: api
   - **目标URL**: http://127.0.0.1:8080
   - **发送域名**: $host

#### 1.3 配置静态文件
1. 在网站设置中找到"默认文档"
2. 添加 `index.html` 到列表顶部

### 2. 项目部署

#### 2.1 上传项目文件
将项目文件上传到 `/www/wwwroot/axi-star-cloud/` 目录：
```
/www/wwwroot/axi-star-cloud/
├── backend/          # Go后端代码
├── front/           # 前端静态文件
├── uploads/         # 上传文件目录
├── index.html       # 主页面
└── ...
```

#### 2.2 配置数据库
1. 在宝塔面板中创建MySQL数据库
2. 修改 `backend/config/config.yaml` 中的数据库配置：
```yaml
database:
  host: '127.0.0.1'
  port: '3306'
  user: '数据库用户名'
  password: '数据库密码'
  name: '数据库名'
```

#### 2.3 编译Go程序
在服务器上编译Go程序：
```bash
cd /www/wwwroot/axi-star-cloud/backend
go mod tidy
go build -o star-cloud main.go
```

#### 2.4 创建服务文件
创建systemd服务文件 `/etc/systemd/system/star-cloud.service`：
```ini
[Unit]
Description=Star Cloud Service
After=network.target

[Service]
Type=simple
User=www
WorkingDirectory=/www/wwwroot/axi-star-cloud/backend
ExecStart=/www/wwwroot/axi-star-cloud/backend/star-cloud
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

#### 2.5 启动服务
```bash
# 重新加载systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start star-cloud

# 设置开机自启
sudo systemctl enable star-cloud

# 查看服务状态
sudo systemctl status star-cloud
```

### 3. 权限配置

#### 3.1 设置目录权限
```bash
# 设置项目目录权限
chown -R www:www /www/wwwroot/axi-star-cloud
chmod -R 755 /www/wwwroot/axi-star-cloud

# 设置上传目录权限
chmod -R 777 /www/wwwroot/axi-star-cloud/uploads
```

#### 3.2 配置防火墙
确保8080端口在防火墙中开放（如果需要外部访问）。

### 4. 环境配置

#### 4.1 前端环境检测
项目会自动检测域名并配置正确的API地址：
- 本地开发: `http://localhost:8080`
- 宝塔部署: 使用相对路径（同一域名）

#### 4.2 后端配置
后端已配置为支持宝塔面板部署：
- 监听地址: `0.0.0.0:8080`
- CORS配置: 支持 `redamancy.com.cn`
- 静态文件路径: `/www/wwwroot/axi-star-cloud/front`
- 上传文件路径: `/www/wwwroot/axi-star-cloud/uploads`

### 5. 验证部署

#### 5.1 访问网站
1. 打开浏览器访问 `http://redamancy.com.cn`
2. 确认页面正常加载

#### 5.2 测试API
1. 访问 `http://redamancy.com.cn/api/health`（如果存在）
2. 确认API响应正常

#### 5.3 测试功能
1. 注册/登录用户
2. 上传文件
3. 创建文件夹
4. 测试所有主要功能

### 6. 故障排除

#### 6.1 查看日志
```bash
# 查看服务日志
sudo journalctl -u star-cloud -f

# 查看网站访问日志
tail -f /www/wwwlogs/redamancy.com.cn.log
```

#### 6.2 常见问题
1. **端口冲突**: 确保8080端口未被占用
2. **权限问题**: 确保www用户有足够权限
3. **数据库连接**: 检查数据库配置和连接
4. **静态文件**: 确保前端文件路径正确

### 7. 维护

#### 7.1 更新代码
1. 上传新的代码文件
2. 重新编译Go程序
3. 重启服务: `sudo systemctl restart star-cloud`

#### 7.2 备份
定期备份以下内容：
- 数据库
- 上传文件 (`/www/wwwroot/axi-star-cloud/uploads`)
- 配置文件

#### 7.3 监控
- 监控服务状态: `sudo systemctl status star-cloud`
- 监控磁盘空间
- 监控数据库性能 