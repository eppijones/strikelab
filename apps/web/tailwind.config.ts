import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0F',
        graphite: '#141419',
        surface: '#1A1A22',
        'ice-white': '#F4F4F6',
        muted: '#8A8A99',
        cyan: {
          DEFAULT: '#23D5FF',
          glow: 'rgba(35, 213, 255, 0.3)',
          dim: 'rgba(35, 213, 255, 0.15)',
        },
        border: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter Tight', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'button': '12px',
      },
      boxShadow: {
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 24px rgba(35, 213, 255, 0.3)',
        'glow-sm': '0 0 12px rgba(35, 213, 255, 0.2)',
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
