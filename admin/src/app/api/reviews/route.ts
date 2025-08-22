import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const rating = searchParams.get('rating')
    
    const offset = (page - 1) * limit

    let query = supabase
      .from("reviews")
      .select(`
        *,
        user:users(*),
        product:products(name, image_url)
      `, { count: 'exact' })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`comment.ilike.%${search}%,title.ilike.%${search}%`)
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating))
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      reviews: data,
      totalCount: count,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, user_id, rating, comment } = body ?? {};

    if (!product_id || !user_id || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if 'is_approved' column exists; include it only if present
    let hasIsApproved = true
    {
      const { error: colErr } = await supabase
        .from('reviews')
        .select('is_approved')
        .limit(1)
      if (colErr) {
        hasIsApproved = false
      }
    }

    const insertPayload: any = {
      product_id,
      user_id,
      rating,
      comment: comment || null,
    }
    if (hasIsApproved) insertPayload.is_approved = false

    const { data, error } = await supabase
      .from("reviews")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
