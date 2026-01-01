import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 商品API
export const productsAPI = {
  // 获取所有商品
  getAll: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // 创建商品
  create: async (product: any) => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
    
    if (error) throw error
    return data?.[0]
  },

  // 更新商品
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data?.[0]
  },

  // 删除商品
  delete: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // 批量删除
  bulkDelete: async (ids: string[]) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', ids)
    
    if (error) throw error
  }
}

// 认证API
export const authAPI = {
  // 登录
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // 登出
  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 获取当前用户
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 检查是否已登录
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  }
}

// 配置 API
export const configAPI = {
  // 获取商店配置
  get: async () => {
    const { data, error } = await supabase
      .from('store_config')
      .select('*')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    // 转换 snake_case 到 camelCase
    if (data) {
      return {
        storeName: data.store_name,
        shopName: data.shop_name,
        logoType: data.logo_type,
        logoImage: data.logo_image,
        marqueeText: data.marquee_text,
        contactEmail: data.contact_email,
        heroSlides: data.hero_slides || [],
        sectors: data.sectors || [],
        categories: data.categories || [],
        categoryTree: data.category_tree || [],
        customPages: data.custom_pages || [],
        bundleOffers: data.bundle_offers || [],
        shippingConfig: data.shipping_config,
        paypalConfig: data.paypal_config,
        volumeDiscountConfig: data.volume_discount_config,
        brandValues: data.brand_values || [],
        socialVideos: data.social_videos || []
      }
    }
    
    return {}
  },

  // 更新配置
  update: async (config: any) => {
    // 转换 camelCase 到 snake_case
    const dbConfig = {
      store_name: config.storeName,
      shop_name: config.shopName,
      logo_type: config.logoType,
      logo_image: config.logoImage,
      marquee_text: config.marqueeText,
      contact_email: config.contactEmail,
      hero_slides: config.heroSlides || [],
      sectors: config.sectors || [],
      categories: config.categories || [],
      category_tree: config.categoryTree || [],
      custom_pages: config.customPages || [],
      bundle_offers: config.bundleOffers || [],
      shipping_config: config.shippingConfig,
      paypal_config: config.paypalConfig,
      volume_discount_config: config.volumeDiscountConfig,
      brand_values: config.brandValues || [],
      social_videos: config.socialVideos || []
    };
    
    const { data: existing } = await supabase
      .from('store_config')
      .select('id')
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('store_config')
        .update({ ...dbConfig, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
      
      if (error) throw error
      return data[0]
    } else {
      const { data, error } = await supabase
        .from('store_config')
        .insert([dbConfig])
        .select()
      
      if (error) throw error
      return data[0]
    }
  }
}

// 转换 snake_case 到 camelCase
const convertOrder = (dbOrder: any) => {
  if (!dbOrder) return null;
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    customerEmail: dbOrder.customer_email,
    customerName: dbOrder.customer_name,
    customerPhone: dbOrder.customer_phone,
    shippingAddress: dbOrder.shipping_address,
    items: dbOrder.items,
    subtotal: dbOrder.subtotal,
    shippingFee: dbOrder.shipping_fee,
    tax: dbOrder.tax,
    total: dbOrder.total,
    currency: dbOrder.currency,
    paymentMethod: dbOrder.payment_method,
    paymentStatus: dbOrder.payment_status,
    orderStatus: dbOrder.order_status,
    trackingNumber: dbOrder.tracking_number,
    paypalOrderId: dbOrder.paypal_order_id,
    notes: dbOrder.notes,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at
  };
};

// 转换 camelCase 到 snake_case
const convertToDb = (order: any) => {
  return {
    order_number: order.orderNumber,
    customer_email: order.customerEmail,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    shipping_address: order.shippingAddress,
    items: order.items,
    subtotal: order.subtotal,
    shipping_fee: order.shippingFee,
    tax: order.tax,
    total: order.total,
    currency: order.currency,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    tracking_number: order.trackingNumber,
    paypal_order_id: order.paypalOrderId,
    notes: order.notes
  };
};

// 订单API
export const ordersAPI = {
  // 获取所有订单
  getAll: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(convertOrder)
  },

  // 根据ID获取订单
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return convertOrder(data)
  },

  // 创建订单
  create: async (order: any) => {
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
    
    if (error) throw error
    return convertOrder(data?.[0])
  },

  // 更新订单
  update: async (id: string, updates: any) => {
    const dbUpdates = convertToDb(updates);
    const { data, error } = await supabase
      .from('orders')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return convertOrder(data?.[0])
  },

  // 删除订单
  delete: async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // 根据邮箱查询订单
  getByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(convertOrder)
  },

  // 根据订单号查询
  getByOrderNumber: async (orderNumber: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()
    
    if (error) throw error
    return convertOrder(data)
  }
}
