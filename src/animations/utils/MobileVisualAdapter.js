// MobileVisualAdapter.js - 移动端视觉适配器
import { gsap } from 'gsap'
import { getThemeConfig } from '../presets/themeAnimations'
import mobilePerformanceOptimizer from '../core/MobilePerformanceOptimizer'

/**
 * 移动端视觉适配器
 * 处理移动端的视觉效果适配和优化
 */
class MobileVisualAdapter {
  constructor() {
    this.isInitialized = false
    this.currentOrientation = this.getOrientation()
    this.screenInfo = this.getScreenInfo()
    this.adaptations = new Map()
    
    // 视觉适配配置
    this.adaptationConfig = {
      // 动画时长适配
      duration: {
        mobile: 0.4,    // 移动端基础时长
        tablet: 0.5,    // 平板端时长
        desktop: 0.6    // 桌面端时长
      },
      
      // 动画强度适配
      intensity: {
        small: 0.7,     // 小屏幕强度
        medium: 0.85,   // 中等屏幕强度
        large: 1.0      // 大屏幕强度
      },
      
      // 视觉效果适配
      effects: {
        blur: {
          mobile: 2,    // 移动端模糊强度
          tablet: 4,    // 平板端模糊强度
          desktop: 6    // 桌面端模糊强度
        },
        shadow: {
          mobile: '0 2px 8px rgba(0,0,0,0.1)',
          tablet: '0 4px 12px rgba(0,0,0,0.15)',
          desktop: '0 6px 16px rgba(0,0,0,0.2)'
        },
        scale: {
          mobile: 1.02,   // 移动端缩放
          tablet: 1.05,   // 平板端缩放
          desktop: 1.08   // 桌面端缩放
        }
      }
    }
    
    // 绑定方法
    this.handleOrientationChange = this.handleOrientationChange.bind(this)
    this.handleResize = this.handleResize.bind(this)
  }
  
  /**
   * 初始化移动端视觉适配器
   */
  initialize() {
    if (this.isInitialized) return
    
    try {
      // 检测设备信息
      this.detectDeviceCapabilities()
      
      // 应用基础适配
      this.applyBaseAdaptations()
      
      // 设置响应式断点
      this.setupResponsiveBreakpoints()
      
      // 设置事件监听
      this.setupEventListeners()
      
      // 应用主题适配
      this.applyThemeAdaptations()
      
      this.isInitialized = true
      
      console.log('📱 Mobile visual adapter initialized:', {
        screen: this.screenInfo,
        orientation: this.currentOrientation
      })
    } catch (error) {
      console.error('Failed to initialize mobile visual adapter:', error)
    }
  }
  
  /**
   * 检测设备能力
   */
  detectDeviceCapabilities() {
    const userAgent = navigator.userAgent
    
    this.deviceCapabilities = {
      // 设备类型
      isMobile: /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad/.test(userAgent) || (/Android/.test(userAgent) && !/Mobile/.test(userAgent)),
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      
      // 屏幕特性
      hasRetinaDisplay: window.devicePixelRatio >= 2,
      hasHighDPI: window.devicePixelRatio >= 3,
      
      // 交互能力
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      hasHover: window.matchMedia('(hover: hover)').matches,
      
      // 动画支持
      supportsTransform3D: this.checkTransform3DSupport(),
      supportsWillChange: 'willChange' in document.documentElement.style,
      supportsBackdropFilter: 'backdropFilter' in document.documentElement.style,
      
      // 性能特性
      hasGoodPerformance: this.assessPerformance()
    }
  }
  
  /**
   * 检查3D变换支持
   */
  checkTransform3DSupport() {
    const el = document.createElement('div')
    el.style.transform = 'translate3d(0,0,0)'
    return el.style.transform !== ''
  }
  
  /**
   * 评估设备性能
   */
  assessPerformance() {
    const memory = navigator.deviceMemory || 2
    const cores = navigator.hardwareConcurrency || 2
    const pixelRatio = window.devicePixelRatio || 1
    
    return memory >= 4 && cores >= 4 && pixelRatio >= 2
  }
  
