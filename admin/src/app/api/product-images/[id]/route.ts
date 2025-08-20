import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as Record<string, any>));

    const allowedFields = [
      "is_main",
      "sort_order",
    ] as const;

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key as keyof typeof body];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // If setting is_main to true, first unset all other main images for this product
    if (updates.is_main === true) {
      // Get the product_id for this image first
      const { data: imageData, error: imageError } = await supabase
        .from("product_images")
        .select("product_id")
        .eq("id", id)
        .single();

      if (imageError) {
        return NextResponse.json({ error: imageError.message }, { status: 500 });
      }

      // Unset all other main images for this product
      await supabase
        .from("product_images")
        .update({ is_main: false })
        .eq("product_id", imageData.product_id)
        .neq("id", id);

      // Also update the main products table image_url
      const { data: updatedImage, error: updateError } = await supabase
        .from("product_images")
        .select("url")
        .eq("id", id)
        .single();

      if (!updateError && updatedImage) {
        await supabase
          .from("products")
          .update({ image_url: updatedImage.url })
          .eq("id", imageData.product_id);
      }
    }

    const { data, error } = await supabase
      .from("product_images")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    // Get image info before deletion
    const { data: imageData, error: imageError } = await supabase
      .from("product_images")
      .select("product_id, is_main, path")
      .eq("id", id)
      .single();

    if (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 500 });
    }

    // Delete from storage if path exists
    if (imageData.path) {
      await supabase.storage
        .from('product_images')
        .remove([imageData.path]);
    }

    // Delete from database
    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If this was the main image, set another image as main or clear products.image_url
    if (imageData.is_main) {
      const { data: remainingImages, error: remainingError } = await supabase
        .from("product_images")
        .select("id, url")
        .eq("product_id", imageData.product_id)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (!remainingError && remainingImages && remainingImages.length > 0) {
        // Set the first remaining image as main
        await supabase
          .from("product_images")
          .update({ is_main: true })
          .eq("id", remainingImages[0].id);

        await supabase
          .from("products")
          .update({ image_url: remainingImages[0].url })
          .eq("id", imageData.product_id);
      } else {
        // No remaining images, clear the main image
        await supabase
          .from("products")
          .update({ image_url: null })
          .eq("id", imageData.product_id);
      }
    }

    return NextResponse.json(null, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
