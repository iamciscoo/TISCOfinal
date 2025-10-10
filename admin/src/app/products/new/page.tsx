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
import { useState, useEffect } from "react";
import type { Category } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(1, { message: "Product name is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  price: z.number().min(0.01, { message: "Price must be greater than 0" }),
  category_ids: z.array(z.string()).min(1, { message: "At least one category is required!" }).max(5, { message: "Maximum 5 categories allowed!" }),
  stock_quantity: z.number().min(0, { message: "Stock quantity must be 0 or greater" }),
  is_featured: z.boolean(),
  is_new: z.boolean(),
  is_deal: z.boolean(),
  featured_order: z.number().int().min(1).optional(),
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
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    shouldUnregister: true,
    defaultValues: {
      name: "",
      description: "",
      price: undefined as any,
      category_ids: [],
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

  return (
    <div className="p-6">      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
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
                  <Textarea {...field} />
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
                <FormLabel>Categories ({field.value.length}/5)</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Select
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
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => {
                                  field.onChange(field.value.filter(id => id !== categoryId));
                                }}
                              />
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
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Images</FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,image/gif" 
                    multiple 
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        // Validate file types and sizes before setting
                        const validFiles = Array.from(files).filter(file => {
                          const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
                          const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
                          return isValidType && isValidSize;
                        });
                        
                        if (validFiles.length !== files.length) {
                          toast({
                            title: "Warning",
                            description: `${files.length - validFiles.length} file(s) were skipped (invalid type or size > 5MB)`,
                            variant: "destructive"
                          });
                        }
                        
                        if (validFiles.length > 0) {
                          // Convert back to FileList-like object
                          const dt = new DataTransfer();
                          validFiles.forEach(file => dt.items.add(file));
                          field.onChange(dt.files);
                        } else {
                          field.onChange(null);
                        }
                      } else {
                        field.onChange(null);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Upload one or more images (JPEG, PNG, WebP, GIF). Max 5MB each. The first will be set as the main image.
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
                      placeholder="1"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Set display order on homepage (1=first, 2=second, etc). Leave empty to order by creation date.
                    <br />
                    <span className="text-amber-600 font-medium">Note: If another product has this number, it will be cleared automatically.</span>
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
                    onCheckedChange={field.onChange}
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
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AddProductPage;
