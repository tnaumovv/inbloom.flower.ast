import { Cormorant_Garamond, Manrope } from 'next/font/google';

export const displayFont = Cormorant_Garamond({ subsets: ['latin', 'cyrillic'], weight: ['400', '500'], variable: '--font-display', display: 'swap' });
export const bodyFont = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-body', display: 'swap' });
