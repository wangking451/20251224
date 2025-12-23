// PayPal 后端 API 服务 - 使用官方 PayPal Server SDK
// 用于处理订单创建和支付捕获

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3001;

// PayPal 配置 - 根据环境选择凭证
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
const PAYPAL_CLIENT_ID = PAYPAL_ENVIRONMENT === 'production'
  ? process.env.PAYPAL_CLIENT_ID
  : process.env.PAYPAL_SANDBOX_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = PAYPAL_ENVIRONMENT === 'production'
  ? process.env.PAYPAL_CLIENT_SECRET
  : process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
const PAYPAL_API_BASE = PAYPAL_ENVIRONMENT === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * 获取 PayPal Access Token
 */
async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ [PayPal Auth Error]:', data);
      throw new Error('Failed to get PayPal access token');
    }

    console.log('✅ [PayPal]: Access token obtained');
    return data.access_token;
  } catch (error) {
    console.error('❌ [PayPal Auth Error]:', error);
    throw error;
  }
}

/**
 * API: 创建 PayPal 订单
 * POST /api/create-paypal-order
 */
app.post('/api/create-paypal-order', async (req, res) => {
  try {
    const { cart, currency = 'USD' } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    console.log(`📦 [Order]: Creating order for ${cart.length} items`);

    // 计算总金额
    const totalAmount = cart.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // 获取访问令牌
    const accessToken = await getPayPalAccessToken();

    // 创建订单请求
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: totalAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: totalAmount.toFixed(2),
              },
            },
          },
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: currency,
              value: item.price.toFixed(2),
            },
          })),
        },
      ],
    };

    // 发送创建订单请求
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const order = await response.json();

    if (!response.ok) {
      console.error('❌ [PayPal Order Error]:', order);
      return res.status(response.status).json({ error: 'Failed to create order', details: order });
    }

    console.log(`✅ [Order]: Created successfully - ID: ${order.id}`);
    
    res.json({
      orderID: order.id,
      status: order.status,
    });

  } catch (error) {
    console.error('❌ [Order Error]:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * API: 捕获 PayPal 支付
 * POST /api/capture-paypal-order
 */
app.post('/api/capture-paypal-order', async (req, res) => {
  try {
    const { orderID } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    console.log(`💰 [Payment]: Capturing order ${orderID}`);

    // 获取访问令牌
    const accessToken = await getPayPalAccessToken();

    // 捕获支付
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await response.json();

    if (!response.ok) {
      console.error('❌ [PayPal Capture Error]:', captureData);
      return res.status(response.status).json({ error: 'Failed to capture payment', details: captureData });
    }

    console.log(`✅ [Payment]: Captured successfully - Order: ${orderID}`);
    console.log(`💳 [Payment]: Status: ${captureData.status}`);

    // 提取支付信息
    const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
    const paymentStatus = captureData.status;
    const payerEmail = captureData.payer?.email_address;
    const payerName = `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`;

    res.json({
      success: true,
      orderID: orderID,
      captureID: captureId,
      status: paymentStatus,
      payer: {
        email: payerEmail,
        name: payerName,
      },
      details: captureData,
    });

  } catch (error) {
    console.error('❌ [Capture Error]:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * 获取 PayPal Client Token (用于前端 v6 SDK)
 */
async function getPayPalClientToken(domains = []) {
    try {
        const accessToken = await getPayPalAccessToken();
        
        // 构建请求体
        let body = 'grant_type=client_credentials&response_type=client_token';
        if (domains && domains.length > 0) {
            domains.forEach(domain => {
                body += `&domains[]=${encodeURIComponent(domain)}`;
            });
        }
        
        const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('❌ [PayPal Client Token Error]:', data);
            throw new Error('Failed to get PayPal client token');
        }

        console.log('✅ [PayPal]: Client token obtained');
        return data.access_token;
    } catch (error) {
        console.error('❌ [PayPal Client Token Error]:', error);
        throw error;
    }
}

/**
 * API: 获取 PayPal Client Token
 * GET /api/get-paypal-client-token
 */
app.get('/api/get-paypal-client-token', async (req, res) => {
    try {
        // 获取域名参数（可选）
        const domains = req.query.domains ? req.query.domains.split(',') : [];
        
        const clientToken = await getPayPalClientToken(domains);
        
        res.json({
            clientToken: clientToken,
        });
    } catch (error) {
        console.error('❌ [Client Token API Error]:', error);
        res.status(500).json({ error: 'Failed to get client token', message: error.message });
    }
});

/**
 * API: 健康检查
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PayPal API Server is running',
    environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
    sdkVersion: 'PayPal Server SDK v1.0.0',
    timestamp: new Date().toISOString(),
  });
});
// 启动服务器
app.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log(`🚀 PayPal API Server Running`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 Environment: ${process.env.PAYPAL_ENVIRONMENT || 'sandbox'}`);
  console.log(`🚀 SDK: PayPal Server SDK v1.0.0`);
  console.log('🚀 ================================');
  console.log(`📡 Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/create-paypal-order`);
  console.log(`   - POST http://localhost:${PORT}/api/capture-paypal-order`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log('🚀 ================================');
});
