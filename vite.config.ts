import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/20251224/',
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5174,
    // HTTPS 配置（开发环境）
    // 生产环境建议使用 Nginx/Caddy 等反向代理配置 HTTPS
    https: process.env.VITE_HTTPS === 'true' ? {
      // 使用自签名证书（仅开发）
      // 生产环境请使用真实证书（Let's Encrypt等）
      key: fs.existsSync(path.resolve(__dirname, 'certs/localhost-key.pem')) 
        ? fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem'))
        : undefined,
      cert: fs.existsSync(path.resolve(__dirname, 'certs/localhost.pem'))
        ? fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem'))
        : undefined,
    } : false,
  }
})