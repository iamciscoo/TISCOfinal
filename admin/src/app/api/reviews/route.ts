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
        reviewer_name,
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
    const { product_id, user_id, reviewer_name, rating, comment, title } = body ?? {};

    console.log('🎯 Admin API - Review POST received:', {
      product_id,
      user_id: user_id || 'empty',
      reviewer_name: reviewer_name || 'empty',
      rating
    });

    // Validate required fields
    if (!product_id || !rating) {
      return NextResponse.json({ error: "Product ID and rating are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Normalize empty strings to null
    const normalizedUserId = user_id && typeof user_id === 'string' && user_id.trim().length > 0 ? user_id.trim() : null;
    const normalizedReviewerName = reviewer_name && typeof reviewer_name === 'string' && reviewer_name.trim().length > 0 ? reviewer_name.trim() : null;

    // Either user_id OR reviewer_name must be provided
    if (!normalizedUserId && !normalizedReviewerName) {
      console.error('❌ Neither user_id nor reviewer_name provided');
      return NextResponse.json({ 
        error: "Either select a user or provide a reviewer name" 
      }, { status: 400 });
    }

    console.log('✅ Normalized:', { normalizedUserId, normalizedReviewerName });

    // Prevent duplicate review for same product and user (only if user_id is provided)
    if (normalizedUserId) {
      const { data: existing, error: existingErr } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', product_id)
        .eq('user_id', normalizedUserId)
        .maybeSingle()
      if (existingErr && existingErr.code !== 'PGRST116') {
        return NextResponse.json({ error: existingErr.message }, { status: 500 });
      }
      if (existing) {
        return NextResponse.json({ error: 'User already reviewed this product' }, { status: 409 });
      }
    }

    // Check if 'is_approved' column exists
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
      user_id: normalizedUserId,
      reviewer_name: normalizedReviewerName,
      rating,
      comment: comment || null,
      title: title || null,
    }
    if (hasIsApproved) insertPayload.is_approved = true

    console.log('📝 Inserting review:', insertPayload);

    const { data, error } = await supabase
      .from("reviews")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Review created successfully!');

    // Update product aggregates after creating review
    await updateProductRating(product_id)

    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    console.error('❌ Unexpected error:', e);
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

