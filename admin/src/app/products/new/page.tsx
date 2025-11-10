"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import type { Category } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(1, { message: "Product name is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  price: z.number().min(0.01, { message: "Price must be greater than 0" }),
  category_ids: z.array(z.string()).min(1, { message: "At least one category is required!" }).max(5, { message: "Maximum 5 categories allowed!" }),
  brands: z.array(z.string()).optional(),
  stock_quantity: z.number().min(0, { message: "Stock quantity must be 0 or greater" }),
  is_featured: z.boolean(),
  is_new: z.boolean(),
  is_deal: z.boolean(),
  featured_order: z.number().int().min(1).max(20).optional(),
  original_price: z.number().min(0.01).optional(),
  deal_price: z.number().min(0.01).optional(),
  images: z.any().optional(),
}).refine((data) => {
  if (data.is_deal) {
    return data.original_price && data.deal_price && data.original_price > data.deal_price;
  }
  return true;
}, {
  message: "When marking as deal, original price must be greater than deal price",
  path: ["deal_price"],
});

type FormData = z.infer<typeof formSchema>;

const AddProductPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<Array<{ file: File; url: string; id: string }>>([]);
  const [brandInput, setBrandInput] = useState("");
  const { toast} = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    shouldUnregister: true,
    defaultValues: {
      name: "",
      description: "",
      price: undefined as any,
      category_ids: [],
      brands: [],
      stock_quantity: undefined as any,
      is_featured: false,
      is_new: false,
      is_deal: false,
      featured_order: undefined,
      original_price: undefined,
      deal_price: undefined,
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load categories");
        setCategories(json.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
      }
    };
    fetchCategories();
  }, [toast]);


  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const { images, ...productData } = values;

      const payload = { ...productData };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Failed to create product");
      }

      const newProduct = json?.data;
      let imageUploadSuccess = true;
      let uploadMessage = "Product created successfully";
      
      // Upload images after product creation, if provided
      if (newProduct?.id && images && images.length > 0) {
        try {
          const formData = new FormData();
          formData.append('productId', newProduct.id.toString());
          formData.append('is_main', 'true'); // first file becomes main
          
          // Ensure we're working with actual File objects
          const fileList = Array.from(images as FileList).filter(file => file instanceof File);
          
          if (fileList.length === 0) {
            throw new Error('No valid image files selected');
          }
          
          fileList.forEach((file) => {
            formData.append('files', file);
          });

          const uploadRes = await fetch('/api/upload', { 
            method: 'POST', 
            body: formData 
          });
          
          const uploadJson = await uploadRes.json().catch(() => ({ error: 'Invalid response from upload server' }));
          
          if (!uploadRes.ok) {
            throw new Error(uploadJson?.error || `Upload failed with status ${uploadRes.status}`);
          }
          
          console.log('Images uploaded successfully:', uploadJson);
          uploadMessage = `Product created successfully with ${fileList.length} image(s)`;
          
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          imageUploadSuccess = false;
          
          // Show warning but don't fail product creation
          toast({ 
            title: 'Warning', 
            description: `Product created, but image upload failed: ${uploadError.message}`,
            variant: 'destructive' 
          });
        }
      }

      // Only show success if images uploaded successfully or no images were provided
      if (imageUploadSuccess) {
        toast({
          title: "Success",
          description: uploadMessage,
        });
      }
      
      router.push('/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removePreviewImage = (id: string) => {
    setImagePreview(prev => prev.filter(img => img.id !== id));
    
    // Update form field
    const dt = new DataTransfer();
    imagePreview
      .filter(img => img.id !== id)
      .forEach(img => dt.items.add(img.file));
    form.setValue('images', dt.files.length > 0 ? dt.files : null);
  };

  const movePreviewImage = (id: string, direction: 'up' | 'down') => {
    setImagePreview(prev => {
      const idx = prev.findIndex(img => img.id === id);
      if (idx === -1) return prev;
      
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      
      const newArray = [...prev];
      [newArray[idx], newArray[swapIdx]] = [newArray[swapIdx], newArray[idx]];
      
      // Update form with new order (outside of render)
      setTimeout(() => {
        const dt = new DataTransfer();
        newArray.forEach(img => dt.items.add(img.file));
        form.setValue('images', dt.files);
      }, 0);
      
      return newArray;
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600 mt-2">Create a new product with images, pricing, and categories</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the name of the product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={8}
                    className="min-h-[200px] resize-y"
                    placeholder="Enter detailed product description..."
                  />
                </FormControl>
                <FormDescription>Enter the description of the product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="0.00"
                    value={field.value === undefined || field.value === null ? '' : String(field.value)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === '0') {
                        field.onChange(undefined);
                        return;
                      }
                      if (/^\d*\.?\d*$/.test(value)) {
                        const parsed = parseFloat(value);
                        field.onChange(isNaN(parsed) ? undefined : parsed);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === '0') {
                        field.onChange(undefined);
                      } else if (!isNaN(parseFloat(value))) {
                        field.onChange(parseFloat(value));
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>Enter the price of the product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={field.value === undefined || field.value === null ? '' : String(field.value)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === '0') {
                        field.onChange(undefined);
                        return;
                      }
                      if (/^\d+$/.test(value)) {
                        field.onChange(parseInt(value));
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === '0') {
                        field.onChange(undefined);
                      } else if (!isNaN(parseInt(value))) {
                        field.onChange(parseInt(value));
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>Enter the available stock quantity.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categories ({field.value.length}/5)</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Select
                      value=""
                      onValueChange={(categoryId) => {
                        if (field.value.length >= 5) {
                          toast({
                            title: "Maximum categories reached",
                            description: "A product can have maximum 5 categories",
                            variant: "destructive"
                          });
                          return;
                        }
                        if (!field.value.includes(categoryId)) {
                          const category = categories.find(c => c.id.toString() === categoryId);
                          field.onChange([...field.value, categoryId]);
                          toast({
                            title: "Category added",
                            description: `${category?.name || 'Category'} has been added to this product`,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Add a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((cat) => !field.value.includes(cat.id.toString()))
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((categoryId) => {
                          const category = categories.find(c => c.id.toString() === categoryId);
                          return (
                            <Badge
                              key={categoryId}
                              variant="secondary"
                              className="flex items-center gap-1 pr-1"
                            >
                              <span>{category?.name || 'Unknown'}</span>
                              <button
                                type="button"
                                className="ml-1 rounded-sm hover:bg-destructive/20 p-0.5 transition-colors"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const categoryName = category?.name || 'Category';
                                  field.onChange(field.value.filter(id => id !== categoryId));
                                  toast({
                                    title: "Category removed",
                                    description: `${categoryName} has been removed from this product`,
                                  });
                                }}
                              >
                                <X className="h-3 w-3 hover:text-destructive" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Select up to 5 categories for this product. Click the X to remove a category.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brands"
            render={({ field }) => {
              const handleAddBrand = () => {
                const trimmedBrand = brandInput.trim();
                if (!trimmedBrand) return;
                
                const currentBrands = field.value || [];
                if (!currentBrands.includes(trimmedBrand)) {
                  field.onChange([...currentBrands, trimmedBrand]);
                  setBrandInput("");
                }
              };
              
              return (
                <FormItem>
                  <FormLabel>Brands (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input 
                          value={brandInput}
                          onChange={(e) => setBrandInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBrand();
                            }
                          }}
                          placeholder="Enter brand name"
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddBrand}
                          variant="outline"
                          className="shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                      
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((brand, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {brand}
                              <button
                                type="button"
                                className="ml-1 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  const newValue = field.value?.filter((_, i) => i !== index) || [];
                                  field.onChange(newValue);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter brand names and click Add. Click the X to remove a brand.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          {/* Image Upload Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
              <p className="text-sm text-gray-600 mt-1">Upload and arrange product images. First image will be the main display.</p>
            </div>
            
            <div className="p-6">
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <label 
                            htmlFor="file-upload" 
                            className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white font-semibold rounded-full cursor-pointer transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                            style={{ pointerEvents: loading ? 'none' : 'auto' }}
                          >
                            <span>Choose Files</span>
                          </label>
                          <span className="text-sm text-gray-600">
                            {imagePreview.length > 0 ? `${imagePreview.length} file(s) selected` : 'No file chosen'}
                          </span>
                          <input 
                            id="file-upload"
                            type="file" 
                            accept="image/jpeg,image/png,image/webp,image/gif" 
                            multiple 
                            disabled={loading}
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                const validFiles = Array.from(files).filter(file => {
                                  const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
                                  const isValidSize = file.size <= 5 * 1024 * 1024;
                                  return isValidType && isValidSize;
                                });
                                
                                if (validFiles.length !== files.length) {
                                  toast({
                                    title: "Warning",
                                    description: `${files.length - validFiles.length} file(s) skipped (invalid type or >5MB)`,
                                    variant: "destructive"
                                  });
                                }
                                
                                if (validFiles.length > 0) {
                                  // Create previews
                                  const previews = validFiles.map(file => ({
                                    file,
                                    url: URL.createObjectURL(file),
                                    id: `${Date.now()}-${Math.random()}`
                                  }));
                                  setImagePreview(previews);
                                  
                                  const dt = new DataTransfer();
                                  validFiles.forEach(file => dt.items.add(file));
                                  field.onChange(dt.files);
                                  
                                  toast({
                                    title: "Images selected",
                                    description: `${validFiles.length} image(s) ready to upload`
                                  });
                                } else {
                                  field.onChange(null);
                                  setImagePreview([]);
                                }
                              } else {
                                field.onChange(null);
                                setImagePreview([]);
                              }
                            }}
                          />
                        </div>
                        
                        {/* Image Preview Grid */}
                        {imagePreview.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                            {imagePreview.map((img, index) => (
                              <div key={img.id} className="relative group border-2 rounded-lg p-2 bg-white shadow-sm hover:shadow-md transition-all">
                                <div className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                                  <img 
                                    src={img.url} 
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                                      Main
                                    </div>
                                  )}
                                </div>
                                
                                <div className="mt-2 flex items-center justify-between gap-1">
                                  <span className="text-xs font-medium text-gray-700">#{index + 1}</span>
                                  <div className="flex gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => movePreviewImage(img.id, 'up')}
                                      disabled={index === 0}
                                      className="h-7 w-7 p-0"
                                      title="Move up"
                                    >
                                      ↑
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => movePreviewImage(img.id, 'down')}
                                      disabled={index === imagePreview.length - 1}
                                      className="h-7 w-7 p-0"
                                      title="Move down"
                                    >
                                      ↓
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removePreviewImage(img.id)}
                                      className="h-7 w-7 p-0"
                                      title="Remove"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {imagePreview.length === 0 && (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-5xl mb-3">📸</div>
                            <p className="text-sm font-medium text-gray-700">No images selected</p>
                            <p className="text-xs text-gray-500 mt-1">Choose files above to preview</p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="mt-4 text-xs">
                      <span className="font-medium">Supported:</span> JPEG, PNG, WebP, GIF • <span className="font-medium">Max size:</span> 5MB per image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Featured Product</FormLabel>
                  <FormDescription>Mark this product as featured on the homepage.</FormDescription>
                </div>
              </FormItem>
            )}
          />
          {form.watch('is_featured') && (
            <FormField
              control={form.control}
              name="featured_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Featured Display Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Leave empty for random"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          field.onChange(undefined)
                        } else {
                          const parsed = parseInt(value)
                          if (!isNaN(parsed)) {
                            field.onChange(parsed)
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Allow backspace, delete, arrow keys, tab
                        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          return
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Set exact position on homepage (1-20). Leave empty for automatic random assignment.
                    <br />
                    <span className="text-blue-600 font-medium">Layout: 5 products per row (Pos 1-5=Row 1, 6-10=Row 2, 11-15=Row 3, 16-20=Row 4)</span>
                    <br />
                    <span className="text-green-600 font-medium">Only assigned products are shown - empty positions are hidden</span>
                    <br />
                    <span className="text-amber-600 font-medium">Duplicate positions will be cleared automatically</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="is_new"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>New Product</FormLabel>
                  <FormDescription>Display a "New" badge on this product.</FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_deal"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      // Auto-populate original_price with current price when deal is checked
                      // Use queueMicrotask to avoid flushSync errors in React 19
                      if (checked) {
                        queueMicrotask(() => {
                          const currentPrice = form.getValues('price');
                          const currentOriginalPrice = form.getValues('original_price');
                          if (currentPrice && currentPrice > 0 && (!currentOriginalPrice || currentOriginalPrice === 0)) {
                            form.setValue('original_price', currentPrice);
                          }
                        });
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Deal Item</FormLabel>
                  <FormDescription>Mark this product as a deal with special pricing.</FormDescription>
                </div>
              </FormItem>
            )}
          />
          {form.watch("is_deal") && (
            <>
              <FormField
                control={form.control}
                name="original_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        inputMode="decimal"
                        placeholder="0.00"
                        value={field.value === undefined || field.value === null ? '' : String(field.value)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || value === '0') {
                            field.onChange(undefined);
                            return;
                          }
                          if (/^\d*\.?\d*$/.test(value)) {
                            const parsed = parseFloat(value);
                            field.onChange(isNaN(parsed) ? undefined : parsed);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === '' || value === '0') {
                            field.onChange(undefined);
                          } else if (!isNaN(parseFloat(value))) {
                            field.onChange(parseFloat(value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>Enter the original price before discount.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deal_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="text" 
                        inputMode="decimal"
                        placeholder="0.00"
                        value={field.value === undefined || field.value === null ? '' : String(field.value)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || value === '0') {
                            field.onChange(undefined);
                            return;
                          }
                          if (/^\d*\.?\d*$/.test(value)) {
                            const parsed = parseFloat(value);
                            field.onChange(isNaN(parsed) ? undefined : parsed);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value === '' || value === '0') {
                            field.onChange(undefined);
                          } else if (!isNaN(parseFloat(value))) {
                            field.onChange(parseFloat(value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>Enter the discounted deal price.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.push('/products')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[150px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddProductPage;
