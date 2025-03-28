/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
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
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            a: {
              color: theme('colors.blue.600'),
              '&:hover': {
                color: theme('colors.blue.800'),
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
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 