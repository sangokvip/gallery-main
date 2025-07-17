// 页面动画预设库
import { gsap } from 'gsap'
import { GSAP_CONFIG } from '../config/gsapConfig'

/**
 * 页面动画预设
 * 为不同主题页面提供定制化的动画效果
 */
export const pageAnimations = {
  
  /**
   * 女生版页面动画 - 柔和粉色主题
   */
  female: {
    // 页面入场动画
    entrance: {
      timeline: (elements) => {
        const tl = gsap.timeline()
        
        // 标题动画 - 从上方淡入
        tl.from('.pixel-title-pink, h1, h2, h3', {
          opacity: 0,
          y: -30,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.15
        })
        
        // 卡片动画 - 从下方滑入并缩放
        .from('.pixel-card-pink, .MuiPaper-root, .card', {
          opacity: 0,
          y: 40,
          scale: 0.95,
          duration: 0.6,
          ease: "back.out(1.2)",
          stagger: 0.1
        }, "-=0.4")
        
        // 按钮动画 - 弹跳效果
        .from('.pixel-button-pink, .MuiButton-root, .button', {
          opacity: 0,
          scale: 0.8,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)",
          stagger: 0.08
        }, "-=0.3")
        
        // 表单元素动画
        .from('.MuiTextField-root, .MuiSelect-root, input, select', {
          opacity: 0,
          x: -20,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.05
        }, "-=0.2")
        
        return tl
      },
      
      // 单独元素动画
      elements: {
        card: {
          from: { opacity: 0, y: 30, scale: 0.95 },
          to: { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.2)" }
        },
        button: {
          from: { opacity: 0, scale: 0.9 },
          to: { opacity: 1, scale: 1, duration: 0.4, ease: "elastic.out(1, 0.3)" }
        },
        text: {
          from: { opacity: 0, y: 20 },
          to: { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        }
      }
    },
    
    // 交互动画
    interactions: {
      // 卡片悬停
      cardHover: {
        enter: {
          scale: 1.02,
          y: -5,
          boxShadow: "0 8px 25px rgba(255, 105, 180, 0.3)",
          duration: 0.3,
          ease: "power2.out"
        },
        leave: {
          scale: 1,
          y: 0,
          boxShadow: "0 4px 12px rgba(255, 105, 180, 0.1)",
          duration: 0.3,
          ease: "power2.out"
        }
      },
      
      // 按钮点击
      buttonClick: {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      },
      
      // 表单聚焦
      inputFocus: {
        scale: 1.02,
        borderColor: "#ff69b4",
        boxShadow: "0 0 0 3px rgba(255, 105, 180, 0.2)",
        duration: 0.3,
        ease: "power2.out"
      }
    },
    
    // 页面退出动画
    exit: {
      timeline: () => {
        const tl = gsap.timeline()
        
        tl.to('.MuiButton-root, .button', {
          opacity: 0,
          scale: 0.8,
          duration: 0.2,
          ease: "power2.in",
          stagger: 0.05
        })
        .to('.MuiPaper-root, .card', {
          opacity: 0,
          y: -20,
          scale: 0.95,
          duration: 0.3,
          ease: "power2.in",
          stagger: 0.08
        }, "-=0.1")
        .to('h1, h2, h3', {
          opacity: 0,
          y: -30,
          duration: 0.4,
          ease: "power2.in"
        }, "-=0.2")
        
        return tl
      }
    }
  },
  
  /**
   * 男生版页面动画 - 硬朗蓝色主题
   */
  male: {
    entrance: {
      timeline: (elements) => {
        const tl = gsap.timeline()
        
        // 标题动画 - 从左侧滑入
        tl.from('h1, h2, h3', {
          opacity: 0,
          x: -50,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.1
        })
        
        // 卡片动画 - 3D翻转效果
        .from('.MuiPaper-root, .card', {
          opacity: 0,
          rotationY: 15,
          transformOrigin: "left center",
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.12
        }, "-=0.3")
        
        // 按钮动画 - 从底部弹起
        .from('.MuiButton-root, .button', {
          opacity: 0,
          y: 30,
          scale: 0.9,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.08
        }, "-=0.4")
        
        return tl
      },
      
      elements: {
        card: {
          from: { opacity: 0, rotationY: 10, x: -20 },
          to: { opacity: 1, rotationY: 0, x: 0, duration: 0.6, ease: "power2.out" }
        },
        button: {
          from: { opacity: 0, y: 20, scale: 0.9 },
          to: { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
        }
      }
    },
    
    interactions: {
      cardHover: {
        enter: {
          rotationY: 3,
          scale: 1.01,
          boxShadow: "0 10px 30px rgba(33, 150, 243, 0.3)",
          duration: 0.4,
          ease: "power2.out"
        },
        leave: {
          rotationY: 0,
          scale: 1,
          boxShadow: "0 4px 12px rgba(33, 150, 243, 0.1)",
          duration: 0.4,
          ease: "power2.out"
        }
      },
      
      buttonClick: {
        scale: 0.92,
        rotationX: 5,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      }
    },
    
    exit: {
      timeline: () => {
        const tl = gsap.timeline()
        
        tl.to('.MuiButton-root, .button', {
          opacity: 0,
          y: 20,
          scale: 0.9,
          duration: 0.3,
          ease: "power2.in",
          stagger: 0.05
        })
        .to('.MuiPaper-root, .card', {
          opacity: 0,
          rotationY: -10,
          x: -30,
          duration: 0.4,
          ease: "power2.in",
          stagger: 0.08
        }, "-=0.2")
        
        return tl
      }
    }
  },
  
  /**
   * S版页面动画 - 强烈红色主题
   */
  s: {
    entrance: {
      timeline: (elements) => {
        const tl = gsap.timeline()
        
        // 标题动画 - 爆炸式缩放
        tl.from('h1, h2, h3', {
          opacity: 0,
          scale: 1.3,
          rotation: 5,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: 0.08
        })
        
        // 卡片动画 - 旋转滑入
        .from('.MuiPaper-root, .card', {
          opacity: 0,
          rotation: 8,
          scale: 0.8,
          y: 40,
          duration: 0.6,
          ease: "back.out(1.7)",
          stagger: 0.1
        }, "-=0.3")
        
        // 按钮动画 - 震动效果
        .from('.MuiButton-root, .button', {
          opacity: 0,
          scale: 0.7,
          rotation: -3,
          duration: 0.4,
          ease: "elastic.out(1.2, 0.3)",
          stagger: 0.06
        }, "-=0.4")
        
        return tl
      },
      
      elements: {
        card: {
          from: { opacity: 0, rotation: 5, scale: 0.9, y: 30 },
          to: { opacity: 1, rotation: 0, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
        },
        button: {
          from: { opacity: 0, scale: 0.8, rotation: -2 },
          to: { opacity: 1, scale: 1, rotation: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
        }
      }
    },
    
    interactions: {
      cardHover: {
        enter: {
          rotation: -1,
          scale: 1.03,
          boxShadow: "0 12px 35px rgba(255, 0, 0, 0.4)",
          duration: 0.3,
          ease: "power2.out"
        },
        leave: {
          rotation: 0,
          scale: 1,
          boxShadow: "0 4px 12px rgba(255, 0, 0, 0.2)",
          duration: 0.3,
          ease: "power2.out"
        }
      },
      
      buttonClick: {
        scale: 0.9,
        rotation: 2,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power3.inOut"
      }
    },
    
    exit: {
      timeline: () => {
        const tl = gsap.timeline()
        
        tl.to('.MuiButton-root, .button', {
          opacity: 0,
          scale: 0.7,
          rotation: 5,
          duration: 0.2,
          ease: "power3.in",
          stagger: 0.04
        })
        .to('.MuiPaper-root, .card', {
          opacity: 0,
          rotation: -8,
          scale: 0.8,
          y: -40,
          duration: 0.3,
          ease: "power3.in",
          stagger: 0.06
        }, "-=0.15")
        
        return tl
      }
    }
  },
  
  /**
   * 留言板页面动画 - 社交互动主题
   */
  message: {
    entrance: {
      timeline: (elements) => {
        const tl = gsap.timeline()
        
        // 消息气泡动画
        tl.from('.message-bubble, .MuiPaper-root', {
          opacity: 0,
          scale: 0.8,
          y: 20,
          duration: 0.4,
          ease: "back.out(1.5)",
          stagger: 0.1
        })
        
        // 输入框动画
        .from('.MuiTextField-root, input, textarea', {
          opacity: 0,
          y: 30,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.2")
        
        return tl
      },
      
      elements: {
        message: {
          from: { opacity: 0, scale: 0.9, y: 15 },
          to: { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.3)" }
        },
        newMessage: {
          from: { opacity: 0, x: -30, scale: 0.95 },
          to: { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "power2.out" }
        }
      }
    },
    
    interactions: {
      messageHover: {
        enter: {
          scale: 1.02,
          y: -2,
          boxShadow: "0 6px 20px rgba(255, 105, 180, 0.2)",
          duration: 0.3,
          ease: "power2.out"
        },
        leave: {
          scale: 1,
          y: 0,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          duration: 0.3,
          ease: "power2.out"
        }
      },
      
      likeButton: {
        scale: 1.2,
        rotation: 15,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      },
      
      sendMessage: {
        scale: [1, 0.9, 1.1, 1],
        duration: 0.6,
        ease: "power2.out"
      }
    }
  },
  
  /**
   * 图库页面动画 - 视觉展示主题
   */
  gallery: {
    entrance: {
      timeline: (elements) => {
        const tl = gsap.timeline()
        
        // 图片网格动画
        tl.from('.gallery-item, .image-card', {
          opacity: 0,
          scale: 0.8,
          rotation: 5,
          duration: 0.6,
          ease: "back.out(1.3)",
          stagger: {
            grid: "auto",
            from: "center",
            amount: 0.8
          }
        })
        
        return tl
      },
      
      elements: {
        image: {
          from: { opacity: 0, scale: 0.9, clipPath: "circle(0% at 50% 50%)" },
          to: { 
            opacity: 1, 
            scale: 1, 
            clipPath: "circle(100% at 50% 50%)", 
            duration: 0.8, 
            ease: "power2.out" 
          }
        }
      }
    },
    
    interactions: {
      imageHover: {
        enter: {
          scale: 1.05,
          rotation: 2,
          zIndex: 10,
          boxShadow: "0 15px 40px rgba(0, 0, 0, 0.3)",
          duration: 0.4,
          ease: "power2.out"
        },
        leave: {
          scale: 1,
          rotation: 0,
          zIndex: 1,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          duration: 0.4,
          ease: "power2.out"
        }
      }
    }
  }
}

/**
 * 通用页面转场动画
 */
export const pageTransitions = {
  // 淡入淡出
  fade: {
    enter: {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    },
    exit: {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    }
  },
  
  // 滑动
  slide: {
    enter: {
      x: 0,
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    },
    exit: {
      x: -100,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in"
    }
  },
  
  // 缩放
  scale: {
    enter: {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: "back.out(1.7)"
    },
    exit: {
      scale: 0.9,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    }
  }
}

/**
 * 获取主题化动画配置
 * @param {string} theme - 主题名称 (female, male, s, message, gallery)
 * @param {string} type - 动画类型 (entrance, interactions, exit)
 * @returns {Object} 动画配置
 */
export const getThemeAnimation = (theme, type) => {
  return pageAnimations[theme]?.[type] || pageAnimations.female[type]
}

/**
 * 应用页面入场动画
 * @param {string} theme - 主题名称
 * @param {Element} container - 容器元素
 * @returns {gsap.timeline} 动画时间轴
 */
export const applyPageEntrance = (theme, container = document.body) => {
  const animation = getThemeAnimation(theme, 'entrance')
  if (animation && animation.timeline) {
    return animation.timeline(container.children)
  }
  return null
}

export default pageAnimations