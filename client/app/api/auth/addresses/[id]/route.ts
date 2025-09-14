import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data: address, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    return NextResponse.json({ address }, { status: 200 })
  } catch (error: unknown) {
    console.error('Address fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch address' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const updates = await req.json()

    // Verify ownership
    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (updates.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id)
    }

    const { data: address, error } = await supabase
      .from('addresses')
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

    return NextResponse.json({ address }, { status: 200 })
  } catch (error: unknown) {
    console.error('Address update error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update address' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Verify ownership before deletion
    const { data: existingAddress, error: fetchError } = await supabase
      .from('addresses')
      .select('id, is_default')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If we deleted the default address, set another one as default
    if (existingAddress.is_default) {
      const { data: remainingAddresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (remainingAddresses && remainingAddresses.length > 0) {
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', remainingAddresses[0].id)
      }
    }

    return NextResponse.json({ message: 'Address deleted successfully' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Address deletion error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete address' },
      { status: 500 }
    )
  }
}
