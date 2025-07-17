// MobilePerformanceOptimizer.js - 移动端性能优化器
import { gsap } from 'gsap'
import performanceMonitor from './PerformanceMonitor'

/**
 * 移动端性能优化器
 * 专门针对移动设备的动画性能优化
 */
class MobilePerformanceOptimizer {
  constructor() {
    this.isInitialized = false
    this.isMobile = false
    this.deviceInfo = null
    this.performanceLevel = 'unknown'
    this.optimizationSettings = null
    this.adaptiveSettings = {
      fps: 60,
      complexity: 1.0,
      duration: 1.0,
      effects: 1.0
    }
    
    // 设备性能分级
    this.performanceTiers = {
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low'
    }
    
    // 优化策略
    this.optimizationStrategies = {
      REDUCE_COMPLEXITY: 'reduce_complexity',
      LOWER_FPS: 'lower_fps',
      SIMPLIFY_EFFECTS: 'simplify_effects',
      BATCH_ANIMATIONS: 'batch_animations',
      USE_TRANSFORMS: 'use_transforms'
    }
  }
  
  /**
   * 初始化移动端优化器
   */
  initialize() {
    if (this.isInitialized) return
    
    try {
      // 检测设备信息
      this.detectDeviceInfo()
      
      // 评估设备性能
      this.assessDevicePerformance()
      
      // 设置优化配置
      this.setupOptimizationSettings()
      
      // 应用初始优化
      this.applyInitialOptimizations()
      
      // 启动自适应监控
      this.startAdaptiveMonitoring()
      
      this.isInitialized = true
      console.log(`Mobile performance optimizer initialized - Performance level: ${this.performanceLevel}`)
    } catch (error) {
      console.error('Failed to initialize mobile performance optimizer:', error)
    }
  }
  
  /**
   * 检测设备信息
   */
  detectDeviceInfo() {
    const userAgent = navigator.userAgent
    
    this.deviceInfo = {
      // 基本设备检测
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?=.*\\bMobile\\b)|tablet/i.test(userAgent),
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      
      // 屏幕信息
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      
      // 硬件信息
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      
      // 网络信息
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
      
      // 内存信息（如果支持）\n      memory: navigator.deviceMemory || null,\n      \n      // 浏览器信息\n      isChrome: /Chrome/.test(userAgent),\n      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),\n      isFirefox: /Firefox/.test(userAgent)\n    }\n    \n    this.isMobile = this.deviceInfo.isMobile\n  }\n  \n  /**\n   * 评估设备性能\n   */\n  assessDevicePerformance() {\n    let performanceScore = 100\n    \n    // 基于CPU核心数评分\n    if (this.deviceInfo.hardwareConcurrency <= 2) {\n      performanceScore -= 30\n    } else if (this.deviceInfo.hardwareConcurrency <= 4) {\n      performanceScore -= 15\n    }\n    \n    // 基于内存评分\n    if (this.deviceInfo.memory) {\n      if (this.deviceInfo.memory <= 2) {\n        performanceScore -= 25\n      } else if (this.deviceInfo.memory <= 4) {\n        performanceScore -= 10\n      }\n    } else {\n      // 没有内存信息，保守估计\n      performanceScore -= 15\n    }\n    \n    // 基于屏幕分辨率评分\n    const totalPixels = this.deviceInfo.screenWidth * this.deviceInfo.screenHeight * this.deviceInfo.devicePixelRatio\n    if (totalPixels > 2000000) { // 高分辨率屏幕\n      performanceScore -= 20\n    }\n    \n    // 基于网络连接评分\n    if (this.deviceInfo.connection) {\n      const effectiveType = this.deviceInfo.connection.effectiveType\n      if (effectiveType === 'slow-2g' || effectiveType === '2g') {\n        performanceScore -= 20\n      } else if (effectiveType === '3g') {\n        performanceScore -= 10\n      }\n    }\n    \n    // 基于浏览器评分\n    if (this.deviceInfo.isSafari) {\n      performanceScore -= 5 // Safari在某些动画上性能稍差\n    }\n    \n    // 确定性能等级\n    if (performanceScore >= 80) {\n      this.performanceLevel = this.performanceTiers.HIGH\n    } else if (performanceScore >= 60) {\n      this.performanceLevel = this.performanceTiers.MEDIUM\n    } else {\n      this.performanceLevel = this.performanceTiers.LOW\n    }\n    \n    console.log(`Device performance assessment: ${performanceScore}/100 (${this.performanceLevel})`)
  }
  
