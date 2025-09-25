import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

// PUT - Update admin recipient
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recipientId = params.id
    const body = await req.json()
    const { email, name, role, department, notification_categories, is_active } = body

    const updateData: Record<string, string | boolean | string[]> = {}
    if (email !== undefined) updateData.email = email
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (department !== undefined) updateData.department = department
    if (notification_categories !== undefined) updateData.notification_categories = notification_categories
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: recipient, error } = await supabase
      .from('admin_recipients')
      .update(updateData)
      .eq('id', recipientId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        )
      }
      console.error('Failed to update admin recipient:', error)
      return NextResponse.json(
        { error: 'Failed to update admin recipient' },
        { status: 500 }
      )
    }

    if (!recipient) {
      return NextResponse.json(
        { error: 'Admin recipient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      recipient 
    })
  } catch (error) {
    console.error('Failed to update admin recipient:', error)
    return NextResponse.json(
      { error: 'Failed to update admin recipient' },
      { status: 500 }
    )
  }
}

// DELETE - Remove admin recipient
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recipientId = params.id

    // Check if recipient exists
    const { data: existing } = await supabase
      .from('admin_recipients')
      .select('id')
      .eq('id', recipientId)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Admin recipient not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('admin_recipients')
      .delete()
      .eq('id', recipientId)

    if (error) {
      console.error('Failed to delete admin recipient:', error)
      return NextResponse.json(
        { error: 'Failed to delete admin recipient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin recipient deleted successfully' 
    })
  } catch (error) {
    console.error('Failed to delete admin recipient:', error)
    return NextResponse.json(
      { error: 'Failed to delete admin recipient' },
      { status: 500 }
    )
  }
}

// GET - Get single admin recipient
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recipientId = params.id

    const { data: recipient, error } = await supabase
      .from('admin_recipients')
      .select('*')
      .eq('id', recipientId)
      .single()

    if (error || !recipient) {
      return NextResponse.json(
        { error: 'Admin recipient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      recipient 
    })
  } catch (error) {
    console.error('Failed to fetch admin recipient:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin recipient' },
      { status: 500 }
    )
  }
}
