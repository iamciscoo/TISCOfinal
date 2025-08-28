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

    // If no profile exists, create one
    if (!profile) {
      const isVerified = (
        user.emailAddresses?.some((e) => e?.verification?.status === 'verified') ||
        user.phoneNumbers?.some((p) => p?.verification?.status === 'verified')
      ) ?? false

      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          phone: user.phoneNumbers[0]?.phoneNumber,
          avatar_url: user.imageUrl,
          is_verified: isVerified
        })
        .select(`
          *,
          addresses(*),
          orders(id, status, total_amount, created_at)
        `)
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        user: newProfile,
        clerk_user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddresses: user.emailAddresses,
          imageUrl: user.imageUrl
        }
      }, { status: 201 })
    }

    return NextResponse.json({ 
      user: profile,
      clerk_user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddresses: user.emailAddresses,
        imageUrl: user.imageUrl
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
    const user = await currentUser()
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
