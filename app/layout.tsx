import type { Metadata } from 'next';
import { Oxanium, Rajdhani, Teko } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/shared/AppShell';

const oxanium = Oxanium({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-oxanium',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
});

const teko = Teko({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-teko',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BGMI Tournament Control Center — Esports Operations',
  description: 'The official tournament operations dashboard for Battlegrounds Mobile India.',
  icons: {
    icon: '/images/MZ_logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`bg-[#101010] text-[#f2f2f2] min-h-screen font-sans antialiased selection:bg-[#ffb60e] selection:text-black ${oxanium.variable} ${rajdhani.variable} ${teko.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
