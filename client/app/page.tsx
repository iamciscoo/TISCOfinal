/**
 * ============================================================================
 * HOMEPAGE - The Main Landing Page (tiscomarket.store)
 * ============================================================================
 * 
 * WHAT IS THIS FILE?
 * This is the homepage - the first thing customers see when they visit our website.
 * Think of it like the front window of a store - it needs to grab attention and
 * showcase our best products, deals, and services.
 * 
 * WHAT'S ON THIS PAGE?
 * 1. Hero Carousel - Big sliding banners at the top
 * 2. Promotional Cards - Special deals and categories
 * 3. Rare Finds Section - Unique/hard-to-find products
 * 4. Featured Products - Best selling items
 * 5. Brand Slider - Logo carousel of brands we sell
 * 6. Services Promo - PC building, repairs, office setup
 * 7. Services Preview - Detailed service offerings
 * 
 * CONNECTED FILES:
 * - layout.tsx (wraps this page with navigation and providers)
 * - /components/Navbar.tsx (top navigation bar)
 * - /components/Footer.tsx (bottom footer)
 * - /components/CartSidebar.tsx (shopping cart slide-out)
 * - /components/HomepageHeroCarousel.tsx (hero banner)
 * - /components/FeaturedProducts.tsx (product grid)
 * - All other component files imported below
 * 
 * PERFORMANCE OPTIMIZATION:
 * We use "dynamic imports" for heavy components (like carousels and product grids).
 * This means they load AFTER the page appears, making the site feel faster.
 * ============================================================================
 */

// ========== CRITICAL IMPORTS (Load Immediately) ==========
// These are needed right away for the page structure

// Navigation bar at the top of the page
import { Navbar } from "@/components/Navbar"
// Footer at the bottom with links and info
import { Footer } from "@/components/Footer"
// Shopping cart that slides in from the side
import { CartSidebar } from "@/components/CartSidebar"
// Next.js function for lazy-loading heavy components (performance boost)
import dynamic from 'next/dynamic'
// Rare finds section (unique products we sell)
import RareFinds from "@/components/RareFindsSection"
// Handles password reset links from emails
import { PasswordResetRedirectHandler } from "@/components/PasswordResetRedirectHandler"
// Search bar that shows on mobile devices
import { MobileSearchBar } from "@/components/MobileSearchBar"

// ========== DYNAMIC IMPORTS (Load After Page Appears) ==========
// These components are "lazy loaded" to make the page show faster
// The page loads first, then these components load in the background

// Hero Carousel - Big sliding banners at top of page
// Shows while loading: Gray pulsing box (h-96 = height of 24rem)
const HomepageHeroCarousel = dynamic(() => import("@/components/HomepageHeroCarousel").then(mod => ({ default: mod.HomepageHeroCarousel })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

// Promotional Cards - Highlight special deals and categories
// Shows while loading: Gray pulsing box (h-48 = height of 12rem)
const PromotionalCards = dynamic(() => import("@/components/PromotionalCards").then(mod => ({ default: mod.PromotionalCards })), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
})

// New Arrivals Section - Latest products with CTA
// Shows while loading: Gray pulsing box (h-64 = height of 16rem)
const NewArrivalsSection = dynamic(() => import("@/components/NewArrivalsSection").then(mod => ({ default: mod.NewArrivalsSection })), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
})

// Featured Products - Grid of best-selling/featured items
// Shows while loading: Gray pulsing box (h-64 = height of 16rem)
const FeaturedProducts = dynamic(() => import("@/components/FeaturedProducts").then(mod => ({ default: mod.FeaturedProducts })), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
})

// Brand Slider - Carousel showing logos of brands we sell
import { BrandSlider } from "@/components/BrandSlider"

// Services Promo Grid - Showcase our service offerings
// Shows while loading: Gray pulsing box (h-96 = height of 24rem)
const ServicesPromoGrid = dynamic(() => import("@/components/ServicesPromoGrid").then(mod => ({ default: mod.ServicesPromoGrid })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

// Services Preview - Detailed view of services (repairs, PC building, etc.)
// Shows while loading: Gray pulsing box (h-96 = height of 24rem)
const ServicesPreview = dynamic(() => import("@/components/ServicesPreview").then(mod => ({ default: mod.ServicesPreview })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

/**
 * HOME PAGE COMPONENT
 * 
 * This is the main function that builds our homepage.
 * It assembles all the sections in order from top to bottom.
 */
export default function Home() {
  return (
    // Main container - Full screen height, white background, prevent horizontal scroll
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      
      {/* Password Reset Handler - Invisible component that detects reset links from emails */}
      <PasswordResetRedirectHandler />
      
      {/* Navigation Bar - Appears at top of page (logo, menu, search, cart button) */}
      <Navbar />
      
      {/* MAIN CONTENT AREA - Everything between navbar and footer */}
      <main className="w-full bg-white">
        
        {/* Mobile Search Bar - Only shows on small screens */}
        <MobileSearchBar />
        
        {/* Hero Carousel Container - Centered with padding */}
        {/* max-w-7xl = maximum width, mx-auto = center horizontally */}
        {/* px-4 sm:px-6 lg:px-8 = responsive padding (more padding on larger screens) */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 md:pt-2 lg:pt-4 pb-8 sm:pb-12">
          {/* Big sliding banner/carousel at top */}
          <HomepageHeroCarousel />
        </div>
        
        {/* Content Sections Container - Vertical spacing between sections */}
        {/* space-y-8 sm:space-y-12 md:space-y-16 = responsive vertical spacing */}
        <div className="w-full space-y-8 sm:space-y-12 md:space-y-16">
          
          {/* Promotional Cards - Special deals and category highlights */}
          <PromotionalCards />

          {/* New Arrivals - between promos and rare finds */}
          <NewArrivalsSection />

          {/* Rare Finds Section - Unique/hard-to-find products */}
          <RareFinds />
          
          {/* Featured Products - Grid of popular items */}
          <FeaturedProducts />
          
          {/* Brand Slider - Logos of brands we sell */}
          <BrandSlider />
          
          {/* Services Promo Grid - Centered with padding */}
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ServicesPromoGrid />
          </div>
          
          {/* Services Preview - Detailed service info */}
          <ServicesPreview />
        </div>
      </main>
      
      {/* Footer - Bottom of page (links, contact info, legal) */}
      <Footer />
      
      {/* Shopping Cart Sidebar - Slides in from right when cart button clicked */}
      <CartSidebar />
    </div>
  );
}
