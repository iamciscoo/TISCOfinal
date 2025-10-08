import type { Metadata, Viewport } from "next";
import { AuthProvider } from '@/hooks/use-auth'
import { CurrencyProvider } from '@/lib/currency-context'
import { Toaster } from '@/components/ui/toaster'
import AuthSync from '@/components/AuthSync'
import CartRealtime from '@/components/CartRealtime'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import { GlobalAuthModalManager } from '@/components/auth/GlobalAuthModalManager'
import { OrganizationSchema, WebsiteSchema, SiteNavigationSchema, LocalBusinessSchema } from '@/components/StructuredData'
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
  description: "TISCO Market - Tanzania's leading online marketplace for quality electronics, gadgets, rare finds, and professional tech services. Custom PC building, office setup, device repair. Shop with confidence across East Africa. Fast delivery, secure payments, and authentic products guaranteed.",
  keywords: [
    "TISCO", "tisco market", "TISCOマーケット", "tiscomarket", "tisco online shop",
    "Tanzania online shop", "East Africa marketplace", "electronics Tanzania", 
    "online shopping Tanzania", "Dar es Salaam electronics", "Kenya online store",
    "Uganda electronics", "East Africa shopping", "mobile phones Tanzania",
    "laptops Tanzania", "gaming Tanzania", "online store Tanzania", 
    "e-commerce Tanzania", "shopping Tanzania", "buy online Tanzania",
    "rare finds Tanzania", "antiques Tanzania", "anime merchandise Tanzania", 
    "niche products Tanzania", "collectibles Dar es Salaam", "figurines Tanzania",
    "manga Tanzania", "vintage items Tanzania", "unique products Tanzania",
    "hard to find items Tanzania", "specialty electronics Tanzania", "rare tech Tanzania",
    "PC building services Tanzania", "computer repair Dar es Salaam", "office setup Tanzania",
    "tech services Tanzania", "device repair Tanzania", "game installation Tanzania",
    "certified technicians Tanzania", "workspace setup Dar es Salaam", "ergonomic office design",
    "professional tech services Tanzania", "system optimization Tanzania"
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
    alternateLocale: ['sw_TZ', 'sw_KE'],
    url: 'https://tiscomarket.store',
    siteName: 'TISCOマーケット - Online Shop',
    title: 'TISCOマーケット - Tanzania\'s Online Marketplace',
    description: 'Shop quality electronics and products across Tanzania and East Africa. Fast delivery, secure payments, authentic products.',
    images: [
      {
        url: 'https://tiscomarket.store/logo-email.png',
        width: 1200,
        height: 630,
        alt: 'TISCO Market - Tanzania Online Shopping & Rare Finds',
        type: 'image/png',
      },
      {
        url: 'https://tiscomarket.store/favicon-512x512.png',
        width: 512,
        height: 512,
        alt: 'TISCOマーケット Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TISCOマーケット - Tanzania\'s Online Marketplace',
    description: 'Shop quality electronics and products across Tanzania and East Africa. Fast delivery, secure payments, authentic products.',
    images: ['https://tiscomarket.store/logo-email.png'],
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
    <html lang="en" style={{scrollBehavior: 'smooth'}} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Structured Data for Rich Search Results */}
        <OrganizationSchema />
        <WebsiteSchema />
        <SiteNavigationSchema />
        <LocalBusinessSchema />
        
        {/* Favicon - Multiple sizes for better Google indexing and brand recognition */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16 32x32 48x48" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/favicon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/favicon-512x512.png" type="image/png" sizes="512x512" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Images are loaded via OpenGraph metadata and favicons - no need to preload */}
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
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
        
        {/* Fonts - Chango font for titles */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
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
        
        {/* Site is verified via DNS through domain registrar - no HTML tags needed */}
        
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
              "logo": {
                "@type": "ImageObject",
                "url": "https://tiscomarket.store/logo-email.png",
                "width": 1200,
                "height": 630,
                "caption": "TISCO Market Logo - Tanzania's Online Marketplace"
              },
              "image": [
                {
                  "@type": "ImageObject",
                  "url": "https://tiscomarket.store/logo-email.png",
                  "width": 1200,
                  "height": 630
                },
                {
                  "@type": "ImageObject", 
                  "url": "https://tiscomarket.store/favicon-512x512.png",
                  "width": 512,
                  "height": 512
                },
                {
                  "@type": "ImageObject",
                  "url": "https://tiscomarket.store/favicon.svg",
                  "width": 512,
                  "height": 512
                }
              ],
              "description": "Tanzania's premier online marketplace for quality electronics, gadgets, and products across East Africa.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dar es Salaam",
                "addressRegion": "Dar es Salaam Region",
                "addressCountry": "TZ"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+255748624684",
                "contactType": "customer service",
                "email": "support@tiscomarket.store"
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
              "alternateName": "TISCO Market",
              "url": "https://tiscomarket.store",
              "logo": "https://tiscomarket.store/logo-email.png",
              "image": "https://tiscomarket.store/logo-email.png",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://tiscomarket.store/products?query={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        
        {/* Structured Data - Brand */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Brand",
              "name": "TISCO Market",
              "alternateName": ["TISCOマーケット", "TISCO", "tiscomarket"],
              "url": "https://tiscomarket.store",
              "logo": {
                "@type": "ImageObject",
                "url": "https://tiscomarket.store/logo-email.png",
                "width": 1200,
                "height": 630,
                "caption": "TISCO Market Logo - Tanzania's Premier Online Marketplace"
              },
              "description": "TISCO Market brand - Tanzania's leading online marketplace for electronics, rare finds, and professional tech services",
              "slogan": "No Bullshit. No Excuses. No Fluff. Just What You Need.",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "150"
              }
            })
          }}
        />
        
        {/* Structured Data - Store/ElectronicsStore */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ElectronicsStore",
              "name": "TISCO Market",
              "alternateName": ["TISCOマーケット", "TISCO", "Tisco Market", "tiscomarket"],
              "description": "Tanzania's leading online marketplace for electronics, gadgets, and quality products with fast delivery across East Africa.",
              "url": "https://tiscomarket.store",
              "telephone": "+255748624684",
              "email": "support@tiscomarket.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dar es Salaam",
                "addressRegion": "Dar es Salaam Region",  
                "addressCountry": "TZ"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -6.792354,
                "longitude": 39.208328
              },
              "openingHours": "Mo-Su 00:00-23:59",
              "areaServed": ["Tanzania", "Kenya", "Uganda"],
              "priceRange": "$$",
              "paymentAccepted": ["Mobile Money", "Credit Card", "Bank Transfer"],
              "currenciesAccepted": "TZS"
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
            <GlobalAuthModalManager />
          </CurrencyProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
