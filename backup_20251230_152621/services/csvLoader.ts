import { Product, ProductVariant } from '../types';

/**
 * 健壮的 CSV 解析器 (RFC 4180 标准)
 * 解决问题：Shopify 导出的 CSV 中，Description 字段经常包含换行符，
 * 普通的 split('\n') 会导致解析错误。这个解析器能正确处理引号内的换行。
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuote = false;
  
  // 1. 预处理：移除 BOM (Byte Order Mark) 防止首行解析错误
  const cleanText = text.replace(/^\ufeff/, '');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        // 处理双引号转义: "abc""def" -> abc"def
        currentCell += '"';
        i++; // 跳过下一个引号
      } else {
        // 进入或退出引号状态
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      // 单元格结束
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      // 行结束
      // 处理 Windows 风格换行 \r\n
      if (char === '\r' && nextChar === '\n') {
        i++; 
      }
      
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  
  // 处理文件末尾的最后一行
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * 将 CSV 文本解析为 Product 数组
 * 针对 Shopify 导出格式优化
 */
export const parseCSVData = (csvText: string): Product[] => {
    // 1. 解析为二维数组
    const rawRows = parseCSV(csvText);
    if (rawRows.length < 2) return []; // 只有表头或为空

    // 2. 提取表头并标准化 (转小写，去除空格)
    const headers = rawRows[0].map(h => h.trim().toLowerCase());
    
    // 辅助函数：模糊匹配列名，兼容不同版本的 Shopify CSV
    const getIdx = (keywords: string[]) => {
        return headers.findIndex(h => keywords.some(k => h === k.toLowerCase() || h.includes(k.toLowerCase())));
    };

    // Shopify 关键列映射
    const idxHandle = getIdx(['handle']);
    const idxTitle = getIdx(['title']);
    const idxBody = getIdx(['body (html)', 'body', 'description']);
    const idxType = getIdx(['type', 'product type', 'category']);
    const idxTags = getIdx(['tags']);
    const idxPrice = getIdx(['variant price', 'price']);
    const idxSku = getIdx(['variant sku', 'sku']);
    const idxImage = getIdx(['image src', 'image url']);
    
    // Variant 相关列
    const idxOption1Name = getIdx(['option1 name']);
    const idxOption1Value = getIdx(['option1 value']);
    const idxOption2Name = getIdx(['option2 name']);
    const idxOption2Value = getIdx(['option2 value']);
    const idxOption3Name = getIdx(['option3 name']);
    const idxOption3Value = getIdx(['option3 value']);
    const idxVariantImage = getIdx(['variant image']);
    
    if (idxHandle === -1) {
      throw new Error("CSV 格式错误：未找到 'Handle' 列。请使用标准的 Shopify 产品导出文件。");
    }

    const productsMap = new Map<string, Product>();

    // 3. 遍历数据行
    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      // 跳过空行或无效行
      if (!row[idxHandle]) continue;

      const handle = row[idxHandle].trim();
      if (!handle) continue;

      let product = productsMap.get(handle);
      
      const imageSrc = idxImage > -1 ? row[idxImage] : '';

      // === 初始化新商品 (遇到该 Handle 的第一行) ===
      if (!product) {
        // 如果这行没有 Title (通常是变体行)，尝试用 Handle 兜底
        const title = idxTitle > -1 ? row[idxTitle] : '';
        
        // 只有 Handle 没有 Title 的情况处理：
        // 这种情况通常是 CSV 分页导致的，或者是纯变体数据。
        // 我们暂时用 Handle 美化后作为名称。
        const finalName = title || handle.replace(/-/g, ' ').toUpperCase();

        const rawBody = idxBody > -1 ? row[idxBody] : '';
        // 简单的 HTML 清洗，保留段落结构
        const description = rawBody
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>?/gm, '')
            .trim() || "No description available.";
        
        const price = idxPrice > -1 ? parseFloat(row[idxPrice]) : 0;
        const sku = idxSku > -1 ? row[idxSku] : handle.toUpperCase();
        const type = idxType > -1 ? row[idxType] : 'UNCATEGORIZED';
        // 处理 Tags
        const tags = idxTags > -1 ? row[idxTags].split(',').map(t => t.trim()).filter(t => t) : [];

        // 自动分类映射逻辑
        let category = 'VIBES';
        const upperType = type.toUpperCase();
        if (upperType.includes('VIBE')) category = 'VIBES';
        else if (upperType.includes('DILDO')) category = 'DILDOS';
        else if (upperType.includes('ANAL')) category = 'ANAL';
        else if (upperType.includes('MALE')) category = 'MALE';
        else if (upperType.includes('BONDAGE')) category = 'BONDAGE';
        else if (upperType.includes('LINGERIE')) category = 'LINGERIE';
        else if (upperType.includes('LUBE') || upperType.includes('FLUID') || upperType.includes('OIL')) category = 'FLUIDS';
        else if (upperType.includes('TOY')) category = 'VIBES';
        else category = upperType || 'UNCATEGORIZED';
        
        // 读取 Option Names（只在第一行读取）
        const option1Name = idxOption1Name > -1 ? row[idxOption1Name] : '';
        const option2Name = idxOption2Name > -1 ? row[idxOption2Name] : '';
        const option3Name = idxOption3Name > -1 ? row[idxOption3Name] : '';

        product = {
          id: handle, 
          sku: sku,
          name: finalName,
          price: isNaN(price) ? 0 : price,
          category: category,
          images: [],
          description: description,
          features: tags.length > 0 ? tags : ['Imported Asset'],
          specs: { material: 'Silicone/ABS', size: 'Standard', noise: '<50dB', battery: 'USB Rechargeable' },
          stockStatus: 'IN_STOCK',
          option1Name: option1Name || undefined,
          option2Name: option2Name || undefined,
          option3Name: option3Name || undefined,
          variants: []
        };
        productsMap.set(handle, product);
      }

      // === 聚合图片 ===
      // Shopify 导出文件通常会把多张图片放在不同的行，但 Handle 相同
      if (imageSrc && (imageSrc.startsWith('http') || imageSrc.startsWith('//'))) {
        let cleanSrc = imageSrc;
        // 修复 Shopify 只有 // 开头的链接
        if (cleanSrc.startsWith('//')) cleanSrc = `https:${cleanSrc}`;
        
        // 图片去重
        if (!product.images.includes(cleanSrc)) {
            product.images.push(cleanSrc);
        }
      }
      
      // === 收集变体信息 ===
      const option1Value = idxOption1Value > -1 ? row[idxOption1Value] : '';
      const option2Value = idxOption2Value > -1 ? row[idxOption2Value] : '';
      const option3Value = idxOption3Value > -1 ? row[idxOption3Value] : '';
      
      // 如果有任何 Option Value，则创建变体
      if (option1Value || option2Value || option3Value) {
        const variantPrice = idxPrice > -1 ? parseFloat(row[idxPrice]) : product.price;
        const variantSku = idxSku > -1 ? row[idxSku] : `${product.sku}-${option1Value || ''}-${option2Value || ''}`;
        
        // Variant Image (优先使用 Variant Image 列，否则使用 Image Src)
        let variantImage = idxVariantImage > -1 ? row[idxVariantImage] : '';
        if (!variantImage && imageSrc) variantImage = imageSrc;
        if (variantImage && variantImage.startsWith('//')) variantImage = `https:${variantImage}`;
        
        const variant: ProductVariant = {
          id: `${handle}-${option1Value || 'default'}-${option2Value || ''}-${option3Value || ''}`.toLowerCase().replace(/\s+/g, '-'),
          sku: variantSku,
          option1: option1Value || undefined,
          option2: option2Value || undefined,
          option3: option3Value || undefined,
          price: isNaN(variantPrice) ? product.price : variantPrice,
          image: variantImage || undefined,
          stockStatus: 'IN_STOCK'
        };
        
        // 去重检查
        const existingVariant = product.variants?.find(v => v.id === variant.id);
        if (!existingVariant) {
          product.variants?.push(variant);
        }
      }
    }

    return Array.from(productsMap.values());
};

/**
 * 尝试加载 public/products.csv (用于 Demo 初始化)
 */
export const loadProductsFromCSV = async (): Promise<Product[] | null> => {
  try {
    const response = await fetch('/products.csv');
    if (!response.ok) return null;
    const csvText = await response.text();
    return parseCSVData(csvText);
  } catch (error) {
    console.error("[CSV] Failed to load products.csv", error);
    return null;
  }
};
