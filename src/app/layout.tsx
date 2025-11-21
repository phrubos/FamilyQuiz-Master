import type { Metadata } from 'next';
import { Nunito, Playfair_Display } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Családi Kvíz Mester',
  description: 'Többszereplős valós idejű kvízjáték családi összejövetelekre',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className={`${nunito.variable} ${playfair.variable} font-sans`}>{children}</body>
    </html>
  );
}
