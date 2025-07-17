// ScrollTrigger.jsx - 滚动触发动画组件
import React, { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger as GSAPScrollTrigger } from 'gsap/ScrollTrigger'
import { getThemeConfig, getThemeTiming, getThemeEasing } from '../presets/themeAnimations'
import performanceMonitor from '../core/PerformanceMonitor'
import gsapManager from '../core/GSAPManager'

// 确保ScrollTrigger插件已注册
gsap.registerPlugin(GSAPScrollTrigger)

/**
 * 滚动触发动画组件
 * 当元素进入视口时触发动画效果
 */
const ScrollTrigger = ({
  // 基础配置
  children,
  theme = 'female',
  
  // 动画配置
  animation = 'fadeInUp', // 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'scaleIn', 'rotateIn', 'custom'
  customAnimation = null, // 自定义动画函数
  
  // 触发配置
  trigger = null, // 触发元素，默认为组件本身
  start = 'top 80%', // 开始位置
  end = 'bottom 20%', // 结束位置
  toggleActions = 'play none none reverse', // 触发动作
  scrub = false, // 是否跟随滚动
  pin = false, // 是否固定元素
  
  // 时间配置
  duration = null, // 动画时长，null时使用主题默认值
  delay = 0, // 延迟时间
  stagger = 0, // 交错时间（用于多个子元素）
  
  // 缓动配置
  ease = null, // 缓动函数，null时使用主题默认值
  
  // 高级配置
  batch = false, // 是否批量处理子元素
  batchInterval = 0.1, // 批量处理间隔
  refreshPriority = 0, // 刷新优先级
  
  // 回调函数
  onEnter = null,
  onLeave = null,
  onEnterBack = null,
  onLeaveBack = null,
  onUpdate = null,
  onToggle = null,
  onRefresh = null,
  
  // 性能配置
  markers = false, // 是否显示调试标记
  id = null, // 唯一标识符
  
  // 样式配置
  className = '',
  style = {},
  
  // 可访问性
  reducedMotion = false // 是否使用简化动画
}) => {
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const animationRef = useRef(null)
  
  // 获取主题配置
  const themeConfig = getThemeConfig(theme)
  const animationDuration = duration || getThemeTiming(theme, 'medium')
  const animationEase = ease || getThemeEasing(theme, 'primary')
  
  // 检查是否应该使用简化动画
  const shouldUseReducedMotion = reducedMotion || 
    performanceMonitor.performanceLevel === 'low' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // 预定义动画
  const predefinedAnimations = {
    fadeInUp: (element) => ({
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0 }
    }),
    
    fadeInDown: (element) => ({
      from: { opacity: 0, y: -30 },
      to: { opacity: 1, y: 0 }
    }),
    
    fadeInLeft: (element) => ({
      from: { opacity: 0, x: -30 },
      to: { opacity: 1, x: 0 }
    }),
    
    fadeInRight: (element) => ({
      from: { opacity: 0, x: 30 },
      to: { opacity: 1, x: 0 }
    }),
    
    scaleIn: (element) => ({
      from: { opacity: 0, scale: 0.8 },
      to: { opacity: 1, scale: 1 }
    }),
    
    rotateIn: (element) => ({
      from: { opacity: 0, rotation: -10, scale: 0.9 },
      to: { opacity: 1, rotation: 0, scale: 1 }
    }),
    
    slideInUp: (element) => ({
      from: { y: 50, opacity: 0 },
      to: { y: 0, opacity: 1 }
    }),
    
    slideInDown: (element) => ({
      from: { y: -50, opacity: 0 },
      to: { y: 0, opacity: 1 }
    }),
    
    zoomIn: (element) => ({
      from: { scale: 0.5, opacity: 0 },
      to: { scale: 1, opacity: 1 }
    }),
    
    flipInX: (element) => ({
      from: { rotationX: -90, opacity: 0 },
      to: { rotationX: 0, opacity: 1 }
    }),
    
    flipInY: (element) => ({
      from: { rotationY: -90, opacity: 0 },
      to: { rotationY: 0, opacity: 1 }
    })
  }
  
  // 获取动画配置
  const getAnimationConfig = useCallback((element) => {
    if (customAnimation && typeof customAnimation === 'function') {
      return customAnimation(element)
    }
    
    const predefined = predefinedAnimations[animation]
    if (predefined) {
      return predefined(element)
    }
    
    // 默认动画
    return predefinedAnimations.fadeInUp(element)
  }, [animation, customAnimation])
  
  // 创建滚动触发动画
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    // 确定触发元素
    const triggerElement = trigger || container
    
    // 获取目标元素
    const targetElements = batch ? 
      Array.from(container.children) : 
      [container]
    
    if (targetElements.length === 0) return
    
    // 清理之前的动画
    if (triggerRef.current) {
      triggerRef.current.kill()
    }
    if (animationRef.current) {
      animationRef.current.kill()
    }
    
    try {
      if (batch && targetElements.length > 1) {
        // 批量处理模式
        createBatchAnimation(targetElements, triggerElement)
      } else {
        // 单个元素模式
        createSingleAnimation(targetElements[0], triggerElement)
      }
    } catch (error) {
      console.error('ScrollTrigger animation creation failed:', error)
    }
    
    // 清理函数
    return () => {
      if (triggerRef.current) {
        triggerRef.current.kill()
        triggerRef.current = null
      }
      if (animationRef.current) {
        animationRef.current.kill()
        animationRef.current = null
      }
    }
  }, [animation, theme, batch, start, end, toggleActions, scrub, pin])
  
  // 创建单个元素动画
  const createSingleAnimation = (element, triggerElement) => {
    const animConfig = getAnimationConfig(element)
    
    // 设置初始状态
    gsap.set(element, animConfig.from)
    
    // 创建动画
    const tween = gsap.to(element, {
      ...animConfig.to,
      duration: shouldUseReducedMotion ? animationDuration * 0.5 : animationDuration,
      delay: delay,
      ease: animationEase,
      scrollTrigger: {
        trigger: triggerElement,
        start: start,
        end: end,
        toggleActions: toggleActions,
        scrub: scrub,
        pin: pin,
        markers: markers && process.env.NODE_ENV === 'development',
        id: id,
        refreshPriority: refreshPriority,
        
        // 回调函数
        onEnter: (self) => {
          if (onEnter) onEnter(self, element)
        },
        onLeave: (self) => {
          if (onLeave) onLeave(self, element)
        },
        onEnterBack: (self) => {
          if (onEnterBack) onEnterBack(self, element)
        },
        onLeaveBack: (self) => {
          if (onLeaveBack) onLeaveBack(self, element)
        },
        onUpdate: (self) => {
          if (onUpdate) onUpdate(self, element)
        },
        onToggle: (self) => {
          if (onToggle) onToggle(self, element)
        },
        onRefresh: (self) => {
          if (onRefresh) onRefresh(self, element)
        }
      }
    })
    
    animationRef.current = tween
    
    // 获取ScrollTrigger实例
    triggerRef.current = GSAPScrollTrigger.getAll().pop()
    
    // 注册到管理器
    if (id) {
      gsapManager.scrollTriggers.set(id, triggerRef.current)
    }
  }
  
  // 创建批量动画
  const createBatchAnimation = (elements, triggerElement) => {
    const timeline = gsap.timeline({\n      scrollTrigger: {\n        trigger: triggerElement,\n        start: start,\n        end: end,\n        toggleActions: toggleActions,\n        scrub: scrub,\n        pin: pin,\n        markers: markers && process.env.NODE_ENV === 'development',\n        id: id,\n        refreshPriority: refreshPriority,\n        \n        // 回调函数\n        onEnter: (self) => {\n          if (onEnter) onEnter(self, elements)\n        },\n        onLeave: (self) => {\n          if (onLeave) onLeave(self, elements)\n        },\n        onEnterBack: (self) => {\n          if (onEnterBack) onEnterBack(self, elements)\n        },\n        onLeaveBack: (self) => {\n          if (onLeaveBack) onLeaveBack(self, elements)\n        },\n        onUpdate: (self) => {\n          if (onUpdate) onUpdate(self, elements)\n        },\n        onToggle: (self) => {\n          if (onToggle) onToggle(self, elements)\n        },\n        onRefresh: (self) => {\n          if (onRefresh) onRefresh(self, elements)\n        }\n      }\n    })\n    \n    // 为每个元素添加动画\n    elements.forEach((element, index) => {\n      const animConfig = getAnimationConfig(element)\n      \n      // 设置初始状态\n      gsap.set(element, animConfig.from)\n      \n      // 添加到时间轴\n      timeline.to(element, {\n        ...animConfig.to,\n        duration: shouldUseReducedMotion ? animationDuration * 0.5 : animationDuration,\n        ease: animationEase\n      }, index * (stagger || batchInterval))\n    })\n    \n    animationRef.current = timeline\n    \n    // 获取ScrollTrigger实例\n    triggerRef.current = GSAPScrollTrigger.getAll().pop()\n    \n    // 注册到管理器\n    if (id) {\n      gsapManager.scrollTriggers.set(id, triggerRef.current)\n    }\n  }\n  \n  // 手动控制方法\n  const controls = {\n    refresh: () => {\n      if (triggerRef.current) {\n        triggerRef.current.refresh()\n      }\n    },\n    \n    kill: () => {\n      if (triggerRef.current) {\n        triggerRef.current.kill()\n        triggerRef.current = null\n      }\n      if (animationRef.current) {\n        animationRef.current.kill()\n        animationRef.current = null\n      }\n    },\n    \n    enable: () => {\n      if (triggerRef.current) {\n        triggerRef.current.enable()\n      }\n    },\n    \n    disable: () => {\n      if (triggerRef.current) {\n        triggerRef.current.disable()\n      }\n    },\n    \n    progress: (value) => {\n      if (triggerRef.current && typeof value === 'number') {\n        triggerRef.current.progress(value)\n      }\n      return triggerRef.current?.progress()\n    }\n  }\n  \n  // 暴露控制方法给父组件\n  React.useImperativeHandle(ref, () => controls, [])\n  \n  return (\n    <div \n      ref={containerRef}\n      className={`scroll-trigger-container ${className}`}\n      style={style}\n    >\n      {children}\n    </div>\n  )\n}\n\n// 使用forwardRef包装组件\nconst ScrollTriggerComponent = React.forwardRef((props, ref) => {\n  return <ScrollTrigger {...props} ref={ref} />\n})\n\nScrollTriggerComponent.displayName = 'ScrollTrigger'\n\n// 预设配置\nexport const ScrollTriggerPresets = {\n  // 标准淡入\n  fadeIn: {\n    animation: 'fadeInUp',\n    start: 'top 80%',\n    toggleActions: 'play none none reverse'\n  },\n  \n  // 快速淡入\n  quickFade: {\n    animation: 'fadeInUp',\n    duration: 0.3,\n    start: 'top 90%'\n  },\n  \n  // 慢速淡入\n  slowFade: {\n    animation: 'fadeInUp',\n    duration: 1.2,\n    start: 'top 70%'\n  },\n  \n  // 交错动画\n  staggered: {\n    animation: 'fadeInUp',\n    batch: true,\n    stagger: 0.1,\n    start: 'top 85%'\n  },\n  \n  // 视差效果\n  parallax: {\n    animation: 'custom',\n    customAnimation: (element) => ({\n      from: { y: 0 },\n      to: { y: -50 }\n    }),\n    scrub: true,\n    start: 'top bottom',\n    end: 'bottom top'\n  },\n  \n  // 固定效果\n  pinned: {\n    animation: 'fadeInUp',\n    pin: true,\n    start: 'top top',\n    end: '+=500'\n  }\n}\n\n/**\n * 快速创建预设滚动触发动画\n * @param {string} presetName - 预设名称\n * @param {Object} overrides - 覆盖配置\n * @returns {JSX.Element} 滚动触发组件\n */\nexport const createScrollTriggerPreset = (presetName, overrides = {}) => {\n  const preset = ScrollTriggerPresets[presetName]\n  if (!preset) {\n    console.warn(`ScrollTrigger preset \"${presetName}\" not found`)\n    return <ScrollTriggerComponent {...overrides} />\n  }\n  \n  return <ScrollTriggerComponent {...preset} {...overrides} />\n}\n\n// 批量刷新所有ScrollTrigger\nexport const refreshAllScrollTriggers = () => {\n  GSAPScrollTrigger.refresh()\n}\n\n// 杀死所有ScrollTrigger\nexport const killAllScrollTriggers = () => {\n  GSAPScrollTrigger.killAll()\n}\n\nexport default ScrollTriggerComponent