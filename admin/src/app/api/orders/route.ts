import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, status, payment_method, payment_status, shipping_address, notes, currency, total_amount } = body ?? {};

    if (!user_id || !shipping_address) {
      return NextResponse.json({ error: "'user_id' and 'shipping_address' are required" }, { status: 400 });
    }

    const payload = {
      user_id,
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
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
