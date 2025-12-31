import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, X, ArrowRight, Zap, Play, Disc, Music, Search, Radio, Rewind, FastForward, Sliders, Monitor, Globe, ChevronDown, ChevronLeft, ChevronRight, Star, Activity, Heart, Truck, Shield, Cpu, Terminal, MessageSquare, ExternalLink, CheckCircle, Package, Lock, CreditCard, ChevronUp, Facebook, Instagram, Twitter, Loader2, MapPin, Mail, User, Bitcoin, Filter, Layers, Timer, Plus, Minus, ThumbsUp, MessageCircle, Tag, Menu, HelpCircle, Send, Box, RefreshCw, Camera, Radar, FileText, FileKey, Smartphone, QrCode, Wallet, DollarSign, Trash2, Film, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Product, CartItem, ViewState, StoreConfig } from './types';
import { REVIEWS_MOCK } from './products';
import { fetchProducts, createCheckoutSession } from './services/api';
import { AdminDashboard } from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { translate, LANGUAGE_CODES } from './services/translation';
import { convertPrice, formatPrice } from './services/exchangeRate';
import { isAdminAuthenticated, clearAdminSession, setAdminSession } from './utils/auth';
import { productsAPI } from './services/supabase';

// API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AWpU3pWBDzw9f0otzwofJphfLltTn7fsu9ZHjisxHM-MRXvVm3zQaMXbLh4GFTeZtv40l9D0mX4l4tmA';
const PAYPAL_MODE = import.meta.env.VITE_PAYPAL_MODE || 'sandbox';

// --- CONSTANTS & DATA ---

// UI翻译数据
const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  'TERMINAL': { ja: 'ターミナル', es: 'TERMINAL', de: 'TERMINAL', ru: 'ТЕРМИНАЛ', ko: '터미널' },
  'SHOP': { ja: 'ショップ', es: 'TIENDA', de: 'LADEN', ru: 'МАГАЗИН', ko: '상점' },
  'LOOKBOOK': { ja: 'ルックブック', es: 'LOOKBOOK', de: 'LOOKBOOK', ru: 'LOOKBOOK', ko: '룩북' },
  'BLOG': { ja: 'ブログ', es: 'BLOG', de: 'BLOG', ru: 'БЛОГ', ko: '블로그' },
  'CONTACT': { ja: 'お問い合わせ', es: 'CONTACTO', de: 'KONTAKT', ru: 'КОНТАКТ', ko: '문의' },
  'VIBES': { ja: 'バイブ', es: 'VIBRADORES', de: 'VIBRATOREN', ru: 'ВИБРАТОРЫ', ko: '바이브레이터' },
  'DILDOS': { ja: 'ディルド', es: 'CONSOLADORES', de: 'DILDOS', ru: 'ФАЛЛОИМИТАТОРЫ', ko: '딜도' },
  'ANAL': { ja: 'アナル', es: 'ANAL', de: 'ANAL', ru: 'АНАЛЬНЫЕ', ko: '애널' },
  'MALE': { ja: 'メンズ', es: 'MASCULINO', de: 'MÄNNLICH', ru: 'МУЖСКОЕ', ko: '남성용' },
  'BONDAGE': { ja: 'ボンデージ', es: 'BONDAGE', de: 'BONDAGE', ru: 'БОНДАЖ', ko: '본디지' },
  'LINGERIE': { ja: 'ランジェリー', es: 'LENCERÍA', de: 'DESSOUS', ru: 'БЕЛЬЕ', ko: '란제리' },
  'FLUIDS': { ja: '潤滑剤', es: 'LUBRICANTES', de: 'GLEITMITTEL', ru: 'СМАЗКИ', ko: '윤활제' },
  'NEW DROP': { ja: '新着', es: 'NUEVO', fr: 'NOUVEAU', de: 'NEU', ru: 'НОВИНКА', ko: '신상품', pt: 'NOVO', nl: 'NIEUW', sv: 'NYT', ar: 'جديد', hi: 'नया', id: 'BARU' },
  'INVENTORY': { ja: 'カート', es: 'CARRITO', fr: 'PANIER', de: 'WARENKORB', ru: 'КОРЗИНА', ko: '장바구니', pt: 'CARRINHO', nl: 'WINKELWAGEN', sv: 'VARUKORG', ar: 'سلة', hi: 'कार्ट', id: 'KERANJANG' },
  'System Empty': { ja: '空', es: 'Vacío', fr: 'Vide', de: 'Leer', ru: 'Пусто', ko: '비어있음', pt: 'Vazio', nl: 'Leeg', sv: 'Tom', ar: 'فارغ', hi: 'खाली', id: 'Kosong' },
  'PROCEED TO CHECKOUT': { ja: 'チェックアウト', es: 'PAGAR', fr: 'COMMANDER', de: 'ZUR KASSE', ru: 'ОФОРМИТЬ', ko: '결제', pt: 'FINALIZAR', nl: 'AFREKENEN', sv: 'TILL KASSAN', ar: 'إتمام الطلب', hi: 'कैशेकआउट', id: 'CHECKOUT' },
  'ADDED TO SYSTEM': { ja: '追加されました', es: 'AÑADIDO', fr: 'AJOUTÉ', de: 'HINZUGEFÜGT', ru: 'ДОБАВЛЕНО', ko: '추가됨', pt: 'ADICIONADO', nl: 'TOEGEVOEGD', sv: 'TILLAGD', ar: 'مضاف', hi: 'जोड़ा गया', id: 'DITAMBAHKAN' },
  'ALL': { ja: 'すべて', es: 'TODO', fr: 'TOUT', de: 'ALLE', ru: 'ВСЕ', ko: '전체', pt: 'TODOS', nl: 'ALLES', sv: 'ALLA', ar: 'الكل', hi: 'सभी', id: 'SEMUA' },
  'WHAT CUSTOMERS SAY': { ja: 'カスタマーレビュー', es: 'LO QUE DICEN LOS CLIENTES', de: 'KUNDENMEINUNGEN', ru: 'ОТЗЫВЫ КЛИЕНТОВ', ko: '고객 후기' },
  'REAL FEEDBACK FROM VERIFIED BUYERS': { ja: '認証済み購入者の実際のフィードバック', es: 'Comentarios reales de compradores verificados', de: 'Echtes Feedback von verifizierten Käufern', ru: 'Реальные отзывы проверенных покупателей', ko: '검증된 구매자의 실제 피드백' },
  'VERIFIED': { ja: '認証済み', es: 'VERIFICADO', de: 'VERIFIZIERT', ru: 'ПРОВЕРЕНО', ko: '인증됨' },
  'JOIN 1143+ SATISFIED USERS': { ja: '1143人以上の満足したユーザーに参加', es: 'ÚNETE A MÁS DE 1143 USUARIOS SATISFECHOS', de: 'SCHLIESSEN SIE SICH 1143+ ZUFRIEDENEN NUTZERN AN', ru: 'ПРИСОЕДИНЯЙТЕСЬ К 1143+ ДОВОЛЬНЫМ ПОЛЬЗОВАТЕЛЯМ', ko: '1143명 이상의 만족한 사용자와 함께하세요' },
  'SHARE YOUR EXPERIENCE': { ja: 'あなたの体験をシェア', es: 'COMPARTE TU EXPERIENCIA', de: 'TEILEN SIE IHRE ERFAHRUNG', ru: 'ПОДЕЛИТЕСЬ ОПЫТОМ', ko: '경험 공유하기' },
  // FAQ
  'Are shipments discreet?': { ja: '発送は目立たないですか？', es: '¿Los envíos son discretos?', de: 'Sind Sendungen diskret?', ru: 'Доставка конфиденциальна?', ko: '배송이 비밀스럽나요?' },
  'Is my data secure?': { ja: 'データは安全ですか？', es: '¿Mis datos están seguros?', de: 'Sind meine Daten sicher?', ru: 'Мои данные в безопасности?', ko: '내 데이터는 안전한가요?' },
  'What is the return policy?': { ja: '返品ポリシーは？', es: '¿Cuál es la política de devoluciones?', de: 'Was ist die Rückgaberichtlinie?', ru: 'Какова политика возврата?', ko: '반품 정책은 무엇인가요?' },
  'How fast is shipping?': { ja: '配送はどのくらい早いですか？', es: '¿Qué tan rápido es el envío?', de: 'Wie schnell ist der Versand?', ru: 'Как быстро доставка?', ko: '배송은 얼마나 빠른가요?' },
  'What payment methods do you accept?': { ja: 'どの支払い方法を受け付けていますか？', es: '¿Qué métodos de pago aceptan?', de: 'Welche Zahlungsmethoden akzeptieren Sie?', ru: 'Какие способы оплаты вы принимаете?', ko: '어떤 결제 방법을 받나요?' },
  // Footer
  'MAINFRAME': { ja: 'メインフレーム', es: 'MARCO PRINCIPAL', de: 'HAUPTRAHMEN', ru: 'ГЛАВНЫЙ ФРЕЙМ', ko: '메인프레임' },
  'SUPPORT NODE': { ja: 'サポートノード', es: 'NODO DE SOPORTE', de: 'SUPPORT-KNOTEN', ru: 'УЗЕЛ ПОДДЕРЖКИ', ko: '지원 노드' },
  'ENCRYPT_FEED': { ja: '暗号化フィード', es: 'FEED ENCRIPTADO', de: 'VERSCHLÜSSELTER FEED', ru: 'ЗАШИФРОВАННАЯ ЛЕНТА', ko: '암호화 피드' },
  'All Products': { ja: 'すべての製品', es: 'Todos los productos', de: 'Alle Produkte', ru: 'Все товары', ko: '모든 제품' },
  'Best Sellers': { ja: 'ベストセラー', es: 'Más vendidos', de: 'Bestseller', ru: 'Бестселлеры', ko: '베스트셀러' },
  'Gift Cards': { ja: 'ギフトカード', es: 'Tarjetas de regalo', de: 'Geschenkkarten', ru: 'Подарочные карты', ko: '기프트 카드' },
  'Order Tracking (Signal)': { ja: '注文追跡（信号）', es: 'Seguimiento de pedidos', de: 'Auftragsverfolgung', ru: 'Отслеживание заказа', ko: '주문 추적' },
  'FAQ Database': { ja: 'FAQデータベース', es: 'Base de datos de preguntas frecuentes', de: 'FAQ-Datenbank', ru: 'База FAQ', ko: 'FAQ 데이터베이스' },
  'Shipping Protocol': { ja: '配送プロトコル', es: 'Protocolo de envío', de: 'Versandprotokoll', ru: 'Протокол доставки', ko: '배송 프로토콜' },
  'Returns & Exchanges': { ja: '返品と交換', es: 'Devoluciones e intercambios', de: 'Rücksendungen & Umtausch', ru: 'Возвраты и обмены', ko: '반품 및 교환' },
  'Contact Uplink': { ja: 'アップリンクに連絡', es: 'Contactar enlace', de: 'Kontakt Uplink', ru: 'Связаться с Uplink', ko: '연락하기' },
  'Join 50,000+ nodes receiving exclusive drops.': { ja: '50,000以上のノードが独占的なドロップを受信しています。', es: 'Únete a más de 50,000 nodos que reciben lanzamientos exclusivos.', de: 'Schließen Sie sich 50.000+ Knoten an, die exklusive Drops erhalten.', ru: 'Присоединяйтесь к 50 000+ узлам, получающим эксклюзивные новинки.', ko: '독점 드롭을 받는 50,000개 이상의 노드에 가입하세요.' },
  'Subscribe': { ja: '購読する', es: 'Suscribirse', de: 'Abonnieren', ru: 'Подписаться', ko: '구독하기' },
  'SUBSCRIBE': { ja: '購読', es: 'SUSCRIBIRSE', de: 'ABONNIEREN', ru: 'ПОДПИСАТЬСЯ', ko: '구독' },
  // LIVE FEED
  'LIVE FEED': { ja: 'ライブフィード', es: 'TRANSMISIÓN EN VIVO', de: 'LIVE-FEED', ru: 'ПРЯМОЙ ЭФИР', ko: '라이브 피드' },
  'NEBULA': { ja: 'ネビュラ', es: 'NEBULOSA', de: 'NEBEL', ru: 'НЕБУЛА', ko: '네뷔라' },
  'STREAM': { ja: 'ストリーム', es: 'TRANSMISIÓN', de: 'STREAM', ru: 'ПОТОК', ko: '스트림' },
  'Trending Now': { ja: 'トレンド', es: 'Tendencias', de: 'Trending', ru: 'Тренды', ko: '트렌드' },
  'Global Sync': { ja: 'グローバル同期', es: 'Sincronización global', de: 'Globale Synchronisierung', ru: 'Глобальная синхронизация', ko: '글로벌 동기화' },
  // Flash Sale
  'Flash Sale Active': { ja: 'フラッシュセール開催中', es: 'Venta Flash Activa', de: 'Flash-Sale aktiv', ru: 'Флэш-распродажа активна', ko: '플래시 세일 진행 중' },
  'Up to 20% off on bulk orders': { ja: 'まとめ買いで最大20%OFF', es: 'Hasta 20% de descuento en pedidos al por mayor', de: 'Bis zu 20% Rabatt auf Großbestellungen', ru: 'Скидка до 20% на оптовые заказы', ko: '대량 주문시 최대 20% 할인' },
  // Category Section
  'SHOP BY': { ja: 'カテゴリーで', es: 'COMPRAR POR', de: 'EINKAUFEN NACH', ru: 'ПОКУПАТЬ ПО', ko: '카테고리별' },
  'CATEGORY': { ja: 'カテゴリー', es: 'CATEGORÍA', de: 'KATEGORIE', ru: 'КАТЕГОРИИ', ko: '쇼핑' },
  // Top Banner
  'NEURAL LINK ESTABLISHED': { ja: 'ニューラルリンク確立', es: 'ENLACE NEURAL ESTABLECIDO', fr: 'LIAISON NEURALE ÉTABLIE', de: 'NEURALE VERBINDUNG HERGESTELLT', ru: 'НЕЙРОСВЯЗЬ УСТАНОВЛЕНА', ko: '뉴럴 링크 확립', pt: 'LINK NEURAL ESTABELECIDO', nl: 'NEURALE LINK GEMAAKT', sv: 'NEURAL LÄNK UPPRÄTTAD', ar: 'تم إنشاء الرابط العصبي', hi: 'न्यूरल लिंक स्थापित', id: 'TAUTAN NEURAL DIBUAT' },
  'SECURE CONNECTION': { ja: '安全な接続', es: 'CONEXIÓN SEGURA', fr: 'CONNEXION SÉCURISÉE', de: 'SICHERE VERBINDUNG', ru: 'ЗАЩИЩЕННОЕ СОЕДИНЕНИЕ', ko: '보안 연결', pt: 'CONEXÃO SEGURA', nl: 'VEILIGE VERBINDING', sv: 'SÄKER ANSLUTNING', ar: 'اتصال آمن', hi: 'सुरक्षित कनेक्शन', id: 'KONEKSI AMAN' },
  'FREE SHIPPING ON ORDERS': { ja: '注文で送料無料', es: 'ENVÍO GRATIS EN PEDIDOS', fr: 'LIVRAISON GRATUITE SUR COMMANDES', de: 'KOSTENLOSER VERSAND AB', ru: 'БЕСПЛАТНАЯ ДОСТАВКА НА ЗАКАЗЫ', ko: '무료 배송', pt: 'FRETE GRÁTIS EM PEDIDOS', nl: 'GRATIS VERZENDING BIJ BESTELLINGEN', sv: 'FRI FRAKT PÅ BESTÄLLNINGAR', ar: 'شحن مجاني على الطلبات', hi: 'ऑर्डर पर मुफ्त शिपिंग', id: 'GRATIS ONGKIR UNTUK PESANAN' },
  // Buttons & Actions  
  'Shop Now': { ja: '今すぐ購入', es: 'Comprar ahora', fr: 'Acheter maintenant', de: 'Jetzt einkaufen', ru: 'Купить сейчас', ko: '지금 구매', pt: 'Compre agora', nl: 'Nu winkelen', sv: 'Handla nu', ar: 'تسوق الآن', hi: 'अभी खरीदें', id: 'Belanja Sekarang' },
  'SHOP NOW': { ja: '今すぐ購入', es: 'COMPRAR AHORA', fr: 'ACHETER MAINTENANT', de: 'JETZT EINKAUFEN', ru: 'КУПИТЬ СЕЙЧАС', ko: '지금 구매', pt: 'COMPRE AGORA', nl: 'NU WINKELEN', sv: 'HANDLA NU', ar: 'تسوق الآن', hi: 'अभी खरीदें', id: 'BELANJA SEKARANG' },
  'NEW_DROPS': { ja: '新着', es: 'NUEVOS LANZAMIENTOS', fr: 'NOUVEAUTÉS', de: 'NEUE ARTIKEL', ru: 'НОВИНКИ', ko: '신제품', pt: 'NOVIDADES', nl: 'NIEUWE ITEMS', sv: 'NYHETER', ar: 'إصدارات جديدة', hi: 'नए आइटम', id: 'PRODUK BARU' },
  'Showing': { ja: '表示中', es: 'Mostrando', fr: 'Affichage', de: 'Zeige', ru: 'Показано', ko: '표시 중', pt: 'Mostrando', nl: 'Weergave', sv: 'Visar', ar: 'عرض', hi: 'दिखा रहा है', id: 'Menampilkan' },
  'RESET FILTERS': { ja: 'フィルターをリセット', es: 'RESTABLECER FILTROS', fr: 'RÉINITIALISER LES FILTRES', de: 'FILTER ZURÜCKSETZEN', ru: 'СБРОСИТЬ ФИЛЬТРЫ', ko: '필터 초기화', pt: 'REDEFINIR FILTROS', nl: 'FILTERS RESETTEN', sv: 'ÅTERSTÄLL FILTER', ar: 'إعادة تعيين الفلاتر', hi: 'फ़िल्टर रीसेट करें', id: 'RESET FILTER' },
  'BROWSE COLLECTION': { ja: 'コレクションを閲覧', es: 'EXPLORAR COLECCIÓN', fr: 'PARCOURIR LA COLLECTION', de: 'KOLLEKTION DURCHSUCHEN', ru: 'ОБЗОР КОЛЛЕКЦИИ', ko: '컨렉션 둘러보기', pt: 'EXPLORAR COLEÇÃO', nl: 'COLLECTIE VERKENNEN', sv: 'BLÄDDRA I SAMLINGEN', ar: 'تصفح المجموعة', hi: 'कलेक्शन ब्राउज़ करें', id: 'JELAJAHI KOLEKSI' },
  'ALL PRODUCTS': { ja: 'すべての製品', es: 'TODOS LOS PRODUCTOS', fr: 'TOUS LES PRODUITS', de: 'ALLE PRODUKTE', ru: 'ВСЕ ТОВАРЫ', ko: '모든 제품', pt: 'TODOS OS PRODUTOS', nl: 'ALLE PRODUCTEN', sv: 'ALLA PRODUKTER', ar: 'جميع المنتجات', hi: 'सभी उत्पाद', id: 'SEMUA PRODUK' },
  'items available': { ja: '商品が利用可能', es: 'artículos disponibles', fr: 'articles disponibles', de: 'Artikel verfügbar', ru: 'товаров доступно', ko: '개 상품 사용 가능', pt: 'itens disponíveis', nl: 'items beschikbaar', sv: 'artiklar tillgängliga', ar: 'عنصر متاح', hi: 'आइटम उपलब्ध', id: 'item tersedia' },
  'NEW ARRIVALS': { ja: '新着', es: 'NUEVOS PRODUCTOS', fr: 'NOUVEAUTÉS', de: 'NEUHEITEN', ru: 'НОВИНКИ', ko: '신상품', pt: 'NOVIDADES', nl: 'NIEUWE ARTIKELEN', sv: 'NYHETER', ar: 'الوصول الجديد', hi: 'नए आगमन', id: 'PRODUK BARU' },
  // Additional UI text
  'View All Assets': { ja: 'すべて表示', es: 'Ver todos', fr: 'Voir tout', de: 'Alle anzeigen', ru: 'Показать все', ko: '전체 보기', pt: 'Ver tudo', nl: 'Alles bekijken', sv: 'Visa alla', ar: 'عرض الكل', hi: 'सभी देखें', id: 'Lihat Semua' },
  'Load More Products': { ja: 'もっと読み込む', es: 'Cargar más', fr: 'Charger plus', de: 'Mehr laden', ru: 'Загрузить еще', ko: '더 보기', pt: 'Carregar mais', nl: 'Meer laden', sv: 'Ladda fler', ar: 'تحميل المزيد', hi: 'और लोड करें', id: 'Muat Lebih Banyak' },
  'NO DATA FOUND': { ja: 'データなし', es: 'NO HAY DATOS', fr: 'AUCUNE DONNÉE', de: 'KEINE DATEN', ru: 'ДАННЫХ НЕТ', ko: '데이터 없음', pt: 'NENHUM DADO', nl: 'GEEN GEGEVENS', sv: 'INGA DATA', ar: 'لا توجد بيانات', hi: 'कोई डेटा नहीं', id: 'TIDAK ADA DATA' },
  'No products in this category yet.': { ja: 'このカテゴリには商品がまだありません。', es: 'No hay productos en esta categoría todavía.', fr: 'Aucun produit dans cette catégorie pour le moment.', de: 'Noch keine Produkte in dieser Kategorie.', ru: 'В этой категории пока нет товаров.', ko: '아직 이 카테고리에 제품이 없습니다.', pt: 'Ainda não há produtos nesta categoria.', nl: 'Nog geen producten in deze categorie.', sv: 'Inga produkter i denna kategori ännu.', ar: 'لا توجد منتجات في هذه الفئة حتى الآن.', hi: 'इस श्रेणी में अभी तक कोई उत्पाद नहीं है।', id: 'Belum ada produk di kategori ini.' },
  'Enter Shop': { ja: 'ショップへ', es: 'Entrar a la tienda', fr: 'Entrer dans la boutique', de: 'Zum Shop', ru: 'В магазин', ko: '쇼핑하기', pt: 'Entrar na loja', nl: 'Naar winkel', sv: 'Gå till butiken', ar: 'ادخل المتجر', hi: 'दुकान में प्रवेश करें', id: 'Masuk Toko' },
  'View Lookbook': { ja: 'ルックブック', es: 'Ver Lookbook', fr: 'Voir le Lookbook', de: 'Lookbook ansehen', ru: 'Посмотреть Lookbook', ko: '룩북 보기', pt: 'Ver Lookbook', nl: 'Bekijk Lookbook', sv: 'Se Lookbook', ar: 'عرض كتاب الأزياء', hi: 'लुकबुक देखें', id: 'Lihat Lookbook' },
  'Learn More': { ja: '詳細', es: 'Más información', fr: 'En savoir plus', de: 'Mehr erfahren', ru: 'Узнать больше', ko: '자세히', pt: 'Saiba mais', nl: 'Meer informatie', sv: 'Läs mer', ar: 'معرفة المزيد', hi: 'और जानें', id: 'Pelajari Lebih Lanjut' },
  'Connect': { ja: '接続', es: 'Conectar', fr: 'Connecter', de: 'Verbinden', ru: 'Подключиться', ko: '연결', pt: 'Conectar', nl: 'Verbinden', sv: 'Anslut', ar: 'اتصال', hi: 'कनेक्ट', id: 'Hubungkan' },
  'Protocol': { ja: 'プロトコル', es: 'Protocolo', fr: 'Protocole', de: 'Protokoll', ru: 'Протокол', ko: '프로토콜', pt: 'Protocolo', nl: 'Protocol', sv: 'Protokoll', ar: 'بروتوكول', hi: 'प्रोटोकॉल', id: 'Protokol' },
  // Product Detail
  'Add to Cart': { ja: 'カートに追加', es: 'Añadir al carrito', fr: 'Ajouter au panier', de: 'In den Warenkorb', ru: 'Добавить в корзину', ko: '카트에 추가', pt: 'Adicionar ao carrinho', nl: 'Toevoegen aan winkelwagen', sv: 'Lägg i varukorg', ar: 'أضف إلى السلة', hi: 'कार्ट में जोड़ें', id: 'Tambahkan ke Keranjang' },
  'Back to Shop': { ja: 'ショップに戻る', es: 'Volver a la tienda', fr: 'Retour à la boutique', de: 'Zurück zum Shop', ru: 'Назад в магазин', ko: '쇼핑으로 돌아가기', pt: 'Voltar à loja', nl: 'Terug naar winkel', sv: 'Tillbaka till butiken', ar: 'العودة إلى المتجر', hi: 'दुकान पर वापस', id: 'Kembali ke Toko' },
  'Quantity': { ja: '数量', es: 'Cantidad', fr: 'Quantité', de: 'Menge', ru: 'Количество', ko: '수량', pt: 'Quantidade', nl: 'Aantal', sv: 'Antal', ar: 'الكمية', hi: 'मात्रा', id: 'Jumlah' },
  'Price': { ja: '価格', es: 'Precio', fr: 'Prix', de: 'Preis', ru: 'Цена', ko: '가격', pt: 'Preço', nl: 'Prijs', sv: 'Pris', ar: 'السعر', hi: 'कीमत', id: 'Harga' },
  'DESC': { ja: '説明', es: 'DESCRIPCIÓN', fr: 'DESCRIPTION', de: 'BESCHREIBUNG', ru: 'ОПИСАНИЕ', ko: '설명', pt: 'DESCRIÇÃO', nl: 'BESCHRIJVING', sv: 'BESKRIVNING', ar: 'وصف', hi: 'विवरण', id: 'DESKRIPSI' },
  'FEATURES': { ja: '特徴', es: 'CARACTERÍSTICAS', fr: 'CARACTÉRISTIQUES', de: 'FUNKTIONEN', ru: 'ХАРАКТЕРИСТИКИ', ko: '기능', pt: 'RECURSOS', nl: 'KENMERKEN', sv: 'FUNKTIONER', ar: 'ميزات', hi: 'विशेषताएं', id: 'FITUR' },
  'SPECS': { ja: '仕様', es: 'ESPECIFICACIONES', fr: 'SPÉCIFICATIONS', de: 'SPEZIFIKATIONEN', ru: 'СПЕЦИФИКАЦИИ', ko: '사양', pt: 'ESPECIFICAÇÕES', nl: 'SPECIFICATIES', sv: 'SPECIFIKATIONER', ar: 'المواصفات', hi: 'विशेषताएं', id: 'SPESIFIKASI' },
  'REVIEWS': { ja: 'レビュー', es: 'RESEÑAS', fr: 'AVIS', de: 'BEWERTUNGEN', ru: 'ОТЗЫВЫ', ko: '리뷰', pt: 'AVALIAÇÕES', nl: 'BEOORDELINGEN', sv: 'RECENSIONER', ar: 'المراجعات', hi: 'समीक्षा', id: 'ULASAN' },
  'Related Products': { ja: '関連商品', es: 'Productos relacionados', fr: 'Produits liés', de: 'Ähnliche Produkte', ru: 'Похожие товары', ko: '관련 제품', pt: 'Produtos relacionados', nl: 'Gerelateerde producten', sv: 'Relaterade produkter', ar: 'منتجات ذات صلة', hi: 'संबंधित उत्पाद', id: 'Produk Terkait' },
  'Price: Low to High': { ja: '価格: 安い順', es: 'Precio: Bajo a Alto', fr: 'Prix: Croissant', de: 'Preis: Niedrig zu Hoch', ru: 'Цена: По возрастанию', ko: '가격: 낮은순', pt: 'Preço: Menor para Maior', nl: 'Prijs: Laag naar Hoog', sv: 'Pris: Låg till Hög', ar: 'السعر: من الأقل إلى الأعلى', hi: 'कीमत: कम से ज़्यादा', id: 'Harga: Rendah ke Tinggi' },
  'Price: High to Low': { ja: '価格: 高い順', es: 'Precio: Alto a Bajo', fr: 'Prix: Décroissant', de: 'Preis: Hoch zu Niedrig', ru: 'Цена: По убыванию', ko: '가격: 높은순', pt: 'Preço: Maior para Menor', nl: 'Prijs: Hoog naar Laag', sv: 'Pris: Hög till Låg', ar: 'السعر: من الأعلى إلى الأقل', hi: 'कीमत: ज़्यादा से कम', id: 'Harga: Tinggi ke Rendah' },
  'PREV': { ja: '前', es: 'ANTERIOR', fr: 'PRÉCÉDENT', de: 'ZURÜCK', ru: 'НАЗАД', ko: '이전', pt: 'ANTERIOR', nl: 'VORIGE', sv: 'FÖREGÅENDE', ar: 'السابق', hi: 'पिछला', id: 'SEBELUMNYA' },
  'NEXT': { ja: '次', es: 'SIGUIENTE', fr: 'SUIVANT', de: 'WEITER', ru: 'ДАЛЕЕ', ko: '다음', pt: 'PRÓXIMO', nl: 'VOLGENDE', sv: 'NÄSTA', ar: 'التالي', hi: 'अगला', id: 'BERIKUTNYA' },
  // More UI text
  'verified reviews': { ja: '認証済みレビュー', es: 'reseñas verificadas', fr: 'avis vérifiés', de: 'verifizierte Bewertungen', ru: 'проверенные отзывы', ko: '인증된 리뷰', pt: 'avaliações verificadas', nl: 'geverifieerde beoordelingen', sv: 'verifierade recensioner', ar: 'مراجعات موثقة', hi: 'सत्यापित समीक्षा', id: 'ulasan terverifikasi' },
  'Write Review': { ja: 'レビューを書く', es: 'Escribir reseña', fr: 'Écrire un avis', de: 'Bewertung schreiben', ru: 'Написать отзыв', ko: '리뷰 작성', pt: 'Escrever avaliação', nl: 'Beoordeling schrijven', sv: 'Skriv recension', ar: 'اكتب مراجعة', hi: 'समीक्षा लिखें', id: 'Tulis Ulasan' },
  'You May Also Like': { ja: 'おすすめ商品', es: 'También te puede gustar', fr: 'Vous aimerez peut-être aussi', de: 'Das könnte Ihnen auch gefallen', ru: 'Вам также может понравиться', ko: 'مقات أخرى قد تعجبك', pt: 'Você também pode gostar', nl: 'Dit vind je misschien ook leuk', sv: 'Du kanske också gillar', ar: 'قد تعجبك أيضاً', hi: 'आपको यह भी पसंद आ सकता है', id: 'Anda Mungkin Juga Suka' },
  'Helpful': { ja: '役に立った', es: 'Útil', fr: 'Utile', de: 'Hilfreich', ru: 'Полезно', ko: '도움이 됨', pt: 'Útil', nl: 'Nuttig', sv: 'Hjälpsam', ar: 'مفيد', hi: 'सहायक', id: 'Membantu' },
  'Reply': { ja: '返信', es: 'Responder', fr: 'Répondre', de: 'Antworten', ru: 'Ответить', ko: '답장', pt: 'Responder', nl: 'Reageren', sv: 'Svara', ar: 'رد', hi: 'जवाब दें', id: 'Balas' },
  'HOVER TO ZOOM': { ja: 'ホバーで拡大', es: 'HOVER PARA ZOOM', fr: 'SURVOLER POUR ZOOMER', de: 'HOVER ZUM ZOOMEN', ru: 'НАВЕДИТЕ ДЛЯ УВЕЛИЧЕНИЯ', ko: '호버하면 확대', pt: 'PASSE O MOUSE PARA AMPLIAR', nl: 'HOVER OM TE ZOOMEN', sv: 'HÖVER FÖR ATT ZOOMA', ar: 'مرر للتكبير', hi: 'ज़ूम करने के लिए होवर करें', id: 'ARAHKAN UNTUK ZOOM' },
  'Product Demo': { ja: '商品デモ', es: 'Demo del producto', fr: 'Démo du produit', de: 'Produktdemo', ru: 'Демо продукта', ko: '제품 데모', pt: 'Demonstração do produto', nl: 'Productdemo', sv: 'Produktdemo', ar: 'عرض توضيحي للمنتج', hi: 'उत्पाद डेमो', id: 'Demo Produk' },
  'Page': { ja: 'ページ', es: 'Página', fr: 'Page', de: 'Seite', ru: 'Страница', ko: '페이지', pt: 'Página', nl: 'Pagina', sv: 'Sida', ar: 'صفحة', hi: 'पृष्ठ', id: 'Halaman' },
};

