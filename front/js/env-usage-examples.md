# 动态环境配置系统使用指南

## 🌍 概述

星际云盘项目实现了类似EPS（Environment Configuration System）的动态环境配置系统，支持多种环境切换和配置管理。

## 🚀 快速开始

### 1. 自动环境检测

系统会自动检测当前环境：

```javascript
// 自动检测环境
console.log(window.ENV_MANAGER.currentEnv); // 'local', 'test', 'baota', 'prod'
console.log(window.ENV_MANAGER.config.name); // 环境名称
```

### 2. 手动切换环境

```javascript
// 切换到本地环境
window.ENV_UTILS.switchToLocal();

// 切换到测试环境
window.ENV_UTILS.switchToTest();

// 切换到生产环境
window.ENV_UTILS.switchToProd();

// 切换到自定义环境
window.ENV_UTILS.switchToCustom('https://your-api.com');
```

### 3. 使用环境配置

```javascript
// 构建API URL
const apiUrl = window.ENV_MANAGER.buildApiUrl('/api/files');
console.log(apiUrl); // http://localhost:8080/api/files

// 构建资源URL
const resourceUrl = window.ENV_MANAGER.buildResourceUrl('/static/css/style.css');

// 构建头像URL
const avatarUrl = window.ENV_MANAGER.buildAvatarUrl('user-avatar.jpg');

// 构建文件URL
const fileUrl = window.ENV_MANAGER.buildFileUrl('documents/report.pdf');
```

## 📋 环境配置

### 预定义环境

| 环境 | 名称 | API地址 | 调试模式 | 特性 |
|------|------|---------|----------|------|
| local | 本地开发 | http://localhost:8080 | ✅ | 热重载、详细日志 |
| test | 测试环境 | https://test-api.redamancy.com.cn | ✅ | 详细日志 |
| baota | 宝塔部署 | 相对路径 | ❌ | 生产优化 |
| prod | 生产环境 | https://api.redamancy.com.cn | ❌ | 生产优化 |
| custom | 自定义环境 | 用户定义 | ❌ | 可配置 |

### 环境特性

```javascript
// 检查功能是否启用
if (window.ENV_MANAGER.isFeatureEnabled('hotReload')) {
    console.log('热重载已启用');
}

if (window.ENV_MANAGER.isFeatureEnabled('detailedLogs')) {
    console.log('详细日志已启用');
}
```

## 🎛️ 环境切换方式

### 1. URL参数切换

在URL中添加`env`参数：

```
http://localhost:8080/?env=test
http://localhost:8080/?env=prod
http://localhost:8080/?env=custom
```

### 2. 控制台命令切换

在浏览器控制台中：

```javascript
// 显示当前环境信息
window.ENV_UTILS.showEnvInfo();

// 快速切换环境
window.ENV_UTILS.switchToLocal();
window.ENV_UTILS.switchToTest();
window.ENV_UTILS.switchToProd();
window.ENV_UTILS.switchToCustom('https://your-api.com');
```

### 3. 可视化界面切换

在开发模式下，页面右上角会显示环境切换器：

- 点击环境切换器打开面板
- 选择要切换的环境
- 输入自定义API地址
- 查看当前环境信息

## 🔧 高级用法

### 1. 监听环境变化

```javascript
// 监听环境切换事件
window.addEventListener('environmentChanged', (event) => {
    const { environment, config } = event.detail;
    console.log(`环境已切换到: ${config.name}`);
    
    // 重新初始化应用
    if (window.app) {
        window.app.reinitialize();
    }
});
```

### 2. 获取环境信息

```javascript
// 获取调试信息
const debugInfo = window.ENV_MANAGER.getDebugInfo();
console.log(debugInfo);

// 获取所有可用环境
const environments = window.ENV_MANAGER.getAvailableEnvironments();
console.log(environments);
```

### 3. 自定义环境配置

```javascript
// 创建自定义环境
window.ENV_MANAGER.switchEnvironment('custom', 'https://my-api.com');

// 检查当前环境
if (window.ENV_MANAGER.currentEnv === 'custom') {
    console.log('当前使用自定义环境');
}
```

## 📱 移动端支持

