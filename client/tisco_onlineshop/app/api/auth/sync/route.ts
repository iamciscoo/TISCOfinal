import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    switch (action) {
      case 'sync_profile':
        // Sync Clerk user data to Supabase users table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id, clerk_id')
          .eq('clerk_id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        if (!existingUser) {
          // Create new user record
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              clerk_id: user.id,
              email: user.emailAddresses[0]?.emailAddress,
              first_name: user.firstName,
              last_name: user.lastName,
              phone: user.phoneNumbers[0]?.phoneNumber,
              avatar_url: user.imageUrl,
              email_verified: user.emailAddresses[0]?.verification?.status === 'verified',
              phone_verified: user.phoneNumbers[0]?.verification?.status === 'verified'
            })
            .select()
            .single()

          if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 })
          }

          return NextResponse.json({ 
            message: 'User profile created',
            user: newUser 
          }, { status: 201 })
        } else {
          // Update existing user record
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              email: user.emailAddresses[0]?.emailAddress,
              first_name: user.firstName,
              last_name: user.lastName,
              phone: user.phoneNumbers[0]?.phoneNumber,
              avatar_url: user.imageUrl,
              email_verified: user.emailAddresses[0]?.verification?.status === 'verified',
              phone_verified: user.phoneNumbers[0]?.verification?.status === 'verified',
              updated_at: new Date().toISOString()
            })
            .eq('clerk_id', user.id)
            .select()
            .single()

          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
          }

          return NextResponse.json({ 
            message: 'User profile updated',
            user: updatedUser 
          }, { status: 200 })
        }

      case 'merge_guest_data':
        // Merge guest cart and other data when user logs in
        const { guest_cart_items } = await req.json()

        if (guest_cart_items && guest_cart_items.length > 0) {
          // Use the existing guest cart conversion API
          const conversionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              guest_cart_items,
              user_id: user.id
            })
          })

          if (!conversionResponse.ok) {
            return NextResponse.json({ 
              error: 'Failed to merge guest cart' 
            }, { status: 500 })
          }

          const conversionResult = await conversionResponse.json()
          
          return NextResponse.json({ 
            message: 'Guest data merged successfully',
            cart_conversion: conversionResult
          }, { status: 200 })
        }

        return NextResponse.json({ 
          message: 'No guest data to merge' 
        }, { status: 200 })

      case 'cleanup_session':
        // Clean up any orphaned session data
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', user.id)
          .lt('expires_at', new Date().toISOString())

        return NextResponse.json({ 
          message: 'Session cleanup completed' 
        }, { status: 200 })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

  } catch (error: unknown) {
    console.error('Auth sync error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to sync authentication' },
      { status: 500 }
    )
  }
}
