import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase-server'

interface UserPreferenceUpdates {
  preferred_categories?: string[]
  muted_categories?: string[]
  followed_brands?: string[]
  blocked_brands?: string[]
  default_sort_order?: string
  show_deals_only?: boolean
  max_price_filter?: number | null
  recently_viewed_products?: string[]
  preferences_updated_at?: string
}

/**
 * GET user preferences
 */
export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select(`
        preferred_categories,
        muted_categories,
        followed_brands,
        blocked_brands,
        default_sort_order,
        show_deals_only,
        max_price_filter,
        recently_viewed_products,
        preferences_updated_at
      `)
      .eq('id', user.id)
      .single()

    if (dbError) {
      console.error('Error fetching preferences:', dbError)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({
      preferences: userData || {
        preferred_categories: [],
        muted_categories: [],
        followed_brands: [],
        blocked_brands: [],
        default_sort_order: 'newest',
        show_deals_only: false,
        max_price_filter: null,
        recently_viewed_products: [],
        preferences_updated_at: null
      }
    })
  } catch (error) {
    console.error('Preferences GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT update user preferences
 */
export async function PUT(request: Request) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createClient()
    
    // Validate and sanitize input
    const updates: UserPreferenceUpdates = {
      preferences_updated_at: new Date().toISOString()
    }

    if (body.preferred_categories !== undefined) {
      updates.preferred_categories = Array.isArray(body.preferred_categories) 
        ? body.preferred_categories.slice(0, 20) 
        : []
    }

    if (body.muted_categories !== undefined) {
      updates.muted_categories = Array.isArray(body.muted_categories) 
        ? body.muted_categories.slice(0, 20) 
        : []
    }

    if (body.followed_brands !== undefined) {
      updates.followed_brands = Array.isArray(body.followed_brands) 
        ? body.followed_brands.slice(0, 50) 
        : []
    }

    if (body.blocked_brands !== undefined) {
      updates.blocked_brands = Array.isArray(body.blocked_brands) 
        ? body.blocked_brands.slice(0, 50) 
        : []
    }

    if (body.default_sort_order !== undefined) {
      const validSorts = ['newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular', 'featured']
      updates.default_sort_order = validSorts.includes(body.default_sort_order) 
        ? body.default_sort_order 
        : 'newest'
    }

    if (body.show_deals_only !== undefined) {
      updates.show_deals_only = Boolean(body.show_deals_only)
    }

    if (body.max_price_filter !== undefined) {
      updates.max_price_filter = body.max_price_filter === null 
        ? null 
        : Math.max(0, Number(body.max_price_filter))
    }

    if (body.recently_viewed_products !== undefined) {
      updates.recently_viewed_products = Array.isArray(body.recently_viewed_products) 
        ? body.recently_viewed_products.slice(0, 50) 
        : []
    }

    const { data, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating preferences:', updateError)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      preferences: data 
    })
  } catch (error) {
    console.error('Preferences PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
