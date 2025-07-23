// 字体加载测试脚本
document.addEventListener('DOMContentLoaded', function() {
    // 检查Font Awesome是否加载完成
    const testIcon = document.createElement('i');
    testIcon.className = 'fa fa-folder';
    testIcon.style.position = 'absolute';
    testIcon.style.left = '-9999px';
    document.body.appendChild(testIcon);
    
               // 检查字体是否已加载
           if (document.fonts && document.fonts.check) {
               document.fonts.ready.then(function() {
                   // 字体加载完成
               });
           }
    
    // 移除测试元素
    setTimeout(() => {
        if (testIcon.parentNode) {
            testIcon.parentNode.removeChild(testIcon);
        }
    }, 1000);
}); 