  /**
   * 设置优化配置
   */
  setupOptimizationSettings() {
    switch (this.performanceLevel) {
      case this.performanceTiers.HIGH:
        this.optimizationSettings = {
          maxConcurrentAnimations: 20,
          targetFPS: 60,
          complexityMultiplier: 1.0,
          durationMultiplier: 1.0,
          effectsEnabled: true,
          useGPUAcceleration: true,
          batchAnimations: false,
          simplifyEasing: false
        }
        break
        
      case this.performanceTiers.MEDIUM:
        this.optimizationSettings = {
          maxConcurrentAnimations: 12,
          targetFPS: 45,
          complexityMultiplier: 0.8,
          durationMultiplier: 1.2,
          effectsEnabled: true,
          useGPUAcceleration: true,
          batchAnimations: true,
          simplifyEasing: false
        }
        break
        
      case this.performanceTiers.LOW:
        this.optimizationSettings = {
          maxConcurrentAnimations: 6,
          targetFPS: 30,
          complexityMultiplier: 0.5,
          durationMultiplier: 1.5,
          effectsEnabled: false,
          useGPUAcceleration: true,
          batchAnimations: true,
          simplifyEasing: true
        }
        break
        
      default:
        this.optimizationSettings = {
          maxConcurrentAnimations: 8,
          targetFPS: 30,
          complexityMultiplier: 0.6,
          durationMultiplier: 1.3,
          effectsEnabled: false,
          useGPUAcceleration: true,
          batchAnimations: true,
          simplifyEasing: true
        }
    }
  }
  
