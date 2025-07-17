// AnimationResourceManager.js - 动画资源管理器
import { gsap } from 'gsap'
import performanceMonitor from './PerformanceMonitor'

/**
 * 动画资源管理器
 * 负责动画资源的懒加载、缓存、复用和清理
 */
class AnimationResourceManager {
  constructor() {
    this.isInitialized = false
    this.resourceCache = new Map()
    this.animationPool = new Map()
    this.loadingPromises = new Map()
    this.usageStats = new Map()
    this.cleanupQueue = []
    this.maxCacheSize = 50
    this.maxPoolSize = 20
    this.cleanupInterval = null
    this.lastCleanup = Date.now()
    this.cleanupThreshold = 5 * 60 * 1000 // 5分钟
    
    // 资源类型定义
    this.resourceTypes = {
      ANIMATION_PRESET: 'animation_preset',
      TIMELINE: 'timeline',
      TWEEN: 'tween',
      PLUGIN: 'plugin',
      TEXTURE: 'texture'
    }
    
    // 优先级定义
    this.priorities = {
      CRITICAL: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4
    }
  }
  
  /**
   * 初始化资源管理器
   */
  initialize() {
    if (this.isInitialized) return
    
    try {
      // 启动定期清理
      this.startPeriodicCleanup()
      
      // 监听内存压力
      this.setupMemoryPressureHandling()
      
      // 预加载关键资源
      this.preloadCriticalResources()
      
      this.isInitialized = true
      console.log('Animation resource manager initialized')
    } catch (error) {
      console.error('Failed to initialize animation resource manager:', error)
    }
  }
  
  /**
   * 懒加载动画资源
   */
  async loadResource(resourceId, resourceType, loader, options = {}) {
    const {
      priority = this.priorities.MEDIUM,
      cache = true,
      timeout = 10000
    } = options
    
    // 检查缓存
    if (this.resourceCache.has(resourceId)) {
      const cached = this.resourceCache.get(resourceId)
      this.updateUsageStats(resourceId)
      return cached.data
    }
    
    // 检查是否正在加载
    if (this.loadingPromises.has(resourceId)) {
      return this.loadingPromises.get(resourceId)
    }
    
    // 创建加载Promise
    const loadingPromise = this.createLoadingPromise(
      resourceId, 
      resourceType, 
      loader, 
      { priority, cache, timeout }
    )
    
    this.loadingPromises.set(resourceId, loadingPromise)
    
    try {
      const result = await loadingPromise
      this.loadingPromises.delete(resourceId)
      return result
    } catch (error) {
      this.loadingPromises.delete(resourceId)
      throw error
    }
  }
  
