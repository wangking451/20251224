import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, FileText, AlertTriangle, Cloud } from 'lucide-react';
import { Product } from '../types';
import { sanitizeInput } from '../utils/auth';

// Cloudinary 配置（从环境变量读取�?
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

interface CSVImporterProps {
  onImport: (products: Product[]) => void;
  onClear: () => void;
  onClose: () => void;
}

const CSVImporter: React.FC<CSVImporterProps> = ({ onImport, onClose }) => {
  const [isParsing, setIsParsing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadToCloudinary, setUploadToCloudinary] = useState(true); // 默认启用上传�?Cloudinary
  const [uploadProgress, setUploadProgress] = useState<string>(''); // 上传进度
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  /**
   * 上传图片�?Cloudinary
   * @param imageUrl 原始图片 URL
   * @returns Cloudinary URL
   */
  const uploadImageToCloudinary = async (imageUrl: string): Promise<string> => {
    try {
      // 调试日志
      console.log('🔍 Cloudinary Config:', {
        cloudName: CLOUDINARY_CLOUD_NAME,
        preset: CLOUDINARY_UPLOAD_PRESET,
        imageUrl
      });

      addLog(`📤 上传图片�?Cloudinary: ${imageUrl.substring(0, 50)}...`);

      // 构建 Cloudinary Upload API URL
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      // 创建 FormData
      const formData = new FormData();
      formData.append('file', imageUrl); // Cloudinary 支持直接�?URL
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'products'); // 保存�?products 文件�?

      // 发送上传请�?
      console.log('📡 Uploading to:', cloudinaryUrl);
      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('�?Upload error:', errorData);
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const cloudinaryImageUrl = data.secure_url;

      console.log('�?Upload success:', cloudinaryImageUrl);
      addLog(`�?图片上传成功: ${cloudinaryImageUrl.substring(0, 50)}...`);
      return cloudinaryImageUrl;
    } catch (error: any) {
      console.error('�?Upload error caught:', error);
      addLog(`�?图片上传失败: ${error.message}`);
      // 上传失败时返回原�?URL
      return imageUrl;
    }
  };

  /**
   * 批量上传图片�?Cloudinary
   * @param imageUrls 图片 URL 数组
   * @returns Cloudinary URL 数组
   */
  const uploadImagesToCloudinary = async (imageUrls: string[]): Promise<string[]> => {
    console.log('🔍 uploadImagesToCloudinary called with:', { 
      uploadToCloudinary, 
      imageCount: imageUrls.length,
      images: imageUrls 
    });
    
    if (!uploadToCloudinary || imageUrls.length === 0) {
      console.log('⚠️ Skipping upload:', { uploadToCloudinary, imageCount: imageUrls.length });
      return imageUrls;
    }

    addLog(`🌐 开始批量上�?${imageUrls.length} 张图片到 Cloudinary...`);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      setUploadProgress(`上传进度: ${i + 1}/${imageUrls.length}`);
      const cloudinaryUrl = await uploadImageToCloudinary(url);
      uploadedUrls.push(cloudinaryUrl);
      
      // 添加延迟避免 Cloudinary API 限流
      if (i < imageUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 每次上传间隔 500ms
      }
    }

    setUploadProgress('');
    addLog(`�?批量上传完成，成功上�?${uploadedUrls.length} 张图片`);
    return uploadedUrls;
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || "";
    } catch (e) {
      return html;
    }
  };

  // 从描述中提取特性（尝试识别列表项）
  const extractFeatures = (description: string): string[] => {
    if (!description) return [];
    
    // 尝试匹配各种列表格式
    const features: string[] = [];
    
    // 匹配 "- Item" �?"\u2022 Item" �?"* Item" 格式
    const bulletRegex = /^[\s]*[-�?]\s*(.+)$/gm;
    let match;
    while ((match = bulletRegex.exec(description)) !== null) {
      const feature = match[1].trim();
      if (feature.length > 10 && feature.length < 200) { // 过滤过短或过长的
        features.push(feature);
      }
    }
    
    // 如果没有找到列表，尝试按段落分割（最�?个）
    if (features.length === 0) {
      const paragraphs = description.split('\n').filter(p => p.trim().length > 20);
      return paragraphs.slice(0, 3);
    }
    
    return features.slice(0, 8); // 最�?个特�?
  };

  /**
   * 核心解析算法：处理引号内的逗号、引号内的换行符以及双引号转�?
   */
  const parseFullCSV = (csvText: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; 
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const processCatalog = async (csvData: string[][]) => {
    try {
      if (csvData.length < 2) throw new Error("CSV 文件缺少有效数据行");

      const rawHeaders = csvData[0];
      const headers = rawHeaders.map(h => h.toLowerCase().trim());
      
      addLog(`结构分析: 识别到${headers.length} 列数据。`);

      // 映射 Shopify 常用表头
      const colMap = {
        handle: headers.indexOf('handle'),
        title: headers.indexOf('title'),
        body: headers.findIndex(h => h.includes('body (html)') || h === 'body'),
        price: headers.findIndex(h => h === 'variant price' || h.includes('price')),
        image: headers.findIndex(h => h === 'image src' || h === 'image url' || h === 'image'),
      };

      if (colMap.handle === -1) throw new Error("CSV 缺少 'Handle' 列，无法进行商品聚合");

      const productsMap = new Map<string, Product>();

      for (let i = 1; i < csvData.length; i++) {
        const row = csvData[i];
        const getVal = (idx: number) => (idx === -1 || idx >= row.length) ? "" : (row[idx] || "").toString();

        const handle = getVal(colMap.handle);
        const title = getVal(colMap.title);
        const body = getVal(colMap.body);
        const priceRaw = getVal(colMap.price);
        const imageSrc = getVal(colMap.image);

        if (!handle) continue;

        if (title) {
          // 如果有标题，代表是一个新商品的起始行
          let cleanPrice = "0.00";
          if (priceRaw) {
            const priceMatch = priceRaw.match(/[\d.]+/);
            if (priceMatch) cleanPrice = priceMatch[0];
          }

          const cleanDescription = stripHtml(body);
          const extractedFeatures = extractFeatures(cleanDescription);

          const product: Product = {
            id: `imported-${Date.now()}-${i}`,
            sku: sanitizeInput(handle || `SKU-${Date.now()}-${i}`),
            name: sanitizeInput(title),
            price: parseFloat(cleanPrice) || 0,
            category: "IMPORTED",
            images: (imageSrc && imageSrc.startsWith('http')) ? [imageSrc] : [],
            description: sanitizeInput(cleanDescription),
            features: extractedFeatures.map(f => sanitizeInput(f)),
            specs: {
              material: "N/A",
              size: "N/A",
              noise: "N/A",
              battery: "N/A"
            },
            stock_status: 'IN_STOCK'
          };
          
          productsMap.set(handle, product);
        } else if (productsMap.has(handle)) {
          // 如果没有标题，Handle 已存在，则是该商品的附加图片或变体行
          const existing = productsMap.get(handle)!;
          
          if (imageSrc && imageSrc.startsWith('http')) {
            // 添加到画廊（去重）?
            if (!existing.images.includes(imageSrc)) {
              existing.images.push(imageSrc);
            }
          }
          
          // 如果主行没价格，尝试从变体行补充
          if (priceRaw && (existing.price === 0 || !existing.price)) {
            const priceMatch = priceRaw.match(/[\d.]+/);
            if (priceMatch) existing.price = parseFloat(priceMatch[0]) || 0;
          }
        }
      }

      // 最终处理：如果没图，给个占位图
      let finalProducts = Array.from(productsMap.values()).map(p => ({
        ...p,
        images: p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=800']
      }));

      if (finalProducts.length === 0) throw new Error("未能从文件中提取出任何有效商品");
      
      // 如果启用了 Cloudinary 上传，批量上传所有图片?
      console.log('🔍 Checking Cloudinary upload:', { 
        uploadToCloudinary, 
        productCount: finalProducts.length 
      });
      
      if (uploadToCloudinary) {
        addLog(`🔄 准备上传所有产品图片到 Cloudinary...`);
        
        finalProducts = await Promise.all(
          finalProducts.map(async (product) => {
            const uploadedImages = await uploadImagesToCloudinary(product.images);
            return {
              ...product,
              images: uploadedImages,
            };
          })
        );
        
        addLog(`✅ 所有产品图片已上传到 Cloudinary`);
      }
      
      return finalProducts;
    } catch (err: any) {
      console.error("Processing error:", err);
      throw err;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setLogs([]);
    addLog(`目标载荷: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTimeout(async () => {
        try {
          addLog("正在解析复杂 CSV 协议...");
          const csvData = parseFullCSV(text);
          addLog("正在基于 Handle 字段进行多图聚合...");
          const products = await processCatalog(csvData); // 改为 await
          addLog(`同步成功: 已处理${products.length} 个独立资产。`);
          onImport(products);
          setIsParsing(false);
        } catch (err: any) {
          setError(err.message || "数据流解析故障");
          setIsParsing(false);
          addLog("任务终止");
        }
      }, 300);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#22d3ee]/10 rounded-lg text-[#22d3ee]">
              <FileText size={18} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Inventory_Data_Injection</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {/* Cloudinary 上传开关 */}
          <div className="mb-6 flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <Cloud className="text-[#22d3ee]" size={18} />
              <div>
                <p className="text-xs font-bold text-white">上传到 Cloudinary 图床</p>
                <p className="text-[10px] text-slate-500 mt-0.5">将产品图片自动上传到 Cloudinary 云存储</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={uploadToCloudinary}
                onChange={(e) => setUploadToCloudinary(e.target.checked)}
                className="sr-only peer"
                disabled={isParsing}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22d3ee]"></div>
            </label>
          </div>

          {uploadProgress && (
            <div className="mb-4 p-3 bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-lg">
              <p className="text-xs text-[#22d3ee] font-bold">{uploadProgress}</p>
            </div>
          )}

          <button 
            disabled={isParsing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-44 border-2 border-dashed border-white/5 hover:border-[#22d3ee]/40 rounded-2xl flex flex-col items-center justify-center transition-all bg-white/[0.01] group"
          >
            {isParsing ? (
              <Loader2 className="mb-4 text-[#22d3ee] animate-spin" size={32} />
            ) : (
              <Upload className="mb-4 text-slate-700 group-hover:text-[#22d3ee] transition-colors" size={32} />
            )}
            <p className="text-sm font-bold text-slate-300">DEPLOY_SOURCE_FILE</p>
            <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest italic">Shopify CSV 专供格式</p>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </button>

          <div className="mt-8 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Sync_Terminal</span>
            <div className="bg-black border border-white/5 p-4 h-40 overflow-y-auto font-mono text-[10px] leading-relaxed custom-scrollbar shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 text-slate-400 mb-1">
                  <span className="text-[#22d3ee]/20">{'>>>'}</span>
                  <span>{log}</span>
                </div>
              ))}
              {error && (
                <div className="flex items-start gap-2 text-red-500 mt-4 p-3 bg-red-500/5 rounded border border-red-500/10">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="font-sans font-bold text-[10px] uppercase tracking-wide">{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button onClick={onClose} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Abort</button>
            <button 
              disabled={isParsing || logs.length === 0 || !!error}
              onClick={onClose}
              className="px-10 py-2.5 bg-[#22d3ee] text-[#0a0a0a] font-black uppercase text-[10px] tracking-widest rounded hover:brightness-110 disabled:opacity-20 transition-all shadow-lg shadow-[#22d3ee]/20"
            >
              Confirm_Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImporter;
