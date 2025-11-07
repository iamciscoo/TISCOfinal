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
import { useState, useEffect } from "react";
import type { Category, Product, ProductImage } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { X } from 'lucide-react';

const MAX_CATEGORIES = 5;

const formSchema = z.object({
  name: z.string().min(1, { message: "Product name is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  price: z.number().min(0.01, { message: "Price must be greater than 0" }),
  category_ids: z.array(z.string())
    .min(1, { message: "At least one category is required!" })
    .max(MAX_CATEGORIES, { message: `Maximum ${MAX_CATEGORIES} categories allowed!` }),
  stock_quantity: z.number().min(0, { message: "Stock quantity must be 0 or greater" }),
  is_featured: z.boolean().optional(),
  is_new: z.boolean().optional(),
  is_deal: z.boolean().optional(),
  featured_order: z.number().int().min(1).max(20).optional(),
  original_price: z.number().optional(),
  deal_price: z.number().optional(),
}).refine((data) => {
  if (data.is_deal) {
    return data.original_price && data.deal_price && data.original_price > data.deal_price;
  }
  return true;
}, {
  message: "When marked as deal, original price must be greater than deal price",
  path: ["deal_price"],
});

type FormData = z.infer<typeof formSchema>;

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview: string; id: string; displayOrder?: number }>>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [id, setId] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, [pendingFiles]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_ids: [],
      stock_quantity: 0,
      is_featured: false,
      is_new: false,
      is_deal: false,
      original_price: 0,
      deal_price: 0,
    },
  });

  // Gallery helpers
  const reloadProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setProduct(json.data);
        setImages(json.data?.product_images || []);
      }
    } catch {}
  };

  const handleUploadImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Store files with preview URLs and display order
    const maxOrder = Math.max(
      ...images.map(i => i.sort_order ?? 0),
      ...pendingFiles.map(p => p.displayOrder ?? 0),
      0
    );
    
    const newPending = Array.from(files).map((file, idx) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `pending-${Date.now()}-${Math.random()}`,
      displayOrder: maxOrder + idx + 1
    }));
    setPendingFiles(prev => [...prev, ...newPending]);
    
    toast({ 
      title: 'Images selected', 
      description: `${newPending.length} image(s) will be uploaded when you click Update Product` 
    });
  };

  const uploadPendingImages = async () => {
    if (pendingFiles.length === 0) return;
    
    setImageLoading(true);
    try {
      // Sort pending files by displayOrder before uploading
      const sortedPending = [...pendingFiles].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      
      // Upload each file with its position to maintain order
      const uploadPromises = sortedPending.map(async (p, index) => {
        const formData = new FormData();
        formData.append('productId', id);
        formData.append('is_main', 'false');
        formData.append('sort_order', String(p.displayOrder ?? index + 1));
        formData.append('files', p.file);
        
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const j = await uploadRes.json().catch(() => ({}));
          throw new Error(j?.error || 'Image upload failed');
        }
        return uploadRes.json();
      });
      
      await Promise.all(uploadPromises);
      
      // Clean up preview URLs
      pendingFiles.forEach(p => URL.revokeObjectURL(p.preview));
      
      // Clear pending files after successful upload
      setPendingFiles([]);
      await reloadProduct();
      
      toast({ title: 'Images uploaded', description: 'Gallery updated successfully.' });
    } catch (e: any) {
      toast({ 
        title: 'Upload failed', 
        description: e?.message || 'Could not upload images', 
        variant: 'destructive' 
      });
      throw e; // Re-throw to prevent form submission if upload fails
    } finally {
      setImageLoading(false);
    }
  };

  const removePendingFile = (pendingId: string) => {
    const toRemove = pendingFiles.find(p => p.id === pendingId);
    if (toRemove) {
      URL.revokeObjectURL(toRemove.preview);
    }
    setPendingFiles(prev => prev.filter(p => p.id !== pendingId));
    toast({ 
      title: 'File removed', 
      description: 'Pending image removed from queue' 
    });
  };

  const saveImageOrder = async () => {
    try {
      setImageLoading(true);
      const updates = images.map((img, index) => ({
        id: img.id,
        sort_order: index + 1
      }));
      
      await Promise.all(
        updates.map(update =>
          fetch(`/api/product-images/${update.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: update.sort_order })
          })
        )
      );
    } catch (e: any) {
      toast({ 
        title: 'Failed to save order', 
        description: e?.message || 'Could not save image order', 
        variant: 'destructive' 
      });
      throw e;
    } finally {
      setImageLoading(false);
    }
  };


  const handleSetMain = (imageId: string) => {
    // Optimistic update only - save on form submit
    setImages(prev => prev.map(img => ({
      ...img,
      is_main: img.id === imageId
    })));
    
    toast({ 
      title: 'Main image changed', 
      description: 'Click "Update Product" to save changes',
      duration: 2000
    });
  };

  const handleDelete = (imageId: string) => {
    if (!imageId || imageId === 'undefined' || imageId === 'null') {
      toast({ title: 'Delete failed', description: 'Invalid image ID', variant: 'destructive' });
      return;
    }
    
    // Optimistic update - mark for deletion
    setDeletedImageIds(prev => [...prev, imageId]);
    setImages(prev => prev.filter(img => img.id !== imageId));
    
    toast({ 
      title: 'Image marked for deletion', 
      description: 'Click "Update Product" to save changes',
      duration: 2000
    });
  };

  // Unified move function for both uploaded and pending images
  const handleMoveUnified = (itemId: string, direction: 'up' | 'down') => {
    // Create unified list sorted by display order
    type UnifiedItem = { id: string; type: 'uploaded' | 'pending'; data: any; position: number };
    
    const uploadedItems: UnifiedItem[] = images
      .map(img => ({ 
        id: img.id, 
        type: 'uploaded' as const, 
        data: img,
        position: img.sort_order ?? 0
      }));
    
    const pendingItems: UnifiedItem[] = pendingFiles.map(p => ({ 
      id: p.id, 
      type: 'pending' as const, 
      data: p,
      position: p.displayOrder ?? 999
    }));
    
    const allItems = [...uploadedItems, ...pendingItems]
      .sort((a, b) => a.position - b.position);
    
    const idx = allItems.findIndex(item => item.id === itemId);
    if (idx === -1) return;
    
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= allItems.length) return;
    
    // Swap items in unified list
    const reordered = [...allItems];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    
    // Assign new display orders to ALL items based on their new position
    const reorderedWithNewPositions = reordered.map((item, newIdx) => ({
      ...item,
      position: newIdx + 1
    }));
    
    // Separate back and assign proper orders
    const newUploaded = reorderedWithNewPositions
      .filter(item => item.type === 'uploaded')
      .map(item => ({ ...item.data, sort_order: item.position }));
    
    const newPending = reorderedWithNewPositions
      .filter(item => item.type === 'pending')
      .map(item => ({ ...item.data, displayOrder: item.position }));
    
    setImages(newUploaded);
    setPendingFiles(newPending);
    
    toast({ 
      title: 'Order changed', 
      description: 'Click "Update Product" to save the new order',
      duration: 2000
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories", { cache: 'no-store' });
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

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load product");
        setProduct(json.data);
        setImages(json.data?.product_images || []);
        // Extract category IDs from the product_categories structure
        // API returns: product_categories(categories(id, name, description))
        const categoryIds = json.data.product_categories?.map((productCat: any) => 
          String(productCat.categories?.id || '')
        ).filter(Boolean) || [];
        
        // **FIX: Explicitly convert booleans to ensure checkbox state persists**  
        form.reset({
          name: json.data.name || "",
          description: json.data.description || "",
          price: json.data.price || undefined,
          category_ids: categoryIds,
          stock_quantity: json.data.stock_quantity ?? undefined,
          is_featured: Boolean(json.data.is_featured),
          is_new: Boolean(json.data.is_new),
          is_deal: Boolean(json.data.is_deal),
          featured_order: json.data.featured_order ?? undefined,
          original_price: json.data.original_price || undefined,
          deal_price: json.data.deal_price || undefined,
        });
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
      }
    };

    if (id) {
      fetchCategories();
      fetchProduct();
    }
  }, [id, toast]);

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      // Delete marked images
      if (deletedImageIds.length > 0) {
        await Promise.all(
          deletedImageIds.map(imageId =>
            fetch(`/api/product-images/${imageId}`, { method: 'DELETE' })
          )
        );
        setDeletedImageIds([]);
      }

      // Save main image changes
      const mainImage = images.find(img => img.is_main);
      if (mainImage) {
        await fetch(`/api/product-images/${mainImage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_main: true })
        });
      }

      // Save image order changes to database
      if (images.length > 0) {
        await saveImageOrder();
      }

      // Upload pending images after saving order
      if (pendingFiles.length > 0) {
        await uploadPendingImages();
      }

      const productData = values;
      const payload = { ...productData };

      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Failed to update product");
      }
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      router.push('/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-2">Update product details, images, and settings</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* IMPROVED: Image Management Section with Better UI */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload and manage product images. The main image appears on product cards.
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <label 
                  htmlFor="file-upload-edit" 
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ pointerEvents: imageLoading ? 'none' : 'auto' }}
                >
                  <span>Choose Files</span>
                </label>
                <span className="text-sm text-gray-600">
                  {images.length > 0 ? `${images.length} image(s) uploaded` : 'No images yet'}
                  {pendingFiles.length > 0 && (
                    <span className="ml-2 text-amber-600 font-medium">
                      + {pendingFiles.length} pending
                    </span>
                  )}
                </span>
                <input 
                  id="file-upload-edit"
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,image/gif" 
                  multiple 
                  onChange={(e) => {
                    handleUploadImages(e.target.files)
                    // Reset input so same file can be selected again
                    e.target.value = ''
                  }}
                  disabled={imageLoading}
                  className="hidden"
                />
                {imageLoading && (
                  <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    Processing...
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">
                <span className="font-medium">Supported:</span> JPEG, PNG, WebP, GIF • <span className="font-medium">Max size:</span> 5MB per image
              </p>

              {pendingFiles.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {pendingFiles.length} image{pendingFiles.length !== 1 ? 's' : ''} pending upload
                    </p>
                    <p className="text-xs text-gray-600">
                      These images will be uploaded when you click "Update Product" below
                    </p>
                  </div>
                </div>
              )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Unified Gallery - Uploaded and Pending Images Combined */}
              {(() => {
                // Create unified array for rendering, respecting displayOrder
                const uploadedItems = images
                  .map(img => ({ 
                    type: 'uploaded' as const, 
                    data: img, 
                    position: img.sort_order ?? 0 
                  }));
                
                const pendingItems = pendingFiles.map(p => ({ 
                  type: 'pending' as const, 
                  data: p,
                  position: p.displayOrder ?? 999
                }));
                
                const allItems = [...uploadedItems, ...pendingItems]
                  .sort((a, b) => a.position - b.position);
                
                return allItems.map((item, displayIndex) => {
                  const isFirst = displayIndex === 0;
                  const isLast = displayIndex === allItems.length - 1;
                  
                  if (item.type === 'uploaded') {
                    const img = item.data;
                    return (
                <div key={img.id} className="border-2 rounded-lg p-3 space-y-3 bg-white shadow-md hover:shadow-lg transition-shadow relative">
                  <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden group">
                    <Image 
                      src={img.url} 
                      alt={`Product image ${displayIndex + 1}`} 
                      fill 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                      className="object-cover transition-all duration-300 group-hover:scale-110" 
                    />
                    {img.is_main && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                        ⭐ Main
                      </div>
                    )}
                    {imageLoading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs flex items-center justify-between text-gray-700">
                      <span className={img.is_main ? 'text-green-600 font-bold' : 'font-medium'}>
                        {img.is_main ? '⭐ Main Image' : `#${displayIndex + 1} Gallery`}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {new Date(img.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {!img.is_main && (
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleSetMain(img.id)}
                          disabled={imageLoading}
                          className="text-xs flex-1 min-w-[80px] font-medium"
                        >
                          Set Main
                        </Button>
                      )}
                      <div className="flex gap-1">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveUnified(img.id, 'up')}
                          className="text-xs px-2 h-8"
                          disabled={isFirst || imageLoading}
                          title="Move up"
                        >
                          ↑
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveUnified(img.id, 'down')}
                          className="text-xs px-2 h-8"
                          disabled={isLast || imageLoading}
                          title="Move down"
                        >
                          ↓
                        </Button>
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(img.id)}
                        disabled={imageLoading}
                        className="text-xs px-3 h-8 font-medium"
                        title="Delete image"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </div>
                    );
                  } else {
                    const pending = item.data;
                    return (
                <div key={pending.id} className="border-2 rounded-lg p-3 space-y-3 bg-white shadow-md hover:shadow-lg transition-shadow relative">
                  <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden group">
                    <img
                      src={pending.preview}
                      alt={`Pending ${displayIndex + 1}`}
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                    />
                    <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                      Pending
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs flex items-center justify-between text-gray-700">
                      <span className="font-medium">
                        #{displayIndex + 1} Gallery
                      </span>
                      <span className="text-gray-500 text-[10px] font-semibold">
                        Not uploaded
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <div className="flex gap-1 flex-1">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveUnified(pending.id, 'up')}
                          className="text-xs px-2 h-8"
                          disabled={isFirst}
                          title="Move up"
                        >
                          ↑
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveUnified(pending.id, 'down')}
                          className="text-xs px-2 h-8"
                          disabled={isLast}
                          title="Move down"
                        >
                          ↓
                        </Button>
                      </div>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removePendingFile(pending.id)}
                        className="text-xs px-3 h-8 font-medium"
                        title="Remove from queue"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </div>
                    );
                  }
                });
              })()}

              {images.length === 0 && pendingFiles.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="space-y-3">
                    <div className="text-6xl">📸</div>
                    <div className="text-base font-semibold text-gray-700">No images uploaded yet</div>
                    <div className="text-sm text-gray-500">Upload images using the file input above to get started</div>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
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
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
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
                    type="number"
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
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
                <FormLabel>Categories ({field.value.length}/{MAX_CATEGORIES})</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Select
                      onValueChange={(categoryId) => {
                        if (field.value.length >= MAX_CATEGORIES) {
                          toast({
                            title: "Maximum categories reached",
                            description: `A product can have maximum ${MAX_CATEGORIES} categories`,
                            variant: "destructive"
                          });
                          return;
                        }
                        if (!field.value.includes(categoryId)) {
                          field.onChange([...field.value, categoryId]);
                        }
                      }}
                    >
                      <SelectTrigger>
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
                              className="flex items-center gap-1"
                            >
                              {category?.name || 'Unknown'}
                              <button
                                type="button"
                                className="ml-1 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  const newValue = field.value.filter(id => id !== categoryId);
                                  field.onChange(newValue);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Select up to {MAX_CATEGORIES} categories for this product. Click the X to remove a category.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={Boolean(field.value)}
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
                    <span className="text-blue-600 font-medium">📐 Layout: 5 products per row (Pos 1-5=Row 1, 6-10=Row 2, 11-15=Row 3, 16-20=Row 4)</span>
                    <br />
                    <span className="text-green-600 font-medium">✨ Only assigned products are shown - empty positions are hidden</span>
                    <br />
                    <span className="text-amber-600 font-medium">⚠️ Duplicate positions will be cleared automatically</span>
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
                    checked={Boolean(field.value)}
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
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Deal Product</FormLabel>
                  <FormDescription>Mark this product as a deal with special pricing.</FormDescription>
                </div>
              </FormItem>
            )}
          />
          {form.watch('is_deal') && (
            <>
              <FormField
                control={form.control}
                name="original_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
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
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
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
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

