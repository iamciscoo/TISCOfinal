/**
 * ============================================================================
 * ROOT LAYOUT - The Master Wrapper for Every Page
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * This is the MOST IMPORTANT file in the entire app. It wraps EVERY single page
 * and controls things that appear everywhere (like navigation, fonts, SEO).
 * Think of it like the "master template" that all pages inherit from.
 * 
 * WHAT DOES IT INCLUDE?
 * 1. SEO Metadata - Information for Google and social media
 * 2. Fonts - Typography loaded from Google Fonts
 * 3. Global Providers - Authentication, currency, shopping cart state
 * 4. Structured Data - Schema.org markup for rich Google results
 * 5. Favicons - Icons for browser tabs and mobile home screens
 * 6. Theme Colors - Brand colors for mobile browsers
 * 7. Global Components - WhatsApp button, toast notifications, auth modals
 * 
 * WHEN IS THIS USED?
 * - EVERY TIME a user visits ANY page
 * - Loaded ONCE when site loads, then wraps all page navigation
 * - Never re-renders unless user hard refreshes entire site
 * 
 * CONNECTED FILES:
 * - globals.css (imported here - all global styles)
 * - All page.tsx files (wrapped by this layout)
 * - /components/Navbar.tsx, /components/Footer.tsx (used by pages)
 * - /hooks/use-auth.tsx (authentication provider)
 * - /lib/currency-context.tsx (currency state management)
 * 
 * HOW IT WORKS:
 * Next.js automatically wraps ALL pages with this layout. The {children}
 * parameter represents whatever page the user is viewing (homepage, products, etc.)
 * ============================================================================
 */

// ========== TYPE IMPORTS ==========
// Import TypeScript types for metadata and viewport settings
import type { Metadata, Viewport } from "next";

// ========== PROVIDER IMPORTS ==========
// These are "context providers" that make data available to all child components

// Authentication provider - manages user login state across entire app
import { AuthProvider } from '@/hooks/use-auth'
// Currency provider - manages TZS/USD currency selection
import { CurrencyProvider } from '@/lib/currency-context'

// ========== UI COMPONENT IMPORTS ==========

// Toast notification system - shows popup messages (success, errors, etc.)
import { Toaster } from '@/components/ui/toaster'
// Syncs auth state between tabs (if user logs out in one tab, all tabs update)
import AuthSync from '@/components/AuthSync'
// Real-time cart updates (if user adds item in one tab, other tabs see it)
import CartRealtime from '@/components/CartRealtime'
// Floating WhatsApp button (bottom-right corner on all pages)
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
// Global auth modal manager (handles login/signup popups)
import { GlobalAuthModalManager } from '@/components/auth/GlobalAuthModalManager'

// ========== SEO STRUCTURED DATA IMPORTS ==========
// Schema.org structured data components for rich Google search results
import { OrganizationSchema, WebsiteSchema, SiteNavigationSchema, LocalBusinessSchema } from '@/components/StructuredData'

// ========== FONT IMPORTS ==========
// Next.js optimized font loading (faster than traditional CSS @import)
import { Geist, Geist_Mono } from 'next/font/google'

// Import global CSS styles (colors, animations, TailwindCSS)
import "./globals.css";

// ========== FONT CONFIGURATIONS ==========

// Geist Sans - Our primary font for body text and UI elements
// variable: Creates CSS variable --font-geist-sans
// subsets: Only load Latin characters (reduces file size)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Geist Mono - Our monospace font for code and technical content
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: Chango font will be loaded via CSS fallback since it's not available in next/font/google
// The CSS variables are maintained for compatibility in globals.css

/* ========== SEO METADATA - What Google and Social Media See ========== */

/**
 * METADATA EXPORT
 * 
 * This metadata is what appears when:
 * - Google indexes our site (title, description in search results)
 * - Someone shares our site on Facebook/Twitter (preview cards)
 * - Browser shows our site (tab title, favicon)
 * 
 * Every field here is optimized for SEO (Search Engine Optimization)
 */
