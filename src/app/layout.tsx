import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { preconnect } from 'react-dom';
import './globals.css';
import { config } from '@/site';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBar } from '@/components/layout/MobileBar';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageTransition } from '@/components/ui/PageTransition';
import { RevealObserver } from '@/components/ui/RevealObserver';

// The brand pair, self-hosted (src/fonts/README.md): Sora for headlines and figures, Manrope for text.
// Both are variable files trimmed to Latin. next/font generates size-adjusted fallbacks, so the swap causes no layout shift.
const serif = localFont({
  src: '../fonts/Sora-var.woff2',
  variable: '--font-sora',
  weight: '100 800',
  style: 'normal',
  display: 'swap',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
});
const sans = localFont({
  src: '../fonts/Manrope-var.woff2',
  variable: '--font-manrope',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

export const metadata: Metadata = {
  metadataBase: new URL(config.url),
  title: { default: `${config.name} | New launches across Dubai and the UAE`, template: `%s | ${config.name}` },
  description: config.description,
  applicationName: config.name,
  keywords: config.keywords,
  publisher: config.operatedBy,
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    siteName: config.name,
    locale: config.locale.replace('-', '_'),
    type: 'website',
    images: [{ url: config.ogImage.src, width: config.ogImage.width, height: config.ogImage.height, alt: config.name }],
  },
  twitter: { card: 'summary_large_image', images: [config.ogImage.src] },
  // Google Search Console ownership check (renders the google-site-verification meta tag in the head).
  verification: { google: 'BvgnkqySfhA1nLQia07pcm_5F-4LY1wp3jtoat-YA2k' },
};

export const viewport: Viewport = {
  themeColor: config.themeColor,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Project pictures come from the MBR API's picture storage: the browser connects to it while the page is still
  // arriving, so the first picture starts sooner.
  preconnect(`https://${process.env.PICTURES_HOST || 'media.wellnessz.in'}`);
  return (
    <html lang={config.locale} className={`${serif.variable} ${sans.variable}`}>
      <body className="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <Header />
        <main id="main" tabIndex={-1} className="pt-[72px] outline-none">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <MobileBar />
        <RevealObserver />
      </body>
    </html>
  );
}
