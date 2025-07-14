# 星际云盘 - 文件存储与管理系统

一个现代化的文件存储与管理Web应用，提供安全的文件上传、下载、管理和分享功能。

## 🌟 功能特性

### 📁 文件管理
- **文件上传**: 支持多种文件格式，支持拖拽上传
- **文件下载**: 安全下载，支持断点续传
- **文件预览**: 支持图片、文档、视频等多种格式预览
- **文件移动**: 在文件夹间移动文件
- **文件删除**: 安全删除文件，支持回收站功能

### 📂 文件夹管理
- **创建文件夹**: 创建多层嵌套文件夹
- **文件夹浏览**: 树形结构浏览文件夹
- **文件夹统计**: 显示文件夹内文件数量
- **文件夹操作**: 重命名、删除文件夹

### 👤 用户系统
- **用户认证**: 安全的登录系统
- **个人资料**: 用户信息管理
- **头像上传**: 支持头像上传和预览
- **存储配额**: 个人存储空间管理

### 💾 存储管理
- **存储统计**: 实时显示存储使用情况
- **存储限制**: 可配置的存储空间限制
- **文件分类**: 按类型自动分类文件

### 🎨 用户界面
- **现代化设计**: 基于Tailwind CSS的响应式设计
- **粒子效果**: 动态背景粒子效果
- **暗色主题**: 护眼的暗色主题
- **移动适配**: 完美支持移动设备

## 🛠️ 技术栈

### 后端
- **语言**: Go 1.23.4
- **Web框架**: Gin
- **数据库**: SQLite (开发) / MySQL (生产)
- **架构**: 分层架构 (Handler -> Repository -> Database)

### 前端
- **框架**: 原生JavaScript + HTML5
- **样式**: Tailwind CSS
- **图标**: Font Awesome
- **图表**: Chart.js
- **Markdown**: Marked.js
- **粒子效果**: Particles.js

## 📦 项目结构

```
project/
├── backend/                 # 后端Go代码
│   ├── config/             # 配置管理
│   ├── database/           # 数据库操作
│   ├── handlers/           # HTTP处理器
│   ├── models/             # 数据模型
│   ├── routes/             # 路由定义
│   ├── utils/              # 工具函数
│   ├── go.mod              # Go模块文件
│   └── main.go             # 主程序入口
├── front/                  # 前端静态文件
│   ├── css/               # 样式文件
│   ├── html/              # HTML模板
│   ├── js/                # JavaScript文件
│   ├── public/            # 公共资源
│   └── uploads/           # 上传文件存储
├── index.html             # 主页面
└── README.md              # 项目说明
```

## 🚀 快速开始

### 环境要求
- Go 1.23.4 或更高版本
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **安装后端依赖**
   ```bash
   cd backend
   go mod download
   ```

3. **运行后端服务**
   ```bash
   go run main.go
   ```
   服务将在 `http://localhost:8080` 启动

4. **访问应用**
   打开浏览器访问 `http://localhost:8080`

### 开发模式

1. **热重载开发** (需要安装air)
   ```bash
   cd backend
   air
   ```

2. **前端开发**
   - 修改 `front/` 目录下的文件
   - 刷新浏览器查看更改

## 📚 API文档

### 认证相关
- `POST /api/login` - 用户登录

### 文件管理
- `GET /api/files` - 获取文件列表
- `GET /api/files/:id` - 获取单个文件信息
- `GET /api/files/:id/download` - 下载文件
- `POST /api/upload` - 上传文件
- `DELETE /api/files/:id` - 删除文件
- `PUT /api/files/:id/move` - 移动文件

### 文件夹管理
- `GET /api/folders` - 获取文件夹列表
- `POST /api/folders` - 创建文件夹
- `PUT /api/folders/:id` - 更新文件夹
- `DELETE /api/folders/:id` - 删除文件夹
- `GET /api/folders/:id/count` - 获取文件夹文件数量

### 存储管理
- `GET /api/storage` - 获取存储信息
- `PUT /api/storage` - 更新存储限制

### 个人资料
- `GET /api/profile` - 获取个人资料
- `PUT /api/profile` - 更新个人资料
- `POST /api/profile/avatar` - 上传头像

### 系统监控
- `GET /health` - 健康检查

## 🔧 配置说明

### 数据库配置
默认使用SQLite数据库，配置文件位于 `backend/config/database.go`

### 存储配置
- 上传文件存储路径: `front/uploads/`
- 支持的文件类型: 图片、文档、音频、视频等
- 最大文件大小: 可配置

## 🎯 主要功能模块

### 1. 认证模块 (`handlers/auth.go`)
- 用户登录验证
- JWT token管理
- 会话管理

### 2. 文件管理模块 (`handlers/file.go`)
- 文件上传下载
- 文件元数据管理
- 文件类型检测

### 3. 文件夹模块 (`handlers/folder.go`)
- 文件夹CRUD操作
- 文件夹层级管理
- 文件统计

### 4. 存储管理模块 (`handlers/storage.go`)
- 存储空间监控
- 存储配额管理
- 存储统计

### 5. 个人资料模块 (`handlers/profile.go`)
- 用户信息管理
- 头像上传
- 个人设置

## 🎨 前端特性

### 响应式设计
- 移动端适配
- 平板端优化
- 桌面端体验

### 交互体验
- 拖拽上传
- 实时预览
- 进度显示
- 错误提示

### 视觉效果
- 粒子背景
- 动画过渡
- 加载状态
- 主题切换

## 🔒 安全特性

- 文件类型验证
- 文件大小限制
- 路径遍历防护
- XSS防护
- CSRF防护

## 📊 性能优化

- 静态文件缓存
- 图片压缩
- 懒加载
- 分页加载
- 数据库连接池

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 项目讨论区

---

**星际云盘** - 让文件管理更简单、更安全、更高效！ 