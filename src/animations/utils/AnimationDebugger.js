// AnimationDebugger.js - 动画调试工具
import { gsap } from 'gsap'
import gsapManager from '../core/GSAPManager'
import performanceMonitor from '../core/PerformanceMonitor'
import accessibilityManager from '../core/AccessibilityManager'

/**
 * 动画调试工具
 * 提供开发者调试和优化动画的工具集
 */
class AnimationDebugger {
  constructor() {
    this.isInitialized = false
    this.isDebugMode = false
    this.debugPanel = null
    this.logHistory = []
    this.maxLogHistory = 50
    this.breakpoints = new Map()
    this.inspectedElements = new Set()
    
    // 绑定方法
    this.handleAnimationStart = this.handleAnimationStart.bind(this)
    this.handleAnimationComplete = this.handleAnimationComplete.bind(this)
    this.handleAnimationError = this.handleAnimationError.bind(this)
  }
  
  /**
   * 初始化调试工具
   */
  initialize() {
    if (this.isInitialized) return
    
    try {
      // 检查是否为开发环境
      this.isDebugMode = process.env.NODE_ENV === 'development' || 
                         window.location.search.includes('debug=true')
      
      if (this.isDebugMode) {
        // 添加GSAP调试监听器
        this.setupGSAPDebugListeners()
        
        // 添加全局调试API
        this.exposeGlobalAPI()
        
        console.log('🐞 Animation debugger initialized in debug mode')
      } else {
        console.log('Animation debugger initialized in production mode (limited features)')
      }
      
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize animation debugger:', error)
    }
  }
  
  /**
   * 设置GSAP调试监听器
   */
  setupGSAPDebugListeners() {
    // 监听所有新创建的动画
    gsap.ticker.add(() => {
      const activeAnimations = gsap.globalTimeline.getChildren()
      activeAnimations.forEach(animation => {
        if (!animation._debugMonitored && this.isDebugMode) {
          animation._debugMonitored = true
          
          // 添加调试回调
          animation.eventCallback('onStart', () => this.handleAnimationStart(animation))
          animation.eventCallback('onComplete', () => this.handleAnimationComplete(animation))
          animation.eventCallback('onInterrupt', () => this.handleAnimationInterrupt(animation))
          animation.eventCallback('onRepeat', () => this.handleAnimationRepeat(animation))
        }
      })
    })
  }
  
  /**
   * 暴露全局API
   */
  exposeGlobalAPI() {
    window.__ANIMATION_DEBUGGER__ = {
      // 调试面板
      showDebugPanel: () => this.createDebugPanel(),
      hideDebugPanel: () => this.removeDebugPanel(),
      toggleDebugPanel: () => this.toggleDebugPanel(),
      
      // 动画控制
      pauseAll: () => gsap.globalTimeline.pause(),
      resumeAll: () => gsap.globalTimeline.resume(),
      restartAll: () => gsap.globalTimeline.restart(),
      killAll: () => gsap.globalTimeline.clear(),
      
      // 动画检查
      listAnimations: () => this.listAllAnimations(),
      inspectAnimation: (id) => this.inspectAnimation(id),
      inspectElement: (selector) => this.inspectElement(selector),
      
      // 性能工具
      showPerformancePanel: () => performanceMonitor.createPerformancePanel(),
      runBenchmark: () => performanceMonitor.createPerformanceBenchmark(),
      
      // 调试工具
      setBreakpoint: (animationId, progress) => this.setAnimationBreakpoint(animationId, progress),
      clearBreakpoints: () => this.clearAllBreakpoints(),
      getLogs: () => this.getDebugLogs(),
      
      // 系统状态
      getSystemStatus: () => this.getSystemStatus()
    }
    
    console.log('Animation debugger API exposed as window.__ANIMATION_DEBUGGER__')
  }  
  
/**
   * 处理动画开始事件
   */
  handleAnimationStart(animation) {
    if (!this.isDebugMode) return
    
    const animInfo = this.getAnimationInfo(animation)
    this.logDebugEvent('start', animInfo)
    
    // 检查是否有断点
    this.checkAnimationBreakpoints(animation)
  }
  
