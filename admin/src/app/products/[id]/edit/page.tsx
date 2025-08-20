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
import { useState, useEffect } from "react";
import type { Category, Product, ProductImage } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(1, { message: "Product name is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  price: z.coerce.number().min(0.01, { message: "Price must be greater than 0" }),
  category_id: z.string().min(1, { message: "Category is required!" }),
  stock_quantity: z.coerce.number().min(0, { message: "Stock quantity must be 0 or greater" }),
  is_featured: z.boolean().default(false),
});

const EditProductPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category_id: "",
      stock_quantity: 0,
      is_featured: false,
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

  // Gallery helpers
  const reloadProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const json = await res.json();
      if (res.ok) {
        setProduct(json.data);
        setImages(json.data?.product_images || []);
      }
    } catch {}
  };

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const formData = new FormData();
      formData.append('productId', id);
      formData.append('is_main', 'false');
      Array.from(files).forEach((f) => formData.append('files', f));
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const j = await uploadRes.json().catch(() => ({}));
        throw new Error(j?.error || 'Image upload failed');
      }
      await reloadProduct();
      toast({ title: 'Images uploaded', description: 'Gallery updated.' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Could not upload images', variant: 'destructive' });
    }
  };

  const handleSetMain = async (imageId: string) => {
    try {
      const res = await fetch(`/api/product-images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_main: true })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to set main image');
      }
      await reloadProduct();
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message || 'Could not set main image', variant: 'destructive' });
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      const res = await fetch(`/api/product-images/${imageId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Failed to delete image');
      }
      await reloadProduct();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete image', variant: 'destructive' });
    }
  };

  const handleMove = async (imageId: string, direction: 'up' | 'down') => {
    const sorted = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.created_at.localeCompare(b.created_at));
    const idx = sorted.findIndex((i) => i.id === imageId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    try {
      // swap sort_order between a and b
      const res1 = await fetch(`/api/product-images/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: b.sort_order }) });
      const res2 = await fetch(`/api/product-images/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: a.sort_order }) });
      if (!res1.ok || !res2.ok) throw new Error('Failed to reorder');
      await reloadProduct();
    } catch (e: any) {
      toast({ title: 'Reorder failed', description: e?.message || 'Could not reorder images', variant: 'destructive' });
    }
  };

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load product");
        setProduct(json.data);
        setImages(json.data?.product_images || []);
        form.reset({
          name: json.data.name,
          description: json.data.description,
          price: json.data.price,
          category_id: json.data.category_id,
          stock_quantity: json.data.stock_quantity,
          is_featured: json.data.is_featured,
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

    fetchCategories();
    if (id) fetchProduct();
  }, [id, toast, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-3">
            <div>
              <FormLabel>Images</FormLabel>
              <div className="mt-2">
                <Input type="file" accept="image/*" multiple onChange={(e) => handleUploadImages(e.target.files)} />
                <FormDescription>Upload additional images. Use controls below to set main and reorder.</FormDescription>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={img.id} className="border rounded-md p-2 space-y-2">
                  <div className="relative w-full h-28">
                    <Image src={img.url} alt={`Image ${index + 1}`} fill sizes="200px" className="rounded-md object-cover" />
                  </div>
                  <div className="text-xs flex items-center justify-between">
                    <span className={img.is_main ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                      {img.is_main ? 'Main' : 'Gallery'}
                    </span>
                    <span>Order: {img.sort_order ?? 0}</span>
                  </div>
                  <div className="flex gap-2">
                    {!img.is_main && (
                      <Button type="button" variant="secondary" onClick={() => handleSetMain(img.id)}>Set main</Button>
                    )}
                    <Button type="button" variant="outline" onClick={() => handleMove(img.id, 'up')}>Up</Button>
                    <Button type="button" variant="outline" onClick={() => handleMove(img.id, 'down')}>Down</Button>
                    <Button type="button" variant="destructive" onClick={() => handleDelete(img.id)}>Delete</Button>
                  </div>
                </div>
              ))}
              {images.length === 0 && (
                <div className="text-sm text-muted-foreground">No images yet. Upload some above.</div>
              )}
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
                  <Input type="number" step="0.01" {...field} />
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
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Enter the available stock quantity.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Select the category of the product.</FormDescription>
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
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Product"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default EditProductPage;
