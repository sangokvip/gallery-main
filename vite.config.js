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
          s: './s.html',
          message: './message.html',
          gallery: './gallery.html'
        },
        output: {
          manualChunks: undefined,
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `[name].[ext]`;
            }
            return `assets/[name]-[hash].[ext]`;
          }
        }
      }
    }
  }
})