import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { CartSidebar } from "@/components/CartSidebar"
import dynamic from 'next/dynamic'

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

const BrandSlider = dynamic(() => import("@/components/BrandSlider").then(mod => ({ default: mod.BrandSlider })), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
})

const ServicesPreview = dynamic(() => import("@/components/ServicesPreview").then(mod => ({ default: mod.ServicesPreview })), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
})

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HomepageHeroCarousel />
        <PromotionalCards />
        <FeaturedProducts />
        <BrandSlider />
        <ServicesPreview />
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}
