import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 仅开发环境启用 HTTPS
    process.env.NODE_ENV === 'development' && mkcert({
      savePath: './certs',
      force: true,
    })
  ].filter(Boolean),
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',  // 使用 terser 以支持 drop_console
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    // 生产环境移除所有 console
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5174,
    // HTTPS 配置（仅开发环境）
    https: process.env.NODE_ENV === 'development',
  }
})