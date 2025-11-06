"use client";

import { useEffect, useState } from "react";
import { Product, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { ProductQuickSearch } from "@/components/ProductQuickSearch";

const ProductsPage = () => {
  const [data, setData] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/products?limit=50");
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
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 30 seconds to update view counts (lightweight)
    const pollInterval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, []);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
        <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
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
