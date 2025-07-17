#!/usr/bin/env node

/**
 * GSAP动画系统构建优化脚本
 * 用于优化生产环境的构建配置和性能
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class BuildOptimizer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..')
    this.distDir = path.join(this.projectRoot, 'dist')
    this.animationDir = path.join(this.projectRoot, 'src/animations')
    
    this.optimizationConfig = {
      // 压缩配置
      compression: {
        gzip: true,
        brotli: true,
        threshold: 1024 // 1KB以上的文件才压缩
      },
      
      // 代码分割配置
      codeSplitting: {
        maxChunkSize: 500 * 1024, // 500KB
        minChunkSize: 20 * 1024,  // 20KB
        maxAsyncRequests: 30,
        maxInitialRequests: 30
      },
      
      // 缓存配置
      caching: {
        staticAssets: '1y', // 静态资源缓存1年
        jsFiles: '1y',     // JS文件缓存1年
        cssFiles: '1y',    // CSS文件缓存1年
        htmlFiles: '1h'    // HTML文件缓存1小时
      }
    }
  }
  
  /**
   * 运行构建优化
   */
  async optimize() {
    console.log('🚀 Starting GSAP Animation System build optimization...')
    
    try {
      // 1. 分析动画资源
      await this.analyzeAnimationResources()
      
      // 2. 优化GSAP插件加载
      await this.optimizeGSAPPlugins()
      
      // 3. 生成预加载清单
      await this.generatePreloadManifest()
      
      // 4. 创建服务工作者
      await this.createServiceWorker()
      
      // 5. 生成部署配置
      await this.generateDeploymentConfig()
      
      // 6. 创建性能监控配置
      await this.createPerformanceConfig()
      
      console.log('✅ Build optimization completed successfully!')
      
    } catch (error) {
      console.error('❌ Build optimization failed:', error)
      process.exit(1)
    }
  }
  
  /**
   * 分析动画资源
   */
  async analyzeAnimationResources() {
    console.log('📊 Analyzing animation resources...')
    
    const analysis = {
      coreModules: [],
      presets: [],
      components: [],
      utils: [],
      totalSize: 0,
      dependencies: new Set()
    }
    
    // 扫描动画目录
    const scanDir = async (dir, category) => {
      const files = await fs.promises.readdir(dir, { withFileTypes: true })
      
      for (const file of files) {
        const filePath = path.join(dir, file.name)
        
        if (file.isDirectory()) {
          await scanDir(filePath, category)
        } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
          const stats = await fs.promises.stat(filePath)
          const content = await fs.promises.readFile(filePath, 'utf8')
          
          // 分析依赖
          const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || []
          imports.forEach(imp => {
            const match = imp.match(/from\s+['"]([^'"]+)['"]/)
            if (match) {
              analysis.dependencies.add(match[1])
            }
          })
          
          analysis[category].push({
            name: file.name,
            path: filePath,
            size: stats.size,
            lastModified: stats.mtime
          })
          
          analysis.totalSize += stats.size
        }
      }
    }
    
    // 扫描各个目录
    await scanDir(path.join(this.animationDir, 'core'), 'coreModules')
    await scanDir(path.join(this.animationDir, 'presets'), 'presets')
    await scanDir(path.join(this.animationDir, 'components'), 'components')
    await scanDir(path.join(this.animationDir, 'utils'), 'utils')
    
    // 保存分析结果
    const analysisPath = path.join(this.projectRoot, 'build-analysis.json')
    await fs.promises.writeFile(
      analysisPath, 
      JSON.stringify({
        ...analysis,
        dependencies: Array.from(analysis.dependencies),
        timestamp: new Date().toISOString()
      }, null, 2)
    )
    
    console.log(`📈 Analysis complete: ${analysis.totalSize} bytes across ${
      analysis.coreModules.length + analysis.presets.length + 
      analysis.components.length + analysis.utils.length
    } files`)
  }
  
  /**
   * 优化GSAP插件加载
   */
  async optimizeGSAPPlugins() {
    console.log('🔧 Optimizing GSAP plugin loading...')
    
    const pluginConfig = {
      // 核心插件 - 总是加载
      core: [
        'gsap',
        'gsap/ScrollTrigger'
      ],
      
      // 按需加载的插件
      optional: [
        'gsap/TextPlugin',
        'gsap/MotionPathPlugin',
        'gsap/DrawSVGPlugin',
        'gsap/MorphSVGPlugin'
      ],
      
      // 页面特定插件
      pageSpecific: {
        'female': ['gsap/TextPlugin'],
        'male': ['gsap/MotionPathPlugin'],
        's': ['gsap/DrawSVGPlugin'],
        'message': ['gsap/ScrollTrigger']
      }
    }
    
    // 生成插件加载器
    const loaderCode = `
// GSAP插件动态加载器
// 自动生成 - 请勿手动编辑

class GSAPPluginLoader {
  constructor() {
    this.loadedPlugins = new Set()
    this.loadingPromises = new Map()
  }
  
  async loadCorePlugins() {
    const corePlugins = ${JSON.stringify(pluginConfig.core)}
    
    const loadPromises = corePlugins.map(plugin => this.loadPlugin(plugin))
    await Promise.all(loadPromises)
  }
  
  async loadPlugin(pluginName) {
    if (this.loadedPlugins.has(pluginName)) {
      return
    }
    
    if (this.loadingPromises.has(pluginName)) {
      return this.loadingPromises.get(pluginName)
    }
    
    const loadPromise = this.doLoadPlugin(pluginName)
    this.loadingPromises.set(pluginName, loadPromise)
    
    try {
      await loadPromise
      this.loadedPlugins.add(pluginName)
    } finally {
      this.loadingPromises.delete(pluginName)
    }
  }
  
  async doLoadPlugin(pluginName) {
    try {
      await import(pluginName)
      console.log(\`GSAP plugin loaded: \${pluginName}\`)
    } catch (error) {
      console.warn(\`Failed to load GSAP plugin \${pluginName}:\`, error)
    }
  }
  
  async loadPagePlugins(pageName) {
    const pagePlugins = ${JSON.stringify(pluginConfig.pageSpecific)}[pageName] || []
    
    const loadPromises = pagePlugins.map(plugin => this.loadPlugin(plugin))
    await Promise.all(loadPromises)
  }
  
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins)
  }
}

export default new GSAPPluginLoader()
`
    
    const loaderPath = path.join(this.animationDir, 'config/gsapPluginLoader.js')
    await fs.promises.writeFile(loaderPath, loaderCode)
    
    console.log('✅ GSAP plugin loader created')
  }
  
  /**
   * 生成预加载清单
   */
  async generatePreloadManifest() {
    console.log('📋 Generating preload manifest...')
    
    const manifest = {
      critical: [
        // 关键CSS
        '/css/index.css',
        '/css/pixel-theme.css',
        
        // 核心JS
        '/js/main.js',
        '/js/gsap.js',
        '/js/animation-core.js'
      ],
      
      important: [
        // 动画预设
        '/js/animation-presets.js',
        '/js/animation-components.js',
        
        // 字体
        '/fonts/PressStart2P-Regular.ttf'
      ],
      
      optional: [
        // 工具和调试
        '/js/animation-utils.js',
        
        // 图片资源
        '/images/pixel-bg.svg'
      ],
      
      pageSpecific: {
        female: ['/js/female-theme.js'],
        male: ['/js/male-theme.js'],
        s: ['/js/s-theme.js'],
        message: ['/js/message-animations.js']
      }
    }
    
    // 生成预加载HTML片段
    const generatePreloadTags = (resources, priority = 'high') => {
      return resources.map(resource => {
        const ext = path.extname(resource).slice(1)
        let as = 'script'
        
        if (ext === 'css') as = 'style'
        else if (ext === 'ttf' || ext === 'woff' || ext === 'woff2') as = 'font'
        else if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext)) as = 'image'
        
        const crossorigin = as === 'font' ? ' crossorigin' : ''
        return \`<link rel="preload" href="\${resource}" as="\${as}"\${crossorigin} importance="\${priority}">\`
      }).join('\\n')
    }
    
    const preloadHTML = \`
<!-- Critical resources -->
\${generatePreloadTags(manifest.critical, 'high')}

<!-- Important resources -->
\${generatePreloadTags(manifest.important, 'medium')}

<!-- Optional resources -->
\${generatePreloadTags(manifest.optional, 'low')}
\`
    
    // 保存清单和HTML片段
    await fs.promises.writeFile(
      path.join(this.projectRoot, 'preload-manifest.json'),
      JSON.stringify(manifest, null, 2)
    )
    
    await fs.promises.writeFile(
      path.join(this.projectRoot, 'preload-tags.html'),
      preloadHTML
    )
    
    console.log('✅ Preload manifest generated')
  }
  
  /**
   * 创建服务工作者
   */
  async createServiceWorker() {
    console.log('⚙️ Creating service worker...')
    
    const swCode = `
// Service Worker for GSAP Animation System
// 自动生成 - 请勿手动编辑

const CACHE_NAME = 'gsap-animation-system-v1'
const ANIMATION_CACHE = 'animation-resources-v1'

// 需要缓存的核心资源
const CORE_RESOURCES = [
  '/',
  '/css/index.css',
  '/js/main.js',
  '/js/gsap.js',
  '/js/animation-core.js',
  '/fonts/PressStart2P-Regular.ttf'
]

// 动画资源缓存策略
const ANIMATION_RESOURCES = [
  '/js/animation-presets.js',
  '/js/animation-components.js',
  '/images/pixel-bg.svg'
]

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // 缓存核心资源
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(CORE_RESOURCES)
      }),
      
      // 缓存动画资源
      caches.open(ANIMATION_CACHE).then(cache => {
        return cache.addAll(ANIMATION_RESOURCES)
      })
    ])
  )
  
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== ANIMATION_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return
  }
  
  // 动画资源使用缓存优先策略
  if (isAnimationResource(request.url)) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response
        }
        
        return fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(ANIMATION_CACHE).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }
  
  // 其他资源使用网络优先策略
  event.respondWith(
    fetch(request).then(response => {
      if (response.status === 200) {
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone)
        })
      }
      return response
    }).catch(() => {
      return caches.match(request)
    })
  )
})