export const metadata: Metadata = {
  // Base URL - used as reference for all relative URLs in metadata
  metadataBase: new URL('https://tiscomarket.store'),
  
  // Page title - shown in browser tab and Google search results
  // Format: "Brand Name - What We Do | Location"
  title: "TISCOマーケット - Online Shop | Tanzania's Online Marketplace",
  
  // Meta description - shown in Google search results under title
  // 150-160 characters optimal (this is what makes people click!)
  description: "TISCO Market - Tanzania's leading online marketplace for quality electronics, gadgets, rare finds, and professional tech services. Custom PC building, office setup, device repair. Shop with confidence across East Africa. Fast delivery, secure payments, and authentic products guaranteed.",
  
  // Keywords - helps Google understand what our site is about
  // Includes: brand names, products, services, locations, long-tail keywords
  keywords: [
    // Brand name variations
    "TISCO", "tisco market", "TISCOマーケット", "tiscomarket", "tisco online shop",
    
    // Location-based keywords (critical for local SEO)
    "Tanzania online shop", "East Africa marketplace", "electronics Tanzania", 
    "online shopping Tanzania", "Dar es Salaam electronics", "Kenya online store",
    "Uganda electronics", "East Africa shopping", "mobile phones Tanzania",
    
    // Product keywords
    "laptops Tanzania", "gaming Tanzania", "online store Tanzania", 
    "e-commerce Tanzania", "shopping Tanzania", "buy online Tanzania",
    
    // Rare finds niche keywords
    "rare finds Tanzania", "antiques Tanzania", "anime merchandise Tanzania", 
    "niche products Tanzania", "collectibles Dar es Salaam", "figurines Tanzania",
    "manga Tanzania", "vintage items Tanzania", "unique products Tanzania",
    "hard to find items Tanzania", "specialty electronics Tanzania", "rare tech Tanzania",
    
    // Service keywords (PC building, repairs, etc.)
    "PC building services Tanzania", "computer repair Dar es Salaam", "office setup Tanzania",
    "tech services Tanzania", "device repair Tanzania", "game installation Tanzania",
    "certified technicians Tanzania", "workspace setup Dar es Salaam", "ergonomic office design",
    "professional tech services Tanzania", "system optimization Tanzania"
  ],
  
  // Author and publisher information (brand signals for Google)
  authors: [{ name: "TISCO Market" }],
  creator: "TISCO Market",
  publisher: "TISCO Market",
  // Robots configuration - tells search engines how to crawl our site
  robots: {
    index: true,   // Allow Google to index our pages (show in search results)
    follow: true,  // Allow Google to follow our links to other pages
    
    // Special instructions for Google's crawler (Googlebot)
    googleBot: {
      index: true,   // Allow indexing
      follow: true,  // Follow all links
      'max-video-preview': -1,        // Show full video previews (no limit)
      'max-image-preview': 'large',   // Show large image previews in search
      'max-snippet': -1,               // Show full text snippets (no limit)
    },
  },
  
  // OpenGraph metadata - what appears when shared on Facebook, LinkedIn, WhatsApp
  // This creates the preview card with image, title, and description
  openGraph: {
    type: 'website',  // Type of content (website vs article, product, etc.)
    
    // Support for Swahili language (Tanzania and Kenya)
    alternateLocale: ['sw_TZ', 'sw_KE'],
    
    url: 'https://tiscomarket.store',  // Canonical URL
    siteName: 'TISCOマーケット - Online Shop',  // Site name shown in preview
    
    // Title and description for social media preview card
    title: 'TISCOマーケット - Tanzania\'s Online Marketplace',
    description: 'Shop quality electronics and products across Tanzania and East Africa. Fast delivery, secure payments, authentic products.',
    
    // Images shown in social media preview cards
    images: [
      {
        url: 'https://tiscomarket.store/logo-email.png',  // Main preview image
        width: 1200,   // Recommended width for Facebook/LinkedIn
        height: 630,   // Recommended height (1.91:1 ratio)
        alt: 'TISCO Market - Tanzania Online Shopping & Rare Finds',
        type: 'image/png',
      },
      {
        url: 'https://tiscomarket.store/favicon-512x512.png',  // Fallback image
        width: 512,
        height: 512,
        alt: 'TISCOマーケット Logo',
        type: 'image/png',
      },
    ],
  },
  
  // Twitter Card metadata - special preview for Twitter/X
  // Creates a "large image card" when shared on Twitter
  twitter: {
    card: 'summary_large_image',  // Large image card format (most engaging)
    title: 'TISCOマーケット - Tanzania\'s Online Marketplace',
    description: 'Shop quality electronics and products across Tanzania and East Africa. Fast delivery, secure payments, authentic products.',
    images: ['https://tiscomarket.store/logo-email.png'],  // Twitter preview image
    creator: '@tiscomarket',  // Twitter handle (creator)
    site: '@tiscomarket',     // Twitter handle (site owner)
  },
  // Alternate language versions - helps Google show right language to users
  alternates: {
    canonical: 'https://tiscomarket.store',  // Main/preferred URL (prevents duplicate content issues)
    languages: {
      'en-US': 'https://tiscomarket.store',      // English version
      'sw-TZ': 'https://tiscomarket.store/sw',   // Swahili version (future)
    },
  },
  
  // Site classification - helps search engines categorize us
  category: 'E-commerce',              // Primary category
  classification: 'Online Marketplace', // More specific classification
  
  // Geographic and business metadata (local SEO signals)
  other: {
    // Geographic coordinates for local search
    'geo.region': 'TZ',                               // Country code: Tanzania
    'geo.placename': 'Tanzania',                      // Location name
    'geo.position': '-6.792354;39.208328',           // Latitude;Longitude (Dar es Salaam)
    'ICBM': '-6.792354, 39.208328',                  // Alternative geo format
    
    // Business location data (for local business SEO)
    'business:contact_data:street_address': 'Dar es Salaam, Tanzania',
    'business:contact_data:locality': 'Dar es Salaam',  // City
    'business:contact_data:region': 'Dar es Salaam',    // Region/State
    'business:contact_data:postal_code': '12345',       // Postal code
    'business:contact_data:country_name': 'Tanzania',   // Country
  },
};

