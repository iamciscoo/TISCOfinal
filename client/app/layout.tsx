import type { Metadata, Viewport } from "next";
import { AuthProvider } from '@/hooks/use-auth'
import { CurrencyProvider } from '@/lib/currency-context'
import { Toaster } from '@/components/ui/toaster'
import AuthSync from '@/components/AuthSync'
import CartRealtime from '@/components/CartRealtime'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import { Geist, Geist_Mono } from 'next/font/google'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: Chango font will be loaded via CSS fallback since it's not available in next/font/google
// The CSS variables are maintained for compatibility

export const metadata: Metadata = {
  title: "TISCOマーケット - Online Shop | Tanzania's Premier Online Marketplace",
  description: "Tanzania's leading online marketplace for quality electronics, gadgets, and products. Shop with confidence across East Africa. Fast delivery, secure payments, and authentic products guaranteed.",
  keywords: [
    "Tanzania online shop", "East Africa marketplace", "electronics Tanzania", 
    "online shopping Tanzania", "Dar es Salaam electronics", "Kenya online store",
    "Uganda electronics", "East Africa shopping", "mobile phones Tanzania",
    "laptops Tanzania", "gaming Tanzania", "TISCO market", "tiscomarket"
  ],
  authors: [{ name: "TISCO Market" }],
  creator: "TISCO Market",
  publisher: "TISCO Market",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['sw_TZ', 'sw_KE'],
    url: 'https://tiscomarket.store',
    siteName: 'TISCOマーケット - Online Shop',
    title: 'TISCOマーケット - Tanzania\'s Premier Online Marketplace',
    description: 'Shop quality electronics and products across Tanzania and East Africa. Fast delivery, secure payments, authentic products.',
    images: [
      {
        url: '/logo-email.png',
        width: 1200,
        height: 630,
        alt: 'TISCO Market - Tanzania Online Shopping',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TISCOマーケット - Tanzania\'s Premier Online Marketplace',
    description: 'Shop quality electronics and products across Tanzania and East Africa. Fast delivery, secure payments, authentic products.',
    images: ['/logo-email.png'],
    creator: '@tiscomarket',
    site: '@tiscomarket',
  },
  alternates: {
    canonical: 'https://tiscomarket.store',
    languages: {
      'en-US': 'https://tiscomarket.store',
      'sw-TZ': 'https://tiscomarket.store/sw',
    },
  },
  category: 'E-commerce',
  classification: 'Online Marketplace',
  other: {
    'geo.region': 'TZ',
    'geo.placename': 'Tanzania',
    'geo.position': '-6.792354;39.208328',
    'ICBM': '-6.792354, 39.208328',
    'business:contact_data:street_address': 'Dar es Salaam, Tanzania',
    'business:contact_data:locality': 'Dar es Salaam',
    'business:contact_data:region': 'Dar es Salaam',
    'business:contact_data:postal_code': '12345',
    'business:contact_data:country_name': 'Tanzania',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        
        {/* Fonts */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Chango&display=swap" 
          rel="stylesheet"
        />
        
        {/* Additional SEO Meta Tags */}
        <meta name="application-name" content="TISCO Market" />
        <meta name="apple-mobile-web-app-title" content="TISCO Market" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0066CC" />
        <meta name="theme-color" content="#0066CC" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "TISCOマーケット - Online Shop",
              "alternateName": "TISCO Market",
              "url": "https://tiscomarket.store",
              "description": "Tanzania's premier online marketplace for quality electronics, gadgets, and products across East Africa.",
              "publisher": {
                "@type": "Organization",
                "name": "TISCO Market",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://tiscomarket.store/logo-email.png"
                }
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://tiscomarket.store/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              },
              "sameAs": [
                "https://twitter.com/tiscomarket",
                "https://facebook.com/tiscomarket",
                "https://instagram.com/tiscomarket"
              ]
            })
          }}
        />
      </head>
      <body className={`antialiased overflow-x-hidden ${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <CurrencyProvider>
            <AuthSync />
            <CartRealtime />
            {children}
            <WhatsAppFloat />
          </CurrencyProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
