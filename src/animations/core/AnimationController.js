// 动画控制器 - 管理动画队列和优先级
import gsapManager from './GSAPManager'
import { GSAP_CONFIG } from '../config/gsapConfig'

/**
 * 动画优先级枚举
 */
export const ANIMATION_PRIORITY = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  CRITICAL: 4
}

/**
 * 动画状态枚举
 */
export const ANIMATION_STATE = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}

/**
 * 动画控制器类
 */
class AnimationController {
  constructor() {
    this.queue = []
    this.runningAnimations = new Map()
    this.completedAnimations = new Map()
    this.isProcessing = false
    this.maxRetries = 3
    
    // 性能监控
    this.performanceMetrics = {
      totalAnimations: 0,
      successfulAnimations: 0,
      failedAnimations: 0,
      averageExecutionTime: 0
    }
    
    console.log('🎮 AnimationController initialized')
  }
  
  /**
   * 添加动画到队列
   * @param {Object} animationRequest - 动画请求对象
   * @returns {string} 动画ID
   */
  enqueue(animationRequest) {
    const animationId = this.generateId()
    
    const animation = {
      id: animationId,
      ...animationRequest,
      priority: animationRequest.priority || ANIMATION_PRIORITY.NORMAL,
      state: ANIMATION_STATE.PENDING,
      createdAt: Date.now(),
      retries: 0,
      startTime: null,
      endTime: null
    }
    
    // 验证动画请求
    if (!this.validateAnimationRequest(animation)) {
      console.error('❌ Invalid animation request:', animation)
      return null
    }
    
    // 插入到队列中（按优先级排序）
    this.insertByPriority(animation)
    
    console.log(`📋 Animation '${animationId}' enqueued with priority ${animation.priority}`)
    
    // 如果没有在处理队列，开始处理
    if (!this.isProcessing) {
      this.processQueue()
    }
    
    return animationId
  }
  
  /**
   * 按优先级插入动画到队列
   * @param {Object} animation - 动画对象
   */
  insertByPriority(animation) {
    let inserted = false
    
    for (let i = 0; i < this.queue.length; i++) {
      if (animation.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, animation)
        inserted = true
        break
      }
    }
    