  /**
   * 处理动画完成事件
   */
  handleAnimationComplete(animation) {
    if (!this.isDebugMode) return
    
    const animInfo = this.getAnimationInfo(animation)
    this.logDebugEvent('complete', animInfo)
  }
  
  /**
   * 处理动画中断事件
   */
  handleAnimationInterrupt(animation) {
    if (!this.isDebugMode) return
    
    const animInfo = this.getAnimationInfo(animation)
    this.logDebugEvent('interrupt', animInfo)
  }
  
  /**
   * 处理动画重复事件
   */
  handleAnimationRepeat(animation) {
    if (!this.isDebugMode) return
    
    const animInfo = this.getAnimationInfo(animation)
    this.logDebugEvent('repeat', animInfo)
  }
  
  /**
   * 处理动画错误事件
   */
  handleAnimationError(animation, error) {
    const animInfo = this.getAnimationInfo(animation)
    this.logDebugEvent('error', { ...animInfo, error: error.message })
    
    console.error('Animation error:', error, animInfo)
  }
  
  /**
   * 获取动画信息
   */
  getAnimationInfo(animation) {
    if (!animation) return {}
    
    try {
      const targets = animation.targets ? 
        (Array.isArray(animation.targets) ? animation.targets : [animation.targets]) : 
        []
      
      return {
        id: animation.id || animation._gsap?.id || 'unknown',
        targets: targets.map(target => this.getTargetInfo(target)),
        duration: animation.duration(),
        progress: animation.progress(),
        time: animation.time(),
        totalTime: animation.totalTime(),
        paused: animation.paused(),
        reversed: animation.reversed(),
        timeScale: animation.timeScale(),
        vars: animation.vars,
        data: animation.data || {}
      }
    } catch (error) {
      console.error('Error getting animation info:', error)
      return { error: error.message }
    }
  }
  
  /**
   * 获取目标元素信息
   */
  getTargetInfo(target) {
    if (!target) return 'null'
    
    try {
      // DOM元素
      if (target.nodeType === 1) {
        return {
          type: 'element',
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          selector: this.getElementSelector(target)
        }
      }
      
      // 对象
      if (typeof target === 'object') {
        return {
          type: 'object',
          constructor: target.constructor?.name || 'Object'
        }
      }
      
      // 其他类型
      return {
        type: typeof target,
        value: String(target)
      }
    } catch (error) {
      return { type: 'unknown', error: error.message }
    }
  }
  
  /**
   * 获取元素选择器
   */
  getElementSelector(element) {
    if (!element || !element.tagName) return ''
    
    let selector = element.tagName.toLowerCase()
    
    if (element.id) {
      selector += `#${element.id}`
    } else if (element.className) {
      const classes = element.className.split(' ')
        .filter(c => c.trim() !== '')
        .map(c => `.${c}`)
        .join('')
      
      selector += classes
    }
    
    return selector
  }
  
  /**
   * 记录调试事件
   */
  logDebugEvent(type, data) {
    const logEntry = {
      type,
      timestamp: Date.now(),
      data
    }
    
    this.logHistory.push(logEntry)
    
    // 限制日志历史记录大小
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.shift()
    }
    