  /**
   * 创建加载Promise
   */
  async createLoadingPromise(resourceId, resourceType, loader, options) {
    const { priority, cache, timeout } = options
    
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Resource loading timeout: ${resourceId}`))
      }, timeout)
      
      try {
        // 执行加载器
        const data = await loader()
        
        // 缓存资源
        if (cache) {
          this.cacheResource(resourceId, resourceType, data, priority)
        }
        
        // 更新使用统计
        this.updateUsageStats(resourceId)
        
        clearTimeout(timeoutId)
        resolve(data)
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }
  
  /**
   * 缓存资源
   */
  cacheResource(resourceId, resourceType, data, priority) {
    // 检查缓存大小限制
    if (this.resourceCache.size >= this.maxCacheSize) {
      this.evictLeastUsedResource()
    }
    
    const cacheEntry = {
      id: resourceId,
      type: resourceType,
      data,
      priority,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
      size: this.estimateResourceSize(data)
    }
    
    this.resourceCache.set(resourceId, cacheEntry)
    
    // 初始化使用统计
    if (!this.usageStats.has(resourceId)) {
      this.usageStats.set(resourceId, {
        totalUses: 0,
        lastUsed: Date.now(),
        avgInterval: 0
      })
    }
  }
  
  /**
   * 估算资源大小
   */
  estimateResourceSize(data) {
    try {
      if (typeof data === 'string') {
        return data.length * 2 // Unicode字符
      }
      
      if (data instanceof HTMLElement) {
        return 1000 // 估算DOM元素大小
      }
      
      if (data && typeof data === 'object') {
        return JSON.stringify(data).length * 2
      }
      
      return 100 // 默认大小
    } catch (error) {
      return 100
    }
  }
  
  /**
   * 淘汰最少使用的资源
   */
  evictLeastUsedResource() {
    let leastUsed = null
    let minScore = Infinity
    
    for (const [id, entry] of this.resourceCache.entries()) {
      // 计算使用分数（优先级 + 使用频率 + 时间因子）
      const timeFactor = (Date.now() - entry.lastUsed) / (1000 * 60) // 分钟
      const usageFactor = entry.useCount > 0 ? 1 / entry.useCount : 1
      const priorityFactor = entry.priority
      
      const score = priorityFactor + usageFactor + timeFactor * 0.1
      
      if (score < minScore && entry.priority !== this.priorities.CRITICAL) {
        minScore = score
        leastUsed = id
      }
    }
    
    if (leastUsed) {
      this.removeResource(leastUsed)
    }
  }
  
  /**
   * 移除资源
   */
  removeResource(resourceId) {
    const entry = this.resourceCache.get(resourceId)
    if (entry) {
      // 清理资源数据
      this.cleanupResourceData(entry.data, entry.type)
      
      // 从缓存中移除
      this.resourceCache.delete(resourceId)
      
      console.log(`Resource evicted: ${resourceId}`)
    }
  }
  
  /**
   * 清理资源数据
   */
  cleanupResourceData(data, type) {
    try {
      switch (type) {
        case this.resourceTypes.TIMELINE:
          if (data && typeof data.kill === 'function') {
            data.kill()
          }
          break
          
        case this.resourceTypes.TWEEN:
          if (data && typeof data.kill === 'function') {
            data.kill()
          }
          break
          
        case this.resourceTypes.TEXTURE:
          if (data && typeof data.dispose === 'function') {
            data.dispose()
          }
          break
          
        default:
          // 通用清理
          if (data && typeof data.destroy === 'function') {
            data.destroy()
          }
      }
    } catch (error) {
      console.warn('Error cleaning up resource data:', error)
    }
  }
  
  /**
   * 更新使用统计
   */
  updateUsageStats(resourceId) {
    const cached = this.resourceCache.get(resourceId)
    if (cached) {
      cached.lastUsed = Date.now()
      cached.useCount++
    }
    
    const stats = this.usageStats.get(resourceId)
    if (stats) {
      const now = Date.now()
      const interval = now - stats.lastUsed
      
      stats.totalUses++
      stats.avgInterval = (stats.avgInterval * (stats.totalUses - 1) + interval) / stats.totalUses
      stats.lastUsed = now
    }
  }
  
  /**
   * 获取动画实例（对象池）
   */
  getAnimationInstance(type, config = {}) {
    const poolKey = `${type}_${JSON.stringify(config)}`
    
    if (!this.animationPool.has(poolKey)) {
      this.animationPool.set(poolKey, [])
    }
    
    const pool = this.animationPool.get(poolKey)
    
    // 从池中获取可用实例
    let instance = pool.find(item => !item.inUse)
    
    if (!instance) {
      // 创建新实例
      instance = this.createAnimationInstance(type, config)
      
      if (pool.length < this.maxPoolSize) {
        pool.push(instance)
      }
    }
    
    if (instance) {
      instance.inUse = true
      instance.lastUsed = Date.now()
    }
    
    return instance
  }
  
  /**
   * 创建动画实例
   */
  createAnimationInstance(type, config) {
    try {
      switch (type) {
        case 'timeline':
          return {
            instance: gsap.timeline(config),
            inUse: false,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            type: 'timeline'
          }
          
        case 'tween':
          return {
            instance: gsap.to({}, { duration: 0, ...config }),
            inUse: false,
            createdAt: Date.now(),
            lastUsed: Date.now(),
            type: 'tween'
          }
          
        default:
          throw new Error(`Unknown animation type: ${type}`)
      }
    } catch (error) {
      console.error('Error creating animation instance:', error)
      return null
    }
  }
  
  /**
   * 释放动画实例
   */
  releaseAnimationInstance(instance) {
    if (instance && typeof instance === 'object') {
      instance.inUse = false
      
      // 重置实例状态
      if (instance.instance && typeof instance.instance.clear === 'function') {
        instance.instance.clear()
      }
      
      // 添加到清理队列（延迟清理）
      this.cleanupQueue.push({
        instance,
        timestamp: Date.now()
      })
    }
  }
  
  /**
   * 预加载关键资源
   */
  async preloadCriticalResources() {
    const criticalResources = [
      {
        id: 'page_transitions',
        type: this.resourceTypes.ANIMATION_PRESET,
        loader: () => import('../presets/pageAnimations.js')
      },
      {
        id: 'component_animations',
        type: this.resourceTypes.ANIMATION_PRESET,
        loader: () => import('../presets/componentAnimations.js')
      }
    ]
    
    const loadPromises = criticalResources.map(resource =>
      this.loadResource(resource.id, resource.type, resource.loader, {
        priority: this.priorities.CRITICAL,
        cache: true
      }).catch(error => {
        console.warn(`Failed to preload critical resource ${resource.id}:`, error)
      })
    )
    
    await Promise.allSettled(loadPromises)
    console.log('Critical resources preloaded')
  }
  
  /**
   * 启动定期清理
   */
  startPeriodicCleanup() {
    if (this.cleanupInterval) return
    
    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, 60000) // 每分钟清理一次
  }
  
  /**
   * 停止定期清理
   */
  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
  
  /**
   * 执行清理
   */
  performCleanup() {
    const now = Date.now()
    
    // 清理过期的动画实例
    this.cleanupQueue = this.cleanupQueue.filter(item => {
      if (now - item.timestamp > this.cleanupThreshold) {
        this.cleanupAnimationInstance(item.instance)
        return false
      }
      return true
    })
    
    // 清理长时间未使用的缓存资源
    for (const [id, entry] of this.resourceCache.entries()) {
      if (entry.priority !== this.priorities.CRITICAL &&
          now - entry.lastUsed > this.cleanupThreshold * 2) {
        this.removeResource(id)
      }
    }
    
    // 清理动画池中的过期实例
    for (const [poolKey, pool] of this.animationPool.entries()) {
      const activeInstances = pool.filter(instance => {
        if (!instance.inUse && now - instance.lastUsed > this.cleanupThreshold) {
          this.cleanupAnimationInstance(instance)
          return false
        }
        return true
      })
      
      if (activeInstances.length === 0) {
        this.animationPool.delete(poolKey)
      } else {
        this.animationPool.set(poolKey, activeInstances)
      }
    }
    
    this.lastCleanup = now
    
    // 记录清理统计
    console.log(`Resource cleanup completed. Cache: ${this.resourceCache.size}, Pools: ${this.animationPool.size}`)
  }
  
  /**
   * 清理动画实例
   */
  cleanupAnimationInstance(instance) {
    try {
      if (instance && instance.instance) {
        if (typeof instance.instance.kill === 'function') {
          instance.instance.kill()
        }
        if (typeof instance.instance.clear === 'function') {
          instance.instance.clear()
        }
      }
    } catch (error) {
      console.warn('Error cleaning up animation instance:', error)
    }
  }
  
  /**
   * 设置内存压力处理
   */
  setupMemoryPressureHandling() {
    // 监听内存压力事件（如果支持）
    if ('memory' in performance) {
      const checkMemoryPressure = () => {
        const memInfo = performance.memory
        const usedRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
        
        if (usedRatio > 0.8) {
          console.warn('High memory usage detected, performing aggressive cleanup')
          this.performAggressiveCleanup()
        }
      }
      
      // 定期检查内存使用
      setInterval(checkMemoryPressure, 30000) // 每30秒检查一次
    }
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时执行清理
        setTimeout(() => {
          if (document.hidden) {
            this.performAggressiveCleanup()
          }
        }, 5000) // 5秒后清理
      }
    })
  }
  
  /**
   * 执行激进清理
   */
  performAggressiveCleanup() {
    // 清理所有非关键缓存资源
    for (const [id, entry] of this.resourceCache.entries()) {
      if (entry.priority !== this.priorities.CRITICAL) {
        this.removeResource(id)
      }
    }
    
    // 清理所有未使用的动画实例
    for (const [poolKey, pool] of this.animationPool.entries()) {
      const activeInstances = pool.filter(instance => instance.inUse)
      
      // 清理未使用的实例
      pool.forEach(instance => {
        if (!instance.inUse) {
          this.cleanupAnimationInstance(instance)
        }
      })
      
      if (activeInstances.length === 0) {
        this.animationPool.delete(poolKey)
      } else {
        this.animationPool.set(poolKey, activeInstances)
      }
    }
    
    // 清理所有待清理的实例
    this.cleanupQueue.forEach(item => {
      this.cleanupAnimationInstance(item.instance)
    })
    this.cleanupQueue = []
    
    // 强制垃圾回收（如果支持）
    if (window.gc) {
      window.gc()
    }
    
    console.log('Aggressive cleanup completed')
  }
  
  /**
   * 获取资源统计信息
   */
  getResourceStats() {
    const cacheStats = {
      size: this.resourceCache.size,
      maxSize: this.maxCacheSize,
      totalSize: 0,
      byType: {},
      byPriority: {}
    }
    
    for (const [id, entry] of this.resourceCache.entries()) {
      cacheStats.totalSize += entry.size
      
      if (!cacheStats.byType[entry.type]) {
        cacheStats.byType[entry.type] = 0
      }
      cacheStats.byType[entry.type]++
      
      if (!cacheStats.byPriority[entry.priority]) {
        cacheStats.byPriority[entry.priority] = 0
      }
      cacheStats.byPriority[entry.priority]++
    }
    
    const poolStats = {
      totalPools: this.animationPool.size,
      totalInstances: 0,
      activeInstances: 0
    }
    
    for (const pool of this.animationPool.values()) {
      poolStats.totalInstances += pool.length
      poolStats.activeInstances += pool.filter(instance => instance.inUse).length
    }
    
    return {
      cache: cacheStats,
      pools: poolStats,
      cleanup: {
        queueSize: this.cleanupQueue.length,
        lastCleanup: this.lastCleanup
      },
      memory: performanceMonitor.getMemoryUsage()
    }
  }
  
  /**
   * 清理所有资源
   */
  cleanup() {
    // 停止定期清理
    this.stopPeriodicCleanup()
    
    // 清理所有缓存资源
    for (const [id, entry] of this.resourceCache.entries()) {
      this.cleanupResourceData(entry.data, entry.type)
    }
    this.resourceCache.clear()
    
    // 清理所有动画池
    for (const pool of this.animationPool.values()) {
      pool.forEach(instance => {
        this.cleanupAnimationInstance(instance)
      })
    }
    this.animationPool.clear()
    
    // 清理待清理队列
    this.cleanupQueue.forEach(item => {
      this.cleanupAnimationInstance(item.instance)
    })
    this.cleanupQueue = []
    
    // 清理加载Promise
    this.loadingPromises.clear()
    
    // 清理使用统计
    this.usageStats.clear()
    
    this.isInitialized = false
    console.log('Animation resource manager cleaned up')
  }
}

// 创建单例实例
const animationResourceManager = new AnimationResourceManager()

export default animationResourceManager