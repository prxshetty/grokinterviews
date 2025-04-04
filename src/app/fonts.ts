import { Playfair_Display } from 'next/font/google';

// Use Playfair Display as a substitute for The Very Vogue Serif Family
export const vogueSerif = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-vogue-serif',
  display: 'swap',
});
