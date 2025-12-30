/**
 * 翻译服务 - 支持多种翻译API
 * 
 * 支持的API:
 * 1. Google Translate API (推荐)
 * 2. Microsoft Translator (备选)
 * 3. LibreTranslate (免费开源)
 */

// =================================================================
// 【配置区域】
// 在 .env.local 文件中设置：
// VITE_GOOGLE_TRANSLATE_API_KEY=your_api_key
// =================================================================
const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || ''; // 获取地址: https://console.cloud.google.com/
const MICROSOFT_TRANSLATOR_KEY = ''; // 获取地址: https://azure.microsoft.com/
const LIBRETRANSLATE_URL = 'https://libretranslate.de'; // 免费公共实例

// 当前使用的翻译引擎
type TranslationEngine = 'google' | 'microsoft' | 'libretranslate' | 'mock';
const CURRENT_ENGINE: TranslationEngine = 'google'; // 使用Google翻译

// =================================================================
// 语言代码映射
// =================================================================
export const LANGUAGE_CODES = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  RU: 'ru',
  JP: 'ja',
  KR: 'ko',
  PT: 'pt',
  NL: 'nl',
  SV: 'sv',
  AR: 'ar',
  HI: 'hi',
  ID: 'id'
} as const;

// =================================================================
// Mock 翻译数据 (演示模式)
// =================================================================
const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  // 导航和通用
  'TERMINAL': { ja: 'ターミナル', es: 'TERMINAL', fr: 'TERMINAL', de: 'TERMINAL', ru: 'ТЕРМИНАЛ', ko: '터미널' },
  'SHOP': { ja: 'ショップ', es: 'TIENDA', fr: 'BOUTIQUE', de: 'LADEN', ru: 'МАГАЗИН', ko: '상점' },
  'LOOKBOOK': { ja: 'ルックブック', es: 'LOOKBOOK', fr: 'LOOKBOOK', de: 'LOOKBOOK', ru: 'LOOKBOOK', ko: '룩북' },
  'BLOG': { ja: 'ブログ', es: 'BLOG', fr: 'BLOG', de: 'BLOG', ru: 'БЛОГ', ko: '블로그' },
  'CONTACT': { ja: 'お問い合わせ', es: 'CONTACTO', fr: 'CONTACT', de: 'KONTAKT', ru: 'КОНТАКТ', ko: '문의' },
  
  // 分类
  'VIBES': { ja: 'バイブ', es: 'VIBRADORES', fr: 'VIBROMASSEURS', de: 'VIBRATOREN', ru: 'ВИБРАТОРЫ', ko: '바이브레이터' },
  'DILDOS': { ja: 'ディルド', es: 'CONSOLADORES', fr: 'GODES', de: 'DILDOS', ru: 'ФАЛЛОИМИТАТОРЫ', ko: '딜도' },
  'ANAL': { ja: 'アナル', es: 'ANAL', fr: 'ANAL', de: 'ANAL', ru: 'АНАЛЬНЫЕ', ko: '애널' },
  'MALE': { ja: 'メンズ', es: 'MASCULINO', fr: 'HOMME', de: 'MÄNNLICH', ru: 'МУЖСКОЕ', ko: '남성용' },
  'BONDAGE': { ja: 'ボンデージ', es: 'BONDAGE', fr: 'BONDAGE', de: 'BONDAGE', ru: 'БОНДАЖ', ko: '본디지' },
  'LINGERIE': { ja: 'ランジェリー', es: 'LENCERÍA', fr: 'LINGERIE', de: 'DESSOUS', ru: 'БЕЛЬЕ', ko: '란제리' },
  'FLUIDS': { ja: '潤滑剤', es: 'LUBRICANTES', fr: 'LUBRIFIANTS', de: 'GLEITMITTEL', ru: 'СМАЗКИ', ko: '윤활제' },
  
  // 按钮和操作
  'Add to Cart': { ja: 'カートに追加', es: 'Añadir al carrito', fr: 'Ajouter au panier', de: 'In den Warenkorb', ru: 'Добавить в корзину', ko: '장바구니에 담기', pt: 'Adicionar ao carrinho' },
  'Checkout': { ja: 'チェックアウト', es: 'Pagar', fr: 'Commander', de: 'Zur Kasse', ru: 'Оформить заказ', ko: '결제하기', pt: 'Finalizar compra' },
  'Search': { ja: '検索', es: 'Buscar', fr: 'Rechercher', de: 'Suchen', ru: 'Поиск', ko: '검색', pt: 'Pesquisar' },
  'SAVE CONFIG': { ja: '設定を保存', es: 'GUARDAR CONFIG', fr: 'SAUVEGARDER', de: 'SPEICHERN', ru: 'СОХРАНИТЬ', ko: '설정 저장' },
  'CANCEL': { ja: 'キャンセル', es: 'CANCELAR', fr: 'ANNULER', de: 'ABBRECHEN', ru: 'ОТМЕНА', ko: '취소' },
  
  // 商品相关
  'NEW DROP': { ja: '新着', es: 'NUEVO', fr: 'NOUVEAU', de: 'NEU', ru: 'НОВИНКА', ko: '신상품' },
  'New Arrivals': { ja: '新着商品', es: 'Nuevos productos', fr: 'Nouveautés', de: 'Neuheiten', ru: 'Новинки', ko: '신상품', pt: 'Novidades' },
  'Best Sellers': { ja: 'ベストセラー', es: 'Más vendidos', fr: 'Meilleures ventes', de: 'Bestseller', ru: 'Хиты продаж', ko: '베스트셀러' },
  'Price: Low to High': { ja: '価格: 安い順', es: 'Precio: Menor a Mayor', fr: 'Prix: Croissant', de: 'Preis: Aufsteigend', ru: 'Цена: По возрастанию', ko: '가격: 낮은순', pt: 'Preço: Menor ao Maior' },
  'Price: High to Low': { ja: '価格: 高い順', es: 'Precio: Mayor a Menor', fr: 'Prix: Décroissant', de: 'Preis: Absteigend', ru: 'Цена: По убыванию', ko: '가격: 높은순' },
  
  // 设置和系统
  'SYSTEM_SETTINGS': { ja: 'システム設定', es: 'CONFIGURACIÓN', fr: 'PARAMÈTRES', de: 'EINSTELLUNGEN', ru: 'НАСТРОЙКИ', ko: '시스템 설정' },
  'Country / Language': { ja: '国/言語', es: 'País / Idioma', fr: 'Pays / Langue', de: 'Land / Sprache', ru: 'Страна / Язык', ko: '국가 / 언어' },
  'Currency': { ja: '通貨', es: 'Moneda', fr: 'Devise', de: 'Währung', ru: 'Валюта', ko: '통화' },
  
  // 购物车
  'INVENTORY': { ja: 'カート', es: 'INVENTARIO', fr: 'PANIER', de: 'WARENKORB', ru: 'КОРЗИНА', ko: '장바구니' },
  'System Empty': { ja: 'カートは空です', es: 'Sistema vacío', fr: 'Système vide', de: 'System leer', ru: 'Система пуста', ko: '비어있음' },
  'Total Amount': { ja: '合計金額', es: 'Monto Total', fr: 'Montant Total', de: 'Gesamtbetrag', ru: 'Общая сумма', ko: '총 금액' },
  'PROCEED TO CHECKOUT': { ja: 'チェックアウトへ', es: 'PROCEDER AL PAGO', fr: 'PASSER À LA CAISSE', de: 'ZUR KASSE', ru: 'ОФОРМИТЬ ЗАКАЗ', ko: '결제하기' },
  'ADDED TO SYSTEM': { ja: 'カートに追加されました', es: 'AÑADIDO AL SISTEMA', fr: 'AJOUTÉ AU SYSTÈME', de: 'ZUM SYSTEM HINZUGEFÜGT', ru: 'ДОБАВЛЕНО', ko: '시스템에 추가됨' },
};

