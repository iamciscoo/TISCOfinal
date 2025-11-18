import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

/**
 * GET /api/brands
 * Returns a list of unique brand names from all products
 */
export async function GET() {
  try {
    // Fetch all products with brands
    const { data: products, error } = await supabase
      .from("products")
      .select("brands")
      .not("brands", "is", null);

    if (error) {
      console.error("Error fetching brands:", error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }

    // Extract unique brands from all products
    const brandsSet = new Set<string>();
    
    products?.forEach((product) => {
      if (Array.isArray(product.brands)) {
        product.brands.forEach((brand: string) => {
          if (brand && brand.trim()) {
            brandsSet.add(brand.trim());
          }
        });
      }
    });

    // Convert to array and sort alphabetically
    const uniqueBrands = Array.from(brandsSet).sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    return NextResponse.json({
      success: true,
      data: uniqueBrands,
      count: uniqueBrands.length
    });

  } catch (error) {
    console.error("Error in brands API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
