import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('[DEBUG] Environment check...')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE
    
    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasServiceRole: !!serviceRole,
        env: process.env.NODE_ENV
      }, { status: 500 })
    }

    console.log('[DEBUG] Creating Supabase client...')
    const supabase = createClient(supabaseUrl, serviceRole)
    
    console.log('[DEBUG] Fetching products from database...')
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity')
      .limit(5)
    
    if (error) {
      console.error('[DEBUG] Database error:', error)
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log(`[DEBUG] Successfully fetched ${products?.length || 0} products`)
    
    return NextResponse.json({
      success: true,
      productCount: products?.length || 0,
      products: products,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasUrl: !!supabaseUrl,
        hasServiceRole: !!serviceRole,
        urlPrefix: supabaseUrl?.substring(0, 20) + '...'
      }
    })
  } catch (error) {
    console.error('[DEBUG] Critical error:', error)
    return NextResponse.json({
      error: 'Critical error in debug endpoint',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
