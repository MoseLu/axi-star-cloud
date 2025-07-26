/**
 * 异步处理工作器
 *
 * 提供异步任务处理能力，包括：
 * - 文件上传异步处理
 * - 邮件发送异步队列
 * - 日志异步写入
 * - 任务队列管理
 * - 工作器池管理
 *
 * 该模块提供高性能的异步处理解决方案
 */

package async

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

// Task 任务接口
type Task interface {
	Execute() error
	GetID() string
	GetPriority() int
	GetRetryCount() int
	IncrementRetryCount()
}

// BaseTask 基础任务实现
type BaseTask struct {
	ID          string
	Priority    int
	RetryCount  int
	MaxRetries  int
	CreatedAt   time.Time
	ExecuteFunc func() error
}

// NewBaseTask 创建基础任务
func NewBaseTask(id string, priority int, maxRetries int, executeFunc func() error) *BaseTask {
	return &BaseTask{
		ID:          id,
		Priority:    priority,
		MaxRetries:  maxRetries,
		CreatedAt:   time.Now(),
		ExecuteFunc: executeFunc,
	}
}

// Execute 执行任务
func (t *BaseTask) Execute() error {
	return t.ExecuteFunc()
}

// GetID 获取任务ID
func (t *BaseTask) GetID() string {
	return t.ID
}

// GetPriority 获取任务优先级
func (t *BaseTask) GetPriority() int {
	return t.Priority
}

// GetRetryCount 获取重试次数
func (t *BaseTask) GetRetryCount() int {
	return t.RetryCount
}

// IncrementRetryCount 增加重试次数
func (t *BaseTask) IncrementRetryCount() {
	t.RetryCount++
}

// Worker 工作器
type Worker struct {
	id       int
	taskChan chan Task
	quit     chan bool
	wg       *sync.WaitGroup
}

// NewWorker 创建新工作器
func NewWorker(id int, taskChan chan Task, wg *sync.WaitGroup) *Worker {
	return &Worker{
		id:       id,
		taskChan: taskChan,
		quit:     make(chan bool),
		wg:       wg,
	}
}

// Start 启动工作器
func (w *Worker) Start() {
	w.wg.Add(1)
	go func() {
		defer w.wg.Done()
		for {
			select {
			case task := <-w.taskChan:
				if task == nil {
					return
				}
				w.processTask(task)
			case <-w.quit:
				return
			}
		}
	}()
}

// Stop 停止工作器
func (w *Worker) Stop() {
	close(w.quit)
}

// processTask 处理任务
func (w *Worker) processTask(task Task) {
	log.Printf("工作器 %d 开始处理任务: %s", w.id, task.GetID())

	start := time.Now()
	err := task.Execute()
	duration := time.Since(start)

	if err != nil {
		log.Printf("工作器 %d 任务 %s 执行失败: %v (耗时: %v)", w.id, task.GetID(), err, duration)

		// 如果任务还有重试次数，重新加入队列
		if task.GetRetryCount() < task.GetRetryCount() {
			task.IncrementRetryCount()
			// 延迟重试
			time.Sleep(time.Duration(task.GetRetryCount()) * time.Second)
			select {
			case w.taskChan <- task:
				log.Printf("工作器 %d 重新加入任务 %s 到队列", w.id, task.GetID())
			default:
				log.Printf("工作器 %d 任务队列已满，丢弃任务 %s", w.id, task.GetID())
			}
		} else {
			log.Printf("工作器 %d 任务 %s 达到最大重试次数，丢弃任务", w.id, task.GetID())
		}
	} else {
		log.Printf("工作器 %d 任务 %s 执行成功 (耗时: %v)", w.id, task.GetID(), duration)
	}
}

// WorkerPool 工作器池
type WorkerPool struct {
	workers    []*Worker
	taskChan   chan Task
	wg         sync.WaitGroup
	ctx        context.Context
	cancel     context.CancelFunc
	workerSize int
}

// NewWorkerPool 创建工作器池
func NewWorkerPool(workerSize int, queueSize int) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())

	pool := &WorkerPool{
		taskChan:   make(chan Task, queueSize),
		ctx:        ctx,
		cancel:     cancel,
		workerSize: workerSize,
	}

	// 创建工作器
	for i := 0; i < workerSize; i++ {
		worker := NewWorker(i, pool.taskChan, &pool.wg)
		pool.workers = append(pool.workers, worker)
	}

	return pool
}

// Start 启动工作器池
func (wp *WorkerPool) Start() {
	log.Printf("启动工作器池，工作器数量: %d", wp.workerSize)

	for _, worker := range wp.workers {
		worker.Start()
	}
}

// Stop 停止工作器池
func (wp *WorkerPool) Stop() {
	log.Printf("停止工作器池")

	// 取消上下文
	wp.cancel()

	// 关闭任务通道
	close(wp.taskChan)

	// 停止所有工作器
	for _, worker := range wp.workers {
		worker.Stop()
	}

	// 等待所有工作器完成
	wp.wg.Wait()
	log.Printf("工作器池已停止")
}

// Submit 提交任务
func (wp *WorkerPool) Submit(task Task) error {
	select {
	case wp.taskChan <- task:
		log.Printf("任务 %s 已提交到工作器池", task.GetID())
		return nil
	case <-wp.ctx.Done():
		return fmt.Errorf("工作器池已关闭")
	default:
		return fmt.Errorf("任务队列已满")
	}
}

// GetStats 获取工作器池统计信息
func (wp *WorkerPool) GetStats() map[string]interface{} {
	return map[string]interface{}{
		"worker_count":     wp.workerSize,
		"queue_size":       cap(wp.taskChan),
		"queue_length":     len(wp.taskChan),
		"active_workers":   len(wp.workers),
		"context_canceled": wp.ctx.Err() != nil,
	}
}

// TaskManager 任务管理器
type TaskManager struct {
	workerPool *WorkerPool
	tasks      map[string]Task
	mutex      sync.RWMutex
}

// NewTaskManager 创建任务管理器
func NewTaskManager(workerSize int, queueSize int) *TaskManager {
	return &TaskManager{
		workerPool: NewWorkerPool(workerSize, queueSize),
		tasks:      make(map[string]Task),
	}
}

// Start 启动任务管理器
func (tm *TaskManager) Start() {
	tm.workerPool.Start()
}

// Stop 停止任务管理器
func (tm *TaskManager) Stop() {
	tm.workerPool.Stop()
}

// SubmitTask 提交任务
func (tm *TaskManager) SubmitTask(task Task) error {
	tm.mutex.Lock()
	tm.tasks[task.GetID()] = task
	tm.mutex.Unlock()

	return tm.workerPool.Submit(task)
}

// GetTask 获取任务
func (tm *TaskManager) GetTask(taskID string) (Task, bool) {
	tm.mutex.RLock()
	defer tm.mutex.RUnlock()

	task, exists := tm.tasks[taskID]
	return task, exists
}

// RemoveTask 移除任务
func (tm *TaskManager) RemoveTask(taskID string) {
	tm.mutex.Lock()
	defer tm.mutex.Unlock()

	delete(tm.tasks, taskID)
}

// GetStats 获取统计信息
func (tm *TaskManager) GetStats() map[string]interface{} {
	tm.mutex.RLock()
	defer tm.mutex.RUnlock()

	stats := tm.workerPool.GetStats()
	stats["total_tasks"] = len(tm.tasks)

	return stats
}
