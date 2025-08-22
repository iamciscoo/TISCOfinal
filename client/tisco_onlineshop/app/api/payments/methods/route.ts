import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      payment_methods: paymentMethods || [],
      available_methods: [
        { type: 'card', name: 'Credit/Debit Card', icon: 'credit-card' },
        { type: 'mobile_money', name: 'Mobile Money', icon: 'smartphone' },
        { type: 'bank_transfer', name: 'Bank Transfer', icon: 'building' },
        { type: 'cash_on_delivery', name: 'Cash on Delivery', icon: 'banknote' }
      ]
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Payment methods fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const methodData = await req.json()
    const { 
      type, 
      provider, 
      account_number, 
      account_name, 
      expiry_month, 
      expiry_year, 
      last_four_digits,
      is_default 
    } = methodData

    if (!type || !provider) {
      return NextResponse.json({ 
        error: 'Type and provider are required' 
      }, { status: 400 })
    }

    // Validate based on payment type
    if (type === 'card' && (!last_four_digits || !expiry_month || !expiry_year)) {
      return NextResponse.json({ 
        error: 'Card details incomplete' 
      }, { status: 400 })
    }

    if ((type === 'mobile_money' || type === 'bank_transfer') && !account_number) {
      return NextResponse.json({ 
        error: 'Account number required' 
      }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const { data: paymentMethod, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        type,
        provider,
        account_number: account_number || null,
        account_name: account_name || null,
        expiry_month: expiry_month || null,
        expiry_year: expiry_year || null,
        last_four_digits: last_four_digits || null,
        is_default: is_default || false,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ payment_method: paymentMethod }, { status: 201 })

  } catch (error: unknown) {
    console.error('Payment method creation error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create payment method' },
      { status: 500 }
    )
  }
}
