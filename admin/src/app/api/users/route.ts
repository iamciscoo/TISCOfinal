import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qRaw = url.searchParams.get("q") || "";
    const q = qRaw.trim();
    const limitParam = url.searchParams.get("limit");
    const limitNum = limitParam ? Number(limitParam) : undefined;
    const limit = typeof limitNum === "number" && !Number.isNaN(limitNum)
      ? Math.max(1, Math.min(50, limitNum))
      : undefined;

    let query = supabase
      .from("users")
      .select("id,email,first_name,last_name,phone,avatar_url,created_at,updated_at");

    if (q) {
      const like = `%${q}%`;
      query = query.or(`email.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`);
    }

    query = query.order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
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
    const { email, full_name, first_name, last_name, phone, avatar_url, id } = body ?? {};

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "'email' is required" }, { status: 400 });
    }

    let f = first_name as string | undefined;
    let l = last_name as string | undefined;

    if (!f && !l && typeof full_name === "string" && full_name.trim().length > 0) {
      const parts = full_name.trim().split(" ");
      f = parts.shift();
      l = parts.length ? parts.join(" ") : undefined;
    }

    const payload = {
      id: typeof id === "string" && id.length ? id : crypto.randomUUID(),
      email,
      first_name: f,
      last_name: l,
      phone: typeof phone === "string" ? phone : undefined,
      avatar_url: typeof avatar_url === "string" ? avatar_url : undefined,
    } as const;

    const { data, error } = await supabase
      .from("users")
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
