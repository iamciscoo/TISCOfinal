import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    
    // **NO-CACHE HEADERS: Prevent browser/CDN caching for real-time updates**
    return NextResponse.json({ data }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
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
      "featured_order",
      "brands",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = (body as Record<string, unknown>)[key];
    }

    // **HANDLE FEATURED ORDER DUPLICATES**
    // If featured_order is being updated, clear any existing product with the same order (except this one)
    const featured_order = (body as any).featured_order;
    if (featured_order && typeof featured_order === 'number') {
      await supabase
        .from('products')
        .update({ featured_order: null })
        .eq('featured_order', featured_order)
        .neq('id', id); // Don't clear this product itself
      // Note: Error is ignored - if no other product has this order, that's fine
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

    // **CACHING DISABLED - No cache invalidation needed**
    // Products now always fetch fresh data for instant updates
    console.log('✅ Product updated successfully - no cache invalidation needed (caching disabled):', id)

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    console.log(`[DELETE] Starting deletion process for product: ${id}`);
    
    if (!id) {
      console.error('[DELETE] Missing product ID parameter');
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    // **STEP 0: Verify product exists**
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single();

    if (checkError || !existingProduct) {
      console.error('[DELETE] Product not found:', id);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log(`[DELETE] Found product: ${existingProduct.name} (${id})`);

    // **STEP 1: Fetch product images before deletion**
    console.log('[DELETE] Fetching product images...');
    const { data: images, error: fetchError } = await supabase
      .from('product_images')
      .select('id, url, path')
      .eq('product_id', id);

    if (fetchError) {
      console.error('[DELETE] Error fetching product images:', fetchError.message);
      // Continue with deletion anyway
    } else {
      console.log(`[DELETE] Found ${images?.length || 0} images to delete`);
    }

    // **STEP 2: Delete images from storage (if any exist)**
    if (images && images.length > 0) {
      const imagePaths = images
        .map(img => {
          // Try path field first, then extract from URL
          if (img.path) return img.path;
          if (img.url) return extractPathFromUrl(img.url);
          return null;
        })
        .filter((path): path is string => Boolean(path));

      console.log(`[DELETE] Extracted ${imagePaths.length} storage paths from ${images.length} images`);

      if (imagePaths.length > 0) {
        try {
          console.log('[DELETE] Deleting images from storage:', imagePaths);
          const { error: storageError } = await supabase.storage
            .from('product-images')
            .remove(imagePaths);

          if (storageError) {
            console.error('[DELETE] Error deleting product images from storage:', storageError.message);
            // Continue with product deletion even if storage cleanup fails
          } else {
            console.log(`✅ [DELETE] Deleted ${imagePaths.length} images from storage for product ${id}`);
          }
        } catch (storageException) {
          console.error('[DELETE] Exception during storage deletion:', storageException);
          // Continue with product deletion
        }
      } else {
        console.warn(`⚠️ [DELETE] No valid image paths extracted for product ${id}`);
      }
    } else {
      console.log(`ℹ️ [DELETE] No images to delete for product ${id}`);
    }

    // **STEP 3: Delete product (cascades to product_images, product_categories, and reviews via FK)**
    console.log('[DELETE] Deleting product from database...');
    const { error: deleteError, count } = await supabase
      .from("products")
      .delete({ count: 'exact' })
      .eq("id", id);

    if (deleteError) {
      console.error('[DELETE] Error deleting product:', deleteError);
      return NextResponse.json({ 
        error: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint
      }, { status: 500 });
    }
    
    console.log(`✅ [DELETE] Product deleted successfully. Rows affected: ${count}`);
    console.log(`✅ [DELETE] Cascaded deletion of related records (images, categories, reviews) completed`);
    
    return new Response(null, { status: 204 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    console.error('[DELETE] Unexpected error during product deletion:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper function to extract storage path from Supabase URL
function extractPathFromUrl(url: string): string | null {
  try {
    // Format: https://{project}.supabase.co/storage/v1/object/public/product-images/{path}
    const match = url.match(/\/product-images\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

