// AccessibilityManager.js - 可访问性管理器
import { gsap } from 'gsap'
import performanceMonitor from './PerformanceMonitor'

/**
 * 可访问性管理器
 * 处理动画的可访问性设置和用户偏好，包括屏幕阅读器支持
 */
class AccessibilityManager {
  constructor() {
    this.preferences = {
      // 动画偏好
      reduceMotion: false,
      animationSpeed: 1, // 1 = 正常, 0.5 = 慢速, 2 = 快速
      enableAnimations: true,
      
      // 视觉偏好
      highContrast: false,
      colorBlindFriendly: false,
      
      // 交互偏好
      largerClickTargets: false,
      reducedTransparency: false,
      
      // 音频偏好
      enableSoundEffects: false,
      soundVolume: 0.5
    }
    
    this.mediaQueries = new Map()
    this.listeners = new Set()
    this.isInitialized = false
    
    // 屏幕阅读器相关
    this.screenReaderDetected = false
    this.ariaLiveRegions = new Map()
    this.animationDescriptions = new Map()
    this.focusTracker = null
    
    // 绑定方法
    this.handleMediaQueryChange = this.handleMediaQueryChange.bind(this)
    this.handleStorageChange = this.handleStorageChange.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    this.handleFocusChange = this.handleFocusChange.bind(this)
  }
  
  /**
   * 初始化可访问性管理器
   */
  initialize() {
    if (this.isInitialized) return
    
    try {
      // 检测系统偏好
      this.detectSystemPreferences()
      
      // 检测屏幕阅读器
      this.detectScreenReader()
      
      // 加载用户偏好
      this.loadUserPreferences()
      
      // 设置媒体查询监听
      this.setupMediaQueryListeners()
      
      // 设置事件监听
      this.setupEventListeners()
      
      // 设置屏幕阅读器支持
      this.setupScreenReaderSupport()
      
      // 应用初始设置
      this.applyPreferences()
      
      this.isInitialized = true
      
      console.log('AccessibilityManager initialized', this.preferences)
    } catch (error) {
      console.error('Failed to initialize AccessibilityManager:', error)
    }
  }
  
  /**
   * 检测屏幕阅读器
   */
  detectScreenReader() {
    // 检测常见的屏幕阅读器
    const userAgent = navigator.userAgent.toLowerCase()
    const screenReaderIndicators = [
      'nvda', 'jaws', 'voiceover', 'talkback', 'orca', 'narrator'
    ]
    
    this.screenReaderDetected = screenReaderIndicators.some(indicator => 
      userAgent.includes(indicator)
    )
    
    // 检测其他屏幕阅读器指示器
    if (!this.screenReaderDetected) {
      // 检查是否存在辅助技术API
      this.screenReaderDetected = !!(
        window.speechSynthesis ||
        navigator.userAgent.match(/\b(screen reader|accessibility)\b/i) ||
        document.querySelector('[aria-live]') ||
        document.querySelector('[role="alert"]') ||
        window.navigator.userAgent.includes('Accessibility')
      )
    }
    
    // 检测高对比度模式（通常与屏幕阅读器一起使用）
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      this.screenReaderDetected = true
    }
    
