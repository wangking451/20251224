import { Product, CartItem } from '../types';
import { PRODUCTS as MOCK_PRODUCTS } from '../products';

// =================================================================
// 【配置指南 / CONFIGURATION】
// 1. 部署前：保持为空，网站将运行在 "演示模式" (Mock Mode)。
// 2. 对接时：填入你的 Shopify 域名和 Storefront Access Token。
// =================================================================
const SHOPIFY_DOMAIN = ''; // 例如: 'nebula-cyber.myshopify.com'
const SHOPIFY_ACCESS_TOKEN = ''; // 例如: 'dd4d4...' (Storefront API Token)
const API_VERSION = '2024-01';

// =================================================================
// 【PayPal 配置 / PAYPAL CONFIGURATION】
// 1. 访问 https://developer.paypal.com/
// 2. 创建应用获取 Client ID
// 3. 填入下方配置
// =================================================================
const PAYPAL_CLIENT_ID = 'AWpU3pWBDzw9f0otzwofJphfLltTn7fsu9ZHjisxHM-MRXvVm3zQaMXbLh4GFTeZtv40l9D0mX4l4tmA'; // PayPal Client ID (测试环境使用 Sandbox Client ID)
const PAYPAL_MODE = 'sandbox'; // 'sandbox' 测试环境 或 'production' 生产环境

/**
 * 核心请求函数：尝试连接 Shopify
 * 如果没有配置 Key，直接返回 null，触发下方的回退逻辑
 */
async function shopifyFetch(query: string, variables = {}) {
  // 检查配置是否存在
  if (!SHOPIFY_DOMAIN || !SHOPIFY_ACCESS_TOKEN || SHOPIFY_DOMAIN === '') {
    return null; 
  }

  try {
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    
    const json = await res.json();
    if (json.errors) {
      console.error("Shopify API Errors:", json.errors);
      return null;
    }
    return json;
  } catch (e) {
    console.error("Shopify Network Error:", e);
    return null;
  }
}

/**
 * 获取商品列表 (Hybrid 实现)
 */
export const fetchProducts = async (): Promise<Product[]> => {
  // 🔥 优先检查 localStorage 中的导入数据
  const savedProducts = localStorage.getItem('nebula_products');
  if (savedProducts) {
    try {
      const parsed = JSON.parse(savedProducts);
      console.log(`✅ [SYSTEM]: Loaded ${parsed.length} products from localStorage`);
      return parsed;
    } catch (e) {
      console.error('Failed to parse saved products:', e);
      // 如果解析失败，继续执行下面的逻辑
    }
  }

  // Shopify GraphQL 查询
  const query = `
    {
      products(first: 20) {
        edges {
          node {
            id
            title
            description
            productType
            availableForSale
            images(first: 4) {
              edges { node { url } }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  sku
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  `;

  // 尝试从 Shopify 获取
  const data = await shopifyFetch(query);

  // 1. 如果 API 未配置或失败 -> 使用本地 Mock 数据
  if (!data || !data.data) {
    console.log("⚡ [SYSTEM]: Running in LOCAL MOCK MODE (API keys not detected)");
    return new Promise(resolve => {
        // 模拟一点加载时间，让体验更真实
        setTimeout(() => resolve(MOCK_PRODUCTS), 500);
    });
  }

  // 2. 如果成功 -> 转换 Shopify 数据结构为 App 所需格式
  console.log("⚡ [SYSTEM]: Connected to SHOPIFY MAINFRAME");
  return data.data.products.edges.map((edge: any) => {
    const p = edge.node;
    const v = p.variants.edges[0]?.node;
    
    // 如果没有变体价格，默认为 0
    const price = v ? parseFloat(v.price.amount) : 0;
    
    // 映射 Shopify Product Type 到我们的分类
    // 建议在 Shopify 后台将 Product Type 设置为: 'VIBES', 'BONDAGE', 'LINGERIE' 等
    const category = p.productType ? p.productType.toUpperCase() : 'UNCATEGORIZED';

    return {
      id: v?.id || p.id, // 重要：使用 Variant ID 用于结账
      sku: v?.sku || 'N/A',
      name: p.title,
      price: price,
      category: category,
      images: p.images.edges.map((img: any) => img.node.url),
      description: p.description || "No description available in mainframe.",
      
      // 以下字段 Shopify Storefront API 默认不提供，使用通用默认值填充
      // 进阶做法是使用 Metafields
      features: ['Neural Interface Compatible', 'Bio-Haptic Feedback', 'Secure Encryption'],
      specs: { material: 'Synthetic', size: 'Standard', noise: '<20dB', battery: 'Long-life' },
      stockStatus: p.availableForSale ? 'IN_STOCK' : 'OUT_OF_STOCK',
      
      // 视频暂时使用占位符 (因为 Storefront API 处理视频较复杂)
      mainVideo: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      socialVideo: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    } as Product;
  });
};

/**
 * 创建结账会话 (Hybrid 实现)
 */
