import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Unity Summit 2026',
  description:
    'En møteplass for ledere, HR-ansvarlige, gündere og kommunikasjonsfolk som vil utfordre vanetenkning, bygge broer og skape reell endring i arbeidslivet.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-white text-unity-text font-sans selection:bg-unity-orange selection:text-white flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-grow pt-20">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
