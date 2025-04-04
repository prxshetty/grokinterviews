import localFont from 'next/font/local';
import { Playfair_Display } from 'next/font/google';

// Use Janelotus font for dynamic elements
export const janelotus = localFont({
  src: [
    {
      path: '../fonts/Janelotus.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Janelotus-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-janelotus',
  display: 'swap',
});

// Fallback to Playfair Display if Janelotus is not available
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});
