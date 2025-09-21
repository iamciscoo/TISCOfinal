import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // First, check if junction table has any data
    const { data: existingData, error: checkError } = await supabase
      .from('product_categories')
      .select('product_id')
      .limit(1)

    if (checkError) {
      console.error('Error checking junction table:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingData && existingData.length > 0) {
      return NextResponse.json({ 
        message: 'Junction table already populated', 
        count: 0 
      })
    }

    // Get all products with their category_id
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, category_id')
      .not('category_id', 'is', null)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        message: 'No products with categories found', 
        count: 0 
      })
    }

    // Insert into junction table
    const junctionData = products.map(product => ({
      product_id: product.id,
      category_id: product.category_id
    }))

    const { data: insertData, error: insertError } = await supabase
      .from('product_categories')
      .insert(junctionData)
      .select()

    if (insertError) {
      console.error('Error inserting junction data:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Junction table populated successfully', 
      count: insertData?.length || 0,
      products: products.length
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
