/**
 * 更新日志管理器
 * 负责管理更新日志的加载、同步和显示
 */
class UpdateLogManager {
    constructor() {
        this.updateLogsData = null;
        this.syncStatus = null;
        this.stats = null;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.isInitialized = false;
        // 暂时禁用自动初始化，避免重复调用API
        // this.init();
    }

    async init() {
        try {
            // 延迟初始化，避免阻塞页面加载
            setTimeout(async () => {
                await this.initializeUpdateLogs();
            }, 1000);
        } catch (error) {
            console.error('初始化更新日志管理器失败:', error);
        }
    }

    /**
     * 初始化更新日志
     */
    async initializeUpdateLogs() {
        try {
            // 加载更新日志数据
            await this.loadUpdateLogsData();
            
            // 加载同步状态
            await this.loadSyncStatus();
            
            // 加载统计信息
            await this.loadStats();
            
            // 设置自动同步
            this.setupAutoSync();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('初始化更新日志失败:', error);
        }
    }

    /**
     * 加载更新日志数据
     */
    async loadUpdateLogsData() {
        try {
            // 从本地存储加载数据
            const cachedData = localStorage.getItem('updateLogsData');
            if (cachedData) {
                this.updateLogsData = JSON.parse(cachedData);
            }
            
            // 从服务器加载最新数据
            await this.fetchUpdateLogsFromServer();
            
        } catch (error) {
            console.error('加载更新日志数据失败:', error);
        }
    }

    /**
     * 从服务器获取更新日志
     */
    async fetchUpdateLogsFromServer() {
        try {
            // 构建API URL
            let apiUrl = '/api/update-logs';
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                apiUrl = window.apiGateway.buildUrl('/api/update-logs');
            } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                apiUrl = window.APP_UTILS.buildApiUrl('/api/update-logs');
            }
            
