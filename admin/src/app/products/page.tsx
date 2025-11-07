"use client";

import { useEffect, useState } from "react";
import { Product, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { ProductQuickSearch } from "@/components/ProductQuickSearch";

interface Category {
  id: string;
  name: string;
}

const ProductsPage = () => {
  const [data, setData] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
        
        setAllProducts(products);
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        setCategories(result.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === "all") {
      setData(allProducts);
    } else {
      const filtered = allProducts.filter(product => {
        // Check if product has categories array (product_categories)
        if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
          // product_categories structure: [{ category_id: 'uuid', categories: {...} }]
          return product.categories.some((cat: any) => cat.category_id === selectedCategory);
        }
        
        // Fallback to direct category object
        if (product.category) {
          return product.category.id === selectedCategory;
        }
        
        return false;
      });
      
      setData(filtered);
    }
  }, [selectedCategory, allProducts]);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {data.length}
            </span>
          </div>
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
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
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
