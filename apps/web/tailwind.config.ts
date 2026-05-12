import type { Config } from 'tailwindcss'

/**
 * StrikeLab — performance instrument design system.
 * Tokens come from packages/design-tokens (CSS vars on :root + [data-theme]).
 * This config wires Tailwind utilities to those vars so Tailwind classes
 * automatically theme via dark/light without extra plugins.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        surface: 'var(--surface)',
        'surface-solid': 'var(--surface-solid)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
          2: 'var(--accent-2)',
          /** Links, tags, and hairlines on page bg — dark green in light theme */
          fg: 'var(--accent-fg)',
          'fg-hover': 'var(--accent-fg-hover)',
        },
        warn: 'var(--warn)',
        bad: 'var(--bad)',
        good: 'var(--accent)',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', '"Times New Roman"', 'serif'],
      },
      fontSize: {
        // Performance-instrument scale from primitives.jsx
        micro: ['10px', { lineHeight: '1', letterSpacing: '0.18em' }],
        'micro-sm': ['9px', { lineHeight: '1', letterSpacing: '0.22em' }],
        body: ['15px', { lineHeight: '1.55', letterSpacing: '0' }],
        head: ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-m': ['40px', { lineHeight: '1.0', letterSpacing: '-0.04em' }],
        'display-l': ['64px', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-xl': ['96px', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
      },
      letterSpacing: {
        micro: '0.18em',
        'micro-tight': '0.16em',
        'micro-wide': '0.22em',
        display: '-0.04em',
      },
      borderRadius: {
        none: '0',
        panel: '2px',
        pill: '9999px',
      },
      borderWidth: {
        hairline: '1px',
      },
      transitionTimingFunction: {
        launch: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
        settle: 'cubic-bezier(0.16, 1, 0.3, 1)',
        trace: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        micro: '120ms',
        launch: '240ms',
        settle: '480ms',
        trace: '900ms',
      },
      boxShadow: {
        glow: '0 0 0 1px var(--line-strong), 0 30px 80px -30px oklch(0.88 0.18 125 / 0.15)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        tracer: {
          '0%': { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 240ms cubic-bezier(0.2, 0.9, 0.3, 1)',
        'fade-up': 'fade-up 480ms cubic-bezier(0.16, 1, 0.3, 1)',
        tracer: 'tracer 900ms cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
