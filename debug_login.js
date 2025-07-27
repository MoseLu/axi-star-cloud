/**
 * 登录状态调试脚本
 * 用于检查生产环境登录问题
 */

console.log('🔍 开始调试登录状态...');

// 检查localStorage中的用户信息
function checkLocalStorage() {
    console.log('📋 检查localStorage...');
    
    const userInfo = localStorage.getItem('userInfo');
    console.log('userInfo:', userInfo);
    
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            console.log('✅ 解析的用户信息:', user);
            console.log('用户ID:', user.uuid || user.id);
            console.log('用户名:', user.username);
        } catch (error) {
            console.error('❌ 解析用户信息失败:', error);
        }
    } else {
        console.log('⚠️ 未找到用户信息');
    }
}

// 检查API管理器的用户信息
function checkAPIManager() {
    console.log('📋 检查API管理器...');
    
    if (window.apiManager) {
        console.log('✅ API管理器存在');
        const user = window.apiManager.getCurrentUser();
        console.log('当前用户:', user);
        console.log('用户ID:', window.apiManager.getCurrentUserId());
        console.log('是否已登录:', window.apiManager.isLoggedIn());
    } else {
        console.log('❌ API管理器不存在');
    }
}

// 检查Core类的用户信息
function checkCore() {
    console.log('📋 检查Core类...');
    
    if (window.Core) {
        console.log('✅ Core类存在');
    } else {
        console.log('❌ Core类不存在');
    }
}

// 检查StorageManager
function checkStorageManager() {
    console.log('📋 检查StorageManager...');
    
    if (window.StorageManager) {
        console.log('✅ StorageManager存在');
        const user = window.StorageManager.getUser();
        console.log('StorageManager用户:', user);
    } else {
        console.log('❌ StorageManager不存在');
    }
}

// 检查Cookie
function checkCookies() {
    console.log('📋 检查Cookie...');
    
    const cookies = document.cookie.split(';');
    console.log('所有Cookie:', cookies);
    
    const accessToken = cookies.find(cookie => cookie.trim().startsWith('access_token='));
    const refreshToken = cookies.find(cookie => cookie.trim().startsWith('refresh_token='));
    
    console.log('访问Token:', accessToken ? '存在' : '不存在');
    console.log('刷新Token:', refreshToken ? '存在' : '不存在');
}

// 检查环境配置
function checkEnvironment() {
    console.log('📋 检查环境配置...');
    
    if (window.ENV_MANAGER) {
        const config = window.ENV_MANAGER.getCurrentEnvironment();
        console.log('当前环境配置:', config);
    } else {
        console.log('❌ ENV_MANAGER不存在');
    }
    
    if (window.APP_CONFIG) {
        console.log('APP_CONFIG:', window.APP_CONFIG);
    } else {
        console.log('❌ APP_CONFIG不存在');
    }
}

// 检查重复元素
function checkDuplicateElements() {
    console.log('📋 检查重复元素...');
    
    const settingsForms = document.querySelectorAll('#settingsForm');
    console.log('settingsForm元素数量:', settingsForms.length);
    
    if (settingsForms.length > 1) {
        console.log('❌ 发现重复的settingsForm元素');
        settingsForms.forEach((form, index) => {
            console.log(`settingsForm ${index}:`, form);
        });
    } else {
        console.log('✅ 没有重复的settingsForm元素');
    }
}

// 运行所有检查
function runAllChecks() {
    console.log('🚀 开始运行登录状态检查...\n');
    
    checkLocalStorage();
    console.log('');
    
    checkAPIManager();
    console.log('');
    
    checkCore();
    console.log('');
    
    checkStorageManager();
    console.log('');
    
    checkCookies();
    console.log('');
    
    checkEnvironment();
    console.log('');
    
    checkDuplicateElements();
    console.log('');
    
    console.log('✅ 所有检查完成！');
}

// 自动运行检查
runAllChecks(); 