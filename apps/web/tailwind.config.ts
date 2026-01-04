import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy colors for backward compatibility (dark theme)
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
        
        // Theme-aware colors using CSS variables
        theme: {
          bg: {
            primary: 'var(--color-bg-primary)',
            secondary: 'var(--color-bg-secondary)',
            surface: 'var(--color-bg-surface)',
            elevated: 'var(--color-bg-elevated)',
          },
          text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            muted: 'var(--color-text-muted)',
            inverted: 'var(--color-text-inverted)',
          },
          border: {
            DEFAULT: 'var(--color-border)',
            focus: 'var(--color-border-focus)',
          },
          accent: {
            DEFAULT: 'var(--color-accent)',
            hover: 'var(--color-accent-hover)',
            glow: 'var(--color-accent-glow)',
            dim: 'var(--color-accent-dim)',
            subtle: 'var(--color-accent-subtle)',
          },
          success: {
            DEFAULT: 'var(--color-success)',
            dim: 'var(--color-success-dim)',
          },
          warning: {
            DEFAULT: 'var(--color-warning)',
            dim: 'var(--color-warning-dim)',
          },
          error: {
            DEFAULT: 'var(--color-error)',
            dim: 'var(--color-error-dim)',
          },
        },
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
        'card': 'var(--shadow-card)',
        'glow': 'var(--shadow-glow)',
        'glow-sm': 'var(--shadow-glow-sm)',
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