  /**
   * 应用初始优化
   */
  applyInitialOptimizations() {
    // 设置GSAP的移动端优化
    if (this.isMobile) {
      // 启用GPU加速
      gsap.set('*', { force3D: this.optimizationSettings.useGPUAcceleration })
      
      // 设置默认缓动函数（简化版）
      if (this.optimizationSettings.simplifyEasing) {
        gsap.defaults({ ease: 'power2.out' })\n      }\n      \n      // 设置ticker的FPS限制\n      if (this.optimizationSettings.targetFPS < 60) {\n        gsap.ticker.fps(this.optimizationSettings.targetFPS)\n      }\n    }\n    \n    // 应用CSS优化\n    this.applyCSSOptimizations()\n  }\n  \n  /**\n   * 应用CSS优化\n   */\n  applyCSSOptimizations() {\n    const style = document.createElement('style')\n    style.textContent = `\n      /* 移动端动画优化 */\n      * {\n        -webkit-backface-visibility: hidden;\n        backface-visibility: hidden;\n        -webkit-perspective: 1000px;\n        perspective: 1000px;\n      }\n      \n      .gsap-animation {\n        will-change: transform, opacity;\n        transform-style: preserve-3d;\n      }\n      \n      /* 减少重绘和重排 */\n      .gsap-animation * {\n        -webkit-transform-style: preserve-3d;\n        transform-style: preserve-3d;\n      }\n      \n      /* 触摸优化 */\n      .gsap-touch-target {\n        -webkit-tap-highlight-color: transparent;\n        -webkit-touch-callout: none;\n        -webkit-user-select: none;\n        user-select: none;\n      }\n    `\n    \n    document.head.appendChild(style)\n  }\n  \n  /**\n   * 启动自适应监控\n   */\n  startAdaptiveMonitoring() {\n    if (!this.isMobile) return\n    \n    // 监控性能指标\n    setInterval(() => {\n      this.checkPerformanceAndAdapt()\n    }, 2000) // 每2秒检查一次\n    \n    // 监听电池状态变化\n    if ('getBattery' in navigator) {\n      navigator.getBattery().then(battery => {\n        battery.addEventListener('levelchange', () => {\n          this.handleBatteryLevelChange(battery.level)\n        })\n        \n        battery.addEventListener('chargingchange', () => {\n          this.handleChargingStateChange(battery.charging)\n        })\n      })\n    }\n    \n    // 监听网络状态变化\n    if (this.deviceInfo.connection) {\n      this.deviceInfo.connection.addEventListener('change', () => {\n        this.handleNetworkChange()\n      })\n    }\n    \n    // 监听页面可见性变化\n    document.addEventListener('visibilitychange', () => {\n      this.handleVisibilityChange()\n    })\n  }\n  \n  /**\n   * 检查性能并自适应调整\n   */\n  checkPerformanceAndAdapt() {\n    const currentFPS = performanceMonitor.getCurrentFPS()\n    const targetFPS = this.optimizationSettings.targetFPS\n    const memoryUsage = performanceMonitor.getMemoryUsage()\n    \n    // FPS过低时的优化\n    if (currentFPS < targetFPS * 0.8) {\n      this.applyPerformanceOptimization('fps_low')\n    }\n    \n    // 内存使用过高时的优化\n    if (memoryUsage > 100 * 1024 * 1024) { // 100MB\n      this.applyPerformanceOptimization('memory_high')\n    }\n    \n    // 性能恢复时的调整\n    if (currentFPS > targetFPS * 1.1 && memoryUsage < 50 * 1024 * 1024) {\n      this.relaxPerformanceOptimization()\n    }\n  }\n  \n  /**\n   * 应用性能优化\n   */\n  applyPerformanceOptimization(reason) {\n    console.log(`Applying mobile performance optimization: ${reason}`)\n    \n    switch (reason) {\n      case 'fps_low':\n        // 降低动画复杂度\n        this.adaptiveSettings.complexity *= 0.9\n        this.adaptiveSettings.fps = Math.max(20, this.adaptiveSettings.fps - 5)\n        \n        // 暂停非关键动画\n        this.pauseNonCriticalAnimations()\n        break\n        \n      case 'memory_high':\n        // 清理动画缓存\n        this.cleanupAnimationCache()\n        \n        // 减少并发动画数量\n        this.adaptiveSettings.complexity *= 0.8\n        break\n        \n      case 'battery_low':\n        // 进入省电模式\n        this.enterPowerSaveMode()\n        break\n        \n      case 'network_slow':\n        // 减少网络相关动画\n        this.reduceNetworkAnimations()\n        break\n    }\n    \n    // 应用新的设置\n    this.applyAdaptiveSettings()\n  }\n  \n  /**\n   * 放松性能优化\n   */\n  relaxPerformanceOptimization() {\n    // 逐步恢复性能设置\n    this.adaptiveSettings.complexity = Math.min(1.0, this.adaptiveSettings.complexity * 1.1)\n    this.adaptiveSettings.fps = Math.min(this.optimizationSettings.targetFPS, this.adaptiveSettings.fps + 2)\n    \n    // 恢复暂停的动画\n    this.resumePausedAnimations()\n    \n    this.applyAdaptiveSettings()\n  }\n  \n  /**\n   * 应用自适应设置\n   */\n  applyAdaptiveSettings() {\n    // 更新GSAP设置\n    if (this.adaptiveSettings.fps !== gsap.ticker.fps()) {\n      gsap.ticker.fps(this.adaptiveSettings.fps)\n    }\n    \n    // 通知其他组件性能设置变化\n    window.dispatchEvent(new CustomEvent('mobilePerformanceUpdate', {\n      detail: {\n        settings: this.adaptiveSettings,\n        performanceLevel: this.performanceLevel\n      }\n    }))\n  }\n  \n  /**\n   * 暂停非关键动画\n   */\n  pauseNonCriticalAnimations() {\n    const animations = gsap.globalTimeline.getChildren()\n    \n    animations.forEach(animation => {\n      // 检查动画是否标记为关键\n      if (!animation.vars.critical && !animation.paused()) {\n        animation.pause()\n        animation._pausedByOptimizer = true\n      }\n    })\n  }\n  \n  /**\n   * 恢复暂停的动画\n   */\n  resumePausedAnimations() {\n    const animations = gsap.globalTimeline.getChildren()\n    \n    animations.forEach(animation => {\n      if (animation._pausedByOptimizer && animation.paused()) {\n        animation.resume()\n        delete animation._pausedByOptimizer\n      }\n    })\n  }\n  \n  /**\n   * 清理动画缓存\n   */\n  cleanupAnimationCache() {\n    // 清理已完成的动画\n    const animations = gsap.globalTimeline.getChildren()\n    \n    animations.forEach(animation => {\n      if (animation.progress() === 1 && !animation.vars.persist) {\n        animation.kill()\n      }\n    })\n    \n    // 强制垃圾回收（如果支持）\n    if (window.gc) {\n      window.gc()\n    }\n  }\n  \n  /**\n   * 进入省电模式\n   */\n  enterPowerSaveMode() {\n    console.log('Entering power save mode')\n    \n    // 大幅降低性能设置\n    this.adaptiveSettings.complexity = 0.3\n    this.adaptiveSettings.fps = 20\n    this.adaptiveSettings.effects = 0.2\n    \n    // 暂停所有非关键动画\n    this.pauseNonCriticalAnimations()\n    \n    // 禁用复杂效果\n    this.disableComplexEffects()\n  }\n  \n  /**\n   * 退出省电模式\n   */\n  exitPowerSaveMode() {\n    console.log('Exiting power save mode')\n    \n    // 恢复正常性能设置\n    this.adaptiveSettings.complexity = this.optimizationSettings.complexityMultiplier\n    this.adaptiveSettings.fps = this.optimizationSettings.targetFPS\n    this.adaptiveSettings.effects = 1.0\n    \n    // 恢复动画\n    this.resumePausedAnimations()\n    \n    // 重新启用效果\n    this.enableComplexEffects()\n  }\n  \n  /**\n   * 禁用复杂效果\n   */\n  disableComplexEffects() {\n    // 禁用阴影、模糊等复杂效果\n    const style = document.createElement('style')\n    style.id = 'mobile-power-save-style'\n    style.textContent = `\n      .gsap-animation {\n        filter: none !important;\n        box-shadow: none !important;\n        text-shadow: none !important;\n      }\n    `\n    document.head.appendChild(style)\n  }\n  \n  /**\n   * 启用复杂效果\n   */\n  enableComplexEffects() {\n    const style = document.getElementById('mobile-power-save-style')\n    if (style) {\n      style.remove()\n    }\n  }\n  \n  /**\n   * 减少网络相关动画\n   */\n  reduceNetworkAnimations() {\n    // 暂停加载动画等网络相关动画\n    const networkAnimations = document.querySelectorAll('.loading-animation, .network-animation')\n    \n    networkAnimations.forEach(element => {\n      const animation = gsap.getById(element.id)\n      if (animation && !animation.paused()) {\n        animation.pause()\n        animation._pausedByNetwork = true\n      }\n    })\n  }\n  \n  /**\n   * 处理电池电量变化\n   */\n  handleBatteryLevelChange(level) {\n    if (level < 0.2) { // 电量低于20%\n      this.applyPerformanceOptimization('battery_low')\n    } else if (level > 0.5 && this.adaptiveSettings.complexity < 0.5) {\n      // 电量恢复时逐步恢复性能\n      this.relaxPerformanceOptimization()\n    }\n  }\n  \n  /**\n   * 处理充电状态变化\n   */\n  handleChargingStateChange(charging) {\n    if (charging) {\n      // 充电时可以提高性能\n      this.exitPowerSaveMode()\n    } else {\n      // 断开充电时保守一些\n      this.adaptiveSettings.complexity *= 0.9\n      this.applyAdaptiveSettings()\n    }\n  }\n  \n  /**\n   * 处理网络变化\n   */\n  handleNetworkChange() {\n    if (!this.deviceInfo.connection) return\n    \n    const effectiveType = this.deviceInfo.connection.effectiveType\n    \n    if (effectiveType === 'slow-2g' || effectiveType === '2g') {\n      this.applyPerformanceOptimization('network_slow')\n    } else if (effectiveType === '4g' || effectiveType === '5g') {\n      // 网络良好时恢复动画\n      this.resumeNetworkAnimations()\n    }\n  }\n  \n  /**\n   * 恢复网络动画\n   */\n  resumeNetworkAnimations() {\n    const animations = gsap.globalTimeline.getChildren()\n    \n    animations.forEach(animation => {\n      if (animation._pausedByNetwork && animation.paused()) {\n        animation.resume()\n        delete animation._pausedByNetwork\n      }\n    })\n  }\n  \n  /**\n   * 处理页面可见性变化\n   */\n  handleVisibilityChange() {\n    if (document.hidden) {\n      // 页面隐藏时暂停所有动画\n      gsap.globalTimeline.pause()\n    } else {\n      // 页面显示时恢复动画\n      gsap.globalTimeline.resume()\n    }\n  }\n  \n  /**\n   * 优化动画配置\n   */\n  optimizeAnimationConfig(config) {\n    if (!this.isMobile) return config\n    \n    const optimized = { ...config }\n    \n    // 调整持续时间\n    if (optimized.duration) {\n      optimized.duration *= this.optimizationSettings.durationMultiplier * this.adaptiveSettings.duration\n    }\n    \n    // 简化缓动函数\n    if (this.optimizationSettings.simplifyEasing) {\n      if (optimized.ease && typeof optimized.ease === 'string') {\n        // 将复杂的缓动函数替换为简单的\n        if (optimized.ease.includes('elastic') || optimized.ease.includes('bounce')) {\n          optimized.ease = 'power2.out'\n        }\n      }\n    }\n    \n    // 移除复杂效果\n    if (!this.optimizationSettings.effectsEnabled) {\n      delete optimized.filter\n      delete optimized.boxShadow\n      delete optimized.textShadow\n    }\n    \n    // 启用GPU加速\n    if (this.optimizationSettings.useGPUAcceleration) {\n      optimized.force3D = true\n    }\n    \n    return optimized\n  }\n  \n  /**\n   * 批量处理动画\n   */\n  batchAnimations(animations) {\n    if (!this.optimizationSettings.batchAnimations) {\n      return animations\n    }\n    \n    // 将多个动画合并到一个时间轴中\n    const timeline = gsap.timeline()\n    \n    animations.forEach((anim, index) => {\n      const delay = index * 0.1 // 错开动画时间\n      timeline.to(anim.target, { ...anim.config, delay }, 0)\n    })\n    \n    return timeline\n  }\n  \n  /**\n   * 获取优化建议\n   */\n  getOptimizationRecommendations() {\n    const recommendations = []\n    \n    if (this.performanceLevel === this.performanceTiers.LOW) {\n      recommendations.push('Consider reducing animation complexity for better performance')\n      recommendations.push('Use transform properties instead of changing layout properties')\n      recommendations.push('Limit the number of concurrent animations')\n    }\n    \n    if (this.deviceInfo.devicePixelRatio > 2) {\n      recommendations.push('High DPI screen detected - consider optimizing for retina displays')\n    }\n    \n    if (this.deviceInfo.connection && this.deviceInfo.connection.effectiveType === '2g') {\n      recommendations.push('Slow network detected - consider reducing animation-related network requests')\n    }\n    \n    return recommendations\n  }\n  \n  /**\n   * 获取性能统计\n   */\n  getPerformanceStats() {\n    return {\n      deviceInfo: this.deviceInfo,\n      performanceLevel: this.performanceLevel,\n      optimizationSettings: this.optimizationSettings,\n      adaptiveSettings: this.adaptiveSettings,\n      currentFPS: performanceMonitor.getCurrentFPS(),\n      memoryUsage: performanceMonitor.getMemoryUsage(),\n      activeAnimations: gsap.globalTimeline.getChildren().length\n    }\n  }\n  \n  /**\n   * 清理优化器\n   */\n  cleanup() {\n    // 恢复所有暂停的动画\n    this.resumePausedAnimations()\n    \n    // 移除添加的样式\n    const powerSaveStyle = document.getElementById('mobile-power-save-style')\n    if (powerSaveStyle) {\n      powerSaveStyle.remove()\n    }\n    \n    // 重置GSAP设置\n    gsap.ticker.fps(60)\n    \n    this.isInitialized = false\n    console.log('Mobile performance optimizer cleaned up')\n  }\n}\n\n// 创建单例实例\nconst mobilePerformanceOptimizer = new MobilePerformanceOptimizer()\n\nexport default mobilePerformanceOptimizer