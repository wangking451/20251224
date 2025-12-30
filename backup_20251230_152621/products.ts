import { Product } from './types';

// Mock video URLs for demonstration
const VIDEOS = {
    // 16:9 Product Showcase
    MAIN: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", 
    // Vertical/Social Style
    SOCIAL: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    // Feature/Tech Demo
    TECH: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
};

export const PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'NEB-01',
    name: 'Pulse Wand X',
    price: 159.00,
    category: 'VIBES',
    images: [
      'https://images.unsplash.com/photo-1616606103915-dea7be788566?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1537832816519-043944f20557?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1526566661780-1a67ea3c863e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'
    ],
    mainVideo: VIDEOS.MAIN,
    socialVideo: VIDEOS.SOCIAL,
    descriptionVideo: VIDEOS.TECH,
    description: "Maximum overdrive. Military-grade haptic engine encased in bio-silicone. Syncs to the beat of your night.",
    features: ['Chameleon Skin', 'Bio-Haptic', 'Wireless', 'Silent'],
    specs: { material: 'Silicone/ABS', size: 'Medium', noise: '<25dB', battery: 'Li-Poly' },
    stock_status: 'IN_STOCK'
  },
  {
    id: '2',
    sku: 'NEB-02',
    name: 'Neon Cord',
    price: 59.00,
    category: 'BONDAGE',
    images: [
      'https://images.unsplash.com/photo-1576014131795-d440191a8e8b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1596079890744-c1a0462d0975?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1515630278258-407f66498911?auto=format&fit=crop&q=80&w=800'
    ],
    mainVideo: VIDEOS.MAIN,
    socialVideo: VIDEOS.SOCIAL,
    description: "Laser-wire aesthetics. High tensile strength luminescent fibers that cut through the darkness.",
    features: ['Luminescent', 'High Tensile', 'UV Reactive', 'Non-Stretch'],
    specs: { material: 'Nylon/EL Wire', size: '10m', noise: 'N/A', battery: 'N/A' },
    stock_status: 'IN_STOCK'
  },
  {
    id: '3',
    sku: 'NEB-03',
    name: 'Synapse Gel',
    price: 32.00,
    category: 'FLUIDS',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1616400619175-5beda3a17896?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800'
    ],
    mainVideo: VIDEOS.TECH,
    socialVideo: VIDEOS.SOCIAL,
    descriptionVideo: VIDEOS.MAIN,
    description: "Liquid chrome. A conductive fluid engineered for maximum neural interface sensitivity.",
    features: ['Conductive', 'Hybrid Base', 'pH Balanced', 'Cool/Warm'],
    specs: { material: 'Hybrid', size: '120ml', noise: 'N/A', battery: 'N/A' },
    stock_status: 'LOW_STOCK'
  },
  {
    id: '4',
    sku: 'NEB-04',
    name: 'Orbit Choker',
    price: 89.00,
    category: 'BONDAGE',
    images: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1618644230494-c44dc1ad34c0?auto=format&fit=crop&q=80&w=800'
    ],
    mainVideo: VIDEOS.MAIN,
    socialVideo: VIDEOS.SOCIAL,
    description: "Locked in orbit. Transparent PVC with embedded LED circuitry.",
    features: ['LED Embedded', 'Clear PVC', 'Rechargeable', 'Dimmer'],
    specs: { material: 'PVC/LED', size: 'Adjustable', noise: 'N/A', battery: '300mAh' },
    stock_status: 'OUT_OF_STOCK'
  },
  {
    id: '5',
    sku: 'NEB-05',
    name: 'Cyber Visor',
    price: 129.00,
    category: 'LINGERIE',
    images: [
      'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1577741314755-048d8525d31e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=800'
    ],
    mainVideo: VIDEOS.MAIN,
    socialVideo: VIDEOS.SOCIAL,
    descriptionVideo: VIDEOS.TECH,
    description: "Augmented reality interface fashion accessory. Purely aesthetic, strictly strictly cool.",
    features: ['UV Protection', 'HUD Effect', 'Lightweight', 'Anti-Fog'],
    specs: { material: 'Polycarb', size: 'One Size', noise: 'N/A', battery: 'N/A' },
    stock_status: 'IN_STOCK'
  },
  {
    id: '6',
    sku: 'NEB-06',
    name: 'Neural Oil',
    price: 45.00,
    category: 'FLUIDS',
    images: [
      'https://images.unsplash.com/photo-1616400619175-5beda3a17896?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'
    ],
    mainVideo: VIDEOS.TECH,
    socialVideo: VIDEOS.SOCIAL,
    description: "Premium massage oil with warming agents activated by friction.",
    features: ['Warming', 'Scentless', 'Non-Staining', 'Vegan'],
    specs: { material: 'Oil Base', size: '200ml', noise: 'N/A', battery: 'N/A' },
    stock_status: 'IN_STOCK'
  }
];

export const REVIEWS_MOCK = [
  { 
    user: "Neon_Rider", 
    rating: 5, 
    date: "2084-01-12", 
    content: "Absolutely stunning build quality. The haptics are unlike anything else I've plugged into."
  },
  { 
    user: "Cyber_Goth", 
    rating: 4, 
    date: "2084-02-01", 
    content: "Looks amazing in low light. Shipping was super discreet, drone dropped it right on my balcony."
  },
  { 
    user: "Void_Walker", 
    rating: 5, 
    date: "2084-03-15", 
    content: "Worth every credit. The neural interface is intuitive and instant."
  },
  {
    user: "Chrome_Angel",
    rating: 5,
    date: "2084-03-22",
    content: "Best purchase I've made this year. The quality is insane and it arrived in 24 hours!"
  },
  {
    user: "Pixel_Dust",
    rating: 4,
    date: "2084-04-05",
    content: "Really impressed with the packaging and attention to detail. Feels premium."
  },
  {
    user: "Neon_Dreams",
    rating: 5,
    date: "2084-04-18",
    content: "Exceeded all my expectations. The glow effect is absolutely mesmerizing in the dark."
  },
  {
    user: "Data_Ghost",
    rating: 5,
    date: "2084-05-02",
    content: "Silent operation is a game changer. My flatmates have no idea."
  },
  {
    user: "Synth_Wave",
    rating: 4,
    date: "2084-05-14",
    content: "Great product, fast shipping. Only wish it came in more color options."
  },
  {
    user: "Voltage_Queen",
    rating: 5,
    date: "2084-05-27",
    content: "The build quality is outstanding. You can tell this was engineered with care."
  }
];