    // 更新调试面板
    this.updateDebugPanel()
  }
  
  /**
   * 获取调试日志
   */
  getDebugLogs() {
    return [...this.logHistory]
  }  
 
 /**
   * 创建调试面板
   */
  createDebugPanel() {
    // 检查是否已存在面板
    if (this.debugPanel) {
      this.debugPanel.style.display = 'block'
      return this.debugPanel
    }
    
    // 创建面板容器
    const panel = document.createElement('div')
    panel.id = 'gsap-debug-panel'
    panel.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 400px;
      height: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10001;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `
    
    // 创建标题栏
    const titleBar = document.createElement('div')
    titleBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    `
    
    const title = document.createElement('div')
    title.textContent = 'GSAP Animation Debugger'
    title.style.cssText = `
      font-weight: bold;
      color: #00ff88;
    `
    
    const controls = document.createElement('div')
    controls.style.cssText = `
      display: flex;
      gap: 5px;
    `
    
    // 创建控制按钮
    const buttons = [
      { text: '⏸️', title: 'Pause All', onClick: () => gsap.globalTimeline.pause() },
      { text: '▶️', title: 'Resume All', onClick: () => gsap.globalTimeline.resume() },
      { text: '🔄', title: 'Restart All', onClick: () => gsap.globalTimeline.restart() },
      { text: '❌', title: 'Close', onClick: () => this.removeDebugPanel() }
    ]
    
    buttons.forEach(({ text, title, onClick }) => {
      const button = document.createElement('button')
      button.textContent = text
      button.title = title
      button.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 14px;
        padding: 0 5px;
      `
      button.onclick = onClick
      controls.appendChild(button)
    })
    
    titleBar.appendChild(title)
    titleBar.appendChild(controls)
    panel.appendChild(titleBar)
    
    // 创建标签页
    const tabs = document.createElement('div')
    tabs.style.cssText = `
      display: flex;
      margin-bottom: 10px;
    `
    
    const tabLabels = ['Animations', 'Logs', 'Performance']
    tabLabels.forEach((label, index) => {
      const tab = document.createElement('div')
      tab.textContent = label
      tab.dataset.tab = index
      tab.style.cssText = `
        padding: 5px 10px;
        cursor: pointer;
        border-bottom: 2px solid ${index === 0 ? '#00ff88' : 'transparent'};
        color: ${index === 0 ? '#00ff88' : 'white'};
      `
      tab.onclick = () => this.switchTab(index)
      tabs.appendChild(tab)
    })
    
    panel.appendChild(tabs)
    
    // 创建内容区域
    const content = document.createElement('div')
    content.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: 5px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
    `
    content.id = 'debug-panel-content'
    panel.appendChild(content)
    
    // 创建状态栏
    const statusBar = document.createElement('div')
    statusBar.style.cssText = `
      margin-top: 10px;
      font-size: 10px;
      color: #888;
      display: flex;
      justify-content: space-between;
    `
    statusBar.id = 'debug-panel-status'
    statusBar.innerHTML = `
      <div>Active: <span id="active-animations-count">0</span></div>
      <div>FPS: <span id="current-fps">0</span></div>
      <div>Memory: <span id="memory-usage">0</span> MB</div>
    `
    panel.appendChild(statusBar)
    
    // 添加到页面
    document.body.appendChild(panel)
    this.debugPanel = panel
    
    // 初始化内容
    this.switchTab(0)
    this.startPanelUpdates()
    
    return panel
  }
  
  /**
   * 切换标签页
   */
  switchTab(tabIndex) {
    if (!this.debugPanel) return
    
    // 更新标签样式
    const tabs = this.debugPanel.querySelectorAll('[data-tab]')
    tabs.forEach((tab, index) => {
      if (index === tabIndex) {
        tab.style.borderBottom = '2px solid #00ff88'
        tab.style.color = '#00ff88'
      } else {
        tab.style.borderBottom = '2px solid transparent'
        tab.style.color = 'white'
      }
    })
    
    // 更新内容
    const content = this.debugPanel.querySelector('#debug-panel-content')
    if (!content) return
    
    switch (tabIndex) {
      case 0: // Animations
        this.renderAnimationsTab(content)
        break
      case 1: // Logs
        this.renderLogsTab(content)
        break
      case 2: // Performance
        this.renderPerformanceTab(content)
        break
    }
  }  

  /**
   * 渲染动画标签页
   */
  renderAnimationsTab(container) {
    const animations = this.listAllAnimations()
    
    let html = ''
    
    if (animations.length === 0) {
      html = '<div style="color: #888; text-align: center; padding: 20px;">No active animations</div>'
    } else {
      html = `
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #444;">ID</th>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #444;">Target</th>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #444;">Progress</th>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #444;">Actions</th>
          </tr>
          ${animations.map(anim => `
            <tr>
              <td style="padding: 5px; border-bottom: 1px solid #333;">${anim.id || 'unnamed'}</td>
              <td style="padding: 5px; border-bottom: 1px solid #333;">${this.formatTarget(anim.targets)}</td>
              <td style="padding: 5px; border-bottom: 1px solid #333;">
                <div style="background: #333; height: 10px; width: 100%; border-radius: 5px;">
                  <div style="background: #00ff88; height: 10px; width: ${anim.progress * 100}%; border-radius: 5px;"></div>
                </div>
              </td>
              <td style="padding: 5px; border-bottom: 1px solid #333;">
                <button onclick="__ANIMATION_DEBUGGER__.inspectAnimation('${anim.id}')" style="background: none; border: none; color: #00aaff; cursor: pointer; margin-right: 5px;">Inspect</button>
                ${anim.paused ? 
                  `<button onclick="gsap.getById('${anim.id}').resume()" style="background: none; border: none; color: #00ff88; cursor: pointer;">Resume</button>` : 
                  `<button onclick="gsap.getById('${anim.id}').pause()" style="background: none; border: none; color: #ffaa00; cursor: pointer;">Pause</button>`
                }
              </td>
            </tr>
          `).join('')}
        </table>
      `
    }
    
    container.innerHTML = html
  }
  
  /**
   * 渲染日志标签页
   */
  renderLogsTab(container) {
    const logs = this.getDebugLogs()
    
    let html = ''
    
    if (logs.length === 0) {
      html = '<div style="color: #888; text-align: center; padding: 20px;">No logs yet</div>'
    } else {
      html = `
        <div style="text-align: right; margin-bottom: 5px;">
          <button onclick="__ANIMATION_DEBUGGER__.getLogs().length = 0" style="background: none; border: none; color: #ff5555; cursor: pointer;">Clear Logs</button>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #444;">Time</th>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #444;">Type</th>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #444;">Details</th>
          </tr>
          ${logs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString()
            const typeColor = 
              log.type === 'start' ? '#00ff88' :
              log.type === 'complete' ? '#00aaff' :
              log.type === 'error' ? '#ff5555' : '#ffaa00'
            
            return `
              <tr>
                <td style="padding: 5px; border-bottom: 1px solid #333;">${time}</td>
                <td style="padding: 5px; border-bottom: 1px solid #333; color: ${typeColor};">${log.type}</td>
                <td style="padding: 5px; border-bottom: 1px solid #333;">${log.data.id || 'unnamed'}</td>
              </tr>
            `
          }).join('')}
        </table>
      `
    }
    
    container.innerHTML = html
  }
  
  /**
   * 渲染性能标签页
   */
  renderPerformanceTab(container) {
    const perfStatus = performanceMonitor.getPerformanceReport()
    const systemStatus = this.getSystemStatus()
    
    const html = `
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; margin-bottom: 5px; color: #00ff88;">Performance Level</div>
        <div style="display: flex; align-items: center;">
          <div style="
            width: 10px; 
            height: 10px; 
            border-radius: 50%; 
            background: ${perfStatus.performanceLevel === 'high' ? '#00ff88' : 
                        perfStatus.performanceLevel === 'medium' ? '#ffaa00' : '#ff5555'};
            margin-right: 5px;
          "></div>
          ${perfStatus.performanceLevel.toUpperCase()}
        </div>
      </div>
      
      <div style="margin-bottom: 10px;">
        <div style="font-weight: bold; margin-bottom: 5px; color: #00ff88;">Metrics</div>
        <table style="width: 100%;">
          <tr>
            <td>FPS:</td>
            <td>${perfStatus.metrics.fps}</td>
          </tr>
          <tr>
            <td>Frame Time:</td>
            <td>${perfStatus.metrics.frameTime.toFixed(2)} ms</td>
          </tr>
          <tr>
            <td>Memory:</td>
            <td>${(perfStatus.metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB</td>
          </tr>
          <tr>
            <td>Animations:</td>
            <td>${perfStatus.metrics.animationCount}</td>
          </tr>
          <tr>
            <td>Dropped Frames:</td>
            <td>${perfStatus.metrics.droppedFrames}</td>
          </tr>
        </table>
      </div>
      
      <div>
        <div style="font-weight: bold; margin-bottom: 5px; color: #00ff88;">Actions</div>
        <div style="display: flex; gap: 5px;">
          <button onclick="__ANIMATION_DEBUGGER__.runBenchmark().then(r => console.log('Benchmark:', r))" style="background: #333; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Run Benchmark</button>
          <button onclick="performanceMonitor.resetMetrics()" style="background: #333; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Reset Metrics</button>
        </div>
      </div>
    `
    
    container.innerHTML = html
  }
  
  /**
   * 格式化目标信息
   */
  formatTarget(targets) {
    if (!targets || targets.length === 0) return 'none'
    
    if (targets.length === 1) {
      const target = targets[0]
      if (target.type === 'element') {
        return target.selector || `${target.tagName}${target.id ? `#${target.id}` : ''}`
      }
      return target.type
    }
    
    return `${targets.length} targets`
  }  

  /**
   * 开始面板更新
   */
  startPanelUpdates() {
    if (this.panelUpdateInterval) return
    
    this.panelUpdateInterval = setInterval(() => {
      this.updateDebugPanel()
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
   * 更新调试面板
   */
  updateDebugPanel() {
    if (!this.debugPanel) return
    
    // 更新状态栏
    const activeCount = this.debugPanel.querySelector('#active-animations-count')
    const fpsElement = this.debugPanel.querySelector('#current-fps')
    const memoryElement = this.debugPanel.querySelector('#memory-usage')
    
    if (activeCount) {
      activeCount.textContent = gsap.globalTimeline.getChildren().length
    }
    
    if (fpsElement) {
      fpsElement.textContent = Math.round(performanceMonitor.getCurrentFPS())
    }
    
    if (memoryElement) {
      const memory = performanceMonitor.getMemoryUsage() / 1024 / 1024
      memoryElement.textContent = memory.toFixed(1)
    }
    
    // 更新当前标签页
    const activeTab = this.debugPanel.querySelector('[data-tab][style*="#00ff88"]')
    if (activeTab) {
      const tabIndex = parseInt(activeTab.dataset.tab)
      const content = this.debugPanel.querySelector('#debug-panel-content')
      
      if (content && tabIndex === 0) {
        // 只有动画标签页需要实时更新
        this.renderAnimationsTab(content)
      }
    }
  }
  
  /**
   * 移除调试面板
   */
  removeDebugPanel() {
    if (this.debugPanel) {
      this.debugPanel.style.display = 'none'
    }
    this.stopPanelUpdates()
  }
  
  /**
   * 切换调试面板显示
   */
  toggleDebugPanel() {
    if (this.debugPanel) {
      if (this.debugPanel.style.display === 'none') {
        this.debugPanel.style.display = 'flex'
        this.startPanelUpdates()
      } else {
        this.removeDebugPanel()
      }
    } else {
      this.createDebugPanel()
    }
  }
  
  /**
   * 列出所有动画
   */
  listAllAnimations() {
    const activeAnimations = gsap.globalTimeline.getChildren()
    
    return activeAnimations.map(animation => ({
      id: animation.id || animation._gsap?.id || 'unnamed',
      targets: animation.targets ? 
        (Array.isArray(animation.targets) ? animation.targets.map(t => this.getTargetInfo(t)) : [this.getTargetInfo(animation.targets)]) : 
        [],
      duration: animation.duration(),
      progress: animation.progress(),
      time: animation.time(),
      totalTime: animation.totalTime(),
      paused: animation.paused(),
      reversed: animation.reversed(),
      timeScale: animation.timeScale()
    }))
  }
  
  /**
   * 检查动画断点
   */
  checkAnimationBreakpoints(animation) {
    if (!animation || !animation.id) return
    
    const breakpoint = this.breakpoints.get(animation.id)
    if (!breakpoint) return
    
    // 添加进度更新监听
    const originalProgress = animation.progress
    animation.progress = function(value) {
      const result = originalProgress.apply(this, arguments)
      
      // 检查是否达到断点
      if (arguments.length === 0 && Math.abs(result - breakpoint.progress) < 0.01) {
        if (!breakpoint.triggered) {
          console.log(`Animation breakpoint reached: ${animation.id} at ${(breakpoint.progress * 100).toFixed(0)}%`)
          animation.pause()
          breakpoint.triggered = true
        }
      }
      
      return result
    }
  }
  
  /**
   * 设置动画断点
   */
  setAnimationBreakpoint(animationId, progress) {
    if (!animationId || progress < 0 || progress > 1) {
      console.error('Invalid breakpoint parameters')
      return false
    }
    
    this.breakpoints.set(animationId, {
      progress,
      triggered: false,
      timestamp: Date.now()
    })
    
    console.log(`Breakpoint set for animation "${animationId}" at ${(progress * 100).toFixed(0)}%`)
    return true
  }
  
  /**
   * 清除所有断点
   */
  clearAllBreakpoints() {
    this.breakpoints.clear()
    console.log('All animation breakpoints cleared')
  }
  
  /**
   * 检查动画
   */
  inspectAnimation(animationId) {
    const animation = gsap.getById(animationId)
    if (!animation) {
      console.error(`Animation with id "${animationId}" not found`)
      return null
    }
    
    const info = this.getAnimationInfo(animation)
    console.group(`🔍 Animation Inspector: ${animationId}`)
    console.log('Animation Info:', info)
    console.log('Animation Object:', animation)
    console.log('Targets:', animation.targets)
    console.log('Variables:', animation.vars)
    console.groupEnd()
    
    return info
  }
  
  /**
   * 检查元素
   */
  inspectElement(selector) {
    const elements = document.querySelectorAll(selector)
    if (elements.length === 0) {
      console.error(`No elements found for selector "${selector}"`)
      return null
    }
    
    console.group(`🔍 Element Inspector: ${selector}`)
    elements.forEach((element, index) => {
      console.log(`Element ${index + 1}:`, element)
      
      // 查找应用到此元素的动画
      const activeAnimations = gsap.globalTimeline.getChildren()
      const elementAnimations = activeAnimations.filter(anim => {
        if (!anim.targets) return false
        const targets = Array.isArray(anim.targets) ? anim.targets : [anim.targets]
        return targets.includes(element)
      })
      
      if (elementAnimations.length > 0) {
        console.log('Active animations on this element:', elementAnimations.map(a => a.id || 'unnamed'))
      } else {
        console.log('No active animations on this element')
      }
    })
    console.groupEnd()
    
    return Array.from(elements)
  }
  
  /**
   * 获取系统状态
   */
  getSystemStatus() {
    return {
      gsapVersion: gsap.version,
      activeAnimations: gsap.globalTimeline.getChildren().length,
      globalTimelineTime: gsap.globalTimeline.time(),
      globalTimelineDuration: gsap.globalTimeline.duration(),
      globalTimelinePaused: gsap.globalTimeline.paused(),
      debugMode: this.isDebugMode,
      breakpointsCount: this.breakpoints.size,
      logHistoryCount: this.logHistory.length,
      performance: performanceMonitor.getPerformanceReport(),
      accessibility: accessibilityManager.getAccessibilityStatus()
    }
  }
  
  /**
   * 销毁调试器
   */
  destroy() {
    // 停止面板更新
    this.stopPanelUpdates()
    
    // 移除调试面板
    if (this.debugPanel) {
      this.debugPanel.remove()
      this.debugPanel = null
    }
    
    // 清除全局API
    if (window.__ANIMATION_DEBUGGER__) {
      delete window.__ANIMATION_DEBUGGER__
    }
    
    // 清除数据
    this.logHistory = []
    this.breakpoints.clear()
    this.inspectedElements.clear()
    
    this.isInitialized = false
    console.log('Animation debugger destroyed')
  }
}

// 创建单例实例
const animationDebugger = new AnimationDebugger()

export default animationDebugger