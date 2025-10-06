import { NextRequest, NextResponse } from 'next/server'

// Lazy Supabase client creator (copied pattern from notifications route)
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function DELETE(req: NextRequest) {
  try {
    const sb = await getSupabase()
    if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await sb.from('notification_recipients').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to remove recipient' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sb = await getSupabase()
    if (!sb) return NextResponse.json({ recipients: [] })

    const { data, error } = await sb
      .from('notification_recipients')
      .select('id, email, name, is_active, department, notification_categories, assigned_product_ids, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      // If table missing or any other error, return empty list gracefully
      return NextResponse.json({ recipients: [] }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
    }

    return NextResponse.json({ recipients: data || [] }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (e: any) {
    return NextResponse.json({ recipients: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = await getSupabase()
    if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const name = (body?.name as string | undefined)?.trim() || null
    const departmentInput = (body?.department as string | undefined)?.trim()
    const department = departmentInput === 'none' || !departmentInput ? null : departmentInput
    const categoriesInput = body?.notification_categories
    const notification_categories: string[] = Array.isArray(categoriesInput)
      ? categoriesInput.map((c: string) => String(c).trim()).filter(Boolean)
      : typeof categoriesInput === 'string'
        ? String(categoriesInput).split(',').map((c) => c.trim()).filter(Boolean)
        : ['all']
    
    // Enhanced product filtering with validation and deduplication
    const productIdsInput = body?.assigned_product_ids
    let assigned_product_ids: string[] | null = null
    
    if (Array.isArray(productIdsInput) && productIdsInput.length > 0) {
      // Clean, validate and deduplicate product IDs
      const cleanedIds = productIdsInput
        .map((id: any) => String(id).trim())
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
      
      // Validate that product IDs exist in the database
      if (cleanedIds.length > 0) {
        const { data: existingProducts, error: productError } = await sb
          .from('products')
          .select('id')
          .in('id', cleanedIds)
        
        if (productError) {
          console.warn('Failed to validate product IDs:', productError)
          assigned_product_ids = cleanedIds // Still allow assignment even if validation fails
        } else {
          const existingIds = existingProducts?.map(p => p.id) || []
          const invalidIds = cleanedIds.filter(id => !existingIds.includes(id))
          
          if (invalidIds.length > 0) {
            console.warn('Invalid product IDs found:', invalidIds)
            // Only keep valid IDs
            assigned_product_ids = cleanedIds.filter(id => existingIds.includes(id))
          } else {
            assigned_product_ids = cleanedIds
          }
        }
      }
    }

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Upsert to notification_recipients table only
    const { data, error } = await sb
      .from('notification_recipients')
      .upsert({ email, name, is_active: true, department, notification_categories, assigned_product_ids }, { onConflict: 'email' })
      .select('id, email, name, is_active, department, notification_categories, assigned_product_ids, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ recipient: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to add recipient' }, { status: 500 })
  }
}
