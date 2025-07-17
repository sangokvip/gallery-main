// 组件动画预设库
import { gsap } from 'gsap'
import { GSAP_CONFIG } from '../config/gsapConfig'

/**
 * 通用组件动画预设
 * 提供可复用的组件动画效果
 */
export const componentAnimations = {
  
  /**
   * 加载动画
   */
  loading: {
    // 旋转加载器
    spinner: {
      create: (element) => {
        return gsap.to(element, {
          rotation: 360,
          duration: 1,
          repeat: -1,
          ease: "none"
        })
      }
    },
    
    // 脉冲加载器
    pulse: {
      create: (element) => {
        return gsap.to(element, {
          scale: 1.1,
          opacity: 0.7,
          duration: 0.8,
          yoyo: true,
          repeat: -1,
          ease: "power2.inOut"
        })
      }
    },
    
    // 点状加载器
    dots: {
      create: (elements) => {
        return gsap.timeline({ repeat: -1 })
          .to(elements, {
            scale: 1.3,
            opacity: 0.6,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.inOut"
          })
          .to(elements, {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.inOut"
          })
      }
    },
    
    // 进度条
    progressBar: {
      create: (element, progress = 0) => {
        return gsap.to(element, {
          scaleX: progress / 100,
          transformOrigin: "left center",
          duration: 0.5,
          ease: "power2.out"
        })
      }
    }
  },
  
  /**
   * 按钮动画
   */
  button: {
    // 悬停效果
    hover: {
      enter: (element, theme = 'default') => {
        const config = getThemeConfig(theme)
        return gsap.to(element, {
          scale: 1.05,
          y: -2,
          boxShadow: `0 8px 25px ${config.shadowColor}`,
          duration: 0.3,
          ease: "power2.out"
        })
      },
      
      leave: (element, theme = 'default') => {
        const config = getThemeConfig(theme)
        return gsap.to(element, {
          scale: 1,
          y: 0,
          boxShadow: `0 4px 12px ${config.shadowColorLight}`,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    },
    
    // 点击效果
    click: {
      create: (element) => {
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
          .to(element, {
            scale: 1,
            duration: 0.1,
            ease: "power2.out"
          })
      }
    },
    
    // 成功状态
    success: {
      create: (element) => {
        return gsap.timeline()
          .to(element, {
            backgroundColor: "#4caf50",
            scale: 1.1,
            duration: 0.3,
            ease: "power2.out"
          })
          .to(element, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          })
      }
    },
    
    // 错误状态
    error: {
      create: (element) => {
        return gsap.timeline()
          .to(element, {
            x: -10,
            backgroundColor: "#f44336",
            duration: 0.1,
            ease: "power2.out"
          })
          .to(element, {
            x: 10,
            duration: 0.1,
            ease: "power2.out"
          })
          .to(element, {
            x: -5,
            duration: 0.1,
            ease: "power2.out"
          })
          .to(element, {
            x: 0,
            duration: 0.1,
            ease: "power2.out"
          })
      }
    }
  },
  
  /**
   * 卡片动画
   */
  card: {
    // 入场动画
    entrance: {
      fadeInUp: (element) => {
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
      
      slideInLeft: (element) => {
        return gsap.fromTo(element,
          { opacity: 0, x: -50, rotationY: 10 },
          {
            opacity: 1,
            x: 0,
            rotationY: 0,
            duration: 0.7,
            ease: "power2.out"
          }
        )
      },
      
      scaleIn: (element) => {
        return gsap.fromTo(element,
          { opacity: 0, scale: 0.8, rotation: 5 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
          }
        )
      }
    },
    
    // 悬停效果
    hover: {
      lift: (element) => {
        return gsap.to(element, {
          y: -8,
          scale: 1.02,
          boxShadow: "0 15px 40px rgba(0, 0, 0, 0.15)",
          duration: 0.4,
          ease: "power2.out"
        })
      },
      
      tilt: (element) => {
        return gsap.to(element, {
          rotationY: 5,
          scale: 1.01,
          duration: 0.4,
          ease: "power2.out"
        })
      },
      
      glow: (element, theme = 'default') => {
        const config = getThemeConfig(theme)
        return gsap.to(element, {
          boxShadow: `0 0 20px ${config.glowColor}`,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    },
    
    // 离开效果
    leave: {
      reset: (element) => {
        return gsap.to(element, {
          y: 0,
          scale: 1,
          rotationY: 0,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          duration: 0.4,
          ease: "power2.out"
        })
      }
    }
  },
  
  /**
   * 表单动画
   */
  form: {
    // 输入框聚焦
    inputFocus: {
      create: (element, theme = 'default') => {
        const config = getThemeConfig(theme)
        return gsap.to(element, {
          scale: 1.02,
          borderColor: config.primaryColor,
          boxShadow: `0 0 0 3px ${config.focusColor}`,
          duration: 0.3,
          ease: "power2.out"
        })
      }
    },
    
    // 输入框失焦
    inputBlur: {
      create: (element) => {
        return gsap.to(element, {
          scale: 1,
          borderColor: "#e0e0e0",
          boxShadow: "none",
          duration: 0.3,
          ease: "power2.out"
        })
      }
    },
    
    // 验证错误
    validationError: {
      create: (element) => {
        return gsap.timeline()
          .to(element, {
            x: -5,
            borderColor: "#f44336",
            duration: 0.1,
            ease: "power2.out"
          })
          .to(element, {
            x: 5,
            duration: 0.1,
            ease: "power2.out"
          })
          .to(element, {
            x: -3,
            duration: 0.1,
            ease: "power2.out"
          })
          .to(element, {
            x: 0,
            duration: 0.1,
            ease: "power2.out"
          })
      }
    },
    
    // 验证成功
    validationSuccess: {
      create: (element) => {
        return gsap.to(element, {
          borderColor: "#4caf50",
          boxShadow: "0 0 0 2px rgba(76, 175, 80, 0.2)",
          duration: 0.3,
          ease: "power2.out"
        })
      }
    }
  },
  
  /**
   * 通知动画
   */
  notification: {
    // 滑入通知
    slideIn: {
      fromTop: (element) => {
        return gsap.fromTo(element,
          { opacity: 0, y: -50, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
          }
        )
      },
      
      fromRight: (element) => {
        return gsap.fromTo(element,
          { opacity: 0, x: 100, scale: 0.9 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
          }
        )
      }
    },
    
    // 滑出通知
    slideOut: {
      toTop: (element) => {
        return gsap.to(element, {
          opacity: 0,
          y: -50,
          scale: 0.9,
          duration: 0.3,
          ease: "power2.in"
        })
      },
      
      toRight: (element) => {
        return gsap.to(element, {
          opacity: 0,
          x: 100,
          scale: 0.9,
          duration: 0.3,
          ease: "power2.in"
        })
      }
    },
    
    // 摇摆提醒
    shake: {
      create: (element) => {
        return gsap.timeline()
          .to(element, {
            rotation: 5,
            duration: 0.1,
            ease: "power2.inOut"
          })
          .to(element, {
            rotation: -5,
            duration: 0.1,
            ease: "power2.inOut"
          })
          .to(element, {
            rotation: 3,
            duration: 0.1,
            ease: "power2.inOut"
          })
          .to(element, {
            rotation: 0,
            duration: 0.1,
            ease: "power2.inOut"
          })
      }
    }
  },
  
  /**
   * 列表动画
   */
  list: {
    // 错落入场
    staggerIn: {
      create: (elements, direction = 'up') => {
        const fromProps = {
          up: { opacity: 0, y: 30 },
          down: { opacity: 0, y: -30 },
          left: { opacity: 0, x: -30 },
          right: { opacity: 0, x: 30 }
        }
        
        return gsap.fromTo(elements,
          fromProps[direction],
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out"
          }
        )
      }
    },
    
    // 添加新项目
    addItem: {
      create: (element) => {
        return gsap.fromTo(element,
          { 
            opacity: 0, 
            scale: 0.8, 
            height: 0,
            marginBottom: 0
          },
          {
            opacity: 1,
            scale: 1,
            height: "auto",
            marginBottom: "1rem",
            duration: 0.5,
            ease: "back.out(1.7)"
          }
        )
      }
    },
    
    // 移除项目
    removeItem: {
      create: (element) => {
        return gsap.to(element, {
          opacity: 0,
          scale: 0.8,
          height: 0,
          marginBottom: 0,
          duration: 0.3,
          ease: "power2.in"
        })
      }
    }
  },
  
  /**
   * 模态框动画
   */
  modal: {
    // 打开模态框
    open: {
      create: (backdrop, content) => {
        const tl = gsap.timeline()
        
        // 背景淡入
        tl.fromTo(backdrop,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        )
        
        // 内容缩放入场
        .fromTo(content,
          { opacity: 0, scale: 0.8, y: 50 },
          { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 0.4, 
            ease: "back.out(1.7)" 
          },
          "-=0.1"
        )
        
        return tl
      }
    },
    
    // 关闭模态框
    close: {
      create: (backdrop, content) => {
        const tl = gsap.timeline()
        
        // 内容缩放退出
        tl.to(content, {
          opacity: 0,
          scale: 0.9,
          y: -30,
          duration: 0.2,
          ease: "power2.in"
        })
        
        // 背景淡出
        .to(backdrop, {
          opacity: 0,
          duration: 0.2,
          ease: "power2.in"
        }, "-=0.1")
        
        return tl
      }
    }
  }
}

/**
 * 获取主题配置
 * @param {string} theme - 主题名称
 * @returns {Object} 主题配置
 */
function getThemeConfig(theme) {
  const themes = {
    female: {
      primaryColor: "#ff69b4",
      shadowColor: "rgba(255, 105, 180, 0.3)",
      shadowColorLight: "rgba(255, 105, 180, 0.1)",
      focusColor: "rgba(255, 105, 180, 0.2)",
      glowColor: "rgba(255, 105, 180, 0.4)"
    },
    male: {
      primaryColor: "#2196F3",
      shadowColor: "rgba(33, 150, 243, 0.3)",
      shadowColorLight: "rgba(33, 150, 243, 0.1)",
      focusColor: "rgba(33, 150, 243, 0.2)",
      glowColor: "rgba(33, 150, 243, 0.4)"
    },
    s: {
      primaryColor: "#ff0000",
      shadowColor: "rgba(255, 0, 0, 0.3)",
      shadowColorLight: "rgba(255, 0, 0, 0.1)",
      focusColor: "rgba(255, 0, 0, 0.2)",
      glowColor: "rgba(255, 0, 0, 0.4)"
    },
    default: {
      primaryColor: "#6200ea",
      shadowColor: "rgba(98, 0, 234, 0.3)",
      shadowColorLight: "rgba(98, 0, 234, 0.1)",
      focusColor: "rgba(98, 0, 234, 0.2)",
      glowColor: "rgba(98, 0, 234, 0.4)"
    }
  }
  
  return themes[theme] || themes.default
}

/**
 * 创建组件动画
 * @param {string} type - 动画类型
 * @param {string} variant - 动画变体
 * @param {Element} element - 目标元素
 * @param {Object} options - 选项
 * @returns {gsap.core.Timeline|gsap.core.Tween} 动画实例
 */
export const createComponentAnimation = (type, variant, element, options = {}) => {
  const animationGroup = componentAnimations[type]
  if (!animationGroup) {
    console.warn(`Animation type '${type}' not found`)
    return null
  }
  
  const animation = animationGroup[variant]
  if (!animation) {
    console.warn(`Animation variant '${variant}' not found in '${type}'`)
    return null
  }
  
  if (typeof animation.create === 'function') {
    return animation.create(element, options.theme)
  }
  
  return null
}

/**
 * 批量应用组件动画
 * @param {Array} animations - 动画配置数组
 * @returns {gsap.core.Timeline} 时间轴
 */
export const batchComponentAnimations = (animations) => {
  const tl = gsap.timeline()
  
  animations.forEach(({ type, variant, element, options = {}, delay = 0 }) => {
    const animation = createComponentAnimation(type, variant, element, options)
    if (animation) {
      tl.add(animation, delay)
    }
  })
  
  return tl
}

export default componentAnimations