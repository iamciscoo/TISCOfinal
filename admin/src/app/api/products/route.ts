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
        is_on_sale,
        sale_price,
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
        categories(
          id,
          name,
          description
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
    const { name, description, price, category_id, stock_quantity, is_featured, image_url, is_deal, original_price, deal_price, is_on_sale, sale_price } = body ?? {};

    if (!name || !description || typeof price !== "number" || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payload = {
      name,
      description,
      price,
      category_id,
      stock_quantity: typeof stock_quantity === "number" ? stock_quantity : 0,
      is_featured: !!is_featured,
      image_url: typeof image_url === "string" && image_url.length ? image_url : null,
      // deal/sale fields
      is_deal: !!is_deal,
      original_price: typeof original_price === 'number' ? original_price : null,
      deal_price: typeof deal_price === 'number' ? deal_price : null,
      is_on_sale: !!is_on_sale,
      sale_price: typeof sale_price === 'number' ? sale_price : null,
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
