// 货币转换工具函数

const EXCHANGE_RATE_API_KEY = (import.meta as any).env?.VITE_EXCHANGE_RATE_API_KEY || '';
const EXCHANGE_RATE_API_URL = (import.meta as any).env?.VITE_EXCHANGE_RATE_API_URL || 'https://v6.exchangerate-api.com/v6';

// 汇率缓存
interface ExchangeRateCache {
  rates: Record<string, number>;
  baseCurrency: string;
  timestamp: number;
}

let rateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 3600000; // 1小时缓存

/**
 * 获取汇率数据
 * @param baseCurrency 基础货币代码 (USD, EUR, CNY, JPY, etc.)
 */
export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  // 检查缓存
  if (rateCache && 
      rateCache.baseCurrency === baseCurrency && 
      Date.now() - rateCache.timestamp < CACHE_DURATION) {
    return rateCache.rates;
  }

  try {
    if (!EXCHANGE_RATE_API_KEY) {
      console.warn('Exchange rate API key not configured, using fallback rates');
      return getFallbackRates(baseCurrency);
    }

    const response = await fetch(`${EXCHANGE_RATE_API_URL}/${EXCHANGE_RATE_API_KEY}/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates');
    }

    // 缓存汇率数据
    rateCache = {
      rates: data.conversion_rates,
      baseCurrency,
      timestamp: Date.now()
    };

    return data.conversion_rates;
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return getFallbackRates(baseCurrency);
  }
}

/**
 * 转换货币
 * @param amount 金额
 * @param fromCurrency 源货币代码
 * @param toCurrency 目标货币代码
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const rates = await getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      console.warn(`Exchange rate not found for ${toCurrency}`);
      return amount;
    }

    return amount * rate;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount;
  }
}

/**
 * 格式化货币显示
 */
export function formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;
  }
}

/**
 * 获取货币符号
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'KRW': '₩',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'Fr',
    'HKD': 'HK$',
    'SGD': 'S$',
  };
  return symbols[currency] || currency;
}

/**
 * 备用汇率（当API不可用时）
 * 注意：这些是示例汇率，实际应用中应定期更新
 */
function getFallbackRates(baseCurrency: string): Record<string, number> {
  const usdRates: Record<string, number> = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'JPY': 149.50,
    'CNY': 7.24,
    'KRW': 1318.50,
    'AUD': 1.52,
    'CAD': 1.36,
    'CHF': 0.88,
    'HKD': 7.83,
    'SGD': 1.34,
  };

  if (baseCurrency === 'USD') {
    return usdRates;
  }

  // 简单转换到其他基础货币
  const baseRate = usdRates[baseCurrency] || 1;
  const convertedRates: Record<string, number> = {};
  
  for (const [currency, rate] of Object.entries(usdRates)) {
    convertedRates[currency] = rate / baseRate;
  }

  return convertedRates;
}

// 支持的货币列表
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code'];
