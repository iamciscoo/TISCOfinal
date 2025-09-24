import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Fetch category details
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", categoryId)
      .single();

    if (categoryError) {
      if (categoryError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: categoryError.message },
        { status: 500 }
      );
    }

    // Fetch products in this category
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        stock_quantity,
        is_featured,
        is_deal,
        deal_price,
        original_price,
        rating,
        reviews_count,
        created_at,
        updated_at
      `)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (productsError) {
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      );
    }

    // Get product count
    const productCount = products?.length || 0;

    return NextResponse.json({
      data: {
        category: {
          ...category,
          productCount
        },
        products: products || []
      }
    });

  } catch (error) {
    console.error("Category details error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
