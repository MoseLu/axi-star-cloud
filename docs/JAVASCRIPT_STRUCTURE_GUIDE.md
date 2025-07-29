---
title: JavaScript目录结构指南
---

# JavaScript 目录结构说明

## 目录组织

### `/core/` - 核心模块
- `app.js` - 主应用入口
- `core.js` - 应用核心功能
- `env-manager.js` - 环境管理器
- `component-loader.js` - 组件加载器
- `env.js` - 环境配置
- `font-load-test.js` - 字体加载测试

### `/auth/` - 认证相关
- `manager.js` - 认证管理器
- `token.js` - Token管理
- `events.js` - 认证事件
- `particles.js` - 粒子效果
- `index.js` - 认证模块入口
- `utils.js` - 认证工具

### `/api/` - API接口
- `gateway.js` - API网关
- `core.js` - API核心
- `auth.js` - 认证API
- `files.js` - 文件API
- `folders.js` - 文件夹API
- `storage.js` - 存储API
- `profile.js` - 用户资料API
- `admin.js` - 管理员API
- `documents.js` - 文档API
- `url-files.js` - URL文件API
- `index.js` - API模块入口
- `utils.js` - API工具
- `error-manager.js` - 错误管理

### `/ui/` - 用户界面
#### `/ui/managers/` - 管理器
- `upload.js` - 上传管理器
- `profile.js` - 资料管理器
- `settings.js` - 设置管理器
- `storage.js` - 存储管理器
- `help.js` - 帮助管理器
- `user.js` - 用户管理器

#### `/ui/components/` - 组件
- `categories.js` - 分类组件
- `doc-viewer.js` - 文档查看器
- `env-switcher.js` - 环境切换器
- `docs-sync.js` - 文档同步
- `upload-queue.js` - 上传队列

#### `/ui/handlers/` - 处理器
- `file-renderer.js` - 文件渲染器
- `file-preview.js` - 文件预览
- `file-operations.js` - 文件操作
- `folder-manager.js` - 文件夹管理

#### `/ui/modals/` - 模态框
- `modal-manager.js` - 模态框管理器

#### `/ui/admin/` - 管理员功能
- `admin-manager.js` - 管理员管理器

#### `/ui/theme/` - 主题相关
- `theme-transition.js` - 主题切换动画

#### 根目录文件
- `core.js` - UI核心
- `index.js` - UI主入口
- `utils.js` - UI工具

### `/utils/` - 通用工具
- `message-box.js` - 消息盒子
- `notify.js` - 通知工具

### `/performance/` - 性能优化
- `monitor.js` - 性能监控
- `optimizer.js` - 包优化器

### `/mobile/` - 移动端增强
- `enhancement.js` - 移动端增强

## 文件命名规范

1. **管理器文件**: 使用 `manager.js` 或直接使用功能名称，如 `upload.js`
2. **组件文件**: 使用功能名称，如 `doc-viewer.js`
3. **处理器文件**: 使用 `handler.js` 或功能名称，如 `file-renderer.js`
4. **工具文件**: 使用 `utils.js` 或功能名称，如 `message-box.js`

## 依赖关系

- 核心模块 (`/core/`) 不依赖其他模块
- 认证模块 (`/auth/`) 依赖核心模块
- API模块 (`/api/`) 依赖核心模块和认证模块
- UI模块 (`/ui/`) 依赖所有其他模块
- 工具模块 (`/utils/`) 可被所有模块使用
- 性能模块 (`/performance/`) 独立运行
- 移动端模块 (`/mobile/`) 依赖UI模块

## 加载顺序

在 `index.html` 中的加载顺序：
1. 工具模块
2. 核心模块
3. 认证模块
4. API模块
5. UI模块
6. 性能模块
7. 移动端模块