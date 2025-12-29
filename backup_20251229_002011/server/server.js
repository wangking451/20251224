// PayPal 后端 API 服务 - 使用官方 PayPal Server SDK
// 用于处理订单创建和支付捕获

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase 配置（使用 Service Role Key，拥有完全权限）
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 安全头配置
app.use(helmet({
  contentSecurityPolicy: false, // 由前端配置
  crossOriginEmbedderPolicy: false,
}));

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
// CORS配置 - 限制允许的域名
const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
  'https://localhost:5174',
  'https://localhost:5173',
  'https://127.0.0.1:5174',
  'https://127.0.0.1:5173',
  // 生产环境域名，部署时取消注释并填入
  // 'https://yourdomain.com',
  // 'https://www.yourdomain.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // 允许没有origin的请求（如移动应用、Postman等）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ [CORS]: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' })); // 限制请求体大小
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制配置
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 支付API更严格，每个IP最多20个请求
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 应用速率限制
app.use('/api/', apiLimiter);

// 输入验证中间件
const validateInput = (req, res, next) => {
  // 验证请求体大小
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return res.status(413).json({ error: 'Request entity too large' });
  }
  
  // 验证Content-Type
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
  }
  
  next();
};

app.use('/api/', validateInput);

// 日志中间件
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use((req, res, next) => {
  if (isDevelopment) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
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
app.post('/api/create-paypal-order', strictLimiter, async (req, res) => {
  try {
    const { cart, currency = 'USD' } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    console.log(`📦 [Order]: Creating order for ${cart.length} items`);
    // 🔒 为避免PayPal审查，不输出敏感商品信息
    // console.log('🔍 [Debug]: Cart data:', JSON.stringify(cart, null, 2));

    // 计算总金额
    const totalAmount = cart.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // 获取访问令牌
    const accessToken = await getPayPalAccessToken();

    // 📦 创建订单请求（清理所有敏感信息）
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: totalAmount.toFixed(2),
          },
          // ❗ 不发送items，避免PayPal审查商品名称
          description: 'Online Purchase',
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
app.post('/api/capture-paypal-order', strictLimiter, async (req, res) => {
  try {
    const { orderID, cart, shippingInfo } = req.body;  // 添加 shippingInfo

    console.log('🔍 [Debug] orderID:', orderID);
    console.log('🔍 [Debug] cart:', cart ? `${cart.length} items` : 'undefined');
    console.log('🔍 [Debug] shippingInfo:', shippingInfo ? 'provided' : 'undefined');

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
    console.log('🔍 [Debug] Full captureData:', JSON.stringify(captureData, null, 2));

    // 提取支付信息
    const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
    const paymentStatus = captureData.status;
    const payerEmail = captureData.payer?.email_address;
    const payerName = `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim();
    
    // 从 PayPal 响应中提取收货地址
    const paypalShipping = captureData.purchase_units[0]?.shipping;
    const paypalPhone = captureData.payer?.phone?.phone_number?.national_number;

    // 支付成功后自动创建订单（如果提供了 cart 信息）
    if (cart && cart.length > 0 && captureData.status === 'COMPLETED') {
      try {
        const orderNumber = generateOrderNumber();
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // 构建收货地址对象（优先使用前端传递的完整信息，其次使用 PayPal 返回的）
        let shippingAddress = null;
        
        // 检查前端信息是否完整
        const hasFrontendShipping = shippingInfo && shippingInfo.address && shippingInfo.city && shippingInfo.state;
        
        console.log('🔍 [Debug] shippingInfo:', shippingInfo);
        console.log('🔍 [Debug] hasFrontendShipping:', hasFrontendShipping);
        console.log('🔍 [Debug] paypalShipping:', paypalShipping);
        
        if (hasFrontendShipping) {
          // 使用前端传递的地址（信用卡支付）
          shippingAddress = {
            address: `${shippingInfo.address}${shippingInfo.apartment ? ', ' + shippingInfo.apartment : ''}`,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            country: shippingInfo.country || 'United States'
          };
        } else if (paypalShipping?.address) {
          // 使用 PayPal 返回的地址
          shippingAddress = {
            address: `${paypalShipping.address.address_line_1 || ''}${paypalShipping.address.address_line_2 ? ', ' + paypalShipping.address.address_line_2 : ''}`,
            city: paypalShipping.address.admin_area_2 || '',
            state: paypalShipping.address.admin_area_1 || '',
            zipCode: paypalShipping.address.postal_code || '',
            country: paypalShipping.address.country_code || 'US'
          };
        }
        
        const order = {
          id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order_number: orderNumber,
          customer_email: payerEmail || shippingInfo?.email || 'guest@example.com',
          customer_name: payerName || paypalShipping?.name?.full_name || `${shippingInfo?.firstName || ''} ${shippingInfo?.lastName || ''}`.trim() || 'Guest',
          customer_phone: (hasFrontendShipping ? shippingInfo?.phone : null) || paypalPhone || null,
          shipping_address: shippingAddress,
          items: cart.map(item => ({
            productId: item.id,
            productName: item.name,
            productImage: item.images?.[0] || '',
            sku: item.sku || '',
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
          })),
          subtotal: subtotal,
          shipping_fee: 0,
          tax: 0,
          total: subtotal,
          currency: 'USD',
          payment_method: 'PAYPAL',
          payment_status: 'PAID',
          order_status: 'PENDING',
          paypal_order_id: orderID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
          .from('orders')
          .insert([order])
          .select();

        if (error) {
          console.error('❌ [订单]: 创建失败:', error);
        } else {
          console.log(`✅ [订单]: 自动创建成功 - ${orderNumber}`);
        }
      } catch (err) {
        console.error('❌ [订单]: 创建异常:', err);
        // 不影响支付结果，继续返回成功
      }
    }

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

/**
 * 生成订单号：ORD-YYYYMMDD-XXX
 */
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * API: 创建订单（支付成功后调用）
 * POST /api/create-order
 */
app.post('/api/create-order', strictLimiter, async (req, res) => {
  try {
    const { 
      customerEmail, 
      customerName, 
      customerPhone,
      shippingAddress,
      items, 
      subtotal, 
      shippingFee, 
      tax, 
      total, 
      currency,
      paymentMethod,
      paypalOrderId 
    } = req.body;

    // 验证必填字段
    if (!customerEmail || !items || !total) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    // 生成订单号
    const orderNumber = generateOrderNumber();

    console.log(`📦 [订单]: 创建订单 ${orderNumber}`);

    // 创建订单对象
    const order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order_number: orderNumber,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      items: items,  // Supabase 自动处理 JSON
      subtotal: subtotal,
      shipping_fee: shippingFee || 0,
      tax: tax || 0,
      total: total,
      currency: currency || 'USD',
      payment_method: paymentMethod || 'PAYPAL',
      payment_status: 'PAID',  // 只有支付成功才创建订单
      order_status: 'PENDING',
      paypal_order_id: paypalOrderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 存储到 Supabase（绕过 RLS）
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([order])
      .select();

    if (error) {
      console.error('❌ [订单]: 创建失败:', error);
      return res.status(500).json({ error: '订单创建失败', details: error.message });
    }

    console.log(`✅ [订单]: 创建成功 - ${orderNumber}`);
    
    res.json({ 
      success: true, 
      order: data[0],
      orderNumber 
    });

  } catch (error) {
    console.error('❌ [订单]: 服务器错误:', error);
    res.status(500).json({ error: '服务器错误', message: error.message });
  }
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
