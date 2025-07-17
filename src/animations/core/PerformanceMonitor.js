// 动画性能监控器
import { GSAP_CONFIG } from '../config/gsapConfig'

/**
 * 性能等级枚举
 */
export const PERFORMANCE_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
}

/**
 * 性能监控器类
 */
class PerformanceMonitor {
  constructor() {
    this.isMonitoring = false
    this.performanceLevel = PERFORMANCE_LEVEL.MEDIUM
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      animationCount: 0,
      droppedFrames: 0,
      cpuUsage: 0
    }
    
    // 性能历史记录
    this.history = {
      fps: [],
      frameTime: [],
      memoryUsage: []
    }
    
    // 性能阈值
    this.thresholds = {
      lowFPS: 30,
      highFrameTime: 16.67, // 60fps = 16.67ms per frame
      highMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxHistoryLength: 100
    }
    
    // 监控状态
    this.lastFrameTime = performance.now()
    this.frameCount = 0
    this.monitoringInterval = null
    this.rafId = null
    
    // 设备信息
    this.deviceInfo = this.detectDeviceCapabilities()
    
    // 用户偏好
    this.userPreferences = this.detectUserPreferences()
    
    console.log('📊 PerformanceMonitor initialized', {
      deviceInfo: this.deviceInfo,
      userPreferences: this.userPreferences
    })
  }
  
  /**
   * 检测设备性能能力
   * @returns {Object} 设备信息
   */
  detectDeviceCapabilities() {
    const info = {
      cores: navigator.hardwareConcurrency || 4,
      memory: navigator.deviceMemory || 4,
      connection: navigator.connection?.effectiveType || '4g',
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      isLowEnd: false
    }
    
    // 判断是否为低端设备
    info.isLowEnd = (
      info.memory < 4 || 
      info.cores < 4 || 
      info.connection === '2g' || 
      info.connection === 'slow-2g'
    )
    
    return info
  }
  
  /**
   * 检测用户偏好
   * @returns {Object} 用户偏好
   */
  detectUserPreferences() {
    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      dataSaver: navigator.connection?.saveData || false
    }
  }
  
  /**
   * 开始性能监控
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.warn('⚠️ Performance monitoring already started')
      return
    }
    
    this.isMonitoring = true
    this.lastFrameTime = performance.now()
    
    // 开始帧率监控
    this.startFrameMonitoring()
    
    // 开始内存监控
    this.startMemoryMonitoring()
    
    // 评估初始性能等级
    this.evaluatePerformanceLevel()
    
    console.log('📊 Performance monitoring started')
  }
  
  /**
   * 停止性能监控
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return
    }
    
    this.isMonitoring = false
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    console.log('📊 Performance monitoring stopped')
  }
  
  /**
   * 开始帧率监控
   */
  startFrameMonitoring() {
    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFrame = (currentTime) => {
      if (!this.isMonitoring) return
      
      frameCount++
      const deltaTime = currentTime - this.lastFrameTime
      this.lastFrameTime = currentTime
      
      // 计算帧时间
      this.metrics.frameTime = deltaTime
      
      // 每秒计算一次FPS
      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        // 检测掉帧
        if (deltaTime > this.thresholds.highFrameTime * 2) {
          this.metrics.droppedFrames++
        }
        
        // 记录历史
        this.recordMetric('fps', this.metrics.fps)
        this.recordMetric('frameTime', this.metrics.frameTime)
        
        frameCount = 0
        lastTime = currentTime
        
        // 动态调整性能等级
        this.evaluatePerformanceLevel()
      }
      
      this.rafId = requestAnimationFrame(measureFrame)
    }
    
    this.rafId = requestAnimationFrame(measureFrame)
  }
  
  /**
   * 开始内存监控
   */
  startMemoryMonitoring() {
    this.monitoringInterval = setInterval(() => {
      if (!this.isMonitoring) return
      
      // 获取内存使用情况
      if (performance.memory) {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize
        this.recordMetric('memoryUsage', this.metrics.memoryUsage)
      }
      
      // 获取当前动画数量
      this.metrics.animationCount = this.getActiveAnimationCount()
      
    }, 1000) // 每秒检查一次
  }
  
  /**
   * 记录性能指标历史
   * @param {string} metric - 指标名称
   * @param {number} value - 指标值
   */
  recordMetric(metric, value) {
    if (!this.history[metric]) {
      this.history[metric] = []
    }
    
    this.history[metric].push({
      value,
      timestamp: Date.now()
    })
    
    // 限制历史记录长度
    if (this.history[metric].length > this.thresholds.maxHistoryLength) {
      this.history[metric].shift()
    }
  }
  
  /**
   * 评估性能等级
   */
  evaluatePerformanceLevel() {
    const { fps, frameTime, memoryUsage } = this.metrics
    const { deviceInfo, userPreferences } = this
    
    let score = 0
    
    // FPS评分
    if (fps >= 55) score += 3
    else if (fps >= 45) score += 2
    else if (fps >= 30) score += 1
    
    // 帧时间评分
    if (frameTime <= 16.67) score += 3
    else if (frameTime <= 33.33) score += 2
    else if (frameTime <= 50) score += 1
    
    // 内存使用评分
    if (memoryUsage < 50 * 1024 * 1024) score += 3
    else if (memoryUsage < 100 * 1024 * 1024) score += 2
    else if (memoryUsage < 200 * 1024 * 1024) score += 1
    
    // 设备能力评分
    if (!deviceInfo.isLowEnd) score += 2
    if (deviceInfo.cores >= 8) score += 1
    if (deviceInfo.memory >= 8) score += 1
    
    // 用户偏好调整
    if (userPreferences.reducedMotion) score -= 2
    if (userPreferences.dataSaver) score -= 1
    
    // 确定性能等级
    const previousLevel = this.performanceLevel
    
    if (score >= 10) {
      this.performanceLevel = PERFORMANCE_LEVEL.HIGH
    } else if (score >= 6) {
      this.performanceLevel = PERFORMANCE_LEVEL.MEDIUM
    } else {
      this.performanceLevel = PERFORMANCE_LEVEL.LOW
    }
    
    // 如果性能等级发生变化，触发优化
    if (previousLevel !== this.performanceLevel) {
      this.onPerformanceLevelChange(previousLevel, this.performanceLevel)
    }
  }
  
  /**
   * 性能等级变化处理
   * @param {string} oldLevel - 旧等级
   * @param {string} newLevel - 新等级
   */
  onPerformanceLevelChange(oldLevel, newLevel) {
    console.log(`📊 Performance level changed: ${oldLevel} → ${newLevel}`)
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('performanceLevelChange', {
      detail: { oldLevel, newLevel, metrics: this.metrics }
    }))
    
    // 应用性能优化
    this.applyPerformanceOptimizations(newLevel)
  }
  
  /**
   * 应用性能优化
   * @param {string} level - 性能等级
   */
  applyPerformanceOptimizations(level) {
    switch (level) {
      case PERFORMANCE_LEVEL.LOW:
        this.applyLowPerformanceOptimizations()
        break
      case PERFORMANCE_LEVEL.MEDIUM:
        this.applyMediumPerformanceOptimizations()
        break
      case PERFORMANCE_LEVEL.HIGH:
        this.applyHighPerformanceOptimizations()
        break
    }
  }
  
  /**
   * 低性能优化
   */
  applyLowPerformanceOptimizations() {
    console.log('🐌 Applying low performance optimizations')
    
    // 减少动画复杂度
    document.documentElement.style.setProperty('--animation-duration-multiplier', '0.5')
    document.documentElement.style.setProperty('--animation-complexity', 'low')
    
    // 禁用一些视觉效果
    document.documentElement.classList.add('low-performance-mode')
    
    // 降低动画帧率
    if (window.gsap) {
      window.gsap.ticker.fps(30)
    }
  }
  
  /**
   * 中等性能优化
   */
  applyMediumPerformanceOptimizations() {
    console.log('🚀 Applying medium performance optimizations')
    
    document.documentElement.style.setProperty('--animation-duration-multiplier', '0.8')
    document.documentElement.style.setProperty('--animation-complexity', 'medium')
    
    document.documentElement.classList.remove('low-performance-mode')
    document.documentElement.classList.add('medium-performance-mode')
    
    if (window.gsap) {
      window.gsap.ticker.fps(45)
    }
  }
  
  /**
   * 高性能优化
   */
  applyHighPerformanceOptimizations() {
    console.log('⚡ Applying high performance optimizations')
    
    document.documentElement.style.setProperty('--animation-duration-multiplier', '1')
    document.documentElement.style.setProperty('--animation-complexity', 'high')
    
    document.documentElement.classList.remove('low-performance-mode', 'medium-performance-mode')
    document.documentElement.classList.add('high-performance-mode')
    
    if (window.gsap) {
      window.gsap.ticker.fps(60)
    }
  }
  
  /**
   * 获取当前活跃动画数量
   * @returns {number} 动画数量
   */
  getActiveAnimationCount() {
    if (window.gsap) {
      return window.gsap.globalTimeline.getChildren().length
    }
    return 0
  }
  
  /**
   * 获取性能建议
   * @returns {Array} 建议列表
   */
  getPerformanceRecommendations() {
    const recommendations = []
    const { fps, frameTime, memoryUsage } = this.metrics
    
    if (fps < this.thresholds.lowFPS) {
      recommendations.push({
        type: 'warning',
        message: `低帧率检测 (${fps}fps)，建议减少动画复杂度`,
        action: 'reduce_complexity'
      })
    }
    
    if (frameTime > this.thresholds.highFrameTime * 2) {
      recommendations.push({
        type: 'warning',
        message: `帧时间过长 (${frameTime.toFixed(2)}ms)，可能影响流畅度`,
        action: 'optimize_animations'
      })
    }
    
    if (memoryUsage > this.thresholds.highMemoryUsage) {
      recommendations.push({
        type: 'error',
        message: `内存使用过高 (${(memoryUsage / 1024 / 1024).toFixed(2)}MB)`,
        action: 'cleanup_memory'
      })
    }
    
    if (this.metrics.droppedFrames > 10) {
      recommendations.push({
        type: 'warning',
        message: `检测到掉帧 (${this.metrics.droppedFrames}次)`,
        action: 'reduce_concurrent_animations'
      })
    }
    
    return recommendations
  }
  
  /**
   * 获取性能报告
   * @returns {Object} 性能报告
   */
  getPerformanceReport() {
    return {
      timestamp: Date.now(),
      performanceLevel: this.performanceLevel,
      metrics: { ...this.metrics },
      deviceInfo: { ...this.deviceInfo },
      userPreferences: { ...this.userPreferences },
      recommendations: this.getPerformanceRecommendations(),
      history: {
        fps: this.history.fps.slice(-10), // 最近10个记录
        frameTime: this.history.frameTime.slice(-10),
        memoryUsage: this.history.memoryUsage.slice(-10)
      }
    }
  }
  
  /**
   * 创建实时性能监控面板
   * @returns {HTMLElement} 监控面板元素
   */
  createPerformancePanel() {
    // 检查是否已存在面板
    let panel = document.getElementById('gsap-performance-panel')
    if (panel) return panel
    
    // 创建面板容器
    panel = document.createElement('div')
    panel.id = 'gsap-performance-panel'
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: opacity 0.3s ease;
    `
    
    // 创建标题
    const title = document.createElement('div')
    title.textContent = 'GSAP Performance Monitor'
    title.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      color: #00ff88;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 5px;
    `
    panel.appendChild(title)
    
    // 创建指标容器
    const metricsContainer = document.createElement('div')
    metricsContainer.id = 'performance-metrics'
    panel.appendChild(metricsContainer)
    
    // 创建图表容器
    const chartContainer = document.createElement('div')
    chartContainer.id = 'performance-chart'
    chartContainer.style.cssText = `
      height: 60px;
      margin: 10px 0;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    `
    panel.appendChild(chartContainer)
    
    // 创建控制按钮
    const controls = document.createElement('div')
    controls.style.cssText = `
      display: flex;
      gap: 5px;
      margin-top: 10px;
    `
    
    const toggleButton = document.createElement('button')
    toggleButton.textContent = 'Hide'
    toggleButton.style.cssText = `
      background: #007acc;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
    `
    toggleButton.onclick = () => this.togglePanelVisibility()
    
    const resetButton = document.createElement('button')
    resetButton.textContent = 'Reset'
    resetButton.style.cssText = `
      background: #cc7a00;
      color: white;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
    `
    resetButton.onclick = () => this.resetMetrics()
    
    controls.appendChild(toggleButton)
    controls.appendChild(resetButton)
    panel.appendChild(controls)
    
    // 添加到页面
    document.body.appendChild(panel)
    
    // 开始更新面板
    this.startPanelUpdates()
    
    return panel
  }
  
  /**
   * 开始面板更新
   */
  startPanelUpdates() {
    if (this.panelUpdateInterval) return
    
    this.panelUpdateInterval = setInterval(() => {
      this.updatePerformancePanel()
    }, 500) // 每500ms更新一次
  }
  
  /**
   * 停止面板更新
   */
  stopPanelUpdates() {
    if (this.panelUpdateInterval) {
      clearInterval(this.panelUpdateInterval)
      this.panelUpdateInterval = null
    }
  }
  
  /**
   * 更新性能面板
   */
  updatePerformancePanel() {
    const panel = document.getElementById('gsap-performance-panel')
    const metricsContainer = document.getElementById('performance-metrics')
    const chartContainer = document.getElementById('performance-chart')
    
    if (!panel || !metricsContainer) return
    
    // 更新指标显示
    const { metrics, performanceLevel } = this
    const levelColor = performanceLevel === 'high' ? '#00ff88' : 
                      performanceLevel === 'medium' ? '#ffaa00' : '#ff4444'
    
    metricsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
        <div>FPS: <span style="color: ${levelColor}">${metrics.fps}</span></div>
        <div>Frame: ${metrics.frameTime.toFixed(1)}ms</div>
        <div>Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
        <div>Animations: ${metrics.animationCount}</div>
        <div>Dropped: ${metrics.droppedFrames}</div>
        <div>Level: <span style="color: ${levelColor}">${performanceLevel.toUpperCase()}</span></div>
      </div>
    `
    
    // 更新FPS图表
    if (chartContainer) {
      this.updatePerformanceChart(chartContainer)
    }
  }
  
  /**
   * 更新性能图表
   */
  updatePerformanceChart(container) {
    const fpsHistory = this.history.fps.slice(-30) // 最近30个数据点
    if (fpsHistory.length === 0) return
    
    const canvas = container.querySelector('canvas') || document.createElement('canvas')
    if (!container.querySelector('canvas')) {
      canvas.width = 280
      canvas.height = 50
      canvas.style.cssText = 'width: 100%; height: 100%;'
      container.appendChild(canvas)
    }
    
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = (canvas.height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    // 绘制FPS曲线
    if (fpsHistory.length > 1) {
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      fpsHistory.forEach((point, index) => {
        const x = (canvas.width / (fpsHistory.length - 1)) * index
        const y = canvas.height - (point.value / 60) * canvas.height
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
    }
    
    // 绘制60fps基准线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, canvas.height - (60 / 60) * canvas.height)
    ctx.lineTo(canvas.width, canvas.height - (60 / 60) * canvas.height)
    ctx.stroke()
    ctx.setLineDash([])
  }
  
  /**
   * 切换面板可见性
   */
  togglePanelVisibility() {
    const panel = document.getElementById('gsap-performance-panel')
    if (!panel) return
    
    const isVisible = panel.style.opacity !== '0'
    panel.style.opacity = isVisible ? '0' : '1'
    panel.style.pointerEvents = isVisible ? 'none' : 'auto'
    
    const button = panel.querySelector('button')
    if (button) {
      button.textContent = isVisible ? 'Show' : 'Hide'
    }
  }
  
  /**
   * 移除性能面板
   */
  removePerformancePanel() {
    const panel = document.getElementById('gsap-performance-panel')
    if (panel) {
      panel.remove()
    }
    this.stopPanelUpdates()
  }
  
  /**
   * 创建性能基准测试
   */
  createPerformanceBenchmark() {
    return new Promise((resolve) => {
      const testElement = document.createElement('div')
      testElement.style.cssText = `
        position: fixed;
        top: -100px;
        left: -100px;
        width: 50px;
        height: 50px;
        background: red;
        opacity: 0;
      `
      document.body.appendChild(testElement)
      
      const startTime = performance.now()
      let frameCount = 0
      
      const testAnimation = gsap.to(testElement, {
        x: 200,
        y: 200,
        rotation: 360,
        scale: 2,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          frameCount++
        },
        onComplete: () => {
          const endTime = performance.now()
          const duration = endTime - startTime
          const avgFPS = (frameCount / duration) * 1000
          
          testElement.remove()
          
          resolve({
            duration,
            frameCount,
            avgFPS: Math.round(avgFPS),
            score: this.calculateBenchmarkScore(avgFPS, duration)
          })
        }
      })
    })
  }
  
  /**
   * 计算基准测试分数
   */
  calculateBenchmarkScore(avgFPS, duration) {
    const expectedFPS = 60
    const expectedDuration = 2000
    
    const fpsScore = (avgFPS / expectedFPS) * 50
    const durationScore = (expectedDuration / duration) * 50
    
    return Math.min(100, Math.round(fpsScore + durationScore))
  }
  
  /**
   * 重置性能指标
   */
  resetMetrics() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      animationCount: 0,
      droppedFrames: 0,
      cpuUsage: 0
    }
    
    this.history = {
      fps: [],
      frameTime: [],
      memoryUsage: []
    }
    
    console.log('📊 Performance metrics reset')
  }
  
  /**
   * 销毁监控器
   */
  destroy() {
    this.stopMonitoring()
    this.resetMetrics()
    console.log('💥 PerformanceMonitor destroyed')
  }
}

// 创建单例实例
const performanceMonitor = new PerformanceMonitor()

// 页面加载完成后自动开始监控
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    performanceMonitor.startMonitoring()
  })
} else {
  performanceMonitor.startMonitoring()
}

// 页面卸载时停止监控
window.addEventListener('beforeunload', () => {
  performanceMonitor.stopMonitoring()
})

export default performanceMonitor
export { PerformanceMonitor, PERFORMANCE_LEVEL }