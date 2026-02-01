import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Nordic Caddie Palette
        nordic: {
          paper: '#F2F0EB',   // Base Layer
          forest: '#1E3A2B',  // Text/Branding
          sage: '#8EB897',    // Positive Trends
          champagne: '#D4C5A8', // Premium Accents
        },
        
        // New Theme Names
        scandinavian: {
          paper: '#F2F0EB',
          surface: '#FFFFFF',
        },
        midnight: {
          forest: '#1E3A2B',
          surface: '#242322',
        },

        
        // Scandinavian Stone Palette (Legacy support / refined)
        stone: {
          50: '#F2F0EB', // Replaced with nordic.paper
          100: '#EBE9E3',
          200: '#E0DDD5',
          300: '#D6D2C9',
          400: '#A8A398',
          500: '#78736A',
          600: '#57544E',
          700: '#44423C',
          800: '#292825',
          900: '#1C1B19',
        },
        
        // Sage Green - Golf Native (More vibrant!)
        sage: {
          50: '#F2F8F4',
          100: '#E0EDE5',
          200: '#C2DCCB',
          300: '#95C5A6',
          400: '#8EB897', // Nordic Sage
          500: '#4C8C61',
          600: '#3D7A50',
          700: '#2D6B42',
          800: '#265538',
          900: '#1F462E',
        },
        
        // Champagne Highlight
        champagne: {
          DEFAULT: '#D4C5A8', // Nordic Champagne
          light: '#E5D6BD',
          dark: '#B8A88B',
        },
        
        // Forest Green
        forest: {
          DEFAULT: '#1E3A2B',
          light: '#2D543F',
          dark: '#0F1D15',
        },
        
        // Theme-aware colors using CSS variables
        theme: {
          bg: {
            primary: 'var(--color-bg-primary)',
            secondary: 'var(--color-bg-secondary)',
            surface: 'var(--color-bg-surface)',
            elevated: 'var(--color-bg-elevated)',
            card: 'var(--color-bg-card)',
            hover: 'var(--color-bg-hover)',
            active: 'var(--color-bg-active)',
          },
          text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            muted: 'var(--color-text-muted)',
            inverted: 'var(--color-text-inverted)',
          },
          border: {
            DEFAULT: 'var(--color-border)',
            subtle: 'var(--color-border-subtle)',
            strong: 'var(--color-border-strong)',
            focus: 'var(--color-border-focus)',
            glass: 'var(--color-border-glass)',
          },
          glass: {
            DEFAULT: 'var(--color-glass)',
            strong: 'var(--color-glass-strong)',
            subtle: 'var(--color-glass-subtle)',
          },
          accent: {
            DEFAULT: 'var(--color-accent)',
            hover: 'var(--color-accent-hover)',
            secondary: 'var(--color-accent-secondary)',
            strong: 'var(--color-accent-strong)',
            dim: 'var(--color-accent-dim)',
            subtle: 'var(--color-accent-subtle)',
            glow: 'var(--color-accent-glow)',
            vivid: 'var(--color-accent-vivid)',
          },
          highlight: {
            DEFAULT: 'var(--color-highlight)',
            dim: 'var(--color-highlight-dim)',
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
          info: {
            DEFAULT: 'var(--color-info)',
            dim: 'var(--color-info-dim)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        // Refined type scale
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '1.35', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'card': '20px',
        'xl': '24px',
        '2xl': '28px',
        'pill': '9999px',
      },
      spacing: {
        // Generous Scandinavian spacing
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-strong': '30px',
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'card': 'var(--shadow-card)',
        'elevated': 'var(--shadow-elevated)',
        'glass': 'var(--shadow-glass)',
        'focus': 'var(--shadow-focus)',
        'glow': 'var(--shadow-glow)',
        // Static shadows for when CSS vars aren't available
        'soft-sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'soft-md': '0 4px 8px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 8px 24px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)',
        'soft-xl': '0 16px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)',
        'glass-static': '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'glow-sage': '0 0 30px rgba(76, 140, 97, 0.25)',
        'glow-sage-strong': '0 0 50px rgba(76, 140, 97, 0.35)',
      },
      backgroundImage: {
        'gradient-sage': 'linear-gradient(135deg, #4C8C61 0%, #6BA37D 100%)',
        'gradient-sage-vivid': 'linear-gradient(135deg, #3D9E5C 0%, #4C8C61 100%)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-glass': 'var(--gradient-glass)',
        'gradient-surface': 'var(--gradient-surface)',
        'gradient-aurora': 'var(--gradient-aurora)',
        'gradient-glow': 'var(--gradient-glow)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'aurora': 'aurora 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'aurora': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1) translateY(0)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05) translateY(-10px)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(76, 140, 97, 0.25)' },
          '50%': { boxShadow: '0 0 40px rgba(76, 140, 97, 0.4)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
        'slower': '600ms',
      },
    },
  },
  plugins: [],
} satisfies Config
