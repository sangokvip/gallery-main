// useGSAP Hook - React中使用GSAP的自定义Hook
import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import gsapManager from '../core/GSAPManager'
import { componentAnimations, createComponentAnimation } from '../presets/componentAnimations'

/**
 * 主要的GSAP Hook
 * @param {Function|Object} animationConfig - 动画配置函数或对象
 * @param {Array} dependencies - 依赖数组
 * @param {Object} options - 选项
 * @returns {Object} Hook返回值
 */
export const useGSAP = (animationConfig, dependencies = [], options = {}) => {
  const elementRef = useRef(null)
  const timelineRef = useRef(null)
  const isPlayingRef = useRef(false)
  
  const {
    autoPlay = true,
    cleanup = true,
    scope = null,
    theme = 'default'
  } = options

  // 清理动画
  const cleanupAnimation = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill()
      timelineRef.current = null
    }
    isPlayingRef.current = false
  }, [])

  // 创建动画
  const createAnimation = useCallback(() => {
    if (!elementRef.current) return null

    cleanupAnimation()

    let animation = null

    if (typeof animationConfig === 'function') {
      // 函数形式的动画配置
      animation = animationConfig(elementRef.current, { theme })
    } else if (typeof animationConfig === 'object') {
      // 对象形式的动画配置
      const { type, variant, ...animProps } = animationConfig
      
      if (type && variant) {
        // 使用预设动画
        animation = createComponentAnimation(type, variant, elementRef.current, { theme, ...animProps })
      } else {
        // 直接GSAP配置
        animation = gsap.to(elementRef.current, animationConfig)
      }
    }

    if (animation) {
      timelineRef.current = animation
      
      // 添加完成回调
      if (animation.eventCallback) {
        animation.eventCallback('onComplete', () => {
          isPlayingRef.current = false
        })
        
        animation.eventCallback('onStart', () => {
          isPlayingRef.current = true
        })
      }
    }

    return animation
  }, [animationConfig, theme, cleanupAnimation])

  // 播放动画
  const play = useCallback(() => {
    const animation = timelineRef.current || createAnimation()
    if (animation && animation.play) {
      animation.play()
      isPlayingRef.current = true
    }
    return animation
  }, [createAnimation])

  // 暂停动画
  const pause = useCallback(() => {
    if (timelineRef.current && timelineRef.current.pause) {
      timelineRef.current.pause()
      isPlayingRef.current = false
    }
  }, [])

  // 重置动画
  const reset = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.progress(0).pause()
      isPlayingRef.current = false
    }
  }, [])

  // 反向播放
  const reverse = useCallback(() => {
    if (timelineRef.current && timelineRef.current.reverse) {
      timelineRef.current.reverse()
    }
  }, [])

  // 重启动画
  const restart = useCallback(() => {
    if (timelineRef.current && timelineRef.current.restart) {
      timelineRef.current.restart()
      isPlayingRef.current = true
    }
  }, [])

  // 设置进度
  const setProgress = useCallback((progress) => {
    if (timelineRef.current && timelineRef.current.progress) {
      timelineRef.current.progress(progress)
    }
  }, [])

  // 获取动画状态
  const getStatus = useCallback(() => {
    return {
      isPlaying: isPlayingRef.current,
      progress: timelineRef.current ? timelineRef.current.progress() : 0,
      duration: timelineRef.current ? timelineRef.current.duration() : 0,
      timeline: timelineRef.current
    }
  }, [])

  // 初始化和清理
  useEffect(() => {
    if (autoPlay) {
      createAnimation()
    }

    return () => {
      if (cleanup) {
        cleanupAnimation()
      }
    }
  }, dependencies)

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupAnimation()
    }
  }, [cleanupAnimation])

  return {
    ref: elementRef,
    timeline: timelineRef.current,
    play,
    pause,
    reset,
    reverse,
    restart,
    setProgress,
    getStatus,
    isPlaying: isPlayingRef.current
  }
}

/**
 * 简化的动画Hook - 用于基本动画
 * @param {Object} fromProps - 起始属性
 * @param {Object} toProps - 结束属性
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useSimpleAnimation = (fromProps, toProps, dependencies = []) => {
  return useGSAP((element) => {
    return gsap.fromTo(element, fromProps, toProps)
  }, dependencies)
}

/**
 * 时间轴Hook - 用于复杂的序列动画
 * @param {Function} timelineBuilder - 时间轴构建函数
 * @param {Array} dependencies - 依赖数组
 * @param {Object} options - 选项
 * @returns {Object} Hook返回值
 */
export const useTimeline = (timelineBuilder, dependencies = [], options = {}) => {
  return useGSAP((element) => {
    const tl = gsap.timeline(options)
    return timelineBuilder(tl, element)
  }, dependencies, { autoPlay: false, ...options })
}

