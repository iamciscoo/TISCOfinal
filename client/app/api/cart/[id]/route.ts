import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { quantity } = await req.json()

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    // Check if cart item exists and belongs to user
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    // Check stock availability
    if (cartItem.product.stock_quantity < quantity) {
      return NextResponse.json({ 
        error: 'Insufficient stock available',
        available_stock: cartItem.product.stock_quantity
      }, { status: 400 })
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
        *,
        product:products(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: updatedItem }, { status: 200 })
  } catch (error: unknown) {
    console.error('Cart item update error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership and delete
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Item removed from cart' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Cart item deletion error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}