// =================================================================
// Google Translate API
// =================================================================
async function googleTranslate(text: string, targetLang: string): Promise<string> {
  if (!GOOGLE_TRANSLATE_API_KEY || GOOGLE_TRANSLATE_API_KEY === '') {
    throw new Error('Google Translate API key not configured');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        source: 'en'
      })
    });

    const data = await response.json();
    
    if (data.data && data.data.translations && data.data.translations[0]) {
      return data.data.translations[0].translatedText;
    }
    
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Google Translate Error:', error);
    throw error;
  }
}

// =================================================================
// Microsoft Translator API
// =================================================================
async function microsoftTranslate(text: string, targetLang: string): Promise<string> {
  if (!MICROSOFT_TRANSLATOR_KEY || MICROSOFT_TRANSLATOR_KEY === '') {
    throw new Error('Microsoft Translator key not configured');
  }

  const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': MICROSOFT_TRANSLATOR_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text }])
    });

    const data = await response.json();
    
    if (data[0] && data[0].translations && data[0].translations[0]) {
      return data[0].translations[0].text;
    }
    
    throw new Error('Translation failed');
  } catch (error) {
    console.error('Microsoft Translator Error:', error);
    throw error;
  }
}

// =================================================================
// LibreTranslate API (免费开源)
// =================================================================
async function libreTranslate(text: string, targetLang: string): Promise<string> {
  const url = `${LIBRETRANSLATE_URL}/translate`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text'
      })
    });

    const data = await response.json();
    
    if (data.translatedText) {
      return data.translatedText;
    }
    
    throw new Error('Translation failed');
  } catch (error) {
    console.error('LibreTranslate Error:', error);
    throw error;
  }
}

