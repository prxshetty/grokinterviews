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
      colors: {
        orange: {
          500: '#F84C1E',
        },
        background: '#dfe3ec',
        card: '#f5f9fc',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        janelotus: ['var(--font-janelotus)', 'var(--font-playfair)', 'Georgia', 'serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'spin-slow': 'spin 60s linear infinite',
        'scroll-up': 'scroll-up 30s linear infinite',
        'scroll-smooth': 'scroll-smooth 30s linear infinite',
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'fadeOut': 'fadeOut 0.3s ease-out forwards',
        'slideRight': 'slideRight 0.3s ease-out forwards',
        'slideLeft': 'slideLeft 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
         spin: {
           '0%': { transform: 'rotate(0deg)' },
           '100%': { transform: 'rotate(360deg)' },
         },
         pulse: {
           '0%, 100%': { opacity: 1 },
           '50%': { opacity: 0.7 },
         },
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
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            a: {
              color: theme('colors.gray.700'),
              '&:hover': {
                color: theme('colors.gray.900'),
              },
            },
            h1: {
              color: theme('colors.orange.500'),
              fontWeight: '700',
            },
            h2: {
              color: theme('colors.orange.500'),
              fontWeight: '600',
              marginTop: '1.5em',
            },
            h3: {
              color: theme('colors.gray.800'),
              fontWeight: '600',
            },
            code: {
              backgroundColor: theme('colors.gray.100'),
              borderRadius: '0.25rem',
              padding: '0.2rem 0.4rem',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: theme('colors.gray.100'),
              borderRadius: '0.375rem',
              padding: '1rem',
            },
            img: {
              marginTop: '1rem',
              marginBottom: '1rem',
              borderRadius: '0.375rem',
            },
            ul: {
              listStyleType: 'disc',
              marginTop: '1rem',
              marginBottom: '1rem',
              paddingLeft: '1.5rem',
            },
            ol: {
              listStyleType: 'decimal',
              marginTop: '1rem',
              marginBottom: '1rem',
              paddingLeft: '1.5rem',
            },
            blockquote: {
              fontStyle: 'italic',
              borderLeftColor: theme('colors.orange.500'),
              backgroundColor: theme('colors.gray.50'),
              padding: '0.5rem 1rem',
            },
            table: {
              width: '100%',
              textAlign: 'left',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
            th: {
              backgroundColor: theme('colors.gray.50'),
              padding: '0.5rem 1rem',
              borderWidth: '1px',
              borderColor: theme('colors.gray.200'),
            },
            td: {
              padding: '0.5rem 1rem',
              borderWidth: '1px',
              borderColor: theme('colors.gray.200'),
            },
          },
        },
        invert: {
          css: {
            color: theme('colors.gray.200'),
            a: {
              color: theme('colors.gray.300'),
              '&:hover': {
                color: theme('colors.white'),
              },
            },
            h1: {
              color: theme('colors.white'),
            },
            h2: {
              color: theme('colors.white'),
            },
            h3: {
              color: theme('colors.white'),
            },
            h4: {
              color: theme('colors.white'),
            },
            strong: {
              color: theme('colors.white'),
            },
            code: {
              color: theme('colors.white'),
              backgroundColor: theme('colors.gray.800'),
            },
            blockquote: {
              color: theme('colors.gray.300'),
              borderLeftColor: theme('colors.gray.700'),
            },
          },
        },
      }),
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}