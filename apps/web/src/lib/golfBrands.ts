// Golf Equipment Brands with SVG Logos
export interface GolfBrand {
  id: string
  name: string
  slug: string
  logo: string
  color: string
  founded: number
  country: string
  description: string
  website: string
  categories: ('clubs' | 'balls' | 'accessories' | 'apparel')[]
}

// SVG Logos - 2025/2026 Brand Identity Representations
const BRAND_LOGOS = {
  // Titleist - Classic serif with distinctive 'T' styling
  titleist: `<svg viewBox="0 0 200 50" fill="currentColor">
    <defs>
      <linearGradient id="titleist-shine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:currentColor;stop-opacity:1" />
        <stop offset="50%" style="stop-color:currentColor;stop-opacity:0.9" />
        <stop offset="100%" style="stop-color:currentColor;stop-opacity:1" />
      </linearGradient>
    </defs>
    <text x="0" y="38" font-family="'Playfair Display', 'Times New Roman', Georgia, serif" font-weight="700" font-size="36" letter-spacing="3" fill="url(#titleist-shine)">TITLEIST</text>
  </svg>`,
  
  // TaylorMade - Modern sans with signature underline (2025 brand refresh)
  taylormade: `<svg viewBox="0 0 200 50" fill="currentColor">
    <text x="0" y="32" font-family="'Oswald', 'Impact', sans-serif" font-weight="700" font-size="28" letter-spacing="0">TaylorMade</text>
    <rect x="0" y="38" width="175" height="3" fill="currentColor"/>
  </svg>`,
  
  // Callaway - Premium italic script styling (2025)
  callaway: `<svg viewBox="0 0 180 50" fill="currentColor">
    <text x="0" y="36" font-family="'Libre Baskerville', 'Palatino', Georgia, serif" font-weight="700" font-size="32" font-style="italic" letter-spacing="0">Callaway</text>
  </svg>`,
  
  // PING - Bold geometric sans (iconic 2025 styling)
  ping: `<svg viewBox="0 0 120 50" fill="currentColor">
    <text x="0" y="40" font-family="'Bebas Neue', 'Impact', sans-serif" font-weight="400" font-size="46" letter-spacing="4">PING</text>
  </svg>`,
  
  // Cobra - Dynamic angular styling with crown
  cobra: `<svg viewBox="0 0 140 50" fill="currentColor">
    <text x="0" y="38" font-family="'Russo One', 'Impact', sans-serif" font-weight="400" font-size="34" letter-spacing="2">COBRA</text>
  </svg>`,
  
  // Cleveland - Clean modern wordmark
  cleveland: `<svg viewBox="0 0 180 50" fill="currentColor">
    <text x="0" y="35" font-family="'Roboto Condensed', 'Arial Narrow', sans-serif" font-weight="700" font-size="28" letter-spacing="2">CLEVELAND</text>
  </svg>`,
  
  // Mizuno - Elegant Japanese-inspired light typography (2025)
  mizuno: `<svg viewBox="0 0 160 50" fill="currentColor">
    <text x="0" y="36" font-family="'Questrial', 'Century Gothic', sans-serif" font-weight="400" font-size="32" letter-spacing="6">MIZUNO</text>
  </svg>`,
  
  // Srixon - Bold angular modern branding
  srixon: `<svg viewBox="0 0 150 50" fill="currentColor">
    <text x="0" y="38" font-family="'Teko', 'Impact', sans-serif" font-weight="600" font-size="38" letter-spacing="3">SRIXON</text>
  </svg>`,
  
  // Bridgestone - Premium block lettering (2025 refresh)
  bridgestone: `<svg viewBox="0 0 220 50" fill="currentColor">
    <text x="0" y="35" font-family="'Barlow Condensed', 'Arial Black', sans-serif" font-weight="700" font-size="28" letter-spacing="2">BRIDGESTONE</text>
  </svg>`,
  
  // Scotty Cameron - Elegant signature script
  scottycameron: `<svg viewBox="0 0 200 50" fill="currentColor">
    <text x="0" y="32" font-family="'Cormorant Garamond', 'Palatino', serif" font-weight="600" font-size="24" font-style="italic" letter-spacing="1">Scotty Cameron</text>
  </svg>`,
  
  // Vokey - Craftsman signature styling
  vokey: `<svg viewBox="0 0 120 50" fill="currentColor">
    <text x="0" y="36" font-family="'Playfair Display', 'Georgia', serif" font-weight="700" font-size="30" font-style="italic">Vokey</text>
  </svg>`,
  
  // PXG - Bold luxury military-inspired (2025)
  pxg: `<svg viewBox="0 0 100 50" fill="currentColor">
    <text x="0" y="40" font-family="'Anton', 'Impact', sans-serif" font-weight="400" font-size="42" letter-spacing="2">PXG</text>
  </svg>`,
  
  // XXIO - Premium Japanese styling with modern flair
  xxio: `<svg viewBox="0 0 120 50" fill="currentColor">
    <text x="0" y="38" font-family="'Orbitron', 'Century Gothic', sans-serif" font-weight="700" font-size="36" letter-spacing="4">XXIO</text>
  </svg>`,
  
  // Honma - Classic Japanese luxury wordmark
  honma: `<svg viewBox="0 0 140 50" fill="currentColor">
    <text x="0" y="36" font-family="'Cinzel', 'Trajan', serif" font-weight="700" font-size="30" letter-spacing="3">HONMA</text>
  </svg>`,
  
  // Wilson - Iconic sporting heritage (2025)
  wilson: `<svg viewBox="0 0 150 50" fill="currentColor">
    <text x="0" y="38" font-family="'Archivo Black', 'Impact', sans-serif" font-weight="400" font-size="32" letter-spacing="2">WILSON</text>
  </svg>`,
  
  // Tour Edge - Performance-focused wordmark
  tour_edge: `<svg viewBox="0 0 180 50" fill="currentColor">
    <text x="0" y="35" font-family="'Rajdhani', 'Arial Black', sans-serif" font-weight="700" font-size="28" letter-spacing="1">TOUR EDGE</text>
  </svg>`,
}

