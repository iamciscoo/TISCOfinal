import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { CartSidebar } from "@/components/CartSidebar"
import dynamic from 'next/dynamic'
import RareFinds from "@/components/RareFindsSection"
import { PasswordResetRedirectHandler } from "@/components/PasswordResetRedirectHandler"
import { MobileSearchBar } from "@/components/MobileSearchBar"

// Dynamic imports for non-critical components
const HomepageHeroCarousel = dynamic(() => import("@/components/HomepageHeroCarousel").then(mod => ({ default: mod.HomepageHeroCarousel })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

const PromotionalCards = dynamic(() => import("@/components/PromotionalCards").then(mod => ({ default: mod.PromotionalCards })), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
})

const FeaturedProducts = dynamic(() => import("@/components/FeaturedProducts").then(mod => ({ default: mod.FeaturedProducts })), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
})

import { BrandSlider } from "@/components/BrandSlider"


const ServicesPromoGrid = dynamic(() => import("@/components/ServicesPromoGrid").then(mod => ({ default: mod.ServicesPromoGrid })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

const ServicesPreview = dynamic(() => import("@/components/ServicesPreview").then(mod => ({ default: mod.ServicesPreview })), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
})

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <PasswordResetRedirectHandler />
      <Navbar />
      <main className="overflow-x-hidden bg-white">
        <MobileSearchBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 md:pt-2 lg:pt-4 pb-8 sm:pb-12">
          <HomepageHeroCarousel />
        </div>
        <div className="space-y-8 sm:space-y-12 md:space-y-16">
          <PromotionalCards />
          <RareFinds />
          <FeaturedProducts />
          <BrandSlider />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ServicesPromoGrid />
          </div>
          <ServicesPreview />
        </div>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}
