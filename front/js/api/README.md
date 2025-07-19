# API模块说明文档

本目录包含星际云盘项目的API模块，采用模块化设计，便于维护和扩展。

## 文件结构

### 核心模块
- `core.js` - 核心API管理器和基础功能
  - URL构建方法
  - 用户管理功能
  - 基础配置管理

### 功能模块
- `auth.js` - 认证相关API
  - 用户登录
  - 用户注册
  - 退出登录
- `files.js` - 文件管理API
  - 文件上传、下载、删除
  - 文件列表获取
  - 文件移动
  - 文件类型映射
- `folders.js` - 文件夹管理API
  - 文件夹创建、删除、更新
  - 文件夹列表获取
  - 文件夹文件数量统计
- `storage.js` - 存储管理API
  - 存储信息查询
  - 存储限制更新
  - 文件总数统计
- `profile.js` - 个人资料API
  - 个人资料查询、更新
  - 头像上传
- `admin.js` - 管理员功能API
  - 用户管理
  - 存储限制管理
- `url-files.js` - URL文件管理API
  - URL文件创建、删除、查询
  - URL文件移动
- `documents.js` - 文档管理API
  - 文档创建、删除、查询
- `utils.js` - API工具函数
  - 文件大小格式化
  - 文件类型图标映射
  - 文件类型颜色映射

### 主入口
- `index.js` - API系统主入口
  - 整合所有API模块
  - 提供统一的API管理接口
  - 向后兼容性支持

## 模块化优势

1. **职责分离**: 每个模块负责特定的功能领域
2. **可维护性**: 代码结构清晰，便于定位和修改问题
3. **可扩展性**: 新增功能时只需添加或修改对应的模块
4. **团队协作**: 不同开发者可以并行开发不同模块
5. **测试友好**: 每个模块可以独立测试

## 使用方式

### 1. 直接使用ApiSystem实例
```javascript
// 获取文件列表
const files = await window.apiSystem.getFiles();

// 上传文件
const result = await window.apiSystem.uploadFile(file);

// 获取存储信息
const storageInfo = await window.apiSystem.getStorageInfo();
```

### 2. 使用特定模块
```javascript
// 获取文件模块
const filesModule = window.apiSystem.getFiles();

// 获取认证模块
const authModule = window.apiSystem.getAuth();

// 获取工具模块
const utilsModule = window.apiSystem.getUtils();
```

### 3. 向后兼容
```javascript
// 原有的ApiManager方式仍然可用
const apiManager = new ApiManager();
const files = await apiManager.getFiles();
```

## 模块依赖关系

```
ApiSystem (index.js)
├── Core (core.js) - 基础依赖
├── Auth (auth.js) - 依赖Core
├── Files (files.js) - 依赖Core
├── Folders (folders.js) - 依赖Core
├── Storage (storage.js) - 依赖Core
├── Profile (profile.js) - 依赖Core
├── Admin (admin.js) - 依赖Core
├── UrlFiles (url-files.js) - 依赖Core
├── Documents (documents.js) - 依赖Core
└── ApiUtils (utils.js) - 独立模块
```

## 初始化流程

1. **DOM加载完成** - 等待页面完全加载
2. **模块检查** - 检查所有必需模块是否可用
3. **实例创建** - 创建各个模块的实例
4. **依赖注入** - 将Core实例注入到需要依赖的模块
5. **状态标记** - 标记系统为已初始化状态

## 错误处理

- 每个模块都有完善的错误处理机制
- 网络错误、权限错误、数据格式错误等都有相应处理
- 提供详细的错误信息便于调试

## 性能优化

- 延迟初始化，避免阻塞页面加载
- 模块按需加载，减少不必要的资源消耗
- 缓存机制，避免重复请求
- 错误重试机制，提高请求成功率

## 浏览器兼容性

- 支持现代浏览器的ES6+特性
- 使用Fetch API进行网络请求
- 支持Promise和async/await语法
- 兼容移动端浏览器

## 开发指南

### 添加新的API方法
1. 在对应的模块文件中添加方法
2. 在index.js中添加代理方法
3. 更新文档说明

### 修改现有功能
1. 在对应的模块文件中修改
2. 确保不影响其他模块
3. 更新相关测试

### 调试技巧
1. 使用浏览器开发者工具查看网络请求
2. 检查控制台错误信息
3. 验证模块初始化状态

## 更新日志

### v1.0.0 (2024-07-19)
- ✨ 完成API模块化拆分
- 🎯 实现功能模块分离
- 🔧 添加向后兼容性支持
- 📝 完善文档说明

## 相关文件

- `front/js/api.js` - 原始API文件（已拆分）
- `front/js/app.js` - 应用主文件
- `front/js/ui.js` - UI管理文件
- `index.html` - 主页面文件（包含脚本引用） 