export const GOLF_BRANDS: GolfBrand[] = [
  {
    id: 'titleist',
    name: 'Titleist',
    slug: 'titleist',
    logo: BRAND_LOGOS.titleist,
    color: '#F5F5F5', // Titleist classic off-white/silver
    founded: 1932,
    country: 'USA',
    description: 'The #1 ball in golf. Premium golf equipment and accessories.',
    website: 'https://www.titleist.com',
    categories: ['clubs', 'balls', 'accessories'],
  },
  {
    id: 'taylormade',
    name: 'TaylorMade',
    slug: 'taylormade',
    logo: BRAND_LOGOS.taylormade,
    color: '#E31837', // Official TaylorMade red 2025
    founded: 1979,
    country: 'USA',
    description: 'Innovative metalwoods and performance golf equipment.',
    website: 'https://www.taylormadegolf.com',
    categories: ['clubs', 'balls', 'accessories', 'apparel'],
  },
  {
    id: 'callaway',
    name: 'Callaway',
    slug: 'callaway',
    logo: BRAND_LOGOS.callaway,
    color: '#3B82F6', // Callaway blue 2025
    founded: 1982,
    country: 'USA',
    description: 'Premium golf equipment with cutting-edge technology.',
    website: 'https://www.callawaygolf.com',
    categories: ['clubs', 'balls', 'accessories', 'apparel'],
  },
  {
    id: 'ping',
    name: 'PING',
    slug: 'ping',
    logo: BRAND_LOGOS.ping,
    color: '#E5E5E5', // PING off-white
    founded: 1959,
    country: 'USA',
    description: 'Custom-fitted golf clubs with precision engineering.',
    website: 'https://www.ping.com',
    categories: ['clubs', 'accessories', 'apparel'],
  },
  {
    id: 'cobra',
    name: 'Cobra Golf',
    slug: 'cobra',
    logo: BRAND_LOGOS.cobra,
    color: '#F59E0B', // Cobra orange 2025
    founded: 1973,
    country: 'USA',
    description: 'Bold performance golf equipment for all skill levels.',
    website: 'https://www.cobragolf.com',
    categories: ['clubs', 'accessories', 'apparel'],
  },
  {
    id: 'cleveland',
    name: 'Cleveland Golf',
    slug: 'cleveland',
    logo: BRAND_LOGOS.cleveland,
    color: '#EF4444', // Cleveland red 2025
    founded: 1979,
    country: 'USA',
    description: 'Wedge specialists and short game experts.',
    website: 'https://www.clevelandgolf.com',
    categories: ['clubs', 'accessories'],
  },
  {
    id: 'mizuno',
    name: 'Mizuno',
    slug: 'mizuno',
    logo: BRAND_LOGOS.mizuno,
    color: '#6366F1', // Mizuno indigo 2025
    founded: 1906,
    country: 'Japan',
    description: 'Japanese craftsmanship in forged irons.',
    website: 'https://www.mizuno.com',
    categories: ['clubs', 'balls', 'accessories', 'apparel'],
  },
  {
    id: 'srixon',
    name: 'Srixon',
    slug: 'srixon',
    logo: BRAND_LOGOS.srixon,
    color: '#F0F0F0', // Srixon light gray
    founded: 1930,
    country: 'Japan',
    description: 'Tour-proven golf balls and clubs.',
    website: 'https://www.srixon.com',
    categories: ['clubs', 'balls', 'accessories'],
  },
  {
    id: 'bridgestone',
    name: 'Bridgestone Golf',
    slug: 'bridgestone',
    logo: BRAND_LOGOS.bridgestone,
    color: '#DC2626', // Bridgestone red 2025
    founded: 1931,
    country: 'Japan',
    description: 'Premium golf balls with advanced technology.',
    website: 'https://www.bridgestonegolf.com',
    categories: ['clubs', 'balls', 'accessories'],
  },
  {
    id: 'scottycameron',
    name: 'Scotty Cameron',
    slug: 'scotty-cameron',
    logo: BRAND_LOGOS.scottycameron,
    color: '#94A3B8', // Scotty Cameron silver 2025
    founded: 1991,
    country: 'USA',
    description: 'Premium handcrafted putters.',
    website: 'https://www.scottycameron.com',
    categories: ['clubs', 'accessories'],
  },
  {
    id: 'vokey',
    name: 'Vokey Design',
    slug: 'vokey',
    logo: BRAND_LOGOS.vokey,
    color: '#CA8A04', // Vokey gold 2025
    founded: 1997,
    country: 'USA',
    description: 'Tour-trusted wedge designs by Bob Vokey.',
    website: 'https://www.vokey.com',
    categories: ['clubs'],
  },
  {
    id: 'pxg',
    name: 'PXG',
    slug: 'pxg',
    logo: BRAND_LOGOS.pxg,
    color: '#FAFAFA', // PXG bright white
    founded: 2014,
    country: 'USA',
    description: 'Parsons Xtreme Golf - luxury performance equipment.',
    website: 'https://www.pxg.com',
    categories: ['clubs', 'balls', 'accessories', 'apparel'],
  },
  {
    id: 'xxio',
    name: 'XXIO',
    slug: 'xxio',
    logo: BRAND_LOGOS.xxio,
    color: '#0EA5E9', // XXIO sky blue 2025
    founded: 2000,
    country: 'Japan',
    description: 'Lightweight premium clubs for moderate swing speeds.',
    website: 'https://www.xxio.com',
    categories: ['clubs', 'balls', 'accessories'],
  },
  {
    id: 'honma',
    name: 'Honma',
    slug: 'honma',
    logo: BRAND_LOGOS.honma,
    color: '#D97706', // Honma gold/amber 2025
    founded: 1959,
    country: 'Japan',
    description: 'Luxury Japanese golf equipment.',
    website: 'https://www.honmagolf.com',
    categories: ['clubs', 'balls', 'accessories', 'apparel'],
  },
  {
    id: 'wilson',
    name: 'Wilson Golf',
    slug: 'wilson',
    logo: BRAND_LOGOS.wilson,
    color: '#EF4444', // Wilson red 2025
    founded: 1914,
    country: 'USA',
    description: 'Classic American golf equipment.',
    website: 'https://www.wilson.com',
    categories: ['clubs', 'balls', 'accessories'],
  },
  {
    id: 'tour_edge',
    name: 'Tour Edge',
    slug: 'tour-edge',
    logo: BRAND_LOGOS.tour_edge,
    color: '#FACC15', // Tour Edge gold 2025
    founded: 1986,
    country: 'USA',
    description: 'Performance golf equipment at great value.',
    website: 'https://www.touredge.com',
    categories: ['clubs', 'accessories'],
  },
]

