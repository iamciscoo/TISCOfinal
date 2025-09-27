import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient, type PostgrestError } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    
    // Use service role client server-side to safely expose minimal user fields
    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    )

    const buildQuery = (withApprovalFilter: boolean) => {
      let q = service
        .from('reviews')
        .select(`
          *,
          users(first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
      if (productId) q = q.eq('product_id', productId)
      if (withApprovalFilter) q = q.eq('is_approved', true)
      return q
    }

    // Try with approval filter first; if the column doesn't exist, fallback without it
    const first = await buildQuery(true)
    let data = first.data
    let error: PostgrestError | null = first.error

    if (error) {
      const code = error.code || error.details
      const msg = error.message || ''
      const isUndefinedColumn = code === '42703' || (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('is_approved'))

      if (isUndefinedColumn) {
        const second = await buildQuery(false)
        data = second.data
        error = second.error
      }
    }

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews: data || [] })
  } catch (error) {
    console.error('Error in reviews GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, rating, title, comment } = body

    // Validate required fields
    if (!product_id || !rating) {
      return NextResponse.json({ error: 'Product ID and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Use service role client to bypass RLS (Supabase is our auth source)
    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    )

    // Ensure user exists in users table to satisfy FK constraint
    const userEmail = user.email || ''
    const userFirstName = user.user_metadata?.first_name || ''
    const userLastName = user.user_metadata?.last_name || ''
    const userPhone = user.user_metadata?.phone || null
    const userAvatar = user.user_metadata?.avatar_url || ''

    // Migration safety: if a legacy users row exists without auth_user_id, set it now
    await service
      .from('users')
      .update({ auth_user_id: user.id })
      .eq('id', user.id)
      .is('auth_user_id', null)

    const { error: upsertErr } = await service
      .from('users')
      .upsert(
        {
          id: user.id,
          auth_user_id: user.id,
          email: userEmail,
          first_name: userFirstName,
          last_name: userLastName,
          phone: userPhone,
          avatar_url: userAvatar,
        },
        { onConflict: 'id' }
      )

    if (upsertErr) {
      console.error('Error ensuring user profile exists:', upsertErr)
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    // Check if user already reviewed this product
    const { data: existingReview } = await service
      .from('reviews')
      .select('id')
      .eq('product_id', product_id)
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 })
    }

    // Create the review
    const { data, error } = await service
      .from('reviews')
      .insert({
        product_id,
        user_id: user.id,
        rating,
        title: title || null,
        comment: comment || null,
        is_verified_purchase: false // Could be enhanced to check if user actually bought the product
      })
      .select(`
        *,
        user:users(first_name, last_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update product rating and review count
    await updateProductRating(product_id, service)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in reviews POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateProductRating(productId: string, db: SupabaseClient = supabase) {
  try {
    // Get all reviews for this product
    const { data: reviews } = await db
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
    const count = reviews?.length ?? 0

    // Update aggregates: if no reviews, store NULLs (not zeros)
    if (count === 0) {
      await db
        .from('products')
        .update({
          rating: null,
          reviews_count: null,
        })
        .eq('id', productId)
    } else {
      const averageRating = reviews!.reduce((sum, review) => sum + review.rating, 0) / count
      await db
        .from('products')
        .update({
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviews_count: count,
        })
        .eq('id', productId)
    }
  } catch (error) {
    console.error('Error updating product rating:', error)
  }
}
