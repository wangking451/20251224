// 全站翻译字典
export const translations: Record<string, Record<string, string>> = {
  // Navigation & Menu
  'Shop': { zh: '商城', ja: 'ショップ', ko: '상점', es: 'Tienda', fr: 'Boutique', de: 'Geschäft', ru: 'Магазин', pt: 'Loja', it: 'Negozio' },
  'Cart': { zh: '购物车', ja: 'カート', ko: '장바구니', es: 'Carrito', fr: 'Panier', de: 'Warenkorb', ru: 'Корзина', pt: 'Carrinho', it: 'Carrello' },
  'Home': { zh: '首页', ja: 'ホーム', ko: '홈', es: 'Inicio', fr: 'Accueil', de: 'Startseite', ru: 'Главная', pt: 'Início', it: 'Home' },
  'All Products': { zh: '所有商品', ja: '全商品', ko: '모든 제품', es: 'Todos los productos', fr: 'Tous les produits', de: 'Alle Produkte', ru: 'Все товары', pt: 'Todos os produtos', it: 'Tutti i prodotti' },
  'Best Sellers': { zh: '畅销商品', ja: 'ベストセラー', ko: '베스트셀러', es: 'Más vendidos', fr: 'Meilleures ventes', de: 'Bestseller', ru: 'Бестселлеры', pt: 'Mais vendidos', it: 'Più venduti' },
  'Gift Cards': { zh: '礼品卡', ja: 'ギフトカード', ko: '기프트카드', es: 'Tarjetas regalo', fr: 'Cartes cadeaux', de: 'Geschenkkarten', ru: 'Подарочные карты', pt: 'Cartões presente', it: 'Buoni regalo' },
  'Lookbook': { zh: '商品展示', ja: 'ルックブック', ko: '룩북', es: 'Catálogo', fr: 'Catalogue', de: 'Katalog', ru: 'Каталог', pt: 'Catálogo', it: 'Catalogo' },
  
  // Customer Care
  'Customer Care': { zh: '客户服务', ja: 'カスタマーケア', ko: '고객 서비스', es: 'Atención al cliente', fr: 'Service client', de: 'Kundenservice', ru: 'Поддержка', pt: 'Atendimento', it: 'Assistenza' },
  'Order Tracking': { zh: '订单查询', ja: '注文追跡', ko: '주문 추적', es: 'Seguimiento de pedido', fr: 'Suivi de commande', de: 'Sendungsverfolgung', ru: 'Отслеживание заказа', pt: 'Rastreamento', it: 'Tracciamento ordine' },
  'FAQ': { zh: '常见问题', ja: 'よくある質問', ko: '자주 묻는 질문', es: 'Preguntas frecuentes', fr: 'Questions fréquentes', de: 'Häufige Fragen', ru: 'Частые вопросы', pt: 'Perguntas frequentes', it: 'Domande frequenti' },
  'Shipping & Delivery': { zh: '运送与配送', ja: '配送', ko: '배송', es: 'Envío y entrega', fr: 'Livraison', de: 'Versand', ru: 'Доставка', pt: 'Envio', it: 'Spedizione' },
  'Returns & Exchanges': { zh: '退货与换货', ja: '返品・交換', ko: '반품 및 교환', es: 'Devoluciones', fr: 'Retours et échanges', de: 'Rücksendungen', ru: 'Возврат и обмен', pt: 'Devoluções', it: 'Resi e cambi' },
  'Contact Us': { zh: '联系我们', ja: 'お問い合わせ', ko: '문의하기', es: 'Contacto', fr: 'Nous contacter', de: 'Kontakt', ru: 'Связаться', pt: 'Contato', it: 'Contattaci' },
  
  // Actions
  'Add to Cart': { zh: '加入购物车', ja: 'カートに追加', ko: '장바구니에 추가', es: 'Añadir al carrito', fr: 'Ajouter au panier', de: 'In den Warenkorb', ru: 'Добавить в корзину', pt: 'Adicionar ao carrinho', it: 'Aggiungi al carrello' },
  'Buy Now': { zh: '立即购买', ja: '今すぐ購入', ko: '바로 구매', es: 'Comprar ahora', fr: 'Acheter maintenant', de: 'Jetzt kaufen', ru: 'Купить сейчас', pt: 'Comprar agora', it: 'Acquista ora' },
  'Checkout': { zh: '结账', ja: 'レジに進む', ko: '결제', es: 'Pagar', fr: 'Passer commande', de: 'Zur Kasse', ru: 'Оформить заказ', pt: 'Finalizar compra', it: 'Checkout' },
  'Continue Shopping': { zh: '继续购物', ja: '買い物を続ける', ko: '계속 쇼핑하기', es: 'Seguir comprando', fr: 'Continuer les achats', de: 'Weiter einkaufen', ru: 'Продолжить покупки', pt: 'Continuar comprando', it: 'Continua lo shopping' },
  'View Cart': { zh: '查看购物车', ja: 'カートを見る', ko: '장바구니 보기', es: 'Ver carrito', fr: 'Voir le panier', de: 'Warenkorb ansehen', ru: 'Посмотреть корзину', pt: 'Ver carrinho', it: 'Vedi carrello' },
  'Remove': { zh: '移除', ja: '削除', ko: '삭제', es: 'Eliminar', fr: 'Supprimer', de: 'Entfernen', ru: 'Удалить', pt: 'Remover', it: 'Rimuovi' },
  'Search': { zh: '搜索', ja: '検索', ko: '검색', es: 'Buscar', fr: 'Rechercher', de: 'Suchen', ru: 'Поиск', pt: 'Pesquisar', it: 'Cerca' },
  'Close': { zh: '关闭', ja: '閉じる', ko: '닫기', es: 'Cerrar', fr: 'Fermer', de: 'Schließen', ru: 'Закрыть', pt: 'Fechar', it: 'Chiudi' },
  
  // Product & Cart
  'Total': { zh: '总计', ja: '合計', ko: '총계', es: 'Total', fr: 'Total', de: 'Gesamt', ru: 'Итого', pt: 'Total', it: 'Totale' },
  'Subtotal': { zh: '小计', ja: '小計', ko: '소계', es: 'Subtotal', fr: 'Sous-total', de: 'Zwischensumme', ru: 'Промежуточный итог', pt: 'Subtotal', it: 'Subtotale' },
  'Price': { zh: '价格', ja: '価格', ko: '가격', es: 'Precio', fr: 'Prix', de: 'Preis', ru: 'Цена', pt: 'Preço', it: 'Prezzo' },
  'Quantity': { zh: '数量', ja: '数量', ko: '수량', es: 'Cantidad', fr: 'Quantité', de: 'Menge', ru: 'Количество', pt: 'Quantidade', it: 'Quantità' },
  'Category': { zh: '分类', ja: 'カテゴリー', ko: '카테고리', es: 'Categoría', fr: 'Catégorie', de: 'Kategorie', ru: 'Категория', pt: 'Categoria', it: 'Categoria' },
  'Your cart is empty': { zh: '购物车为空', ja: 'カートが空です', ko: '장바구니가 비어있습니다', es: 'Tu carrito está vacío', fr: 'Votre panier est vide', de: 'Ihr Warenkorb ist leer', ru: 'Ваша корзина пуста', pt: 'Seu carrinho está vazio', it: 'Il tuo carrello è vuoto' },
  'item': { zh: '件', ja: '点', ko: '개', es: 'artículo', fr: 'article', de: 'Artikel', ru: 'товар', pt: 'item', it: 'articolo' },
  'items': { zh: '件', ja: '点', ko: '개', es: 'artículos', fr: 'articles', de: 'Artikel', ru: 'товаров', pt: 'itens', it: 'articoli' },
  
  // Settings
  'Settings': { zh: '设置', ja: '設定', ko: '설정', es: 'Configuración', fr: 'Paramètres', de: 'Einstellungen', ru: 'Настройки', pt: 'Configurações', it: 'Impostazioni' },
  'Save Settings': { zh: '保存设置', ja: '保存', ko: '저장', es: 'Guardar', fr: 'Enregistrer', de: 'Speichern', ru: 'Сохранить', pt: 'Salvar', it: 'Salva' },
  'Cancel': { zh: '取消', ja: 'キャンセル', ko: '취소', es: 'Cancelar', fr: 'Annuler', de: 'Abbrechen', ru: 'Отмена', pt: 'Cancelar', it: 'Annulla' },
  'Newsletter': { zh: '新闻通讯', ja: 'ニュースレター', ko: '뉴스레터', es: 'Boletín', fr: 'Newsletter', de: 'Newsletter', ru: 'Рассылка', pt: 'Newsletter', it: 'Newsletter' },
  'Subscribe': { zh: '订阅', ja: '購読', ko: '구독', es: 'Suscribirse', fr: "S'abonner", de: 'Abonnieren', ru: 'Подписаться', pt: 'Assinar', it: 'Iscriviti' },
  
  // Common messages
  'Added to cart': { zh: '已加入购物车', ja: 'カートに追加しました', ko: '장바구니에 추가되었습니다', es: 'Añadido al carrito', fr: 'Ajouté au panier', de: 'Zum Warenkorb hinzugefügt', ru: 'Добавлено в корзину', pt: 'Adicionado ao carrinho', it: 'Aggiunto al carrello' },
  'Loading...': { zh: '加载中...', ja: '読み込み中...', ko: '로딩 중...', es: 'Cargando...', fr: 'Chargement...', de: 'Laden...', ru: 'Загрузка...', pt: 'Carregando...', it: 'Caricamento...' },
  'No products found': { zh: '未找到商品', ja: '商品が見つかりません', ko: '제품을 찾을 수 없습니다', es: 'No se encontraron productos', fr: 'Aucun produit trouvé', de: 'Keine Produkte gefunden', ru: 'Товары не найдены', pt: 'Nenhum produto encontrado', it: 'Nessun prodotto trovato' },
};

// Translation helper function
export const t = (key: string, lang: string = 'en'): string => {
  if (lang === 'en') return key;
  return translations[key]?.[lang] || key;
};

// Get currency symbol
export const getCurrencySymbol = (currency: string): string => {
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
    'SEK': 'kr',
    'NOK': 'kr',
    'NZD': 'NZ$',
    'MXN': '$',
    'BRL': 'R$',
    'INR': '₹',
    'RUB': '₽',
    'THB': '฿',
    'AED': 'د.إ',
  };
  return symbols[currency] || currency;
};
