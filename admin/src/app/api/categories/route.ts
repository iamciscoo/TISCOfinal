import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description } = body ?? {};

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "'name' is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
