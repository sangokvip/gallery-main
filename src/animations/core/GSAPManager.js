// GSAP动画管理器
import { gsap } from 'gsap'
import { GSAP_CONFIG } from '../config/gsapConfig'

/**
 * GSAP动画管理器 - 统一管理所有动画实例
 */
class GSAPManager {
  constructor() {
    this.timelines = new Map()
    this.animations = new Map()
    this.activeAnimations = 0
    this.maxConcurrentAnimations = GSAP_CONFIG.performance.maxConcurrentAnimations
    this.config = GSAP_CONFIG
    
    // 绑定方法
    this.cleanup = this.cleanup.bind(this)
    this.pauseAll = this.pauseAll.bind(this)
    this.resumeAll = this.resumeAll.bind(this)
    
    // 页面可见性变化时的处理
    this.handleVisibilityChange()
    
    console.log('🎬 GSAPManager initialized')
  }
  
  /**
   * 创建时间轴
   * @param {string} id - 时间轴唯一标识
   * @param {Object} options - 时间轴配置选项
   * @returns {gsap.timeline} GSAP时间轴实例
   */
  createTimeline(id, options = {}) {
    // 如果时间轴已存在，先清理
    if (this.timelines.has(id)) {
      this.timelines.get(id).kill()
    }
    
    const defaultOptions = {
      paused: false,
      repeat: 0,
      yoyo: false,
      ...this.config.defaults,
      ...options
    }
    
    const timeline = gsap.timeline(defaultOptions)
    
    // 添加完成回调
    timeline.eventCallback('onComplete', () => {
      this.activeAnimations--
      console.log(`⏹️ Timeline '${id}' completed. Active: ${this.activeAnimations}`)
    })
    
    timeline.eventCallback('onStart', () => {
      this.activeAnimations++
      console.log(`▶️ Timeline '${id}' started. Active: ${this.activeAnimations}`)
    })
    
    this.timelines.set(id, timeline)
    return timeline
  }
  
  /**
   * 获取时间轴
   * @param {string} id - 时间轴ID
   * @returns {gsap.timeline|null} 时间轴实例或null
   */
  getTimeline(id) {
    return this.timelines.get(id) || null
  }
  
  /**
   * 注册动画
   * @param {string} id - 动画唯一标识
   * @param {Function} animationFactory - 动画工厂函数
   * @param {Object} config - 动画配置
   */
  registerAnimation(id, animationFactory, config = {}) {
    if (typeof animationFactory !== 'function') {
      console.error(`❌ Animation factory for '${id}' must be a function`)
      return
    }
    
    this.animations.set(id, {
      factory: animationFactory,
      config: { ...this.config.defaults, ...config },
      lastUsed: Date.now()
    })
    
    console.log(`📝 Animation '${id}' registered`)
  }
  
  /**
   * 播放动画
   * @param {string} id - 动画ID
   * @param {Element|string} target - 动画目标元素
   * @param {Object} options - 动画选项
   * @returns {Promise} 动画完成Promise
   */
  async play(id, target, options = {}) {
    const animationData = this.animations.get(id)
    
    if (!animationData) {
      console.error(`❌ Animation '${id}' not found`)
      return Promise.reject(new Error(`Animation '${id}' not found`))
    }
    
    // 检查并发动画限制
    if (this.activeAnimations >= this.maxConcurrentAnimations) {
      console.warn(`⚠️ Max concurrent animations reached (${this.maxConcurrentAnimations})`)
      // 可以选择等待或跳过
      await this.waitForSlot()
    }
    
    try {
      const element = typeof target === 'string' ? document.querySelector(target) : target
      
      if (!element) {
        console.error(`❌ Target element not found for animation '${id}'`)
        return Promise.reject(new Error('Target element not found'))
      }
      
      // 合并配置
      const finalConfig = {
        ...animationData.config,
        ...options
      }
      
      // 更新最后使用时间
      animationData.lastUsed = Date.now()
      
      // 创建并执行动画
      const animation = animationData.factory(element, finalConfig)
      
      return new Promise((resolve, reject) => {
        if (animation && typeof animation.then === 'function') {
          // 如果返回Promise
          animation.then(resolve).catch(reject)
        } else if (animation && animation.eventCallback) {
          // 如果返回GSAP动画对象
          animation.eventCallback('onComplete', resolve)
          animation.eventCallback('onInterrupt', reject)
        } else {
          // 立即解析
          resolve(animation)
        }
      })
      
    } catch (error) {
      console.error(`❌ Error playing animation '${id}':`, error)
      return Promise.reject(error)
    }
  }
  
