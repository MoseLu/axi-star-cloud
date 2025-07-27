/**
 * 登录持久化测试脚本
 * 用于测试清空缓存和cookie后登录是否正常
 */

// 测试登录持久化
async function testLoginPersistence() {
    console.log('🧪 开始测试登录持久化...');
    
    // 1. 清空所有缓存和cookie
    console.log('1️⃣ 清空缓存和cookie...');
    localStorage.clear();
    sessionStorage.clear();
    
    // 清除所有cookie
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('✅ 缓存和cookie已清空');
    
    // 2. 等待页面重新加载
    console.log('2️⃣ 等待页面重新加载...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. 检查是否显示登录界面
    const loginPage = document.getElementById('login-page');
    const app = document.getElementById('app');
    
    if (loginPage && !loginPage.classList.contains('hidden')) {
        console.log('✅ 正确显示登录界面');
    } else {
        console.log('❌ 登录界面显示异常');
    }
    
    // 4. 模拟登录
    console.log('3️⃣ 模拟登录...');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    if (usernameInput && passwordInput) {
        usernameInput.value = 'testuser';
        passwordInput.value = 'testpass';
        
        // 触发登录
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.dispatchEvent(new Event('submit', { bubbles: true }));
        }
        
        console.log('✅ 登录表单已提交');
    } else {
        console.log('❌ 找不到登录表单元素');
    }
    
    // 5. 等待登录完成
    console.log('4️⃣ 等待登录完成...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. 检查登录状态
    console.log('5️⃣ 检查登录状态...');
    const userInfo = localStorage.getItem('userInfo');
    const cookies = document.cookie;
    
    console.log('用户信息:', userInfo);
    console.log('Cookie:', cookies);
    
    // 7. 检查界面状态
    if (app && !app.classList.contains('hidden')) {
        console.log('✅ 主界面显示正常');
    } else {
        console.log('❌ 主界面显示异常');
    }
    
    // 8. 检查token
    if (window.tokenManager) {
        try {
            const isTokenValid = await window.tokenManager.validateTokens();
            console.log('Token验证结果:', isTokenValid);
        } catch (error) {
            console.log('Token验证失败:', error);
        }
    }
    
    console.log('🧪 测试完成');
}

// 运行测试
if (typeof window !== 'undefined') {
    // 在浏览器环境中运行
    window.testLoginPersistence = testLoginPersistence;
    console.log('测试脚本已加载，运行 window.testLoginPersistence() 开始测试');
} else {
    // 在Node.js环境中运行
    console.log('此脚本需要在浏览器环境中运行');
} 