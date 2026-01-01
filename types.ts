export interface ProductVariant {
  id: string;
  sku: string;
  option1?: string;  // e.g., "Red"
  option2?: string;  // e.g., "Large"
  option3?: string;
  price: number;
  image?: string;    // Variant-specific image
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  mainVideo?: string;       // For Product Detail Main Gallery
  socialVideo?: string;     // For Homepage Vertical Feed
  descriptionVideo?: string; // For Features/Description tab
  description: string;
  descriptionImages?: string[]; // For Description tab image gallery
  features: string[];
  specs: {
    material: string;
    size: string;
    noise: string;
    battery: string;
  };
  stock_status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  bundleOfferId?: string;  // 关联的组合商品ID
  
  // Variant support
  option1Name?: string;  // e.g., "Color"
  option2Name?: string;  // e.g., "Size"
  option3Name?: string;
  variants?: ProductVariant[];
}

export interface CartItem extends Product {
  cartItemId?: string;         // 购物车项唯一ID（用于区分同一产品的多个购物车项）
  quantity: number;
  bundleId?: string;           // 如果是组合商品，记录组合ID
  bundleDiscountPrice?: number; // 如果是组合商品，记录组合后的单价
  isBundleItem?: boolean;       // 标记是否为组合商品
  originalPrice?: number;       // 原始USD价格
  addedCurrency?: string;       // 添加时的货币
}

export type ViewState = 'HOME' | 'SHOP' | 'PRODUCT_DETAIL' | 'CHECKOUT' | 'BLOG' | 'ABOUT' | 'LOOKBOOK' | 'FAQ' | 'SHIPPING' | 'RETURNS' | 'CONTACT' | 'TRACKING' | 'PRIVACY' | 'TERMS' | 'CUSTOM_PAGE';

export interface HeroSlide {
  id: string;
  image: string;
  title1: string;
  title2: string;
  subtitle: string;
  desc: string;
  cta: string;
}

export interface SectorCard {
  id: string;
  image: string;
  title: string;
  linkCategory: string;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;  // URL路径，如 "about-us"
  content: string;  // 页面内容（纯文本或HTML）
  isPublished: boolean;
  showInFooter: boolean;  // 是否在页脚导航显示
  createdAt: string;
  updatedAt: string;
}

export interface BundleOffer {
  id: string;
  mainProductId: string;  // 主商品ID
  bundleTitle: string;  // 组合标题，如 "BUNDLE DEAL"
  bundleProductId: string;  // 组合商品ID（另一个商品）
  bundleProductName?: string;  // 组合商品名称（用于显示）
  bundleProductImage?: string;  // 组合商品图片
  originalTotalPrice: number;  // 原始总价（主商品+组合商品）
  bundlePrice: number;  // 组合优惠价
  discountPercent: number;  // 折扣百分比
  isActive: boolean;  // 是否启用
  createdAt: string;
  updatedAt: string;
}

// 订单相关类型
export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;  // 订单号，如 ORD-20240101-001
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;  // 商品小计
  shippingFee: number;  // 运费
  tax: number;  // 税费
  total: number;  // 总计
  currency: string;  // 货币类型
  paymentMethod: 'PAYPAL' | 'CARD' | 'OTHER';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  orderStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  trackingNumber?: string;  // 物流单号
  paypalOrderId?: string;  // PayPal订单ID
  notes?: string;  // 订单备注
  createdAt: string;
  updatedAt: string;
}

// 分类结构
export interface Category {
  name: string;  // 主分类名称，如 "DILDOS"
  subcategories: string[];  // 二级分类，如 ["Realistic", "Fantasy", ...]
  homeImage?: string;  // 首页分类卡片图片（可选）
}

export interface StoreConfig {
  storeName: string;
  shopName?: string;
  logoType?: 'TEXT' | 'IMAGE';
  logoImage?: string;
  marqueeText?: string;
  contactEmail?: string;
  heroSlides: HeroSlide[];
  sectors: SectorCard[];
  categories: string[];  // 关于待兼容，保留旧字段
  categoryTree?: Category[];  // 新增：支持二级分类
  customPages?: CustomPage[];  // 自定义页面列表
  bundleOffers?: BundleOffer[];  // 商品组合列表
  
  // 运费设置
  shippingConfig?: {
    type: 'FREE' | 'FIXED' | 'THRESHOLD';  // 免费 | 固定运费 | 满额免运费
    fixedAmount?: number;  // 固定运费金额
    freeShippingThreshold?: number;  // 满多少免运费
  };
  
  // PayPal 支付设置
  paypalConfig?: {
    clientId?: string;  // PayPal Client ID
    mode?: 'sandbox' | 'production';  // 沙箱环境 | 生产环境
    enabled?: boolean;  // 是否启用 PayPal 支付
  };
  
  // 批量折扣设置
  volumeDiscountConfig?: {
    enabled?: boolean;  // 是否启用批量折扣
    tiers?: Array<{
      qty: number;  // 购买数量
      discount: number;  // 折扣百分比 (0-100)
      label: string;  // 显示标签
    }>;
  };
  
  // 首页组件配置
  brandValues?: Array<{
    icon: string;  // 图标URL，推荐尺寸: 128x128px
    title: string;
    description: string;
  }>;
  
  socialVideos?: Array<{
    id: string;
    videoUrl: string;  // 视频URL，推荐尺寸: 1080x1920px (竖屏 9:16)
    thumbnail: string;  // 缩略图URL，推荐尺寸: 540x960px
    title: string;
    linkProductId?: string;  // 关联商品ID
  }>;
}