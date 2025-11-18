/**
 * Test endpoint to verify products API is working
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET() {
  try {
    // Test direct database query
    const { data: products, error, count } = await supabase
      .from('products')
      .select('id, name, price, is_active', { count: 'exact' })
      .eq('is_active', true)
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Direct database query successful',
      data: {
        total_count: count,
        sample_products: products,
        database_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        service_role: process.env.SUPABASE_SERVICE_ROLE ? 'configured' : 'missing'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
