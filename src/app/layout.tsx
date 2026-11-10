import type { Metadata, Viewport } from 'next';
import { Figtree, JetBrains_Mono, Sora } from 'next/font/google';
import { ReactNode } from 'react';
import './globals.css';

const sora = Sora({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-sora' });
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree' });
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'CodeLens',
  description: 'See inside code as it runs: animated, step-by-step dry runs of classic algorithms.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Browser extensions (ColorZilla, password managers) add attributes before React hydrates.
    <html
      lang="en"
      className={`${sora.variable} ${figtree.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-dvh font-sans text-[15px] leading-normal antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