function isAnimationResource(url) {
  return url.includes('/js/animation-') || 
         url.includes('/css/animation-') ||
         url.includes('gsap')
}

// 性能监控
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_REPORT') {
    // 发送性能数据到分析服务
    console.log('Performance data:', event.data.payload)
  }
})
`
    
    await fs.promises.writeFile(
      path.join(this.projectRoot, 'public/sw.js'),
      swCode
    )
    
    console.log('✅ Service worker created')
  }
  
  /**
   * 生成部署配置
   */
  async generateDeploymentConfig() {
    console.log('🚀 Generating deployment configurations...')
    
    // Cloudflare Pages配置
    const cloudflareConfig = {
      build: {
        command: "npm run build",
        publish: "dist"
      },
      headers: [
        {
          source: "/js/*.js",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable"
            },
            {
              key: "Content-Encoding",
              value: "gzip"
            }
          ]
        },
        {
          source: "/css/*.css",
          headers: [
            {
              key: "Cache-Control", 
              value: "public, max-age=31536000, immutable"
            }
          ]
        },
        {
          source: "/fonts/*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable"
            },
            {
              key: "Access-Control-Allow-Origin",
              value: "*"
            }
          ]
        }
      ],
      redirects: [
        {
          source: "/animation-demo",
          destination: "/",
          status: 302
        }
      ]
    }
    
    // Vercel配置
    const vercelConfig = {
      buildCommand: "npm run build",
      outputDirectory: "dist",
      installCommand: "npm install",
      headers: [
        {
          source: "/js/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable"
            }
          ]
        }
      ],
      rewrites: [
        {
          source: "/api/(.*)",
          destination: "/api/$1"
        }
      ]
    }
    
    // Netlify配置
    const netlifyConfig = `
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Content-Encoding = "gzip"

