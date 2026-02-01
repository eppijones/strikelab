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
    <path d="M27.5 13.6c-1.3.4-3.8 1.1-5.5 1.5-5.3 1.5-13.5 5.7-17.2 8.9-2.7 2.3-4.5 4.4-4.1 4.8.2.2 1.7 0 3.3-.3 4.7-1.1 14.7-2.3 25.3-2.9 10.8-.6 27.3.1 35.7 1.4 2.4.4 5.7.7 7.3.7 3.3 0 3.8-.5 2.9-3.5-.4-1.5-1.2-2.3-3.2-3.7-1.4-1-2.8-1.7-3.1-1.7s-1.8-.5-3.3-1.2c-2.7-1.2-4.7-1.9-12.3-3.8-4.8-1.2-21.7-1.3-25.8-.2z" />
    <text x="0" y="42" font-family="'Oswald', 'Impact', sans-serif" font-weight="700" font-size="28" letter-spacing="0">TaylorMade</text>
  </svg>`,

  // Callaway - Premium italic script styling
  callaway: `<svg viewBox="0 0 180 50" fill="currentColor">
    <path d="M12.5 36.5c-2.8 0-4.5-2.2-4.5-5.5s2.2-5.5 5.5-5.5 5.5 2.5 5.5 5.5c0 2.2-1.5 4-3.5 5-2.5 1.2-5.5 1.2-8.5.5-2-1.5-2-3.5-1-4.5.5-1 2.5-1 3.5-.5 1 .5 1.5 1.5 1.5 2 0 1-1.5 2-1.5 3z" transform="translate(140, 0) scale(0.5)"/>
    <text x="0" y="36" font-family="'Libre Baskerville', 'Palatino', Georgia, serif" font-weight="700" font-size="32" font-style="italic" letter-spacing="0">Callaway</text>
  </svg>`,

  // PING - Bold geometric sans (iconic 2025 styling)
  ping: `<svg viewBox="0 0 120 50" fill="currentColor">
    <path d="M30 14.4c1.5 0 2.8 1.2 2.8 2.8v10c0 .5-.2 1-.5 1.3-.3.3-.8.5-1.3.5h-2v11.1c0 .8-.6 1.4-1.4 1.4-.8 0-1.4-.6-1.4-1.4v-11.1h-2c-1 0-1.8-.8-1.8-1.8v-10c0-1.5 1.2-2.8 2.8-2.8h4.8zm-14.4 0c1.5 0 2.8 1.2 2.8 2.8v14.4c0 .8-.6 1.4-1.4 1.4-.8 0-1.4-.6-1.4-1.4v-14.4c0-.8-.6-1.4-1.4-1.4-1 0-1.8.8-1.8 1.8v14.4c0 .8-.6 1.4-1.4 1.4-.8 0-1.4-.6-1.4-1.4v-14.4c0-1.5 1.2-2.8 2.8-2.8h4.4zm28.8 8.6c2.7 0 4.9 2.2 4.9 4.9v13.3c0 .8-.6 1.4-1.4 1.4-.8 0-1.4-.6-1.4-1.4v-13.3c0-1.1-.9-2-2-2s-2 .9-2 2v13.3c0 .8-.6 1.4-1.4 1.4s-1.4-.6-1.4-1.4v-13.3c0-2.7 2.2-4.9 4.9-4.9zm-38.4 0c2.7 0 4.9 2.2 4.9 4.9v13.3c0 .8-.6 1.4-1.4 1.4s-1.4-.6-1.4-1.4v-13.3c0-1.1-.9-2-2-2s-2 .9-2 2v13.3c0 .8-.6 1.4-1.4 1.4s-1.4-.6-1.4-1.4v-13.3c0-2.7 2.2-4.9 4.9-4.9zm48 0c2.7 0 4.9 2.2 4.9 4.9v8.9c0 1.5-1.2 2.8-2.8 2.8h-6.3v1.6c0 .8-.6 1.4-1.4 1.4-.8 0-1.4-.6-1.4-1.4v-13.3c0-2.7 2.2-4.9 4.9-4.9h2.1zm-2.1 2.8h-2.1c-1.1 0-2 .9-2 2v5.3h4.1c1.1 0 2-.9 2-2v-3.3c0-1.1-.9-2-2-2z" transform="scale(1.5) translate(10,5)"/>
  </svg>`,

  // Cobra - Dynamic angular styling with crown
  cobra: `<svg viewBox="0 0 140 50" fill="currentColor">
    <path d="M52.3 20.4a2 2 0 0 0 2-2v-10.8c.04-1.1-.8-2-2-2.1h-24c-1.1.03-2 .9-2 2.1v10.8c-.02 1.2.9 2.1 2 2h24zm56.8-9.1v-2c.04-.2-.1-.3-.3-.3h-17.1c-.15-.03-.28.1-.29.3v11.2l-3.8-.1v-12.9c0-1.1.9-2 2-2.1h21.4c1.1.03 2 .9 2 2.1v3.6h-3.9zM24.2 16.9H3.9c-.12 0-.25-.13-.29-.29V9.2c.04-.19.17-.32.29-.29h20.3V5.4H2c-1.1-2-2.02-1.1-2 0v10.8c0 1.2.9 2.1 2 2h22.2V14.8zM138 5.4c1.1.03 2 .9 2 2.1v10.8c-.04 1.2-1 2.1-2 2h-21.4c-1.1.04-2-.9-2-2.1v-5.8c.01-1.1.9-2 2-2h20v-1.5h-22.1V5.4h23.5z" />
    <path d="M136.5 13.9H118.2c-.16-.02-.29.11-.29.29v2.4c0 .16.13.29.29.29h18.3v-2.98zM50.4 16.9c.15 0 .28-.13.29-.29V9.2c-.01-.19-.14-.32-.29-.29H30.3c-.13-.03-.26.1-.29.29v7.4c.03.16.16.29.29.29h20.1z" fill="#fff" opacity="0.2"/>
    <path d="M83 20.4c1.1.04 2-.9 2-2v-10.8a2.1 2.1 0 0 0-2-2.1h-22.6V0h-3.9v20.4h26.5z" />
    <path d="M60.2 16.9H80.8c.21 0 .34-.13.29-.29V9.2c.04-.19-.09-.32-.29-.29H60.2v8z" fill="#fff" opacity="0.2"/>
  </svg>`,

  // Cleveland - Clean modern wordmark
  cleveland: `<svg viewBox="0 0 180 50" fill="currentColor">
    <path d="M21 21c2 1 3.4-1 3.9-2.7.4-1.5 2.2-9.4-2-11.4-4.4-2.1-11.9 2.2-18.8 11.6-6.9 9.3-5 17 0 19 5.1 2.3 12.6-.2 17-7.6 1.4-1.7-.9-5.5-3.5-3.3-2.8 2.1-4.9 4.6-6.2 5.6-1.3 1.2-3.1 1.3-4.5.2-1.6-1.1-2-3.5 3.3-11.8 5.4-8.5 8.7-9.2 9.9-8.5.8.6.4 3.2-.2 4.1-.5 1.1-1.7 3.8 1.2 4.8z" />
    <text x="50" y="35" font-family="'Roboto Condensed', 'Arial Narrow', sans-serif" font-weight="700" font-size="28" letter-spacing="2">CLEVELAND</text>
  </svg>`,

  // Mizuno - Elegant Japanese-inspired light typography (2025)
  mizuno: `<svg viewBox="0 0 160 50" fill="currentColor">
    <path d="M65.7 21.6l7.8-.7 7.7-.7-7.2 10.1-.5-.5-7.8-8.2zm7.8-9.5c-21.8 1.5-30.9-3.8-9.2-16.1L5.1 10.4s19 3.4 30.5 6.6c11.5 3.2 27.8 11.2 32.6 27h15.3c0-27.5 36.1-34.1 47.1-37.1l22.6-5.3 4.4-7.2s-35.5 9.3-57.8 13.8c-9.8 2-18.8 3.4-26.3 3.8zM46.1 43.1c-3.4 0-5.8 1.8-7.6 4.1l-2.2 2.7v-6.8h-7.8c-3.4 0-5.9 1.8-7.7 4.1l-18.5 22.8H13.4l14.5-17.6c2.2-3 3.4-2.5 4.8-2.5h3.7L20.1 70H31l14.5-17.6c2.3-3 3.4-2.5 4.8-2.5h3.7l-16.5 20.1H49.5c2.8 0 4.5-2 4.5-4.4v-22.6H46.1zm103.6 24.3c.2 0 .4-.1.4-.3 0-.2-.2-.3-.5-.3h-.5v.6h.6zm-.1-1.1c.7 0 1.1.2 1.1.8 0 .5-.3.7-.7.7l.7 1.1h-.7l-.5-.8-.2-.3h-.3v1.1h-.6v-2.7h1.2zm0 3.9h-.1c-1.3 0-2.5-.9-2.5-2.5s1.2-2.6 2.5-2.6h.1c1.3.1 2.5 1 2.5 2.6 0 1.5-1.2 2.5-2.5 2.5zm0-4.5c1 0 1.8.8 1.8 2 0 1.1-.8 1.9-1.8 2h-.1c-1 0-1.8-.8-1.8-2 0-1.2.9-2 1.8-2h.1zm-15.5.1h1.7c.9 0 1.5-.7 1.5-2v-7.7c0-1.3-.6-2-1.5-2h-3.3c-.9 0-1.5.6-1.5 2v7.7c0 1.3.6 2 1.5 2h1.6zm0-15.8h6.6c2.1 0 3.9 1.5 3.9 3.6v13c0 2.1-1.8 3.6-3.9 3.6h-13.2c-2.1 0-3.9-1.5-3.9-3.6v-13c0-2.1 1.8-3.6 3.9-3.6h6.6zm-58.4 15.9h9.1v4.2H67.4v-4.2c0-1.3.5-2 1.1-2.6l7.7-9.1H67.1v-4.2h17.4v4.2c0 1.3-.5 2-1.1 2.6l-7.6 9.1zm41.2-15.9H96.7v13.9c0 1.1-.7 2-1.5 2h-2.9c-.9 0-1.5-.7-1.5-2v-13.9h-7.4v16.5c0 2.1 1.8 3.6 3.9 3.6h12.9c2.1 0 3.9-1.5 3.9-3.6V54.1c0-1.2.8-2 1.6-2h2.9c.9 0 1.5.6 1.5 2v13.9h7.4V53.5c0-2.1-1.8-3.6-3.9-3.6zm-56.2 20.1H57v-20.1h7.4v16.5c0 2.1-1.8 3.6-3.9 3.6z" transform="scale(0.8) translate(30,-15)"/>
  </svg>`,

  // Srixon - Bold angular modern branding
  srixon: `<svg viewBox="0 0 150 50" fill="currentColor">
    <path d="M26.9 8.5c-.3.1-.8.2-1 .3-.5 0-.9.1-2.6.9-2.5 1.1-4.9 3.4-5.9 5.7-.8 1.6-.8 1.9-.8 4.2 0 2.5.1 3.1 1.1 4.3.7.9 1.1 1.3 2.3 2.2.9.6 5.4 3.1 5.7 3.1.2 0 1.8 1.1 2.2 1.5 1.1 1.1 1.3 3 .5 4.2-.5.8-1.9 1.8-2.5 1.8-.2 0-.7.1-1 .3-.8.4-3.7.3-4.7 0-.4-.1-.9-.3-1.2-.3s-.6-.1-.8-.3c-.2-.1-.4-.3-.6-.3-.3 0-1.4-.6-2.3-1.1-.3-.2-.7-.4-.8-.5-.1-.1-.5-.3-.9-.6-.4-.3-.6-.4-.8-.3-.2.1-.1 1.2.1 3.4.3 3.2.3 3.2.8 3.4.3.1.8.3 1.1.4.3.1.9.2 1.2.3 1.4.5 2.9.7 6.6.7 3.2 0 4-.1 4.6-.2.4-.1.9-.3 1.3-.3.3 0 .7-.1.9-.3.2-.1.5-.3.7-.3.2 0 .6-.1.8-.3.3-.1.6-.3.8-.4 2.1-.9 5.3-4.2 6.2-6.3.5-1.2.6-1.7.8-2.9.1-.8.2-1.7.1-2.1-.1-.4-.2-1-.2-1.3-.1-.6-.2-.7-.3-.8-.1-.3-.3-.3-.3-.5 0-.6-2.8-3.6-3.3-3.6-.1 0-.3-.1-.4-.2-.1-.1-.3-.3-.4-.4-.1-.1-.5-.3-.8-.5-.3-.2-.7-.4-.8-.5-.2-.1-.5-.2-.8-.4-.3-.1-.9-.4-1.3-.6-.4-.2-.8-.4-.9-.4-1.9-1-2.3-1.3-2.7-2.3-.4-.7-.4-.9.1-1.9.4-.9 1.7-2.1 2.3-2.1.2 0 .5-.1.8-.3.6-.4 3.2-.4 4.4 0 1.6.5 2.3.8 3.1 1.4.7.4.8.5 1 .3.1-.1.3-.8.4-1.4.1-.6.2-1.4.4-1.7.1-.3.2-1 .1-1.5-.1-.9-.1-1-.7-1.1-.3-.1-.9-.2-1.2-.3-1.6-.5-2.4-.6-5.9-.7-2.9-.1-3.9 0-4.3.2zm84.4 8.5c-.4.1-1.2.2-1.7.3-1.2.2-2.5.6-4 1.4-.3.1-.6.3-.7.3-.6 0-5.3 4-5.3 4.5 0 .1-.2.4-.5.8-.3.4-.5.8-.5.9s-.1.4-.3.5-.3.4-.3.6c0 .2-.1.5-.3.7-.1.2-.3.5-.3.8s-.1.7-.3 1c-.4 1-.4 5.1 0 6.3.5 1.6 1.3 2.6 3.3 4.4.4.4 2.5 1.3 3.6 1.7 1.9.6 6.4.5 8.6-.1 1.9-.5 4.2-1.6 5.6-2.7 1.2-.9 3.5-3.2 3.9-3.8.5-.9 1.5-3.1 1.7-3.7.6-1.6.8-4.7.5-6.7-.1-.8-.3-1.2-1-2.7-.3-.6-1.9-2.4-2.3-2.6-.1-.1-.6-.3-1.1-.6s-.9-.4-1.1-.4-.4-.1-.6-.3c-.2-.1-.6-.3-.8-.3s-.9-.1-1.5-.3c-1.1-.3-3.5-.3-4.6-.1zm3.1 4.1c1.1.5 1.2.7 1.7 1.7 1.1 2.2 1.4 4.7.9 6.8-.1.6-.3 1.2-.3 1.4 0 .3-.2.8-.9 2.3-.7 1.5-2.1 2.9-3.7 3.8-1 .5-1.2.6-2.9.6-1.7 0-1.8 0-2.6-.6-.8-.6-1.4-1.4-1.9-2.5-.6-1.4-.6-5.9 0-7.5.3-.8.7-1.8.9-2.1.1-.1.3-.5.3-.7.3-.8 2.4-2.6 3.6-3.2.9-.4 1.4-.6 2.4-.6 1.1 0 1.4.1 2.4.6z" transform="translate(10,5) scale(0.9)"/>
    <text x="0" y="38" font-family="'Teko', 'Impact', sans-serif" font-weight="600" font-size="38" letter-spacing="3" opacity="0.3">SRIXON</text>
  </svg>`,

  // Bridgestone - Premium block lettering (2025 refresh)
  bridgestone: `<svg viewBox="0 0 220 50" fill="currentColor">
    <path d="M138 20.4l-1.6 5.9 7 .1.2-.6c1.4-5.1-2.5-6.1-4-6.1h-5.5c-2.7 0-6 .3-7.1 4.4-1 3.6-1.6 5.2-.2 7 .8 1.1 2.8 1.4 5.6 2 2.1.5 1.7 1.7 1.4 3.1-.3 1-.9 1.6-1.9 1.6-.6 0-1.4-.4-1.1-1.4l.6-2.2-7.1-.1-.6 2.1c-.9 2.8.9 5.6 4.7 5.6h3.9c5.1 0 7.6-1.3 9-6.2.5-1.7 1.1-3.8.3-5.2-1.1-1.9-5.7-2.6-7.2-3-1-.3-.7-1.3-.5-2.3.4-1.6.8-2 1.4-2.5l2.3-2.3.5.1zM28.7 27.7c2.2.8 5.1 2.6 3.7 7.3-1.5 5.1-4.7 6.7-10 6.7H3.2L21.1 24.8l-3.2 11.9H19.6c1.3 0 2.1-.8 2.4-1.9l5.8-20.6c4.2 0 8.8.5 7.9 6.5-.8 5-4.1 6.2-7 6.8zm-1.2-13.5L8.1 32.3l5.1-18.1h14.3zM53.5 41.7l6.1-22.1h7.2L60.7 41.7H53.5zM148.6 26.2l2.8-2.2h-6.5l1.2-4.4h14.7l-1.3 4.4h-3.9l-4.9 17.7h-7.2l3.6-13c.3-1 .6-1.9 1.4-2.5zM192 20.4l-5.9 21.3h7.2l4.6-16.8c.9-3.6-.8-5.3-3.4-5.3h-4.3l-6.1 22.1h7.2l4.5-16.6c.5-1.7.9-2.1 1.4-2.6l2.2-2.3.5.2zM115.6 29.9l1.5-.9c.3-.2 1.3-.8 2.7-.8h3.3l-1.2 4.3h-7.3l-.9 3.2c-.2.9.4 1.5 1.1 1.5h5.9l-1.2 4.4h-8.3c-3.8 0-5.4-3.3-4.7-5.6l3.3-12.1c1-4.1 4.5-4.4 7.2-4.4h8.7l-1.2 4.4h-5.9c-1.1 0-1.7.8-1.8 1.2l-1.3 4.4.4.4zM100.8 20.4l-1.7 6.2 7.2-.1.3-1.2c1.4-5.1-2.8-5.9-4.3-5.9H96.9c-2.7 0-6.1.3-7.2 4.4l-3.3 12.1c-.9 2.8.9 5.6 4.7 5.6h11l3.3-12-7.2-.1-2.1 7.6h-1.5c-.6 0-1.3-.6-1-1.6l2.9-10.6c.2-.7.6-1.9 1.4-2.5l2.3-2.3c.1-.1.6-.2.5.1zM49 20.4l-5.9 21.3h7.2s1.1-4.1 1.9-6.9c.8-2.5-2-3.9-2.4-3.9-.3 0-.3-.5 0-.5 2-.1 3.9-.4 5.2-5 1.5-5.4-3.3-5.8-5-5.8H39.1L32.9 41.7h7.2l4.6-16.6c.4-1.3.9-2.1 1.4-2.5l2.3-2.3.5.1zM207.2 29.9l1.5-.9c.3-.2 1.4-.8 2.7-.8h3.3l-1.2 4.3h-7.3l-.9 3.2c-.2.9.4 1.5 1.1 1.5h5.9l-1.2 4.4h-8.3c-3.8 0-5.4-3.3-4.7-5.6l3.3-12.1c1-4.1 4.5-4.4 7.2-4.4h8.7l-1.2 4.4h-5.9c-1.1 0-1.7.8-1.8 1.2l-1.3 4.4.4.4zM81 19.6h-10.4l-6.2 22.1h10.2c5.1 0 7.6-1.7 8.5-5l3.1-11c1.4-5.1-3.5-6.1-5.1-6.1zm-.6.8l-4.2 14.8c-.8 2.4-2.6 2.1-3.5 2.1l3.3-12.2c.4-1.2.9-2.1 1.4-2.5l2.3-2.3.7.1zM172.5 19.6H168c-2.7 0-6.1.3-7.2 4.4l-3.3 12.1c-.9 2.8.9 5.6 4.7 5.6h3.8c5.1 0 7.6-1.7 8.5-5l3.1-11c1.4-5.1-3.5-6.1-5.1-6.1zm-.6.8L167.6 36c-.3 1-1.1 1.5-1.7 1.5s-1.4-.5-1-1.4l3-11.1c.5-1.6.9-2.1 1.4-2.6l2.2-2.3.6.1z" transform="scale(0.8) translate(15, -10)" />
    <text x="0" y="35" font-family="'Barlow Condensed', 'Arial Black', sans-serif" font-weight="700" font-size="28" letter-spacing="2" opacity="0.3">BRIDGESTONE</text>
  </svg>`,

  // Scotty Cameron - Elegant signature script
  scottycameron: `<svg viewBox="0 0 200 50" fill="currentColor">
    <path d="M40 35c2-1 4-3 5-5s1-5 0-7c-1-2-3-3-5-3s-4 1-6 3l-1-2c2-2 5-3 8-3s5 1 7 4c1 2 2 5 1 8s-3 6-6 8c-2 2-5 3-8 2-2-1-3-3-3-5s1-4 3-5l2 2c-1 1-1 2-1 3s1 2 2 2c2 0 4-1 6-2zm12-8c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5zm8 0c0-2-1-3-3-3s-3 1-3 3 1 3 3 3 3-1 3-3zm8 3v-6h2v6c0 1 1 2 2 2s2-1 2-2v-6h2v6c0 2-2 4-4 4s-4-2-4-4zm12-4h2v-2h-2v2zm0 6h2v-4h-2v4zm8-4l-2 4h-2l2-4-2-2h2l1 1 1-1h2l-2 2zm10-2h-2l-1 2h3l-1 2h-3l-1 2h-2l3-6zm8 0h-2l-1 2h3l-1 2h-3l-1 2h-2l3-6zm10 0h2l1 1 1-1h2v6h-2v-3l-1 1-1-1v3h-2v-6zm10 0h4v1h-3v1h3v1h-3v1h4v1h-4v-5zm8 0h3c1 0 2 1 2 2s-1 2-2 2h-1l-1 2h-2l1-6zm2 3c1 0 1-1 1-1s-1-1-1-1h-1l-1 2h2zm6-1c0-2 1-3 3-3s3 1 3 3-1 3-3 3-3-1-3-3zm4 0c0-1 1-2 1-2s1 1 1 2-1 2-1 2-1-1-1-2zm8-2h2l2 4 2-4h2v6h-2v-4l-1 3h-2l-1-3v4h-2v-6z" transform="translate(10, -5)"/>
    <text x="0" y="32" font-family="'Cormorant Garamond', 'Palatino', serif" font-weight="600" font-size="24" font-style="italic" letter-spacing="1">Scotty Cameron</text>
  </svg>`,

  // Vokey - Craftsman signature styling
  vokey: `<svg viewBox="0 0 120 50" fill="currentColor">
    <path d="M20 15l5 15 5-15h4l-7 20h-4l-7-20h4zm18 10c0-6 4-10 10-10s10 4 10 10-4 10-10 10-10-4-10-10zm16 0c0-4-3-7-6-7s-6 3-6 7 3 7 6 7 6-3 6-7zm8-10h4v11l6-6h5l-7 6 8 9h-5l-5-6-2 2v4h-4v-20zm18 0h12v3h-8v5h7v3h-7v6h9v3h-13v-20zm16 0l5 12 5-12h4l-7 15v5h-4v-5l-7-15h4z" transform="translate(10,0)"/>
    <text x="0" y="36" font-family="'Playfair Display', 'Georgia', serif" font-weight="700" font-size="30" font-style="italic" opacity="0.3">Vokey</text>
  </svg>`,

  // PXG - Bold luxury military-inspired (2025)
  pxg: `<svg viewBox="0 0 100 50" fill="currentColor">
    <path d="M10 15h12c4 0 7 3 7 7s-3 7-7 7h-5v6h-7v-20zm7 10h5c2 0 3-1 3-3s-1-3-3-3h-5v6zm22-10l5 7 5-7h8l-8 10 9 10h-8l-6-8-6 8h-8l9-10-8-10h8zm25 10v2h9v7c-2 1-4 1-6 1-5 0-8-3-8-8s4-9 9-9c3 0 5 1 7 2l-2 5c-1-1-3-1-4-1-2 0-3 1-3 3s1 3 3 3c1 0 2 0 2-1v-2h-7v-2h9z" transform="translate(10,0)"/>
    <text x="0" y="40" font-family="'Anton', 'Impact', sans-serif" font-weight="400" font-size="42" letter-spacing="2" opacity="0.3">PXG</text>
  </svg>`,

  // XXIO - Premium Japanese styling with modern flair
  xxio: `<svg viewBox="0 0 120 50" fill="currentColor">
    <path d="M20 15l6 9-6 9h5l3-5 3 5h5l-6-9 6-9h-5l-3 5-3-5h-5zm17 0l6 9-6 9h5l3-5 3 5h5l-6-9 6-9h-5l-3 5-3-5h-5zm19 0h5v18h-5v-18zm10 0c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm0 14c-3 0-5-2-5-5s2-5 5-5 5 2 5 5-2 5-5 5z" transform="translate(15,0)"/>
    <text x="0" y="38" font-family="'Orbitron', 'Century Gothic', sans-serif" font-weight="700" font-size="36" letter-spacing="4" opacity="0.3">XXIO</text>
  </svg>`,

  // Honma - Classic Japanese luxury wordmark
  honma: `<svg viewBox="0 0 140 50" fill="currentColor">
    <path d="M260.4 22.7c-3.5 2.1-6.7 7.2-5.7 8.8 1.7 2.8 18.5 4.5 19.5 2 .8-2.1-2-9-4.5-10.9-3-2.3-5.6-2.2-9.3.1zm-8.5 17.7c-1.8 5.2-4.2 8.8-8.9 13.4-6 5.9-8.2 7.3-16.6 9.9-3.8 1.3-7.8 2.7-8.7 3.2-1 .5-2.3.9-2.9.9-1.4 0-6.4 2.1-15.8 6.8-7.7 3.8-20.4 14.9-23.2 20.4-6.1 11.7-8 16.6-8.8 23.8-.4 3-1 6.1-1.4 6.7-1.2 1.9-4.5 1.5-5.2-.6-.8-2.5-6.4-7.5-11.1-9.7-4.8-2.3-19.5-2.6-24-.5-1.6.7-4.5 2.1-6.4 3-4.2 2-17.6 11.9-20.8 15.3-4.5 5 .4 8.4 6.6 4.7 2-1.3 3.9-2.7 4-3.1.5-1.1 6.2-1 6.2 0 0 .5-2 2.3-4.5 4.1-11.7 8.4-7.7 14.6 4.1 6.5 3.1-2.2 5.9-3.4 6.8-3.1 2.6 1 1.8 2.5-2.6 5.4-8.7 5.7-10.6 8.5-7.4 11.2 1.5 1.2 2.7.7 10.4-4.2 8.5-5.5 10.6-1.4 2.5 4.7-4.2 3-5.3 4.5-5.3 6.7 0 1.5.6 2.9 1.3 3.2 1.4.5 7.8-2.6 12.3-6 2.3-1.7 3.3-2 4.2-1.1 1.9 1.9 1.4 3.4-1.9 5.9-5.6 4.3-7 6-6.7 8.2.5 3.8 5.8 3.4 13.1-.9 3.4-2 7-4.4 8-5.3 1.7-1.4 2.2-1.4 6 .8 2.3 1.3 5.8 3.6 7.7 5.1 8.1 6.1 30.7 15 38.4 15 1.7 0 4.7.4 6.6 1 1.9.5 5.7 1.1 8.4 1.4 5 .6 7.5 2.5 7.6 5.9 0 1.8 1.7 6.2 4.3 11.6 1.6 3.1 4 4.6 6.2 3.7 1.7-.6 1.8-4.4.3-15.1-.2-1.4.3-2.1 1.7-2.3 2.1-.3 4.5 3.7 6 9.9 1 4 4.9 8.3 6.8 7.6 2.3-.8 2.3-8.2.1-13.7-1.2-2.8-1.3-4.5-.6-5.2 1.3-1.3 5.2.7 5.2 2.6 0 .8 1 3.9 2.1 7 1.8 4.6 2.6 5.6 4.5 5.6 2.1 0 2.4-.5 2.4-3.5 0-2-.7-5.2-1.5-7.2-2.1-4.9-1.9-7.3.4-7.3 2.4 0 3.7 1.7 4.6 5.8.8 3.8 3.2 8.9 4.6 9.8.5.3 1.6.1 2.4-.6 1.4-1.2 1-7.5-.6-9.6-2-2.5-1-10.2 1.1-8.9 1.4.8 3.9 6.4 4.6 10 .8 4.4 3.9 7.3 6.2 5.8 1.9-1.2 2-5.5.2-11.8-.6-2.2-1.8-6.5-2.7-9.5-5.4-19.5-15.7-29-31.6-29-4.9 0-8 .5-9.3 1.5-2.8 2.1-5.4 1.9-5.4-.5 0-1.1 1.7-4.8 3.8-8.2 3.4-5.7 5.7-10.4 9.7-19.3 3.4-7.5 4.5-10.4 4.5-11.3 0-.5.7-2.3 1.5-3.8.8-1.6 1.5-3.6 1.5-4.5s.7-3 1.5-4.5c.8-1.6 1.5-4 1.5-5.5 0-1.4.4-2.9.9-3.5.8-.9 1.5-3.2 4.1-14.9.7-2.8 1.8-7.2 2.6-9.9.8-2.6 1.4-5.7 1.4-6.7s.7-4.3 1.5-7.4c1.7-6.9 2.2-15.2.8-16.6-.5-.5-4.9-1.2-9.6-1.6l-8.6-.6z" transform="scale(0.15) translate(-100, 100)"/>
    <text x="0" y="36" font-family="'Cinzel', 'Trajan', serif" font-weight="700" font-size="30" letter-spacing="3" opacity="0.3">HONMA</text>
  </svg>`,

  // Wilson - Iconic sporting heritage (2025)
  wilson: `<svg viewBox="0 0 150 50" fill="currentColor">
    <path d="M66.4 44.5H27V62.3h11.6v53.9s0 33.7 35.7 33.7c0 0 15.1.3 24-12.1 0 0 7.6 12.1 21.9 12.1 0 0 13.5 1.3 22.7-7 0 0 18.9-12.7 18.6-51.7 0 0-.5-29.4-7.6-46.6h-32.5v17.8h9.8s5.1 14.6 5.1 33.2c0 0 .6 11.2-5.1 22.9 0 0-3.5 8.4-11.1 8.4 0 0-6.8-.3-6.5-8.4V44.5h-39.4v17.8h11.6v54.7s0 9.7-9.7 9.7c0 0-9.7 0-9.7-9.7V44.5h.1z" transform="scale(0.3) translate(50, -20)"/>
    <text x="0" y="38" font-family="'Archivo Black', 'Impact', sans-serif" font-weight="400" font-size="32" letter-spacing="2" opacity="0.3">WILSON</text>
  </svg>`,

  // Tour Edge - Performance-focused wordmark
  tour_edge: `<svg viewBox="0 0 180 50" fill="currentColor">
    <path d="M20 15h20v4h-8v16h-4v-16h-8zm24 0h12c3 0 5 2 5 5s-2 5-5 5h-8v10h-4v-20zm4 4v2h7c1 0 2-1 2-1s-1-1-2-1h-7zm22-4h4v13c0 2 1 3 3 3s3-1 3-3v-13h4v13c0 4-3 7-7 7s-7-3-7-7v-13zm26 0h10c3 0 5 1 6 3 0 1 0 2-1 3-1 1-3 2-3 2l5 8h-5l-4-7h-4v7h-4v-16zm4 4v2h6c1 0 1 0 1-1s0-1-1-1h-6zm25 0h12v4h-8v4h6v4h-6v4h8v4h-12v-20zm18 0h9c4 0 7 3 7 10s-3 10-7 10h-9v-20zm4 4v12h4c2 0 4-1 4-6s-2-6-4-6h-4zm20 10h8v8h-4v-1c-1 1-2 2-4 2-3 0-5-2-5-6s2-6 5-6c1 0 2 0 3 1v-2h-3v4zm3 2c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2zm12-8h12v4h-8v4h6v4h-6v4h8v4h-12v-20z" transform="translate(10,0)"/>
    <text x="0" y="35" font-family="'Rajdhani', 'Arial Black', sans-serif" font-weight="700" font-size="28" letter-spacing="1" opacity="0.3">TOUR EDGE</text>
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
