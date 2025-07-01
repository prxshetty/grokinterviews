import { Playfair_Display, Cormorant_Garamond } from 'next/font/google';

// Use Cormorant Garamond as a substitute for Janelotus - optimized for performance
export const janelotus = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400'], // Reduce to only essential weight
  style: ['normal'], // Reduce to only essential style  
  variable: '--font-janelotus',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'serif'],
});

// Fallback font - optimized for performance
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400'], // Reduce to only essential weight
  style: ['normal'], // Reduce to only essential style
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
  fallback: ['Times New Roman', 'serif'],
});
