import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

// GET /api/cart - Get all cart items with user and product details
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const limit = url.searchParams.get('limit');

    let query = supabase
      .from("cart_items")
      .select(`
        *,
        products(
          id,
          name,
          price,
          image_url,
          product_images(
            url,
            is_main,
            sort_order
          ),
          stock_quantity
        ),
        users(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .order('is_main', { ascending: false, foreignTable: 'products.product_images' })
      .order('sort_order', { ascending: true, foreignTable: 'products.product_images' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(Math.min(limitNum, 100));
      }
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/cart - Clear cart items (admin function)
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: "user_id parameter is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq('user_id', userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Cart cleared successfully" }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
