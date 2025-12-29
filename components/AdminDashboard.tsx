import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Package, Palette, Settings, Upload, Plus, Trash2, Save, 
  Image as ImageIcon, X, ChevronRight, LogOut, Download, AlertTriangle, CheckCircle,
  Search, Video, Layers, List, Tag, Edit3, FileSpreadsheet, RefreshCw, FileText, Globe,
  Shield, Info, Image, CreditCard, AlertCircle, ShoppingBag, Truck, Eye, DollarSign
} from 'lucide-react';
import { Product, StoreConfig, HeroSlide, CustomPage, BundleOffer, Order } from '../types';
import { parseCSVData } from '../services/csvLoader';
import CSVImporter from './CSVImporter';
import OrdersManager from './OrdersManager';
import { productsAPI, ordersAPI } from '../services/supabase';

interface AdminDashboardProps {
  products: Product[];
  config: StoreConfig;
  onUpdateProducts: (p: Product[]) => void;
  onUpdateConfig: (c: StoreConfig) => void;
  onExit: () => void;
}

// 图片处理：压缩并转 Base64
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img') as HTMLImageElement;
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 800; 
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
           if (w > h) { h = Math.round(h * (maxDim/w)); w = maxDim; }
           else { w = Math.round(w * (maxDim/h)); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
    reader.readAsDataURL(file);
  });
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all border-l-2 ${active ? 'bg-neon-purple/20 border-neon-purple text-white' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
  >
    {icon} {label}
  </button>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ products, config, onUpdateProducts, onUpdateConfig, onExit }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PRODUCTS' | 'DESIGN' | 'PAGES' | 'BUNDLES' | 'ORDERS' | 'SETTINGS'>('OVERVIEW');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [editingBundle, setEditingBundle] = useState<BundleOffer | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [importStatus, setImportStatus] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [showCSVImporter, setShowCSVImporter] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // 加载订单数据
  useEffect(() => {
    if (activeTab === 'ORDERS') {
      loadOrders();
    }
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      const data = await ordersAPI.getAll();
      setOrders(data);
    } catch (error: any) {
      console.error('Load orders error:', error);
      setImportStatus({ msg: `加载订单失败: ${error.message}`, type: 'error' });
    }
  };

  // --- Handlers ---
  const handleImageUpload = async (file: File, callback: (base64: string) => void) => {
    setUploading(true);
    try {
      const base64 = await processImageFile(file);
      callback(base64);
    } catch (e) {
      alert("图片处理失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleProductSave = async (p: Product) => {
    try {
      if (products.find(existing => existing.id === p.id)) {
        await productsAPI.update(p.id, p);
        onUpdateProducts(products.map(ex => ex.id === p.id ? p : ex));
        setImportStatus({ msg: '商品更新成功', type: 'success' });
      } else {
        await productsAPI.create(p);
        onUpdateProducts([...products, p]);
        setImportStatus({ msg: '商品创建成功', type: 'success' });
      }
      setEditingProduct(null);
    } catch (error: any) {
      console.error('Save product error:', error);
      setImportStatus({ msg: `保存失败: ${error.message}`, type: 'error' });
    }
  };

  const handlePageSave = (page: CustomPage) => {
    const currentPages = config.customPages || [];
    if (currentPages.find(p => p.id === page.id)) {
      onUpdateConfig({...config, customPages: currentPages.map(p => p.id === page.id ? page : p)});
    } else {
      onUpdateConfig({...config, customPages: [...currentPages, page]});
    }
    setEditingPage(null);
  };

  const handleBundleSave = (bundle: BundleOffer) => {
    // 自动计算并设置 originalTotalPrice 和 discountPercent
    const mainProduct = products.find(p => p.id === bundle.mainProductId);
    const bundleProduct = products.find(p => p.id === bundle.bundleProductId);
    
    if (mainProduct && bundleProduct) {
      const originalTotal = mainProduct.price + bundleProduct.price;
      const discount = bundle.bundlePrice > 0 ? ((originalTotal - bundle.bundlePrice) / originalTotal * 100) : 0;
      
      // 更新 bundle 对象，确保包含正确的计算值
      bundle.originalTotalPrice = originalTotal;
      bundle.discountPercent = discount;
    }
    
    const currentBundles = config.bundleOffers || [];
    if (currentBundles.find(b => b.id === bundle.id)) {
      onUpdateConfig({...config, bundleOffers: currentBundles.map(b => b.id === bundle.id ? bundle : b)});
    } else {
      onUpdateConfig({...config, bundleOffers: [...currentBundles, bundle]});
    }
    setEditingBundle(null);
  };

  // CSV 导入处理：使用 CSVImporter 组件 + Supabase持久化
  const handleCSVImport = async (parsedProducts: Product[]) => {
    if (parsedProducts.length === 0) {
      setImportStatus({ msg: '解析失败：未找到有效商品。请检查 CSV 是否包含 "Handle" 列。', type: 'error' });
      return;
    }

    const confirmMsg = `解析成功！共找到 ${parsedProducts.length} 个商品。\n\n点击 [确定] 覆盖现有库存。\n点击 [取消] 追加到现有库存。`;
    
    try {
      if (window.confirm(confirmMsg)) {
        // 覆盖模式：先删除所有旧数据
        setImportStatus({ msg: '正在删除旧数据...', type: 'info' });
        if (products.length > 0) {
          await productsAPI.bulkDelete(products.map(p => p.id));
        }
        
        // 批量创建新商品
        setImportStatus({ msg: `正在上传 ${parsedProducts.length} 个商品...`, type: 'info' });
        for (const product of parsedProducts) {
          await productsAPI.create(product);
        }
        
        onUpdateProducts(parsedProducts);
        setImportStatus({ msg: `成功覆盖导入 ${parsedProducts.length} 个商品。`, type: 'success' });
      } else {
        // 追加模式
        setImportStatus({ msg: `正在追加 ${parsedProducts.length} 个商品...`, type: 'info' });
        const currentMap = new Map(products.map(p => [p.id, p]));
        
        for (const product of parsedProducts) {
          if (currentMap.has(product.id)) {
            // 更新现有
            await productsAPI.update(product.id, product);
          } else {
            // 创建新的
            await productsAPI.create(product);
          }
          currentMap.set(product.id, product);
        }
        
        onUpdateProducts(Array.from(currentMap.values()));
        setImportStatus({ msg: `成功追加导入。当前总库存: ${currentMap.size}。`, type: 'success' });
      }
    } catch (error: any) {
      console.error('CSV import error:', error);
      setImportStatus({ msg: `导入失败: ${error.message}`, type: 'error' });
    }
    
    setShowCSVImporter(false);
  };

  // CSV 上传处理函数
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ msg: '正在解析文件...', type: 'info' });

    const reader = new FileReader();
    reader.onload = (evt) => {
       try {
         const csvContent = evt.target?.result as string;
         // 调用 csvLoader 中健壮的解析函数
         const parsedProducts = parseCSVData(csvContent);
         
         if (parsedProducts.length === 0) {
            setImportStatus({ msg: '解析失败：未找到有效商品。请检查 CSV 是否包含 "Handle" 列。', type: 'error' });
            return;
         }

         const confirmMsg = `解析成功！共找到 ${parsedProducts.length} 个商品。\n\n点击 [确定] 覆盖现有库存。\n点击 [取消] 追加到现有库存。`;
         
         if (window.confirm(confirmMsg)) {
             // 覆盖模式
             onUpdateProducts(parsedProducts);
             setImportStatus({ msg: `成功覆盖导入 ${parsedProducts.length} 个商品。`, type: 'success' });
         } else {
             // 追加模式 (根据 ID 去重)
             const currentMap = new Map(products.map(p => [p.id, p]));
             parsedProducts.forEach(p => currentMap.set(p.id, p));
             onUpdateProducts(Array.from(currentMap.values()));
             setImportStatus({ msg: `成功追加导入。当前总库存: ${currentMap.size}。`, type: 'success' });
         }
       } catch (error: any) {
         console.error("CSV Import Error:", error);
         setImportStatus({ msg: `文件解析发生错误: ${error.message || '未知错误'}`, type: 'error' });
       }
    };
    reader.onerror = () => {
        setImportStatus({ msg: '文件读取失败。', type: 'error' });
    };
    reader.readAsText(file);
    // 清空 input 允许重复上传同一文件
    e.target.value = ''; 
  };

  // --- 子组件：页面编辑器 ---
  const PageEditor = () => {
    if (!editingPage) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-synth-panel border border-neon-cyan w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,249,255,0.1)] rounded-lg">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
            <h2 className="font-display text-xl text-white font-bold flex items-center gap-2">
              <FileText size={20} className="text-neon-cyan"/> 编辑页面 // <span className="text-gray-400 text-sm font-mono">{editingPage.slug}</span>
            </h2>
            <button onClick={() => setEditingPage(null)}><X className="text-gray-400 hover:text-white" /></button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-black/20">
            <div className="space-y-6 max-w-3xl animate-fade-in">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neon-cyan font-bold mb-1">页面标题</label>
                  <input 
                    className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none" 
                    value={editingPage.title} 
                    onChange={e => setEditingPage({...editingPage, title: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs text-neon-cyan font-bold mb-1">URL路径 (slug)</label>
                  <input 
                    className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none font-mono text-sm" 
                    placeholder="about-us" 
                    value={editingPage.slug} 
                    onChange={e => setEditingPage({...editingPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                  />
                  <div className="text-[10px] text-gray-500 mt-1">只能包含小写字母、数字和连字符</div>
                </div>
              </div>

              {/* 设置选项 */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4" 
                    checked={editingPage.isPublished} 
                    onChange={e => setEditingPage({...editingPage, isPublished: e.target.checked})} 
                  />
                  <span className="text-sm text-white">发布页面（对用户可见）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4" 
                    checked={editingPage.showInFooter} 
                    onChange={e => setEditingPage({...editingPage, showInFooter: e.target.checked})} 
                  />
                  <span className="text-sm text-white">在页脚导航显示</span>
                </label>
              </div>

              {/* 内容编辑器 */}
              <div className="h-96">
                <label className="block text-xs text-neon-cyan font-bold mb-2">页面内容 (支持纯文本和HTML)</label>
                <textarea 
                  className="w-full h-full bg-black border border-white/20 p-4 text-white focus:border-neon-pink outline-none leading-relaxed font-mono text-sm" 
                  value={editingPage.content} 
                  onChange={e => setEditingPage({...editingPage, content: e.target.value})} 
                  placeholder="输入页面内容...\n\n支持HTML标签，例如：\n<h2>标题</h2>\n<p>段落文字</p>\n<ul><li>列表项</li></ul>"
                />
              </div>

              {/* 预览提示 */}
              <div className="bg-white/5 border border-white/10 p-4 rounded">
                <p className="text-xs text-gray-400">
                  <strong className="text-white">提示：</strong> 保存后可以在前台访问：/page/{editingPage.slug}
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex justify-end gap-4 bg-black/50">
            <button onClick={() => setEditingPage(null)} className="px-6 py-2 text-gray-400 hover:text-white font-bold">取消</button>
            <button onClick={() => {
              const updated = {...editingPage, updatedAt: new Date().toISOString()};
              handlePageSave(updated);
            }} className="px-8 py-2 bg-neon-purple hover:bg-neon-pink text-white font-bold flex items-center gap-2 clip-path-polygon shadow-lg shadow-neon-purple/20">
              <Save size={16}/> 保存更改
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- 子组件：商品组合编辑器 ---
  const BundleEditor = () => {
    if (!editingBundle) return null;

    // 自动计算总价和折扣
    const calculatePrices = () => {
      const mainProduct = products.find(p => p.id === editingBundle.mainProductId);
      const bundleProduct = products.find(p => p.id === editingBundle.bundleProductId);
      
      if (mainProduct && bundleProduct) {
        const total = mainProduct.price + bundleProduct.price;
        const discount = editingBundle.bundlePrice > 0 ? ((total - editingBundle.bundlePrice) / total * 100) : 0;
        return {
          originalTotal: total,
          discount: discount.toFixed(1),
          savings: (total - editingBundle.bundlePrice).toFixed(2)
        };
      }
      return { originalTotal: 0, discount: 0, savings: 0 };
    };

    const prices = calculatePrices();

    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-synth-panel border border-neon-yellow w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(255,215,0,0.1)] rounded-lg">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
            <h2 className="font-display text-xl text-white font-bold flex items-center gap-2">
              <Tag size={20} className="text-neon-yellow"/> 编辑商品组合
            </h2>
            <button onClick={() => setEditingBundle(null)}><X className="text-gray-400 hover:text-white" /></button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-black/20">
            <div className="space-y-6 max-w-3xl animate-fade-in">
              {/* 组合标题 */}
              <div>
                <label className="block text-xs text-neon-yellow font-bold mb-1">组合标题</label>
                <input 
                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-yellow outline-none" 
                  placeholder="BUNDLE DEAL - SAVE 20%" 
                  value={editingBundle.bundleTitle} 
                  onChange={e => setEditingBundle({...editingBundle, bundleTitle: e.target.value})} 
                />
              </div>

              {/* 主商品 */}
              <div>
                <label className="block text-xs text-neon-yellow font-bold mb-1">主商品</label>
                <select 
                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-yellow outline-none"
                  value={editingBundle.mainProductId}
                  onChange={e => setEditingBundle({...editingBundle, mainProductId: e.target.value})}
                >
                  <option value="">选择主商品...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                  ))}
                </select>
                <div className="text-[10px] text-gray-500 mt-1">用户购买该商品时显示组合优惠</div>
              </div>

              {/* 组合商品 */}
              <div>
                <label className="block text-xs text-neon-yellow font-bold mb-1">组合商品（一起购买）</label>
                <select 
                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-yellow outline-none"
                  value={editingBundle.bundleProductId}
                  onChange={e => {
                    const product = products.find(p => p.id === e.target.value);
                    setEditingBundle({
                      ...editingBundle, 
                      bundleProductId: e.target.value,
                      bundleProductName: product?.name,
                      bundleProductImage: product?.images[0]
                    });
                  }}
                >
                  <option value="">选择组合商品...</option>
                  {products.filter(p => p.id !== editingBundle.mainProductId).map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ${p.price}</option>
                  ))}
                </select>
                <div className="text-[10px] text-gray-500 mt-1">与主商品一起购买的商品</div>
              </div>

              {/* 价格设置 */}
              {editingBundle.mainProductId && editingBundle.bundleProductId && (
                <div className="bg-black/30 border border-white/10 p-6 rounded space-y-4">
                  <h4 className="text-sm text-white font-bold mb-3">价格设置</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">原始总价</label>
                      <div className="bg-black/50 border border-white/10 p-3 text-gray-400">
                        ${prices.originalTotal.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">组合优惠价 ($)</label>
                      <input 
                        type="number"
                        step="0.01"
                        className="w-full bg-black border border-white/10 p-3 text-white" 
                        value={editingBundle.bundlePrice}
                        onChange={e => setEditingBundle({...editingBundle, bundlePrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  {/* 价格预览 */}
                  <div className="bg-neon-yellow/10 border border-neon-yellow/30 p-4 rounded">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-[10px] text-gray-400 mb-1">折扣比例</div>
                        <div className="text-neon-yellow font-bold text-lg">{prices.discount}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-1">节省金额</div>
                        <div className="text-neon-yellow font-bold text-lg">${prices.savings}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-1">最终价格</div>
                        <div className="text-white font-bold text-lg">${editingBundle.bundlePrice.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 启用状态 */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4" 
                    checked={editingBundle.isActive} 
                    onChange={e => setEditingBundle({...editingBundle, isActive: e.target.checked})} 
                  />
                  <span className="text-sm text-white">启用该组合（在前台显示）</span>
                </label>
              </div>

              {/* 预览提示 */}
              <div className="bg-neon-yellow/10 border border-neon-yellow/30 p-4 rounded">
                <p className="text-xs text-gray-300">
                  <strong className="text-white">提示：</strong> 保存后，该组合会在主商品的详情页显示。用户购买主商品时，可以以优惠价加购组合商品。
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex justify-end gap-4 bg-black/50">
            <button onClick={() => setEditingBundle(null)} className="px-6 py-2 text-gray-400 hover:text-white font-bold">取消</button>
            <button onClick={() => {
              if (!editingBundle.mainProductId || !editingBundle.bundleProductId) {
                alert('请选择主商品和组合商品');
                return;
              }
              const updated = {...editingBundle, updatedAt: new Date().toISOString()};
              handleBundleSave(updated);
            }} className="px-8 py-2 bg-neon-yellow hover:bg-neon-pink text-black font-bold flex items-center gap-2 clip-path-polygon shadow-lg shadow-neon-yellow/20">
              <Save size={16}/> 保存更改
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- 子组件：商品编辑器 ---
  const ProductEditor = () => {
    const [editorTab, setEditorTab] = useState<'BASIC' | 'MEDIA' | 'SPECS' | 'DESC'>('BASIC');
    if (!editingProduct) return null;

    const updateSpec = (key: keyof typeof editingProduct.specs, val: string) => {
      setEditingProduct({
        ...editingProduct, 
        specs: { ...editingProduct.specs, [key]: val }
      });
    };

    const addFeature = () => {
      const f = prompt("输入新标签/卖点:");
      if (f) setEditingProduct({...editingProduct, features: [...editingProduct.features, f]});
    };
    const removeFeature = (idx: number) => {
      setEditingProduct({...editingProduct, features: editingProduct.features.filter((_, i) => i !== idx)});
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-synth-panel border border-neon-cyan w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,249,255,0.1)] rounded-lg">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
            <h2 className="font-display text-xl text-white font-bold flex items-center gap-2">
              <Edit3 size={20} className="text-neon-cyan"/> 编辑商品 // <span className="text-gray-400 text-sm font-mono">{editingProduct.id}</span>
            </h2>
            <button onClick={() => setEditingProduct(null)}><X className="text-gray-400 hover:text-white" /></button>
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left Tabs */}
            <div className="w-48 bg-black/30 border-r border-white/10 flex flex-col pt-4">
               <button onClick={()=>setEditorTab('BASIC')} className={`text-left px-6 py-3 text-sm font-bold ${editorTab === 'BASIC' ? 'text-neon-pink bg-white/5 border-l-2 border-neon-pink' : 'text-gray-400 hover:text-white'}`}>基本信息</button>
               <button onClick={()=>setEditorTab('MEDIA')} className={`text-left px-6 py-3 text-sm font-bold ${editorTab === 'MEDIA' ? 'text-neon-pink bg-white/5 border-l-2 border-neon-pink' : 'text-gray-400 hover:text-white'}`}>图片与视频</button>
               <button onClick={()=>setEditorTab('SPECS')} className={`text-left px-6 py-3 text-sm font-bold ${editorTab === 'SPECS' ? 'text-neon-pink bg-white/5 border-l-2 border-neon-pink' : 'text-gray-400 hover:text-white'}`}>规格与卖点</button>
               <button onClick={()=>setEditorTab('DESC')} className={`text-left px-6 py-3 text-sm font-bold ${editorTab === 'DESC' ? 'text-neon-pink bg-white/5 border-l-2 border-neon-pink' : 'text-gray-400 hover:text-white'}`}>详细描述</button>
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-black/20">
              
              {editorTab === 'BASIC' && (
                 <div className="space-y-6 max-w-2xl animate-fade-in">
                    <div>
                      <label className="block text-xs text-neon-cyan font-bold mb-1">商品名称</label>
                      <input className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none" 
                             value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs text-neon-cyan font-bold mb-1">价格 (USD)</label>
                          <input type="number" className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none" 
                              value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                          <label className="block text-xs text-neon-cyan font-bold mb-1">SKU (库存单位)</label>
                          <input className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none" 
                              value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-neon-cyan font-bold mb-1">分类</label>
                        <select className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none"
                                value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                           {config.categories.map(c => <option key={c} value={c}>{c}</option>)}
                           <option value="UNCATEGORIZED">未分类</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-neon-cyan font-bold mb-1">库存状态</label>
                        <select className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none"
                                value={editingProduct.stock_status} onChange={e => setEditingProduct({...editingProduct, stock_status: e.target.value as any})}>
                           <option value="IN_STOCK">有货 (In Stock)</option>
                           <option value="LOW_STOCK">库存紧张 (Low Stock)</option>
                           <option value="OUT_OF_STOCK">售罄 (Out of Stock)</option>
                        </select>
                      </div>
                    </div>
                 </div>
              )}

              {editorTab === 'MEDIA' && (
                 <div className="space-y-8 animate-fade-in">
                    <div>
                       <label className="block text-xs text-neon-cyan font-bold mb-3 flex items-center gap-2"><ImageIcon size={16}/> 图片库 (第一张为主图)</label>
                       <div className="grid grid-cols-4 gap-4">
                          {editingProduct.images.map((img, idx) => (
                             <div key={idx} className="relative group aspect-square bg-black border border-white/10 rounded overflow-hidden">
                                <img src={img} className="w-full h-full object-cover" />
                                <button onClick={() => {
                                  const newImgs = editingProduct.images.filter((_, i) => i !== idx);
                                  setEditingProduct({...editingProduct, images: newImgs});
                                }} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                <div className="absolute bottom-1 left-1 bg-black/70 px-2 text-[10px] text-white rounded">{idx === 0 ? '主图' : `${idx+1}`}</div>
                             </div>
                          ))}
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-neon-cyan cursor-pointer aspect-square bg-white/5 rounded transition-colors">
                             {uploading ? <div className="animate-spin text-neon-cyan">C</div> : <Plus className="text-gray-400" />}
                             <span className="text-xs text-gray-500 mt-2 font-bold">上传图片</span>
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                if(e.target.files?.[0]) handleImageUpload(e.target.files[0], (url) => setEditingProduct({...editingProduct, images: [...editingProduct.images, url]}));
                             }}/>
                          </label>
                       </div>
                       <div className="mt-4">
                          <input className="w-full bg-black border border-white/20 p-2 text-white text-xs rounded" 
                                 placeholder="或者粘贴图片链接 URL 并回车..."
                                 onKeyDown={(e) => {
                                   if(e.key === 'Enter') {
                                     setEditingProduct({...editingProduct, images: [...editingProduct.images, e.currentTarget.value]});
                                     e.currentTarget.value = '';
                                   }
                                 }}/>
                       </div>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                       <label className="block text-xs text-neon-cyan font-bold mb-3 flex items-center gap-2"><Video size={16}/> 视频链接 (MP4 URL)</label>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                             <label className="text-xs text-gray-400 mb-1 block">主展示视频 (详情页轮播)</label>
                             <input className="w-full bg-black border border-white/20 p-3 text-white text-sm" 
                                    placeholder="https://..."
                                    value={editingProduct.mainVideo || ''}
                                    onChange={e => setEditingProduct({...editingProduct, mainVideo: e.target.value})} />
                          </div>
                          <div>
                             <label className="text-xs text-gray-400 mb-1 block">竖屏短视频 (首页 Feed 流)</label>
                             <input className="w-full bg-black border border-white/20 p-3 text-white text-sm" 
                                    placeholder="https://..."
                                    value={editingProduct.socialVideo || ''}
                                    onChange={e => setEditingProduct({...editingProduct, socialVideo: e.target.value})} />
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {editorTab === 'SPECS' && (
                <div className="space-y-8 animate-fade-in max-w-2xl">
                   <div>
                      <h3 className="text-neon-cyan text-sm font-bold mb-4 flex items-center gap-2"><Layers size={16}/> 硬件参数 (Specs)</h3>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">材质 (Material)</label>
                            <input className="w-full bg-black border border-white/20 p-2 text-white" 
                                   value={editingProduct.specs.material} onChange={e => updateSpec('material', e.target.value)} />
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">尺寸 (Size)</label>
                            <input className="w-full bg-black border border-white/20 p-2 text-white" 
                                   value={editingProduct.specs.size} onChange={e => updateSpec('size', e.target.value)} />
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">噪音 (Noise)</label>
                            <input className="w-full bg-black border border-white/20 p-2 text-white" 
                                   value={editingProduct.specs.noise} onChange={e => updateSpec('noise', e.target.value)} />
                         </div>
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">电池/电源 (Battery)</label>
                            <input className="w-full bg-black border border-white/20 p-2 text-white" 
                                   value={editingProduct.specs.battery} onChange={e => updateSpec('battery', e.target.value)} />
                         </div>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-neon-cyan text-sm font-bold mb-4 flex items-center gap-2"><Tag size={16}/> 卖点标签 (Features)</h3>
                      <div className="flex flex-wrap gap-2">
                         {editingProduct.features.map((f, i) => (
                            <span key={i} className="px-3 py-1 bg-white/10 text-white text-sm rounded flex items-center gap-2">
                               {f}
                               <button onClick={() => removeFeature(i)} className="hover:text-red-500"><X size={12}/></button>
                            </span>
                         ))}
                         <button onClick={addFeature} className="px-3 py-1 border border-dashed border-gray-500 text-gray-400 text-sm hover:text-white hover:border-white rounded flex items-center gap-1">
                            <Plus size={12}/> 添加标签
                         </button>
                      </div>
                   </div>
                </div>
              )}

              {editorTab === 'DESC' && (
                 <div className="h-full flex flex-col animate-fade-in">
                    <label className="block text-xs text-neon-cyan font-bold mb-2">商品详细介绍 (支持纯文本，暂不支持富文本)</label>
                    <textarea className="flex-1 w-full bg-black border border-white/20 p-4 text-white focus:border-neon-pink outline-none leading-relaxed" 
                              value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                 </div>
              )}

            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex justify-end gap-4 bg-black/50">
             <button onClick={() => setEditingProduct(null)} className="px-6 py-2 text-gray-400 hover:text-white font-bold">取消</button>
             <button onClick={() => handleProductSave(editingProduct)} className="px-8 py-2 bg-neon-purple hover:bg-neon-pink text-white font-bold flex items-center gap-2 clip-path-polygon shadow-lg shadow-neon-purple/20">
               <Save size={16}/> 保存更改
             </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex animate-fade-in">
       {/* SIDEBAR */}
       <aside className="w-64 border-r border-white/10 bg-synth-panel flex flex-col h-screen sticky top-0">
          <div className="p-6 border-b border-white/10">
             <div className="text-neon-cyan font-display font-black text-2xl italic">LUREMEOW<span className="text-white text-base not-italic ml-1">OS</span></div>
             <div className="text-[10px] text-gray-500 font-mono mt-1">V2.1.0 // 管理员权限</div>
          </div>
          <nav className="flex-1 py-6 space-y-1">
             <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={<LayoutDashboard size={18}/>} label="概览 & 导入" />
             <TabButton active={activeTab === 'PRODUCTS'} onClick={() => setActiveTab('PRODUCTS')} icon={<Package size={18}/>} label="商品管理" />
             <TabButton active={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} icon={<ShoppingBag size={18}/>} label="订单管理" />
             <TabButton active={activeTab === 'DESIGN'} onClick={() => setActiveTab('DESIGN')} icon={<Palette size={18}/>} label="店铺 & 首页" />
             <TabButton active={activeTab === 'PAGES'} onClick={() => setActiveTab('PAGES')} icon={<FileText size={18}/>} label="页面管理" />
             <TabButton active={activeTab === 'BUNDLES'} onClick={() => setActiveTab('BUNDLES')} icon={<Tag size={18}/>} label="商品组合" />
             <TabButton active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={<Settings size={18}/>} label="系统设置" />
          </nav>
          <div className="p-6 border-t border-white/10">
             <button onClick={onExit} className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors text-sm font-bold"><LogOut size={16}/> 退出登录</button>
          </div>
       </aside>

       {/* MAIN CONTENT */}
       <main className="flex-1 p-8 bg-black min-h-screen overflow-y-auto">
          {activeTab === 'OVERVIEW' && (
             <div className="max-w-4xl space-y-8 animate-fade-in">
                <h1 className="text-3xl font-display font-bold text-white mb-8">系统概览</h1>
                <div className="grid grid-cols-3 gap-6">
                   <div className="bg-synth-panel border border-neon-cyan p-6 relative overflow-hidden group rounded-lg">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><Package size={48} className="text-neon-cyan"/></div>
                      <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">库存总量</h3>
                      <div className="text-5xl font-display text-white">{products.length}</div>
                   </div>
                   <div className="bg-synth-panel border border-neon-pink p-6 rounded-lg">
                      <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">活跃分类</h3>
                      <div className="text-5xl font-display text-white">{config.categories.length}</div>
                   </div>
                   <div className="bg-synth-panel border border-neon-yellow p-6 rounded-lg">
                      <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">系统状态</h3>
                      <div className="text-xl font-display text-white mt-2 flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> ONLINE</div>
                   </div>
                </div>
                
                {/* 批量导入卡片 */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full filter blur-3xl"></div>
                    <h3 className="text-xl font-display text-white mb-4 flex items-center gap-2"><FileSpreadsheet className="text-neon-cyan"/> 批量数据导入</h3>
                    
                    <p className="text-gray-400 text-sm mb-6 max-w-lg">
                        支持标准 Shopify CSV 导出文件。系统会自动解析商品名称、价格、描述、分类和图片。
                        <br/><span className="text-xs text-gray-500">* 如果商品 ID (Handle) 相同，您可以选择覆盖或跳过。</span>
                    </p>

                    <div className="flex flex-col gap-4">
                       <button 
                         onClick={() => setShowCSVImporter(true)}
                         className="flex items-center gap-3 bg-neon-purple hover:bg-neon-pink text-white px-6 py-4 font-bold cursor-pointer transition-colors clip-path-polygon rounded w-fit"
                       >
                         <Upload size={18}/> 上传 Shopify CSV 文件
                       </button>
                       
                       {importStatus && (
                           <div className={`flex items-center gap-2 text-sm p-4 rounded border ${
                               importStatus.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                               importStatus.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                               'border-blue-500/30 bg-blue-500/10 text-blue-400'
                           }`}>
                               {importStatus.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                               {importStatus.msg}
                           </div>
                       )}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-white/10">
                       <h4 className="text-sm font-bold text-white mb-3">其他操作</h4>
                       <button onClick={() => setEditingProduct({
                           id: `NEB-${Date.now()}`, sku: '', name: '新建商品草稿', price: 0, category: 'VIBES', images: [], description: '', features: [], specs: {material:'',size:'',noise:'',battery:''}, stock_status:'IN_STOCK'
                       })} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold transition-colors">
                          <Plus size={16}/> 手动添加单个商品
                       </button>
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'PRODUCTS' && (
             <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                   <h1 className="text-3xl font-display font-bold text-white">商品库存数据库</h1>
                   <div className="flex gap-4">
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                         <input 
                           type="text" 
                           placeholder="搜索名称或 SKU..." 
                           className="bg-white/5 border border-white/20 pl-10 pr-4 py-2 text-white text-sm focus:border-neon-cyan outline-none w-64 rounded"
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                         />
                      </div>
                      
                      {/* CSV 导入按钮 */}
                      <button 
                        onClick={() => setShowCSVImporter(true)}
                        className="bg-neon-purple hover:bg-neon-pink text-white px-4 py-2 font-bold text-sm cursor-pointer rounded flex items-center gap-2 transition-colors"
                      >
                        <Upload size={16}/> 导入 CSV
                      </button>
                      
                      <button onClick={() => setEditingProduct({
                           id: `NEB-${Date.now()}`, sku: '', name: '新建商品', price: 0, category: 'VIBES', images: [], description: '', features: [], specs: {material:'',size:'',noise:'',battery:''}, stock_status:'IN_STOCK'
                       })} className="bg-neon-cyan text-black px-4 py-2 font-bold text-sm hover:bg-white rounded">+ 新增商品</button>
                   </div>
                </div>
                
                {/* 导入状态提示 */}
                {importStatus && (
                  <div className={`mb-6 p-4 rounded border ${
                    importStatus.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    importStatus.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  } flex items-start gap-3`}>
                    {importStatus.type === 'success' && <CheckCircle size={20} className="flex-shrink-0 mt-0.5"/>}
                    {importStatus.type === 'error' && <AlertCircle size={20} className="flex-shrink-0 mt-0.5"/>}
                    {importStatus.type === 'info' && <Info size={20} className="flex-shrink-0 mt-0.5"/>}
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-1">
                        {importStatus.type === 'success' ? '导入成功' : importStatus.type === 'error' ? '导入失败' : '正在处理'}
                      </div>
                      <div className="text-xs">{importStatus.msg}</div>
                    </div>
                    <button onClick={() => setImportStatus(null)} className="text-gray-400 hover:text-white">
                      <X size={16}/>
                    </button>
                  </div>
                )}
                
                <div className="bg-white/5 border border-white/10 overflow-hidden rounded-lg">
                   <table className="w-full text-left">
                      <thead className="bg-black/50 text-xs font-bold text-gray-400 uppercase border-b border-white/10">
                         <tr>
                            <th className="p-4">商品信息</th>
                            <th className="p-4">分类</th>
                            <th className="p-4">价格</th>
                            <th className="p-4">状态</th>
                            <th className="p-4 text-right">操作</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                         {filteredProducts.map(p => (
                            <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                               <td className="p-4 flex items-center gap-4">
                                  <div className="w-12 h-12 bg-black border border-white/20 rounded overflow-hidden flex-shrink-0">
                                     {p.images[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-600"><ImageIcon size={16}/></div>}
                                  </div>
                                  <div>
                                     <div className="font-bold text-white line-clamp-1">{p.name}</div>
                                     <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                        {p.sku || '无SKU'} 
                                        {p.features.length > 0 && <span className="bg-white/10 px-1 rounded text-[10px]">{p.features.length} 标签</span>}
                                     </div>
                                  </div>
                               </td>
                               <td className="p-4 text-sm text-gray-300">{p.category}</td>
                               <td className="p-4 text-neon-cyan font-mono">${p.price}</td>
                               <td className="p-4">
                                  <span className={`text-[10px] font-bold px-2 py-1 border rounded ${p.stock_status === 'IN_STOCK' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                                     {p.stock_status === 'IN_STOCK' ? '有货' : (p.stock_status === 'LOW_STOCK' ? '库存紧张' : '售罄')}
                                  </span>
                               </td>
                               <td className="p-4 text-right">
                                  <button onClick={() => setEditingProduct(p)} className="text-gray-400 hover:text-white mr-4 text-sm font-bold">编辑</button>
                                  <button onClick={() => { if(confirm('确定删除该商品吗？无法恢复。')) onUpdateProducts(products.filter(x=>x.id!==p.id)) }} className="text-gray-400 hover:text-red-500 text-sm font-bold">删除</button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                   {filteredProducts.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                         未找到匹配的商品
                      </div>
                   )}
                </div>
             </div>
          )}

          {activeTab === 'ORDERS' && (
            <OrdersManager 
              orders={orders} 
              onOrdersUpdate={(newOrders) => setOrders(newOrders)}
            />
          )}

          {activeTab === 'DESIGN' && (
             <div className="max-w-4xl space-y-12 animate-fade-in">
                {/* BRANDING */}
                <section>
                   <h2 className="text-xl font-display text-neon-pink mb-6 pb-2 border-b border-white/10">品牌与基础信息</h2>
                   <div className="bg-white/5 border border-white/10 p-6 space-y-6 rounded-lg">
                      <div className="grid grid-cols-2 gap-6">
                         <div>
                            <label className="text-xs text-neon-cyan font-bold block mb-2">店铺名称</label>
                            <input className="w-full bg-black border border-white/20 p-3 text-white rounded" value={config.shopName} onChange={e => onUpdateConfig({...config, shopName: e.target.value})} />
                         </div>
                         <div>
                            <label className="text-xs text-neon-cyan font-bold block mb-2">LOGO 设置</label>
                             <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-black border border-white/20 flex items-center justify-center overflow-hidden rounded">
                                   {config.logoImage ? <img src={config.logoImage} className="w-full h-full object-contain"/> : <span className="text-xs text-gray-600">文字</span>}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <button onClick={() => onUpdateConfig({...config, logoType: 'TEXT'})} className={`text-xs px-2 py-1 border ${config.logoType === 'TEXT' ? 'border-neon-cyan text-neon-cyan' : 'border-gray-600 text-gray-600'}`}>使用文字</button>
                                    <button onClick={() => onUpdateConfig({...config, logoType: 'IMAGE'})} className={`text-xs px-2 py-1 border ${config.logoType === 'IMAGE' ? 'border-neon-cyan text-neon-cyan' : 'border-gray-600 text-gray-600'}`}>使用图片</button>
                                  </div>
                                  <label className="bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-bold cursor-pointer text-center rounded">
                                     上传 Logo 图片
                                     <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                        if(e.target.files?.[0]) handleImageUpload(e.target.files[0], (url) => onUpdateConfig({...config, logoImage: url, logoType: 'IMAGE'}));
                                     }}/>
                                  </label>
                                </div>
                             </div>
                         </div>
                      </div>
                      <div>
                         <label className="text-xs text-neon-cyan font-bold block mb-2">顶部滚动公告 (Marquee)</label>
                         <textarea className="w-full bg-black border border-white/20 p-3 text-white rounded" value={config.marqueeText} onChange={e => onUpdateConfig({...config, marqueeText: e.target.value})} />
                      </div>
                      <div>
                         <label className="text-xs text-neon-cyan font-bold block mb-2">联系邮箱</label>
                         <input className="w-full bg-black border border-white/20 p-3 text-white rounded" value={config.contactEmail} onChange={e => onUpdateConfig({...config, contactEmail: e.target.value})} />
                      </div>
                   </div>
                </section>

                {/* 图片尺寸推荐指南 */}
                <div className="bg-neon-cyan/10 border border-neon-cyan/30 p-6 rounded-lg">
                   <h3 className="font-bold text-neon-cyan mb-3 flex items-center gap-2">
                     <Info size={18}/> 图片尺寸推荐指南
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                      <div>
                        <strong className="text-white">• 轮播图 (Hero Slides):</strong> 1920x800px (16:6.7)
                      </div>
                      <div>
                        <strong className="text-white">• 品牌价值点图标:</strong> 128x128px (1:1)
                      </div>
                      <div>
                        <strong className="text-white">• 社交视频:</strong> 1080x1920px (9:16 竖屏)
                      </div>
                      <div>
                        <strong className="text-white">• 视频缩略图:</strong> 540x960px (9:16)
                      </div>
                      <div>
                        <strong className="text-white">• 分类卡片:</strong> 使用商品图片 (800x1000px)
                      </div>
                      <div>
                        <strong className="text-white">• 商品展示:</strong> 使用商品图片 (800x1000px)
                      </div>
                   </div>
                </div>

                {/* 轮播图管理 */}
                <section>
                   <h2 className="text-xl font-display text-neon-yellow mb-6 pb-2 border-b border-white/10">轮播图 (Hero Carousel) <span className="text-xs text-gray-500 font-normal ml-2">推荐: 1920x800px</span></h2>
                   <div className="space-y-4">
                      {config.heroSlides.map((slide, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div>
                             <label className="block text-xs text-gray-400 mb-2">图片URL</label>
                             <input 
                               type="text" 
                               value={slide.image}
                               onChange={e => {
                                 const newSlides = [...config.heroSlides];
                                 newSlides[idx].image = e.target.value;
                                 onUpdateConfig({...config, heroSlides: newSlides});
                               }}
                               className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                             />
                           </div>
                           <div>
                             <label className="block text-xs text-gray-400 mb-2">标题</label>
                             <input 
                               type="text" 
                               value={slide.title}
                               onChange={e => {
                                 const newSlides = [...config.heroSlides];
                                 newSlides[idx].title = e.target.value;
                                 onUpdateConfig({...config, heroSlides: newSlides});
                               }}
                               className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                             />
                           </div>
                           <div>
                             <label className="block text-xs text-gray-400 mb-2">副标题</label>
                             <input 
                               type="text" 
                               value={slide.subtitle}
                               onChange={e => {
                                 const newSlides = [...config.heroSlides];
                                 newSlides[idx].subtitle = e.target.value;
                                 onUpdateConfig({...config, heroSlides: newSlides});
                               }}
                               className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                             />
                           </div>
                        </div>
                      ))}
                   </div>
                </section>

                {/* 品牌价值点 */}
                <section>
                   <h2 className="text-xl font-display text-neon-cyan mb-6 pb-2 border-b border-white/10">品牌价值点 <span className="text-xs text-gray-500 font-normal ml-2">图标推荐: 128x128px</span></h2>
                   <div className="space-y-4">
                      {(config.brandValues || [
                        {icon: 'https://api.iconify.design/mdi:shield-check.svg?color=%2300ffff', title: 'Encrypted Privacy', description: 'All data wiped after delivery. 256-bit SSL transaction security.'},
                        {icon: 'https://api.iconify.design/mdi:cpu-64-bit.svg?color=%23ff00ff', title: 'Next-Gen Tech', description: 'Premium motors and medical-grade body-safe materials.'},
                        {icon: 'https://api.iconify.design/mdi:truck-fast.svg?color=%23ffff00', title: 'Stealth Delivery', description: 'Plain packaging. No logos. Arrives before you wake up.'}
                      ]).map((value, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div>
                             <label className="block text-xs text-gray-400 mb-2">图标URL (可用 Iconify CDN)</label>
                             <input 
                               type="text" 
                               value={value.icon}
                               onChange={e => {
                                 const newValues = [...(config.brandValues || [])];
                                 newValues[idx] = {...newValues[idx], icon: e.target.value};
                                 onUpdateConfig({...config, brandValues: newValues});
                               }}
                               className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                               placeholder="https://api.iconify.design/..."
                             />
                           </div>
                           <div>
                             <label className="block text-xs text-gray-400 mb-2">标题</label>
                             <input 
                               type="text" 
                               value={value.title}
                               onChange={e => {
                                 const newValues = [...(config.brandValues || [])];
                                 newValues[idx] = {...newValues[idx], title: e.target.value};
                                 onUpdateConfig({...config, brandValues: newValues});
                               }}
                               className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                             />
                           </div>
                           <div>
                             <label className="block text-xs text-gray-400 mb-2">描述</label>
                             <input 
                               type="text" 
                               value={value.description}
                               onChange={e => {
                                 const newValues = [...(config.brandValues || [])];
                                 newValues[idx] = {...newValues[idx], description: e.target.value};
                                 onUpdateConfig({...config, brandValues: newValues});
                               }}
                               className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                             />
                           </div>
                        </div>
                      ))}
                   </div>
                </section>

                {/* 社交视频 Feed */}
                <section>
                   <h2 className="text-xl font-display text-neon-purple mb-6 pb-2 border-b border-white/10">社交视频 Feed <span className="text-xs text-gray-500 font-normal ml-2">视频: 1080x1920px | 缩略图: 540x960px</span></h2>
                   <div className="space-y-4">
                      {(config.socialVideos || []).map((video, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded space-y-3">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-400 mb-2">视频URL</label>
                                <input 
                                  type="text" 
                                  value={video.videoUrl}
                                  onChange={e => {
                                    const newVideos = [...(config.socialVideos || [])];
                                    newVideos[idx].videoUrl = e.target.value;
                                    onUpdateConfig({...config, socialVideos: newVideos});
                                  }}
                                  className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-2">缩略图URL</label>
                                <input 
                                  type="text" 
                                  value={video.thumbnail}
                                  onChange={e => {
                                    const newVideos = [...(config.socialVideos || [])];
                                    newVideos[idx].thumbnail = e.target.value;
                                    onUpdateConfig({...config, socialVideos: newVideos});
                                  }}
                                  className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                                />
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-400 mb-2">标题</label>
                                <input 
                                  type="text" 
                                  value={video.title}
                                  onChange={e => {
                                    const newVideos = [...(config.socialVideos || [])];
                                    newVideos[idx].title = e.target.value;
                                    onUpdateConfig({...config, socialVideos: newVideos});
                                  }}
                                  className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-2">关联商品ID (可选)</label>
                                <input 
                                  type="text" 
                                  value={video.linkProductId || ''}
                                  onChange={e => {
                                    const newVideos = [...(config.socialVideos || [])];
                                    newVideos[idx].linkProductId = e.target.value;
                                    onUpdateConfig({...config, socialVideos: newVideos});
                                  }}
                                  className="w-full bg-black/60 border border-white/20 p-2 text-white text-sm rounded focus:border-neon-cyan outline-none"
                                  placeholder="商品ID"
                                />
                              </div>
                           </div>
                           <button 
                             onClick={() => {
                               const newVideos = (config.socialVideos || []).filter((_, i) => i !== idx);
                               onUpdateConfig({...config, socialVideos: newVideos});
                             }}
                             className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                           >
                             <Trash2 size={14}/> 删除视频
                           </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newVideos = [...(config.socialVideos || []), {
                            id: Date.now().toString(),
                            videoUrl: '',
                            thumbnail: '',
                            title: '新视频'
                          }];
                          onUpdateConfig({...config, socialVideos: newVideos});
                        }}
                        className="w-full bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50 text-neon-purple p-3 rounded font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16}/> 添加视频
                      </button>
                   </div>
                </section>

                <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-lg">
                   <h3 className="font-bold text-yellow-400 mb-2">💡 其他组件说明</h3>
                   <ul className="text-sm text-gray-300 space-y-1">
                      <li>• <strong>新品推荐</strong>: 自动显示前8个商品，在 "商品管理" 中编辑</li>
                      <li>• <strong>分类展示</strong>: 自动使用每个分类的第一个商品图片，建议商品图片 800x1000px</li>
                      <li>• <strong>热销商品</strong>: 显示商品第4-7个商品，在 "商品管理" 中编辑</li>
                      <li>• <strong>精选推荐</strong>: 显示商品第8-10个商品，在 "商品管理" 中编辑</li>
                      <li>• <strong>用户评价</strong>: 固定9条评价，在 products.ts 中修改</li>
                   </ul>
                </div>
             </div>
          )}

          {activeTab === 'PAGES' && (
             <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                   <h1 className="text-3xl font-display font-bold text-white">页面管理</h1>
                   <button onClick={() => setEditingPage({
                      id: `page-${Date.now()}`,
                      title: '新页面',
                      slug: '',
                      content: '',
                      isPublished: false,
                      showInFooter: false,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                   })} className="bg-neon-cyan text-black px-4 py-2 font-bold text-sm hover:bg-white rounded flex items-center gap-2">
                      <Plus size={16}/> 创建页面
                   </button>
                </div>
                
                <div className="bg-white/5 border border-white/10 overflow-hidden rounded-lg">
                   {(config.customPages && config.customPages.length > 0) ? (
                      <table className="w-full text-left">
                         <thead className="bg-black/50 text-xs font-bold text-gray-400 uppercase border-b border-white/10">
                            <tr>
                               <th className="p-4">页面标题</th>
                               <th className="p-4">URL路径</th>
                               <th className="p-4">状态</th>
                               <th className="p-4">显示位置</th>
                               <th className="p-4">更新时间</th>
                               <th className="p-4 text-right">操作</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/10">
                            {config.customPages.map(page => (
                               <tr key={page.id} className="hover:bg-white/5 transition-colors group">
                                  <td className="p-4">
                                     <div className="flex items-center gap-2">
                                        <Globe size={14} className="text-gray-500"/>
                                        <span className="font-bold text-white">{page.title}</span>
                                     </div>
                                  </td>
                                  <td className="p-4">
                                     <code className="text-xs text-neon-cyan bg-black/50 px-2 py-1 rounded font-mono">/{page.slug}</code>
                                  </td>
                                  <td className="p-4">
                                     <span className={`text-[10px] font-bold px-2 py-1 border rounded ${
                                        page.isPublished 
                                          ? 'border-green-500 text-green-500' 
                                          : 'border-gray-500 text-gray-500'
                                     }`}>
                                        {page.isPublished ? '已发布' : '草稿'}
                                     </span>
                                  </td>
                                  <td className="p-4 text-sm text-gray-300">
                                     {page.showInFooter ? '页脚导航' : '-'}
                                  </td>
                                  <td className="p-4 text-xs text-gray-500 font-mono">
                                     {new Date(page.updatedAt).toLocaleDateString('zh-CN')}
                                  </td>
                                  <td className="p-4 text-right">
                                     <button onClick={() => setEditingPage(page)} className="text-gray-400 hover:text-white mr-4 text-sm font-bold">编辑</button>
                                     <button onClick={() => { 
                                        if(confirm(`确定删除页面 "${page.title}" 吗？无法恢复。`)) {
                                           onUpdateConfig({...config, customPages: config.customPages?.filter(p => p.id !== page.id)});
                                        }
                                     }} className="text-gray-400 hover:text-red-500 text-sm font-bold">删除</button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   ) : (
                      <div className="p-12 text-center">
                         <FileText size={48} className="mx-auto text-gray-600 mb-4"/>
                         <p className="text-gray-500 mb-2">还没有创建任何自定义页面</p>
                         <p className="text-xs text-gray-600">点击“创建页面”按钮开始创建关于我们、隐私政策等页面</p>
                      </div>
                   )}
                </div>

                {/* 快捷模板提示 */}
                {config.customPages && config.customPages.length > 0 && (
                   <div className="mt-6 bg-neon-purple/10 border border-neon-purple/30 p-4 rounded">
                      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                         <AlertTriangle size={14} className="text-neon-purple"/> 快捷提示
                      </h4>
                      <p className="text-xs text-gray-400">
                         常用页面示例：关于我们 (about-us)、隐私政策 (privacy-policy)、服务条款 (terms-of-service)、品牌故事 (brand-story)、合作伙伴 (partners) 等。
                      </p>
                   </div>
                )}
             </div>
          )}

          {activeTab === 'BUNDLES' && (
             <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                   <h1 className="text-3xl font-display font-bold text-white">商品组合管理</h1>
                   <button onClick={() => setEditingBundle({
                      id: `bundle-${Date.now()}`,
                      mainProductId: '',
                      bundleTitle: 'BUNDLE DEAL - SAVE 20%',
                      bundleProductId: '',
                      originalTotalPrice: 0,
                      bundlePrice: 0,
                      discountPercent: 0,
                      isActive: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                   })} className="bg-neon-yellow text-black px-4 py-2 font-bold text-sm hover:bg-white rounded flex items-center gap-2">
                      <Plus size={16}/> 创建组合
                   </button>
                </div>
                
                <div className="bg-white/5 border border-white/10 overflow-hidden rounded-lg">
                   {(config.bundleOffers && config.bundleOffers.length > 0) ? (
                      <table className="w-full text-left">
                         <thead className="bg-black/50 text-xs font-bold text-gray-400 uppercase border-b border-white/10">
                            <tr>
                               <th className="p-4">组合标题</th>
                               <th className="p-4">主商品</th>
                               <th className="p-4">组合商品</th>
                               <th className="p-4">折扣</th>
                               <th className="p-4">状态</th>
                               <th className="p-4">更新时间</th>
                               <th className="p-4 text-right">操作</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-white/10">
                            {config.bundleOffers.map(bundle => {
                               const mainProduct = products.find(p => p.id === bundle.mainProductId);
                               const bundleProduct = products.find(p => p.id === bundle.bundleProductId);
                               return (
                                  <tr key={bundle.id} className="hover:bg-white/5 transition-colors group">
                                     <td className="p-4">
                                        <div className="flex items-center gap-2">
                                           <Tag size={14} className="text-neon-yellow"/>
                                           <span className="font-bold text-white">{bundle.bundleTitle}</span>
                                        </div>
                                     </td>
                                     <td className="p-4 text-sm text-gray-300">
                                        {mainProduct ? mainProduct.name : <span className="text-red-500">已删除</span>}
                                     </td>
                                     <td className="p-4 text-sm text-gray-300">
                                        {bundleProduct ? bundleProduct.name : <span className="text-red-500">已删除</span>}
                                     </td>
                                     <td className="p-4">
                                        <span className="text-neon-yellow font-mono text-sm">{bundle.discountPercent.toFixed(0)}% OFF</span>
                                     </td>
                                     <td className="p-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 border rounded ${
                                           bundle.isActive 
                                             ? 'border-green-500 text-green-500' 
                                             : 'border-gray-500 text-gray-500'
                                        }`}>
                                           {bundle.isActive ? '已启用' : '未启用'}
                                        </span>
                                     </td>
                                     <td className="p-4 text-xs text-gray-500 font-mono">
                                        {new Date(bundle.updatedAt).toLocaleDateString('zh-CN')}
                                     </td>
                                     <td className="p-4 text-right">
                                        <button onClick={() => setEditingBundle(bundle)} className="text-gray-400 hover:text-white mr-4 text-sm font-bold">编辑</button>
                                        <button onClick={() => { 
                                           if(confirm(`确定删除组合 "${bundle.bundleTitle}" 吗？无法恢复。`)) {
                                              onUpdateConfig({...config, bundleOffers: config.bundleOffers?.filter(b => b.id !== bundle.id)});
                                           }
                                        }} className="text-gray-400 hover:text-red-500 text-sm font-bold">删除</button>
                                     </td>
                                  </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   ) : (
                      <div className="p-12 text-center">
                         <Tag size={48} className="mx-auto text-gray-600 mb-4"/>
                         <p className="text-gray-500 mb-2">还没有创建任何商品组合</p>
                         <p className="text-xs text-gray-600">点击“创建组合”按钮开始设置商品组合优惠</p>
                      </div>
                   )}
                </div>

                {/* 使用提示 */}
                {config.bundleOffers && config.bundleOffers.length > 0 && (
                   <div className="mt-6 bg-neon-yellow/10 border border-neon-yellow/30 p-4 rounded">
                      <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                         <AlertTriangle size={14} className="text-neon-yellow"/> 功能说明
                      </h4>
                      <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                         <li>商品组合会在主商品的详情页自动显示</li>
                         <li>用户可以一起购买两个商品并享受总价折扣</li>
                         <li>如果组合未启用，前台不会显示该组件</li>
                         <li>可以为同一商品创建多个组合，系统会显示最新的启用组合</li>
                      </ul>
                   </div>
                )}
             </div>
          )}

          {activeTab === 'SETTINGS' && (
             <div className="max-w-2xl animate-fade-in space-y-8">
                 {/* 运费设置 */}
                 <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-8 flex items-center gap-3">
                      <Package size={28} className="text-neon-pink"/> 运费设置
                    </h1>
                    <div className="bg-white/5 border border-white/10 p-8 space-y-6 rounded-lg">
                       <div>
                          <label className="block text-sm font-bold text-neon-cyan mb-3">运费类型</label>
                          <div className="space-y-3">
                             {/* 免费包邮 */}
                             <label className="flex items-center gap-3 p-4 border border-white/20 rounded cursor-pointer hover:border-neon-cyan transition-colors">
                               <input 
                                 type="radio" 
                                 name="shippingType"
                                 checked={(config.shippingConfig?.type || 'THRESHOLD') === 'FREE'}
                                 onChange={() => onUpdateConfig({...config, shippingConfig: { type: 'FREE' }})}
                                 className="accent-neon-pink"
                               />
                               <div className="flex-1">
                                 <div className="text-white font-bold">全场免费包邮</div>
                                 <div className="text-gray-400 text-xs mt-1">所有订单都不收取运费</div>
                               </div>
                             </label>
                                       
                             {/* 固定运费 */}
                             <label className="flex items-start gap-3 p-4 border border-white/20 rounded cursor-pointer hover:border-neon-cyan transition-colors">
                               <input 
                                 type="radio" 
                                 name="shippingType"
                                 checked={(config.shippingConfig?.type || 'THRESHOLD') === 'FIXED'}
                                 onChange={() => onUpdateConfig({...config, shippingConfig: { type: 'FIXED', fixedAmount: config.shippingConfig?.fixedAmount || 25 }})}
                                 className="accent-neon-pink mt-1"
                               />
                               <div className="flex-1">
                                 <div className="text-white font-bold">固定运费</div>
                                 <div className="text-gray-400 text-xs mt-1 mb-3">所有订单收取固定金额的运费</div>
                                 {(config.shippingConfig?.type || 'THRESHOLD') === 'FIXED' && (
                                   <input 
                                     type="number"
                                     placeholder="输入运费金额"
                                     value={config.shippingConfig?.fixedAmount || ''}
                                     onChange={e => onUpdateConfig({...config, shippingConfig: { type: 'FIXED', fixedAmount: parseFloat(e.target.value) || 0 }})}
                                     className="w-full bg-black border border-white/20 p-2 text-white focus:border-neon-pink outline-none"
                                     min="0"
                                     step="0.01"
                                   />
                                 )}
                               </div>
                             </label>
                                       
                             {/* 满额免运费 */}
                             <label className="flex items-start gap-3 p-4 border border-white/20 rounded cursor-pointer hover:border-neon-cyan transition-colors">
                               <input 
                                 type="radio" 
                                 name="shippingType"
                                 checked={(config.shippingConfig?.type || 'THRESHOLD') === 'THRESHOLD'}
                                 onChange={() => onUpdateConfig({...config, shippingConfig: { 
                                   type: 'THRESHOLD', 
                                   fixedAmount: config.shippingConfig?.fixedAmount || 25,
                                   freeShippingThreshold: config.shippingConfig?.freeShippingThreshold || 500 
                                 }})}
                                 className="accent-neon-pink mt-1"
                               />
                               <div className="flex-1">
                                 <div className="text-white font-bold">满额免运费</div>
                                 <div className="text-gray-400 text-xs mt-1 mb-3">购物满一定金额免运费，未满收取固定运费</div>
                                 {(config.shippingConfig?.type || 'THRESHOLD') === 'THRESHOLD' && (
                                   <div className="space-y-3">
                                     <div>
                                       <label className="text-xs text-gray-400 block mb-1">基础运费（未满额时收取）</label>
                                       <input 
                                         type="number"
                                         placeholder="例如: 25"
                                         value={config.shippingConfig?.fixedAmount || ''}
                                         onChange={e => onUpdateConfig({...config, shippingConfig: { 
                                           ...config.shippingConfig,
                                           type: 'THRESHOLD',
                                           fixedAmount: parseFloat(e.target.value) || 0 
                                         }})}
                                         className="w-full bg-black border border-white/20 p-2 text-white focus:border-neon-pink outline-none"
                                         min="0"
                                         step="0.01"
                                       />
                                     </div>
                                     <div>
                                       <label className="text-xs text-gray-400 block mb-1">免运费门槛（购物满多少免运费）</label>
                                       <input 
                                         type="number"
                                         placeholder="例如: 500"
                                         value={config.shippingConfig?.freeShippingThreshold || ''}
                                         onChange={e => onUpdateConfig({...config, shippingConfig: { 
                                           ...config.shippingConfig,
                                           type: 'THRESHOLD',
                                           freeShippingThreshold: parseFloat(e.target.value) || 0 
                                         }})}
                                         className="w-full bg-black border border-white/20 p-2 text-white focus:border-neon-pink outline-none"
                                         min="0"
                                         step="0.01"
                                       />
                                     </div>
                                   </div>
                                 )}
                               </div>
                             </label>
                          </div>
                       </div>
                                 
                       {/* 当前设置预览 */}
                       <div className="bg-black/30 border border-neon-cyan/30 p-4 rounded">
                         <div className="text-xs text-neon-cyan font-bold mb-2">当前设置预览</div>
                         <div className="text-white">
                           {(config.shippingConfig?.type || 'THRESHOLD') === 'FREE' && '✨ 全场免费包邮'}
                           {(config.shippingConfig?.type) === 'FIXED' && `📦 所有订单运费: ${config.shippingConfig.fixedAmount || 0} 元`}
                           {(config.shippingConfig?.type || 'THRESHOLD') === 'THRESHOLD' && (
                             `🚀 满 ${config.shippingConfig?.freeShippingThreshold || 500} 元免运费，未满收取 ${config.shippingConfig?.fixedAmount || 25} 元`
                           )}
                         </div>
                       </div>
                    </div>
                 </div>
                           
                 {/* PayPal 支付设置 */}
                 <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-8 flex items-center gap-3">
                       <CreditCard size={28} className="text-neon-cyan"/> PayPal 支付设置
                    </h1>
                    <div className="bg-white/5 border border-white/10 p-8 space-y-6 rounded-lg">
                       <div className="flex items-center justify-between p-4 bg-black/30 border border-white/10 rounded">
                          <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               id="paypal-enabled"
                               checked={config.paypalConfig?.enabled || false}
                               onChange={e => onUpdateConfig({...config, paypalConfig: { 
                                 ...config.paypalConfig,
                                 enabled: e.target.checked
                               }})}
                               className="accent-neon-cyan"
                             />
                             <label htmlFor="paypal-enabled" className="text-white font-bold cursor-pointer">
                                启用 PayPal 支付
                             </label>
                          </div>
                          {config.paypalConfig?.enabled && (
                             <span className="text-green-400 text-xs flex items-center gap-1">
                                <CheckCircle size={14}/> 已启用
                             </span>
                          )}
                       </div>

                       {config.paypalConfig?.enabled && (
                          <>
                             <div>
                                <label className="block text-sm font-bold text-neon-cyan mb-2">PayPal Client ID</label>
                                <input
                                  type="text"
                                  value={config.paypalConfig?.clientId || ''}
                                  onChange={e => onUpdateConfig({...config, paypalConfig: { 
                                    ...config.paypalConfig,
                                    enabled: true,
                                    clientId: e.target.value
                                  }})}
                                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-cyan outline-none font-mono text-sm"
                                  placeholder="输入您的 PayPal Client ID"
                                />
                                <p className="text-gray-500 text-xs mt-2">
                                  在 <a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">PayPal Developer</a> 获取
                                </p>
                             </div>

                             <div>
                                <label className="block text-sm font-bold text-neon-cyan mb-3">环境模式</label>
                                <div className="space-y-3">
                                   <label className="flex items-center gap-3 p-3 border border-white/10 rounded cursor-pointer hover:bg-white/5">
                                      <input
                                        type="radio"
                                        checked={config.paypalConfig?.mode === 'sandbox' || !config.paypalConfig?.mode}
                                        onChange={() => onUpdateConfig({...config, paypalConfig: { 
                                          ...config.paypalConfig,
                                          enabled: true,
                                          mode: 'sandbox'
                                        }})}
                                        className="accent-neon-pink"
                                      />
                                      <div className="flex-1">
                                        <div className="text-white font-bold">Sandbox (沙箱测试环境)</div>
                                        <div className="text-gray-400 text-xs">用于测试，不会真实扣款</div>
                                      </div>
                                   </label>
                                   <label className="flex items-center gap-3 p-3 border border-white/10 rounded cursor-pointer hover:bg-white/5">
                                      <input
                                        type="radio"
                                        checked={config.paypalConfig?.mode === 'production'}
                                        onChange={() => onUpdateConfig({...config, paypalConfig: { 
                                          ...config.paypalConfig,
                                          enabled: true,
                                          mode: 'production'
                                        }})}
                                        className="accent-neon-pink"
                                      />
                                      <div className="flex-1">
                                        <div className="text-white font-bold">Production (生产环境)</div>
                                        <div className="text-gray-400 text-xs">正式环境，会真实扣款</div>
                                      </div>
                                   </label>
                                </div>
                             </div>

                             <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <div className="flex gap-3">
                                   <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5"/>
                                   <div>
                                      <h3 className="text-green-300 font-bold mb-2">高级功能（已启用）</h3>
                                      <ul className="text-gray-300 text-sm space-y-1">
                                         <li>✅ <strong>自定义信用卡字段</strong> - 用户无需 PayPal 账户</li>
                                         <li>✅ <strong>Apple Pay</strong> - iOS 设备快速支付</li>
                                         <li>✅ <strong>Google Pay</strong> - Android 设备快速支付</li>
                                         <li>✅ <strong>防欺诈保护</strong> - PayPal 内置安全</li>
                                      </ul>
                                      <p className="text-gray-400 text-xs mt-3">这些功能已集成，用户在结账时将自动看到可用的支付方式。</p>
                                   </div>
                                </div>
                             </div>

                             <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                <div className="flex gap-3">
                                   <AlertTriangle size={20} className="text-blue-400 flex-shrink-0 mt-0.5"/>
                                   <div>
                                      <h3 className="text-blue-300 font-bold mb-2">如何获取 PayPal Client ID？</h3>
                                      <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                                         <li>访问 <a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">PayPal Developer</a></li>
                                         <li>登录或注册 PayPal 开发者账号</li>
                                         <li>创建应用 (Create App)</li>
                                         <li>复制 Client ID 并粘贴到上方输入框</li>
                                         <li>测试时使用 Sandbox 环境，上线后切换到 Production</li>
                                      </ol>
                                   </div>
                                </div>
                             </div>

                             <div className="p-4 bg-black/30 border border-white/10 rounded">
                                <div className="text-gray-400 text-sm">
                                   <strong className="text-white">当前配置状态：</strong>
                                   {config.paypalConfig?.clientId ? (
                                      <span className="text-green-400 ml-2">
                                         ✅ Client ID 已配置 ({config.paypalConfig.mode === 'production' ? '生产环境' : '沙箱测试环境'})
                                      </span>
                                   ) : (
                                      <span className="text-yellow-400 ml-2">
                                         ⚠️ 请配置 Client ID
                                      </span>
                                   )}
                                </div>
                             </div>
                          </>
                       )}
                    </div>
                 </div>
                           
                 {/* 批量折扣设置 */}
                 <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-8 flex items-center gap-3">
                       <Tag size={28} className="text-neon-yellow"/> 批量折扣设置
                    </h1>
                    <div className="bg-white/5 border border-white/10 p-8 space-y-6 rounded-lg">
                       {/* 启用开关 */}
                       <div className="flex items-center justify-between p-4 bg-black/30 border border-white/10 rounded">
                          <div className="flex items-center gap-3">
                             <input
                               type="checkbox"
                               id="volume-discount-enabled"
                               checked={config.volumeDiscountConfig?.enabled || false}
                               onChange={e => onUpdateConfig({...config, volumeDiscountConfig: { 
                                 ...config.volumeDiscountConfig,
                                 enabled: e.target.checked,
                                 tiers: config.volumeDiscountConfig?.tiers || [
                                   { qty: 1, discount: 0, label: 'STANDARD' },
                                   { qty: 2, discount: 10, label: 'DUAL SYNC' },
                                   { qty: 3, discount: 20, label: 'HIVE MIND' }
                                 ]
                               }})}
                               className="accent-neon-yellow"
                             />
                             <label htmlFor="volume-discount-enabled" className="text-white font-bold cursor-pointer">
                                启用批量折扣
                             </label>
                          </div>
                          {config.volumeDiscountConfig?.enabled && (
                             <span className="text-green-400 text-xs flex items-center gap-1">
                                <CheckCircle size={14}/> 已启用
                             </span>
                          )}
                       </div>

                       {config.volumeDiscountConfig?.enabled && (
                          <>
                             <div className="space-y-4">
                                <label className="block text-sm font-bold text-neon-yellow mb-3">折扣档位设置</label>
                                
                                {(config.volumeDiscountConfig?.tiers || []).map((tier, index) => (
                                   <div key={index} className="bg-black/30 border border-white/10 p-4 rounded space-y-3">
                                      <div className="flex items-center justify-between mb-2">
                                         <span className="text-white font-bold">档位 {index + 1}</span>
                                         {index > 0 && (
                                            <button
                                               onClick={() => {
                                                  const newTiers = config.volumeDiscountConfig!.tiers!.filter((_, i) => i !== index);
                                                  onUpdateConfig({...config, volumeDiscountConfig: { 
                                                    ...config.volumeDiscountConfig,
                                                    tiers: newTiers
                                                  }});
                                               }}
                                               className="text-red-400 hover:text-red-300 text-xs"
                                            >
                                               删除
                                            </button>
                                         )}
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-3">
                                         <div>
                                            <label className="text-xs text-gray-400 block mb-1">购买数量</label>
                                            <input
                                               type="number"
                                               min="1"
                                               value={tier.qty}
                                               onChange={e => {
                                                  const newTiers = [...config.volumeDiscountConfig!.tiers!];
                                                  newTiers[index] = { ...tier, qty: parseInt(e.target.value) || 1 };
                                                  onUpdateConfig({...config, volumeDiscountConfig: { 
                                                    ...config.volumeDiscountConfig,
                                                    tiers: newTiers
                                                  }});
                                               }}
                                               className="w-full bg-black border border-white/20 p-2 text-white focus:border-neon-yellow outline-none"
                                            />
                                         </div>
                                         <div>
                                            <label className="text-xs text-gray-400 block mb-1">折扣 (%)</label>
                                            <input
                                               type="number"
                                               min="0"
                                               max="100"
                                               value={tier.discount}
                                               onChange={e => {
                                                  const newTiers = [...config.volumeDiscountConfig!.tiers!];
                                                  newTiers[index] = { ...tier, discount: parseInt(e.target.value) || 0 };
                                                  onUpdateConfig({...config, volumeDiscountConfig: { 
                                                    ...config.volumeDiscountConfig,
                                                    tiers: newTiers
                                                  }});
                                               }}
                                               className="w-full bg-black border border-white/20 p-2 text-white focus:border-neon-yellow outline-none"
                                            />
                                         </div>
                                         <div>
                                            <label className="text-xs text-gray-400 block mb-1">显示标签</label>
                                            <input
                                               type="text"
                                               value={tier.label}
                                               onChange={e => {
                                                  const newTiers = [...config.volumeDiscountConfig!.tiers!];
                                                  newTiers[index] = { ...tier, label: e.target.value };
                                                  onUpdateConfig({...config, volumeDiscountConfig: { 
                                                    ...config.volumeDiscountConfig,
                                                    tiers: newTiers
                                                  }});
                                               }}
                                               className="w-full bg-black border border-white/20 p-2 text-white focus:border-neon-yellow outline-none"
                                               placeholder="例如: STANDARD"
                                            />
                                         </div>
                                      </div>
                                   </div>
                                ))}
                                
                                {/* 添加新档位按钮 */}
                                <button
                                   onClick={() => {
                                      const currentTiers = config.volumeDiscountConfig?.tiers || [];
                                      const nextQty = currentTiers.length > 0 ? Math.max(...currentTiers.map(t => t.qty)) + 1 : 1;
                                      onUpdateConfig({...config, volumeDiscountConfig: { 
                                        ...config.volumeDiscountConfig,
                                        enabled: true,
                                        tiers: [...currentTiers, { qty: nextQty, discount: 0, label: `TIER ${nextQty}` }]
                                      }});
                                   }}
                                   className="w-full border-2 border-dashed border-white/20 hover:border-neon-yellow py-3 rounded flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                   <Plus size={16}/> 添加新档位
                                </button>
                             </div>

                             {/* 预览 */}
                             <div className="bg-neon-yellow/10 border border-neon-yellow/30 p-4 rounded">
                                <div className="text-xs text-neon-yellow font-bold mb-3">预览效果（以 $100 商品为例）</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                   {(config.volumeDiscountConfig?.tiers || []).map((tier, index) => {
                                      const price = 100;
                                      const discountedPrice = price * (1 - tier.discount / 100);
                                      const totalPrice = discountedPrice * tier.qty;
                                      return (
                                         <div key={index} className="bg-black/30 border border-white/10 p-3 rounded text-center">
                                            <div className="text-gray-400 text-[10px] mb-1">{tier.label}</div>
                                            <div className="text-white font-bold">{tier.qty}x</div>
                                            {tier.discount > 0 && (
                                               <div className="text-neon-yellow text-xs font-bold">-{tier.discount}%</div>
                                            )}
                                            <div className="text-white text-sm mt-1">${totalPrice.toFixed(2)}</div>
                                         </div>
                                      );
                                   })}
                                </div>
                             </div>

                             {/* 功能说明 */}
                             <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                <div className="flex gap-3">
                                   <AlertTriangle size={20} className="text-blue-400 flex-shrink-0 mt-0.5"/>
                                   <div>
                                      <h3 className="text-blue-300 font-bold mb-2">功能说明</h3>
                                      <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                                         <li>批量折扣会在所有商品详情页显示</li>
                                         <li>用户可以选择购买数量，自动享受折扣</li>
                                         <li>折扣会应用于每件商品的单价</li>
                                         <li>建议设置 2-4 个档位，折扣递增</li>
                                      </ul>
                                   </div>
                                </div>
                             </div>
                          </>
                       )}
                    </div>
                 </div>
                           
                 {/* 数据管理 */}
                 <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-8">数据管理</h1>
                    <div className="bg-white/5 border border-white/10 p-8 space-y-6 rounded-lg">
                       <p className="text-gray-400 text-sm">备份您的所有配置和商品数据。下载的 JSON 文件可以妖善保存，防止浏览器缓存清除导致数据丢失。</p>
                       <a 
                         className="inline-flex items-center gap-2 bg-neon-cyan text-black px-6 py-3 font-bold hover:bg-white rounded"
                         href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify({products, config}))}`}
                         download={`nebula_backup_${new Date().toISOString().split('T')[0]}.json`}
                       >
                         <Download size={18}/> 下载完整备份
                       </a>
                    </div>
                 </div>
             </div>
          )}
       </main>

       {/* Editor Modal */}
       <PageEditor />
       <BundleEditor />
       <ProductEditor />
       
       {/* CSV Importer */}
       {showCSVImporter && (
         <CSVImporter 
           onImport={handleCSVImport}
           onClear={() => {}} 
           onClose={() => setShowCSVImporter(false)}
         />
       )}
    </div>
  );
};
