import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { updateProductRating } from "@/lib/reviews";
export const runtime = 'nodejs';


export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        user:users(*),
        product:products(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json().catch(() => ({} as Partial<{ is_approved: boolean; comment: string; rating: number } >));
    const { is_approved, comment, rating } = body;

    const updateData: Record<string, unknown> = {};
    
    if (typeof is_approved === 'boolean') {
      updateData.is_approved = is_approved;
    }
    
    if (comment !== undefined) {
      updateData.comment = comment;
    }
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
      }
      updateData.rating = rating;
    }

    // Schema guard: if updating approval, ensure column exists
    if (Object.prototype.hasOwnProperty.call(updateData, 'is_approved')) {
      const { error: approvalColError } = await supabase
        .from('reviews')
        .select('is_approved')
        .limit(1)
      if (approvalColError) {
        return NextResponse.json(
          { error: "Approval not supported: 'is_approved' column missing in reviews table" },
          { status: 400 }
        );
      }
    }

    const { id } = await context.params
    const { data, error } = await supabase
      .from("reviews")
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Recompute product aggregates after update
    if (data.product_id) {
      await updateProductRating(data.product_id)
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { data, error } = await supabase
      .from("reviews")
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Update product aggregates after deletion
    if (data.product_id) {
      await updateProductRating(data.product_id)
    }

    return NextResponse.json({ message: "Review deleted successfully" }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
