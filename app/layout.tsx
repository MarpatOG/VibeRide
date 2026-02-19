import type {Metadata} from 'next';
import {Manrope, Unbounded} from 'next/font/google';
import './globals.css';
import {defaultLocale} from '@/lib/locale';

export const metadata: Metadata = {
  title: 'VibeRide — Cycle Studio',
  description: 'VibeRide: городская сайкл-студия для тех, кто любит ритм и скорость.'
};

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800']
});

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800']
});

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang={defaultLocale} data-theme="light" suppressHydrationWarning>
      <body className={`${manrope.variable} ${unbounded.variable}`}>{children}</body>
    </html>
  );
}


