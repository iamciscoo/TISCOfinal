import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidateTag } from 'next/cache'
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message)

    // No caching for real-time admin dashboard
    const response = NextResponse.json({ data }, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      status,
      payment_method,
      payment_status,
      shipping_address,
      notes,
      currency,
      total_amount
    } = body ?? {};

    // For guest orders, we need at least customer_name and shipping_address
    // For registered orders, we need user_id and shipping_address
    if (!shipping_address) {
      return NextResponse.json({ error: "'shipping_address' is required" }, { status: 400 });
    }

    if (!user_id && !customer_name) {
      return NextResponse.json({ error: "Either 'user_id' or 'customer_name' is required" }, { status: 400 });
    }

    const payload = {
      user_id: user_id || null,
      customer_name: customer_name || null,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      status: typeof status === "string" ? status : "pending",
      total_amount: typeof total_amount === "number" ? total_amount : 0,
      currency: typeof currency === "string" && currency.length ? currency : "TZS",
      payment_method: typeof payment_method === "string" ? payment_method : null,
      payment_status: typeof payment_status === "string" ? payment_status : "pending",
      shipping_address,
      notes: typeof notes === "string" ? notes : null,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Invalidate admin order caches and relevant entity tags
    try {
      revalidateTag('admin:orders', 'default')
      revalidateTag('orders', 'default')
      if (data?.id) revalidateTag(`order:${data.id}`, 'default')
      if (user_id) revalidateTag(`user-orders:${user_id}`, 'default')
    } catch (e) {
      console.warn('Admin revalidation warning:', e)
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
