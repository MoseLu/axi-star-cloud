/**
 * 强制刷新测试脚本
 * 用于验证JavaScript错误修复
 */

// 测试函数
window.testJavaScriptErrors = function() {
    console.log('=== 开始JavaScript错误测试 ===');
    
    try {
        // 测试类声明
        console.log('测试类声明...');
        if (typeof UICore !== 'undefined') {
            console.log('✅ UICore类声明正常');
        } else {
            console.log('❌ UICore类声明失败');
        }
        
        if (typeof UIFolderManager !== 'undefined') {
            console.log('✅ UIFolderManager类声明正常');
        } else {
            console.log('❌ UIFolderManager类声明失败');
        }
        
        if (typeof UIUploadManager !== 'undefined') {
            console.log('✅ UIUploadManager类声明正常');
        } else {
            console.log('❌ UIUploadManager类声明失败');
        }
        
        if (typeof UIAdminManager !== 'undefined') {
            console.log('✅ UIAdminManager类声明正常');
        } else {
            console.log('❌ UIAdminManager类声明失败');
        }
        
        // 测试函数存在性
        console.log('测试函数存在性...');
        if (window.uiManager && typeof window.uiManager.bindUploadBtn === 'function') {
            console.log('✅ bindUploadBtn函数存在');
        } else {
            console.log('❌ bindUploadBtn函数不存在');
        }
        
        if (window.uiManager && typeof window.uiManager.checkAndShowAdminMenu === 'function') {
            console.log('✅ checkAndShowAdminMenu函数存在');
        } else {
            console.log('❌ checkAndShowAdminMenu函数不存在');
        }
        
        // 测试语法错误
        console.log('测试语法错误...');
        const testCode = `
            class TestClass {
                constructor() {
                    this.test = 'test';
                }
                
                testMethod() {
                    return this.test;
                }
            }
        `;
        
        try {
            eval(testCode);
            console.log('✅ 语法检查通过');
        } catch (error) {
            console.log('❌ 语法检查失败:', error);
        }
        
        console.log('=== JavaScript错误测试完成 ===');
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
};

// 自动运行测试
if (typeof window !== 'undefined') {
    // 延迟执行，确保页面加载完成
    setTimeout(() => {
        if (window.testJavaScriptErrors) {
            window.testJavaScriptErrors();
        }
    }, 1000);
} 