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
  metadataBase: new URL('https://tiscomarket.store'),
  title: "TISCOマーケット - Online Shop | Tanzania's Online Marketplace",
  description: "TISCO Market - Tanzania's leading online marketplace for quality electronics, gadgets, and products. Shop with confidence across East Africa. Fast delivery, secure payments, and authentic products guaranteed.",
  keywords: [
    "TISCO", "tisco market", "TISCOマーケット", "tiscomarket", "tisco online shop",
    "Tanzania online shop", "East Africa marketplace", "electronics Tanzania", 
    "online shopping Tanzania", "Dar es Salaam electronics", "Kenya online store",
    "Uganda electronics", "East Africa shopping", "mobile phones Tanzania",
    "laptops Tanzania", "gaming Tanzania", "online store Tanzania", 
    "e-commerce Tanzania", "shopping Tanzania", "buy online Tanzania"
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
    title: 'TISCOマーケット - Tanzania\'s Online Marketplace',
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
    title: 'TISCOマーケット - Tanzania\'s Online Marketplace',
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
        {/* Favicon - Multiple sizes for better Google indexing */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16 32x32 48x48" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="152x152" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="144x144" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="120x120" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="114x114" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="76x76" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="72x72" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="60x60" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="57x57" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-square70x70logo" content="/favicon-96x96.png" />
        <meta name="msapplication-square150x150logo" content="/favicon-192x192.png" />
        <meta name="msapplication-wide310x150logo" content="/favicon-192x192.png" />
        <meta name="msapplication-square310x310logo" content="/favicon-512x512.png" />
        
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0066CC" />
        <meta name="msapplication-navbutton-color" content="#0066CC" />
        <meta name="theme-color" content="#0066CC" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#0066CC" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0066CC" />
        
        {/* Google Site Verification (add your verification code if available) */}
        <meta name="google-site-verification" content="your-google-verification-code" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "TISCO Market",
              "alternateName": ["TISCOマーケット", "TISCO", "Tisco Market", "tiscomarket"],
              "url": "https://tiscomarket.store",
              "logo": "https://tiscomarket.store/logo-email.png",
              "description": "Tanzania's premier online marketplace for quality electronics, gadgets, and products across East Africa.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dar es Salaam",
                "addressRegion": "Dar es Salaam",
                "postalCode": "12345",
                "addressCountry": "TZ"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -6.792354,
                "longitude": 39.208328
              },
              "areaServed": ["Tanzania", "Kenya", "Uganda", "East Africa"],
              "sameAs": [
                "https://twitter.com/tiscomarket",
                "https://facebook.com/tiscomarket",
                "https://instagram.com/tiscomarket"
              ]
            })
          }}
        />
        
        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "TISCOマーケット - Online Shop",
              "alternateName": ["TISCO Market", "TISCO", "Tisco Market", "tiscomarket"],
              "url": "https://tiscomarket.store",
              "description": "Tanzania's online marketplace for quality electronics, gadgets, and products across East Africa.",
              "publisher": {
                "@type": "Organization",
                "name": "TISCO Market"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://tiscomarket.store/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        
        {/* Structured Data - Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "TISCO Market",
              "alternateName": ["TISCOマーケット", "TISCO", "Tisco Market", "tiscomarket"],
              "description": "Tanzania's leading online marketplace for electronics, gadgets, and quality products with fast delivery across East Africa.",
              "url": "https://tiscomarket.store",
              "telephone": "+255758787168",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Dar es Salaam",
                "addressLocality": "Dar es Salaam",
                "addressRegion": "Dar es Salaam Region",
                "postalCode": "12345",
                "addressCountry": "Tanzania"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -6.792354,
                "longitude": 39.208328
              },
              "openingHours": "Mo-Su 00:00-23:59",
              "areaServed": {
                "@type": "Country",
                "name": "Tanzania"
              },
              "servedCuisine": "Electronics and Technology Products",
              "priceRange": "$$"
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