/**
 * 悬停动画Hook
 * @param {Object} hoverConfig - 悬停配置
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useHoverAnimation = (hoverConfig, dependencies = []) => {
  const elementRef = useRef(null)
  const hoverTimelineRef = useRef(null)
  const leaveTimelineRef = useRef(null)

  const {
    enter = {},
    leave = {},
    theme = 'default'
  } = hoverConfig

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleMouseEnter = () => {
      if (leaveTimelineRef.current) {
        leaveTimelineRef.current.kill()
      }
      
      hoverTimelineRef.current = gsap.to(element, {
        ...enter,
        duration: enter.duration || 0.3,
        ease: enter.ease || "power2.out"
      })
    }

    const handleMouseLeave = () => {
      if (hoverTimelineRef.current) {
        hoverTimelineRef.current.kill()
      }
      
      leaveTimelineRef.current = gsap.to(element, {
        ...leave,
        duration: leave.duration || 0.3,
        ease: leave.ease || "power2.out"
      })
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      
      if (hoverTimelineRef.current) {
        hoverTimelineRef.current.kill()
      }
      if (leaveTimelineRef.current) {
        leaveTimelineRef.current.kill()
      }
    }
  }, dependencies)

  return {
    ref: elementRef
  }
}

/**
 * 点击动画Hook
 * @param {Object} clickConfig - 点击配置
 * @param {Function} onClick - 点击回调
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useClickAnimation = (clickConfig, onClick, dependencies = []) => {
  const elementRef = useRef(null)

  const {
    scale = 0.95,
    duration = 0.1,
    ease = "power2.inOut",
    yoyo = true,
    repeat = 1
  } = clickConfig

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleClick = (e) => {
      // 执行点击动画
      gsap.to(element, {
        scale,
        duration,
        ease,
        yoyo,
        repeat,
        onComplete: () => {
          // 动画完成后执行回调
          if (onClick) {
            onClick(e)
          }
        }
      })
    }

    element.addEventListener('click', handleClick)

    return () => {
      element.removeEventListener('click', handleClick)
    }
  }, dependencies)

  return {
    ref: elementRef
  }
}

/**
 * 入场动画Hook
 * @param {string|Object} animationType - 动画类型或配置
 * @param {Object} options - 选项
 * @returns {Object} Hook返回值
 */
export const useEntranceAnimation = (animationType = 'fadeInUp', options = {}) => {
  const {
    delay = 0,
    stagger = 0,
    trigger = 'mount',
    threshold = 0.1
  } = options

  const animationConfig = typeof animationType === 'string' 
    ? getPresetEntrance(animationType)
    : animationType

  return useGSAP((element) => {
    const children = stagger > 0 ? element.children : element

    return gsap.fromTo(children,
      animationConfig.from,
      {
        ...animationConfig.to,
        delay,
        stagger: stagger > 0 ? stagger : 0
      }
    )
  }, [], { autoPlay: trigger === 'mount' })
}

/**
 * 获取预设入场动画
 * @param {string} type - 动画类型
 * @returns {Object} 动画配置
 */
function getPresetEntrance(type) {
  const presets = {
    fadeInUp: {
      from: { opacity: 0, y: 30 },
      to: { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    },
    fadeInDown: {
      from: { opacity: 0, y: -30 },
      to: { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    },
    fadeInLeft: {
      from: { opacity: 0, x: -30 },
      to: { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }
    },
    fadeInRight: {
      from: { opacity: 0, x: 30 },
      to: { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }
    },
    scaleIn: {
      from: { opacity: 0, scale: 0.8 },
      to: { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
    },
    rotateIn: {
      from: { opacity: 0, rotation: 180, scale: 0.8 },
      to: { opacity: 1, rotation: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
    }
  }

  return presets[type] || presets.fadeInUp
}

/**
 * 性能优化的动画Hook
 * @param {Function} animationConfig - 动画配置
 * @param {Array} dependencies - 依赖数组
 * @param {Object} options - 选项
 * @returns {Object} Hook返回值
 */
export const useOptimizedAnimation = (animationConfig, dependencies = [], options = {}) => {
  const {
    respectMotionPreference = true,
    performanceMode = 'auto'
  } = options

  // 检查用户动画偏好
  const prefersReducedMotion = respectMotionPreference && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 如果用户偏好减少动画，返回空的Hook
  if (prefersReducedMotion) {
    return {
      ref: useRef(null),
      play: () => {},
      pause: () => {},
      reset: () => {},
      isPlaying: false
    }
  }

  return useGSAP(animationConfig, dependencies, options)
}

export default useGSAP