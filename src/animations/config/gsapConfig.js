// GSAP核心配置文件
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'

// 注册GSAP插件
gsap.registerPlugin(ScrollTrigger, TextPlugin)

// 全局GSAP配置
export const GSAP_CONFIG = {
  // 默认动画参数
  defaults: {
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.1
  },
  
  // 性能优化配置
  performance: {
    // 启用硬件加速
    force3D: true,
    // 自动清理完成的动画
    autoKill: true,
    // 最大并发动画数
    maxConcurrentAnimations: 10
  },
  
  // 响应式断点
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  },
  
  // 动画时长配置
  durations: {
    fast: 0.3,
    medium: 0.6,
    slow: 0.9,
    extraSlow: 1.2
  },
  
  // 缓动函数配置
  easings: {
    // 基础缓动
    easeOut: "power2.out",
    easeIn: "power2.in",
    easeInOut: "power2.inOut",
    
    // 弹性缓动
    bounce: "back.out(1.7)",
    elastic: "elastic.out(1, 0.3)",
    
    // 主题化缓动
    gentle: "power1.out",      // 女生版 - 柔和
    confident: "power3.out",   // 男生版 - 自信
    dramatic: "power4.out"     // S版 - 戏剧化
  },
  
  // 错落延迟配置
  staggers: {
    tight: 0.05,
    normal: 0.1,
    loose: 0.2,
    wide: 0.3
  }
}

// 初始化GSAP全局设置
export const initializeGSAP = () => {
  // 设置默认值
  gsap.defaults(GSAP_CONFIG.defaults)
  
  // 配置ScrollTrigger
  ScrollTrigger.config({
    // 限制刷新频率以提升性能
    limitCallbacks: true,
    // 自动刷新
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
  })
  
  // 性能优化设置
  if (GSAP_CONFIG.performance.force3D) {
    gsap.set("*", { force3D: true })
  }
  
  // 检测用户偏好
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    // 如果用户偏好减少动画，则缩短动画时长
    gsap.globalTimeline.timeScale(0.5)
  }
  
  console.log('🎬 GSAP initialized with config:', GSAP_CONFIG)
}

// 获取响应式动画参数
export const getResponsiveConfig = () => {
  const width = window.innerWidth
  const { breakpoints } = GSAP_CONFIG
  
  if (width < breakpoints.mobile) {
    return {
      duration: GSAP_CONFIG.durations.fast,
      stagger: GSAP_CONFIG.staggers.tight,
      scale: 0.8 // 移动端动画幅度稍小
    }
  } else if (width < breakpoints.tablet) {
    return {
      duration: GSAP_CONFIG.durations.medium,
      stagger: GSAP_CONFIG.staggers.normal,
      scale: 0.9
    }
  } else {
    return {
      duration: GSAP_CONFIG.durations.medium,
      stagger: GSAP_CONFIG.staggers.normal,
      scale: 1
    }
  }
}

// 导出GSAP实例
export { gsap, ScrollTrigger }
export default GSAP_CONFIG