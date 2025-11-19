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
  view_count: number;
  is_featured: boolean;
  tags?: string;
  slug?: string;
  is_deal: boolean;
  deal_price?: number;
  original_price?: number;
  brands?: string[];
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
  const [totalImageSize, setTotalImageSize] = useState<number | null>(null);

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

  // Calculate total image size
  useEffect(() => {
    if (!product?.product_images || product.product_images.length === 0) {
      setTotalImageSize(null);
      return;
    }

    const calculateTotalSize = async () => {
      try {
        const sizePromises = product.product_images!.map(async (image) => {
          try {
            const response = await fetch(image.url, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            return contentLength ? parseInt(contentLength, 10) : 0;
          } catch {
            return 0; // If fetch fails, return 0
          }
        });

        const sizes = await Promise.all(sizePromises);
        const total = sizes.reduce((sum, size) => sum + size, 0);
        setTotalImageSize(total);
      } catch (error) {
        console.error('Error calculating image sizes:', error);
        setTotalImageSize(null);
      }
    };

    calculateTotalSize();
  }, [product?.product_images]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

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
    if (!product) {
      console.error('No product to delete');
      return;
    }
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?\n\nThis will permanently delete:\n- The product\n- All product images\n- All product categories\n- All reviews\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) {
      console.log('Delete cancelled by user');
      return;
    }

    console.log(`Attempting to delete product: ${product.id} (${product.name})`);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Delete response status: ${response.status}`);
      
      // Handle 204 No Content (successful deletion)
      if (response.status === 204) {
        console.log('Product deleted successfully (204 No Content)');
        toast({
          title: "Success",
          description: `Product "${product.name}" has been deleted`,
        });
        
        // Redirect to products list
        router.push('/products');
        return;
      }
      
      // Handle other successful responses (200, etc.)
      if (response.ok) {
        console.log('Product deleted successfully');
        toast({
          title: "Success",
          description: `Product "${product.name}" has been deleted`,
        });
        
        router.push('/products');
        return;
      }
      
      // Handle error responses
      const json = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Delete failed:', json);
      throw new Error(json?.error || `Failed to delete product (Status: ${response.status})`);
      
    } catch (err) {
      console.error('Delete error:', err);
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : 'Failed to delete product. Please try again.',
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
              <Link href={`https://tiscomarket.store/products/${product.id}`} target="_blank">
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
              
              <div>
                <label className="text-sm font-medium text-gray-500">Brands</label>
                <p className="text-sm mt-1">
                  {product.brands && Array.isArray(product.brands) && product.brands.length > 0 
                    ? product.brands.join(', ') 
                    : '-'}
                </p>
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
              <CardDescription>
                {product.product_images?.length || 0} {product.product_images?.length === 1 ? 'image' : 'images'} uploaded
                {totalImageSize !== null && totalImageSize > 0 && ` • Total size: ${formatBytes(totalImageSize)}`}
              </CardDescription>
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
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Page Views:</span>
                  <span className="text-sm font-semibold text-blue-600">{(product.view_count || 0).toLocaleString()}</span>
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
