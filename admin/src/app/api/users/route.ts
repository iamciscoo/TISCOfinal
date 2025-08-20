import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id,email,first_name,last_name,phone,avatar_url,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
