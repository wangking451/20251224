# 🚀 Nebula Cyber Store - 生产环境部署指南

## 📋 部署清单

### ✅ 已完成的准备工作

1. **前端构建配置**
   - ✅ Vite 生产环境构建优化
   - ✅ HTTPS 仅在开发环境启用
   - ✅ mkcert 插件已配置为开发环境专用
   - ✅ 代码已构建到 `dist/` 目录

2. **后端安全加固**
   - ✅ CORS 白名单配置
   - ✅ API 速率限制（100请求/15分钟）
   - ✅ 支付 API 严格限制（20请求/15分钟）
   - ✅ Helmet.js 安全头
   - ✅ 输入验证中间件
   - ✅ 生产环境日志控制

3. **安全配置**
   - ✅ CSP (Content Security Policy)
   - ✅ HSTS (Strict-Transport-Security)
   - ✅ X-Frame-Options, X-XSS-Protection
   - ✅ 环境变量保护 (.gitignore)

---

## 🌐 部署方案选择

### 方案 A：Vercel (推荐 - 最简单)

**优点**：
- 自动 HTTPS
- 全球 CDN
- 自动部署（Git 集成）
- 零配置

**步骤**：

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署前端**
   ```bash
   cd "c:\Users\Administrator\Desktop\新建文件夹 (8)"
   vercel
   ```
   
   按提示操作：
   - Set up and deploy? → Yes
   - Which scope? → 选择你的账号
   - Link to existing project? → No
   - Project name? → nebula-cyber-store
   - Directory? → ./
   - Override settings? → No

4. **配置环境变量**（在 Vercel Dashboard）
   ```
   VITE_SUPABASE_URL=https://pdgzqvgguowvrhptggfu.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_iW3rYhDsx21EHyYOrK1P9Q_6MiXgkt1
   VITE_PAYPAL_CLIENT_ID=你的PayPal客户端ID
   VITE_PAYPAL_MODE=production
   VITE_CLOUDINARY_CLOUD_NAME=你的Cloudinary云名称
   VITE_CLOUDINARY_UPLOAD_PRESET=你的上传预设
   VITE_API_BASE_URL=你的后端API地址
   VITE_ADMIN_DEFAULT_PASSWORD=强密码
   ```

5. **部署后端到其他平台**（见下方"后端部署"）

---

### 方案 B：Cloudflare Pages

**优点**：
- 完全免费
- 全球 CDN
- 自动 HTTPS

**步骤**：

