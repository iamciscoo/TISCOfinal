import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const q = (searchParams.get('q') || '').trim()
    const status = (searchParams.get('status') || '').trim() // 'subscribed' | 'unsubscribed' | ''

    const from = (page - 1) * limit
    const to = from + limit - 1

    // First try selecting with optional status filter (depends on column existence)
    const buildQuery = (withStatus: boolean) => {
      let query = supabase
        .from('newsletter_subscriptions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (q) {
        // search by email or source
        query = query.or(`email.ilike.%${q}%,source.ilike.%${q}%`)
      }
      // Skip status filter for now since column may not exist
      // if (withStatus && status) {
      //   const isSub = status === 'subscribed'
      //   query = query.eq('is_subscribed', isSub)
      // }
      return query.range(from, to)
    }

    let { data, error, count } = await buildQuery(true)
    if (error) {
      const code = (error as any).code || ''
      const msg = (error as any).message || ''
      const isUndefinedColumn = code === '42703' || (msg.toLowerCase().includes('column') && msg.toLowerCase().includes('is_subscribed'))
      if (isUndefinedColumn) {
        // Retry without status filter for legacy schemas
        const res = await buildQuery(false)
        data = res.data
        error = res.error
        count = res.count
      }
    }

    if (error) {
      return createErrorResponse(error.message || 'Failed to load subscribers', 500, 'DATABASE_ERROR', error)
    }

    return createSuccessResponse({
      subscribers: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return createErrorResponse(message, 500, 'UNEXPECTED_ERROR', e)
  }
}
