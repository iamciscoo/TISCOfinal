import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/middleware'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// GET /api/cart
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = async (_req: NextRequest) => {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.AUTHENTICATION_ERROR, 'Authentication required'),
        { status: 401 }
      )
    }

    // Fetch cart items with product details and images
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          image_url,
          product_images (
            url,
            is_main
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.DATABASE_ERROR, 'Failed to fetch cart items'),
        { status: 500 }
      )
    }

    return NextResponse.json(createSuccessResponse({ items: cartItems || [] }))
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json(
      createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'),
      { status: 500 }
    )
  }
}

const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1).max(99)
})

// POST /api/cart
export const POST = async (req: NextRequest) => {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validatedData = addToCartSchema.parse(body)
    
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.AUTHENTICATION_ERROR, 'Authentication required'),
        { status: 401 }
      )
    }

    const { product_id, quantity } = validatedData

    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.NOT_FOUND, 'Product not found'),
        { status: 404 }
      )
    }

    if (product.stock_quantity < quantity) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.VALIDATION_ERROR, 'Insufficient stock'),
        { status: 400 }
      )
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .single()

    if (existingItem) {
      // Update existing item and return the updated row
      const newQuantity = existingItem.quantity + quantity
      if (newQuantity > product.stock_quantity) {
        return NextResponse.json(
          createErrorResponse(API_ERROR_CODES.VALIDATION_ERROR, 'Total quantity exceeds stock'),
          { status: 400 }
        )
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select('id, product_id, quantity')
        .single()

      if (updateError) {
        return NextResponse.json(
          createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to update cart item'),
          { status: 500 }
        )
      }

      return NextResponse.json(createSuccessResponse({ item: updatedItem }))
    } else {
      // Add new item and return the inserted row
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
        return NextResponse.json(
          createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to add item to cart'),
          { status: 500 }
        )
      }

      return NextResponse.json(createSuccessResponse({ item: insertedItem }))
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.VALIDATION_ERROR, 'Validation failed', error.issues),
        { status: 400 }
      )
    }

    console.error('Cart POST error:', error)
    return NextResponse.json(
      createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'),
      { status: 500 }
    )
  }
}

// DELETE /api/cart
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DELETE = async (_req: NextRequest) => {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.AUTHENTICATION_ERROR, 'Authentication required'),
        { status: 401 }
      )
    }

    // Clear all cart items for the user
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.DATABASE_ERROR, 'Failed to clear cart'),
        { status: 500 }
      )
    }

    return NextResponse.json(createSuccessResponse({ message: 'Cart cleared successfully' }))
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json(
      createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'),
      { status: 500 }
    )
  }
}
