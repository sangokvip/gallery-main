// AnimatedChart.jsx - 动画图表组件
import React, { useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'

/**
 * 动画图表组件
 * 为Recharts图表添加GSAP动画效果
 */
const AnimatedChart = React.forwardRef(({
  children,
  type = 'radar',
  animationDuration = 1.5,
  staggerDelay = 0.2,
  animateOnMount = true,
  animateOnDataChange = false,
  enableHover = true,
  className = '',
  style = {},
  onAnimationStart,
  onAnimationComplete
}, ref) => {
  const containerRef = useRef()
  const animationRef = useRef()
  
  // 雷达图动画
  const animateRadarChart = useCallback((container) => {
    const paths = container.querySelectorAll('.recharts-radar-polygon, .recharts-polygon')
    const dots = container.querySelectorAll('.recharts-dot, circle')
    
    if (paths.length === 0 && dots.length === 0) return null
    
    const timeline = gsap.timeline({
      onStart: () => onAnimationStart && onAnimationStart('radar'),
      onComplete: () => onAnimationComplete && onAnimationComplete('radar')
    })
    
    // 隐藏所有元素
    gsap.set([...paths, ...dots], { opacity: 0 })
    
    timeline
      .fromTo(paths, 
        { opacity: 0, scale: 0.3 },
        { opacity: 0.7, scale: 1, duration: animationDuration, ease: "back.out(1.7)" }
      )
      .fromTo(dots,
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: animationDuration * 0.6, stagger: staggerDelay, ease: "back.out(2)" },
        "-=0.3"
      )
    
    return timeline
  }, [animationDuration, staggerDelay, onAnimationStart, onAnimationComplete])
  
  // 柱状图动画
  const animateBarChart = useCallback((container) => {
    const bars = container.querySelectorAll('.recharts-bar-rectangle, .recharts-rectangle')
    
    if (bars.length === 0) return null
    
    const timeline = gsap.timeline({
      onStart: () => onAnimationStart && onAnimationStart('bar'),
      onComplete: () => onAnimationComplete && onAnimationComplete('bar')
    })
    
    timeline.fromTo(bars,
      { scaleY: 0, transformOrigin: "bottom center", opacity: 0 },
      { scaleY: 1, opacity: 1, duration: animationDuration, stagger: staggerDelay, ease: "power2.out" }
    )
    
    return timeline
  }, [animationDuration, staggerDelay, onAnimationStart, onAnimationComplete])
  
  // 执行动画
  const executeAnimation = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    
    // 清理之前的动画
    if (animationRef.current) {
      animationRef.current.kill()
    }
    
    // 等待图表渲染完成
    setTimeout(() => {
      let animationFunction
      
      switch (type) {
        case 'bar':
          animationFunction = animateBarChart
          break
        case 'radar':
        default:
          animationFunction = animateRadarChart
          break
      }
      
      animationRef.current = animationFunction(container)
    }, 100)
    
  }, [type, animateRadarChart, animateBarChart])
  
  // 组件挂载时执行动画
  useEffect(() => {
    if (animateOnMount) {
      executeAnimation()
    }
  }, [animateOnMount, executeAnimation])
  
  // 清理函数
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill()
      }
    }
  }, [])
  
  // 暴露控制方法
  React.useImperativeHandle(ref, () => ({
    play: () => animationRef.current?.play(),
    pause: () => animationRef.current?.pause(),
    restart: () => executeAnimation(),
    kill: () => animationRef.current?.kill()
  }), [executeAnimation])
  
  return (
    <div 
      ref={containerRef}
      className={`animated-chart ${className}`}
      style={style}
    >
      {children}
    </div>
  )
})

AnimatedChart.displayName = 'AnimatedChart'

// 预设配置
export const ChartAnimationPresets = {
  quick: { animationDuration: 0.8, staggerDelay: 0.05 },
  standard: { animationDuration: 1.5, staggerDelay: 0.1 },
  slow: { animationDuration: 2.5, staggerDelay: 0.2 }
}

export default AnimatedChart