// Club type definitions
export type ClubType = 
  | 'driver'
  | '3_wood'
  | '5_wood'
  | '7_wood'
  | 'hybrid'
  | 'iron'
  | 'wedge'
  | 'putter'

export interface ClubModel {
  id: string
  brandId: string
  name: string
  type: ClubType
  year: number
  shaft?: string
  flex?: 'X' | 'S' | 'R' | 'A' | 'L'
  loft?: number
  lie?: number
}

// Popular club models by brand
export const POPULAR_CLUB_MODELS: Record<string, { name: string; type: ClubType; year: number }[]> = {
  titleist: [
    { name: 'TSR2 Driver', type: 'driver', year: 2024 },
    { name: 'TSR3 Driver', type: 'driver', year: 2024 },
    { name: 'TSR1 Fairway', type: '3_wood', year: 2024 },
    { name: 'TSi2 Hybrid', type: 'hybrid', year: 2023 },
    { name: 'T100 Irons', type: 'iron', year: 2024 },
    { name: 'T150 Irons', type: 'iron', year: 2024 },
    { name: 'T200 Irons', type: 'iron', year: 2024 },
    { name: 'T350 Irons', type: 'iron', year: 2024 },
    { name: 'Vokey SM10 Wedge', type: 'wedge', year: 2024 },
    { name: 'Scotty Cameron Phantom X', type: 'putter', year: 2024 },
    { name: 'Scotty Cameron Special Select', type: 'putter', year: 2024 },
  ],
  taylormade: [
    { name: 'Qi10 Max Driver', type: 'driver', year: 2024 },
    { name: 'Qi10 LS Driver', type: 'driver', year: 2024 },
    { name: 'Qi10 Tour Driver', type: 'driver', year: 2024 },
    { name: 'Qi10 Fairway', type: '3_wood', year: 2024 },
    { name: 'Stealth 2 HD Rescue', type: 'hybrid', year: 2023 },
    { name: 'P790 Irons', type: 'iron', year: 2024 },
    { name: 'P770 Irons', type: 'iron', year: 2024 },
    { name: 'Stealth Irons', type: 'iron', year: 2023 },
    { name: 'Hi-Toe 3 Wedge', type: 'wedge', year: 2024 },
    { name: 'MG4 Wedge', type: 'wedge', year: 2024 },
    { name: 'Spider Tour Putter', type: 'putter', year: 2024 },
  ],
  callaway: [
    { name: 'Paradym Ai Smoke Max Driver', type: 'driver', year: 2024 },
    { name: 'Paradym Ai Smoke Triple Diamond', type: 'driver', year: 2024 },
    { name: 'Paradym Fairway', type: '3_wood', year: 2024 },
    { name: 'Paradym Ai Smoke Hybrid', type: 'hybrid', year: 2024 },
    { name: 'Apex Pro Irons', type: 'iron', year: 2024 },
    { name: 'Apex DCB Irons', type: 'iron', year: 2024 },
    { name: 'Paradym Irons', type: 'iron', year: 2024 },
    { name: 'Jaws Raw Wedge', type: 'wedge', year: 2024 },
    { name: 'Opus Wedge', type: 'wedge', year: 2024 },
    { name: 'Ai Smoke Putter', type: 'putter', year: 2024 },
  ],
  ping: [
    { name: 'G430 Max 10K Driver', type: 'driver', year: 2024 },
    { name: 'G430 LST Driver', type: 'driver', year: 2024 },
    { name: 'G430 Max Fairway', type: '3_wood', year: 2024 },
    { name: 'G430 Hybrid', type: 'hybrid', year: 2024 },
    { name: 'i530 Irons', type: 'iron', year: 2024 },
    { name: 'Blueprint T Irons', type: 'iron', year: 2024 },
    { name: 'G430 Irons', type: 'iron', year: 2024 },
    { name: 'Glide 4.0 Wedge', type: 'wedge', year: 2024 },
    { name: 'S159 Wedge', type: 'wedge', year: 2024 },
    { name: 'Anser Putter', type: 'putter', year: 2024 },
    { name: 'PLD Putter', type: 'putter', year: 2024 },
  ],
  cobra: [
    { name: 'Darkspeed Max Driver', type: 'driver', year: 2024 },
    { name: 'Darkspeed LS Driver', type: 'driver', year: 2024 },
    { name: 'Darkspeed X Driver', type: 'driver', year: 2024 },
    { name: 'Darkspeed Fairway', type: '3_wood', year: 2024 },
    { name: 'Darkspeed Hybrid', type: 'hybrid', year: 2024 },
    { name: 'King Tour Irons', type: 'iron', year: 2024 },
    { name: 'Darkspeed Irons', type: 'iron', year: 2024 },
    { name: 'King Snakebite Wedge', type: 'wedge', year: 2024 },
    { name: '3D Printed Putter', type: 'putter', year: 2024 },
  ],
  mizuno: [
    { name: 'ST-Max 230 Driver', type: 'driver', year: 2024 },
    { name: 'ST-Z 230 Driver', type: 'driver', year: 2024 },
    { name: 'ST-X 230 Fairway', type: '3_wood', year: 2024 },
    { name: 'Pro 245 Hybrid', type: 'hybrid', year: 2024 },
    { name: 'Pro 225 Irons', type: 'iron', year: 2024 },
    { name: 'Pro 223 Irons', type: 'iron', year: 2024 },
    { name: 'JPX 923 Hot Metal Irons', type: 'iron', year: 2024 },
    { name: 'T24 Wedge', type: 'wedge', year: 2024 },
    { name: 'M.Craft Putter', type: 'putter', year: 2024 },
  ],
  cleveland: [
    { name: 'Launcher XL2 Driver', type: 'driver', year: 2024 },
    { name: 'Launcher XL Halo Fairway', type: '3_wood', year: 2024 },
    { name: 'Launcher XL Halo Hybrid', type: 'hybrid', year: 2024 },
    { name: 'Zipcore XL Irons', type: 'iron', year: 2024 },
    { name: 'RTX 6 ZipCore Wedge', type: 'wedge', year: 2024 },
    { name: 'CBX 4 ZipCore Wedge', type: 'wedge', year: 2024 },
    { name: 'HB Soft 2 Putter', type: 'putter', year: 2024 },
  ],
  srixon: [
    { name: 'ZX5 Mk II Driver', type: 'driver', year: 2024 },
    { name: 'ZX7 Mk II Driver', type: 'driver', year: 2024 },
    { name: 'ZX Mk II Fairway', type: '3_wood', year: 2024 },
    { name: 'ZX Mk II Hybrid', type: 'hybrid', year: 2024 },
    { name: 'ZX5 Mk II Irons', type: 'iron', year: 2024 },
    { name: 'ZX7 Mk II Irons', type: 'iron', year: 2024 },
    { name: 'Z-Forged II Irons', type: 'iron', year: 2024 },
  ],
}

