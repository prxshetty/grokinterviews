/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '31': 'repeat(31, minmax(0, 1fr))',
      },
      colors: {
        orange: {
          500: '#F84C1E',
        },
        background: 'var(--background-color)',
        card: '#f5f9fc',
        border: 'hsl(var(--border))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        janelotus: ['var(--font-janelotus)', 'var(--font-playfair)', 'Georgia', 'serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'scroll-up': 'scroll-up 30s linear infinite',
        'scroll-smooth': 'scroll-smooth 30s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'fadeOut': 'fadeOut 0.3s ease-out forwards',
        'slide-right': 'slideRight 0.3s ease-out forwards',
        'slide-left': 'slideLeft 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 60s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'shrink': 'shrink 5s linear forwards',
      },
      keyframes: {
        'scroll-up': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(calc(-1 * var(--total-height) / 2))' },
        },
        'scroll-smooth': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(calc(-50%))' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shrink: {
          from: { width: '100%' },
          to: { width: '0%' },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            maxWidth: 'none',
            a: {
              color: theme('colors.gray.700'),
              '&:hover': { color: theme('colors.gray.900') },
            },
            'h1, h2, h3, h4': {
              color: theme('colors.gray.900'),
              fontWeight: '600',
            },
            code: {
              backgroundColor: '#f0f0f0',
              borderRadius: '0.25rem',
              padding: '0.2rem 0.4rem',
              fontSize: '0.875em',
              color: '#000000',
              fontWeight: '500',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            pre: {
              backgroundColor: '#f0f0f0',
              borderRadius: '0.375rem',
              padding: '1rem',
              border: '1px solid #e0e0e0',
              overflow: 'auto',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              borderRadius: '0',
              fontWeight: 'normal',
              color: '#000000',
            },
          },
        },
        invert: {
          css: {
            color: theme('colors.gray.200'),
            a: {
              color: theme('colors.gray.300'),
              '&:hover': { color: theme('colors.white') },
            },
            'h1, h2, h3, h4': {
              color: theme('colors.white'),
            },
            code: {
              color: '#f0f0f0',
              backgroundColor: '#1a1a1a',
              fontWeight: '500',
            },
            pre: {
              backgroundColor: '#1a1a1a',
              borderColor: '#333333',
              color: '#f0f0f0',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: '#f0f0f0',
              fontWeight: 'normal',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}