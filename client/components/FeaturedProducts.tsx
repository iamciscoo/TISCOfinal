"use client";
import { ProductCard } from "@/components/shared/ProductCard";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // **PERFORMANCE FIX: Add cache-busting for real-time updates**
        // Fetch directly from API with no-cache header to bypass browser cache
        const timestamp = Date.now();
        const response = await fetch(`/api/products/featured?limit=9&_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured products');
        }
        
        const result = await response.json();
        const data = result.data || result;
        
        if (isMounted) setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load featured products", e);
        if (isMounted) setProducts([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Refresh products when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
  return (
    <section className="pt-2 pb-2 bg-white w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Featured{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Highlights.</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-gradient-to-r from-blue-500 to-blue-600 transform -skew-y-1 opacity-30"></span>
              </span>
            </h2>
          </div>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We picked them, you love them.
            <span className="block mt-1 text-gray-500 font-medium">Items you&apos;ll regret missing out on.</span>
          </p>
        </div>

        {/* Mobile Slider */}
        <div className="md:hidden mb-8 -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
            {products.slice(0, 9).map((product) => (
              <div key={product.id} className="min-w-[78%] snap-start">
                <ProductCard
                  product={product}
                  compact
                  className="rounded-xl border border-gray-100"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop/Tablet Grid - 3x3 layout */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {products.slice(0, 9).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Products Button */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg" className="px-8 rounded-full">
            <Link href="/products">View All Products</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
