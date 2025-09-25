import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', userId)
    .single()
  
  return data?.role === 'admin'
}

// GET - List all admin recipients
export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const activeOnly = url.searchParams.get('active') === 'true'

    const query = supabase
      .from('admin_recipients')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query.eq('is_active', true)
    }

    const { data: recipients, error } = await query

    if (error) {
      console.error('Failed to fetch admin recipients:', error)
      return NextResponse.json(
        { error: 'Failed to fetch admin recipients' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      recipients: recipients || [] 
    })
  } catch (error) {
    console.error('Failed to fetch admin recipients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin recipients' },
      { status: 500 }
    )
  }
}

// POST - Add new admin recipient
export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, name, role, department, notification_categories } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name' },
        { status: 400 }
      )
    }

    // Get the current user's ID for created_by
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    const { data: recipient, error } = await supabase
      .from('admin_recipients')
      .insert({
        email,
        name,
        role: role || 'admin',
        department,
        notification_categories: notification_categories || ['all'],
        created_by: currentUser?.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        )
      }
      console.error('Failed to create admin recipient:', error)
      return NextResponse.json(
        { error: 'Failed to create admin recipient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      recipient 
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create admin recipient:', error)
    return NextResponse.json(
      { error: 'Failed to create admin recipient' },
      { status: 500 }
    )
  }
}
