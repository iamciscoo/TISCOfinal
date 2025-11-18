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
      ? Math.max(1, Math.min(500, limitNum))  // Increased to 500 for admin
      : 100; // Default 100 products, max 500 for admin dashboard

    // Build count query with same filters
    let countQuery = supabase
      .from("products")
      .select('*', { count: 'exact', head: true });  // Get count only

    if (q) {
      const like = `%${q}%`;
      countQuery = countQuery.ilike('name', like);
    }

    // Build data query
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
        is_active,
        deal_price,
        original_price,
        rating,
        reviews_count,
        view_count,
        brands,
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
          category_id,
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

    // Execute count and data queries in parallel
    const [{ count: total, error: countError }, { data, error }] = await Promise.all([
      countQuery,
      query
    ]);

    if (countError) {
      console.error('[Admin Products API] Count query failed:', countError);
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // No caching for admin dashboard - need real-time view counts
    const response = NextResponse.json({ 
      success: true,
      data,
      pagination: {
        total: total || 0,
        count: data?.length || 0,
        limit,
        hasMore: (data?.length || 0) >= limit
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, category_ids, category_id, brands, stock_quantity, is_featured, is_new, image_url, is_deal, original_price, deal_price, featured_order } = body ?? {};

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

    // **HANDLE FEATURED ORDER DUPLICATES**
    // If featured_order is provided, clear any existing product with the same order
    if (featured_order && typeof featured_order === 'number') {
      await supabase
        .from('products')
        .update({ featured_order: null })
        .eq('featured_order', featured_order);
      // Note: Error is ignored - if no product has this order, that's fine
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
      featured_order: typeof featured_order === 'number' ? featured_order : null,
      // deal/sale fields
      is_deal: !!is_deal,
      original_price: typeof original_price === 'number' ? original_price : null,
      deal_price: typeof deal_price === 'number' ? deal_price : null,
      // brands as simple array
      brands: Array.isArray(brands) ? brands : [],
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

    // **CACHING DISABLED - No cache invalidation needed**
    // Products now always fetch fresh data for instant updates
    console.log('✅ Product created successfully - no cache invalidation needed (caching disabled):', product.id)

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