    console.log('Screen reader detected:', this.screenReaderDetected)
  }
  
  /**
   * 设置屏幕阅读器支持
   */
  setupScreenReaderSupport() {
    if (!this.screenReaderDetected) return
    
    // 创建ARIA live区域用于动画状态通知
    this.createAriaLiveRegions()
    
    // 设置焦点跟踪
    this.setupFocusTracking()
    
    // 为动画元素添加语义化标记
    this.enhanceAnimationSemantics()
    
    // 设置键盘导航支持
    this.setupKeyboardNavigation()
    
    console.log('Screen reader support enabled')
  }
  
  /**
   * 创建ARIA live区域
   */
  createAriaLiveRegions() {
    // 创建polite live区域（非紧急通知）
    const politeRegion = document.createElement('div')
    politeRegion.id = 'animation-status-polite'
    politeRegion.setAttribute('aria-live', 'polite')
    politeRegion.setAttribute('aria-atomic', 'true')
    politeRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    document.body.appendChild(politeRegion)
    this.ariaLiveRegions.set('polite', politeRegion)
    
    // 创建assertive live区域（紧急通知）
    const assertiveRegion = document.createElement('div')
    assertiveRegion.id = 'animation-status-assertive'
    assertiveRegion.setAttribute('aria-live', 'assertive')
    assertiveRegion.setAttribute('aria-atomic', 'true')
    assertiveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    document.body.appendChild(assertiveRegion)
    this.ariaLiveRegions.set('assertive', assertiveRegion)
  }
  
  /**
   * 设置焦点跟踪
   */
  setupFocusTracking() {
    this.focusTracker = {
      currentElement: null,
      previousElement: null
    }
    
    // 监听焦点变化
    document.addEventListener('focusin', this.handleFocusChange)
    document.addEventListener('focusout', this.handleFocusChange)
  }
  
  /**
   * 处理焦点变化
   */
  handleFocusChange(event) {
    if (event.type === 'focusin') {
      this.focusTracker.previousElement = this.focusTracker.currentElement
      this.focusTracker.currentElement = event.target
      
      // 检查焦点元素是否有动画
      this.checkFocusedElementAnimation(event.target)
    } else if (event.type === 'focusout') {
      this.focusTracker.previousElement = this.focusTracker.currentElement
      this.focusTracker.currentElement = null
    }
  }
  
  /**
   * 检查焦点元素的动画
   */
  checkFocusedElementAnimation(element) {
    if (!element || !this.screenReaderDetected) return
    
    // 检查元素是否有活动的动画
    const animations = gsap.getTweensOf(element)
    
    if (animations.length > 0) {
      const description = this.getAnimationDescription(element, animations)
      if (description) {
        this.announceToScreenReader(description, 'polite')
      }
    }
  }
  
  /**
   * 增强动画语义化
   */
  enhanceAnimationSemantics() {
    // 为所有可能有动画的元素添加适当的ARIA属性
    const animatedElements = document.querySelectorAll('[class*="animate"], [class*="gsap"], .animation-target')
    
    animatedElements.forEach(element => {
      // 添加role属性（如果没有的话）
      if (!element.getAttribute('role')) {
        element.setAttribute('role', 'img')
      }
      
      // 添加aria-label（如果没有的话）
      if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
        const description = this.generateElementDescription(element)
        if (description) {
          element.setAttribute('aria-label', description)
        }
      }
      
      // 标记为装饰性（如果是纯装饰动画）
      if (this.isDecorativeAnimation(element)) {
        element.setAttribute('aria-hidden', 'true')
      }
    })
  }
  
  /**
   * 生成元素描述
   */
  generateElementDescription(element) {
    const tagName = element.tagName.toLowerCase()
    const className = element.className
    const id = element.id
    
    // 基于元素类型生成描述
    if (className.includes('loading')) {
      return 'Loading animation'
    } else if (className.includes('progress')) {
      return 'Progress indicator'
    } else if (className.includes('chart') || className.includes('graph')) {
      return 'Animated chart or graph'
    } else if (className.includes('button')) {
      return 'Interactive button with animation'
    } else if (tagName === 'img') {
      return 'Animated image'
    } else if (id) {
      return `Animated element: ${id}`
    }
    
    return 'Animated content'
  }
  
  /**
   * 判断是否为装饰性动画
   */
  isDecorativeAnimation(element) {
    const decorativeClasses = [
      'decoration', 'ornament', 'background-animation', 
      'particle', 'sparkle', 'glow', 'pulse-decoration'
    ]
    
    return decorativeClasses.some(cls => 
      element.className.includes(cls)
    )
  }
  
  /**
   * 设置键盘导航支持
   */
  setupKeyboardNavigation() {
    // 为动画控制添加键盘快捷键
    document.addEventListener('keydown', (event) => {
      // Ctrl+Shift+A: 切换动画开关
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        this.toggleAnimations()
        this.announceToScreenReader(
          this.preferences.enableAnimations ? 'Animations enabled' : 'Animations disabled',
          'assertive'
        )
      }
      
      // Ctrl+Shift+S: 调整动画速度
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        this.cycleAnimationSpeed()
      }
      
      // Escape: 停止所有动画
      if (event.key === 'Escape' && event.ctrlKey) {
        event.preventDefault()
        this.stopAllAnimations()
        this.announceToScreenReader('All animations stopped', 'assertive')
      }
    })
  }
  
  /**
   * 切换动画开关
   */
  toggleAnimations() {
    this.updatePreference('enableAnimations', !this.preferences.enableAnimations)
  }
  
  /**
   * 循环调整动画速度
   */
  cycleAnimationSpeed() {
    const speeds = [0.5, 1, 1.5, 2]
    const currentIndex = speeds.indexOf(this.preferences.animationSpeed)
    const nextIndex = (currentIndex + 1) % speeds.length
    const newSpeed = speeds[nextIndex]
    
    this.updatePreference('animationSpeed', newSpeed)
    this.announceToScreenReader(`Animation speed set to ${newSpeed}x`, 'polite')
  }
  
  /**
   * 停止所有动画
   */
  stopAllAnimations() {
    gsap.globalTimeline.pause()
    
    // 3秒后自动恢复
    setTimeout(() => {
      if (this.preferences.enableAnimations) {
        gsap.globalTimeline.resume()
        this.announceToScreenReader('Animations resumed', 'polite')
      }
    }, 3000)
  }
  
  /**
   * 向屏幕阅读器宣布信息
   */
  announceToScreenReader(message, priority = 'polite') {
    if (!this.screenReaderDetected || !message) return
    
    const region = this.ariaLiveRegions.get(priority)
    if (region) {
      // 清空区域然后设置新消息
      region.textContent = ''
      setTimeout(() => {
        region.textContent = message
      }, 100)
      
      // 5秒后清空消息
      setTimeout(() => {
        region.textContent = ''
      }, 5000)
    }
  }
  
  /**
   * 获取动画描述
   */
  getAnimationDescription(element, animations) {
    const elementDesc = this.generateElementDescription(element)
    
    if (animations.length === 1) {
      const animation = animations[0]
      const duration = animation.duration()
      const progress = Math.round(animation.progress() * 100)
      
      return `${elementDesc} is animating, ${progress}% complete, ${duration.toFixed(1)} seconds duration`
    } else {
      return `${elementDesc} has ${animations.length} active animations`
    }
  }
  
  /**
   * 注册动画描述
   */
  registerAnimationDescription(elementId, description) {
    this.animationDescriptions.set(elementId, description)
  }
  
  /**
   * 获取注册的动画描述
   */
  getRegisteredDescription(elementId) {
    return this.animationDescriptions.get(elementId)
  }
  
  /**
   * 为动画添加可访问性支持
   */
  makeAnimationAccessible(element, options = {}) {
    const {
      description = null,
      isDecorative = false,
      announceStart = false,
      announceEnd = false,
      allowSkip = true
    } = options
    
    if (!element) return
    
    // 设置基本的ARIA属性
    if (isDecorative) {
      element.setAttribute('aria-hidden', 'true')
    } else {
      if (description) {
        element.setAttribute('aria-label', description)
      }
      
      // 添加动画状态
      element.setAttribute('aria-busy', 'false')
    }
    
    // 如果允许跳过，添加跳过按钮
    if (allowSkip && !isDecorative) {
      this.addSkipButton(element)
    }
    
    // 监听动画事件
    const animations = gsap.getTweensOf(element)
    animations.forEach(animation => {
      if (announceStart) {
        animation.eventCallback('onStart', () => {
          element.setAttribute('aria-busy', 'true')
          if (description && this.screenReaderDetected) {
            this.announceToScreenReader(`${description} started`, 'polite')
          }
        })
      }
      
      if (announceEnd) {
        animation.eventCallback('onComplete', () => {
          element.setAttribute('aria-busy', 'false')
          if (description && this.screenReaderDetected) {
            this.announceToScreenReader(`${description} completed`, 'polite')
          }
        })
      }
    })
  }
  
  /**
   * 添加跳过按钮
   */
  addSkipButton(element) {
    if (!this.screenReaderDetected) return
    
    const skipButton = document.createElement('button')
    skipButton.textContent = 'Skip animation'
    skipButton.className = 'skip-animation-button'
    skipButton.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    
    skipButton.addEventListener('focus', () => {
      skipButton.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 10000;
        padding: 5px 10px;
        background: #000;
        color: #fff;
        border: 2px solid #fff;
        border-radius: 4px;
      `
    })
    
    skipButton.addEventListener('blur', () => {
      skipButton.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
    })
    
    skipButton.addEventListener('click', () => {
      const animations = gsap.getTweensOf(element)
      animations.forEach(animation => animation.progress(1))
      this.announceToScreenReader('Animation skipped', 'polite')
    })
    
    element.parentNode.insertBefore(skipButton, element)
  }
  
  /**
   * 检测系统可访问性偏好
   */
  detectSystemPreferences() {
    // 检测减少动画偏好
    if (window.matchMedia) {
      const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      this.preferences.reduceMotion = reduceMotionQuery.matches
      
      // 检测高对比度偏好
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
      this.preferences.highContrast = highContrastQuery.matches
      
      // 检测透明度偏好
      const reducedTransparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)')
      this.preferences.reducedTransparency = reducedTransparencyQuery.matches
      
      // 检测颜色方案偏好
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.preferences.darkMode = darkModeQuery.matches
    }
    
    // 检测设备性能
    const performanceLevel = performanceMonitor.performanceLevel
    if (performanceLevel === 'low') {
      this.preferences.reduceMotion = true
      this.preferences.animationSpeed = 0.5
    }
  }
  
  /**
   * 设置媒体查询监听器
   */
  setupMediaQueryListeners() {
    if (!window.matchMedia) return
    
    const queries = [
      {
        query: '(prefers-reduced-motion: reduce)',
        property: 'reduceMotion'
      },
      {
        query: '(prefers-contrast: high)',
        property: 'highContrast'
      },
      {
        query: '(prefers-reduced-transparency: reduce)',
        property: 'reducedTransparency'
      },
      {
        query: '(prefers-color-scheme: dark)',
        property: 'darkMode'
      }
    ]
    
    queries.forEach(({ query, property }) => {
      try {
        const mediaQuery = window.matchMedia(query)
        
        // 存储媒体查询对象
        this.mediaQueries.set(property, mediaQuery)
        
        // 添加监听器
        const listener = (e) => this.handleMediaQueryChange(property, e.matches)
        mediaQuery.addListener(listener)
        
        // 存储监听器以便后续清理
        this.listeners.add({ mediaQuery, listener })
      } catch (error) {
        console.warn(`Failed to setup media query for ${property}:`, error)
      }
    })
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听localStorage变化
    window.addEventListener('storage', this.handleStorageChange)
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    
    // 监听窗口焦点变化
    window.addEventListener('focus', this.handleVisibilityChange)
    window.addEventListener('blur', this.handleVisibilityChange)
  }
  
  /**
   * 处理媒体查询变化
   */
  handleMediaQueryChange(property, matches) {
    const oldValue = this.preferences[property]
    this.preferences[property] = matches
    
    // 如果偏好发生变化，重新应用设置
    if (oldValue !== matches) {
      this.applyPreferences()
      this.notifyListeners('systemPreferenceChanged', { property, value: matches })
      
      // 向屏幕阅读器宣布重要变化
      if (this.screenReaderDetected) {
        if (property === 'reduceMotion' && matches) {
          this.announceToScreenReader('Reduced motion preference detected, animations simplified', 'polite')
        } else if (property === 'highContrast' && matches) {
          this.announceToScreenReader('High contrast mode enabled', 'polite')
        }
      }
    }
  }
  
  /**
   * 处理存储变化
   */
  handleStorageChange(event) {
    if (event.key === 'accessibility-preferences') {
      this.loadUserPreferences()
      this.applyPreferences()
      this.notifyListeners('userPreferenceChanged', this.preferences)
    }
  }
  
  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange() {
    const isVisible = !document.hidden && document.hasFocus()
    
    if (!isVisible && this.preferences.reduceMotion) {
      // 页面不可见时暂停所有动画
      gsap.globalTimeline.pause()
    } else if (isVisible) {
      // 页面可见时恢复动画
      gsap.globalTimeline.resume()
    }
  }
  
  /**
   * 加载用户偏好设置
   */
  loadUserPreferences() {
    try {
      const stored = localStorage.getItem('accessibility-preferences')
      if (stored) {
        const userPrefs = JSON.parse(stored)
        this.preferences = { ...this.preferences, ...userPrefs }
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error)
    }
  }
  
  /**
   * 保存用户偏好设置
   */
  saveUserPreferences() {
    try {
      // 只保存用户可控制的偏好，不保存系统检测的偏好
      const userPrefs = {
        animationSpeed: this.preferences.animationSpeed,
        enableAnimations: this.preferences.enableAnimations,
        colorBlindFriendly: this.preferences.colorBlindFriendly,
        largerClickTargets: this.preferences.largerClickTargets,
        enableSoundEffects: this.preferences.enableSoundEffects,
        soundVolume: this.preferences.soundVolume
      }
      
      localStorage.setItem('accessibility-preferences', JSON.stringify(userPrefs))
    } catch (error) {
      console.warn('Failed to save user preferences:', error)
    }
  }
  
  /**
   * 应用可访问性偏好
   */
  applyPreferences() {
    const root = document.documentElement
    
    // 应用动画偏好
    this.applyAnimationPreferences()
    
    // 应用视觉偏好
    this.applyVisualPreferences(root)
    
    // 应用交互偏好
    this.applyInteractionPreferences(root)
    
    // 通知监听器
    this.notifyListeners('preferencesApplied', this.preferences)
  }
  
  /**
   * 应用动画偏好
   */
  applyAnimationPreferences() {
    const { reduceMotion, animationSpeed, enableAnimations } = this.preferences
    
    if (!enableAnimations || reduceMotion) {
      // 禁用或大幅简化动画
      gsap.globalTimeline.timeScale(0.1)
      gsap.defaults({ duration: 0.1, ease: "none" })
    } else {
      // 应用动画速度
      gsap.globalTimeline.timeScale(animationSpeed)
      gsap.defaults({ duration: 0.5, ease: "power2.out" })
    }
    
    // 设置CSS变量
    document.documentElement.style.setProperty(
      '--animation-duration-multiplier', 
      reduceMotion ? '0.01' : (1 / animationSpeed).toString()
    )
    
    document.documentElement.style.setProperty(
      '--animation-enabled', 
      enableAnimations ? '1' : '0'
    )
  }
  
  /**
   * 应用视觉偏好
   */
  applyVisualPreferences(root) {
    const { highContrast, colorBlindFriendly, reducedTransparency } = this.preferences
    
    // 高对比度
    root.classList.toggle('high-contrast', highContrast)
    
    // 色盲友好
    root.classList.toggle('colorblind-friendly', colorBlindFriendly)
    
    // 减少透明度
    root.classList.toggle('reduced-transparency', reducedTransparency)
    
    // 设置CSS变量
    root.style.setProperty('--contrast-multiplier', highContrast ? '1.5' : '1')
    root.style.setProperty('--transparency-multiplier', reducedTransparency ? '0.1' : '1')
  }
  
  /**
   * 应用交互偏好
   */
  applyInteractionPreferences(root) {
    const { largerClickTargets } = this.preferences
    
    // 更大的点击目标
    root.classList.toggle('larger-click-targets', largerClickTargets)
    
    // 设置CSS变量
    root.style.setProperty('--click-target-size-multiplier', largerClickTargets ? '1.5' : '1')
  }
  
  /**
   * 获取当前偏好设置
   */
  getPreferences() {
    return { ...this.preferences }
  }
  
  /**
   * 更新偏好设置
   */
  updatePreference(key, value) {
    if (key in this.preferences) {
      const oldValue = this.preferences[key]
      this.preferences[key] = value
      
      // 保存用户偏好
      this.saveUserPreferences()
      
      // 重新应用设置
      this.applyPreferences()
      
      // 通知监听器
      this.notifyListeners('preferenceUpdated', { key, value, oldValue })
      
      return true
    }
    return false
  }
  
  /**
   * 批量更新偏好设置
   */
  updatePreferences(preferences) {
    const changes = {}
    
    Object.entries(preferences).forEach(([key, value]) => {
      if (key in this.preferences && this.preferences[key] !== value) {
        changes[key] = { old: this.preferences[key], new: value }
        this.preferences[key] = value
      }
    })
    
    if (Object.keys(changes).length > 0) {
      // 保存用户偏好
      this.saveUserPreferences()
      
      // 重新应用设置
      this.applyPreferences()
      
      // 通知监听器
      this.notifyListeners('preferencesUpdated', changes)
    }
  }
  
  /**
   * 检查是否应该减少动画
   */
  shouldReduceMotion() {
    return this.preferences.reduceMotion || !this.preferences.enableAnimations
  }
  
  /**
   * 获取动画持续时间倍数
   */
  getAnimationDurationMultiplier() {
    if (this.shouldReduceMotion()) {
      return 0.01 // 几乎瞬间完成
    }
    return 1 / this.preferences.animationSpeed
  }
  
  /**
   * 获取适合的缓动函数
   */
  getAccessibleEasing() {
    return this.shouldReduceMotion() ? "none" : "power2.out"
  }
  
  /**
   * 添加偏好变化监听器
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback)
      return () => this.listeners.delete(callback)
    }
  }
  
  /**
   * 移除偏好变化监听器
   */
  removeListener(callback) {
    this.listeners.delete(callback)
  }
  
  /**
   * 通知所有监听器
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        if (typeof callback === 'function') {
          callback(event, data)
        } else if (callback.callback && typeof callback.callback === 'function') {
          callback.callback(event, data)
        }
      } catch (error) {
        console.error('Error in accessibility listener:', error)
      }
    })
  }
  
  /**
   * 重置为默认设置
   */
  resetToDefaults() {
    // 保留系统检测的偏好，重置用户设置
    const systemPrefs = {
      reduceMotion: this.mediaQueries.get('reduceMotion')?.matches || false,
      highContrast: this.mediaQueries.get('highContrast')?.matches || false,
      reducedTransparency: this.mediaQueries.get('reducedTransparency')?.matches || false,
      darkMode: this.mediaQueries.get('darkMode')?.matches || false
    }
    
    this.preferences = {
      ...this.preferences,
      ...systemPrefs,
      animationSpeed: 1,
      enableAnimations: true,
      colorBlindFriendly: false,
      largerClickTargets: false,
      enableSoundEffects: false,
      soundVolume: 0.5
    }
    
    // 清除存储的用户偏好
    try {
      localStorage.removeItem('accessibility-preferences')
    } catch (error) {
      console.warn('Failed to clear stored preferences:', error)
    }
    
    // 重新应用设置
    this.applyPreferences()
    
    // 通知监听器
    this.notifyListeners('preferencesReset', this.preferences)
    
    // 向屏幕阅读器宣布重置
    if (this.screenReaderDetected) {
      this.announceToScreenReader('Accessibility preferences reset to defaults', 'polite')
    }
  }
  
  /**
   * 销毁管理器
   */
  destroy() {
    // 移除事件监听器
    window.removeEventListener('storage', this.handleStorageChange)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('focus', this.handleVisibilityChange)
    window.removeEventListener('blur', this.handleVisibilityChange)
    document.removeEventListener('focusin', this.handleFocusChange)
    document.removeEventListener('focusout', this.handleFocusChange)
    
    // 移除媒体查询监听器
    this.listeners.forEach(({ mediaQuery, listener }) => {
      if (mediaQuery && mediaQuery.removeListener) {
        mediaQuery.removeListener(listener)
      }
    })
    
    // 清理ARIA live区域
    this.ariaLiveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region)
      }
    })
    
    // 清理
    this.mediaQueries.clear()
    this.listeners.clear()
    this.ariaLiveRegions.clear()
    this.animationDescriptions.clear()
    this.isInitialized = false
  }
}

// 创建单例实例
const accessibilityManager = new AccessibilityManager()

// 自动初始化
if (typeof window !== 'undefined') {
  // 在DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      accessibilityManager.initialize()
    })
  } else {
    accessibilityManager.initialize()
  }
}

export default accessibilityManager