import { Playfair_Display, Cormorant_Garamond } from 'next/font/google';

// Use Cormorant Garamond as a substitute for Janelotus
export const janelotus = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-janelotus',
  display: 'swap',
});

// Fallback font
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});
