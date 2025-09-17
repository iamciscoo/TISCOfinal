"use client";
import { ProductCard } from "@/components/shared/ProductCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { Product } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await api.getFeaturedProducts(9);
        if (isMounted) setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load featured products", e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="pt-20 pb-4 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We picked them, you love them, Products you’ll regret missing out
            on.
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
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link href="/products">View All Products</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
