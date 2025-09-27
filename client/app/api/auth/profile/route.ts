import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        *,
        addresses(*),
        orders(id, status, total_amount, created_at)
      `)
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Extract user information from Supabase for profile sync
    const userEmail = user.email || ''
    const userPhone = user.user_metadata?.phone || null

    if (!profile) {
      // Normalize names from social metadata
      const meta = user.user_metadata || {}
      const fullName: string = meta.full_name || meta.name || ''
      const given: string = meta.given_name || ''
      const family: string = meta.family_name || ''
      let firstName: string = meta.first_name || given || ''
      let lastName: string = meta.last_name || family || ''
      if (!firstName && fullName) {
        const parts = fullName.trim().split(/\s+/)
        firstName = parts[0] || ''
        lastName = parts.slice(1).join(' ') || ''
      }
      const avatarUrl: string = meta.avatar_url || meta.picture || ''

      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          auth_user_id: user.id,
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          phone: userPhone,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          addresses(*),
          payment_methods(*)
        `)
        .single()

      if (createError) {
        console.error('Profile creation error:', createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      // Return the newly created profile with Supabase user data
      return NextResponse.json({
        profile: newProfile,
        auth_user: {
          id: user.id,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: userEmail,
          avatar_url: user.user_metadata?.avatar_url || '',
          phone: userPhone,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User'
        }
      }, { status: 201 })
    }

    return NextResponse.json({ 
      profile,
      auth_user: {
        id: user.id,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        email: userEmail,
        avatar_url: user.user_metadata?.avatar_url || '',
        phone: userPhone,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User'
      }
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await req.json()

    // Update user profile
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: updatedProfile }, { status: 200 })

  } catch (error: unknown) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
