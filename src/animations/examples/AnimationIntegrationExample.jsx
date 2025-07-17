// AnimationIntegrationExample.jsx - 动画集成示例
import React, { useRef, useState, useEffect } from 'react'
import { useGSAP } from '../hooks/useGSAP'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useThemeAnimation } from '../hooks/useThemeAnimation'
import { useTouchAnimation } from '../hooks/useTouchAnimation'
import { PageTransition } from '../components/PageTransition'
import { LoadingAnimation } from '../components/LoadingAnimation'
import { ScrollTrigger } from '../components/ScrollTrigger'
import { AnimatedChart } from '../components/AnimatedChart'
import { ReportAnimation } from '../components/ReportAnimation'
import { AnimationControlPanel } from '../components/AnimationControlPanel'
import { pageAnimations } from '../presets/pageAnimations'
import { componentAnimations } from '../presets/componentAnimations'
import { themeAnimations } from '../presets/themeAnimations'

/**
 * GSAP动画系统集成示例
 * 展示所有动画组件和功能的使用方法
 */
function AnimationIntegrationExample() {
  const [currentTheme, setCurrentTheme] = useState('female')
  const [currentDemo, setCurrentDemo] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  
  // 基础动画示例
  const BasicAnimationDemo = () => {
    const elementRef = useRef()
    const { animate, timeline } = useGSAP()
    
    const handleBasicAnimation = () => {
      animate(elementRef.current, {
        x: 100,
        rotation: 360,
        scale: 1.2,
        duration: 1,
        ease: 'back.out(1.7)',
        yoyo: true,
        repeat: 1
      })
    }
    
    const handleTimelineAnimation = () => {
      timeline
        .to(elementRef.current, { x: 100, duration: 0.5 })
        .to(elementRef.current, { y: 50, duration: 0.5 })
        .to(elementRef.current, { rotation: 180, duration: 0.5 })
        .to(elementRef.current, { x: 0, y: 0, rotation: 0, duration: 0.8 })
    }
    
    return (
      <div className="demo-section">
        <h3>基础动画示例</h3>
        <div 
          ref={elementRef}
          className="demo-element"
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#ff69b4',
            borderRadius: '8px',
            margin: '20px 0',
            cursor: 'pointer'
          }}
          onClick={handleBasicAnimation}
        />
        <div className="demo-controls">
          <button onClick={handleBasicAnimation}>基础动画</button>
          <button onClick={handleTimelineAnimation}>时间轴动画</button>
        </div>
      </div>
    )
  }
  
  // 滚动动画示例
  const ScrollAnimationDemo = () => {
    const scrollRef = useRef()
    
    useScrollAnimation(scrollRef, {
      from: { opacity: 0, y: 50, scale: 0.8 },
      to: { opacity: 1, y: 0, scale: 1 },
      trigger: scrollRef,
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: 1
    })
    
    return (
      <div className="demo-section">
        <h3>滚动动画示例</h3>
        <div style={{ height: '200px', overflow: 'auto', border: '1px solid #ccc' }}>
          <div style={{ height: '100px' }}>滚动查看动画效果</div>
          <div 
            ref={scrollRef}
            className="scroll-demo-element"
            style={{
              width: '100%',
              height: '100px',
              backgroundColor: '#4169e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            滚动触发的动画
          </div>
          <div style={{ height: '100px' }}>继续滚动...</div>
        </div>
      </div>
    )
  }
  
  // 主题动画示例
  const ThemeAnimationDemo = () => {
    const themeRef = useRef()
    const { applyThemeAnimation } = useThemeAnimation()
    
    const handleThemeChange = (theme) => {
      setCurrentTheme(theme)
      applyThemeAnimation(themeRef.current, theme, {
        duration: 1,
        ease: 'power2.inOut'
      })
    }
    
    return (
      <div className="demo-section">
        <h3>主题动画示例</h3>
        <div 
          ref={themeRef}
          className={`theme-demo-element theme-${currentTheme}`}
          style={{
            width: '200px',
            height: '100px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            margin: '20px 0',
            backgroundColor: currentTheme === 'female' ? '#ff69b4' : 
                           currentTheme === 'male' ? '#4169e1' : '#dc143c'
          }}
        >
          {currentTheme.toUpperCase()} 主题
        </div>
        <div className="theme-controls">
          <button onClick={() => handleThemeChange('female')}>女生主题</button>
          <button onClick={() => handleThemeChange('male')}>男生主题</button>
          <button onClick={() => handleThemeChange('s')}>S主题</button>
        </div>
      </div>
    )
  }
  
  // 触摸动画示例
  const TouchAnimationDemo = () => {
    const touchRef = useRef()
    const { setupTouchAnimation } = useTouchAnimation()
    
    useEffect(() => {
      if (touchRef.current) {
        setupTouchAnimation(touchRef.current, {
          tap: { scale: 0.95, duration: 0.1 },
          hold: { scale: 1.1, duration: 0.3 },
          swipe: { x: 50, duration: 0.5 }
        })
      }
    }, [])
    
    return (
      <div className="demo-section">
        <h3>触摸动画示例</h3>
        <div 
          ref={touchRef}
          className="touch-demo-element"
          style={{
            width: '150px',
            height: '150px',
            backgroundColor: '#32cd32',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            userSelect: 'none',
            margin: '20px auto'
          }}
        >
          触摸我
        </div>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
          点击、长按或滑动查看不同的动画效果
        </p>
      </div>
    )
  }
  
  // 组件动画示例
  const ComponentAnimationDemo = () => {
    const [showChart, setShowChart] = useState(false)
    const [showReport, setShowReport] = useState(false)
    
    const chartData = [
      { name: 'A', value: 80, color: '#ff69b4' },
      { name: 'B', value: 65, color: '#4169e1' },
      { name: 'C', value: 90, color: '#32cd32' },
      { name: 'D', value: 75, color: '#ffa500' }
    ]
    
    const reportData = {
      title: '动画性能报告',
      sections: [
        { title: '基础指标', content: 'FPS: 60, 内存使用: 45MB' },
        { title: '动画统计', content: '活跃动画: 12, 完成动画: 156' },
        { title: '性能评级', content: '优秀 (A+)' }
      ]
    }
    
    return (
      <div className="demo-section">
        <h3>组件动画示例</h3>
        
        <div className="component-controls">
          <button onClick={() => setIsLoading(!isLoading)}>
            {isLoading ? '停止加载' : '显示加载动画'}
          </button>
          <button onClick={() => setShowChart(!showChart)}>
            {showChart ? '隐藏图表' : '显示动画图表'}
          </button>
          <button onClick={() => setShowReport(!showReport)}>
            {showReport ? '隐藏报告' : '显示动画报告'}
          </button>
        </div>
        
        {isLoading && (
          <LoadingAnimation 
            type="pulse"
            size="large"
            color={currentTheme === 'female' ? '#ff69b4' : 
                   currentTheme === 'male' ? '#4169e1' : '#dc143c'}
          />
        )}
        
        {showChart && (
          <AnimatedChart
            data={chartData}
            type="bar"
            animationDuration={1.5}
            staggerDelay={0.2}
            easing="power2.out"
          />
        )}
        
        {showReport && (
          <ReportAnimation
            data={reportData}
            animationType="slideUp"
            duration={1}
            stagger={0.3}
          />
        )}
      </div>
    )
  }
  
  // 页面转场示例
  const PageTransitionDemo = () => {
    const [currentPage, setCurrentPage] = useState('page1')
    
    const pages = {
      page1: { title: '页面 1', color: '#ff69b4', content: '这是第一个页面的内容' },
      page2: { title: '页面 2', color: '#4169e1', content: '这是第二个页面的内容' },
      page3: { title: '页面 3', color: '#32cd32', content: '这是第三个页面的内容' }
    }
    
    return (
      <div className="demo-section">
        <h3>页面转场示例</h3>
        
        <div className="page-controls">
          {Object.keys(pages).map(pageKey => (
            <button 
              key={pageKey}
              onClick={() => setCurrentPage(pageKey)}
              className={currentPage === pageKey ? 'active' : ''}
            >
              {pages[pageKey].title}
            </button>
          ))}
        </div>
        
        <PageTransition
          pageKey={currentPage}
          animationType="slideLeft"
          duration={0.8}
          easing="power2.inOut"
        >
          <div 
            style={{
              width: '100%',
              height: '200px',
              backgroundColor: pages[currentPage].color,
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            <h4>{pages[currentPage].title}</h4>
            <p>{pages[currentPage].content}</p>
          </div>
        </PageTransition>
      </div>
    )
  }
  
  // 滚动触发组件示例
  const ScrollTriggerDemo = () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      title: `滚动项目 ${i + 1}`,
      content: `这是第 ${i + 1} 个滚动触发的动画项目`
    }))
    
    return (
      <div className="demo-section">
        <h3>滚动触发组件示例</h3>
        <div style={{ height: '300px', overflow: 'auto', border: '1px solid #ccc' }}>
          <div style={{ height: '100px', padding: '20px' }}>
            向下滚动查看动画效果
          </div>
          
          {items.map((item, index) => (
            <ScrollTrigger
              key={item.id}
              animationType="fadeInUp"
              delay={index * 0.1}
              duration={0.8}
              threshold={0.3}
            >
              <div 
                style={{
                  margin: '20px',
                  padding: '20px',
                  backgroundColor: `hsl(${index * 60}, 70%, 85%)`,
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <h4>{item.title}</h4>
                <p>{item.content}</p>
              </div>
            </ScrollTrigger>
          ))}
          
          <div style={{ height: '100px', padding: '20px' }}>
            滚动结束
          </div>
        </div>
      </div>
    )
  }
  
  // 动画控制面板示例
  const ControlPanelDemo = () => {
    return (
      <div className="demo-section">
        <h3>动画控制面板</h3>
        <AnimationControlPanel 
          theme={currentTheme}
          onThemeChange={setCurrentTheme}
          showDebugInfo={true}
          showPerformanceMetrics={true}
        />
      </div>
    )
  }
  
  const demos = {
    basic: { title: '基础动画', component: BasicAnimationDemo },
    scroll: { title: '滚动动画', component: ScrollAnimationDemo },
    theme: { title: '主题动画', component: ThemeAnimationDemo },
    touch: { title: '触摸动画', component: TouchAnimationDemo },
    components: { title: '组件动画', component: ComponentAnimationDemo },
    transition: { title: '页面转场', component: PageTransitionDemo },
    scrollTrigger: { title: '滚动触发', component: ScrollTriggerDemo },
    control: { title: '控制面板', component: ControlPanelDemo }
  }
  
  const CurrentDemo = demos[currentDemo].component
  
  return (
    <div className="animation-integration-example" style={{ 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>GSAP动画系统集成示例</h1>
        <p>展示所有动画组件和功能的完整使用方法</p>
      </header>
      
      <nav style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px', 
        marginBottom: '30px',
        justifyContent: 'center'
      }}>
        {Object.entries(demos).map(([key, demo]) => (
          <button
            key={key}
            onClick={() => setCurrentDemo(key)}
            style={{
              padding: '8px 16px',
              border: '2px solid',
              borderColor: currentDemo === key ? '#007bff' : '#ccc',
              backgroundColor: currentDemo === key ? '#007bff' : 'white',
              color: currentDemo === key ? 'white' : '#333',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: currentDemo === key ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}
          >
            {demo.title}
          </button>
        ))}
      </nav>
      
      <main style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        padding: '30px',
        minHeight: '400px'
      }}>
        <CurrentDemo />
      </main>
      
      <footer style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#e9ecef',
        borderRadius: '8px'
      }}>
        <h4>使用说明</h4>
        <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <li>点击上方按钮切换不同的动画示例</li>
          <li>每个示例都展示了特定的动画功能和使用方法</li>
          <li>可以通过控制面板调整动画参数和性能设置</li>
          <li>所有动画都支持可访问性和移动端优化</li>
          <li>查看浏览器控制台获取详细的调试信息</li>
        </ul>
      </footer>
      
      <style jsx>{`
        .demo-section {
          margin-bottom: 30px;
        }
        
        .demo-section h3 {
          color: #333;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e9ecef;
        }
        
        .demo-controls,
        .theme-controls,
        .component-controls,
        .page-controls {
          display: flex;
          gap: 10px;
          margin: 15px 0;
          flex-wrap: wrap;
        }
        
        .demo-controls button,
        .theme-controls button,
        .component-controls button,
        .page-controls button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .demo-controls button:hover,
        .theme-controls button:hover,
        .component-controls button:hover,
        .page-controls button:hover {
          background: #f0f0f0;
          transform: translateY(-1px);
        }
        
        .page-controls button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .demo-element {
          transition: all 0.3s ease;
        }
        
        .demo-element:hover {
          transform: scale(1.05);
        }
        
        @media (max-width: 768px) {
          .animation-integration-example {
            padding: 10px;
          }
          
          .demo-controls,
          .theme-controls,
          .component-controls,
          .page-controls {
            justify-content: center;
          }
          
          nav {
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AnimationIntegrationExample