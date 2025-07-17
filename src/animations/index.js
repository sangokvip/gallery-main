// GSAP动画系统入口文件
// 统一导出所有动画相关的组件、Hook和工具

// 核心系统
export { default as gsapManager } from './core/GSAPManager'
export { default as animationController } from './core/AnimationController'
export { default as performanceMonitor } from './core/PerformanceMonitor'
export { default as accessibilityManager } from './core/AccessibilityManager'
export { default as mobilePerformanceOptimizer } from './core/MobilePerformanceOptimizer'
export { default as animationResourceManager } from './core/AnimationResourceManager'

// 工具类
export { default as mobileVisualAdapter } from './utils/MobileVisualAdapter'
export { default as animationDebugger } from './utils/AnimationDebugger'

// 配置
export { GSAP_CONFIG, initializeGSAP } from './config/gsapConfig'

// 动画预设
export { pageAnimations } from './presets/pageAnimations'
export { componentAnimations, getComponentAnimation, applyComponentAnimation } from './presets/componentAnimations'
export { 
  themeAnimations, 
  getThemeConfig, 
  applyThemeAnimation, 
  createThemeTimeline,
  createThemeTransition,
  getThemeColor,
  getThemeTiming,
  getThemeEasing,
  applyBatchThemeAnimation
} from './presets/themeAnimations'

// React组件
export { default as PageTransition } from './components/PageTransition'
export { default as LoadingAnimation, LoadingPresets, createLoadingPreset } from './components/LoadingAnimation'
export { default as ScrollTrigger, ScrollTriggerPresets, createScrollTriggerPreset, refreshAllScrollTriggers, killAllScrollTriggers } from './components/ScrollTrigger'
export { default as AnimatedChart, ChartAnimationPresets, AnimatedRadarChart, AnimatedBarChart, AnimatedCounter } from './components/AnimatedChart'
export { default as ReportAnimation, ReportAnimationPresets, createReportAnimationPreset } from './components/ReportAnimation'
export { default as AnimationControlPanel } from './components/AnimationControlPanel'

// 自定义Hooks
export { default as useGSAP, useGSAPEntrance, useGSAPHover, useGSAPClick } from './hooks/useGSAP'
export { default as useScrollAnimation, useStaggeredScrollAnimation, useParallaxAnimation, usePinAnimation } from './hooks/useScrollAnimation'
export { default as useThemeAnimation, useSimpleThemeAnimation, useThemeAnimationContext } from './hooks/useThemeAnimation'
export { default as useTouchAnimation, useSimpleTouchAnimation, useSwipeGesture, useDragGesture } from './hooks/useTouchAnimation'

