import 'server-only'
import { supabase } from '@/lib/supabase'

// Recalculate and persist product rating and reviews_count aggregates.
// If the 'is_approved' column exists, only include approved reviews to
// match client display logic; otherwise include all reviews.
export async function updateProductRating(productId: string | number) {
  try {
    // Detect if approval column exists
    let hasIsApproved = true
    {
      const { error: colErr } = await supabase
        .from('reviews')
        .select('is_approved')
        .limit(1)
      if (colErr) hasIsApproved = false
    }

    // Fetch ratings for this product
    let query = supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)

    if (hasIsApproved) {
      query = query.eq('is_approved', true)
    }

    const { data: reviews, error } = await query
    if (error) {
      console.error('updateProductRating: failed to fetch reviews', error)
      return
    }

    const count = reviews?.length ?? 0

    if (count === 0) {
      await supabase
        .from('products')
        .update({ rating: null, reviews_count: null })
        .eq('id', productId)
      return
    }

    const sum = reviews!.reduce((acc, r: any) => acc + (r?.rating ?? 0), 0)
    const avg = Math.round((sum / count) * 10) / 10

    const { error: updateError } = await supabase
      .from('products')
      .update({ rating: avg, reviews_count: count })
      .eq('id', productId)
    
    if (updateError) {
      console.error('updateProductRating: failed to update product', updateError)
    }
  } catch (e) {
    console.error('updateProductRating: unexpected error', e)
  }
}
