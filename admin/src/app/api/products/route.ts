import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_images(*)
      `)
      .order("created_at", { ascending: false })
      .order('sort_order', { ascending: true, foreignTable: 'product_images' })
      .order('created_at', { ascending: true, foreignTable: 'product_images' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, category_id, stock_quantity, is_featured, image_url, is_deal, original_price, deal_price } = body ?? {};

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
      // deal fields
      is_deal: !!is_deal,
      original_price: typeof original_price === 'number' ? original_price : null,
      deal_price: typeof deal_price === 'number' ? deal_price : null,
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
