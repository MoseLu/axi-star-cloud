/**
 * Service Worker - 离线缓存和资源管理
 * 
 * 提供离线缓存、资源缓存、网络请求拦截等功能，包括：
 * - 静态资源缓存
 * - API请求缓存
 * - 离线页面支持
 * - 缓存策略管理
 * - 自动更新机制
 * 
 * 该模块提供完整的PWA离线体验
 */

const CACHE_NAME = 'star-cloud-v1';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';

// 缓存配置
const CACHE_CONFIG = {
    // 静态资源缓存
    static: {
        name: STATIC_CACHE,
        urls: [
            '/static/css/responsive.css',
            '/static/css/font-optimization.css',
            '/static/js/api/core.js',
            '/static/js/ui/core.js',
            '/static/public/libs/font-awesome.min.css',
            '/static/public/libs/chart.umd.min.js',
            '/static/public/libs/marked.min.js',
            '/static/public/libs/particles.min.js',
            '/static/public/libs/xlsx.full.min.js'
        ],
        strategy: 'cache-first',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
    },
    
    // API缓存
    api: {
        name: API_CACHE,
        strategy: 'network-first',
        maxAge: 5 * 60 * 1000 // 5分钟
    },
    
    // 离线页面
    offline: {
        url: '/offline.html',
        strategy: 'cache-first'
    }
};

// 安装事件
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // 缓存静态资源
            cacheStaticResources(),
            // 缓存离线页面
            cacheOfflinePage()
        ]).then(() => {
            console.log('Service Worker: Installation completed');
            return self.skipWaiting();
        })
    );
});

// 激活事件
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // 清理旧缓存
            cleanupOldCaches(),
            // 立即控制页面
            self.clients.claim()
        ]).then(() => {
            console.log('Service Worker: Activation completed');
        })
    );
});

// 获取请求事件
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 跳过非GET请求
    if (request.method !== 'GET') {
        return;
    }
    
    // 跳过非HTTP(S)请求
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // 根据请求类型选择缓存策略
    if (isStaticResource(request)) {
        event.respondWith(handleStaticResource(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isHTMLRequest(request)) {
        event.respondWith(handleHTMLRequest(request));
    } else {
        event.respondWith(handleDefaultRequest(request));
    }
});

// 消息事件
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'GET_CACHE_INFO':
            getCacheInfo().then(info => {
                event.ports[0].postMessage(info);
            });
            break;
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
    }
});

/**
 * 缓存静态资源
 */
async function cacheStaticResources() {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    const resources = CACHE_CONFIG.static.urls;
    
    const promises = resources.map(async url => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log(`Cached: ${url}`);
            }
        } catch (error) {
            console.warn(`Failed to cache: ${url}`, error);
        }
    });
    
    await Promise.allSettled(promises);
}

/**
 * 缓存离线页面
 */
async function cacheOfflinePage() {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    const offlineHTML = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>星际云盘 - 离线</title>
            <style>
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: #0F172A; 
                    color: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    height: 100vh; 
                    margin: 0; 
                }
                .offline-container { 
                    text-align: center; 
                    padding: 2rem; 
                }
                .offline-icon { 
                    font-size: 4rem; 
                    margin-bottom: 1rem; 
                    opacity: 0.7; 
                }
                .offline-title { 
                    font-size: 1.5rem; 
                    margin-bottom: 1rem; 
                }
                .offline-message { 
                    opacity: 0.8; 
                    margin-bottom: 2rem; 
                }
                .retry-button { 
                    background: #7B61FF; 
                    color: white; 
                    border: none; 
                    padding: 0.75rem 1.5rem; 
                    border-radius: 0.5rem; 
                    cursor: pointer; 
                    font-size: 1rem; 
                }
                .retry-button:hover { 
                    background: #6B51EF; 
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">🌐</div>
                <div class="offline-title">网络连接已断开</div>
                <div class="offline-message">
                    您当前处于离线状态，部分功能可能无法使用。<br>
                    请检查网络连接后重试。
                </div>
                <button class="retry-button" onclick="window.location.reload()">
                    重新加载
                </button>
            </div>
        </body>
        </html>
    `;
    
    const response = new Response(offlineHTML, {
        headers: { 'Content-Type': 'text/html' }
    });
    
    await cache.put(CACHE_CONFIG.offline.url, response);
}

/**
 * 清理旧缓存
 */
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = [
        CACHE_CONFIG.static.name,
        CACHE_CONFIG.api.name
    ];
    
    const promises = cacheNames.map(cacheName => {
        if (!currentCaches.includes(cacheName)) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
        }
    });
    
    await Promise.all(promises);
}

/**
 * 判断是否为静态资源
 */
function isStaticResource(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/static/') || 
           url.pathname.includes('.css') ||
           url.pathname.includes('.js') ||
           url.pathname.includes('.woff') ||
           url.pathname.includes('.woff2') ||
           url.pathname.includes('.ttf');
}

/**
 * 判断是否为API请求
 */
function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/');
}

/**
 * 判断是否为HTML请求
 */
function isHTMLRequest(request) {
    const url = new URL(request.url);
    return url.pathname.endsWith('.html') || 
           url.pathname === '/' ||
           !url.pathname.includes('.');
}

/**
 * 处理静态资源请求
 */
async function handleStaticResource(request) {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    
    // 尝试从缓存获取
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // 网络请求
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // 网络失败时返回缓存的版本
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

/**
 * 处理API请求
 */
async function handleAPIRequest(request) {
    const cache = await caches.open(CACHE_CONFIG.api.name);
    
    try {
        // 网络优先
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // 网络失败时返回缓存
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

/**
 * 处理HTML请求
 */
async function handleHTMLRequest(request) {
    const cache = await caches.open(CACHE_CONFIG.static.name);
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // 返回离线页面
        const offlineResponse = await cache.match(CACHE_CONFIG.offline.url);
        if (offlineResponse) {
            return offlineResponse;
        }
        throw error;
    }
}

/**
 * 处理默认请求
 */
async function handleDefaultRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        // 对于其他请求，直接返回网络错误
        throw error;
    }
}

/**
 * 获取缓存信息
 */
async function getCacheInfo() {
    const cacheNames = await caches.keys();
    const cacheInfo = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheInfo[cacheName] = {
            size: keys.length,
            urls: keys.map(request => request.url)
        };
    }
    
    return cacheInfo;
}

/**
 * 清理所有缓存
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    const promises = cacheNames.map(cacheName => caches.delete(cacheName));
    await Promise.all(promises);
} 