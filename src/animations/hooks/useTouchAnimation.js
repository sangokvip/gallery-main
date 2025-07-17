// useTouchAnimation Hook - 触摸交互动画
import { useEffect, useRef, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import { getThemeConfig, getThemeColor, getThemeTiming } from '../presets/themeAnimations'
import performanceMonitor from '../core/PerformanceMonitor'

/**
 * 触摸交互动画Hook
 * 为移动端提供触摸反馈和手势动画
 */
const useTouchAnimation = (options = {}) => {
  const elementRef = useRef(null)
  const touchDataRef = useRef({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    startTime: 0,
    isActive: false,
    direction: null
  })
  const animationsRef = useRef(new Map())
  const [isTouching, setIsTouching] = useState(false)
  
  const {
    // 基础配置
    theme = 'female',
    
    // 触摸反馈配置
    enableTouchFeedback = true,
    feedbackScale = 0.95,
    feedbackDuration = 0.1,
    
    // 手势配置
    enableSwipe = false,
    swipeThreshold = 50, // 滑动阈值（像素）
    swipeVelocityThreshold = 0.5, // 速度阈值
    
    // 长按配置
    enableLongPress = false,
    longPressDuration = 500, // 长按时间（毫秒）
    
    // 拖拽配置
    enableDrag = false,
    dragConstraints = null, // { left, right, top, bottom }
    
    // 动画配置
    rippleEffect = true,
    rippleColor = null,
    
    // 回调函数
    onTouchStart = null,
    onTouchMove = null,
    onTouchEnd = null,
    onSwipe = null,
    onLongPress = null,
    onDrag = null,
    
    // 性能配置
    reducedMotion = false
  } = options
  
  // 获取主题配置
  const themeConfig = getThemeConfig(theme)
  const primaryColor = rippleColor || getThemeColor(theme, 'primary')
  const timing = getThemeTiming(theme, 'fast')
  
  // 检查是否应该使用简化动画
  const shouldUseReducedMotion = reducedMotion || 
    performanceMonitor.performanceLevel === 'low' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // 创建触摸反馈动画
  const createTouchFeedback = useCallback((element, scale = feedbackScale) => {\n    if (!enableTouchFeedback || shouldUseReducedMotion) return null\n    \n    const feedbackTween = gsap.to(element, {\n      scale: scale,\n      duration: feedbackDuration,\n      ease: \"power2.out\",\n      yoyo: true,\n      repeat: 1\n    })\n    \n    return feedbackTween\n  }, [enableTouchFeedback, shouldUseReducedMotion, feedbackScale, feedbackDuration])\n  \n  // 创建涟漪效果\n  const createRippleEffect = useCallback((element, x, y) => {\n    if (!rippleEffect || shouldUseReducedMotion) return null\n    \n    // 创建涟漪元素\n    const ripple = document.createElement('div')\n    const rect = element.getBoundingClientRect()\n    const size = Math.max(rect.width, rect.height) * 2\n    \n    ripple.style.cssText = `\n      position: absolute;\n      border-radius: 50%;\n      background-color: ${primaryColor};\n      opacity: 0.3;\n      pointer-events: none;\n      transform: translate(-50%, -50%);\n      width: ${size}px;\n      height: ${size}px;\n      left: ${x - rect.left}px;\n      top: ${y - rect.top}px;\n      z-index: 1000;\n    `\n    \n    // 确保父元素有相对定位\n    const computedStyle = window.getComputedStyle(element)\n    if (computedStyle.position === 'static') {\n      element.style.position = 'relative'\n    }\n    \n    element.appendChild(ripple)\n    \n    // 创建涟漪动画\n    const rippleTween = gsap.fromTo(ripple,\n      {\n        scale: 0,\n        opacity: 0.3\n      },\n      {\n        scale: 1,\n        opacity: 0,\n        duration: 0.6,\n        ease: \"power2.out\",\n        onComplete: () => {\n          if (ripple.parentNode) {\n            ripple.parentNode.removeChild(ripple)\n          }\n        }\n      }\n    )\n    \n    return rippleTween\n  }, [rippleEffect, shouldUseReducedMotion, primaryColor])\n  \n  // 处理触摸开始\n  const handleTouchStart = useCallback((event) => {\n    const element = elementRef.current\n    if (!element) return\n    \n    const touch = event.touches[0]\n    const touchData = touchDataRef.current\n    \n    // 记录触摸数据\n    touchData.startX = touch.clientX\n    touchData.startY = touch.clientY\n    touchData.currentX = touch.clientX\n    touchData.currentY = touch.clientY\n    touchData.startTime = Date.now()\n    touchData.isActive = true\n    touchData.direction = null\n    \n    setIsTouching(true)\n    \n    // 创建触摸反馈\n    if (enableTouchFeedback) {\n      const feedbackAnimation = createTouchFeedback(element)\n      if (feedbackAnimation) {\n        animationsRef.current.set('feedback', feedbackAnimation)\n      }\n    }\n    \n    // 创建涟漪效果\n    if (rippleEffect) {\n      const rippleAnimation = createRippleEffect(element, touch.clientX, touch.clientY)\n      if (rippleAnimation) {\n        animationsRef.current.set('ripple', rippleAnimation)\n      }\n    }\n    \n    // 长按检测\n    if (enableLongPress) {\n      const longPressTimer = setTimeout(() => {\n        if (touchData.isActive && onLongPress) {\n          onLongPress(event, touchData)\n        }\n      }, longPressDuration)\n      \n      animationsRef.current.set('longPressTimer', longPressTimer)\n    }\n    \n    // 回调\n    if (onTouchStart) {\n      onTouchStart(event, touchData)\n    }\n    \n    // 阻止默认行为（可选）\n    if (enableDrag || enableSwipe) {\n      event.preventDefault()\n    }\n  }, [enableTouchFeedback, rippleEffect, enableLongPress, longPressDuration, enableDrag, enableSwipe, createTouchFeedback, createRippleEffect, onTouchStart, onLongPress])\n  \n  // 处理触摸移动\n  const handleTouchMove = useCallback((event) => {\n    const element = elementRef.current\n    if (!element) return\n    \n    const touch = event.touches[0]\n    const touchData = touchDataRef.current\n    \n    if (!touchData.isActive) return\n    \n    // 更新触摸数据\n    touchData.currentX = touch.clientX\n    touchData.currentY = touch.clientY\n    touchData.deltaX = touchData.currentX - touchData.startX\n    touchData.deltaY = touchData.currentY - touchData.startY\n    \n    // 确定滑动方向\n    if (!touchData.direction) {\n      const absX = Math.abs(touchData.deltaX)\n      const absY = Math.abs(touchData.deltaY)\n      \n      if (absX > 10 || absY > 10) {\n        if (absX > absY) {\n          touchData.direction = touchData.deltaX > 0 ? 'right' : 'left'\n        } else {\n          touchData.direction = touchData.deltaY > 0 ? 'down' : 'up'\n        }\n      }\n    }\n    \n    // 拖拽处理\n    if (enableDrag) {\n      let newX = touchData.deltaX\n      let newY = touchData.deltaY\n      \n      // 应用约束\n      if (dragConstraints) {\n        if (dragConstraints.left !== undefined) {\n          newX = Math.max(newX, dragConstraints.left)\n        }\n        if (dragConstraints.right !== undefined) {\n          newX = Math.min(newX, dragConstraints.right)\n        }\n        if (dragConstraints.top !== undefined) {\n          newY = Math.max(newY, dragConstraints.top)\n        }\n        if (dragConstraints.bottom !== undefined) {\n          newY = Math.min(newY, dragConstraints.bottom)\n        }\n      }\n      \n      // 应用变换\n      gsap.set(element, {\n        x: newX,\n        y: newY\n      })\n      \n      if (onDrag) {\n        onDrag(event, touchData, { x: newX, y: newY })\n      }\n    }\n    \n    // 回调\n    if (onTouchMove) {\n      onTouchMove(event, touchData)\n    }\n    \n    // 阻止默认行为\n    if (enableDrag) {\n      event.preventDefault()\n    }\n  }, [enableDrag, dragConstraints, onTouchMove, onDrag])\n  \n  // 处理触摸结束\n  const handleTouchEnd = useCallback((event) => {\n    const element = elementRef.current\n    if (!element) return\n    \n    const touchData = touchDataRef.current\n    \n    if (!touchData.isActive) return\n    \n    const endTime = Date.now()\n    const duration = endTime - touchData.startTime\n    const distance = Math.sqrt(\n      touchData.deltaX * touchData.deltaX + \n      touchData.deltaY * touchData.deltaY\n    )\n    const velocity = distance / duration\n    \n    // 滑动检测\n    if (enableSwipe && distance > swipeThreshold && velocity > swipeVelocityThreshold) {\n      if (onSwipe) {\n        onSwipe(event, {\n          direction: touchData.direction,\n          distance,\n          velocity,\n          duration,\n          deltaX: touchData.deltaX,\n          deltaY: touchData.deltaY\n        })\n      }\n    }\n    \n    // 重置拖拽位置\n    if (enableDrag) {\n      gsap.to(element, {\n        x: 0,\n        y: 0,\n        duration: 0.3,\n        ease: \"power2.out\"\n      })\n    }\n    \n    // 清理定时器\n    const longPressTimer = animationsRef.current.get('longPressTimer')\n    if (longPressTimer) {\n      clearTimeout(longPressTimer)\n      animationsRef.current.delete('longPressTimer')\n    }\n    \n    // 重置状态\n    touchData.isActive = false\n    setIsTouching(false)\n    \n    // 回调\n    if (onTouchEnd) {\n      onTouchEnd(event, touchData)\n    }\n  }, [enableSwipe, swipeThreshold, swipeVelocityThreshold, enableDrag, onSwipe, onTouchEnd])\n  \n  // 绑定事件监听器\n  useEffect(() => {\n    const element = elementRef.current\n    if (!element) return\n    \n    // 检查是否为触摸设备\n    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0\n    \n    if (isTouchDevice) {\n      element.addEventListener('touchstart', handleTouchStart, { passive: false })\n      element.addEventListener('touchmove', handleTouchMove, { passive: false })\n      element.addEventListener('touchend', handleTouchEnd, { passive: true })\n      element.addEventListener('touchcancel', handleTouchEnd, { passive: true })\n    }\n    \n    // 清理函数\n    return () => {\n      if (element) {\n        element.removeEventListener('touchstart', handleTouchStart)\n        element.removeEventListener('touchmove', handleTouchMove)\n        element.removeEventListener('touchend', handleTouchEnd)\n        element.removeEventListener('touchcancel', handleTouchEnd)\n      }\n      \n      // 清理动画\n      animationsRef.current.forEach((animation) => {\n        if (typeof animation === 'object' && animation.kill) {\n          animation.kill()\n        } else if (typeof animation === 'number') {\n          clearTimeout(animation)\n        }\n      })\n      animationsRef.current.clear()\n    }\n  }, [handleTouchStart, handleTouchMove, handleTouchEnd])\n  \n  // 手动控制方法\n  const controls = {\n    // 触发触摸反馈\n    triggerFeedback: (scale = feedbackScale) => {\n      const element = elementRef.current\n      if (element) {\n        const animation = createTouchFeedback(element, scale)\n        if (animation) {\n          animationsRef.current.set('manual-feedback', animation)\n        }\n      }\n    },\n    \n    // 触发涟漪效果\n    triggerRipple: (x, y) => {\n      const element = elementRef.current\n      if (element) {\n        const rect = element.getBoundingClientRect()\n        const centerX = x || rect.left + rect.width / 2\n        const centerY = y || rect.top + rect.height / 2\n        \n        const animation = createRippleEffect(element, centerX, centerY)\n        if (animation) {\n          animationsRef.current.set('manual-ripple', animation)\n        }\n      }\n    },\n    \n    // 清理所有动画\n    cleanup: () => {\n      animationsRef.current.forEach((animation) => {\n        if (typeof animation === 'object' && animation.kill) {\n          animation.kill()\n        } else if (typeof animation === 'number') {\n          clearTimeout(animation)\n        }\n      })\n      animationsRef.current.clear()\n    }\n  }\n  \n  return {\n    elementRef,\n    isTouching,\n    touchData: touchDataRef.current,\n    controls\n  }\n}\n\n/**\n * 简化版触摸动画Hook\n * 只提供基础的触摸反馈功能\n */\nexport const useSimpleTouchAnimation = (theme = 'female', options = {}) => {\n  return useTouchAnimation({\n    theme,\n    enableTouchFeedback: true,\n    rippleEffect: true,\n    enableSwipe: false,\n    enableLongPress: false,\n    enableDrag: false,\n    ...options\n  })\n}\n\n/**\n * 滑动手势Hook\n * 专门用于处理滑动手势\n */\nexport const useSwipeGesture = (onSwipe, options = {}) => {\n  return useTouchAnimation({\n    enableSwipe: true,\n    enableTouchFeedback: false,\n    rippleEffect: false,\n    onSwipe,\n    ...options\n  })\n}\n\n/**\n * 拖拽Hook\n * 专门用于处理拖拽交互\n */\nexport const useDragGesture = (onDrag, constraints = null, options = {}) => {\n  return useTouchAnimation({\n    enableDrag: true,\n    dragConstraints: constraints,\n    enableTouchFeedback: false,\n    rippleEffect: false,\n    onDrag,\n    ...options\n  })\n}\n\nexport default useTouchAnimation