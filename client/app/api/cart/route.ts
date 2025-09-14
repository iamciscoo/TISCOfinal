import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils'
import { getDealPricing } from '@/lib/shared-utils'

export const runtime = 'nodejs'

// Helper function to get authenticated user from request headers
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: new Error('No authorization header') }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  return { user, error }
}

// Helper function to get service role Supabase client
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  )
}

// GET /api/cart - Fetch user's cart items
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
      return createErrorResponse('Authentication required', 401, 'UNAUTHORIZED')
    }

    const supabase = getServiceSupabase()
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        created_at,
        updated_at,
        products (
          id,
          name,
          price,
          image_url,
          stock_quantity,
          is_deal,
          deal_price,
          original_price,
          product_images (
            url,
            is_main,
            sort_order
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Cart fetch error:', error)
      return createErrorResponse('Failed to fetch cart', 500, 'DATABASE_ERROR', error)
    }

    // Calculate totals using deal pricing logic
    const items = cartItems || []
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = items.reduce((sum, item) => {
      const product = item.products
      if (!product) return sum
      
      const { currentPrice } = getDealPricing(product as any)
      return sum + (currentPrice * item.quantity)
    }, 0)

    return createSuccessResponse({
      items,
      totalItems,
      totalAmount,
      currency: 'TZS'
    })

  } catch (error) {
    console.error('Cart GET error:', error)
    return createErrorResponse('Internal server error', 500, 'UNEXPECTED_ERROR', error)
  }
}

const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1).max(99)
})

const updateCartSchema = z.object({
  cart_item_id: z.string().uuid(),
  quantity: z.number().min(1).max(99)
})

// POST /api/cart - Add item to cart
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req)
    if (authError || !user) {
      return createErrorResponse('Authentication required', 401, 'UNAUTHORIZED')
    }

    const body = await req.json()
    const validatedData = addToCartSchema.parse(body)
    const { product_id, quantity } = validatedData

    const supabase = getServiceSupabase()

    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return createErrorResponse('Product not found', 404, 'NOT_FOUND')
    }

    if (product.stock_quantity < quantity) {
      return createErrorResponse('Insufficient stock', 400, 'VALIDATION_ERROR')
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single()

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.stock_quantity) {
        return createErrorResponse('Total quantity exceeds stock', 400, 'VALIDATION_ERROR')
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select('id, product_id, quantity')
        .single()

      if (updateError) {
        return createErrorResponse('Failed to update cart item', 500, 'DATABASE_ERROR', updateError)
      }

      return createSuccessResponse({ item: updatedItem })
    } else {
      // Add new item
      const { data: insertedItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id,
          quantity
        })
        .select('id, product_id, quantity')
        .single()

      if (insertError) {
        return createErrorResponse('Failed to add item to cart', 500, 'DATABASE_ERROR', insertError)
      }

      return createSuccessResponse({ item: insertedItem })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', 400, 'VALIDATION_ERROR', error.issues)
    }

    console.error('Cart POST error:', error)
    return createErrorResponse('Internal server error', 500, 'UNEXPECTED_ERROR', error)
  }
}

// PATCH /api/cart - Update cart item quantity
export async function PATCH(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req)
    if (authError || !user) {
      return createErrorResponse('Authentication required', 401, 'UNAUTHORIZED')
    }

    const body = await req.json()
    const validatedData = updateCartSchema.parse(body)
    const { cart_item_id, quantity } = validatedData

    const supabase = getServiceSupabase()

    // Get cart item and verify ownership
    const { data: cartItem, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        products (
          stock_quantity
        )
      `)
      .eq('id', cart_item_id)
      .eq('user_id', user.id)
      .single()

    if (cartError || !cartItem) {
      return createErrorResponse('Cart item not found', 404, 'NOT_FOUND')
    }

    // Check stock availability
    if (cartItem.products && quantity > (cartItem.products as any).stock_quantity) {
      return createErrorResponse('Insufficient stock', 400, 'VALIDATION_ERROR')
    }

    // Update quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cart_item_id)
      .select('id, product_id, quantity')
      .single()

    if (updateError) {
      return createErrorResponse('Failed to update cart item', 500, 'DATABASE_ERROR', updateError)
    }

    return createSuccessResponse({ item: updatedItem })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation failed', 400, 'VALIDATION_ERROR', error.issues)
    }

    console.error('Cart PATCH error:', error)
    return createErrorResponse('Internal server error', 500, 'UNEXPECTED_ERROR', error)
  }
}

// DELETE /api/cart - Clear entire cart or remove specific item
export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req)
    if (authError || !user) {
      return createErrorResponse('Authentication required', 401, 'UNAUTHORIZED')
    }

    const supabase = getServiceSupabase()
    const url = new URL(req.url)
    const cartItemId = url.searchParams.get('cart_item_id')

    if (cartItemId) {
      // Remove specific item
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('user_id', user.id)

      if (error) {
        return createErrorResponse('Failed to remove cart item', 500, 'DATABASE_ERROR', error)
      }

      return createSuccessResponse({ message: 'Cart item removed successfully' })
    } else {
      // Clear entire cart
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        return createErrorResponse('Failed to clear cart', 500, 'DATABASE_ERROR', error)
      }

      return createSuccessResponse({ message: 'Cart cleared successfully' })
    }
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return createErrorResponse('Internal server error', 500, 'UNEXPECTED_ERROR', error)
  }
}
