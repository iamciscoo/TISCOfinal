import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ addresses: addresses || [] }, { status: 200 })
  } catch (error: unknown) {
    console.error('Addresses fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addressData = await req.json()
    const { 
      type, 
      first_name, 
      last_name, 
      company, 
      address_line_1, 
      address_line_2, 
      city, 
      state, 
      postal_code, 
      country, 
      phone,
      is_default 
    } = addressData

    if (!address_line_1 || !city || !postal_code || !country) {
      return NextResponse.json({ 
        error: 'Missing required fields: address_line_1, city, postal_code, country' 
      }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const { data: address, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        type: type || 'shipping',
        first_name,
        last_name,
        company,
        address_line_1,
        address_line_2,
        city,
        state,
        postal_code,
        country,
        phone,
        is_default: is_default || false
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ address }, { status: 201 })
  } catch (error: unknown) {
    console.error('Address creation error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create address' },
      { status: 500 }
    )
  }
}