[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Access-Control-Allow-Origin = "*"

[[redirects]]
  from = "/animation-demo"
  to = "/"
  status = 302
`
    
    // 保存配置文件
    await fs.promises.writeFile(
      path.join(this.projectRoot, 'cloudflare.json'),
      JSON.stringify(cloudflareConfig, null, 2)
    )
    
    await fs.promises.writeFile(
      path.join(this.projectRoot, 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    )
    
    await fs.promises.writeFile(
      path.join(this.projectRoot, 'netlify.toml'),
      netlifyConfig
    )
    
    console.log('✅ Deployment configurations generated')
  }
  
  /**
   * 创建性能监控配置
   */
  async createPerformanceConfig() {
    console.log('📊 Creating performance monitoring config...')
    
    const perfConfig = {
      // Web Vitals阈值
      thresholds: {
        LCP: 2500,  // Largest Contentful Paint
        FID: 100,   // First Input Delay
        CLS: 0.1,   // Cumulative Layout Shift
        FCP: 1800,  // First Contentful Paint
        TTFB: 800   // Time to First Byte
      },
      
      // 动画性能阈值
      animation: {
        fps: 30,           // 最低FPS
        frameTime: 33,     // 最大帧时间(ms)
        memoryLimit: 100,  // 内存限制(MB)
        animationLimit: 20 // 同时动画数量限制
      },
      
      // 监控配置
      monitoring: {
        sampleRate: 0.1,        // 采样率10%
        reportInterval: 30000,   // 30秒报告一次
        enableRUM: true,        // 启用真实用户监控
        enableSynthetic: false  // 禁用合成监控
      },
      
      // 报告端点
      endpoints: {
        analytics: '/api/analytics',
        errors: '/api/errors',
        performance: '/api/performance'
      }
    }
    
    const perfScript = `
// 性能监控脚本
// 自动生成 - 请勿手动编辑

class PerformanceTracker {
  constructor(config) {
    this.config = config
    this.metrics = new Map()
    this.observers = []
    
    this.init()
  }
  
  init() {
    // Web Vitals监控
    this.trackWebVitals()
    
    // 动画性能监控
    this.trackAnimationPerformance()
    
    // 资源加载监控
    this.trackResourceLoading()
    
    // 错误监控
    this.trackErrors()
  }
  
  trackWebVitals() {
    // LCP监控
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // FID监控
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        this.recordMetric('FID', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })
    
    // CLS监控
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.recordMetric('CLS', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
  
  trackAnimationPerformance() {
    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFPS = () => {
      const currentTime = performance.now()
      frameCount++
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        this.recordMetric('FPS', fps)
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }
  
  trackResourceLoading() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        if (entry.name.includes('animation') || entry.name.includes('gsap')) {
          this.recordMetric('AnimationResourceLoad', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize
          })
        }
      })
    }).observe({ entryTypes: ['resource'] })
  }
  
  trackErrors() {
    window.addEventListener('error', (event) => {
      this.recordMetric('JSError', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('PromiseRejection', {
        reason: event.reason
      })
    })
  }
  
  recordMetric(name, value) {
    this.metrics.set(name, {
      value,
      timestamp: Date.now()
    })
    
    // 检查阈值
    this.checkThresholds(name, value)
    
    // 定期报告
    if (Math.random() < this.config.monitoring.sampleRate) {
      this.reportMetrics()
    }
  }
  
  checkThresholds(name, value) {
    const threshold = this.config.thresholds[name] || this.config.animation[name.toLowerCase()]
    
    if (threshold && typeof value === 'number' && value > threshold) {
      console.warn(\`Performance threshold exceeded: \${name} = \${value} (threshold: \${threshold})\`)
      
      // 发送警告
      this.sendAlert(name, value, threshold)
    }
  }
  
  async reportMetrics() {
    const metricsData = Object.fromEntries(this.metrics)
    
    try {
      await fetch(this.config.endpoints.performance, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: metricsData,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: location.href
        })
      })
    } catch (error) {
      console.warn('Failed to report metrics:', error)
    }
  }
  
  async sendAlert(metric, value, threshold) {
    try {
      await fetch(this.config.endpoints.errors, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'performance_alert',
          metric,
          value,
          threshold,
          timestamp: Date.now(),
          url: location.href
        })
      })
    } catch (error) {
      console.warn('Failed to send alert:', error)
    }
  }
}

// 初始化性能跟踪
const perfConfig = ${JSON.stringify(perfConfig, null, 2)}
const tracker = new PerformanceTracker(perfConfig)

export default tracker
`
    
    await fs.promises.writeFile(
      path.join(this.projectRoot, 'performance-config.json'),
      JSON.stringify(perfConfig, null, 2)
    )
    
    await fs.promises.writeFile(
      path.join(this.animationDir, 'utils/performanceTracker.js'),
      perfScript
    )
    
    console.log('✅ Performance monitoring configuration created')
  }
}

// 运行优化
const optimizer = new BuildOptimizer()
optimizer.optimize().catch(console.error)