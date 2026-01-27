import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

/**
 * DELETE /api/products/clear-all
 * Deletes ALL products from the database
 * WARNING: This is a destructive operation
 */
export async function DELETE(req: Request) {
  try {
    // Step 1: Get all product IDs
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id");

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch products", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { message: "No products to delete", deleted: 0 },
        { status: 200 }
      );
    }

    const productIds = products.map(p => p.id);
    const totalProducts = productIds.length;

    // Step 2: Delete related data in correct order (respecting foreign key constraints)

    // Process in batches to avoid URL length limits with large IN() filters
    const BATCH_SIZE = 200;
    const chunks: any[][] = [];
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      chunks.push(productIds.slice(i, i + BATCH_SIZE));
    }

    // 2a. Delete product_categories junction table entries (batched)
    for (const ids of chunks) {
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .in("product_id", ids);
      if (error) {
        console.error("Error deleting product_categories batch:", error);
        return NextResponse.json(
          { error: "Failed to delete product categories", details: error.message },
          { status: 500 }
        );
      }
    }

    // 2b. Delete product_images (batched)
    for (const ids of chunks) {
      const { error } = await supabase
        .from("product_images")
        .delete()
        .in("product_id", ids);
      if (error) {
        console.error("Error deleting product_images batch:", error);
        return NextResponse.json(
          { error: "Failed to delete product images", details: error.message },
          { status: 500 }
        );
      }
    }

    // 2c. Handle order_items - Set product_id to NULL instead of deleting (batched)
    for (const ids of chunks) {
      const { error } = await supabase
        .from("order_items")
        .update({ product_id: null })
        .in("product_id", ids);
      if (error) {
        console.error("Error updating order_items batch:", error);
        return NextResponse.json(
          { error: "Failed to update order items", details: error.message },
          { status: 500 }
        );
      }
    }

    // 2d. Delete reviews (batched; tolerate absence)
    for (const ids of chunks) {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .in("product_id", ids);
      if (error) {
        console.error("Error deleting reviews batch:", error);
        // Continue anyway - reviews table might not exist or be empty
        break;
      }
    }

    // Step 3: Delete all products (batched)
    for (const ids of chunks) {
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", ids);
      if (error) {
        console.error("Error deleting products batch:", error);
        return NextResponse.json(
          { error: "Failed to delete products", details: error.message },
          { status: 500 }
        );
      }
    }

    console.log(`✅ Successfully deleted ${totalProducts} products and related data`);

    return NextResponse.json(
      {
        message: "All products deleted successfully",
        deleted: totalProducts,
        details: {
          products: totalProducts,
          note: "Order history preserved with product references set to null"
        }
      },
      { status: 200 }
    );

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    console.error("Clear all products error:", message);
    return NextResponse.json(
      { error: "Failed to clear products", details: message },
      { status: 500 }
    );
  }
}
