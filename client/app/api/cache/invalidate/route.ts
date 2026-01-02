import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { cache } from '@/lib/cache'

export const runtime = 'nodejs'

/**
 * Cache Invalidation API Endpoint
 * 
 * This endpoint allows the admin application to invalidate both:
 * 1. Next.js server-side cache tags (revalidateTag)
 * 2. Client-side in-memory cache (used by homepage components)
 * 
 * Usage: POST /api/cache/invalidate
 * Body: { tags: string[], cacheKeys?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    // Validate request
    const body = await req.json().catch(() => ({}))
    const { tags, cacheKeys, source } = body

    console.log(`🔄 Cache invalidation requested by ${source || 'unknown'}:`)
    console.log(`  - Server tags:`, tags)
    console.log(`  - Client cache keys:`, cacheKeys)

    const results: Array<{ type: 'server-tag' | 'client-cache'; key: string; status: 'success' | 'error'; error?: string }> = []

    // 1. Invalidate Next.js server-side cache tags
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        try {
          revalidateTag(tag, 'default')
          results.push({ type: 'server-tag', key: tag, status: 'success' })
          console.log(`✅ Server cache tag invalidated: ${tag}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.push({ type: 'server-tag', key: tag, status: 'error', error: errorMessage })
          console.error(`❌ Failed to invalidate server cache tag: ${tag}`, error)
        }
      }
    }

    // 2. Invalidate client-side in-memory cache
    if (cacheKeys && Array.isArray(cacheKeys)) {
      for (const cacheKey of cacheKeys) {
        try {
          cache.delete(cacheKey)
          results.push({ type: 'client-cache', key: cacheKey, status: 'success' })
          console.log(`✅ Client cache key invalidated: ${cacheKey}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.push({ type: 'client-cache', key: cacheKey, status: 'error', error: errorMessage })
          console.error(`❌ Failed to invalidate client cache key: ${cacheKey}`, error)
        }
      }
    }

    // 3. Auto-invalidate related client cache based on common patterns
    try {
      if (tags?.includes('products') || tags?.includes('featured-products')) {
        console.log('🔄 Auto-invalidating client-side product caches')

        // Clear all product-related client caches
        cache.delete('products:all')
        cache.delete('products:9')
        cache.delete('products:20')
        cache.delete('featured:all')
        cache.delete('featured:9')
        cache.delete('featured:6')

        results.push({ type: 'client-cache', key: 'auto:products:*', status: 'success' })
        console.log('✅ Auto-invalidated client product caches')
      }
    } catch (error) {
      console.error('❌ Failed auto-invalidation:', error)
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    console.log(`🎉 Cache invalidation completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Invalidated ${successCount}/${results.length} cache entries`,
      results,
      serverCacheCleared: tags?.length || 0,
      clientCacheCleared: (cacheKeys?.length || 0) + (tags?.includes('products') || tags?.includes('featured-products') ? 6 : 0),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Cache invalidation API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during cache invalidation',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for health check and available tags info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cache/invalidate',
    method: 'POST',
    description: 'Invalidate cache tags for real-time synchronization',
    usage: {
      body: {
        tags: ['products', 'featured-products', 'category:uuid', 'product:uuid'],
        source: 'admin-app (optional)'
      }
    },
    availableTags: [
      'products - Main products listing',
      'featured-products - Featured products listing',
      'category:${id} - Category-specific products',
      'product:${id} - Individual product pages',
      'homepage - Homepage cached content',
      'deals - Deals page content'
    ]
  })
}
