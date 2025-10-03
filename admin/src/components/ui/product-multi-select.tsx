'use client'

import * as React from 'react'
import { Search, X, Check, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  price: string
  image_url?: string | null
}

interface ProductMultiSelectProps {
  selectedProductIds: string[]
  onSelectionChange: (productIds: string[]) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function ProductMultiSelect({
  selectedProductIds,
  onSelectionChange,
  disabled = false,
  className,
  placeholder = "Search and select products..."
}: ProductMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch products on mount and when search changes
  React.useEffect(() => {
    const fetchProducts = async () => {
      if (!open && !searchQuery) return // Don't fetch if not searching and dropdown closed
      
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        params.append('limit', '50') // Reasonable limit for dropdown
        
        const response = await fetch(`/api/admin/products?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        
        const data = await response.json()
        setProducts(Array.isArray(data.products) ? data.products : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchQuery, open])

  // Get selected product details for display
  const selectedProducts = React.useMemo(() => {
    return products.filter(product => selectedProductIds.includes(product.id))
  }, [products, selectedProductIds])

  const handleProductToggle = (productId: string) => {
    const newSelection = selectedProductIds.includes(productId)
      ? selectedProductIds.filter(id => id !== productId)
      : [...selectedProductIds, productId]
    
    onSelectionChange(newSelection)
  }

  const removeProduct = (productId: string) => {
    onSelectionChange(selectedProductIds.filter(id => id !== productId))
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return `TZS ${numPrice.toLocaleString()}`
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`Select products. ${selectedProductIds.length} products currently selected.`}
            className={cn(
              "w-full justify-between text-left font-normal min-h-[44px]", // 44px minimum for mobile touch targets
              !selectedProductIds.length && "text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {selectedProductIds.length === 0
                  ? placeholder
                  : `${selectedProductIds.length} product${selectedProductIds.length === 1 ? '' : 's'} selected`
                }
              </span>
            </div>
            <Search className="ml-2 h-4 w-4 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[95vw] sm:w-full p-0" align="start" side="bottom">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="h-11 text-base" // Larger touch target for mobile, prevent zoom on iOS
              aria-label="Search for products to select"
            />
            <CommandList role="listbox" aria-label="Product options">
              <ScrollArea className="h-[300px]">
                {loading ? (
                  <CommandEmpty>Searching products...</CommandEmpty>
                ) : error ? (
                  <CommandEmpty className="text-red-500">
                    Error: {error}
                  </CommandEmpty>
                ) : products.length === 0 ? (
                  <CommandEmpty>
                    {searchQuery ? "No products found." : "Start typing to search products..."}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {products.map((product) => {
                      const isSelected = selectedProductIds.includes(product.id)
                      return (
                        <CommandItem
                          key={product.id}
                          value={product.id}
                          onSelect={() => handleProductToggle(product.id)}
                          className="flex items-center gap-3 px-3 py-3 cursor-pointer min-h-[48px]" // Larger touch target
                          role="option"
                          aria-selected={isSelected}
                          aria-label={`${product.name}, ${formatPrice(product.price)}. ${isSelected ? 'Selected' : 'Not selected'}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Product Image */}
                            <div className="w-8 h-8 rounded border bg-muted flex-shrink-0 overflow-hidden">
                              {product.image_url && product.image_url !== '/circular.svg' ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement
                                    img.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <Package className="w-4 h-4 text-muted-foreground m-auto mt-2" />
                              )}
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Selection Indicator */}
                          <div className="flex-shrink-0">
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Products Display */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Products:</p>
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 max-h-32 overflow-y-auto">
            {selectedProducts.map((product) => (
              <Badge
                key={product.id}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1.5 text-sm justify-between w-full sm:w-auto"
              >
                <span className="truncate max-w-[calc(100%-32px)] sm:max-w-[200px]" title={product.name}>
                  {product.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center shrink-0" // Better touch target
                  disabled={disabled}
                  aria-label={`Remove ${product.name} from selection`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
