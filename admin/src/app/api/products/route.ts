import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = url.searchParams.get('q') || '';
    const q = qRaw.trim();
    const limitParam = url.searchParams.get('limit');
    const limitNum = limitParam ? Number(limitParam) : undefined;
    const limit = typeof limitNum === 'number' && !Number.isNaN(limitNum)
      ? Math.max(1, Math.min(50, limitNum))
      : 20; // Default limit for better performance

    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        stock_quantity,
        is_featured,
        is_new,
        is_deal,
        deal_price,
        original_price,
        rating,
        reviews_count,
        created_at,
        updated_at,
        product_images(
          id,
          url,
          is_main,
          sort_order,
          created_at
        ),
        product_categories(
          categories(
            id,
            name,
            description
          )
        )
      `);

    if (q) {
      const like = `%${q}%`;
      query = query.ilike('name', like);
    }

    // Optimize ordering for better performance
    query = query
      .order("is_featured", { ascending: false })  // Featured products first
      .order("created_at", { ascending: false })
      .order('is_main', { ascending: false, foreignTable: 'product_images' })
      .order('sort_order', { ascending: true, foreignTable: 'product_images' });

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Add cache headers for better performance
    const response = NextResponse.json({ data }, { status: 200 });
    response.headers.set('Cache-Control', 'private, max-age=300'); // 5 minutes cache
    return response;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, category_ids, category_id, stock_quantity, is_featured, is_new, image_url, is_deal, original_price, deal_price } = body ?? {};

    if (!name || !description || typeof price !== "number") {
      return NextResponse.json({ error: "Missing required fields: name, description, price" }, { status: 400 });
    }

    // Handle both single category (legacy) and multiple categories (new)
    const categories = category_ids || (category_id ? [category_id] : []);
    
    if (categories.length === 0) {
      return NextResponse.json({ error: "At least one category is required" }, { status: 400 });
    }

    if (categories.length > 5) {
      return NextResponse.json({ error: "A product cannot have more than 5 categories" }, { status: 400 });
    }

    const payload = {
      name,
      description,
      price,
      category_id: categories[0], // Keep primary category for backward compatibility
      stock_quantity: typeof stock_quantity === "number" ? stock_quantity : 0,
      is_featured: !!is_featured,
      is_new: !!is_new,
      image_url: typeof image_url === "string" && image_url.length ? image_url : null,
      // deal/sale fields
      is_deal: !!is_deal,
      original_price: typeof original_price === 'number' ? original_price : null,
      deal_price: typeof deal_price === 'number' ? deal_price : null,
    };

    // Create product first
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });

    // Add category relationships
    const categoryRelationships = categories.map((catId: string) => ({
      product_id: product.id,
      category_id: catId
    }));

    const { error: categoryError } = await supabase
      .from("product_categories")
      .insert(categoryRelationships);

    if (categoryError) {
      // Clean up the created product if category assignment fails
      await supabase.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }

    // **FIX: Invalidate client-side cache using dedicated cache invalidation API**
    try {
      const clientBaseUrl = process.env.CLIENT_BASE_URL || process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'
      
      console.log('🔄 Starting REAL-TIME client cache invalidation for new product:', product.id)
      
      const invalidateClientCache = async () => {
        try {
          // Build list of server cache tags to invalidate for new product
          const tagsToInvalidate = [
            'products',              // Main products listing  
            'featured-products',     // Featured products (in case this is featured)
            'homepage'               // Homepage (might show new products)
          ]

          // Build list of client cache keys to invalidate
          const clientCacheKeysToInvalidate = [
            'products:all',
            'products:9',
            'products:20',
            'featured:all',
            'featured:9',
            'featured:6'
          ]

          // Add category-specific cache tags
          if (payload.category_id) {
            tagsToInvalidate.push('categories')
            tagsToInvalidate.push(`category:${payload.category_id}`)
            clientCacheKeysToInvalidate.push(`products:category:${payload.category_id}`)
          }

          // Add deals cache if this is a deal product
          if (payload.is_deal) {
            tagsToInvalidate.push('deals')
          }

          console.log('🏷️ Server cache tags to invalidate for new product:', tagsToInvalidate)
          console.log('🔑 Client cache keys to invalidate for new product:', clientCacheKeysToInvalidate)

          // Call the dedicated cache invalidation API with BOTH server and client cache
          const response = await fetch(`${clientBaseUrl}/api/cache/invalidate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tags: tagsToInvalidate,
              cacheKeys: clientCacheKeysToInvalidate,
              source: 'admin-product-create'
            })
          })

          if (!response.ok) {
            throw new Error(`Cache invalidation API returned ${response.status}: ${await response.text()}`)
          }

          const result = await response.json()
          console.log('🎉 Client cache invalidation result for new product:', result)

        } catch (clientCacheError) {
          console.error('💥 Client cache invalidation failed:', clientCacheError)
        }
      }

      // Run client cache invalidation IMMEDIATELY for real-time sync
      await invalidateClientCache()
    } catch (e) {
      console.warn('⚠️ Client cache invalidation setup failed (non-fatal):', e)
    }

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
