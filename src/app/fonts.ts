import { Prata, Commissioner } from 'next/font/google';

export const displayFont = Prata({ subsets: ['latin', 'cyrillic'], weight: '400', variable: '--font-display', display: 'swap' });
export const bodyFont = Commissioner({ subsets: ['latin', 'cyrillic'], variable: '--font-body', display: 'swap' });
