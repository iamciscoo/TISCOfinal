import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { updateProductRating } from "@/lib/reviews";
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
        product:products(name, image_url, price)
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
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, user_id, rating, comment, title } = body ?? {};

    if (!product_id || !user_id || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Prevent duplicate review for same product and user
    {
      const { data: existing, error: existingErr } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', product_id)
        .eq('user_id', user_id)
        .maybeSingle()
      if (existingErr && existingErr.code !== 'PGRST116') {
        // Unexpected error (ignore no rows error code)
        return NextResponse.json({ error: existingErr.message }, { status: 500 });
      }
      if (existing) {
        return NextResponse.json({ error: 'User already reviewed this product' }, { status: 409 });
      }
    }

    // Check if 'is_approved' column exists; include it and auto-approve only if present
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

    const insertPayload: Record<string, unknown> = {
      product_id,
      user_id,
      rating,
      comment: comment || null,
      title: title || null,
    }
    if (hasIsApproved) insertPayload.is_approved = true

    const { data, error } = await supabase
      .from("reviews")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update product aggregates after creating (auto-approved) review
    await updateProductRating(product_id)

    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

