// 修复API URL构建问题的脚本
// 这个脚本将修复所有使用 ${this.baseUrl} 的API调用

const fs = require('fs');
const path = require('path');

// 读取api.js文件
const apiFile = path.join(__dirname, 'front/js/api.js');
let content = fs.readFileSync(apiFile, 'utf8');

// 定义需要修复的API调用模式
const patterns = [
    // 登录和注册
    { from: '`${this.baseUrl}/api/login`', to: 'this.buildApiUrl(\'/api/login\')' },
    { from: '`${this.baseUrl}/api/register`', to: 'this.buildApiUrl(\'/api/register\')' },
    
    // 文件相关
    { from: '`${this.baseUrl}/api/files/${fileId}?user_id=${userId}`', to: 'this.buildApiUrl(`/api/files/${fileId}?user_id=${userId}`)' },
    { from: '`${this.baseUrl}/api/files/${fileId}/download?user_id=${userId}`', to: 'this.buildApiUrl(`/api/files/${fileId}/download?user_id=${userId}`)' },
    { from: '`${this.baseUrl}/api/files/${fileId}/move?user_id=${userId}`', to: 'this.buildApiUrl(`/api/files/${fileId}/move?user_id=${userId}`)' },
    { from: '`${this.baseUrl}/api/files/count?user_id=${userId}`', to: 'this.buildApiUrl(`/api/files/count?user_id=${userId}`)' },
    
    // 文件夹相关
    { from: '`${this.baseUrl}/api/folders?user_id=${userId}`', to: 'this.buildApiUrl(`/api/folders?user_id=${userId}`)' },
    { from: '`${this.baseUrl}/api/folders/${folderId}?user_id=${userId}`', to: 'this.buildApiUrl(`/api/folders/${folderId}?user_id=${userId}`)' },
    { from: '`${this.baseUrl}/api/folders/${folderId}/count?user_id=${userId}`', to: 'this.buildApiUrl(`/api/folders/${folderId}/count?user_id=${userId}`)' },
    
    // 存储相关
    { from: '`${this.baseUrl}/api/storage?user_id=${userId}`', to: 'this.buildApiUrl(`/api/storage?user_id=${userId}`)' },
    
    // 文档相关
    { from: '`${this.baseUrl}/api/documents?user_id=${userId}`', to: 'this.buildApiUrl(`/api/documents?user_id=${userId}`)' },
    { from: '`${this.baseUrl}/api/documents/${docId}?user_id=${userId}`', to: 'this.buildApiUrl(`/api/documents/${docId}?user_id=${userId}`)' },
    
    // 个人资料相关
    { from: '`${this.baseUrl}/api/profile?user_id=${userId}`', to: 'this.buildApiUrl(`/api/profile?user_id=${userId}`)' },
    { from: '`${this.baseUrl}/api/profile/avatar?user_id=${userId}`', to: 'this.buildApiUrl(`/api/profile/avatar?user_id=${userId}`)' },
    
    // 上传相关
    { from: '`${this.baseUrl}/api/upload`', to: 'this.buildApiUrl(\'/api/upload\')' },
];

// 应用修复
patterns.forEach(pattern => {
    content = content.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
});

// 添加错误日志
content = content.replace(/catch \(error\) \{[\s\S]*?return \{ success: false, error: '网络错误' \};/g, (match) => {
    return match.replace(/catch \(error\) \{/, 'catch (error) {\n            console.error(\'API调用失败:\', error);');
});

// 写回文件
fs.writeFileSync(apiFile, content, 'utf8');

console.log('✅ API URL修复完成！'); 