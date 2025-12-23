// 翻译工具函数

const TRANSLATE_API_URL = (import.meta as any).env?.VITE_TRANSLATE_API_URL || 'https://libretranslate.com/translate';
const TRANSLATE_API_KEY = (import.meta as any).env?.VITE_TRANSLATE_API_KEY || '';

// 翻译缓存
const translationCache = new Map<string, string>();

/**
 * 使用 LibreTranslate API 进行翻译
 * @param text 要翻译的文本
 * @param targetLang 目标语言代码 (en, zh, ja, es, fr, de, etc.)
 * @param sourceLang 源语言代码，默认自动检测
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  if (!text) return text;

  // 检查缓存
  const cacheKey = `${text}_${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const requestBody: any = {
      q: text,
      target: targetLang,
      format: 'text'
    };

    // 如果不是自动检测，添加源语言
    if (sourceLang !== 'auto') {
      requestBody.source = sourceLang;
    }

    // 如果有 API Key，添加到请求中
    if (TRANSLATE_API_KEY) {
      requestBody.api_key = TRANSLATE_API_KEY;
    }

    const response = await fetch(TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.translatedText || text;

    // 缓存翻译结果
    translationCache.set(cacheKey, translatedText);

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    // 翻译失败时返回原文
    return text;
  }
}

/**
 * 批量翻译文本
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string[]> {
  const promises = texts.map(text => translateText(text, targetLang, sourceLang));
  return Promise.all(promises);
}

/**
 * 翻译对象中的所有文本字段
 */
export async function translateObject<T extends Record<string, any>>(
  obj: T,
  targetLang: string,
  fieldsToTranslate: (keyof T)[]
): Promise<T> {
  const translated = { ...obj };

  for (const field of fieldsToTranslate) {
    if (typeof obj[field] === 'string') {
      (translated[field] as any) = await translateText(obj[field] as string, targetLang);
    }
  }

  return translated;
}

// 语言代码映射
export const LANGUAGE_CODES = {
  'ENGLISH': 'en',
  '中文': 'zh',
  '日本語': 'ja',
  'Español': 'es',
  'Français': 'fr',
  'Deutsch': 'de',
  '한국어': 'ko',
} as const;

export type LanguageCode = typeof LANGUAGE_CODES[keyof typeof LANGUAGE_CODES];