    if (!inserted) {
      this.queue.push(animation)
    }
  }
  
  /**
   * 处理动画队列
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }
    
    this.isProcessing = true
    console.log(`🔄 Processing animation queue (${this.queue.length} items)`)
    
    while (this.queue.length > 0) {
      const animation = this.queue.shift()
      
      try {
        await this.executeAnimation(animation)
      } catch (error) {
        console.error(`❌ Error processing animation '${animation.id}':`, error)
        await this.handleAnimationError(animation, error)
      }
    }
    
    this.isProcessing = false
    console.log('✅ Animation queue processing completed')
  }
  
  /**
   * 执行单个动画
   * @param {Object} animation - 动画对象
   */
  async executeAnimation(animation) {
    animation.state = ANIMATION_STATE.RUNNING
    animation.startTime = Date.now()
    
    this.runningAnimations.set(animation.id, animation)
    
    console.log(`▶️ Executing animation '${animation.id}'`)
    
    try {
      // 检查目标元素是否存在
      const target = this.resolveTarget(animation.target)
      if (!target) {
        throw new Error(`Target element not found: ${animation.target}`)
      }
      
      // 执行动画
      await gsapManager.play(animation.animationId, target, animation.options)
      
      // 动画成功完成
      animation.state = ANIMATION_STATE.COMPLETED
      animation.endTime = Date.now()
      
      this.runningAnimations.delete(animation.id)
      this.completedAnimations.set(animation.id, animation)
      
      // 更新性能指标
      this.updatePerformanceMetrics(animation, true)
      
      console.log(`✅ Animation '${animation.id}' completed successfully`)
      
      // 执行成功回调
      if (animation.onComplete) {
        animation.onComplete(animation)
      }
      
    } catch (error) {
      throw error
    }
  }
  
  /**
   * 处理动画错误
   * @param {Object} animation - 动画对象
   * @param {Error} error - 错误对象
   */
  async handleAnimationError(animation, error) {
    animation.retries++
    
    console.error(`❌ Animation '${animation.id}' failed (attempt ${animation.retries}):`, error)
    
    if (animation.retries < this.maxRetries) {
      // 重试动画
      console.log(`🔄 Retrying animation '${animation.id}' (${animation.retries}/${this.maxRetries})`)
      
      // 添加延迟后重试
      setTimeout(() => {
        animation.state = ANIMATION_STATE.PENDING
        this.insertByPriority(animation)
      }, 1000 * animation.retries) // 递增延迟
      
    } else {
      // 达到最大重试次数，标记为失败
      animation.state = ANIMATION_STATE.FAILED
      animation.endTime = Date.now()
      animation.error = error
      
      this.runningAnimations.delete(animation.id)
      this.completedAnimations.set(animation.id, animation)
      
      // 更新性能指标
      this.updatePerformanceMetrics(animation, false)
      
      console.error(`💥 Animation '${animation.id}' failed permanently after ${this.maxRetries} retries`)
      
      // 执行错误回调
      if (animation.onError) {
        animation.onError(animation, error)
      }
    }
  }
  
  /**
   * 取消动画
   * @param {string} animationId - 动画ID
   * @returns {boolean} 是否成功取消
   */
  cancel(animationId) {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(anim => anim.id === animationId)
    if (queueIndex !== -1) {
      const animation = this.queue.splice(queueIndex, 1)[0]
      animation.state = ANIMATION_STATE.CANCELLED
      this.completedAnimations.set(animationId, animation)
      console.log(`🚫 Animation '${animationId}' cancelled from queue`)
      return true
    }
    
    // 停止正在运行的动画
    const runningAnimation = this.runningAnimations.get(animationId)
    if (runningAnimation) {
      gsapManager.stop(runningAnimation.animationId)
      runningAnimation.state = ANIMATION_STATE.CANCELLED
      runningAnimation.endTime = Date.now()
      
      this.runningAnimations.delete(animationId)
      this.completedAnimations.set(animationId, runningAnimation)
      
      console.log(`🚫 Running animation '${animationId}' cancelled`)
      return true
    }
    
    console.warn(`⚠️ Animation '${animationId}' not found for cancellation`)
    return false
  }
  
  /**
   * 获取动画状态
   * @param {string} animationId - 动画ID
   * @returns {Object|null} 动画状态信息
   */
  getAnimationStatus(animationId) {
    // 检查队列中的动画
    const queuedAnimation = this.queue.find(anim => anim.id === animationId)
    if (queuedAnimation) {
      return {
        id: animationId,
        state: queuedAnimation.state,
        priority: queuedAnimation.priority,
        queuePosition: this.queue.indexOf(queuedAnimation) + 1
      }
    }
    
    // 检查正在运行的动画
    const runningAnimation = this.runningAnimations.get(animationId)
    if (runningAnimation) {
      return {
        id: animationId,
        state: runningAnimation.state,
        priority: runningAnimation.priority,
        startTime: runningAnimation.startTime,
        duration: Date.now() - runningAnimation.startTime
      }
    }
    
    // 检查已完成的动画
    const completedAnimation = this.completedAnimations.get(animationId)
    if (completedAnimation) {
      return {
        id: animationId,
        state: completedAnimation.state,
        priority: completedAnimation.priority,
        startTime: completedAnimation.startTime,
        endTime: completedAnimation.endTime,
        duration: completedAnimation.endTime - completedAnimation.startTime,
        retries: completedAnimation.retries,
        error: completedAnimation.error
      }
    }
    
    return null
  }
  
  /**
   * 清空队列
   * @param {number} priority - 可选，只清空指定优先级的动画
   */
  clearQueue(priority = null) {
    if (priority !== null) {
      this.queue = this.queue.filter(anim => anim.priority !== priority)
      console.log(`🗑️ Cleared queue for priority ${priority}`)
    } else {
      this.queue = []
      console.log('🗑️ Cleared entire animation queue')
    }
  }
  
  /**
   * 暂停所有动画
   */
  pauseAll() {
    gsapManager.pauseAll()
    console.log('⏸️ All animations paused via controller')
  }
  
  /**
   * 恢复所有动画
   */
  resumeAll() {
    gsapManager.resumeAll()
    console.log('▶️ All animations resumed via controller')
  }
  
  /**
   * 获取控制器状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      runningAnimations: this.runningAnimations.size,
      completedAnimations: this.completedAnimations.size,
      isProcessing: this.isProcessing,
      performanceMetrics: { ...this.performanceMetrics }
    }
  }
  
  /**
   * 验证动画请求
   * @param {Object} animation - 动画对象
   * @returns {boolean} 是否有效
   */
  validateAnimationRequest(animation) {
    if (!animation.animationId || !animation.target) {
      return false
    }
    
    if (!Object.values(ANIMATION_PRIORITY).includes(animation.priority)) {
      return false
    }
    
    return true
  }
  
  /**
   * 解析目标元素
   * @param {string|Element} target - 目标选择器或元素
   * @returns {Element|null} DOM元素
   */
  resolveTarget(target) {
    if (typeof target === 'string') {
      return document.querySelector(target)
    } else if (target instanceof Element) {
      return target
    }
    return null
  }
  
  /**
   * 更新性能指标
   * @param {Object} animation - 动画对象
   * @param {boolean} success - 是否成功
   */
  updatePerformanceMetrics(animation, success) {
    this.performanceMetrics.totalAnimations++
    
    if (success) {
      this.performanceMetrics.successfulAnimations++
    } else {
      this.performanceMetrics.failedAnimations++
    }
    
    // 计算平均执行时间
    if (animation.startTime && animation.endTime) {
      const executionTime = animation.endTime - animation.startTime
      const total = this.performanceMetrics.totalAnimations
      const current = this.performanceMetrics.averageExecutionTime
      
      this.performanceMetrics.averageExecutionTime = 
        (current * (total - 1) + executionTime) / total
    }
  }
  
  /**
   * 生成唯一ID
   * @returns {string} 唯一标识符
   */
  generateId() {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 清理已完成的动画记录
   * @param {number} maxAge - 最大保留时间（毫秒）
   */
  cleanup(maxAge = 10 * 60 * 1000) { // 默认10分钟
    const now = Date.now()
    const toDelete = []
    
    this.completedAnimations.forEach((animation, id) => {
      if (now - animation.endTime > maxAge) {
        toDelete.push(id)
      }
    })
    
    toDelete.forEach(id => {
      this.completedAnimations.delete(id)
    })
    
    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} completed animation records`)
    }
  }
}

// 创建单例实例
const animationController = new AnimationController()

// 定期清理已完成的动画记录
setInterval(() => {
  animationController.cleanup()
}, 5 * 60 * 1000) // 每5分钟清理一次

export default animationController
export { AnimationController, ANIMATION_PRIORITY, ANIMATION_STATE }