// =================================================================
// Mock 翻译 (演示模式)
// =================================================================
function mockTranslate(text: string, targetLang: string): string {
  // 检查是否有预定义的翻译
  if (MOCK_TRANSLATIONS[text] && MOCK_TRANSLATIONS[text][targetLang]) {
    return MOCK_TRANSLATIONS[text][targetLang];
  }
  
  // 如果没有预定义翻译，返回原文
  return text;
}

// =================================================================
// 主翻译函数
// =================================================================
export async function translate(
  text: string | string[], 
  targetLangCode: string,
  engine: TranslationEngine = CURRENT_ENGINE
): Promise<string | string[]> {
  
  // 如果目标语言是英语，直接返回原文
  if (targetLangCode === 'en' || targetLangCode === 'EN') {
    return text;
  }

  // 转换为标准语言代码
  const langCode = targetLangCode.toLowerCase();

  // 如果是数组，逐个翻译
  if (Array.isArray(text)) {
    const promises = text.map(t => translate(t, targetLangCode, engine));
    return Promise.all(promises);
  }

  // 单个文本翻译
  try {
    switch (engine) {
      case 'google':
        return await googleTranslate(text, langCode);
      
      case 'microsoft':
        return await microsoftTranslate(text, langCode);
      
      case 'libretranslate':
        return await libreTranslate(text, langCode);
      
      case 'mock':
      default:
        return mockTranslate(text, langCode);
    }
  } catch (error) {
    console.error(`Translation failed for "${text}":`, error);
    // 翻译失败时返回原文
    return text;
  }
}

// =================================================================
// 批量翻译（带缓存）
// =================================================================
const translationCache = new Map<string, string>();

export async function translateBatch(
  texts: string[],
  targetLangCode: string,
  useCache: boolean = true
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const textsToTranslate: string[] = [];
  
  // 检查缓存
  for (const text of texts) {
    const cacheKey = `${text}:${targetLangCode}`;
    
    if (useCache && translationCache.has(cacheKey)) {
      result[text] = translationCache.get(cacheKey)!;
    } else {
      textsToTranslate.push(text);
    }
  }
  
  // 翻译未缓存的文本
  if (textsToTranslate.length > 0) {
    const translations = await translate(textsToTranslate, targetLangCode) as string[];
    
    textsToTranslate.forEach((text, index) => {
      const translation = translations[index];
      result[text] = translation;
      
      // 保存到缓存
      if (useCache) {
        const cacheKey = `${text}:${targetLangCode}`;
        translationCache.set(cacheKey, translation);
      }
    });
  }
  
  return result;
}

// =================================================================
// 清除翻译缓存
// =================================================================
export function clearTranslationCache(): void {
  translationCache.clear();
  console.log('✅ Translation cache cleared');
}

// =================================================================
// 获取当前翻译引擎状态
// =================================================================
export function getTranslationEngineStatus(): {
  engine: TranslationEngine;
  isConfigured: boolean;
  availableEngines: TranslationEngine[];
} {
  const availableEngines: TranslationEngine[] = ['mock'];
  
  if (GOOGLE_TRANSLATE_API_KEY && GOOGLE_TRANSLATE_API_KEY !== '') {
    availableEngines.push('google');
  }
  
  if (MICROSOFT_TRANSLATOR_KEY && MICROSOFT_TRANSLATOR_KEY !== '') {
    availableEngines.push('microsoft');
  }
  
  availableEngines.push('libretranslate'); // 总是可用
  
  return {
    engine: CURRENT_ENGINE,
    isConfigured: CURRENT_ENGINE !== 'mock',
    availableEngines
  };
}
