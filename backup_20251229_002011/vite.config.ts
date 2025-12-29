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
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5174,
    // HTTPS 配置（仅开发环境）
    https: process.env.NODE_ENV === 'development',
  }
})