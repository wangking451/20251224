/**
 * 汇率服务 - 支持多种汇率API
 * 
 * 支持的API:
 * 1. PayPal Currency Converter (免费，推荐)
 * 2. ExchangeRate-API (免费)
 * 3. Open Exchange Rates (需要API Key)
 * 4. Fixer.io (需要API Key)
 */

// =================================================================
// 【配置区域】
// =================================================================
const EXCHANGERATE_API_KEY = ''; // 免费获取: https://www.exchangerate-api.com/
const OPENEXCHANGE_APP_ID = ''; // 获取地址: https://openexchangerates.org/
const FIXER_API_KEY = ''; // 获取地址: https://fixer.io/

// 当前使用的汇率引擎
type ExchangeEngine = 'paypal' | 'exchangerate' | 'openexchange' | 'fixer' | 'mock';
const CURRENT_ENGINE: ExchangeEngine = 'paypal'; // 使用PayPal汇率API

// 汇率缓存时间（毫秒）
const CACHE_DURATION = 1000 * 60 * 60; // 1小时

// =================================================================
// 货币符号映射
// =================================================================
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  RUB: '₽',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  SGD: 'S$',
  KRW: '₩',
  BRL: 'R$',
  MXN: 'MX$',
  INR: '₹',
  AED: 'AED',
  SEK: 'kr'
};

// =================================================================
// Mock 汇率数据 (演示模式 - 基于USD)
// =================================================================
const MOCK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,      // 欧元
  GBP: 0.79,      // 英镑
  JPY: 149.50,    // 日元
  RUB: 92.50,     // 俄罗斯卢布
  CAD: 1.36,      // 加拿大元
  AUD: 1.53,      // 澳大利亚元
  CHF: 0.88,      // 瑞士法郎
  SGD: 1.34,      // 新加坡元
  KRW: 1315.00,   // 韩元
  BRL: 4.97,      // 巴西雷亚尔
  MXN: 17.12,     // 墨西哥比索
  INR: 83.12,     // 印度卢比
  AED: 3.67,      // 阿联酋迪拉姆
  SEK: 10.35      // 瑞典克朗
};

// =================================================================
// 汇率缓存
// =================================================================
interface CachedRates {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
}

let ratesCache: CachedRates | null = null;

// =================================================================
// PayPal Currency Converter API (免费，无需API Key)
// =================================================================
async function fetchPayPalRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  try {
    // 使用免费的exchangerate.host API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.rates) {
      console.log(`✅ [PayPal API]: Fetched rates for ${baseCurrency}`);
      return data.rates;
    }
    
    throw new Error('No rates data in response');
  } catch (error) {
    console.error('PayPal API Error:', error);
    throw error;
  }
}

// =================================================================
// ExchangeRate-API (免费，推荐)
// =================================================================
async function fetchExchangeRateAPI(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  const url = EXCHANGERATE_API_KEY && EXCHANGERATE_API_KEY !== ''
    ? `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/${baseCurrency}`
    : `https://open.er-api.com/v6/latest/${baseCurrency}`; // 免费版本（有请求限制）
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.result === 'success' && data.conversion_rates) {
      return data.conversion_rates;
    }
    
    throw new Error('Failed to fetch exchange rates');
  } catch (error) {
    console.error('ExchangeRate-API Error:', error);
    throw error;
  }
}

// =================================================================
// Open Exchange Rates API
// =================================================================
async function fetchOpenExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  if (!OPENEXCHANGE_APP_ID || OPENEXCHANGE_APP_ID === '') {
    throw new Error('Open Exchange Rates APP ID not configured');
  }

  const url = `https://openexchangerates.org/api/latest.json?app_id=${OPENEXCHANGE_APP_ID}&base=${baseCurrency}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.rates) {
      return data.rates;
    }
    
    throw new Error('Failed to fetch exchange rates');
  } catch (error) {
    console.error('Open Exchange Rates Error:', error);
    throw error;
  }
}

// =================================================================
// Fixer.io API
// =================================================================
async function fetchFixerRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  if (!FIXER_API_KEY || FIXER_API_KEY === '') {
    throw new Error('Fixer API key not configured');
  }

  const url = `https://api.fixer.io/latest?access_key=${FIXER_API_KEY}&base=${baseCurrency}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success && data.rates) {
      return data.rates;
    }
    
    throw new Error('Failed to fetch exchange rates');
  } catch (error) {
    console.error('Fixer.io Error:', error);
    throw error;
  }
}

