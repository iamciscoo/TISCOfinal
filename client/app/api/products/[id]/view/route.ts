import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

/**
 * POST /api/products/[id]/view
 * Increments the view count for a product
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Increment view count atomically using SQL
    const { error } = await supabase.rpc('increment_product_view_count', {
      product_id: id
    })

    if (error) {
      // If the RPC function doesn't exist, fall back to manual update
      console.warn('[API] RPC function not found, using manual update:', error)
      
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('view_count')
        .eq('id', id)
        .single()

      if (fetchError || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ view_count: (product.view_count || 0) + 1 })
        .eq('id', id)

      if (updateError) {
        console.error('[API] Failed to increment view count:', updateError)
        return NextResponse.json(
          { error: 'Failed to update view count' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true,
        view_count: (product.view_count || 0) + 1
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error tracking product view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
