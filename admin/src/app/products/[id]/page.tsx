"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, Copy, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface ProductImage {
  id: string;
  url: string;
  is_main: boolean;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface ProductCategory {
  category: Category;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category_id: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  is_on_sale: boolean;
  sale_price?: number;
  tags?: string;
  slug?: string;
  is_deal: boolean;
  deal_price?: number;
  original_price?: number;
  categories?: ProductCategory[];
  product_images?: ProductImage[];
}

export default function ViewProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productId = params?.id as string;

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const result = await response.json();
        setProduct(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleCopyId = async () => {
    if (product?.id) {
      await navigator.clipboard.writeText(product.id);
      toast({
        title: "Copied",
        description: "Product ID copied to clipboard",
      });
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    const confirmed = window.confirm(`Delete product "${product.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.error || 'Failed to delete product');
      }
      
      toast({
        title: "Deleted",
        description: "Product deleted successfully",
      });
      
      router.push('/products');
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete product',
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-300 rounded"></div>
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
            <Button onClick={() => router.push('/products')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 space-y-6 px-4">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/products')}
            className="shrink-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCopyId} className="shrink-0">
              <Copy className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Copy ID</span>
              <span className="sm:hidden">Copy</span>
            </Button>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href={`/products/${product.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href={`http://localhost:3000/products/${product.id}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">View Live</span>
                <span className="sm:hidden">Live</span>
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="shrink-0">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold break-words">{product.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product ID</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">{product.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Slug</label>
                  <p className="text-sm">{product.slug || 'No slug'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm mt-1">{product.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Tags</label>
                <p className="text-sm mt-1">{product.tags || 'No tags'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.categories && product.categories.length > 0 ? (
                  product.categories.map((cat) => (
                    <Badge key={cat.category.id} variant="secondary">
                      {cat.category.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No categories assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.product_images && product.product_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.product_images
                    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0) || a.sort_order - b.sort_order)
                    .map((image) => (
                      <div key={image.id} className="relative">
                        <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={image.url}
                            alt="Product image"
                            fill
                            className="object-cover"
                          />
                        </div>
                        {image.is_main && (
                          <Badge className="absolute top-2 left-2" variant="default">
                            Main
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No images uploaded</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Features */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {product.is_featured && <Badge>Featured</Badge>}
                {product.is_on_sale && <Badge variant="destructive">On Sale</Badge>}
                {product.is_deal && <Badge variant="outline">Deal</Badge>}
                {product.stock_quantity === 0 && <Badge variant="secondary">Out of Stock</Badge>}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Stock Quantity:</span>
                  <span className="text-sm">{product.stock_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Rating:</span>
                  <span className="text-sm">{product.rating}/5 ({product.reviews_count} reviews)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Regular Price:</span>
                  <span className="text-sm font-semibold">{formatCurrency(product.price)}</span>
                </div>
                
                {product.is_on_sale && product.sale_price && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Sale Price:</span>
                    <span className="text-sm font-semibold text-red-600">{formatCurrency(product.sale_price)}</span>
                  </div>
                )}
                
                {product.is_deal && (
                  <>
                    {product.original_price && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Original Price:</span>
                        <span className="text-sm line-through">{formatCurrency(product.original_price)}</span>
                      </div>
                    )}
                    {product.deal_price && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Deal Price:</span>
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(product.deal_price)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm mt-1">{formatDate(product.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm mt-1">{formatDate(product.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
