import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react()
    ],
    server: {
      port: 3000
    },
    base: './',  // 使用相对路径以确保在Cloudflare上静态资源路径正确
    publicDir: 'public',  // 指定静态资源目录
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    // 仅在生产构建时移除调试日志，保留 console.error / console.warn 便于线上排查
    esbuild: command === 'build'
      ? { drop: ['debugger'], pure: ['console.log', 'console.info', 'console.debug'] }
      : {},
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      assetsInlineLimit: 4096,
      rollupOptions: {
        input: {
          main: './index.html',
          female: './female.html',
          male: './male.html',
          lgbt: './lgbt.html',
          s: './s.html',
          message: './message.html',
          gallery: './gallery.html',
          member: './member.html',
          share: './share.html',
          sangok: './sangok.html'
        },
        output: {
          // 把体积大、更新频率低的第三方库拆成稳定的 vendor chunk，
          // 业务代码改动时用户无需重新下载它们（长期缓存命中）
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (
              id.includes('html2canvas') ||
              id.includes('html2pdf') ||
              id.includes('jspdf') ||
              id.includes('dompurify') ||
              id.includes('file-saver')
            ) return undefined
            if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor')) return 'vendor-charts'
            // 注意：不要把 html2canvas / html2pdf / jspdf / dompurify 强制分到一个命名 chunk。
            // 它们只在导出/分享时按需动态 import；若强制成命名 chunk，Vite 的 __vitePreload
            // 助手会被并入其中，导致所有用到动态 import 的入口都要静态加载这 ~650KB。
            // 交给 Rollup 自动拆成 on-demand 异步 chunk。
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui'
            if (id.includes('/gsap/')) return 'vendor-gsap'
            if (id.includes('/react') || id.includes('/scheduler/') || id.includes('/prop-types/')) return 'vendor-react'
            return 'vendor'
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `[name].[ext]`;
            }
            return `assets/[name]-[hash].[ext]`;
          },
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'admin-debug') {
              return 'assets/admin-debug-[hash].js';
            }
            return 'assets/[name]-[hash].js';
          }
        }
      }
    }
  }
})
