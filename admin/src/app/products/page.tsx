"use client";

import { useEffect, useState, useCallback } from "react";
import { Product, columns } from "./columns";
import { PageLayout } from "@/components/shared/PageLayout";
import { ProductQuickSearch } from "@/components/ProductQuickSearch";
import { ClearProductsModal } from "@/components/ClearProductsModal";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

const ProductsPage = () => {
  const router = useRouter();
  const [data, setData] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFeatured, setSelectedFeatured] = useState<string | undefined>(undefined);
  const [selectedDeal, setSelectedDeal] = useState<string | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (!isInitial) setIsRefreshing(true);
      
      // Add timestamp to prevent browser caching
      const timestamp = Date.now();
      const response = await fetch(`/api/products?limit=500&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result = await response.json();
      
      // Update total count from API pagination metadata
      if (result.pagination?.total !== undefined) {
        setTotalCount(result.pagination.total);
      }
      
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
          deal_price: product.deal_price != null ? Number(product.deal_price) : null,
          original_price: product.original_price != null ? Number(product.original_price) : null,
          is_deal: !!product.is_deal,
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
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData(true);
  }, [fetchData]);

  // Refresh when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchData(false);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

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

  // Filter products by category, featured, and deal status
  useEffect(() => {
    let filtered = [...allProducts];
    
    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => {
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
    }
    
    // Apply featured filter
    if (selectedFeatured) {
      const isFeatured = selectedFeatured === "featured";
      filtered = filtered.filter(product => product.is_featured === isFeatured);
    }
    
    // Apply deal filter
    if (selectedDeal) {
      const isDeal = selectedDeal === "deal";
      filtered = filtered.filter(product => {
        // A product is a deal if it has deal_price set
        const hasDealPrice = (product as any).deal_price != null && (product as any).deal_price > 0;
        return isDeal ? hasDealPrice : !hasDealPrice;
      });
    }
    
    setData(filtered);
  }, [selectedCategory, selectedFeatured, selectedDeal, allProducts]);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col gap-4 pb-6 border-b px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            All Products
            <span className="inline-flex items-center justify-center min-w-[2.5rem] h-7 px-2.5 rounded-md text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {totalCount > 0 ? totalCount : data.length}
            </span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <ProductQuickSearch />
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push('/products/new')}
              className="gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Button>
            {allProducts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClearModal(true)}
                className="gap-2 whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-3">
          <div className="col-span-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px] h-11 min-h-[44px] font-medium rounded-md">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1">
            <Select value={selectedFeatured} onValueChange={(v) => setSelectedFeatured(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-full sm:w-[180px] h-11 min-h-[44px] font-medium rounded-md">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="not-featured">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <Select value={selectedDeal} onValueChange={(v) => setSelectedDeal(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-full sm:w-[180px] h-11 min-h-[44px] font-medium rounded-md">
                <SelectValue placeholder="Deals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="deal">Deals Only</SelectItem>
                <SelectItem value="not-deal">No Deals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <PageLayout
        title=""
        columns={columns}
        data={data}
        entityName="Product"
        deleteApiBase="/api/products"
      />

      <ClearProductsModal
        open={showClearModal}
        onOpenChange={setShowClearModal}
        onSuccess={() => {
          // Refresh the products list
          fetchData(false);
        }}
        productCount={allProducts.length}
      />
    </div>
  );
};

export default ProductsPage;
