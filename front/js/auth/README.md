# Auth 模块

认证系统模块，提供完整的用户认证功能。

## 文件结构

```
auth/
├── index.js      # 主入口文件，整合所有模块
├── manager.js    # 核心认证管理器
├── events.js     # 事件处理器
├── particles.js  # 粒子效果管理器
├── utils.js      # 工具函数
└── README.md     # 说明文档
```

## 模块说明

### index.js - 主入口
- 整合所有认证相关模块
- 提供统一的认证管理接口
- 向后兼容原有的AuthManager类名

### manager.js - 认证管理器
- 用户登录/注册逻辑
- 用户状态管理
- 本地存储管理
- API通信

### events.js - 事件处理器
- 表单事件绑定
- 用户交互处理
- 事件清理机制

### particles.js - 粒子效果
- 登录页面背景动画
- 粒子效果配置
- 动态加载和销毁

### utils.js - 工具函数
- 数据验证（用户名、密码、邮箱）
- 安全存储操作
- 会话管理
- 错误处理
- 防抖/节流函数

## 使用方法

```javascript
// 获取认证系统实例
const authSystem = window.authSystem;

// 登录
await authSystem.handleLogin();

// 注册
await authSystem.handleRegister();

// 检查登录状态
const isLoggedIn = authSystem.isLoggedIn();

// 获取当前用户
const user = authSystem.getCurrentUser();

// 清除登录数据
authSystem.clearLoginData();
```

## 向后兼容

为了保持向后兼容性，原有的 `window.AuthManager` 仍然可用：

```javascript
// 旧的使用方式仍然有效
const authManager = new AuthManager();
```

## 模块化优势

1. **职责分离**：每个模块专注于特定功能
2. **易于维护**：代码结构清晰，便于调试和修改
3. **可扩展性**：可以轻松添加新功能或修改现有功能
4. **可测试性**：每个模块可以独立测试
5. **代码复用**：工具函数可以在其他地方复用 