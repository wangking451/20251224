# PayPal 后端 API 服务器

## 快速启动

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 启动服务器
```bash
npm start
```

服务器将在 `http://localhost:3001` 运行

## API 端点

### 创建订单
- **URL**: `POST /api/create-paypal-order`
- **Body**: 
```json
{
  "cart": [
    {
      "id": "1",
      "name": "Product Name",
      "price": 99.99,
      "quantity": 1
    }
  ],
  "currency": "USD"
}
```
- **Response**: 
```json
{
  "orderID": "PAYPAL_ORDER_ID",
  "status": "CREATED"
}
```

### 捕获支付
- **URL**: `POST /api/capture-paypal-order`
- **Body**: 
```json
{
  "orderID": "PAYPAL_ORDER_ID"
}
```
- **Response**: 
```json
{
  "success": true,
  "orderID": "PAYPAL_ORDER_ID",
  "captureID": "CAPTURE_ID",
  "status": "COMPLETED",
  "payer": {
    "email": "buyer@example.com",
    "name": "John Doe"
  }
}
```

### 健康检查
- **URL**: `GET /api/health`
- **Response**: 
```json
{
  "status": "OK",
  "message": "PayPal API Server is running",
  "environment": "sandbox"
}
```

## 配置说明

服务器使用沙箱环境凭证（已内置在代码中）：
- Client ID: `AWpU3p...`
- Secret: `EDAj7R...`
- API Base: `https://api-m.sandbox.paypal.com`

⚠️ **生产环境部署时**：
1. 替换为生产环境的 Client ID 和 Secret
2. 修改 `PAYPAL_API_BASE` 为 `https://api-m.paypal.com`
3. 使用环境变量存储敏感信息

## 安全提示

🔒 **不要**将此服务器直接暴露到公网  
✅ **建议**使用 Nginx 反向代理  
✅ **建议**添加 API 速率限制  
✅ **建议**使用环境变量管理敏感配置