/* ========== VIEWPORT CONFIGURATION ========== */

/**
 * VIEWPORT EXPORT
 * 
 * Controls how the site appears on mobile devices.
 * This ensures our site is responsive and works well on phones/tablets.
 */
export const viewport: Viewport = {
  width: 'device-width',  // Use device's screen width (essential for mobile)
  initialScale: 1,        // Start at 100% zoom (don't zoom in or out by default)
  viewportFit: 'cover',   // Extend to screen edges (for notched phones like iPhone X)
};

/* ========== ROOT LAYOUT COMPONENT ========== */

/**
 * ROOT LAYOUT COMPONENT
 * 
 * This is the main wrapper component that surrounds ALL pages.
 * It runs on the SERVER (not in browser) to generate initial HTML.
 * 
 * PARAMETERS:
 * @param children - The actual page content (homepage, products page, etc.)
 *                   This changes as users navigate, but layout stays the same
 * 
 * STRUCTURE:
 * <html> → <head> (metadata, favicons) → <body> (providers, content) → </body> → </html>
 */
export default async function RootLayout({
  children,  // The page content that goes inside this wrapper
}: Readonly<{
  children: React.ReactNode;  // TypeScript: children must be React elements
}>) {
  return (
    // HTML root element with language and scroll settings
    // lang="en" = English language (helps screen readers and search engines)
    // suppressHydrationWarning = prevents React warnings during server→client transition
    <html lang="en" style={{scrollBehavior: 'smooth'}} data-scroll-behavior="smooth" suppressHydrationWarning>
      
      {/* ========== HEAD SECTION - Invisible Metadata ========== */}
      {/* Everything in <head> doesn't show on page but is crucial for SEO and functionality */}
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
        <SiteNavigationSchema />
        <LocalBusinessSchema />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16 32x32 48x48" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
        <link rel="icon" href="/favicon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/favicon-512x512.png" type="image/png" sizes="512x512" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="152x152" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="144x144" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="120x120" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="114x114" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="76x76" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="72x72" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="60x60" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" sizes="57x57" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-square70x70logo" content="/favicon-96x96.png" />
        <meta name="msapplication-square150x150logo" content="/favicon-192x192.png" />
        <meta name="msapplication-wide310x150logo" content="/favicon-192x192.png" />
        <meta name="msapplication-square310x310logo" content="/favicon-512x512.png" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Chango&display=swap" rel="stylesheet" />
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({"@context": "https://schema.org","@type": "Organization","name": "TISCO Market","alternateName": ["TISCOマーケット", "TISCO", "Tisco Market", "tiscomarket"],"url": "https://tiscomarket.store","logo": {"@type": "ImageObject","url": "https://tiscomarket.store/logo-email.png","width": 1200,"height": 630,"caption": "TISCO Market Logo - Tanzania's Online Marketplace"},"image": [{"@type": "ImageObject","url": "https://tiscomarket.store/logo-email.png","width": 1200,"height": 630},{"@type": "ImageObject","url": "https://tiscomarket.store/favicon-512x512.png","width": 512,"height": 512},{"@type": "ImageObject","url": "https://tiscomarket.store/favicon.svg","width": 512,"height": 512}],"description": "Tanzania's premier online marketplace for quality electronics, gadgets, and products across East Africa.","address": {"@type": "PostalAddress","addressLocality": "Dar es Salaam","addressRegion": "Dar es Salaam Region","addressCountry": "TZ"},"contactPoint": {"@type": "ContactPoint","telephone": "+255748624684","contactType": "customer service","email": "support@tiscomarket.store"},"geo": {"@type": "GeoCoordinates","latitude": -6.792354,"longitude": 39.208328},"areaServed": ["Tanzania", "Kenya", "Uganda", "East Africa"],"sameAs": ["https://twitter.com/tiscomarket","https://facebook.com/tiscomarket","https://instagram.com/tiscomarket"]})}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({"@context": "https://schema.org","@type": "WebSite","name": "TISCOマーケット - Online Shop","alternateName": "TISCO Market","url": "https://tiscomarket.store","logo": "https://tiscomarket.store/logo-email.png","image": "https://tiscomarket.store/logo-email.png","potentialAction": {"@type": "SearchAction","target": {"@type": "EntryPoint","urlTemplate": "https://tiscomarket.store/products?query={search_term_string}"},"query-input": "required name=search_term_string"}})}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({"@context": "https://schema.org","@type": "Brand","name": "TISCO Market","alternateName": ["TISCOマーケット", "TISCO", "tiscomarket"],"url": "https://tiscomarket.store","logo": {"@type": "ImageObject","url": "https://tiscomarket.store/logo-email.png","width": 1200,"height": 630,"caption": "TISCO Market Logo - Tanzania's Premier Online Marketplace"},"description": "TISCO Market brand - Tanzania's leading online marketplace for electronics, rare finds, and professional tech services","slogan": "No Bullshit. No Excuses. No Fluff. Just What You Need.","aggregateRating": {"@type": "AggregateRating","ratingValue": "4.8","reviewCount": "150"}})}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({"@context": "https://schema.org","@type": "ElectronicsStore","name": "TISCO Market","alternateName": ["TISCOマーケット", "TISCO", "Tisco Market", "tiscomarket"],"description": "Tanzania's leading online marketplace for electronics, gadgets, and quality products with fast delivery across East Africa.","url": "https://tiscomarket.store","telephone": "+255748624684","email": "support@tiscomarket.com","address": {"@type": "PostalAddress","addressLocality": "Dar es Salaam","addressRegion": "Dar es Salaam Region","addressCountry": "TZ"},"geo": {"@type": "GeoCoordinates","latitude": -6.792354,"longitude": 39.208328},"openingHours": "Mo-Su 00:00-23:59","areaServed": ["Tanzania", "Kenya", "Uganda"],"priceRange": "$$","paymentAccepted": ["Mobile Money", "Credit Card", "Bank Transfer"],"currenciesAccepted": "TZS"})}} />
      </head>
      
      {/* ========== BODY SECTION - Visible Content ========== */}
      {/* Everything users actually see and interact with */}
      
      {/* Body element with font variables and styling */}
      {/* antialiased = smooth fonts, overflow-x-hidden = prevent horizontal scroll */}
      {/* ${geistSans.variable} and ${geistMono.variable} = inject CSS font variables */}
      <body className={`antialiased overflow-x-hidden ${geistSans.variable} ${geistMono.variable}`}>
        
        {/* ========== AUTHENTICATION PROVIDER ========== */}
        {/* Wraps entire app with authentication context */}
        {/* Makes user login state available to ALL components */}
        {/* Components can access: user, signIn(), signOut(), etc. */}
        <AuthProvider>
          
          {/* ========== CURRENCY PROVIDER ========== */}
          {/* Manages TZS/USD currency selection across site */}
          {/* Components can access: currency, setCurrency(), formatPrice(), etc. */}
          <CurrencyProvider>
            
            {/* ========== AUTH SYNC COMPONENT ========== */}
            {/* Invisible component that syncs auth state across browser tabs */}
            {/* If user logs out in one tab, all tabs automatically log out */}
            <AuthSync />
            
            {/* ========== CART REALTIME COMPONENT ========== */}
            {/* Invisible component that syncs cart across tabs */}
            {/* If user adds item in one tab, other tabs see it instantly */}
            <CartRealtime />
            
            {/* ========== PAGE CONTENT ========== */}
            {/* This is where the actual page content renders */}
            {/* Could be homepage, products page, checkout, etc. */}
            {/* Changes as user navigates, but everything above stays constant */}
            {children}
            
            {/* ========== WHATSAPP FLOAT BUTTON ========== */}
            {/* Floating WhatsApp button (bottom-right corner) */}
            {/* Appears on all pages, customers can click to chat */}
            <WhatsAppFloat />
            
            {/* ========== GLOBAL AUTH MODAL MANAGER ========== */}
            {/* Manages login/signup modals that can be triggered from anywhere */}
            {/* Handles popups for sign-in, sign-up, password reset */}
            <GlobalAuthModalManager />
            
          </CurrencyProvider>
          
          {/* ========== TOAST NOTIFICATIONS ========== */}
          {/* Toast notification system (popup messages) */}
          {/* Shows success messages ("Item added to cart"), errors, etc. */}
          {/* Must be outside CurrencyProvider to work everywhere */}
          <Toaster />
          
        </AuthProvider>
        
      </body>
    </html>
  );
}
/* ========== END OF ROOT LAYOUT ========== */