// 全局翻译变量 - 将在App组件中设置
let currentLanguage = 'EN';

// UI翻译缓存
const uiTranslationCache: Record<string, Record<string, string>> = {};

// 全局翻译函数 - 支持所有语言回退
const getTranslation = (text: string): string => {
  if (currentLanguage === 'EN') return text;
  const langCode = LANGUAGE_CODES[currentLanguage as keyof typeof LANGUAGE_CODES];
  
  // 首先查找UI_TRANSLATIONS
  if (UI_TRANSLATIONS[text]?.[langCode]) {
    return UI_TRANSLATIONS[text][langCode];
  }
  
  // 检查缓存
  if (uiTranslationCache[text]?.[langCode]) {
    return uiTranslationCache[text][langCode];
  }
  
  // 对于不支持的语言，异步翻译并缓存
  if (langCode && langCode !== 'en') {
    translate(text, langCode).then(result => {
      if (!uiTranslationCache[text]) {
        uiTranslationCache[text] = {};
      }
      uiTranslationCache[text][langCode] = result as string;
    }).catch(() => {
      // 翻译失败，缓存原文避免重复请求
      if (!uiTranslationCache[text]) {
        uiTranslationCache[text] = {};
      }
      uiTranslationCache[text][langCode] = text;
    });
  }
  
  // 首次显示原文，异步翻译完成后会更新
  return text;
};

// 定义二级分类结构 - 更新为常见情趣用品分类
const DEFAULT_CATEGORY_TREE: Record<string, string[]> = {
  'VIBES': ['Wands', 'Rabbits', 'Bullets', 'App-Controlled', 'Remote'],
  'DILDOS': ['Realistic', 'Fantasy', 'Glass & Metal', 'Strap-Ons', 'Double-Ended'],
  'ANAL': ['Plugs', 'Beads', 'Prostate', 'Training Kits', 'Douches'],
  'MALE': ['Masturbators', 'Strokers', 'Cock Rings', 'Pumps'],
  'BONDAGE': ['Restraints', 'Cuffs & Collars', 'Impact', 'Masks', 'Rope'],
  'LINGERIE': ['Harnesses', 'Bodystockings', 'Latex', 'Costumes'],
  'FLUIDS': ['Lubricants', 'Massage Oils', 'Cleaners', 'Stimulants']
};

// 从 config 生成分类树（先不支持二级，为每个分类生成空数组）
const getCategoryTree = (config: StoreConfig): Record<string, string[]> => {
  // 如果有 categoryTree 字段，优先使用
  if (config.categoryTree && config.categoryTree.length > 0) {
    const tree: Record<string, string[]> = {};
    config.categoryTree.forEach(cat => {
      tree[cat.name] = cat.subcategories || [];
    });
    return tree;
  }
  
  // 否则使用 categories 字段，为每个分类生成空数组
  if (config.categories && config.categories.length > 0) {
    const tree: Record<string, string[]> = {};
    config.categories.forEach(cat => {
      tree[cat] = DEFAULT_CATEGORY_TREE[cat] || [];  // 如果默认有二级分类就用，否则为空
    });
    return tree;
  }
  
  // 都没有就用默认
  return DEFAULT_CATEGORY_TREE;
};

// --- UTILS ---
const RetroButton: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'action' | 'ghost';
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', className = '', icon, disabled }) => {
  const styles = {
    primary: "bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-neon-pink border-none",
    secondary: "bg-transparent border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black shadow-neon-cyan",
    action: "bg-neon-yellow text-black font-bold hover:bg-white",
    ghost: "bg-transparent text-gray-400 hover:text-neon-cyan border border-transparent hover:border-neon-cyan/30"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`relative px-8 py-3 font-display font-bold text-sm uppercase tracking-wider skew-button flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      <span className="transform group-hover:skew-x-2 transition-transform inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
};

// --- COMPONENTS ---

// Helper for video item to manage refs
const SocialVideoItem: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0; // Reset to start
        }
    };

    return (
        <div 
            className="flex-shrink-0 w-[280px] md:w-[320px] aspect-[9/16] relative group border border-white/20 hover:border-neon-cyan transition-colors snap-center bg-gray-900 overflow-hidden cursor-pointer"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Video Element */}
            <video 
                ref={videoRef}
                src={product.socialVideo} 
                loop 
                muted 
                playsInline 
                // Removed autoPlay to make it default closed
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
            />
            
            {/* Play Icon Indicator (visible when not hovering/playing) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-black/50 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                    <Play size={20} className="text-white fill-white ml-1" />
                </div>
            </div>

            {/* Overlays */}
            <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1 font-display">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> REC
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-6">
                <div className="text-neon-yellow font-display text-xs mb-1">{product.category}</div>
                <h3 className="text-white font-display font-bold text-xl uppercase italic mb-2">{product.name}</h3>
                <div className="flex justify-between items-center">
                    <span className="text-white font-display">{(product as any).displayPrice || `$${product.price}`}</span>
                    <button className="bg-neon-cyan text-black p-2 rounded-full hover:scale-110 transition-transform">
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Scanline */}
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/xT9Igk31elskVqFfGM/giphy.gif')] opacity-[0.05] pointer-events-none mix-blend-overlay pointer-events-none"></div>
        </div>
    );
};

// New Component: Social Video Feed (Vertical Video)
const SocialVideoFeed: React.FC<{ products: Product[]; onProductClick: (p: Product) => void }> = ({ products, onProductClick }) => {
  const videoProducts = products.filter(p => p.socialVideo);
  
  if (videoProducts.length === 0) return null;

  return (
    <section className="py-12 md:py-24 bg-black border-y border-neon-purple/30 relative overflow-hidden">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(176,38,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(176,38,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="flex items-center justify-between mb-8 md:mb-12">
                <div>
                   <div className="text-neon-pink text-xs font-display font-bold tracking-widest mb-2 animate-pulse">{getTranslation('LIVE FEED')}</div>
                   <h2 className="font-display text-3xl md:text-4xl text-white italic font-black uppercase flex items-center gap-4">
                      {getTranslation('NEBULA')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">{getTranslation('STREAM')}</span> <Film className="text-neon-cyan" />
                   </h2>
                </div>
                <div className="hidden md:flex gap-2 text-xs font-display text-gray-500 uppercase">
                    <span className="flex items-center gap-1"><Activity size={12}/> {getTranslation('Trending Now')}</span>
                    <span>//</span>
                    <span className="flex items-center gap-1"><Globe size={12}/> {getTranslation('Global Sync')}</span>
                </div>
            </div>

            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-8 snap-x snap-mandatory no-scrollbar">
                {videoProducts.map((product) => (
                    <SocialVideoItem key={product.id} product={product} onClick={() => onProductClick(product)} />
                ))}
            </div>
        </div>
    </section>
  );
};

// Featured Products Section with Category Filter
const FeaturedProductsSection: React.FC<{
    allProducts: Product[];
    onProductClick: (p: Product) => void;
    onNavigate: (v: ViewState) => void;
    config: StoreConfig;  // 添加 config prop
}> = ({ allProducts, onProductClick, onNavigate, config }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    
    const CATEGORY_TREE = getCategoryTree(config);  // 动态获取分类树
    const categories = ['ALL', ...Object.keys(CATEGORY_TREE)];
    
    const filteredProducts = selectedCategory === 'ALL' 
        ? allProducts 
        : allProducts.filter(p => p.category === selectedCategory);
    
    const displayProducts = filteredProducts.slice(0, 12);
    
    return (
        <section className="py-12 md:py-24 px-6 max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-2 border-neon-pink pb-4">
                <h2 className="font-display text-4xl text-white italic font-black transform -skew-x-6 text-glow-pink mb-4 md:mb-0">
                    {getTranslation('NEW_DROPS')}
                </h2>
                <button 
                    onClick={() => onNavigate('SHOP')} 
                    className="text-neon-cyan hover:text-white font-display text-sm uppercase tracking-widest flex items-center gap-2 group"
                >
                    <span>{getTranslation('View All Assets')}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            
            <div className="mb-8 md:mb-12">
                <div className="flex flex-wrap gap-2 md:gap-3">
                    {categories.map((cat) => {
                        const isActive = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`group relative px-4 md:px-6 py-2.5 md:py-3 font-display text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-300 overflow-hidden ${
                                    isActive 
                                        ? 'bg-neon-pink text-black border-2 border-neon-pink shadow-[0_0_20px_rgba(255,0,255,0.5)]' 
                                        : 'bg-black/40 text-gray-400 border-2 border-white/10 hover:border-neon-pink/50 hover:text-white'
                                }`}
                            >
                                {!isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/0 via-neon-pink/20 to-neon-pink/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                )}
                                
                                <span className="relative z-10">{getTranslation(cat)}</span>
                                
                                {isActive && (
                                    <div className="absolute inset-0 border-2 border-neon-pink animate-ping opacity-20"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
                
                <div className="mt-4 flex items-center gap-3 text-xs font-display uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-neon-cyan">
                        <Package size={14} />
                        <span>{getTranslation('Showing')} {displayProducts.length} of {filteredProducts.length}</span>
                    </div>
                    {selectedCategory !== 'ALL' && (
                        <div className="text-gray-500">
                            // Category: <span className="text-neon-yellow">{selectedCategory}</span>
                        </div>
                    )}
                </div>
            </div>
            
            {displayProducts.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 bg-black/20">
                    <div className="text-neon-yellow font-display text-2xl mb-2">{getTranslation('NO DATA FOUND')}</div>
                    <p className="text-gray-500">{getTranslation('No products in this category yet.')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {displayProducts.map((p, index) => (
                        <div 
                            key={p.id}
                            className="opacity-0 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                        >
                            <ProductCard product={p} onClick={() => onProductClick(p)} />
                        </div>
                    ))}
                </div>
            )}
            
            {filteredProducts.length > 12 && (
                <div className="text-center mt-12">
                    <button 
                        onClick={() => onNavigate('SHOP')}
                        className="group px-8 py-4 bg-black border-2 border-neon-cyan hover:bg-neon-cyan/10 text-white font-display font-bold uppercase text-sm tracking-wider transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                    >
                        <span>{getTranslation('Load More Products')}</span>
                        <div className="w-8 h-8 bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center group-hover:bg-neon-cyan group-hover:text-black transition-colors">
                            <ChevronDown size={16} className="text-neon-cyan group-hover:text-black" />
                        </div>
                    </button>
                    <p className="text-gray-500 text-xs mt-4 font-display uppercase tracking-wider">
                        {filteredProducts.length - 12} more {getTranslation('items available')}
                    </p>
                </div>
            )}
        </section>
    );
};

// Updated: Hero Carousel reading from config.heroSlides
const HeroCarousel: React.FC<{ onNavigate: (v: ViewState) => void; slides?: any[] }> = ({ onNavigate, slides }) => {
  // 如果没有传入 slides 或为空，使用默认数据
  const displaySlides = (slides && slides.length > 0) ? slides : [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070',
      subtitle: 'EST. 2084 // TOKYO SECTOR 7',
      title1: 'Digital',
      title2: 'Sunset',
      desc: 'Bridging the gap between biological desire and digital perfection. High-fidelity haptics for the modern soul.',
      cta: 'SHOP NOW'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=2070', 
      subtitle: 'SYSTEM UPGRADE AVAILABLE',
      title1: 'Cyber',
      title2: 'Flesh',
      desc: 'Experience the new wave of sensory augmentation. Resistance is futile when pleasure is this precise.',
      cta: 'SHOP NOW'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=2070', 
      subtitle: 'SECURE ENCRYPTED UPLINK',
      title1: 'Neural',
      title2: 'Sync',
      desc: 'Direct interface protocols for maximum transmission speed. Your secrets are safe in the void.',
      cta: 'SHOP NOW'
    }
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % displaySlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displaySlides.length]);

  const nextSlide = () => setCurrent(prev => (prev + 1) % displaySlides.length);
  const prevSlide = () => setCurrent(prev => (prev - 1 + displaySlides.length) % displaySlides.length);
  
  // CTA按钮统一跳转到商店
  const handleCTAClick = () => onNavigate('SHOP');

  return (
    <section className="relative w-full h-[600px] overflow-hidden">
        {displaySlides.map((slide, index) => (
            <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                {/* Background Image - 固定高度 */}
                <img 
                    src={slide.image}
                    alt="Hero slide"
                    className="w-full h-full object-cover transition-transform duration-[8000ms] ease-linear" 
                    style={{ 
                        transform: index === current ? 'scale(1.1)' : 'scale(1)' 
                    }}
                />
            </div>
        ))}

        {/* Content - 只保留 CTA 按钮，位置靠底部 */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-fade-in">
             {/* 只保留 CTA 按钮 */}
             <div className="flex gap-6 justify-center opacity-0 animate-[fadeIn_0.5s_ease-out_0.6s_forwards]">
                <RetroButton onClick={handleCTAClick}>{getTranslation(displaySlides[current].cta || 'SHOP NOW')}</RetroButton>
             </div>
        </div>
        
        {/* Navigation Arrows */}
        <button onClick={prevSlide} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-30 text-white/30 hover:text-neon-cyan transition-colors p-2 border border-transparent hover:border-neon-cyan bg-black/20 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300">
            <ChevronLeft size={48} />
        </button>
        <button onClick={nextSlide} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-30 text-white/30 hover:text-neon-cyan transition-colors p-2 border border-transparent hover:border-neon-cyan bg-black/20 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300">
            <ChevronRight size={48} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-4">
            {displaySlides.map((_, idx) => (
                <button 
                    key={idx} 
                    onClick={() => setCurrent(idx)}
                    className={`h-1 transition-all duration-300 ${idx === current ? 'w-12 bg-neon-pink shadow-[0_0_10px_#ff00ff]' : 'w-4 bg-white/30 hover:bg-white'}`}
                />
            ))}
        </div>
    </section>
  );
}

// New Promo Component: Flash Sale
const LimitedTimeOffer: React.FC = () => {
  // Initialize countdown (4 hours 20 minutes in seconds)
  const [timeLeft, setTimeLeft] = useState(15600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 border border-neon-pink/30 p-4 mb-6 flex items-center justify-between relative overflow-hidden group shadow-[0_0_15px_rgba(255,0,255,0.2)]">
      <div className="absolute top-0 left-0 w-1 h-full bg-neon-pink animate-pulse"></div>
      <div className="flex items-center gap-3 relative z-10">
         <div className="w-10 h-10 bg-neon-pink/20 rounded-full flex items-center justify-center text-neon-pink animate-pulse">
            <Timer size={20} className="animate-spin-slow" />
         </div>
         <div>
            <div className="text-neon-pink font-display font-bold text-sm tracking-widest flex items-center gap-2">
              FLASH PROTOCOL <span className="bg-neon-pink text-black text-[10px] px-1 font-black animate-pulse">ACTIVE</span>
            </div>
            <div className="text-xs text-gray-400 font-display font-bold">20% CREDIT REBATE ENDING SOON</div>
         </div>
      </div>
      <div className="font-display font-black text-2xl text-white tracking-widest relative z-10 tabular-nums text-glow-pink">
        {formatTime(timeLeft)}
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink/5 to-transparent bg-[length:100%_4px] animate-grid-move pointer-events-none"></div>
    </div>
  );
};

// New Promo Component: Bundle
// New Promo Component: Volume Discount (Tiered Pricing)
const VolumeDiscount: React.FC<{ price: number; selectedQty: number; onSelectQty: (qty: number) => void; tiers?: Array<{qty: number; discount: number; label: string}>; currency?: string }> = ({ price, selectedQty, onSelectQty, tiers, currency = 'USD' }) => {
  // 使用传入的 tiers 或默认值
  const discountTiers = tiers || [
    { qty: 1, discount: 0, label: 'STANDARD' },
    { qty: 2, discount: 10, label: 'DUAL SYNC' },
    { qty: 3, discount: 20, label: 'HIVE MIND' }
  ];
  
  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {discountTiers.map((tier) => {
        const discountedPrice = price * (1 - tier.discount / 100);
        const totalPrice = discountedPrice * tier.qty;
        
        return (
          <div 
            key={tier.qty} 
            onClick={() => onSelectQty(tier.qty)}
            className={`border ${selectedQty === tier.qty ? 'border-neon-cyan bg-neon-cyan/10' : 'border-white/10 hover:border-white/30'} p-3 flex flex-col items-center cursor-pointer transition-all`}
          >
            <div className="text-xs text-gray-400 font-display mb-1">{tier.label}</div>
            <div className="font-bold text-white text-lg">{tier.qty}x</div>
            {tier.discount > 0 && (
              <div className="text-neon-yellow text-xs font-bold">-{tier.discount}%</div>
            )}
            <div className="text-white text-xs mt-1 font-mono font-bold tracking-tight">{formatPrice(totalPrice, currency)}</div>
          </div>
        );
      })}
    </div>
  );
};

// New Component: Demand Indicator (Social Proof)
const DemandIndicator: React.FC = () => (
    <div className="flex items-center gap-2 text-xs text-neon-pink mb-4 animate-pulse">
        <Activity size={14} />
        <span className="font-display tracking-wider">HIGH TRAFFIC: 24 NODES VIEWING THIS ASSET</span>
    </div>
);

// New Component: Write Review Modal
const WriteReviewModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (review: any) => void }> = ({ isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [alias, setAlias] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) return null;
  
  const handleSubmit = () => {
      onSubmit({ user: alias || 'Anonymous_Node', rating, content, date: new Date().toISOString().split('T')[0] });
      onClose();
      setAlias('');
      setContent('');
      setRating(5);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={onClose}>
        <div className="bg-synth-panel border border-neon-purple p-8 max-w-md w-full relative skew-x-[-2deg] shadow-[0_0_50px_rgba(176,38,255,0.3)] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <h2 className="font-display text-2xl text-white mb-2 uppercase italic">Transmit Log</h2>
            <p className="text-gray-400 text-sm mb-6">Share your neural feedback with the network.</p>
            
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-neon-cyan font-bold uppercase block mb-2">Rating</label>
                    <div className="flex gap-2 text-neon-yellow">
                        {[1,2,3,4,5].map(i => <Star key={i} fill={i <= rating ? "currentColor" : "none"} className="cursor-pointer hover:scale-110 transition-transform" onClick={() => setRating(i)} />)}
                    </div>
                </div>
                <div>
                    <label className="text-xs text-neon-cyan font-bold uppercase block mb-2">Alias</label>
                    <input value={alias} onChange={e => setAlias(e.target.value)} type="text" className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-neon-pink font-display" placeholder="USER_ID" />
                </div>
                <div>
                    <label className="text-xs text-neon-cyan font-bold uppercase block mb-2">Data</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-neon-pink font-body h-32" placeholder="Enter transmission..." />
                </div>
                <RetroButton onClick={handleSubmit} className="w-full">UPLOAD TO MAINFRAME</RetroButton>
            </div>
        </div>
    </div>
  );
}

const DesktopCategoryNav: React.FC<{ onSelect: (cat: string, subCat?: string) => void; config: StoreConfig }> = ({ onSelect, config }) => {
  const CATEGORY_TREE = getCategoryTree(config);
  return (
    <div className="hidden md:block fixed top-20 left-0 w-full bg-black/90 backdrop-blur-md border-b border-white/10 z-40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex justify-center">
        {Object.entries(CATEGORY_TREE).map(([mainCat, subCats]) => (
          <div key={mainCat} className="group relative">
            {/* Main Category Button */}
            <button 
              onClick={() => onSelect(mainCat)}
              className="px-6 py-4 font-display font-bold text-sm text-gray-400 hover:text-neon-cyan transition-colors uppercase tracking-widest flex items-center gap-1 group-hover:bg-white/5"
            >
              {getTranslation(mainCat)} <ChevronDown size={10} className="group-hover:rotate-180 transition-transform text-neon-purple" />
            </button>

            {/* Dropdown Menu (Secondary Classification) */}
            <div className="absolute top-full left-0 w-56 bg-synth-panel border border-neon-cyan/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top shadow-[0_0_20px_rgba(0,249,255,0.2)] z-50">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple to-neon-cyan"></div>
               <div className="p-4 grid gap-1">
                 {subCats.map(sub => (
                   <button 
                     key={sub}
                     onClick={(e) => { e.stopPropagation(); onSelect(mainCat, sub); }}
                     className="text-left px-4 py-2 text-sm font-display text-gray-300 hover:text-black hover:bg-neon-cyan transition-colors uppercase tracking-wide skew-x-[-6deg] group/item"
                   >
                     <span className="skew-x-[6deg] block flex items-center justify-between">
                       {sub} <span className="opacity-0 group-hover/item:opacity-100 text-[10px]">»</span>
                     </span>
                   </button>
                 ))}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MobileCategoryBar: React.FC<{ onSelect: (cat: string) => void, activeCat?: string; config: StoreConfig }> = ({ onSelect, activeCat, config }) => {
  const CATEGORY_TREE = getCategoryTree(config);
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-xl border-t border-white/10 pb-4 pt-3 w-full shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
       <div className="flex overflow-x-auto no-scrollbar px-4 pb-2 gap-3 items-center">
          <div className="flex-shrink-0 text-neon-yellow pr-2 border-r border-white/10">
             <Sliders size={20} />
          </div>
          <button 
             onClick={() => onSelect('ALL')}
             className={`flex-shrink-0 px-5 py-2 rounded-full border ${!activeCat || activeCat === 'ALL' ? 'bg-neon-pink border-neon-pink text-white' : 'border-white/20 text-gray-400'} font-display text-xs font-bold uppercase transition-all`}
          >
            ALL
          </button>
          {Object.keys(CATEGORY_TREE).map(cat => (
             <button 
               key={cat}
               onClick={() => onSelect(cat)}
               className={`flex-shrink-0 px-5 py-2 rounded-full border ${activeCat === cat ? 'bg-neon-cyan border-neon-cyan text-black' : 'border-white/20 text-gray-400'} font-display text-xs font-bold uppercase transition-all whitespace-nowrap`}
             >
               {getTranslation(cat)}
             </button>
          ))}
       </div>
       <div className="h-1 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-yellow w-full opacity-50"></div>
    </div>
  );
};

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed bottom-24 md:bottom-8 right-8 z-[90] animate-fade-in">
    <div className="bg-black border-2 border-neon-cyan text-neon-cyan px-6 py-4 shadow-[0_0_20px_rgba(0,249,255,0.3)] flex items-center gap-4 skew-x-[-10deg]">
       <CheckCircle className="skew-x-[10deg]" size={20} />
       <span className="skew-x-[10deg] font-display font-bold uppercase tracking-wide">{message}</span>
    </div>
  </div>
);

// 首页FAQ组件 - 可展开折叠
const HomeFAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [translatedAnswers, setTranslatedAnswers] = useState<Record<number, string>>({});
  
  const faqs = [
    {
      question: "Are shipments discreet?",
      answer: "Yes. All packages are deployed in plain, vacuum-sealed stealth containers. No branding. No logs. The package will appear as \"Tech Components\" on scans. Your privacy is our protocol."
    },
    {
      question: "Is my data secure?",
      answer: "We use 256-bit quantum encryption. Your purchase history is wiped from the local node after 30 days. We do not sell data to mega-corps. All transactions are end-to-end encrypted."
    },
    {
      question: "What is the return policy?",
      answer: "Due to bio-hazard protocols, open products cannot be returned once the seal is broken. Hardware malfunctions are covered by a 1-year warranty. Contact our support node for assistance."
    },
    {
      question: "How fast is shipping?",
      answer: "Standard relay: 3-5 galactic cycles (business days). Priority warp: 24 hours for Sector 7. All items are dispatched from our orbital warehouse within 2 hours of payment confirmation."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and cryptocurrency (Bitcoin, Ethereum). All transactions are processed through secure, encrypted channels."
    }
  ];

  // 当FAQ展开时翻译答案
  useEffect(() => {
    if (openIndex !== null && currentLanguage !== 'EN' && !translatedAnswers[openIndex]) {
      const langCode = LANGUAGE_CODES[currentLanguage as keyof typeof LANGUAGE_CODES];
      translate(faqs[openIndex].answer, langCode).then(result => {
        setTranslatedAnswers(prev => ({
          ...prev,
          [openIndex]: result as string
        }));
      }).catch(err => {
        console.error('Translation error:', err);
      });
    }
  }, [openIndex, currentLanguage]);
  
  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div 
          key={index}
          className="group border border-white/10 hover:border-neon-cyan/30 bg-black/40 transition-all duration-300 overflow-hidden"
        >
          {/* 问题按钮 */}
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full p-4 md:p-5 flex items-center justify-between text-left group hover:bg-white/5 transition-colors"
          >
            <h3 className="font-display text-white text-sm md:text-base font-medium group-hover:text-neon-cyan transition-colors pr-4">
              {getTranslation(faq.question)}
            </h3>
            <ChevronDown 
              size={18} 
              className={`text-neon-cyan transition-transform duration-300 flex-shrink-0 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          
          {/* 答案内容 */}
          <div 
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 pb-4 md:px-5 md:pb-5 pt-0">
              <p className="text-gray-400 text-sm leading-relaxed">
                {currentLanguage === 'EN' ? faq.answer : (translatedAnswers[index] || faq.answer)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 评论轮播组件
const TestimonialCarousel: React.FC<{ reviews: typeof REVIEWS_MOCK }> = ({ reviews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translatedReviews, setTranslatedReviews] = useState<Record<number, string>>({});
  const itemsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / itemsPerPage);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const currentReviews = reviews.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  // 翻译当前页的评论
  useEffect(() => {
    if (currentLanguage !== 'EN') {
      const langCode = LANGUAGE_CODES[currentLanguage as keyof typeof LANGUAGE_CODES];
      currentReviews.forEach((review, idx) => {
        const globalIdx = currentIndex * itemsPerPage + idx;
        if (!translatedReviews[globalIdx]) {
          translate(review.content, langCode).then(result => {
            setTranslatedReviews(prev => ({
              ...prev,
              [globalIdx]: result as string
            }));
          }).catch(err => {
            console.error('Translation error:', err);
          });
        }
      });
    }
  }, [currentIndex, currentLanguage]);

  return (
    <div className="relative">
      {/* 左右按钮 */}
      <button
        onClick={handlePrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-neon-cyan/20 border border-white/20 hover:border-neon-cyan rounded-full flex items-center justify-center transition-all group"
      >
        <ChevronLeft size={20} className="text-white group-hover:text-neon-cyan" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-neon-cyan/20 border border-white/20 hover:border-neon-cyan rounded-full flex items-center justify-center transition-all group"
      >
        <ChevronRight size={20} className="text-white group-hover:text-neon-cyan" />
      </button>

      {/* 卡片容器 */}
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div key={pageIndex} className="w-full flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reviews.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((r, i) => {
                  const globalIdx = pageIndex * itemsPerPage + i;
                  return (
                  <div
                    key={globalIdx}
                    className="group relative bg-white/5 border border-white/10 hover:border-neon-cyan/50 transition-all duration-300 p-5 rounded-lg"
                  >
                    {/* 顶部装饰线 */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                    {/* 用户信息 - 紧凑布局 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
                          <span className="font-display text-sm font-black text-neon-cyan">{r.user[0]}</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-neon-cyan rounded-full border border-black flex items-center justify-center">
                          <CheckCircle size={7} className="text-black" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-display text-white font-bold text-xs tracking-wide truncate">{r.user}</div>
                        <div className="text-gray-500 text-[10px] uppercase tracking-wider font-display">{r.date}</div>
                      </div>

                      {/* 评分 */}
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            size={10}
                            className={j < r.rating ? 'text-neon-yellow fill-neon-yellow' : 'text-gray-700'}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 评价内容 - 紧凑 */}
                    <p className="text-gray-300 text-xs leading-relaxed font-body line-clamp-3">
                      {currentLanguage === 'EN' ? r.content : (translatedReviews[globalIdx] || r.content)}
                    </p>

                    {/* 底部信息 */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-display">
                        <Shield size={10} className="text-neon-cyan/50" />
                        <span className="uppercase tracking-wider">{getTranslation('VERIFIED')}</span>
                      </div>
                      <button className="hover:text-neon-cyan transition-colors flex items-center gap-1 text-[10px] text-gray-600">
                        <ThumbsUp size={10} />
                        <span className="font-display">{Math.floor(Math.random() * 50 + 10)}</span>
                      </button>
                    </div>
                  </div>
                );})}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 页码指示器 */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-neon-cyan w-6'
                : 'bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const AgeGate: React.FC<{ onVerify: () => void }> = ({ onVerify }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-synth-bg/95 backdrop-blur-sm">
    <div className="relative border-4 border-neon-pink p-1 bg-synth-bg max-w-lg w-full shadow-neon-pink mx-4 skew-x-[-2deg]">
       <div className="absolute -top-2 -left-2 w-4 h-4 bg-neon-cyan"></div>
       <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-neon-cyan"></div>
       
      <div className="bg-synth-panel p-10 text-center relative overflow-hidden border border-white/10">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-shimmer"></div>
        <div className="relative z-10">
          <Disc className="w-16 h-16 text-neon-cyan mx-auto mb-6 animate-spin-slow" />
          <h1 className="font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-pink mb-2 tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">NEBULA</h1>
          <p className="text-gray-300 font-body text-lg mb-8 leading-relaxed border-l-4 border-neon-cyan pl-4 text-left bg-black/30 py-2">
            WARNING: ADULT CONTENT (18+).<br/>ENTER AT YOUR OWN RISK.
          </p>
          <RetroButton onClick={onVerify} className="w-full" icon={<Play size={16} fill="currentColor" />}>
            ENTER SITE
          </RetroButton>
        </div>
      </div>
    </div>
  </div>
);

const SearchBar: React.FC<{ isOpen: boolean; onClose: () => void; onSearch: (q: string) => void }> = ({ isOpen, onClose, onSearch }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute top-20 left-0 w-full bg-black/95 border-b border-neon-cyan p-6 z-50 animate-fade-in">
       <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Search className="text-neon-cyan" />
          <input 
            autoFocus
            type="text" 
            placeholder="SEARCH_MAINFRAME..." 
            className="flex-1 bg-transparent border-none text-white font-display text-2xl placeholder-gray-600 focus:outline-none uppercase"
            onChange={(e) => onSearch(e.target.value)}
          />
          <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
       </div>
    </div>
  );
};