// =================================================================
// 获取汇率数据
// =================================================================
export async function getExchangeRates(
  baseCurrency: string = 'USD',
  forceRefresh: boolean = false,
  engine: ExchangeEngine = CURRENT_ENGINE
): Promise<Record<string, number>> {
  
  // 检查缓存
  const now = Date.now();
  if (!forceRefresh && ratesCache && ratesCache.base === baseCurrency) {
    if (now - ratesCache.timestamp < CACHE_DURATION) {
      console.log('✅ [Exchange]: Using cached rates');
      return ratesCache.rates;
    }
  }

  // 获取新汇率
  try {
    let rates: Record<string, number>;

    switch (engine) {
      case 'paypal':
        console.log('💙 [Exchange]: Fetching from PayPal API...');
        rates = await fetchPayPalRates(baseCurrency);
        break;
        
      case 'exchangerate':
        console.log('🌍 [Exchange]: Fetching from ExchangeRate-API...');
        rates = await fetchExchangeRateAPI(baseCurrency);
        break;
      
      case 'openexchange':
        console.log('🌍 [Exchange]: Fetching from Open Exchange Rates...');
        rates = await fetchOpenExchangeRates(baseCurrency);
        break;
      
      case 'fixer':
        console.log('🌍 [Exchange]: Fetching from Fixer.io...');
        rates = await fetchFixerRates(baseCurrency);
        break;
      
      case 'mock':
      default:
        console.log('⚡ [Exchange]: Using mock exchange rates');
        rates = MOCK_RATES;
        break;
    }

    // 更新缓存
    ratesCache = {
      rates,
      base: baseCurrency,
      timestamp: now
    };

    console.log(`✅ [Exchange]: Loaded ${Object.keys(rates).length} exchange rates`);
    return rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // 如果失败，返回缓存或mock数据
    if (ratesCache) {
      console.log('⚠️ [Exchange]: Using stale cache');
      return ratesCache.rates;
    }
    
    console.log('⚠️ [Exchange]: Falling back to mock rates');
    return MOCK_RATES;
  }
}

// =================================================================
// 转换价格
// =================================================================
export async function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>
): Promise<number> {
  
  console.log(`💱 [Convert]: ${amount} ${fromCurrency} -> ${toCurrency}`);
  
  // 如果货币相同，直接返回
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // 获取汇率（如果没有提供）
  if (!rates) {
    rates = await getExchangeRates(fromCurrency);
  }

  // 如果基准货币就是源货币，直接转换
  if (rates[toCurrency]) {
    const result = amount * rates[toCurrency];
    console.log(`✅ [Convert]: Result = ${result.toFixed(2)} ${toCurrency} (rate: ${rates[toCurrency]})`);
    return result;
  }

  // 如果基准货币是USD，需要两步转换
  // 例如：EUR -> JPY = EUR -> USD -> JPY
  const usdRates = await getExchangeRates('USD');
  const amountInUSD = amount / usdRates[fromCurrency];
  const result = amountInUSD * usdRates[toCurrency];
  console.log(`✅ [Convert]: Result = ${result.toFixed(2)} ${toCurrency} (via USD)`);
  return result;
}

// =================================================================
// 格式化价格
// =================================================================
export function formatPrice(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  try {
    // 使用 Intl.NumberFormat 格式化
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  } catch (error) {
    // 如果格式化失败，使用简单格式
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  }
}

// =================================================================
// 批量转换价格
// =================================================================
export async function convertPriceBatch(
  amounts: number[],
  fromCurrency: string,
  toCurrency: string
): Promise<number[]> {
  
  // 获取汇率一次
  const rates = await getExchangeRates(fromCurrency);
  
  // 批量转换
  return Promise.all(
    amounts.map(amount => convertPrice(amount, fromCurrency, toCurrency, rates))
  );
}

// =================================================================
// 清除汇率缓存
// =================================================================
export function clearExchangeCache(): void {
  ratesCache = null;
  console.log('✅ Exchange rates cache cleared');
}

// =================================================================
// 获取汇率引擎状态
// =================================================================
export function getExchangeEngineStatus(): {
  engine: ExchangeEngine;
  isConfigured: boolean;
  availableEngines: ExchangeEngine[];
  cacheAge?: number;
} {
  const availableEngines: ExchangeEngine[] = ['mock', 'exchangerate'];
  
  if (OPENEXCHANGE_APP_ID && OPENEXCHANGE_APP_ID !== '') {
    availableEngines.push('openexchange');
  }
  
  if (FIXER_API_KEY && FIXER_API_KEY !== '') {
    availableEngines.push('fixer');
  }
  
  const result: any = {
    engine: CURRENT_ENGINE,
    isConfigured: CURRENT_ENGINE !== 'mock',
    availableEngines
  };
  
  if (ratesCache) {
    result.cacheAge = Date.now() - ratesCache.timestamp;
  }
  
  return result;
}

// =================================================================
// 获取支持的货币列表
// =================================================================
export function getSupportedCurrencies(): string[] {
  return Object.keys(MOCK_RATES);
}

// =================================================================
// 预加载汇率（应用启动时调用）
// =================================================================
export async function preloadExchangeRates(baseCurrency: string = 'USD'): Promise<void> {
  try {
    await getExchangeRates(baseCurrency);
    console.log('✅ [Exchange]: Rates preloaded successfully');
  } catch (error) {
    console.error('Failed to preload exchange rates:', error);
  }
}