// 工具函数
export const AnimationUtils = {
  // 初始化整个动画系统
  initializeAnimationSystem: (config = {}) => {
    const { initializeGSAP } = require('./config/gsapConfig')
    const gsapManager = require('./core/GSAPManager').default
    const performanceMonitor = require('./core/PerformanceMonitor').default
    const accessibilityManager = require('./core/AccessibilityManager').default
    const animationResourceManager = require('./core/AnimationResourceManager').default
    const animationDebugger = require('./utils/AnimationDebugger').default
    
    try {
      // 初始化GSAP
      initializeGSAP(config.gsap)
      
      // 初始化性能监控
      performanceMonitor.initialize()
      
      // 初始化可访问性管理器
      accessibilityManager.initialize()
      
      // 初始化资源管理器
      animationResourceManager.initialize(config.resourceManager)
      
      // 初始化调试工具
      animationDebugger.initialize()
      
      console.log('Animation system initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize animation system:', error)
      return false
    }
  },
  
  // 清理动画系统
  cleanupAnimationSystem: () => {
    const gsapManager = require('./core/GSAPManager').default
    const performanceMonitor = require('./core/PerformanceMonitor').default
    const accessibilityManager = require('./core/AccessibilityManager').default
    const animationResourceManager = require('./core/AnimationResourceManager').default
    const animationDebugger = require('./utils/AnimationDebugger').default
    
    try {
      gsapManager.cleanup()
      performanceMonitor.destroy()
      accessibilityManager.destroy()
      animationResourceManager.destroy()
      animationDebugger.destroy()
      
      console.log('Animation system cleaned up')
      return true
    } catch (error) {
      console.error('Failed to cleanup animation system:', error)
      return false
    }
  },
  
  // 获取系统状态
  getSystemStatus: () => {
    const gsapManager = require('./core/GSAPManager').default
    const performanceMonitor = require('./core/PerformanceMonitor').default
    const accessibilityManager = require('./core/AccessibilityManager').default
    
    return {
      gsap: {
        activeTimelines: gsapManager.timelines.size,
        activeScrollTriggers: gsapManager.scrollTriggers.size,
        totalAnimations: gsapManager.getTotalAnimations()
      },
      performance: {
        level: performanceMonitor.performanceLevel,
        fps: performanceMonitor.getCurrentFPS(),
        memoryUsage: performanceMonitor.getMemoryUsage()
      },
      accessibility: {
        preferences: accessibilityManager.getPreferences(),
        shouldReduceMotion: accessibilityManager.shouldReduceMotion()
      }
    }
  },
  
  // 应用主题到元素
  applyThemeToElement: (element, theme, styles = {}) => {
    if (!element) return
    
    const { getThemeConfig } = require('./presets/themeAnimations')
    const themeConfig = getThemeConfig(theme)
    
    // 设置CSS变量
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      element.style.setProperty(`--theme-${key}`, value)
    })
    
    // 应用自定义样式
    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value)
    })
  },
  
  // 创建响应式动画
  createResponsiveAnimation: (element, animations, breakpoints = {}) => {
    const { gsap } = require('gsap')
    
    const defaultBreakpoints = {
      mobile: '(max-width: 768px)',
      tablet: '(max-width: 1024px)',
      desktop: '(min-width: 1025px)'
    }
    
    const finalBreakpoints = { ...defaultBreakpoints, ...breakpoints }
    const timeline = gsap.timeline()
    
    // 检查当前匹配的断点
    Object.entries(finalBreakpoints).forEach(([name, query]) => {
      if (window.matchMedia(query).matches && animations[name]) {
        timeline.add(animations[name](element))
      }
    })
    
    return timeline
  },
  
  // 批量创建动画
  createBatchAnimation: (elements, animationConfig, options = {}) => {
    const { gsap } = require('gsap')
    const { stagger = 0.1, ...animationProps } = animationConfig
    
    return gsap.to(elements, {
      ...animationProps,
      stagger: stagger,
      ...options
    })
  },
  
  // 创建条件动画
  createConditionalAnimation: (element, condition, trueAnimation, falseAnimation) => {
    const animation = condition ? trueAnimation : falseAnimation
    return typeof animation === 'function' ? animation(element) : animation
  }
}

// 预设配置
export const AnimationPresets = {
  // 页面级别预设
  pages: {
    female: {
      theme: 'female',
      entrance: 'fadeInUp',
      duration: 0.6,
      ease: 'back.out(1.2)'
    },
    male: {
      theme: 'male',
      entrance: 'slideInLeft',
      duration: 0.5,
      ease: 'power3.out'
    },
    s: {
      theme: 's',
      entrance: 'scaleIn',
      duration: 0.5,
      ease: 'back.out(1.7)'
    }
  },
  
  // 组件级别预设
  components: {
    button: {
      hover: { scale: 1.02, duration: 0.3 },
      click: { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 }
    },
    card: {
      hover: { y: -5, scale: 1.02, duration: 0.3 },
      entrance: { opacity: 0, y: 20, duration: 0.5 }
    },
    modal: {
      open: { opacity: 0, scale: 0.9, duration: 0.4 },
      close: { opacity: 0, scale: 0.9, duration: 0.3 }
    }
  },
  
  // 交互级别预设
  interactions: {
    touch: {
      feedback: { scale: 0.95, duration: 0.1 },
      ripple: { scale: 1, opacity: 0, duration: 0.6 }
    },
    scroll: {
      fadeIn: { opacity: 0, y: 30, duration: 0.6 },
      slideIn: { x: -30, opacity: 0, duration: 0.5 }
    }
  }
}

// 默认导出动画工具集合
export default {
  // 核心系统
  gsapManager,
  animationController,
  performanceMonitor,
  accessibilityManager,
  
  // 工具函数
  utils: AnimationUtils,
  
  // 预设配置
  presets: AnimationPresets,
  
  // 快速初始化
  init: AnimationUtils.initializeAnimationSystem,
  
  // 快速清理
  cleanup: AnimationUtils.cleanupAnimationSystem
}