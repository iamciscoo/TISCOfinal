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
    const status = (searchParams.get('status') || '').trim()

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query for newsletter subscriptions
    let query = supabase
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Add search filters
    if (q) {
      query = query.or(`email.ilike.%${q}%,source.ilike.%${q}%`)
    }

    // Add status filter if specified
    if (status === 'subscribed') {
      query = query.eq('is_subscribed', true)
    } else if (status === 'unsubscribed') {
      query = query.eq('is_subscribed', false)
    }

    // Apply pagination
    const { data, error, count } = await query.range(from, to)

    if (error) {
      console.error('Newsletter query error:', error)
      return createErrorResponse(error.message || 'Failed to load subscribers', 500, 'DATABASE_ERROR', error)
    }

    return createSuccessResponse({
      subscribers: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    })
  } catch (e) {
    console.error('Newsletter GET error:', e)
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return createErrorResponse(message, 500, 'UNEXPECTED_ERROR', e)
  }
}