  /**
   * 获取屏幕信息
   */
  getScreenInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      size: this.getScreenSize()
    }
  }
  
  /**
   * 获取屏幕尺寸分类
   */
  getScreenSize() {
    const width = window.innerWidth
    
    if (width < 480) return 'small'      // 小屏手机
    if (width < 768) return 'medium'     // 大屏手机
    if (width < 1024) return 'large'     // 平板
    return 'xlarge'                      // 桌面
  }
  
  /**
   * 获取设备方向
   */
  getOrientation() {
    if (window.screen && window.screen.orientation) {
      return window.screen.orientation.angle === 0 || window.screen.orientation.angle === 180 
        ? 'portrait' : 'landscape'
    }
    
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }
  
  /**
   * 应用基础适配
   */
  applyBaseAdaptations() {
    const root = document.documentElement
    const { deviceCapabilities, screenInfo } = this
    
    // 设置基础CSS变量
    root.style.setProperty('--screen-width', `${screenInfo.width}px`)
    root.style.setProperty('--screen-height', `${screenInfo.height}px`)
    root.style.setProperty('--pixel-ratio', screenInfo.pixelRatio.toString())
    root.style.setProperty('--screen-size', screenInfo.size)
    
    // 设置动画适配变量
    const durationMultiplier = this.getDurationMultiplier()
    const intensityMultiplier = this.getIntensityMultiplier()
    
    root.style.setProperty('--mobile-duration-multiplier', durationMultiplier.toString())
    root.style.setProperty('--mobile-intensity-multiplier', intensityMultiplier.toString())
    
    // 设置视觉效果变量
    const effects = this.getAdaptedEffects()
    root.style.setProperty('--mobile-blur-radius', `${effects.blur}px`)
    root.style.setProperty('--mobile-shadow', effects.shadow)
    root.style.setProperty('--mobile-scale-factor', effects.scale.toString())
    
    // 添加设备类名
    root.classList.add(`screen-${screenInfo.size}`)
    root.classList.add(`orientation-${this.currentOrientation}`)
    
    if (deviceCapabilities.isMobile) root.classList.add('mobile-device')
    if (deviceCapabilities.isTablet) root.classList.add('tablet-device')
    if (deviceCapabilities.hasRetinaDisplay) root.classList.add('retina-display')
    if (deviceCapabilities.hasTouch) root.classList.add('touch-device')
    if (!deviceCapabilities.hasHover) root.classList.add('no-hover')
  }
  
  /**
   * 获取动画时长倍数
   */
  getDurationMultiplier() {
    const { screenInfo, deviceCapabilities } = this
    
    if (deviceCapabilities.isMobile && screenInfo.size === 'small') {
      return 0.7  // 小屏手机动画更快
    } else if (deviceCapabilities.isTablet) {
      return 0.85 // 平板动画适中
    } else if (screenInfo.size === 'medium') {
      return 0.8  // 大屏手机
    }
    
    return 1.0 // 桌面端正常速度
  }
  
  /**
   * 获取动画强度倍数
   */
  getIntensityMultiplier() {
    const { screenInfo } = this
    
    switch (screenInfo.size) {
      case 'small': return 0.7
      case 'medium': return 0.85
      case 'large': return 0.95
      default: return 1.0
    }
  }
  
  /**
   * 获取适配后的视觉效果
   */
  getAdaptedEffects() {
    const { screenInfo, deviceCapabilities } = this
    const { effects } = this.adaptationConfig
    
    let deviceType = 'desktop'
    if (deviceCapabilities.isMobile) deviceType = 'mobile'
    else if (deviceCapabilities.isTablet) deviceType = 'tablet'
    
    return {
      blur: effects.blur[deviceType],
      shadow: effects.shadow[deviceType],
      scale: effects.scale[deviceType]
    }
  }
  
  /**
   * 设置响应式断点
   */
  setupResponsiveBreakpoints() {
    const breakpoints = [
      { name: 'small', query: '(max-width: 479px)' },
      { name: 'medium', query: '(min-width: 480px) and (max-width: 767px)' },
      { name: 'large', query: '(min-width: 768px) and (max-width: 1023px)' },
      { name: 'xlarge', query: '(min-width: 1024px)' }
    ]
    
    breakpoints.forEach(({ name, query }) => {
      const mediaQuery = window.matchMedia(query)
      
      const handleBreakpointChange = (e) => {
        if (e.matches) {
          this.handleBreakpointChange(name)
        }
      }
      
      mediaQuery.addListener(handleBreakpointChange)
      
      // 初始检查
      if (mediaQuery.matches) {
        this.handleBreakpointChange(name)
      }
    })
  }
  
  /**
   * 处理断点变化
   */
  handleBreakpointChange(breakpoint) {
    console.log(`Breakpoint changed to: ${breakpoint}`)
    
    // 更新屏幕信息
    this.screenInfo = this.getScreenInfo()
    
    // 重新应用适配
    this.applyBaseAdaptations()
    
    // 调整现有动画
    this.adjustExistingAnimations()
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('mobileBreakpointChange', {
      detail: { breakpoint, screenInfo: this.screenInfo }
    }))
  }
  
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 方向变化监听
    window.addEventListener('orientationchange', this.handleOrientationChange)
    
    // 窗口大小变化监听
    window.addEventListener('resize', this.handleResize)
    
    // 设备像素比变化监听 (缩放)
    if (window.matchMedia) {
      const pixelRatioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      pixelRatioQuery.addListener(() => {
        this.handlePixelRatioChange()
      })
    }
  }
  
  /**
   * 处理方向变化
   */
  handleOrientationChange() {
    setTimeout(() => {
      const newOrientation = this.getOrientation()
      
      if (newOrientation !== this.currentOrientation) {
        console.log(`Orientation changed: ${this.currentOrientation} → ${newOrientation}`)
        
        const oldOrientation = this.currentOrientation
        this.currentOrientation = newOrientation
        
        // 更新CSS类
        document.documentElement.classList.remove(`orientation-${oldOrientation}`)
        document.documentElement.classList.add(`orientation-${newOrientation}`)
        
        // 应用方向特定的适配
        this.applyOrientationAdaptations(newOrientation, oldOrientation)
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('mobileOrientationChange', {
          detail: { 
            newOrientation, 
            oldOrientation,
            screenInfo: this.getScreenInfo()
          }
        }))
      }
    }, 100) // 延迟以确保屏幕尺寸已更新
  }
  
  /**
   * 处理窗口大小变化
   */
  handleResize() {
    // 防抖处理
    clearTimeout(this.resizeTimeout)
    this.resizeTimeout = setTimeout(() => {
      const newScreenInfo = this.getScreenInfo()
      
      if (newScreenInfo.size !== this.screenInfo.size) {
        console.log(`Screen size changed: ${this.screenInfo.size} → ${newScreenInfo.size}`)
        
        this.screenInfo = newScreenInfo
        this.applyBaseAdaptations()
        this.adjustExistingAnimations()
      }
    }, 150)
  }
  
  /**
   * 处理像素比变化
   */
  handlePixelRatioChange() {
    console.log('Pixel ratio changed, updating adaptations')
    this.screenInfo = this.getScreenInfo()
    this.detectDeviceCapabilities()
    this.applyBaseAdaptations()
  }
  
  /**
   * 应用方向特定的适配
   */
  applyOrientationAdaptations(newOrientation, oldOrientation) {
    const root = document.documentElement
    
    // 更新屏幕信息
    this.screenInfo = this.getScreenInfo()
    root.style.setProperty('--screen-width', `${this.screenInfo.width}px`)
    root.style.setProperty('--screen-height', `${this.screenInfo.height}px`)
    
    // 方向变化动画
    if (this.deviceCapabilities.isMobile) {
      this.createOrientationTransition(newOrientation, oldOrientation)
    }
    
    // 刷新ScrollTrigger
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh()
    }
  }
  
  /**
   * 创建方向变化过渡动画
   */
  createOrientationTransition(newOrientation, oldOrientation) {
    const elements = document.querySelectorAll('.mobile-adaptive')
    
    if (elements.length === 0) return
    
    const timeline = gsap.timeline()
    
    // 淡出当前布局
    timeline.to(elements, {
      opacity: 0.7,
      scale: 0.95,
      duration: 0.2,
      ease: "power2.inOut"
    })
    
    // 等待布局调整
    .set({}, {}, "+=0.1")
    
    // 淡入新布局
    .to(elements, {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: "back.out(1.7)"
    })
  }
  
  /**
   * 调整现有动画
   */
  adjustExistingAnimations() {
    const durationMultiplier = this.getDurationMultiplier()
    const intensityMultiplier = this.getIntensityMultiplier()
    
    // 调整GSAP全局时间缩放
    gsap.globalTimeline.timeScale(1 / durationMultiplier)
    
    // 更新CSS变量
    const root = document.documentElement
    root.style.setProperty('--mobile-duration-multiplier', durationMultiplier.toString())
    root.style.setProperty('--mobile-intensity-multiplier', intensityMultiplier.toString())
  }
  
  /**
   * 应用主题适配
   */
  applyThemeAdaptations(theme = 'female') {
    const themeConfig = getThemeConfig(theme)
    const adaptedConfig = this.adaptThemeForMobile(themeConfig)
    
    // 应用适配后的主题配置
    const root = document.documentElement
    Object.entries(adaptedConfig.colors).forEach(([key, value]) => {
      root.style.setProperty(`--mobile-theme-${key}`, value)
    })
    
    // 存储适配配置
    this.adaptations.set(`theme-${theme}`, adaptedConfig)
  }
  
  /**
   * 为移动端适配主题
   */
  adaptThemeForMobile(themeConfig) {
    const { screenInfo, deviceCapabilities } = this
    const adaptedConfig = JSON.parse(JSON.stringify(themeConfig)) // 深拷贝
    
    // 调整颜色对比度 (小屏幕需要更高对比度)
    if (screenInfo.size === 'small') {
      adaptedConfig.colors = this.adjustColorsForSmallScreen(adaptedConfig.colors)
    }
    
    // 调整动画时间
    const durationMultiplier = this.getDurationMultiplier()
    Object.keys(adaptedConfig.timing).forEach(key => {
      adaptedConfig.timing[key] *= durationMultiplier
    })
    
    // 调整缓动函数 (移动端使用更简单的缓动)
    if (deviceCapabilities.isMobile && !deviceCapabilities.hasGoodPerformance) {
      adaptedConfig.easing = {
        primary: "power2.out",
        bounce: "power2.out",
        elastic: "power2.out"
      }
    }
    
    return adaptedConfig
  }
  
  /**
   * 为小屏幕调整颜色
   */
  adjustColorsForSmallScreen(colors) {
    const adjustedColors = { ...colors }
    
    // 增加主色调的饱和度和亮度
    Object.keys(adjustedColors).forEach(key => {
      if (key !== 'highlight' && key !== 'shadow') {
        adjustedColors[key] = this.adjustColorContrast(adjustedColors[key], 1.1)
      }
    })
    
    return adjustedColors
  }
  
  /**
   * 调整颜色对比度
   */
  adjustColorContrast(color, factor) {
    // 简单的颜色调整逻辑
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      const adjustedR = Math.min(255, Math.round(r * factor))
      const adjustedG = Math.min(255, Math.round(g * factor))
      const adjustedB = Math.min(255, Math.round(b * factor))
      
      return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`
    }
    
    return color
  }
  
  /**
   * 创建移动端优化的动画
   */
  createMobileOptimizedAnimation(element, animation, options = {}) {
    const { deviceCapabilities, screenInfo } = this
    const durationMultiplier = this.getDurationMultiplier()
    const intensityMultiplier = this.getIntensityMultiplier()
    
    // 调整动画参数
    const optimizedAnimation = { ...animation }
    
    if (optimizedAnimation.duration) {
      optimizedAnimation.duration *= durationMultiplier
    }
    
    if (optimizedAnimation.y) {
      optimizedAnimation.y *= intensityMultiplier
    }
    
    if (optimizedAnimation.x) {
      optimizedAnimation.x *= intensityMultiplier
    }
    
    if (optimizedAnimation.scale) {
      const scaleAdjustment = (optimizedAnimation.scale - 1) * intensityMultiplier + 1
      optimizedAnimation.scale = scaleAdjustment
    }
    
    // 移动端性能优化
    if (deviceCapabilities.isMobile) {
      optimizedAnimation.force3D = deviceCapabilities.supportsTransform3D
      
      if (!deviceCapabilities.hasGoodPerformance) {
        // 低性能设备简化动画
        optimizedAnimation.ease = "power2.out"
        delete optimizedAnimation.rotation
        delete optimizedAnimation.skewX
        delete optimizedAnimation.skewY
      }
    }
    
    return gsap.to(element, optimizedAnimation)
  }
  
  /**
   * 获取当前适配状态
   */
  getAdaptationStatus() {
    return {
      isInitialized: this.isInitialized,
      deviceCapabilities: this.deviceCapabilities,
      screenInfo: this.screenInfo,
      currentOrientation: this.currentOrientation,
      adaptations: Array.from(this.adaptations.keys()),
      durationMultiplier: this.getDurationMultiplier(),
      intensityMultiplier: this.getIntensityMultiplier()
    }
  }
  
  /**
   * 销毁适配器
   */
  destroy() {
    // 移除事件监听
    window.removeEventListener('orientationchange', this.handleOrientationChange)
    window.removeEventListener('resize', this.handleResize)
    
    // 清理定时器
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }
    
    // 清理适配配置
    this.adaptations.clear()
    
    this.isInitialized = false
  }
}

// 创建单例实例
const mobileVisualAdapter = new MobileVisualAdapter()

// 自动初始化
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileVisualAdapter.initialize()
    })
  } else {
    mobileVisualAdapter.initialize()
  }
}

export default mobileVisualAdapter