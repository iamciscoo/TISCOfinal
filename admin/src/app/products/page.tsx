"use client";

import { useEffect, useState } from "react";
import { Product, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { ProductQuickSearch } from "@/components/ProductQuickSearch";

const ProductsPage = () => {
  const [data, setData] = useState<Product[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async (isInitial = false) => {
      try {
        if (!isInitial) setIsRefreshing(true);
        
        // Add timestamp to prevent browser caching
        const timestamp = Date.now();
        const response = await fetch(`/api/products?limit=50&_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const result = await response.json();
        
        // Transform API products to match the UI format
        const products = (result.data || []).map((product: any) => {
          const description = product.description || "";
          const imgs = product.product_images as any[] | undefined;
          const mainFromList = imgs?.find((img: any) => img.is_main)?.url || imgs?.[0]?.url;
          const mainImage = mainFromList || product.image_url || "/circular.svg";
          
          return {
            id: product.id,
            name: product.name,
            shortDescription: description.substring(0, 60) + (description.length > 60 ? "..." : ""),
            description,
            price: Number(product.price ?? 0),
            sizes: ["Standard"],
            colors: ["Default"],
            images: {
              "Default": mainImage
            },
            stock_quantity: product.stock_quantity,
            is_featured: !!product.is_featured,
            is_active: !!product.is_active,
            rating: product.rating,
            reviews_count: product.reviews_count,
            category: product.product_categories?.[0]?.categories || product.category,
            categories: product.product_categories || [],
            view_count: product.view_count || 0
          };
        });
        
        setData(products);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        if (!isInitial) setIsRefreshing(false);
      }
    };

    // Initial fetch
    fetchData(true);

    // Poll every 10 seconds for real-time view count updates
    const pollInterval = setInterval(() => {
      fetchData(false);
    }, 10000); // 10 seconds for faster updates

    return () => clearInterval(pollInterval);
  }, []);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="hidden sm:inline">Updating...</span>
            </div>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <ProductQuickSearch />
        </div>
      </div>
      
      <PageLayout
        title=""
        columns={columns}
        data={data}
        entityName="Product"
        deleteApiBase="/api/products"
      />
    </div>
  );
};

export default ProductsPage;
