import type { Metadata } from 'next';
import { Manrope, Newsreader, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
  adjustFontFallback: false,
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'VariRaksha — Emergency Safety Ecosystem for the Pandharpur Wari',
  description:
    'A connected emergency safety ecosystem combining offline-first mobile response, universal QR medical identities, and real-time coordinator dashboards for pilgrims, Dindi leaders, and medical staff during the Pandharpur Wari.',
  keywords: [
    'VariRaksha',
    'Pandharpur Wari',
    'Varkari Emergency Safety',
    'Offline-First SOS',
    'QR Medical ID',
    'Dindi Safety',
    'Public Safety India',
  ],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${newsreader.variable} ${notoSansDevanagari.variable}`}
    >
      <body className="min-h-screen bg-parchment text-ink antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
