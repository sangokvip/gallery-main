// 主题动画配置
import { gsap } from 'gsap'
import { GSAP_CONFIG } from '../config/gsapConfig'

/**
 * 主题动画配置
 * 为不同主题提供一致的动画风格和参数
 */
export const themeAnimations = {
  /**
   * 女生版主题 - 柔和粉色风格
   */
  female: {
    // 颜色配置
    colors: {
      primary: "#ff69b4",
      secondary: "#ff8dc3",
      accent: "#c13b86",
      highlight: "rgba(255, 105, 180, 0.3)",
      shadow: "rgba(255, 105, 180, 0.2)"
    },
    
    // 时间配置
    timing: {
      fast: 0.3,
      medium: 0.6,
      slow: 0.9
    },
    
    // 缓动函数配置
    easing: {
      primary: "power2.out",
      bounce: "back.out(1.7)",
      elastic: "elastic.out(1, 0.3)"
    },
    
    // 特效配置
    effects: {
      // 柔和效果
      gentle: true,
      // 活泼效果
      playful: true,
      // 优雅效果
      elegant: true
    },
    
    // 动画预设
    animations: {
      // 入场动画
      entrance: (element) => {
        return gsap.fromTo(element,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "back.out(1.2)"
          }
        )
      },
      
      // 按钮悬停
      buttonHover: (element, isEnter) => {
        return gsap.to(element, {
          scale: isEnter ? 1.02 : 1,
          y: isEnter ? -2 : 0,
          boxShadow: isEnter 
            ? "0 8px 25px rgba(255, 105, 180, 0.3)" 
            : "0 4px 12px rgba(255, 105, 180, 0.1)",
          duration: 0.3,
          ease: "power2.out"
        })
      },
      
      // 按钮点击
      buttonClick: (element) => {
        return gsap.timeline()
          .to(element, {
            scale: 0.95,
            duration: 0.1,
            ease: "power2.inOut"
          })
          .to(element, {
            scale: 1.02,
            duration: 0.2,
            ease: "elastic.out(1, 0.3)"
          })
      },
      
      // 卡片悬停
      cardHover: (element, isEnter) => {
        return gsap.to(element, {
          scale: isEnter ? 1.02 : 1,
          y: isEnter ? -5 : 0,
          boxShadow: isEnter 
            ? "0 12px 30px rgba(255, 105, 180, 0.2)" 
            : "0 4px 12px rgba(255, 105, 180, 0.1)",
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }
  },
  
  /**
   * 男生版主题 - 硬朗蓝色风格
   */
  male: {
    // 颜色配置
    colors: {
      primary: "#2196F3",
      secondary: "#42A5F5",
      accent: "#1976D2",
      highlight: "rgba(33, 150, 243, 0.3)",
      shadow: "rgba(33, 150, 243, 0.2)"
    },
    
    // 时间配置
    timing: {
      fast: 0.2,
      medium: 0.5,
      slow: 0.8
    },
    
    // 缓动函数配置
    easing: {
      primary: "power3.out",
      bounce: "back.out(2)",
      elastic: "elastic.out(1.2, 0.4)"
    },
    
    // 特效配置
    effects: {
      // 强劲效果
      strong: true,
      // 直接效果
      direct: true,
      // 自信效果
      confident: true
    },
    
    // 动画预设
    animations: {
      // 入场动画
      entrance: (element) => {
        return gsap.fromTo(element,
          { opacity: 0, x: -30, rotationY: 10 },
          {
            opacity: 1,
            x: 0,
            rotationY: 0,
            duration: 0.5,
            ease: "power3.out"
          }
        )
      },
      
      // 按钮悬停
      buttonHover: (element, isEnter) => {
        return gsap.to(element, {
          scale: isEnter ? 1.01 : 1,
          y: isEnter ? -2 : 0,
          boxShadow: isEnter 
            ? "0 8px 25px rgba(33, 150, 243, 0.3)" 
            : "0 4px 12px rgba(33, 150, 243, 0.1)",
          duration: 0.3,
          ease: "power3.out"
        })
      },
      
      // 按钮点击
      buttonClick: (element) => {
        return gsap.timeline()
          .to(element, {
            scale: 0.92,
            rotationX: 5,
            duration: 0.15,
            ease: "power2.inOut"
          })
          .to(element, {
            scale: 1,
            rotationX: 0,
            duration: 0.2,
            ease: "back.out(1.5)"
          })
      },
      
      // 卡片悬停
      cardHover: (element, isEnter) => {
        return gsap.to(element, {
          rotationY: isEnter ? 3 : 0,
          scale: isEnter ? 1.01 : 1,
          boxShadow: isEnter 
            ? "0 10px 30px rgba(33, 150, 243, 0.3)" 
            : "0 4px 12px rgba(33, 150, 243, 0.1)",
          duration: 0.4,
          ease: "power2.out"
        })
      }
    }
  },
  
  /**
   * S版主题 - 强烈红色风格
   */
  s: {
    // 颜色配置
    colors: {
      primary: "#ff0000",
      secondary: "#ff5252",
      accent: "#c50000",
      highlight: "rgba(255, 0, 0, 0.3)",
      shadow: "rgba(255, 0, 0, 0.2)"
    },
    
    // 时间配置
    timing: {
      fast: 0.15,
      medium: 0.4,
      slow: 0.7
    },
    
    // 缓动函数配置
    easing: {
      primary: "power4.out",
      bounce: "back.out(3)",
      elastic: "elastic.out(1.5, 0.2)"
    },
    
    // 特效配置
    effects: {
      // 强烈效果
      intense: true,
      // 戏剧化效果
      dramatic: true,
      // 支配效果
      commanding: true
    },
    
    // 动画预设
    animations: {
      // 入场动画
      entrance: (element) => {
        return gsap.fromTo(element,
          { opacity: 0, rotation: 5, scale: 0.9, y: 30 },
          {
            opacity: 1,
            rotation: 0,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
          }
        )
      },
      
      // 按钮悬停
      buttonHover: (element, isEnter) => {
        return gsap.to(element, {
          scale: isEnter ? 1.03 : 1,
          y: isEnter ? -3 : 0,
          boxShadow: isEnter 
            ? "0 8px 25px rgba(255, 0, 0, 0.3)" 
            : "0 4px 12px rgba(255, 0, 0, 0.1)",
          duration: 0.3,
          ease: "power2.out"
        })
      },
      
      // 按钮点击
      buttonClick: (element) => {
        return gsap.timeline()
          .to(element, {
            scale: 0.9,
            rotation: 2,
            duration: 0.1,
            ease: "power3.inOut"
          })
          .to(element, {
            scale: 1,
            rotation: 0,
            duration: 0.2,
            ease: "back.out(2)"
          })
      },
      
      // 卡片悬停
      cardHover: (element, isEnter) => {
        return gsap.to(element, {
          rotation: isEnter ? -1 : 0,
          scale: isEnter ? 1.03 : 1,
          boxShadow: isEnter 
            ? "0 12px 35px rgba(255, 0, 0, 0.4)" 
            : "0 4px 12px rgba(255, 0, 0, 0.2)",
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }
  },
  
  /**
   * 留言板主题 - 社交互动风格
   */
  message: {
    // 颜色配置
    colors: {
      primary: "#9c27b0",
      secondary: "#ba68c8",
      accent: "#7b1fa2",
      highlight: "rgba(156, 39, 176, 0.3)",
      shadow: "rgba(156, 39, 176, 0.2)"
    },
    
    // 时间配置
    timing: {
      fast: 0.25,
      medium: 0.5,
      slow: 0.8
    },
    
    // 缓动函数配置
    easing: {
      primary: "power2.out",
      bounce: "back.out(1.5)",
      elastic: "elastic.out(1, 0.4)"
    },
    
    // 特效配置
    effects: {
      // 互动效果
      interactive: true,
      // 社交效果
      social: true,
      // 活跃效果
      lively: true
    },
    
    // 动画预设
    animations: {
      // 消息入场动画
      messageEntrance: (element) => {
        return gsap.fromTo(element,
          { opacity: 0, scale: 0.9, y: 15 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.4,
            ease: "back.out(1.3)"
          }
        )
      },
      
      // 消息悬停
      messageHover: (element, isEnter) => {
        return gsap.to(element, {
          scale: isEnter ? 1.02 : 1,
          y: isEnter ? -2 : 0,
          boxShadow: isEnter 
            ? "0 6px 20px rgba(156, 39, 176, 0.2)" 
            : "0 2px 8px rgba(156, 39, 176, 0.1)",
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }
  }
}

/**
 * 获取主题动画配置
 * @param {string} theme - 主题名称 ('female', 'male', 's', 'message')
 * @returns {Object} 主题动画配置对象
 */
export const getThemeConfig = (theme) => {
  return themeAnimations[theme] || themeAnimations.female
}

/**
 * 应用主题动画
 * @param {Element} element - 目标元素
 * @param {string} theme - 主题名称
 * @param {string} animationType - 动画类型
 * @param {*} params - 动画参数
 * @returns {gsap.timeline|null} 动画时间轴
 */
export const applyThemeAnimation = (element, theme, animationType, ...params) => {
  const themeConfig = getThemeConfig(theme)
  const animation = themeConfig.animations[animationType]
  
  if (animation && element) {
    return animation(element, ...params)
  }
  
  return null
}

/**
 * 创建主题化的动画时间轴
 * @param {string} theme - 主题名称
 * @param {Object} options - 时间轴选项
 * @returns {gsap.timeline} GSAP时间轴
 */
export const createThemeTimeline = (theme, options = {}) => {
  const themeConfig = getThemeConfig(theme)
  
  // 使用主题的默认时间配置
  const defaultOptions = {
    duration: themeConfig.timing.medium,
    ease: themeConfig.easing.primary,
    ...options
  }
  
  return gsap.timeline(defaultOptions)
}

/**
 * 获取主题颜色
 * @param {string} theme - 主题名称
 * @param {string} colorType - 颜色类型 ('primary', 'secondary', 'accent', 'highlight', 'shadow')
 * @returns {string} 颜色值
 */
export const getThemeColor = (theme, colorType = 'primary') => {
  const themeConfig = getThemeConfig(theme)
  return themeConfig.colors[colorType] || themeConfig.colors.primary
}

/**
 * 获取主题时间配置
 * @param {string} theme - 主题名称
 * @param {string} speed - 速度类型 ('fast', 'medium', 'slow')
 * @returns {number} 时间值（秒）
 */
export const getThemeTiming = (theme, speed = 'medium') => {
  const themeConfig = getThemeConfig(theme)
  return themeConfig.timing[speed] || themeConfig.timing.medium
}

/**
 * 获取主题缓动函数
 * @param {string} theme - 主题名称
 * @param {string} easingType - 缓动类型 ('primary', 'bounce', 'elastic')
 * @returns {string} 缓动函数名称
 */
export const getThemeEasing = (theme, easingType = 'primary') => {
  const themeConfig = getThemeConfig(theme)
  return themeConfig.easing[easingType] || themeConfig.easing.primary
}

/**
 * 主题切换动画
 * @param {Element} element - 目标元素
 * @param {string} fromTheme - 原主题
 * @param {string} toTheme - 目标主题
 * @returns {gsap.timeline} 切换动画时间轴
 */
export const createThemeTransition = (element, fromTheme, toTheme) => {
  const fromConfig = getThemeConfig(fromTheme)
  const toConfig = getThemeConfig(toTheme)
  
  const tl = gsap.timeline()
  
  // 淡出当前主题
  tl.to(element, {
    opacity: 0.3,
    scale: 0.95,
    duration: fromConfig.timing.fast,
    ease: fromConfig.easing.primary
  })
  
  // 切换到新主题样式
  .set(element, {
    // 这里可以设置新主题的CSS变量或类名
    '--theme-primary': toConfig.colors.primary,
    '--theme-secondary': toConfig.colors.secondary,
    '--theme-accent': toConfig.colors.accent
  })
  
  // 淡入新主题
  .to(element, {
    opacity: 1,
    scale: 1,
    duration: toConfig.timing.medium,
    ease: toConfig.easing.bounce
  })
  
  return tl
}

/**
 * 批量应用主题动画
 * @param {NodeList|Array} elements - 元素列表
 * @param {string} theme - 主题名称
 * @param {string} animationType - 动画类型
 * @param {Object} options - 选项
 * @returns {gsap.timeline} 批量动画时间轴
 */
export const applyBatchThemeAnimation = (elements, theme, animationType, options = {}) => {
  const themeConfig = getThemeConfig(theme)
  const { stagger = 0.1, ...animationOptions } = options
  
  const tl = gsap.timeline()
  
  // 为每个元素应用动画
  elements.forEach((element, index) => {
    const animation = themeConfig.animations[animationType]
    if (animation && element) {
      tl.add(animation(element, animationOptions), index * stagger)
    }
  })
  
  return tl
}

export default themeAnimations