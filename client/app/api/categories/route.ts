import { createClient } from '@supabase/supabase-js'
import { withMiddleware, withErrorHandler, createSuccessResponse } from '@/lib/middleware'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// GET /api/categories
export const GET = withMiddleware(
  withErrorHandler
)(async () => {
  // **CACHING DISABLED FOR REAL-TIME UPDATES**
  console.log('🔄 Fetching fresh categories (caching disabled for real-time updates)')
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error

  const response = Response.json(createSuccessResponse(data))
  
  // Set no-cache headers to ensure fresh data always
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('CDN-Cache-Control', 'no-cache')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
})
