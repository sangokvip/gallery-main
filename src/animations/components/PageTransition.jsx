// 页面转场组件
import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { pageTransitions } from '../presets/pageAnimations'
import gsapManager from '../core/GSAPManager'

/**
 * 页面转场组件
 * 提供页面切换时的动画效果
 */
const PageTransition = ({ 
  children, 
  transitionKey, 
  type = 'fade',
  duration = 0.5,
  onTransitionStart,
  onTransitionComplete,
  className = '',
  style = {}
}) => {
  const containerRef = useRef(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentKey, setCurrentKey] = useState(transitionKey)
  const timelineRef = useRef(null)

  useEffect(() => {
    if (transitionKey !== currentKey) {
      performTransition()
    }
  }, [transitionKey, currentKey])

  /**
   * 执行页面转场动画
   */
  const performTransition = async () => {
    if (isTransitioning || !containerRef.current) return

    setIsTransitioning(true)
    
    try {
      // 触发转场开始回调
      if (onTransitionStart) {
        onTransitionStart(currentKey, transitionKey)
      }

      // 创建转场时间轴
      const timeline = gsap.timeline()
      timelineRef.current = timeline

      // 获取转场配置
      const transition = pageTransitions[type] || pageTransitions.fade
      
      // 退出动画
      if (transition.exit) {
        timeline.to(containerRef.current, {
          ...transition.exit,
          duration: duration * 0.4,
          onComplete: () => {
            // 更新内容
            setCurrentKey(transitionKey)
          }
        })
      }

      // 进入动画
      if (transition.enter) {
        timeline.fromTo(containerRef.current, 
          // 设置初始状态
          {
            opacity: 0,
            scale: type === 'scale' ? 0.9 : 1,
            x: type === 'slide' ? 100 : 0,
            y: type === 'slideUp' ? 50 : 0
          },
          // 动画到最终状态
          {
            ...transition.enter,
            duration: duration * 0.6,
            onComplete: () => {
              setIsTransitioning(false)
              
              // 触发转场完成回调
              if (onTransitionComplete) {
                onTransitionComplete(currentKey, transitionKey)
              }
            }
          }
        )
      }

      // 注册到GSAP管理器
      gsapManager.timelines.set(`page-transition-${Date.now()}`, timeline)

    } catch (error) {
      console.error('页面转场动画错误:', error)
      setIsTransitioning(false)
    }
  }

  /**
   * 清理动画资源
   */
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`page-transition ${className} ${isTransitioning ? 'transitioning' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style
      }}
    >
      {children}
    </div>
  )
}

/**
 * 高阶组件：为页面添加转场效果
 */
export const withPageTransition = (WrappedComponent, transitionConfig = {}) => {
  return function TransitionWrappedComponent(props) {
    const [transitionKey, setTransitionKey] = useState(Date.now())

    // 监听路由变化或其他触发条件
    useEffect(() => {
      const handleRouteChange = () => {
        setTransitionKey(Date.now())
      }

      // 可以监听路由变化事件
      window.addEventListener('popstate', handleRouteChange)
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange)
      }
    }, [])

    return (
      <PageTransition
        transitionKey={transitionKey}
        {...transitionConfig}
      >
        <WrappedComponent {...props} />
      </PageTransition>
    )
  }
}

/**
 * 页面加载动画组件
 */
export const PageLoader = ({ 
  isLoading, 
  children, 
  loadingComponent,
  minLoadingTime = 500,
  onLoadingComplete
}) => {
  const [showContent, setShowContent] = useState(!isLoading)
  const [actuallyLoading, setActuallyLoading] = useState(isLoading)
  const containerRef = useRef(null)
  const loadingStartTime = useRef(Date.now())

  useEffect(() => {
    if (!isLoading && actuallyLoading) {
      // 确保最小加载时间
      const elapsed = Date.now() - loadingStartTime.current
      const remainingTime = Math.max(0, minLoadingTime - elapsed)

      setTimeout(() => {
        // 执行加载完成动画
        if (containerRef.current) {
          gsap.timeline()
            .to('.loading-overlay', {
              opacity: 0,
              scale: 0.9,
              duration: 0.4,
              ease: "power2.in"
            })
            .set('.loading-overlay', { display: 'none' })
            .fromTo('.page-content', 
              { opacity: 0, y: 20 },
              { 
                opacity: 1, 
                y: 0, 
                duration: 0.6, 
                ease: "power2.out",
                onComplete: () => {
                  setActuallyLoading(false)
                  setShowContent(true)
                  if (onLoadingComplete) {
                    onLoadingComplete()
                  }
                }
              }
            )
        }
      }, remainingTime)
    }
  }, [isLoading, actuallyLoading, minLoadingTime, onLoadingComplete])

  // 重置加载状态
  useEffect(() => {
    if (isLoading && !actuallyLoading) {
      setActuallyLoading(true)
      setShowContent(false)
      loadingStartTime.current = Date.now()
    }
  }, [isLoading, actuallyLoading])

  return (
    <div ref={containerRef} className="page-loader-container">
      {actuallyLoading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          {loadingComponent || <DefaultLoader />}
        </div>
      )}
      
      <div 
        className="page-content"
        style={{ 
          opacity: showContent ? 1 : 0,
          visibility: showContent ? 'visible' : 'hidden'
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * 默认加载动画组件
 */
const DefaultLoader = () => {
  const loaderRef = useRef(null)

  useEffect(() => {
    if (loaderRef.current) {
      // 创建加载动画
      gsap.timeline({ repeat: -1 })
        .to('.loader-dot', {
          scale: 1.5,
          opacity: 0.7,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.inOut"
        })
        .to('.loader-dot', {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.inOut"
        })
    }
  }, [])

  return (
    <div ref={loaderRef} className="default-loader" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="loader-dot"
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ff69b4'
            }}
          />
        ))}
      </div>
      <div style={{
        fontSize: '16px',
        color: '#666',
        fontFamily: 'inherit'
      }}>
        加载中...
      </div>
    </div>
  )
}

/**
 * 路由转场Hook
 */
export const usePageTransition = (transitionType = 'fade') => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionKey, setTransitionKey] = useState(0)

  const triggerTransition = (callback) => {
    setIsTransitioning(true)
    
    // 执行退出动画
    const exitDuration = 300
    setTimeout(() => {
      if (callback) callback()
      setTransitionKey(prev => prev + 1)
      
      // 执行进入动画
      setTimeout(() => {
        setIsTransitioning(false)
      }, 400)
    }, exitDuration)
  }

  return {
    isTransitioning,
    transitionKey,
    triggerTransition
  }
}

export default PageTransition