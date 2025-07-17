# GSAP动画系统使用教程

## 快速开始

### 1. 基础设置

```javascript
// 导入动画系统
import { AnimationUtils } from './src/animations'

// 初始化系统
AnimationUtils.initializeAnimationSystem()
```

### 2. 基础动画

```javascript
import { useGSAP } from './src/animations/hooks/useGSAP'

function MyComponent() {
  const { animate } = useGSAP()
  
  const handleClick = () => {
    animate(ref.current, {
      x: 100,
      duration: 1,
      ease: 'power2.out'
    })
  }
  
  return <div ref={ref} onClick={handleClick}>点击我</div>
}
```

### 3. 主题动画

```javascript
import { useThemeAnimation } from './src/animations/hooks/useThemeAnimation'

function ThemedComponent({ theme }) {
  const { applyThemeAnimation } = useThemeAnimation()
  
  useEffect(() => {
    applyThemeAnimation(ref.current, theme)
  }, [theme])
  
  return <div ref={ref}>主题内容</div>
}
```

### 4. 滚动动画

```javascript
import { useScrollAnimation } from './src/animations/hooks/useScrollAnimation'

function ScrollComponent() {
  const ref = useRef()
  
  useScrollAnimation(ref, {
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0 }
  })
  
  return <div ref={ref}>滚动触发内容</div>
}
```

## 更多示例

查看 `animation-demo.html` 获取完整的交互式演示。

## 文档

完整文档请参考 `GSAP_ANIMATION_SYSTEM_DOCUMENTATION.md`