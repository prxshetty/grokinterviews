const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      gridTemplateColumns: {
        '31': 'repeat(31, minmax(0, 1fr))',
      },
      colors: {
        // Design system colors using CSS custom properties
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          300: 'hsl(var(--primary-300))',
          400: 'hsl(var(--primary-400))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
          800: 'hsl(var(--primary-800))',
          900: 'hsl(var(--primary-900))',
          950: 'hsl(var(--primary-950))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Chart colors for data visualization
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        editorial: ['var(--font-pp-editorial)', 'Playfair Display', 'Georgia', 'serif'],
      },
      fontWeight: {
        ultralight: '200',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
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
        "background-gradient":
          "background-gradient var(--background-gradient-speed, 15s) cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite",
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
        'aurora': 'aurora 60s linear infinite',
      },
      keyframes: {
        "background-gradient": {
          "0%, 100%": {
            transform: "translate(0, 0)",
            animationDelay: "var(--background-gradient-delay, 0s)",
          },
          "20%": {
            transform:
              "translate(calc(100% * var(--tx-1, 1)), calc(100% * var(--ty-1, 1)))",
          },
          "40%": {
            transform:
              "translate(calc(100% * var(--tx-2, -1)), calc(100% * var(--ty-2, 1)))",
          },
          "60%": {
            transform:
              "translate(calc(100% * var(--tx-3, 1)), calc(100% * var(--ty-3, -1)))",
          },
          "80%": {
            transform:
              "translate(calc(100% * var(--tx-4, -1)), calc(100% * var(--ty-4, -1)))",
          },
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
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
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
    addVariablesForColors,
  ],
}

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}