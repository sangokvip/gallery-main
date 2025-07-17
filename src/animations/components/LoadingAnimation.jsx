// LoadingAnimation.jsx - 加载动画组件
import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { getThemeConfig, getThemeColor, getThemeTiming } from '../presets/themeAnimations'
import { componentAnimations } from '../presets/componentAnimations'
import performanceMonitor from '../core/PerformanceMonitor'

/**
 * 加载动画组件
 * 提供多种加载动画样式，支持主题化和性能优化
 */
const LoadingAnimation = ({
  // 基础配置
  type = 'spinner', // 'spinner', 'pulse', 'dots', 'progressBar', 'wave'
  theme = 'female', // 主题名称
  size = 'medium', // 'small', 'medium', 'large'
  color, // 自定义颜色，覆盖主题颜色
  
  // 进度相关
  progress = null, // 进度值 0-100，仅对progressBar类型有效
  showProgress = false, // 是否显示进度文字
  
  // 行为配置
  autoStart = true, // 是否自动开始动画
  timeout = 0, // 超时时间（毫秒），0表示无超时
  onTimeout, // 超时回调
  onComplete, // 完成回调
  
  // 样式配置
  className = '',
  style = {},
  overlay = false, // 是否显示遮罩层
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  
  // 文字配置
  text = '', // 加载文字
  textPosition = 'bottom', // 'top', 'bottom', 'left', 'right'
  
  // 高级配置
  reducedMotion = false, // 是否使用简化动画
  children // 自定义内容
}) => {
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const timeoutRef = useRef(null)
  const [isVisible, setIsVisible] = useState(true)
  const [currentProgress, setCurrentProgress] = useState(progress || 0)
  
  // 获取主题配置
  const themeConfig = getThemeConfig(theme)
  const primaryColor = color || getThemeColor(theme, 'primary')
  const timing = getThemeTiming(theme, 'medium')
  
  // 尺寸配置
  const sizeConfig = {
    small: { width: 24, height: 24, fontSize: '12px' },
    medium: { width: 40, height: 40, fontSize: '14px' },
    large: { width: 60, height: 60, fontSize: '16px' }
  }
  
  const currentSize = sizeConfig[size] || sizeConfig.medium
  
  // 检查是否应该使用简化动画
  const shouldUseReducedMotion = reducedMotion || 
    performanceMonitor.performanceLevel === 'low' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // 创建动画
  useEffect(() => {
    if (!containerRef.current || !autoStart) return
    
    const container = containerRef.current
    const animationElement = container.querySelector('.loading-animation')
    
    if (!animationElement) return
    
    // 清理之前的动画
    if (animationRef.current) {
      animationRef.current.kill()
    }
    
    // 根据类型创建不同的动画
    switch (type) {
      case 'spinner':
        animationRef.current = createSpinnerAnimation(animationElement)
        break
      case 'pulse':
        animationRef.current = createPulseAnimation(animationElement)
        break
      case 'dots':
        animationRef.current = createDotsAnimation(animationElement)
        break
      case 'progressBar':
        animationRef.current = createProgressBarAnimation(animationElement)
        break
      case 'wave':
        animationRef.current = createWaveAnimation(animationElement)
        break
      default:
        animationRef.current = createSpinnerAnimation(animationElement)
    }
    
    // 设置超时
    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        if (onTimeout) onTimeout()
        setIsVisible(false)
      }, timeout)
    }
    
    return () => {
      if (animationRef.current) animationRef.current.kill()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [type, theme, autoStart, timeout, shouldUseReducedMotion])
  
  // 更新进度
  useEffect(() => {
    if (type === 'progressBar' && progress !== null) {
      setCurrentProgress(progress)
      updateProgressBar(progress)
    }
  }, [progress, type])
  
  // 创建旋转动画
  const createSpinnerAnimation = (element) => {
    if (shouldUseReducedMotion) {
      return gsap.to(element, {
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: "none"
      })
    }
    
    return componentAnimations.loading.spinner.animation(element)
  }
  
  // 创建脉冲动画
  const createPulseAnimation = (element) => {
    if (shouldUseReducedMotion) {
      return gsap.to(element, {
        opacity: 0.5,
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      })
    }
    
    return componentAnimations.loading.pulse.animation(element)
  }
  
  // 创建点阵动画
  const createDotsAnimation = (element) => {
    const dots = element.querySelectorAll('.dot')
    
    if (shouldUseReducedMotion) {
      return gsap.to(dots, {
        opacity: 0.3,
        duration: 0.8,
        stagger: 0.2,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      })
    }
    
    return componentAnimations.loading.dots.animation(element)
  }
  
  // 创建进度条动画
  const createProgressBarAnimation = (element) => {
    const progressFill = element.querySelector('.progress-fill')
    if (!progressFill) return null
    
    return gsap.set(progressFill, { width: `${currentProgress}%` })
  }
  
  // 创建波浪动画
  const createWaveAnimation = (element) => {
    const waves = element.querySelectorAll('.wave')
    
    if (shouldUseReducedMotion) {
      return gsap.to(waves, {
        scaleY: 0.3,
        duration: 1,
        stagger: 0.1,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      })
    }
    
    return gsap.to(waves, {
      scaleY: [0.3, 1, 0.3],
      duration: 1.2,
      stagger: 0.1,
      repeat: -1,
      ease: "power2.inOut"
    })
  }
  
  // 更新进度条
  const updateProgressBar = (newProgress) => {
    const container = containerRef.current
    if (!container) return
    
    const progressFill = container.querySelector('.progress-fill')
    if (progressFill) {
      gsap.to(progressFill, {
        width: `${newProgress}%`,
        duration: 0.5,
        ease: "power2.out"
      })
    }
    
    // 检查是否完成
    if (newProgress >= 100 && onComplete) {
      setTimeout(() => onComplete(), 500)
    }
  }
  
  // 手动控制动画
  const controls = {
    start: () => {
      if (animationRef.current) {
        animationRef.current.play()
      }
    },
    pause: () => {
      if (animationRef.current) {
        animationRef.current.pause()
      }
    },
    stop: () => {
      if (animationRef.current) {
        animationRef.current.kill()
      }
      setIsVisible(false)
    },
    restart: () => {
      if (animationRef.current) {
        animationRef.current.restart()
      }
    }
  }
  
  // 渲染不同类型的加载动画
  const renderLoadingContent = () => {
    const baseStyle = {
      width: currentSize.width,
      height: currentSize.height,
      color: primaryColor
    }
    
    switch (type) {
      case 'spinner':
        return (
          <div 
            className="loading-animation spinner"
            style={{
              ...baseStyle,
              border: `3px solid transparent`,
              borderTop: `3px solid ${primaryColor}`,
              borderRadius: '50%'
            }}
          />
        )
      
      case 'pulse':
        return (
          <div 
            className="loading-animation pulse"
            style={{
              ...baseStyle,
              backgroundColor: primaryColor,
              borderRadius: '50%'
            }}
          />
        )
      
      case 'dots':
        return (
          <div className="loading-animation dots" style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="dot"
                style={{
                  width: currentSize.width / 4,
                  height: currentSize.width / 4,
                  backgroundColor: primaryColor,
                  borderRadius: '50%'
                }}
              />
            ))}
          </div>
        )
      
      case 'progressBar':
        return (
          <div className="loading-animation progress-bar" style={{ width: currentSize.width * 3 }}>
            <div 
              style={{
                width: '100%',
                height: currentSize.height / 4,
                backgroundColor: `${primaryColor}20`,
                borderRadius: currentSize.height / 8,
                overflow: 'hidden'
              }}
            >
              <div 
                className="progress-fill"
                style={{
                  height: '100%',
                  backgroundColor: primaryColor,
                  borderRadius: currentSize.height / 8,
                  width: `${currentProgress}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            {showProgress && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '8px',
                fontSize: currentSize.fontSize,
                color: primaryColor
              }}>
                {Math.round(currentProgress)}%
              </div>
            )}
          </div>
        )
      
      case 'wave':
        return (
          <div className="loading-animation wave-container" style={{ display: 'flex', gap: '2px', alignItems: 'end' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="wave"
                style={{
                  width: currentSize.width / 8,
                  height: currentSize.height,
                  backgroundColor: primaryColor,
                  borderRadius: '2px',
                  transformOrigin: 'bottom'
                }}
              />
            ))}
          </div>
        )
      
      default:
        return null
    }
  }
  
  // 渲染文字
  const renderText = () => {
    if (!text) return null
    
    return (
      <div 
        className="loading-text"
        style={{
          fontSize: currentSize.fontSize,
          color: primaryColor,
          marginTop: textPosition === 'bottom' ? '12px' : 0,
          marginBottom: textPosition === 'top' ? '12px' : 0,
          marginLeft: textPosition === 'right' ? '12px' : 0,
          marginRight: textPosition === 'left' ? '12px' : 0
        }}
      >
        {text}
      </div>
    )
  }
  
  if (!isVisible) return null
  
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: textPosition === 'top' || textPosition === 'bottom' ? 'column' : 'row',
    ...style
  }
  
  const content = (
    <div 
      ref={containerRef}
      className={`loading-container ${className}`}
      style={containerStyle}
    >
      {textPosition === 'top' && renderText()}
      {textPosition === 'left' && renderText()}
      
      {children || renderLoadingContent()}
      
      {textPosition === 'right' && renderText()}
      {textPosition === 'bottom' && renderText()}
    </div>
  )
  
  // 如果需要遮罩层
  if (overlay) {
    return (
      <div 
        className="loading-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: overlayColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        {content}
      </div>
    )
  }
  
  return content
}

// 导出控制接口
LoadingAnimation.displayName = 'LoadingAnimation'

// 预设配置
export const LoadingPresets = {
  // 页面加载
  pageLoading: {
    type: 'spinner',
    size: 'large',
    overlay: true,
    text: '加载中...',
    textPosition: 'bottom'
  },
  
  // 按钮加载
  buttonLoading: {
    type: 'spinner',
    size: 'small',
    overlay: false
  },
  
  // 数据加载
  dataLoading: {
    type: 'dots',
    size: 'medium',
    text: '正在获取数据...',
    textPosition: 'bottom'
  },
  
  // 上传进度
  uploadProgress: {
    type: 'progressBar',
    size: 'medium',
    showProgress: true,
    text: '上传中...',
    textPosition: 'top'
  },
  
  // 处理中
  processing: {
    type: 'wave',
    size: 'medium',
    text: '处理中...',
    textPosition: 'bottom'
  }
}

/**
 * 快速创建预设加载动画
 * @param {string} presetName - 预设名称
 * @param {Object} overrides - 覆盖配置
 * @returns {JSX.Element} 加载动画组件
 */
export const createLoadingPreset = (presetName, overrides = {}) => {
  const preset = LoadingPresets[presetName]
  if (!preset) {
    console.warn(`Loading preset "${presetName}" not found`)
    return <LoadingAnimation {...overrides} />
  }
  
  return <LoadingAnimation {...preset} {...overrides} />
}

export default LoadingAnimation