  /**
   * 等待动画槽位
   * @returns {Promise} 等待Promise
   */
  waitForSlot() {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.activeAnimations < this.maxConcurrentAnimations) {
          resolve()
        } else {
          setTimeout(checkSlot, 50)
        }
      }
      checkSlot()
    })
  }
  
  /**
   * 暂停所有动画
   */
  pauseAll() {
    gsap.globalTimeline.pause()
    this.timelines.forEach((timeline, id) => {
      timeline.pause()
    })
    console.log('⏸️ All animations paused')
  }
  
  /**
   * 恢复所有动画
   */
  resumeAll() {
    gsap.globalTimeline.resume()
    this.timelines.forEach((timeline, id) => {
      timeline.resume()
    })
    console.log('▶️ All animations resumed')
  }
  
  /**
   * 停止指定动画
   * @param {string} id - 动画或时间轴ID
   */
  stop(id) {
    const timeline = this.timelines.get(id)
    if (timeline) {
      timeline.kill()
      this.timelines.delete(id)
      console.log(`⏹️ Timeline '${id}' stopped and removed`)
    }
  }
  
  /**
   * 清理资源
   * @param {boolean} force - 是否强制清理所有动画
   */
  cleanup(force = false) {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5分钟
    
    // 清理过期的动画注册
    this.animations.forEach((animationData, id) => {
      if (force || (now - animationData.lastUsed > maxAge)) {
        this.animations.delete(id)
        console.log(`🗑️ Animation '${id}' cleaned up`)
      }
    })
    
    // 清理已完成的时间轴
    this.timelines.forEach((timeline, id) => {
      if (force || timeline.progress() === 1) {
        timeline.kill()
        this.timelines.delete(id)
        console.log(`🗑️ Timeline '${id}' cleaned up`)
      }
    })
    
    // 清理GSAP全局时间轴中已完成的动画
    gsap.globalTimeline.getChildren().forEach(tween => {
      if (tween.progress() === 1) {
        tween.kill()
      }
    })
    
    console.log(`🧹 Cleanup completed. Active animations: ${this.activeAnimations}`)
  }
  
  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAll()
        console.log('👁️ Page hidden, animations paused')
      } else {
        this.resumeAll()
        console.log('👁️ Page visible, animations resumed')
      }
    })
  }
  
  /**
   * 获取管理器状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      activeAnimations: this.activeAnimations,
      registeredAnimations: this.animations.size,
      activeTimelines: this.timelines.size,
      maxConcurrentAnimations: this.maxConcurrentAnimations,
      globalTimelineChildren: gsap.globalTimeline.getChildren().length
    }
  }
  
  /**
   * 设置最大并发动画数
   * @param {number} max - 最大并发数
   */
  setMaxConcurrentAnimations(max) {
    this.maxConcurrentAnimations = Math.max(1, max)
    console.log(`🔧 Max concurrent animations set to: ${this.maxConcurrentAnimations}`)
  }
  
  /**
   * 销毁管理器
   */
  destroy() {
    // 停止所有动画
    this.timelines.forEach((timeline) => timeline.kill())
    this.timelines.clear()
    this.animations.clear()
    
    // 清理全局时间轴
    gsap.globalTimeline.clear()
    
    console.log('💥 GSAPManager destroyed')
  }
}

// 创建单例实例
const gsapManager = new GSAPManager()

// 定期清理（每5分钟）
setInterval(() => {
  gsapManager.cleanup()
}, 5 * 60 * 1000)

export default gsapManager
export { GSAPManager }