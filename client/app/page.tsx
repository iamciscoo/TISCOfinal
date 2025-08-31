import { Navbar } from "@/components/Navbar"
import { HomepageHeroCarousel } from "@/components/HomepageHeroCarousel"
import { PromotionalCards } from "@/components/PromotionalCards"
import { FeaturedProducts } from "@/components/FeaturedProducts"
import { ServicesPreview } from "@/components/ServicesPreview"
import { BrandSlider } from "@/components/BrandSlider"
import { Footer } from "@/components/Footer"
import { CartSidebar } from "@/components/CartSidebar"

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

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
