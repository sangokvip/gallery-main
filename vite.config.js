import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react()
    ],
    // GSAP和动画系统优化配置
    optimizeDeps: {
      include: [
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/TextPlugin',
        'gsap/MotionPathPlugin',
        'gsap/DrawSVGPlugin'
      ],
      exclude: [
        // 排除大型动画资源，使用动态导入
        'src/animations/utils/AnimationTestSuite.js'
      ]
    },
    server: {
      port: 3000
    },
    base: './',  // 使用相对路径以确保在Cloudflare上静态资源路径正确
    publicDir: 'public',  // 指定静态资源目录
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // 动画系统环境变量
      'process.env.VITE_ANIMATION_DEBUG': JSON.stringify(env.VITE_ANIMATION_DEBUG || 'false'),
      'process.env.VITE_PERFORMANCE_MONITORING': JSON.stringify(env.VITE_PERFORMANCE_MONITORING || 'true')
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction, // 开发环境启用sourcemap
      assetsInlineLimit: 4096,
      // 优化构建性能
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          // 移除console.log（保留console.error和console.warn）
          drop_console: ['log'],
          drop_debugger: true,
          // 优化动画相关代码
          pure_funcs: ['console.log', 'console.debug'],
          // 移除未使用的代码
          dead_code: true,
          // 优化条件语句
          conditionals: true
        },
        mangle: {
          // 保留动画相关的类名和函数名
          reserved: ['gsap', 'ScrollTrigger', 'timeline', 'tween']
        }
      } : {},
      rollupOptions: {
        input: {
          main: './index.html',
          female: './female.html',
          male: './male.html',
          s: './s.html',
          message: './message.html',
          gallery: './gallery.html'
        },
        output: {
          // 代码分割优化
          manualChunks: (id) => {
            // GSAP核心库单独打包
            if (id.includes('gsap')) {
              return 'gsap'
            }
            
            // 动画系统核心组件
            if (id.includes('src/animations/core')) {
              return 'animation-core'
            }
            
            // 动画预设和配置
            if (id.includes('src/animations/presets') || id.includes('src/animations/config')) {
              return 'animation-presets'
            }
            
            // React动画组件
            if (id.includes('src/animations/components')) {
              return 'animation-components'
            }
            
            // 动画工具和调试（仅开发环境）
            if (id.includes('src/animations/utils') && !isProduction) {
              return 'animation-utils'
            }
            
            // 第三方库
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
          // 资源文件命名
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            
            // 图片资源
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `images/[name]${isProduction ? '-[hash]' : ''}.[ext]`
            }
            
            // 字体资源
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `fonts/[name]${isProduction ? '-[hash]' : ''}.[ext]`
            }
            
            // CSS文件
            if (ext === 'css') {
              return `css/[name]${isProduction ? '-[hash]' : ''}.[ext]`
            }
            
            return `assets/[name]${isProduction ? '-[hash]' : ''}.[ext]`
          },
          // JS文件命名
          chunkFileNames: (chunkInfo) => {
            return `js/[name]${isProduction ? '-[hash]' : ''}.js`
          },
          entryFileNames: (chunkInfo) => {
            return `js/[name]${isProduction ? '-[hash]' : ''}.js`
          }
        },
        // 外部依赖优化
        external: isProduction ? [] : [],
        // Rollup插件配置
        plugins: []
      },
      // 构建优化
      chunkSizeWarningLimit: 1000, // 提高chunk大小警告阈值
      // CSS代码分割
      cssCodeSplit: true,
      // 预加载模块
      modulePreload: {
        polyfill: true
      }
    },
    // CSS预处理器配置
    css: {
      // CSS模块化
      modules: {
        localsConvention: 'camelCase'
      },
      // PostCSS配置
      postcss: {
        plugins: []
      }
    },
    // 预览服务器配置
    preview: {
      port: 4173,
      host: true
    },
    // 环境变量配置
    envPrefix: 'VITE_'
  }
})