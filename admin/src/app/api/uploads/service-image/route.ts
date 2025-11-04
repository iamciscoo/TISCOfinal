import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Upload a service main image to Supabase Storage and return a public URL
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

    if (!supabaseUrl || !supabaseServiceRole) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials on server (SUPABASE_URL and SUPABASE_SERVICE_ROLE)' },
        { status: 500 }
      )
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type?.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole)

    // Generate a unique storage key
    const ext = file.name?.split('.').pop() || file.type.split('/')[1] || 'jpg'
    const key = `services/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`

    // Upload to public bucket `service-images`
    const { error: uploadError } = await supabase.storage
      .from('service-images')
      .upload(key, file, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = supabase.storage.from('service-images').getPublicUrl(key)
    if (!data?.publicUrl) {
      return NextResponse.json({ error: 'Failed to generate public URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.publicUrl }, { status: 200 })
  } catch (err) {
    const message = (err as Error)?.message || 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
