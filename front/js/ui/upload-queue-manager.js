/**
 * 前端上传队列管理器
 * 负责与后端上传队列API交互，管理上传任务状态
 */
class UploadQueueManager {
    constructor() {
        this.tasks = new Map();
        this.pollingInterval = null;
        // 使用API网关的baseUrl，确保环境切换时能正确更新
        this.updateBaseUrl();
    }

    // 更新baseUrl（用于环境切换）
    updateBaseUrl() {
        if (window.apiGateway && window.apiGateway.baseUrl) {
            this.baseUrl = window.apiGateway.baseUrl;
        } else if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
            this.baseUrl = window.APP_CONFIG.API_BASE_URL;
        } else {
            this.baseUrl = '/api';
        }
    }

    /**
     * 创建上传任务
     * @param {string} userID - 用户ID
     * @param {string} fileName - 文件名
     * @param {number} fileSize - 文件大小
     * @returns {string} 任务ID
     */
    async createTask(userID, fileName, fileSize) {
        try {
            const taskID = `${userID}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // 创建本地任务记录
            const task = {
                id: taskID,
                user_id: userID,
                file_name: fileName,
                file_size: fileSize,
                progress: 0,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date()
            };

                    this.tasks.set(taskID, task);
            
            return taskID;
        } catch (error) {
            console.error('创建上传任务失败:', error);
            throw error;
        }
    }

    /**
     * 更新任务进度
     * @param {string} taskID - 任务ID
     * @param {number} progress - 进度百分比
     */
    updateTaskProgress(taskID, progress) {
        const task = this.tasks.get(taskID);
        if (task) {
            task.progress = progress;
            task.updated_at = new Date();
        }
    }

    /**
     * 更新任务状态
     * @param {string} taskID - 任务ID
     * @param {string} status - 状态
     * @param {string} error - 错误信息（可选）
     */
    updateTaskStatus(taskID, status, error = null) {
        const task = this.tasks.get(taskID);
        if (task) {
            task.status = status;
            task.updated_at = new Date();
            if (error) {
                task.error = error;
            }
        }
    }

    /**
     * 获取任务信息
     * @param {string} taskID - 任务ID
     * @returns {Object|null} 任务信息
     */
    getTask(taskID) {
        return this.tasks.get(taskID);
    }

    /**
     * 获取用户的所有任务
     * @param {string} userID - 用户ID
     * @returns {Array} 任务列表
     */
    getUserTasks(userID) {
        const userTasks = [];
        for (const task of this.tasks.values()) {
            if (task.user_id === userID) {
                userTasks.push(task);
            }
        }
        return userTasks;
    }

    /**
     * 获取活跃任务（pending或uploading状态）
     * @param {string} userID - 用户ID
     * @returns {Array} 活跃任务列表
     */
    getActiveTasks(userID) {
        return this.getUserTasks(userID).filter(task => 
            task.status === 'pending' || task.status === 'uploading'
        );
    }

    /**
     * 取消任务
     * @param {string} taskID - 任务ID
     */
    async cancelTask(taskID) {
        try {
            const response = await fetch(`${this.baseUrl}/upload/task/${taskID}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.updateTaskStatus(taskID, 'cancelled');
            } else {
                console.error('取消任务失败:', response.statusText);
            }
        } catch (error) {
            console.error('取消任务请求失败:', error);
        }
    }

    /**
     * 从后端同步任务状态
     * @param {string} userID - 用户ID
     */
    async syncTasksFromServer(userID) {
        try {
            const response = await fetch(`${this.baseUrl}/upload/tasks?user_id=${userID}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.tasks) {
                    // 更新本地任务状态
                    data.tasks.forEach(serverTask => {
                        const localTask = this.tasks.get(serverTask.id);
                        if (localTask) {
                            localTask.progress = serverTask.progress;
                            localTask.status = serverTask.status;
                            localTask.updated_at = new Date(serverTask.updated_at);
                            if (serverTask.error) {
                                localTask.error = serverTask.error;
                            }
                        }
                    });
                }
            } else if (response.status === 404) {
                // 如果API不存在，停止轮询
                this.stopPolling();
            }
        } catch (error) {
            console.error('同步任务状态失败:', error);
            // 网络错误时也停止轮询
            this.stopPolling();
        }
    }

    /**
     * 开始轮询任务状态（暂时禁用）
     * @param {string} userID - 用户ID
     * @param {number} interval - 轮询间隔（毫秒）
     */
    startPolling(userID, interval = 2000) {
        // 暂时禁用轮询，避免重复请求
        return;
        
        this.stopPolling();
        
        this.pollingInterval = setInterval(async () => {
            await this.syncTasksFromServer(userID);
        }, interval);
    }

    /**
     * 停止轮询
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * 清理完成的任务
     * @param {number} maxAge - 最大保留时间（毫秒）
     */
    cleanupCompletedTasks(maxAge = 60000) { // 默认1分钟
        const cutoff = Date.now() - maxAge;
        for (const [taskID, task] of this.tasks.entries()) {
            if ((task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') &&
                task.updated_at.getTime() < cutoff) {
                this.tasks.delete(taskID);
            }
        }
    }

    /**
     * 获取队列统计信息
     * @returns {Object} 统计信息
     */
    getQueueStats() {
        const stats = {
            total: 0,
            pending: 0,
            uploading: 0,
            completed: 0,
            failed: 0,
            cancelled: 0
        };

        for (const task of this.tasks.values()) {
            stats.total++;
            stats[task.status]++;
        }

        return stats;
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.stopPolling();
        this.tasks.clear();
    }
}

// 导出到全局
window.UploadQueueManager = UploadQueueManager; 