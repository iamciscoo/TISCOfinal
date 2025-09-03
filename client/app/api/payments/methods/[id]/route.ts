import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: paymentMethod, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    return NextResponse.json({ payment_method: paymentMethod }, { status: 200 })
  } catch (error: unknown) {
    console.error('Payment method fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch payment method' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()

    // Verify ownership
    const { data: existingMethod, error: fetchError } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (updates.is_default) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id)
    }

    const { data: paymentMethod, error } = await supabase
      .from('payment_methods')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ payment_method: paymentMethod }, { status: 200 })
  } catch (error: unknown) {
    console.error('Payment method update error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update payment method' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership before deletion
    const { data: existingMethod, error: fetchError } = await supabase
      .from('payment_methods')
      .select('id, is_default')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If we deleted the default method, set another one as default
    if (existingMethod.is_default) {
      const { data: remainingMethods } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      if (remainingMethods && remainingMethods.length > 0) {
        await supabase
          .from('payment_methods')
          .update({ is_default: true })
          .eq('id', remainingMethods[0].id)
      }
    }

    return NextResponse.json({ message: 'Payment method deleted successfully' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Payment method deletion error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}
