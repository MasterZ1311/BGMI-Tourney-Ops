import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/shared/AppShell';

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
      <body className="bg-[#101010] text-[#f2f2f2] min-h-screen font-sans antialiased selection:bg-[#ffb60e] selection:text-black">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