            // 调用实际的API获取更新日志
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success && result.data) {
                    this.updateLogsData = {
                        logs: result.data
                    };
                } else {
                    // 如果API返回失败，使用模拟数据作为备用
                    this.updateLogsData = {
                        logs: [
                            {
                                id: 1,
                                version: '1.0.0',
                                title: '初始版本发布',
                                description: '星际云盘初始版本发布，包含基础文件管理功能',
                                release_date: '2024-01-01T00:00:00Z',
                                status: 'synced'
                            },
                            {
                                id: 2,
                                version: '1.1.0',
                                title: '新增用户管理功能',
                                description: '新增用户管理、权限控制等功能',
                                release_date: '2024-01-15T00:00:00Z',
                                status: 'synced'
                            }
                        ]
                    };
                }
            } else {
                // 如果网络请求失败，使用模拟数据作为备用
                this.updateLogsData = {
                    logs: [
                        {
                            id: 1,
                            version: '1.0.0',
                            title: '初始版本发布',
                            description: '星际云盘初始版本发布，包含基础文件管理功能',
                            release_date: '2024-01-01T00:00:00Z',
                            status: 'synced'
                        },
                        {
                            id: 2,
                            version: '1.1.0',
                            title: '新增用户管理功能',
                            description: '新增用户管理、权限控制等功能',
                            release_date: '2024-01-15T00:00:00Z',
                            status: 'synced'
                        }
                    ]
                };
            }
            
            // 缓存到本地存储
            localStorage.setItem('updateLogsData', JSON.stringify(this.updateLogsData));
            
        } catch (error) {
            console.error('从服务器获取更新日志失败:', error);
            // 出错时使用模拟数据
            this.updateLogsData = {
                logs: [
                    {
                        id: 1,
                        version: '1.0.0',
                        title: '初始版本发布',
                        description: '星际云盘初始版本发布，包含基础文件管理功能',
                        release_date: '2024-01-01T00:00:00Z',
                        status: 'synced'
                    },
                    {
                        id: 2,
                        version: '1.1.0',
                        title: '新增用户管理功能',
                        description: '新增用户管理、权限控制等功能',
                        release_date: '2024-01-15T00:00:00Z',
                        status: 'synced'
                    }
                ]
            };
            localStorage.setItem('updateLogsData', JSON.stringify(this.updateLogsData));
        }
    }

    /**
     * 加载同步状态
     */
    async loadSyncStatus() {
        try {
            const cachedStatus = localStorage.getItem('updateLogsSyncStatus');
            if (cachedStatus) {
                this.syncStatus = JSON.parse(cachedStatus);
            } else {
                this.syncStatus = {
                    last_sync: null,
                    sync_status: 'pending',
                    pending_changes: 0
                };
            }
        } catch (error) {
            console.error('加载同步状态失败:', error);
        }
    }

    /**
     * 加载统计信息
     */
    async loadStats() {
        try {
            const cachedStats = localStorage.getItem('updateLogsStats');
            if (cachedStats) {
                this.stats = JSON.parse(cachedStats);
            } else {
                this.stats = {
                    total_logs: 0,
                    published_logs: 0,
                    draft_logs: 0,
                    total_views: 0
                };
            }
        } catch (error) {
            console.error('加载统计信息失败:', error);
        }
    }

    /**
     * 设置自动同步
     */
    setupAutoSync() {
        // 清除之前的定时器
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // 设置新的定时器，每5分钟检查一次
        this.syncInterval = setInterval(() => {
            this.checkForUpdates();
        }, 5 * 60 * 1000);
    }

    /**
     * 检查更新
     */
    async checkForUpdates() {
        try {
            // 检查更新日志文件是否有更新
            const hasUpdates = await this.checkUpdateLogsFile();
            
            if (hasUpdates) {
                // 检测到更新日志文件有变化，开始同步
                await this.syncUpdateLogs();
            } else {
                // 更新日志文件未发生变化，跳过同步
            }
        } catch (error) {
            console.error('检查更新失败:', error);
        }
    }

    /**
     * 检查更新日志文件
     */
    async checkUpdateLogsFile() {
        try {
            // 这里应该检查服务器上的更新日志文件
            // 模拟检查逻辑
            return false;
        } catch (error) {
            console.error('检查更新日志文件失败:', error);
            return false;
        }
    }

    /**
     * 同步更新日志
     */
    async syncUpdateLogs() {
        try {
            // 模拟同步过程
            const comparison = {
                newVersions: [],
                updatedVersions: [],
                deletedVersions: []
            };
            
            if (comparison.newVersions.length > 0) {
                // 发现新版本需要同步
                await this.performSync(comparison);
            } else {
                // 更新日志已是最新状态
            }
            
            // 更新同步状态
            this.updateSyncStatus('success');
            
        } catch (error) {
            console.error('同步更新日志失败:', error);
            this.updateSyncStatus('error');
        }
    }

    /**
     * 执行同步
     */
    async performSync(comparison) {
        try {
            // 模拟同步过程
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 更新本地数据
            this.updateLocalData(comparison);
            
            // 更新统计信息
            this.updateStats(comparison);
            
        } catch (error) {
            console.error('执行同步失败:', error);
            throw error;
        }
    }

    /**
     * 更新本地数据
     */
    updateLocalData(comparison) {
        // 更新本地存储的数据
        if (this.updateLogsData) {
            // 添加新版本
            comparison.newVersions.forEach(newVersion => {
                this.updateLogsData.logs.push(newVersion);
            });
            
            // 更新本地存储
            localStorage.setItem('updateLogsData', JSON.stringify(this.updateLogsData));
        }
    }

    /**
     * 更新统计信息
     */
    updateStats(comparison) {
        if (this.stats) {
            this.stats.total_logs += comparison.newVersions.length;
            this.stats.published_logs += comparison.newVersions.length;
            
            // 更新本地存储
            localStorage.setItem('updateLogsStats', JSON.stringify(this.stats));
        }
    }

    /**
     * 更新同步状态
     */
    updateSyncStatus(status) {
        this.syncStatus = {
            last_sync: new Date().toISOString(),
            sync_status: status,
            pending_changes: 0
        };
        
        // 更新本地存储
        localStorage.setItem('updateLogsSyncStatus', JSON.stringify(this.syncStatus));
    }

    /**
     * 手动同步
     */
    async manualSync() {
        try {
            // 手动触发更新日志同步
            await this.syncUpdateLogs();
        } catch (error) {
            console.error('手动同步失败:', error);
        }
    }

    /**
     * 强制同步
     */
    async forceSync() {
        try {
            // 强制同步更新日志
            const comparison = {
                newVersions: [],
                updatedVersions: [],
                deletedVersions: []
            };
            
            if (comparison.newVersions.length > 0) {
                // 发现新版本需要同步
                await this.performSync(comparison);
            } else {
                // 更新日志已是最新状态
            }
            
        } catch (error) {
            console.error('强制同步失败:', error);
        }
    }

    /**
     * 获取前端JSON文件中的更新日志数据
     */
    async getFrontendUpdateLogs() {
        try {
            // 从前端JSON文件获取数据
            const response = await fetch('/static/js/data/update-logs.json');
            
            if (response.ok) {
                const data = await response.json();
                
                const result = {
                    logs: data.logs || [],
                    version: data.version,
                    lastUpdated: data.lastUpdated,
                    checksum: data.checksum
                };
                
                return result;
            } else {
                console.warn('无法加载前端更新日志文件，状态:', response.status);
                return { logs: [] };
            }
        } catch (error) {
            console.error('获取前端更新日志失败:', error);
            return { logs: [] };
        }
    }

    /**
     * 获取后端数据库中的更新日志数据
     */
    async getBackendUpdateLogs() {
        try {
            // 构建API URL
            let apiUrl = '/api/update-logs';
            if (window.apiGateway && typeof window.apiGateway.buildUrl === 'function') {
                apiUrl = window.apiGateway.buildUrl('/api/update-logs');
            } else if (window.APP_UTILS && typeof window.APP_UTILS.buildApiUrl === 'function') {
                apiUrl = window.APP_UTILS.buildApiUrl('/api/update-logs');
            }
            
            const response = await fetch(apiUrl);
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    return { logs: result.data };
                } else {
                    console.warn('后端API返回失败');
                    return { logs: [] };
                }
            } else {
                console.warn('后端API请求失败');
                return { logs: [] };
            }
        } catch (error) {
            console.error('获取后端更新日志失败:', error);
            return { logs: [] };
        }
    }

    /**
     * 获取更新日志数据
     */
    getUpdateLogsData() {
        return this.updateLogsData;
    }

    /**
     * 获取同步状态
     */
    getSyncStatus() {
        return this.syncStatus;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return this.stats;
    }

    /**
     * 验证数据完整性
     */
    validateDataIntegrity() {
        try {
            // 验证数据完整性
            if (!this.updateLogsData || !this.syncStatus || !this.stats) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('验证数据完整性失败:', error);
            return false;
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.updateLogManager = new UpdateLogManager();
}