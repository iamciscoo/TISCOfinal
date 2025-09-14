import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

// GET /api/cart/[id] - Get specific cart item details
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const { data, error } = await supabase
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
          stock_quantity,
          is_active
        ),
        users(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('is_main', { ascending: false, foreignTable: 'products.product_images' })
      .order('sort_order', { ascending: true, foreignTable: 'products.product_images' })
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/cart/[id] - Update cart item quantity (admin function)
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const { quantity } = body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 });
    }

    const updates = {
      quantity,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("cart_items")
      .update(updates)
      .eq("id", id)
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
          stock_quantity,
          is_active
        )
      `)
      .order('is_main', { ascending: false, foreignTable: 'products.product_images' })
      .order('sort_order', { ascending: true, foreignTable: 'products.product_images' })
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/cart/[id] - Remove cart item (admin function)
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new Response(null, { status: 204 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
