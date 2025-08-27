'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
}

export default function AddProduct() {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
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
    deal_price: ''
  })
  
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted with data:', formData)
    
    if (!formData.name || !formData.price || !formData.stock_quantity || !formData.category_id) {
      console.log('Validation failed:', {
        name: formData.name,
        price: formData.price,
        stock_quantity: formData.stock_quantity,
        category_id: formData.category_id
      })
      toast({
        title: 'Error',
        description: 'Please fill in all required fields (Name, Price, Stock, Category)',
        variant: 'destructive'
      })
      return
    }

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
        deal_price: formData.deal_price ? parseFloat(formData.deal_price) : null
      }
      
      console.log('Sending product data:', productData)

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      console.log('API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to create product')
      }

      const result = await response.json()
      console.log('Product created successfully:', result)
      
      toast({
        title: 'Success',
        description: 'Product created successfully',
      })

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
        deal_price: ''
      })

      // Refresh page to show new product
      window.location.reload()

    } catch (error) {
      console.error('Error creating product:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch categories on component mount
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Load categories when sheet opens
  // Categories are fetched on mount via onOpenAutoFocus

  return (
    <SheetContent onOpenAutoFocus={(e) => { fetchCategories(); e.preventDefault() }}>
      <SheetHeader>
        <SheetTitle>Add New Product</SheetTitle>
        <SheetDescription>
          Create a new product for your store
        </SheetDescription>
      </SheetHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter product name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter product description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (TZS) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock Quantity *</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
              placeholder="0"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select onValueChange={(value) => handleInputChange('category_id', value)}>
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
        </div>

        

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => handleInputChange('is_featured', !!checked)}
            />
            <Label htmlFor="featured">Featured Product</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="on_sale"
              checked={formData.is_on_sale}
              onCheckedChange={(checked) => handleInputChange('is_on_sale', !!checked)}
            />
            <Label htmlFor="on_sale">On Sale</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="deal_item"
              checked={formData.is_deal}
              onCheckedChange={(checked) => handleInputChange('is_deal', !!checked)}
            />
            <Label htmlFor="deal_item">Deal Item</Label>
          </div>
        </div>

        {formData.is_on_sale && (
          <div>
            <Label htmlFor="sale_price">Sale Price (TZS)</Label>
            <Input
              id="sale_price"
              type="number"
              step="0.01"
              value={formData.sale_price}
              onChange={(e) => handleInputChange('sale_price', e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </form>
    </SheetContent>
  )
}
