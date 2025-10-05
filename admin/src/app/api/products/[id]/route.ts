import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidateTag } from 'next/cache';

export const runtime = 'nodejs';


export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_categories(
          categories(
            id,
            name,
            description
          )
        ),
        product_images(
          id,
          url,
          is_main,
          sort_order,
          created_at,
          path
        )
      `)
      .order('is_main', { ascending: false, foreignTable: 'product_images' })
      .order('sort_order', { ascending: true, foreignTable: 'product_images' })
      .order('created_at', { ascending: true, foreignTable: 'product_images' })
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const allowedFields = [
      "name",
      "description",
      "price",
      "category_id",
      "stock_quantity",
      "is_featured",
      "is_new",
      "is_deal",
      "original_price",
      "deal_price",
      "image_url",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = (body as Record<string, unknown>)[key];
    }

    // Handle category updates (both single and multiple)
    const category_ids = (body as any).category_ids;
    if (category_ids && Array.isArray(category_ids)) {
      if (category_ids.length > 5) {
        return NextResponse.json({ error: "A product cannot have more than 5 categories" }, { status: 400 });
      }
      
      if (category_ids.length > 0) {
        updates.category_id = category_ids[0]; // Keep primary category for backward compatibility
      }
    }

    if (Object.keys(updates).length === 0 && !category_ids) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    // Update product first
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update categories if provided
    if (category_ids && Array.isArray(category_ids)) {
      // Remove existing category relationships
      await supabase
        .from("product_categories")
        .delete()
        .eq("product_id", id);

      // Add new category relationships
      if (category_ids.length > 0) {
        const categoryRelationships = category_ids.map((catId: string) => ({
          product_id: id,
          category_id: catId
        }));

        const { error: categoryError } = await supabase
          .from("product_categories")
          .insert(categoryRelationships);

        if (categoryError) {
          return NextResponse.json({ error: categoryError.message }, { status: 500 });
        }
      }
    }

    // Invalidate all relevant caches to ensure frontend reflects changes
    try {
      // Core product caches
      revalidateTag('products')                    // All products listing
      revalidateTag('featured-products')          // Featured products (if is_featured changed)
      revalidateTag(`product:${id}`)             // Specific product page
      
      // Category-related caches (if categories were updated)
      if (category_ids || updates.category_id) {
        revalidateTag('categories')              // Categories list
        if (updates.category_id) {
          revalidateTag(`category:${updates.category_id}`)  // Specific category page
        }
        if (category_ids) {
          category_ids.forEach((catId: string) => {
            revalidateTag(`category:${catId}`)   // Each updated category
          })
        }
      }
      
      // Homepage cache (for featured/new products)
      if (updates.is_featured !== undefined || updates.is_new !== undefined) {
        revalidateTag('homepage')                // Homepage product sections
      }
      
      // Search and deals caches
      if (updates.is_deal !== undefined) {
        revalidateTag('deals')                   // Deals page
      }
      
      console.log('✅ Cache invalidation completed for product:', id)
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed (non-fatal):', cacheError)
      // Don't fail the update if cache invalidation fails
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    // Invalidate caches after product deletion
    try {
      revalidateTag('products')              // All products listing
      revalidateTag('featured-products')     // Featured products
      revalidateTag(`product:${id}`)        // Specific product page
      revalidateTag('categories')           // Categories (in case this was the last product in a category)
      revalidateTag('homepage')             // Homepage
      revalidateTag('deals')                // Deals page
      
      console.log('✅ Cache invalidation completed for deleted product:', id)
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed (non-fatal):', cacheError)
    }
    
    return new Response(null, { status: 204 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

