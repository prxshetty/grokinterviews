import localFont from 'next/font/local'

// PP Editorial New Ultralight font configuration
export const PPEditorialUltralight = localFont({
  src: [
    {
      path: './PPEditorialNew-Ultralight-BF644b21500d0c0.otf',
      weight: '200',
      style: 'normal',
    },
    {
      path: './PPEditorialNew-UltralightItalic-BF644b214ff1e9b.otf',
      weight: '200',
      style: 'italic',
    },
  ],
  variable: '--font-pp-editorial',
  display: 'swap',
  fallback: ['Playfair Display', 'Georgia', 'serif'],
  preload: true,
})

// CSS-in-JS styles for PP Editorial
export const ppEditorialStyles = {
  fontFamily: 'var(--font-pp-editorial, "Playfair Display", Georgia, serif)',
  fontWeight: 200,
  letterSpacing: '-1.8px',
  lineHeight: '110%',
}

// CSS class name for Tailwind
export const ppEditorialClassName = 'font-editorial font-extralight tracking-[-1.8px] leading-[110%]'