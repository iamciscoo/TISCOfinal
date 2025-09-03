import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/middleware'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.AUTHENTICATION_ERROR, 'Authentication required'),
        { status: 401 }
      )
    }

    const { quantity } = await req.json()

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.VALIDATION_ERROR, 'Invalid quantity'),
        { status: 400 }
      )
    }

    // Check if cart item exists and belongs to user
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          stock_quantity,
          image_url
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !cartItem) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.NOT_FOUND, 'Cart item not found'),
        { status: 404 }
      )
    }

    // Check stock availability  
    const product = Array.isArray(cartItem.products) ? cartItem.products[0] : cartItem.products
    if (product?.stock_quantity < quantity) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.VALIDATION_ERROR, 'Insufficient stock available'),
        { status: 400 }
      )
    }

    // Update cart item quantity
    const { data: updatedItem, error } = await supabase
      .from('cart_items')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        id,
        product_id,
        quantity
      `)
      .single()

    if (error) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to update cart item'),
        { status: 500 }
      )
    }

    return NextResponse.json(createSuccessResponse(updatedItem))
  } catch (error: unknown) {
    console.error('Cart item update error:', error)
    return NextResponse.json(
      createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'),
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.AUTHENTICATION_ERROR, 'Authentication required'),
        { status: 401 }
      )
    }

    // Verify ownership and delete
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to remove cart item'),
        { status: 500 }
      )
    }

    return NextResponse.json(createSuccessResponse({ message: 'Item removed from cart' }))
  } catch (error: unknown) {
    console.error('Cart item deletion error:', error)
    return NextResponse.json(
      createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'),
      { status: 500 }
    )
  }
}