1. **访问** [Cloudflare Pages](https://pages.cloudflare.com/)

2. **连接 GitHub/GitLab 仓库**

3. **构建设置**：
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

4. **环境变量**：同 Vercel 配置

---

### 方案 C：Netlify

**步骤**：

1. **安装 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登录并部署**
   ```bash
   cd "c:\Users\Administrator\Desktop\新建文件夹 (8)"
   netlify deploy --prod
   ```

3. **构建设置**：
   - Build command: `npm run build`
   - Publish directory: `dist`

---

## 🔧 后端部署（PayPal API Server）

### 后端部署选项

#### 选项 1：Railway (推荐)

1. **访问** [Railway.app](https://railway.app/)

2. **创建新项目** → 选择 "Deploy from GitHub"

3. **配置**：
   - Root directory: `/server`
   - Start command: `npm run prod`

4. **环境变量**：
   ```
   NODE_ENV=production
   PORT=3001
   PAYPAL_ENVIRONMENT=production
   PAYPAL_CLIENT_ID=你的生产PayPal客户端ID
   PAYPAL_CLIENT_SECRET=你的生产PayPal密钥
   PAYPAL_SANDBOX_CLIENT_ID=你的沙盒客户端ID
   PAYPAL_SANDBOX_CLIENT_SECRET=你的沙盒密钥
   ```

5. **获取部署 URL**（如 `https://your-app.railway.app`）

#### 选项 2：Render

1. **访问** [Render.com](https://render.com/)

2. **创建 Web Service**

3. **配置**：
   - Build command: `cd server && npm install`
   - Start command: `cd server && npm run prod`

#### 选项 3：Heroku

```bash
cd server
heroku create nebula-paypal-backend
git subtree push --prefix server heroku main
```

---

## 🔐 重要安全配置

### 1. 更新后端 CORS 白名单

**文件**: `server/server.js` (第37-44行)

```javascript
const allowedOrigins = [
  'http://localhost:5174',      // 本地开发
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
  'https://yourdomain.com',      // 👈 替换为你的Vercel域名
  'https://www.yourdomain.com',  // 👈 替换为自定义域名
];
```

### 2. 更新前端 API_BASE_URL

**Vercel 环境变量**：
```
VITE_API_BASE_URL=https://your-backend.railway.app
```

### 3. PayPal 生产环境切换

**环境变量**：
```
VITE_PAYPAL_MODE=production
PAYPAL_ENVIRONMENT=production
```

⚠️ **注意**：生产环境必须使用真实的 PayPal Business 账户！

---

## 📝 部署后检查清单

### 前端检查

- [ ] 网站可以通过 HTTPS 访问
- [ ] 所有图片正常加载
- [ ] 产品列表显示正常
- [ ] ChatInterface 功能正常
- [ ] ImageGen 功能正常
- [ ] 管理员登录正常（Supabase 认证）

### 后端检查

- [ ] PayPal API 连接正常
- [ ] CORS 配置正确（前端可以访问）
- [ ] 速率限制生效
- [ ] 日志输出正常（生产环境无调试日志）

### 支付功能检查

- [ ] PayPal CardFields 正常加载
- [ ] 信用卡支付流程完整
- [ ] 订单创建成功
- [ ] 支付捕获成功
- [ ] 支付成功跳转正常

---

## 🐛 常见问题

### 1. CORS 错误

**症状**：前端无法访问后端 API

**解决**：
1. 检查 `server/server.js` 的 `allowedOrigins` 数组
2. 添加你的 Vercel 域名（包括 https://）

### 2. PayPal 422 错误

**症状**：订单创建失败，返回 422

**原因**：PayPal 沙盒检测到敏感词

**解决**：
- 已在代码中移除商品描述
- 如仍报错，检查购物车数据

### 3. 环境变量未生效

**症状**：API Key 为 undefined

**解决**：
1. 检查 Vercel Dashboard → Settings → Environment Variables
2. 确保变量名以 `VITE_` 开头（前端）
3. 重新部署：`vercel --prod`

### 4. 图片无法加载

**症状**：Cloudinary 图片 404

**解决**：
1. 检查 `VITE_CLOUDINARY_CLOUD_NAME`
2. 检查图片 URL 格式
3. 验证 Cloudinary 账户状态

---

## 📊 监控和日志

### 查看 Vercel 日志

```bash
vercel logs
```

### 查看 Railway 日志

Railway Dashboard → 你的项目 → Logs

---

## 🔄 更新部署

### 自动部署（推荐）

**配置 GitHub Actions**：
- 推送到 `main` 分支自动部署
- Vercel/Cloudflare 自动检测提交

### 手动部署

```bash
# 前端
cd "c:\Users\Administrator\Desktop\新建文件夹 (8)"
npm run build
vercel --prod

# 后端
cd server
git push railway main
```

---

## 📞 支持

- **Vercel 文档**: https://vercel.com/docs
- **Railway 文档**: https://docs.railway.app
- **PayPal 文档**: https://developer.paypal.com

---

## 🎉 部署完成！

你的网站现在应该已经上线：
- 前端：`https://your-project.vercel.app`
- 后端：`https://your-backend.railway.app`

**下一步**：
1. 绑定自定义域名
2. 配置 DNS
3. 启用生产 PayPal 账户
4. 监控流量和错误