环境切换器在移动端会自动调整：

- 位置调整到右上角
- 面板宽度适配小屏幕
- 触摸友好的交互

## 🔒 安全考虑

### 生产环境保护

```javascript
// 在生产环境中隐藏环境切换器
if (window.ENV_MANAGER.currentEnv === 'prod') {
    // 隐藏调试功能
    console.log = () => {};
}
```

### 环境验证

```javascript
// 验证环境配置
function validateEnvironment() {
    const config = window.ENV_MANAGER.config;
    
    if (!config.apiBaseUrl && window.ENV_MANAGER.currentEnv !== 'baota') {
        console.warn('警告: API地址未配置');
    }
}
```

## 🛠️ 开发工具

### 1. 环境调试

```javascript
// 在控制台显示环境信息
window.ENV_UTILS.showEnvInfo();

// 输出格式：
// 🌍 环境信息
// 环境: 本地开发
// API地址: http://localhost:8080
// 调试模式: true
// 功能特性: {hotReload: true, detailedLogs: true, mockData: false}
```

### 2. 网络请求调试

```javascript
// 拦截API请求进行调试
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (window.ENV_MANAGER.config.debug) {
        console.log(`🌐 API请求: ${url}`);
    }
    return originalFetch(url, options);
};
```

## 📊 性能优化

### 1. 缓存策略

```javascript
// 根据环境设置不同的缓存策略
function getCacheStrategy() {
    const env = window.ENV_MANAGER.currentEnv;
    
    switch (env) {
        case 'local':
            return 'no-cache'; // 开发环境不缓存
        case 'test':
            return 'max-age=300'; // 测试环境5分钟缓存
        case 'prod':
            return 'max-age=3600'; // 生产环境1小时缓存
        default:
            return 'max-age=600'; // 默认10分钟缓存
    }
}
```

### 2. 错误处理

```javascript
// 环境相关的错误处理
function handleApiError(error) {
    const env = window.ENV_MANAGER.currentEnv;
    
    if (env === 'local' || env === 'test') {
        // 开发/测试环境显示详细错误
        console.error('API错误详情:', error);
    } else {
        // 生产环境显示用户友好错误
        console.error('服务暂时不可用');
    }
}
```

## 🔄 迁移指南

### 从旧版本迁移

如果你之前使用的是静态环境配置，可以这样迁移：

```javascript
// 旧版本代码
const API_BASE_URL = 'http://localhost:8080';

// 新版本代码
const apiUrl = window.ENV_MANAGER.buildApiUrl('/api/endpoint');
```

### 兼容性保持

系统保持了向后兼容性：

```javascript
// 旧版本API仍然可用
console.log(window.APP_CONFIG.API_BASE_URL);
console.log(window.APP_CONFIG.ENV);
console.log(window.APP_CONFIG.DEBUG);

// 新版本API
console.log(window.ENV_MANAGER.config.apiBaseUrl);
console.log(window.ENV_MANAGER.currentEnv);
console.log(window.ENV_MANAGER.config.debug);
```

## 📝 最佳实践

### 1. 环境命名规范

- `local`: 本地开发环境
- `test`: 测试环境
- `staging`: 预发布环境
- `prod`: 生产环境
- `custom`: 自定义环境

### 2. 配置管理

```javascript
// 推荐的环境配置结构
const environmentConfig = {
    name: '环境名称',
    apiBaseUrl: 'API基础地址',
    debug: true/false,
    features: {
        hotReload: true/false,
        detailedLogs: true/false,
        mockData: true/false
    }
};
```

### 3. 错误处理

```javascript
// 环境切换时的错误处理
try {
    window.ENV_MANAGER.switchEnvironment('prod');
} catch (error) {
    console.error('环境切换失败:', error);
    // 回退到默认环境
    window.ENV_MANAGER.switchEnvironment('local');
}
```

## 🎯 总结

动态环境配置系统提供了：

- ✅ 自动环境检测
- ✅ 多种切换方式
- ✅ 可视化界面
- ✅ 向后兼容
- ✅ 移动端支持
- ✅ 安全保护
- ✅ 性能优化

这个系统让环境管理变得简单、灵活和安全！ 