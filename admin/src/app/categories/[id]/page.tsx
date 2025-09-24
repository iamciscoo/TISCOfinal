import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface CategoryDetailsData {
  category: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    productCount: number;
  };
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    stock_quantity?: number;
    is_featured: boolean;
    is_deal: boolean;
    deal_price?: number;
    original_price?: number;
    rating?: number;
    reviews_count?: number;
    created_at: string;
    updated_at: string;
  }>;
}

async function getCategoryDetails(id: string): Promise<CategoryDetailsData | null> {
  try {
    // Fetch category details
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (categoryError) {
      console.error("Category fetch error:", categoryError);
      return null;
    }

    // Fetch products in this category
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        stock_quantity,
        is_featured,
        is_deal,
        deal_price,
        original_price,
        rating,
        reviews_count,
        created_at,
        updated_at
      `)
      .eq("category_id", id)
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("Products fetch error:", productsError);
      return null;
    }

    return {
      category: {
        ...category,
        productCount: products?.length || 0
      },
      products: products || []
    };
  } catch (error) {
    console.error("Error fetching category details:", error);
    return null;
  }
}

export default async function CategoryDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const data = await getCategoryDetails(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { category, products } = data;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href="/categories">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Link>
          </Button>
          <Button variant="outline" asChild className="shrink-0">
            <Link href={`/categories/${category.id}/edit`}>
              Edit Category
            </Link>
          </Button>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold break-words">{category.name}</h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{category.description}</p>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{category.productCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.is_featured).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {new Date(category.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products in {category.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products in this category yet.</p>
              <Button asChild className="mt-4">
                <Link href="/products/new">Add First Product</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square relative bg-gray-100">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {product.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          Featured
                        </Badge>
                      )}
                      {product.is_deal && (
                        <Badge variant="destructive" className="text-xs">
                          Deal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold">
                          TZS {product.deal_price || product.price}
                        </span>
                        {product.is_deal && product.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            TZS {product.original_price}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {product.stock_quantity || 0}
                      </div>
                    </div>
                    {product.rating && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium ml-1">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews_count || 0} reviews)
                        </span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      asChild
                    >
                      <Link href={`/products/${product.id}`}>
                        View Product
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
