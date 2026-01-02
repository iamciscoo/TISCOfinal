import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidateTag } from 'next/cache'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/orders/[id]/items - Create order items
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.price === undefined) {
        return NextResponse.json(
          { error: "Each item must have product_id, quantity, and price" },
          { status: 400 }
        );
      }
    }

    // Insert all order items
    const { data, error } = await supabase
      .from("order_items")
      .insert(items)
      .select();

    if (error) {
      console.error('Error creating order items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate order caches
    try {
      revalidateTag('admin:orders', 'default')
      revalidateTag('orders', 'default')
      revalidateTag(`order:${orderId}`, 'default')
    } catch (e) {
      console.warn('Revalidation warning:', e)
    }

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    console.error('Order items creation error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
