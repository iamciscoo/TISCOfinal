import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

// Bulk assign categories to multiple products
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_ids, category_ids, action = 'replace' } = body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({ error: "product_ids must be a non-empty array" }, { status: 400 });
    }

    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return NextResponse.json({ error: "category_ids must be a non-empty array" }, { status: 400 });
    }

    if (category_ids.length > 5) {
      return NextResponse.json({ error: "Cannot assign more than 5 categories to a product" }, { status: 400 });
    }

    if (!['replace', 'add', 'remove'].includes(action)) {
      return NextResponse.json({ error: "action must be 'replace', 'add', or 'remove'" }, { status: 400 });
    }

    const results = [];
    
    for (const product_id of product_ids) {
      try {
        if (action === 'replace') {
          // Remove existing categories
          await supabase
            .from("product_categories")
            .delete()
            .eq("product_id", product_id);

          // Add new categories
          const categoryRelationships = category_ids.map((category_id: string) => ({
            product_id,
            category_id
          }));

          const { error: insertError } = await supabase
            .from("product_categories")
            .insert(categoryRelationships);

          if (insertError) throw insertError;

          // Update primary category for backward compatibility
          await supabase
            .from("products")
            .update({ category_id: category_ids[0] })
            .eq("id", product_id);

        } else if (action === 'add') {
          // Check current category count
          const { count } = await supabase
            .from("product_categories")
            .select("*", { count: 'exact', head: true })
            .eq("product_id", product_id);

          if ((count || 0) + category_ids.length > 5) {
            throw new Error(`Would exceed 5 category limit for product ${product_id}`);
          }

          // Add only new categories (avoid duplicates)
          const { data: existing } = await supabase
            .from("product_categories")
            .select("category_id")
            .eq("product_id", product_id);

          const existingCategoryIds = existing?.map(e => e.category_id) || [];
          const newCategoryIds = category_ids.filter((id: string) => !existingCategoryIds.includes(id));

          if (newCategoryIds.length > 0) {
            const categoryRelationships = newCategoryIds.map((category_id: string) => ({
              product_id,
              category_id
            }));

            const { error: insertError } = await supabase
              .from("product_categories")
              .insert(categoryRelationships);

            if (insertError) throw insertError;
          }

        } else if (action === 'remove') {
          // Remove specified categories
          const { error: deleteError } = await supabase
            .from("product_categories")
            .delete()
            .eq("product_id", product_id)
            .in("category_id", category_ids);

          if (deleteError) throw deleteError;

          // Update primary category if it was removed
          const { data: remainingCategories } = await supabase
            .from("product_categories")
            .select("category_id")
            .eq("product_id", product_id)
            .limit(1);

          const newPrimaryCategory = remainingCategories?.[0]?.category_id || null;
          await supabase
            .from("products")
            .update({ category_id: newPrimaryCategory })
            .eq("id", product_id);
        }

        results.push({ product_id, success: true });
      } catch (error) {
        results.push({ 
          product_id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: errorCount === 0,
      message: `Updated ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      results
    }, { status: 200 });

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
