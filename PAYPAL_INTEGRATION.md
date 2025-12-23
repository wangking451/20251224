# PayPal 支付集成指南

## 集成方式：PayPal JavaScript SDK

### 1. 获取 PayPal 凭证

访问 [PayPal Developer](https://developer.paypal.com/)
1. 登录/注册 PayPal Developer 账号
2. 创建应用 (Create App)
3. 获取 **Client ID** (公开) 和 **Secret** (服务端)

### 2. 配置方式

在 `services/api.ts` 中配置：

```typescript
const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID'; // 测试环境使用 Sandbox Client ID
const PAYPAL_MODE = 'sandbox'; // 'sandbox' 测试环境 或 'production' 生产环境
```

### 3. 测试账号

PayPal Sandbox 提供测试买家和卖家账号：
- 登录 Developer Dashboard
- 进入 Sandbox > Accounts
- 创建测试买家账号用于测试支付

### 4. 前端集成流程

```
用户选择PayPal → 
加载PayPal按钮 → 
用户登录PayPal → 
确认支付 → 
回调处理订单
```

### 5. 当前实现状态

✅ PayPal选项界面已完成
✅ PayPal JavaScript SDK已集成
✅ PayPal按钮自动渲染
✅ 订单创建逻辑已实现
⏳ 需要配置真实的 Client ID

### 6. 下一步

1. 在 PayPal Developer 创建应用
2. 在 `services/api.ts` 填入 Client ID
3. 测试支付流程
