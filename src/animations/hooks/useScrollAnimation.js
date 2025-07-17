// useScrollAnimation Hook - 滚动触发动画的自定义Hook
import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsapManager from '../core/GSAPManager'

// 确保ScrollTrigger已注册
gsap.registerPlugin(ScrollTrigger)

/**
 * 滚动动画Hook
 * @param {Function|Object} animationConfig - 动画配置
 * @param {Object} scrollConfig - 滚动配置
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useScrollAnimation = (animationConfig, scrollConfig = {}, dependencies = []) => {
  const elementRef = useRef(null)
  const scrollTriggerRef = useRef(null)
  const animationRef = useRef(null)

  const {
    trigger = null, // 触发元素，默认使用elementRef.current
    start = "top 80%", // 开始位置
    end = "bottom 20%", // 结束位置
    scrub = false, // 是否跟随滚动
    pin = false, // 是否固定元素
    snap = false, // 是否吸附
    toggleActions = "play none none reverse", // 切换动作
    refreshPriority = 0, // 刷新优先级
    onEnter = null, // 进入回调
    onLeave = null, // 离开回调
    onEnterBack = null, // 返回进入回调
    onLeaveBack = null, // 返回离开回调
    onUpdate = null, // 更新回调
    once = false, // 是否只执行一次
    batch = false, // 是否批量处理
    stagger = 0 // 错落延迟
  } = scrollConfig

  // 清理ScrollTrigger
  const cleanup = useCallback(() => {
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill()
      scrollTriggerRef.current = null
    }
    if (animationRef.current) {
      animationRef.current.kill()
      animationRef.current = null
    }
  }, [])

  // 创建动画
  const createAnimation = useCallback(() => {
    if (!elementRef.current) return null

    cleanup()

    let animation = null
    const element = elementRef.current
    const triggerElement = trigger || element

    // 创建动画
    if (typeof animationConfig === 'function') {
      animation = animationConfig(element)
    } else if (typeof animationConfig === 'object') {
      const { from, to, ...otherProps } = animationConfig
      
      if (from && to) {
        animation = gsap.fromTo(element, from, { ...to, ...otherProps })
      } else {
        animation = gsap.to(element, animationConfig)
      }
    }

    if (!animation) return null

    // 如果不需要滚动触发，直接返回动画
    if (!ScrollTrigger) {
      animationRef.current = animation
      return animation
    }

    // 创建ScrollTrigger
    const scrollTriggerConfig = {
      trigger: triggerElement,
      start,
      end,
      scrub,
      pin,
      snap,
      toggleActions,
      refreshPriority,
      animation,
      onEnter: (self) => {
        if (onEnter) onEnter(self)
      },
      onLeave: (self) => {
        if (onLeave) onLeave(self)
      },
      onEnterBack: (self) => {
        if (onEnterBack) onEnterBack(self)
      },
      onLeaveBack: (self) => {
        if (onLeaveBack) onLeaveBack(self)
      },
      onUpdate: (self) => {
        if (onUpdate) onUpdate(self)
      }
    }

    // 如果只执行一次，修改toggleActions
    if (once) {
      scrollTriggerConfig.toggleActions = "play none none none"
    }

    const st = ScrollTrigger.create(scrollTriggerConfig)
    
    scrollTriggerRef.current = st
    animationRef.current = animation

    return { animation, scrollTrigger: st }
  }, [
    animationConfig, 
    trigger, 
    start, 
    end, 
    scrub, 
    pin, 
    snap, 
    toggleActions,
    refreshPriority,
    onEnter,
    onLeave,
    onEnterBack,
    onLeaveBack,
    onUpdate,
    once,
    cleanup
  ])

  // 刷新ScrollTrigger
  const refresh = useCallback(() => {
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.refresh()
    } else {
      ScrollTrigger.refresh()
    }
  }, [])

  // 获取进度
  const getProgress = useCallback(() => {
    return scrollTriggerRef.current ? scrollTriggerRef.current.progress : 0
  }, [])

  // 获取状态
  const getStatus = useCallback(() => {
    const st = scrollTriggerRef.current
    return {
      isActive: st ? st.isActive : false,
      progress: st ? st.progress : 0,
      direction: st ? st.direction : 0,
      velocity: st ? st.getVelocity() : 0
    }
  }, [])

  // 初始化
  useEffect(() => {
    createAnimation()

    return () => {
      cleanup()
    }
  }, dependencies)

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    ref: elementRef,
    scrollTrigger: scrollTriggerRef.current,
    animation: animationRef.current,
    refresh,
    getProgress,
    getStatus,
    cleanup
  }
}

/**
 * 批量滚动动画Hook
 * @param {string} selector - 选择器
 * @param {Function|Object} animationConfig - 动画配置
 * @param {Object} scrollConfig - 滚动配置
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useBatchScrollAnimation = (selector, animationConfig, scrollConfig = {}, dependencies = []) => {
  const containerRef = useRef(null)
  const scrollTriggersRef = useRef([])

  const {
    stagger = 0.1,
    ...otherScrollConfig
  } = scrollConfig

  const cleanup = useCallback(() => {
    scrollTriggersRef.current.forEach(st => st.kill())
    scrollTriggersRef.current = []
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    cleanup()

    const elements = containerRef.current.querySelectorAll(selector)
    if (elements.length === 0) return

    elements.forEach((element, index) => {
      let animation = null

      if (typeof animationConfig === 'function') {
        animation = animationConfig(element, index)
      } else if (typeof animationConfig === 'object') {
        const { from, to, ...otherProps } = animationConfig
        
        if (from && to) {
          animation = gsap.fromTo(element, from, { 
            ...to, 
            ...otherProps,
            delay: stagger * index
          })
        } else {
          animation = gsap.to(element, {
            ...animationConfig,
            delay: stagger * index
          })
        }
      }

      if (animation) {
        const st = ScrollTrigger.create({
          trigger: element,
          animation,
          ...otherScrollConfig
        })
        
        scrollTriggersRef.current.push(st)
      }
    })

    return cleanup
  }, dependencies)

  return {
    ref: containerRef,
    refresh: () => ScrollTrigger.refresh(),
    cleanup
  }
}

/**
 * 视差滚动Hook
 * @param {Object} parallaxConfig - 视差配置
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useParallaxScroll = (parallaxConfig = {}, dependencies = []) => {
  const {
    speed = 0.5, // 视差速度 (0-1)
    direction = 'vertical', // 方向: 'vertical' | 'horizontal'
    start = "top bottom",
    end = "bottom top"
  } = parallaxConfig

  const animationConfig = (element) => {
    const movement = direction === 'vertical' ? { y: -100 * speed } : { x: -100 * speed }
    return gsap.to(element, movement)
  }

  return useScrollAnimation(animationConfig, {
    start,
    end,
    scrub: true
  }, dependencies)
}

/**
 * 滚动进度Hook
 * @param {Function} onProgress - 进度回调
 * @param {Object} config - 配置
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useScrollProgress = (onProgress, config = {}, dependencies = []) => {
  const {
    start = "top top",
    end = "bottom bottom",
    trigger = null
  } = config

  return useScrollAnimation(
    () => gsap.timeline(), // 空动画
    {
      start,
      end,
      trigger,
      scrub: true,
      onUpdate: (self) => {
        if (onProgress) {
          onProgress(self.progress, self)
        }
      }
    },
    dependencies
  )
}

/**
 * 滚动吸附Hook
 * @param {Array} snapPoints - 吸附点
 * @param {Object} config - 配置
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useScrollSnap = (snapPoints = [0, 0.5, 1], config = {}, dependencies = []) => {
  const {
    duration = 0.5,
    ease = "power2.inOut"
  } = config

  return useScrollAnimation(
    () => gsap.timeline(), // 空动画
    {
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      snap: {
        snapTo: snapPoints,
        duration,
        ease
      }
    },
    dependencies
  )
}

/**
 * 滚动显示Hook - 元素进入视口时显示
 * @param {Object} config - 配置
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useScrollReveal = (config = {}, dependencies = []) => {
  const {
    from = { opacity: 0, y: 50 },
    to = { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
    start = "top 80%",
    once = true
  } = config

  return useScrollAnimation(
    (element) => gsap.fromTo(element, from, to),
    {
      start,
      toggleActions: once ? "play none none none" : "play reverse play reverse"
    },
    dependencies
  )
}

/**
 * 滚动计数器Hook
 * @param {number} endValue - 结束值
 * @param {Object} config - 配置
 * @param {Array} dependencies - 依赖数组
 * @returns {Object} Hook返回值
 */
export const useScrollCounter = (endValue, config = {}, dependencies = []) => {
  const {
    startValue = 0,
    duration = 2,
    ease = "power2.out",
    formatter = (value) => Math.round(value),
    start = "top 80%"
  } = config

  return useScrollAnimation(
    (element) => {
      const obj = { value: startValue }
      return gsap.to(obj, {
        value: endValue,
        duration,
        ease,
        onUpdate: () => {
          element.textContent = formatter(obj.value)
        }
      })
    },
    {
      start,
      toggleActions: "play none none none"
    },
    dependencies
  )
}

export default useScrollAnimation