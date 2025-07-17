// ReportAnimation.jsx - 报告生成动画组件
import React, { useEffect, useRef, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getThemeConfig, getThemeColor, getThemeTiming } from '../presets/themeAnimations'
import performanceMonitor from '../core/PerformanceMonitor'
import gsapManager from '../core/GSAPManager'
import LoadingAnimation from './LoadingAnimation'

// 确保ScrollTrigger插件已注册
gsap.registerPlugin(ScrollTrigger)

/**
 * 报告生成动画组件
 * 为测试报告提供完整的动画展示效果
 */
const ReportAnimation = ({
  // 基础配置
  children,
  theme = 'female',
  
  // 动画配置
  animateOnMount = true,
  sequentialAnimation = true, // 是否按顺序显示各部分
  showProgress = true, // 是否显示生成进度
  
  // 时间配置
  totalDuration = 3, // 总动画时长（秒）
  staggerDelay = 0.2, // 各部分间隔时间
  
  // 回调函数
  onAnimationStart = null,
  onAnimationComplete = null,
  onSectionComplete = null, // 每个部分完成时的回调
  
  // 样式配置
  className = '',
  style = {},
  
  // 性能配置
  reducedMotion = false
}) => {
  const containerRef = useRef(null)
  const animationRef = useRef(null)
  const progressRef = useRef(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentSection, setCurrentSection] = useState('')
  
  // 获取主题配置
  const themeConfig = getThemeConfig(theme)
  const primaryColor = getThemeColor(theme, 'primary')
  const timing = getThemeTiming(theme, 'medium')
  
  // 检查是否应该使用简化动画
  const shouldUseReducedMotion = reducedMotion || 
    performanceMonitor.performanceLevel === 'low' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // 报告各部分的选择器和标题
  const reportSections = [
    {
      selector: '.report-header, .report-title',
      title: '生成报告标题',
      progress: 10
    },
    {
      selector: '.user-info, .nickname-section',
      title: '加载用户信息',
      progress: 20
    },
    {
      selector: '.radar-chart-container, .recharts-wrapper',
      title: '绘制雷达图',
      progress: 40
    },
    {
      selector: '.bar-chart-container, .category-analysis',
      title: '生成分类分析',
      progress: 60
    },
    {
      selector: '.detailed-analysis, .analysis-text',
      title: '分析详细结果',
      progress: 80
    },
    {
      selector: '.qr-code-section, .share-section',
      title: '生成分享码',
      progress: 90
    },
    {
      selector: '.report-footer, .export-buttons',
      title: '完成报告生成',
      progress: 100
    }
  ]
  
  // 创建报告生成动画
  const createReportAnimation = useCallback(() => {\n    const container = containerRef.current\n    if (!container) return null\n    \n    setIsGenerating(true)\n    setCurrentProgress(0)\n    \n    if (onAnimationStart) {\n      onAnimationStart()\n    }\n    \n    const masterTimeline = gsap.timeline({\n      onComplete: () => {\n        setIsGenerating(false)\n        setCurrentProgress(100)\n        if (onAnimationComplete) {\n          onAnimationComplete()\n        }\n      }\n    })\n    \n    if (shouldUseReducedMotion) {\n      // 简化动画 - 直接显示所有内容\n      const allElements = container.querySelectorAll('*')\n      \n      masterTimeline\n        .set(allElements, { opacity: 0 })\n        .to(allElements, {\n          opacity: 1,\n          duration: timing * 0.5,\n          stagger: 0.02,\n          ease: \"power2.out\",\n          onUpdate: () => {\n            const progress = masterTimeline.progress() * 100\n            setCurrentProgress(Math.round(progress))\n          }\n        })\n      \n    } else if (sequentialAnimation) {\n      // 按顺序动画各部分\n      reportSections.forEach((section, index) => {\n        const elements = container.querySelectorAll(section.selector)\n        \n        if (elements.length > 0) {\n          // 设置初始状态\n          gsap.set(elements, { \n            opacity: 0, \n            y: 30, \n            scale: 0.95 \n          })\n          \n          // 添加到主时间轴\n          masterTimeline\n            .add(() => {\n              setCurrentSection(section.title)\n              setCurrentProgress(section.progress)\n              \n              if (onSectionComplete) {\n                onSectionComplete(section, index)\n              }\n            })\n            .to(elements, {\n              opacity: 1,\n              y: 0,\n              scale: 1,\n              duration: timing * 0.8,\n              stagger: 0.1,\n              ease: \"back.out(1.7)\"\n            }, index * staggerDelay)\n        }\n      })\n      \n    } else {\n      // 同时动画所有部分\n      const allSections = reportSections.map(section => \n        container.querySelectorAll(section.selector)\n      ).flat()\n      \n      if (allSections.length > 0) {\n        gsap.set(allSections, { \n          opacity: 0, \n          y: 20, \n          scale: 0.98 \n        })\n        \n        masterTimeline\n          .to(allSections, {\n            opacity: 1,\n            y: 0,\n            scale: 1,\n            duration: totalDuration,\n            stagger: staggerDelay,\n            ease: \"power2.out\",\n            onUpdate: () => {\n              const progress = masterTimeline.progress() * 100\n              setCurrentProgress(Math.round(progress))\n            }\n          })\n      }\n    }\n    \n    return masterTimeline\n  }, [shouldUseReducedMotion, sequentialAnimation, timing, staggerDelay, totalDuration, onAnimationStart, onAnimationComplete, onSectionComplete])\n  \n  // 创建滚动触发动画\n  const createScrollAnimations = useCallback(() => {\n    const container = containerRef.current\n    if (!container || shouldUseReducedMotion) return\n    \n    // 为各个部分添加滚动触发动画\n    reportSections.forEach((section, index) => {\n      const elements = container.querySelectorAll(section.selector)\n      \n      elements.forEach(element => {\n        gsap.fromTo(element, \n          {\n            opacity: 0,\n            y: 50\n          },\n          {\n            opacity: 1,\n            y: 0,\n            duration: timing,\n            ease: \"power2.out\",\n            scrollTrigger: {\n              trigger: element,\n              start: \"top 85%\",\n              end: \"bottom 15%\",\n              toggleActions: \"play none none reverse\"\n            }\n          }\n        )\n      })\n    })\n  }, [shouldUseReducedMotion, timing])\n  \n  // 创建图表特殊动画\n  const createChartAnimations = useCallback(() => {\n    const container = containerRef.current\n    if (!container) return\n    \n    // 雷达图动画\n    const radarElements = container.querySelectorAll('.recharts-radar-polygon')\n    radarElements.forEach(element => {\n      gsap.fromTo(element,\n        { \n          opacity: 0,\n          scale: 0.3,\n          transformOrigin: \"center center\"\n        },\n        {\n          opacity: 0.7,\n          scale: 1,\n          duration: timing * 1.2,\n          ease: \"back.out(1.7)\",\n          scrollTrigger: {\n            trigger: element,\n            start: \"top 80%\",\n            toggleActions: \"play none none reverse\"\n          }\n        }\n      )\n    })\n    \n    // 柱状图动画\n    const barElements = container.querySelectorAll('.recharts-bar-rectangle')\n    barElements.forEach((element, index) => {\n      gsap.fromTo(element,\n        {\n          scaleY: 0,\n          transformOrigin: \"bottom center\"\n        },\n        {\n          scaleY: 1,\n          duration: timing * 0.8,\n          delay: index * 0.1,\n          ease: \"power2.out\",\n          scrollTrigger: {\n            trigger: element,\n            start: \"top 85%\",\n            toggleActions: \"play none none reverse\"\n          }\n        }\n      )\n    })\n    \n    // 数据点动画\n    const dotElements = container.querySelectorAll('.recharts-dot')\n    dotElements.forEach((element, index) => {\n      gsap.fromTo(element,\n        {\n          opacity: 0,\n          scale: 0\n        },\n        {\n          opacity: 1,\n          scale: 1,\n          duration: timing * 0.5,\n          delay: index * 0.05,\n          ease: \"back.out(2)\",\n          scrollTrigger: {\n            trigger: element,\n            start: \"top 90%\",\n            toggleActions: \"play none none reverse\"\n          }\n        }\n      )\n    })\n  }, [timing])\n  \n  // 创建文字打字机效果\n  const createTypewriterEffect = useCallback((element, text, duration = 2) => {\n    if (!element || !text) return null\n    \n    const chars = text.split('')\n    element.textContent = ''\n    \n    return gsap.to({}, {\n      duration: duration,\n      ease: \"none\",\n      onUpdate: function() {\n        const progress = this.progress()\n        const currentLength = Math.floor(progress * chars.length)\n        element.textContent = chars.slice(0, currentLength).join('')\n      }\n    })\n  }, [])\n  \n  // 执行动画\n  const executeAnimation = useCallback(() => {\n    // 清理之前的动画\n    if (animationRef.current) {\n      animationRef.current.kill()\n    }\n    \n    // 创建主动画\n    animationRef.current = createReportAnimation()\n    \n    // 创建滚动动画\n    setTimeout(() => {\n      createScrollAnimations()\n      createChartAnimations()\n    }, 100)\n    \n  }, [createReportAnimation, createScrollAnimations, createChartAnimations])\n  \n  // 组件挂载时执行动画\n  useEffect(() => {\n    if (animateOnMount) {\n      // 延迟执行，确保DOM已渲染\n      setTimeout(executeAnimation, 200)\n    }\n  }, [animateOnMount, executeAnimation])\n  \n  // 清理函数\n  useEffect(() => {\n    return () => {\n      if (animationRef.current) {\n        animationRef.current.kill()\n      }\n      ScrollTrigger.getAll().forEach(trigger => {\n        if (trigger.trigger && containerRef.current?.contains(trigger.trigger)) {\n          trigger.kill()\n        }\n      })\n    }\n  }, [])\n  \n  // 手动控制方法\n  const controls = {\n    start: executeAnimation,\n    pause: () => {\n      if (animationRef.current) {\n        animationRef.current.pause()\n      }\n    },\n    resume: () => {\n      if (animationRef.current) {\n        animationRef.current.resume()\n      }\n    },\n    restart: () => {\n      executeAnimation()\n    },\n    kill: () => {\n      if (animationRef.current) {\n        animationRef.current.kill()\n      }\n      setIsGenerating(false)\n      setCurrentProgress(0)\n    }\n  }\n  \n  return (\n    <div \n      ref={containerRef}\n      className={`report-animation-container ${className}`}\n      style={{\n        '--report-primary-color': primaryColor,\n        '--report-animation-duration': `${timing}s`,\n        position: 'relative',\n        ...style\n      }}\n    >\n      {/* 生成进度指示器 */}\n      {showProgress && isGenerating && (\n        <div \n          ref={progressRef}\n          style={{\n            position: 'fixed',\n            top: '50%',\n            left: '50%',\n            transform: 'translate(-50%, -50%)',\n            zIndex: 9999,\n            backgroundColor: 'rgba(255, 255, 255, 0.95)',\n            padding: '20px',\n            borderRadius: '12px',\n            boxShadow: `0 8px 32px ${primaryColor}40`,\n            textAlign: 'center',\n            minWidth: '300px'\n          }}\n        >\n          <LoadingAnimation \n            type=\"progressBar\"\n            theme={theme}\n            progress={currentProgress}\n            showProgress={true}\n            text={currentSection || '正在生成报告...'}\n            textPosition=\"bottom\"\n            size=\"medium\"\n          />\n        </div>\n      )}\n      \n      {/* 报告内容 */}\n      {children}\n    </div>\n  )\n}\n\n// 使用forwardRef包装组件以暴露控制方法\nconst ReportAnimationComponent = React.forwardRef((props, ref) => {\n  const controlsRef = useRef(null)\n  \n  React.useImperativeHandle(ref, () => controlsRef.current, [])\n  \n  return <ReportAnimation {...props} ref={controlsRef} />\n})\n\nReportAnimationComponent.displayName = 'ReportAnimation'\n\n// 预设配置\nexport const ReportAnimationPresets = {\n  // 快速生成\n  quick: {\n    totalDuration: 1.5,\n    staggerDelay: 0.1,\n    showProgress: false,\n    sequentialAnimation: false\n  },\n  \n  // 标准生成\n  standard: {\n    totalDuration: 3,\n    staggerDelay: 0.2,\n    showProgress: true,\n    sequentialAnimation: true\n  },\n  \n  // 详细生成\n  detailed: {\n    totalDuration: 5,\n    staggerDelay: 0.3,\n    showProgress: true,\n    sequentialAnimation: true\n  },\n  \n  // 简化生成\n  reduced: {\n    totalDuration: 1,\n    staggerDelay: 0.05,\n    showProgress: false,\n    reducedMotion: true\n  }\n}\n\n/**\n * 快速创建预设报告动画\n * @param {string} presetName - 预设名称\n * @param {Object} overrides - 覆盖配置\n * @returns {JSX.Element} 报告动画组件\n */\nexport const createReportAnimationPreset = (presetName, overrides = {}) => {\n  const preset = ReportAnimationPresets[presetName]\n  if (!preset) {\n    console.warn(`Report animation preset \"${presetName}\" not found`)\n    return <ReportAnimationComponent {...overrides} />\n  }\n  \n  return <ReportAnimationComponent {...preset} {...overrides} />\n}\n\nexport default ReportAnimationComponent