const Navbar: React.FC<{ 
  cartCount: number; 
  onOpenCart: () => void; 
  onNavigate: (view: ViewState) => void;
  onToggleSearch: () => void;
  onToggleSettings: () => void;
}> = ({ cartCount, onOpenCart, onNavigate, onToggleSearch, onToggleSettings }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-synth-bg/90 backdrop-blur border-b border-neon-purple/50 shadow-neon-pink">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden text-white hover:text-neon-cyan transition-colors mr-2"
        >
          <Menu size={24} />
        </button>

        <button onClick={() => onNavigate('HOME')} className="flex items-center gap-2 group mr-auto md:mr-0">
          <img src="/logo.svg" alt="NEBULA" className="h-12 w-auto" />
        </button>
        
        {/* Desktop Simple Links (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-1">
          <button 
            onClick={() => onNavigate('HOME')}
            className="px-6 py-2 text-sm font-display font-bold tracking-widest text-gray-400 hover:text-neon-cyan hover:bg-white/5 skew-x-[-10deg] transition-all border-r border-white/5 last:border-none"
          >
            <span className="skew-x-[10deg] inline-block">{getTranslation('TERMINAL')}</span>
          </button>
          <button 
            onClick={() => onNavigate('SHOP')}
            className="px-6 py-2 text-sm font-display font-bold tracking-widest text-gray-400 hover:text-neon-cyan hover:bg-white/5 skew-x-[-10deg] transition-all border-r border-white/5 last:border-none"
          >
            <span className="skew-x-[10deg] inline-block">{getTranslation('SHOP')}</span>
          </button>
          <button 
            onClick={() => onNavigate('LOOKBOOK')}
            className="px-6 py-2 text-sm font-display font-bold tracking-widest text-gray-400 hover:text-neon-cyan hover:bg-white/5 skew-x-[-10deg] transition-all border-r border-white/5 last:border-none"
          >
            <span className="skew-x-[10deg] inline-block">{getTranslation('LOOKBOOK')}</span>
          </button>
          <button 
            onClick={() => onNavigate('BLOG')}
            className="px-6 py-2 text-sm font-display font-bold tracking-widest text-gray-400 hover:text-neon-cyan hover:bg-white/5 skew-x-[-10deg] transition-all border-r border-white/5 last:border-none"
          >
            <span className="skew-x-[10deg] inline-block">{getTranslation('BLOG')}</span>
          </button>
          <button 
            onClick={() => onNavigate('CONTACT')}
            className="px-6 py-2 text-sm font-display font-bold tracking-widest text-gray-400 hover:text-neon-cyan hover:bg-white/5 skew-x-[-10deg] transition-all border-r border-white/5 last:border-none"
          >
            <span className="skew-x-[10deg] inline-block">{getTranslation('CONTACT')}</span>
          </button>
        </div>
  
        <div className="flex items-center gap-6">
         <button onClick={onToggleSearch} className="text-white hover:text-neon-cyan transition-colors">
            <Search size={20} />
         </button>
         
         <button onClick={onToggleSettings} className="text-white hover:text-neon-cyan transition-colors flex items-center gap-1 font-display text-xs font-bold">
            <Globe size={20} /> <span className="hidden sm:inline">EN/USD</span>
         </button>
  
         <button onClick={onOpenCart} className="flex items-center gap-2 group hover:text-neon-pink transition-colors text-white">
            <div className="relative">
               <ShoppingBag size={24} />
               {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-neon-yellow text-black font-display font-bold text-xs flex items-center justify-center shadow-lg clip-path-polygon">
                     {cartCount}
                  </span>
               )}
            </div>
         </button>
        </div>
      </div>
    </nav>

    {/* Mobile Full Screen Menu */}
    {isMobileMenuOpen && (
       <div className="fixed inset-0 z-[100] bg-synth-bg/95 backdrop-blur-xl flex flex-col justify-center items-center gap-6 animate-fade-in p-8 overflow-y-auto">
           <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">
             <X size={32} />
           </button>
           
           <h2 className="font-display text-4xl text-neon-pink font-black italic mb-4 mt-8">SYSTEM_ACCESS</h2>

           <button onClick={() => { onNavigate('HOME'); setIsMobileMenuOpen(false); }} className="text-xl font-display font-bold text-white hover:text-neon-cyan uppercase tracking-widest">{getTranslation('TERMINAL')}</button>
           <button onClick={() => { onNavigate('SHOP'); setIsMobileMenuOpen(false); }} className="text-xl font-display font-bold text-white hover:text-neon-cyan uppercase tracking-widest">{getTranslation('SHOP')}</button>
           <button onClick={() => { onNavigate('LOOKBOOK'); setIsMobileMenuOpen(false); }} className="text-xl font-display font-bold text-white hover:text-neon-cyan uppercase tracking-widest">{getTranslation('LOOKBOOK')}</button>
           <button onClick={() => { onNavigate('BLOG'); setIsMobileMenuOpen(false); }} className="text-xl font-display font-bold text-white hover:text-neon-cyan uppercase tracking-widest">{getTranslation('BLOG')}</button>
           <button onClick={() => { onNavigate('CONTACT'); setIsMobileMenuOpen(false); }} className="text-xl font-display font-bold text-white hover:text-neon-cyan uppercase tracking-widest">{getTranslation('CONTACT')}</button>
           <button onClick={() => { onNavigate('ABOUT'); setIsMobileMenuOpen(false); }} className="text-xl font-display font-bold text-white hover:text-neon-cyan uppercase tracking-widest">SYSTEM CORE</button>
           
           <div className="w-20 h-1 bg-white/10 my-4"></div>
           
           <div className="flex flex-col gap-3 text-center">
             <button onClick={() => { onNavigate('TRACKING'); setIsMobileMenuOpen(false); }} className="text-sm font-display text-gray-400 hover:text-white uppercase flex items-center gap-2 justify-center"><Radar size={14}/> Track Signal</button>
             <button onClick={() => { onNavigate('FAQ'); setIsMobileMenuOpen(false); }} className="text-sm font-display text-gray-400 hover:text-white uppercase">FAQ Database</button>
             <button onClick={() => { onNavigate('SHIPPING'); setIsMobileMenuOpen(false); }} className="text-sm font-display text-gray-400 hover:text-white uppercase">Shipping Protocol</button>
             <button onClick={() => { onNavigate('RETURNS'); setIsMobileMenuOpen(false); }} className="text-sm font-display text-gray-400 hover:text-white uppercase">Returns</button>
           </div>

           <div className="mt-8 flex gap-6">
              <Facebook className="text-gray-500" />
              <Instagram className="text-gray-500" />
              <Twitter className="text-gray-500" />
           </div>
       </div>
    )}
    </>
  );
};

const SettingsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  currentLanguage: string;
  currentCurrency: string;
  onLanguageChange: (lang: string) => void;
  onCurrencyChange: (cur: string) => void;
}> = ({ isOpen, onClose, currentLanguage, currentCurrency, onLanguageChange, onCurrencyChange }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);

  const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'RU', name: 'Русский', flag: '🇷🇺' },
    { code: 'JP', name: '日本語', flag: '🇯🇵' },
    { code: 'KR', name: '한국어', flag: '🇰🇷' },
    { code: 'PT', name: 'Português', flag: '🇧🇷' },
    { code: 'NL', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'SV', name: 'Svenska', flag: '🇸🇪' },
    { code: 'AR', name: 'العربية', flag: '🇸🇦' },
    { code: 'HI', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ID', name: 'Bahasa', flag: '🇮🇩' }
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'KRW', symbol: '₩', name: 'Korean Won' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' }
  ];

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-synth-panel border border-neon-cyan p-6 max-w-3xl w-full relative skew-x-[-2deg]" onClick={e => e.stopPropagation()}>
         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"><X size={20} /></button>
         <h2 className="font-display text-2xl text-white mb-4 skew-x-[2deg]">SYSTEM_SETTINGS</h2>
         
         <div className="skew-x-[2deg]">
            {/* 搜索框 */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                <input 
                  type="text" 
                  placeholder="Search country or currency..." 
                  className="w-full bg-black/60 border border-white/20 pl-10 pr-4 py-2.5 text-white text-sm focus:border-neon-cyan outline-none rounded"
                />
              </div>
            </div>

            {/* 双列布局 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 左侧：语言/国家列表 */}
              <div className="flex flex-col">
                <label className="text-neon-purple text-xs font-bold mb-2 uppercase flex items-center gap-2">
                  <Globe size={14}/> Country / Language
                </label>
                <div className="h-[320px] overflow-y-auto bg-black/40 border border-white/20 rounded p-2 space-y-1 custom-scrollbar">
                  {languages.map(lang => (
                    <button 
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`w-full text-left px-3 py-2 font-display text-xs transition-all flex items-center justify-between group ${
                        selectedLanguage === lang.code 
                          ? 'bg-neon-cyan text-black font-bold' 
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span className="text-xs">{lang.name}</span>
                      </span>
                      {selectedLanguage === lang.code && (
                        <CheckCircle size={14} className="text-black"/>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 右侧：货币列表 */}
              <div className="flex flex-col">
                <label className="text-neon-purple text-xs font-bold mb-2 uppercase flex items-center gap-2">
                  <DollarSign size={14}/> Currency
                </label>
                <div className="h-[320px] overflow-y-auto bg-black/40 border border-white/20 rounded p-2 space-y-1 custom-scrollbar">
                  {currencies.map(currency => (
                    <button 
                      key={currency.code}
                      onClick={() => setSelectedCurrency(currency.code)}
                      className={`w-full text-left px-3 py-2 font-display text-xs transition-all flex items-center justify-between group ${
                        selectedCurrency === currency.code 
                          ? 'bg-neon-pink text-white font-bold' 
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold w-6">{currency.symbol}</span>
                        <span className="flex flex-col">
                          <span className="font-bold text-xs">{currency.code}</span>
                          <span className="text-[10px] opacity-70">{currency.name}</span>
                        </span>
                      </span>
                      {selectedCurrency === currency.code && (
                        <CheckCircle size={14} className="text-white"/>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="mt-4 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-black/60 border border-white/20 text-gray-400 font-display font-bold text-xs hover:border-white hover:text-white transition-all"
              >
                CANCEL
              </button>
              <button 
                onClick={() => {
                  onLanguageChange(selectedLanguage);
                  onCurrencyChange(selectedCurrency);
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-neon-purple to-neon-pink text-white font-display font-bold text-xs shadow-neon-pink hover:shadow-lg transition-all"
              >
                SAVE CONFIG
              </button>
            </div>
         </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => (
  <div onClick={onClick} className="group relative bg-synth-panel border border-white/10 hover:border-neon-cyan transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full">
    <div className="aspect-square relative overflow-hidden bg-black">
      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      {Math.random() > 0.5 && (
        <div className="absolute top-2 right-2 bg-neon-yellow text-black text-[10px] font-display font-bold px-2 py-1 transform skew-x-[-10deg]">
          {getTranslation('NEW DROP')}
        </div>
      )}
      {/* Video Indicator */}
      {product.mainVideo && (
         <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1 rounded-full backdrop-blur-sm">
             <Play size={12} fill="currentColor"/>
         </div>
      )}
    </div>
    <div className="p-3 md:p-5 relative flex-1 flex flex-col justify-between">
      <div>
        <div className="text-neon-purple text-[10px] md:text-xs font-display mb-1">{product.category}</div>
        <h3 className="font-display font-bold text-sm md:text-lg text-white uppercase italic tracking-wider leading-none group-hover:text-neon-cyan transition-colors line-clamp-2">{product.name}</h3>
      </div>
      <div className="flex justify-between items-end mt-4">
         <span className="font-display text-lg md:text-xl text-neon-yellow text-glow">{(product as any).displayPrice || `$${product.price}`}</span>
         <div className="w-6 h-6 md:w-8 md:h-8 bg-white/10 text-white flex items-center justify-center transform skew-x-[-10deg] group-hover:bg-neon-cyan group-hover:text-black transition-colors">
            <ArrowRight size={14} className="skew-x-[10deg] md:w-4 md:h-4" />
         </div>
      </div>
    </div>
  </div>
);

const CartDrawer: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  items: CartItem[];
  onUpdateQty: (cartItemId: string, delta: number) => void;
  onCheckout: () => void;
  isProcessing: boolean;
  currency?: string;
}> = ({ isOpen, onClose, items, onUpdateQty, onCheckout, isProcessing, currency = 'USD' }) => {
  const [exitingItems, setExitingItems] = useState<string[]>([]);
  const [convertedItems, setConvertedItems] = useState<CartItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  
  // 当货币或购物车变化时，重新转换价格
  useEffect(() => {
    const convertPrices = async () => {
      if (items.length === 0) {
        setConvertedItems([]);
        return;
      }
      
      setIsConverting(true);
      const converted = await Promise.all(items.map(async (item) => {
        try {
          // 对于组合商品，如果组合完整，使用当前price（组合价）
          // 否则使用originalPrice（原价）
          let basePrice = item.originalPrice || item.price;
          
          // 如果是组合商品且组合完整，使用当前price进行转换
          if (item.isBundleItem && item.bundleId) {
            const bundleItems = items.filter(i => i.bundleId === item.bundleId);
            const isBundleIntact = bundleItems.length === 2 && bundleItems[0].quantity === bundleItems[1].quantity;
            if (isBundleIntact) {
              basePrice = item.price; // 使用组合价
            }
          }
          
          const convertedPrice = await convertPrice(basePrice, 'USD', currency);
          return {
            ...item,
            price: convertedPrice
          };
        } catch (error) {
          console.error('Cart price conversion error:', error);
          return item;
        }
      }));
      setConvertedItems(converted);
      setIsConverting(false);
    };
    
    convertPrices();
  }, [items, currency]);
  
  const displayItems = convertedItems.length > 0 ? convertedItems : items;
  const total = displayItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleUpdateQty = (cartItemId: string, delta: number) => {
    const item = items.find(i => i.cartItemId === cartItemId);
    if (item && item.quantity + delta <= 0) {
      setExitingItems(prev => [...prev, cartItemId]);
      setTimeout(() => {
        onUpdateQty(cartItemId, delta);
        setExitingItems(prev => prev.filter(i => i !== cartItemId));
      }, 300);
    } else {
      onUpdateQty(cartItemId, delta);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] animate-fade-in" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#1a0b2e] border-l-2 border-neon-pink z-[80] transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b-2 border-neon-pink/30 flex justify-between items-center bg-black/20">
            <h2 className="font-display text-xl uppercase tracking-widest text-neon-pink italic font-black text-glow-pink">{getTranslation('INVENTORY')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {displayItems.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-neon-purple/50 font-display animate-fade-in">
                 <Monitor className="mb-4" size={48} />
                 <p className="tracking-widest uppercase">{getTranslation('System Empty')}</p>
               </div>
            ) : (
              displayItems.map((item, index) => {
                const hasDiscount = (item as any).volumeDiscount > 0;
                const originalPrice = item.price / (1 - ((item as any).volumeDiscount || 0) / 100);
                
                return (
                <div 
                  key={item.cartItemId || `${item.id}_${index}`}
                  className={`flex gap-4 p-3 border border-white/10 bg-white/5 hover:border-neon-cyan transition-all duration-300 ease-in-out ${exitingItems.includes(item.cartItemId || '') ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0 animate-fade-in'}`}
                >
                  <div className="w-16 h-16 bg-black aspect-square"><img src={item.images[0]} className="w-full h-full object-cover" /></div>
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                         <h3 className="font-display text-sm text-white uppercase tracking-wide">{item.name}</h3>
                         <button onClick={() => handleUpdateQty(item.cartItemId || '', -item.quantity)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                     </div>
                     <div className="flex items-center gap-2 mt-1">
                       <div className="text-neon-yellow font-mono font-bold text-sm tracking-tight">{formatPrice(item.price, currency)}</div>
                       {hasDiscount && (
                         <>
                           <div className="text-gray-500 line-through text-xs font-mono">{formatPrice(originalPrice, currency)}</div>
                           <div className="text-neon-cyan text-xs font-bold">-{(item as any).volumeDiscount}%</div>
                         </>
                       )}
                     </div>
                     <div className="flex items-center gap-3 mt-2">
                       <button 
                         onClick={() => handleUpdateQty(item.cartItemId || '', -1)}
                         className="text-neon-cyan hover:text-white font-bold text-lg px-2 transition-colors"
                       >
                         -
                       </button>
                       <span className="font-display text-white">{item.quantity}</span>
                       <button onClick={() => handleUpdateQty(item.cartItemId || '', 1)} className="text-neon-cyan hover:text-white font-bold text-lg px-2">+</button>
                     </div>
                  </div>
                </div>
              )}
              )
            )}
          </div>
          {displayItems.length > 0 && (
            <div className="p-6 border-t-2 border-neon-pink/30 bg-black/20">
               <div className="flex justify-between font-display text-sm text-gray-300 mb-6 uppercase tracking-wider">
                 <span>Total Amount</span>
                 <span className="text-neon-yellow text-xl text-glow font-mono font-bold tracking-tight">
                   {isConverting ? (
                     <Loader2 className="animate-spin inline" size={20} />
                   ) : (
                     formatPrice(total, currency)
                   )}
                 </span>
               </div>
               <RetroButton className="w-full" variant="action" onClick={onCheckout} disabled={isProcessing || isConverting} icon={isProcessing ? <Loader2 className="animate-spin" size={16}/> : <ArrowRight size={16}/>}>
                 {getTranslation('PROCEED TO CHECKOUT')}
               </RetroButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// --- NEW PAGE COMPONENTS ---

const LookbookView: React.FC = () => (
  <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="font-display text-5xl text-white font-black italic uppercase mb-12 text-center text-glow-pink">VISUAL_DATA_LOGS</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1515630278258-407f66498911?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=800'
          ].map((src, i) => (
              <div key={i} className={`group relative overflow-hidden border border-white/10 ${i % 3 === 0 ? 'md:col-span-2' : ''}`}>
                  <div className="absolute inset-0 bg-neon-purple/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                  <img src={src} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-105" />
                  <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-neon-cyan font-display text-sm font-bold">LOG_00{i+1}</div>
                  </div>
              </div>
          ))}
      </div>
  </div>
);

const BlogView: React.FC<{ onRead: (id: number) => void }> = ({ onRead }) => (
    <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 max-w-4xl mx-auto min-h-screen">
        <h1 className="font-display text-5xl text-white font-black italic uppercase mb-12 text-center text-glow-pink">TRANSMISSIONS</h1>
        <div className="space-y-12">
            {[
                { title: "THE FUTURE OF HAPTICS", date: "2084.04.12", desc: "How bio-feedback loops are revolutionizing intimacy.", img: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=800" },
                { title: "SYNTHETIC SENSATIONS", date: "2084.03.28", desc: "Exploring the boundary between neural inputs and physical touch.", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" },
                { title: "PRIVACY IN THE MESH", date: "2084.03.15", desc: "Why end-to-end encryption matters more than ever in connected devices.", img: "https://images.unsplash.com/photo-1515630278258-407f66498911?auto=format&fit=crop&q=80&w=800" }
            ].map((post, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-8 border-b border-white/10 pb-12 group cursor-pointer">
                    <div className="w-full md:w-1/3 aspect-video overflow-hidden border border-white/10">
                        <img src={post.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0" />
                    </div>
                    <div className="flex-1">
                        <div className="text-neon-purple font-display text-xs mb-2">{post.date} // DECRYPTED</div>
                        <h2 className="text-2xl font-display text-white font-bold mb-4 group-hover:text-neon-cyan transition-colors">{post.title}</h2>
                        <p className="text-gray-400 mb-6">{post.desc}</p>
                        <span className="text-neon-yellow text-xs font-display font-bold uppercase tracking-widest group-hover:underline">Read Protocol &gt;&gt;</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ContactView: React.FC = () => (
    <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 max-w-2xl mx-auto min-h-screen">
        <h1 className="font-display text-4xl text-white font-black italic uppercase mb-8 text-center text-glow-pink">SECURE UPLINK</h1>
        <div className="bg-synth-panel border border-white/10 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple to-neon-cyan"></div>
            <form className="space-y-6">
                <div>
                    <label className="block text-neon-cyan text-xs font-bold mb-2 uppercase">Node Identity (Name)</label>
                    <input type="text" className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none font-display" />
                </div>
                <div>
                    <label className="block text-neon-cyan text-xs font-bold mb-2 uppercase">Frequency (Email)</label>
                    <input type="email" className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none font-display" />
                </div>
                <div>
                    <label className="block text-neon-cyan text-xs font-bold mb-2 uppercase">Data Packet (Message)</label>
                    <textarea rows={6} className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-pink outline-none font-body"></textarea>
                </div>
                <RetroButton className="w-full" icon={<Send size={16}/>}>TRANSMIT DATA</RetroButton>
            </form>
            <div className="mt-8 pt-8 border-t border-white/10 text-center space-y-2">
                <div className="text-gray-400 text-sm">Or establish direct link via:</div>
                <div className="text-neon-yellow font-display text-lg">UPLINK@NEBULA.CORP</div>
            </div>
        </div>
    </div>
);

const FaqView: React.FC = () => (
  <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 max-w-4xl mx-auto min-h-screen">
    <h1 className="font-display text-4xl text-white font-black italic uppercase mb-12 text-center text-glow-pink">FAQ DATABASE</h1>
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 p-6">
        <h3 className="text-neon-cyan font-bold text-xl mb-2 flex items-center gap-2"><Lock size={20}/> Are shipments discreet?</h3>
        <p className="text-gray-300 text-lg">Yes. All packages are deployed in plain, vacuum-sealed stealth containers. No branding. No logs. The package will appear as "Tech Components" on scans.</p>
      </div>
      <div className="bg-white/5 border border-white/10 p-6">
        <h3 className="text-neon-cyan font-bold text-xl mb-2 flex items-center gap-2"><Shield size={20}/> Is my data secure?</h3>
        <p className="text-gray-300 text-lg">We use 256-bit quantum encryption. Your purchase history is wiped from the local node after 30 days. We do not sell data to mega-corps.</p>
      </div>
      <div className="bg-white/5 border border-white/10 p-6">
        <h3 className="text-neon-cyan font-bold text-xl mb-2 flex items-center gap-2"><RefreshCw size={20}/> What is the return policy?</h3>
        <p className="text-gray-300 text-lg">Due to bio-hazard protocols, open software (products) cannot be returned once the seal is broken. Hardware malfunctions are covered by a 1-year warranty.</p>
      </div>
    </div>
  </div>
);

const ShippingView: React.FC = () => (
  <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 max-w-4xl mx-auto min-h-screen">
    <h1 className="font-display text-4xl text-white font-black italic uppercase mb-12 text-center text-glow-pink">SHIPPING PROTOCOL</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-black border border-neon-purple p-8 text-center">
            <Truck size={48} className="mx-auto text-neon-purple mb-4" />
            <h3 className="text-white font-display text-xl font-bold mb-2">STANDARD RELAY</h3>
            <p className="text-gray-400">3-5 Galactic Cycles</p>
            <p className="text-neon-yellow font-bold mt-2">FREE over $500</p>
        </div>
        <div className="bg-black border border-neon-cyan p-8 text-center">
            <Zap size={48} className="mx-auto text-neon-cyan mb-4" />
            <h3 className="text-white font-display text-xl font-bold mb-2">PRIORITY WARP</h3>
            <p className="text-gray-400">24 Hours (Sector 7 Only)</p>
            <p className="text-neon-yellow font-bold mt-2">+ $25.00</p>
        </div>
    </div>
    <div className="mt-12 text-gray-300 space-y-4 text-lg">
        <p>All items are dispatched from our orbital warehouse within 2 hours of payment confirmation.</p>
        <p>Drone delivery is available for verified addresses in sectors with clearance level 2 or higher.</p>
    </div>
  </div>
);

const ReturnsView: React.FC = () => (
  <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 max-w-3xl mx-auto min-h-screen">
    <div className="border-l-4 border-neon-pink pl-6 mb-12">
        <h1 className="font-display text-4xl text-white font-black italic uppercase mb-2 text-glow-pink">RETURN POLICY</h1>
        <div className="text-neon-pink font-mono text-xs">DOC_REF: RTN-9982</div>
    </div>
    
    <div className="space-y-8 text-gray-300 text-lg">
        <p>
            <strong className="text-white">BIO-HAZARD WARNING:</strong> Due to the intimate nature of our neural interfaces and haptic devices, we strictly adhere to inter-galactic health codes.
        </p>
        
        <div className="bg-red-900/20 border border-red-500/50 p-6">
            <h3 className="text-red-500 font-display font-bold uppercase mb-2">NON-RETURNABLE</h3>
            <p className="text-sm">Any item that has been opened, unsealed, or used cannot be returned for a refund. This is for the safety of our entire network.</p>
        </div>

        <div className="bg-neon-cyan/10 border border-neon-cyan/50 p-6">
            <h3 className="text-neon-cyan font-display font-bold uppercase mb-2">DEFECTIVE HARDWARE</h3>
            <p className="text-sm">If your device malfunctions due to a manufacturing error within 1 year (Earth Time), we will issue a replacement unit immediately. Signal us via the Support Node.</p>
        </div>
    </div>
  </div>
);

const TrackingView: React.FC = () => (
    <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 max-w-2xl mx-auto min-h-screen text-center">
        <Radar size={64} className="mx-auto text-neon-pink mb-8 animate-spin-slow" />
        <h1 className="font-display text-4xl text-white font-black italic uppercase mb-8">SIGNAL TRACKER</h1>
        <div className="bg-synth-panel border border-white/10 p-8">
            <p className="text-gray-400 mb-6">Locate your package in the mesh network.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <input type="text" placeholder="ENTER ORDER_ID (e.g. NEB-X89)" className="flex-1 bg-black border border-white/20 p-4 text-white focus:border-neon-cyan outline-none font-display uppercase" />
                <RetroButton>SCAN</RetroButton>
            </div>
        </div>
    </div>
);

const InfoPageView: React.FC<{ title: string; content: React.ReactNode }> = ({ title, content }) => (
    <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 max-w-3xl mx-auto min-h-screen">
        <div className="border-l-4 border-neon-purple pl-6 mb-12">
            <h1 className="font-display text-4xl text-white font-black italic uppercase mb-2 text-glow-pink">{title}</h1>
            <div className="text-neon-cyan font-mono text-xs">SYSTEM_DOC_V.2.0.84</div>
        </div>
        <div className="text-gray-300 font-body text-lg leading-relaxed">
            {content}
        </div>
    </div>
);

// --- VIEWS ---

const CheckoutView: React.FC<{ 
    cart: CartItem[]; 
    onBack: () => void; 
    onProcessPayment: (method: string) => void; 
    isProcessing: boolean; 
    onUpdateQuantity: (cartItemId: string, newQuantity: number) => void; 
    currency?: string;
    shippingConfig?: StoreConfig['shippingConfig']; 
}> = ({ cart, onBack, onProcessPayment, isProcessing, onUpdateQuantity, currency = 'USD', shippingConfig }) => {
    const [convertedCart, setConvertedCart] = useState<CartItem[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    
    // 地址表单状态
    const [shippingInfo, setShippingInfo] = useState({
        email: '',
        country: 'United States',
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
        phone: ''
    });
    
    // 表单错误状态
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    
    // 是否尝试过提交（用于显示错误）
    const [attempted, setAttempted] = useState(false);
    
    // 验证单个字段
    const validateField = (name: string, value: string) => {
        switch(name) {
            case 'email':
                if (!value.trim()) return 'Enter an email';
                if (!value.includes('@')) return 'Enter a valid email';
                return '';
            case 'firstName':
                return !value.trim() ? 'Enter a first name' : '';
            case 'lastName':
                return !value.trim() ? 'Enter a last name' : '';
            case 'address':
                return !value.trim() ? 'Enter an address' : '';
            case 'city':
                return !value.trim() ? 'Enter a city' : '';
            case 'state':
                return !value.trim() ? 'Select a state' : '';
            case 'zipCode':
                return !value.trim() ? 'Enter a ZIP code' : '';
            case 'phone':
                return !value.trim() ? 'Enter a phone number' : '';
            default:
                return '';
        }
    };
    
    // 验证所有必填字段，返回实际值
    const validateAllFields = (): { isValid: boolean; values: typeof shippingInfo } => {
        // 🔧 处理浏览器自动填充：从 DOM 中读取实际值
        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        const firstNameInput = document.querySelector('input[placeholder="First name"]') as HTMLInputElement;
        const lastNameInput = document.querySelector('input[placeholder="Last name"]') as HTMLInputElement;
        const addressInput = document.querySelector('input[placeholder="Address"]') as HTMLInputElement;
        const cityInput = document.querySelector('input[placeholder="City"]') as HTMLInputElement;
        const stateInput = document.querySelector('input[placeholder*="State"]') as HTMLInputElement;
        const zipInput = document.querySelector('input[placeholder="ZIP code"]') as HTMLInputElement;
        const phoneInput = document.querySelector('input[placeholder="Phone"]') as HTMLInputElement;
        
        // 如果 DOM 中有值但状态是空的，更新状态
        const actualValues = {
            email: emailInput?.value || shippingInfo.email,
            country: shippingInfo.country,
            firstName: firstNameInput?.value || shippingInfo.firstName,
            lastName: lastNameInput?.value || shippingInfo.lastName,
            address: addressInput?.value || shippingInfo.address,
            apartment: shippingInfo.apartment,
            city: cityInput?.value || shippingInfo.city,
            state: stateInput?.value || shippingInfo.state,
            zipCode: zipInput?.value || shippingInfo.zipCode,
            phone: phoneInput?.value || shippingInfo.phone
        };
        
        // 更新状态（同步浏览器自动填充的值）
        setShippingInfo(actualValues);
        
        const newErrors: {[key: string]: string} = {};
        const fieldOrder = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone'];
        
        fieldOrder.forEach(key => {
            const value = actualValues[key as keyof typeof actualValues];
            const error = validateField(key, value);
            if (error) {
                newErrors[key] = error;
            }
        });
        
        setErrors(newErrors);
        setAttempted(true);
        
        const isValid = Object.keys(newErrors).length === 0;
        
        // 如果验证失败，输出详细错误信息
        if (!isValid) {
            console.error('❌ 表单验证失败，缺少以下字段：', Object.keys(newErrors));
            console.error('当前实际值：', JSON.stringify(actualValues, null, 2));
        }
        
        // 如果有错误，滚动到第一个错误字段
        if (!isValid) {
            const firstErrorField = fieldOrder.find(key => newErrors[key]);
            if (firstErrorField) {
                // 稍微延迟以确保错误状态已更新
                setTimeout(() => {
                    const element = document.querySelector(`input[placeholder*="${getPlaceholder(firstErrorField)}"]`) as HTMLElement;
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.focus();
                    }
                }, 100);
            }
        }
        
        return { isValid, values: actualValues };
    };
    
    // 获取字段的placeholder文本（用于定位元素）
    const getPlaceholder = (fieldName: string) => {
        const placeholders: {[key: string]: string} = {
            'email': 'Email',
            'firstName': 'First name',
            'lastName': 'Last name',
            'address': 'Address',
            'city': 'City',
            'state': 'State',
            'zipCode': 'ZIP',
            'phone': 'Phone'
        };
        return placeholders[fieldName] || '';
    };
    
    // 当货币或购物车变化时，重新转换价格
    useEffect(() => {
        const convertPrices = async () => {
            if (cart.length === 0) {
                setConvertedCart([]);
                return;
            }
            
            setIsConverting(true);
            const converted = await Promise.all(cart.map(async (item) => {
                try {
                    // 使用原始USD价格转换到当前货币
                    const basePrice = item.originalPrice || item.price;
                    const convertedPrice = await convertPrice(basePrice, 'USD', currency);
                    return {
                        ...item,
                        price: convertedPrice
                    };
                } catch (error) {
                    console.error('Checkout price conversion error:', error);
                    return item;
                }
            }));
            setConvertedCart(converted);
            setIsConverting(false);
        };
        
        convertPrices();
    }, [cart, currency]);
    
    const displayCart = convertedCart.length > 0 ? convertedCart : cart;
    const subtotal = displayCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    
    // 根据后台配置计算运费
    const calculateShipping = () => {
        if (!shippingConfig || displayCart.length === 0 || subtotal === 0) {
            return 0;
        }
        
        switch (shippingConfig.type) {
            case 'FREE':
                return 0;
            case 'FIXED':
                return shippingConfig.fixedAmount || 0;
            case 'THRESHOLD':
                const threshold = shippingConfig.freeShippingThreshold || 500;
                const fixedAmount = shippingConfig.fixedAmount || 25;
                return subtotal >= threshold ? 0 : fixedAmount;
            default:
                return 0;
        }
    };
    
    const shipping = calculateShipping();
    const total = subtotal + shipping;
    
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PAYPAL'>('CARD');
    const [isPayPalLoading, setIsPayPalLoading] = useState(true); // PayPal按钮加载状态
    const [isGooglePayLoading, setIsGooglePayLoading] = useState(true); // Google Pay按钮加载状态

    // 监听 paymentMethod 变化，当切换回 Credit Card 时重新渲染 CardFields
    useEffect(() => {
        if (paymentMethod === 'CARD') {
            // 延迟一下确保 DOM 元素已经显示
            setTimeout(() => {
                const cardFieldInstance = (window as any).paypalCardFieldInstance;
                if (!cardFieldInstance) {
                    console.log('⚠️ CardField instance not found');
                    return;
                }

                // 检查所有元素是否存在
                const numberEl = document.getElementById('card-number-field');
                const expiryEl = document.getElementById('card-expiry-field');
                const cvvEl = document.getElementById('card-cvv-field');
                const nameEl = document.getElementById('card-name-field');

                if (!numberEl || !expiryEl || !cvvEl || !nameEl) {
                    console.log('⚠️ CardFields DOM 元素不存在');
                    return;
                }

                // 检查是否已经渲染过（检查是否有 iframe）
                if (numberEl.querySelector('iframe')) {
                    console.log('✅ CardFields 已经渲染，跳过');
                    return;
                }

                console.log('🔄 重新渲染 CardFields...');

                // 清空所有容器（重要！）
                numberEl.innerHTML = '';
                expiryEl.innerHTML = '';
                cvvEl.innerHTML = '';
                nameEl.innerHTML = '';

                try {
                    // 渲染所有字段
                    const numberField = cardFieldInstance.NumberField({
                        style: {
                            input: {
                                'font-size': '16px',
                                'color': '#000000',
                                'font-family': 'inherit'
                            },
                            '::placeholder': {
                                'color': '#999999'
                            }
                        },
                        placeholder: 'Card number'
                    });
                    numberField.render('#card-number-field');

                    const expiryField = cardFieldInstance.ExpiryField({
                        style: {
                            input: {
                                'font-size': '16px',
                                'color': '#000000',
                                'font-family': 'inherit'
                            },
                            '::placeholder': {
                                'color': '#999999'
                            }
                        },
                        placeholder: 'MM/YY'
                    });
                    expiryField.render('#card-expiry-field');

                    const cvvField = cardFieldInstance.CVVField({
                        style: {
                            input: {
                                'font-size': '16px',
                                'color': '#000000',
                                'font-family': 'inherit'
                            },
                            '::placeholder': {
                                'color': '#999999'
                            }
                        },
                        placeholder: 'CVV'
                    });
                    cvvField.render('#card-cvv-field');

                    const nameField = cardFieldInstance.NameField({
                        style: {
                            input: {
                                'font-size': '16px',
                                'color': '#000000',
                                'font-family': 'inherit'
                            },
                            '::placeholder': {
                                'color': '#999999'
                            }
                        },
                        placeholder: 'Name on card'
                    });
                    nameField.render('#card-name-field');

                    // 保存实例
                    (window as any).paypalCardField = cardFieldInstance;
                    console.log('✅ CardFields 重新渲染完成');
                } catch (error) {
                    console.error('❌ CardFields 渲染错误:', error);
                }
            }, 150);
        }
    }, [paymentMethod]);

    // 加载 PayPal SDK（支持 Buttons 和 CardFields）
    useEffect(() => {
        if (document.getElementById('paypal-sdk-script')) return;
        
        const script = document.createElement('script');
        script.id = 'paypal-sdk-script';
        // 使用环境变量中的 PayPal Client ID
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons,card-fields&enable-funding=paylater`;
        script.onerror = (error) => {
            console.error('❌ Failed to load PayPal SDK script!', error);
            console.error('SDK URL:', script.src);
        };
        
        script.onload = () => {
            const paypal = (window as any).paypal;
            
            console.log('=== PayPal SDK Loaded ===');
            console.log('PayPal:', !!paypal);
            console.log('PayPal.Buttons:', !!paypal.Buttons);
            console.log('PayPal.FUNDING:', paypal.FUNDING);
            console.log('PayPal.FUNDING.GOOGLEPAY:', paypal.FUNDING ? paypal.FUNDING.GOOGLEPAY : 'undefined');
            console.log('PayPal.FUNDING.PAYPAL:', paypal.FUNDING ? paypal.FUNDING.PAYPAL : 'undefined');
            
            // PayPal 按钮（左侧 - Express Checkout）
            if (paypal && paypal.Buttons) {
                paypal.Buttons({
                    style: {
                        layout: 'horizontal',
                        height: window.innerWidth < 640 ? 44 : 48,  // 手机端44px，平板及以上48px
                        shape: 'rect',
                        label: 'paypal',
                        tagline: false
                    },
                    fundingSource: paypal.FUNDING.PAYPAL,
                    createOrder: async () => {
                        const response = await fetch(`${API_BASE_URL}/api/create-paypal-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cart, currency: 'USD' })
                        });
                        const { orderID } = await response.json();
                        return orderID;
                    },
                    onApprove: async (data: any) => {
                        const response = await fetch(`${API_BASE_URL}/api/capture-paypal-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                orderID: data.orderID, 
                                cart: cart,
                                shippingInfo: shippingInfo  // 添加收货信息
                            })
                        });
                        const result = await response.json();
                        if (result.success) {
                            window.location.href = `#/checkout-success?method=paypal&orderID=${data.orderID}`;
                        }
                    },
                    onError: (err: any) => {
                        console.error('PayPal Error:', err);
                    }
                }).render('#paypal-button-container').then(() => {
                    console.log('✅ PayPal Express button rendered');
                    setIsPayPalLoading(false); // PayPal按钮加载完成
                }).catch((err: any) => {
                    console.error('Failed to render PayPal button:', err);
                    setIsPayPalLoading(false);
                });
                
                // 同时在底部渲染 PayPal 官方按钮（用于 PayPal 支付方式选中时）
                paypal.Buttons({
                    style: {
                        layout: 'horizontal',
                        height: window.innerWidth < 640 ? 48 : 55,  // 手机端48px，大屏55px
                        shape: 'rect',
                        color: 'blue',
                        label: 'pay',
                        tagline: false
                    },
                    fundingSource: paypal.FUNDING.PAYPAL,
                    createOrder: async () => {
                        const response = await fetch(`${API_BASE_URL}/api/create-paypal-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cart, currency: 'USD' })
                        });
                        const { orderID } = await response.json();
                        return orderID;
                    },
                    onApprove: async (data: any) => {
                        const response = await fetch(`${API_BASE_URL}/api/capture-paypal-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                orderID: data.orderID, 
                                cart: cart,
                                shippingInfo: shippingInfo  // 添加收货信息
                            })
                        });
                        const result = await response.json();
                        if (result.success) {
                            window.location.href = `#/checkout-success?method=paypal&orderID=${data.orderID}`;
                        }
                    },
                    onError: (err: any) => {
                        console.error('PayPal Error:', err);
                    }
                }).render('#bottom-paypal-button-container').then(() => {
                    console.log('✅ Bottom PayPal button rendered');
                }).catch((err: any) => {
                    console.error('Failed to render bottom PayPal button:', err);
                });
            }
            
            // Google Pay 按钮（右侧）- 直接集成 Google Pay API
            // 不依赖 PayPal FUNDING.GOOGLEPAY
            console.log('\n=== Google Pay Direct Integration ===');
            
            // 加载 Google Pay SDK
            const loadGooglePaySDK = () => {
                return new Promise((resolve, reject) => {
                    if ((window as any).google?.payments?.api?.PaymentsClient) {
                        resolve(true);
                        return;
                    }
                    
                    const script = document.createElement('script');
                    script.src = 'https://pay.google.com/gp/p/js/pay.js';
                    script.async = true;
                    script.onload = () => resolve(true);
                    script.onerror = () => reject(new Error('Failed to load Google Pay SDK'));
                    document.head.appendChild(script);
                });
            };
            
            loadGooglePaySDK().then(() => {
                console.log('✅ Google Pay SDK loaded');
                
                const googlePayClient = new (window as any).google.payments.api.PaymentsClient({
                    environment: 'TEST' // 沙箱环境
                });
                
                const baseRequest = {
                    apiVersion: 2,
                    apiVersionMinor: 0
                };
                
                const tokenizationSpecification = {
                    type: 'PAYMENT_GATEWAY',
                    parameters: {
                        gateway: 'example',
                        gatewayMerchantId: 'exampleGatewayMerchantId'
                    }
                };
                
                const cardPaymentMethod = {
                    type: 'CARD',
                    parameters: {
                        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                        allowedCardNetworks: ['MASTERCARD', 'VISA']
                    },
                    tokenizationSpecification: tokenizationSpecification
                };
                
                const isReadyToPayRequest = Object.assign({}, baseRequest);
                (isReadyToPayRequest as any).allowedPaymentMethods = [cardPaymentMethod];
                
                googlePayClient.isReadyToPay(isReadyToPayRequest)
                    .then((response: any) => {
                        console.log('✅ Google Pay isReadyToPay:', response);
                        
                        if (response.result) {
                            // 创建 Google Pay 按钮
                            let isProcessing = false; // 防止重复点击
                            
                            const button = googlePayClient.createButton({
                                onClick: () => {
                                    if (isProcessing) {
                                        console.log('⚠️ Payment already in progress');
                                        return;
                                    }
                                                    
                                    isProcessing = true;
                                    console.log('Google Pay button clicked');
                                    
                                    const paymentDataRequest = Object.assign({}, baseRequest);
                                    (paymentDataRequest as any).allowedPaymentMethods = [cardPaymentMethod];
                                    (paymentDataRequest as any).transactionInfo = {
                                        totalPriceStatus: 'FINAL',
                                        totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2),
                                        currencyCode: 'USD',
                                        countryCode: 'US'
                                    };
                                    (paymentDataRequest as any).merchantInfo = {
                                        merchantName: 'Nebula Cyberpunk Shop'
                                    };
                                    
                                    googlePayClient.loadPaymentData(paymentDataRequest)
                                        .then(async (paymentData: any) => {
                                            console.log('Payment Data:', paymentData);
                                            
                                            // 创建 PayPal 订单
                                            const response = await fetch(`${API_BASE_URL}/api/create-paypal-order`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ cart, currency: 'USD' })
                                            });
                                            const { orderID } = await response.json();
                                            
                                            // 捕获支付（使用 PayPal 后端处理）
                                            const captureResponse = await fetch(`${API_BASE_URL}/api/capture-paypal-order`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ 
                                                    orderID, 
                                                    cart,
                                                    shippingInfo: shippingInfo  // 添加收货信息
                                                })
                                            });
                                            const result = await captureResponse.json();
                                            
                                            if (result.success) {
                                                window.location.href = `#/checkout-success?method=googlepay&orderID=${orderID}`;
                                            } else {
                                                alert('支付失败，请重试');
                                                isProcessing = false;
                                            }
                                        })
                                        .catch((err: any) => {
                                            console.error('Google Pay payment error:', err);
                                            isProcessing = false;
                                            
                                            if (err.statusCode === 'CANCELED') {
                                                console.log('User cancelled the payment');
                                            } else {
                                                alert('支付错误：' + (err.message || '请重试'));
                                            }
                                        });
                                },
                                buttonColor: 'black',
                                buttonType: 'pay',
                                buttonSizeMode: 'fill',
                                buttonRadius: 4
                            });
                            
                            // 确保按钮大小与 PayPal 一致（响应式）
                            const isMobile = window.innerWidth < 640;
                            const buttonHeight = isMobile ? '44px' : '48px';
                            button.style.width = '100%';
                            button.style.height = buttonHeight;
                            button.style.minHeight = buttonHeight;
                            button.style.maxHeight = buttonHeight;
                            
                            const container = document.getElementById('googlepay-button-container');
                            if (container) {
                                container.innerHTML = '';
                                container.appendChild(button);
                                console.log('✅ Google Pay button rendered!');
                                setIsGooglePayLoading(false); // Google Pay按钮加载完成
                            }
                        } else {
                            console.log('⚠️ Google Pay not available on this device');
                            setIsGooglePayLoading(false);
                            const container = document.getElementById('googlepay-button-container');
                            if (container) {
                                container.style.display = 'none';
                            }
                        }
                    })
                    .catch((err: any) => {
                        console.error('❌ isReadyToPay error:', err);
                        setIsGooglePayLoading(false);
                        const container = document.getElementById('googlepay-button-container');
                        if (container) {
                            container.style.display = 'none';
                        }
                    });
            }).catch((err: any) => {
                console.error('❌ Failed to load Google Pay SDK:', err);
                setIsGooglePayLoading(false);
                const container = document.getElementById('googlepay-button-container');
                if (container) {
                    container.style.display = 'none';
                }
            });
            
            // 初始化 CardFields（信用卡支付）
            if (paypal.CardFields) {
                // 存储验证后的实际值
                let validatedShippingInfo: typeof shippingInfo | null = null;
                
                const cardField = paypal.CardFields({
                    createOrder: async () => {
                        // 验证表单
                        const validation = validateAllFields();
                        if (!validation.isValid) {
                            throw new Error('表单验证失败');
                        }
                        // 保存验证后的值
                        validatedShippingInfo = validation.values;
                        console.log('💾 [信用卡] 保存验证后的收货信息:', validatedShippingInfo);
                        
                        const response = await fetch(`${API_BASE_URL}/api/create-paypal-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cart, currency: 'USD' })
                        });
                        const { orderID } = await response.json();
                        return orderID;
                    },
                    onApprove: async (data: any) => {
                        console.log('💳 Card payment approved:', data);
                        console.log('📦 [信用卡] 使用验证后的收货信息:', validatedShippingInfo);
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/capture-paypal-order`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                    orderID: data.orderID, 
                                    cart: cart,
                                    shippingInfo: validatedShippingInfo || shippingInfo  // 使用验证后的值
                                })
                            });
                            
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            
                            const result = await response.json();
                            console.log('💰 Capture result:', result);
                            
                            if (result.success) {
                                console.log('✅ 支付成功！');
                                alert(`✅ 支付成功！

订单号: ${data.orderID}
支付状态: ${result.status}

感谢您的购买！`);
                                window.location.href = '#/shop';
                            } else {
                                console.error('❌ Capture failed:', result);
                                alert(`支付失败: ${result.error || '未知错误'}`);
                            }
                        } catch (error: any) {
                            console.error('❌ Capture error:', error);
                            if (error.message && error.message.includes('timeout')) {
                                console.log('⚠️ 请求超时，但支付可能已成功');
                                alert(`✅ 支付已提交！

订单号: ${data.orderID}

请稍后检查支付状态。`);
                                window.location.href = '#/shop';
                            } else {
                                alert(`支付失败: ${error.message || '请联系客服'}`);
                            }
                        }
                    },
                    onError: (err: any) => {
                        // 如果已经跳转到成功页面，忽略错误
                        if (window.location.hash.includes('checkout-success')) {
                            console.log('⚠️ 忽略错误（已成功跳转）:', err);
                            return;
                        }
                        console.error('Card Error:', err);
                        alert('支付过程中出现错误，请检查卡片信息');
                    }
                });
                
                // 检查 CardFields 是否可用
                if (cardField.isEligible()) {
                    // 等待 DOM 元素就绪（默认选中 Credit Card）
                    setTimeout(() => {
                        // 检查所有元素是否存在
                        const numberEl = document.getElementById('card-number-field');
                        const expiryEl = document.getElementById('card-expiry-field');
                        const cvvEl = document.getElementById('card-cvv-field');
                        const nameEl = document.getElementById('card-name-field');
                        
                        if (!numberEl || !expiryEl || !cvvEl || !nameEl) {
                            console.log('⚠️ CardFields 元素尚未就绪，等待用户选择 Credit Card');
                            // 保存 cardField 实例，等待后续渲染
                            (window as any).paypalCardFieldInstance = cardField;
                            return;
                        }
                        
                        // 渲染卡号字段
                        const numberField = cardField.NumberField({
                            style: {
                                input: {
                                    'font-size': '16px',
                                    'color': '#000000',
                                    'font-family': 'inherit'
                                },
                                '::placeholder': {
                                    'color': '#999999'
                                }
                            },
                            placeholder: 'Card number'
                        });
                        numberField.render('#card-number-field');
                        
                        // 渲染有效期字段
                        const expiryField = cardField.ExpiryField({
                            style: {
                                input: {
                                    'font-size': '16px',
                                    'color': '#000000',
                                    'font-family': 'inherit'
                                },
                                '::placeholder': {
                                    'color': '#999999'
                                }
                            },
                            placeholder: 'MM/YY'
                        });
                        expiryField.render('#card-expiry-field');
                        
                        // 渲染 CVV 字段
                        const cvvField = cardField.CVVField({
                            style: {
                                input: {
                                    'font-size': '16px',
                                    'color': '#000000',
                                    'font-family': 'inherit'
                                },
                                '::placeholder': {
                                    'color': '#999999'
                                }
                            },
                            placeholder: 'CVV'
                        });
                        cvvField.render('#card-cvv-field');
                        
                        // 渲染持卡人姓名字段
                        const nameField = cardField.NameField({
                            style: {
                                input: {
                                    'font-size': '16px',
                                    'color': '#000000',
                                    'font-family': 'inherit'
                                },
                                '::placeholder': {
                                    'color': '#999999'
                                }
                            },
                            placeholder: 'Name on card'
                        });
                        nameField.render('#card-name-field');
                        
                        // 保存 cardField 实例供提交按钮和重新渲染使用
                        (window as any).paypalCardField = cardField;
                        (window as any).paypalCardFieldInstance = cardField;  // 同时保存实例
                        console.log('✅ CardFields 渲染完成');
                    }, 100);
                } else {
                    console.error('CardFields not eligible');
                }
            }
        };
        
        document.body.appendChild(script);
    }, []);

    // 🆕 监听paymentMethod变化，重新渲染CardFields
    useEffect(() => {
        if (paymentMethod !== 'CARD') return;
        
        const paypal = (window as any).paypal;
        if (!paypal || !paypal.CardFields) return;
        
        // 检查DOM元素是否存在
        const numberEl = document.getElementById('card-number-field');
        const expiryEl = document.getElementById('card-expiry-field');
        const cvvEl = document.getElementById('card-cvv-field');
        const nameEl = document.getElementById('card-name-field');
        
        if (!numberEl || !expiryEl || !cvvEl || !nameEl) {
            console.log('⚠️ CardFields DOM元素尚未就绪');
            return;
        }
        
        // 检查是否已经渲染
        if (numberEl.innerHTML !== '' && (window as any).paypalCardField) {
            console.log('✅ CardFields已存在，无需重新渲染');
            return;
        }
        
        console.log('🔄 重新渲染CardFields...');
        
        // 清空旧内容
        numberEl.innerHTML = '';
        expiryEl.innerHTML = '';
        cvvEl.innerHTML = '';
        nameEl.innerHTML = '';
        
        // 使用存储的CardField实例或创建新实例
        let cardFieldInstance = (window as any).paypalCardFieldInstance;
        
        if (!cardFieldInstance) {
            // 存储验证后的实际值
            let validatedShippingInfo: typeof shippingInfo | null = null;
            
            cardFieldInstance = paypal.CardFields({
                createOrder: async () => {
                    // 验证表单
                    const validation = validateAllFields();
                    if (!validation.isValid) {
                        throw new Error('表单验证失败');
                    }
                    // 保存验证后的值
                    validatedShippingInfo = validation.values;
                    console.log('💾 [信用卡-重渲染] 保存验证后的收货信息:', validatedShippingInfo);
                    
                    const response = await fetch(`${API_BASE_URL}/api/create-paypal-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cart, currency: 'USD' })
                    });
                    const { orderID } = await response.json();
                    return orderID;
                },
                onApprove: async (data: any) => {
                    console.log('💳 Card payment approved:', data);
                    console.log('📦 [信用卡-重渲染] 使用验证后的收货信息:', validatedShippingInfo);
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/capture-paypal-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                orderID: data.orderID, 
                                cart: cart,
                                shippingInfo: validatedShippingInfo || shippingInfo  // 使用验证后的值
                            })
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const result = await response.json();
                        console.log('💰 Capture result:', result);
                        
                        if (result.success) {
                            console.log('✅ 支付成功！');
                            alert(`✅ 支付成功！

订单号: ${data.orderID}
支付状态: ${result.status}

感谢您的购买！`);
                            window.location.href = '#/shop';
                        } else {
                            console.error('❌ Capture failed:', result);
                            alert(`支付失败: ${result.error || '未知错误'}`);
                        }
                    } catch (error: any) {
                        console.error('❌ Capture error:', error);
                        // 支付已成功但前端超时，直接跳转
                        if (error.name === 'AbortError' || error.message.includes('timeout')) {
                            console.log('⚠️ 请求超时，但支付可能已成功');
                            alert(`✅ 支付已提交！

订单号: ${data.orderID}

请稍后检查支付状态。`);
                            window.location.href = '#/shop';
                        } else {
                            alert(`支付失败: ${error.message || '请联系客服'}`);
                        }
                    }
                },
                onError: (err: any) => {
                    // 如果已经跳转到成功页面，忽略错误
                    if (window.location.hash.includes('checkout-success')) {
                        console.log('⚠️ 忽略错误（已成功跳转）:', err);
                        return;
                    }
                    console.error('Card Error:', err);
                    alert('支付过程中出现错误，请检查卡片信息');
                }
            });
            
            if (!cardFieldInstance.isEligible()) {
                console.error('CardFields not eligible');
                return;
            }
            
            (window as any).paypalCardFieldInstance = cardFieldInstance;
        }
        
        // 渲染各个字段
        try {
            cardFieldInstance.NumberField({
                style: {
                    input: { 'font-size': '16px', 'color': '#000000', 'font-family': 'inherit' },
                    '::placeholder': { 'color': '#999999' }
                },
                placeholder: 'Card number'
            }).render('#card-number-field');
            
            cardFieldInstance.ExpiryField({
                style: {
                    input: { 'font-size': '16px', 'color': '#000000', 'font-family': 'inherit' },
                    '::placeholder': { 'color': '#999999' }
                },
                placeholder: 'MM/YY'
            }).render('#card-expiry-field');
            
            cardFieldInstance.CVVField({
                style: {
                    input: { 'font-size': '16px', 'color': '#000000', 'font-family': 'inherit' },
                    '::placeholder': { 'color': '#999999' }
                },
                placeholder: 'CVV'
            }).render('#card-cvv-field');
            
            cardFieldInstance.NameField({
                style: {
                    input: { 'font-size': '16px', 'color': '#000000', 'font-family': 'inherit' },
                    '::placeholder': { 'color': '#999999' }
                },
                placeholder: 'Name on card'
            }).render('#card-name-field');
            
            (window as any).paypalCardField = cardFieldInstance;
            console.log('✅ CardFields重新渲染成功');
        } catch (error) {
            console.error('❌ CardFields渲染失败:', error);
        }
    }, [paymentMethod, cart]);

    // 监听组件挂载，重新渲染PayPal按钮（当SDK已加载但按钮未渲染时）
    useEffect(() => {
        const paypal = (window as any).paypal;
        if (!paypal) return;

        // 检查按钮容器是否存在且为空
        const topContainer = document.getElementById('paypal-button-container');
        const bottomContainer = document.getElementById('bottom-paypal-button-container');
        const googlePayContainer = document.getElementById('googlepay-button-container');
        
        // 重新渲染PayPal按钮
        if (topContainer && topContainer.innerHTML === '') {
            console.log('🔄 Re-rendering PayPal buttons...');
            
            // 渲染顶部Express Checkout按钮
            paypal.Buttons({
                style: {
                    layout: 'horizontal',
                    height: window.innerWidth < 640 ? 44 : 48,
                    shape: 'rect',
                    label: 'paypal',
                    tagline: false
                },
                fundingSource: paypal.FUNDING.PAYPAL,
                createOrder: async () => {
                    const response = await fetch(`${API_BASE_URL}/api/create-paypal-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cart: displayCart, currency: 'USD' })
                    });
                    const { orderID } = await response.json();
                    return orderID;
                },
                onApprove: async (data: any) => {
                    const response = await fetch(`${API_BASE_URL}/api/capture-paypal-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            orderID: data.orderID, 
                            cart: displayCart,
                            shippingInfo: shippingInfo  // 添加收货信息
                        })
                    });
                    const result = await response.json();
                    if (result.success) {
                        window.location.href = `#/checkout-success?method=paypal&orderID=${data.orderID}`;
                    }
                },
                onError: (err: any) => {
                    console.error('PayPal Error:', err);
                }
            }).render('#paypal-button-container').then(() => {
                console.log('✅ PayPal Express button re-rendered');
                setIsPayPalLoading(false);
            }).catch((err: any) => {
                console.error('Failed to re-render PayPal button:', err);
                setIsPayPalLoading(false);
            });
        }
        
        if (bottomContainer && bottomContainer.innerHTML === '') {
            // 渲染底部PayPal按钮
            paypal.Buttons({
                style: {
                    layout: 'horizontal',
                    height: window.innerWidth < 640 ? 48 : 55,
                    shape: 'rect',
                    color: 'blue',
                    label: 'pay',
                    tagline: false
                },
                fundingSource: paypal.FUNDING.PAYPAL,
                createOrder: async () => {
                    const response = await fetch(`${API_BASE_URL}/api/create-paypal-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cart: displayCart, currency: 'USD' })
                    });
                    const { orderID } = await response.json();
                    return orderID;
                },
                onApprove: async (data: any) => {
                    const response = await fetch(`${API_BASE_URL}/api/capture-paypal-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            orderID: data.orderID, 
                            cart: displayCart,
                            shippingInfo: shippingInfo  // 添加收货信息
                        })
                    });
                    const result = await response.json();
                    if (result.success) {
                        window.location.href = `#/checkout-success?method=paypal&orderID=${data.orderID}`;
                    }
                },
                onError: (err: any) => {
                    console.error('PayPal Error:', err);
                }
            }).render('#bottom-paypal-button-container').then(() => {
                console.log('✅ Bottom PayPal button re-rendered');
            }).catch((err: any) => {
                console.error('Failed to re-render bottom PayPal button:', err);
            });
        }
        
        // 重新渲染Google Pay按钮
        if (googlePayContainer && googlePayContainer.innerHTML === '') {
            console.log('🔄 Re-rendering Google Pay button...');
            
            const renderGooglePay = async () => {
                try {
                    // 确保Google Pay SDK已加载
                    if (!(window as any).google?.payments?.api?.PaymentsClient) {
                        console.log('⚠️ Google Pay SDK not loaded, skipping...');
                        setIsGooglePayLoading(false);
                        return;
                    }
                    
                    const googlePayClient = new (window as any).google.payments.api.PaymentsClient({
                        environment: 'TEST'
                    });
                    
                    const baseRequest = {
                        apiVersion: 2,
                        apiVersionMinor: 0
                    };
                    
                    const tokenizationSpecification = {
                        type: 'PAYMENT_GATEWAY',
                        parameters: {
                            gateway: 'example',
                            gatewayMerchantId: 'exampleGatewayMerchantId'
                        }
                    };
                    
                    const cardPaymentMethod = {
                        type: 'CARD',
                        parameters: {
                            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                            allowedCardNetworks: ['MASTERCARD', 'VISA']
                        },
                        tokenizationSpecification: tokenizationSpecification
                    };
                    
                    const isReadyToPayRequest = Object.assign({}, baseRequest);
                    (isReadyToPayRequest as any).allowedPaymentMethods = [cardPaymentMethod];
                    
                    const response = await googlePayClient.isReadyToPay(isReadyToPayRequest);
                    
                    if (response.result) {
                        const button = googlePayClient.createButton({
                            onClick: () => {
                                console.log('Google Pay button clicked');
                                alert('Google Pay integration - Demo mode');
                            },
                            buttonColor: 'black',
                            buttonType: 'pay',
                            buttonSizeMode: 'fill',
                            buttonRadius: 4
                        });
                        
                        const isMobile = window.innerWidth < 640;
                        const buttonHeight = isMobile ? '44px' : '48px';
                        button.style.width = '100%';
                        button.style.height = buttonHeight;
                        button.style.minHeight = buttonHeight;
                        button.style.maxHeight = buttonHeight;
                        
                        const container = document.getElementById('googlepay-button-container');
                        if (container) {
                            container.innerHTML = '';
                            container.appendChild(button);
                            console.log('✅ Google Pay button re-rendered!');
                            setIsGooglePayLoading(false);
                        }
                    } else {
                        console.log('⚠️ Google Pay not available');
                        setIsGooglePayLoading(false);
                        if (googlePayContainer) {
                            googlePayContainer.style.display = 'none';
                        }
                    }
                } catch (err) {
                    console.error('❌ Google Pay re-render error:', err);
                    setIsGooglePayLoading(false);
                    if (googlePayContainer) {
                        googlePayContainer.style.display = 'none';
                    }
                }
            };
            
            renderGooglePay();
        }
    }, [displayCart]);

    return (
        <div className="min-h-screen bg-black pt-20">
            {/* 顶部导航 */}
            <div className="bg-black border-b border-neon-cyan/20">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
                    <button 
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-neon-cyan text-sm md:text-base transition-all group"
                    >
                        <Rewind size={18} className="group-hover:animate-pulse" /> 
                        <span className="relative">
                            Back to shop
                            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-neon-cyan group-hover:w-full transition-all duration-300"></span>
                        </span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 lg:gap-16">
                {/* Left: Forms */}
                <div className="space-y-6 md:space-y-8">
                    {/* Express Checkout */}
                    <div>
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-6">
                            <span className="relative inline-block">
                                Express checkout
                                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-neon-pink to-transparent"></span>
                            </span>
                        </h2>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                            {/* 左侧：PayPal 按钮 */}
                            <div className="relative min-h-[44px] sm:min-h-[48px] z-10 [&_iframe]:!z-10">
                                {isPayPalLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#FFC439] rounded">
                                        <Loader2 className="animate-spin text-[#003087]" size={24} />
                                    </div>
                                )}
                                <div id="paypal-button-container" className="min-h-[44px] sm:min-h-[48px]"></div>
                            </div>
                            {/* 右侧：Google Pay 按钮（APM 集成） */}
                            <div className="relative min-h-[44px] sm:min-h-[48px] z-10 [&_iframe]:!z-10">
                                {isGooglePayLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black border border-white/20 rounded">
                                        <Loader2 className="animate-spin text-white" size={24} />
                                    </div>
                                )}
                                <div id="googlepay-button-container" className="min-h-[44px] sm:min-h-[48px]"></div>
                            </div>
                        </div>
                        
                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6 md:my-8">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent"></div>
                            <span className="text-xs md:text-sm text-neon-cyan uppercase tracking-wider font-display">Or pay with card</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent"></div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-6">
                            <span className="relative inline-block">
                                Contact
                                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-neon-pink to-transparent"></span>
                            </span>
                        </h2>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={shippingInfo.email}
                            onChange={(e) => {
                                setShippingInfo({...shippingInfo, email: e.target.value});
                                if (attempted || errors.email) {
                                    const error = validateField('email', e.target.value);
                                    setErrors({...errors, email: error});
                                }
                            }}
                            onBlur={(e) => {
                                const error = validateField('email', e.target.value);
                                setErrors({...errors, email: error});
                            }}
                            className={`w-full bg-white/5 border rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base ${
                                errors.email ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/40'
                            }`}
                        />
                        {errors.email && (
                            <p className="mt-1.5 text-xs md:text-sm text-red-500">{errors.email}</p>
                        )}
                    </div>

                    {/* Delivery */}
                    <div>
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-6">
                            <span className="relative inline-block">
                                Delivery
                                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-neon-pink to-transparent"></span>
                            </span>
                        </h2>
                        <div className="space-y-3 md:space-y-4">
                            <select 
                                value={shippingInfo.country}
                                onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 md:py-3.5 text-white focus:border-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base"
                            >
                                <option className="bg-black" value="United States">United States</option>
                                <option className="bg-black" value="Canada">Canada</option>
                                <option className="bg-black" value="United Kingdom">United Kingdom</option>
                                <option className="bg-black" value="Australia">Australia</option>
                                <option className="bg-black" value="Germany">Germany</option>
                                <option className="bg-black" value="France">France</option>
                                <option className="bg-black" value="Italy">Italy</option>
                                <option className="bg-black" value="Spain">Spain</option>
                                <option className="bg-black" value="Netherlands">Netherlands</option>
                                <option className="bg-black" value="Belgium">Belgium</option>
                                <option className="bg-black" value="Switzerland">Switzerland</option>
                                <option className="bg-black" value="Austria">Austria</option>
                                <option className="bg-black" value="Sweden">Sweden</option>
                                <option className="bg-black" value="Norway">Norway</option>
                                <option className="bg-black" value="Denmark">Denmark</option>
                                <option className="bg-black" value="Finland">Finland</option>
                                <option className="bg-black" value="Poland">Poland</option>
                                <option className="bg-black" value="Czech Republic">Czech Republic</option>
                                <option className="bg-black" value="Ireland">Ireland</option>
                                <option className="bg-black" value="Portugal">Portugal</option>
                                <option className="bg-black" value="Greece">Greece</option>
                                <option className="bg-black" value="Hungary">Hungary</option>
                                <option className="bg-black" value="Romania">Romania</option>
                                <option className="bg-black" value="Bulgaria">Bulgaria</option>
                                <option className="bg-black" value="Slovakia">Slovakia</option>
                                <option className="bg-black" value="Croatia">Croatia</option>
                                <option className="bg-black" value="Slovenia">Slovenia</option>
                                <option className="bg-black" value="Luxembourg">Luxembourg</option>
                                <option className="bg-black" value="Iceland">Iceland</option>
                                <option className="bg-black" value="Estonia">Estonia</option>
                                <option className="bg-black" value="Latvia">Latvia</option>
                                <option className="bg-black" value="Lithuania">Lithuania</option>
                                <option className="bg-black" value="Japan">Japan</option>
                                <option className="bg-black" value="South Korea">South Korea</option>
                                <option className="bg-black" value="China">China</option>
                                <option className="bg-black" value="Singapore">Singapore</option>
                                <option className="bg-black" value="Hong Kong">Hong Kong</option>
                                <option className="bg-black" value="Taiwan">Taiwan</option>
                                <option className="bg-black" value="Macau">Macau</option>
                                <option className="bg-black" value="India">India</option>
                                <option className="bg-black" value="Thailand">Thailand</option>
                                <option className="bg-black" value="Malaysia">Malaysia</option>
                                <option className="bg-black" value="Indonesia">Indonesia</option>
                                <option className="bg-black" value="Philippines">Philippines</option>
                                <option className="bg-black" value="Vietnam">Vietnam</option>
                                <option className="bg-black" value="Bangladesh">Bangladesh</option>
                                <option className="bg-black" value="Pakistan">Pakistan</option>
                                <option className="bg-black" value="Sri Lanka">Sri Lanka</option>
                                <option className="bg-black" value="Myanmar">Myanmar</option>
                                <option className="bg-black" value="Cambodia">Cambodia</option>
                                <option className="bg-black" value="Laos">Laos</option>
                                <option className="bg-black" value="Brunei">Brunei</option>
                                <option className="bg-black" value="New Zealand">New Zealand</option>
                                <option className="bg-black" value="Fiji">Fiji</option>
                                <option className="bg-black" value="Mexico">Mexico</option>
                                <option className="bg-black" value="Brazil">Brazil</option>
                                <option className="bg-black" value="Argentina">Argentina</option>
                                <option className="bg-black" value="Chile">Chile</option>
                                <option className="bg-black" value="Colombia">Colombia</option>
                                <option className="bg-black" value="Peru">Peru</option>
                                <option className="bg-black" value="Venezuela">Venezuela</option>
                                <option className="bg-black" value="Ecuador">Ecuador</option>
                                <option className="bg-black" value="Uruguay">Uruguay</option>
                                <option className="bg-black" value="Paraguay">Paraguay</option>
                                <option className="bg-black" value="Bolivia">Bolivia</option>
                                <option className="bg-black" value="Costa Rica">Costa Rica</option>
                                <option className="bg-black" value="Panama">Panama</option>
                                <option className="bg-black" value="Guatemala">Guatemala</option>
                                <option className="bg-black" value="United Arab Emirates">United Arab Emirates</option>
                                <option className="bg-black" value="Saudi Arabia">Saudi Arabia</option>
                                <option className="bg-black" value="Israel">Israel</option>
                                <option className="bg-black" value="Turkey">Turkey</option>
                                <option className="bg-black" value="Egypt">Egypt</option>
                                <option className="bg-black" value="Qatar">Qatar</option>
                                <option className="bg-black" value="Kuwait">Kuwait</option>
                                <option className="bg-black" value="Bahrain">Bahrain</option>
                                <option className="bg-black" value="Oman">Oman</option>
                                <option className="bg-black" value="Jordan">Jordan</option>
                                <option className="bg-black" value="Lebanon">Lebanon</option>
                                <option className="bg-black" value="Morocco">Morocco</option>
                                <option className="bg-black" value="South Africa">South Africa</option>
                                <option className="bg-black" value="Nigeria">Nigeria</option>
                                <option className="bg-black" value="Kenya">Kenya</option>
                                <option className="bg-black" value="Ghana">Ghana</option>
                                <option className="bg-black" value="Ethiopia">Ethiopia</option>
                                <option className="bg-black" value="Russia">Russia</option>
                                <option className="bg-black" value="Ukraine">Ukraine</option>
                                <option className="bg-black" value="Belarus">Belarus</option>
                                <option className="bg-black" value="Kazakhstan">Kazakhstan</option>
                                <option className="bg-black" value="Uzbekistan">Uzbekistan</option>
                            </select>
                            
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="First name" 
                                        value={shippingInfo.firstName}
                                        onChange={(e) => {
                                            setShippingInfo({...shippingInfo, firstName: e.target.value});
                                            if (attempted || errors.firstName) {
                                                const error = validateField('firstName', e.target.value);
                                                setErrors({...errors, firstName: error});
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const error = validateField('firstName', e.target.value);
                                            setErrors({...errors, firstName: error});
                                        }}
                                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base ${
                                            errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/40'
                                        }`}
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1.5 text-xs md:text-sm text-red-500">{errors.firstName}</p>
                                    )}
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="Last name" 
                                        value={shippingInfo.lastName}
                                        onChange={(e) => {
                                            setShippingInfo({...shippingInfo, lastName: e.target.value});
                                            if (attempted || errors.lastName) {
                                                const error = validateField('lastName', e.target.value);
                                                setErrors({...errors, lastName: error});
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const error = validateField('lastName', e.target.value);
                                            setErrors({...errors, lastName: error});
                                        }}
                                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base ${
                                            errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/40'
                                        }`}
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1.5 text-xs md:text-sm text-red-500">{errors.lastName}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <input 
                                    type="text" 
                                    placeholder="Address" 
                                    value={shippingInfo.address}
                                    onChange={(e) => {
                                        setShippingInfo({...shippingInfo, address: e.target.value});
                                        if (attempted || errors.address) {
                                            const error = validateField('address', e.target.value);
                                            setErrors({...errors, address: error});
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const error = validateField('address', e.target.value);
                                        setErrors({...errors, address: error});
                                    }}
                                    className={`w-full bg-white/5 border rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base ${
                                        errors.address ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/40'
                                    }`}
                                />
                                {errors.address && (
                                    <p className="mt-1.5 text-xs md:text-sm text-red-500">{errors.address}</p>
                                )}
                            </div>
                            
                            <input 
                                type="text" 
                                placeholder="Apartment, suite, etc. (optional)" 
                                value={shippingInfo.apartment}
                                onChange={(e) => setShippingInfo({...shippingInfo, apartment: e.target.value})}
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:border-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base" 
                            />
                            
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="City" 
                                        value={shippingInfo.city}
                                        onChange={(e) => {
                                            setShippingInfo({...shippingInfo, city: e.target.value});
                                            if (attempted || errors.city) {
                                                const error = validateField('city', e.target.value);
                                                setErrors({...errors, city: error});
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const error = validateField('city', e.target.value);
                                            setErrors({...errors, city: error});
                                        }}
                                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base ${
                                            errors.city ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/40'
                                        }`}
                                    />
                                    {errors.city && (
                                        <p className="mt-1.5 text-xs md:text-sm text-red-500">{errors.city}</p>
                                    )}
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder={shippingInfo.country === 'China' ? '省份/直辖市' : shippingInfo.country === 'United States' ? 'State' : 'Province/State'}
                                        value={shippingInfo.state}
                                        onChange={(e) => {
                                            setShippingInfo({...shippingInfo, state: e.target.value});
                                            if (attempted || errors.state) {
                                                const error = validateField('state', e.target.value);
                                                setErrors({...errors, state: error});
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const error = validateField('state', e.target.value);
                                            setErrors({...errors, state: error});
                                        }}
                                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base ${
                                            errors.state ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/40'
                                        }`}
                                    />
                                    {errors.state && (
                                        <p className="mt-1.5 text-xs md:text-sm text-red-500">{errors.state}</p>
                                    )}
                                </div>
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="ZIP code" 
                                        value={shippingInfo.zipCode}
                                        onChange={(e) => {
                                            setShippingInfo({...shippingInfo, zipCode: e.target.value});
                                            if (attempted || errors.zipCode) {
                                                const error = validateField('zipCode', e.target.value);
                                                setErrors({...errors, zipCode: error});
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const error = validateField('zipCode', e.target.value);
                                            setErrors({...errors, zipCode: error});
                                        }}
                                        className={`w-full bg-white/5 border rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base ${
                                            errors.zipCode ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/40'
                                        }`}
                                    />
                                    {errors.zipCode && (
                                        <p className="mt-1.5 text-xs md:text-sm text-red-500">{errors.zipCode}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <input 
                                    type="tel" 
                                    placeholder="Phone" 
                                    value={shippingInfo.phone}
                                    onChange={(e) => {
                                        setShippingInfo({...shippingInfo, phone: e.target.value});
                                        if (attempted || errors.phone) {
                                            const error = validateField('phone', e.target.value);
                                            setErrors({...errors, phone: error});
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const error = validateField('phone', e.target.value);
                                        setErrors({...errors, phone: error});
                                    }}
                                    className={`w-full bg-white/5 border rounded-lg px-4 py-3 md:py-3.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-white/10 outline-none transition-all text-sm md:text-base ${
                                        errors.phone ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/40'
                                    }`}
                                />
                                {errors.phone && (
                                    <p className="mt-1.5 text-xs md:text-sm text-red-500">{errors.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment */}
                    <div>
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-6">
                            <span className="relative inline-block">
                                Payment
                                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-neon-pink to-transparent"></span>
                            </span>
                        </h2>
                        <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4 flex items-center gap-2">
                            <Lock size={14} className="text-neon-cyan" />
                            All transactions are secure and encrypted.
                        </p>
                        
                        <div className="space-y-2 md:space-y-3">
                            {/* Credit Card */}
                            <div 
                                onClick={() => setPaymentMethod('CARD')}
                                className={`border rounded-t-lg cursor-pointer transition-all ${
                                    paymentMethod === 'CARD' 
                                    ? 'border-white/40 bg-white/10' 
                                    : 'border-white/20 bg-white/5 hover:border-white/30'
                                }`}
                            >
                                <div className="flex items-center justify-between p-3 md:p-4">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${
                                            paymentMethod === 'CARD' ? 'border-white' : 'border-gray-500'
                                        }`}>
                                            {paymentMethod === 'CARD' && (
                                                <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                        <span className="text-sm md:text-base font-medium text-white">Credit card</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        {/* Visa */}
                                        <div className="h-7 md:h-8 px-1 bg-white rounded flex items-center justify-center">
                                            <svg viewBox="0 -11 70 70" className="h-full w-auto">
                                                <rect x="0.5" y="0.5" width="69" height="47" rx="5.5" fill="white" stroke="#D9D9D9"/>
                                                <path fillRule="evenodd" clipRule="evenodd" d="M21.2505 32.5165H17.0099L13.8299 20.3847C13.679 19.8267 13.3585 19.3333 12.8871 19.1008C11.7106 18.5165 10.4142 18.0514 9 17.8169V17.3498H15.8313C16.7742 17.3498 17.4813 18.0514 17.5991 18.8663L19.2491 27.6173L23.4877 17.3498H27.6104L21.2505 32.5165ZM29.9675 32.5165H25.9626L29.2604 17.3498H33.2653L29.9675 32.5165ZM38.4467 21.5514C38.5646 20.7346 39.2717 20.2675 40.0967 20.2675C41.3931 20.1502 42.8052 20.3848 43.9838 20.9671L44.6909 17.7016C43.5123 17.2345 42.216 17 41.0395 17C37.1524 17 34.3239 19.1008 34.3239 22.0165C34.3239 24.2346 36.3274 25.3992 37.7417 26.1008C39.2717 26.8004 39.861 27.2675 39.7431 27.9671C39.7431 29.0165 38.5646 29.4836 37.3881 29.4836C35.9739 29.4836 34.5596 29.1338 33.2653 28.5494L32.5582 31.8169C33.9724 32.3992 35.5025 32.6338 36.9167 32.6338C41.2752 32.749 43.9838 30.6502 43.9838 27.5C43.9838 23.5329 38.4467 23.3004 38.4467 21.5514ZM58 32.5165L54.82 17.3498H51.4044C50.6972 17.3498 49.9901 17.8169 49.7544 18.5165L43.8659 32.5165H47.9887L48.8116 30.3004H53.8772L54.3486 32.5165H58ZM51.9936 21.4342L53.1701 27.1502H49.8723L51.9936 21.4342Z" fill="#172B85"/>
                                            </svg>
                                        </div>
                                        {/* Mastercard */}
                                        <div className="h-7 md:h-8 px-1 bg-white rounded flex items-center justify-center">
                                            <svg viewBox="0 -9 58 58" className="h-full w-auto">
                                                <rect x="0.5" y="0.5" width="57" height="39" rx="3.5" fill="white" stroke="#F3F3F3"/>
                                                <path d="M34.3102 28.9765H23.9591V10.5122H34.3102V28.9765Z" fill="#FF5F00"/>
                                                <path d="M24.6223 19.7429C24.6223 15.9973 26.3891 12.6608 29.1406 10.5107C27.1285 8.93843 24.5892 7.99998 21.8294 7.99998C15.2961 7.99998 10 13.2574 10 19.7429C10 26.2283 15.2961 31.4857 21.8294 31.4857C24.5892 31.4857 27.1285 30.5473 29.1406 28.975C26.3891 26.8249 24.6223 23.4884 24.6223 19.7429" fill="#EB001B"/>
                                                <path d="M48.2706 19.7429C48.2706 26.2283 42.9745 31.4857 36.4412 31.4857C33.6814 31.4857 31.1421 30.5473 29.1293 28.975C31.8815 26.8249 33.6483 23.4884 33.6483 19.7429C33.6483 15.9973 31.8815 12.6608 29.1293 10.5107C31.1421 8.93843 33.6814 7.99998 36.4412 7.99998C42.9745 7.99998 48.2706 13.2574 48.2706 19.7429" fill="#F79E1B"/>
                                            </svg>
                                        </div>
                                        {/* American Express */}
                                        <div className="h-7 md:h-8 px-1 bg-white rounded flex items-center justify-center">
                                            <svg viewBox="0 0 291.764 291.764" className="h-full w-auto">
                                                <path fill="#26A6D1" d="M18.235,41.025h255.294c10.066,0,18.235,8.169,18.235,18.244v173.235c0,10.066-8.169,18.235-18.235,18.235H18.235C8.16,250.74,0,242.57,0,232.505V59.269C0,49.194,8.169,41.025,18.235,41.025z"/>
                                                <path fill="#FFFFFF" d="M47.047,113.966l-28.812,63.76h34.492l4.276-10.166h9.774l4.276,10.166h37.966v-7.759l3.383,7.759h19.639l3.383-7.923v7.923h78.959l9.601-9.902l8.99,9.902l40.555,0.082l-28.903-31.784l28.903-32.058h-39.926l-9.346,9.719l-8.707-9.719h-85.897l-7.376,16.457l-7.549-16.457h-34.42v7.495l-3.829-7.495C76.479,113.966,47.047,113.966,47.047,113.966z M53.721,123.02h16.813l19.111,43.236V123.02h18.418l14.761,31l13.604-31h18.326v45.752h-11.151l-0.091-35.851l-16.257,35.851h-9.975l-16.348-35.851v35.851h-22.94l-4.349-10.257H50.147l-4.34,10.248H33.516C33.516,168.763,53.721,123.02,53.721,123.02z M164.956,123.02h45.342L224.166,138l14.315-14.98h13.868l-21.071,22.995l21.071,22.73h-14.497l-13.868-15.154l-14.388,15.154h-44.64L164.956,123.02L164.956,123.02z M61.9,130.761l-7.741,18.272h15.473L61.9,130.761z M176.153,132.493v8.352h24.736v9.309h-24.736v9.118h27.745l12.892-13.43l-12.345-13.357h-28.292L176.153,132.493z"/>
                                            </svg>
                                        </div>
                                        {/* +2 更多 */}
                                        <div className="h-7 md:h-8 px-2.5 md:px-3 bg-white/10 border border-white/20 rounded flex items-center justify-center">
                                            <span className="text-xs md:text-sm font-semibold text-white">+2</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {paymentMethod === 'CARD' && (
                                    <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-3 md:space-y-4 border-t border-white/10 pt-3 md:pt-4">
                                        {/* PayPal CardFields - 卡号 */}
                                        <div className="bg-white/5 border border-white/20 rounded-lg p-2.5 sm:p-3 md:p-4">
                                            <div id="card-number-field" className="bg-white rounded-md min-h-[44px] sm:min-h-[40px]"></div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                            {/* PayPal CardFields - 有效期 */}
                                            <div className="bg-white/5 border border-white/20 rounded-lg p-2.5 sm:p-3 md:p-4">
                                                <div id="card-expiry-field" className="bg-white rounded-md min-h-[44px] sm:min-h-[40px]"></div>
                                            </div>
                                            
                                            {/* PayPal CardFields - CVV */}
                                            <div className="bg-white/5 border border-white/20 rounded-lg p-2.5 sm:p-3 md:p-4">
                                                <div id="card-cvv-field" className="bg-white rounded-md min-h-[44px] sm:min-h-[40px]"></div>
                                            </div>
                                        </div>
                                        
                                        {/* PayPal CardFields - 持卡人姓名 */}
                                        <div className="bg-white/5 border border-white/20 rounded-lg p-2.5 sm:p-3 md:p-4">
                                            <div id="card-name-field" className="bg-white rounded-md min-h-[44px] sm:min-h-[40px]"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* PayPal */}
                            <div 
                                onClick={() => setPaymentMethod('PAYPAL')}
                                className={`border rounded-b-lg cursor-pointer transition-all ${
                                    paymentMethod === 'PAYPAL' 
                                    ? 'border-white/40 bg-white/10' 
                                    : 'border-white/20 bg-white/5 hover:border-white/30'
                                }`}
                            >
                                <div className="flex items-center justify-between p-3 md:p-4">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center ${
                                            paymentMethod === 'PAYPAL' ? 'border-white' : 'border-gray-500'
                                        }`}>
                                            {paymentMethod === 'PAYPAL' && (
                                                <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                        <span className="text-sm md:text-base font-medium text-white">PayPal</span>
                                    </div>
                                    {/* PayPal Logo - 官方矢量图 */}
                                    <div className="h-8 md:h-10">
                                        <svg viewBox="0 -139.5 750 750" className="h-full w-auto">
                                            <path d="M697.115385,0 L52.8846154,0 C23.7240385,0 0,23.1955749 0,51.7065868 L0,419.293413 C0,447.804425 23.7240385,471 52.8846154,471 L697.115385,471 C726.274038,471 750,447.804425 750,419.293413 L750,51.7065868 C750,23.1955749 726.274038,0 697.115385,0 Z" fill="#FFFFFF"/>
                                            <g transform="translate(54.000000, 150.000000)">
                                                <path d="M109.272795,8.45777679 C101.24875,2.94154464 90.7780357,0.176741071 77.8606518,0.176741071 L27.8515268,0.176741071 C23.8915714,0.176741071 21.7038036,2.15719643 21.2882232,6.11333036 L0.972553571,133.638223 C0.761419643,134.890696 1.07477679,136.03617 1.90975893,137.077509 C2.73996429,138.120759 3.78416964,138.639518 5.03473214,138.639518 L28.7887321,138.639518 C32.9550446,138.639518 35.2450357,136.663839 35.6653929,132.701973 L41.2905357,98.3224911 C41.4959375,96.6563482 42.2286964,95.3016518 43.4792589,94.2584018 C44.7288661,93.2170625 46.2918304,92.5358929 48.1671964,92.2234911 C50.0425625,91.9139554 51.8109286,91.7582321 53.4808929,91.7582321 C55.1460804,91.7582321 57.124625,91.8633214 59.4203482,92.0706339 C61.7103393,92.2789018 63.170125,92.3801696 63.7958839,92.3801696 C81.7145625,92.3801696 95.7793304,87.3311071 105.991143,77.2224732 C116.198179,67.1176607 121.307429,53.1054375 121.307429,35.1829375 C121.307429,22.8903571 117.293018,13.9826071 109.272795,8.45777679 Z M83.4877054,46.7484911 C82.4425446,54.0426429 79.7369732,58.8328036 75.3614375,61.1256607 C70.9849464,63.4213839 64.7340446,64.5620804 56.6087321,64.5620804 L46.2937411,64.8754375 L51.6083929,31.43125 C52.0230179,29.1412589 53.3767589,27.9948304 55.6705714,27.9948304 L61.6109821,27.9948304 C69.9416964,27.9948304 75.9881518,29.1957143 79.7388839,31.5879286 C83.4877054,33.985875 84.7382679,39.041625 83.4877054,46.7484911 Z" fill="#003087"/>
                                                <path d="M637.026411,0.176741071 L613.899125,0.176741071 C611.601491,0.176741071 610.248705,1.32316964 609.835991,3.61507143 L589.518411,133.638223 L589.205054,134.263027 C589.205054,135.310098 589.622545,136.295071 590.457527,137.233232 C591.286777,138.169482 592.332893,138.638562 593.581545,138.638562 L614.212482,138.638562 C618.16575,138.638562 620.354473,136.662884 620.776741,132.701018 L641.092411,4.86276786 L641.092411,4.55227679 C641.091455,1.63557143 639.732938,0.176741071 637.026411,0.176741071 Z" fill="#009CDE"/>
                                                <path d="M357.599732,50.4973125 C357.599732,49.4578839 357.18033,48.4662232 356.352036,47.5299732 C355.516098,46.5927679 354.576982,46.1217768 353.538509,46.1217768 L329.471152,46.1217768 C327.174473,46.1217768 325.300063,47.1688482 323.845054,49.24675 L290.714223,98.0081786 L276.962812,51.1240268 C275.916696,47.7917411 273.62575,46.1217768 270.086152,46.1217768 L246.641687,46.1217768 C245.597482,46.1217768 244.659321,46.5918125 243.831027,47.5299732 C242.995089,48.4662232 242.580464,49.4588393 242.580464,50.4973125 C242.580464,50.9176696 244.612509,57.0615714 248.674687,68.9385714 C252.736866,80.8174821 257.113357,93.6326429 261.80225,107.38692 C266.491143,121.137375 268.936857,128.434393 269.147036,129.262688 C252.059518,152.602063 243.51767,165.104821 243.51767,166.769054 C243.51767,169.480357 244.871411,170.833143 247.580804,170.833143 L271.648161,170.833143 C273.940062,170.833143 275.814473,169.793714 277.274259,167.709125 L356.976839,52.6850804 C357.391464,52.2704554 357.599732,51.5443839 357.599732,50.4973125 Z" fill="#003087"/>
                                                <path d="M581.704545,46.1217768 L557.948634,46.1217768 C555.030018,46.1217768 553.263562,49.5601071 552.638759,56.4367679 C547.215196,48.1060536 537.323429,43.9330536 522.943393,43.9330536 C507.940464,43.9330536 495.174982,49.5601071 484.655545,60.8123036 C474.13133,72.0654554 468.872089,85.2990625 468.872089,100.508348 C468.872089,112.80475 472.465187,122.597161 479.653295,129.887491 C486.842357,137.185464 496.479045,140.827286 508.568134,140.827286 C514.608857,140.827286 520.755625,139.574813 527.006527,137.076554 C533.258384,134.576384 538.150768,131.244098 541.698964,127.07492 C541.698964,127.284143 541.486875,128.220393 541.073205,129.886536 C540.652848,131.5565 540.447446,132.808973 540.447446,133.637268 C540.447446,136.975286 541.798321,138.637607 544.511536,138.637607 L566.079679,138.637607 C570.032946,138.637607 572.32867,136.661929 572.952518,132.700063 L585.768634,51.1230714 C585.974036,49.8725089 585.661634,48.7279911 584.830473,47.6847411 C583.994536,46.6443571 582.955107,46.1217768 581.704545,46.1217768 Z M540.916527,107.696455 C535.60283,112.906018 529.196205,115.509366 521.694741,115.509366 C515.649241,115.509366 510.756857,113.845134 507.004214,110.509027 C503.252527,107.180563 501.377161,102.595804 501.377161,96.7566607 C501.377161,89.0517054 503.981464,82.5361696 509.191982,77.2224732 C514.395812,71.9087768 520.860714,69.2519286 528.571402,69.2519286 C534.400036,69.2519286 539.245607,70.9715714 543.104295,74.4089464 C546.956295,77.8472768 548.888027,82.5896696 548.888027,88.6323036 C548.887071,96.1328125 546.229268,102.489759 540.916527,107.696455 Z" fill="#009CDE"/>
                                                <path d="M226.639375,46.1217768 L202.885375,46.1217768 C199.963893,46.1217768 198.196482,49.5601071 197.570723,56.4367679 C191.944625,48.1060536 182.04617,43.9330536 167.877268,43.9330536 C152.874339,43.9330536 140.109813,49.5601071 129.588464,60.8123036 C119.06425,72.0654554 113.805009,85.2990625 113.805009,100.508348 C113.805009,112.80475 117.400018,122.597161 124.58908,129.887491 C131.778143,137.185464 141.41292,140.827286 153.500098,140.827286 C159.331598,140.827286 165.378054,139.574813 171.628,137.076554 C177.878902,134.576384 182.880196,131.244098 186.630929,127.07492 C185.794991,129.575089 185.380366,131.763813 185.380366,133.637268 C185.380366,136.975286 186.734107,138.637607 189.4435,138.637607 L211.009732,138.637607 C214.965866,138.637607 217.260634,136.661929 217.886393,132.700063 L230.700598,51.1230714 C230.906,49.8725089 230.593598,48.7279911 229.763393,47.6847411 C228.929366,46.6443571 227.888982,46.1217768 226.639375,46.1217768 Z M185.850402,107.851223 C180.53575,112.962384 174.02117,115.509366 166.316214,115.509366 C160.269759,115.509366 155.425143,113.845134 151.781411,110.509027 C148.132902,107.180563 146.311036,102.595804 146.311036,96.7566607 C146.311036,89.0517054 148.914384,82.5361696 154.125857,77.2224732 C159.331598,71.9087768 165.791723,69.2519286 173.504321,69.2519286 C179.335821,69.2519286 184.180437,70.9715714 188.039125,74.4089464 C191.891125,77.8472768 193.820946,82.5896696 193.820946,88.6323036 C193.820946,96.3420357 191.164098,102.751527 185.850402,107.851223 Z" fill="#003087"/>
                                                <path d="M464.337964,8.45777679 C456.314875,2.94154464 445.846071,0.176741071 432.926777,0.176741071 L383.230054,0.176741071 C379.05992,0.176741071 376.767062,2.15719643 376.353393,6.11333036 L356.037723,133.637268 C355.826589,134.889741 356.138991,136.035214 356.974929,137.076554 C357.802268,138.119804 358.849339,138.638563 360.099902,138.638563 L385.728312,138.638563 C388.228482,138.638563 389.894625,137.285777 390.729607,134.576384 L396.356661,98.3215357 C396.563018,96.6553929 397.292911,95.3006964 398.544429,94.2574464 C399.794991,93.2161071 401.356045,92.5349375 403.233321,92.2225357 C405.107732,91.913 406.876098,91.7572768 408.547018,91.7572768 C410.212205,91.7572768 412.19075,91.8623661 414.483607,92.0696786 C416.775509,92.2779464 418.238161,92.3792143 418.859143,92.3792143 C436.780687,92.3792143 450.843545,87.3301518 461.055357,77.2215179 C471.265259,67.1167054 476.370687,53.1044821 476.370687,35.1819821 C476.371643,22.8903571 472.358187,13.9826071 464.337964,8.45777679 Z M432.301018,59.8750982 C427.716259,63.0000714 420.839598,64.5620804 411.672946,64.5620804 L401.670357,64.8754375 L406.985009,31.43125 C407.397723,29.1412589 408.751464,27.9948304 411.047187,27.9948304 L416.671375,27.9948304 C421.254223,27.9948304 424.900821,28.2030982 427.614036,28.6186786 C430.318652,29.0390357 432.926777,30.3373661 435.426946,32.5251339 C437.929027,34.7138571 439.177679,37.8923304 439.177679,42.0595982 C439.177679,50.8106696 436.882911,56.7482143 432.301018,59.8750982 Z" fill="#009CDE"/>
                                            </g>
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* PayPal 展开说明 */}
                                {paymentMethod === 'PAYPAL' && (
                                    <div className="px-3 md:px-4 pb-3 md:pb-4 border-t border-white/10 pt-3 md:pt-4">
                                        <div className="flex flex-col items-center justify-center text-center py-6 md:py-8">
                                            {/* 浏览器窗口图标 */}
                                            <div className="mb-4 md:mb-6">
                                                <svg className="w-16 h-16 md:w-20 md:h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5"/>
                                                    <path d="M3 8h18" strokeWidth="1.5"/>
                                                    <circle cx="6.5" cy="6" r="0.5" fill="currentColor"/>
                                                    <circle cx="8.5" cy="6" r="0.5" fill="currentColor"/>
                                                    <circle cx="10.5" cy="6" r="0.5" fill="currentColor"/>
                                                    <path d="M16 14l2 2m0 0l-2 2m2-2H8" strokeWidth="1.5" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                            {/* 说明文字 */}
                                            <p className="text-sm md:text-base text-gray-300 max-w-md">
                                                After clicking "Pay now", you will be redirected to PayPal to complete your purchase securely.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pay Now Button / PayPal Button */}
                    <div className="w-full">
                        {/* PayPal 官方按钮容器 - 始终存在但条件显示 */}
                        <div 
                            id="bottom-paypal-button-container" 
                            className="w-full"
                            style={{ display: paymentMethod === 'PAYPAL' ? 'block' : 'none' }}
                        ></div>
                        
                        {/* 普通 Pay Now 按钮 - 用于 Credit Card 等其他支付方式 */}
                        {paymentMethod !== 'PAYPAL' && (
                            <button
                                onClick={async () => {
                                    // 首次点击时标记已尝试提交
                                    setAttempted(true);
                                    
                                    // 验证所有字段
                                    const validation = validateAllFields();
                                    if (!validation.isValid) {
                                        return;
                                    }
                                    
                                    if (paymentMethod === 'CARD') {
                                        // 使用 PayPal CardFields 提交
                                        const cardField = (window as any).paypalCardField;
                                        console.log('💳 CardField instance:', cardField);
                                        
                                        if (!cardField) {
                                            console.error('❌ CardField instance not found');
                                            alert('信用卡支付组件未加载，请刷新页面');
                                            return;
                                        }
                                        
                                        try {
                                            console.log('🚀 开始提交卡片支付...');
                                            const result = await cardField.submit();
                                            console.log('✅ 提交成功:', result);
                                        } catch (error: any) {
                                            console.error('❌ Card submission error:', error);
                                            console.error('❌ Error details:', {
                                                message: error.message,
                                                details: error.details,
                                                stack: error.stack
                                            });
                                            
                                            // 静默失败，不弹窗，错误信息已经通过表单的红色边框和提示文字显示
                                        }
                                    } else {
                                        // 其他支付方式
                                        onProcessPayment(paymentMethod);
                                    }
                                }}
                                disabled={isProcessing}
                                className="relative w-full bg-gradient-to-r from-neon-cyan to-neon-pink hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-600 text-black font-bold py-3 md:py-4 px-6 rounded-lg transition-all text-lg md:text-xl lg:text-2xl flex items-center justify-center gap-2 md:gap-3 group overflow-hidden disabled:cursor-not-allowed"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                <span className="relative z-10">
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin inline" size={20} />
                                            {' '}Processing...
                                        </>
                                    ) : (
                                        <>Pay now</>
                                    )}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="lg:sticky lg:top-6 h-fit">
                    <div className="bg-white/5 border border-neon-cyan/30 rounded-lg p-4 md:p-6 lg:p-8 shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:shadow-[0_0_25px_rgba(0,255,255,0.2)] transition-all">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">
                            <span className="relative inline-block">
                                Order summary
                                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-neon-cyan via-neon-pink to-transparent"></span>
                            </span>
                        </h3>
                        
                        {/* Products */}
                        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-white/10">
                            {isConverting && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="animate-spin text-neon-cyan" size={24} />
                                </div>
                            )}
                            {displayCart.map(item => (
                                <div key={item.id} className="flex gap-3 md:gap-4">
                                    {/* 商品主图 */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-lg border border-white/20 overflow-hidden">
                                            <img 
                                                src={item.images[0]} 
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* 商品信息和数量控制 */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-xs md:text-sm font-medium text-white mb-1 line-clamp-2">{item.name}</h4>
                                            <p className="text-[10px] md:text-xs text-gray-400">SKU: {item.sku}</p>
                                        </div>
                                        
                                        {/* 数量控制器 */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button 
                                                onClick={() => onUpdateQuantity(item.cartItemId || '', Math.max(1, item.quantity - 1))}
                                                className="w-6 h-6 md:w-7 md:h-7 bg-white/10 hover:bg-white/20 border border-white/20 rounded flex items-center justify-center text-white transition-colors"
                                            >
                                                <Minus size={12} className="md:w-4 md:h-4" />
                                            </button>
                                            <span className="text-xs md:text-sm font-semibold text-white min-w-[20px] text-center">
                                                {item.quantity}
                                            </span>
                                            <button 
                                                onClick={() => onUpdateQuantity(item.cartItemId || '', item.quantity + 1)}
                                                className="w-6 h-6 md:w-7 md:h-7 bg-white/10 hover:bg-white/20 border border-white/20 rounded flex items-center justify-center text-white transition-colors"
                                            >
                                                <Plus size={12} className="md:w-4 md:h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* 价格和删除按钮 */}
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-sm md:text-base font-semibold text-white">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                        <button 
                                            onClick={() => onUpdateQuantity(item.cartItemId || '', 0)}
                                            className="w-7 h-7 md:w-8 md:h-8 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 rounded flex items-center justify-center text-red-500 transition-colors"
                                            title="删除商品"
                                        >
                                            <Trash2 size={14} className="md:w-4 md:h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-neon-cyan/20">
                            <div className="flex justify-between text-sm md:text-base text-gray-300">
                                <span>Subtotal</span>
                                <span className="font-mono font-bold tracking-tight">{formatPrice(subtotal, currency)}</span>
                            </div>
                            {displayCart.length > 0 && (
                                <div className="flex justify-between text-sm md:text-base text-gray-300">
                                    <span>Shipping</span>
                                    <span className="font-mono font-bold text-neon-cyan tracking-tight">{shipping === 0 ? 'Free' : formatPrice(shipping, currency)}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-base md:text-lg font-bold text-white">Total</span>
                            <div className="text-right">
                                <div className="text-[10px] md:text-xs text-neon-cyan mb-0.5 md:mb-1 tracking-wider">{currency}</div>
                                <div className="text-xl md:text-2xl font-mono font-black tracking-tight bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">{formatPrice(total, currency).replace(currency === 'USD' ? '$' : '', '')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="mt-4 md:mt-6 bg-black/40 border border-neon-cyan/30 rounded-lg p-3 md:p-4 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                        <div className="flex items-start gap-2 md:gap-3">
                            <Lock size={16} className="text-neon-cyan flex-shrink-0 mt-0.5 md:w-5 md:h-5" />
                            <div>
                                <p className="text-xs md:text-sm font-medium text-neon-cyan mb-0.5 md:mb-1">Discreet packaging</p>
                                <p className="text-[10px] md:text-xs text-gray-400">All orders are shipped in plain, unmarked packaging for your privacy.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

// NEW: ShopView
const ShopView: React.FC<{ 
  onProductClick: (p: Product) => void; 
  initialSearch: string; 
  allProducts: Product[]; 
  initialCategory?: string;
  config: StoreConfig;
}> = ({ onProductClick, initialSearch, allProducts, initialCategory, config }) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEW' | 'PRICE_ASC' | 'PRICE_DESC'>('NEW');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16; // 每页显示 16 个商品
  
  const CATEGORY_TREE = getCategoryTree(config);  // 动态获取分类树

  // Update local filter if prop changes
  useEffect(() => {
    if (initialCategory) setFilterCategory(initialCategory);
  }, [initialCategory]);

  // 切换筛选条件时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, sortBy, initialSearch]);

  // Filter Logic
  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = initialSearch ? (p.name.toLowerCase().includes(initialSearch.toLowerCase()) || 
                          p.category.toLowerCase().includes(initialSearch.toLowerCase())) : true;
    
    const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'PRICE_ASC') return a.price - b.price;
    if (sortBy === 'PRICE_DESC') return b.price - a.price;
    return 0; 
  });

  // 分页逻辑
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // 切换页码
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 生成页码数组（显示当前页前后各 2 页）
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // 最多显示 5 个页码

    if (totalPages <= maxVisible) {
      // 如果总页数少于等于 5，全部显示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 始终显示第一页
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // 始终显示最后一页
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-6 min-h-screen max-w-7xl mx-auto">
       <button onClick={() => setFilterCategory('ALL')} className="flex items-center gap-2 text-neon-cyan hover:text-white font-display text-sm mb-8 tracking-wider uppercase transition-colors">
         <Rewind size={16} fill="currentColor"/> {getTranslation('RESET FILTERS')}
       </button>
       
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-neon-purple/30 pb-6 gap-6">
          <div>
              <div className="text-neon-pink font-display text-xs mb-3 tracking-widest">{getTranslation('BROWSE COLLECTION')}</div>
              <h1 className="font-display text-4xl md:text-5xl text-white font-black uppercase">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink">
                  {filterCategory === 'ALL' ? getTranslation('ALL PRODUCTS') : getTranslation(filterCategory)}
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-2">{filteredProducts.length} {getTranslation('items available')} {totalPages > 1 && `· Page ${currentPage} of ${totalPages}`}</p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto">
              {/* 排序选项 */}
              <div className="flex items-center gap-2 bg-black/40 border border-white/20 px-4 py-3">
                <Sliders size={16} className="text-gray-400" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white font-display text-sm outline-none uppercase cursor-pointer"
                >
                  <option value="NEW">{getTranslation('NEW ARRIVALS')}</option>
                  <option value="PRICE_ASC">{getTranslation('Price: Low to High')}</option>
                  <option value="PRICE_DESC">{getTranslation('Price: High to Low')}</option>
                </select>
             </div>

             {/* Desktop Category Pills - 优化样式 */}
             <div className="hidden md:flex flex-wrap gap-2 justify-end max-w-2xl">
                 <button 
                    onClick={() => setFilterCategory('ALL')} 
                    className={`px-5 py-2 text-xs font-display font-bold border transition-all ${
                        filterCategory === 'ALL' 
                        ? 'bg-neon-pink border-neon-pink text-white shadow-[0_0_15px_rgba(255,0,255,0.5)]' 
                        : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-white'
                    }`}
                 >
                    ALL
                 </button>
                 {Object.keys(CATEGORY_TREE).map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setFilterCategory(cat)} 
                        className={`px-5 py-2 text-xs font-display font-bold border transition-all ${
                            filterCategory === cat 
                            ? 'bg-neon-cyan border-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,255,0.5)]' 
                            : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-white'
                        }`}
                    >
                        {getTranslation(cat)}
                    </button>
                 ))}
             </div>
          </div>
       </div>

       {filteredProducts.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-white/10 bg-black/20">
             <div className="text-neon-yellow font-display text-3xl mb-4 font-black">NO RESULTS</div>
             <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
          </div>
       ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {currentProducts.map(p => (
                 <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />
              ))}
            </div>

            {/* 分页导航 */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-2">
                {/* 上一页 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-black/40 border border-white/20 text-white font-display text-sm hover:bg-neon-cyan hover:text-black hover:border-neon-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/40 disabled:hover:text-white disabled:hover:border-white/20 flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> {getTranslation('PREV')}
                </button>

                {/* 页码 */}
                <div className="flex gap-2">
                  {getPageNumbers().map((page, idx) => (
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-4 py-2 text-gray-600 font-display">•••</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-4 py-2 font-display text-sm font-bold border transition-all ${
                          currentPage === page
                            ? 'bg-neon-pink border-neon-pink text-white shadow-[0_0_15px_rgba(255,0,255,0.5)]'
                            : 'bg-black/40 border-white/20 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/40'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* 下一页 */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-black/40 border border-white/20 text-white font-display text-sm hover:bg-neon-cyan hover:text-black hover:border-neon-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/40 disabled:hover:text-white disabled:hover:border-white/20 flex items-center gap-2"
                >
                  {getTranslation('NEXT')} <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
       )}
    </div>
  );
};

const ProductDetailView: React.FC<{ 
  product: Product; 
  onAddToCart: (p: Product) => void; 
  onBack: () => void; 
  onProductClick: (p: Product) => void; 
  allProducts: Product[]; 
  currency?: string;
  config: StoreConfig;
  originalProducts: Product[];
}> = ({ product, onAddToCart, onBack, onProductClick, allProducts, currency = 'USD', config, originalProducts }) => {
  const [activeTab, setActiveTab] = useState<'DESC' | 'SPECS' | 'REVIEWS'>('DESC');
  const [reviews, setReviews] = useState(REVIEWS_MOCK);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  
  // 查找当前商品的组合优惠（以当前商品为主商品且已启用的组合）
  const bundleOffer = config.bundleOffers?.find(b => 
    b.mainProductId === product.id && b.isActive
  );
  const bundleProduct = bundleOffer 
    ? allProducts.find(p => p.id === bundleOffer.bundleProductId)
    : null;
  
  // Mixed Media Gallery Logic
  const mediaList = [
    ...(product.mainVideo ? [{ type: 'video', src: product.mainVideo }] : []),
    ...product.images.map(src => ({ type: 'image', src }))
  ];
  
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset active media when product changes
  useEffect(() => {
    setActiveMediaIndex(0);
  }, [product.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    const moveX = (0.5 - x) * 100;
    const moveY = (0.5 - y) * 100;
    imgRef.current.style.transform = `scale(1.25) translate(${moveX}px, ${moveY}px)`;
  };

  const handleMouseLeave = () => {
    if (imgRef.current) {
        imgRef.current.style.transform = 'scale(1) translate(0,0)';
    }
  };

  const handleAddReview = (newReview: any) => {
    setReviews([newReview, ...reviews]);
    setActiveTab('REVIEWS');
  };

  let related = allProducts.filter(p => p.category === product.category && p.id !== product.id);
  // Ensure we have some related items
  if (related.length < 3) {
      const others = allProducts.filter(p => p.category !== product.category && p.id !== product.id);
      related = [...related, ...others].slice(0, 3);
  } else {
      related = related.slice(0, 3);
  }

  return (
    <div className="pt-32 md:pt-48 pb-32 md:pb-24 px-4 md:px-6 min-h-screen">
       <button onClick={onBack} className="max-w-7xl mx-auto flex items-center gap-2 text-neon-cyan hover:text-white font-display text-sm mb-6 tracking-wider uppercase transition-colors">
         <Rewind size={16} fill="currentColor"/> {getTranslation('Back to Shop')}
       </button>
       
       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 mb-20">
         
         {/* Left: Media Gallery - Sticky on desktop */}
         <div className="lg:sticky lg:top-32 h-fit bg-synth-bg z-10 self-start">
             <div className="border border-neon-purple/30 p-2 bg-black/50 shadow-[0_0_30px_rgba(255,0,255,0.3)] mb-4">
                 <div 
                    className="aspect-square relative overflow-hidden group cursor-crosshair bg-black w-full"
                    onMouseMove={mediaList[activeMediaIndex]?.type === 'image' ? handleMouseMove : undefined}
                    onMouseLeave={mediaList[activeMediaIndex]?.type === 'image' ? handleMouseLeave : undefined}
                 >
                    {mediaList[activeMediaIndex]?.type === 'video' ? (
                        <video 
                            src={mediaList[activeMediaIndex].src} 
                            controls 
                            autoPlay
                            loop
                            muted
                            className="w-full h-full object-cover"
                            poster={product.images[0]} 
                        />
                    ) : (
                        <img 
                            ref={imgRef}
                            src={mediaList[activeMediaIndex]?.src || product.images[0]} 
                            className="w-full h-full object-cover mix-blend-normal transition-transform duration-100 ease-out" 
                            alt={product.name}
                        />
                    )}
                    {/* 图片缩放提示 */}
                    {mediaList[activeMediaIndex]?.type === 'image' && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 text-[10px] text-gray-400 font-display opacity-0 group-hover:opacity-100 transition-opacity">
                            {getTranslation('HOVER TO ZOOM')}
                        </div>
                    )}
                 </div>
             </div>
             
             {/* Thumbnails */}
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {mediaList.length > 0 ? mediaList.map((item, i) => (
                    <div 
                        key={i} 
                        className={`w-16 h-16 md:w-20 md:h-20 border cursor-pointer relative flex-shrink-0 transition-all ${
                            activeMediaIndex === i 
                            ? 'border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]' 
                            : 'border-white/20 hover:border-white/50'
                        }`}
                        onClick={() => setActiveMediaIndex(i)}
                    >
                        {item.type === 'video' ? (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center text-neon-pink">
                                <Play size={24} fill="currentColor" />
                            </div>
                        ) : (
                            <img 
                                src={item.src} 
                                className="w-full h-full object-cover" 
                                alt="thumbnail"
                            />
                        )}
                        {item.type === 'video' && <div className="absolute bottom-1 right-1 bg-black/80 text-white p-0.5 rounded-full"><Film size={10}/></div>}
                    </div>
                )) : (
                    <div className="text-gray-500 text-sm">No media available</div>
                )}
             </div>
         </div>

         {/* Right: Info */}
         <div className="w-full flex flex-col gap-6">
            {/* 限时优惠标签 */}
            <LimitedTimeOffer />
            
            <div>
               <div className="text-neon-purple font-display text-xs uppercase mb-2 tracking-widest">{product.category} // SKU: {product.sku}</div>
               <h1 className="font-display text-3xl md:text-5xl text-white font-black uppercase mb-3 leading-tight">
                   {product.name}
               </h1>
               <DemandIndicator />
            </div>
            
            {/* 价格和评分 */}
            <div className="flex items-center gap-6 border-b border-white/10 pb-6">
               <div>
                 <div className="text-4xl md:text-5xl font-mono font-bold text-neon-yellow text-glow tracking-tight">{formatPrice((() => {
                   const discounts = [0, 10, 20];
                   const discount = discounts[selectedQty - 1] || 0;
                   const discountedPrice = product.price * (1 - discount / 100);
                   const total = discountedPrice * selectedQty;
                   return total;
                 })(), currency)}</div>
                 {selectedQty > 1 && (
                   <div className="text-sm text-gray-400 line-through mt-1 font-mono">{formatPrice(product.price * selectedQty, currency)}</div>
                 )}
               </div>
               <div className="flex items-center gap-1 text-neon-cyan">
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} />
                  <span className="text-gray-400 text-sm ml-2 font-display">({reviews.length})</span>
               </div>
            </div>

            {/* 商品简述 - 只显示前150字符 */}
            {product.description && (
                <p className="text-gray-300 font-body text-sm md:text-base leading-relaxed line-clamp-3">
                    {product.description.length > 150 
                        ? product.description.substring(0, 150) + '...' 
                        : product.description
                    }
                </p>
            )}
            
            {/* 批量折扣和购买按钮 */}
            <div>
               <VolumeDiscount price={product.price} selectedQty={selectedQty} onSelectQty={setSelectedQty} currency={currency} />
               <RetroButton onClick={() => {
                   // 使用默认折扣档位（可以后续从 config 读取）
                   const tiers = [
                     { qty: 1, discount: 0 },
                     { qty: 2, discount: 10 },
                     { qty: 3, discount: 20 }
                   ];
                   const tier = tiers.find(t => t.qty === selectedQty) || tiers[0];
                   const discountedPrice = product.price * (1 - tier.discount / 100);
                   const discountedProduct = {
                     ...product,
                     price: discountedPrice,
                     volumeQty: selectedQty,
                     volumeDiscount: tier.discount
                   };
                   for (let i = 0; i < selectedQty; i++) {
                     onAddToCart(discountedProduct);
                   }
                 }} className="w-full py-4 text-lg" icon={<Zap size={20} fill="currentColor"/>}>
                   {getTranslation('Add to Cart')}
               </RetroButton>
            </div>

            {/* 组合商品板块 - 只在有配置时显示 */}
            {bundleOffer && bundleProduct && (() => {
              // 使用原始USD价格计算，避免货币转换干扰
              const mainOriginalPrice = originalProducts.find(p => p.id === product.id)?.price || product.price;
              const bundleOriginalPrice = originalProducts.find(p => p.id === bundleProduct.id)?.price || bundleProduct.price;
              const originalTotal = mainOriginalPrice + bundleOriginalPrice;
              
              // 计算优惠比例
              const actualDiscount = ((originalTotal - bundleOffer.bundlePrice) / originalTotal * 100);
              const savings = originalTotal - bundleOffer.bundlePrice;
              
              // 按原价比例分摆组合价
              const mainRatio = mainOriginalPrice / originalTotal;
              const bundleRatio = bundleOriginalPrice / originalTotal;
              const mainBundlePrice = bundleOffer.bundlePrice * mainRatio;
              const bundleBundlePrice = bundleOffer.bundlePrice * bundleRatio;
              
              console.log('Bundle Debug:', {
                mainOriginalPrice,
                bundleOriginalPrice,
                originalTotal,
                bundlePrice: bundleOffer.bundlePrice,
                actualDiscount,
                mainBundlePrice,
                bundleBundlePrice
              });
              
              return (
                <div className="bg-black/30 border-2 border-neon-yellow/30 p-6 relative overflow-hidden rounded">
                  {/* 右上角优惠标签 */}
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="relative flex h-14 w-14">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-yellow opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-14 w-14 bg-neon-yellow items-center justify-center">
                        <span className="text-black font-display font-bold text-[10px] leading-tight">{actualDiscount.toFixed(0)}%<br/>OFF</span>
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-neon-yellow font-display text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Layers size={16}/> BUNDLE DEAL - SAVE {actualDiscount.toFixed(0)}%
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 bg-black border border-white/20 p-1 flex-shrink-0">
                        <img src={product.images[0]} className="w-full h-full object-cover"/>
                      </div>
                      <div className="text-gray-500"><Plus size={20}/></div>
                      <div className="w-16 h-16 bg-black border border-white/20 p-1 flex-shrink-0">
                        {bundleProduct.images[0] ? (
                          <img src={bundleProduct.images[0]} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-neon-purple opacity-50"/>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 pl-0 sm:pl-2 w-full sm:w-auto flex justify-between sm:block items-center">
                      <div>
                        <div className="font-display text-white text-sm">{bundleProduct.name}</div>
                        <div className="text-xs text-gray-500">Bundle Add-on</div>
                      </div>
                      <div className="text-right sm:hidden">
                        <div className="text-xs text-gray-500 line-through">{formatPrice(originalTotal, currency)}</div>
                        <div className="text-neon-yellow font-display font-bold text-lg">{formatPrice(bundleOffer.bundlePrice, currency)}</div>
                        <div className="text-xs text-neon-yellow">Save {formatPrice(savings, currency)}</div>
                      </div>
                    </div>
                    
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-gray-500 line-through">{formatPrice(originalTotal, currency)}</div>
                      <div className="text-neon-yellow font-display font-bold text-lg">{formatPrice(bundleOffer.bundlePrice, currency)}</div>
                      <div className="text-xs text-neon-yellow">Save {formatPrice(savings, currency)}</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      // 按组合价分摆后添加到购物车
                      const mainProductWithBundlePrice = {
                        ...product,
                        price: mainBundlePrice,
                        isBundleItem: true,
                        bundleId: bundleOffer.id
                      };
                      const bundleProductWithBundlePrice = {
                        ...bundleProduct,
                        price: bundleBundlePrice,
                        isBundleItem: true,
                        bundleId: bundleOffer.id
                      };
                      onAddToCart(mainProductWithBundlePrice);
                      onAddToCart(bundleProductWithBundlePrice);
                    }}
                    className="w-full mt-2 bg-neon-yellow hover:bg-neon-yellow/80 text-black border-2 border-neon-yellow font-display font-bold py-3 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Zap size={16} fill="currentColor" />
                    {getTranslation('Claim Bundle Offer')}
                  </button>
                </div>
              );
            })()}

            {/* Trust Badges - 优化为4个 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-6 border-y border-white/10">
                <div className="text-center flex flex-col items-center gap-2 group">
                    <Shield className="text-neon-cyan group-hover:scale-110 transition-transform" size={28} />
                    <span className="text-[10px] font-display uppercase text-gray-400">100% Secure</span>
                </div>
                <div className="text-center flex flex-col items-center gap-2 group">
                    <Package className="text-neon-pink group-hover:scale-110 transition-transform" size={28} />
                    <span className="text-[10px] font-display uppercase text-gray-400">Discreet Ship</span>
                </div>
                <div className="text-center flex flex-col items-center gap-2 group">
                    <Truck className="text-neon-yellow group-hover:scale-110 transition-transform" size={28} />
                    <span className="text-[10px] font-display uppercase text-gray-400">Fast Delivery</span>
                </div>
                <div className="text-center flex flex-col items-center gap-2 group">
                    <Lock className="text-neon-purple group-hover:scale-110 transition-transform" size={28} />
                    <span className="text-[10px] font-display uppercase text-gray-400">Privacy First</span>
                </div>
            </div>

            {/* Rich Details Tabs - 优化样式 */}
            <div className="border border-white/10 bg-black/30 mt-4">
                <div className="flex border-b border-white/10">
                    <button 
                        onClick={() => setActiveTab('DESC')}
                        className={`flex-1 py-4 font-display text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'DESC' 
                            ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5' 
                            : 'text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        {getTranslation('FEATURES')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('SPECS')}
                        className={`flex-1 py-4 font-display text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'SPECS' 
                            ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5' 
                            : 'text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        {getTranslation('SPECS')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('REVIEWS')}
                        className={`flex-1 py-4 font-display text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${
                            activeTab === 'REVIEWS' 
                            ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5' 
                            : 'text-gray-400 hover:bg-white/5'
                        }`}
                    >
                        {getTranslation('REVIEWS')} ({reviews.length})
                    </button>
                </div>
                <div className="p-6 min-h-[400px]">
                    {activeTab === 'DESC' && (
                        <div className="space-y-4">
                            {/* 商品描述 - 支持HTML渲染 */}
                            {product.description && (
                                <div 
                                    className="mb-6 pb-6 border-b border-white/10 text-gray-300 font-body text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                />
                            )}
                            
                            {/* 功能列表 */}
                            {product.features && product.features.length > 0 && (
                                <ul className="space-y-3">
                                    {product.features.map(f => (
                                        <li key={f} className="flex items-start gap-3 text-gray-300 font-body">
                                            <CheckCircle size={16} className="text-neon-purple flex-shrink-0 mt-0.5" /> 
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            
                            {/* 描述视频 */}
                            {product.descriptionVideo && (
                                <div className="mt-6 border border-white/10">
                                    <div className="bg-black/50 p-3 flex items-center gap-2 border-b border-white/10">
                                        <Film size={16} className="text-neon-yellow"/>
                                        <span className="text-xs font-display text-gray-400 uppercase">{getTranslation('Product Demo')}</span>
                                    </div>
                                    <video 
                                        src={product.descriptionVideo} 
                                        controls 
                                        className="w-full aspect-video bg-black"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'SPECS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(product.specs).map(([k,v]) => (
                                <div key={k} className="flex flex-col gap-2 p-4 bg-white/5 border border-white/10">
                                    <span className="text-neon-cyan text-xs uppercase font-bold tracking-wider">{k}</span>
                                    <span className="text-white text-sm">{v}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'REVIEWS' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-black/40 p-6 border border-white/5">
                                <div className="text-center md:text-left">
                                    <div className="text-4xl font-display font-bold text-white mb-2">4.9</div>
                                    <div className="flex text-neon-yellow text-sm gap-1 mb-2 justify-center md:justify-start">
                                        <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
                                    </div>
                                    <div className="text-xs text-gray-500">{reviews.length} {getTranslation('verified reviews')}</div>
                                </div>
                                <button 
                                  onClick={() => setIsReviewModalOpen(true)}
                                  className="border-2 border-neon-cyan text-neon-cyan px-6 py-3 font-display text-xs hover:bg-neon-cyan hover:text-black transition-all uppercase font-bold"
                                >
                                    {getTranslation('Write Review')}
                                </button>
                            </div>
                            
                            {reviews.map((r, i) => (
                                <div key={i} className="border-b border-white/5 last:border-0 pb-6 last:pb-0">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-pink rounded flex items-center justify-center text-white font-bold text-sm font-display">
                                                {r.user.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                 <div className="text-white font-bold font-display text-sm">{r.user}</div>
                                                 <div className="text-gray-500 text-[10px] uppercase tracking-wider">{r.date} // {getTranslation('VERIFIED')}</div>
                                            </div>
                                        </div>
                                        <div className="flex text-neon-yellow text-xs">
                                            {[...Array(r.rating)].map((_, j) => <Star key={j} size={12} fill="currentColor" />)}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 text-sm font-body leading-relaxed mb-3 pl-13">"{r.content}"</p>
                                    <div className="pl-13 flex gap-4 text-xs text-gray-500 font-display">
                                        <button className="hover:text-neon-cyan flex items-center gap-1 transition-colors"><ThumbsUp size={12}/> {getTranslation('Helpful')} (12)</button>
                                        <button className="hover:text-neon-pink flex items-center gap-1 transition-colors"><MessageCircle size={12}/> {getTranslation('Reply')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
         </div>
       </div>

       <WriteReviewModal 
         isOpen={isReviewModalOpen} 
         onClose={() => setIsReviewModalOpen(false)} 
         onSubmit={handleAddReview} 
       />

       {/* 相关推荐 */}
       {related.length > 0 && (
         <div className="max-w-7xl mx-auto border-t border-white/10 pt-16">
            <h3 className="font-display text-2xl md:text-3xl text-white mb-8 uppercase font-black">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-pink">{getTranslation('You May Also Like')}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {related.map(p => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
            </div>
         </div>
       )}
    </div>
  );
};

const Footer: React.FC<{ onNavigate: (v: ViewState) => void }> = ({ onNavigate }) => (
    <footer className="bg-black/90 text-white pt-12 pb-32 md:pb-24 border-t border-neon-purple/30 font-body relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Column 1: Brand */}
            <div>
                <h2 className="font-display text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-pink mb-6">NEBULA</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    Curating high-tech pleasure for the retro-future soul. 
                    We bridge the gap between biological desire and digital perfection.
                </p>
                <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-neon-cyan hover:text-black transition-all hover:border-neon-cyan"><Facebook size={18}/></a>
                    <a href="#" className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-neon-pink hover:text-black transition-all hover:border-neon-pink"><Instagram size={18}/></a>
                    <a href="#" className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-neon-yellow hover:text-black transition-all hover:border-neon-yellow"><Twitter size={18}/></a>
                </div>
            </div>

            {/* Column 2: Shop */}
            <div>
                <h3 className="font-display text-neon-cyan font-bold uppercase tracking-widest mb-6 text-sm">{getTranslation('MAINFRAME')}</h3>
                <ul className="space-y-4 text-sm text-gray-400">
                    <li><button onClick={() => onNavigate('SHOP')} className="hover:text-white transition-colors text-left">{getTranslation('All Products')}</button></li>
                    <li><button onClick={() => onNavigate('LOOKBOOK')} className="hover:text-white transition-colors text-left">{getTranslation('LOOKBOOK')}</button></li>
                    <li><button onClick={() => onNavigate('SHOP')} className="hover:text-white transition-colors text-left">{getTranslation('Best Sellers')}</button></li>
                    <li><button onClick={() => onNavigate('SHOP')} className="hover:text-white transition-colors text-left">{getTranslation('Gift Cards')}</button></li>
                </ul>
            </div>

            {/* Column 3: Support */}
            <div>
                <h3 className="font-display text-neon-pink font-bold uppercase tracking-widest mb-6 text-sm">{getTranslation('SUPPORT NODE')}</h3>
                <ul className="space-y-4 text-sm text-gray-400">
                    <li><button onClick={() => onNavigate('TRACKING')} className="hover:text-white transition-colors text-left">{getTranslation('Order Tracking (Signal)')}</button></li>
                    <li><button onClick={() => onNavigate('FAQ')} className="hover:text-white transition-colors text-left">{getTranslation('FAQ Database')}</button></li>
                    <li><button onClick={() => onNavigate('SHIPPING')} className="hover:text-white transition-colors text-left">{getTranslation('Shipping Protocol')}</button></li>
                    <li><button onClick={() => onNavigate('RETURNS')} className="hover:text-white transition-colors text-left">{getTranslation('Returns & Exchanges')}</button></li>
                    <li><button onClick={() => onNavigate('CONTACT')} className="hover:text-white transition-colors text-left">{getTranslation('Contact Uplink')}</button></li>
                </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div>
                <h3 className="font-display text-neon-yellow font-bold uppercase tracking-widest mb-6 text-sm">{getTranslation('ENCRYPT_FEED')}</h3>
                <p className="text-gray-400 text-xs mb-4">{getTranslation('Join 50,000+ nodes receiving exclusive drops.')}</p>
                <form className="flex flex-col gap-2">
                    <input type="email" placeholder="EMAIL_ADDRESS" className="bg-white/5 border border-white/10 p-3 text-sm text-white focus:border-neon-cyan outline-none" />
                    <button className="bg-white text-black font-display font-bold uppercase text-xs py-3 hover:bg-neon-cyan transition-colors">{getTranslation('SUBSCRIBE')}</button>
                </form>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest">
               <span>© 2084 NEBULA CORP.</span>
            </div>
            <div className="flex gap-4 opacity-50">
                <CreditCard size={24} />
                <Lock size={24} />
                <Shield size={24} />
            </div>
        </div>
    </footer>
);

const HomeView: React.FC<{ onNavigate: (v: ViewState) => void; onProductClick: (p: Product) => void; allProducts: Product[]; onSelectCategory: (cat: string, subCat?: string) => void; config: StoreConfig }> = ({ onNavigate, onProductClick, allProducts, onSelectCategory, config }) => (
  // FIXED: Adjusted top padding to clear the double header on desktop
  <div className="pt-24 md:pt-40">
    <div className="bg-neon-yellow text-black overflow-hidden py-1 border-y-2 border-black relative z-30">
        <div className="flex gap-8 whitespace-nowrap animate-marquee font-display font-bold text-sm tracking-widest uppercase">
        {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-4">{getTranslation('NEURAL LINK ESTABLISHED')} <Activity size={12} /> {getTranslation('SECURE CONNECTION')} <Globe size={12} /> {getTranslation('FREE SHIPPING ON ORDERS')} {'>'} 500 CREDITS</span>
        ))}
        </div>
    </div>
    
    <HeroCarousel onNavigate={onNavigate} slides={config.heroSlides} />

    {/* BRAND VALUES - OPTIMIZED FOR MOBILE */}
    <section className="py-8 md:py-10 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex flex-row md:flex-col items-center md:items-center text-left md:text-center p-3 md:p-4 group">
                <Shield className="w-6 h-6 md:w-10 md:h-10 text-neon-cyan flex-shrink-0" />
                <div className="ml-3 md:ml-0 md:mt-3">
                    <h3 className="font-display font-bold text-xs md:text-base text-white uppercase">100% Secure</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Encrypted Checkout</p>
                </div>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-center text-left md:text-center p-3 md:p-4 group">
                <Truck className="w-6 h-6 md:w-10 md:h-10 text-neon-pink flex-shrink-0" />
                <div className="ml-3 md:ml-0 md:mt-3">
                    <h3 className="font-display font-bold text-xs md:text-base text-white uppercase">Fast Shipping</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Plain Packaging</p>
                </div>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-center text-left md:text-center p-3 md:p-4 group">
                <Package className="w-6 h-6 md:w-10 md:h-10 text-neon-yellow flex-shrink-0" />
                <div className="ml-3 md:ml-0 md:mt-3">
                    <h3 className="font-display font-bold text-xs md:text-base text-white uppercase">Warranty</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">30-Day Return</p>
                </div>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-center text-left md:text-center p-3 md:p-4 group">
                <Star className="w-6 h-6 md:w-10 md:h-10 text-neon-purple fill-neon-purple flex-shrink-0" />
                <div className="ml-3 md:ml-0 md:mt-3">
                    <h3 className="font-display font-bold text-xs md:text-base text-white uppercase">Top Rated</h3>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">4.9/5.0 Rating</p>
                </div>
            </div>
        </div>
        </div>
    </section>

    {/* CATEGORIES GRID - 提前到第3位 */}
    <section className="py-10 md:py-16 px-6 max-w-7xl mx-auto relative z-10">
       <div className="text-center mb-8 md:mb-10">
           <h2 className="font-display text-2xl md:text-4xl text-white italic font-black">
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink">{getTranslation('SHOP BY')} {getTranslation('CATEGORY')}</span>
           </h2>
       </div>
       
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
           {Object.entries(getCategoryTree(config)).map(([cat, subcategories], i) => {
               const categoryProducts = allProducts.filter(p => p.category === cat);
               const productImage = categoryProducts.length > 0 
                   ? categoryProducts[0].images[0] 
                   : 'https://images.unsplash.com/photo-1526566661780-1a67ea3c863e?auto=format&fit=crop&q=80&w=800';
               
               const colors = [
                   { border: 'neon-cyan', text: 'text-neon-cyan' },
                   { border: 'neon-pink', text: 'text-neon-pink' },
                   { border: 'neon-purple', text: 'text-neon-purple' },
                   { border: 'neon-yellow', text: 'text-neon-yellow' },
               ];
               const color = colors[i % 4];
               
               return (
                   <div 
                       key={cat} 
                       onClick={() => onSelectCategory(cat)} 
                       className={`relative aspect-square group cursor-pointer overflow-hidden border border-white/20 hover:border-${color.border} transition-all duration-500 bg-black`}
                   >
                       <div className="absolute inset-0">
                           <img 
                               src={productImage}
                               alt={cat}
                               className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                           />
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                       <div className="absolute top-2 right-2 z-20">
                           <div className={`bg-black/80 backdrop-blur-sm px-2 py-1 text-[10px] font-display font-bold ${color.text}`}>
                               {categoryProducts.length || subcategories.length}
                           </div>
                       </div>
                       <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-10">
                           <h3 className={`font-display text-xl md:text-2xl text-white font-black uppercase mb-1 group-hover:${color.text} transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,1)]`}>
                               {cat}
                           </h3>
                           <div className="flex items-center gap-1 text-[10px] text-gray-400 group-hover:text-white transition-colors font-display uppercase">
                               <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                           </div>
                       </div>
                       <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-${color.border} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                   </div>
               );
           })}
       </div>
    </section>
    
    {/* FEATURED PRODUCTS */}
    <FeaturedProductsSection 
        allProducts={allProducts}
        onProductClick={onProductClick}
        onNavigate={onNavigate}
        config={config}
    />
    
    {/* FLASH SALE BANNER - 新增 */}
    <section className="py-6 md:py-8 bg-gradient-to-r from-neon-pink/10 via-neon-purple/10 to-neon-cyan/10 border-y border-neon-pink/30">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neon-pink/20 rounded-full flex items-center justify-center animate-pulse">
                        <Timer size={24} className="text-neon-pink" />
                    </div>
                    <div>
                        <h3 className="font-display text-lg md:text-xl font-black text-white uppercase tracking-wider">{getTranslation('Flash Sale Active')}</h3>
                        <p className="text-xs md:text-sm text-gray-400">{getTranslation('Up to 20% off on bulk orders')}</p>
                    </div>
                </div>
                <button 
                    onClick={() => onNavigate('SHOP')}
                    className="px-6 py-3 bg-neon-pink hover:bg-neon-pink/80 text-black font-display font-bold uppercase text-sm tracking-wider transition-all flex items-center gap-2"
                >
                    <span>{getTranslation('Shop Now')}</span>
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    </section>

    <SocialVideoFeed products={allProducts} onProductClick={onProductClick} />

   {/* TESTIMONIALS - 左右按钮轮播 */}
    <section className="py-12 md:py-16 bg-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-1/4 w-64 h-64 bg-neon-purple rounded-full blur-[100px]"></div>
            <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-neon-cyan rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="text-center mb-8">
                <h2 className="font-display text-2xl md:text-3xl text-white uppercase tracking-wider italic font-black inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink">{getTranslation('WHAT CUSTOMERS SAY')}</span>
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent mt-2"></div>
                </h2>
                <p className="text-gray-500 text-xs mt-3 font-display uppercase tracking-widest">{getTranslation('REAL FEEDBACK FROM VERIFIED BUYERS')}</p>
            </div>
            
            {/* 轮播容器 */}
            <TestimonialCarousel reviews={REVIEWS_MOCK} />
            
            {/* 底部统计 */}
            <div className="text-center mt-8">
                <p className="text-gray-500 text-xs mb-3 font-display uppercase tracking-widest">{getTranslation('JOIN 1143+ SATISFIED USERS')}</p>
                <button className="px-6 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-display font-bold uppercase text-xs tracking-wider hover:shadow-lg hover:shadow-neon-cyan/50 transition-all transform hover:scale-105 rounded">
                    {getTranslation('SHARE YOUR EXPERIENCE')}
                </button>
            </div>
        </div>
    </section>

   {/* FAQ SECTION */}
    <section className="py-12 md:py-20 bg-gradient-to-b from-black via-[#0a0614] to-synth-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 right-20 w-64 h-64 bg-neon-yellow rounded-full blur-[100px]"></div>
            <div className="absolute bottom-10 left-20 w-64 h-64 bg-neon-pink rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
            <HomeFAQSection />
        </div>
    </section>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]); // 保存原始产品数据
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);  // 后台管理状态
  const [showAdminLogin, setShowAdminLogin] = useState(false);  // 登录弹窗状态
  const [language, setLanguage] = useState('EN');  // 语言状态
  const [currency, setCurrency] = useState('USD');  // 货币状态
  const [config, setConfig] = useState<StoreConfig>({  // 商店配置
    storeName: 'NEBULA',
    heroSlides: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070',
        title1: '',
        title2: '',
        subtitle: '',
        desc: '',
        cta: 'SHOP NOW'
      },
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=2070',
        title1: '',
        title2: '',
        subtitle: '',
        desc: '',
        cta: 'SHOP NOW'
      },
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=2070',
        title1: '',
        title2: '',
        subtitle: '',
        desc: '',
        cta: 'SHOP NOW'
      }
    ],
    sectors: [],
    categories: ['IMPORTED']
  });

  // 更新全局翻译语言
  useEffect(() => {
    currentLanguage = language;
  }, [language]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 监听语言和货币变化 - 翻译和转换
  useEffect(() => {
    if (originalProducts.length === 0) return;
    
    let processedProducts = [...originalProducts];
    
    // 先转换货币
    if (currency !== 'USD') {
      console.log(`💰 Converting prices to: ${currency}`);
      
      Promise.all(processedProducts.map(async (product) => {
        try {
          const convertedPrice = await convertPrice(product.price, 'USD', currency);
          return { 
            ...product, 
            price: convertedPrice,
            displayPrice: formatPrice(convertedPrice, currency) // 添加格式化价格
          };
        } catch (error) {
          console.error('Currency conversion error:', error);
          return product;
        }
      })).then(convertedProducts => {
        processedProducts = convertedProducts;
        
        // 再翻译文本
        if (language !== 'EN') {
          console.log(`🌍 Translating to: ${language}`);
          const langCode = LANGUAGE_CODES[language as keyof typeof LANGUAGE_CODES];
          
          Promise.all(processedProducts.map(async (product) => {
            try {
              const translatedName = await translate(product.name, langCode);
              const translatedDesc = await translate(product.description, langCode);
              return {
                ...product,
                name: translatedName as string,
                description: translatedDesc as string
              };
            } catch (error) {
              console.error('Translation error:', error);
              return product;
            }
          })).then(finalProducts => {
            setProducts(finalProducts);
            showToast(`✓ ${language} | ${currency}`);
          });
        } else {
          setProducts(processedProducts);
          showToast(`✓ Currency: ${currency}`);
        }
      });
    } else if (language !== 'EN') {
      // 只翻译，不转换货币
      console.log(`🌍 Translating to: ${language}`);
      const langCode = LANGUAGE_CODES[language as keyof typeof LANGUAGE_CODES];
      
      Promise.all(processedProducts.map(async (product) => {
        try {
          const translatedName = await translate(product.name, langCode);
          const translatedDesc = await translate(product.description, langCode);
          return {
            ...product,
            name: translatedName as string,
            description: translatedDesc as string,
            displayPrice: formatPrice(product.price, 'USD') // USD格式
          };
        } catch (error) {
          console.error('Translation error:', error);
          return product;
        }
      })).then(translatedProducts => {
        setProducts(translatedProducts);
        showToast(`✓ ${language}`);
      });
    } else {
      // 恢复默认 - 添加USD格式化
      const formattedProducts = originalProducts.map(p => ({
        ...p,
        displayPrice: formatPrice(p.price, 'USD')
      }));
      setProducts(formattedProducts);
    }
  }, [language, currency, originalProducts]);

  // 同步更新selectedProduct
  useEffect(() => {
    if (selectedProduct && products.length > 0) {
      const updatedProduct = products.find(p => p.id === selectedProduct.id);
      if (updatedProduct) {
        console.log(`🔄 [Sync]: Updating selectedProduct with new price: ${updatedProduct.price}`);
        setSelectedProduct(updatedProduct);
      }
    }
  }, [products, selectedProduct?.id]);

  useEffect(() => {
    // 从Supabase加载商品数据
    const loadProducts = async () => {
      try {
        console.log('📦 Loading products from Supabase...');
        const supabaseProducts = await productsAPI.getAll();
        
        if (supabaseProducts && supabaseProducts.length > 0) {
          console.log(`✅ Loaded ${supabaseProducts.length} products from Supabase`);
          setProducts(supabaseProducts);
          setOriginalProducts(supabaseProducts);
        } else {
          // Supabase为空，尝试localStorage备份
          const storedProducts = localStorage.getItem('CR_CATALOG_DATA');
          if (storedProducts) {
            try {
              const parsedProducts = JSON.parse(storedProducts);
              console.log('💾 Loading from localStorage backup');
              setProducts(parsedProducts);
              setOriginalProducts(parsedProducts);
            } catch (e) {
              console.error('Failed to parse stored products', e);
            }
          }
        }
      } catch (error) {
        console.error('❌ Supabase loading failed:', error);
        // 失败后尝试localStorage
        const storedProducts = localStorage.getItem('CR_CATALOG_DATA');
        if (storedProducts) {
          try {
            const parsedProducts = JSON.parse(storedProducts);
            console.log('💾 Fallback to localStorage');
            setProducts(parsedProducts);
            setOriginalProducts(parsedProducts);
          } catch (e) {
            console.error('Failed to parse stored products', e);
          }
        }
      }
    };
    
    loadProducts();
    
    // 加载商店配置
    const storedConfig = localStorage.getItem('CR_STORE_CONFIG');
    if (storedConfig) {
      try {
        setConfig(JSON.parse(storedConfig));
      } catch (e) {
        console.error('Failed to parse stored config', e);
      }
    }
    
    const verified = localStorage.getItem('nebula_age_verified');
    if (verified) setAgeVerified(true);
  }, []);

  // 检查管理员认证状态
  useEffect(() => {
    // 只保留 ?admin=true 链接方式登录
    // 必须在年龄验证后才检查
    if (!ageVerified) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      if (!isAdminAuthenticated()) {
        setShowAdminLogin(true);
      } else {
        setIsAdminOpen(true);
      }
      // 清除URL参数
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [ageVerified]);

  // 处理管理员登录成功
  const handleAdminLoginSuccess = () => {
    setAdminSession();
    setShowAdminLogin(false);
    setIsAdminOpen(true);
  };

  // 处理管理员登出
  const handleAdminLogout = () => {
    clearAdminSession();
    setIsAdminOpen(false);
    showToast('已安全退出管理后台');
  };

  // 触发管理员登录（可以通过特殊URL参数访问）
  useEffect(() => {
    // 必须在年龄验证后才检查
    if (!ageVerified) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      if (!isAdminAuthenticated()) {
        setShowAdminLogin(true);
      } else {
        setIsAdminOpen(true);
      }
      // 清除URL参数
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [ageVerified]);

  const handleVerifyAge = () => {
    localStorage.setItem('nebula_age_verified', 'true');
    setAgeVerified(true);
  };

  const addToCart = (product: Product | CartItem) => {
    setCart(prev => {
      // 对于组合商品，查找同一bundleId的存在条目
      const cartProduct = product as CartItem;
      if (cartProduct.isBundleItem && cartProduct.bundleId) {
        const existing = prev.find(p => p.id === product.id && p.bundleId === cartProduct.bundleId);
        if (existing) {
          // 组合商品已存在，增加数量（保持组合价）
          return prev.map(p => (p.id === product.id && p.bundleId === cartProduct.bundleId) ? { ...p, quantity: p.quantity + 1 } : p);
        }
      } else {
        // 普通商品，查找不带bundleId的存在条目
        const existing = prev.find(p => p.id === product.id && !p.bundleId);
        if (existing) {
          return prev.map(p => (p.id === product.id && !p.bundleId) ? { ...p, quantity: p.quantity + 1 } : p);
        }
      }
      
      // 查找真正的原始USD价格（不管是否组合商品）
      const originalPrice = originalProducts.find(op => op.id === product.id)?.price || product.price;
      
      // 生成唯一的购物车条目ID
      const cartItemId = `${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return [...prev, { 
        ...product,
        cartItemId, // 添加购物车条目唯一ID
        quantity: 1,
        originalPrice, // 总是保存真正的原始USD价格
        addedCurrency: currency
      }];
    });
    setIsCartOpen(true);
    showToast("ADDED TO SYSTEM");
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.cartItemId === cartItemId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      // 重新计算组合商品价格
      return recalculateBundlePrices(newCart);
    });
  };

  const updateCartQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      // 数量为0时删除商品
      setCart(prev => {
        const newCart = prev.filter(item => item.cartItemId !== cartItemId);
        return recalculateBundlePrices(newCart);
      });
    } else {
      setCart(prev => {
        const newCart = prev.map(item => {
          if (item.cartItemId === cartItemId) {
            return { ...item, quantity: Math.max(1, newQuantity) };
          }
          return item;
        });
        return recalculateBundlePrices(newCart);
      });
    }
  };
  
  // 重新计算组合商品价格：如果组合被打破，恢复原价
  const recalculateBundlePrices = (cart: CartItem[]): CartItem[] => {
    return cart.map(item => {
      // 如果不是组合商品，直接返回
      if (!item.isBundleItem || !item.bundleId) {
        return item;
      }
      
      // 查找同一组合的所有商品
      const bundleItems = cart.filter(i => i.bundleId === item.bundleId);
      
      // 检查组合是否完整：必须有两个商品且数量相同
      const isBundleIntact = bundleItems.length === 2 && 
                            bundleItems[0].quantity === bundleItems[1].quantity;
      
      if (isBundleIntact) {
        // 组合完整，保持组合价（已经分摆好的price）
        return item;
      } else {
        // 组合被打破，恢复原价
        const originalProduct = originalProducts.find(p => p.id === item.id);
        if (originalProduct) {
          return {
            ...item,
            price: originalProduct.price,
            isBundleItem: false, // 清除组合标记
            bundleId: undefined
          };
        }
        return item;
      }
    });
  };

  const handleCheckout = async () => {
     setCheckoutLoading(true);
     setView('CHECKOUT');
     setIsCartOpen(false);
     setCheckoutLoading(false);
  };
  
  const processPayment = async (method: string) => {
      setCheckoutLoading(true);
      const url = await createCheckoutSession(cart, method);
      window.location.href = url;
      setCheckoutLoading(false);
  }

  const navigateToProduct = (p: Product) => {
      setSelectedProduct(p);
      setView('PRODUCT_DETAIL');
      window.scrollTo(0,0);
  };

  const navigateToCategory = (cat: string, subCat?: string) => {
      setCategoryFilter(cat);
      setView('SHOP');
      window.scrollTo(0,0);
  };

  if (!ageVerified) return <AgeGate onVerify={handleVerifyAge} />;

  // 如果显示登录页面，直接返回登录组件，不显示首页
  if (showAdminLogin) {
    return (
      <AdminLogin 
        onLoginSuccess={handleAdminLoginSuccess}
        onCancel={() => setShowAdminLogin(false)}
      />
    );
  }

  return (
    <div className="bg-synth-bg min-h-screen text-white selection:bg-neon-pink selection:text-white font-body relative">
        <Navbar 
            cartCount={cart.reduce((a,b)=>a+b.quantity,0)} 
            onOpenCart={() => setIsCartOpen(true)}
            onNavigate={(v) => { setView(v); window.scrollTo(0,0); }}
            onToggleSearch={() => setIsSearchOpen(true)}
            onToggleSettings={() => setIsSettingsOpen(true)}
        />
        
        <DesktopCategoryNav onSelect={navigateToCategory} config={config} />

        {/* Mobile Category Bar: now rendered in App for better persistence */}
        {(view === 'HOME' || view === 'SHOP') && (
            <MobileCategoryBar 
                onSelect={(cat) => {
                    navigateToCategory(cat);
                }} 
                activeCat={categoryFilter}
                config={config}
            />
        )}

        <SearchBar 
            isOpen={isSearchOpen} 
            onClose={() => setIsSearchOpen(false)} 
            onSearch={(q) => { setSearchQuery(q); setView('SHOP'); setIsSearchOpen(false); }}
        />
        
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          currentLanguage={language}
          currentCurrency={currency}
          onLanguageChange={setLanguage}
          onCurrencyChange={setCurrency}
        />
        
        <CartDrawer 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
            items={cart} 
            onUpdateQty={updateCartQty}
            onCheckout={handleCheckout}
            isProcessing={checkoutLoading}
            currency={currency}
        />

        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

        {/* 后台管理 */}
        {isAdminOpen && (
          <AdminDashboard
            products={products}
            config={config}
            onUpdateProducts={(newProducts) => {
              setProducts(newProducts);
              localStorage.setItem('CR_CATALOG_DATA', JSON.stringify(newProducts));
            }}
            onUpdateConfig={(newConfig) => {
              setConfig(newConfig);
              localStorage.setItem('CR_STORE_CONFIG', JSON.stringify(newConfig));
            }}
            onExit={() => setIsAdminOpen(false)}
          />
        )}

        <main>
            {view === 'HOME' && (
                <HomeView 
                    onNavigate={(v) => { setView(v); window.scrollTo(0,0); }}
                    onProductClick={navigateToProduct}
                    allProducts={products}
                    onSelectCategory={navigateToCategory}
                    config={config}
                />
            )}
            
            {view === 'SHOP' && (
                <ShopView 
                    onProductClick={navigateToProduct}
                    initialSearch={searchQuery}
                    allProducts={products}
                    initialCategory={categoryFilter}
                    config={config}
                />
            )}

            {view === 'PRODUCT_DETAIL' && selectedProduct && (
                <ProductDetailView 
                    product={selectedProduct} 
                    onAddToCart={addToCart}
                    onBack={() => setView('SHOP')}
                    onProductClick={navigateToProduct}
                    allProducts={products}
                    currency={currency}
                    config={config}
                    originalProducts={originalProducts}
                />
            )}

            {view === 'CHECKOUT' && (
                <CheckoutView 
                    cart={cart}
                    onBack={() => setView('SHOP')}
                    onProcessPayment={processPayment}
                    isProcessing={checkoutLoading}
                    onUpdateQuantity={updateCartQuantity}
                    currency={currency}
                    shippingConfig={config.shippingConfig}
                />
            )}
            
            {view === 'LOOKBOOK' && <LookbookView />}
            
            {view === 'BLOG' && <BlogView onRead={(id) => console.log(id)} />}
            
            {view === 'CONTACT' && <ContactView />}
            
            {view === 'ABOUT' && <InfoPageView title="SYSTEM CORE // ABOUT" content={<><p className="mb-4 text-lg">Founded in 2084, Nebula Corp bridges the gap between biological desire and digital perfection.</p><p className="text-lg">We specialize in haptic interfaces, bio-compatible materials, and secure pleasure protocols.</p></>} />}
            
            {view === 'FAQ' && <FaqView />}
            
            {view === 'SHIPPING' && <ShippingView />}
            
            {view === 'RETURNS' && <ReturnsView />}
            
            {view === 'TRACKING' && <TrackingView />}
            
            {(view === 'PRIVACY' || view === 'TERMS') && <InfoPageView title="LEGAL PROTOCOLS" content={<><p className="text-gray-300 mb-4 text-lg">By accessing the Nebula Mainframe, you agree to bio-metric scanning and data retention protocols.</p><p className="text-gray-300 mb-4 text-lg">Resistance is futile.</p></>} />}
        </main>

        {view !== 'CHECKOUT' && <Footer onNavigate={(v) => { setView(v); window.scrollTo(0,0); }} />}
    </div>
  );
};

export default App;