// Ball models by brand
export const GOLF_BALLS: Record<string, { name: string; year: number; type: 'tour' | 'distance' | 'soft' }[]> = {
  titleist: [
    { name: 'Pro V1', year: 2024, type: 'tour' },
    { name: 'Pro V1x', year: 2024, type: 'tour' },
    { name: 'AVX', year: 2024, type: 'soft' },
    { name: 'Tour Speed', year: 2024, type: 'distance' },
    { name: 'Velocity', year: 2024, type: 'distance' },
  ],
  taylormade: [
    { name: 'TP5', year: 2024, type: 'tour' },
    { name: 'TP5x', year: 2024, type: 'tour' },
    { name: 'TP5 pix', year: 2024, type: 'tour' },
    { name: 'Tour Response', year: 2024, type: 'soft' },
    { name: 'Soft Response', year: 2024, type: 'soft' },
  ],
  callaway: [
    { name: 'Chrome Tour', year: 2024, type: 'tour' },
    { name: 'Chrome Tour X', year: 2024, type: 'tour' },
    { name: 'ERC Soft', year: 2024, type: 'soft' },
    { name: 'Supersoft', year: 2024, type: 'soft' },
  ],
  bridgestone: [
    { name: 'Tour B X', year: 2024, type: 'tour' },
    { name: 'Tour B XS', year: 2024, type: 'tour' },
    { name: 'Tour B RX', year: 2024, type: 'soft' },
    { name: 'Tour B RXS', year: 2024, type: 'soft' },
    { name: 'e12 Contact', year: 2024, type: 'distance' },
  ],
  srixon: [
    { name: 'Z-Star', year: 2024, type: 'tour' },
    { name: 'Z-Star XV', year: 2024, type: 'tour' },
    { name: 'Z-Star Diamond', year: 2024, type: 'tour' },
    { name: 'Q-Star Tour', year: 2024, type: 'soft' },
    { name: 'Soft Feel', year: 2024, type: 'soft' },
  ],
}

export function getBrandById(id: string): GolfBrand | undefined {
  return GOLF_BRANDS.find(b => b.id === id)
}

export function getBrandsByCategory(category: GolfBrand['categories'][number]): GolfBrand[] {
  return GOLF_BRANDS.filter(b => b.categories.includes(category))
}
