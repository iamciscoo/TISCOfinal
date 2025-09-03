'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Loader2 } from 'lucide-react'
import { useAdminActions } from '@/lib/admin-utils'

interface Category {
  id: string
  name: string
  description?: string
}

interface ProductFormData {
  name: string
  description: string
  price: string
  stock_quantity: string
  category_id: string
  is_featured: boolean
  is_on_sale: boolean
  sale_price: string
  is_deal: boolean
  original_price: string
  deal_price: string
}

export default function AddProductForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    is_featured: false,
    is_on_sale: false,
    sale_price: '',
    is_deal: false,
    original_price: '',
    deal_price: '',
  })
  const [errors, setErrors] = useState<Partial<ProductFormData>>({})
  const { handleCreate, apiCall } = useAdminActions()

  const fetchCategories = async () => {
    const result = await apiCall<{ categories: Category[] }>('/api/categories')
    if (result.success && result.data) {
      setCategories(result.data.categories || [])
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.price.trim()) newErrors.price = 'Price is required'
    else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number'
    }
    if (!formData.stock_quantity.trim()) newErrors.stock_quantity = 'Stock quantity is required'
    else if (isNaN(parseInt(formData.stock_quantity)) || parseInt(formData.stock_quantity) < 0) {
      newErrors.stock_quantity = 'Stock quantity must be a non-negative number'
    }
    if (!formData.category_id) newErrors.category_id = 'Category is required'

    if (formData.is_on_sale && formData.sale_price) {
      const price = parseFloat(formData.price)
      const salePrice = parseFloat(formData.sale_price)
      if (salePrice >= price) {
        newErrors.sale_price = 'Sale price must be less than regular price'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: formData.category_id,
        is_featured: formData.is_featured,
        is_on_sale: formData.is_on_sale,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        is_deal: formData.is_deal,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        deal_price: formData.deal_price ? parseFloat(formData.deal_price) : null,
      }

      await handleCreate('/api/products', productData, 'Product')
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '',
        is_featured: false,
        is_on_sale: false,
        sale_price: '',
        is_deal: false,
        original_price: '',
        deal_price: '',
      })
      setErrors({})
    } catch (error) {
      console.error('Error creating product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SheetContent className="w-[400px] sm:w-[540px]">
      <SheetHeader>
        <SheetTitle>Add New Product</SheetTitle>
        <SheetDescription>
          Create a new product for your store.
        </SheetDescription>
      </SheetHeader>
      
      <form onSubmit={onSubmit} className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            placeholder="Enter product name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter product description"
            className="resize-none"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Stock Quantity</Label>
            <Input
              id="stock_quantity"
              type="number"
              placeholder="0"
              value={formData.stock_quantity}
              onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
            />
            {errors.stock_quantity && <p className="text-sm text-red-500">{errors.stock_quantity}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => handleInputChange('is_featured', !!checked)}
            />
            <Label htmlFor="is_featured">Featured Product</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_on_sale"
              checked={formData.is_on_sale}
              onCheckedChange={(checked) => handleInputChange('is_on_sale', !!checked)}
            />
            <Label htmlFor="is_on_sale">On Sale</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_deal"
              checked={formData.is_deal}
              onCheckedChange={(checked) => handleInputChange('is_deal', !!checked)}
            />
            <Label htmlFor="is_deal">Special Deal</Label>
          </div>
        </div>

        {formData.is_on_sale && (
          <div className="space-y-2">
            <Label htmlFor="sale_price">Sale Price ($)</Label>
            <Input
              id="sale_price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.sale_price}
              onChange={(e) => handleInputChange('sale_price', e.target.value)}
            />
            <p className="text-sm text-gray-500">Must be less than regular price</p>
            {errors.sale_price && <p className="text-sm text-red-500">{errors.sale_price}</p>}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Product
          </Button>
        </div>
      </form>
    </SheetContent>
  )
}
