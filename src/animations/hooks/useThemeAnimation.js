// useThemeAnimation Hook - 主题动画管理
import { useEffect, useRef, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import { 
  getThemeConfig, 
  applyThemeAnimation, 
  createThemeTimeline,
  createThemeTransition,
  getThemeColor,
  getThemeTiming,
  getThemeEasing
} from '../presets/themeAnimations'
import gsapManager from '../core/GSAPManager'
import performanceMonitor from '../core/PerformanceMonitor'

/**
 * 主题动画Hook
 * 提供主题相关的动画功能和主题切换动画
 */
const useThemeAnimation = (initialTheme = 'female', options = {}) => {
  const [currentTheme, setCurrentTheme] = useState(initialTheme)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const elementRef = useRef(null)
  const animationsRef = useRef(new Map())
  const transitionRef = useRef(null)
  
  const {
    // 动画配置
    enableTransitions = true,
    transitionDuration = null,
    cacheAnimations = true,
    autoCleanup = true,
    
    // 性能配置
    reducedMotion = false,
    
    // 回调函数
    onThemeChange = null,
    onTransitionStart = null,
    onTransitionComplete = null,
    onAnimationCreate = null,
    onAnimationDestroy = null
  } = options
  
  // 获取当前主题配置
  const themeConfig = getThemeConfig(currentTheme)
  
  // 检查是否应该使用简化动画
  const shouldUseReducedMotion = reducedMotion || 
    performanceMonitor.performanceLevel === 'low' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // 创建主题动画
  const createAnimation = useCallback((animationType, element, ...params) => {
    if (!element) element = elementRef.current
    if (!element) return null
    
    const cacheKey = `${currentTheme}-${animationType}-${element.id || 'default'}`
    
    // 检查缓存
    if (cacheAnimations && animationsRef.current.has(cacheKey)) {
      return animationsRef.current.get(cacheKey)
    }
    
    try {
      const animation = applyThemeAnimation(element, currentTheme, animationType, ...params)
      
      if (animation) {\n        // 缓存动画\n        if (cacheAnimations) {\n          animationsRef.current.set(cacheKey, animation)\n        }\n        \n        // 注册到管理器\n        const animationId = `theme-${currentTheme}-${animationType}-${Date.now()}`\n        gsapManager.timelines.set(animationId, animation)\n        \n        // 回调\n        if (onAnimationCreate) {\n          onAnimationCreate(animation, animationType, currentTheme)\n        }\n        \n        return animation\n      }\n    } catch (error) {\n      console.error('Failed to create theme animation:', error)\n    }\n    \n    return null\n  }, [currentTheme, cacheAnimations, onAnimationCreate])\n  \n  // 切换主题\n  const changeTheme = useCallback(async (newTheme, transitionOptions = {}) => {\n    if (newTheme === currentTheme || isTransitioning) return\n    \n    const element = elementRef.current\n    if (!element) {\n      setCurrentTheme(newTheme)\n      if (onThemeChange) onThemeChange(newTheme, currentTheme)\n      return\n    }\n    \n    setIsTransitioning(true)\n    \n    if (onTransitionStart) {\n      onTransitionStart(newTheme, currentTheme)\n    }\n    \n    try {\n      if (enableTransitions && !shouldUseReducedMotion) {\n        // 创建主题切换动画\n        const duration = transitionOptions.duration || transitionDuration || getThemeTiming(currentTheme, 'medium')\n        \n        transitionRef.current = createThemeTransition(element, currentTheme, newTheme)\n        \n        // 等待动画完成\n        await new Promise((resolve) => {\n          transitionRef.current.eventCallback('onComplete', resolve)\n        })\n      }\n      \n      // 更新主题\n      setCurrentTheme(newTheme)\n      \n      // 清理旧主题的缓存动画\n      if (cacheAnimations) {\n        const keysToDelete = []\n        animationsRef.current.forEach((animation, key) => {\n          if (key.startsWith(`${currentTheme}-`)) {\n            animation.kill()\n            keysToDelete.push(key)\n          }\n        })\n        keysToDelete.forEach(key => animationsRef.current.delete(key))\n      }\n      \n      if (onThemeChange) {\n        onThemeChange(newTheme, currentTheme)\n      }\n      \n    } catch (error) {\n      console.error('Theme transition failed:', error)\n    } finally {\n      setIsTransitioning(false)\n      \n      if (onTransitionComplete) {\n        onTransitionComplete(newTheme, currentTheme)\n      }\n    }\n  }, [currentTheme, isTransitioning, enableTransitions, shouldUseReducedMotion, transitionDuration, cacheAnimations, onTransitionStart, onTransitionComplete, onThemeChange])\n  \n  // 应用主题样式\n  const applyThemeStyles = useCallback((element, styleOverrides = {}) => {\n    if (!element) element = elementRef.current\n    if (!element) return\n    \n    const themeColors = themeConfig.colors\n    \n    // 设置CSS变量\n    element.style.setProperty('--theme-primary', themeColors.primary)\n    element.style.setProperty('--theme-secondary', themeColors.secondary)\n    element.style.setProperty('--theme-accent', themeColors.accent)\n    element.style.setProperty('--theme-highlight', themeColors.highlight)\n    element.style.setProperty('--theme-shadow', themeColors.shadow)\n    \n    // 应用自定义样式\n    Object.entries(styleOverrides).forEach(([property, value]) => {\n      element.style.setProperty(property, value)\n    })\n  }, [themeConfig])\n  \n  // 创建主题化的时间轴\n  const createTimeline = useCallback((options = {}) => {\n    return createThemeTimeline(currentTheme, {\n      ...options,\n      duration: shouldUseReducedMotion ? (options.duration || themeConfig.timing.medium) * 0.5 : options.duration\n    })\n  }, [currentTheme, shouldUseReducedMotion, themeConfig])\n  \n  // 获取主题属性\n  const getThemeProperty = useCallback((property, type = 'primary') => {\n    switch (property) {\n      case 'color':\n        return getThemeColor(currentTheme, type)\n      case 'timing':\n        return getThemeTiming(currentTheme, type)\n      case 'easing':\n        return getThemeEasing(currentTheme, type)\n      default:\n        return themeConfig[property]?.[type] || null\n    }\n  }, [currentTheme, themeConfig])\n  \n  // 批量应用动画\n  const applyBatchAnimation = useCallback((elements, animationType, options = {}) => {\n    if (!elements || elements.length === 0) return null\n    \n    const { stagger = 0.1, ...animationOptions } = options\n    const timeline = createTimeline()\n    \n    elements.forEach((element, index) => {\n      const animation = createAnimation(animationType, element, animationOptions)\n      if (animation) {\n        timeline.add(animation, index * stagger)\n      }\n    })\n    \n    return timeline\n  }, [createAnimation, createTimeline])\n  \n  // 预设动画方法\n  const animations = {\n    // 入场动画\n    entrance: (element, options = {}) => {\n      return createAnimation('entrance', element, options)\n    },\n    \n    // 按钮悬停\n    buttonHover: (element, isEnter = true, options = {}) => {\n      return createAnimation('buttonHover', element, isEnter, options)\n    },\n    \n    // 按钮点击\n    buttonClick: (element, options = {}) => {\n      return createAnimation('buttonClick', element, options)\n    },\n    \n    // 卡片悬停\n    cardHover: (element, isEnter = true, options = {}) => {\n      return createAnimation('cardHover', element, isEnter, options)\n    },\n    \n    // 消息动画（仅message主题）\n    messageEntrance: (element, options = {}) => {\n      if (currentTheme === 'message') {\n        return createAnimation('messageEntrance', element, options)\n      }\n      return null\n    },\n    \n    messageHover: (element, isEnter = true, options = {}) => {\n      if (currentTheme === 'message') {\n        return createAnimation('messageHover', element, isEnter, options)\n      }\n      return null\n    }\n  }\n  \n  // 清理函数\n  const cleanup = useCallback(() => {\n    // 清理所有缓存的动画\n    animationsRef.current.forEach((animation) => {\n      if (animation && animation.kill) {\n        animation.kill()\n      }\n    })\n    animationsRef.current.clear()\n    \n    // 清理过渡动画\n    if (transitionRef.current) {\n      transitionRef.current.kill()\n      transitionRef.current = null\n    }\n    \n    if (onAnimationDestroy) {\n      onAnimationDestroy()\n    }\n  }, [onAnimationDestroy])\n  \n  // 组件卸载时清理\n  useEffect(() => {\n    if (autoCleanup) {\n      return cleanup\n    }\n  }, [autoCleanup, cleanup])\n  \n  // 主题变化时应用样式\n  useEffect(() => {\n    if (elementRef.current) {\n      applyThemeStyles(elementRef.current)\n    }\n  }, [currentTheme, applyThemeStyles])\n  \n  return {\n    // 状态\n    currentTheme,\n    isTransitioning,\n    themeConfig,\n    \n    // 引用\n    elementRef,\n    \n    // 主题控制\n    changeTheme,\n    applyThemeStyles,\n    \n    // 动画创建\n    createAnimation,\n    createTimeline,\n    applyBatchAnimation,\n    \n    // 预设动画\n    animations,\n    \n    // 工具方法\n    getThemeProperty,\n    \n    // 清理方法\n    cleanup,\n    \n    // 主题属性快捷访问\n    colors: themeConfig.colors,\n    timing: themeConfig.timing,\n    easing: themeConfig.easing,\n    effects: themeConfig.effects\n  }\n}\n\n/**\n * 简化版主题动画Hook\n * 只提供基础的主题切换功能\n */\nexport const useSimpleThemeAnimation = (initialTheme = 'female') => {\n  const [theme, setTheme] = useState(initialTheme)\n  const elementRef = useRef(null)\n  \n  const changeTheme = useCallback((newTheme) => {\n    setTheme(newTheme)\n    \n    // 应用主题样式\n    if (elementRef.current) {\n      const themeConfig = getThemeConfig(newTheme)\n      const element = elementRef.current\n      \n      element.style.setProperty('--theme-primary', themeConfig.colors.primary)\n      element.style.setProperty('--theme-secondary', themeConfig.colors.secondary)\n      element.style.setProperty('--theme-accent', themeConfig.colors.accent)\n    }\n  }, [])\n  \n  return {\n    theme,\n    changeTheme,\n    elementRef,\n    themeConfig: getThemeConfig(theme)\n  }\n}\n\n/**\n * 主题动画上下文Hook\n * 用于在组件树中共享主题动画状态\n */\nexport const useThemeAnimationContext = () => {\n  const [globalTheme, setGlobalTheme] = useState('female')\n  const [isGlobalTransitioning, setIsGlobalTransitioning] = useState(false)\n  \n  const changeGlobalTheme = useCallback(async (newTheme) => {\n    if (newTheme === globalTheme || isGlobalTransitioning) return\n    \n    setIsGlobalTransitioning(true)\n    \n    try {\n      // 这里可以添加全局主题切换逻辑\n      // 比如更新CSS变量、localStorage等\n      \n      setGlobalTheme(newTheme)\n      \n      // 更新CSS根变量\n      const themeConfig = getThemeConfig(newTheme)\n      const root = document.documentElement\n      \n      root.style.setProperty('--global-theme-primary', themeConfig.colors.primary)\n      root.style.setProperty('--global-theme-secondary', themeConfig.colors.secondary)\n      root.style.setProperty('--global-theme-accent', themeConfig.colors.accent)\n      \n      // 保存到localStorage\n      localStorage.setItem('theme', newTheme)\n      \n    } catch (error) {\n      console.error('Global theme change failed:', error)\n    } finally {\n      setIsGlobalTransitioning(false)\n    }\n  }, [globalTheme, isGlobalTransitioning])\n  \n  // 初始化时从localStorage读取主题\n  useEffect(() => {\n    const savedTheme = localStorage.getItem('theme')\n    if (savedTheme && savedTheme !== globalTheme) {\n      changeGlobalTheme(savedTheme)\n    }\n  }, [])\n  \n  return {\n    globalTheme,\n    isGlobalTransitioning,\n    changeGlobalTheme,\n    themeConfig: getThemeConfig(globalTheme)\n  }\n}\n\nexport default useThemeAnimation