import { Navbar } from "@/components/Navbar"
import { HomepageHeroCarousel } from "@/components/HomepageHeroCarousel"
import { FeaturedProducts } from "@/components/FeaturedProducts"
import { ServicesPreview } from "@/components/ServicesPreview"
import { Footer } from "@/components/Footer"
import { CartSidebar } from "@/components/CartSidebar"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HomepageHeroCarousel />
        <FeaturedProducts />
        <ServicesPreview />
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}