export const createCheckoutSession = async (cart: CartItem[], paymentMethod: string = 'CARD'): Promise<string> => {
  // Shopify Checkout Mutation
  const mutation = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout { webUrl }
        checkoutUserErrors { field message }
      }
    }
  `;

  // 构建订单项
  const lineItems = cart.map(item => ({
    variantId: item.id,
    quantity: item.quantity
  }));

  const data = await shopifyFetch(mutation, { input: { lineItems } });

  // 1. API 成功 -> 返回 Shopify 官方结账 URL
  if (data && data.data && data.data.checkoutCreate.checkout) {
    console.log("⚡ [CHECKOUT]: Redirecting to Shopify Secure Checkout...");
    return data.data.checkoutCreate.checkout.webUrl;
  }

  // 2. API 失败或未配置 -> 处理不同的支付方式
  console.log(`⚡ [CHECKOUT]: Processing ${paymentMethod} checkout...`);
  
  // PayPal支付 - 使用后端API
  if (paymentMethod === 'PAYPAL') {
    console.log('🔵 [PayPal]: Creating PayPal order via backend...');
    
    try {
      // 调用后端API创建PayPal订单
      const response = await fetch('http://localhost:3001/api/create-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: cart,
          currency: 'USD'
        })
      });

      const { orderID } = await response.json();
      
      if (orderID) {
        console.log(`✅ [PayPal]: Order created - ${orderID}`);
        // 返回PayPal结账URL（前端将使用PayPal SDK处理）
        return `paypal:${orderID}`; // 特殊格式，前端会识别
      }
    } catch (error) {
      console.error('❌ [PayPal]: Failed to create order', error);
      // 如果后端不可用，返回模拟成功页
      return new Promise(resolve => 
        setTimeout(() => resolve("#/checkout-success?method=paypal&demo=true"), 1000)
      );
    }
  }
  
  // Google Pay支付
  if (paymentMethod === 'GOOGLEPAY') {
    console.log('🔴 [Google Pay]: Initiating Google Pay checkout...');
    return new Promise(resolve => 
      setTimeout(() => resolve("#/checkout-success?method=googlepay"), 1000)
    );
  }
  
  // Apple Pay支付
  if (paymentMethod === 'APPLEPAY') {
    console.log('🍎 [Apple Pay]: Initiating Apple Pay checkout...');
    return new Promise(resolve => 
      setTimeout(() => resolve("#/checkout-success?method=applepay"), 1000)
    );
  }
  
  // 信用卡支付（默认）
  return new Promise(resolve => setTimeout(() => resolve("#/checkout-success?method=card"), 1000));
};

/**
 * 获取 PayPal 配置
 * 优先使用后台配置，如果没有则使用代码中的配置
 */
export const getPayPalConfig = (storeConfig?: any) => {
  // 优先使用后台配置
  if (storeConfig?.paypalConfig?.enabled && storeConfig?.paypalConfig?.clientId) {
    return {
      clientId: storeConfig.paypalConfig.clientId,
      mode: storeConfig.paypalConfig.mode || 'sandbox',
      isConfigured: true
    };
  }
  
  // 如果没有后台配置，使用代码中的配置
  return {
    clientId: PAYPAL_CLIENT_ID,
    mode: PAYPAL_MODE,
    isConfigured: PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID !== ''
  };
};

/**
 * 加载 PayPal SDK 脚本（支持信用卡支付）
 */
export const loadPayPalSDK = (clientId: string, currency: string = 'USD'): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载（基础组件）
    if ((window as any).paypal && (window as any).paypal.Buttons) {
      console.log('✅ [PayPal]: SDK already loaded with card-fields support');
      resolve((window as any).paypal);
      return;
    }
    
    // 如果已加载但组件不完整，清除旧脚本
    if ((window as any).paypal) {
      console.log('⚠️ [PayPal]: Clearing incomplete SDK...');
      const oldScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (oldScript) {
        oldScript.remove();
      }
      delete (window as any).paypal;
    }

    // 创建 script 标签，加载 buttons 和 card-fields 组件
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&components=buttons,card-fields`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ [PayPal]: SDK loaded successfully with card-fields support');
      resolve((window as any).paypal);
    };
    
    script.onerror = () => {
      console.error('❌ [PayPal]: Failed to load SDK');
      reject(new Error('Failed to load PayPal SDK'));
    };
    
    document.body.appendChild(script);
  });
};

/**
 * 检查Apple Pay是否可用
 */
export const checkApplePayAvailability = (): boolean => {
  // 检查浏览器是否支持Apple Pay
  if ((window as any).ApplePaySession) {
    // 检查设备是否能使用Apple Pay
    return (window as any).ApplePaySession.canMakePayments();
  }
  return false;
};

/**
 * 检查Google Pay是否可用
 */
export const checkGooglePayAvailability = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // 检查是否已加载Google Pay API
      if ((window as any).google && (window as any).google.payments) {
        const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
          environment: 'TEST' // 'PRODUCTION' for production
        });
        
        paymentsClient.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA']
            }
          }]
        }).then((response: any) => {
          resolve(response.result);
        }).catch(() => {
          resolve(false);
        });
      } else {
        resolve(false);
      }
    } catch (e) {
      resolve(false);
    }
  });
};

/**
 * 加载Google Pay SDK
 */
export const loadGooglePaySDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if ((window as any).google && (window as any).google.payments) {
      console.log('✅ [Google Pay]: SDK already loaded');
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ [Google Pay]: SDK loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('❌ [Google Pay]: Failed to load SDK');
      reject(new Error('Failed to load Google Pay SDK'));
    };
    
    document.body.appendChild(script);
  });
};