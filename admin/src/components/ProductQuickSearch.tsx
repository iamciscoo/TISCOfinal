"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  image_url?: string;
}

export function ProductQuickSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch products when query changes
  useEffect(() => {
    // Normalize query: trim and remove extra spaces
    const normalizedQuery = query.trim().replace(/\s+/g, ' ');
    
    if (normalizedQuery.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(normalizedQuery)}&limit=10`);
        const data = await response.json();
        setResults(data.data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching products:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250); // Faster debounce for better UX

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      navigateToProduct(results[selectedIndex].id);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const navigateToProduct = (id: string) => {
    router.push(`/products/${id}`);
    setQuery("");
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="relative w-full sm:w-80 md:w-96" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Quick search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 1 && results.length > 0) {
              setShowDropdown(true);
            }
          }}
          className="pl-9 pr-10 h-10 text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-[400px] overflow-auto">
          {results.map((product, index) => (
            <button
              key={product.id}
              onClick={() => navigateToProduct(product.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 border-b last:border-b-0 transition-all text-left",
                selectedIndex === index && "bg-blue-50 border-blue-100"
              )}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatPrice(product.price)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showDropdown && !loading && query.trim().length >= 1 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-xl p-6 text-center">
          <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">No products found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
